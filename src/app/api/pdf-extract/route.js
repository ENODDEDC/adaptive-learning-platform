import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import backblazeService from '@/services/backblazeService';
import Content from '@/models/Content';
import connectToDatabase from '@/lib/mongodb';

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

function getPopplerBinDir() {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin');
  }
  // For Linux (Render.com), try to find poppler in system paths
  if (platform === 'linux') {
    // Check if poppler-utils is installed system-wide
    const possiblePaths = [
      '/usr/bin',
      '/usr/local/bin',
      path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'linux', 'bin')
    ];
    
    for (const binPath of possiblePaths) {
      const pdfToTextPath = path.join(binPath, 'pdftotext');
      if (fs.existsSync(pdfToTextPath)) {
        console.log('✅ Found poppler at:', binPath);
        return binPath;
      }
    }
    
    console.warn('⚠️ Poppler not found in system paths, will skip poppler extraction');
    return null;
  }
  
  throw new Error(`Poppler binary path not configured for platform: ${platform}`);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || stdout || `${path.basename(command)} exited with code ${code}`));
      }
    });
  });
}

async function extractTextWithPoppler(pdfBuffer) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-extract-poppler-'));
  const pdfPath = path.join(tempDir, 'source.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);

  try {
    const binDir = getPopplerBinDir();
    if (!binDir) {
      console.warn('⚠️ Poppler not available, skipping poppler extraction');
      return '';
    }
    
    const exe = path.join(binDir, process.platform === 'win32' ? 'pdftotext.exe' : 'pdftotext');
    const { stdout } = await runProcess(
      exe,
      ['-layout', '-enc', 'UTF-8', pdfPath, '-'],
      { cwd: binDir }
    );
    return normalizeExtractedText(stdout || '');
  } catch (error) {
    console.warn('⚠️ Poppler extraction failed:', error?.message);
    return '';
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

export async function POST(request) {
  try {
    const { fileKey, filePath, contentId } = await request.json();

    if (!fileKey && !filePath && !contentId) {
      return NextResponse.json(
        { error: 'Either fileKey, filePath, or contentId is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Check if we already have the text in the DB
    let contentDoc = null;
    if (contentId) {
      contentDoc = await Content.findById(contentId);
    } else if (fileKey) {
      contentDoc = await Content.findOne({ 'cloudStorage.key': fileKey });
    }

    if (contentDoc?.extractedText) {
      console.log('🚀 Found cached text in Database, returning immediately.');
      return NextResponse.json({
        success: true,
        content: {
          rawText: contentDoc.extractedText,
          extractionMethod: 'database-cache'
        },
        message: 'PDF text retrieved from cache'
      });
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

    // If we still don't have a key but have a content doc, use its key
    if (!finalFileKey && contentDoc?.cloudStorage?.key) {
      finalFileKey = contentDoc.cloudStorage.key;
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
    } else if (finalFileKey) {
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
      throw new Error('PDF buffer is empty or could not be retrieved');
    }

    let extractedText = '';
    let extractionMethod = '';
    let pageCount = 0;

    // Extract text from PDF with non-AI parser first (no credits).
    console.log('📄 Attempting non-AI PDF parsing first...');
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(pdfBuffer);
      const parsedText = normalizeExtractedText(pdfData?.text || '');
      const quality = getExtractionQuality(parsedText);

      if (quality.looksValid) {
        console.log('✅ Non-AI PDF parsing successful');
        extractedText = quality.cleaned;
        extractionMethod = 'pdf-parse';
        pageCount = pdfData.numpages;
      }
    } catch (parseError) {
      console.warn('⚠️ Non-AI parsing failed:', parseError?.message);
    }

    // Secondary non-AI fallback: pdf.js server-side text extraction.
    if (!extractedText) {
      const pdfJsResult = await extractTextWithPdfJs(pdfBuffer);
      const pdfJsQuality = getExtractionQuality(pdfJsResult.text);
      if (pdfJsQuality.looksValid) {
        extractedText = pdfJsQuality.cleaned;
        extractionMethod = 'pdfjs-text';
        pageCount = pdfJsResult.pageCount;
      }
    }

    // Third parser path: poppler pdftotext
    if (!extractedText) {
      const popplerText = await extractTextWithPoppler(pdfBuffer);
      const popplerQuality = getExtractionQuality(popplerText);
      if (popplerQuality.looksValid) {
        extractedText = popplerQuality.cleaned;
        extractionMethod = 'poppler-pdftotext';
      }
    }

    // Final parser path: structure extraction
    if (!extractedText) {
      const structureText = extractTextFromPdfStructure(pdfBuffer);
      const structureQuality = getExtractionQuality(structureText);
      if (structureQuality.looksValid) {
        extractedText = structureQuality.cleaned;
        extractionMethod = 'pdf-structure-fallback';
      }
    }

    if (!extractedText) {
      throw new Error('No clean extractable text found in PDF (possibly scanned, image-only, encrypted, or highly encoded)');
    }

    // 2. Save the extracted text back to the database
    if (contentDoc) {
      contentDoc.extractedText = extractedText;
      await contentDoc.save();
      console.log(`💾 [DB SAVE] Extracted text saved to Database for content ${contentDoc._id}`);
    } else if (finalFileKey) {
      // Try to find the doc by key if we didn't have contentId
      const updateResult = await Content.updateOne(
        { 'cloudStorage.key': finalFileKey },
        { $set: { extractedText: extractedText } }
      );
      console.log(`💾 [DB UPDATE] Extracted text updated via fileKey. Matches: ${updateResult.matchedCount}`);
    }

    return NextResponse.json({
      success: true,
      content: {
        rawText: extractedText,
        pageCount: pageCount || 'Unknown',
        extractionMethod: extractionMethod
      },
      message: 'PDF text extracted and cached successfully'
    });

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
