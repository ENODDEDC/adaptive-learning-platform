import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import backblazeService from '@/services/backblazeService';

function extractTextFromPdfStructure(pdfBuffer) {
  try {
    const raw = pdfBuffer.toString('latin1');
    const matches = raw.match(/\((?:\\.|[^\\)]){4,}\)/g) || [];

    const decoded = matches
      .map(chunk => chunk.slice(1, -1))
      .map(chunk =>
        chunk
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
      )
      .filter(text => /[A-Za-z]{2,}/.test(text));

    const joined = decoded.join(' ').replace(/\s+/g, ' ').trim();
    return joined;
  } catch {
    return '';
  }
}

export async function POST(request) {
  try {
    const { fileKey, filePath } = await request.json();

    if (!fileKey && !filePath) {
      return NextResponse.json(
        { error: 'Either fileKey or filePath is required' },
        { status: 400 }
      );
    }

    console.log('📄 Starting PDF text extraction...');
    console.log('File key:', fileKey);
    console.log('File path:', filePath);

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
      console.log('📥 Downloading PDF from Backblaze B2...');
      try {
        pdfBuffer = await backblazeService.getFileBuffer(finalFileKey);
        console.log('✅ PDF downloaded successfully, size:', pdfBuffer.length, 'bytes');
      } catch (downloadError) {
        console.error('❌ Failed to download PDF:', downloadError);
        throw new Error(`Failed to download PDF: ${downloadError.message}`);
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty');
    }

    // Extract text from PDF with non-AI parser first (no credits).
    console.log('📄 Attempting non-AI PDF parsing first...');
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(pdfBuffer);
      const parsedText = (pdfData?.text || '').trim();

      if (parsedText.length >= 50) {
        const cleanedText = parsedText
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

        const meaningfulRatio = cleanedText.length > 0
          ? (cleanedText.match(/[a-zA-Z\s]/g) || []).length / cleanedText.length
          : 0;

        if (meaningfulRatio >= 0.5) {
          console.log('✅ Non-AI PDF parsing successful');
          return NextResponse.json({
            success: true,
            content: {
              rawText: cleanedText,
              pageCount: pdfData.numpages,
              wordCount: cleanedText.split(/\s+/).length,
              characterCount: cleanedText.length,
              meaningfulTextRatio: meaningfulRatio,
              extractionMethod: 'pdf-parse'
            },
            message: 'PDF text extracted successfully using non-AI parser'
          });
        }
      }
    } catch (parseError) {
      console.warn('⚠️ Non-AI parsing failed:', parseError?.message);
    }

    // Secondary non-AI fallback: best-effort extraction from PDF text objects.
    const structureText = extractTextFromPdfStructure(pdfBuffer);
    if (structureText.length >= 50) {
      const meaningfulTextRatio = (structureText.match(/[a-zA-Z\s]/g) || []).length / structureText.length;
      return NextResponse.json({
        success: true,
        content: {
          rawText: structureText,
          pageCount: 'Unknown',
          wordCount: structureText.split(/\s+/).length,
          characterCount: structureText.length,
          meaningfulTextRatio,
          extractionMethod: 'pdf-structure-fallback'
        },
        message: 'PDF text extracted using structure fallback'
      });
    }

    throw new Error('No extractable text found in PDF (possibly scanned/image-only document)');

  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract text from PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}