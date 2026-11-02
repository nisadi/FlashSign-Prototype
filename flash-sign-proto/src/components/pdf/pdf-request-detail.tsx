'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Download, FileDown, BellRing, Ban, PenTool, FileText, Mail, History, Users, Share2, Trash2, FastForward,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { SignatureRequest } from '@/types';
import { Button, Card } from '@/components/shared/ui';
import { Modal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';
import { SignatureRequestStatusBadge, SignerStatusBadge } from '@/components/documents/document-badges';
import { DocPages } from './pdf-pages';
import { ReadOnlyFields, downloadSignedPdf, downloadOriginalPdf, isOnFile, requestPdfs } from './fields';
import { DemoEmailCard } from './demo-email-card';

const OPEN = ['sent', 'viewed', 'partially_signed'];

/** Details of a request made from an uploaded or sample PDF */
export function PdfRequestDetail({ request }: { request: SignatureRequest }) {
  const { sendSignatureReminder, cancelSignatureRequest, trashSignatureRequests, simulateTimePassing } = useApp();
  const currentUser = useCurrentUser();
  const router = useRouter();
  const docs = requestPdfs(request);
  const isSender = request.senderId === currentUser?.id;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isOpen = OPEN.includes(request.status);
  const signers = [...request.signers].sort((a, b) => a.order - b.order);
  const signedCount = signers.filter(s => s.status === 'signed').length;
  const myTurn = signers.find(s => s.email.toLowerCase() === currentUser?.email.toLowerCase() && (s.status === 'pending' || s.status === 'viewed'));
  const colorOf = (id: string) => request.signers.find(s => s.id === id)?.color;
  const emails = [...(request.emails || [])].reverse();
  const events = [...(request.events || [])].reverse();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <Link href="/signatures/all" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> All requests
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink flex items-center gap-2"><FileText className="w-5 h-5 text-flash-deep" /> {request.title}</h1>
            <SignatureRequestStatusBadge status={request.status} />
          </div>
          <p className="text-xs text-muted">
            {request.selfSign ? 'Signed by yourself' : `Sent by ${request.senderName || 'the sender'}`} · {new Date(request.createdAt).toLocaleString()}
            {' '}· {docs.length > 1 ? `${docs.length} documents, ` : ''}{docs.reduce((n, d) => n + d.pageCount, 0)} page{docs.reduce((n, d) => n + d.pageCount, 0) === 1 ? '' : 's'} · expires {request.expiresAt}
          </p>
          <p className="text-xs font-semibold text-ink">{signedCount} of {signers.length} signed</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {myTurn && (
            <Link href={`/signatures/sign/${request.id}`}><Button variant="primary" icon={PenTool}>Sign now</Button></Link>
          )}
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
          <Button icon={FileDown} onClick={() => void downloadOriginalPdf(request)}>Original</Button>
          {isOpen && !request.selfSign && (
            <Button
              icon={BellRing}
              onClick={() => {
                sendSignatureReminder(request.id);
                notify('Reminder emailed to everyone who still needs to sign (see Outbox)');
              }}
            >
              Remind
            </Button>
          )}
          {isOpen && isSender && (
            <Button variant="outline" icon={Ban} onClick={() => setConfirmCancel(true)}>Cancel</Button>
          )}
          {isSender && (
            <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>Delete</Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <Card className="p-3 bg-mist/30 space-y-6">
          {docs.map((doc, i) => (
            <DocPages
              key={doc.fileId}
              doc={doc}
              heading={docs.length > 1 ? <p className="text-xs font-bold text-ink">Document {i + 1} of {docs.length}: {doc.name}</p> : undefined}
              renderOverlay={page => (
                <ReadOnlyFields
                  fields={request.fields.filter(f => f.pageNumber === page && isOnFile(f, doc.fileId, docs[0]?.fileId))}
                  colorOf={id => colorOf(id) ?? '#999'}
                />
              )}
            />
          ))}
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><Users className="w-4 h-4" /> Signers</h2>
            <p className="text-[11px] text-muted">
              {request.signingOrder === 'sequential' ? 'Signing in order.' : 'Signing at the same time.'}
            </p>
            {signers.map(s => (
              <div key={s.id} className="flex items-start gap-2 text-xs">
                <span className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color ?? '#999' }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink truncate">{request.signingOrder === 'sequential' ? `${s.order}. ` : ''}{s.name}</p>
                  <p className="text-[11px] text-muted truncate">{s.email}</p>
                  {s.signedAt && <p className="text-[10px] text-muted">Signed {new Date(s.signedAt).toLocaleString()}</p>}
                  {s.declineReason && <p className="text-[10px] text-danger">Declined: “{s.declineReason}”</p>}
                  {isOpen && (s.status === 'pending' || s.status === 'viewed') && !request.selfSign && (
                    <Link href={`/signatures/sign/${request.id}?as=${s.id}`} className="text-[11px] font-semibold text-flash-deep hover:underline">
                      Open their signing link (demo)
                    </Link>
                  )}
                </div>
                <SignerStatusBadge status={s.status} />
              </div>
            ))}
            {request.ccRecipients && request.ccRecipients.length > 0 && (
              <div className="pt-2 border-t border-line space-y-1">
                <p className="text-[11px] font-bold text-ink flex items-center gap-1"><Share2 className="w-3 h-3" /> Receives a copy</p>
                {request.ccRecipients.map(c => (
                  <p key={c.id} className="text-[11px] text-ink">{c.name} <span className="text-muted">{c.email}</span></p>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><Mail className="w-4 h-4" /> Emails sent (demo)</h2>
              <Link href="/signatures/outbox" className="text-[11px] font-semibold text-flash-deep hover:underline">Outbox</Link>
            </div>
            {emails.length === 0
              ? <p className="text-xs text-muted">{request.selfSign ? 'You get an email with the signed copy when you finish.' : 'No emails yet.'}</p>
              : emails.map(e => <DemoEmailCard key={e.id} email={e} request={request} />)}
          </Card>

          {isOpen && !request.selfSign && (
            <Card className="p-4 space-y-2 border-dashed">
              <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><FastForward className="w-4 h-4" /> Demo: move time forward</h2>
              <p className="text-[11px] text-muted">
                Reminders: {request.reminderFrequency && request.reminderFrequency !== 'never' ? request.reminderFrequency.replace(/_/g, ' ') : 'off'} · expires {request.expiresAt}.
                Skip ahead to see automatic reminders and expiry happen.
              </p>
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 30].map(days => (
                  <Button
                    key={days}
                    size="xs"
                    onClick={() => {
                      simulateTimePassing(request.id, days);
                      notify(`${days} day${days === 1 ? '' : 's'} later…`);
                    }}
                  >
                    +{days} day{days === 1 ? '' : 's'}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4 space-y-2">
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5"><History className="w-4 h-4" /> Activity</h2>
            {events.map(ev => (
              <div key={ev.id} className="text-[11px] border-l-2 border-line pl-2">
                <p className="font-semibold text-ink">{ev.eventName || ev.name}</p>
                <p className="text-muted">{ev.description}</p>
                <p className="text-[10px] text-muted">{new Date(ev.timestamp).toLocaleString()} · {ev.actorName}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} size="sm">
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-ink">Move to Trash?</h2>
          <p className="text-xs text-muted">You can restore it from the Trash, or delete it for ever there.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button
              variant="danger"
              onClick={() => {
                trashSignatureRequests([request.id]);
                notify('Moved to Trash');
                router.push('/signatures/trash');
              }}
            >
              Move to Trash
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmCancel} onClose={() => setConfirmCancel(false)} size="sm">
        <div className="p-5 space-y-3">
          <h2 className="text-base font-bold text-ink">Cancel this request?</h2>
          <p className="text-xs text-muted">No one will be able to sign it any more. People who have not signed yet are emailed.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep it</Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelSignatureRequest(request.id);
                setConfirmCancel(false);
                notify('Request cancelled');
              }}
            >
              Cancel request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
