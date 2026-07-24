import { initializeDatabase } from '@/core/db/init-db';
import { SearchInterface } from '@/modules/search/components/SearchInterface';
import { Search as SearchIcon, Zap } from 'lucide-react';

export const revalidate = 0;

export default async function SearchPage() {
  await initializeDatabase();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-orange-400" />
          Multi-Field Full-Text Search (FTS5)
        </h1>
        <p className="text-neutral-400 text-sm mt-1 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          Instant search across titles, ingredients, instructions, tags, summaries, and cuisines with BM25 ranking.
        </p>
      </div>

      <SearchInterface />
    </div>
  );
}
