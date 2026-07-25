import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getAIDrafts } from '@/modules/drafts/services/draft-service';
import { Sparkles, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const revalidate = 30;

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
    approved: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  };

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <span>AI Staging Queue</span>
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 font-mono">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'glow-pill-amber font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30'
                  : 'bg-neutral-900/80 border border-neutral-800 text-zinc-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Draft List */}
      {drafts.length === 0 ? (
        <div className="p-12 rounded-2xl elevation-level2 border border-neutral-800/90 text-center space-y-3 shadow-xl">
          <Sparkles className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-sans">Queue Empty ({filterStatus})</h3>
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
                className="p-5 rounded-2xl elevation-level2 border border-neutral-800/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap font-mono">
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] uppercase font-bold">
                      {draft.targetContentType.replace('_', ' ')}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${statusInfo.class}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusInfo.label}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded bg-neutral-900 text-emerald-400 border border-neutral-800 text-[10px] font-bold">
                      Confidence: {draft.confidence}/100
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-sans">
                    {payload.title || 'Untitled Proposal'}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    <strong className="text-zinc-300 font-mono">AI Rationale:</strong> {draft.reason}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-800/80 pt-3 md:pt-0 font-mono">
                  <Link
                    href={`/drafts/${draft.id}`}
                    className="px-4 py-2 rounded-xl amber-gradient-bg text-white text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Review</span>
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
