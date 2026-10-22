'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ScrollText,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  FileWarning,
  Activity,
  CheckCheck
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ContractsOverviewPage() {
  const { contracts, documentItems, signatureRequests, users } = useApp();

  const stats = useMemo(() => {
    const total = contracts.length;
    const drafts = contracts.filter(c => c.status === 'draft').length;
    const pendingReview = contracts.filter(c => c.status === 'pending_review').length;
    const awaitingSignature = contracts.filter(c => c.status === 'awaiting_signature').length;
    const active = contracts.filter(c => c.status === 'active').length;
    const expiring = contracts.filter(c => c.status === 'expiring').length;
    const completed = contracts.filter(c => c.status === 'completed').length;
    const totalValue = contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.contractValue || 0), 0);

    return { total, drafts, pendingReview, awaitingSignature, active, expiring, completed, totalValue };
  }, [contracts]);

  const recentContracts = useMemo(() => {
    return [...contracts]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [contracts]);

  const awaitingMyAction = useMemo(() => {
    return contracts
      .filter(c => c.status === 'pending_review' || c.status === 'awaiting_signature')
      .slice(0, 4);
  }, [contracts]);

  const expiringSoon = useMemo(() => {
    return contracts.filter(c => c.status === 'expiring').slice(0, 4);
  }, [contracts]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/agreements" className="hover:text-ink transition-colors">Agreements</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Contracts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-flash-deep" />
              Contract Management
            </h1>
            <p className="text-sm text-muted mt-1">
              Oversee Master Service Agreements, bilateral SOWs, approval gates, and client commercial obligations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Contract
            </Link>
            <Link
              href="/signatures/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-ink-soft transition-colors shadow-xs"
            >
              <FileSignature className="w-4 h-4 text-flash" />
              Request Signature
            </Link>
          </div>
        </div>

        {/* Demo Notice */}
        <DemoNoticeBanner message="Contracts in this module represent prototype lifecycle stages (Review, Signature, Active, Expiring). No legal obligation is created." />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <Link
            href="/contracts/all"
            className="p-4 rounded-xl border border-line/70 bg-white hover:border-flash hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-muted block">All Contracts</span>
            <div className="text-2xl font-bold text-ink mt-1">{stats.total}</div>
            <p className="text-[11px] text-muted mt-0.5">Commercial records</p>
          </Link>

          <Link
            href="/contracts/active"
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/25 hover:border-emerald-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-emerald-800 block">Active</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">${(stats.totalValue / 1000).toFixed(0)}k active value</p>
          </Link>

          <Link
            href="/contracts/review"
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/25 hover:border-sky-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-sky-800 block">Pending Review</span>
            <div className="text-2xl font-bold text-sky-700 mt-1">{stats.pendingReview}</div>
            <p className="text-[11px] text-sky-700 mt-0.5">Internal sign-off queue</p>
          </Link>

          <Link
            href="/contracts/awaiting"
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/25 hover:border-amber-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-amber-800 block">Awaiting Signature</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.awaitingSignature}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Dispatched to signers</p>
          </Link>

          <Link
            href="/contracts/expiring"
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/25 hover:border-rose-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-rose-800 block">Expiring Soon</span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{stats.expiring}</div>
            <p className="text-[11px] text-rose-700 mt-0.5">Within 30–60 days</p>
          </Link>

          <Link
            href="/contracts/completed"
            className="p-4 rounded-xl border border-line/70 bg-white hover:border-line hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-muted block">Completed / Past</span>
            <div className="text-2xl font-bold text-ink mt-1">{stats.completed}</div>
            <p className="text-[11px] text-muted mt-0.5">Closed & archived</p>
          </Link>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Required Banner */}
            {awaitingMyAction.length > 0 && (
              <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-ink">Contracts Awaiting Review or Signature</h2>
                  </div>
                  <Link href="/contracts/review" className="text-xs font-semibold text-flash-deep hover:underline">
                    View Queue
                  </Link>
                </div>

                <div className="divide-y divide-line/60">
                  {awaitingMyAction.map(contract => (
                    <div key={contract.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                        >
                          {contract.title}
                        </Link>
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span>Client: {contract.counterparty}</span>
                          <span>•</span>
                          <span>Value: ${contract.contractValue?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ContractStatusBadge status={contract.status} />
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-paper border border-line text-ink hover:bg-mist/30 transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Contracts Table */}
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Recent Contracts Activity</h2>
                  <p className="text-xs text-muted">Latest commercial agreements and terms</p>
                </div>
                <Link
                  href="/contracts/all"
                  className="text-xs font-semibold text-flash-deep hover:underline flex items-center gap-1"
                >
                  All Contracts <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-line/60">
                {recentContracts.map(c => {
                  const owner = users.find(u => u.id === c.ownerId);
                  return (
                    <div
                      key={c.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-paper/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                        >
                          {c.title}
                        </Link>
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-ink-soft">{c.counterparty}</span>
                          <span>•</span>
                          <span>Value: ${c.contractValue?.toLocaleString() || '0'}</span>
                          <span>•</span>
                          <span>Expires: {c.expiryDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <ContractStatusBadge status={c.status} />
                        <Link
                          href={`/contracts/${c.id}`}
                          className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-paper"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Expirations & Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Expirations */}
            <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-ink">Upcoming Expirations</h3>
                </div>
                <Link href="/contracts/expiring" className="text-xs font-semibold text-flash-deep hover:underline">
                  Manage
                </Link>
              </div>

              <div className="space-y-2.5">
                {expiringSoon.length === 0 ? (
                  <p className="text-xs text-muted italic">No contracts currently expiring within 60 days.</p>
                ) : (
                  expiringSoon.map(exp => (
                    <div key={exp.id} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-ink truncate">{exp.title}</div>
                      <div className="text-[11px] text-rose-800 flex items-center justify-between">
                        <span>Client: {exp.counterparty}</span>
                        <span className="font-mono font-semibold">Due {exp.expiryDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/contracts/expiring"
                className="w-full py-1.5 text-center text-xs font-semibold rounded-lg bg-paper border border-line text-ink hover:bg-mist/30 block"
              >
                Review Expiration Roadmap
              </Link>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Contract Tools</h3>
              <div className="space-y-1.5 text-xs">
                <Link
                  href="/contracts/new"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line/60 bg-paper/40 hover:bg-paper font-semibold text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-flash-deep" /> Create New Contract
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                </Link>
                <Link
                  href="/documents/templates"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line/60 bg-paper/40 hover:bg-paper font-semibold text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-purple-600" /> Start from Template
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                </Link>
                <Link
                  href="/signatures/new"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line/60 bg-paper/40 hover:bg-paper font-semibold text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-flash-deep" /> Prepare Signature Package
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
