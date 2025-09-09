import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import path from 'path';
import { exec } from 'child_process';
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

    const command = `pandoc "${absolutePath}" -f docx -t html`;

    const { stdout, stderr } = await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
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
    if (error.message.includes('command not found') || error.code === 127 || error.message.includes('is not recognized')) {
        return NextResponse.json({ error: 'Pandoc is not installed or not in PATH' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to convert file' }, { status: 500 });
  }
}