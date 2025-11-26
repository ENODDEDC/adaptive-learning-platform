import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import backblazeService from '@/services/backblazeService';
import Content from '@/models/Content';
import connectDB from '@/config/mongoConfig';

export async function POST(request) {
  console.log('🚀 DOCX Thumbnail API called - Converting DOCX to PDF thumbnail');
  let tempDocxFile = null;
  let tempPdfFile = null;

  try {
    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { fileKey, filePath, contentId } = body;

    // Check if thumbnail already exists in database to prevent duplicate processing
    if (contentId) {
      try {
        await connectDB();
        const existingContent = await Content.findById(contentId);
        if (existingContent && existingContent.thumbnailUrl) {
          console.log('✅ DOCX Thumbnail already exists, returning cached URL:', existingContent.thumbnailUrl);
          return NextResponse.json({
            success: true,
            thumbnailUrl: existingContent.thumbnailUrl,
            thumbnailKey: existingContent.cloudStorage?.thumbnailKey,
            method: 'cached',
            cached: true
          });
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to check existing DOCX thumbnail, proceeding with generation:', dbError.message);
      }
    }

    console.log('📋 Request data:', { fileKey, filePath });

    if (!fileKey && !filePath) {
      console.error('❌ Missing file key or path');
      return NextResponse.json({ error: 'File key or file path is required' }, { status: 400 });
    }

    console.log('📄 Starting DOCX to PDF thumbnail generation...');

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

    // Get DOCX buffer from Backblaze B2
    let docxBuffer;

    // Check if this is a local file path for testing
    if (filePath && filePath.startsWith('/temp/')) {
      console.log('📁 Loading local DOCX file for testing:', filePath);
      try {
        const localPath = path.join(process.cwd(), filePath.substring(1));
        console.log('📂 Local file path:', localPath);
        docxBuffer = fs.readFileSync(localPath);
        console.log('✅ Local DOCX loaded successfully, size:', docxBuffer.length, 'bytes');
      } catch (localError) {
        console.error('❌ Failed to load local DOCX:', localError);
        throw new Error(`Failed to load local DOCX: ${localError.message}`);
      }
    } else {
      // Download from Backblaze B2
      console.log('📥 Downloading DOCX from Backblaze...');
      console.log('🔑 Using file key:', finalFileKey);
      
      try {
        docxBuffer = await backblazeService.getFileBuffer(finalFileKey);
        console.log('✅ DOCX downloaded successfully, size:', docxBuffer.length, 'bytes');
      } catch (downloadError) {
        console.error('❌ Failed to download DOCX:', downloadError.message);
        
        // If file not found in Backblaze, return a graceful error instead of crashing
        if (downloadError.message.includes('File not found in storage') || downloadError.message.includes('NoSuchKey')) {
          console.warn('⚠️ File not found in Backblaze B2, skipping thumbnail generation');
          return NextResponse.json({
            success: false,
            error: 'File not found in cloud storage',
            message: 'The file may have been deleted or never uploaded to cloud storage',
            fileKey: finalFileKey,
            suggestion: 'Please re-upload the file or check if it exists in local storage'
          }, { status: 404 });
        }
        
        throw new Error(`Failed to download DOCX: ${downloadError.message}`);
      }
    }

    if (!docxBuffer || docxBuffer.length === 0) {
      throw new Error('DOCX buffer is empty');
    }

    // Step 1: Convert DOCX to PDF using libreoffice-convert
    console.log('🔄 Converting DOCX to PDF...');

    // Create temporary files for conversion
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const uniqueId = uuidv4();
    tempDocxFile = path.join(tempDir, `docx_${uniqueId}.docx`);
    tempPdfFile = path.join(tempDir, `docx_pdf_${uniqueId}.pdf`);

    // Write DOCX to temp file
    fs.writeFileSync(tempDocxFile, docxBuffer);
    console.log('📁 Temporary DOCX file created:', tempDocxFile);

    // Convert DOCX to PDF using LibreOffice system command
    console.log('🔄 Converting DOCX to PDF using LibreOffice...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const command = `soffice --headless --convert-to pdf --outdir "${tempDir}" "${tempDocxFile}"`;
    await execAsync(command);
    
    // Read the generated PDF
    const pdfFileName = `docx_${uniqueId}.pdf`;
    const generatedPdfPath = path.join(tempDir, pdfFileName);
    
    // Rename to expected temp file name
    if (fs.existsSync(generatedPdfPath)) {
      fs.renameSync(generatedPdfPath, tempPdfFile);
    }
    
    const pdfBuffer = fs.readFileSync(tempPdfFile);
    console.log('📄 DOCX converted to PDF successfully, size:', pdfBuffer.length, 'bytes');

    // Step 2: Create thumbnail from the PDF (reuse PDF thumbnail logic)
    console.log('🖼️ Creating thumbnail from converted PDF...');

    // Load the PDF document using pdf-lib
    const originalPdf = await PDFDocument.load(pdfBuffer);
    const pages = originalPdf.getPages();

    if (pages.length === 0) {
      throw new Error('Converted PDF has no pages');
    }

    console.log('📄 PDF loaded successfully, total pages:', pages.length);

    // Create a new PDF with only the first page (same as PDF thumbnail logic)
    const thumbnailPdf = await PDFDocument.create();
    const [firstPage] = await thumbnailPdf.copyPages(originalPdf, [0]);
    thumbnailPdf.addPage(firstPage);

    console.log('✅ First page extracted successfully');

    // Save the thumbnail PDF
    const thumbnailPdfBytes = await thumbnailPdf.save();
    console.log('💾 Thumbnail PDF created, size:', thumbnailPdfBytes.length, 'bytes');

    // Upload the single-page PDF to Backblaze as thumbnail
    const thumbnailFileName = `docx_thumb_${uniqueId}.pdf`;

    console.log('☁️ Uploading DOCX thumbnail PDF to Backblaze...');
    const uploadResult = await backblazeService.uploadFile(
      Buffer.from(thumbnailPdfBytes),
      thumbnailFileName,
      'application/pdf',
      'thumbnails/docx'
    );

    console.log('✅ DOCX thumbnail uploaded successfully:', uploadResult.url);

    // Update the Content document with the thumbnail URL if contentId is provided
    if (contentId) {
      try {
        console.log('💾 Updating Content document with DOCX thumbnail URL...');
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
          console.log('✅ Content document updated successfully with DOCX thumbnail URL');
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
      method: 'docx-to-pdf-thumbnail',
      originalPages: pages.length,
      thumbnailSize: thumbnailPdfBytes.length,
      contentUpdated: !!contentId
    });

  } catch (error) {
    console.error('❌ DOCX thumbnail generation failed:', error);
    console.error('❌ Error stack:', error.stack);

    return NextResponse.json({
      error: 'Failed to generate DOCX thumbnail',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });

  } finally {
    // Clean up temporary files
    console.log('🧹 Cleaning up temporary files...');

    if (tempDocxFile && fs.existsSync(tempDocxFile)) {
      try {
        fs.unlinkSync(tempDocxFile);
        console.log('✅ Cleaned up temp DOCX file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp DOCX file:', cleanupError.message);
      }
    }

    if (tempPdfFile && fs.existsSync(tempPdfFile)) {
      try {
        fs.unlinkSync(tempPdfFile);
        console.log('✅ Cleaned up temp PDF file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp PDF file:', cleanupError.message);
      }
    }
  }
}