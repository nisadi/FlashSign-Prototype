'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Mail, Search, Send } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';
import { DemoEmailCard } from '@/components/pdf/demo-email-card';
import { Button, EmptyState } from '@/components/shared/ui';

/** Every email the demo would have sent, newest first. Signing links open from here. */
export default function OutboxPage() {
  // The demo mailbox shows every email, including those to people other than you
  const { allSignatureRequests: signatureRequests } = useApp();
  const [query, setQuery] = useState('');

  const emails = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signatureRequests
      .flatMap(request => (request.emails || []).map(email => ({ email, request })))
      .filter(({ email, request }) => !q || [email.toName, email.toEmail, email.subject, request.title].some(v => v.toLowerCase().includes(q)))
      .sort((a, b) => b.email.sentAt.localeCompare(a.email.sentAt));
  }, [signatureRequests, query]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2"><Mail className="w-5 h-5 text-flash-deep" /> Outbox</h1>
          <p className="text-sm text-muted">Emails Flash Sign would send. Open a signer&apos;s link here to sign as them.</p>
        </div>
        <Link href="/signatures/upload?mode=send"><Button variant="primary" icon={Send}>Get signatures</Button></Link>
      </div>
      <DemoNoticeBanner message="No email leaves this browser. Each email below is what the recipient would receive, including their personal signing link and the signed PDF." />
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by person, subject or document"
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-line bg-paper-elevated focus:outline-none focus:border-flash"
        />
      </div>
      {emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Upload a PDF and send it for signature: the signing emails will show up here."
        />
      ) : (
        <div className="space-y-2">
          {emails.map(({ email, request }) => (
            <DemoEmailCard key={email.id} email={email} request={request} showRequest />
          ))}
        </div>
      )}
    </div>
  );
}
