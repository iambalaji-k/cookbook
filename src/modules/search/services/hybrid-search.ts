import { interpretNaturalLanguageQuery, type NLQueryInterpretation } from './nl-interpreter';
import { searchContentFTS, type SearchResultItem } from './search-service';
import { db } from '@/core/db';
import { contentEntities } from '@/core/db/schema';
import { inArray } from 'drizzle-orm';

export interface HybridSearchResult {
  interpretation: NLQueryInterpretation;
  results: Array<SearchResultItem & { totalTimeMinutes?: number }>;
}

/**
 * Executes Hybrid Search: Combines AI Natural Language Query Interpretation with FTS5 BM25 ranking and structured constraint filtering.
 */
export async function executeHybridSearch(rawQuery: string): Promise<HybridSearchResult> {
  // 1. Interpret natural language query into structured constraints
  const interpretation = await interpretNaturalLanguageQuery(rawQuery);

  // 2. Formulate keyword search string from extracted keywords
  const keywordQuery = interpretation.keywords.join(' ');

  // 3. Perform FTS5 search
  const candidates = await searchContentFTS(keywordQuery, interpretation.contentType || undefined, 30);

  // 4. Apply structured constraint filtering (total cook time, cuisine, difficulty)
  const filtered: Array<SearchResultItem & { totalTimeMinutes?: number }> = [];

  if (candidates.length === 0) {
    return { interpretation, results: [] };
  }

  // Batch-fetch full entity details for all candidates in one query
  const entityIds = candidates.map((c) => c.id);
  const fullEntities = await db
    .select()
    .from(contentEntities)
    .where(inArray(contentEntities.id, entityIds));
  const entityMap = new Map(fullEntities.map((e) => [e.id, e]));

  for (const candidate of candidates) {
    const fullEntity = entityMap.get(candidate.id);
    if (!fullEntity) continue;

    const prep = fullEntity.prepTimeMinutes || 0;
    const cook = fullEntity.cookTimeMinutes || 0;
    const totalTime = prep + cook;

    // Filter by maxTotalTimeMinutes
    if (interpretation.maxTotalTimeMinutes && totalTime > 0 && totalTime > interpretation.maxTotalTimeMinutes) {
      continue;
    }

    // Filter by cuisine
    if (interpretation.cuisine && fullEntity.cuisine && !fullEntity.cuisine.toLowerCase().includes(interpretation.cuisine.toLowerCase())) {
      continue;
    }

    // Filter by difficulty
    if (interpretation.difficulty && fullEntity.difficulty && fullEntity.difficulty !== interpretation.difficulty) {
      continue;
    }

    filtered.push({
      ...candidate,
      totalTimeMinutes: totalTime,
    });
  }

  return {
    interpretation,
    results: filtered,
  };
}
