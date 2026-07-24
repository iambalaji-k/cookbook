'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  Utensils, 
  BookOpen, 
  Wrench, 
  Lightbulb, 
  Flame, 
  Sparkles,
  Heart
} from 'lucide-react';
import { StarRating } from './StarRating';

export interface ContentEntityData {
  id: string;
  title: string;
  slug: string;
  contentType: 'recipe' | 'technique' | 'ingredient_guide' | 'sauce' | 'spice_blend' | 'kitchen_tip';
  summary?: string | null;
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  cuisine?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  imageUrl?: string | null;
  isFavorite?: boolean;
}

export interface ContentCardProps {
  entity?: ContentEntityData;
  id?: string;
  title?: string;
  slug?: string;
  contentType?: 'recipe' | 'technique' | 'ingredient_guide' | 'sauce' | 'spice_blend' | 'kitchen_tip';
  summary?: string | null;
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  cuisine?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  imageUrl?: string | null;
  isFavorite?: boolean;
}

const typeIcons = {
  recipe: Utensils,
  technique: Wrench,
  ingredient_guide: BookOpen,
  sauce: Flame,
  spice_blend: Sparkles,
  kitchen_tip: Lightbulb,
};

const typeLabels = {
  recipe: 'Recipe',
  technique: 'Technique',
  ingredient_guide: 'Ingredient Guide',
  sauce: 'Sauce',
  spice_blend: 'Spice Blend',
  kitchen_tip: 'Kitchen Tip',
};

export function ContentCard(props: ContentCardProps) {
  const data = props.entity || props;
  const {
    id,
    title,
    slug,
    contentType = 'recipe',
    summary,
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    cuisine,
    difficulty,
    imageUrl,
    isFavorite: initialIsFavorite = false,
  } = data;

  const [isFavorite, setIsFavorite] = useState<boolean>(!!initialIsFavorite);
  const [togglingFav, setTogglingFav] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id || togglingFav) return;

    setTogglingFav(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const res = await fetch(`/api/content/${id}/favorite`, { method: 'PATCH' });
      if (!res.ok) setIsFavorite(!nextState);
    } catch (err) {
      console.error(err);
      setIsFavorite(!nextState);
    } finally {
      setTogglingFav(false);
    }
  };

  const Icon = typeIcons[contentType as keyof typeof typeIcons] || Utensils;
  const label = typeLabels[contentType as keyof typeof typeLabels] || 'Content';

  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);

  return (
    <div className="group rounded-2xl glass-panel border border-neutral-800 hover:border-orange-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between relative">
      <div>
        {/* Cover Image or Gradient Banner */}
        {imageUrl ? (
          <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title || 'Content image'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-700/50 text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Icon className="w-3.5 h-3.5 text-orange-400" />
                <span>{label}</span>
              </span>
            </div>

            {/* Favorite heart button */}
            <button
              onClick={handleToggleFavorite}
              disabled={togglingFav}
              className="absolute top-3 right-3 p-2 rounded-full bg-neutral-950/80 border border-neutral-700/60 backdrop-blur-md hover:scale-110 transition-transform shadow-md"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'}`} />
            </button>
          </div>
        ) : (
          <div className="p-4 border-b border-neutral-800/60 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </span>

            <button
              onClick={handleToggleFavorite}
              disabled={togglingFav}
              className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:scale-110 transition-transform"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
              {title || 'Untitled Entity'}
            </h3>
            {difficulty && (
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-semibold text-neutral-400 capitalize shrink-0">
                {difficulty}
              </span>
            )}
          </div>

          {/* Star Rating Badge */}
          {id && <StarRating entityId={id} readOnly size="sm" />}

          {summary && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Footer Metrics & Action Button */}
      <div className="p-5 pt-0 space-y-4">
        <div className="flex items-center gap-4 text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalTime}m</span>
            </div>
          )}

          {servings && (
            <div className="flex items-center gap-1 font-mono">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{servings} servings</span>
            </div>
          )}

          {cuisine && (
            <span className="ml-auto text-[11px] font-medium text-neutral-500 truncate">
              {cuisine}
            </span>
          )}
        </div>

        <Link
          href={`/content/${slug || id}`}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <span>View Details</span>
        </Link>
      </div>
    </div>
  );
}

