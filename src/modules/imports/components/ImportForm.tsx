'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OCRScanner } from './OCRScanner';
import { 
  FileText, 
  Globe, 
  Camera, 
  Save, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export function ImportForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<'plain_text' | 'url' | 'ocr_image'>('plain_text');
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawPayload, setRawPayload] = useState('');
  const [autoProcessAI, setAutoProcessAI] = useState(true);

  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Scraper handler
  const handleScrape = async () => {
    if (!sourceUrl.trim()) return;
    setScraping(true);
    setError(null);

    try {
      const res = await fetch('/api/imports/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Scraper failed');
      }

      setRawPayload(json.rawPayload);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape URL');
    } finally {
      setScraping(false);
    }
  };

  // OCR Completion handler
  const handleOCRComplete = (extractedText: string) => {
    setRawPayload(extractedText);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPayload.trim()) {
      setError('Raw payload content is required before saving.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Ingest into raw_imports
      const res = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceUrl: sourceUrl.trim() || null,
          rawPayload,
          metadataJSON: JSON.stringify({ ingestedVia: 'import_form', autoProcessAI }),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save raw import');
      }

      const importId = json.data.id;

      // 2. If autoProcessAI is enabled, process through AI Gateway & redirect to drafts!
      if (autoProcessAI) {
        const processRes = await fetch(`/api/imports/${importId}/process`, {
          method: 'POST',
        });
        const processJson = await processRes.json();
        if (processRes.ok && processJson.draftId) {
          router.push(`/drafts/${processJson.draftId}`);
          router.refresh();
          return;
        }
      }

      router.push(`/imports/${importId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving import');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Source Type Tab Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        {[
          { id: 'plain_text', label: 'Text Paste', icon: FileText },
          { id: 'url', label: 'Web URL Scraper', icon: Globe },
          { id: 'ocr_image', label: 'OCR Photo Scanner', icon: Camera },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = sourceType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSourceType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 2: Web URL Scraper Bar */}
      {sourceType === 'url' && (
        <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4 text-xs">
          <label className="block font-bold text-white text-sm">Enter Recipe Web Page URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.allrecipes.com/recipe/..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleScrape}
              disabled={scraping || !sourceUrl.trim()}
              className="px-4 py-2.5 rounded-xl amber-gradient-bg text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {scraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              <span>{scraping ? 'Scraping Web Page...' : 'Fetch Recipe Text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: OCR Photo Scanner */}
      {sourceType === 'ocr_image' && (
        <OCRScanner onScanComplete={handleOCRComplete} />
      )}

      {/* Raw Payload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              Unadulterated Raw Source Material
            </label>
            <span className="text-[11px] text-neutral-400 font-mono">
              {rawPayload.length} bytes
            </span>
          </div>

          <textarea
            required
            rows={10}
            value={rawPayload}
            onChange={(e) => setRawPayload(e.target.value)}
            placeholder="Paste raw recipe text, ingredient list, or instructions here. Raw source is preserved completely untouched in raw_imports."
            className="w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Auto-Process AI Gateway Toggle */}
        <div className="p-4 rounded-xl glass-panel border border-amber-500/20 bg-amber-500/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Auto-Run AI Gateway Extraction</span>
              <p className="text-neutral-400 text-[11px]">Feeds raw payload into AI Gateway and opens the Admin Draft Review Queue automatically</p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={autoProcessAI}
            onChange={(e) => setAutoProcessAI(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting || !rawPayload.trim()}
            className="px-6 py-3 rounded-xl amber-gradient-bg text-white font-bold text-xs shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{submitting ? 'Saving & Processing...' : autoProcessAI ? 'Save to Raw Imports & Extract with AI' : 'Save to Raw Imports'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
