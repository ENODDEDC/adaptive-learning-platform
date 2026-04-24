import { NextResponse } from 'next/server';

/**
 * Fetches YouTube transcript using:
 * 1. timedtext endpoint (free, no API key, works for videos with captions)
 * 2. oEmbed fallback (title + description for all videos)
 */

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#\s]+)/);
  return match ? match[1] : null;
}

async function fetchTimedText(videoId) {
  try {
    // Try English captions first, then auto-generated
    const langs = ['en', 'en-US', 'en-GB', 'a.en'];
    
    for (const lang of langs) {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) continue;

      const data = await res.json();
      const events = data?.events;
      if (!events || events.length === 0) continue;

      // Parse caption events into plain text
      const lines = [];
      for (const event of events) {
        if (!event.segs) continue;
        const line = event.segs
          .map(seg => seg.utf8 || '')
          .join('')
          .replace(/\n/g, ' ')
          .trim();
        if (line && line !== '\n') lines.push(line);
      }

      const text = lines.join(' ').replace(/\s+/g, ' ').trim();
      if (text.length > 100) {
        return { text, source: 'captions', lang };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchOEmbed(videoUrl) {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || '',
      author: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || null
    };
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Step 1: Try to get captions via timedtext
    const captionResult = await fetchTimedText(videoId);

    // Step 2: Always get oEmbed metadata (title, author)
    const oEmbed = await fetchOEmbed(videoUrl);

    if (captionResult) {
      // Full transcript available — combine with title for better context
      const fullText = oEmbed?.title
        ? `Video Title: ${oEmbed.title}\nBy: ${oEmbed.author || 'Unknown'}\n\nTranscript:\n${captionResult.text}`
        : captionResult.text;

      return NextResponse.json({
        success: true,
        transcript: fullText,
        source: 'captions',
        videoId,
        title: oEmbed?.title || null,
        author: oEmbed?.author || null,
        thumbnailUrl: oEmbed?.thumbnailUrl || null,
        hasFullTranscript: true
      });
    }

    if (oEmbed?.title) {
      // No captions — use title + description as context
      const contextText = `Video Title: ${oEmbed.title}\nBy: ${oEmbed.author || 'Unknown'}\n\nThis is an educational video about: ${oEmbed.title}. Generate learning content based on this topic.`;

      return NextResponse.json({
        success: true,
        transcript: contextText,
        source: 'oembed',
        videoId,
        title: oEmbed.title,
        author: oEmbed.author || null,
        thumbnailUrl: oEmbed.thumbnailUrl || null,
        hasFullTranscript: false
      });
    }

    return NextResponse.json({
      error: 'Could not extract transcript or metadata from this video',
      videoId
    }, { status: 422 });

  } catch (error) {
    console.error('YouTube transcript error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
