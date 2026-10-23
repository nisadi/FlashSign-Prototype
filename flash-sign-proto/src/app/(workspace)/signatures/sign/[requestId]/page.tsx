'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PenTool, Check, Stamp, RefreshCw, Undo2 } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';
import { SignatureEditor, isCompleteDraft, initialsFromName } from '@/components/signature/signature-editor';
import { SignatureMark, type SignatureDraft } from '@/components/signature/signature-mark';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/shared/modal';

export default function DemoSigningExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const {
    signatureRequests,
    signDocumentSimulated,
    declineSignatureRequest,
    documentItems,
    contracts,
    users,
    savedSignatures,
    saveSignature,
    signingDefaults,
    companySeals,
    demoRole
  } = useApp();
  const currentUser = useCurrentUser();

  const request = useMemo(() => {
    return signatureRequests.find(r => r.id === requestId);
  }, [signatureRequests, requestId]);

  const linkedDoc = useMemo(() => {
    if (!request?.documentId) return null;
    return documentItems.find(d => d.id === request.documentId);
  }, [request, documentItems]);

  const linkedContract = useMemo(() => {
    if (!request?.contractId) return null;
    return contracts.find(c => c.id === request.contractId);
  }, [request, contracts]);

  // Find eligible signer for the current user or default to first pending signer
  const pendingSigners = useMemo(() => {
    if (!request) return [];
    return request.signers.filter(s => s.status === 'pending' || s.status === 'viewed' || s.status === 'waiting');
  }, [request]);

  const [activeSignerId, setActiveSignerId] = useState<string>('');

  // Set initial signer once loaded
  React.useEffect(() => {
    if (pendingSigners.length > 0 && !activeSignerId) {
      const match = pendingSigners.find(s => s.email === currentUser?.email || s.name.toLowerCase().includes('alex')) || pendingSigners[0];
      setActiveSignerId(match.id);
    }
  }, [pendingSigners, activeSignerId, currentUser]);

  const activeSigner = useMemo(() => {
    return request?.signers.find(s => s.id === activeSignerId) || pendingSigners[0];
  }, [request, activeSignerId, pendingSigners]);

  // The account behind the active signer (matched by email), and their saved signature
  const signerUser = users.find(u => u.email === activeSigner?.email);
  const isSelf = !!signerUser && signerUser.id === currentUser?.id;
  const savedSignature = savedSignatures.find(sig => sig.userId === signerUser?.id);

  // Seals the signed-in user's role may apply (only when signing as themselves)
  const availableSeals = isSelf
    ? companySeals.filter(seal => seal.isActive && seal.allowedRoles.includes(demoRole))
    : [];

  // Signing inputs: start from the saved signature; "Change signature" edits a copy for this document
  const [draft, setDraft] = useState<SignatureDraft | null>(null);
  const [changing, setChanging] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sealId, setSealId] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Reset the signature when switching signers (or once their saved signature has loaded)
  const signatureKey = `${activeSigner?.id}|${savedSignature?.updatedAt ?? ''}`;
  const [preparedFor, setPreparedFor] = useState<string | null>(null);
  if (activeSigner && preparedFor !== signatureKey) {
    setPreparedFor(signatureKey);
    if (savedSignature) {
      setDraft(savedSignature);
      setChanging(false);
      setSaveAsDefault(false);
    } else {
      setDraft({
        name: activeSigner.name,
        initials: initialsFromName(activeSigner.name),
        source: signingDefaults.allowedSignatureMethods[0] ?? 'type',
        styleId: 'script',
      });
      setChanging(true);
      // First signature: keep it for next time, if the signer has an account here
      setSaveAsDefault(!!signerUser);
    }
    setSealId('');
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-paper p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-ink">Signature request not found.</p>
          <Link href="/signatures/all" className="text-xs text-flash-deep underline mt-2 block">
            Return to All Requests
          </Link>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const selectedSeal = availableSeals.find(seal => seal.id === sealId);
  const canSubmit = !!draft && isCompleteDraft(draft) && agreedTerms && !isSubmitting;

  const handleFinishSigning = () => {
    if (!canSubmit || !activeSigner || !draft) return;
    setIsSubmitting(true);

    if (saveAsDefault && signerUser) {
      saveSignature({ ...draft, userId: signerUser.id, updatedAt: new Date().toISOString() });
    }
    const signatureValue = draft.source === 'type'
      ? `Typed (${draft.styleId ?? 'script'}): ${draft.name.trim()}`
      : draft.signatureImage ?? '';
    signDocumentSimulated(
      request.id,
      activeSigner.id,
      signatureValue,
      selectedSeal ? { id: selectedSeal.id, name: selectedSeal.name } : undefined
    );

    setTimeout(() => {
      router.push(`/signatures/${request.id}/complete`);
    }, 600);
  };

  const handleDecline = () => {
    if (!activeSigner) return;
    declineSignatureRequest(request.id, activeSigner.id, declineReason || 'Declined during demo session');
    setShowDeclineModal(false);
    router.push(`/signatures/${request.id}`);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Distraction-Free Header */}
      <header className="bg-ink text-paper-elevated px-6 py-4 flex items-center justify-between border-b border-ink-soft sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-flash flex items-center justify-center font-bold text-ink">
            FS
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white block">FLASH SIGN</span>
            <span className="text-[10px] text-flash uppercase font-bold tracking-widest">
              SIMULATED SIGNING EXPERIENCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeclineModal(true)}
            className="px-3 py-1.5 bg-ink-soft hover:bg-danger/20 text-danger text-xs font-semibold rounded-lg border border-danger/30 transition-colors"
          >
            Decline to Sign
          </button>
          <Link
            href={`/signatures/${request.id}`}
            className="px-3 py-1.5 bg-ink-soft hover:bg-mist/20 text-paper-elevated text-xs font-semibold rounded-lg border border-ink-soft transition-colors"
          >
            Exit Signing
          </Link>
        </div>
      </header>

      {/* Main Signing Workspace */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        <DemoNoticeBanner />

        {/* Signer Switcher for multi-signer testing */}
        {pendingSigners.length > 1 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-ink block">Testing as Signer:</span>
              <p className="text-xs text-muted">You can switch between participants to simulate multi-party execution</p>
            </div>
            <select
              value={activeSignerId}
              onChange={(e) => setActiveSignerId(e.target.value)}
              className="px-3 py-1.5 bg-paper border border-line rounded-lg text-xs font-semibold text-ink focus:outline-none focus:border-flash"
            >
              {pendingSigners.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) — {s.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Document Content Paper */}
        <div className="bg-white border border-line shadow-lg rounded-xl p-8 sm:p-12 space-y-6 text-ink">
          <div className="border-b border-line pb-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-muted uppercase">DOCUMENT FOR SIGNATURE</span>
              <h2 className="text-2xl font-bold text-ink">{request.title}</h2>
              <p className="text-xs text-muted mt-1">Package ID: {request.id}</p>
            </div>
            <div className="text-right text-xs text-muted">
              <span>Date: {currentDate}</span>
            </div>
          </div>

          {/* Formatted Text Content */}
          <div className="prose prose-sm max-w-none text-ink-soft leading-relaxed space-y-4 font-serif text-sm">
            <p>
              {linkedDoc?.content || `
                THIS MASTER SERVICES AND INTELLECTUAL PROPERTY AGREEMENT is entered into as of ${currentDate}, by and between Flash Sign Inc., and ${linkedContract?.counterparty || 'Authorized Counterparty'}.
              `}
            </p>
            <p>
              WHEREAS, the Parties desire to formally confirm delivery terms, confidentiality warranties, and operational SLAs in accordance with accepted industry practices.
            </p>
            <p>
              NOW, THEREFORE, the Parties agree that digital execution of this instrument represents valid manifestation of consent in accordance with simulated demo guidelines.
            </p>
          </div>

          {/* Interactive Signing Block */}
          <div className="mt-12 pt-8 border-t-2 border-dashed border-line space-y-6">
            <h3 className="font-bold text-ink text-base font-sans flex items-center gap-2">
              <PenTool className="w-5 h-5 text-flash-deep" />
              Signer Execution Section
            </h3>

            {/* Your signature: saved one by default, changeable for this document */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Your signature</span>
                {!changing && draft && (
                  <button
                    type="button"
                    onClick={() => { setChanging(true); setSaveAsDefault(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-mist text-xs font-semibold text-ink"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Change signature
                  </button>
                )}
                {changing && savedSignature && (
                  <button
                    type="button"
                    onClick={() => { setDraft(savedSignature); setChanging(false); setSaveAsDefault(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-mist text-xs font-semibold text-ink"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Use my saved signature
                  </button>
                )}
              </div>

              {changing && draft ? (
                <div className="p-4 rounded-xl border border-line bg-paper space-y-3">
                  {!savedSignature && (
                    <p className="text-xs text-muted">
                      {signerUser ? 'You haven’t saved a signature yet. Create one to sign this document.' : 'Create a signature to sign this document.'}
                    </p>
                  )}
                  <SignatureEditor value={draft} onChange={setDraft} allowedMethods={signingDefaults.allowedSignatureMethods} />
                  {signerUser && (
                    <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={e => setSaveAsDefault(e.target.checked)}
                        className="w-4 h-4 accent-flash"
                      />
                      {savedSignature ? 'Also replace my saved signature with this one' : 'Save this as my signature for next time'}
                    </label>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Using your saved signature from{' '}
                  <Link href="/settings/signature" className="font-semibold text-flash-deep hover:underline">Settings › My Signature</Link>.
                  Changing it here only affects this document unless you choose to save it.
                </p>
              )}
            </div>

            {/* Company seal (optional, role-restricted) */}
            {availableSeals.length > 0 && (
              <div className="space-y-2 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5" /> Company seal (optional)
                </span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Company seal">
                  {[{ id: '', name: 'No seal', image: '' }, ...availableSeals].map(seal => (
                    <button
                      key={seal.id || 'none'}
                      type="button"
                      role="radio"
                      aria-checked={sealId === seal.id}
                      onClick={() => setSealId(seal.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
                        sealId === seal.id ? 'border-flash bg-flash/5 ring-1 ring-flash text-ink' : 'border-line bg-paper text-muted hover:text-ink'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {seal.image && <img src={seal.image} alt="" className="w-8 h-8 object-contain" />}
                      {seal.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted">Applying a seal is recorded in this request&apos;s audit trail.</p>
              </div>
            )}

            {/* Signature block as it will appear on the document */}
            <div className="p-6 bg-paper rounded-xl border border-line font-sans">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3">
                Signature block preview
              </span>
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div className="min-w-0">
                  <div className="min-h-14 flex items-end border-b border-ink/40 pb-1 pr-8">
                    {draft && isCompleteDraft(draft)
                      ? <SignatureMark signature={draft} size="lg" />
                      : <span className="text-sm text-muted">Your signature will appear here</span>}
                  </div>
                  <p className="text-xs text-ink mt-1.5 font-semibold">{activeSigner?.name}</p>
                  <p className="text-[11px] text-muted">{activeSigner?.email} · {currentDate}</p>
                </div>
                {draft && isCompleteDraft(draft) && (
                  <div className="text-center">
                    <div className="min-h-10 flex items-end justify-center border-b border-ink/40 pb-1 px-4">
                      <SignatureMark signature={draft} variant="initials" size="md" />
                    </div>
                    <p className="text-[11px] text-muted mt-1.5">Initials</p>
                  </div>
                )}
                {selectedSeal && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedSeal.image} alt={selectedSeal.name} className="w-24 h-24 object-contain opacity-90 -rotate-6" />
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 p-4 bg-mist/30 border border-line rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-flash shrink-0"
              />
              <span className="text-xs text-ink-soft leading-relaxed">
                I acknowledge that I am testing the simulated digital signing workflow for <strong>Flash Sign</strong>. I understand that this demonstration produces non-binding prototype records.
              </span>
            </label>
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="text-xs text-muted">
            Signer: <strong className="text-ink">{activeSigner?.name}</strong> ({activeSigner?.role})
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/signatures/${request.id}`)}
              className="px-4 py-2 bg-paper hover:bg-mist/50 border border-line text-ink text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleFinishSigning}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-flash hover:bg-flash-deep disabled:opacity-40 text-ink text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Finish Demo Signing'}
            </button>
          </div>
        </div>
      </main>

      {/* Decline Dialog Modal */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        size="sm"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-ink">Decline Signature Request</h3>
          <p className="text-xs text-muted">
            Declining will update the request status to Declined in local state and notify the sender.
          </p>
          <textarea
            rows={3}
            placeholder="Reason for declining (optional)..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-flash"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeclineModal(false)}
              className="px-4 py-2 bg-paper border border-line rounded-lg text-xs font-semibold text-ink hover:bg-mist/50"
            >
              Back
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg text-xs font-bold"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
