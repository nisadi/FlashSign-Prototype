'use client';

/* eslint-disable @next/next/no-img-element -- signature images are local data URLs */
import React from 'react';
import {
  PenTool, Type, CalendarDays, User, AlignLeft, CheckSquare, Check, Mail, Building2, Briefcase, Hash,
  SquareChevronDown as ChevronDownSquare, CircleDot, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import type { SignatureField, SignatureFieldType, SignatureRequest } from '@/types';
import { loadAttachmentBytes, downloadBytes } from '@/lib/pdf/file-store';
import { buildSignedPdf, signedFileName } from '@/lib/pdf/signed-pdf';
import { notify } from '@/components/shared/toaster';
import { cn } from '@/lib/utils';

/** Field types, with their default size as a percentage of the page */
export const FIELD_META: Record<SignatureFieldType, { label: string; icon: React.ElementType; w: number; h: number }> = {
  signature: { label: 'Signature', icon: PenTool, w: 26, h: 5.5 },
  initials: { label: 'Initials', icon: Type, w: 10, h: 5 },
  date: { label: 'Date Signed', icon: CalendarDays, w: 16, h: 3 },
  name: { label: 'Full Name', icon: User, w: 24, h: 3 },
  email: { label: 'Email', icon: Mail, w: 28, h: 3 },
  company: { label: 'Company', icon: Building2, w: 24, h: 3 },
  title: { label: 'Title', icon: Briefcase, w: 22, h: 3 },
  text: { label: 'Text', icon: AlignLeft, w: 24, h: 3 },
  number: { label: 'Number', icon: Hash, w: 12, h: 3 },
  checkbox: { label: 'Checkbox', icon: CheckSquare, w: 3.2, h: 2.5 },
  dropdown: { label: 'Dropdown', icon: ChevronDownSquare, w: 20, h: 3 },
  radio: { label: 'Radio', icon: CircleDot, w: 26, h: 3 },
  approve: { label: 'Approve', icon: ThumbsUp, w: 12, h: 3.2 },
  decline: { label: 'Decline', icon: ThumbsDown, w: 12, h: 3.2 },
};

/** The palette, grouped as in Flash Sign's field editor */
export const FIELD_GROUPS: { label: string; types: SignatureFieldType[] }[] = [
  { label: 'Signature', types: ['signature', 'initials', 'date'] },
  { label: 'Contact information', types: ['name', 'email', 'company', 'title'] },
  { label: 'Inputs', types: ['text', 'number', 'checkbox', 'dropdown', 'radio'] },
  { label: 'Actions', types: ['approve', 'decline'] },
];

export const FIELD_TYPES = FIELD_GROUPS.flatMap(g => g.types);

/** Starting choices for a new dropdown or radio field */
export const DEFAULT_OPTIONS = ['Option 1', 'Option 2'];

/** The field on its document: fields saved without a file id are on the first PDF */
export const isOnFile = (f: SignatureField, fileId: string, firstFileId: string | undefined) =>
  (f.fileId ?? firstFileId) === fileId;

/** One colour per recipient, as in Flash Sign's field editor */
export const SIGNER_COLORS = ['#00c2a8', '#5c6bc0', '#f59e0b', '#e57373', '#ab47bc', '#26a69a'];

/** Absolute position of a field inside its page overlay */
export const fieldStyle = (f: SignatureField, color?: string): React.CSSProperties => ({
  left: `${f.positionX}%`,
  top: `${f.positionY}%`,
  width: `${f.width}%`,
  height: `${f.height}%`,
  ...(color ? { borderColor: color, backgroundColor: `${color}1f` } : {}),
});

export const todayLabel = () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/** A field's value as it appears on the document */
export function FieldValue({ field, value }: { field: SignatureField; value?: string }) {
  if (!value) return null;
  if (value.startsWith('data:image')) {
    return <img src={value} alt={FIELD_META[field.type].label} className="w-full h-full object-contain" draggable={false} />;
  }
  if (field.type === 'checkbox') {
    return value === 'true' ? <Check className="w-full h-full text-ink" strokeWidth={3} /> : null;
  }
  return (
    <span className="block w-full truncate px-0.5 leading-none text-ink" style={{ fontSize: 'clamp(8px, 1.4cqw, 14px)' }}>
      {value}
    </span>
  );
}

/** Read-only fields on a page: filled values, and (optionally) empty spots in the signer's colour */
export function ReadOnlyFields({
  fields,
  colorOf,
  showEmpty = true,
}: {
  fields: SignatureField[];
  colorOf: (signerId: string) => string | undefined;
  showEmpty?: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ containerType: 'inline-size' }}>
      {fields.map(f => (f.value || showEmpty) && (
        <div
          key={f.id}
          className={cn('absolute flex items-center justify-center rounded-sm', !f.value && 'border border-dashed')}
          style={fieldStyle(f, f.value ? undefined : colorOf(f.signerId))}
        >
          {f.value
            ? <FieldValue field={f} value={f.value} />
            : <span className="text-[9px] font-semibold text-ink-soft/80 truncate px-0.5">{FIELD_META[f.type].label}</span>}
        </div>
      ))}
    </div>
  );
}

/** A request's PDFs in order (older requests have only `pdf`) */
export const requestPdfs = (request: SignatureRequest) => request.pdfs ?? (request.pdf ? [request.pdf] : []);

/** Builds the signed PDF from the stored originals and downloads it */
export async function downloadSignedPdf(request: SignatureRequest) {
  const sources: { fileId: string; bytes: Uint8Array }[] = [];
  for (const pdf of requestPdfs(request)) {
    const bytes = await loadAttachmentBytes(pdf);
    if (!bytes) {
      notify(`"${pdf.name}" is not in this browser any more.`, 'error');
      return;
    }
    sources.push({ fileId: pdf.fileId, bytes });
  }
  if (sources.length === 0) return;
  const signed = await buildSignedPdf(sources, request);
  downloadBytes(signed, signedFileName(request.title));
}

export async function downloadOriginalPdf(request: SignatureRequest) {
  for (const pdf of requestPdfs(request)) {
    const original = await loadAttachmentBytes(pdf);
    if (!original) {
      notify(`"${pdf.name}" is not in this browser any more.`, 'error');
      return;
    }
    downloadBytes(original, pdf.name);
  }
}
