import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { promises as fsPromises } from 'fs';
import pdf from 'pdf-poppler';
import libre from 'libreoffice-convert';
import util from 'util';
import Content from '@/models/Content';
import mongoConfig from '@/config/mongoConfig';

const libreConvert = util.promisify(libre.convert);

async function generatePdfThumbnail(filePath, outputDir, contentId) {
    const opts = {
        format: 'png',
        out_dir: outputDir,
        out_prefix: contentId,
        page: 1,
    };

    const pdfConversionResult = await pdf.convert(filePath, opts);
    // pdf-poppler returns an array of paths to the generated images
    // We are interested in the first page's thumbnail
    if (pdfConversionResult && pdfConversionResult.length > 0) {
        const thumbnailFilename = path.basename(pdfConversionResult[0]);
        return `/uploads/thumbnails/${thumbnailFilename}`;
    }
    return null; // Or throw an error if thumbnail generation failed
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
            const fileBuffer = await fsPromises.readFile(localFilePath);
            const pdfBuffer = await libreConvert(fileBuffer, '.pdf', undefined);
            const tempPdfPath = path.join(thumbnailsDir, `${contentId}.pdf`);
            await fsPromises.writeFile(tempPdfPath, pdfBuffer);

            thumbnailUrl = await generatePdfThumbnail(tempPdfPath, thumbnailsDir, contentId);
            await fsPromises.unlink(tempPdfPath);
        } else {
            // For other file types, you might want to have a default thumbnail
            // For now, we'll just return a message.
            return NextResponse.json({ message: 'Thumbnail generation not supported for this file type.' }, { status: 400 });
        }

        content.thumbnailUrl = thumbnailUrl;
        await content.save();

        return NextResponse.json({ thumbnailUrl });
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return NextResponse.json({ message: 'Failed to generate thumbnail', error: error.message }, { status: 500 });
    }
}