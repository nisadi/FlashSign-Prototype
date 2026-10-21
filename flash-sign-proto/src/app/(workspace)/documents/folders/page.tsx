'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Folder,
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  ChevronRight,
  FolderOpen,
  ArrowRight,
  Eye,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';

export default function FoldersManagementPage() {
  const {
    documentFolders,
    documentItems,
    addFolder,
    updateFolder,
    deleteFolder,
    users
  } = useApp();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(documentFolders[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedFolder = documentFolders.find(f => f.id === selectedFolderId);

  // Documents inside selected folder
  const folderDocs = useMemo(() => {
    if (!selectedFolderId) return [];
    return documentItems.filter(d => d.folderId === selectedFolderId);
  }, [documentItems, selectedFolderId]);

  const filteredFolderDocs = useMemo(() => {
    if (!searchQuery.trim()) return folderDocs;
    const q = searchQuery.toLowerCase();
    return folderDocs.filter(d => d.title.toLowerCase().includes(q));
  }, [folderDocs, searchQuery]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    addFolder({ name: newFolderName.trim() });
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleStartEdit = (f: { id: string; name: string }) => {
    setEditingFolderId(f.id);
    setEditName(f.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateFolder(id, editName.trim());
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (id: string, docCount: number) => {
    setError(null);
    if (docCount > 0) {
      setError('Cannot delete a folder containing active documents. Please move or reassign the documents first.');
      return;
    }
    if (confirm('Delete this empty folder?')) {
      deleteFolder(id);
      if (selectedFolderId === id) {
        setSelectedFolderId(documentFolders[0]?.id || null);
      }
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Folders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Folder className="w-7 h-7 text-amber-500" />
              Folder Management
            </h1>
            <p className="text-sm text-muted mt-1">
              Group documents by department, confidentiality tier, and business engagement.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Folder
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Folder List */}
          <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Repository Folders</h2>
              <span className="text-xs text-muted">{documentFolders.length} folders</span>
            </div>

            {/* Create Folder inline */}
            {isCreating && (
              <form onSubmit={handleCreateFolder} className="p-2.5 bg-paper rounded-xl border border-line space-y-2">
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-0.5 text-xs text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-flash text-ink"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5">
              {documentFolders.map(folder => {
                const count = documentItems.filter(d => d.folderId === folder.id).length;
                const isSelected = selectedFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-flash/10 border-flash text-ink font-semibold'
                        : 'border-line/60 bg-paper/30 hover:bg-paper text-ink-soft'
                    }`}
                  >
                    {editingFolderId === folder.id ? (
                      <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="px-2 py-0.5 text-xs bg-white border border-line rounded flex-1"
                        />
                        <button onClick={() => handleSaveEdit(folder.id)} className="p-1 text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingFolderId(null)} className="p-1 text-muted">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-flash-deep' : 'text-amber-500'}`} />
                          <span className="truncate text-xs font-bold">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-paper border border-line text-muted">
                            {count}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleStartEdit(folder);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id, count);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-muted hover:text-rose-600 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Folder Contents Detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {selectedFolder ? selectedFolder.name : 'Select a Folder'}
                    </h3>
                    <p className="text-xs text-muted">
                      {folderDocs.length} {folderDocs.length === 1 ? 'document' : 'documents'} filed in this directory
                    </p>
                  </div>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search folder contents..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-flash"
                  />
                </div>
              </div>

              {/* Folder Documents Table */}
              <div className="divide-y divide-line/60">
                {filteredFolderDocs.length === 0 ? (
                  <div className="py-12 text-center text-muted text-xs">
                    No documents currently filed in this folder.
                  </div>
                ) : (
                  filteredFolderDocs.map(doc => {
                    const owner = users.find(u => u.id === doc.ownerId);
                    return (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-paper/40 px-2 rounded-lg transition-colors text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                          >
                            {doc.title}
                          </Link>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            <DocumentTypeBadge type={doc.type} />
                            <span>•</span>
                            <span>{doc.pages || 1} pages</span>
                            <span>•</span>
                            <span>{doc.fileSize || '1 MB'}</span>
                            <span>•</span>
                            <span>By {owner?.name || 'Legal'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <DocumentStatusBadge status={doc.status} />
                          <Link
                            href={`/documents/${doc.id}`}
                            className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-paper"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
