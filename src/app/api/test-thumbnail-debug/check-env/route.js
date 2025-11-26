import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Construct base URL safely
    let baseUrl;
    if (process.env.RENDER_EXTERNAL_URL) {
      baseUrl = process.env.RENDER_EXTERNAL_URL.startsWith('http')
        ? process.env.RENDER_EXTERNAL_URL
        : `https://${process.env.RENDER_EXTERNAL_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = process.env.VERCEL_URL.startsWith('http')
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    
    const env = {
      B2_KEY_ID: !!process.env.B2_KEY_ID,
      B2_APPLICATION_KEY: !!process.env.B2_APPLICATION_KEY,
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || null,
      B2_ENDPOINT: process.env.B2_ENDPOINT || null,
      RENDER_EXTERNAL_URL_RAW: process.env.RENDER_EXTERNAL_URL || null, // Show the actual value
      baseUrl,
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform
    };
    
    return NextResponse.json({
      success: true,
      env
    });
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
