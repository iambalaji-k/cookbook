'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Activity, 
  FileText, 
  Sparkles, 
  Search, 
  Settings, 
  Plus, 
  X, 
  Menu,
  Utensils,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home, code: 'HOME' },
  { name: 'Recipes & Guides', href: '/content', icon: BookOpen, code: 'RECIPES' },
  { name: 'Nutrition Engine', href: '/nutrition', icon: Activity, code: 'NUTRITION' },
  { name: 'Import Source', href: '/imports', icon: FileText, code: 'IMPORTS' },
  { name: 'AI Staging Queue', href: '/drafts', icon: Sparkles, code: 'DRAFTS' },
  { name: 'Search', href: '/search', icon: Search, code: 'SEARCH' },
  { name: 'Settings', href: '/settings', icon: Settings, code: 'CONFIG' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const mainTabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Recipes', href: '/content', icon: BookOpen },
    { name: 'Nutrition', href: '/nutrition', icon: Activity },
    { name: 'Drafts', href: '/drafts', icon: Sparkles },
  ];

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* 1. Mobile Top Bar Hamburger Toggle Button (Exposed in Header) */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Mobile Navigation Menu"
        className="md:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-zinc-300 hover:text-orange-400 hover:border-orange-500/40 transition-all shrink-0 cursor-pointer"
      >
        {isOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Slide-out Mobile Glassmorphic Drawer Menu */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsOpen(false)} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <aside className="relative w-4/5 max-w-xs bg-neutral-950/95 border-r border-neutral-800 h-full p-5 flex flex-col justify-between shadow-2xl z-10 animate-hud-reveal overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl cta-glow-pulse flex items-center justify-center shadow-md shadow-orange-500/20">
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-hud font-bold text-base text-zinc-100 tracking-wider amber-gradient-text uppercase">
                    COOKBOOK
                  </span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items List */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-sans transition-all relative overflow-hidden',
                        isActive
                          ? 'bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30 shadow-md'
                          : 'text-zinc-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-orange-400' : 'text-zinc-400')} />
                        <span className="font-medium text-zinc-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-500 font-semibold uppercase">{item.code}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Action Button: New Recipe */}
              <div className="pt-2">
                <Link
                  href="/content/new"
                  onClick={() => setIsOpen(false)}
                  className="w-full cta-glow-pulse py-3 rounded-xl text-white font-sans text-xs font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Recipe</span>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-800/80 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>COOKBOOK MOBILE v1.0</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </aside>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. Fixed Bottom Thumb Navigation Bar (Mobile Devices Only) */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 md:hidden flex justify-around items-center py-2 px-2 shadow-2xl">
        {mainTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
                isActive ? 'text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-orange-400' : 'text-zinc-400')} />
              <span className="text-[10px] font-sans font-medium tracking-tight">{tab.name}</span>
            </Link>
          );
        })}

        {/* Menu Tab button to open drawer */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-zinc-400 hover:text-orange-400 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5 text-zinc-400" />
          <span className="text-[10px] font-sans font-medium tracking-tight">Menu</span>
        </button>
      </div>
    </>
  );
}
