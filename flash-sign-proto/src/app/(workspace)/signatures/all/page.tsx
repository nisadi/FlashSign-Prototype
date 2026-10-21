'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Filter,
  Send,
  Eye,
  Clock,
  CheckCircle2,
  BellRing,
  XCircle,
  Copy,
  PenTool,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import {
  SignatureRequestStatusBadge,
  SignerStatusBadge
} from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';
import { SignatureRequestStatus } from '@/types/documents';

export default function AllSignaturesPage() {
  const {
    signatureRequests,
    sendSignatureReminder,
    cancelSignatureRequest,
    duplicateSignatureRequest
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return signatureRequests
      .filter(req => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            req.title.toLowerCase().includes(q) ||
            (req.senderName || '').toLowerCase().includes(q) ||
            req.id.toLowerCase().includes(q) ||
            req.signers.some(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [signatureRequests, statusFilter, searchQuery]);

  const handleSendReminder = (requestId: string) => {
    sendSignatureReminder(requestId);
    setReminderToast(`Simulated reminder dispatched to pending signers for ${requestId}`);
    setTimeout(() => setReminderToast(null), 3000);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {reminderToast && (
          <div className="p-3 bg-flash/20 border border-flash text-flash-deep font-semibold text-xs rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
            <span>{reminderToast}</span>
            <button onClick={() => setReminderToast(null)} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">All Signature Requests</h1>
                <p className="text-sm text-muted">
                  Registry of all electronic signature packages, signing workflows, and execution audit states
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
              New Signature Request
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, signer, sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by signature status"
              className="px-3 py-1.5 bg-paper border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-flash"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="partially_signed">Partially Signed</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span className="text-xs text-muted font-medium ml-2 shrink-0">
              {filteredRequests.length} package{filteredRequests.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Table of Requests */}
        {filteredRequests.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <FileCheck2 className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No signature requests found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new signature request.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredRequests.map((req) => {
                const totalSigners = req.signers.length;
                const signedCount = req.signers.filter(s => s.status === 'signed').length;
                const progressPct = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
                const isComplete = req.status === 'completed';
                const isDeclined = req.status === 'declined';
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
                        <span className="text-xs text-muted">
                          Order: <strong className="text-ink-soft capitalize">{req.signingOrder}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-xs text-muted">
                          Sender: <strong className="text-ink-soft">{req.senderName}</strong>
                        </span>
                      </div>

                      <h3 className="font-bold text-ink text-base">
                        <Link href={`/signatures/${req.id}`} className="hover:text-flash-deep transition-colors">
                          {req.title}
                        </Link>
                      </h3>

                      {/* Progress Bar & Signers row */}
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{signedCount} of {totalSigners} signers recorded</span>
                          <span className="font-semibold text-ink-soft">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-line/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isComplete ? 'bg-flash' : isDeclined ? 'bg-danger' : 'bg-flash-deep'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Signer Avatars / Status pills */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {req.signers.map(signer => (
                          <div
                            key={signer.id}
                            className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-paper border border-line"
                          >
                            <span className="font-medium text-ink-soft">{signer.name}</span>
                            <SignerStatusBadge status={signer.status} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
                      {isActionable && (
                        <button
                          onClick={() => handleSendReminder(req.id)}
                          className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          title="Simulate sending email reminder"
                        >
                          <BellRing className="w-3.5 h-3.5 text-flash-deep" />
                          Remind
                        </button>
                      )}

                      {isActionable && (
                        <Link
                          href={`/signatures/sign/${req.id}`}
                          className="px-3 py-1.5 bg-flash/20 hover:bg-flash/30 border border-flash/30 text-flash-deep text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Test demo signing experience"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          Test Sign
                        </Link>
                      )}

                      <button
                        onClick={() => duplicateSignatureRequest(req.id)}
                        className="p-1.5 bg-paper hover:bg-mist/50 border border-line text-muted hover:text-ink rounded-lg transition-colors"
                        title="Duplicate request"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {isActionable && (
                        <button
                          onClick={() => cancelSignatureRequest(req.id)}
                          className="p-1.5 bg-paper hover:bg-danger/10 border border-line text-muted hover:text-danger rounded-lg transition-colors"
                          title="Cancel request"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        href={`/signatures/${req.id}`}
                        className="px-3.5 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
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
