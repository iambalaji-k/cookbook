'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Search, 
  Settings, 
  Home, 
  History 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Content & Recipes', href: '/content', icon: BookOpen },
  { name: 'Raw Imports', href: '/imports', icon: FileText },
  { name: 'AI Drafts Queue', href: '/drafts', icon: Sparkles, badge: 'Staging' },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Settings (AI)', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 glass-panel border-r border-neutral-800/80 min-h-[calc(100vh-73px)] p-4 hidden md:block">
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Navigation
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4', isActive ? 'text-orange-400' : 'text-neutral-400')} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400">
        <p className="font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-orange-400" />
          Milestone 1 Active
        </p>
        <p className="leading-relaxed">
          Turso + Local SQLite DB initialized. Schema active for Content, Revisions, Imports, and Drafts.
        </p>
      </div>
    </aside>
  );
}
