import { Suspense } from 'react';
import { getContentEntities } from '@/modules/content/services/content-service';
import { ContentListClient } from '@/modules/content/components/ContentListClient';
import { BookOpen, Loader2 } from 'lucide-react';

export const revalidate = 30;

export default async function ContentListPage() {
  const items = await getContentEntities({ page: 1, limit: 24 });

  return (
    <Suspense
      fallback={
        <div className="space-y-4 w-full max-w-full animate-hud-reveal">
          <div className="border-b border-neutral-800/80 pb-3">
            <h1 className="font-hud text-xl sm:text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              CULINARY ARCHIVE
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-0.5">
              POLYMORPHIC ENTITY LIBRARY // RECIPES · GUIDES · SAUCES · TIPS
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        </div>
      }
    >
      <ContentListClient initialData={items as any} />
    </Suspense>
  );
}
