import { db } from './index';
import { sql, count } from 'drizzle-orm';
import { contentEntities, ingredients, instructions, tags } from './schema/content';
import { aiDrafts } from './schema/drafts';

/**
 * Synchronizes a single content entity into the SQLite FTS5 search index (`content_fts`).
 */
export async function syncEntityToFTS(entityId: string) {
  try {
    const [entity] = await db
      .select()
      .from(contentEntities)
      .where(sql`id = ${entityId}`);

    if (!entity) return;

    const ingRows = await db
      .select()
      .from(ingredients)
      .where(sql`entity_id = ${entityId}`);

    const instRows = await db
      .select()
      .from(instructions)
      .where(sql`entity_id = ${entityId}`);

    const tagRows = await db
      .select()
      .from(tags)
      .where(sql`entity_id = ${entityId}`);

    const ingredientsText = ingRows.map((i) => `${i.amount || ''} ${i.unit || ''} ${i.itemName} ${i.notes || ''}`).join(' ');
    const instructionsText = instRows.map((i) => i.instructionText).join(' ');
    const tagsText = tagRows.map((t) => t.tagName).join(' ');

    // Delete existing FTS entry
    await db.run(sql`DELETE FROM content_fts WHERE entity_id = ${entityId}`);

    // Insert updated FTS entry
    await db.run(sql`
      INSERT INTO content_fts (entity_id, title, summary, cuisine, ingredients_text, instructions_text, tags_text)
      VALUES (${entityId}, ${entity.title}, ${entity.summary || ''}, ${entity.cuisine || ''}, ${ingredientsText}, ${instructionsText}, ${tagsText});
    `);
  } catch (ftsErr) {
    // If FTS5 is not available in local SQLite environment, skip gracefully
    console.warn('FTS Sync Skipped:', ftsErr);
  }
}

/**
 * Synchronizes all published content entities to FTS index.
 */
export async function syncAllEntitiesToFTS() {
  try {
    const all = await db.select({ id: contentEntities.id }).from(contentEntities);
    for (const item of all) {
      await syncEntityToFTS(item.id);
    }
  } catch (err) {
    console.warn('Sync all FTS skipped:', err);
  }
}

/**
 * Bootstraps all database tables, performs column migrations for existing databases, and seeds initial configuration records.
 */
export async function initializeDatabase() {
  try {
    // 1. Content Entities (Polymorphic Base)
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

    // Migrate status column and new columns if missing
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN status TEXT DEFAULT 'published';`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN is_favorite INTEGER DEFAULT 0;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_provider TEXT;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_model TEXT;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_latency_ms INTEGER;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_token_usage INTEGER;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_confidence INTEGER;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_prompt_version TEXT;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_reasoning_summary TEXT;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE content_entities ADD COLUMN ai_timestamp TEXT;`); } catch (_) {}

    // 2. Ingredients Sub-Table
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

    // 3. Instructions Sub-Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS instructions (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        instruction_text TEXT NOT NULL,
        timer_minutes INTEGER
      );
    `);

    // 4. Images Gallery Sub-Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        is_primary INTEGER DEFAULT 0 NOT NULL
      );
    `);

    // 5. Tags Sub-Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
        tag_name TEXT NOT NULL
      );
    `);

    // 6. Revisions Table
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

    // Migrate revisions columns if missing
    try { await db.run(sql`ALTER TABLE revisions ADD COLUMN revision_number INTEGER DEFAULT 1;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE revisions ADD COLUMN change_summary TEXT;`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE revisions ADD COLUMN approved_by TEXT DEFAULT 'admin';`); } catch (_) {}
    try { await db.run(sql`ALTER TABLE revisions ADD COLUMN approved_at TEXT;`); } catch (_) {}

    // 7. Raw Imports Table
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

    // 8. AI Drafts Table
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

    // 9. Ratings Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        user_identifier TEXT DEFAULT 'guest' NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 10. Comments Table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 11. System Settings Table
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

    // Force default unit system to metric for existing system_settings
    try {
      await db.run(sql`UPDATE system_settings SET unit_system = 'metric' WHERE id = 'system';`);
    } catch (_) {}

    // 12. AI Provider Settings Table
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

    // 13. SQLite FTS5 Virtual Table for Multi-Field Search
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
    } catch (ftsError) {
      console.warn('FTS5 table initialization skipped:', ftsError);
    }

    // Bootstrap initial setting rows if missing
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

    // Seed initial sample recipe gracefully if DB is empty
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
            ${recipeId}, 
            'recipe', 
            'Tuscan Garlic Butter Shrimp Pasta', 
            'tuscan-garlic-butter-shrimp-pasta', 
            'Succulent shrimp sautéed in rich garlic butter with sun-dried tomatoes, spinach, and heavy cream over al dente fettuccine.', 
            'published', 
            4, 
            15, 
            15, 
            'Italian', 
            'easy', 
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
            1,
            'OpenAI',
            'gpt-4o-mini',
            420,
            1250,
            98,
            'v1.0',
            'Extracted ingredients, steps, and timings from authentic Italian trattoria recipe source. Normalized measurements and verified portion ratios.',
            ${now}, 
            ${now}, 
            ${now}
          );
        `);

        // Ingredients
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

        // Instructions
        await db.run(sql`
          INSERT INTO instructions (id, entity_id, step_number, instruction_text, timer_minutes)
          VALUES 
            (${crypto.randomUUID()}, ${recipeId}, 1, 'Bring a large pot of salted water to a boil. Cook fettuccine according to package instructions until al dente.', 10),
            (${crypto.randomUUID()}, ${recipeId}, 2, 'Melt butter with olive oil in a large skillet over medium-high heat. Season shrimp with salt, pepper, and paprika.', 2),
            (${crypto.randomUUID()}, ${recipeId}, 3, 'Sear shrimp for 2 minutes per side until pink and opaque. Remove shrimp and set aside on a warm plate.', 4),
            (${crypto.randomUUID()}, ${recipeId}, 4, 'Sauté minced garlic and sun-dried tomatoes for 1 minute until fragrant. Pour in heavy cream and bring to a gentle simmer.', 3),
            (${crypto.randomUUID()}, ${recipeId}, 5, 'Stir in fresh baby spinach until wilted. Toss cooked fettuccine and seared shrimp back into the creamy sauce.', 2);
        `);

        // Tags
        await db.run(sql`
          INSERT INTO tags (id, entity_id, tag_name)
          VALUES 
            (${crypto.randomUUID()}, ${recipeId}, 'Italian'),
            (${crypto.randomUUID()}, ${recipeId}, 'Seafood'),
            (${crypto.randomUUID()}, ${recipeId}, 'Quick Dinner'),
            (${crypto.randomUUID()}, ${recipeId}, 'Pasta');
        `);

        // Sample Rating
        await db.run(sql`
          INSERT INTO ratings (id, entity_id, rating, user_identifier, created_at)
          VALUES (${crypto.randomUUID()}, ${recipeId}, 5, 'chef_maria', ${now});
        `);

        // Sample Comments
        await db.run(sql`
          INSERT INTO comments (id, entity_id, author, comment_text, created_at)
          VALUES 
            (${crypto.randomUUID()}, ${recipeId}, 'Chef Maria', 'An absolute staple! Double the garlic and add a splash of white wine when deglazing the pan.', ${now}),
            (${crypto.randomUUID()}, ${recipeId}, 'Marco S.', 'Turned out amazing! The metric converter made it so easy to follow in Europe.', ${now});
        `);

        await syncEntityToFTS(recipeId);
      }
    } catch (seedError) {
      console.warn('Sample seed insertion skipped:', seedError);
    }

    // Initial FTS sync for existing records
    await syncAllEntitiesToFTS();

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}
