import { ArrowRight, Plus, Edit, Clock, Tag as TagIcon } from 'lucide-react';

interface DiffViewerProps {
  targetEntity?: {
    title: string;
    summary?: string | null;
    servings?: number | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    imageUrl?: string | null;
    tags?: Array<{ tagName: string }> | string[];
    ingredients?: Array<{ itemName: string; amount?: number | null; unit?: string | null; notes?: string | null }>;
    instructions?: Array<{ stepNumber: number; instructionText: string; timerMinutes?: number | null }>;
  } | null;
  proposedData: {
    title: string;
    summary?: string | null;
    servings?: number | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    imageUrl?: string | null;
    tags?: Array<{ tagName: string }> | string[];
    ingredients?: Array<{ itemName: string; amount?: number | null; unit?: string | null; notes?: string | null }>;
    instructions?: Array<{ stepNumber: number; instructionText: string; timerMinutes?: number | null }>;
  };
}

export function DiffViewer({ targetEntity, proposedData }: DiffViewerProps) {
  const isNewContent = !targetEntity;

  const renderTags = (tagsList?: any) => {
    if (!tagsList) return null;
    const array = Array.isArray(tagsList)
      ? tagsList.map((t) => (typeof t === 'string' ? t : t.tagName))
      : [];
    if (array.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {array.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-medium flex items-center gap-1"
          >
            <TagIcon className="w-3 h-3 text-orange-400" />
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          {isNewContent ? <Plus className="w-4 h-4 text-emerald-400" /> : <Edit className="w-4 h-4 text-amber-400" />}
          <span>{isNewContent ? 'Proposed New Content Entity' : 'Side-by-Side Entity Diff Comparison'}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Left Column: Target / Original State */}
        <div className="p-5 rounded-2xl glass-panel border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="font-semibold text-neutral-400">
              {isNewContent ? 'Current State' : 'Original Database Entity'}
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[10px]">
              {isNewContent ? 'Not Created Yet' : 'Live Record'}
            </span>
          </div>

          {isNewContent ? (
            <div className="p-8 text-center text-neutral-500 italic">
              This AI draft proposes creating a new record. No prior database entity exists.
            </div>
          ) : (
            <div className="space-y-3">
              {targetEntity?.imageUrl && (
                <div className="h-32 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                  <img src={targetEntity.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <span className="text-[11px] text-neutral-500 block">Title</span>
                <p className="font-bold text-neutral-200">{targetEntity?.title}</p>
              </div>

              {targetEntity?.summary && (
                <div>
                  <span className="text-[11px] text-neutral-500 block">Summary</span>
                  <p className="text-neutral-300 leading-relaxed">{targetEntity.summary}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-neutral-400">
                <div>Servings: <strong className="text-neutral-200">{targetEntity?.servings || 4}</strong></div>
                <div>Prep: <strong className="text-neutral-200">{targetEntity?.prepTimeMinutes || 0}m</strong></div>
                <div>Cook: <strong className="text-neutral-200">{targetEntity?.cookTimeMinutes || 0}m</strong></div>
              </div>

              {renderTags(targetEntity?.tags)}

              {targetEntity?.ingredients && targetEntity.ingredients.length > 0 && (
                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1">Ingredients ({targetEntity.ingredients.length})</span>
                  <ul className="space-y-1 text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 font-mono">
                    {targetEntity.ingredients.map((ing, i) => (
                      <li key={i}>• {ing.amount ? `${ing.amount} ` : ''}{ing.unit ? `${ing.unit} ` : ''}<strong>{ing.itemName}</strong>{ing.notes ? ` (${ing.notes})` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Staged Proposed State */}
        <div className="p-5 rounded-2xl glass-panel border border-orange-500/30 space-y-4 bg-orange-500/[0.02]">
          <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
            <span className="font-semibold text-orange-400 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-orange-400" />
              Proposed AI Mutation Payload
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono text-[10px]">
              Staged Proposal
            </span>
          </div>

          <div className="space-y-3">
            {proposedData.imageUrl && (
              <div className="h-32 rounded-xl overflow-hidden bg-neutral-950 border border-orange-500/30">
                <img src={proposedData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <span className="text-[11px] text-neutral-500 block">Proposed Title</span>
              <p className="font-bold text-white">{proposedData.title}</p>
            </div>

            {proposedData.summary && (
              <div>
                <span className="text-[11px] text-neutral-500 block">Proposed Summary</span>
                <p className="text-neutral-200 leading-relaxed">{proposedData.summary}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-neutral-300">
              <div>Servings: <strong className="text-orange-400">{proposedData.servings || 4}</strong></div>
              <div>Prep: <strong className="text-orange-400">{proposedData.prepTimeMinutes || 0}m</strong></div>
              <div>Cook: <strong className="text-orange-400">{proposedData.cookTimeMinutes || 0}m</strong></div>
            </div>

            {renderTags(proposedData.tags)}

            {proposedData.ingredients && proposedData.ingredients.length > 0 && (
              <div>
                <span className="text-[11px] text-neutral-500 block mb-1">Proposed Ingredients ({proposedData.ingredients.length})</span>
                <ul className="space-y-1.5 text-neutral-200 bg-neutral-950 p-2.5 rounded-lg border border-orange-500/20">
                  {proposedData.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>• <strong className="text-white">{ing.itemName}</strong></span>
                      <span className="font-mono text-orange-300 text-[11px]">
                        {ing.amount ? `${ing.amount} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.notes ? `(${ing.notes})` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {proposedData.instructions && proposedData.instructions.length > 0 && (
              <div>
                <span className="text-[11px] text-neutral-500 block mb-1">Proposed Instructions & Step Timers</span>
                <ol className="space-y-2 text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 list-decimal list-inside">
                  {proposedData.instructions.map((inst, i) => (
                    <li key={i} className="text-neutral-200 leading-relaxed">
                      <span>{inst.instructionText}</span>
                      {inst.timerMinutes ? (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                          <Clock className="w-3 h-3" />
                          {inst.timerMinutes}m
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
