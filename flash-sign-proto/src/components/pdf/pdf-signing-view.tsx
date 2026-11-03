'use client';

/* eslint-disable @next/next/no-img-element -- signature previews are local data URLs */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  PenTool, CheckCircle2, XCircle, Clock, Download, ArrowLeft, Mail, Ban, AlertTriangle, FileText, Loader2,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { SignatureField, SignatureRequest, SignatureSigner } from '@/types';
import { Button, Card } from '@/components/shared/ui';
import { Modal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';
import { SignatureEditor, isCompleteDraft, initialsFromName } from '@/components/signature/signature-editor';
import type { SignatureDraft } from '@/components/signature/signature-mark';
import { signatureToPng } from '@/lib/pdf/signature-image';
import { useNow } from '@/lib/use-now';
import { DocPages } from './pdf-pages';
import { FIELD_META, FieldValue, ReadOnlyFields, fieldStyle, todayLabel, downloadSignedPdf, isOnFile, requestPdfs } from './fields';
import { cn } from '@/lib/utils';

const OPEN = ['sent', 'viewed', 'partially_signed'];

/**
 * Signing an uploaded or sample PDF. The signer is the one named in the personal link
 * (`?as=<signerId>`, from the Outbox email) or, without a link, the signed-in user.
 */
export function PdfSigningView({ request }: { request: SignatureRequest }) {
  const asSignerId = useSearchParams().get('as');
  const currentUser = useCurrentUser();
  const signer = asSignerId
    ? request.signers.find(s => s.id === asSignerId)
    : request.signers.find(s => s.email.toLowerCase() === currentUser?.email.toLowerCase());

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <Link href={request.selfSign ? '/agreements' : `/signatures/${request.id}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> {request.selfSign ? 'Agreements' : 'Request details'}
      </Link>
      {signer ? <SignerScreen request={request} signer={signer} viaLink={!!asSignerId} /> : <NoAccess request={request} />}
    </div>
  );
}

function NoAccess({ request }: { request: SignatureRequest }) {
  const waitingFor = request.signers.filter(s => s.status === 'pending' || s.status === 'viewed');
  return (
    <Card className="p-6 text-center space-y-3 max-w-lg mx-auto">
      <Mail className="w-8 h-8 mx-auto text-flash-deep" />
      <h1 className="text-base font-bold text-ink">This signing page needs the signer&apos;s personal link</h1>
      <p className="text-xs text-muted">
        You are not a signer on &quot;{request.title}&quot;.
        {waitingFor.length > 0 && <> It is waiting for {waitingFor.map(s => s.name).join(', ')}.</>}
        {' '}In this demo, each signer&apos;s link is in the email shown in the Outbox.
      </p>
      <div className="flex justify-center gap-2">
        <Link href="/signatures/outbox"><Button variant="primary" icon={Mail}>Open Outbox</Button></Link>
        <Link href={`/signatures/${request.id}`}><Button>Request details</Button></Link>
      </div>
    </Card>
  );
}

export function Blocked({ icon: Icon, tone, title, text, request }: {
  icon: React.ElementType; tone: 'ok' | 'warn' | 'bad'; title: string; text: string; request: SignatureRequest;
}) {
  const [downloading, setDownloading] = useState(false);
  const colors = { ok: 'text-flash-deep', warn: 'text-waiting', bad: 'text-danger' };
  return (
    <Card className="p-6 text-center space-y-3 max-w-lg mx-auto">
      <Icon className={cn('w-10 h-10 mx-auto', colors[tone])} />
      <h1 className="text-base font-bold text-ink">{title}</h1>
      <p className="text-xs text-muted">{text}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {request.status === 'completed' && (
          <Button
            variant="primary"
            icon={Download}
            loading={downloading}
            onClick={async () => {
              setDownloading(true);
              await downloadSignedPdf(request);
              setDownloading(false);
            }}
          >
            Download signed PDF
          </Button>
        )}
        <Link href={`/signatures/${request.id}`}><Button>View details</Button></Link>
      </div>
    </Card>
  );
}

function SignerScreen({ request, signer, viaLink }: { request: SignatureRequest; signer: SignatureSigner; viaLink: boolean }) {
  const { markPdfSignerViewed, completePdfSigning, declineSignatureRequest, savedSignatures, saveSignature, signingDefaults, users } = useApp();
  const currentUser = useCurrentUser();
  const docs = requestPdfs(request);
  // The signer's account (by email): fills company and title, and starts the signature pad
  const signerUser = users.find(u => u.email.toLowerCase() === signer.email.toLowerCase());

  const myFields = useMemo(() => request.fields.filter(f => f.signerId === signer.id), [request.fields, signer.id]);
  const otherFields = useMemo(() => request.fields.filter(f => f.signerId !== signer.id && f.value), [request.fields, signer.id]);

  // Filled in for the signer where we know the answer; they can change everything but the date
  const [values, setValues] = useState<Record<string, string>>(() => {
    const known: Partial<Record<SignatureField['type'], string>> = {
      date: todayLabel(),
      name: signer.name,
      email: signer.email,
      company: signerUser?.company,
      title: signerUser?.title,
    };
    return Object.fromEntries(myFields.flatMap(f => (known[f.type] ? [[f.id, known[f.type]!]] : [])));
  });
  const [adopted, setAdopted] = useState<{ signature: string; initials: string } | null>(null);
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [finishing, setFinishing] = useState(false);

  const now = useNow();
  const expired = now !== null && new Date(`${request.expiresAt}T23:59:59`).getTime() < now;
  const canSign = OPEN.includes(request.status) && (signer.status === 'pending' || signer.status === 'viewed') && !expired;

  // Opening the link counts as viewing the document
  useEffect(() => {
    if (canSign && signer.status === 'pending') markPdfSignerViewed(request.id, signer.id);
  }, [canSign, signer.status, request.id, signer.id, markPdfSignerViewed]);

  const missing = myFields.filter(f => f.required && !values[f.id]);

  // ── States where signing is not possible ──
  const reviewing = (request.reviewers ?? []).filter(rv => rv.status === 'pending').map(rv => rv.name);
  if (signer.status === 'signed' && request.status === 'completed') {
    return (
      <Blocked request={request} icon={CheckCircle2} tone="ok" title="Signed and completed"
        text={request.selfSign ? 'Your document is signed. Download the signed PDF below.' : 'It is finished. The signed PDF was emailed to all recipients (see Outbox).'} />
    );
  }
  if (signer.status === 'signed' && request.status === 'awaiting_review') {
    return (
      <Blocked request={request} icon={Clock} tone="warn" title="You have signed"
        text={`Everyone has signed. Waiting for ${reviewing.join(', ')} to review it. Everyone gets the signed copy once it is approved.`} />
    );
  }
  if (signer.status === 'signed' && OPEN.includes(request.status)) {
    return (
      <Blocked request={request} icon={Clock} tone="warn" title="You have signed"
        text={`Waiting for: ${request.signers.filter(s => s.status !== 'signed').map(s => s.name).join(', ')}. ${request.reviewers?.length ? 'Then it is reviewed, and everyone gets the signed copy once it is approved.' : 'Everyone gets the signed copy when the last person signs.'}`} />
    );
  }
  if (request.status === 'cancelled') {
    return <Blocked request={request} icon={Ban} tone="bad" title="This request was cancelled" text="The sender cancelled it, so it can no longer be signed." />;
  }
  if (request.status === 'declined' || signer.status === 'declined') {
    const rejectedBy = request.reviewers?.find(rv => rv.status === 'rejected');
    return (
      <Blocked request={request} icon={XCircle} tone="bad" title="This request was declined"
        text={rejectedBy ? `${rejectedBy.name} rejected it in review: "${rejectedBy.note}". It will not be completed.` : 'A signer declined it, so it can no longer be signed.'} />
    );
  }
  if (expired || request.status === 'expired') {
    return <Blocked request={request} icon={AlertTriangle} tone="bad" title="This request has expired" text={`It expired on ${request.expiresAt}.`} />;
  }
  if (signer.status === 'waiting') {
    const before = request.signers.filter(s => s.order < signer.order && s.status !== 'signed').map(s => s.name);
    return <Blocked request={request} icon={Clock} tone="warn" title="It's not your turn yet"
      text={`This document is signed in order. You will get an email when ${before.join(', ') || 'the previous signer'} has signed.`} />;
  }

  const isMe = !!currentUser && signerUser?.id === currentUser.id;
  const saved = isMe ? savedSignatures.find(s => s.userId === currentUser.id) : undefined;

  const fillSignatureFields = (sig: { signature: string; initials: string }) => {
    setAdopted(sig);
    setValues(v => ({
      ...v,
      ...Object.fromEntries(myFields.filter(f => f.type === 'signature').map(f => [f.id, sig.signature])),
      ...Object.fromEntries(myFields.filter(f => f.type === 'initials').map(f => [f.id, sig.initials])),
    }));
  };

  const onFieldClick = (f: SignatureField) => {
    if (f.type === 'signature' || f.type === 'initials') {
      if (adopted) fillSignatureFields(adopted);
      else setAdoptOpen(true);
    } else if (f.type === 'checkbox') {
      setValues(v => ({ ...v, [f.id]: v[f.id] === 'true' ? '' : 'true' }));
    } else if (f.type === 'approve' || f.type === 'decline') {
      const mark = f.type === 'approve' ? 'Approved' : 'Declined';
      setValues(v => ({ ...v, [f.id]: v[f.id] === mark ? '' : mark }));
    }
  };

  const finish = async () => {
    if (missing.length > 0 || !consent) return;
    setFinishing(true);
    completePdfSigning(request.id, signer.id, values, adopted?.signature ?? '');
    notify(request.selfSign ? 'Document signed' : 'Signed — the next step was emailed (see Outbox)');
    setFinishing(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2"><FileText className="w-5 h-5 text-flash-deep" /> {request.title}</h1>
          <p className="text-xs text-muted">
            {request.selfSign ? 'Signing yourself' : <>From {request.senderName || 'the sender'} · signing as <b className="text-ink">{signer.name}</b> ({signer.email}){viaLink && ' · opened from personal link'}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!request.selfSign && (
            <Button variant="outline" icon={XCircle} onClick={() => setDeclineOpen(true)}>Decline</Button>
          )}
          <Button variant="primary" icon={PenTool} onClick={finish} loading={finishing} disabled={missing.length > 0 || !consent}>
            Finish
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        <Card className="p-3 bg-mist/30 order-2 lg:order-1">
          <div className="space-y-6">
            {docs.map((doc, i) => {
              const onDoc = (f: SignatureField) => isOnFile(f, doc.fileId, docs[0]?.fileId);
              return (
                <DocPages
                  key={doc.fileId}
                  doc={doc}
                  heading={docs.length > 1 ? <p className="text-xs font-bold text-ink">Document {i + 1} of {docs.length}: {doc.name}</p> : undefined}
                  renderOverlay={page => (
                    <>
                      <ReadOnlyFields fields={otherFields.filter(f => onDoc(f) && f.pageNumber === page)} colorOf={() => undefined} showEmpty={false} />
                      <div className="absolute inset-0" style={{ containerType: 'inline-size' }}>
                        {myFields.filter(f => onDoc(f) && f.pageNumber === page).map(f => (
                          <SignerField
                            key={f.id}
                            field={f}
                            value={values[f.id]}
                            onClick={() => onFieldClick(f)}
                            onText={text => setValues(v => ({ ...v, [f.id]: text }))}
                          />
                        ))}
                      </div>
                    </>
                  )}
                />
              );
            })}
          </div>
        </Card>

        <div className="space-y-3 order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <Card className="p-3 space-y-2">
            <h2 className="text-xs font-bold text-ink">Your fields</h2>
            <p className="text-[11px] text-muted">
              {missing.length === 0 ? 'All required fields are filled.' : `${missing.length} required field${missing.length === 1 ? '' : 's'} left.`}
            </p>
            <ul className="space-y-1">
              {myFields.map(f => (
                <li key={f.id} className="flex items-center gap-1.5 text-[11px]">
                  {values[f.id] ? <CheckCircle2 className="w-3.5 h-3.5 text-flash-deep" /> : <span className="w-3.5 h-3.5 rounded-full border border-line" />}
                  <span className="text-ink">{FIELD_META[f.type].label}</span>
                  <span className="text-muted">· {docs.length > 1 ? `doc ${Math.max(1, docs.findIndex(d => d.fileId === f.fileId) + 1)}, ` : ''}page {f.pageNumber}{f.required ? '' : ' · optional'}</span>
                </li>
              ))}
            </ul>
            {adopted ? (
              <div className="pt-2 border-t border-line space-y-1">
                <p className="text-[11px] text-muted">Your signature</p>
                <img src={adopted.signature} alt="Adopted signature" className="h-10 w-auto" />
                <button type="button" className="text-[11px] font-semibold text-flash-deep hover:underline" onClick={() => setAdoptOpen(true)}>Change</button>
              </div>
            ) : myFields.some(f => f.type === 'signature' || f.type === 'initials') && (
              <Button size="sm" variant="primary" icon={PenTool} className="w-full" onClick={() => setAdoptOpen(true)}>Create your signature</Button>
            )}
          </Card>
          <Card className="p-3">
            <label className="flex items-start gap-2 text-[11px] text-ink-soft cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
              I agree to use electronic records and signatures for this document.
            </label>
          </Card>
        </div>
      </div>

      <AdoptSignatureModal
        isOpen={adoptOpen}
        onClose={() => setAdoptOpen(false)}
        initial={saved ?? { name: signer.name, initials: initialsFromName(signer.name), source: 'type', styleId: 'script' }}
        allowedMethods={signingDefaults.allowedSignatureMethods}
        canSave={isMe}
        onAdopt={async (draft, save) => {
          const [signature, initials] = await Promise.all([signatureToPng(draft, 'signature'), signatureToPng(draft, 'initials')]);
          fillSignatureFields({ signature, initials });
          if (save && currentUser) saveSignature({ ...draft, userId: currentUser.id, updatedAt: new Date().toISOString() });
          setAdoptOpen(false);
        }}
      />

      <Modal isOpen={declineOpen} onClose={() => setDeclineOpen(false)} size="sm">
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-ink">Decline to sign</h2>
          <p className="text-xs text-muted">The request will be closed and the sender will be emailed your reason.</p>
          <textarea
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="Reason (required)"
            className="w-full px-2.5 py-2 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeclineOpen(false)}>Back</Button>
            <Button
              variant="danger"
              disabled={!declineReason.trim()}
              onClick={() => {
                declineSignatureRequest(request.id, signer.id, declineReason.trim());
                setDeclineOpen(false);
                notify('You declined this document');
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Field types the signer types into */
const TYPED: SignatureField['type'][] = ['text', 'name', 'email', 'company', 'title', 'number'];

function SignerField({ field, value, onClick, onText }: {
  field: SignatureField; value?: string; onClick: () => void; onText: (text: string) => void;
}) {
  const { label, icon: Icon } = FIELD_META[field.type];
  const textStyle = { fontSize: 'clamp(8px, 1.4cqw, 14px)' };
  const typed = TYPED.includes(field.type);
  const choice = field.type === 'dropdown' || field.type === 'radio';
  const clickable = !typed && !choice;
  return (
    <div
      className={cn(
        'absolute rounded-sm border-2 flex items-center justify-center',
        value ? 'border-flash/60 bg-white/90' : 'border-amber-400 bg-amber-100/80',
        !value && field.required && 'animate-pulse',
        clickable && 'cursor-pointer hover:bg-amber-50'
      )}
      style={fieldStyle(field)}
      onClick={clickable ? onClick : undefined}
      title={`${label}${field.required ? ' (required)' : ''}`}
    >
      {typed ? (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
          value={value ?? ''}
          onChange={e => onText(e.target.value)}
          placeholder={label}
          className="w-full h-full bg-transparent px-1 text-ink outline-none"
          style={textStyle}
        />
      ) : field.type === 'dropdown' ? (
        <select value={value ?? ''} onChange={e => onText(e.target.value)} className="w-full h-full bg-transparent text-ink outline-none" style={textStyle}>
          <option value="">Choose…</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'radio' ? (
        <div className="w-full h-full flex items-center gap-2 px-1 overflow-hidden" style={textStyle}>
          {(field.options ?? []).map(o => (
            <label key={o} className="flex items-center gap-0.5 whitespace-nowrap cursor-pointer text-ink">
              <input type="radio" name={field.id} checked={value === o} onChange={() => onText(o)} className="w-3 h-3" /> {o}
            </label>
          ))}
        </div>
      ) : field.type === 'approve' || field.type === 'decline' ? (
        <span className={cn('flex items-center gap-1 font-bold', value ? (field.type === 'approve' ? 'text-emerald-700' : 'text-danger') : 'text-amber-900')} style={textStyle}>
          <Icon className="w-3 h-3" /> {value || label}
        </span>
      ) : value ? (
        <FieldValue field={field} value={value} />
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900">
          <Icon className="w-3 h-3" /> {field.type === 'checkbox' ? '' : field.type === 'date' ? label : `${label}${field.required ? ' *' : ''}`}
        </span>
      )}
    </div>
  );
}

function AdoptSignatureModal({ isOpen, onClose, initial, allowedMethods, canSave, onAdopt }: {
  isOpen: boolean;
  onClose: () => void;
  initial: SignatureDraft;
  allowedMethods: SignatureDraft['source'][];
  canSave: boolean;
  onAdopt: (draft: SignatureDraft, save: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SignatureDraft>(initial);
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState(false);
  // Start from the latest saved signature each time the pad opens
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setDraft({ ...initial });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink">Adopt your signature</h2>
          <p className="text-xs text-muted">It will be placed in every signature and initials field of yours on this document.</p>
        </div>
        <SignatureEditor value={draft} onChange={setDraft} allowedMethods={allowedMethods} />
        {canSave && (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} /> Save as my signature for next time
          </label>
        )}
        <p className="text-[11px] text-muted">
          By selecting Adopt and sign, I agree that this mark is my electronic signature for this document (demo, not legally binding).
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!isCompleteDraft(draft) || busy}
            onClick={async () => {
              setBusy(true);
              await onAdopt(draft, canSave && save);
              setBusy(false);
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adopt and sign'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
