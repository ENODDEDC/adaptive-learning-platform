import { NextResponse } from 'next/server';

/**
 * Verifies that a URL points to a video by doing a HEAD request
 * and checking the Content-Type header.
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

    // Try HEAD request first (faster, no body download)
    try {
      const headRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoVerifier/1.0)',
        },
      });

      const contentType = headRes.headers.get('content-type') || '';

      if (contentType.startsWith('video/')) {
        return NextResponse.json({ isVideo: true, contentType });
      }

      // Some servers return text/html for video pages (embeds) — allow those too
      // but reject clearly non-video types
      const nonVideoTypes = ['application/json', 'application/xml', 'text/css', 'application/javascript'];
      if (nonVideoTypes.some(t => contentType.startsWith(t))) {
        return NextResponse.json({
          isVideo: false,
          reason: `This URL returns ${contentType}, not a video. Make sure it links directly to a video.`
        });
      }

      // If content-type is text/html or unknown, it might be an embeddable page — allow it
      // The browser will handle whether it can actually play
      if (headRes.ok || headRes.status === 206) {
        return NextResponse.json({ isVideo: true, contentType, note: 'Accepted as potentially embeddable' });
      }

      return NextResponse.json({
        isVideo: false,
        reason: `URL returned HTTP ${headRes.status}. Make sure the video is publicly accessible.`
      });

    } catch (fetchError) {
      // HEAD request failed — try GET with range to get just headers
      try {
        const getRes = await fetch(url, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0',
            'User-Agent': 'Mozilla/5.0 (compatible; VideoVerifier/1.0)',
          },
          signal: AbortSignal.timeout(8000),
        });

        const contentType = getRes.headers.get('content-type') || '';
        if (contentType.startsWith('video/') || getRes.ok) {
          return NextResponse.json({ isVideo: true, contentType });
        }

        return NextResponse.json({
          isVideo: false,
          reason: 'Could not access this URL. Make sure the video is publicly accessible.'
        });
      } catch {
        return NextResponse.json({
          isVideo: false,
          reason: 'Could not reach this URL. Check that it is publicly accessible and try again.'
        });
      }
    }

  } catch (error) {
    return NextResponse.json({ isVideo: false, reason: error.message }, { status: 500 });
  }
}
