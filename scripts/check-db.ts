import { db } from '../src/core/db';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  console.log('Inspecting current row counts in remote database...');

  const tables = [
    'content_entities',
    'ingredients',
    'instructions',
    'images',
    'tags',
    'revisions',
    'raw_imports',
    'ai_drafts',
    'ratings',
    'comments',
    'system_settings',
    'ai_provider_settings',
    'nutrition_foods',
    'canonical_ingredient_nutrition_map',
    'ingredient_synonyms',
    'recipe_nutrition_cache',
  ];

  for (const table of tables) {
    try {
      const res: any = await db.run(sql.raw(`SELECT count(*) as cnt FROM ${table};`));
      const count = res.rows?.[0]?.cnt ?? res.rows?.[0]?.[0] ?? 'N/A';
      console.log(`Table '${table}': ${count} rows`);
    } catch (err: any) {
      console.log(`Table '${table}': error (${err.message})`);
    }
  }
}

checkDatabase().catch(console.error);
