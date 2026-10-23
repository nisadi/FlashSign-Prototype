'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Search,
  FileText,
  Building2,
  Trash2,
  Eye,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';

export default function FavoritesPage() {
  const { documentItems, users, toggleFavoriteDocument } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const favoriteDocs = useMemo(() => {
    return documentItems.filter(d => d.isFavorite);
  }, [documentItems]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return favoriteDocs;
    const q = searchQuery.toLowerCase();
    return favoriteDocs.filter(d => d.title.toLowerCase().includes(q));
  }, [favoriteDocs, searchQuery]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Favorites</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
              Starred & Key Agreements ({favoriteDocs.length})
            </h1>
            <p className="text-sm text-muted mt-1">
              Quick access to customer MSAs and frequently referenced agreements.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search favorite agreements..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>
        </div>

        {/* Favorite Grid */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white border border-line/70 rounded-2xl p-12 text-center text-muted shadow-xs">
            <Star className="w-8 h-8 text-muted/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-ink">No favorite agreements yet</h3>
            <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
              Click the star icon on any document to pin it here for quick access.
            </p>
            <Link
              href="/documents/all"
              className="inline-block mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-flash text-ink hover:bg-flash-deep hover:text-white transition-colors"
            >
              Browse Library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const owner = users.find(u => u.id === doc.ownerId);
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-flash transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <DocumentTypeBadge type={doc.type} />
                      <button
                        onClick={() => toggleFavoriteDocument(doc.id)}
                        className="text-amber-500 hover:text-amber-600 p-1"
                        title="Remove from favorites"
                      >
                        <Star className="w-4 h-4 fill-amber-500" />
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
                        {doc.description || 'Pinned agreement in your workspace.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                    <DocumentStatusBadge status={doc.status} />
                    <Link
                      href={`/documents/${doc.id}`}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-paper border border-line text-ink hover:bg-mist/30 transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
