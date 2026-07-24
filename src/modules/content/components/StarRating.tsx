'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  entityId: string;
  initialAverage?: number;
  initialTotalRatings?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  entityId,
  initialAverage = 0,
  initialTotalRatings = 0,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [average, setAverage] = useState<number>(initialAverage);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch live rating summary on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchRatings() {
      try {
        const res = await fetch(`/api/content/${entityId}/ratings`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAverage(data.averageRating || 0);
          }
        }
      } catch (e) {
        console.error('Error loading ratings:', e);
      }
    }
    if (entityId) fetchRatings();
    return () => { isMounted = false; };
  }, [entityId]);

  const handleRate = async (star: number) => {
    if (readOnly || submitting) return;
    setSubmitting(true);
    setUserRating(star);

    try {
      const res = await fetch(`/api/content/${entityId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star }),
      });

      if (res.ok) {
        const data = await res.json();
        setAverage(data.averageRating);
      }
    } catch (e) {
      console.error('Failed to submit rating:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRatingVal = average > 0 ? average.toFixed(1) : '-';

  // Swiggy & Zomato Style Rating Badge (No total rating count)
  if (readOnly) {
    return (
      <div className="inline-flex items-center font-mono">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px] shadow-sm tracking-tight">
          <span>{displayRatingVal}</span>
          <Star className="w-3 h-3 fill-white text-white shrink-0" />
        </span>
      </div>
    );
  }

  // Interactive Rating Mode (for Detail Page - No total rating count)
  return (
    <div className="inline-flex items-center gap-2 font-mono">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-md">
        <span>{displayRatingVal}</span>
        <Star className="w-3.5 h-3.5 fill-white text-white shrink-0" />
      </span>

      <div className="flex items-center gap-0.5 ml-1" onMouseLeave={() => setHoverRating(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoverRating !== null ? hoverRating : average);
          return (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => handleRate(star)}
              className="p-0.5 hover:scale-110 cursor-pointer transition-transform"
            >
              <Star
                className={`w-4 h-4 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                    : 'fill-neutral-800 text-neutral-600'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
