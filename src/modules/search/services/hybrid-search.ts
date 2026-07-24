import { interpretNaturalLanguageQuery, type NLQueryInterpretation } from './nl-interpreter';
import { searchContentFTS, type SearchResultItem } from './search-service';
import { getContentEntityById } from '@/modules/content/services/content-service';

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

  for (const candidate of candidates) {
    const fullEntity = await getContentEntityById(candidate.id);
    if (!fullEntity) continue;

    const prep = fullEntity.prepTimeMinutes || 0;
    const cook = fullEntity.cookTimeMinutes || 0;
    const totalTime = prep + cook;

    // Filter by maxTotalTimeMinutes
    if (interpretation.maxTotalTimeMinutes && totalTime > 0 && totalTime > interpretation.maxTotalTimeMinutes) {
      continue;
    }

    // Filter by cuisine
    if (interpretation.cuisine && fullEntity.cuisine && !new RegExp(interpretation.cuisine, 'i').test(fullEntity.cuisine)) {
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
