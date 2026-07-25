import Link from 'next/link';
import { initializeDatabase } from '@/core/db/init-db';
import { getRawImports } from '@/modules/imports/services/import-service';
import { DeleteImportButton } from '@/modules/imports/components/DeleteImportButton';
import { FileText, Plus, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const revalidate = 30;

export default async function RawImportsPage() {
  await initializeDatabase();
  const imports = await getRawImports();

  const statusBadges = {
    pending: { label: 'Pending AI Draft', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    processed: { label: 'Processed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    failed: { label: 'Failed', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
  };

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <span>Import</span>
        </h1>

        <Link
          href="/imports/new"
          className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Import</span>
        </Link>
      </div>

      {/* Imports Queue Table */}
      {imports.length === 0 ? (
        <div className="p-12 rounded-2xl elevation-level2 border border-neutral-800/90 text-center space-y-4 shadow-xl">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white font-sans">No imports recorded yet</h3>
          </div>
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl amber-gradient-bg text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Import</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl elevation-level2 border border-neutral-800/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-neutral-900/90 border-b border-neutral-800 text-zinc-400 font-mono font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Source Payload Snippet</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created At</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-zinc-200">
                {imports.map((item) => {
                  const statusInfo = statusBadges[item.status] || statusBadges.pending;
                  const StatusIcon = statusInfo.icon;
                  const snippet = item.rawPayload.substring(0, 100) + (item.rawPayload.length > 100 ? '...' : '');

                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-orange-400 font-mono text-[11px] whitespace-nowrap uppercase">
                        {item.sourceType.replace('_', ' ')}
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono text-zinc-200 line-clamp-1">{snippet}</p>
                        {item.sourceUrl && (
                          <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                            {item.sourceUrl}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 ${statusInfo.class}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/imports/${item.id}`}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-zinc-200 hover:text-white hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                          >
                            Inspect
                          </Link>
                          <DeleteImportButton
                            importId={item.id}
                            snippet={item.rawPayload.substring(0, 30)}
                          />
                        </div>
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
