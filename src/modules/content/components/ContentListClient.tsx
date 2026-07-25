'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ContentCard, type ContentEntityData } from './ContentCard'
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const PAGE_SIZE = 24

const FILTER_TABS = [
  { label: 'All', value: undefined },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Recipes', value: 'recipe' },
  { label: 'Techniques', value: 'technique' },
  { label: 'Guides', value: 'ingredient_guide' },
  { label: 'Sauces', value: 'sauce' },
  { label: 'Spice Blends', value: 'spice_blend' },
  { label: 'Tips', value: 'kitchen_tip' },
] as const

export function ContentListClient({ initialData }: { initialData: ContentEntityData[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const type = searchParams.get('type') || undefined
  const q = searchParams.get('q') || searchParams.get('search') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [items, setItems] = useState<ContentEntityData[]>(initialData)
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/content?${params.toString()}`)
      const json = await res.json()
      if (res.ok && json.data) {
        setItems(json.data)
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [type, q, page])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const navigate = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    if (params.type) sp.set('type', params.type)
    if (params.page && params.page !== '1') sp.set('page', params.page)
    const qs = sp.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = type === tab.value || (!type && !tab.value)
          return (
            <button
              key={tab.label}
              onClick={() => navigate({ type: tab.value, page: undefined })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'glow-pill-amber font-bold text-orange-400 bg-orange-500/15 border-orange-500/40 shadow-sm'
                  : 'bg-neutral-900/80 border border-neutral-800 text-zinc-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl elevation-level2 border border-neutral-800 text-center space-y-4 my-4">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
          <div>
            <h3 className="font-hud text-sm font-bold text-white uppercase tracking-wider">NO ENTITIES FOUND</h3>
            <p className="font-mono text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No matching culinary entities found in your library.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 pt-2">
          {items.map((item) => (
            <ContentCard key={item.id} entity={item as any} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-4 pb-2">
          {page > 1 && (
            <button
              onClick={() => navigate({ type, page: String(page - 1) })}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
          )}
          <span className="text-xs font-mono text-zinc-500">Page {page}</span>
          <button
            onClick={() => navigate({ type, page: String(page + 1) })}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
