import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { searchNutritionFoods, createCustomFoodAndMap } from '@/modules/nutrition/services/nutrition-service';
import { calculateAndCacheRecipeNutrition } from '@/modules/nutrition/services/calculator-service';
import { manualEntrySchema } from '@/modules/nutrition/validation/nutrition-schema';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const foods = await searchNutritionFoods(query);
    return NextResponse.json({ success: true, data: foods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = manualEntrySchema.parse(body);

    const { food, mappedName } = await createCustomFoodAndMap({
      ...parsed,
      ingredientNameToMap: parsed.ingredientName,
      approvedBy: 'User/Admin',
    });

    // If recipeId is provided, trigger instant recalculation
    const recipeId = body.recipeId;
    let updatedNutrition = null;
    if (recipeId) {
      updatedNutrition = await calculateAndCacheRecipeNutrition(recipeId);
    }

    return NextResponse.json({
      success: true,
      data: food,
      mappedName,
      updatedNutrition,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Validation or database error' }, { status: 400 });
  }
}
