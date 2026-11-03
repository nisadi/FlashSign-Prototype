'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Upload, FileText, Check, Plus, Trash2, ChevronUp, ChevronDown,
  Send, PenLine, AlertTriangle, Wand2, Loader2, Users, Mail, Undo2, Redo2, Copy, Eye, Save, X, ShieldCheck,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import type {
  DraftRecipientKind, PdfAttachment, ReminderFrequency, SignatureField, SignatureFieldType, SigningOrder,
} from '@/types';
import { Button, Card } from '@/components/shared/ui';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';
import { notify } from '@/components/shared/toaster';
import { DocPages, countPdfPages } from '@/components/pdf/pdf-pages';
import { FieldPlacerOverlay, PALETTE_DRAG_TYPE } from '@/components/pdf/field-placer';
import { FIELD_GROUPS, FIELD_META, SIGNER_COLORS, isOnFile } from '@/components/pdf/fields';
import { RecipientPreview } from '@/components/pdf/recipient-preview';
import { readPdfUpload, savePdfFile, newFileId } from '@/lib/pdf/file-store';
import { SAMPLE_PDFS, buildSamplePdf, sampleSignatureSlots } from '@/lib/pdf/sample-pdfs';
import { cn } from '@/lib/utils';
import { useNow } from '@/lib/use-now';

type Mode = 'self' | 'send';
interface RecipientForm { id: string; name: string; email: string; kind: DraftRecipientKind }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Flash Sign's expiry choices; anything else is "Custom" (1-999 days) */
const EXPIRY_PRESETS = [30, 60, 90, 120];
const REMINDER_OPTIONS: { id: ReminderFrequency; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'every_2_days', label: 'Every 2 days' },
  { id: 'every_3_days', label: 'Every 3 days' },
  { id: 'weekly', label: 'Every week' },
  { id: 'never', label: 'Never' },
];
const ROLE_LABELS: Record<DraftRecipientKind, string> = {
  signer: 'Needs to sign',
  review: 'Needs to review',
  copy: 'Receives a copy',
};
const COPY_COLOR = '#9aa8a6';
const REVIEWER_COLOR = '#7c6bd6';
const SELF_STEPS = ['Document', 'Place fields'];
const SEND_STEPS = ['Document', 'Recipients', 'Place fields', 'Review & send'];
/** Undo keeps this many steps, as in Flash Sign's field editor */
const HISTORY_LIMIT = 50;
const AUTOSAVE_MS = 700;

/** People to add with one click in the demo (Sarah Chen is also a demo login) */
const DEMO_CONTACTS = [
  { name: 'Sarah Chen', email: 'sarah.chen@acmedigital.com' },
  { name: 'Daniel Perera', email: 'daniel.perera@clientpartner.com' },
  { name: 'Maya Fernando', email: 'maya.fernando@legalworks.com' },
];

export default function UploadAndSignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading…</div>}>
      <UploadWizard />
    </Suspense>
  );
}

function UploadWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const draftParam = params.get('draft');
  const { createPdfRequest, saveSignatureDraft, signingDefaults, signatureRequests, documentItems, addDocumentItem } = useApp();
  const currentUser = useCurrentUser();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'self' ? 'self' : 'send');
  const steps = mode === 'self' ? SELF_STEPS : SEND_STEPS;
  const [step, setStep] = useState(0);

  // Step: documents
  const [docs, setDocs] = useState<PdfAttachment[]>([]);
  const [title, setTitle] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Step: recipients
  const [recipients, setRecipients] = useState<RecipientForm[]>([]);
  const [signingOrder, setSigningOrder] = useState<SigningOrder>(signingDefaults.signingOrder);
  const [message, setMessage] = useState(signingDefaults.message);
  const [expiresInDays, setExpiresInDays] = useState(signingDefaults.expireDays);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(signingDefaults.reminderFrequency);

  // Step: fields, with undo/redo
  const [fields, setFieldsRaw] = useState<SignatureField[]>([]);
  const [past, setPast] = useState<SignatureField[][]>([]);
  const [future, setFuture] = useState<SignatureField[][]>([]);
  const [armedType, setArmedType] = useState<SignatureFieldType | null>(null);
  const [activeSignerId, setActiveSignerId] = useState('');
  const [activeDocId, setActiveDocId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Drafts: saved automatically once there is a document; `?draft=<id>` continues one
  const [draftId, setDraftId] = useState<string | null>(draftParam);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const finishedRef = useRef(false);

  const draftToLoad = draftParam ? signatureRequests.find(r => r.id === draftParam && r.status === 'draft' && r.draft) : undefined;
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  if (draftToLoad?.draft && loadedDraftId !== draftToLoad.id) {
    // Continue a saved draft where it was left
    const d = draftToLoad.draft;
    setLoadedDraftId(draftToLoad.id);
    setMode(d.mode);
    setStep(d.step);
    setDocs(draftToLoad.pdfs ?? (draftToLoad.pdf ? [draftToLoad.pdf] : []));
    setTitle(draftToLoad.title);
    // Drafts saved before reviewers had a "Needs to view" role; it is now "Needs to review"
    setRecipients(d.recipients.map(r => ((r.kind as string) === 'view' ? { ...r, kind: 'review' as const } : r)));
    setSigningOrder(d.signingOrder);
    setMessage(d.message);
    setExpiresInDays(d.expiresInDays);
    setReminderFrequency(d.reminderFrequency);
    setFieldsRaw(draftToLoad.fields);
    setSavedAt(d.savedAt);
  }

  // Started from a PDF in Documents: it is the first document
  const docParam = params.get('documentId');
  const libraryDoc = docParam && !draftParam ? documentItems.find(d => d.id === docParam && d.pdf) : undefined;
  const [loadedLibraryDoc, setLoadedLibraryDoc] = useState<string | null>(null);
  if (libraryDoc?.pdf && loadedLibraryDoc !== libraryDoc.id) {
    setLoadedLibraryDoc(libraryDoc.id);
    setDocs([{ ...libraryDoc.pdf, documentId: libraryDoc.id }]);
    setTitle(libraryDoc.title);
  }
  // PDFs in Documents that can be added to this request
  const libraryPdfs = documentItems.filter(d => d.pdf && d.status !== 'archived');
  const addLibraryDoc = (docId: string) => {
    const item = documentItems.find(d => d.id === docId);
    if (!item?.pdf || docs.some(d => d.fileId === item.pdf!.fileId)) return;
    setDocs(list => [...list, { ...item.pdf!, documentId: item.id }]);
    setTitle(t => t || item.title);
  };

  // Who signs: yourself, or the "Needs to sign" recipients in order
  const signers = useMemo(() => {
    if (mode === 'self') {
      return [{ id: 'signer-me', name: currentUser?.name || 'You', email: currentUser?.email || 'you@example.com', color: SIGNER_COLORS[0] }];
    }
    return recipients
      .filter(r => r.kind === 'signer')
      .map((r, i) => ({ id: r.id, name: r.name.trim(), email: r.email.trim(), color: SIGNER_COLORS[i % SIGNER_COLORS.length] }));
  }, [mode, recipients, currentUser]);
  const copies = recipients.filter(r => r.kind === 'copy');
  const reviewers = recipients.filter(r => r.kind === 'review');
  const reviewerNames = reviewers.map(r => r.name.trim() || r.email.trim() || 'the reviewer').join(', ');
  const placingFor = signers.find(s => s.id === activeSignerId) ?? signers[0];
  const activeDoc = docs.find(d => d.fileId === activeDocId) ?? docs[0];
  const colorOf = (id: string) => signers.find(s => s.id === id)?.color ?? '#999';
  const labelOf = (id: string) => signers.find(s => s.id === id)?.name ?? 'Unknown';
  const selectedField = fields.find(f => f.id === selectedFieldId);

  // ── Undo / redo ───────────────────────────────────────────────────────────
  const snapshot = useCallback(() => {
    setPast(p => [...p.slice(-(HISTORY_LIMIT - 1)), fields]);
    setFuture([]);
  }, [fields]);
  /** A change that can be undone */
  const changeFields = useCallback((next: SignatureField[] | ((list: SignatureField[]) => SignatureField[])) => {
    snapshot();
    setFieldsRaw(next);
  }, [snapshot]);
  const undo = useCallback(() => {
    if (past.length === 0) return;
    setFuture(f => [fields, ...f]);
    setFieldsRaw(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
    setSelectedFieldId(null);
  }, [past, fields]);
  const redo = useCallback(() => {
    if (future.length === 0) return;
    setPast(p => [...p, fields]);
    setFieldsRaw(future[0]);
    setFuture(f => f.slice(1));
    setSelectedFieldId(null);
  }, [future, fields]);
  const duplicateSelected = useCallback(() => {
    if (!selectedField) return;
    const copy = {
      ...selectedField,
      id: `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      positionX: Math.min(100 - selectedField.width, selectedField.positionX + 2),
      positionY: Math.min(100 - selectedField.height, selectedField.positionY + 2),
    };
    changeFields(list => [...list, copy]);
    setSelectedFieldId(copy.id);
  }, [selectedField, changeFields]);
  const deleteSelected = useCallback(() => {
    if (!selectedFieldId) return;
    changeFields(list => list.filter(f => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  }, [selectedFieldId, changeFields]);
  const updateSelected = (updates: Partial<SignatureField>) =>
    changeFields(list => list.map(f => (f.id === selectedFieldId ? { ...f, ...updates } : f)));

  // Ctrl/⌘+Z, Ctrl/⌘+Shift+Z (or Ctrl+Y), Delete, Ctrl/⌘+D while placing fields
  useEffect(() => {
    if (steps[step] !== 'Place fields') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedFieldId) { e.preventDefault(); deleteSelected(); } }
      else if (e.key === 'Escape') { setArmedType(null); setSelectedFieldId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps, step, undo, redo, duplicateSelected, deleteSelected, selectedFieldId]);

  // ── Documents ─────────────────────────────────────────────────────────────
  const addPdf = async (bytes: Uint8Array, name: string, sampleId?: string) => {
    const pageCount = await countPdfPages(bytes);
    const fileId = newFileId();
    await savePdfFile(fileId, bytes);
    setDocs(list => [...list, { fileId, name, sizeBytes: bytes.length, pageCount, sampleId }]);
    setTitle(t => t || name.replace(/\.pdf$/i, ''));
  };

  const onPickFiles = async (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    setDocError(null);
    setLoadingDoc(true);
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      const result = await readPdfUpload(file);
      if ('error' in result) {
        problems.push(`${file.name}: ${result.error}`);
        continue;
      }
      try {
        await addPdf(result.bytes, file.name);
      } catch {
        problems.push(`${file.name}: this PDF could not be opened.`);
      }
    }
    setLoadingDoc(false);
    if (problems.length) setDocError(problems.join(' '));
  };

  const onPickSample = async (sampleId: string) => {
    const sample = SAMPLE_PDFS.find(s => s.id === sampleId)!;
    setDocError(null);
    setLoadingDoc(true);
    const bytes = await buildSamplePdf(sampleId);
    if (bytes) await addPdf(bytes, `${sample.title}.pdf`, sampleId);
    setLoadingDoc(false);
  };

  const removeDoc = (fileId: string) => {
    setDocs(list => list.filter(d => d.fileId !== fileId));
    changeFields(list => list.filter(f => !isOnFile(f, fileId, docs[0]?.fileId)));
  };
  const moveDoc = (index: number, delta: -1 | 1) => setDocs(list => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return list;
    // Fields without a file id belong to the first document; pin them before reordering
    const first = list[0]?.fileId;
    setFieldsRaw(fs => fs.map(f => (f.fileId ? f : { ...f, fileId: first })));
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  // ── Recipients ────────────────────────────────────────────────────────────
  const addRecipient = (r?: { name: string; email: string }, kind: DraftRecipientKind = 'signer') => {
    setRecipients(list => [...list, { id: `rcp-${Date.now()}-${list.length}`, name: r?.name ?? '', email: r?.email ?? '', kind }]);
  };
  const updateRecipient = (id: string, updates: Partial<RecipientForm>) =>
    setRecipients(list => list.map(r => (r.id === id ? { ...r, ...updates } : r)));
  const removeRecipient = (id: string) => {
    setRecipients(list => list.filter(r => r.id !== id));
    setFieldsRaw(list => list.filter(f => f.signerId !== id));
  };
  const moveRecipient = (index: number, delta: -1 | 1) => setRecipients(list => {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return list;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const meIncluded = !!currentUser && recipients.some(r => r.email.toLowerCase() === currentUser.email.toLowerCase());

  /** For sample documents: put signature, name and date on each signer's line of the last page */
  const addSuggestedFields = () => {
    if (!activeDoc?.sampleId) return;
    const suggested: SignatureField[] = signers.slice(0, 2).flatMap((s, col) => {
      const slots = sampleSignatureSlots(col as 0 | 1);
      return (['signature', 'name', 'date'] as const).map(type => ({
        id: `fld-${Date.now()}-${s.id}-${type}`,
        type,
        signerId: s.id,
        pageNumber: activeDoc.pageCount,
        fileId: activeDoc.fileId,
        positionX: slots[type].x,
        positionY: slots[type].y,
        width: slots[type].w,
        height: slots[type].h,
        required: true,
      }));
    });
    changeFields(list => [
      ...list.filter(f => !(isOnFile(f, activeDoc.fileId, docs[0]?.fileId) && f.pageNumber === activeDoc.pageCount && signers.slice(0, 2).some(s => s.id === f.signerId))),
      ...suggested,
    ]);
    notify(`Added ${suggested.length} suggested fields`);
  };

  // ── Validation per step (the "issues" list, as in Flash Sign's send check) ─
  const issues = useMemo(() => {
    const list: string[] = [];
    const stepName = steps[step];
    if (stepName === 'Document' || stepName === 'Review & send') {
      if (docs.length === 0) list.push('Upload a PDF or choose a sample document.');
      if (!title.trim()) list.push('Give the request a title.');
    }
    if (stepName === 'Recipients' || stepName === 'Review & send') {
      if (signers.length === 0) list.push('Add at least one person who needs to sign.');
      recipients.forEach((r, i) => {
        if (!r.name.trim()) list.push(`Recipient ${i + 1} needs a name.`);
        if (!EMAIL_RE.test(r.email.trim())) list.push(`Recipient ${i + 1} needs a valid email address.`);
      });
      const emails = recipients.map(r => r.email.trim().toLowerCase()).filter(Boolean);
      if (new Set(emails).size !== emails.length) list.push('Each recipient needs a different email address.');
      if (!(expiresInDays >= 1 && expiresInDays <= 999)) list.push('Expiry must be between 1 and 999 days.');
    }
    if (stepName === 'Place fields' || stepName === 'Review & send') {
      signers.forEach(s => {
        if (!fields.some(f => f.signerId === s.id)) list.push(`Place at least one field for ${mode === 'self' ? 'yourself' : s.name || 'each signer'}.`);
      });
      fields.filter(f => (f.type === 'dropdown' || f.type === 'radio') && !(f.options?.length)).forEach(f =>
        list.push(`A ${FIELD_META[f.type].label.toLowerCase()} field needs at least one option.`));
    }
    return [...new Set(list)];
  }, [steps, step, docs, title, signers, recipients, fields, mode, expiresInDays]);

  // ── Auto-save the draft (0.7 s after the last change, like Flash Sign) ────
  const saveDraftNow = useCallback(() => {
    if (finishedRef.current || docs.length === 0) return null;
    const id = saveSignatureDraft({
      id: draftId ?? undefined,
      title: title.trim(),
      pdfs: docs,
      signers,
      fields,
      draft: { mode, step, recipients, signingOrder, message, expiresInDays, reminderFrequency },
    });
    setDraftId(id);
    setSavedAt(new Date().toISOString());
    setSaving(false);
    return id;
  }, [saveSignatureDraft, draftId, title, docs, signers, fields, mode, step, recipients, signingOrder, message, expiresInDays, reminderFrequency]);

  useEffect(() => {
    if (docs.length === 0 || finishedRef.current) return;
    const timer = setTimeout(() => {
      setSaving(true);
      saveDraftNow();
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // Saving only follows changes to what the user entered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, title, recipients, fields, signingOrder, message, expiresInDays, reminderFrequency, step, mode]);

  const isLast = step === steps.length - 1;

  const finish = () => {
    if (docs.length === 0 || issues.length > 0) return;
    finishedRef.current = true;
    // PDFs uploaded here are also kept in Documents, so they can be reused (samples are not)
    const pdfs = docs.map(d => {
      if (d.documentId || d.sampleId) return d;
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      addDocumentItem({
        id: docId,
        title: d.name.replace(/\.pdf$/i, ''),
        type: 'pdf',
        status: 'draft',
        isEditable: false,
        content: `Uploaded PDF: ${d.name}`,
        fileSize: `${Math.max(1, Math.round(d.sizeBytes / 1024))} KB`,
        pages: d.pageCount,
        pdf: { ...d, documentId: docId },
      });
      return { ...d, documentId: docId };
    });
    const id = createPdfRequest({
      title: title.trim(),
      pdfs,
      signers,
      ccRecipients: copies.map(c => ({ id: c.id, name: c.name.trim(), email: c.email.trim(), role: 'copy' })),
      reviewers: mode === 'self' ? undefined : reviewers.map(r => ({ id: r.id, name: r.name.trim(), email: r.email.trim() })),
      fields,
      signingOrder: mode === 'self' ? 'sequential' : signingOrder,
      message: mode === 'self' ? undefined : message,
      expiresInDays,
      reminderFrequency: mode === 'self' ? 'never' : reminderFrequency,
      selfSign: mode === 'self',
      draftId: draftId ?? undefined,
    });
    if (mode === 'self') {
      router.push(`/signatures/sign/${id}`);
    } else {
      notify(`Sent to ${signers.length} signer${signers.length === 1 ? '' : 's'} — see the Outbox for the emails`);
      router.push(`/signatures/${id}`);
    }
  };

  const saveAndClose = () => {
    saveDraftNow();
    finishedRef.current = true;
    notify('Draft saved — continue it any time from Drafts');
    router.push('/signatures/drafts');
  };

  const isPreset = EXPIRY_PRESETS.includes(expiresInDays);
  const now = useNow();
  const expiryLabel = now === null ? '' : new Date(now + expiresInDays * 86400000).toLocaleDateString();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/agreements" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Agreements
          </Link>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            {mode === 'self' ? <PenLine className="w-5 h-5 text-flash-deep" /> : <Send className="w-5 h-5 text-flash-deep" />}
            {mode === 'self' ? 'Sign a document yourself' : 'Get signatures'}
          </h1>
          <p className="text-sm text-muted">
            {mode === 'self'
              ? 'Upload a PDF, place your fields, sign it and download the signed copy.'
              : 'Upload one or more PDFs, add the people who need to sign, place their fields and send it.'}
          </p>
        </div>
        {docs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">
              {saving ? 'Saving…' : savedAt ? `Draft saved ${new Date(savedAt).toLocaleTimeString()}` : ''}
            </span>
            <Button size="sm" variant="outline" icon={Save} onClick={saveAndClose}>Save &amp; close</Button>
          </div>
        )}
      </div>

      <DemoNoticeBanner message="Files stay in this browser and emails are not really sent: they appear in Agreements › Outbox, where each signer's personal link can be opened. Your work is saved as a draft as you go." />

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((name, i) => (
          <li key={name} className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                i === step ? 'bg-ink text-white border-ink' : i < step ? 'bg-flash/15 text-flash-deep border-flash/40' : 'bg-paper-elevated text-muted border-line'
              )}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              {name}
            </span>
            {i < steps.length - 1 && <span className="w-4 h-px bg-line" />}
          </li>
        ))}
      </ol>

      {/* ── Step: Document(s) ── */}
      {steps[step] === 'Document' && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-bold text-ink">Upload PDFs</h2>
              <div
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
                  dragOver ? 'border-flash bg-flash/10' : 'border-line hover:border-flash/60 hover:bg-mist/30'
                )}
                onClick={() => fileInput.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); void onPickFiles(e.dataTransfer.files); }}
              >
                {loadingDoc ? <Loader2 className="w-8 h-8 mx-auto text-flash-deep animate-spin" /> : <Upload className="w-8 h-8 mx-auto text-flash-deep" />}
                <p className="mt-2 text-sm font-semibold text-ink">Drop PDFs here or click to choose files</p>
                <p className="text-xs text-muted">PDF only, up to 5 MB each. You can add several documents.</p>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={e => { void onPickFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
              {docError && <p className="flex items-start gap-1.5 text-xs text-danger"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {docError}</p>}
            </Card>

            {libraryPdfs.length > 0 && (
              <Card className="p-4 space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-ink">Or choose from your Documents</h2>
                  <p className="text-xs text-muted">PDFs uploaded to Documents. Upload once, send as many times as you need.</p>
                </div>
                <ul className="divide-y divide-line">
                  {libraryPdfs.map(item => {
                    const added = docs.some(d => d.fileId === item.pdf!.fileId);
                    return (
                      <li key={item.id} className="flex items-center gap-2 py-2">
                        <FileText className="w-4 h-4 text-flash-deep flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink truncate">{item.title}</p>
                          <p className="text-[10px] text-muted">{item.pdf!.pageCount} page{item.pdf!.pageCount === 1 ? '' : 's'} · {item.fileSize}</p>
                        </div>
                        <Button size="xs" disabled={added} onClick={() => addLibraryDoc(item.id)}>{added ? 'Added' : 'Add'}</Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            <Card className="p-4 space-y-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Or add a sample document</h2>
                <p className="text-xs text-muted">Ready-made PDFs for the demo, with signature lines on the last page.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {SAMPLE_PDFS.map(s => (
                  <button key={s.id} type="button" onClick={() => void onPickSample(s.id)} className="text-left p-3 rounded-lg border border-line hover:bg-mist/40 transition-colors">
                    <FileText className="w-5 h-5 text-flash-deep mb-1.5" />
                    <p className="text-xs font-bold text-ink">{s.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{s.description}</p>
                    <p className="text-[10px] text-muted mt-1">{s.pages} page{s.pages === 1 ? '' : 's'}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-4 space-y-3 self-start">
            <h2 className="text-sm font-bold text-ink">Documents ({docs.length})</h2>
            {docs.length === 0 ? (
              <p className="text-xs text-muted">No document yet.</p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {docs.map((d, i) => (
                    <li key={d.fileId} className="flex items-center gap-2 p-2 rounded-lg bg-mist/40">
                      <span className="text-[10px] font-bold text-muted w-4">{i + 1}</span>
                      <FileText className="w-4 h-4 text-flash-deep flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink truncate">{d.name}</p>
                        <p className="text-[10px] text-muted">{d.pageCount} page{d.pageCount === 1 ? '' : 's'} · {(d.sizeBytes / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={() => moveDoc(i, -1)} disabled={i === 0} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => moveDoc(i, 1)} disabled={i === docs.length - 1} className="p-0.5 text-muted hover:text-ink disabled:opacity-30" aria-label="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => removeDoc(d.fileId)} className="p-0.5 text-muted hover:text-danger" aria-label={`Remove ${d.name}`}><X className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ul>
                <label className="block">
                  <span className="block text-xs font-semibold text-ink mb-1">Title {mode === 'send' && <span className="font-normal text-muted">(also the email subject)</span>}</span>
                  <input
                    value={title}
                    maxLength={100}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-paper-elevated focus:outline-none focus:border-flash"
                  />
                  <span className="block text-right text-[10px] text-muted">{title.length}/100</span>
                </label>
                <div className="max-h-72 overflow-y-auto rounded-lg bg-mist/30 p-2">
                  <DocPages doc={docs[0]} maxWidth={300} showZoom={false} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Step: Recipients ── */}
      {steps[step] === 'Recipients' && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><Users className="w-4 h-4" /> Recipients</h2>
              <div className="flex gap-1 p-0.5 rounded-lg bg-mist/50 text-xs">
                {(['sequential', 'parallel'] as const).map(o => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setSigningOrder(o)}
                    className={cn('px-2.5 py-1 rounded-md font-semibold', signingOrder === o ? 'bg-paper-elevated text-ink shadow-sm' : 'text-muted')}
                  >
                    {o === 'sequential' ? 'Sign in order' : 'Sign at the same time'}
                  </button>
                ))}
              </div>
            </div>

            {recipients.length === 0 && <p className="text-xs text-muted">Add the people who need to sign, anyone who should review it before it is finished, and anyone who should get a copy.</p>}

            <div className="space-y-2">
              {recipients.map((r, i) => {
                const signerIndex = recipients.filter(x => x.kind === 'signer').findIndex(x => x.id === r.id);
                const color = r.kind === 'signer' ? SIGNER_COLORS[signerIndex % SIGNER_COLORS.length] : r.kind === 'review' ? REVIEWER_COLOR : COPY_COLOR;
                return (
                  <div key={r.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg border border-line" style={{ borderLeft: `4px solid ${color}` }}>
                    <span className="w-6 text-center text-xs font-bold text-muted">{r.kind === 'signer' && signingOrder === 'sequential' ? signerIndex + 1 : '•'}</span>
                    <input value={r.name} onChange={e => updateRecipient(r.id, { name: e.target.value })} placeholder="Full name"
                      className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash" />
                    <input value={r.email} onChange={e => updateRecipient(r.id, { email: e.target.value })} placeholder="email@company.com"
                      className="flex-1 min-w-[150px] px-2.5 py-1.5 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash" />
                    <select
                      value={r.kind}
                      onChange={e => {
                        const kind = e.target.value as DraftRecipientKind;
                        updateRecipient(r.id, { kind });
                        if (kind !== 'signer') setFieldsRaw(list => list.filter(f => f.signerId !== r.id));
                      }}
                      className="px-2 py-1.5 text-xs rounded-md border border-line bg-paper-elevated"
                    >
                      {(Object.keys(ROLE_LABELS) as DraftRecipientKind[]).map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                    </select>
                    <div className="flex items-center">
                      <button type="button" onClick={() => moveRecipient(i, -1)} disabled={i === 0} className="p-1 text-muted hover:text-ink disabled:opacity-30" aria-label="Move up"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveRecipient(i, 1)} disabled={i === recipients.length - 1} className="p-1 text-muted hover:text-ink disabled:opacity-30" aria-label="Move down"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeRecipient(r.id)} className="p-1 text-muted hover:text-danger" aria-label="Remove recipient"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={Plus} onClick={() => addRecipient()}>Add recipient</Button>
              {currentUser && !meIncluded && (
                <Button size="sm" variant="outline" onClick={() => addRecipient({ name: currentUser.name, email: currentUser.email })}>Add me as a signer</Button>
              )}
            </div>

            {/* Review step: on when anyone is set to "Needs to review" */}
            <div
              className={cn('flex items-start gap-2 p-2.5 rounded-lg text-[11px]', reviewers.length ? 'bg-violet-50 text-violet-900' : 'bg-mist/40 text-muted')}
              style={{ borderLeft: `3px solid ${reviewers.length ? REVIEWER_COLOR : COPY_COLOR}` }}
            >
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              {reviewers.length ? (
                <p><b>Review step on.</b> When everyone has signed, {reviewerNames} {reviewers.length === 1 ? 'reviews' : 'review'} the signed document. It is finished only after {reviewers.length === 1 ? 'they approve' : 'all of them approve'}.</p>
              ) : (
                <p><b>No review step.</b> The document is finished as soon as everyone has signed. To add one, set a recipient to &quot;{ROLE_LABELS.review}&quot;.</p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 space-y-2">
              <h3 className="text-xs font-bold text-ink">Demo contacts</h3>
              <p className="text-[11px] text-muted">Add a sample person with one click.</p>
              {DEMO_CONTACTS.filter(c => !recipients.some(r => r.email === c.email)).map(c => (
                <div key={c.email} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{c.name}</p>
                    <p className="text-[11px] text-muted truncate">{c.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="xs" onClick={() => addRecipient(c, 'signer')}>Signer</Button>
                    <Button size="xs" variant="ghost" onClick={() => addRecipient(c, 'copy')}>Copy</Button>
                    <Button size="xs" variant="ghost" onClick={() => addRecipient(c, 'review')}>Reviewer</Button>
                  </div>
                </div>
              ))}
            </Card>
            <Card className="p-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-semibold text-ink mb-1">Message to recipients</span>
                <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 10000))} rows={3}
                  className="w-full px-2.5 py-2 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink mb-1">Reminders</span>
                <select value={reminderFrequency} onChange={e => setReminderFrequency(e.target.value as ReminderFrequency)}
                  className="w-full px-2 py-1.5 text-xs rounded-md border border-line bg-paper-elevated">
                  {REMINDER_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <span className="block text-[10px] text-muted mt-1">Signers who have not signed are emailed automatically.</span>
              </label>
              <div>
                <span className="block text-xs font-semibold text-ink mb-1">Days until the request expires</span>
                <div className="flex gap-2">
                  <select
                    value={isPreset ? String(expiresInDays) : 'custom'}
                    onChange={e => setExpiresInDays(e.target.value === 'custom' ? (isPreset ? 45 : expiresInDays) : Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 text-xs rounded-md border border-line bg-paper-elevated"
                  >
                    {EXPIRY_PRESETS.map(d => <option key={d} value={d}>{d} days</option>)}
                    <option value="custom">Custom</option>
                  </select>
                  {!isPreset && (
                    <input type="number" min={1} max={999} value={expiresInDays}
                      onChange={e => setExpiresInDays(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-xs rounded-md border border-line bg-paper-elevated" aria-label="Custom days" />
                  )}
                </div>
                <span className="block text-[10px] text-muted mt-1">Expires on {expiryLabel}. The sender is emailed when it expires.</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Step: Place fields ── */}
      {steps[step] === 'Place fields' && activeDoc && (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5">
          <div className="space-y-3 lg:sticky lg:top-4 self-start">
            {mode === 'send' && (
              <Card className="p-3 space-y-1.5">
                <h3 className="text-xs font-bold text-ink">Fields for</h3>
                {signers.map(s => (
                  <button key={s.id} type="button" onClick={() => setActiveSignerId(s.id)}
                    className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs border', placingFor?.id === s.id ? 'border-ink bg-mist/50' : 'border-transparent hover:bg-mist/30')}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="truncate font-semibold text-ink">{s.name}</span>
                    <span className="ml-auto text-[10px] text-muted">{fields.filter(f => f.signerId === s.id).length}</span>
                  </button>
                ))}
              </Card>
            )}
            <Card className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink">Fields</h3>
                <div className="flex gap-1">
                  <button type="button" onClick={undo} disabled={past.length === 0} className="p-1 rounded text-muted hover:text-ink hover:bg-mist disabled:opacity-30" title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={redo} disabled={future.length === 0} className="p-1 rounded text-muted hover:text-ink hover:bg-mist disabled:opacity-30" title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-[11px] text-muted">Drag onto the page, or pick one and click the page.</p>
              {FIELD_GROUPS.map(group => (
                <div key={group.label} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{group.label}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.types.map(type => {
                      const { label, icon: Icon } = FIELD_META[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          draggable
                          onDragStart={e => { e.dataTransfer.setData(PALETTE_DRAG_TYPE, type); e.dataTransfer.effectAllowed = 'copy'; }}
                          onClick={() => setArmedType(t => (t === type ? null : type))}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] font-semibold cursor-grab text-left',
                            armedType === type ? 'bg-ink text-white border-ink' : 'bg-paper-elevated border-line text-ink hover:bg-mist/40'
                          )}
                          style={armedType === type ? undefined : { borderLeft: `3px solid ${placingFor?.color}` }}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {activeDoc.sampleId && (
                <Button size="sm" variant="outline" icon={Wand2} className="w-full" onClick={addSuggestedFields}>Add suggested fields</Button>
              )}
              {fields.length > 0 && (
                <button type="button" onClick={() => changeFields([])} className="w-full text-[11px] text-muted hover:text-danger">Remove all fields</button>
              )}
            </Card>

            {selectedField && (
              <Card className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-ink">{FIELD_META[selectedField.type].label} field</h3>
                  <div className="flex gap-1">
                    <button type="button" onClick={duplicateSelected} className="p-1 rounded text-muted hover:text-ink hover:bg-mist" title="Duplicate (Ctrl+D)" aria-label="Duplicate field"><Copy className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={deleteSelected} className="p-1 rounded text-muted hover:text-danger hover:bg-mist" title="Delete (Del)" aria-label="Delete field"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {mode === 'send' && (
                  <label className="block text-[11px]">
                    <span className="text-muted">For</span>
                    <select value={selectedField.signerId} onChange={e => updateSelected({ signerId: e.target.value })}
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded-md border border-line bg-paper-elevated">
                      {signers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="flex items-center gap-2 text-[11px] text-ink">
                  <input type="checkbox" checked={selectedField.required} onChange={e => updateSelected({ required: e.target.checked })} /> Required
                </label>
                {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                  <label className="block text-[11px]">
                    <span className="text-muted">Options (one per line)</span>
                    <textarea
                      rows={4}
                      value={(selectedField.options ?? []).join('\n')}
                      onChange={e => updateSelected({ options: e.target.value.split('\n').map(o => o.trimStart()).filter((o, i, all) => o || i === all.length - 1) })}
                      onBlur={e => updateSelected({ options: e.target.value.split('\n').map(o => o.trim()).filter(Boolean) })}
                      className="w-full mt-0.5 px-2 py-1 text-xs rounded-md border border-line bg-paper-elevated"
                    />
                  </label>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {docs.length > 1 ? (
                <div className="flex flex-wrap gap-1">
                  {docs.map((d, i) => (
                    <button key={d.fileId} type="button" onClick={() => { setActiveDocId(d.fileId); setSelectedFieldId(null); }}
                      className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', activeDoc.fileId === d.fileId ? 'bg-ink text-white border-ink' : 'bg-paper-elevated border-line text-ink hover:bg-mist/40')}>
                      {i + 1}. {d.name.replace(/\.pdf$/i, '')}
                      <span className="ml-1 opacity-70">({fields.filter(f => isOnFile(f, d.fileId, docs[0].fileId)).length})</span>
                    </button>
                  ))}
                </div>
              ) : <span />}
              {mode === 'send' && signers.length > 0 && (
                <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewOpen(true)}>Preview as recipient</Button>
              )}
            </div>
            <Card className="p-3 bg-mist/30">
              <DocPages
                key={activeDoc.fileId}
                doc={activeDoc}
                renderOverlay={page => (
                  <FieldPlacerOverlay
                    pageNumber={page}
                    fields={fields.filter(f => isOnFile(f, activeDoc.fileId, docs[0].fileId))}
                    colorOf={colorOf}
                    labelOf={labelOf}
                    armedType={armedType}
                    activeSignerId={placingFor?.id ?? ''}
                    selectedId={selectedFieldId}
                    onSelect={setSelectedFieldId}
                    onAdd={f => { changeFields(list => [...list, { ...f, fileId: activeDoc.fileId }]); setSelectedFieldId(f.id); }}
                    onBeginChange={snapshot}
                    onChange={f => setFieldsRaw(list => list.map(x => (x.id === f.id ? f : x)))}
                    onDelete={id => changeFields(list => list.filter(x => x.id !== id))}
                  />
                )}
              />
            </Card>
          </div>
        </div>
      )}

      {/* ── Step: Review & send ── */}
      {steps[step] === 'Review & send' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-ink">Summary</h2>
            <dl className="text-xs space-y-2">
              <div className="flex gap-2"><dt className="w-28 text-muted">Title</dt><dd className="font-semibold text-ink">{title}</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-muted">Documents</dt><dd className="text-ink">{docs.map(d => `${d.name} (${d.pageCount} p.)`).join(', ')}</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-muted">Signing order</dt><dd className="text-ink">{signingOrder === 'sequential' ? 'In order, one after another' : 'Everyone at the same time'}</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-muted">Reminders</dt><dd className="text-ink">{REMINDER_OPTIONS.find(o => o.id === reminderFrequency)?.label}</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-muted">Expires</dt><dd className="text-ink">in {expiresInDays} days ({expiryLabel})</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-muted">Fields</dt><dd className="text-ink">{fields.length} placed</dd></div>
            </dl>
            <div>
              <h3 className="text-xs font-bold text-ink mb-1.5">Signers</h3>
              {signers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold text-ink">{signingOrder === 'sequential' ? `${i + 1}. ` : ''}{s.name}</span>
                  <span className="text-muted">{s.email}</span>
                  <span className="ml-auto text-muted">{fields.filter(f => f.signerId === s.id).length} fields</span>
                </div>
              ))}
              <h3 className="text-xs font-bold text-ink mt-3 mb-1.5">Reviewers</h3>
              {reviewers.length > 0
                ? reviewers.map(r => <p key={r.id} className="text-xs text-ink">{r.name} <span className="text-muted">{r.email}</span></p>)
                : <p className="text-xs text-muted">None. The document is finished when everyone has signed.</p>}
              {copies.length > 0 && (
                <>
                  <h3 className="text-xs font-bold text-ink mt-3 mb-1.5">Receives a copy</h3>
                  {copies.map(c => <p key={c.id} className="text-xs text-ink">{c.name} <span className="text-muted">{c.email}</span></p>)}
                </>
              )}
            </div>
            <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewOpen(true)}>Preview as recipient</Button>
          </Card>
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><Mail className="w-4 h-4" /> What will happen</h2>
            <ul className="text-xs text-ink-soft space-y-1.5 list-disc pl-4">
              {signingOrder === 'sequential'
                ? <li><b>{signers[0]?.name}</b> gets an email with a personal signing link first. Each next signer is emailed when the one before has signed.</li>
                : <li>All {signers.length} signers get an email with their personal signing link now.</li>}
              {copies.length > 0 && <li>{copies.length} copy recipient(s) are told the document was shared with them.</li>}
              {reminderFrequency !== 'never' && <li>Anyone who has not signed{reviewers.length ? ' or reviewed' : ''} gets a reminder {REMINDER_OPTIONS.find(o => o.id === reminderFrequency)?.label.toLowerCase()}.</li>}
              <li>If it is not finished by {expiryLabel}, the request expires and you are emailed.</li>
              {reviewers.length > 0 ? (
                <>
                  <li>When everyone has signed, <b>{reviewerNames}</b> {reviewers.length === 1 ? 'is' : 'are'} asked to review the signed document.</li>
                  <li>Once {reviewers.length === 1 ? 'they approve' : 'every reviewer approves'}, everyone gets the signed PDF. If a reviewer rejects it, the request is closed and you are emailed the reason.</li>
                </>
              ) : (
                <li>When everyone has signed, everyone gets the signed PDF.</li>
              )}
              <li>The emails appear in <b>Agreements › Outbox</b> (demo).</li>
            </ul>
            {message && <div className="p-2.5 rounded-md bg-mist/40 text-xs text-ink-soft whitespace-pre-line">{message}</div>}
          </Card>
        </div>
      )}

      {/* Issues + navigation */}
      {issues.length > 0 && (step > 0 || docs.length > 0) && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-1">
          {issues.map(i => <p key={i} className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {i}</p>)}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</Button>
        {isLast ? (
          <Button variant="primary" icon={mode === 'self' ? PenLine : Send} onClick={finish} disabled={issues.length > 0}>
            {mode === 'self' ? 'Continue to sign' : 'Send for signature'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => { setStep(s => s + 1); setArmedType(null); setSelectedFieldId(null); }}
            disabled={issues.length > 0}
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {previewOpen && (
        <RecipientPreview
          isOpen
          onClose={() => setPreviewOpen(false)}
          title={title}
          message={message}
          senderName={currentUser?.name || 'The sender'}
          docs={docs}
          fields={fields}
          signers={signers}
        />
      )}
    </div>
  );
}
