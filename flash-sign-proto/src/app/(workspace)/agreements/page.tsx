'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Send,
  PenLine,
  LayoutTemplate,
  FilePlus2,
  Building2,
  FileSignature,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import { cn } from '@/lib/utils';

const DAY_MS = 1000 * 60 * 60 * 24;

const START_ACTIONS = [
  { label: 'Get Signatures', shortLabel: 'Get Signatures', description: 'Send a document for others to sign', href: '/signatures/new', icon: Send },
  { label: 'Sign a Document', shortLabel: 'Sign Document', description: 'Sign a document yourself', href: '/signatures/new', icon: PenLine },
  { label: 'Use a Template', shortLabel: 'Use Template', description: 'Start from a saved template', href: '/documents/templates', icon: LayoutTemplate },
  { label: 'New Document', shortLabel: 'New Document', description: 'Write or upload a document', href: '/documents/new', icon: FilePlus2 },
  { label: 'New Contract', shortLabel: 'New Contract', description: 'Create a contract record', href: '/contracts/new', icon: Building2 },
];

interface DraftRow {
  id: string;
  kind: 'Signature request' | 'Document' | 'Contract';
  title: string;
  updatedAt: string;
  href: string;
}

export default function AgreementsHomePage() {
  const { signatureRequests, contracts, documentItems } = useApp();
  const currentUser = useCurrentUser();
  const [startOpen, setStartOpen] = useState(false);

  const firstName = currentUser?.name.split(' ')[0];

  // Requests where the current user still has to sign (same rule as /signatures/waiting)
  const tasks = useMemo(() => {
    return signatureRequests
      .filter(s => !['draft', 'completed', 'declined', 'cancelled', 'expired'].includes(s.status))
      .map(request => ({
        request,
        signer: request.signers.find(signer =>
          (signer.email === currentUser?.email || signer.name.toLowerCase().includes('alex')) &&
          signer.status !== 'signed' && signer.status !== 'declined'
        ),
      }))
      .filter(t => t.signer)
      .sort((a, b) => new Date(a.request.expiresAt).getTime() - new Date(b.request.expiresAt).getTime());
  }, [signatureRequests, currentUser]);

  const drafts = useMemo(() => {
    const rows: DraftRow[] = [
      ...signatureRequests.filter(s => s.status === 'draft').map(s => ({
        id: s.id, kind: 'Signature request' as const, title: s.title, updatedAt: s.createdAt, href: `/signatures/${s.id}/fields`,
      })),
      ...documentItems.filter(d => d.status === 'draft').map(d => ({
        id: d.id, kind: 'Document' as const, title: d.title, updatedAt: d.updatedAt, href: `/documents/${d.id}`,
      })),
      ...contracts.filter(c => c.status === 'draft').map(c => ({
        id: c.id, kind: 'Contract' as const, title: c.title, updatedAt: c.updatedAt, href: `/contracts/${c.id}`,
      })),
    ];
    return rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [signatureRequests, documentItems, contracts]);

  const activity = useMemo(() => {
    return signatureRequests
      .filter(s => s.status !== 'draft')
      .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())
      .slice(0, 6);
  }, [signatureRequests]);

  const overview = useMemo(() => {
    const now = new Date().getTime();
    const daysUntil = (date?: string) => (date ? (new Date(date).getTime() - now) / DAY_MS : Infinity);
    const inFlight = signatureRequests.filter(s => ['sent', 'viewed', 'partially_signed'].includes(s.status));

    return {
      signatures: [
        { label: 'Drafts', value: signatureRequests.filter(s => s.status === 'draft').length, href: '/signatures/drafts' },
        { label: 'Waiting for others', value: inFlight.length, href: '/signatures/all' },
        { label: 'Expiring soon', value: inFlight.filter(s => daysUntil(s.expiresAt) <= 7).length, href: '/signatures/all' },
        { label: 'Completed', value: signatureRequests.filter(s => s.status === 'completed').length, href: '/signatures/completed' },
      ],
      contracts: [
        { label: 'Awaiting signature', value: contracts.filter(c => c.status === 'awaiting_signature').length, href: '/contracts/awaiting' },
        {
          label: 'Expiring within 90 days',
          value: contracts.filter(c =>
            ['active', 'expiring', 'expired'].includes(c.status) && daysUntil(c.expiryDate) <= 90
          ).length,
          href: '/contracts/expiring',
        },
        { label: 'Active', value: contracts.filter(c => c.status === 'active').length, href: '/contracts/active' },
      ],
      documents: [
        { label: 'Awaiting action', value: documentItems.filter(d => d.status === 'pending' || d.status === 'in_review').length, href: '/documents/all' },
        { label: 'Drafts', value: documentItems.filter(d => d.status === 'draft').length, href: '/documents/mine' },
      ],
    };
  }, [signatureRequests, contracts, documentItems]);

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
            Send agreements, collect signatures, and keep every deal moving.
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-10">
          <HomeSection title="Tasks" count={tasks.length} href="/signatures/waiting">
            {tasks.length === 0 ? (
              <EmptyRow text="Nothing is waiting for your signature." />
            ) : (
              tasks.slice(0, 5).map(({ request, signer }) => {
                const myTurn = signer?.status === 'pending' || signer?.status === 'viewed';
                return (
                  <div key={request.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/signatures/${request.id}`} className="text-sm font-semibold text-ink hover:text-flash-deep truncate block">
                        {request.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        From {request.senderName || 'Unknown sender'} · Expires {new Date(request.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {myTurn ? (
                      <Link
                        href={`/signatures/sign/${request.id}`}
                        className="shrink-0 px-3.5 py-1.5 rounded-lg bg-flash text-ink text-xs font-semibold hover:bg-flash-deep hover:text-white transition-colors"
                      >
                        Sign
                      </Link>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-muted">Waiting for your turn</span>
                    )}
                  </div>
                );
              })
            )}
          </HomeSection>

          <HomeSection title="Drafts" count={drafts.length}>
            {drafts.length === 0 ? (
              <EmptyRow text="No drafts. Use Start to begin a new agreement." />
            ) : (
              drafts.slice(0, 6).map(draft => (
                <Link
                  key={`${draft.kind}-${draft.id}`}
                  href={draft.href}
                  className="py-3.5 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink group-hover:text-flash-deep truncate">{draft.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {draft.kind} · Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-flash-deep inline-flex items-center gap-1">
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))
            )}
          </HomeSection>

          <HomeSection title="Agreement Activity" href="/signatures/all">
            {activity.length === 0 ? (
              <EmptyRow text="Requests you send will show their progress here." />
            ) : (
              activity.map(request => {
                const signed = request.signers.filter(s => s.status === 'signed').length;
                const total = request.signers.length;
                return (
                  <Link key={request.id} href={`/signatures/${request.id}`} className="py-3.5 flex items-center gap-4 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink group-hover:text-flash-deep truncate">{request.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1.5 w-32 rounded-full bg-mist overflow-hidden">
                          <div className="h-full rounded-full bg-flash" style={{ width: `${total ? (signed / total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-muted">{signed} of {total} signed</span>
                      </div>
                    </div>
                    <SignatureRequestStatusBadge status={request.status} />
                  </Link>
                );
              })
            )}
          </HomeSection>
        </div>

        {/* Right column: overview */}
        <aside className="space-y-10">
          <OverviewList title="Overview" icon={FileSignature} rows={overview.signatures} />
          <OverviewList title="Contracts" icon={Building2} rows={overview.contracts} />
          <OverviewList title="Documents" icon={FileText} rows={overview.documents} />
        </aside>
      </div>
    </div>
  );
}

function HomeSection({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count?: number;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-ink-soft">
          {title}{count !== undefined && ` (${count})`}
        </h2>
        {href && (
          <Link href={href} className="text-xs font-semibold text-flash-deep hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-line border-b border-line">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

function OverviewList({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: React.ElementType;
  rows: { label: string; value: number; href: string }[];
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 pb-3 border-b border-line text-xs font-bold tracking-[0.2em] uppercase text-ink-soft">
        <Icon className="w-3.5 h-3.5 text-flash-deep" />
        {title}
      </h2>
      <div className="divide-y divide-line border-b border-line">
        {rows.map(row => (
          <Link key={row.label} href={row.href} className="flex items-center justify-between py-4 group">
            <span className="text-sm text-ink group-hover:text-flash-deep">{row.label}</span>
            <span className="text-2xl font-bold text-ink">{row.value}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
