import { NextResponse } from 'next/server';

/**
 * Verifies that a URL points to a video by checking Content-Type header.
 * Only called for unknown/unrecognized URLs (not YouTube, Drive, Vimeo).
 * Must return video/* content-type to be accepted.
 */
export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ isVideo: false, reason: 'No URL provided.' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ isVideo: false, reason: 'Invalid URL format.' });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ isVideo: false, reason: 'Only HTTP/HTTPS URLs are supported.' });
    }

    // Try HEAD request first
    let contentType = '';
    let httpStatus = 0;

    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VideoVerifier/1.0)' },
      });
      contentType = headRes.headers.get('content-type') || '';
      httpStatus = headRes.status;
    } catch {
      // HEAD failed — try GET with Range header to fetch just the first byte
      try {
        const getRes = await fetch(url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0',
            'User-Agent': 'Mozilla/5.0 (compatible; VideoVerifier/1.0)',
          },
          signal: AbortSignal.timeout(8000),
        });
        contentType = getRes.headers.get('content-type') || '';
        httpStatus = getRes.status;
      } catch {
        return NextResponse.json({
          isVideo: false,
          reason: 'Could not reach this URL. Make sure it is publicly accessible.'
        });
      }
    }

    // STRICT: only accept video/* content-type
    if (contentType.startsWith('video/')) {
      return NextResponse.json({ isVideo: true, contentType });
    }

    // Anything else — reject with a clear reason
    if (contentType.startsWith('text/html')) {
      return NextResponse.json({
        isVideo: false,
        reason: 'This URL points to a webpage, not a video file. Use a direct video URL (e.g. ending in .mp4) or a supported platform like YouTube.'
      });
    }

    if (!httpStatus || httpStatus >= 400) {
      return NextResponse.json({
        isVideo: false,
        reason: `URL returned HTTP ${httpStatus || 'error'}. Make sure the video is publicly accessible.`
      });
    }

    return NextResponse.json({
      isVideo: false,
      reason: `This URL returns "${contentType || 'unknown content'}", not a video. Use a direct video file URL or a supported platform.`
    });

  } catch (error) {
    return NextResponse.json({ isVideo: false, reason: error.message }, { status: 500 });
  }
}
