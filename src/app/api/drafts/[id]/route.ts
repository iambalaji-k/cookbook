import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getAIDraftById } from '@/modules/drafts/services/draft-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const draft = await getAIDraftById(id);

    if (!draft) {
      return NextResponse.json(
        { status: 'error', message: 'AI Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'ok', data: draft });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
