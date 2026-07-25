import { initializeDatabase } from '@/core/db/init-db';
import { SearchInterface } from '@/modules/search/components/SearchInterface';
import { Search as SearchIcon } from 'lucide-react';

export const revalidate = 10;

export default async function SearchPage() {
  await initializeDatabase();

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <SearchIcon className="w-5 h-5" />
          </div>
          <span>Search</span>
        </h1>
      </div>

      <SearchInterface />
    </div>
  );
}
