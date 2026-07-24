'use client';

import { useState } from 'react';
import { Sparkles, Save, X, Loader2, AlertCircle, Database, Search } from 'lucide-react';
import { CreateFoodInput } from '../validation/nutrition-schema';

interface ManualFoodModalProps {
  isOpen: boolean;
  ingredientName: string;
  recipeId?: string;
  onClose: () => void;
  onSuccess: (updatedNutritionData?: any) => void;
}

export function ManualFoodModal({
  isOpen,
  ingredientName,
  recipeId,
  onClose,
  onSuccess,
}: ManualFoodModalProps) {
  const [formData, setFormData] = useState<Partial<CreateFoodInput>>({
    foodName: ingredientName,
    servingSize: 100,
    servingUnit: 'g',
    source: 'manual',
    calories: 0,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    vitaminC: 0,
    sourceReference: 'Manual User Input',
  });

  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingUSDA, setLoadingUSDA] = useState(false);
  const [usdaResults, setUsdaResults] = useState<CreateFoodInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof CreateFoodInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAISearchAutofill = async () => {
    setLoadingAI(true);
    setErrorMsg(null);
    setUsdaResults([]);

    try {
      const res = await fetch('/api/nutrition/ai-search-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientName: formData.foodName || ingredientName }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI Search failed');
      }

      setFormData((prev) => ({
        ...prev,
        ...json.data,
        foodName: prev.foodName || json.data.foodName,
        source: 'ai_search',
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not fetch AI search nutrition data');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUSDASearch = async () => {
    setLoadingUSDA(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/nutrition/usda-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientName: formData.foodName || ingredientName }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'USDA Search failed');
      }

      if (json.data && json.data.length > 0) {
        setUsdaResults(json.data);
        // Autofill first result automatically
        setFormData((prev) => ({
          ...prev,
          ...json.data[0],
        }));
      } else {
        setErrorMsg('No matching Foundation / SR Legacy foods found in USDA FDC database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error querying USDA FoodData Central API');
    } finally {
      setLoadingUSDA(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/nutrition/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ingredientName: ingredientName || formData.foodName,
          recipeId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save nutrition entry');
      }

      onSuccess(json.updatedNutrition?.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving nutrition food item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              Add Nutrition for &quot;{ingredientName || formData.foodName}&quot;
            </h3>
            <p className="text-xs text-neutral-400">
              Enter nutrition values per 100g, fetch via official USDA API, or use AI search.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Bar: USDA FDC API & AI Web Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          {/* USDA FDC API Button */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 space-y-2">
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              USDA FoodData Central API
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Direct query against official fdc.nal.usda.gov database.
            </p>
            <button
              type="button"
              onClick={handleUSDASearch}
              disabled={loadingUSDA || loadingAI}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              {loadingUSDA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {loadingUSDA ? 'Querying USDA...' : 'Query USDA API'}
            </button>
          </div>

          {/* AI Web Search Button */}
          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 space-y-2">
            <div className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Web Search Autofill
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              AI-assisted search for web & international food composition tables.
            </p>
            <button
              type="button"
              onClick={handleAISearchAutofill}
              disabled={loadingAI || loadingUSDA}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-orange-500/20"
            >
              {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loadingAI ? 'Searching AI...' : 'Autofill via AI'}
            </button>
          </div>
        </div>

        {/* USDA Multi-Result Selector */}
        {usdaResults.length > 1 && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
            <span className="font-semibold text-blue-300">
              Found {usdaResults.length} matches in USDA database. Select best match:
            </span>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {usdaResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, ...r }))}
                  className={`w-full text-left p-2 rounded-lg border text-[11px] transition flex justify-between items-center ${
                    formData.foodName === r.foodName
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="truncate">{r.foodName}</span>
                  <span className="shrink-0 text-[10px] text-neutral-400 font-mono">
                    {r.calories} kcal | P:{r.protein}g C:{r.carbohydrates}g F:{r.fat}g
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Food Name</label>
              <input
                type="text"
                required
                value={formData.foodName || ''}
                onChange={(e) => handleChange('foodName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Source / Reference</label>
              <input
                type="text"
                value={formData.sourceReference || ''}
                onChange={(e) => handleChange('sourceReference', e.target.value)}
                placeholder="e.g. USDA FoodData Central ID"
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider pt-2 border-t border-neutral-800">
            Macronutrients (per 100g)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.calories ?? 0}
                onChange={(e) => handleChange('calories', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.protein ?? 0}
                onChange={(e) => handleChange('protein', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.carbohydrates ?? 0}
                onChange={(e) => handleChange('carbohydrates', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fat ?? 0}
                onChange={(e) => handleChange('fat', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Fiber (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fiber ?? 0}
                onChange={(e) => handleChange('fiber', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Sugar (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.sugar ?? 0}
                onChange={(e) => handleChange('sugar', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Sodium (mg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.sodium ?? 0}
                onChange={(e) => handleChange('sodium', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Piece Weight (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 15g"
                value={formData.pieceWeightG ?? ''}
                onChange={(e) => handleChange('pieceWeightG', parseFloat(e.target.value) || undefined)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-xs flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save & Map Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
