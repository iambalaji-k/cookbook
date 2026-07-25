'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  PlusCircle, 
  Database, 
  Loader2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Copy,
  Check
} from 'lucide-react';
import { NutritionFoodRecord } from '@/modules/nutrition/types/nutrition.types';
import { ManualFoodModal } from '@/modules/nutrition/components/ManualFoodModal';

type SortField = 'foodName' | 'source' | 'calories' | 'protein' | 'carbohydrates' | 'fat';

export default function NutritionDashboardPage() {
  const [foods, setFoods] = useState<NutritionFoodRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('foodName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Instant Live Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFoods(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedFoods = [...foods].sort((a, b) => {
    let valA: any = a[sortField as keyof NutritionFoodRecord];
    let valB: any = b[sortField as keyof NutritionFoodRecord];

    if (sortField === 'calories') {
      valA = a.macros.calories;
      valB = b.macros.calories;
    } else if (sortField === 'protein') {
      valA = a.macros.protein;
      valB = b.macros.protein;
    } else if (sortField === 'carbohydrates') {
      valA = a.macros.carbohydrates;
      valB = b.macros.carbohydrates;
    } else if (sortField === 'fat') {
      valA = a.macros.fat;
      valB = b.macros.fat;
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' 
        ? (valA || '').localeCompare(valB || '') 
        : (valB || '').localeCompare(valA || '');
    }
    return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
  });

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <span>Nutrition Engine Admin</span>
          </h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom Food / AI Search</span>
        </button>
      </div>



      {/* Master Food Database Table Card */}
      <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-800/90 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white font-sans">
            Master Food Database
          </h2>

          {/* Instant Live Search (No Submit Button Required) */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Live search food or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-zinc-500 focus:border-orange-500/50 focus:outline-none transition-colors font-sans"
            />
          </div>
        </div>

        {loading && foods.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs space-y-2 font-mono">
            <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            <span>Loading food database...</span>
          </div>
        ) : foods.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs space-y-2 font-sans">
            <p>No food items match &quot;{searchQuery}&quot;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-800/90 rounded-xl max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800">
                <tr className="text-zinc-400 font-mono font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('foodName')}>
                    <div className="flex items-center gap-1">
                      <span>Food Name</span>
                      {sortField === 'foodName' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('source')}>
                    <div className="flex items-center gap-1">
                      <span>Source</span>
                      {sortField === 'source' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('calories')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Calories</span>
                      {sortField === 'calories' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('protein')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Protein</span>
                      {sortField === 'protein' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('carbohydrates')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Carbs</span>
                      {sortField === 'carbohydrates' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('fat')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Fat</span>
                      {sortField === 'fat' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />) : <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right font-mono">Piece Weight</th>
                  <th className="py-2.5 px-3 text-right font-mono">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-zinc-200">
                {sortedFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-neutral-800/50 transition-colors group">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {food.foodName}
                      {food.aliases && food.aliases.length > 0 && (
                        <div className="text-[10px] text-zinc-400 font-normal font-sans">
                          {food.aliases.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-300 text-[10px] uppercase font-semibold">
                        {food.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-orange-400 font-mono">{food.macros.calories} kcal</td>
                    <td className="py-2.5 px-3 text-right font-mono">{food.macros.protein} g</td>
                    <td className="py-2.5 px-3 text-right font-mono">{food.macros.carbohydrates} g</td>
                    <td className="py-2.5 px-3 text-right font-mono">{food.macros.fat} g</td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">
                      {food.pieceWeightG ? `${food.pieceWeightG}g` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopyId(food.id, e)}
                          title="Copy Food ID"
                          className="p-1 rounded bg-neutral-900 border border-neutral-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === food.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          title="Edit Food Definition"
                          className="p-1 rounded bg-neutral-900 border border-neutral-800 text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
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
