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

const CLIENT_PROFILES = [
  {
    clientName: 'IOS',
    clientVersion: '20.10.4',
    clientNameHeader: '5',
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    context: {
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      platform: 'MOBILE',
      osName: 'iOS',
      osVersion: '18.3.2.22D82',
    },
  },
  {
    clientName: 'ANDROID_VR',
    clientVersion: '1.62.20',
    clientNameHeader: '28',
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.62.20 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    context: {
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      platform: 'MOBILE',
      osName: 'Android',
      osVersion: '12L',
      androidSdkVersion: 32,
    },
  },
];

function parseJSONBraces(str: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) return str.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

export async function extractYouTubeCaptionsClient(url: string): Promise<YouTubeExtractionResult> {
  const videoID = extractYouTubeVideoID(url);
  if (!videoID) {
    throw new Error('Could not extract YouTube video ID from the provided URL.');
  }

  let playerData: any = null;

  // 1. Fetch metadata & caption tracks using YouTube InnerTube player endpoint
  for (const client of CLIENT_PROFILES) {
    try {
      const body = {
        context: {
          client: {
            clientName: client.clientName,
            clientVersion: client.clientVersion,
            hl: 'en',
            gl: 'US',
            ...client.context,
          },
          user: { lockedSafetyMode: false },
          request: { useSsl: true },
        },
        videoId: videoID,
        contentCheckOk: true,
        racyCheckOk: true,
      };

      const res = await fetch('https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'User-Agent': client.userAgent,
          'X-YouTube-Client-Name': client.clientNameHeader,
          'X-YouTube-Client-Version': client.clientVersion,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.playabilityStatus?.status === 'OK' || json.videoDetails) {
          playerData = json;
          const tracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (tracks && tracks.length > 0) break;
        }
      }
    } catch (_) {}
  }

  // 2. Fallback to HTML watch page via CORS proxy if InnerTube player endpoint didn't return caption tracks (or hit CORS block in browser)
  if (!playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoID}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const keyIdx = html.indexOf('ytInitialPlayerResponse');
        if (keyIdx !== -1) {
          const startIdx = html.indexOf('{', keyIdx);
          const jsonStr = parseJSONBraces(html, startIdx);
          if (jsonStr) {
            playerData = JSON.parse(jsonStr);
          }
        }
      }
    } catch (_) {}
  }

  const videoTitle = playerData?.videoDetails?.title || null;
  const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions/subtitles found for this video.');
  }

  // Select English or first available caption track
  const track = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || captionTracks[0];

  // 3. Fetch caption track formatted as json3
  let captionUrl = track.baseUrl.replace(/&fmt=[^&]+/, '');
  captionUrl += '&fmt=json3';

  let captionRes: Response | null = null;
  try {
    captionRes = await fetch(captionUrl);
  } catch (_) {}

  if (!captionRes || !captionRes.ok) {
    captionRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(captionUrl)}`);
  }

  if (!captionRes.ok) {
    throw new Error('Failed to fetch transcript data from YouTube.');
  }

  const captionText = await captionRes.text();
  let captionJson: any;
  try {
    captionJson = JSON.parse(captionText);
  } catch (_) {
    throw new Error('Transcript response returned invalid format.');
  }

  const events = captionJson.events || [];
  const lines: string[] = [];

  for (const event of events) {
    if (!event.segs || event.aAppend === 1) continue;
    const text = event.segs.map((s: any) => s.utf8 || '').join('').trim();
    if (text) lines.push(text);
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
