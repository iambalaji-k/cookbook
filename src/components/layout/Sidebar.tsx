'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Search, 
  Settings, 
  Home, 
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home, code: 'HOME' },
  { name: 'Recipes & Guides', href: '/content', icon: BookOpen, code: 'RECIPES' },
  { name: 'Nutrition Engine', href: '/nutrition', icon: Activity, code: 'NUTRITION' },
  { name: 'Import', href: '/imports', icon: FileText, code: 'IMPORTS' },
  { name: 'AI Staging Queue', href: '/drafts', icon: Sparkles, code: 'DRAFTS' },
  { name: 'Search', href: '/search', icon: Search, code: 'SEARCH' },
  { name: 'Settings', href: '/settings', icon: Settings, code: 'CONFIG' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        "sticky top-[61px] h-[calc(100vh-61px)] elevation-level2 border-r border-neutral-800/90 p-2 sm:p-3 transition-all duration-300 z-30 flex flex-col justify-between hidden md:flex shrink-0",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      <div className="space-y-4">
        {/* Rail Header Toggle Button (No 'Navigation' text) */}
        <div className="flex items-center justify-end px-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-zinc-400 hover:text-orange-400 hover:border-orange-500/40 transition-all cursor-pointer"
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Rail List */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-sans transition-all relative overflow-hidden',
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30 shadow-md shadow-orange-500/5'
                      : 'text-zinc-300 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  )}
                >
                  {/* Glowing Vertical Active Indicator Line */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r shadow-[0_0_8px_#ff6b00]" />
                  )}

                  <Icon 
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-1',
                      isActive ? 'text-orange-400' : 'text-zinc-400 group-hover:text-zinc-100'
                    )} 
                  />

                  {isExpanded && (
                    <span className="truncate font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                  )}

                  {isExpanded && item.badge && (
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800/90 text-zinc-300 border border-neutral-700">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Hover Micro Tooltip when collapsed */}
                {!isExpanded && (
                  <div className="tooltip-popup absolute left-14 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none transition-all duration-200 z-50">
                    <div className="px-3 py-1.5 rounded-lg bg-neutral-900/95 border border-orange-500/30 text-zinc-100 text-xs font-sans whitespace-nowrap shadow-xl flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-[10px] font-mono text-orange-400">[{item.code}]</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Cybernetic Node Status Footer */}
      <div className="pt-3 border-t border-neutral-800/60">
        <div className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-900/50 text-[10px] font-mono text-zinc-400", !isExpanded && "justify-center")}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {isExpanded && <span className="truncate font-semibold">Turso DB :: Active</span>}
        </div>
      </div>
    </aside>
  );
}
