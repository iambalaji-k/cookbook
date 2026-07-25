import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { calculateAndCacheRecipeNutrition } from '@/modules/nutrition/services/calculator-service';
import { fetchNutritionDataViaAISearch } from '@/modules/nutrition/services/ai-search-autofill';
import { createCustomFoodAndMap } from '@/modules/nutrition/services/nutrition-service';

export const maxDuration = 60;

const CONCURRENCY = 3;

async function processIngredient(ingredientName: string) {
  try {
    const nutritionData = await fetchNutritionDataViaAISearch(ingredientName);
    const { food } = await createCustomFoodAndMap({
      ...nutritionData,
      ingredientNameToMap: ingredientName,
      approvedBy: 'AI Auto-Fill Batch',
    });
    return { ingredient: ingredientName, status: 'mapped' as const, foodName: food.foodName };
  } catch (err: any) {
    return { ingredient: ingredientName, status: 'failed' as const, error: err.message || 'Unknown error' };
  }
}

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

    for (let i = 0; i < ingredients.length; i += CONCURRENCY) {
      const batch = ingredients.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(processIngredient));
      results.push(...batchResults);
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
