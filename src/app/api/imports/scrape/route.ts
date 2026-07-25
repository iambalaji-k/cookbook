import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string' || !/^https?:\/\/.+/i.test(url)) {
      return NextResponse.json(
        { status: 'error', message: 'Valid HTTP/HTTPS URL is required' },
        { status: 400 }
      );
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const isPrivate = 
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

      if (isPrivate) {
        return NextResponse.json(
          { status: 'error', message: 'Requests to internal or private networks are blocked.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch raw HTML from target web recipe URL
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch URL (HTTP ${res.status}): ${res.statusText}`);
    }

    const html = await res.text();

    // 1. Check if JSON-LD schema.org/Recipe exists
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    let recipeSchemaText = '';

    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonText = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const parsed = JSON.parse(jsonText);
          const recipeObj = Array.isArray(parsed)
            ? parsed.find((item) => item['@type'] === 'Recipe' || item['@type']?.includes('Recipe'))
            : parsed['@graph']
            ? parsed['@graph'].find((item: any) => item['@type'] === 'Recipe' || item['@type']?.includes('Recipe'))
            : parsed['@type'] === 'Recipe'
            ? parsed
            : null;

          if (recipeObj) {
            recipeSchemaText = JSON.stringify(recipeObj, null, 2);
            break;
          }
        } catch (_) {}
      }
    }

    // 2. Extract clean body text (strip script, style, nav, footer tags)
    let bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit fallback text length
    if (bodyText.length > 12000) {
      bodyText = bodyText.substring(0, 12000) + '... [truncated]';
    }

    const finalRawPayload = recipeSchemaText
      ? `RECIPE JSON-LD METADATA:\n${recipeSchemaText}\n\nPAGE BODY TEXT:\n${bodyText}`
      : bodyText;

    return NextResponse.json({
      status: 'ok',
      message: 'Recipe page scraped successfully',
      sourceUrl: url,
      rawPayload: finalRawPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: `Web Scraper Error: ${error.message}` },
      { status: 500 }
    );
  }
}
