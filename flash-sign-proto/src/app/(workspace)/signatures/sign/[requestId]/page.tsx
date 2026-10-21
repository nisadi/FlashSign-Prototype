'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck2,
  PenTool,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Type,
  Check,
  Sparkles
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function DemoSigningExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const {
    signatureRequests,
    signDocumentSimulated,
    declineSignatureRequest,
    documentItems,
    contracts
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

  // Signing inputs
  const [typedSignature, setTypedSignature] = useState(activeSigner?.name || 'Alex Morgan');
  const [initials, setInitials] = useState('AM');
  const [fontStyle, setFontStyle] = useState<'font-serif' | 'font-mono' | 'italic'>('italic');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Update typed name when switching signers
  React.useEffect(() => {
    if (activeSigner) {
      setTypedSignature(activeSigner.name);
      const initialsLetters = activeSigner.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      setInitials(initialsLetters || 'FS');
    }
  }, [activeSigner]);

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

  const canSubmit = typedSignature.trim().length > 1 && agreedTerms && !isSubmitting;

  const handleFinishSigning = () => {
    if (!canSubmit || !activeSigner) return;
    setIsSubmitting(true);

    signDocumentSimulated(request.id, activeSigner.id, `Typed: ${typedSignature.trim()}`);

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

            {/* Signature Input Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Your Full Legal Name *
                </label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type name to sign..."
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Signature Font Style
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'italic', label: 'Cursive Script' },
                    { id: 'font-serif', label: 'Classic Serif' },
                    { id: 'font-mono', label: 'Modern Sans' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontStyle(f.id as any)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        fontStyle === f.id ? 'bg-ink text-paper-elevated border-ink' : 'bg-paper text-muted border-line'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Signature Preview Card */}
            <div className="p-6 bg-paper rounded-xl border border-line text-center space-y-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">
                GENERATED SIMULATED SIGNATURE
              </span>
              <div className={`text-3xl text-flash-deep py-3 select-none ${fontStyle}`}>
                {typedSignature.trim() || 'Your Signature Here'}
              </div>
              <div className="text-[11px] text-muted font-mono">
                Verified Signer: {activeSigner?.email} • Hash: #SIM-{Math.abs(typedSignature.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}
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
      {showDeclineModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-line rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
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
        </div>
      )}
    </div>
  );
}
