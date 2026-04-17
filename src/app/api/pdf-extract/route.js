import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import backblazeService from '@/services/backblazeService';

function normalizeExtractedText(text) {
  return (text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getExtractionQuality(text) {
  const cleaned = normalizeExtractedText(text);
  const length = cleaned.length;
  const alphaNumericRatio = length > 0
    ? ((cleaned.match(/[a-zA-Z0-9\s.,;:!?'"()\-\n]/g) || []).length / length)
    : 0;
  const weirdCharRatio = length > 0
    ? ((cleaned.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length / length)
    : 0;
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const pdfArtifactMatches = cleaned.match(
    /\b(endobj|endstream|stream|FontDescriptor|CIDFontType|CIDToGIDMap|BaseFont|FontBBox|CapHeight|ItalicAngle|Registry|Ordering|Supplement|Type0|Subtype|obj\s*<<)\b/gi
  ) || [];
  const pdfArtifactRatio = wordCount > 0 ? pdfArtifactMatches.length / wordCount : 0;

  return {
    cleaned,
    length,
    wordCount,
    alphaNumericRatio,
    weirdCharRatio,
    pdfArtifactMatches,
    pdfArtifactRatio,
    looksValid:
      length >= 80 &&
      alphaNumericRatio >= 0.7 &&
      weirdCharRatio <= 0.08 &&
      pdfArtifactRatio <= 0.02
  };
}

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

async function extractTextWithPdfJs(pdfBuffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    return {
      text: normalizeExtractedText(pages.join('\n\n')),
      pageCount: pdf.numPages
    };
  } catch (error) {
    console.warn('⚠️ pdfjs extraction failed:', error?.message);
    return { text: '', pageCount: 0 };
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
      const parsedText = normalizeExtractedText(pdfData?.text || '');
      const quality = getExtractionQuality(parsedText);

      if (quality.looksValid) {
        console.log('✅ Non-AI PDF parsing successful');
        return NextResponse.json({
          success: true,
          content: {
            rawText: quality.cleaned,
            pageCount: pdfData.numpages,
            wordCount: quality.wordCount,
            characterCount: quality.length,
            meaningfulTextRatio: quality.alphaNumericRatio,
            extractionMethod: 'pdf-parse'
          },
          message: 'PDF text extracted successfully using non-AI parser'
        });
      }

      console.warn('⚠️ pdf-parse returned low-quality text, trying better fallback...', {
        weirdCharRatio: quality.weirdCharRatio,
        pdfArtifactRatio: quality.pdfArtifactRatio,
        preview: quality.cleaned.substring(0, 160)
      });
    } catch (parseError) {
      console.warn('⚠️ Non-AI parsing failed:', parseError?.message);
    }

    // Secondary non-AI fallback: pdf.js server-side text extraction.
    const pdfJsResult = await extractTextWithPdfJs(pdfBuffer);
    const pdfJsQuality = getExtractionQuality(pdfJsResult.text);
    if (pdfJsQuality.looksValid) {
      return NextResponse.json({
        success: true,
        content: {
          rawText: pdfJsQuality.cleaned,
          pageCount: pdfJsResult.pageCount || 'Unknown',
          wordCount: pdfJsQuality.wordCount,
          characterCount: pdfJsQuality.length,
          meaningfulTextRatio: pdfJsQuality.alphaNumericRatio,
          extractionMethod: 'pdfjs-text'
        },
        message: 'PDF text extracted using pdf.js'
      });
    }

    // Final fallback: best-effort extraction from PDF text objects, but reject PDF internals.
    const structureText = extractTextFromPdfStructure(pdfBuffer);
    const structureQuality = getExtractionQuality(structureText);
    if (structureQuality.looksValid) {
      return NextResponse.json({
        success: true,
        content: {
          rawText: structureQuality.cleaned,
          pageCount: 'Unknown',
          wordCount: structureQuality.wordCount,
          characterCount: structureQuality.length,
          meaningfulTextRatio: structureQuality.alphaNumericRatio,
          extractionMethod: 'pdf-structure-fallback'
        },
        message: 'PDF text extracted using structure fallback'
      });
    }

    throw new Error('No clean extractable text found in PDF (possibly scanned, image-only, or encoded)');

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
