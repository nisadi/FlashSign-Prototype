'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Clock,
  Star,
  Eye,
  Edit3,
  Copy,
  Download,
  Folder,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function RecentDocumentsPage() {
  const {
    documentItems,
    documentFolders,
    toggleFavoriteDocument,
    duplicateDocument
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const folderMap = useMemo(() => {
    return new Map(documentFolders.map(f => [f.id, f.name]));
  }, [documentFolders]);

  const recentDocuments = useMemo(() => {
    return [...documentItems]
      .filter(doc => {
        if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return doc.title.toLowerCase().includes(q) || (doc.description || '').toLowerCase().includes(q) || (doc.ownerName || '').toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documentItems, typeFilter, searchQuery]);

  const handleDownloadDemo = (doc: (typeof documentItems)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([doc.content || `# ${doc.title}\n\n${doc.description || ''}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_demo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Recent Documents</h1>
                <p className="text-sm text-muted">
                  Chronological record of recently created, modified, and viewed documents
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/documents/new"
              className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              New Document
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recent documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by document type"
              className="px-3 py-1.5 bg-paper border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-flash"
            >
              <option value="all">All Document Types</option>
              <option value="agreement">Agreements</option>
              <option value="sow">Statements of Work</option>
              <option value="nda">NDAs</option>
              <option value="proposal">Proposals</option>
              <option value="specification">Specifications</option>
              <option value="pdf">PDF Uploads</option>
            </select>
            <span className="text-xs text-muted font-medium ml-2 shrink-0">
              {recentDocuments.length} document{recentDocuments.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Timeline / Recent List */}
        {recentDocuments.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <Clock className="w-12 h-12 text-muted/50 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No recent documents found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search filters.' : 'Documents you create, edit, or view will show up here.'}
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {recentDocuments.map((doc) => {
                const folderName = doc.folderId ? folderMap.get(doc.folderId) : null;
                const formattedDate = new Date(doc.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-5 hover:bg-mist/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-mist/50 text-ink-soft flex items-center justify-center shrink-0 border border-line mt-0.5">
                        <FileText className="w-5 h-5 text-flash-deep" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-semibold text-ink hover:text-flash-deep transition-colors truncate text-base"
                          >
                            {doc.title}
                          </Link>
                          <DocumentTypeBadge type={doc.type} />
                          <DocumentStatusBadge status={doc.status} />
                        </div>
                        <p className="text-xs text-muted line-clamp-1 mt-1">
                          {doc.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted mt-2 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-ink-soft">
                            <Clock className="w-3.5 h-3.5 text-muted" />
                            Modified {formattedDate}
                          </span>
                          <span>•</span>
                          <span>Owner: <strong className="text-ink-soft">{doc.ownerName || 'Alex Morgan'}</strong></span>
                          {folderName && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Folder className="w-3 h-3" />
                                {folderName}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>v{doc.currentVersion || (doc.versions?.length || 1)}</span>
                          {doc.fileSize && (
                            <>
                              <span>•</span>
                              <span>{doc.fileSize}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => toggleFavoriteDocument(doc.id)}
                        className={`p-2 rounded-lg border border-line transition-colors ${
                          doc.isFavorite || doc.favorite
                            ? 'bg-amber-50 text-amber-500 border-amber-200'
                            : 'bg-paper text-muted hover:text-ink hover:bg-mist/50'
                        }`}
                        title={doc.isFavorite || doc.favorite ? 'Favorited' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${doc.isFavorite || doc.favorite ? 'fill-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => duplicateDocument(doc.id)}
                        className="p-2 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDownloadDemo(doc, e)}
                        className="p-2 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors"
                        title="Download demo copy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/documents/${doc.id}/edit`}
                        className="p-2 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors"
                        title="Edit Document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="px-3.5 py-2 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
