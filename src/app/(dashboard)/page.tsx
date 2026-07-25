import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { contentEntities, aiDrafts } from '@/core/db/schema';
import { count, desc, eq, gte } from 'drizzle-orm';
import { 
  Sparkles, 
  BookOpen, 
  Plus,
  Activity,
  ArrowUpRight,
  Clock,
  Upload,
  Cpu,
  ChevronRight,
  UtensilsCrossed,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

export default async function DashboardPage() {
  const dbStatus = await initializeDatabase();
  
  let stats = {
    contentCount: 0,
    weeklyContentCount: 0,
    draftsCount: 0,
  };

  let recentContent: Array<typeof contentEntities.$inferSelect> = [];
  let recentDrafts: Array<typeof aiDrafts.$inferSelect> = [];

  if (dbStatus.success) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [[cCount], [weeklyCount], [pendingDraftsCount], recentContentData, recentDraftsData] = await Promise.all([
        db.select({ value: count() }).from(contentEntities),
        db.select({ value: count() }).from(contentEntities).where(gte(contentEntities.createdAt, sevenDaysAgo)),
        db.select({ value: count() }).from(aiDrafts).where(eq(aiDrafts.status, 'pending')),
        db.select().from(contentEntities).orderBy(desc(contentEntities.createdAt)).limit(4),
        db.select().from(aiDrafts).where(eq(aiDrafts.status, 'pending')).orderBy(desc(aiDrafts.createdAt)).limit(3),
      ]);

      stats = {
        contentCount: cCount?.value || 0,
        weeklyContentCount: weeklyCount?.value || 0,
        draftsCount: pendingDraftsCount?.value || 0,
      };

      recentContent = recentContentData;
      recentDrafts = recentDraftsData;
    } catch (e) {
      console.error(e);
    }
  }


  return (
    <div className="space-y-6 animate-hud-reveal">
      {/* Clean 2-Column Hero Metric Cards Grid (Recipes & Pending Drafts Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric 1: Recipes */}
        <Link 
          href="/content" 
          className="p-5 rounded-2xl elevation-level3 group relative overflow-hidden flex flex-col justify-between h-36 border border-neutral-800/80 hover:border-orange-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-zinc-200 uppercase tracking-wider">
              Recipes
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-500/25 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {stats.contentCount}
            </p>
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1 font-sans">
              <span className="text-orange-400 font-semibold">+{stats.weeklyContentCount} this week</span>
              <ArrowUpRight className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>

        {/* Metric 2: Staging Drafts */}
        <Link 
          href="/drafts" 
          className="p-5 rounded-2xl elevation-level3 elevation-level3-amber group relative overflow-hidden flex flex-col justify-between h-36 border border-neutral-800/80 hover:border-amber-500/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold text-zinc-200 uppercase tracking-wider">
              Drafts
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/25 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {stats.draftsCount}
            </p>
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1 font-sans">
              <span className="text-amber-400 font-semibold">{stats.draftsCount} Awaiting Review</span>
              <ArrowUpRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      </div>

      {/* Actionable Quick Command Toolbar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/content/new"
          className="p-3.5 rounded-xl elevation-level2 hover:elevation-level3 border border-neutral-800 hover:border-orange-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
              New Recipe
            </h4>
            <p className="text-[10px] font-mono text-zinc-400">Manual Entry</p>
          </div>
        </Link>

        <Link
          href="/imports/new"
          className="p-3.5 rounded-xl elevation-level2 hover:elevation-level3 border border-neutral-800 hover:border-cyan-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
            <Upload className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">
              Import Source
            </h4>
            <p className="text-[10px] font-mono text-zinc-400">URL / OCR Scan</p>
          </div>
        </Link>

        <Link
          href="/drafts"
          className="p-3.5 rounded-xl elevation-level2 hover:elevation-level3 border border-neutral-800 hover:border-amber-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
              Review AI Drafts
            </h4>
            <p className="text-[10px] font-mono text-zinc-400">Human Approval</p>
          </div>
        </Link>

        <Link
          href="/nutrition"
          className="p-3.5 rounded-xl elevation-level2 hover:elevation-level3 border border-neutral-800 hover:border-emerald-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              Nutrition Engine
            </h4>
            <p className="text-[10px] font-mono text-zinc-400">Macro Analysis</p>
          </div>
        </Link>
      </div>

      {/* Activity Streams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Recent Recipes Stream */}
        <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-700/70 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800/90 pb-3">
            <h3 className="font-hud text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-orange-400" />
              Recent Recipes
            </h3>
            <Link
              href="/content"
              className="text-xs font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentContent.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-sans text-zinc-300">No recipes in database yet.</p>
              <Link
                href="/content/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl amber-gradient-bg text-white font-mono text-xs font-semibold shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Recipe</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentContent.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.slug}`}
                  className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800/90 hover:border-orange-500/40 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold uppercase">
                        {item.contentType.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                      {item.cuisine && (
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 text-orange-400/80" />
                          {item.cuisine}
                        </span>
                      )}
                      {item.prepTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {item.prepTimeMinutes}m
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Staging Stream (Pending Drafts Only) */}
        <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-700/70 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800/90 pb-3">
            <h3 className="font-hud text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Staging Queue
            </h3>
            <Link
              href="/drafts"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Queue Status</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentDrafts.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-sans text-zinc-300">No pending AI drafts in staging.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentDrafts.map((draft) => {
                const payload = JSON.parse(draft.proposedDataJSON || '{}');
                return (
                  <Link
                    key={draft.id}
                    href={`/drafts/${draft.id}`}
                    className="p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800/90 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase">
                          {draft.targetContentType.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                          {payload.title || 'Untitled AI Draft'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-amber-400" />
                          {draft.provider}
                        </span>
                        <span>Confidence: {draft.confidence}/100</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
