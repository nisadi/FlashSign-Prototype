'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Share2,
  Copy,
  CheckCircle2,
  Star,
  Eye,
  FileText,
  Lock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';

export default function SharedWithMePage() {
  const { documentItems, users, currentUserId, toggleFavoriteDocument } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Documents shared with current user
  const sharedDocs = useMemo(() => {
    return documentItems.filter(
      d => d.isShared || (d.sharedWithUserIds && d.sharedWithUserIds.includes(currentUserId))
    );
  }, [documentItems, currentUserId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sharedDocs;
    const q = searchQuery.toLowerCase();
    return sharedDocs.filter(
      d => d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    );
  }, [sharedDocs, searchQuery]);

  const handleCopyLink = (docId: string) => {
    navigator.clipboard?.writeText(`https://app.flashsign.demo/documents/${docId}?access=shared`);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Shared with Me</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Users className="w-7 h-7 text-flash-deep" />
              Shared with Me ({sharedDocs.length})
            </h1>
            <p className="text-sm text-muted mt-1">
              Agreements, SOW drafts, and specs shared by team leads and external counterparties.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shared documents..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>

          <div className="text-xs text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-end encrypted simulated access</span>
          </div>
        </div>

        {/* List Table */}
        <div className="bg-white border border-line/70 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 w-72">Document</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Shared By</th>
                  <th className="py-3 px-3">Access Level</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      No documents currently shared with you.
                    </td>
                  </tr>
                ) : (
                  filtered.map(doc => {
                    const owner = users.find(u => u.id === doc.ownerId);
                    return (
                      <tr key={doc.id} className="hover:bg-paper/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleFavoriteDocument(doc.id)}
                              className={`p-1 rounded hover:bg-paper ${
                                doc.isFavorite ? 'text-amber-500' : 'text-muted/30 hover:text-amber-500'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <div className="min-w-0">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                              >
                                {doc.title}
                              </Link>
                              <div className="text-[11px] text-muted">
                                {doc.pages || 1} pages • {doc.fileSize || '1 MB'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <DocumentTypeBadge type={doc.type} />
                        </td>

                        <td className="py-3.5 px-3 text-muted">
                          {owner?.name || 'External Legal Lead'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-mist/60 text-ink-soft border border-line capitalize">
                            {doc.accessType || 'Editor'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <DocumentStatusBadge status={doc.status} />
                        </td>

                        <td className="py-3.5 px-3 text-muted font-mono text-[11px]">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyLink(doc.id)}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink transition-colors"
                              title="Copy Demo Share Link"
                            >
                              {copiedId === doc.id ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-flash-deep" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-paper border border-line text-ink hover:bg-mist/30"
                            >
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
