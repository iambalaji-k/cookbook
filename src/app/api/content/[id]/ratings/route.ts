import { NextResponse } from 'next/server';
import { getRating, setRating } from '@/modules/content/services/rating-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getRating(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch rating' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating } = body;

    if (!rating || typeof rating !== 'number') {
      return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
    }

    const result = await setRating(id, rating);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit rating' }, { status: 500 });
  }
}
