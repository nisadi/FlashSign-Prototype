'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Ban, CheckCircle2, Clock, FileText, Mail, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { SignatureRequest, SignatureReviewer } from '@/types';
import { Button, Card } from '@/components/shared/ui';
import { Modal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';
import { ReviewerStatusBadge, SignerStatusBadge } from '@/components/documents/document-badges';
import { useNow } from '@/lib/use-now';
import { DocPages } from './pdf-pages';
import { ReadOnlyFields, isOnFile, requestPdfs } from './fields';
import { Blocked } from './pdf-signing-view';

/**
 * Reviewing a signed PDF before it is finished. The reviewer is the one named in the personal
 * link (`?as=<reviewerId>`, from the Outbox email) or, without a link, the signed-in user.
 */
export function PdfReviewView({ request }: { request: SignatureRequest }) {
  const asReviewerId = useSearchParams().get('as');
  const currentUser = useCurrentUser();
  const reviewer = asReviewerId
    ? request.reviewers?.find(rv => rv.id === asReviewerId)
    : request.reviewers?.find(rv => rv.email.toLowerCase() === currentUser?.email.toLowerCase());

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <Link href={`/signatures/${request.id}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> Request details
      </Link>
      {reviewer ? <ReviewerScreen request={request} reviewer={reviewer} viaLink={!!asReviewerId} /> : <NoAccess request={request} />}
    </div>
  );
}

function NoAccess({ request }: { request: SignatureRequest }) {
  return (
    <Card className="p-6 text-center space-y-3 max-w-lg mx-auto">
      <Mail className="w-8 h-8 mx-auto text-flash-deep" />
      <h1 className="text-base font-bold text-ink">This review page needs the reviewer&apos;s personal link</h1>
      <p className="text-xs text-muted">
        You are not a reviewer on &quot;{request.title}&quot;. In this demo, each reviewer&apos;s link is in the email shown in the Outbox.
      </p>
      <div className="flex justify-center gap-2">
        <Link href="/signatures/outbox"><Button variant="primary" icon={Mail}>Open Outbox</Button></Link>
        <Link href={`/signatures/${request.id}`}><Button>Request details</Button></Link>
      </div>
    </Card>
  );
}

function ReviewerScreen({ request, reviewer, viaLink }: { request: SignatureRequest; reviewer: SignatureReviewer; viaLink: boolean }) {
  const { approvePdfReview, rejectPdfReview } = useApp();
  const docs = requestPdfs(request);
  const signers = [...request.signers].sort((a, b) => a.order - b.order);
  const colorOf = (id: string) => request.signers.find(s => s.id === id)?.color ?? '#999';
  const [note, setNote] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const now = useNow();
  const expired = now !== null && new Date(`${request.expiresAt}T23:59:59`).getTime() < now;

  // ── States where reviewing is not possible ──
  if (reviewer.status === 'approved') {
    return request.status === 'completed' ? (
      <Blocked request={request} icon={CheckCircle2} tone="ok" title="Approved and completed"
        text="Every reviewer approved it. The signed PDF was emailed to all recipients (see Outbox)." />
    ) : (
      <Blocked request={request} icon={Clock} tone="warn" title="You approved it"
        text={`Waiting for ${request.reviewers!.filter(rv => rv.status === 'pending').map(rv => rv.name).join(', ')} to review it too.`} />
    );
  }
  if (reviewer.status === 'rejected') {
    return <Blocked request={request} icon={XCircle} tone="bad" title="You rejected it" text={`Your reason: "${reviewer.note}". The request is closed.`} />;
  }
  if (request.status === 'cancelled') {
    return <Blocked request={request} icon={Ban} tone="bad" title="This request was cancelled" text="The sender cancelled it, so there is nothing to review." />;
  }
  if (request.status === 'declined') {
    return <Blocked request={request} icon={XCircle} tone="bad" title="This request was declined" text="It was declined, so it will not be completed." />;
  }
  if (expired || request.status === 'expired') {
    return <Blocked request={request} icon={AlertTriangle} tone="bad" title="This request has expired" text={`It expired on ${request.expiresAt}.`} />;
  }
  if (reviewer.status === 'waiting') {
    const left = signers.filter(s => s.status !== 'signed').map(s => s.name);
    return <Blocked request={request} icon={Clock} tone="warn" title="Not ready for review yet"
      text={`You can review it once everyone has signed. Still waiting for: ${left.join(', ')}. You will get an email when it is your turn.`} />;
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2"><FileText className="w-5 h-5 text-flash-deep" /> {request.title}</h1>
          <p className="text-xs text-muted">
            From {request.senderName || 'the sender'} · reviewing as <b className="text-ink">{reviewer.name}</b> ({reviewer.email}){viaLink && ' · opened from personal link'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={XCircle} onClick={() => setRejectOpen(true)}>Reject</Button>
          <Button
            variant="primary"
            icon={ShieldCheck}
            onClick={() => {
              approvePdfReview(request.id, reviewer.id, note.trim());
              notify('Approved. See the Outbox for what was sent');
            }}
          >
            Approve
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <Card className="p-3 bg-mist/30 space-y-6 order-2 lg:order-1">
          {docs.map((doc, i) => (
            <DocPages
              key={doc.fileId}
              doc={doc}
              heading={docs.length > 1 ? <p className="text-xs font-bold text-ink">Document {i + 1} of {docs.length}: {doc.name}</p> : undefined}
              renderOverlay={page => (
                <ReadOnlyFields
                  fields={request.fields.filter(f => f.pageNumber === page && isOnFile(f, doc.fileId, docs[0]?.fileId))}
                  colorOf={colorOf}
                />
              )}
            />
          ))}
        </Card>

        <div className="space-y-3 order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <Card className="p-3 space-y-2">
            <h2 className="text-xs font-bold text-ink flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Your review</h2>
            <p className="text-[11px] text-muted">
              Everyone has signed. Check the signed document: it is finished only when {request.reviewers!.length === 1 ? 'you approve it' : 'every reviewer approves it'}.
            </p>
            <label className="block text-[11px]">
              <span className="text-muted">Comment (optional)</span>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="w-full mt-0.5 px-2.5 py-2 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash"
              />
            </label>
          </Card>
          <Card className="p-3 space-y-2">
            <h2 className="text-xs font-bold text-ink">Signed by</h2>
            {signers.map(s => (
              <div key={s.id} className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color ?? '#999' }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink truncate">{s.name}</p>
                  {s.signedAt && <p className="text-[10px] text-muted">{new Date(s.signedAt).toLocaleString()}</p>}
                </div>
                <SignerStatusBadge status={s.status} />
              </div>
            ))}
            {request.reviewers!.length > 1 && (
              <>
                <h2 className="text-xs font-bold text-ink pt-2 border-t border-line">Reviewers</h2>
                {request.reviewers!.map(rv => (
                  <div key={rv.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-ink truncate">{rv.name}{rv.id === reviewer.id ? ' (you)' : ''}</span>
                    <ReviewerStatusBadge status={rv.status} />
                  </div>
                ))}
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} size="sm">
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-ink">Reject in review</h2>
          <p className="text-xs text-muted">The request will be closed and not completed. The sender and the signers will be emailed your reason.</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Reason (required)"
            className="w-full px-2.5 py-2 text-xs rounded-md border border-line bg-paper-elevated focus:outline-none focus:border-flash"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Back</Button>
            <Button
              variant="danger"
              disabled={!rejectReason.trim()}
              onClick={() => {
                rejectPdfReview(request.id, reviewer.id, rejectReason.trim());
                setRejectOpen(false);
                notify('You rejected this document');
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
