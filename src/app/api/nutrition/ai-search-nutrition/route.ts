import { NextRequest, NextResponse } from 'next/server';
import { fetchNutritionDataViaAISearch } from '@/modules/nutrition/services/ai-search-autofill';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredientName } = body;

    if (!ingredientName || typeof ingredientName !== 'string') {
      return NextResponse.json({ error: 'ingredientName is required' }, { status: 400 });
    }

    const data = await fetchNutritionDataViaAISearch(ingredientName);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI Search failed' }, { status: 500 });
  }
}
