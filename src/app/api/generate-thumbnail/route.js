import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import Content from '@/models/Content';
import mongoConfig from '@/config/mongoConfig';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

// Try to load Windows-only packages
let pdf, libre, libreConvert;
if (isWindows) {
    try {
        const util = require('util');
        pdf = require('pdf-poppler');
        libre = require('libreoffice-convert');
        libreConvert = util.promisify(libre.convert);
        console.log('✅ Windows thumbnail packages loaded');
    } catch (error) {
        console.warn('⚠️ Windows packages not available, will use system commands');
    }
}

// Generate PDF thumbnail - works on both Windows and Linux
async function generatePdfThumbnail(filePath, outputDir, contentId) {
    try {
        const outputPath = path.join(outputDir, `${contentId}.png`);
        
        if (isWindows && pdf) {
            // Windows: Use pdf-poppler package
            const opts = {
                format: 'png',
                out_dir: outputDir,
                out_prefix: contentId,
                page: 1,
            };
            const result = await pdf.convert(filePath, opts);
            if (result && result.length > 0) {
                const thumbnailFilename = path.basename(result[0]);
                return `/uploads/thumbnails/${thumbnailFilename}`;
            }
            return null;
        } else {
            // Linux: Use pdftoppm command (from poppler-utils)
            const command = `pdftoppm -png -f 1 -l 1 -scale-to 300 -singlefile "${filePath}" "${path.join(outputDir, contentId)}"`;
            await execAsync(command);
            
            // Check if file was created
            await fs.access(outputPath);
            return `/uploads/thumbnails/${contentId}.png`;
        }
    } catch (error) {
        console.error('PDF thumbnail generation error:', error);
        return null;
    }
}

// Convert DOCX/PPTX to PDF using LibreOffice, then generate thumbnail
async function convertToPdfAndThumbnail(filePath, outputDir, contentId, fileType) {
    try {
        const tempPdfPath = path.join(outputDir, `${contentId}_temp.pdf`);
        
        if (isWindows && libre) {
            // Windows: Use libreoffice-convert package
            const fileBuffer = await fs.readFile(filePath);
            const pdfBuffer = await libreConvert(fileBuffer, '.pdf', undefined);
            await fs.writeFile(tempPdfPath, pdfBuffer);
        } else {
            // Linux: Use soffice command
            const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;
            await execAsync(command);
            
            // LibreOffice creates PDF with original filename
            const originalName = path.basename(filePath, path.extname(filePath));
            const createdPdfPath = path.join(outputDir, `${originalName}.pdf`);
            
            // Rename to our temp name
            await fs.rename(createdPdfPath, tempPdfPath);
        }
        
        // Generate thumbnail from PDF
        const thumbnailUrl = await generatePdfThumbnail(tempPdfPath, outputDir, contentId);
        
        // Clean up temp PDF
        await fs.unlink(tempPdfPath).catch(() => {});
        
        return thumbnailUrl;
    } catch (error) {
        console.error(`${fileType} to PDF conversion error:`, error);
        return null;
    }
}

export async function POST(request) {
    await mongoConfig();
    try {
        const { contentId } = await request.json();

        if (!contentId) {
            return NextResponse.json({ message: 'Content ID is required' }, { status: 400 });
        }

        const content = await Content.findById(contentId);

        if (!content) {
            return NextResponse.json({ message: 'Content not found' }, { status: 404 });
        }

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
        await fs.mkdir(thumbnailsDir, { recursive: true });

        const localFilePath = path.join(process.cwd(), 'public', content.filePath);
        let thumbnailUrl;

        // Generate thumbnail based on file type
        if (content.mimeType === 'application/pdf') {
            thumbnailUrl = await generatePdfThumbnail(localFilePath, thumbnailsDir, contentId);
        } else if (content.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            thumbnailUrl = await convertToPdfAndThumbnail(localFilePath, thumbnailsDir, contentId, 'DOCX');
        } else if (content.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            thumbnailUrl = await convertToPdfAndThumbnail(localFilePath, thumbnailsDir, contentId, 'PPTX');
        } else {
            return NextResponse.json({ message: 'Thumbnail generation not supported for this file type.' }, { status: 400 });
        }

        if (!thumbnailUrl) {
            return NextResponse.json({ message: 'Failed to generate thumbnail' }, { status: 500 });
        }

        content.thumbnailUrl = thumbnailUrl;
        await content.save();

        return NextResponse.json({ thumbnailUrl });
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return NextResponse.json({ message: 'Failed to generate thumbnail', error: error.message }, { status: 500 });
    }
}