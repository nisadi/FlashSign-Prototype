'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  FileCheck2,
  Eye,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SignatureCompletionPage() {
  const params = useParams();
  const requestId = params?.requestId as string;

  const { signatureRequests } = useApp();

  const request = useMemo(() => {
    return signatureRequests.find(r => r.id === requestId);
  }, [signatureRequests, requestId]);

  if (!request) {
    return (
      <div className="min-h-full bg-paper p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-ink">Request not found.</p>
          <Link href="/signatures/all" className="text-xs text-flash-deep underline mt-2 block">
            Return to all requests
          </Link>
        </div>
      </div>
    );
  }

  const isAllComplete = request.status === 'completed';
  const totalSigners = request.signers.length;
  const signedCount = request.signers.filter(s => s.status === 'signed').length;
  const nextSigner = request.signers.find(s => s.status === 'pending' || s.status === 'waiting');

  const nowFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Completion Card */}
        <div className="bg-paper-elevated border border-line rounded-2xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-flash/20 text-flash-deep flex items-center justify-center mx-auto border-2 border-flash">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-ink">
              {isAllComplete
                ? 'Demo Signing Workflow Completed'
                : 'Your Demo Signature is Recorded'}
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto">
              {isAllComplete
                ? 'All designated parties have executed this simulated package. The linked document has been marked as Signed.'
                : `Your signature was recorded at ${nowFormatted}. The remaining signatories will continue the execution flow.`}
            </p>
          </div>

          {/* Details Box */}
          <div className="bg-paper rounded-xl p-5 border border-line text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Package:</span>
              <strong className="text-ink">{request.title}</strong>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Package ID:</span>
              <span className="font-mono text-ink-soft">{request.id}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <span className="text-muted">Completion Status:</span>
              <strong className="text-flash-deep font-bold">
                {signedCount} of {totalSigners} Signers Executed
              </strong>
            </div>
            {nextSigner && (
              <div className="flex justify-between">
                <span className="text-muted">Next Signer in Sequence:</span>
                <span className="font-semibold text-ink-soft">{nextSigner.name} ({nextSigner.email})</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/signatures/${request.id}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper-elevated font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              View Signing Progress
            </Link>

            <Link
              href={`/signatures/${request.id}/audit`}
              className="w-full sm:w-auto px-5 py-2.5 bg-paper hover:bg-mist/50 border border-line text-ink font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-flash-deep" />
              Audit Trail
            </Link>

            <Link
              href="/signatures"
              className="w-full sm:w-auto px-5 py-2.5 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
