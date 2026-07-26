export interface YouTubeExtractionResult {
  videoTitle: string | null;
  rawPayload: string;
}

export function extractYouTubeVideoID(url: string): string | null {
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

export async function extractYouTubeCaptionsClient(url: string): Promise<YouTubeExtractionResult> {
  const videoID = extractYouTubeVideoID(url);
  if (!videoID) {
    throw new Error('Could not extract YouTube video ID from the provided URL');
  }

  // 1. Fetch video page via CORS proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoID}`)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error('Failed to fetch YouTube video page from client browser.');
  }

  const html = await res.text();

  // 2. Extract ytInitialPlayerResponse JSON
  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!match) {
    throw new Error('Could not parse YouTube video metadata.');
  }

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(match[1]);
  } catch (_) {
    throw new Error('Failed to parse YouTube player response.');
  }

  const videoTitle = playerResponse?.videoDetails?.title || null;
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions/subtitles found for this video.');
  }

  // 3. Select English or first available caption track
  const track = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || captionTracks[0];
  const captionRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(track.baseUrl)}`);
  if (!captionRes.ok) {
    throw new Error('Failed to fetch caption transcript XML.');
  }
  const captionXml = await captionRes.text();

  // 4. Parse XML text content
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(captionXml, 'text/xml');
  const textNodes = xmlDoc.getElementsByTagName('text');

  const lines: string[] = [];
  for (let i = 0; i < textNodes.length; i++) {
    const text = textNodes[i].textContent || '';
    const decoded = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (decoded.trim()) lines.push(decoded.trim());
  }

  const transcript = lines.join('\n');
  if (!transcript.trim()) {
    throw new Error('Extracted transcript was empty.');
  }

  const rawPayload = videoTitle
    ? `YOUTUBE VIDEO TITLE: ${videoTitle}\n\nTRANSCRIPT:\n${transcript}`
    : transcript;

  return { videoTitle, rawPayload };
}
