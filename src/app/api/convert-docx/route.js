import { NextResponse } from 'next/server';
import path from 'path';
import { execFile } from 'child_process';
import fs from 'fs/promises';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // Use --self-contained so images/resources are embedded as base64 data URIs
    // Use html5 output; execFile to avoid shell parsing issues and raise buffer limit
    const args = [absolutePath, '-f', 'docx', '-t', 'html5', '--self-contained', '--standalone'];

    const { stdout, stderr } = await new Promise((resolve, reject) => {
      execFile('pandoc', args, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          error.stderr = stderr;
          return reject(error);
        }
        resolve({ stdout, stderr });
      });
    });

    if (stderr) {
      console.warn('Pandoc stderr:', stderr);
    }

    return new NextResponse(stdout, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error converting DOCX to HTML with Pandoc:', error);
    if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if ((error.message && (error.message.includes('command not found') || error.message.includes('is not recognized'))) || error.code === 127) {
        return NextResponse.json({ error: 'Pandoc is not installed or not in PATH' }, { status: 500 });
    }
    const details = error.stderr || error.message || 'Unknown error';
    return NextResponse.json({ error: 'Failed to convert file', details }, { status: 500 });
  }
}