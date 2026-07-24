import { initializeDatabase } from '@/db/init-db';
import { db } from '@/db';
import { contentEntities, aiDrafts, rawImports, revisions } from '@/db/schema';
import { count } from 'drizzle-orm';
import { 
  Sparkles, 
  FileText, 
  BookOpen, 
  ArrowRight,
  Layers,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const dbStatus = await initializeDatabase();
  
  let stats = {
    contentCount: 0,
    draftsCount: 0,
    importsCount: 0,
    revisionsCount: 0,
  };

  if (dbStatus.success) {
    try {
      const [cCount] = await db.select({ value: count() }).from(contentEntities);
      const [dCount] = await db.select({ value: count() }).from(aiDrafts);
      const [iCount] = await db.select({ value: count() }).from(rawImports);
      const [rCount] = await db.select({ value: count() }).from(revisions);

      stats = {
        contentCount: cCount?.value || 0,
        draftsCount: dCount?.value || 0,
        importsCount: iCount?.value || 0,
        revisionsCount: rCount?.value || 0,
      };
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Sleek Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Family Cookbook
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Your home for family recipes, techniques, and culinary knowledge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-sm shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Content</span>
          </Link>
        </div>
      </div>

      {/* Clean Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/content" className="p-5 rounded-2xl glass-panel border border-neutral-800 hover:border-orange-500/40 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Recipes & Guides</span>
            <BookOpen className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.contentCount}</p>
        </Link>

        <Link href="/drafts" className="p-5 rounded-2xl glass-panel border border-neutral-800 hover:border-amber-500/40 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Pending Drafts</span>
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.draftsCount}</p>
        </Link>

        <Link href="/imports" className="p-5 rounded-2xl glass-panel border border-neutral-800 hover:border-blue-500/40 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Raw Imports</span>
            <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.importsCount}</p>
        </Link>

        <div className="p-5 rounded-2xl glass-panel border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Revisions</span>
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.revisionsCount}</p>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/content"
          className="p-6 rounded-2xl glass-panel border border-neutral-800 hover:border-orange-500/50 transition-all group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
            Browse Recipes & Guides
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Manage recipes, cooking techniques, sauces, ingredient guides, and tips.
          </p>
        </Link>

        <Link
          href="/imports"
          className="p-6 rounded-2xl glass-panel border border-neutral-800 hover:border-blue-500/50 transition-all group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
            Import Source Material
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Save URLs, physical card scans, or plain text to raw imports for processing.
          </p>
        </Link>

        <Link
          href="/drafts"
          className="p-6 rounded-2xl glass-panel border border-neutral-800 hover:border-amber-500/50 transition-all group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
            AI Staging Queue
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Review side-by-side diffs of AI proposals before approving to the database.
          </p>
        </Link>
      </div>
    </div>
  );
}
