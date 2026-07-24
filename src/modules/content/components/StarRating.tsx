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
  const [totalRatings, setTotalRatings] = useState<number>(initialTotalRatings);
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
            setTotalRatings(data.totalRatings || 0);
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
        setTotalRatings(data.totalRatings);
      }
    } catch (e) {
      console.error('Failed to submit rating:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const displayRating = hoverRating !== null ? hoverRating : (userRating || Math.round(average));

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoverRating !== null ? hoverRating : average);
          const isUserSelected = userRating === star;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly || submitting}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onClick={() => handleRate(star)}
              className={`p-0.5 transition-transform ${
                !readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
              } ${submitting ? 'opacity-50' : ''}`}

            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'fill-neutral-800 text-neutral-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {average > 0 && (
        <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
          <span>{average.toFixed(1)}</span>
          <span className="text-neutral-500 font-normal">({totalRatings})</span>
        </span>
      )}
    </div>
  );
}
