'use client';

import { useState } from 'react';
import { Cpu, Save, Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AISettingsFormProps {
  initialConfig?: {
    provider: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    temperature?: string;
    promptVersion?: string;
  };
}

export function AISettingsForm({ initialConfig }: AISettingsFormProps) {
  const [provider, setProvider] = useState(initialConfig?.provider || 'openai');
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [model, setModel] = useState(initialConfig?.model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(initialConfig?.temperature || '0.2');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          baseUrl,
          apiKey,
          model,
          temperature,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save settings');

      setSaveMessage({ type: 'success', text: 'AI Gateway settings saved successfully!' });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configOverride: {
            provider,
            baseUrl,
            apiKey: apiKey === '••••••••' ? undefined : apiKey,
            model,
            temperature,
          },
        }),
      });

      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Network test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handlePresetSelect = (presetProvider: string) => {
    setProvider(presetProvider);
    if (presetProvider === 'openai') {
      setBaseUrl('https://api.openai.com/v1');
      setModel('gpt-4o-mini');
    } else if (presetProvider === 'deepseek') {
      setBaseUrl('https://api.deepseek.com/v1');
      setModel('deepseek-chat');
    } else if (presetProvider === 'groq') {
      setBaseUrl('https://api.groq.com/openai/v1');
      setModel('llama-3.3-70b-versatile');
    } else if (presetProvider === 'openrouter') {
      setBaseUrl('https://openrouter.ai/api/v1');
      setModel('meta-llama/llama-3.3-70b-instruct');
    } else if (presetProvider === 'ollama') {
      setBaseUrl('http://localhost:11434/v1');
      setModel('llama3');
      setApiKey('');
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">AI Gateway Abstraction Settings</h2>
            <p className="text-xs text-neutral-400">Configure provider-agnostic OpenAI-compatible API parameters</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
          <span>{testing ? 'Testing...' : 'Test Connection'}</span>
        </button>
      </div>

      {/* Provider Preset Buttons */}
      <div className="space-y-1.5 text-xs">
        <span className="text-neutral-400 font-medium">Quick Provider Presets:</span>
        <div className="flex flex-wrap gap-2">
          {['openai', 'deepseek', 'groq', 'openrouter', 'ollama'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={`px-3 py-1 rounded-lg border uppercase text-[11px] font-semibold transition-all ${
                provider === p
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Provider Name</label>
            <input
              type="text"
              required
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. openai, deepseek, groq, ollama"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Model Name</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o-mini, deepseek-chat, llama3"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">Base Endpoint URL (OpenAI-Compatible /v1)</label>
            <input
              type="text"
              required
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">API Key (Optional for local Ollama/LM Studio)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {saveMessage && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl amber-gradient-bg text-white font-medium text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save AI Credentials'}</span>
          </button>
        </div>
      </form>

      {/* Test Connection Results Panel */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border space-y-2 text-xs ${
            testResult.status === 'ok'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/5 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {testResult.status === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{testResult.message}</span>
          </div>

          {testResult.audit && (
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-neutral-800 text-[11px] text-neutral-400">
              <div>Provider: <strong className="text-neutral-200">{testResult.audit.provider}</strong></div>
              <div>Model: <strong className="text-neutral-200">{testResult.audit.model}</strong></div>
              <div>Latency: <strong className="text-amber-400">{testResult.audit.latencyMs}ms</strong></div>
              <div>Confidence: <strong className="text-emerald-400">{testResult.audit.confidence}/100</strong></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
