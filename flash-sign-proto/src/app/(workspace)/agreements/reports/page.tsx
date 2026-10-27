'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, Send, CheckCircle2, Timer, DollarSign, Activity, Hourglass } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { FEATURES } from '@/lib/features';
import { StatCard } from '@/components/shared/ui';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

const DAY_MS = 1000 * 60 * 60 * 24;

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach(item => counts.set(key(item), (counts.get(key(item)) ?? 0) + 1));
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export default function AgreementReportsPage() {
  const { signatureRequests, contracts, documentItems } = useApp();

  const kpis = useMemo(() => {
    const sent = signatureRequests.filter(s => s.status !== 'draft');
    const completed = sent.filter(s => s.status === 'completed');
    const durations = completed
      .filter(s => s.sentAt && s.completedAt)
      .map(s => (new Date(s.completedAt!).getTime() - new Date(s.sentAt!).getTime()) / DAY_MS);
    const activeValue = contracts
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.contractValue ?? c.value ?? 0), 0);

    return {
      sent: sent.length,
      inProgress: sent.filter(s => ['sent', 'viewed', 'partially_signed'].includes(s.status)).length,
      completionRate: sent.length ? Math.round((completed.length / sent.length) * 100) : 0,
      avgDays: durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '—',
      activeValue,
    };
  }, [signatureRequests, contracts]);

  const breakdowns = useMemo(() => [
    { title: 'Signature requests', href: '/signatures/all', rows: countBy(signatureRequests, s => s.status) },
    ...(FEATURES.contracts ? [{ title: 'Contracts', href: '/contracts/all', rows: countBy(contracts, c => c.status) }] : []),
    { title: 'Documents', href: '/documents/all', rows: countBy(documentItems, d => d.status) },
  ], [signatureRequests, contracts, documentItems]);

  const recentEvents = useMemo(() => {
    return signatureRequests
      .flatMap(request => (request.events ?? []).map(event => ({ event, request })))
      .sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime())
      .slice(0, 10);
  }, [signatureRequests]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Agreement Reports</h1>
            <p className="text-sm text-muted">
              Signing performance{FEATURES.contracts ? ', contract value,' : ''} and document status at a glance
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Requests sent" value={kpis.sent} icon={Send} iconColor="#00c2a8" />
          <StatCard label="Completion rate" value={`${kpis.completionRate}%`} icon={CheckCircle2} iconColor="#10b981" />
          <StatCard label="Avg. days to complete" value={kpis.avgDays} icon={Timer} iconColor="#f59e0b" />
          {FEATURES.contracts ? (
            <StatCard label="Active contract value" value={`$${kpis.activeValue.toLocaleString()}`} icon={DollarSign} iconColor="#3b82f6" />
          ) : (
            <StatCard label="Waiting on signers" value={kpis.inProgress} icon={Hourglass} iconColor="#3b82f6" />
          )}
        </div>

        {/* Status breakdowns */}
        <div className={`grid grid-cols-1 gap-4 ${FEATURES.contracts ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {breakdowns.map(({ title, href, rows }) => {
            const max = Math.max(1, ...rows.map(r => r.count));
            return (
              <div key={title} className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-ink">{title} by status</h2>
                  <Link href={href} className="text-xs font-semibold text-flash-deep hover:underline">View</Link>
                </div>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted py-4 text-center">No records yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {rows.map(row => (
                      <li key={row.status}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink-soft font-medium">{formatStatus(row.status)}</span>
                          <span className="text-ink font-semibold">{row.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                          <div className="h-full rounded-full bg-flash" style={{ width: `${(row.count / max) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent signing activity */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Activity className="w-4 h-4 text-flash-deep" />
            <h2 className="text-sm font-semibold text-ink">Recent signing activity</h2>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted p-8 text-center">No signing events recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentEvents.map(({ event, request }) => (
                <li key={`${request.id}-${event.id}`} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <strong className="font-semibold">{event.actorName}</strong>{' '}
                      <span className="text-ink-soft">{event.description}</span>
                    </p>
                    <Link href={`/signatures/${request.id}/audit`} className="text-xs text-muted hover:text-flash-deep truncate block">
                      {request.title}
                    </Link>
                  </div>
                  <span className="text-xs text-muted shrink-0">{new Date(event.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
