'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  entityId: string;
  initialRating?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  entityId,
  initialRating = 0,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchRating() {
      try {
        const res = await fetch(`/api/content/${entityId}/ratings`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRating(data.rating || 0);
        }
      } catch (e) {
        console.error('Error loading rating:', e);
      }
    }
    if (entityId) fetchRating();
    return () => { isMounted = false; };
  }, [entityId]);

  const handleRate = async (star: number) => {
    if (readOnly || submitting) return;
    setSubmitting(true);
    setRating(star);

    try {
      await fetch(`/api/content/${entityId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star }),
      });
    } catch (e) {
      console.error('Failed to submit rating:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const displayVal = rating > 0 ? String(rating) : '-';

  if (readOnly) {
    return (
      <div className="inline-flex items-center font-mono">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px] shadow-sm tracking-tight">
          <span>{displayVal}</span>
          <Star className="w-3 h-3 fill-white text-white shrink-0" />
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 font-mono">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-md">
        <span>{displayVal}</span>
        <Star className="w-3.5 h-3.5 fill-white text-white shrink-0" />
      </span>

      <div className="flex items-center gap-0.5 ml-1" onMouseLeave={() => setHoverRating(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoverRating !== null ? hoverRating : rating);
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
