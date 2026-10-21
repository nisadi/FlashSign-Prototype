'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  PenTool,
  ArrowRight,
  UserCheck,
  Eye,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import {
  SignatureRequestStatusBadge,
  SignerStatusBadge
} from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SignaturesDashboardPage() {
  const { signatureRequests } = useApp();
  const currentUser = useCurrentUser();

  // Metrics
  const stats = useMemo(() => {
    const awaitingMySignature = signatureRequests.filter(s =>
      s.status !== 'completed' &&
      s.status !== 'declined' &&
      s.status !== 'expired' &&
      s.status !== 'cancelled' &&
      s.signers.some(signer =>
        (signer.email === currentUser?.email || signer.name.toLowerCase().includes('alex')) &&
        (signer.status === 'pending' || signer.status === 'waiting' || signer.status === 'viewed')
      )
    ).length;

    const sentByMe = signatureRequests.filter(s => s.senderId === currentUser?.id || (s.senderName || '').includes('Alex')).length;
    const inProgress = signatureRequests.filter(s => s.status === 'sent' || s.status === 'viewed' || s.status === 'partially_signed').length;
    const completed = signatureRequests.filter(s => s.status === 'completed').length;
    const declined = signatureRequests.filter(s => s.status === 'declined').length;
    const expired = signatureRequests.filter(s => s.status === 'expired').length;

    return {
      awaitingMySignature,
      sentByMe,
      inProgress,
      completed,
      declined,
      expired
    };
  }, [signatureRequests, currentUser]);

  // Awaiting Action
  const awaitingRequests = useMemo(() => {
    return signatureRequests.filter(s =>
      s.status !== 'completed' &&
      s.status !== 'declined' &&
      s.status !== 'cancelled' &&
      s.signers.some(signer =>
        (signer.email === currentUser?.email || signer.name.toLowerCase().includes('alex')) &&
        signer.status !== 'signed' && signer.status !== 'declined'
      )
    );
  }, [signatureRequests, currentUser]);

  // Recent Requests
  const recentRequests = useMemo(() => {
    return [...signatureRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [signatureRequests]);

  // Recently Completed
  const completedRequests = useMemo(() => {
    return signatureRequests
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .slice(0, 4);
  }, [signatureRequests]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Electronic Signatures</h1>
                <p className="text-sm text-muted">
                  Coordinate, sign, and monitor document execution packages in real time
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
              Request Signature
            </Link>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Waiting for Me', count: stats.awaitingMySignature, href: '/signatures/waiting', color: 'text-waiting', border: 'border-waiting/30', bg: 'bg-waiting/10', icon: PenTool },
            { label: 'Sent by Me', count: stats.sentByMe, href: '/signatures/sent', color: 'text-flash-deep', border: 'border-flash/30', bg: 'bg-flash/10', icon: Send },
            { label: 'In Progress', count: stats.inProgress, href: '/signatures/all', color: 'text-ink-soft', border: 'border-line', bg: 'bg-paper', icon: Clock },
            { label: 'Completed', count: stats.completed, href: '/signatures/completed', color: 'text-flash-deep', border: 'border-flash/30', bg: 'bg-flash/10', icon: CheckCircle2 },
            { label: 'Declined', count: stats.declined, href: '/signatures/declined', color: 'text-danger', border: 'border-danger/30', bg: 'bg-danger/10', icon: XCircle },
            { label: 'Expired', count: stats.expired, href: '/signatures/expired', color: 'text-muted', border: 'border-line', bg: 'bg-paper', icon: AlertTriangle }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={i}
                href={card.href}
                className="bg-paper-elevated border border-line hover:border-flash/50 rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">{card.label}</span>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${card.bg} ${card.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-2xl font-bold ${card.color}`}>{card.count}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Requests Awaiting My Action */}
        {awaitingRequests.length > 0 && (
          <div className="bg-waiting/10 border border-waiting/30 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-waiting" />
                <h3 className="font-bold text-ink text-base">Awaiting Your Demo Signature</h3>
              </div>
              <span className="text-xs font-bold text-waiting uppercase bg-paper-elevated px-2 py-0.5 rounded border border-waiting/20">
                Action Required
              </span>
            </div>

            <div className="divide-y divide-waiting/20 bg-paper-elevated rounded-lg border border-waiting/30 overflow-hidden">
              {awaitingRequests.map(req => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-ink text-sm">{req.title}</h4>
                    <p className="text-xs text-muted mt-0.5">
                      Sent by <strong className="text-ink-soft">{req.senderName}</strong> • {req.signers.length} signers total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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

        {/* Main Grid: Recent Requests & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Signature Packages */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-flash-deep" />
                Recent Signature Packages
              </h3>
              <Link
                href="/signatures/all"
                className="text-xs font-semibold text-flash-deep hover:underline flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden divide-y divide-line">
              {recentRequests.map(req => {
                const totalSigners = req.signers.length;
                const signedCount = req.signers.filter(s => s.status === 'signed').length;
                const progressPct = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

                return (
                  <div key={req.id} className="p-4 hover:bg-mist/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted bg-paper px-2 py-0.5 rounded border border-line">
                          {req.id}
                        </span>
                        <SignatureRequestStatusBadge status={req.status} />
                        <span className="text-xs text-muted">
                          {req.signingOrder === 'sequential' ? 'Sequential' : 'Parallel'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-ink text-sm truncate">{req.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>{signedCount} of {totalSigners} signed ({progressPct}%)</span>
                        <span>•</span>
                        <span>Sent {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/signatures/${req.id}`}
                        className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Status
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Recently Completed */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider text-muted">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/signatures/new"
                  className="w-full p-2.5 bg-paper hover:bg-mist/40 rounded-lg border border-line flex items-center gap-2.5 text-xs font-semibold text-ink transition-colors"
                >
                  <Send className="w-4 h-4 text-flash" />
                  <span>Send Document for Signature</span>
                </Link>
                <Link
                  href="/signatures/waiting"
                  className="w-full p-2.5 bg-paper hover:bg-mist/40 rounded-lg border border-line flex items-center gap-2.5 text-xs font-semibold text-ink transition-colors"
                >
                  <PenTool className="w-4 h-4 text-waiting" />
                  <span>Sign Pending Documents</span>
                </Link>
                <Link
                  href="/signatures/completed"
                  className="w-full p-2.5 bg-paper hover:bg-mist/40 rounded-lg border border-line flex items-center gap-2.5 text-xs font-semibold text-ink transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-flash-deep" />
                  <span>Browse Completed Executions</span>
                </Link>
                <Link
                  href="/signatures/settings"
                  className="w-full p-2.5 bg-paper hover:bg-mist/40 rounded-lg border border-line flex items-center gap-2.5 text-xs font-semibold text-ink transition-colors"
                >
                  <Clock className="w-4 h-4 text-muted" />
                  <span>Signing Defaults & Reminders</span>
                </Link>
              </div>
            </div>

            {/* Recently Completed */}
            <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider text-muted">Recently Completed</h3>
              {completedRequests.length === 0 ? (
                <p className="text-xs text-muted">No completed requests yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {completedRequests.map(req => (
                    <div key={req.id} className="p-2.5 bg-paper rounded-lg border border-line text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink truncate">{req.title}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-flash shrink-0 ml-1" />
                      </div>
                      <div className="text-[11px] text-muted flex items-center justify-between">
                        <span>{req.signers.length} signers</span>
                        <span>{req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'Executed'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
