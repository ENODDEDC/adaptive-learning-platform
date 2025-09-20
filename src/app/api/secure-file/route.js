import { NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

// Configuration
const SECRET_KEY = process.env.FILE_ACCESS_SECRET || 'your-secret-key-change-in-production';
const MAX_AGE = 3600; // 1 hour in seconds

// Generate a signed URL for secure file access
function generateSignedUrl(filePath, expiresIn = MAX_AGE) {
  const expires = Math.floor(Date.now() / 1000) + expiresIn;

  // Create the string to sign
  const stringToSign = `${filePath}:${expires}`;

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(stringToSign)
    .digest('hex');

  // Build the signed URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    path: filePath,
    expires: expires.toString(),
    signature: signature
  });

  return `${baseUrl}/api/secure-file/access?${params.toString()}`;
}

// Verify a signed URL
function verifySignedUrl(filePath, expires, signature) {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if URL has expired
  if (currentTime > parseInt(expires)) {
    return { valid: false, error: 'URL has expired' };
  }

  // Recreate the signature
  const stringToSign = `${filePath}:${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(stringToSign)
    .digest('hex');

  // Verify signature
  if (!crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'sign') {
    // Generate a signed URL
    const filePath = searchParams.get('path');
    const expiresIn = parseInt(searchParams.get('expiresIn')) || MAX_AGE;

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    try {
      // Verify file exists and is accessible
      const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

      await fs.access(absolutePath);

      // Check file extension
      const ext = path.extname(absolutePath).toLowerCase();
      if (!['.ppt', '.pptx', '.pdf', '.doc', '.docx'].includes(ext)) {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
      }

      const signedUrl = generateSignedUrl(filePath, expiresIn);

      return NextResponse.json({
        signedUrl,
        expiresIn,
        expiresAt: new Date((Math.floor(Date.now() / 1000) + expiresIn) * 1000).toISOString()
      });

    } catch (error) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json({ error: 'File not found or inaccessible' }, { status: 404 });
    }

  } else if (action === 'access') {
    // Serve the file if signature is valid
    const filePath = searchParams.get('path');
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');

    if (!filePath || !expires || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify the signed URL
    const verification = verifySignedUrl(filePath, expires, signature);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 403 });
    }

    try {
      // Serve the file
      const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

      const fileBuffer = await fs.readFile(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();

      // Determine content type
      const contentTypes = {
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`,
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        }
      });

    } catch (error) {
      console.error('Error serving file:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

// POST endpoint for batch signed URL generation
export async function POST(request) {
  try {
    const body = await request.json();
    const { files, expiresIn = MAX_AGE } = body;

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    const signedUrls = [];

    for (const filePath of files) {
      try {
        // Verify file exists
        const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const absolutePath = path.join(process.cwd(), 'public', safeSuffix);
        await fs.access(absolutePath);

        const signedUrl = generateSignedUrl(filePath, expiresIn);
        signedUrls.push({
          originalPath: filePath,
          signedUrl,
          expiresIn,
          expiresAt: new Date((Math.floor(Date.now() / 1000) + expiresIn) * 1000).toISOString()
        });
      } catch (error) {
        console.warn(`Skipping file ${filePath}:`, error.message);
      }
    }

    return NextResponse.json({ signedUrls });

  } catch (error) {
    console.error('Error in batch signed URL generation:', error);
    return NextResponse.json({ error: 'Failed to generate signed URLs' }, { status: 500 });
  }
}