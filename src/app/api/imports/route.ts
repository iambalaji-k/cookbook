import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getRawImports, createRawImport } from '@/modules/imports/services/import-service';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'processed' | 'failed' | null;

    const records = await getRawImports(status || undefined);
    return NextResponse.json({ status: 'ok', data: records });
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
    const created = await createRawImport(body);
    return NextResponse.json({ status: 'ok', data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}
