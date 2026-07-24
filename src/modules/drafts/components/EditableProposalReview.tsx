'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DiffViewer } from './DiffViewer';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Columns, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sliders,
  Clock,
  Tag as TagIcon,
  Image as ImageIcon
} from 'lucide-react';

import { AIStatsCard } from '@/modules/ai/components/AIStatsCard';

interface EditableProposalReviewProps {
  draft: {
    id: string;
    status: string;
    targetContentType: string;
    proposedData: any;
    targetEntity?: any;
    provider: string;
    model: string;
    confidence?: number;
    tokenUsage?: number;
    latencyMs?: number;
    promptVersion?: string;
    createdAt?: string;
    reason: string;
  };
}

export function EditableProposalReview({ draft }: EditableProposalReviewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'diff' | 'edit'>('diff');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable state initialized with proposedData matching ContentForm 100%
  const [title, setTitle] = useState(draft.proposedData.title || '');
  const [slug, setSlug] = useState(draft.proposedData.slug || '');
  const [contentType, setContentType] = useState(draft.proposedData.contentType || draft.targetContentType || 'recipe');
  const [status, setStatus] = useState(draft.proposedData.status || 'published');
  const [summary, setSummary] = useState(draft.proposedData.summary || '');
  const [cuisine, setCuisine] = useState(draft.proposedData.cuisine || '');
  const [difficulty, setDifficulty] = useState(draft.proposedData.difficulty || 'medium');
  const [servings, setServings] = useState<number>(draft.proposedData.servings || 4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(draft.proposedData.prepTimeMinutes ?? '');
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(draft.proposedData.cookTimeMinutes ?? '');
  const [imageUrl, setImageUrl] = useState(draft.proposedData.imageUrl || '');

  // Tags state (comma separated or string array)
  const initialTags = Array.isArray(draft.proposedData.tags)
    ? draft.proposedData.tags.map((t: any) => (typeof t === 'string' ? t : t.tagName)).join(', ')
    : draft.proposedData.tags || '';
  const [tagsInput, setTagsInput] = useState<string>(initialTags);

  const [ingredients, setIngredients] = useState<any[]>(
    draft.proposedData.ingredients || [{ itemName: '', amount: null, unit: '', notes: '' }]
  );

  const [instructions, setInstructions] = useState<any[]>(
    draft.proposedData.instructions || [{ stepNumber: 1, instructionText: '', timerMinutes: null }]
  );

  // Ingredients handlers
  const addIngredient = () => {
    setIngredients([...ingredients, { itemName: '', amount: null, unit: '', notes: '' }]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: string, value: any) => {
    const next = [...ingredients];
    next[idx] = { ...next[idx], [field]: value };
    setIngredients(next);
  };

  // Instructions handlers
  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, instructionText: '', timerMinutes: null },
    ]);
  };

  const removeInstruction = (idx: number) => {
    const filtered = instructions.filter((_, i) => i !== idx);
    setInstructions(filtered.map((item, i) => ({ ...item, stepNumber: i + 1 })));
  };

  const updateInstruction = (idx: number, field: string, value: any) => {
    const next = [...instructions];
    next[idx] = { ...next[idx], [field]: value };
    setInstructions(next);
  };

  const constructPayload = () => {
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return {
      ...draft.proposedData,
      title,
      slug,
      contentType,
      status,
      summary,
      cuisine,
      difficulty,
      servings: Number(servings) || 4,
      prepTimeMinutes: prepTimeMinutes !== '' ? Number(prepTimeMinutes) : null,
      cookTimeMinutes: cookTimeMinutes !== '' ? Number(cookTimeMinutes) : null,
      imageUrl: imageUrl.trim() || null,
      tags: parsedTags,
      ingredients: ingredients.filter((ing) => ing.itemName.trim().length > 0),
      instructions: instructions
        .filter((inst) => inst.instructionText.trim().length > 0)
        .map((inst, i) => ({
          stepNumber: i + 1,
          instructionText: inst.instructionText,
          timerMinutes: inst.timerMinutes ? Number(inst.timerMinutes) : null,
        })),
    };
  };

  const handleApprove = async () => {
    setApproving(true);
    setError(null);

    try {
      const editedData = constructPayload();
      const res = await fetch(`/api/drafts/${draft.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedData }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to approve draft');
      }

      router.push(`/content/${json.data.committedEntity.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during approval');
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Optional rejection reason:') || undefined;
    setRejecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/drafts/${draft.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to reject draft');
      }

      router.push('/drafts');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during rejection');
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Telemetry & Rationale Card */}
      <AIStatsCard
        provider={draft.provider}
        model={draft.model}
        latencyMs={draft.latencyMs}
        tokenUsage={draft.tokenUsage}
        confidence={draft.confidence}
        promptVersion={draft.promptVersion}
        reasoningSummary={draft.reason}
        timestamp={draft.createdAt}
      />

      {/* View Mode Selector Tabs */}
      {draft.status === 'pending' && (
        <div className="flex items-center justify-between glass-panel p-2 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'diff'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side Diff View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'edit'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Proposal Before Approving</span>
            </button>
          </div>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            {viewMode === 'edit' ? 'Tweak any AI fields before committing' : 'Comparing against live database'}
          </span>
        </div>
      )}

      {/* Mode 1: Diff View */}
      {viewMode === 'diff' && (
        <DiffViewer
          targetEntity={draft.targetEntity}
          proposedData={constructPayload()}
        />
      )}

      {/* Mode 2: Edit Proposal Form (100% parity with ContentForm.tsx) */}
      {viewMode === 'edit' && draft.status === 'pending' && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-2xl glass-panel border border-orange-500/30 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              Edit Staged Proposal Parameters (100% ContentForm Parity)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-medium capitalize"
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
                <label className="block text-neutral-300 font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-medium"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Cuisine</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Italian, French, Mexican"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Total Cook Time (Mins)</label>
                  <input
                    type="number"
                    value={cookTimeMinutes}
                    onChange={(e) => setCookTimeMinutes(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="md:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cover Image URL</span>
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-mono text-xs"
                />
              </div>

              {/* Summary */}
              <div className="md:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">Summary</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief description of the dish..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Tags Input Field */}
              <div className="md:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                  <TagIcon className="w-3.5 h-3.5 text-orange-400" />
                  <span>Tags (Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Italian, Pasta, Seafood, Quick Dinner"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Editable Ingredients */}
          <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Edit Proposed Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ing.itemName}
                    onChange={(e) => updateIngredient(idx, 'itemName', e.target.value)}
                    className="col-span-5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Amount"
                    value={ing.amount ?? ''}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value ? Number(e.target.value) : null)}
                    className="col-span-2 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit || ''}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="col-span-2 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Notes (minced...)"
                    value={ing.notes || ''}
                    onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                    className="col-span-2 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="col-span-1 text-neutral-500 hover:text-red-400 flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Instructions (With Timer for Each Step) */}
          <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Edit Proposed Instructions & Step Timers</h3>
              <button
                type="button"
                onClick={addInstruction}
                className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-3">
              {instructions.map((inst, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      Step {idx + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-neutral-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px]">Step Timer (mins):</span>
                        <input
                          type="number"
                          placeholder="e.g. 5"
                          value={inst.timerMinutes ?? ''}
                          onChange={(e) => updateInstruction(idx, 'timerMinutes', e.target.value ? Number(e.target.value) : null)}
                          className="w-16 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeInstruction(idx)}
                        className="hover:text-red-400 text-neutral-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={inst.instructionText}
                    onChange={(e) => updateInstruction(idx, 'instructionText', e.target.value)}
                    placeholder="Enter detailed step instruction..."
                    className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      {draft.status === 'pending' && (
        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="p-6 rounded-2xl glass-panel border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Explicit Administrator Action</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {viewMode === 'edit' ? 'Approving commits your edited parameters and step timers directly to the database.' : 'Approving commits the proposed payload to production tables and creates a revision snapshot.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleReject}
                disabled={approving || rejecting}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {rejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>{rejecting ? 'Rejecting...' : 'Reject Proposal'}</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={approving || rejecting}
                className="px-5 py-2.5 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{approving ? 'Committing to DB...' : viewMode === 'edit' ? 'Approve & Commit Edited Payload' : 'Approve & Commit to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
