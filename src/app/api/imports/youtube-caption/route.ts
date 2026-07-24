import { NextResponse } from 'next/server';
import { getVideoDetails } from 'youtube-caption-extractor';

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
      details = await getVideoDetails({ videoID, lang: 'en' });
    } catch (_) {
      details = await getVideoDetails({ videoID });
    }

    if (!details || !details.subtitles || details.subtitles.length === 0) {
      try {
        details = await getVideoDetails({ videoID });
      } catch (_) {}
    }

    if (!details || !details.subtitles || details.subtitles.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No captions/subtitles found for this video' },
        { status: 404 }
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
      message: 'YouTube captions extracted successfully',
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

    if (msg.includes('LOGIN_REQUIRED') || msg.includes('not a bot')) {
      return NextResponse.json(
        { status: 'error', message: 'YouTube is temporarily blocking this request. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { status: 'error', message: `Caption extraction failed: ${msg}` },
      { status: 500 }
    );
  }
}
