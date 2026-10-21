'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  Calendar,
  Clock,
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  Send,
  PenTool,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SignatureAuditTrailPage() {
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
          <p className="text-sm font-semibold text-ink">Signature request not found.</p>
          <Link href="/signatures/all" className="text-xs text-flash-deep underline mt-2 block">
            Return to all requests
          </Link>
        </div>
      </div>
    );
  }

  const events = request.events || [
    {
      id: 'ev-init',
      name: 'Request Initialized',
      description: 'Signature package staged in client prototype state',
      actorName: request.senderName,
      timestamp: request.createdAt,
      category: 'request'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAudit = () => {
    const text = `# SIMULATED AUDIT TRAIL — FLASH SIGN PROTOTYPE
REQUEST ID: ${request.id}
DOCUMENT: ${request.title}
GENERATED: ${new Date().toISOString()}

CHRONOLOGICAL EVENT LOG:
${events.map(e => `[${e.timestamp}] ${e.name} — ${e.description} (Actor: ${e.actorName || 'System'})`).join('\n')}

---
[NOTE: This simulated log is for prototype demonstration purposes only. Not legally binding or cryptographically verified.]
`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${request.id}_audit_trail_demo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/signatures/${request.id}`}
              className="p-2 bg-paper-elevated border border-line rounded-lg text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-flash-deep" />
                <h1 className="text-2xl font-bold text-ink">Simulated Audit Trail</h1>
              </div>
              <p className="text-sm text-muted">
                {request.title} • ID: {request.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-paper hover:bg-mist/50 border border-line text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Log
            </button>
            <button
              onClick={handleDownloadAudit}
              className="px-3.5 py-2 bg-flash hover:bg-flash-deep text-ink text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Audit File
            </button>
          </div>
        </div>

        {/* Audit Meta Card */}
        <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted block">Package ID</span>
            <strong className="text-ink font-mono">{request.id}</strong>
          </div>
          <div>
            <span className="text-muted block">Package Status</span>
            <strong className="text-ink capitalize">{request.status.replace('_', ' ')}</strong>
          </div>
          <div>
            <span className="text-muted block">Dispatched Date</span>
            <strong className="text-ink">{new Date(request.createdAt).toLocaleDateString()}</strong>
          </div>
          <div>
            <span className="text-muted block">Integrity Stamp</span>
            <span className="font-mono text-flash-deep font-semibold">SIMULATED #9182</span>
          </div>
        </div>

        {/* Chronological Timeline */}
        <div className="bg-paper-elevated border border-line rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-bold text-ink text-base">Chronological Event Timeline</h3>
            <span className="text-xs text-muted">{events.length} Events Recorded</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
            {events.map((ev, index) => {
              const formattedTime = new Date(ev.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const formattedDate = new Date(ev.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div key={ev.id || index} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-flash border-2 border-white shadow-sm" />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="font-bold text-ink text-sm">{ev.name}</span>
                      <span className="text-muted text-[11px] font-mono">
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="text-[11px] text-muted flex items-center gap-2 pt-0.5">
                      <span>Actor: <strong className="text-ink-soft">{ev.actorName || 'System Service'}</strong></span>
                      {ev.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{ev.category} event</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
