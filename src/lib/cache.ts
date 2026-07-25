/**
 * Creates a Response with cache-control headers optimized for Vercel's edge cache.
 * - s-maxage: how long Vercel CDN caches it
 * - stale-while-revalidate: serves stale while revalidating in background
 */
export function cacheHeaders(sMaxAge = 30, staleWhileRevalidate = 120): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}
