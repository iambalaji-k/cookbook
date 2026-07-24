'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Utensils, Command, Search, Plus, SlidersHorizontal, Loader2, ArrowRight, Clock } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface LiveTitleResult {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  cuisine?: string | null;
  imageUrl?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'title' | 'ingredients' | 'nutrition'>('hybrid');
  const [liveResults, setLiveResults] = useState<LiveTitleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fast Live Title-Only Search Effect (50ms Debounce)
  useEffect(() => {
    let cancelled = false;

    if (!searchQuery.trim()) {
      setLiveResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setShowDropdown(true);

      try {
        // Fast title-only fetch for instant real-time typing
        const res = await fetch(`/api/content?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (!cancelled && res.ok) {
          const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
          setLiveResults(list);
        }
      } catch (err) {
        console.error('Fast live title search error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Click Outside Listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (!searchQuery.trim()) {
      router.push('/content');
      return;
    }

    if (searchMode === 'nutrition') {
      router.push(`/nutrition?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/content?q=${encodeURIComponent(searchQuery.trim())}&mode=${searchMode}`);
    }
  };

  const handleResultClick = (href: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full elevation-level2 border-b border-neutral-800/90 px-4 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between w-full max-w-7xl 2xl:max-w-[1700px] mx-auto gap-4">
        {/* Far Left: Clean Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl cta-glow-pulse flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <span className="font-hud font-bold text-base text-zinc-100 tracking-wider amber-gradient-text uppercase">
            COOKBOOK
          </span>
        </Link>

        {/* Center: Integrated Prominent Fast Title Live Search Bar */}
        <div className="flex-1 max-w-xl mx-auto relative" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 text-orange-400 absolute left-3 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-orange-400 absolute left-3 pointer-events-none" />
              )}

              <input
                type="text"
                placeholder="Search recipe title (Press Enter for full search)..."
                value={searchQuery}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 focus:border-orange-500/60 text-zinc-100 placeholder-zinc-500 transition-all text-xs sm:text-sm font-sans focus:outline-none focus:ring-1 focus:ring-orange-500/40 shadow-inner"
              />

              {/* Command Palette Trigger Badge (Ctrl+K) */}
              <button
                type="button"
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true });
                  window.dispatchEvent(event);
                }}
                title="Open Command Palette (Ctrl+K)"
                className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-800 hover:bg-neutral-700 text-zinc-400 hover:text-white border border-neutral-700 shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Command className="w-3 h-3 text-orange-400" /> K
              </button>
            </div>

            {/* Search Nature Dropdown Selector (Evaluated on Enter / Submit) */}
            <div className="relative shrink-0 flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value as any)}
                className="bg-transparent text-zinc-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                title="Select Nature of Full Search (Triggered on Enter)"
              >
                <option value="hybrid" className="bg-neutral-900 text-white">Hybrid / AI</option>
                <option value="title" className="bg-neutral-900 text-white">Title Only</option>
                <option value="ingredients" className="bg-neutral-900 text-white">Ingredients</option>
                <option value="nutrition" className="bg-neutral-900 text-white">Nutrition DB</option>
              </select>
            </div>
          </form>

          {/* Fast Instant Recipe Title Autocomplete Dropdown */}
          {showDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-hud-reveal max-h-80 overflow-y-auto">
              <div className="p-2.5 border-b border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 px-3">
                <span>Fast Recipe Title Matches ({liveResults.length})</span>
                <span className="text-zinc-500">Press Enter for full {searchMode} search</span>
              </div>

              {loading ? (
                <div className="p-5 text-center text-zinc-400 text-xs font-mono flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Matching titles...</span>
                </div>
              ) : liveResults.length === 0 ? (
                <div className="p-5 text-center text-zinc-400 text-xs font-sans">
                  No title matches for &quot;{searchQuery}&quot;. Press Enter to run full {searchMode} search.
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/60">
                  {liveResults.slice(0, 6).map((item: LiveTitleResult) => {
                    const totalTime = (item.prepTimeMinutes || 0) + (item.cookTimeMinutes || 0);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(`/content/${item.slug || item.id}`)}
                        className="p-3 hover:bg-neutral-800/60 transition-colors cursor-pointer flex items-center gap-3 group"
                      >
                        {item.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.imageUrl} alt={item.title} className="w-9 h-9 rounded-lg object-cover bg-neutral-950 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                            <Utensils className="w-4 h-4" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                            <span className="uppercase text-orange-400">{item.contentType ? item.contentType.replace('_', ' ') : 'RECIPE'}</span>
                            {item.cuisine && <span>• {item.cuisine}</span>}
                            {totalTime > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {totalTime}m
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Far Right: Persistent New Recipe Button */}
        <Link
          href="/content/new"
          className="cta-glow-pulse px-4 py-2 rounded-xl text-white font-sans text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 shrink-0 group focus:ring-2 focus:ring-orange-500 outline-none hover:scale-105"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Recipe</span>
        </Link>

        {/* Global Command Palette Modal (Ctrl+K / ⌘K) */}
        <CommandPalette />
      </div>
    </header>
  );
}
