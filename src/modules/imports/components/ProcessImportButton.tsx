'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface ProcessImportButtonProps {
  importId: string;
}

export function ProcessImportButton({ importId }: ProcessImportButtonProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/imports/${importId}/process`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'AI processing failed');
      }

      // Redirect directly to the staged draft review queue!
      router.push(`/drafts/${json.draftId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during AI extraction');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleProcess}
        disabled={processing}
        className="px-5 py-2.5 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
      >
        {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        <span>{processing ? 'Feeding into AI Gateway...' : 'Process with AI Gateway → Create Draft'}</span>
      </button>
    </div>
  );
}
