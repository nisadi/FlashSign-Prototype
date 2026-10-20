'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Button, Card } from '@/components/shared/ui';
import { DocStatusBadge } from '@/components/shared/badges';
import { formatDate, formatRelative } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, FileText, Users, CheckCircle2, Clock, XCircle,
  Send, ThumbsUp, ThumbsDown, History, Eye, Pen,
} from 'lucide-react';
import type { Signer } from '@/types';

export default function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params);
  const { documents, users, approvals, updateDocument, currentUserId } = useApp();
  const [signing, setSigning] = useState(false);

  const doc = documents.find(d => d.id === documentId);
  if (!doc) return notFound();

  const owner = users.find(u => u.id === doc.ownerId);
  const docApprovals = approvals.filter(a => a.documentId === documentId);
  const signedCount = doc.signers.filter(s => s.status === 'signed').length;
  const currentSigner = doc.signers.find(s =>
    users.find(u => u.id === currentUserId)?.email === s.email
  );

  const handleSimulateSign = () => {
    setSigning(true);
    setTimeout(() => {
      const updatedSigners = doc.signers.map(s =>
        s.email === currentSigner?.email
          ? { ...s, status: 'signed' as const, signedAt: new Date().toISOString() }
          : s
      );
      const allSigned = updatedSigners.every(s => s.status === 'signed');
      updateDocument(documentId, {
        signers: updatedSigners,
        status: allSigned ? 'signed' : 'pending',
        ...(allSigned ? { signedDate: new Date().toISOString() } : {}),
        auditEvents: [
          ...doc.auditEvents,
          {
            id: `ae-${Date.now()}`,
            documentId,
            actorId: currentUserId,
            actorName: users.find(u => u.id === currentUserId)?.name ?? 'Unknown',
            action: 'Document signed',
            timestamp: new Date().toISOString(),
          },
        ],
      });
      setSigning(false);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-up">
      <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Documents
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-muted" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">{doc.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <DocStatusBadge status={doc.status} />
              <span className="text-xs text-muted">{doc.pages} pages</span>
              {doc.dueDate && (
                <span className="text-xs text-muted">• Due {formatDate(doc.dueDate)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/documents/${documentId}/history`}>
            <Button variant="ghost" size="sm" icon={History}>History</Button>
          </Link>
          {doc.status === 'draft' && (
            <Button variant="primary" size="sm" icon={Send}>Send for Signature</Button>
          )}
          {currentSigner && currentSigner.status === 'pending' && (
            <Link href={`/sign/${documentId}`}>
              <Button variant="primary" size="sm" icon={Pen}>Sign Now</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2 space-y-5">
          {/* Mock document content */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-mist/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted" />
                <span className="text-xs font-medium text-ink">{doc.title}</span>
              </div>
              <Button variant="ghost" size="sm" icon={Eye}>Preview</Button>
            </div>
            <div className="p-8 bg-white min-h-64">
              <div className="max-w-md mx-auto">
                <h2 className="text-lg font-bold text-ink mb-1">{doc.title}</h2>
                <p className="text-xs text-muted mb-6">Reference: DOC-{documentId.toUpperCase()}</p>
                <div className="space-y-3 text-sm text-ink/80">
                  <p>This Agreement is entered into as of the date last signed below, between the parties identified herein.</p>
                  <p>The parties agree to the terms and conditions set forth in this document, which has been reviewed and approved by authorized representatives of each party.</p>
                  <p className="text-muted text-xs">[Document preview — {doc.pages} pages total]</p>
                </div>
                {/* Signature placeholders */}
                <div className="mt-8 pt-6 border-t border-line/50 grid grid-cols-2 gap-6">
                  {doc.signers.map(signer => (
                    <div key={signer.id}>
                      <div className="h-12 border-b border-ink/20 mb-2 flex items-end pb-1">
                        {signer.status === 'signed' ? (
                          <span className="text-flash italic font-medium text-sm" style={{ fontFamily: 'cursive' }}>
                            {signer.name}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">Sign here</span>
                        )}
                      </div>
                      <p className="text-xs text-muted">{signer.name}</p>
                      <p className="text-[10px] text-muted/60">{signer.role}</p>
                      {signer.signedAt && (
                        <p className="text-[10px] text-emerald-600">{formatDate(signer.signedAt)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Audit Trail */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Audit Trail
            </h2>
            <div className="space-y-3">
              {doc.auditEvents.map((event, i) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-flash mt-1" />
                    {i < doc.auditEvents.length - 1 && <div className="w-px flex-1 bg-line mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-medium text-ink">{event.action}</p>
                    <p className="text-[10px] text-muted">{event.actorName} • {formatRelative(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Signature Progress */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Signers ({signedCount}/{doc.signers.length})
            </h2>
            {doc.signers.length > 0 ? (
              <div className="space-y-3">
                {doc.signers.map(signer => (
                  <SignerRow key={signer.id} signer={signer} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No signers assigned yet.</p>
            )}

            {currentSigner && currentSigner.status === 'pending' && (
              <div className="mt-4 pt-4 border-t border-line">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={Pen}
                  onClick={handleSimulateSign}
                  loading={signing}
                >
                  Sign as {currentSigner.name}
                </Button>
                <p className="text-[10px] text-muted mt-1 text-center">Demo — simulated signature</p>
              </div>
            )}
          </Card>

          {/* Approvals */}
          {docApprovals.length > 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink mb-3">Approvals</h2>
              <div className="space-y-2">
                {docApprovals.map(apr => {
                  const approver = users.find(u => u.id === apr.assignedTo);
                  return (
                    <div key={apr.id} className="flex items-center justify-between text-xs">
                      <span className="text-ink">{approver?.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                        apr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        apr.status === 'rejected' ? 'bg-red-50 text-danger' :
                        'bg-amber-50 text-waiting'
                      }`}>{apr.status}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Document info */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink mb-3">Document Info</h2>
            <dl className="space-y-2 text-xs">
              {[
                { label: 'Owner', value: owner?.name ?? '—' },
                { label: 'Type', value: doc.type.toUpperCase() },
                { label: 'Created', value: formatRelative(doc.createdAt) },
                ...(doc.signedDate ? [{ label: 'Signed', value: formatDate(doc.signedDate) }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-ink font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SignerRow({ signer }: { signer: Signer }) {
  return (
    <div className="flex items-center gap-2">
      {signer.status === 'signed' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : signer.status === 'declined' ? (
        <XCircle className="w-4 h-4 text-danger shrink-0" />
      ) : (
        <Clock className="w-4 h-4 text-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink truncate">{signer.name}</p>
        <p className="text-[10px] text-muted truncate">{signer.email}</p>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
        signer.status === 'signed' ? 'bg-emerald-50 text-emerald-700' :
        signer.status === 'declined' ? 'bg-red-50 text-danger' :
        'bg-amber-50 text-waiting'
      }`}>
        {signer.status}
      </span>
    </div>
  );
}
