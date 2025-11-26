import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { promises as fsPromises } from 'fs';
import Content from '@/models/Content';
import mongoConfig from '@/config/mongoConfig';

// Try to load optional packages - they may not be available on Linux
let pdf, libre, libreConvert;
try {
  const util = require('util');
  pdf = require('pdf-poppler');
  libre = require('libreoffice-convert');
  libreConvert = util.promisify(libre.convert);
  console.log('✅ Thumbnail generation packages loaded successfully');
} catch (error) {
  console.warn('⚠️ Thumbnail generation packages not available (pdf-poppler, libreoffice-convert)');
  console.warn('   This is expected on Linux/Render. Thumbnail generation will be disabled.');
}

async function generatePdfThumbnail(filePath, outputDir, contentId) {
  if (!pdf) {
    throw new Error('pdf-poppler not available on this platform');
  }
  
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
  return null;
}

export async function POST(request) {
  await mongoConfig();
  try {
    // Check if thumbnail generation is available
    if (!pdf || !libre) {
      return NextResponse.json({ 
        message: 'Thumbnail generation not available on this platform',
        note: 'This feature requires Windows-specific packages. Thumbnails will show as file type icons instead.',
        available: false
      }, { status: 200 }); // Return 200 so it doesn't break the UI
    }

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
