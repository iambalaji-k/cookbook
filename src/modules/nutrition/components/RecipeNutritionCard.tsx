'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  PlusCircle, 
  RotateCw, 
  Info,
  Globe,
  Sparkles
} from 'lucide-react';
import { RecipeNutritionCalculationResult, FullNutritionProfile, DailyValuePercentages } from '../types/nutrition.types';
import { DVProfile } from '../utils/daily-values';
import { ManualFoodModal } from './ManualFoodModal';

interface RecipeNutritionCardProps {
  recipeId: string;
  servings?: number;
}

function scaleProfile(p: FullNutritionProfile, factor: number): FullNutritionProfile {
  const round = (v: number) => Math.round(v * 10) / 10;
  return {
    macros: {
      calories: round(p.macros.calories * factor),
      protein: round(p.macros.protein * factor),
      fat: round(p.macros.fat * factor),
      saturatedFat: round(p.macros.saturatedFat * factor),
      unsaturatedFat: round(p.macros.unsaturatedFat * factor),
      carbohydrates: round(p.macros.carbohydrates * factor),
      fiber: round(p.macros.fiber * factor),
      sugar: round(p.macros.sugar * factor),
    },
    vitamins: {
      vitaminA: round(p.vitamins.vitaminA * factor),
      vitaminB1: round(p.vitamins.vitaminB1 * factor),
      vitaminB2: round(p.vitamins.vitaminB2 * factor),
      vitaminB3: round(p.vitamins.vitaminB3 * factor),
      vitaminB5: round(p.vitamins.vitaminB5 * factor),
      vitaminB6: round(p.vitamins.vitaminB6 * factor),
      vitaminB7: round(p.vitamins.vitaminB7 * factor),
      vitaminB9: round(p.vitamins.vitaminB9 * factor),
      vitaminB12: round(p.vitamins.vitaminB12 * factor),
      vitaminC: round(p.vitamins.vitaminC * factor),
      vitaminD: round(p.vitamins.vitaminD * factor),
      vitaminE: round(p.vitamins.vitaminE * factor),
      vitaminK: round(p.vitamins.vitaminK * factor),
    },
    minerals: {
      calcium: round(p.minerals.calcium * factor),
      iron: round(p.minerals.iron * factor),
      magnesium: round(p.minerals.magnesium * factor),
      potassium: round(p.minerals.potassium * factor),
      sodium: round(p.minerals.sodium * factor),
      zinc: round(p.minerals.zinc * factor),
      copper: round(p.minerals.copper * factor),
      selenium: round(p.minerals.selenium * factor),
      manganese: round(p.minerals.manganese * factor),
      phosphorus: round(p.minerals.phosphorus * factor),
    },
    other: {
      cholesterol: round(p.other.cholesterol * factor),
      omega3: round(p.other.omega3 * factor),
      omega6: round(p.other.omega6 * factor),
      water: round(p.other.water * factor),
    },
  };
}

function scaleDV(dv: DailyValuePercentages, factor: number): DailyValuePercentages {
  const out: DailyValuePercentages = {};
  for (const [k, v] of Object.entries(dv)) {
    if (v !== undefined) out[k as keyof DailyValuePercentages] = Math.round(v * factor);
  }
  return out;
}

export function RecipeNutritionCard({ recipeId, servings }: RecipeNutritionCardProps) {
  const [nutrition, setNutrition] = useState<RecipeNutritionCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'per_serving' | 'total'>('per_serving');
  const [showDV, setShowDV] = useState(false);
  const [dvProfile, setDvProfile] = useState<DVProfile>('US_FDA');
  const [showMicros, setShowMicros] = useState(false);
  const [manualModalIngredient, setManualModalIngredient] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillProgress, setAutoFillProgress] = useState<string | null>(null);
  const [autoFillResults, setAutoFillResults] = useState<Record<string, string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/nutrition/recipes/${recipeId}?recalculate=false&dvProfile=${dvProfile}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load nutrition data');
        }
        if (!cancelled) setNutrition(json.data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error loading nutrition data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [recipeId, dvProfile]);

  const fetchNutrition = async (recalculate = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nutrition/recipes/${recipeId}?recalculate=${recalculate}&dvProfile=${dvProfile}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load nutrition data');
      }
      setNutrition(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillAll = async () => {
    if (!nutrition || nutrition.unmappedIngredients.length === 0) return;
    const total = nutrition.unmappedIngredients.length;
    setAutoFilling(true);
    setAutoFillProgress(`0/${total}`);
    setAutoFillResults(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/nutrition/recipes/${recipeId}/auto-fill-unmapped`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: nutrition.unmappedIngredients }),
        signal: abortRef.current.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Auto-fill failed');

      const resultMap: Record<string, string> = {};
      for (const r of json.results) {
        resultMap[r.ingredient] = r.status === 'mapped' ? '✅' : '❌';
      }
      setAutoFillResults(resultMap);
      setAutoFillProgress(`${json.mapped}/${total}`);
      setNutrition(json.nutrition);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Auto-fill cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Auto-fill failed');
      }
    } finally {
      setAutoFilling(false);
      abortRef.current = null;
    }
  };

  const handleCancelAutoFill = () => {
    abortRef.current?.abort();
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 animate-pulse space-y-4">
        <div className="h-6 bg-neutral-800/60 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-neutral-800/40 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/40 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/40 rounded-xl"></div>
          <div className="h-16 bg-neutral-800/40 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !nutrition) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-neutral-400 text-xs flex items-center justify-between">
        <span>Nutrition calculation unavailable.</span>
        <button
          onClick={() => fetchNutrition(true)}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Retry Calculation
        </button>
      </div>
    );
  }

  const originalServings = nutrition.servings;
  const servingRatio = servings && originalServings > 0 ? servings / originalServings : 1;

  const profile = mode === 'total'
    ? scaleProfile(nutrition.totalNutrition, servingRatio)
    : nutrition.perServingNutrition;
  const dv = mode === 'total' && servingRatio !== 1
    ? scaleDV(nutrition.dailyValuePercentages, servingRatio)
    : nutrition.dailyValuePercentages;
  const isFullCoverage = nutrition.nutritionCoveragePercent >= 100;

  return (
    <div className="p-6 rounded-2xl glass-panel border border-neutral-800/80 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              Nutrition Facts
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isFullCoverage
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {nutrition.nutritionCoveragePercent}% Mapped
              </span>
            </h3>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Per Serving vs Total */}
          <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 flex text-xs">
            <button
              onClick={() => setMode('per_serving')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                mode === 'per_serving'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Per Serving
            </button>
            <button
              onClick={() => setMode('total')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                mode === 'total'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Total Recipe
            </button>
          </div>

          {/* % DV Toggle */}
          <button
            onClick={() => setShowDV(!showDV)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              showDV
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            % Daily Value
          </button>

          {/* DV Profile Selector */}
          {showDV && (
            <div className="flex items-center gap-1 text-xs bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-neutral-400">
              <Globe className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={dvProfile}
                onChange={(e) => setDvProfile(e.target.value as DVProfile)}
                className="bg-transparent text-neutral-300 focus:outline-none cursor-pointer text-xs"
              >
                <option value="US_FDA" className="bg-neutral-900 text-white">US FDA</option>
                <option value="EFSA" className="bg-neutral-900 text-white">EFSA (EU)</option>
                <option value="WHO" className="bg-neutral-900 text-white">WHO</option>
                <option value="ICMR_INDIA" className="bg-neutral-900 text-white">ICMR (India)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Unmapped Warnings & Manual Entry Callout */}
      {!isFullCoverage && nutrition.unmappedIngredients.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Nutrition Unavailable for {nutrition.unmappedIngredients.length} ingredient(s)
            </span>
            <span className="text-[10px] text-amber-400/80">Totals exclude unmapped items</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {nutrition.unmappedIngredients.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setManualModalIngredient(item)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-1 transition"
              >
                <span>{item}</span>
                {autoFillResults?.[item] ? (
                  <span className="text-emerald-400">{autoFillResults[item]}</span>
                ) : (
                  <PlusCircle className="w-3 h-3 text-amber-400" />
                )}
              </button>
            ))}
          </div>
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleAutoFillAll}
              disabled={autoFilling}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {autoFilling ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{autoFilling ? `Auto-Filling... ${autoFillProgress || ''}` : `Auto-Fill All ${nutrition.unmappedIngredients.length} Unmapped`}</span>
            </button>
            {autoFilling && (
              <button
                onClick={handleCancelAutoFill}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Macro Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Calories */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-orange-500/10 to-neutral-900/80 border border-orange-500/20 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Calories</div>
          <div className="text-xl font-black text-orange-400 mt-1">
            {profile.macros.calories} <span className="text-xs font-normal text-neutral-500">kcal</span>
          </div>
          {showDV && dv.calories !== undefined && (
            <div className="text-[10px] font-semibold text-orange-400/80 mt-0.5">{dv.calories}% DV</div>
          )}
        </div>

        {/* Protein */}
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Protein</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {profile.macros.protein} <span className="text-xs font-normal text-neutral-500">g</span>
          </div>
          {showDV && dv.protein !== undefined && (
            <div className="text-[10px] font-semibold text-neutral-400 mt-0.5">{dv.protein}% DV</div>
          )}
        </div>

        {/* Carbs */}
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Carbs</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {profile.macros.carbohydrates} <span className="text-xs font-normal text-neutral-500">g</span>
          </div>
          {showDV && dv.carbohydrates !== undefined && (
            <div className="text-[10px] font-semibold text-neutral-400 mt-0.5">{dv.carbohydrates}% DV</div>
          )}
        </div>

        {/* Fat */}
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Fat</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {profile.macros.fat} <span className="text-xs font-normal text-neutral-500">g</span>
          </div>
          {showDV && dv.fat !== undefined && (
            <div className="text-[10px] font-semibold text-neutral-400 mt-0.5">{dv.fat}% DV</div>
          )}
        </div>

        {/* Fiber */}
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Fiber</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {profile.macros.fiber} <span className="text-xs font-normal text-neutral-500">g</span>
          </div>
          {showDV && dv.fiber !== undefined && (
            <div className="text-[10px] font-semibold text-neutral-400 mt-0.5">{dv.fiber}% DV</div>
          )}
        </div>

        {/* Sugar */}
        <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Sugar</div>
          <div className="text-xl font-bold text-neutral-100 mt-1">
            {profile.macros.sugar} <span className="text-xs font-normal text-neutral-500">g</span>
          </div>
          {showDV && dv.sugar !== undefined && (
            <div className="text-[10px] font-semibold text-neutral-400 mt-0.5">{dv.sugar}% DV</div>
          )}
        </div>
      </div>

      {/* Expandable Micronutrients Accordion */}
      <div className="border-t border-neutral-800/80 pt-3">
        <button
          onClick={() => setShowMicros(!showMicros)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Micronutrients (Vitamins, Minerals & Cholesterol)
          </span>
          {showMicros ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>

        {showMicros && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs">
            {/* Vitamins */}
            <div className="space-y-1.5">
              <div className="font-semibold text-neutral-200 border-b border-neutral-800 pb-1 mb-2">
                Vitamins
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Vitamin A:</span> <span className="text-white font-medium">{profile.vitamins.vitaminA} mcg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Vitamin C:</span> <span className="text-white font-medium">{profile.vitamins.vitaminC} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Vitamin D:</span> <span className="text-white font-medium">{profile.vitamins.vitaminD} mcg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Vitamin B6:</span> <span className="text-white font-medium">{profile.vitamins.vitaminB6} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Vitamin B12:</span> <span className="text-white font-medium">{profile.vitamins.vitaminB12} mcg</span>
              </div>
            </div>

            {/* Minerals */}
            <div className="space-y-1.5">
              <div className="font-semibold text-neutral-200 border-b border-neutral-800 pb-1 mb-2">
                Minerals
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Calcium:</span> <span className="text-white font-medium">{profile.minerals.calcium} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Iron:</span> <span className="text-white font-medium">{profile.minerals.iron} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Sodium:</span> <span className="text-white font-medium">{profile.minerals.sodium} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Potassium:</span> <span className="text-white font-medium">{profile.minerals.potassium} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Magnesium:</span> <span className="text-white font-medium">{profile.minerals.magnesium} mg</span>
              </div>
            </div>

            {/* Other */}
            <div className="space-y-1.5">
              <div className="font-semibold text-neutral-200 border-b border-neutral-800 pb-1 mb-2">
                Fatty Acids & Other
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Saturated Fat:</span> <span className="text-white font-medium">{profile.macros.saturatedFat} g</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Cholesterol:</span> <span className="text-white font-medium">{profile.other.cholesterol} mg</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Omega-3:</span> <span className="text-white font-medium">{profile.other.omega3} g</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Omega-6:</span> <span className="text-white font-medium">{profile.other.omega6} g</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Water:</span> <span className="text-white font-medium">{profile.other.water} g</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80">
        <span className="flex items-center gap-1 text-neutral-400">
          <Info className="w-3.5 h-3.5 text-neutral-500" />
          Data Source: Master Food Database (USDA & Verified References)
        </span>
        <button
          onClick={() => fetchNutrition(true)}
          className="hover:text-orange-400 transition flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3" />
          Recalculate
        </button>
      </div>

      {/* Manual Entry Modal */}
      {manualModalIngredient && (
        <ManualFoodModal
          isOpen={!!manualModalIngredient}
          ingredientName={manualModalIngredient}
          recipeId={recipeId}
          onClose={() => setManualModalIngredient(null)}
          onSuccess={(updatedData) => {
            if (updatedData) {
              setNutrition(updatedData);
            } else {
              fetchNutrition(true);
            }
          }}
        />
      )}
    </div>
  );
}
