import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { approveAIDraft } from '@/modules/drafts/services/draft-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await approveAIDraft(id, body.editedData);

    return NextResponse.json({
      status: 'ok',
      message: 'AI Draft approved and committed to database successfully!',
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 400 }
    );
  }
}
