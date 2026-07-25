/**
 * Standalone Database Data Cleanup Script
 * Cleans all data tables except system_settings and ai_provider_settings.
 *
 * Usage: npx tsx scripts/clean-db.ts
 */
import { db } from '../src/core/db';
import { sql } from 'drizzle-orm';

async function cleanDatabase() {
  console.log('Cleaning remote database data (preserving system & AI provider settings)...');

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
      console.log(`✓ Cleared table: ${table}`);
    } catch (err: any) {
      console.warn(`! Table ${table} warning/error:`, err.message || err);
    }
  }

  try {
    await db.run(sql`DELETE FROM content_fts;`);
    console.log('✓ Cleared FTS index: content_fts');
  } catch (err: any) {
    console.warn('! content_fts clear warning:', err.message || err);
  }

  console.log('✅ Remote database data successfully cleaned! Settings preserved.');
}

cleanDatabase().catch((err) => {
  console.error('Clean database failed:', err);
  process.exit(1);
});
