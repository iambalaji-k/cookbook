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

const difficultyStyles = {
  easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  hard: 'bg-red-500/10 text-red-400 border-red-500/25',
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
  const detailHref = `/content/${slug || id}`;

  return (
    <div className="group rounded-2xl elevation-level3 border border-neutral-800/80 hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between relative shadow-lg">
      <div>
        {/* Cover Image (Swiggy / Zomato standard 16:9 widescreen aspect ratio) */}
        {imageUrl ? (
          <Link href={detailHref} prefetch={false} className="relative block w-full aspect-[16/9] overflow-hidden bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title || 'Content image'}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
            {/* Top & Bottom Scrim Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/60 pointer-events-none" />

            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 shadow-sm font-mono">
                <Icon className="w-3.5 h-3.5 text-orange-400" />
                <span>{label}</span>
              </span>
            </div>

            {/* Glass Favorite Heart Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={togglingFav}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:scale-110 transition-all shadow-lg flex items-center justify-center z-10 cursor-pointer"
            >
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'}`} />
            </button>
          </Link>
        ) : (
          <div className="p-3.5 border-b border-neutral-800/60 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400 uppercase tracking-wider inline-flex items-center gap-1.5 font-mono">
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </span>

            <button
              onClick={handleToggleFavorite}
              disabled={togglingFav}
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4.5 space-y-2.5">
          {/* Recipe Title as Main Link (No Separate Button Required) */}
          <Link href={detailHref} prefetch={false} className="block group/title">
            <h3 className="text-base font-bold text-white group-hover/title:text-orange-400 transition-colors line-clamp-2 leading-snug cursor-pointer">
              {title || 'Untitled Entity'}
            </h3>
          </Link>

          {/* Rating + Difficulty Badge Inline */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {id && <StarRating entityId={id} readOnly size="sm" />}
            {difficulty && (
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold capitalize shrink-0 font-mono ${difficultyStyles[difficulty] || 'bg-neutral-900 text-zinc-400 border-neutral-800'}`}>
                {difficulty}
              </span>
            )}
          </div>

          {/* Summary Description */}
          {summary && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans pt-0.5">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Footer Supporting Metadata */}
      <div className="p-4.5 pt-0">
        <div className="flex items-center gap-3.5 text-xs text-zinc-400 border-t border-neutral-800/80 pt-2.5 font-mono">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalTime}m</span>
            </div>
          )}

          {servings && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{servings} servings</span>
            </div>
          )}

          {cuisine && (
            <span className="ml-auto text-[11px] font-medium text-zinc-400 truncate">
              {cuisine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
