import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

// This is the final, definitive, and correct implementation.
async function runPandoc(args) {
  return new Promise((resolve, reject) => {
    const pandoc = spawn('pandoc', args);
    let result = '';
    let errorOutput = '';
    pandoc.stdout.on('data', (data) => {
      result += data.toString();
    });
    pandoc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    pandoc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput));
      }
      resolve(result);
    });
    pandoc.on('error', (err) => {
      reject(err);
    });
  });
}

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const filePathParam = searchParams.get('filePath');

  if (!filePathParam) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }
  if (filePathParam.includes('..')) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const decodedPath = decodeURIComponent(filePathParam);
  const normalizedPath = path.normalize(decodedPath);
  const absolutePath = path.join(process.cwd(), 'public', normalizedPath);

  try {
    await fs.access(absolutePath);

    let htmlResult;
    try {
      // First, try the best method: --embed-images
      htmlResult = await runPandoc([absolutePath, '-f', 'docx', '-t', 'html', '--embed-images']);
    } catch (error) {
      console.warn('Pandoc with --embed-images failed. Falling back to --self-contained.', error);
      try {
        // Fallback to the more compatible but layout-breaking method
        const fullHtml = await runPandoc([absolutePath, '-f', 'docx', '-t', 'html', '--self-contained']);
        // Desperate hack: strip the full document structure to prevent layout breakage.
        const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        htmlResult = bodyMatch ? bodyMatch[1] : fullHtml;
      } catch (fallbackError) {
        console.error('Pandoc fallback with --self-contained also failed.', fallbackError);
        throw fallbackError; // Both methods failed, rethrow the error.
      }
    }

    return new NextResponse(htmlResult, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('--- CATASTROPHIC ERROR in convert-docx ---', error);
    return NextResponse.json({ error: 'Failed to convert document', details: error.message }, { status: 500 });
  }
}