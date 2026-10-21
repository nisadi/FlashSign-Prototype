'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  CheckCircle2,
  Eye,
  Download,
  Calendar,
  ShieldCheck,
  Plus,
  Building2
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function CompletedSignaturesPage() {
  const { signatureRequests } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const completedRequests = useMemo(() => {
    return signatureRequests.filter(s => s.status === 'completed');
  }, [signatureRequests]);

  const filteredRequests = useMemo(() => {
    return completedRequests.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.senderName || '').toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.signers.some(s => s.name.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
  }, [completedRequests, searchQuery]);

  const handleDownloadDemoSummary = (req: (typeof signatureRequests)[0]) => {
    const summary = `# Electronic Signature Execution Certificate (Simulated Demo)

PACKAGE IDENTIFIER: ${req.id}
PACKAGE TITLE: ${req.title}
DISPATCHED: ${req.createdAt}
COMPLETED: ${req.completedAt || req.createdAt}
SENDER: ${req.senderName}

SIGNING PARTICIPANTS:
${req.signers.map(s => `- ${s.name} (${s.email}) — STATUS: ${s.status.toUpperCase()} — DATE: ${s.signedAt || 'Recorded'}`).join('\n')}

LIFECYCLE AUDIT TRAIL:
${(req.events || []).map(e => `[${e.timestamp}] ${e.name}: ${e.description} (by ${e.actorName})`).join('\n')}

---
[PROTOTYPE DEMONSTRATION RECORD — NOT A LEGALLY BINDING INSTRUMENT]
`;
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${req.id}_execution_certificate_demo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Completed Signatures</h1>
                <p className="text-sm text-muted">
                  Fully executed digital signature packages with complete simulated audit histories
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signatures/new"
              className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Start New Request
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search executed signature packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredRequests.length} executed package{filteredRequests.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No completed signature packages yet</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Packages transition to Completed once all required participants finish signing.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {req.id}
                      </span>
                      <SignatureRequestStatusBadge status={req.status} />
                      <span className="text-xs text-flash-deep font-semibold bg-flash/10 px-2.5 py-0.5 rounded-full border border-flash/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        All {req.signers.length} Signatures Complete
                      </span>
                    </div>

                    <h3 className="font-bold text-ink text-base">
                      {req.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                      <span>Sender: <strong className="text-ink-soft">{req.senderName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        Completed: {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'Executed'}
                      </span>
                      <span>•</span>
                      <span>Signers: {req.signers.map(s => s.name).join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleDownloadDemoSummary(req)}
                      className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title="Download execution summary"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Summary
                    </button>

                    <Link
                      href={`/signatures/${req.id}/audit`}
                      className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-flash-deep" />
                      Audit Log
                    </Link>

                    <Link
                      href={`/signatures/${req.id}`}
                      className="px-3.5 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Package
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
