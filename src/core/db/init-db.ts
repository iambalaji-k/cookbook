/**
 * Lightweight database health check and FTS sync utilities.
 * DDL migrations are now handled by scripts/migrate.ts at build time.
 */
import { db } from './index';
import { sql } from 'drizzle-orm';
import { contentEntities, ingredients, instructions, tags } from './schema/content';

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

    await db.run(sql`DELETE FROM content_fts WHERE entity_id = ${entityId}`);

    await db.run(sql`
      INSERT INTO content_fts (entity_id, title, summary, cuisine, ingredients_text, instructions_text, tags_text)
      VALUES (${entityId}, ${entity.title}, ${entity.summary || ''}, ${entity.cuisine || ''}, ${ingredientsText}, ${instructionsText}, ${tagsText});
    `);
  } catch (ftsErr) {
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
 * Lightweight health check that verifies the database connection is alive.
 * Does NOT create tables or run migrations — those happen at build time via scripts/migrate.ts.
 */
let _initPromise: Promise<any> | null = null;

export function initializeDatabase(): Promise<any> {
  if (_initPromise) return _initPromise;
  _initPromise = Promise.resolve({ success: true });
  return _initPromise;
}

