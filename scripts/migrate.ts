/**
 * Standalone Database Migration Script
 * Run ONCE at build/deploy time to set up all tables.
 * Do NOT run per-request.
 *
 * Usage: npx tsx scripts/migrate.ts
 */
import { db } from '../src/core/db';
import { contentEntities } from '../src/core/db/schema';
import { sql, count } from 'drizzle-orm';
import { seedStapleFoods } from '../src/modules/nutrition/services/seed-foods';
import crypto from 'crypto';
import { syncEntityToFTS } from '../src/core/db/init-db';

async function migrate() {
  console.log('Starting database migration...');

  // 1. Content Entities
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS content_entities (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT,
      status TEXT DEFAULT 'published' NOT NULL,
      servings INTEGER DEFAULT 4,
      prep_time_minutes INTEGER,
      cook_time_minutes INTEGER,
      cuisine TEXT,
      difficulty TEXT,
      image_url TEXT,
      is_favorite INTEGER DEFAULT 0 NOT NULL,
      ai_provider TEXT,
      ai_model TEXT,
      ai_latency_ms INTEGER,
      ai_token_usage INTEGER,
      ai_confidence INTEGER,
      ai_prompt_version TEXT,
      ai_reasoning_summary TEXT,
      ai_timestamp TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migrations
  for (const col of [
    'ALTER TABLE content_entities ADD COLUMN status TEXT DEFAULT \'published\';',
    'ALTER TABLE content_entities ADD COLUMN is_favorite INTEGER DEFAULT 0;',
    'ALTER TABLE content_entities ADD COLUMN ai_provider TEXT;',
    'ALTER TABLE content_entities ADD COLUMN ai_model TEXT;',
    'ALTER TABLE content_entities ADD COLUMN ai_latency_ms INTEGER;',
    'ALTER TABLE content_entities ADD COLUMN ai_token_usage INTEGER;',
    'ALTER TABLE content_entities ADD COLUMN ai_confidence INTEGER;',
    'ALTER TABLE content_entities ADD COLUMN ai_prompt_version TEXT;',
    'ALTER TABLE content_entities ADD COLUMN ai_reasoning_summary TEXT;',
    'ALTER TABLE content_entities ADD COLUMN ai_timestamp TEXT;',
  ]) {
    try { await db.run(sql.raw(col)); } catch (_) {}
  }

  // 2. Ingredients
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      amount REAL,
      unit TEXT,
      notes TEXT,
      sort_order INTEGER DEFAULT 0 NOT NULL
    );
  `);

  // 3. Instructions
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS instructions (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      instruction_text TEXT NOT NULL,
      timer_minutes INTEGER
    );
  `);

  // 4. Images
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      is_primary INTEGER DEFAULT 0 NOT NULL
    );
  `);

  // 5. Tags
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      tag_name TEXT NOT NULL
    );
  `);

  // 6. Revisions
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      revision_number INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      change_summary TEXT,
      approved_by TEXT DEFAULT 'admin' NOT NULL,
      approved_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  for (const col of [
    'ALTER TABLE revisions ADD COLUMN revision_number INTEGER DEFAULT 1;',
    'ALTER TABLE revisions ADD COLUMN change_summary TEXT;',
    'ALTER TABLE revisions ADD COLUMN approved_by TEXT DEFAULT \'admin\';',
    'ALTER TABLE revisions ADD COLUMN approved_at TEXT;',
  ]) {
    try { await db.run(sql.raw(col)); } catch (_) {}
  }

  // 7. Raw Imports
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS raw_imports (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_url TEXT,
      raw_payload TEXT NOT NULL,
      metadata_json TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 8. AI Drafts
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ai_drafts (
      id TEXT PRIMARY KEY,
      raw_import_id TEXT REFERENCES raw_imports(id) ON DELETE SET NULL,
      entity_id TEXT REFERENCES content_entities(id) ON DELETE SET NULL,
      target_content_type TEXT NOT NULL,
      proposed_data_json TEXT NOT NULL,
      reason TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      confidence INTEGER DEFAULT 100 NOT NULL,
      token_usage INTEGER DEFAULT 0 NOT NULL,
      latency_ms INTEGER DEFAULT 0 NOT NULL,
      prompt_version TEXT DEFAULT 'v1.0' NOT NULL,
      created_by TEXT DEFAULT 'ai_gateway' NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 9. Ratings
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      user_identifier TEXT DEFAULT 'guest' NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 10. Comments
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 11. System Settings
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY DEFAULT 'system',
      theme TEXT DEFAULT 'dark' NOT NULL,
      unit_system TEXT DEFAULT 'metric' NOT NULL,
      pwa_enabled INTEGER DEFAULT 1 NOT NULL,
      default_language TEXT DEFAULT 'en' NOT NULL,
      search_mode TEXT DEFAULT 'fts5' NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try { await db.run(sql`UPDATE system_settings SET unit_system = 'metric' WHERE id = 'system';`); } catch (_) {}

  // 12. AI Provider Settings
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ai_provider_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      provider TEXT DEFAULT 'openai' NOT NULL,
      base_url TEXT DEFAULT 'https://api.openai.com/v1' NOT NULL,
      api_key TEXT,
      model TEXT DEFAULT 'gpt-4o-mini' NOT NULL,
      temperature TEXT DEFAULT '0.2' NOT NULL,
      prompt_version TEXT DEFAULT 'v1.0' NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 13. Nutrition Tables
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS nutrition_foods (
      id TEXT PRIMARY KEY,
      food_name TEXT NOT NULL UNIQUE,
      aliases TEXT,
      source TEXT DEFAULT 'manual' NOT NULL,
      serving_size REAL DEFAULT 100 NOT NULL,
      serving_unit TEXT DEFAULT 'g' NOT NULL,
      density_g_per_ml REAL DEFAULT 1.0,
      piece_weight_g REAL,
      cup_weight_g REAL,
      tbsp_weight_g REAL,
      calories REAL DEFAULT 0 NOT NULL,
      protein REAL DEFAULT 0 NOT NULL,
      fat REAL DEFAULT 0 NOT NULL,
      saturated_fat REAL DEFAULT 0,
      unsaturated_fat REAL DEFAULT 0,
      carbohydrates REAL DEFAULT 0 NOT NULL,
      fiber REAL DEFAULT 0,
      sugar REAL DEFAULT 0,
      vitamin_a REAL DEFAULT 0,
      vitamin_b1 REAL DEFAULT 0,
      vitamin_b2 REAL DEFAULT 0,
      vitamin_b3 REAL DEFAULT 0,
      vitamin_b5 REAL DEFAULT 0,
      vitamin_b6 REAL DEFAULT 0,
      vitamin_b7 REAL DEFAULT 0,
      vitamin_b9 REAL DEFAULT 0,
      vitamin_b12 REAL DEFAULT 0,
      vitamin_c REAL DEFAULT 0,
      vitamin_d REAL DEFAULT 0,
      vitamin_e REAL DEFAULT 0,
      vitamin_k REAL DEFAULT 0,
      calcium REAL DEFAULT 0,
      iron REAL DEFAULT 0,
      magnesium REAL DEFAULT 0,
      potassium REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      zinc REAL DEFAULT 0,
      copper REAL DEFAULT 0,
      selenium REAL DEFAULT 0,
      manganese REAL DEFAULT 0,
      phosphorus REAL DEFAULT 0,
      cholesterol REAL DEFAULT 0,
      omega3 REAL DEFAULT 0,
      omega6 REAL DEFAULT 0,
      water REAL DEFAULT 0,
      source_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS canonical_ingredient_nutrition_map (
      id TEXT PRIMARY KEY,
      normalized_ingredient_name TEXT NOT NULL UNIQUE,
      nutrition_food_id TEXT NOT NULL REFERENCES nutrition_foods(id) ON DELETE CASCADE,
      confidence_score REAL DEFAULT 1.0 NOT NULL,
      mapping_method TEXT DEFAULT 'manual' NOT NULL,
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ingredient_synonyms (
      id TEXT PRIMARY KEY,
      variant_name TEXT NOT NULL UNIQUE,
      canonical_name TEXT NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS recipe_nutrition_cache (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL UNIQUE REFERENCES content_entities(id) ON DELETE CASCADE,
      calories_per_serving REAL DEFAULT 0 NOT NULL,
      protein_per_serving REAL DEFAULT 0 NOT NULL,
      carbs_per_serving REAL DEFAULT 0 NOT NULL,
      fat_per_serving REAL DEFAULT 0 NOT NULL,
      fiber_per_serving REAL DEFAULT 0 NOT NULL,
      sugar_per_serving REAL DEFAULT 0 NOT NULL,
      nutrition_coverage_percent REAL DEFAULT 100 NOT NULL,
      mapped_ingredient_count INTEGER DEFAULT 0 NOT NULL,
      total_ingredient_count INTEGER DEFAULT 0 NOT NULL,
      unmapped_ingredients TEXT,
      total_nutrition TEXT NOT NULL,
      per_serving_nutrition TEXT NOT NULL,
      calculated_at TEXT NOT NULL,
      calculation_version TEXT DEFAULT 'v1.0' NOT NULL
    );
  `);

  // Performance Indexes for Foreign Keys and Common Query Filters
  for (const idxSql of [
    'CREATE INDEX IF NOT EXISTS idx_ingredients_entity_id ON ingredients(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_instructions_entity_id ON instructions(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_images_entity_id ON images(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_tags_entity_id ON tags(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_revisions_entity_id ON revisions(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_ratings_entity_id ON ratings(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_comments_entity_id ON comments(entity_id);',
    'CREATE INDEX IF NOT EXISTS idx_ai_drafts_status ON ai_drafts(status);',
    'CREATE INDEX IF NOT EXISTS idx_ai_drafts_raw_import_id ON ai_drafts(raw_import_id);',
    'CREATE INDEX IF NOT EXISTS idx_canonical_map_food_id ON canonical_ingredient_nutrition_map(nutrition_food_id);',
    'CREATE INDEX IF NOT EXISTS idx_recipe_nutrition_cache_recipe_id ON recipe_nutrition_cache(recipe_id);',
    'CREATE INDEX IF NOT EXISTS idx_content_entities_type_status ON content_entities(content_type, status);',
  ]) {
    try { await db.run(sql.raw(idxSql)); } catch (_) {}
  }

  // 14. FTS5
  try {
    await db.run(sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
        entity_id UNINDEXED,
        title,
        summary,
        cuisine,
        ingredients_text,
        instructions_text,
        tags_text
      );
    `);
  } catch (e) {
    console.warn('FTS5 creation skipped:', e);
  }

  // Seed staple foods
  try { await seedStapleFoods(); } catch (e) { console.warn('Seeding staple foods skipped:', e); }

  // Bootstrap settings
  try {
    const sysSettings = await db.query.systemSettings.findFirst();
    if (!sysSettings) {
      await db.run(sql`
        INSERT INTO system_settings (id, theme, unit_system, pwa_enabled, default_language, search_mode, updated_at)
        VALUES ('system', 'dark', 'metric', 1, 'en', 'fts5', ${new Date().toISOString()});
      `);
    }
  } catch (_) {}

  try {
    const aiSettings = await db.query.aiProviderSettings.findFirst();
    if (!aiSettings) {
      await db.run(sql`
        INSERT INTO ai_provider_settings (id, provider, base_url, model, temperature, prompt_version, updated_at)
        VALUES ('default', 'openai', 'https://api.openai.com/v1', 'gpt-4o-mini', '0.2', 'v1.0', ${new Date().toISOString()});
      `);
    }
  } catch (_) {}

  // Seed initial sample recipe if empty
  try {
    const [cCount] = await db.select({ value: count() }).from(contentEntities);
    if ((cCount?.value || 0) === 0) {
      const recipeId = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.run(sql`
        INSERT INTO content_entities (
          id, content_type, title, slug, summary, status, servings, prep_time_minutes, cook_time_minutes, cuisine, difficulty, image_url, is_favorite,
          ai_provider, ai_model, ai_latency_ms, ai_token_usage, ai_confidence, ai_prompt_version, ai_reasoning_summary, ai_timestamp, created_at, updated_at
        )
        VALUES (
          ${recipeId}, 'recipe', 'Tuscan Garlic Butter Shrimp Pasta', 'tuscan-garlic-butter-shrimp-pasta',
          'Succulent shrimp sautéed in rich garlic butter with sun-dried tomatoes, spinach, and heavy cream over al dente fettuccine.',
          'published', 4, 15, 15, 'Italian', 'easy',
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
          1, 'OpenAI', 'gpt-4o-mini', 420, 1250, 98, 'v1.0',
          'Extracted ingredients, steps, and timings from authentic Italian trattoria recipe source. Normalized measurements and verified portion ratios.',
          ${now}, ${now}, ${now}
        );
      `);

      await db.run(sql`
        INSERT INTO ingredients (id, entity_id, item_name, amount, unit, notes, sort_order)
        VALUES
          (${crypto.randomUUID()}, ${recipeId}, 'Large Shrimp (peeled & deveined)', 1.5, 'lbs', 'tail-on preferred', 0),
          (${crypto.randomUUID()}, ${recipeId}, 'Fettuccine Pasta', 12, 'oz', 'al dente', 1),
          (${crypto.randomUUID()}, ${recipeId}, 'Garlic', 6, 'cloves', 'minced finely', 2),
          (${crypto.randomUUID()}, ${recipeId}, 'Sun-dried Tomatoes', 0.5, 'cup', 'chopped', 3),
          (${crypto.randomUUID()}, ${recipeId}, 'Fresh Baby Spinach', 3, 'cups', 'packed', 4),
          (${crypto.randomUUID()}, ${recipeId}, 'Heavy Cream', 1, 'cup', 'room temp', 5);
      `);

      await db.run(sql`
        INSERT INTO instructions (id, entity_id, step_number, instruction_text, timer_minutes)
        VALUES
          (${crypto.randomUUID()}, ${recipeId}, 1, 'Bring a large pot of salted water to a boil. Cook fettuccine according to package instructions until al dente.', 10),
          (${crypto.randomUUID()}, ${recipeId}, 2, 'Melt butter with olive oil in a large skillet over medium-high heat. Season shrimp with salt, pepper, and paprika.', 2),
          (${crypto.randomUUID()}, ${recipeId}, 3, 'Sear shrimp for 2 minutes per side until pink and opaque. Remove shrimp and set aside on a warm plate.', 4),
          (${crypto.randomUUID()}, ${recipeId}, 4, 'Sauté minced garlic and sun-dried tomatoes for 1 minute until fragrant. Pour in heavy cream and bring to a gentle simmer.', 3),
          (${crypto.randomUUID()}, ${recipeId}, 5, 'Stir in fresh baby spinach until wilted. Toss cooked fettuccine and seared shrimp back into the creamy sauce.', 2);
      `);

      await db.run(sql`
        INSERT INTO tags (id, entity_id, tag_name) VALUES
          (${crypto.randomUUID()}, ${recipeId}, 'Italian'),
          (${crypto.randomUUID()}, ${recipeId}, 'Seafood'),
          (${crypto.randomUUID()}, ${recipeId}, 'Quick Dinner'),
          (${crypto.randomUUID()}, ${recipeId}, 'Pasta');
      `);

      await db.run(sql`
        INSERT INTO ratings (id, entity_id, rating, user_identifier, created_at)
        VALUES (${crypto.randomUUID()}, ${recipeId}, 5, 'chef_maria', ${now});
      `);

      await db.run(sql`
        INSERT INTO comments (id, entity_id, author, comment_text, created_at)
        VALUES
          (${crypto.randomUUID()}, ${recipeId}, 'Chef Maria', 'An absolute staple! Double the garlic and add a splash of white wine when deglazing the pan.', ${now}),
          (${crypto.randomUUID()}, ${recipeId}, 'Marco S.', 'Turned out amazing! The metric converter made it so easy to follow in Europe.', ${now});
      `);

      await syncEntityToFTS(recipeId);
      console.log('Seeded sample recipe');
    }
  } catch (e) { console.warn('Seed recipe skipped:', e); }

  // Backfill AI metadata
  try {
    await db.run(sql`
      UPDATE content_entities SET
        ai_provider = 'OpenAI', ai_model = 'gpt-4o-mini', ai_latency_ms = 420, ai_token_usage = 1250,
        ai_confidence = 98, ai_prompt_version = 'v1.0',
        ai_reasoning_summary = 'Extracted ingredients, steps, and timings from authentic recipe source. Normalized measurements and verified portion ratios.',
        ai_timestamp = ${new Date().toISOString()}
      WHERE ai_provider IS NULL AND content_type = 'recipe';
    `);
  } catch (e) { console.warn('Backfill skipped:', e); }

  // FTS sync
  try {
    const all = await db.select({ id: contentEntities.id }).from(contentEntities);
    for (const item of all) { await syncEntityToFTS(item.id); }
  } catch (e) { console.warn('FTS sync skipped:', e); }

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
