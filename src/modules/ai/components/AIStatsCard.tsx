'use client';

import { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Clock, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  FileCode2,
  Calendar
} from 'lucide-react';

export interface AIStatsProps {
  provider?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  tokenUsage?: number | null;
  confidence?: number | null;
  promptVersion?: string | null;
  timestamp?: string | null;
  reasoningSummary?: string | null;
  createdBy?: string | null;
}

export function AIStatsCard(props: AIStatsProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  const {
    provider = 'OpenAI',
    model = 'gpt-4o-mini',
    latencyMs = 0,
    tokenUsage = 0,
    confidence = 100,
    promptVersion = 'v1.0',
    timestamp,
    reasoningSummary,
  } = props;

  // Don't render if no provider/model specified and no reasoning
  if (!provider && !model && !reasoningSummary) return null;

  // Confidence color mapping
  const confidenceColor = 
    (confidence || 100) >= 90 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
    (confidence || 100) >= 70 ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
    'text-red-400 border-red-500/20 bg-red-500/10';

  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleString(undefined, { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      })
    : null;

  return (
    <div className="p-5 rounded-2xl glass-panel border border-neutral-800 space-y-4 shadow-xl relative overflow-hidden">
      {/* Subtle glowing accent background */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI Execution Stats & Gateway Provenance</span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 uppercase font-mono">
                {promptVersion || 'v1.0'}
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Model performance metrics & generation telemetry</p>
          </div>
        </div>

        {confidence !== undefined && confidence !== null && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${confidenceColor}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{confidence}% Confidence</span>
          </div>
        )}
      </div>

      {/* Grid of AI Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Provider */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <Cpu className="w-3.5 h-3.5 text-orange-400" /> Provider
          </span>
          <p className="font-semibold text-white capitalize truncate">{provider || 'OpenAI'}</p>
        </div>

        {/* Model */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Model
          </span>
          <p className="font-semibold text-amber-300 font-mono text-[11px] truncate">{model || 'gpt-4o-mini'}</p>
        </div>

        {/* Latency */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Latency
          </span>
          <p className="font-semibold text-white font-mono">{latencyMs ? `${latencyMs} ms` : 'N/A'}</p>
        </div>

        {/* Token Usage */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Token Usage
          </span>
          <p className="font-semibold text-emerald-400 font-mono">
            {tokenUsage ? `${tokenUsage.toLocaleString()} tokens` : 'N/A'}
          </p>
        </div>

        {/* Prompt Version */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <FileCode2 className="w-3.5 h-3.5 text-purple-400" /> Prompt Version
          </span>
          <p className="font-semibold text-neutral-200 font-mono">{promptVersion || 'v1.0'}</p>
        </div>

        {/* Timestamp */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-rose-400" /> Timestamp
          </span>
          <p className="font-semibold text-neutral-300 text-[11px] truncate">
            {formattedDate || 'Recent'}
          </p>
        </div>
      </div>

      {/* Collapsible Reasoning Summary */}
      {reasoningSummary && (
        <div className="border-t border-neutral-800/80 pt-3">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 text-orange-400">
              <Terminal className="w-4 h-4" />
              <span>Reasoning Summary & AI Rationale</span>
            </span>
            {showReasoning ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {showReasoning && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/90 text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
              {reasoningSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
