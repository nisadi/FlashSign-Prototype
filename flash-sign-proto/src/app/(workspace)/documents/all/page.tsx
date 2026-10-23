'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  UploadCloud,
  LayoutGrid,
  List,
  Star,
  MoreHorizontal,
  Folder,
  Trash2,
  Copy,
  Archive,
  ArrowUpDown,
  CheckSquare,
  Square,
  Eye,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';
import { UploadDemoDialog } from '@/components/documents/upload-demo-dialog';
import { MoveFolderDialog } from '@/components/documents/move-folder-dialog';
import { DocumentItem, DocumentType, DocumentStatus } from '@/types/documents';

export default function AllDocumentsPage() {
  const {
    documentItems,
    documentFolders,
    projects,
    users,
    toggleFavoriteDocument,
    deleteDocumentItem,
    duplicateDocument,
    archiveDocumentItem
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [movingDocId, setMovingDocId] = useState<string | null>(null);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documentItems
      .filter(doc => {
        if (selectedType !== 'all' && doc.type !== selectedType) return false;
        if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;
        if (selectedFolder !== 'all') {
          if (selectedFolder === 'unfiled' && doc.folderId) return false;
          if (selectedFolder !== 'unfiled' && doc.folderId !== selectedFolder) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = doc.title.toLowerCase().includes(q);
          const matchesDesc = (doc.description || '').toLowerCase().includes(q);
          const owner = users.find(u => u.id === doc.ownerId);
          const matchesOwner = owner?.name.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesDesc && !matchesOwner) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'type') return a.type.localeCompare(b.type);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [documentItems, selectedType, selectedStatus, selectedFolder, searchQuery, sortBy, users]);

  const toggleSelect = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map(d => d.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedDocIds.length} selected documents?`)) {
      selectedDocIds.forEach(id => deleteDocumentItem(id));
      setSelectedDocIds([]);
    }
  };

  const handleBulkArchive = () => {
    selectedDocIds.forEach(id => archiveDocumentItem(id));
    setSelectedDocIds([]);
  };

  const movingDoc = documentItems.find(d => d.id === movingDocId);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumbs & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Library</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <FileText className="w-7 h-7 text-flash-deep" />
              All Documents
            </h1>
            <p className="text-sm text-muted mt-1">
              Browse, search, organize into folders, and manage agreements, drafts, and signed documents.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-muted" />
              Upload Demo File
            </button>
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Document
            </Link>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents by title, owner, description..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* View Mode & Sort */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none"
                >
                  <option value="date">Sort: Recent Modified</option>
                  <option value="name">Sort: Title (A-Z)</option>
                  <option value="type">Sort: Type</option>
                </select>
              </div>

              <div className="flex items-center border border-line rounded-lg bg-paper p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40 text-xs">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            >
              <option value="all">All Statuses ({documentItems.length})</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Signature</option>
              <option value="signed">Signed</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="docx">Word DOCX</option>
              <option value="agreement">Agreements</option>
              <option value="msa">Master Services Agreements</option>
              <option value="sow">Statements of Work</option>
              <option value="nda">NDAs</option>
              <option value="spec">Specs</option>
            </select>

            {/* Folder Filter */}
            <select
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            >
              <option value="all">All Folders</option>
              <option value="unfiled">Unfiled / Root</option>
              {documentFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {/* Bulk actions bar if items are selected */}
            {selectedDocIds.length > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-mist/50 px-3 py-1 rounded-lg border border-line">
                <span className="font-semibold text-ink">{selectedDocIds.length} selected</span>
                <button
                  onClick={handleBulkArchive}
                  className="text-xs text-ink hover:text-flash-deep font-medium flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content: List View or Grid View */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white border border-line/70 rounded-2xl p-12 text-center text-muted shadow-xs">
            <FileText className="w-10 h-10 text-muted/50 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-ink">No documents match criteria</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Try clearing filters or search keywords, or create a new document in the library.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedFolder('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-paper border border-line text-ink hover:bg-mist/30"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Table View */
          <div className="bg-white border border-line/70 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <button onClick={selectAll} className="text-muted hover:text-ink">
                        {selectedDocIds.length === filteredDocs.length ? (
                          <CheckSquare className="w-4 h-4 text-flash-deep" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3 w-72">Document Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Folder</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3">Last Modified</th>
                    <th className="py-3 px-4 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-xs">
                  {filteredDocs.map(doc => {
                    const owner = users.find(u => u.id === doc.ownerId);
                    const folder = documentFolders.find(f => f.id === doc.folderId);
                    const isSelected = selectedDocIds.includes(doc.id);

                    return (
                      <tr
                        key={doc.id}
                        className={`hover:bg-paper/40 transition-colors ${isSelected ? 'bg-flash/5' : ''}`}
                      >
                        {/* Select checkbox & favorite */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSelect(doc.id)} className="text-muted hover:text-ink">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-flash-deep" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleFavoriteDocument(doc.id)}
                              className={`p-0.5 rounded ${
                                doc.isFavorite ? 'text-amber-500' : 'text-muted/30 hover:text-amber-500'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </td>

                        {/* Title & metadata */}
                        <td className="py-3 px-3">
                          <div className="min-w-0 pr-2">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                            >
                              {doc.title}
                            </Link>
                            <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                              <span>{doc.pages || 1} pages</span>
                              <span>•</span>
                              <span>{doc.fileSize || '1 MB'}</span>
                              {doc.relatedProjectId && (
                                <>
                                  <span>•</span>
                                  <span className="text-ink-soft font-medium">Linked Project</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3">
                          <DocumentTypeBadge type={doc.type} />
                        </td>

                        {/* Folder */}
                        <td className="py-3 px-3">
                          {folder ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted font-medium bg-paper px-2 py-0.5 rounded border border-line/60">
                              <Folder className="w-3 h-3 text-amber-500" />
                              {folder.name}
                            </span>
                          ) : (
                            <span className="text-muted/60 text-[11px] italic">Root</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <DocumentStatusBadge status={doc.status} />
                        </td>

                        {/* Owner */}
                        <td className="py-3 px-3 text-muted">
                          {owner?.name || 'Legal Admin'}
                        </td>

                        {/* Last Modified */}
                        <td className="py-3 px-3 text-muted font-mono text-[11px]">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                              title="Open Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => setMovingDocId(doc.id)}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                              title="Move to Folder"
                            >
                              <Folder className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateDocument(doc.id)}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                              title="Duplicate Document"
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
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const owner = users.find(u => u.id === doc.ownerId);
              const folder = documentFolders.find(f => f.id === doc.folderId);
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-line/70 hover:border-flash/80 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <DocumentTypeBadge type={doc.type} />
                        <DocumentStatusBadge status={doc.status} />
                      </div>
                      <button
                        onClick={() => toggleFavoriteDocument(doc.id)}
                        className={`p-1 rounded hover:bg-paper ${
                          doc.isFavorite ? 'text-amber-500' : 'text-muted/30 hover:text-amber-500'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-bold text-ink hover:text-flash-deep text-sm line-clamp-1 block"
                      >
                        {doc.title}
                      </Link>
                      <p className="text-xs text-muted line-clamp-2 mt-1">
                        {doc.description || 'Document ready for review and signing.'}
                      </p>
                    </div>
                  </div>

                  {/* Card bottom info */}
                  <div className="pt-3 border-t border-line/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted text-[11px]">
                      <span>{doc.pages || 1} pages • {doc.fileSize || '1 MB'}</span>
                      {folder && (
                        <span className="flex items-center gap-1 font-medium text-ink-soft">
                          <Folder className="w-3 h-3 text-amber-500" />
                          {folder.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted">
                        By {owner?.name || 'Legal'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setMovingDocId(doc.id)}
                          className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                          title="Move to Folder"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-paper border border-line text-ink hover:bg-mist/30"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Dialog */}
        <UploadDemoDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
        />

        {/* Move Folder Dialog */}
        <MoveFolderDialog
          documentId={movingDocId}
          documentTitle={movingDoc?.title}
          currentFolderId={movingDoc?.folderId}
          open={Boolean(movingDocId)}
          onOpenChange={open => !open && setMovingDocId(null)}
        />
      </div>
    </div>
  );
}
