'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BellRing,
  Copy,
  PenTool,
  Send,
  Eye,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { FEATURES } from '@/lib/features';
import {
  SignatureRequestStatusBadge,
  SignerStatusBadge
} from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SigningProgressPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const {
    signatureRequests,
    sendSignatureReminder,
    cancelSignatureRequest,
    documentItems,
    contracts
  } = useApp();
  const currentUser = useCurrentUser();

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const request = useMemo(() => {
    return signatureRequests.find(r => r.id === requestId);
  }, [signatureRequests, requestId]);

  const linkedDocument = useMemo(() => {
    if (!request?.documentId) return null;
    return documentItems.find(d => d.id === request.documentId);
  }, [request, documentItems]);

  const linkedContract = useMemo(() => {
    if (!FEATURES.contracts || !request?.contractId) return null;
    return contracts.find(c => c.id === request.contractId);
  }, [request, contracts]);

  if (!request) {
    return (
      <div className="min-h-full bg-paper p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <FileCheck2 className="w-12 h-12 text-muted/50 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-ink">Signature Request Not Found</h2>
          <p className="text-sm text-muted mt-1">The request {requestId} could not be located in local state.</p>
          <div className="mt-4">
            <Link
              href="/signatures/all"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper-elevated rounded-lg text-sm font-semibold hover:bg-ink-soft transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Signature Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSigners = request.signers.length;
  const signedCount = request.signers.filter(s => s.status === 'signed').length;
  const progressPct = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
  const isComplete = request.status === 'completed';
  const isActionable = request.status !== 'completed' && request.status !== 'declined' && request.status !== 'cancelled';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = () => {
    sendSignatureReminder(request.id);
    setToastMessage(`Simulated reminder dispatched to pending participants for ${request.id}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {toastMessage && (
          <div className="p-3 bg-flash/20 border border-flash text-flash-deep font-semibold text-xs rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/signatures" className="hover:text-ink transition-colors">Signatures</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/signatures/all" className="hover:text-ink transition-colors">All Requests</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono text-ink-soft">{request.id}</span>
          </div>

          <Link
            href="/signatures/all"
            className="text-xs text-muted hover:text-ink flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Requests
          </Link>
        </div>

        {/* Header Summary Banner */}
        <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 bg-paper rounded border border-line text-ink-soft">
                  {request.id}
                </span>
                <SignatureRequestStatusBadge status={request.status} />
                <span className="text-xs px-2.5 py-0.5 bg-mist/60 rounded text-ink-soft capitalize font-medium">
                  {request.signingOrder} Execution
                </span>
              </div>

              <h1 className="text-2xl font-bold text-ink">
                {request.title}
              </h1>

              <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                <span>Sender: <strong className="text-ink-soft">{request.senderName}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  Sent: {new Date(request.createdAt).toLocaleDateString()}
                </span>
                {request.expiresAt && (
                  <>
                    <span>•</span>
                    <span>Expires: {new Date(request.expiresAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isActionable && (
                <Link
                  href={`/signatures/sign/${request.id}`}
                  className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Demo Sign Experience
                </Link>
              )}

              {isActionable && (
                <button
                  onClick={handleSendReminder}
                  className="px-3.5 py-2 bg-paper hover:bg-mist/50 border border-line text-ink-soft font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5 text-flash-deep" />
                  Send Reminder
                </button>
              )}

              <Link
                href={`/signatures/${request.id}/fields`}
                className="px-3.5 py-2 bg-paper hover:bg-mist/50 border border-line text-ink-soft font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Fields Studio
              </Link>

              <Link
                href={`/signatures/${request.id}/audit`}
                className="px-3.5 py-2 bg-paper hover:bg-mist/50 border border-line text-ink-soft font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Audit Trail
              </Link>

              <button
                onClick={handleCopyLink}
                className="p-2 bg-paper hover:bg-mist/50 border border-line text-muted hover:text-ink rounded-lg text-xs transition-colors"
                title="Copy request reference link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar in Banner */}
          <div className="mt-6 pt-5 border-t border-line space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-soft">
                Workflow Progress: {signedCount} of {totalSigners} signers recorded
              </span>
              <span className="font-bold text-ink">{progressPct}% Complete</span>
            </div>
            <div className="w-full bg-paper rounded-full h-2.5 overflow-hidden border border-line">
              <div
                className={`h-full transition-all duration-500 ${
                  isComplete ? 'bg-flash' : 'bg-flash-deep'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signers Timeline (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-ink text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-flash-deep" />
                Signer Sequence & Execution Status
              </h3>

              <div className="divide-y divide-line">
                {request.signers.map((signer, index) => {
                  const isCurrentSigner = isActionable && (signer.status === 'pending' || signer.status === 'viewed');

                  return (
                    <div
                      key={signer.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-7 h-7 rounded-full bg-mist text-ink-soft font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {signer.order}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-ink text-sm">{signer.name}</h4>
                            <SignerStatusBadge status={signer.status} />
                          </div>
                          <p className="text-xs text-muted">{signer.email} • {signer.role}</p>

                          <div className="flex items-center gap-3 text-[11px] text-muted mt-1.5 flex-wrap">
                            {signer.viewedAt && (
                              <span>Viewed: {new Date(signer.viewedAt).toLocaleDateString()}</span>
                            )}
                            {signer.signedAt && (
                              <span className="text-flash-deep font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Signed: {new Date(signer.signedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCurrentSigner && (
                        <div className="self-end sm:self-center">
                          <Link
                            href={`/signatures/sign/${request.id}`}
                            className="px-3 py-1.5 bg-flash hover:bg-flash-deep text-ink text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            Sign as {signer.name.split(' ')[0]}
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message Card */}
            {request.message && (
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">Message to Signers</span>
                <p className="text-xs text-ink-soft leading-relaxed italic">
                  &ldquo;{request.message}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Linked Artifacts & Quick Info (1 Col) */}
          <div className="space-y-6">
            {/* Linked Contract Card */}
            {linkedContract && (
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">Linked Contract</span>
                <h4 className="font-bold text-ink text-sm">{linkedContract.title}</h4>
                <p className="text-xs text-muted">{linkedContract.counterparty} • ID: {linkedContract.id}</p>
                <Link
                  href={`/contracts/${linkedContract.id}`}
                  className="w-full py-2 bg-paper hover:bg-mist/50 border border-line rounded-lg text-xs font-semibold text-ink transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Contract Details
                </Link>
              </div>
            )}

            {/* Linked Document Card */}
            {linkedDocument && (
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">Attached Document</span>
                <h4 className="font-bold text-ink text-sm">{linkedDocument.title}</h4>
                <p className="text-xs text-muted">Version {linkedDocument.currentVersion || (linkedDocument.versions?.length || 1)} • {linkedDocument.type.toUpperCase()}</p>
                <Link
                  href={`/documents/${linkedDocument.id}`}
                  className="w-full py-2 bg-paper hover:bg-mist/50 border border-line rounded-lg text-xs font-semibold text-ink transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Open Document Preview
                </Link>
              </div>
            )}

            {/* Audit Trail Quick Link */}
            <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block">Event Audit Log</span>
              <p className="text-xs text-muted">
                {request.events?.length || 0} simulated lifecycle events recorded for this signature package.
              </p>
              <Link
                href={`/signatures/${request.id}/audit`}
                className="w-full py-2 bg-ink hover:bg-ink-soft text-paper-elevated rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                View Full Audit Trail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
