import { ImportForm } from '@/modules/imports/components/ImportForm';

export default function NewRawImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Ingest Raw Source Material
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Save an external web URL, OCR recipe card text, or plain text dump cleanly to <code className="text-orange-400">raw_imports</code>.
        </p>
      </div>

      <ImportForm />
    </div>
  );
}
