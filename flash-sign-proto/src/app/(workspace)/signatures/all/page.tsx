'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Send, PenTool, Trash2, X, ChevronLeft, ChevronRight, FileText, PenLine, CalendarDays, ShieldCheck } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { SignatureRequest } from '@/types';
import { SignatureRequestStatusBadge } from '@/components/documents/document-badges';
import { Button, EmptyState } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';
import { requestPdfs } from '@/components/pdf/fields';
import { cn } from '@/lib/utils';

/** The inbox's filters, as in Flash Sign's agreements list. All of them live in the URL. */
const SCOPES = [
  { id: 'all', label: 'All requests' },
  { id: 'sent', label: 'Sent by me' },
  { id: 'received', label: 'Sent to me' },
] as const;
const STATUSES = [
  { id: 'all', label: 'Any status' },
  { id: 'action', label: 'Need to sign or review' },
  { id: 'waiting', label: 'Waiting for others' },
  { id: 'completed', label: 'Completed' },
  { id: 'draft', label: 'Draft' },
  { id: 'closed', label: 'Declined / expired / cancelled' },
] as const;
const PAGE_SIZES = [25, 50, 100];
const SIX_MONTHS_MS = 183 * 86400000;
const OPEN = ['sent', 'viewed', 'partially_signed', 'awaiting_review'];

export default function AllSignaturesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading…</div>}>
      <Inbox />
    </Suspense>
  );
}

/** The latest thing that happened to a request */
const lastChange = (r: SignatureRequest) =>
  [r.completedAt, r.sentAt, r.createdAt, r.draft?.savedAt, ...(r.events ?? []).map(e => e.timestamp)]
    .filter((v): v is string => !!v)
    .sort()
    .pop() ?? r.createdAt;

function Inbox() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { signatureRequests, trashSignatureRequests } = useApp();
  const me = useCurrentUser();
  const myEmail = me?.email.toLowerCase() ?? '';

  const q = params.get('q') ?? '';
  const scope = params.get('scope') ?? 'all';
  const status = params.get('status') ?? 'all';
  const sender = params.get('sender') ?? '';
  const recentOnly = params.get('recent') !== '0';
  const size = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 25;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setParams = (updates: Record<string, string | null>, keepPage = false) => {
    // Start from the address bar, so quick changes in a row don't undo each other
    const next = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)));
    if (!keepPage) next.delete('page');
    // The native history API updates the address at once (Next keeps useSearchParams in step)
    window.history.replaceState(null, '', `${pathname}${next.toString() ? `?${next}` : ''}`);
  };

  // Search waits for a pause in typing (300 ms), like Flash Sign's
  const [search, setSearch] = useState(q);
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => setParams({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [selected, setSelected] = useState<string[]>([]);

  const isMineToSign = (r: SignatureRequest) =>
    OPEN.includes(r.status) && r.signers.some(s => s.email.toLowerCase() === myEmail && (s.status === 'pending' || s.status === 'viewed'));
  const isMineToReview = (r: SignatureRequest) =>
    r.status === 'awaiting_review' && !!r.reviewers?.some(rv => rv.email.toLowerCase() === myEmail && rv.status === 'pending');
  const isSentByMe = (r: SignatureRequest) => r.senderId === me?.id;
  const isSentToMe = (r: SignatureRequest) =>
    !isSentByMe(r) && (r.signers.some(s => s.email.toLowerCase() === myEmail)
      || !!r.reviewers?.some(rv => rv.email.toLowerCase() === myEmail)
      || !!r.ccRecipients?.some(c => c.email.toLowerCase() === myEmail));

  const senders = useMemo(
    () => [...new Set(signatureRequests.map(r => r.senderName).filter((n): n is string => !!n))].sort(),
    [signatureRequests]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    // Read once per filtering so the date window stays fixed while the list is shown
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return signatureRequests
      .filter(r => scope === 'all' || (scope === 'sent' ? isSentByMe(r) : isSentToMe(r)))
      .filter(r => {
        switch (status) {
          case 'action': return isMineToSign(r) || isMineToReview(r);
          case 'waiting': return OPEN.includes(r.status) && !isMineToSign(r) && !isMineToReview(r);
          case 'completed': return r.status === 'completed';
          case 'draft': return r.status === 'draft';
          case 'closed': return ['declined', 'expired', 'cancelled'].includes(r.status);
          default: return true;
        }
      })
      .filter(r => !sender || r.senderName === sender)
      .filter(r => !recentOnly || now - new Date(lastChange(r)).getTime() <= SIX_MONTHS_MS)
      .filter(r => !term || [
        r.title, r.senderName ?? '', ...requestPdfs(r).map(p => p.name),
        ...r.signers.flatMap(s => [s.name, s.email]), ...(r.reviewers ?? []).flatMap(rv => [rv.name, rv.email]),
        ...(r.ccRecipients ?? []).flatMap(c => [c.name, c.email]),
      ].some(v => v.toLowerCase().includes(term)))
      .sort((a, b) => lastChange(b).localeCompare(lastChange(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureRequests, q, scope, status, sender, recentOnly, myEmail, me?.id]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  // Only requests you sent from a PDF can be deleted (the samples belong to no one)
  const deletable = (r: SignatureRequest) => !!r.pdf && isSentByMe(r);
  const chosen = selected.filter(id => rows.some(r => r.id === id && deletable(r)));
  const selectableOnPage = rows.filter(deletable);
  const filtersOn = !!q || scope !== 'all' || status !== 'all' || !!sender || !recentOnly;

  const deleteRequests = (ids: string[]) => {
    if (!window.confirm(`Move ${ids.length} request${ids.length === 1 ? '' : 's'} to the Trash?`)) return;
    trashSignatureRequests(ids);
    setSelected([]);
    notify(`Moved ${ids.length} to the Trash`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">All requests</h1>
          <p className="text-sm text-muted">Everything you sent, and everything sent to you.</p>
        </div>
        <Link href="/signatures/upload?mode=send"><Button variant="primary" icon={Send}>Get signatures</Button></Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-line bg-paper-elevated p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, document, sender or recipient"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-line bg-paper focus:outline-none focus:border-flash"
            />
          </div>
          <select value={scope} onChange={e => setParams({ scope: e.target.value === 'all' ? null : e.target.value })}
            className="px-2 py-2 text-xs rounded-lg border border-line bg-paper" aria-label="Scope">
            {SCOPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={status} onChange={e => setParams({ status: e.target.value === 'all' ? null : e.target.value })}
            className="px-2 py-2 text-xs rounded-lg border border-line bg-paper" aria-label="Status">
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={sender} onChange={e => setParams({ sender: e.target.value || null })}
            className="px-2 py-2 text-xs rounded-lg border border-line bg-paper" aria-label="Sender">
            <option value="">Any sender</option>
            {senders.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {recentOnly ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-flash/15 text-flash-deep font-semibold">
              <CalendarDays className="w-3.5 h-3.5" /> Date: Last 6 months
              <button type="button" onClick={() => setParams({ recent: '0' })} aria-label="Show all dates" className="hover:text-ink"><X className="w-3.5 h-3.5" /></button>
            </span>
          ) : (
            <button type="button" onClick={() => setParams({ recent: null })} className="px-2 py-1 rounded-full border border-line text-muted hover:text-ink">
              + Date: Last 6 months
            </button>
          )}
          {filtersOn && (
            <button type="button" onClick={() => { setSearch(''); window.history.replaceState(null, '', pathname); }} className="font-semibold text-flash-deep hover:underline">
              Clear all
            </button>
          )}
          <span className="ml-auto text-muted">{filtered.length} request{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No requests here" description="Try another filter or search, or start a new request." />
      ) : (
        <div className="rounded-xl border border-line bg-paper-elevated overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-line bg-mist/30">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                disabled={selectableOnPage.length === 0}
                checked={selectableOnPage.length > 0 && chosen.length === selectableOnPage.length}
                onChange={e => setSelected(e.target.checked ? selectableOnPage.map(r => r.id) : [])}
              />
              Select all on this page
            </label>
            {chosen.length > 0 && (
              <Button size="xs" variant="danger" icon={Trash2} onClick={() => deleteRequests(chosen)}>Delete ({chosen.length})</Button>
            )}
          </div>

          <ul className="divide-y divide-line">
            {rows.map(r => {
              const signed = r.signers.filter(s => s.status === 'signed').length;
              const pct = r.signers.length ? Math.round((signed / r.signers.length) * 100) : 0;
              const toMe = !isSentByMe(r) && isSentToMe(r);
              const people = toMe ? `From: ${r.senderName || 'Unknown'}` : `To: ${r.signers.map(s => s.name).join(', ') || '—'}`;
              const changed = new Date(lastChange(r));
              return (
                <li key={r.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3 hover:bg-mist/20">
                  <input
                    type="checkbox"
                    disabled={!deletable(r)}
                    checked={chosen.includes(r.id)}
                    onChange={e => setSelected(s => (e.target.checked ? [...s, r.id] : s.filter(id => id !== r.id)))}
                    aria-label={`Select ${r.title}`}
                    className="disabled:opacity-30"
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={r.status === 'draft' && r.draft ? `/signatures/upload?draft=${r.id}` : `/signatures/${r.id}`}
                      className="text-sm font-semibold text-ink hover:underline truncate block">
                      {r.title}
                    </Link>
                    <p className="text-[11px] text-muted truncate">{people}{r.pdf ? '' : ' · sample'}</p>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                      <div className={cn('h-full', r.status === 'completed' ? 'bg-emerald-500' : 'bg-flash')} style={{ width: `${r.status === 'completed' ? 100 : pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">{signed} of {r.signers.length} signed</p>
                  </div>
                  <SignatureRequestStatusBadge status={r.status} />
                  <div className="w-28 text-right text-[11px] text-muted">
                    <p>{changed.toLocaleDateString()}</p>
                    <p>{changed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-1.5 w-[170px] justify-end">
                    {isMineToSign(r) && (
                      <Link href={`/signatures/sign/${r.id}`}><Button size="xs" variant="primary" icon={PenTool}>Sign</Button></Link>
                    )}
                    {isMineToReview(r) && (
                      <Link href={`/signatures/review/${r.id}`}><Button size="xs" variant="primary" icon={ShieldCheck}>Review</Button></Link>
                    )}
                    {r.status === 'draft' && r.draft ? (
                      <Link href={`/signatures/upload?draft=${r.id}`}><Button size="xs" icon={PenLine}>Continue</Button></Link>
                    ) : (
                      <Link href={`/signatures/${r.id}`}><Button size="xs">Open</Button></Link>
                    )}
                    {deletable(r) && (
                      <button type="button" onClick={() => deleteRequests([r.id])} className="p-1 text-muted hover:text-danger" aria-label={`Delete ${r.title}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Paging: 25 / 50 / 100 per page */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-line text-xs text-muted">
            <label className="flex items-center gap-1.5">
              Rows per page
              <select value={size} onChange={e => setParams({ size: e.target.value === '25' ? null : e.target.value })}
                className="px-1.5 py-1 rounded-md border border-line bg-paper">
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span>Page {current} of {pages} ({filtered.length} items)</span>
              <button type="button" disabled={current <= 1} onClick={() => setParams({ page: String(current - 1) }, true)}
                className="p-1 rounded border border-line disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" disabled={current >= pages} onClick={() => setParams({ page: String(current + 1) }, true)}
                className="p-1 rounded border border-line disabled:opacity-30" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
