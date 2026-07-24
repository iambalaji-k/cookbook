import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getRawImports } from '@/modules/imports/services/import-service';
import { FileText, Plus, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const revalidate = 0;

export default async function RawImportsPage() {
  await initializeDatabase();
  const imports = await getRawImports();

  const statusBadges = {
    pending: { label: 'Pending AI Draft', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    processed: { label: 'Processed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    failed: { label: 'Failed', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Raw Source Ingestion Queue
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Preserved unadulterated source material (URLs, OCR scans, plain text) stored prior to AI draft generation.
          </p>
        </div>

        <Link
          href="/imports/new"
          className="px-4 py-2.5 rounded-xl amber-gradient-bg text-white font-medium text-sm shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest Raw Source</span>
        </Link>
      </div>

      {/* Imports Queue Table */}
      {imports.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel border border-neutral-800 text-center space-y-4">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No raw source imports yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Ingest a web recipe link, OCR scan text, or plain text dump to save your first unadulterated source payload.
            </p>
          </div>
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Source</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Source Payload Snippet</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {imports.map((item) => {
                  const statusInfo = statusBadges[item.status] || statusBadges.pending;
                  const StatusIcon = statusInfo.icon;
                  const snippet = item.rawPayload.substring(0, 90) + (item.rawPayload.length > 90 ? '...' : '');

                  return (
                    <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-4 font-semibold text-orange-400 uppercase text-[11px] whitespace-nowrap">
                        {item.sourceType.replace('_', ' ')}
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="font-mono text-neutral-300 line-clamp-1">{snippet}</p>
                        {item.sourceUrl && (
                          <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-3 h-3 text-neutral-600" />
                            {item.sourceUrl}
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 ${statusInfo.class}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 text-[11px] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link
                          href={`/imports/${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                          Inspect Source
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
