'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface OCRScannerProps {
  onScanComplete: (extractedText: string, imagePreviewUrl: string) => void;
}

export function OCRScanner({ onScanComplete }: OCRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);

    await runOCR(file, imageUrl);
  };

  const runOCR = async (file: File, previewUrl: string) => {
    setScanning(true);
    setProgress(0);
    setStatusMessage('Initializing Tesseract OCR worker...');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatusMessage(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            setProgress(Math.round(m.progress * 100));
          } else {
            setStatusMessage(m.status);
          }
        },
      });

      setStatusMessage('Analyzing recipe card image...');
      const ret = await worker.recognize(file);
      await worker.terminate();

      const extractedText = ret.data.text.trim();
      if (!extractedText) {
        throw new Error('No readable text found in image. Please try a clearer photo.');
      }

      setStatusMessage('OCR Scan Complete!');
      onScanComplete(extractedText, previewUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Camera className="w-4 h-4 text-orange-400" />
          Tesseract.js OCR Image & Photo Scanner
        </h3>
        <span className="text-[11px] text-neutral-400 font-mono">In-Browser OCR</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <div
        onClick={() => !scanning && fileInputRef.current?.click()}
        className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
          scanning
            ? 'border-amber-500/50 bg-amber-500/5 cursor-wait'
            : 'border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/50'
        }`}
      >
        {imagePreview ? (
          <div className="space-y-3">
            <img src={imagePreview} alt="OCR Upload Preview" className="h-40 mx-auto object-contain rounded-xl border border-neutral-800" />
            <p className="text-xs text-neutral-400">Click to choose a different photo</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 text-orange-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-white">Upload or Capture Recipe Card Photo</p>
              <p className="text-xs text-neutral-400 mt-1">Supports PNG, JPG, WebP photos of handwritten or printed recipes</p>
            </div>
          </div>
        )}
      </div>

      {scanning && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-300 font-medium">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
              {statusMessage}
            </span>
            <span className="text-amber-400 font-mono font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
            <div className="amber-gradient-bg h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
