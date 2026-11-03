'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { PdfReviewView } from '@/components/pdf/pdf-review-view';

/** A reviewer checks the signed PDF and approves or rejects it */
export default function ReviewPage() {
  const params = useParams();
  // A personal review link works for its reviewer, whoever is signed in (the page checks the link)
  const { allSignatureRequests, isHydrated } = useApp();
  const request = allSignatureRequests.find(r => r.id === params?.requestId && !r.deletedAt);
  if (!isHydrated) return <div className="p-8 text-center text-xs text-muted">Loading…</div>;
  if (!request?.pdf || !request.reviewers?.length) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-ink">There is nothing to review on this request.</p>
          <Link href="/signatures/all" className="text-xs text-flash-deep underline mt-2 block">Return to All Requests</Link>
        </div>
      </div>
    );
  }
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading…</div>}>
      <PdfReviewView request={request} />
    </React.Suspense>
  );
}
