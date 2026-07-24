'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteImportButtonProps {
  importId: string;
  snippet?: string;
}

export function DeleteImportButton({ importId, snippet }: DeleteImportButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const label = snippet
      ? `"${snippet}..."`
      : `this raw import`;
    if (!confirm(`Are you sure you want to delete ${label}?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/imports/${importId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/imports');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{deleting ? 'Deleting...' : 'Delete'}</span>
    </button>
  );
}
