import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import backblazeService from '@/services/backblazeService';
import Content from '@/models/Content';
import connectDB from '@/config/mongoConfig';

export async function POST(request) {
  console.log('🚀 PPTX Thumbnail API called - Creating thumbnail from first page of converted PDF');
  let tempInputFile = null;
  let tempOutputFile = null;

  try {
    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { fileKey, filePath, contentId } = body;

    console.log('📋 Request data:', { fileKey, filePath });

    if (!fileKey && !filePath) {
      console.error('❌ Missing file key or path');
      return NextResponse.json({ error: 'File key or file path is required' }, { status: 400 });
    }

    console.log('📊 Starting PPTX thumbnail generation...');

    // Determine the final file key
    let finalFileKey = fileKey;

    if (!finalFileKey && filePath) {
      console.log('🔍 Extracting key from file path...');
      if (filePath.startsWith('/api/files/')) {
        finalFileKey = decodeURIComponent(filePath.replace('/api/files/', ''));
      } else {
        finalFileKey = filePath;
      }
    }

    console.log('🔑 Final file key:', finalFileKey);

    // Step 1: Convert PPTX to PDF first
    console.log('🔄 Converting PPTX to PDF...');

    // Create temporary files for conversion
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const uniqueId = uuidv4();
    tempInputFile = path.join(tempDir, `pptx_${uniqueId}.pptx`);
    tempOutputFile = path.join(tempDir, `pdf_${uniqueId}.pdf`);

    // Get PPTX buffer from Backblaze B2
    let pptxBuffer;

    // Check if this is a local file path for testing
    if (filePath && filePath.startsWith('/temp/')) {
      console.log('📁 Loading local PPTX file for testing:', filePath);
      try {
        const localPath = path.join(process.cwd(), filePath.substring(1));
        pptxBuffer = fs.readFileSync(localPath);
        console.log('✅ Local PPTX loaded successfully, size:', pptxBuffer.length, 'bytes');
      } catch (localError) {
        console.error('❌ Failed to load local PPTX:', localError);
        throw new Error(`Failed to load local PPTX: ${localError.message}`);
      }
    } else {
      // Download from Backblaze B2
      console.log('📥 Downloading PPTX from Backblaze...');
      try {
        pptxBuffer = await backblazeService.getFileBuffer(finalFileKey);
        console.log('✅ PPTX downloaded successfully, size:', pptxBuffer.length, 'bytes');
      } catch (downloadError) {
        console.error('❌ Failed to download PPTX:', downloadError);
        throw new Error(`Failed to download PPTX: ${downloadError.message}`);
      }
    }

    if (!pptxBuffer || pptxBuffer.length === 0) {
      throw new Error('PPTX buffer is empty');
    }

    // Write PPTX to temp file
    fs.writeFileSync(tempInputFile, pptxBuffer);
    console.log('📁 Temporary PPTX file created:', tempInputFile);

    // Convert PPTX to PDF using libreoffice-convert
    const libreOfficeConvert = (await import('libreoffice-convert')).default;

    const pdfBuffer = await new Promise((resolve, reject) => {
      libreOfficeConvert.convert(pptxBuffer, '.pdf', undefined, (err, done) => {
        if (err) {
          console.error('❌ LibreOffice conversion error:', err);
          reject(err);
        } else {
          console.log('✅ LibreOffice PPTX conversion successful');
          resolve(done);
        }
      });
    });

    console.log('📄 PPTX converted to PDF successfully, size:', pdfBuffer.length, 'bytes');

    // Step 2: Create thumbnail from the FIRST PAGE of the PDF
    console.log('🖼️ Creating thumbnail from first page of converted PDF...');

    // Load the PDF document using pdf-lib
    const originalPdf = await PDFDocument.load(pdfBuffer);
    const pages = originalPdf.getPages();

    if (pages.length === 0) {
      throw new Error('Converted PDF has no pages');
    }

    console.log('📄 PDF loaded successfully, total pages:', pages.length);

    // Create a new PDF with ONLY THE FIRST PAGE (this is the key fix!)
    const thumbnailPdf = await PDFDocument.create();
    const [firstPage] = await thumbnailPdf.copyPages(originalPdf, [0]);
    thumbnailPdf.addPage(firstPage);

    console.log('✅ First page extracted successfully for thumbnail');

    // Save the thumbnail PDF
    const thumbnailPdfBytes = await thumbnailPdf.save();
    console.log('💾 Thumbnail PDF created, size:', thumbnailPdfBytes.length, 'bytes');

    // Upload the single-page PDF to Backblaze as thumbnail
    const thumbnailFileName = `pptx_thumb_${uniqueId}.pdf`;

    console.log('☁️ Uploading PPTX thumbnail PDF to Backblaze...');
    const uploadResult = await backblazeService.uploadFile(
      Buffer.from(thumbnailPdfBytes),
      thumbnailFileName,
      'application/pdf',
      'thumbnails/pptx'
    );

    console.log('✅ PPTX thumbnail uploaded successfully:', uploadResult.url);

    // Update the Content document with the thumbnail URL if contentId is provided
    if (contentId) {
      try {
        console.log('💾 Updating Content document with PPTX thumbnail URL...');
        await connectDB();

        const updatedContent = await Content.findByIdAndUpdate(
          contentId,
          {
            thumbnailUrl: uploadResult.url,
            'cloudStorage.thumbnailKey': uploadResult.key
          },
          { new: true }
        );

        if (updatedContent) {
          console.log('✅ Content document updated successfully with PPTX thumbnail URL');
        } else {
          console.warn('⚠️ Content document not found for ID:', contentId);
        }
      } catch (dbError) {
        console.error('❌ Failed to update Content document:', dbError);
        // Don't fail the entire request if DB update fails
      }
    }

    return NextResponse.json({
      success: true,
      thumbnailUrl: uploadResult.url,
      thumbnailKey: uploadResult.key,
      method: 'pptx-to-pdf-thumbnail',
      originalPages: pages.length,
      thumbnailSize: thumbnailPdfBytes.length,
      contentUpdated: !!contentId,
      firstPageOnly: true
    });

  } catch (error) {
    console.error('❌ PPTX thumbnail generation failed:', error);
    console.error('❌ Error stack:', error.stack);

    return NextResponse.json({
      error: 'Failed to generate PPTX thumbnail',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });

  } finally {
    // Clean up temporary files
    console.log('🧹 Cleaning up temporary files...');

    if (tempInputFile && fs.existsSync(tempInputFile)) {
      try {
        fs.unlinkSync(tempInputFile);
        console.log('✅ Cleaned up temp PPTX file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp PPTX file:', cleanupError.message);
      }
    }

    if (tempOutputFile && fs.existsSync(tempOutputFile)) {
      try {
        fs.unlinkSync(tempOutputFile);
        console.log('✅ Cleaned up temp PDF file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp PDF file:', cleanupError.message);
      }
    }
  }
}