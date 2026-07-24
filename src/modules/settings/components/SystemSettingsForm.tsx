'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, Save, CheckCircle2, AlertCircle, Scale, Search, Shield } from 'lucide-react';

export interface SystemSettingsConfig {
  id?: string;
  unitSystem?: 'metric' | 'imperial';
  pwaEnabled?: boolean;
  searchMode?: 'fts5' | 'hybrid';
  defaultLanguage?: string;
}

export function SystemSettingsForm({ initialConfig }: { initialConfig?: SystemSettingsConfig | null }) {
  const router = useRouter();
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    initialConfig?.unitSystem || 'metric'
  );
  const [searchMode, setSearchMode] = useState<'fts5' | 'hybrid'>(
    initialConfig?.searchMode || 'fts5'
  );
  const [pwaEnabled, setPwaEnabled] = useState<boolean>(
    initialConfig?.pwaEnabled ?? true
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings/system', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitSystem,
          searchMode,
          pwaEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.error || 'Failed to update system settings.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-base font-bold text-white">App Preferences & Unit System</h2>
            <p className="text-xs text-neutral-400">Configure global unit system defaults, search mode, and PWA</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl amber-gradient-bg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shadow-md"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save System Preferences'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System preferences updated successfully! Metric system is active.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unit System Picker */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Scale className="w-4 h-4 text-orange-400" />
            Default Unit System
          </label>
          <select
            value={unitSystem}
            onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-white focus:outline-none focus:border-orange-500 capitalize"
          >
            <option value="metric">Metric System (g, kg, ml, L, °C) - Default</option>
            <option value="imperial">Imperial System (oz, lbs, cups, °F)</option>
          </select>
          <p className="text-[11px] text-neutral-400">
            Selected unit system will be used as the default for recipe ingredient displays across the app.
          </p>
        </div>

        {/* Search Mode Picker */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            Search Engine Mode
          </label>
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as 'fts5' | 'hybrid')}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-white focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="fts5">FTS5 Full-Text Search Index</option>
            <option value="hybrid">Hybrid (FTS5 + Vector Embeddings)</option>
          </select>
          <p className="text-[11px] text-neutral-400">
            SQLite FTS5 full-text indexing engine for instant recipe and ingredient search.
          </p>
        </div>

        {/* Offline PWA Toggle */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Offline PWA Support
          </label>
          <select
            value={pwaEnabled ? 'enabled' : 'disabled'}
            onChange={(e) => setPwaEnabled(e.target.value === 'enabled')}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-white focus:outline-none focus:border-orange-500 capitalize"
          >
            <option value="enabled">Enabled (Offline Caching Active)</option>
            <option value="disabled">Disabled</option>
          </select>
          <p className="text-[11px] text-neutral-400">
            Enables ServiceWorker offline caching for cooking in low-connectivity kitchens.
          </p>
        </div>
      </div>
    </form>
  );
}
