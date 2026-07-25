'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { generateSlug } from '../utils/slug';
import { IngredientUnitSelect } from './IngredientUnitSelect';

interface ContentFormProps {
  initialData?: {
    id?: string;
    contentType?: string;
    title?: string;
    slug?: string;
    summary?: string | null;
    status?: string;
    servings?: number | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    cuisine?: string | null;
    difficulty?: string | null;
    imageUrl?: string | null;
    ingredients?: Array<{ itemName: string; amount?: number | null; unit?: string | null; notes?: string | null }>;
    instructions?: Array<{ stepNumber: number; instructionText: string; timerMinutes?: number | null }>;
    tags?: string[];
  };
  isEditing?: boolean;
}

export function ContentForm({ initialData, isEditing = false }: ContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contentType, setContentType] = useState(initialData?.contentType || 'recipe');
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [status, setStatus] = useState(initialData?.status || 'published');
  const [servings, setServings] = useState<number>(initialData?.servings ?? 4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(initialData?.prepTimeMinutes ?? '');
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(initialData?.cookTimeMinutes ?? '');
  const [cuisine, setCuisine] = useState(initialData?.cuisine || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'medium');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [changeSummary, setChangeSummary] = useState('');

  // Sub-table states
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients || [{ itemName: '', amount: null, unit: '', notes: '' }]
  );

  const [instructions, setInstructions] = useState(
    initialData?.instructions || [{ stepNumber: 1, instructionText: '', timerMinutes: null }]
  );

  const [tagsInput, setTagsInput] = useState((initialData?.tags || []).join(', '));

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const baseSlug = val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/-+$/, '');
    if (!slug || slug.startsWith(baseSlug)) {
      setSlug(generateSlug(val));
    }
  };

  // Ingredients handlers
  const addIngredient = () => {
    setIngredients([...ingredients, { itemName: '', amount: null, unit: '', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  // Instructions handlers
  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, instructionText: '', timerMinutes: null },
    ]);
  };

  const removeInstruction = (index: number) => {
    const filtered = instructions.filter((_, i) => i !== index);
    setInstructions(filtered.map((item, idx) => ({ ...item, stepNumber: idx + 1 })));
  };

  const updateInstruction = (index: number, field: string, value: any) => {
    const next = [...instructions];
    next[index] = { ...next[index], [field]: value };
    setInstructions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      contentType,
      title,
      slug: slug || generateSlug(title),
      summary: summary || null,
      status,
      servings: Number(servings) || 4,
      prepTimeMinutes: prepTimeMinutes !== '' ? Number(prepTimeMinutes) : null,
      cookTimeMinutes: cookTimeMinutes !== '' ? Number(cookTimeMinutes) : null,
      cuisine: cuisine || null,
      difficulty: difficulty || null,
      imageUrl: imageUrl || null,
      ingredients: ingredients.filter((ing) => ing.itemName.trim().length > 0),
      instructions: instructions.filter((inst) => inst.instructionText.trim().length > 0),
      tags: tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
      changeSummary: changeSummary || undefined,
    };

    try {
      const url = isEditing ? `/api/content/${initialData?.id}` : '/api/content';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save content');
      }

      router.push(`/content/${json.data.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl amber-gradient-bg text-white font-medium text-sm shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : isEditing ? 'Save Changes & Version' : 'Create Content'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Core Metadata Card */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
        <h2 className="text-lg font-bold text-white">General Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            >
              <option value="recipe">Recipe</option>
              <option value="technique">Technique</option>
              <option value="ingredient_guide">Ingredient Guide</option>
              <option value="sauce">Sauce</option>
              <option value="spice_blend">Spice Blend</option>
              <option value="kitchen_tip">Kitchen Tip</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Grandma's Classic Lasagna"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 text-sm font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">Slug (Unique identifier)</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">Summary / Overview</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description or backstory of this item..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Cuisine</label>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g. Italian, Mexican, French"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Servings</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Prep (Mins)</label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Cook (Mins)</label>
              <input
                type="number"
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">Primary Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Ingredients Section */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Ingredients</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ingredient</span>
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Ingredient Name (e.g. All-Purpose Flour)"
                  value={ing.itemName}
                  onChange={(e) => updateIngredient(idx, 'itemName', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Amount (e.g. 2)"
                  value={ing.amount ?? ''}
                  onChange={(e) => updateIngredient(idx, 'amount', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <IngredientUnitSelect
                  value={ing.unit || ''}
                  onChange={(val) => updateIngredient(idx, 'unit', val)}
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Notes (e.g. sifted)"
                  value={ing.notes || ''}
                  onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Instructions Section */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Instructions & Steps</h2>
          <button
            type="button"
            onClick={addInstruction}
            className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Step</span>
          </button>
        </div>

        <div className="space-y-3">
          {instructions.map((inst, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-neutral-300">
                <span>Step {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={2}
                placeholder="Describe this step in detail..."
                value={inst.instructionText}
                onChange={(e) => updateInstruction(idx, 'instructionText', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
              />

              <div className="w-48">
                <input
                  type="number"
                  placeholder="Timer in minutes (optional)"
                  value={inst.timerMinutes ?? ''}
                  onChange={(e) => updateInstruction(idx, 'timerMinutes', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags & Versioning Notes */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4 text-xs">
        <h2 className="text-lg font-bold text-white">Tags & Audit Notes</h2>

        <div>
          <label className="block text-neutral-300 font-medium mb-1.5">Tags (Comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. Italian, Pasta, Family Favorite, Quick"
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {isEditing && (
          <div>
            <label className="block text-orange-400 font-medium mb-1.5">Revision Change Summary</label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Adjusted garlic amount and updated cook time"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-orange-500/30 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        )}
      </div>
    </form>
  );
}
