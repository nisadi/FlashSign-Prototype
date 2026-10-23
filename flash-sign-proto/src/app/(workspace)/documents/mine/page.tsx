'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Star,
  Eye,
  Trash2,
  Folder,
  Copy,
  Clock,
  CheckCircle2,
  Send,
  UserCheck
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';
import { DocumentStatus } from '@/types/documents';

export default function MyDocumentsPage() {
  const {
    documentItems,
    documentFolders,
    currentUserId,
    toggleFavoriteDocument,
    deleteDocumentItem,
    duplicateDocument
  } = useApp();
  const currentUser = useCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'in_review' | 'shared' | 'pending' | 'signed'>('all');

  const myDocuments = useMemo(() => {
    return documentItems.filter(d => d.ownerId === currentUserId);
  }, [documentItems, currentUserId]);

  const filteredDocs = useMemo(() => {
    return myDocuments.filter(doc => {
      if (activeFilter === 'draft' && doc.status !== 'draft') return false;
      if (activeFilter === 'in_review' && doc.status !== 'in_review') return false;
      if (activeFilter === 'shared' && !doc.isShared) return false;
      if (activeFilter === 'pending' && doc.status !== 'pending') return false;
      if (activeFilter === 'signed' && doc.status !== 'signed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return doc.title.toLowerCase().includes(q) || (doc.description || '').toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [myDocuments, activeFilter, searchQuery]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">My Documents</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-flash-deep" />
              My Documents ({myDocuments.length})
            </h1>
            <p className="text-sm text-muted mt-1">
              Documents authored by you as {currentUser?.name || 'Current User'}.
            </p>
          </div>

          <Link
            href="/documents/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Document
          </Link>
        </div>

        {/* Filter Pills & Search */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search within my documents..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All', count: myDocuments.length },
                { id: 'draft', label: 'Drafts', count: myDocuments.filter(d => d.status === 'draft').length },
                { id: 'in_review', label: 'In Review', count: myDocuments.filter(d => d.status === 'in_review').length },
                { id: 'pending', label: 'Awaiting Signature', count: myDocuments.filter(d => d.status === 'pending').length },
                { id: 'signed', label: 'Completed', count: myDocuments.filter(d => d.status === 'signed').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeFilter === tab.id
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-paper text-muted'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-line/70 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 w-72">Document Title</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Folder</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      No documents found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(doc => {
                    const folder = documentFolders.find(f => f.id === doc.folderId);
                    return (
                      <tr key={doc.id} className="hover:bg-paper/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
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
                                {doc.pages || 1} pages • {doc.fileSize || '1.2 MB'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <DocumentTypeBadge type={doc.type} />
                        </td>

                        <td className="py-3.5 px-3">
                          {folder ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-paper px-2 py-0.5 rounded border border-line/60">
                              <Folder className="w-3 h-3 text-amber-500" />
                              {folder.name}
                            </span>
                          ) : (
                            <span className="text-muted/60 italic text-[11px]">Unfiled</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <DocumentStatusBadge status={doc.status} />
                        </td>

                        <td className="py-3.5 px-3 text-muted font-mono text-[11px]">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-paper border border-line text-ink hover:bg-mist/30"
                            >
                              Open
                            </Link>
                            <button
                              onClick={() => duplicateDocument(doc.id)}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${doc.title}"?`)) {
                                  deleteDocumentItem(doc.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 rounded text-muted hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
