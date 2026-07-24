import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getContentEntities } from '@/modules/content/services/content-service';
import { ContentCard } from '@/modules/content/components/ContentCard';
import { Plus, BookOpen, Search } from 'lucide-react';

export const revalidate = 0;

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string }>;
}) {
  await initializeDatabase();
  const { type, search } = await searchParams;
  const items = await getContentEntities({ contentType: type, query: search });

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
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-400" />
            Culinary Content Library
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Polymorphic collection of recipes, techniques, ingredient guides, sauces, and kitchen tips.
          </p>
        </div>

        <Link
          href="/content/new"
          className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Content Entity</span>
        </Link>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = type === tab.value || (!type && !tab.value);
            return (
              <Link
                key={tab.label}
                href={tab.value ? `/content?type=${tab.value}` : '/content'}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {items.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel border border-neutral-800 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-neutral-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No content entities found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Create your first recipe or process a raw import to populate your culinary library.
            </p>
          </div>
          <Link
            href="/content/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Entity</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ContentCard key={item.id} entity={item as any} />
          ))}
        </div>
      )}
    </div>
  );
}
