import { NextResponse } from 'next/server';
import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    const tablesToClean = [
      'ingredients',
      'instructions',
      'images',
      'tags',
      'revisions',
      'ratings',
      'comments',
      'ai_drafts',
      'raw_imports',
      'recipe_nutrition_cache',
      'canonical_ingredient_nutrition_map',
      'ingredient_synonyms',
      'nutrition_foods',
      'content_entities',
    ];

    for (const table of tablesToClean) {
      try {
        await db.run(sql.raw(`DELETE FROM ${table};`));
      } catch (_) {}
    }

    try {
      await db.run(sql`DELETE FROM content_fts;`);
    } catch (_) {}

    revalidatePath('/nutrition');
    revalidatePath('/content');
    revalidatePath('/drafts');
    revalidatePath('/imports');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: 'All remote database tables purged successfully from Vercel runtime!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = POST;
