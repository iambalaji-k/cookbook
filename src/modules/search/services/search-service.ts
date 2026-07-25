import { db } from '@/core/db';
import { contentEntities } from '@/core/db/schema';
import { sql, inArray } from 'drizzle-orm';

export interface SearchResultItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  summary?: string | null;
  cuisine?: string | null;
  difficulty?: string | null;
  imageUrl?: string | null;
  matchScore?: number;
  snippet?: string;
  matchedFields?: string[];
}

interface FTSRow {
  entity_id: string;
  title?: string;
  summary?: string;
  cuisine?: string;
  rank?: number;
  title_snippet?: string;
  ingredient_snippet?: string;
  instruction_snippet?: string;
}

interface FallbackRow {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  summary?: string | null;
  cuisine?: string | null;
  difficulty?: string | null;
  image_url?: string | null;
}

/**
 * Performs Multi-Field Full-Text Search with BM25 Relevance Ranking using SQLite FTS5.
 * Automatically falls back to multi-column LIKE search if FTS5 is unavailable.
 */
export async function searchContentFTS(
  query: string,
  contentType?: string,
  limit: number = 20
): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  // Sanitize FTS search terms (append wildcard * for prefix matching)
  const sanitizedFTSQuery = cleanQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => `${w}*`)
    .join(' ');

  if (!sanitizedFTSQuery) {
    return [];
  }

  try {
    // 1. Try SQLite FTS5 BM25 match query
    const ftsResults = await db.run(sql`
      SELECT 
        entity_id, 
        title, 
        summary, 
        cuisine, 
        bm25(content_fts) as rank,
        snippet(content_fts, 1, '<mark class="bg-amber-500/20 text-amber-300 px-1 rounded">', '</mark>', '...', 10) as title_snippet,
        snippet(content_fts, 4, '<mark class="bg-amber-500/20 text-amber-300 px-1 rounded">', '</mark>', '...', 12) as ingredient_snippet,
        snippet(content_fts, 5, '<mark class="bg-amber-500/20 text-amber-300 px-1 rounded">', '</mark>', '...', 15) as instruction_snippet
      FROM content_fts 
      WHERE content_fts MATCH ${sanitizedFTSQuery}
      ORDER BY rank ASC
      LIMIT ${limit};
    `);

    const rawRows = (ftsResults.rows || []) as unknown as FTSRow[];

    if (rawRows.length === 0) return [];

    // Batch-fetch entities in a single query instead of N+1
    const entityIds = rawRows.map((r) => r.entity_id);
    const entities = await db
      .select()
      .from(contentEntities)
      .where(inArray(contentEntities.id, entityIds));
    const entityMap = new Map(entities.map((e) => [e.id, e]));

    const results: SearchResultItem[] = [];

    for (const row of rawRows) {
      const entity = entityMap.get(row.entity_id);
      if (!entity) continue;

      if (contentType && contentType !== 'all' && entity.contentType !== contentType) {
        continue;
      }

      const snippet =
        row.ingredient_snippet ||
        row.instruction_snippet ||
        row.title_snippet ||
        entity.summary ||
        '';

      results.push({
        id: entity.id,
        title: entity.title,
        slug: entity.slug,
        contentType: entity.contentType,
        summary: entity.summary,
        cuisine: entity.cuisine,
        difficulty: entity.difficulty,
        imageUrl: entity.imageUrl,
        matchScore: row.rank,
        snippet,
      });
    }

    if (results.length > 0) {
      return results;
    }
  } catch (ftsErr) {
    console.warn('FTS5 Query Fallback Triggered:', ftsErr);
  }

  // 2. Fallback to SQL LIKE query across title, summary, cuisine, ingredients, instructions, tags
  const likeQuery = `%${cleanQuery}%`;
  const fallbackRows = await db.run(sql`
    SELECT DISTINCT c.id, c.title, c.slug, c.content_type, c.summary, c.cuisine, c.difficulty, c.image_url
    FROM content_entities c
    LEFT JOIN ingredients i ON i.entity_id = c.id
    LEFT JOIN instructions inst ON inst.entity_id = c.id
    LEFT JOIN tags t ON t.entity_id = c.id
    WHERE c.title LIKE ${likeQuery}
       OR c.summary LIKE ${likeQuery}
       OR c.cuisine LIKE ${likeQuery}
       OR i.item_name LIKE ${likeQuery}
       OR inst.instruction_text LIKE ${likeQuery}
       OR t.tag_name LIKE ${likeQuery}
    LIMIT ${limit};
  `);

  const fallbackResults: SearchResultItem[] = [];
  const rows = (fallbackRows.rows || []) as unknown as FallbackRow[];
  for (const row of rows) {
    if (contentType && contentType !== 'all' && row.content_type !== contentType) {
      continue;
    }
    fallbackResults.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      contentType: row.content_type,
      summary: row.summary,
      cuisine: row.cuisine,
      difficulty: row.difficulty,
      imageUrl: row.image_url,
      snippet: row.summary || 'Matched search criteria',
    });
  }

  return fallbackResults;
}
