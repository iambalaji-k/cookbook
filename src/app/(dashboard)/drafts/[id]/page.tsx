import { notFound } from 'next/navigation';
import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getAIDraftById } from '@/modules/drafts/services/draft-service';
import { EditableProposalReview } from '@/modules/drafts/components/EditableProposalReview';
import { Sparkles, ArrowLeft, Cpu, FileText, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const revalidate = 30;

export default async function ReviewAIDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await initializeDatabase();
  const { id } = await params;
  const draft = await getAIDraftById(id);

  if (!draft) {
    notFound();
  }

  const statusBadges = {
    pending: { label: 'Pending Review', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    approved: { label: 'Approved & Committed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  };

  const statusInfo = statusBadges[draft.status as keyof typeof statusBadges] || statusBadges.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/drafts"
          className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Drafts Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.class}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusInfo.label}</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 text-xs font-bold">
            Confidence: {draft.confidence}/100
          </span>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="p-8 rounded-2xl glass-panel border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
            Target Type: {draft.targetContentType.replace('_', ' ')}
          </span>
          <span className="text-neutral-500 text-xs font-mono">Draft ID: {draft.id}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Staged AI Proposal Review
        </h1>

        {/* AI Rationale Callout Box */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 text-xs text-neutral-200 space-y-2">
          <div className="flex items-center justify-between font-semibold text-amber-400">
            <span>AI Proposal Rationale Summary</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              {draft.provider} ({draft.model})
            </span>
          </div>
          <p className="leading-relaxed text-neutral-300">{draft.reason}</p>
        </div>

        {/* Source & Audit Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400 border-t border-neutral-800/80">
          <div className="flex items-center gap-4">
            {draft.sourceImport && (
              <Link
                href={`/imports/${draft.sourceImport.id}`}
                className="text-orange-400 font-medium hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Preserved Raw Source</span>
              </Link>
            )}
            <span>Latency: <strong className="text-neutral-200">{draft.latencyMs}ms</strong></span>
            <span>Tokens: <strong className="text-neutral-200">{draft.tokenUsage}</strong></span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Human Approval & Edit Controls Active</span>
          </div>
        </div>
      </div>

      {/* Editable Proposal Review & Diff View */}
      <EditableProposalReview draft={draft as any} />
    </div>
  );
}
