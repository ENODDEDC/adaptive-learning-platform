import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import Content from '@/models/Content';
import mongoConfig from '@/config/mongoConfig';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

// Note: Windows-specific packages (pdf-poppler, libreoffice-convert) are not installed
// to avoid Linux build errors. Use system commands instead (pdftoppm, soffice).

async function generatePdfThumbnail(filePath, outputDir, contentId) {
    const outputPath = path.join(outputDir, `${contentId}.png`);

    // Use system command (pdftoppm from poppler-utils on Linux, or similar on Windows)
    try {
        const command = isWindows
            ? `pdftoppm -png -f 1 -l 1 -scale-to 300 -singlefile "${filePath}" "${path.join(outputDir, contentId)}"`
            : `pdftoppm -png -f 1 -l 1 -scale-to 300 -singlefile "${filePath}" "${path.join(outputDir, contentId)}"`;
        
        await execAsync(command);
        await fs.access(outputPath);
        return `/uploads/thumbnails/${contentId}.png`;
    } catch (error) {
        console.error('PDF thumbnail generation failed:', error);
        throw new Error('PDF thumbnail generation failed. Ensure poppler-utils is installed.');
    }
}

async function convertToPdfAndThumbnail(filePath, outputDir, contentId) {
    const tempPdfPath = path.join(outputDir, `${contentId}_temp.pdf`);

    // Use LibreOffice system command to convert to PDF
    try {
        const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;
        await execAsync(command);

        const originalName = path.basename(filePath, path.extname(filePath));
        const createdPdfPath = path.join(outputDir, `${originalName}.pdf`);
        await fs.rename(createdPdfPath, tempPdfPath);
    } catch (error) {
        console.error('LibreOffice conversion failed:', error);
        throw new Error('Document to PDF conversion failed. Ensure LibreOffice is installed.');
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
