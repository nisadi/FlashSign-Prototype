'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  PenTool,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function WaitingForMySignaturePage() {
  const { signatureRequests, declineSignatureRequest } = useApp();
  const currentUser = useCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');

  const waitingRequests = useMemo(() => {
    return signatureRequests.filter(s =>
      s.status !== 'completed' &&
      s.status !== 'declined' &&
      s.status !== 'cancelled' &&
      s.status !== 'expired' &&
      s.signers.some(signer =>
        signer.email === currentUser?.email &&
        signer.status !== 'signed' && signer.status !== 'declined'
      )
    );
  }, [signatureRequests, currentUser]);

  const filteredRequests = useMemo(() => {
    return waitingRequests.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.senderName || '').toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [waitingRequests, searchQuery]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-waiting/15 text-waiting flex items-center justify-center border border-waiting/30">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Waiting for My Signature</h1>
                <p className="text-sm text-muted">
                  Documents requiring your digital signature or approval
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signatures/all"
              className="px-4 py-2 bg-paper-elevated border border-line hover:bg-mist/50 text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              All Requests
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search waiting signature packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredRequests.length} document{filteredRequests.length === 1 ? '' : 's'} awaiting action
          </div>
        </div>

        {/* List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-flash mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">You&apos;re All Caught Up!</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              There are currently no signature packages awaiting your action.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {req.id}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-waiting/15 text-waiting border border-waiting/30">
                        Action Required
                      </span>
                      <SignatureRequestStatusBadge status={req.status} />
                    </div>

                    <h3 className="font-bold text-ink text-base">
                      {req.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                      <span>Sender: <strong className="text-ink-soft">{req.senderName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        Received: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/signatures/${req.id}`}
                      className="px-3 py-2 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </Link>

                    <Link
                      href={`/signatures/sign/${req.id}`}
                      className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Sign Now (Demo)
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
