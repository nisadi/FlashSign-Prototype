'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, RotateCcw, FileText } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import { Button, EmptyState } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';
import { requestPdfs } from '@/components/pdf/fields';
import { deletePdfFile } from '@/lib/pdf/file-store';

/** Requests you deleted: restore them, or delete them for ever (as Flash Sign's Deleted folder) */
export default function TrashPage() {
  const { trashedSignatureRequests, restoreSignatureRequests, purgeSignatureRequests, allSignatureRequests, documentItems } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const items = [...trashedSignatureRequests].sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
  const chosen = selected.filter(id => items.some(r => r.id === id));
  const allChosen = items.length > 0 && chosen.length === items.length;

  const restore = (ids: string[]) => {
    restoreSignatureRequests(ids);
    setSelected(s => s.filter(id => !ids.includes(id)));
    notify(`Restored ${ids.length} request${ids.length === 1 ? '' : 's'}`);
  };
  const purge = (ids: string[]) => {
    if (!window.confirm(`Delete ${ids.length} request${ids.length === 1 ? '' : 's'} for ever? This cannot be undone.`)) return;
    // Their PDFs are freed too, unless Documents or another request still uses them
    const stillUsed = new Set([
      ...documentItems.flatMap(d => (d.pdf ? [d.pdf.fileId] : [])),
      ...allSignatureRequests.filter(r => !ids.includes(r.id)).flatMap(requestPdfs).map(p => p.fileId),
    ]);
    items.filter(r => ids.includes(r.id)).flatMap(requestPdfs)
      .filter(pdf => !stillUsed.has(pdf.fileId))
      .forEach(pdf => void deletePdfFile(pdf.fileId).catch(() => undefined));
    purgeSignatureRequests(ids);
    setSelected(s => s.filter(id => !ids.includes(id)));
    notify(`Deleted ${ids.length} request${ids.length === 1 ? '' : 's'} for ever`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink flex items-center gap-2"><Trash2 className="w-5 h-5 text-flash-deep" /> Trash</h1>
        <p className="text-sm text-muted">Requests you deleted. Restore them, or delete them for ever.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Trash2} title="The Trash is empty" description="Requests you delete from the inbox or a request page come here." />
      ) : (
        <div className="rounded-xl border border-line bg-paper-elevated overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-line bg-mist/30">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input type="checkbox" checked={allChosen} onChange={e => setSelected(e.target.checked ? items.map(r => r.id) : [])} />
              Select all
            </label>
            {chosen.length > 0 && (
              <>
                <Button size="xs" icon={RotateCcw} onClick={() => restore(chosen)}>Restore ({chosen.length})</Button>
                <Button size="xs" variant="danger" icon={Trash2} onClick={() => purge(chosen)}>Delete for ever ({chosen.length})</Button>
              </>
            )}
            <span className="ml-auto text-[11px] text-muted">{items.length} item{items.length === 1 ? '' : 's'}</span>
          </div>
          <ul className="divide-y divide-line">
            {items.map(r => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={chosen.includes(r.id)}
                  onChange={e => setSelected(s => (e.target.checked ? [...s, r.id] : s.filter(id => id !== r.id)))}
                  aria-label={`Select ${r.title}`}
                />
                <FileText className="w-4 h-4 text-muted" />
                <div className="min-w-0 flex-1">
                  <Link href={`/signatures/${r.id}`} className="text-sm font-semibold text-ink hover:underline truncate block">{r.title}</Link>
                  <p className="text-[11px] text-muted">
                    {r.signers.length ? `To: ${r.signers.map(s => s.name).join(', ')} · ` : ''}deleted {new Date(r.deletedAt!).toLocaleString()}
                  </p>
                </div>
                <SignatureRequestStatusBadge status={r.status} />
                <Button size="xs" icon={RotateCcw} onClick={() => restore([r.id])}>Restore</Button>
                <Button size="xs" variant="ghost" icon={Trash2} onClick={() => purge([r.id])}>Delete for ever</Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
