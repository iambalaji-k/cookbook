'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  PlusCircle, 
  Database, 
  CheckCircle2, 
  Flame, 
  Loader2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { NutritionFoodRecord } from '@/modules/nutrition/types/nutrition.types';
import { ManualFoodModal } from '@/modules/nutrition/components/ManualFoodModal';

export default function NutritionDashboardPage() {
  const [foods, setFoods] = useState<NutritionFoodRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchFoods = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setFoods(json.data);
      }
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFoods(searchQuery);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <span>Nutrition Engine Admin</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Master food database, canonical ingredient mappings, density matrix, and deterministic calculations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-xs flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-orange-500/20 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom Food / AI Search</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Database className="w-4 h-4 text-orange-400" />
            Master Foods
          </div>
          <div className="text-2xl font-black text-white">{foods.length} items</div>
          <div className="text-[11px] text-neutral-500">Normalized per 100g database</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Engine Status
          </div>
          <div className="text-2xl font-black text-emerald-400">100% Deterministic</div>
          <div className="text-[11px] text-neutral-500">Human-approved math execution</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-neutral-800 space-y-1">
          <div className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Integration
          </div>
          <div className="text-2xl font-black text-amber-400">Assists & Autofills</div>
          <div className="text-[11px] text-neutral-500">Web search + canonical mapping</div>
        </div>
      </div>

      {/* Master Food Database Browser */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Browse Master Food Database</span>
          </h2>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search food or alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-neutral-500 text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            <span>Loading food database...</span>
          </div>
        ) : foods.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs space-y-2">
            <p>No food items match your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Food Name</th>
                  <th className="p-3">Source</th>
                  <th className="p-3 text-right">Calories</th>
                  <th className="p-3 text-right">Protein</th>
                  <th className="p-3 text-right">Carbs</th>
                  <th className="p-3 text-right">Fat</th>
                  <th className="p-3 text-right">Piece Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-3 font-semibold text-white">
                      {food.foodName}
                      {food.aliases && food.aliases.length > 0 && (
                        <div className="text-[10px] text-neutral-500 font-normal">
                          {food.aliases.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] uppercase font-semibold">
                        {food.source}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-orange-400">{food.macros.calories} kcal</td>
                    <td className="p-3 text-right">{food.macros.protein} g</td>
                    <td className="p-3 text-right">{food.macros.carbohydrates} g</td>
                    <td className="p-3 text-right">{food.macros.fat} g</td>
                    <td className="p-3 text-right text-neutral-400">
                      {food.pieceWeightG ? `${food.pieceWeightG}g` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Food / AI Search Modal */}
      {isAddModalOpen && (
        <ManualFoodModal
          isOpen={isAddModalOpen}
          ingredientName=""
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => fetchFoods(searchQuery)}
        />
      )}
    </div>
  );
}
