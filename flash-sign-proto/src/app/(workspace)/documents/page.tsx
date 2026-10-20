'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { PageHeader, Button, EmptyState, Card } from '@/components/shared/ui';
import { DocStatusBadge } from '@/components/shared/badges';
import { formatDate, formatRelative } from '@/lib/utils';
import type { Document } from '@/types';
import { canManageDocuments } from '@/lib/permissions';
import {
  Plus, Search, FileText, CheckCircle2, Clock, Users,
  Filter, MoreHorizontal, ArrowRight,
} from 'lucide-react';

export default function DocumentsPage() {
  const { documents, users, demoRole } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreate = canManageDocuments(demoRole);

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    signed: documents.filter(d => d.status === 'signed').length,
    draft: documents.filter(d => d.status === 'draft').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Documents"
        description="Manage agreements, contracts, and signature requests"
        actions={
          canCreate ? (
            <Link href="/documents/new">
              <Button variant="primary" icon={Plus}>New Document</Button>
            </Link>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'All Documents', count: stats.total, color: 'var(--muted)' },
          { label: 'Pending Signature', count: stats.pending, color: 'var(--waiting)' },
          { label: 'Signed', count: stats.signed, color: 'var(--flash)' },
          { label: 'Drafts', count: stats.draft, color: '#42a5f5' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-paper-elevated border border-line rounded-lg outline-none focus:border-flash"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-paper-elevated border border-line rounded-lg text-ink outline-none focus:border-flash"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="signed">Signed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Create your first document or adjust the filter."
          action={canCreate ? (
            <Link href="/documents/new">
              <Button variant="primary" icon={Plus}>Create Document</Button>
            </Link>
          ) : undefined}
        />
      ) : (
        <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-mist/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted hidden md:table-cell">Signers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted hidden lg:table-cell">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(doc => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: Document }) {
  const signedCount = doc.signers.filter(s => s.status === 'signed').length;
  const totalSigners = doc.signers.length;
  const typeLabels: Record<string, string> = {
    nda: 'NDA', contract: 'Contract', sow: 'SOW',
    proposal: 'Proposal', amendment: 'Amendment', other: 'Other',
  };

  return (
    <tr className="hover:bg-mist/30 transition-colors">
      <td className="px-5 py-3">
        <Link href={`/documents/${doc.id}`} className="hover:text-flash transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-muted" />
            </div>
            <div>
              <p className="font-medium text-ink">{doc.title}</p>
              <p className="text-[10px] text-muted">{doc.pages} pages</p>
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted bg-mist px-2 py-0.5 rounded">{typeLabels[doc.type]}</span>
      </td>
      <td className="px-4 py-3"><DocStatusBadge status={doc.status} /></td>
      <td className="px-4 py-3 hidden md:table-cell">
        {totalSigners > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Users className="w-3 h-3" />
            <span>{signedCount}/{totalSigners} signed</span>
          </div>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted">
        {doc.dueDate ? formatDate(doc.dueDate, { month: 'short', day: 'numeric' }) : '—'}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted">{formatRelative(doc.updatedAt)}</td>
      <td className="px-4 py-3">
        <Link href={`/documents/${doc.id}`} className="text-muted hover:text-flash transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}
