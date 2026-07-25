import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntities, createContentEntity } from '@/modules/content/services/content-service';
import { cacheHeaders } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true' || searchParams.get('favorites') === 'true' || type === 'favorites';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    const entities = await getContentEntities({ contentType: type, query: search, favoritesOnly, page, limit });
    return NextResponse.json({ status: 'ok', data: entities }, { headers: cacheHeaders(30, 120) });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const created = await createContentEntity(body);
    return NextResponse.json({ status: 'ok', data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}
