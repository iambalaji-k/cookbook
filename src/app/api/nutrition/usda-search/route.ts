import { NextRequest, NextResponse } from 'next/server';
import { searchUSDAFoodDataCentral } from '@/modules/nutrition/services/usda-api-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredientName, apiKey } = body;

    if (!ingredientName || typeof ingredientName !== 'string') {
      return NextResponse.json({ error: 'ingredientName is required' }, { status: 400 });
    }

    const results = await searchUSDAFoodDataCentral(ingredientName, apiKey);
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error querying USDA FoodData Central API' },
      { status: 500 }
    );
  }
}
