import { initializeDatabase } from '@/core/db/init-db';
import { db } from '@/core/db';
import { AISettingsForm } from '@/modules/ai/components/AISettingsForm';
import { SystemSettingsForm } from '@/modules/settings/components/SystemSettingsForm';
import { 
  Settings as SettingsIcon, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Server
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

  // Mask the API key before passing to the form to prevent exposure in page source
  const maskedAiSettings = aiSettings
    ? {
        ...aiSettings,
        apiKey: aiSettings.apiKey ? '••••••••' : '',
      }
    : null;

  return (
    <div className="space-y-6 w-full max-w-full animate-hud-reveal">
      {/* Settings Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <span>Settings</span>
        </h1>
      </div>

      {/* Interactive AI Gateway Configuration & Live Tester */}
      <AISettingsForm initialConfig={maskedAiSettings as any} />

      {/* Interactive System Preferences Form (Unit System, Search Engine, PWA) */}
      <SystemSettingsForm initialConfig={sysSettings as any} />

      {/* Database & Infrastructure Config Card */}
      <div className="p-5 sm:p-6 rounded-2xl elevation-level2 border border-neutral-800/90 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-4.5 h-4.5 text-orange-400" />
            <h2 className="text-base font-bold text-white font-sans">Database Status</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {process.env.TURSO_DATABASE_URL ? 'Turso Cloud Connected' : 'Local SQLite Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="font-semibold text-zinc-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-400" />
              Connection
            </span>
            <p className="text-zinc-400">
              URL: <code className="text-orange-400">{process.env.TURSO_DATABASE_URL || 'file:local.db'}</code>
            </p>
            <p className="text-zinc-400">
              Driver: <code className="text-orange-400">Drizzle LibSQL</code>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Modules
            </span>
            <ul className="text-zinc-400 space-y-1">
              <li>• <code className="text-zinc-200">content_entities</code>, <code className="text-zinc-200">ingredients</code>, <code className="text-zinc-200">instructions</code></li>
              <li>• <code className="text-zinc-200">revisions</code>, <code className="text-zinc-200">raw_imports</code>, <code className="text-zinc-200">ai_drafts</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
