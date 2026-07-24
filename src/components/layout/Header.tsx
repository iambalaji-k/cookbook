'use client';

import Link from 'next/link';
import { Utensils, ShieldCheck, Cpu } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-neutral-800/80 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl amber-gradient-bg flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-neutral-100 tracking-tight flex items-center gap-2">
              AI Family Cookbook
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                v1.0 Skeleton
              </span>
            </span>
            <p className="text-xs text-neutral-400">Culinary Knowledge Base & AI Assistant</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Human Approval: Active</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>AI Gateway: OpenAI-Compatible</span>
          </div>
        </div>
      </div>
    </header>
  );
}
