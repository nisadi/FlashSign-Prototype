'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  UploadCloud,
  ScrollText,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Star,
  ArrowRight,
  Eye,
  Filter,
  Search,
  Folder,
  Send,
  Building2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';
import { UploadDemoDialog } from '@/components/documents/upload-demo-dialog';
import { TemplatePreviewDialog } from '@/components/documents/template-preview-dialog';
import { DocumentTemplate } from '@/types/documents';

export default function DocumentsHomePage() {
  const {
    documentItems,
    documentTemplates,
    signatureRequests,
    contracts,
    users,
    currentUserId,
    toggleFavoriteDocument
  } = useApp();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // Compute metrics
  const stats = useMemo(() => {
    const total = documentItems.length;
    const drafts = documentItems.filter(d => d.status === 'draft').length;
    const shared = documentItems.filter(d => d.isShared || (d.sharedWithUserIds && d.sharedWithUserIds.length > 0)).length;
    const pending = documentItems.filter(d => d.status === 'pending').length;
    const completed = documentItems.filter(d => d.status === 'signed' || d.status === 'approved').length;
    return { total, drafts, shared, pending, completed };
  }, [documentItems]);

  // Documents awaiting action (pending signature or in review)
  const awaitingAction = useMemo(() => {
    return documentItems
      .filter(d => d.status === 'pending' || d.status === 'in_review')
      .slice(0, 4);
  }, [documentItems]);

  // Recently updated documents
  const recentDocuments = useMemo(() => {
    return [...documentItems]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [documentItems]);

  // Recently signed
  const recentlySigned = useMemo(() => {
    return documentItems
      .filter(d => d.status === 'signed')
      .slice(0, 4);
  }, [documentItems]);

  // Pinned/Favorites
  const pinnedDocs = useMemo(() => {
    return documentItems.filter(d => d.isFavorite).slice(0, 4);
  }, [documentItems]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <span>Flash Sign</span>
              <span>/</span>
              <span className="text-ink font-semibold">Documents & Contracts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <FileText className="w-7 h-7 text-flash-deep" />
              Documents Workspace
            </h1>
            <p className="text-sm text-muted mt-1">
              Prepare agreements, organize contract repositories, and dispatch verified electronic signatures.
            </p>
          </div>

          {/* Quick Actions */}
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
              New Document
            </Link>
            <Link
              href="/signatures/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-ink-soft transition-colors shadow-xs"
            >
              <FileSignature className="w-4 h-4 text-flash" />
              Request Signature
            </Link>
          </div>
        </div>

        {/* Demo Disclaimer */}
        <DemoNoticeBanner />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <Link
            href="/documents/all"
            className="p-4 rounded-xl border border-line/70 bg-white hover:border-flash hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-muted block">Total Documents</span>
            <div className="text-2xl font-bold text-ink mt-1">{stats.total}</div>
            <p className="text-[11px] text-muted mt-0.5">In organization library</p>
          </Link>

          <Link
            href="/documents/all?status=draft"
            className="p-4 rounded-xl border border-line/70 bg-white hover:border-flash hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-muted block">Drafts</span>
            <div className="text-2xl font-bold text-ink mt-1">{stats.drafts}</div>
            <p className="text-[11px] text-muted mt-0.5">Being authored</p>
          </Link>

          <Link
            href="/documents/shared"
            className="p-4 rounded-xl border border-line/70 bg-white hover:border-flash hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-indigo-700 block">Shared with Me</span>
            <div className="text-2xl font-bold text-indigo-900 mt-1">{stats.shared}</div>
            <p className="text-[11px] text-indigo-600 mt-0.5">Cross-team reviews</p>
          </Link>

          <Link
            href="/signatures/waiting"
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-amber-800 block">Pending Signatures</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Awaiting signer action</p>
          </Link>

          <Link
            href="/documents/all?status=signed"
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:shadow-xs transition-all text-left"
          >
            <span className="text-xs font-semibold text-emerald-800 block">Completed</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Fully executed</p>
          </Link>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2 Cols: Recent Documents & Awaiting Action */}
          <div className="lg:col-span-2 space-y-6">
            {/* Awaiting Action Banner */}
            {awaitingAction.length > 0 && (
              <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-ink">Documents Awaiting Action</h2>
                  </div>
                  <Link href="/signatures/waiting" className="text-xs font-semibold text-flash-deep hover:underline">
                    View Signatures
                  </Link>
                </div>

                <div className="divide-y divide-line/60">
                  {awaitingAction.map(doc => (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-bold text-ink hover:text-flash-deep truncate block"
                        >
                          {doc.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                          <DocumentTypeBadge type={doc.type} />
                          <span>•</span>
                          <span>{doc.pages || 1} pages</span>
                          <span>•</span>
                          <span>{doc.fileSize || '1 MB'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <DocumentStatusBadge status={doc.status} />
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-paper border border-line text-ink hover:bg-mist/30 transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Documents Table / List */}
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Recently Modified Documents</h2>
                  <p className="text-xs text-muted">Latest drafts, agreements, and contract revisions</p>
                </div>
                <Link
                  href="/documents/all"
                  className="text-xs font-semibold text-flash-deep hover:underline flex items-center gap-1"
                >
                  All Documents <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-line/60">
                {recentDocuments.map(doc => {
                  const owner = users.find(u => u.id === doc.ownerId);
                  return (
                    <div
                      key={doc.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-paper/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleFavoriteDocument(doc.id)}
                          className={`p-1 rounded hover:bg-paper ${
                            doc.isFavorite ? 'text-amber-500' : 'text-muted/40 hover:text-amber-500'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-bold text-ink hover:text-flash-deep truncate block text-xs"
                          >
                            {doc.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                            <DocumentTypeBadge type={doc.type} />
                            <span>•</span>
                            <span>By {owner?.name || 'Legal Team'}</span>
                            <span>•</span>
                            <span>Modified {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <DocumentStatusBadge status={doc.status} />
                        <Link
                          href={`/documents/${doc.id}`}
                          className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-paper"
                          title="Open Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pinned / Favorites */}
            {pinnedDocs.length > 0 && (
              <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Starred & Key Agreements
                  </h3>
                  <Link href="/documents/favorites" className="text-xs text-flash-deep hover:underline font-semibold">
                    View All
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pinnedDocs.map(doc => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="p-3 rounded-xl border border-line/70 bg-paper/30 hover:border-flash hover:bg-white transition-all space-y-1 block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <DocumentTypeBadge type={doc.type} />
                        <DocumentStatusBadge status={doc.status} />
                      </div>
                      <div className="font-bold text-ink truncate text-xs pt-1">{doc.title}</div>
                      <p className="text-[11px] text-muted line-clamp-1">{doc.description || 'Key agreement record'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Templates, Quick Nav & Signature Stats */}
          <div className="space-y-6">
            {/* Template Library Shortcut */}
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-purple-600" />
                    Document Templates
                  </h3>
                  <p className="text-[11px] text-muted">Pre-approved enterprise forms</p>
                </div>
                <Link
                  href="/documents/templates"
                  className="text-xs text-flash-deep font-semibold hover:underline"
                >
                  All Templates
                </Link>
              </div>

              <div className="space-y-2">
                {documentTemplates.slice(0, 4).map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className="w-full p-2.5 rounded-xl border border-line/60 bg-paper/40 hover:bg-paper text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-xs text-ink truncate group-hover:text-flash-deep">
                        {tpl.title}
                      </div>
                      <div className="text-[10px] text-muted uppercase tracking-wider capitalize">
                        {tpl.category.replace('_', ' ')} • {tpl.placeholders.length} variables
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-flash-deep shrink-0" />
                  </button>
                ))}
              </div>

              <Link
                href="/documents/templates"
                className="w-full py-2 text-center rounded-lg border border-line text-xs font-semibold text-ink hover:bg-paper transition-colors block"
              >
                Browse All 8 Templates
              </Link>
            </div>

            {/* Contracts Management Shortcut Card */}
            <div className="bg-ink text-white rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
                <Building2 className="w-32 h-32 text-flash" />
              </div>
              <span className="text-[10px] font-bold text-flash uppercase tracking-widest block">
                Contract Intelligence
              </span>
              <h3 className="text-base font-bold text-white">Active Contracts & Renewals</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Track counterparty obligations, approaching expiry gates, and bilateral e-sign milestones.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Link
                  href="/contracts"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-flash text-ink hover:bg-flash-deep hover:text-white transition-colors"
                >
                  Open Contracts
                </Link>
                <Link
                  href="/contracts/expiring"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Expiring ({contracts.filter(c => c.status === 'expiring').length})
                </Link>
              </div>
            </div>

            {/* Quick Links Nav */}
            <div className="bg-white border border-line/70 rounded-2xl p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-2">Folders & Repositories</h4>
              <div className="space-y-1">
                <Link
                  href="/documents/folders"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink hover:bg-paper"
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500" /> All Folders
                  </span>
                  <span className="text-muted text-[11px]">6 folders</span>
                </Link>
                <Link
                  href="/signatures/sent"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink hover:bg-paper"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-500" /> Sent Signatures
                  </span>
                  <span className="text-muted text-[11px]">{signatureRequests.length} requests</span>
                </Link>
                <Link
                  href="/signatures/completed"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink hover:bg-paper"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed Signatures
                  </span>
                  <span className="text-muted text-[11px]">
                    {signatureRequests.filter(s => s.status === 'completed').length}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <UploadDemoDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
        />

        {/* Template Preview Dialog */}
        <TemplatePreviewDialog
          template={selectedTemplate}
          open={Boolean(selectedTemplate)}
          onOpenChange={open => !open && setSelectedTemplate(null)}
        />
      </div>
    </div>
  );
}
