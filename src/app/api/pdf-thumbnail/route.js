import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import backblazeService from '@/services/backblazeService';
import Content from '@/models/Content';
import connectDB from '@/config/mongoConfig';

export async function POST(request) {
  console.log('🚀 PDF Thumbnail API called - Creating single-page PDF thumbnail');
  let tempPdfFile = null;
  let tempThumbnailPdf = null;
  
  try {
    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { fileKey, filePath, contentId } = body;
    
    console.log('📋 Request data:', { fileKey, filePath });

    if (!fileKey && !filePath) {
      console.error('❌ Missing file key or path');
      return NextResponse.json({ error: 'File key or file path is required' }, { status: 400 });
    }

    console.log('🖼️ Starting PDF thumbnail generation (single-page PDF approach)...');

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

    // Get PDF buffer (from Backblaze B2 or local file for testing)
    let pdfBuffer;
    
    // Check if this is a local file path for testing
    if (filePath && filePath.startsWith('/temp/')) {
      console.log('📁 Loading local file for testing:', filePath);
      try {
        const localPath = path.join(process.cwd(), filePath.substring(1)); // Remove leading slash
        console.log('📂 Local file path:', localPath);
        pdfBuffer = fs.readFileSync(localPath);
        console.log('✅ Local PDF loaded successfully, size:', pdfBuffer.length, 'bytes');
      } catch (localError) {
        console.error('❌ Failed to load local PDF:', localError);
        throw new Error(`Failed to load local PDF: ${localError.message}`);
      }
    } else {
      // Download from Backblaze B2
      console.log('📥 Downloading original PDF from Backblaze...');
      try {
        pdfBuffer = await backblazeService.getFileBuffer(finalFileKey);
        console.log('✅ Original PDF downloaded successfully, size:', pdfBuffer.length, 'bytes');
      } catch (downloadError) {
        console.error('❌ Failed to download PDF:', downloadError);
        throw new Error(`Failed to download PDF: ${downloadError.message}`);
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty');
    }

    // Load the PDF document using pdf-lib
    console.log('📖 Loading PDF document with pdf-lib...');
    const originalPdf = await PDFDocument.load(pdfBuffer);
    const pages = originalPdf.getPages();
    
    if (pages.length === 0) {
      throw new Error('PDF has no pages');
    }

    console.log('📄 PDF loaded successfully, total pages:', pages.length);

    // Create a new PDF with only the first page
    console.log('✂️ Extracting first page to create thumbnail PDF...');
    const thumbnailPdf = await PDFDocument.create();
    
    // Copy the first page to the new PDF
    const [firstPage] = await thumbnailPdf.copyPages(originalPdf, [0]);
    thumbnailPdf.addPage(firstPage);
    
    console.log('✅ First page extracted successfully');

    // Save the thumbnail PDF
    const thumbnailPdfBytes = await thumbnailPdf.save();
    console.log('💾 Thumbnail PDF created, size:', thumbnailPdfBytes.length, 'bytes');

    // Upload the single-page PDF to Backblaze as thumbnail
    const uniqueId = uuidv4();
    const thumbnailFileName = `pdf_thumb_${uniqueId}.pdf`;
    
    console.log('☁️ Uploading thumbnail PDF to Backblaze...');
    const uploadResult = await backblazeService.uploadFile(
      Buffer.from(thumbnailPdfBytes),
      thumbnailFileName,
      'application/pdf',
      'thumbnails/pdf'
    );

    console.log('✅ PDF thumbnail uploaded successfully:', uploadResult.url);

    // Update the Content document with the thumbnail URL if contentId is provided
    if (contentId) {
      try {
        console.log('💾 Updating Content document with thumbnail URL...');
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
          console.log('✅ Content document updated successfully with thumbnail URL');
          console.log('📋 Updated content:', {
            id: updatedContent._id,
            title: updatedContent.title,
            thumbnailUrl: updatedContent.thumbnailUrl
          });
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
      method: 'single-page-pdf',
      originalPages: pages.length,
      thumbnailSize: thumbnailPdfBytes.length,
      contentUpdated: !!contentId
    });

  } catch (error) {
    console.error('❌ PDF thumbnail generation failed:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to generate PDF thumbnail',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
    
  } finally {
    // Clean up temporary files if any
    console.log('🧹 Cleaning up temporary files...');
    
    if (tempPdfFile && fs.existsSync(tempPdfFile)) {
      try {
        fs.unlinkSync(tempPdfFile);
        console.log('✅ Cleaned up temp PDF file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp PDF file:', cleanupError.message);
      }
    }
    
    if (tempThumbnailPdf && fs.existsSync(tempThumbnailPdf)) {
      try {
        fs.unlinkSync(tempThumbnailPdf);
        console.log('✅ Cleaned up temp thumbnail PDF');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp thumbnail PDF:', cleanupError.message);
      }
    }
  }
}