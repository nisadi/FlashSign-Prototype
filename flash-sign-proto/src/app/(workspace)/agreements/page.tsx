'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Send,
  PenLine,
  LayoutTemplate,
  FilePlus2,
  ArrowRight,
  Clock,
  Eye,
  FileWarning,
  FilePen,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import type { SignatureRequest } from '@/types';
import { cn } from '@/lib/utils';

const DAY_MS = 1000 * 60 * 60 * 24;
const EXPIRING_SOON_DAYS = 7;

const START_ACTIONS = [
  { label: 'Get Signatures', shortLabel: 'Get Signatures', description: 'Send a document for others to sign', href: '/signatures/new', icon: Send },
  { label: 'Sign a Document', shortLabel: 'Sign Document', description: 'Sign a document yourself', href: '/signatures/new', icon: PenLine },
  { label: 'Use a Template', shortLabel: 'Use Template', description: 'Start from a saved template', href: '/documents/templates', icon: LayoutTemplate },
  { label: 'New Document', shortLabel: 'New Document', description: 'Write or upload a document', href: '/documents/new', icon: FilePlus2 },
];

const IN_FLIGHT = ['sent', 'viewed', 'partially_signed'];

interface DraftRow {
  id: string;
  kind: 'Signature request' | 'Document';
  title: string;
  updatedAt: string;
  href: string;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const signedCount = (request: SignatureRequest) => request.signers.filter(s => s.status === 'signed').length;

export default function AgreementsHomePage() {
  const { signatureRequests, documentItems, users } = useApp();
  const currentUser = useCurrentUser();
  const [startOpen, setStartOpen] = useState(false);

  const firstName = currentUser?.name.split(' ')[0];

  // Older seed requests carry only senderId
  const senderOf = (request: SignatureRequest) =>
    request.senderName || users.find(u => u.id === request.senderId)?.name || 'Unknown sender';

  const data = useMemo(() => {
    const now = new Date().getTime();
    const daysLeft = (date: string) => Math.ceil((new Date(date).getTime() - now) / DAY_MS);
    const byExpiry = (a: SignatureRequest, b: SignatureRequest) =>
      new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();

    const sent = signatureRequests.filter(s => s.status !== 'draft');
    const completed = sent.filter(s => s.status === 'completed');
    const inFlight = sent.filter(s => IN_FLIGHT.includes(s.status)).sort(byExpiry);

    // Requests where it is the current user's turn to sign (same rule as /signatures/waiting)
    const myTurn = new Set(
      inFlight
        .filter(r => r.signers.some(s => s.email === currentUser?.email && (s.status === 'pending' || s.status === 'viewed')))
        .map(r => r.id)
    );

    const signaturesTotal = inFlight.reduce((sum, r) => sum + r.signers.length, 0);
    const signaturesDone = inFlight.reduce((sum, r) => sum + signedCount(r), 0);

    return {
      daysLeft,
      myTurn,
      inFlight,
      stats: {
        sent: sent.length,
        drafts: signatureRequests.length - sent.length,
        completed: completed.length,
        completionRate: sent.length ? Math.round((completed.length / sent.length) * 100) : 0,
        inProgress: inFlight.length,
        signaturesDone,
        signaturesLeft: signaturesTotal - signaturesDone,
        needsMe: myTurn.size,
        expiringSoon: inFlight.filter(r => daysLeft(r.expiresAt) <= EXPIRING_SOON_DAYS).length,
        closedOut: sent.filter(s => ['declined', 'expired', 'cancelled'].includes(s.status)).length,
      },
      recent: [...sent]
        .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())
        .slice(0, 5),
    };
  }, [signatureRequests, currentUser]);

  const drafts = useMemo(() => {
    const rows: DraftRow[] = [
      ...signatureRequests.filter(s => s.status === 'draft').map(s => ({
        id: s.id, kind: 'Signature request' as const, title: s.title, updatedAt: s.createdAt, href: `/signatures/${s.id}/fields`,
      })),
      ...documentItems.filter(d => d.status === 'draft').map(d => ({
        id: d.id, kind: 'Document' as const, title: d.title, updatedAt: d.updatedAt, href: `/documents/${d.id}`,
      })),
    ];
    return rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [signatureRequests, documentItems]);

  const { stats, inFlight, myTurn, recent, daysLeft } = data;

  return (
    <div className="min-h-full bg-paper pb-16">
      {/* Hero */}
      <section className="hero-wash text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Agreements</h1>
          <p className="text-lg sm:text-xl text-white/90 mt-2">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </p>
          <p className="text-sm text-white/60 mt-2">
            Send documents for signature, track who has signed, and see what is still outstanding.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <div className="relative">
              <button
                type="button"
                onClick={() => setStartOpen(open => !open)}
                aria-expanded={startOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-flash text-ink font-semibold text-sm hover:bg-flash-deep hover:text-white transition-colors"
              >
                Start
                <ChevronDown className={cn('w-4 h-4 transition-transform', startOpen && 'rotate-180')} />
              </button>

              {startOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setStartOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 z-30 w-72 bg-paper-elevated text-ink rounded-xl border border-line shadow-2xl py-1.5"
                  >
                    {START_ACTIONS.map(action => (
                      <Link
                        key={action.label}
                        href={action.href}
                        role="menuitem"
                        onClick={() => setStartOpen(false)}
                        className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-mist/60 transition-colors"
                      >
                        <action.icon className="w-4 h-4 mt-0.5 text-flash-deep shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold">{action.label}</span>
                          <span className="block text-xs text-muted">{action.description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {START_ACTIONS.slice(0, 3).map(action => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                <action.icon className="w-4 h-4" />
                {action.shortLabel}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Summary metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <MetricCard
            href="/signatures/all"
            label="All Requests"
            value={stats.sent}
            note={`${stats.drafts} draft${stats.drafts === 1 ? '' : 's'} not sent yet`}
          />
          <MetricCard
            href="/signatures/completed"
            tone="emerald"
            label="Completed"
            value={stats.completed}
            note={`${stats.completionRate}% of sent requests`}
          />
          <MetricCard
            href="/signatures/all"
            tone="sky"
            label="In Progress"
            value={stats.inProgress}
            note={`${stats.signaturesDone} signed · ${stats.signaturesLeft} left`}
          />
          <MetricCard
            href="/signatures/waiting"
            tone="amber"
            label="Needs Your Signature"
            value={stats.needsMe}
            note="Waiting on you"
          />
          <MetricCard
            href="/signatures/all"
            tone="rose"
            label="Expiring Soon"
            value={stats.expiringSoon}
            note={`Within ${EXPIRING_SOON_DAYS} days`}
          />
          <MetricCard
            href="/signatures/declined"
            label="Declined / Expired"
            value={stats.closedOut}
            note="Need a new request"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Awaiting signature */}
            <Card>
              <CardHeader
                icon={<Clock className="w-4 h-4 text-amber-600" />}
                title="Awaiting Signature"
                href="/signatures/waiting"
                linkLabel="View Queue"
              />
              {inFlight.length === 0 ? (
                <EmptyRow text="Nothing is out for signature right now." />
              ) : (
                <div className="divide-y divide-line/60">
                  {inFlight.slice(0, 5).map(request => (
                    <div key={request.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <Link href={`/signatures/${request.id}`} className="font-bold text-ink hover:text-flash-deep truncate block">
                          {request.title}
                        </Link>
                        <div className="text-[11px] text-muted flex flex-wrap items-center gap-x-2 mt-0.5">
                          <span>From {senderOf(request)}</span>
                          <span>•</span>
                          <span>{signedCount(request)} of {request.signers.length} signed</span>
                          <span>•</span>
                          <span>Expires {formatDate(request.expiresAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SignatureRequestStatusBadge status={request.status} />
                        {myTurn.has(request.id) ? (
                          <Link
                            href={`/signatures/sign/${request.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-flash text-ink hover:bg-flash-deep hover:text-white transition-colors"
                          >
                            Sign
                          </Link>
                        ) : (
                          <Link
                            href={`/signatures/${request.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-paper border border-line text-ink hover:bg-mist/30 transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader
                title="Recent Activity"
                subtitle="Latest requests and how far each one has got"
                href="/signatures/all"
                linkLabel="All Requests"
              />
              {recent.length === 0 ? (
                <EmptyRow text="Requests you send will show their progress here." />
              ) : (
                <div className="divide-y divide-line/60">
                  {recent.map(request => {
                    const signed = signedCount(request);
                    const total = request.signers.length;
                    return (
                      <div
                        key={request.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-paper/40 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <Link href={`/signatures/${request.id}`} className="font-bold text-ink hover:text-flash-deep truncate block">
                            {request.title}
                          </Link>
                          <div className="text-[11px] text-muted flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span className="font-semibold text-ink-soft">{senderOf(request)}</span>
                            <span>•</span>
                            <span>Sent {formatDate(request.sentAt || request.createdAt)}</span>
                            {request.completedAt && (
                              <>
                                <span>•</span>
                                <span>Completed {formatDate(request.completedAt)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-1.5 w-32 rounded-full bg-mist overflow-hidden">
                              <div className="h-full rounded-full bg-flash" style={{ width: `${total ? (signed / total) * 100 : 0}%` }} />
                            </div>
                            <span className="text-[11px] text-muted">{signed} of {total} signed</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <SignatureRequestStatusBadge status={request.status} />
                          <Link
                            href={`/signatures/${request.id}`}
                            aria-label={`Open ${request.title}`}
                            className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-paper"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Upcoming expirations: the next in-flight requests to run out */}
            <Card className="border-rose-200/80">
              <CardHeader
                icon={<FileWarning className="w-4 h-4 text-rose-600" />}
                title="Upcoming Expirations"
                href="/signatures/all"
                linkLabel="Manage"
              />
              {inFlight.length === 0 ? (
                <p className="text-xs text-muted italic">No requests are waiting on signers.</p>
              ) : (
                <div className="space-y-2.5">
                  {inFlight.slice(0, 4).map(request => {
                    const days = daysLeft(request.expiresAt);
                    const urgent = days <= EXPIRING_SOON_DAYS;
                    return (
                      <Link
                        key={request.id}
                        href={`/signatures/${request.id}`}
                        className={cn(
                          'block p-3 border rounded-xl space-y-1 text-xs transition-colors',
                          urgent ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400' : 'bg-paper/40 border-line/60 hover:border-line'
                        )}
                      >
                        <div className="font-bold text-ink truncate">{request.title}</div>
                        <div className={cn('text-[11px] flex items-center justify-between gap-2', urgent ? 'text-rose-800' : 'text-muted')}>
                          <span>{signedCount(request)} of {request.signers.length} signed</span>
                          <span className="font-mono font-semibold">
                            {days <= 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Drafts */}
            <Card>
              <CardHeader
                icon={<FilePen className="w-4 h-4 text-flash-deep" />}
                title={`Drafts (${drafts.length})`}
                href="/signatures/drafts"
                linkLabel="View all"
              />
              {drafts.length === 0 ? (
                <p className="text-xs text-muted italic">No drafts. Use Start to begin a new request.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {drafts.slice(0, 5).map(draft => (
                    <Link
                      key={`${draft.kind}-${draft.id}`}
                      href={draft.href}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-line/60 bg-paper/40 hover:bg-paper transition-colors group"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink truncate group-hover:text-flash-deep">{draft.title}</span>
                        <span className="block text-[11px] text-muted">{draft.kind} · Updated {formatDate(draft.updatedAt)}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const METRIC_TONES = {
  neutral: { card: 'border-line/70 bg-white hover:border-flash', label: 'text-muted', value: 'text-ink', note: 'text-muted' },
  emerald: { card: 'border-emerald-200 bg-emerald-50/25 hover:border-emerald-400', label: 'text-emerald-800', value: 'text-emerald-700', note: 'text-emerald-700' },
  sky: { card: 'border-sky-200 bg-sky-50/25 hover:border-sky-400', label: 'text-sky-800', value: 'text-sky-700', note: 'text-sky-700' },
  amber: { card: 'border-amber-200 bg-amber-50/25 hover:border-amber-400', label: 'text-amber-800', value: 'text-amber-700', note: 'text-amber-700' },
  rose: { card: 'border-rose-200 bg-rose-50/25 hover:border-rose-400', label: 'text-rose-800', value: 'text-rose-700', note: 'text-rose-700' },
};

function MetricCard({
  href,
  label,
  value,
  note,
  tone = 'neutral',
}: {
  href: string;
  label: string;
  value: number;
  note: string;
  tone?: keyof typeof METRIC_TONES;
}) {
  const t = METRIC_TONES[tone];
  return (
    <Link href={href} className={cn('p-4 rounded-xl border hover:shadow-xs transition-all text-left', t.card)}>
      <span className={cn('text-xs font-semibold block', t.label)}>{label}</span>
      <div className={cn('text-2xl font-bold mt-1', t.value)}>{value}</div>
      <p className={cn('text-[11px] mt-0.5', t.note)}>{note}</p>
    </Link>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-3', className)}>
      {children}
    </section>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-bold text-ink">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <Link href={href} className="text-xs font-semibold text-flash-deep hover:underline inline-flex items-center gap-1 shrink-0">
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-muted">{text}</p>;
}
