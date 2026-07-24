'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Sparkles, Utensils, ArrowRight, RefreshCw, BookOpen, Clock, Tag } from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  summary?: string | null;
  cuisine?: string | null;
  difficulty?: string | null;
  imageUrl?: string | null;
  snippet?: string;
  totalTimeMinutes?: number;
}

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isAIMode, setIsAIMode] = useState(true);

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [interpretation, setInterpretation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setInterpretation(null);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (isAIMode) {
          const res = await fetch('/api/search/hybrid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          const json = await res.json();
          if (json.status === 'ok' && json.data) {
            setResults(json.data.results || []);
            setInterpretation(json.data.interpretation || null);
          }
        } else {
          setInterpretation(null);
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${category}`);
          const json = await res.json();
          if (json.status === 'ok') {
            setResults(json.data || []);
          }
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, category, isAIMode]);

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Recipes', value: 'recipe' },
    { label: 'Techniques', value: 'technique' },
    { label: 'Ingredient Guides', value: 'ingredient_guide' },
    { label: 'Sauces', value: 'sauce' },
    { label: 'Spice Blends', value: 'spice_blend' },
    { label: 'Kitchen Tips', value: 'kitchen_tip' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Search Mode Toggle Header */}
      <div className="flex items-center justify-between glass-panel p-2 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAIMode(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAIMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Natural Language Search</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAIMode(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isAIMode
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Exact Keyword FTS5</span>
          </button>
        </div>

        <span className="text-[11px] text-neutral-400 hidden sm:inline font-mono">
          {isAIMode ? 'Parses intent, max cook times & ingredients' : 'Direct SQLite FTS5 Match'}
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
          {isAIMode ? <Sparkles className="w-5 h-5 text-amber-400" /> : <Search className="w-5 h-5 text-orange-400" />}
        </div>

        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isAIMode
              ? 'Try conversational search: "What quick Italian dinner can I make with shrimp under 20 minutes?"'
              : 'Search title, ingredient (e.g. "shrimp"), instruction, or tag...'
          }
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white font-medium placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm shadow-xl"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Category Filter Pills (When in Exact Keyword Mode) */}
      {!isAIMode && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* AI Parsed Constraints Badge Bar */}
      {interpretation && (
        <div className="p-4 rounded-xl glass-panel border border-amber-500/30 bg-amber-500/[0.02] space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              AI Natural Language Intent Interpretation
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">Parsed Constraints</span>
          </div>

          <p className="text-neutral-300">{interpretation.summary}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {interpretation.keywords.map((kw: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-[10px] font-mono">
                Keyword: {kw}
              </span>
            ))}

            {interpretation.maxTotalTimeMinutes && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Max Time: ≤{interpretation.maxTotalTimeMinutes}m
              </span>
            )}

            {interpretation.cuisine && (
              <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono">
                Cuisine: {interpretation.cuisine}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-8 text-center text-neutral-400 flex items-center justify-center gap-2 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>{isAIMode ? 'Interpreting Natural Language Query...' : 'Searching FTS5 Index...'}</span>
        </div>
      )}

      {/* Search Results List */}
      {!loading && searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-3">
            <span>Found <strong className="text-white">{results.length}</strong> matching results</span>
            <span className="text-neutral-500">{isAIMode ? 'Hybrid AI + BM25 Ranked' : 'FTS5 BM25 Ranked'}</span>
          </div>

          {results.length === 0 ? (
            <div className="p-12 rounded-2xl glass-panel border border-neutral-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No matching culinary content found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Try asking a conversational question like "Quick Italian recipe with garlic" or search for "shrimp".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.slug}`}
                  className="p-5 rounded-2xl glass-panel border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wider">
                        {item.contentType.replace('_', ' ')}
                      </span>
                      {item.cuisine && (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 text-[10px]">
                          {item.cuisine}
                        </span>
                      )}
                      {item.totalTimeMinutes ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                          {item.totalTimeMinutes}m total
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>

                    {item.snippet && (
                      <p
                        className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-2.5 rounded-lg border border-neutral-800"
                        dangerouslySetInnerHTML={{ __html: item.snippet }}
                      />
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>View Recipe</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
