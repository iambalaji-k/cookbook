import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRawImportById } from '@/modules/imports/services/import-service';
import { ProcessImportButton } from '@/modules/imports/components/ProcessImportButton';
import { DeleteImportButton } from '@/modules/imports/components/DeleteImportButton';
import { FileText, ArrowLeft, ExternalLink, Clock, ShieldCheck } from 'lucide-react';

export const revalidate = 30;

export default async function RawImportInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getRawImportById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/imports"
          className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Raw Imports Queue</span>
        </Link>

        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: {item.status}</span>
        </span>
      </div>

      {/* Hero Card */}
      <div className="p-8 rounded-2xl glass-panel border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              {item.sourceType.replace('_', ' ')}
            </span>
            <span className="text-neutral-500 text-xs font-mono">ID: {item.id}</span>
          </div>

          <ProcessImportButton importId={item.id} />
          <DeleteImportButton
            importId={item.id}
            snippet={item.rawPayload.substring(0, 30)}
          />
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Unadulterated Raw Source Inspector
        </h1>

        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-mono hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{item.sourceUrl}</span>
          </a>
        )}

        <div className="pt-2 text-xs text-neutral-400 flex items-center gap-4 border-t border-neutral-800/80">
          <span>Ingested At: <strong className="text-neutral-200" suppressHydrationWarning>{new Date(item.createdAt).toLocaleString()}</strong></span>
          <span>Payload Size: <strong className="text-neutral-200">{item.rawPayload.length} bytes</strong></span>
        </div>
      </div>

      {/* Raw Payload Display Panel */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Preserved Source Payload
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            Unedited Source Text
          </span>
        </div>

        <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px]">
          {item.rawPayload}
        </pre>
      </div>

      {/* Metadata Panel */}
      {item.metadataJSON && (
        <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-3">
          <h2 className="text-sm font-bold text-neutral-300">Ingestion Metadata</h2>
          <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-mono overflow-x-auto">
            {item.metadataJSON}
          </pre>
        </div>
      )}
    </div>
  );
}
