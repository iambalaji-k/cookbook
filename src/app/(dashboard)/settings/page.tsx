import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { AISettingsForm } from '@/modules/ai/components/AISettingsForm';
import { SystemSettingsForm } from '@/modules/settings/components/SystemSettingsForm';
import { 
  Settings as SettingsIcon, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Server,
  Sliders
} from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const dbStatus = await initializeDatabase();
  let aiSettings = null;
  let sysSettings = null;

  if (dbStatus.success) {
    try {
      aiSettings = await db.query.aiProviderSettings.findFirst();
      sysSettings = await db.query.systemSettings.findFirst();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Settings Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-orange-400" />
          System Settings & Infrastructure
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Manage AI Gateway parameters, database targets, app preferences, and project governance.
        </p>
      </div>

      {/* Interactive AI Gateway Configuration & Live Tester */}
      <AISettingsForm initialConfig={aiSettings as any} />

      {/* Interactive System Preferences Form (Unit System, Search Engine, PWA) */}
      <SystemSettingsForm initialConfig={sysSettings as any} />

      {/* Database & Infrastructure Config Card */}
      <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-base font-bold text-white">Database & Modular Schemas</h2>
              <p className="text-xs text-neutral-400">Turso serverless SQLite & Drizzle ORM pipeline</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {process.env.TURSO_DATABASE_URL ? 'Turso Cloud Connected' : 'Local SQLite Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="font-semibold text-neutral-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-400" />
              Target Connection
            </span>
            <p className="text-neutral-400">
              URL: <code className="text-orange-300">{process.env.TURSO_DATABASE_URL || 'file:local.db'}</code>
            </p>
            <p className="text-neutral-400">
              ORM Driver: <code className="text-orange-300">Drizzle LibSQL</code>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="font-semibold text-neutral-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Domain Schema Modules
            </span>
            <ul className="text-neutral-400 space-y-1">
              <li>• <code className="text-neutral-200">content_entities</code>, <code className="text-neutral-200">ingredients</code>, <code className="text-neutral-200">instructions</code></li>
              <li>• <code className="text-neutral-200">revisions</code> (snapshots with versionNumbers)</li>
              <li>• <code className="text-neutral-200">raw_imports</code> (preserves unadulterated source)</li>
              <li>• <code className="text-neutral-200">ai_drafts</code> (confidence, latency, tokenUsage)</li>
              <li>• <code className="text-neutral-200">system_settings</code> & <code className="text-neutral-200">ai_provider_settings</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
