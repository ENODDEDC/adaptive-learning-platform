import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import Content from '@/models/Content';
import mongoConfig from '@/config/mongoConfig';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

// Lazy load Windows packages only when needed (avoids build-time errors on Linux)
async function loadWindowsPackages() {
    if (!isWindows) return null;
    
    try {
        const util = await import('util');
        const pdf = await import('pdf-poppler');
        const libre = await import('libreoffice-convert');
        const libreConvert = util.promisify(libre.default.convert);
        console.log('✅ Windows thumbnail packages loaded');
        return { pdf: pdf.default, libreConvert };
    } catch (error) {
        console.warn('⚠️ Windows packages not available, will use system commands');
        return null;
    }
}

async function generatePdfThumbnail(filePath, outputDir, contentId) {
    const outputPath = path.join(outputDir, `${contentId}.png`);

    // Try Windows package first
    if (isWindows) {
        try {
            const packages = await loadWindowsPackages();
            if (packages && packages.pdf) {
                const opts = {
                    format: 'png',
                    out_dir: outputDir,
                    out_prefix: contentId,
                    page: 1,
                };
                const result = await packages.pdf.convert(filePath, opts);
                if (result && result.length > 0) {
                    return `/uploads/thumbnails/${path.basename(result[0])}`;
                }
            }
        } catch (error) {
            console.error('Windows pdf-poppler failed, trying system command:', error);
        }
    }

    // Try Linux system command (pdftoppm from poppler-utils)
    try {
        const command = `pdftoppm -png -f 1 -l 1 -scale-to 300 -singlefile "${filePath}" "${path.join(outputDir, contentId)}"`;
        await execAsync(command);
        await fs.access(outputPath);
        return `/uploads/thumbnails/${contentId}.png`;
    } catch (error) {
        console.error('Linux pdftoppm failed:', error);
        throw new Error('PDF thumbnail generation failed on all methods');
    }
}

async function convertToPdfAndThumbnail(filePath, outputDir, contentId) {
    const tempPdfPath = path.join(outputDir, `${contentId}_temp.pdf`);

    // Try Windows package first
    if (isWindows) {
        try {
            const packages = await loadWindowsPackages();
            if (packages && packages.libreConvert) {
                const fileBuffer = await fs.readFile(filePath);
                const pdfBuffer = await packages.libreConvert(fileBuffer, '.pdf', undefined);
                await fs.writeFile(tempPdfPath, pdfBuffer);
            }
        } catch (error) {
            console.error('Windows libreoffice-convert failed, trying system command:', error);
            // Fall through to Linux method
        }
    }

    // Try Linux system command if Windows method didn't work
    if (!await fs.access(tempPdfPath).then(() => true).catch(() => false)) {
        try {
            const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;
            await execAsync(command);

            const originalName = path.basename(filePath, path.extname(filePath));
            const createdPdfPath = path.join(outputDir, `${originalName}.pdf`);
            await fs.rename(createdPdfPath, tempPdfPath);
        } catch (error) {
            console.error('Linux soffice failed:', error);
            throw new Error('Document to PDF conversion failed on all methods');
        }
    }

    // Generate thumbnail from PDF
    const thumbnailUrl = await generatePdfThumbnail(tempPdfPath, outputDir, contentId);

    // Clean up temp PDF
    await fs.unlink(tempPdfPath).catch(() => { });

    return thumbnailUrl;
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

        if (content.mimeType === 'application/pdf') {
            thumbnailUrl = await generatePdfThumbnail(localFilePath, thumbnailsDir, contentId);
        } else if (content.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            thumbnailUrl = await convertToPdfAndThumbnail(localFilePath, thumbnailsDir, contentId);
        } else if (content.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            thumbnailUrl = await convertToPdfAndThumbnail(localFilePath, thumbnailsDir, contentId);
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
