'use client';

/**
 * Preview a request as one recipient will see it, at desktop, tablet or mobile width
 * (900 / 720 / 375 px, as in Flash Sign's preview).
 */
import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, Mail } from 'lucide-react';
import type { PdfAttachment, SignatureField } from '@/types';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import { DocPages } from './pdf-pages';
import { FIELD_META, fieldStyle, isOnFile } from './fields';
import { cn } from '@/lib/utils';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 900 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 720 },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 375 },
] as const;

export function RecipientPreview({
  isOpen,
  onClose,
  title,
  message,
  senderName,
  docs,
  fields,
  signers,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  senderName: string;
  docs: PdfAttachment[];
  fields: SignatureField[];
  signers: { id: string; name: string; email: string; color: string }[];
}) {
  const [signerId, setSignerId] = useState('');
  const [device, setDevice] = useState<(typeof DEVICES)[number]['id']>('desktop');
  const signer = signers.find(s => s.id === signerId) ?? signers[0];
  const width = DEVICES.find(d => d.id === device)!.width;
  const mine = fields.filter(f => f.signerId === signer?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">Preview as a recipient</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={signer?.id}
              onChange={e => setSignerId(e.target.value)}
              className="px-2 py-1.5 text-xs rounded-md border border-line bg-paper-elevated"
              aria-label="Recipient"
            >
              {signers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
            <div className="flex gap-1 p-0.5 rounded-lg bg-mist/50">
              {DEVICES.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDevice(d.id)}
                  className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold', device === d.id ? 'bg-paper-elevated text-ink shadow-sm' : 'text-muted')}
                >
                  <d.icon className="w-3.5 h-3.5" /> {d.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="overflow-auto max-h-[75vh] bg-mist/40 rounded-lg p-4">
          <div className="mx-auto bg-paper rounded-xl border border-line shadow-sm p-3 space-y-3" style={{ width }}>
            <div className="p-3 rounded-lg bg-paper-elevated border border-line space-y-1">
              <p className="text-xs text-muted flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {senderName} sent you a document to sign</p>
              <p className="text-sm font-bold text-ink">{title || 'Untitled'}</p>
              {message && <p className="text-[11px] text-ink-soft whitespace-pre-line">{message}</p>}
              <p className="text-[11px] font-semibold text-waiting">
                {mine.filter(f => f.required).length} required field{mine.filter(f => f.required).length === 1 ? '' : 's'} to fill
              </p>
            </div>
            {docs.map((doc, i) => (
              <DocPages
                key={doc.fileId}
                doc={doc}
                maxWidth={width - 24}
                showZoom={false}
                heading={docs.length > 1 ? <p className="text-xs font-bold text-ink">Document {i + 1}: {doc.name}</p> : undefined}
                renderOverlay={page => (
                  <div className="absolute inset-0 pointer-events-none" style={{ containerType: 'inline-size' }}>
                    {mine.filter(f => f.pageNumber === page && isOnFile(f, doc.fileId, docs[0]?.fileId)).map(f => {
                      const { label, icon: Icon } = FIELD_META[f.type];
                      return (
                        <div key={f.id} className="absolute rounded-sm border-2 border-amber-400 bg-amber-100/70 flex items-center justify-center" style={fieldStyle(f)}>
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-900 truncate">
                            <Icon className="w-3 h-3 flex-shrink-0" /> {f.type === 'checkbox' ? '' : label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
