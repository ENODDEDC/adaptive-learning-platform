import { NextResponse } from 'next/server';
import globalLearningService from '@/services/globalLearningService';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import backblazeService from '@/services/backblazeService';
import { spawn } from 'child_process';

export async function POST(request) {
  console.log('🌍 =================================');
  console.log('🌍 GLOBAL LEARNING API ENDPOINT CALLED');
  console.log('🌍 =================================');

  try {
    console.log('📥 Parsing request body...');
    const { docxText, fileKey, filePath, mimeType, fileName } = await request.json();

    console.log('📝 Request data received:');
    console.log('  - Text length:', docxText?.length);
    console.log('  - Text preview:', docxText?.substring(0, 100) + '...');
    console.log('  - File key:', fileKey);
    console.log('  - File path:', filePath);
    console.log('  - MIME type:', mimeType);

    if (!docxText && !fileKey && !filePath) {
      console.error('❌ VALIDATION ERROR: No text provided in request');
      return NextResponse.json(
        { error: 'Document text content or PDF source is required' },
        { status: 400 }
      );
    }

    let result;
    const isPdfRequest = mimeType === 'application/pdf' || fileKey || (typeof filePath === 'string' && filePath.toLowerCase().includes('.pdf'));

    if (isPdfRequest && (fileKey || filePath)) {
      console.log('🌍 Using PDF vision pipeline for Global Learning...');
      result = await generateGlobalLearningFromPdf({
        fileKey,
        filePath,
        fallbackText: docxText,
        fileName,
        request
      });
    } else {
      console.log('🌍 Calling globalLearningService.generateGlobalContent...');
      console.log('🌍 About to call generateGlobalContent with params:', {
        textLength: docxText.length,
        textPreview: docxText.substring(0, 150) + '...'
      });
      result = await globalLearningService.generateGlobalContent(docxText);
    }

    console.log('✅ Global learning content generated successfully!');
    console.log('📊 Generated big picture sections:', Object.keys(result.bigPicture || {}).length);
    console.log('📊 Generated interconnections sections:', Object.keys(result.interconnections || {}).length);

    const response = {
      success: true,
      ...result
    };

    console.log('📤 Sending successful response to client');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ =====================================');
    console.error('❌ ERROR IN GLOBAL LEARNING GENERATION');
    console.error('❌ =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to generate global learning content';
    let statusCode = 500;

    // Handle educational content analysis rejection
    if (error.message.includes('not suitable for global learning')) {
      console.log('🚫 Content rejected - not educational material');
      errorMessage = 'This document does not appear to contain educational content suitable for global learning. Global Learning works best with lessons, tutorials, study materials, and academic content.';
      statusCode = 400;
      
      return NextResponse.json(
        { 
          error: errorMessage,
          isEducational: false,
          type: 'NON_EDUCATIONAL_CONTENT',
          suggestions: [
            'Try with lesson plans or study materials',
            'Use educational articles or tutorials', 
            'Upload course content or learning guides',
            'Use research papers or academic content'
          ]
        },
        { status: statusCode }
      );
    } else if (error.message.includes('not available')) {
      errorMessage = 'Global learning service is temporarily unavailable';
      statusCode = 503;
    } else if (
      error.message.includes('quota') ||
      error.message.includes('rate_limit') ||
      error.message.includes('429')
    ) {
      errorMessage = 'Global learning generation rate-limited by Groq. Wait a minute and retry.';
      statusCode = 429;
    } else if (
      error.message.includes('request_too_large') ||
      error.message.includes('Request Entity Too Large') ||
      error.message.includes('413')
    ) {
      errorMessage = 'Document too large for the generation model. Try a shorter document.';
      statusCode = 413;
    } else if (error.message.includes('API key') || error.message.includes('GROQ_API_KEY')) {
      errorMessage = 'Global learning service configuration error (missing GROQ_API_KEY).';
      statusCode = 500;
    }

    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('🔥 Final error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: 'GLOBAL_LEARNING_GENERATION_ERROR'
      },
      { status: statusCode }
    );
  }
}

function resolveFileKey(fileKey, filePath) {
  if (fileKey) return fileKey;
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) {
    try {
      const url = new URL(filePath);
      if (url.pathname.startsWith('/api/files/')) {
        return decodeURIComponent(url.pathname.replace('/api/files/', ''));
      }
    } catch {
      return filePath;
    }
  }
  if (filePath.startsWith('/api/files/')) {
    return decodeURIComponent(filePath.replace('/api/files/', ''));
  }
  return filePath;
}

async function loadPdfBuffer(fileKey, filePath, request) {
  const finalFileKey = resolveFileKey(fileKey, filePath);

  if (filePath && filePath.startsWith('/temp/')) {
    const localPath = path.join(process.cwd(), filePath.substring(1));
    return fs.readFileSync(localPath);
  }

  if (finalFileKey && finalFileKey !== filePath) {
    return backblazeService.getFileBuffer(finalFileKey);
  }

  if (filePath && /^https?:\/\//i.test(filePath)) {
    const cookie = request?.headers?.get('cookie');
    const response = await fetch(filePath, {
      headers: cookie ? { cookie } : undefined
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return backblazeService.getFileBuffer(finalFileKey);
}

function getPopplerBinDir() {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.cwd(), 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin');
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelayMs(message = '') {
  const match = String(message).match(/try again in\s+([\d.]+)\s*s/i) ||
    String(message).match(/try again in\s+([\d.]+)\s*ms/i);
  if (!match) return 2000;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return 2000;
  if (String(message).toLowerCase().includes('ms')) {
    return Math.min(Math.ceil(value) + 250, 10000);
  }
  return Math.min(Math.ceil(value * 1000) + 250, 10000);
}

function looksReadableText(text = '') {
  const cleaned = String(text).trim();
  if (cleaned.length < 80) return false;
  const weirdRatio = ((cleaned.match(/[^\x09\x0A\x0D\x20-\x7E]/g) || []).length / cleaned.length);
  const artifactHits = cleaned.match(/\b(endobj|FontDescriptor|CIDToGIDMap|BaseFont|Subtype|Type0|obj\s*<<)\b/gi) || [];
  return weirdRatio < 0.08 && artifactHits.length < 3;
}

async function getPdfPageCount(pdfPath) {
  const binDir = getPopplerBinDir();
  const exe = path.join(binDir, 'pdfinfo.exe');
  const { stdout } = await runProcess(exe, [pdfPath], { cwd: binDir });
  const match = stdout.match(/Pages:\s+(\d+)/i);
  return match ? Number(match[1]) : 0;
}

async function convertPdfPagesToImages(pdfBuffer, maxPages = 5) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'global-learning-'));
  const pdfPath = path.join(tempDir, 'source.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);

  try {
    const binDir = getPopplerBinDir();
    const exe = path.join(binDir, 'pdftocairo.exe');
    const pageCount = await getPdfPageCount(pdfPath).catch(() => 0);
    const targetPages = pageCount > 0 ? Math.min(pageCount, maxPages) : maxPages;

    await runProcess(
      exe,
      ['-png', '-f', '1', '-l', String(targetPages), pdfPath, path.join(tempDir, 'page')],
      { cwd: binDir }
    );

    const imageFiles = fs.readdirSync(tempDir)
      .filter(name => /^page-\d+\.png$/i.test(name))
      .sort((a, b) => {
        const aNum = Number(a.match(/\d+/)?.[0] || 0);
        const bNum = Number(b.match(/\d+/)?.[0] || 0);
        return aNum - bNum;
      })
      .slice(0, targetPages);

    const images = [];
    for (const imageFile of imageFiles) {
      const fullPath = path.join(tempDir, imageFile);
      const jpegBuffer = await sharp(fullPath)
        .resize({ width: 900, withoutEnlargement: true })
        .jpeg({ quality: 45 })
        .toBuffer();

      images.push(`data:image/jpeg;base64,${jpegBuffer.toString('base64')}`);
    }

    return images;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

async function groqVisionRequest(content, maxTokens = 900) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content
          }
        ]
      })
    });

    if (response.ok) {
      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Groq vision returned empty content');
      }
      return text;
    }

    const details = await response.text().catch(() => '');
    if (response.status === 429 && attempt < 2) {
      await sleep(getRetryDelayMs(details));
      continue;
    }
    throw new Error(`Groq vision API error (HTTP ${response.status}): ${details}`);
  }
}

async function generateGlobalLearningFromPdf({ fileKey, filePath, fallbackText, fileName, request }) {
  const pdfBuffer = await loadPdfBuffer(fileKey, filePath, request);
  const pageImages = await convertPdfPagesToImages(pdfBuffer, 3);

  if (pageImages.length === 0) {
    if (fallbackText) {
      return globalLearningService.generateGlobalContent(fallbackText);
    }
    throw new Error('Could not read any PDF pages for Global Learning');
  }

  const ocrPages = [];
  for (let index = 0; index < pageImages.length; index += 1) {
    const pageText = await groqVisionRequest([
      {
        type: 'text',
        text: `Extract the actual readable educational text from this PDF page.
Return plain text only.
Do not summarize.
Do not explain.
Ignore decorative elements, repeated page numbers, and UI artifacts.
If part of the page is unclear, extract only what is readable.`
      },
      {
        type: 'image_url',
        image_url: { url: pageImages[index] }
      }
    ], 700);

    if (looksReadableText(pageText)) {
      ocrPages.push(`Page ${index + 1}:\n${pageText.trim()}`);
    }
  }

  const reconstructedText = ocrPages.join('\n\n');
  if (!looksReadableText(reconstructedText)) {
    if (looksReadableText(fallbackText)) {
      return globalLearningService.generateGlobalContent(fallbackText);
    }
    throw new Error('Could not extract readable source text from the PDF pages');
  }

  const result = await globalLearningService.generateGlobalContent(reconstructedText);
  return {
    success: true,
    bigPicture: result.bigPicture || null,
    interconnections: result.interconnections || null,
    analysis: {
      ...(result.analysis || {}),
      isEducational: true,
      confidence: result.analysis?.confidence || 0.8,
      reasoning: 'Generated from OCR text read from actual PDF page images using Groq vision',
      contentType: result.analysis?.contentType || 'PDF document'
    }
  };
}
