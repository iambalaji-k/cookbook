import { NextResponse } from 'next/server';
import { getRatingSummary, addOrUpdateRating } from '@/modules/content/services/rating-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const summary = await getRatingSummary(id);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch rating summary' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, userIdentifier } = body;

    if (!rating || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
    }

    const summary = await addOrUpdateRating(id, rating, userIdentifier || 'guest');
    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit rating' }, { status: 500 });
  }
}
