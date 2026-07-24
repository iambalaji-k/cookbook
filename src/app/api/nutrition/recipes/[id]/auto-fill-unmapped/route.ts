import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { calculateAndCacheRecipeNutrition } from '@/modules/nutrition/services/calculator-service';
import { fetchNutritionDataViaAISearch } from '@/modules/nutrition/services/ai-search-autofill';
import { createCustomFoodAndMap } from '@/modules/nutrition/services/nutrition-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id: recipeId } = await params;

    const body = await request.json();
    const { ingredients } = body as { ingredients: string[] };

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ingredients array is required' },
        { status: 400 }
      );
    }

    const results: Array<{ ingredient: string; status: string; foodName?: string; error?: string }> = [];

    for (const ingredientName of ingredients) {
      try {
        const nutritionData = await fetchNutritionDataViaAISearch(ingredientName);
        const { food } = await createCustomFoodAndMap({
          ...nutritionData,
          ingredientNameToMap: ingredientName,
          approvedBy: 'AI Auto-Fill Batch',
        });

        results.push({
          ingredient: ingredientName,
          status: 'mapped',
          foodName: food.foodName,
        });
      } catch (err: any) {
        results.push({
          ingredient: ingredientName,
          status: 'failed',
          error: err.message || 'Unknown error',
        });
      }
    }

    const mappingSuccess = results.filter((r) => r.status === 'mapped').length;

    const nutrition = await calculateAndCacheRecipeNutrition(recipeId);

    return NextResponse.json({
      success: true,
      mapped: mappingSuccess,
      failed: results.length - mappingSuccess,
      total: results.length,
      results,
      nutrition,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Auto-fill batch failed' },
      { status: 500 }
    );
  }
}
