'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Search,
  BellRing,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import {
  SignatureRequestStatusBadge,
  SignerStatusBadge
} from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SentSignatureRequestsPage() {
  const {
    signatureRequests,
    sendSignatureReminder,
    cancelSignatureRequest
  } = useApp();
  const currentUser = useCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sentRequests = useMemo(() => {
    return signatureRequests.filter(s =>
      s.senderId === currentUser?.id ||
      (s.senderName || '').toLowerCase().includes('alex')
    );
  }, [signatureRequests, currentUser]);

  const filteredRequests = useMemo(() => {
    return sentRequests.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.signers.some(s => s.name.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sentRequests, searchQuery]);

  const handleReminder = (id: string) => {
    sendSignatureReminder(id);
    setToastMessage(`Simulated reminder dispatched to pending signers for ${id}`);
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Sent Requests</h1>
                <p className="text-sm text-muted">
                  Electronic signature packages dispatched by you for external or internal execution
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signatures/new"
              className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Send New Request
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sent signature packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredRequests.length} dispatched package{filteredRequests.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* List of Sent Requests */}
        {filteredRequests.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <Send className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No sent requests found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              You haven&apos;t dispatched any signature requests yet.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredRequests.map((req) => {
                const totalSigners = req.signers.length;
                const signedCount = req.signers.filter(s => s.status === 'signed').length;
                const progressPct = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
                const isActionable = req.status !== 'completed' && req.status !== 'declined' && req.status !== 'cancelled';

                return (
                  <div
                    key={req.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                          {req.id}
                        </span>
                        <SignatureRequestStatusBadge status={req.status} />
                        <span className="text-xs text-muted capitalize">
                          {req.signingOrder} Signing
                        </span>
                        <span>•</span>
                        <span className="text-xs text-muted">
                          Dispatched: {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-ink text-base">
                        <Link href={`/signatures/${req.id}`} className="hover:text-flash-deep transition-colors">
                          {req.title}
                        </Link>
                      </h3>

                      {/* Signers status pill list */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-muted font-medium">Recipients:</span>
                        {req.signers.map(s => (
                          <div key={s.id} className="inline-flex items-center gap-1.5 bg-paper px-2 py-0.5 rounded border border-line text-[11px]">
                            <span className="text-ink-soft">{s.name}</span>
                            <SignerStatusBadge status={s.status} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      {isActionable && (
                        <button
                          onClick={() => handleReminder(req.id)}
                          className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          title="Simulate email reminder"
                        >
                          <BellRing className="w-3.5 h-3.5 text-flash-deep" />
                          Remind
                        </button>
                      )}

                      <Link
                        href={`/signatures/${req.id}/audit`}
                        className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        title="Audit trail"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Audit
                      </Link>

                      <Link
                        href={`/signatures/${req.id}`}
                        className="px-3.5 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Progress
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
