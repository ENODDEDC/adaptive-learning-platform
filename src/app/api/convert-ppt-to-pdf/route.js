import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Content from '../../../models/Content';
import { convertPPTToPDF } from '../../../utils/pptToPdfConverter';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');
  const contentId = searchParams.get('contentId');

  if (!filePath) {
    console.log('No file path provided');
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // Check file extension
    const ext = path.extname(absolutePath).toLowerCase();
    if (!['.ppt', '.pptx'].includes(ext)) {
      return NextResponse.json({ 
        error: 'Unsupported file format. Only .ppt and .pptx files are supported.' 
      }, { status: 400 });
    }

    // Get file stats for cache key generation
    const stats = await fs.stat(absolutePath);
    const cacheKey = crypto.createHash('md5').update(`${filePath}_${stats.mtime.getTime()}`).digest('hex');

    // Check if PDF already exists in cache
    const pdfFileName = `ppt_${cacheKey}.pdf`;
    const pdfDir = path.join(process.cwd(), 'public', 'temp', 'pdf');
    const pdfPath = path.join(pdfDir, pdfFileName);
    const pdfRelativePath = `/temp/pdf/${pdfFileName}`;
    
    // Create the PDF directory if it doesn't exist
    await fs.mkdir(pdfDir, { recursive: true });

    let pdfExists = false;
    try {
      await fs.access(pdfPath);
      pdfExists = true;
      console.log('✅ Found cached PDF file:', pdfRelativePath);
    } catch (err) {
      // PDF doesn't exist, we'll need to convert
      console.log('🔄 No cached PDF file found, will convert');
    }

    // Update content status to processing if it exists
    if (contentId) {
      try {
        const content = await Content.findById(contentId);
        if (content) {
          await Content.findByIdAndUpdate(contentId, {
            conversionStatus: 'processing',
            cacheKey: cacheKey
          });
        }
      } catch (dbErr) {
        console.warn('Failed to update content status:', dbErr.message);
        // Continue with conversion even if DB update fails
      }
    }

    // If PDF doesn't exist in cache, convert it
    if (!pdfExists) {
      console.log('🔄 Starting PowerPoint to PDF conversion...');
      
      // Read the PPT file
      const pptBuffer = await fs.readFile(absolutePath);
      
      // Use the convertPPTToPDF function from pptToPdfConverter.js
      const outputPdfPath = await convertPPTToPDF(pptBuffer, pdfDir);
      
      // Rename to our expected path
      await fs.rename(outputPdfPath, pdfPath);
      
      console.log('✅ PowerPoint converted to PDF successfully:', pdfRelativePath);
    }

    // Update content in database if we have a contentId
    if (contentId) {
      try {
        await Content.findByIdAndUpdate(contentId, {
          pdfPath: pdfRelativePath,
          conversionStatus: 'completed',
          cacheKey: cacheKey,
          conversionError: null
        });
      } catch (dbErr) {
        console.warn('Failed to update content with PDF path:', dbErr.message);
        // Continue even if DB update fails
      }
    }

    // Get page count from the generated PDF
    let pageCount = 10; // Default fallback
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(pdfBuffer);
      pageCount = data.numpages;
      console.log('✅ PDF page count:', pageCount);
    } catch (pageCountError) {
      console.warn('Failed to get PDF page count:', pageCountError.message);
    }

    // Return the PDF URL with page count
    return NextResponse.json({
      success: true,
      pdfUrl: pdfRelativePath,
      cacheKey: cacheKey,
      pageCount: pageCount
    });

  } catch (error) {
    console.error('Error processing PPT file:', error);

    // Update content status to failed if we have a contentId
    if (contentId) {
      try {
        await Content.findByIdAndUpdate(contentId, {
          conversionStatus: 'failed',
          conversionError: error.message
        });
      } catch (dbError) {
        console.error('Failed to update content status:', dbError);
      }
    }

    if (error.code === 'ENOENT') {
      return NextResponse.json({
        error: 'File not found',
        details: 'The PowerPoint file could not be found. It may have been moved or deleted.'
      }, { status: 404 });
    }

    if (error.message && error.message.includes('LibreOffice')) {
      return NextResponse.json({
        error: 'Conversion service unavailable',
        details: 'LibreOffice is not available on the server. Please try downloading the file and opening it in PowerPoint directly.'
      }, { status: 500 });
    }

    const details = error.message || 'An unexpected error occurred while converting the presentation.';
    return NextResponse.json({
      error: 'Failed to convert PowerPoint to PDF',
      details
    }, { status: 500 });
  }
}