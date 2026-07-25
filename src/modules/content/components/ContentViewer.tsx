'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  History, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Plus,
  Minus,
  Tag,
  Flame,
  Heart,
  ChevronDown
} from 'lucide-react';
import { scaleIngredientPortion } from '../utils/portion-scaler';
import { convertIngredientUnit } from '../utils/ingredient-unit-converter';
import { AIStatsCard } from '@/modules/ai/components/AIStatsCard';
import { StarRating } from './StarRating';
import { RecipeCommentsSection } from './RecipeCommentsSection';
import { RecipeNutritionCard } from '@/modules/nutrition/components/RecipeNutritionCard';

interface ContentViewerProps {
  entity: {
    id: string;
    title: string;
    slug: string;
    contentType: string;
    summary?: string | null;
    status: string;
    servings: number;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    cuisine?: string | null;
    difficulty?: string | null;
    imageUrl?: string | null;
    isFavorite?: boolean;
    aiProvider?: string | null;
    aiModel?: string | null;
    aiLatencyMs?: number | null;
    aiTokenUsage?: number | null;
    aiConfidence?: number | null;
    aiPromptVersion?: string | null;
    aiReasoningSummary?: string | null;
    aiTimestamp?: string | null;
    ingredients: Array<{
      id: string;
      itemName: string;
      amount?: number | null;
      unit?: string | null;
      notes?: string | null;
    }>;
    instructions: Array<{
      id: string;
      stepNumber: number;
      instructionText: string;
      timerMinutes?: number | null;
    }>;
    tags: Array<any>;
    revisions: Array<{
      id: string;
      revisionNumber: number;
      snapshotJSON: string;
      changeSummary?: string | null;
      approvedBy: string;
      approvedAt: string;
    }>;
  };
  initialUnitSystem?: 'metric' | 'imperial';
}

export function ContentViewer({ entity, initialUnitSystem }: ContentViewerProps) {
  const router = useRouter();
  const [targetServings, setTargetServings] = useState<number>(entity.servings || 4);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(initialUnitSystem || 'metric');
  const [isFavorite, setIsFavorite] = useState<boolean>(!!entity.isFavorite);
  const [togglingFav, setTogglingFav] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalTime = (entity.prepTimeMinutes || 0) + (entity.cookTimeMinutes || 0);

  const handleToggleFavorite = async () => {
    if (togglingFav) return;
    setTogglingFav(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const res = await fetch(`/api/content/${entity.id}/favorite`, { method: 'PATCH' });
      if (!res.ok) {
        setIsFavorite(!nextState);
      }
    } catch (e) {
      console.error(e);
      setIsFavorite(!nextState);
    } finally {
      setTogglingFav(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${entity.title}"?`)) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/content/${entity.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/content');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete recipe');
        setDeleting(false);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting the recipe');
      setDeleting(false);
    }
  };

  const scaledIngredients = entity.ingredients.map((ing) => {
    const portionScaledAmount = scaleIngredientPortion(
      ing.amount ?? null,
      entity.servings || 4,
      targetServings
    );

    const converted = convertIngredientUnit(
      portionScaledAmount,
      ing.unit ?? null,
      unitSystem
    );

    return {
      ...ing,
      displayAmount: converted.displayString,
    };
  });

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Top Action Bar (Icon-only buttons with tooltips for Revisions, Edit, Delete) */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <Link
          href="/content"
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Start Cooking Mode Button */}
          {entity.instructions.length > 0 && (
            <Link
              href={`/content/${entity.slug}/cook`}
              className="px-3.5 py-1.5 rounded-xl amber-gradient-bg text-white text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>Cooking Mode 🍳</span>
            </Link>
          )}

          {/* Icon-Only Revisions Button with Tooltip */}
          <button
            onClick={() => setShowRevisions(!showRevisions)}
            title={`Revisions History (${entity.revisions.length})`}
            className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-zinc-300 hover:text-orange-400 hover:border-orange-500/40 transition-all cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Icon-Only Edit Button with Tooltip */}
          <Link
            href={`/content/${entity.slug}/edit`}
            title="Edit Recipe"
            className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-zinc-300 hover:text-white hover:border-neutral-700 transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </Link>

          {/* Icon-Only Delete Button with Tooltip */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete Recipe"
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl elevation-level2 border border-neutral-800/90 relative overflow-hidden space-y-4 shadow-xl">
        {entity.imageUrl && (
          <div className="h-80 sm:h-96 md:h-[420px] w-full rounded-xl overflow-hidden mb-6 bg-neutral-900 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entity.imageUrl} alt={entity.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/50 pointer-events-none" />
            
            {/* Favorite heart badge on image */}
            <button
              onClick={handleToggleFavorite}
              disabled={togglingFav}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:scale-110 transition-transform flex items-center justify-center cursor-pointer shadow-lg z-10"
            >
              <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-300'}`} />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-semibold uppercase tracking-wider">
              {entity.contentType.replace('_', ' ')}
            </span>
            {entity.cuisine && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-300 text-xs font-sans">
                {entity.cuisine}
              </span>
            )}
            {entity.difficulty && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-400 text-xs font-mono capitalize">
                {entity.difficulty}
              </span>
            )}
          </div>

          {/* Interactive Star Rating (No Rating Count) */}
          <StarRating entityId={entity.id} size="md" />
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>{entity.title}</span>
        </h1>

        {entity.summary && (
          <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl font-sans">
            {entity.summary}
          </p>
        )}

        {/* Quick Details Bar (No Unit System Text) */}
        <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-zinc-300 border-t border-neutral-800/80 font-mono">
          {totalTime > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Prep: {entity.prepTimeMinutes || 0}m | Cook: {entity.cookTimeMinutes || 0}m (Total: {totalTime}m)</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Servings: {entity.servings}</span>
          </div>
        </div>
      </div>

      {/* Recipe Nutrition Engine Card */}
      <RecipeNutritionCard recipeId={entity.id} servings={targetServings} />

      {/* Controls Bar: Serving Size Portion Scaler & Unit Selector */}
      {entity.ingredients.length > 0 && (
        <div className="p-4 rounded-xl elevation-level2 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-sans">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Portion Scaler:</span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={() => setTargetServings(Math.max(1, targetServings - 1))}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="font-bold text-orange-400 text-sm min-w-[2rem] text-center">
                {targetServings} {targetServings === 1 ? 'serving' : 'servings'}
              </span>

              <button
                onClick={() => setTargetServings(targetServings + 1)}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-zinc-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Responsive Grid: Ingredients & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Ingredients Column (Sticky Sidebar on Desktop) */}
        {entity.ingredients.length > 0 && (
          <div className="md:col-span-1 p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-800/90 space-y-4 md:sticky md:top-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-white font-sans">
                Ingredients
              </h2>

              {/* Unit System Toggle */}
              <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    unitSystem === 'metric'
                      ? 'amber-gradient-bg text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    unitSystem === 'imperial'
                      ? 'amber-gradient-bg text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs font-sans">
              {scaledIngredients.map((ing, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-100">
                      {ing.displayAmount ? `${ing.displayAmount} ` : ''}
                      {ing.itemName}
                    </span>
                    {ing.notes && (
                      <span className="block text-zinc-400 italic text-[11px] mt-0.5 font-mono">
                        ({ing.notes})
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions Column */}
        <div className={entity.ingredients.length > 0 ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
          <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-800/90 space-y-6">
            <h2 className="text-base font-bold text-white font-sans">Instructions & Preparation</h2>

            <div className="space-y-5">
              {entity.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl amber-gradient-bg text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                      {step.instructionText}
                    </p>
                    {step.timerMinutes && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-orange-400 text-xs font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Timer: {step.timerMinutes} minutes</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Footer */}
          {entity.tags && entity.tags.length > 0 && (
            <div className="p-4 rounded-xl elevation-level2 border border-neutral-800 flex items-center gap-2 flex-wrap text-xs font-mono">
              <Tag className="w-4 h-4 text-zinc-500" />
              {entity.tags.map((tag, idx) => {
                const tagName = typeof tag === 'string' ? tag : tag.tagName || '';
                return (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-300">
                    #{tagName}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Comments Section Component */}
      <RecipeCommentsSection entityId={entity.id} />

      {/* Revision History Drawer */}
      {showRevisions && (
        <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-sans">
            <History className="w-5 h-5 text-orange-400" />
            Revision Audit History
          </h2>

          <div className="space-y-3 text-xs font-mono">
            {entity.revisions.length === 0 ? (
              <p className="text-zinc-500 italic">No previous revisions recorded yet.</p>
            ) : (
              entity.revisions.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-orange-400">Revision #{rev.revisionNumber}</span>
                    <span className="text-zinc-400">{new Date(rev.approvedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-300">{rev.changeSummary || 'No revision notes provided'}</p>
                  <p className="text-zinc-500 text-[11px]">Approved by: {rev.approvedBy}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI Execution Stats & Gateway Provenance (Collapsible at Bottom of Page) */}
      {(entity.aiProvider || entity.aiModel || entity.aiReasoningSummary) && (
        <details className="rounded-xl elevation-level2 border border-neutral-800 p-4 font-mono text-xs cursor-pointer group">
          <summary className="font-bold text-zinc-400 hover:text-white flex items-center justify-between outline-none select-none">
            <span>AI Execution Stats & Gateway Provenance</span>
            <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="pt-3">
            <AIStatsCard
              provider={entity.aiProvider}
              model={entity.aiModel}
              latencyMs={entity.aiLatencyMs}
              tokenUsage={entity.aiTokenUsage}
              confidence={entity.aiConfidence}
              promptVersion={entity.aiPromptVersion}
              reasoningSummary={entity.aiReasoningSummary}
              timestamp={entity.aiTimestamp}
            />
          </div>
        </details>
      )}
    </div>
  );
}
