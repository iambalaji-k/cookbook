import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getAIDrafts, createAIDraft } from '@/modules/drafts/services/draft-service';
import { cacheHeaders } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    const drafts = await getAIDrafts(status || undefined);
    return NextResponse.json({ status: 'ok', data: drafts }, { headers: cacheHeaders(30, 120) });
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
    const created = await createAIDraft(body);
    return NextResponse.json({ status: 'ok', data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}
