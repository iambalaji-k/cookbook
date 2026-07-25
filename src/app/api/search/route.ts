import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { searchContentFTS } from '@/modules/search/services/search-service';
import { cacheHeaders } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || undefined;

    const results = await searchContentFTS(query, type);
    return NextResponse.json({ status: 'ok', data: results }, { headers: cacheHeaders(15, 60) });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
