'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface DraftActionButtonsProps {
  draftId: string;
  status: string;
}

export function DraftActionButtons({ draftId, status }: DraftActionButtonsProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'pending') {
    return (
      <div className="p-4 rounded-xl glass-panel border border-neutral-800 text-center text-xs text-neutral-400 font-medium">
        This proposal has been <strong className="text-white capitalize">{status}</strong>.
      </div>
    );
  }

  const handleApprove = async () => {
    setApproving(true);
    setError(null);

    try {
      const res = await fetch(`/api/drafts/${draftId}/approve`, {
        method: 'POST',
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
      const res = await fetch(`/api/drafts/${draftId}/reject`, {
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
            Approving commits this payload to production tables and creates a <code className="text-amber-300">revision</code> snapshot.
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
            <span>{approving ? 'Committing to DB...' : 'Approve & Commit to Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
