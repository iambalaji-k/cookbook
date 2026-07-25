import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntities } from '@/modules/content/services/content-service';
import { ContentCard } from '@/modules/content/components/ContentCard';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export const revalidate = 30;

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string; q?: string; page?: string }>;
}) {
  await initializeDatabase();
  const { type, search, q, page } = await searchParams;
  const queryParam = q || search;
  const currentPage = parseInt(page || '1', 10);
  const pageSize = 24;
  const items = await getContentEntities({ contentType: type, query: queryParam, page: currentPage, limit: pageSize });

  const filterTabs = [
    { label: 'All', value: undefined },
    { label: 'Favorites ❤️', value: 'favorites' },
    { label: 'Recipes', value: 'recipe' },
    { label: 'Techniques', value: 'technique' },
    { label: 'Guides', value: 'ingredient_guide' },
    { label: 'Sauces', value: 'sauce' },
    { label: 'Spice Blends', value: 'spice_blend' },
    { label: 'Tips', value: 'kitchen_tip' },
  ];

  return (
    <div className="space-y-4 w-full max-w-full animate-hud-reveal">
      {/* Page Header (Tightened Spacing - Point 10) */}
      <div className="border-b border-neutral-800/80 pb-3">
        <h1 className="font-hud text-xl sm:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-400" />
          CULINARY ARCHIVE
        </h1>
        <p className="font-mono text-xs text-zinc-400 mt-0.5">
          POLYMORPHIC ENTITY LIBRARY // RECIPES · GUIDES · SAUCES · TIPS
        </p>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = type === tab.value || (!type && !tab.value);
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/content?type=${tab.value}` : '/content'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'glow-pill-amber font-bold text-orange-400 bg-orange-500/15 border-orange-500/40 shadow-sm'
                  : 'bg-neutral-900/80 border border-neutral-800 text-zinc-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Responsive Grid (Full Screen Canvas Utilization - Point 8) */}
      {items.length === 0 ? (
        <div className="p-12 rounded-2xl elevation-level2 border border-neutral-800 text-center space-y-4 my-4">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
          <div>
            <h3 className="font-hud text-sm font-bold text-white uppercase tracking-wider">NO ENTITIES FOUND</h3>
            <p className="font-mono text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No matching culinary entities found in your library.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 pt-2">
          {items.map((item) => (
            <ContentCard key={item.id} entity={item as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-4 pb-2">
          {currentPage > 1 && (
            <Link
              href={`/content${type ? `?type=${type}` : ''}${currentPage > 2 ? `&page=${currentPage - 1}` : ''}`}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Link>
          )}
          <span className="text-xs font-mono text-zinc-500">Page {currentPage}</span>
          <Link
            href={`/content${type ? `?type=${type}&` : '?'}page=${currentPage + 1}`}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
