import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { executeHybridSearch } from '@/modules/search/services/hybrid-search';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const query = body.query || '';

    const hybridResult = await executeHybridSearch(query);
    return NextResponse.json({
      status: 'ok',
      data: hybridResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: `Hybrid Search Failed: ${error.message}` },
      { status: 500 }
    );
  }
}
