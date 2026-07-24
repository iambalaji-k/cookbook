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
  Scale
} from 'lucide-react';
import { scaleIngredientPortion } from '../utils/portion-scaler';
import { convertIngredientUnit } from '../utils/unit-converter';
import { AIStatsCard } from '@/modules/ai/components/AIStatsCard';
import { StarRating } from './StarRating';
import { RecipeCommentsSection } from './RecipeCommentsSection';

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
}

export function ContentViewer({ entity }: ContentViewerProps) {
  const router = useRouter();
  const [targetServings, setTargetServings] = useState<number>(entity.servings || 4);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
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
        setIsFavorite(!nextState); // rollback on error
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
      }
    } catch (e) {
      console.error(e);
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
    <div className="space-y-8 max-w-4xl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/content"
          className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Favorites Heart Button */}
          <button
            onClick={handleToggleFavorite}
            disabled={togglingFav}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isFavorite
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}

          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
          </button>

          {entity.instructions.length > 0 && (
            <Link
              href={`/content/${entity.slug}/cook`}
              className="px-4 py-1.5 rounded-lg amber-gradient-bg text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>Start Cooking Mode 🍳</span>
            </Link>
          )}

          <button
            onClick={() => setShowRevisions(!showRevisions)}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium hover:text-white transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-orange-400" />
            <span>{showRevisions ? 'Hide Audit History' : `Revisions (${entity.revisions.length})`}</span>
          </button>

          <Link
            href={`/content/${entity.slug}/edit`}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-8 rounded-2xl glass-panel border border-neutral-800 relative overflow-hidden space-y-4">
        {entity.imageUrl && (
          <div className="h-64 w-full rounded-xl overflow-hidden mb-6 bg-neutral-900 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entity.imageUrl} alt={entity.title} className="w-full h-full object-cover" />
            
            {/* Favorite heart badge on image */}
            <button
              onClick={handleToggleFavorite}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-neutral-950/70 border border-neutral-700/80 text-white backdrop-blur-md hover:scale-110 transition-transform"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'}`} />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              {entity.contentType.replace('_', ' ')}
            </span>
            {entity.cuisine && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium">
                {entity.cuisine}
              </span>
            )}
            {entity.difficulty && (
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs capitalize">
                {entity.difficulty}
              </span>
            )}
          </div>

          {/* Interactive Star Rating Header Component */}
          <StarRating entityId={entity.id} size="md" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>{entity.title}</span>
          {isFavorite && (
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500 shrink-0 inline-block" />
          )}
        </h1>

        {entity.summary && (
          <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
            {entity.summary}
          </p>
        )}

        {/* Quick Details Bar */}
        <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-neutral-300 border-t border-neutral-800/80">
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

          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>Unit System: <strong className="text-white capitalize">{unitSystem} (Default)</strong></span>
          </div>
        </div>
      </div>

      {/* AI Telemetry Stats Display Component */}
      {(entity.aiProvider || entity.aiModel || entity.aiReasoningSummary) && (
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
      )}

      {/* Controls Bar: Serving Size Portion Scaler & Metric/Imperial Unit Selector */}
      {entity.ingredients.length > 0 && (
        <div className="p-4 rounded-xl glass-panel border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          {/* Servings Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Servings:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetServings(Math.max(1, targetServings - 1))}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="font-bold text-orange-400 text-sm min-w-[2rem] text-center">
                {targetServings} {targetServings === 1 ? 'serving' : 'servings'}
              </span>

              <button
                onClick={() => setTargetServings(targetServings + 1)}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Ingredients & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ingredients Column */}
        {entity.ingredients.length > 0 && (
          <div className="md:col-span-1 p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Ingredients</span>
              </h2>

              {/* Ingredient-wise Unit System Toggle */}
              <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    unitSystem === 'metric'
                      ? 'amber-gradient-bg text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    unitSystem === 'imperial'
                      ? 'amber-gradient-bg text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            <ul className="space-y-3 text-xs">
              {scaledIngredients.map((ing, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">
                      {ing.displayAmount ? `${ing.displayAmount} ` : ''}
                      {ing.itemName}
                    </span>
                    {ing.notes && (
                      <span className="block text-neutral-400 italic text-[11px] mt-0.5">
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
          <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
            <h2 className="text-lg font-bold text-white">Instructions & Preparation</h2>

            <div className="space-y-6">
              {entity.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full amber-gradient-bg text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-2 pt-1">
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      {step.instructionText}
                    </p>
                    {step.timerMinutes && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-orange-400 text-xs font-medium">
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
            <div className="p-4 rounded-xl glass-panel border border-neutral-800 flex items-center gap-2 flex-wrap text-xs">
              <Tag className="w-4 h-4 text-neutral-500" />
              {entity.tags.map((tag, idx) => {
                const tagName = typeof tag === 'string' ? tag : tag.tagName || '';
                return (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
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

      {/* Revision History Drawer / Panel */}
      {showRevisions && (
        <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-orange-400" />
            Immutable Revision Audit History
          </h2>

          <div className="space-y-3 text-xs">
            {entity.revisions.length === 0 ? (
              <p className="text-neutral-500 italic">No previous revisions recorded yet.</p>
            ) : (
              entity.revisions.map((rev) => (
                <div key={rev.id} className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-orange-400">Revision #{rev.revisionNumber}</span>
                    <span className="text-neutral-500">{new Date(rev.approvedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-neutral-300">{rev.changeSummary || 'No revision notes provided'}</p>
                  <p className="text-neutral-500 text-[11px]">Approved by: {rev.approvedBy}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
