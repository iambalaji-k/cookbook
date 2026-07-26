import { NextResponse } from 'next/server';
import { getVideoDetails } from 'youtube-caption-extractor';

export const maxDuration = 30;

function extractYouTubeVideoID(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Proxy/header wrapper for devhims/youtube-caption-extractor to bypass IP rate limits
const customProxyFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const targetUrl = typeof input === 'string' ? input : input.toString();

  // If fetching caption track from timedtext API, route GET request through proxy if direct call returns 429
  if (targetUrl.includes('/api/timedtext')) {
    try {
      const directRes = await fetch(targetUrl, {
        ...init,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      });

      if (directRes.ok) {
        return directRes;
      }
    } catch (_) {}

    // Proxy fallback for timedtext
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    return fetch(proxyUrl, { cache: 'no-store' });
  }

  return fetch(input, { ...init, cache: 'no-store' });
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { status: 'error', message: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoID = extractYouTubeVideoID(url);
    if (!videoID) {
      return NextResponse.json(
        { status: 'error', message: 'Could not extract YouTube video ID from the provided URL' },
        { status: 400 }
      );
    }

    let details;
    try {
      details = await getVideoDetails({ videoID, lang: 'en', fetch: customProxyFetch as typeof fetch });
    } catch (_) {
      try {
        details = await getVideoDetails({ videoID, fetch: customProxyFetch as typeof fetch });
      } catch (_) {}
    }

    if (!details || !details.subtitles || details.subtitles.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No captions/subtitles found for this video or YouTube rate limit hit.',
        },
        { status: 429 }
      );
    }

    const transcript = details.subtitles
      .map((s) => s.text)
      .join('\n');

    const rawPayload = details.title
      ? `YOUTUBE VIDEO TITLE: ${details.title}\n\nTRANSCRIPT:\n${transcript}`
      : transcript;

    return NextResponse.json({
      status: 'ok',
      message: 'YouTube captions extracted successfully using devhims/youtube-caption-extractor',
      sourceUrl: url,
      videoTitle: details.title,
      videoDescription: details.description,
      rawPayload,
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('Video unavailable') || msg.includes('private')) {
      return NextResponse.json(
        { status: 'error', message: 'This video is unavailable or private' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: `Caption extraction failed: ${msg}` },
      { status: 500 }
    );
  }
}
