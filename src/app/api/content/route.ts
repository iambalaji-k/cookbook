import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntities, createContentEntity } from '@/modules/content/services/content-service';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const entities = await getContentEntities({ contentType: type, query: search });
    return NextResponse.json({ status: 'ok', data: entities });
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
