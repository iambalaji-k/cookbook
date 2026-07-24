import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getAIDrafts } from '@/modules/drafts/services/draft-service';
import { Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, Cpu, ShieldCheck, Plus } from 'lucide-react';

export const revalidate = 0;

export default async function AIDraftsQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await initializeDatabase();
  const { status } = await searchParams;
  const filterStatus = (status as 'pending' | 'approved' | 'rejected') || 'pending';
  const drafts = await getAIDrafts(filterStatus);

  const statusBadges = {
    pending: { label: 'Pending Review', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    approved: { label: 'Approved & Committed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Admin AI Draft Review Queue
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Enforces the mandatory Human Approval Policy. AI never modifies production database tables directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/drafts/seed"
            className="px-3.5 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Sample AI Draft</span>
          </a>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Staging: Active</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Pending Approval', value: 'pending' },
          { label: 'Approved History', value: 'approved' },
          { label: 'Rejected History', value: 'rejected' },
        ].map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/drafts?status=${tab.value}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Draft List */}
      {drafts.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel border border-neutral-800 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-neutral-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No {filterStatus} AI drafts in queue</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Click the button below to generate a fresh sample pending AI draft for pre-commit testing!
            </p>
          </div>
          <a
            href="/api/drafts/seed"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Sample Draft</span>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const statusInfo = statusBadges[draft.status as keyof typeof statusBadges] || statusBadges.pending;
            const StatusIcon = statusInfo.icon;
            const payload = JSON.parse(draft.proposedDataJSON || '{}');

            return (
              <div
                key={draft.id}
                className="p-6 rounded-2xl glass-panel border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {draft.targetContentType.replace('_', ' ')}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${statusInfo.class}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusInfo.label}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded bg-neutral-900 text-emerald-400 border border-neutral-800 text-[10px] font-bold">
                      Confidence: {draft.confidence}/100
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {payload.title || 'Untitled Proposal'}
                  </h3>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong className="text-neutral-300">AI Rationale:</strong> {draft.reason}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      {draft.provider} ({draft.model})
                    </span>
                    <span>Tokens: {draft.tokenUsage}</span>
                    <span>Latency: {draft.latencyMs}ms</span>
                    <span>Created: {new Date(draft.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-800/80 pt-4 md:pt-0">
                  <Link
                    href={`/drafts/${draft.id}`}
                    className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  >
                    <span>Review Proposal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
