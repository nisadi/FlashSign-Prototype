'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, PenTool, Paperclip, Bell, XCircle, Ban, Share2, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import type { DemoEmail, DemoEmailKind, SignatureRequest } from '@/types';
import { Button } from '@/components/shared/ui';
import { downloadSignedPdf } from './fields';
import { cn } from '@/lib/utils';

const KIND: Record<DemoEmailKind, { label: string; icon: React.ElementType; color: string }> = {
  invite: { label: 'Signing request', icon: PenTool, color: 'text-flash-deep bg-flash/10' },
  copy: { label: 'Shared copy', icon: Share2, color: 'text-indigo-700 bg-indigo-50' },
  review: { label: 'Review request', icon: ShieldCheck, color: 'text-violet-700 bg-violet-50' },
  reminder: { label: 'Reminder', icon: Bell, color: 'text-amber-700 bg-amber-50' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
  declined: { label: 'Declined', icon: XCircle, color: 'text-red-700 bg-red-50' },
  cancelled: { label: 'Cancelled', icon: Ban, color: 'text-slate-600 bg-slate-100' },
  expired: { label: 'Expired', icon: Clock, color: 'text-amber-800 bg-amber-50' },
};

/** One email the demo "sent", with the actions its links would give */
export function DemoEmailCard({ email, request, showRequest = false }: { email: DemoEmail; request: SignatureRequest; showRequest?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const kind = KIND[email.kind];
  const signer = email.signerId ? request.signers.find(s => s.id === email.signerId) : undefined;
  const linkWorks = !!signer && (signer.status === 'pending' || signer.status === 'viewed')
    && ['sent', 'viewed', 'partially_signed'].includes(request.status);
  const reviewer = email.reviewerId ? request.reviewers?.find(r => r.id === email.reviewerId) : undefined;
  const reviewLinkWorks = reviewer?.status === 'pending' && request.status === 'awaiting_review';

  return (
    <div className="p-3 rounded-lg border border-line bg-paper-elevated space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', kind.color)}>
          <kind.icon className="w-3 h-3" /> {kind.label}
        </span>
        <span className="text-[11px] text-muted">To <b className="text-ink">{email.toName}</b> &lt;{email.toEmail}&gt;</span>
        <span className="ml-auto text-[10px] text-muted">{new Date(email.sentAt).toLocaleString()}</span>
      </div>
      <p className="text-xs font-semibold text-ink flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted" /> {email.subject}</p>
      <p className="text-[11px] text-ink-soft whitespace-pre-line">{email.body}</p>
      <div className="flex flex-wrap items-center gap-2">
        {email.signerId && (
          linkWorks ? (
            <Link href={`/signatures/sign/${request.id}?as=${email.signerId}`}>
              <Button size="xs" variant="primary" icon={PenTool}>Open signing link</Button>
            </Link>
          ) : (
            <span className="text-[10px] text-muted italic">
              Link no longer active{signer?.status === 'signed' ? ' (already signed)' : ''}
            </span>
          )
        )}
        {email.reviewerId && (
          reviewLinkWorks ? (
            <Link href={`/signatures/review/${request.id}?as=${email.reviewerId}`}>
              <Button size="xs" variant="primary" icon={ShieldCheck}>Open review link</Button>
            </Link>
          ) : (
            <span className="text-[10px] text-muted italic">
              Link no longer active{reviewer && reviewer.status !== 'pending' && reviewer.status !== 'waiting' ? ` (already ${reviewer.status})` : ''}
            </span>
          )
        )}
        {email.withSignedPdf && (
          <Button
            size="xs"
            icon={Paperclip}
            loading={downloading}
            onClick={async () => {
              setDownloading(true);
              await downloadSignedPdf(request);
              setDownloading(false);
            }}
          >
            {request.title} - signed.pdf
          </Button>
        )}
        {showRequest && (
          <Link href={`/signatures/${request.id}`} className="text-[11px] font-semibold text-flash-deep hover:underline">
            View request
          </Link>
        )}
      </div>
    </div>
  );
}
