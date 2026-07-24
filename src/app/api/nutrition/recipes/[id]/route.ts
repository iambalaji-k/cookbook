import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntityById } from '@/modules/content/services/content-service';
import { getRecipeNutrition, calculateAndCacheRecipeNutrition } from '@/modules/nutrition/services/calculator-service';
import { DVProfile } from '@/modules/nutrition/utils/daily-values';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dvProfile = (searchParams.get('dvProfile') as DVProfile) || 'US_FDA';
    const forceRecalculate = searchParams.get('recalculate') === 'true';

    // Resolve slug to UUID if needed
    const entity = await getContentEntityById(id);
    if (!entity) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    const recipeId = entity.id;

    let nutrition = forceRecalculate
      ? await calculateAndCacheRecipeNutrition(recipeId, dvProfile)
      : await getRecipeNutrition(recipeId);

    if (!nutrition) {
      nutrition = await calculateAndCacheRecipeNutrition(recipeId, dvProfile);
    }

    if (!nutrition) {
      return NextResponse.json({ error: 'Recipe not found or calculation failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: nutrition });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    // Resolve slug to UUID if needed
    const entity = await getContentEntityById(id);
    if (!entity) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    const recipeId = entity.id;

    const body = await request.json().catch(() => ({}));
    const dvProfile = (body.dvProfile as DVProfile) || 'US_FDA';

    const nutrition = await calculateAndCacheRecipeNutrition(recipeId, dvProfile);

    if (!nutrition) {
      return NextResponse.json({ error: 'Recipe recalculation failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: nutrition });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
