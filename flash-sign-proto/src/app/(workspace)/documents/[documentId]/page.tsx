'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Edit3,
  Copy,
  Folder,
  Download,
  FileSignature,
  Building2,
  Archive,
  Star,
  Clock,
  History,
  MessageSquare,
  Send,
  Eye,
  CheckCircle2,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { FEATURES } from '@/lib/features';
import { DocumentStatusBadge, DocumentTypeBadge } from '@/components/documents/document-badges';
import { MoveFolderDialog } from '@/components/documents/move-folder-dialog';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function DocumentDetailsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const router = useRouter();
  const { documentId } = use(params);
  const {
    documentItems,
    documentFolders,
    projects,
    users,
    contracts,
    toggleFavoriteDocument,
    duplicateDocument,
    archiveDocumentItem,
    deleteDocumentItem,
    addDocumentComment,
    updateDocumentItem,
  } = useApp();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'preview' | 'versions' | 'comments'>('preview');
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const doc = documentItems.find(d => d.id === documentId);
  if (!doc) return notFound();

  const owner = users.find(u => u.id === doc.ownerId);
  const folder = documentFolders.find(f => f.id === doc.folderId);
  const project = projects.find(p => p.id === doc.relatedProjectId);
  const contract = contracts.find(c => c.documentId === doc.id || c.id === doc.relatedContractId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadDemo = () => {
    const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.title.replace(/\s+/g, '_')}_demo.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Demo document downloaded as markdown file.');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addDocumentComment(doc.id, commentText.trim());
    setCommentText('');
    showToast('Comment recorded.');
  };

  const handleRestoreVersion = (content: string, verNum: number) => {
    if (confirm(`Restore content from Version ${verNum}?`)) {
      updateDocumentItem(doc.id, { content });
      showToast(`Restored content to Version ${verNum}.`);
      setActiveTab('preview');
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-flash" />
            {toastMessage}
          </div>
        )}

        {/* Back link & Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold truncate max-w-xs">{doc.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                {doc.title}
              </h1>
              <button
                onClick={() => toggleFavoriteDocument(doc.id)}
                className={`p-1 rounded hover:bg-paper ${
                  doc.isFavorite ? 'text-amber-500' : 'text-muted/40 hover:text-amber-500'
                }`}
                title={doc.isFavorite ? 'Starred' : 'Star document'}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/documents/${doc.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-muted" />
              Edit Content
            </Link>
            <Link
              href={`/signatures/new?documentId=${doc.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
            >
              <FileSignature className="w-4 h-4" />
              Request Signature
            </Link>
          </div>
        </div>

        {/* Document Quick Metadata & Toolbar Strip */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <DocumentTypeBadge type={doc.type} />
            <DocumentStatusBadge status={doc.status} />
            {folder && (
              <span className="flex items-center gap-1 text-muted font-medium bg-paper px-2 py-0.5 rounded border border-line/60">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                {folder.name}
              </span>
            )}
            <span className="text-muted">
              Owner: <strong className="text-ink font-semibold">{owner?.name || 'Legal Admin'}</strong>
            </span>
            <span className="text-muted">
              Modified: <strong className="text-ink font-semibold">{new Date(doc.updatedAt).toLocaleDateString()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsMoveOpen(true)}
              className="p-1.5 rounded-lg border border-line bg-paper hover:bg-white text-muted hover:text-ink text-xs flex items-center gap-1"
              title="Move Folder"
            >
              <Folder className="w-3.5 h-3.5" /> Move
            </button>
            <button
              onClick={() => {
                duplicateDocument(doc.id);
                showToast('Duplicated document record.');
              }}
              className="p-1.5 rounded-lg border border-line bg-paper hover:bg-white text-muted hover:text-ink text-xs flex items-center gap-1"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button
              onClick={handleDownloadDemo}
              className="p-1.5 rounded-lg border border-line bg-paper hover:bg-white text-muted hover:text-ink text-xs flex items-center gap-1"
              title="Download Demo Copy"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => {
                archiveDocumentItem(doc.id);
                showToast('Document marked as archived.');
              }}
              className="p-1.5 rounded-lg border border-line bg-paper hover:bg-white text-muted hover:text-ink text-xs flex items-center gap-1"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        </div>

        {/* Notice */}
        <DemoNoticeBanner />

        {/* Two Column Layout: Preview & Info Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Document Content Canvas (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-line pb-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Document Preview
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'versions' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Versions ({doc.versions.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'comments' ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Review Comments ({doc.comments?.length || 0})
              </button>
            </div>

            {/* Tab 1: Preview */}
            {activeTab === 'preview' && (
              <div className="bg-white border border-line/70 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
                <div className="border-b border-line/60 pb-4 flex items-center justify-between">
                  <div className="text-xs text-muted uppercase font-bold tracking-wider">
                    Flash Sign Document Viewer
                  </div>
                  <div className="text-xs text-muted">
                    Page 1 of {doc.pages || 1}
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-ink font-sans leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                  {doc.content}
                </div>
              </div>
            )}

            {/* Tab 2: Version History */}
            {activeTab === 'versions' && (
              <div className="bg-white border border-line/70 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-ink">Version History</h3>
                  <p className="text-xs text-muted">Simulated change revisions recorded for this agreement.</p>
                </div>

                <div className="space-y-3">
                  {doc.versions.map((ver, idx) => (
                    <div
                      key={ver.id}
                      className="p-4 rounded-xl border border-line bg-paper/40 space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-xs">Version {ver.versionNumber}.0</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">{ver.changeSummary}</p>
                        <span className="text-[11px] text-muted/80 block mt-1">
                          Authored by {ver.modifiedBy} on {ver.modifiedDate}
                        </span>
                      </div>

                      {idx > 0 && (
                        <button
                          onClick={() => handleRestoreVersion(ver.content, ver.versionNumber)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-paper border border-line text-ink hover:bg-white transition-colors"
                        >
                          Restore Version
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Comments */}
            {activeTab === 'comments' && (
              <div className="bg-white border border-line/70 rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-ink">Review Feedback & Notes</h3>
                  <p className="text-xs text-muted">Internal stakeholder annotations and legal notes.</p>
                </div>

                <div className="space-y-2.5">
                  {(doc.comments || []).length === 0 ? (
                    <p className="text-xs text-muted italic">No comments yet on this document.</p>
                  ) : (
                    (doc.comments || []).map(cm => (
                      <div key={cm.id} className="p-3 bg-paper rounded-xl border border-line text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-ink">
                          <span>{cm.authorName}</span>
                          <span className="text-[10px] text-muted">{new Date(cm.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-muted leading-relaxed">{cm.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add comment input */}
                <form onSubmit={handleAddComment} className="pt-3 border-t border-line flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a review comment or legal query..."
                    className="flex-1 px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Metadata Panel */}
          <div className="space-y-5">
            {/* Document Details Card */}
            <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Document Metadata</h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <span className="text-muted">Document Type</span>
                  <span className="font-semibold text-ink uppercase font-mono">{doc.type}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <span className="text-muted">File Size</span>
                  <span className="font-semibold text-ink font-mono">{doc.fileSize || '1.4 MB'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <span className="text-muted">Page Count</span>
                  <span className="font-semibold text-ink">{doc.pages || 1} pages</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <span className="text-muted">Created</span>
                  <span className="font-semibold text-ink">{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                  <span className="text-muted">Last Updated</span>
                  <span className="font-semibold text-ink">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
                {folder && (
                  <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                    <span className="text-muted">Folder</span>
                    <span className="font-semibold text-ink">{folder.name}</span>
                  </div>
                )}
                {project && (
                  <div className="flex items-center justify-between py-1.5 border-b border-line/50">
                    <span className="text-muted">Linked Project</span>
                    <Link href={`/projects/${project.id}`} className="font-semibold text-flash-deep hover:underline">
                      {project.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Related Contract Card */}
            {FEATURES.contracts && (contract ? (
              <div className="bg-white border border-line/70 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-flash-deep" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Associated Contract</h3>
                </div>
                <div className="p-3 bg-paper rounded-xl border border-line text-xs space-y-1.5">
                  <div className="font-bold text-ink">{contract.title}</div>
                  <div className="text-[11px] text-muted">Counterparty: {contract.counterparty}</div>
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="text-xs text-flash-deep font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    View Contract Record <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-mist/20 rounded-2xl border border-line text-xs space-y-2">
                <span className="font-bold text-ink block">Need a formal contract record?</span>
                <p className="text-muted text-[11px]">
                  Turn this document into an active contract with commercial terms and renewal dates.
                </p>
                <Link
                  href={`/contracts/new?docId=${doc.id}&title=${encodeURIComponent(doc.title)}`}
                  className="inline-block px-3 py-1.5 rounded-lg bg-ink text-white font-semibold text-xs hover:bg-ink-soft transition-colors"
                >
                  Create Contract Record
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Move Folder Dialog */}
        <MoveFolderDialog
          documentId={doc.id}
          documentTitle={doc.title}
          currentFolderId={doc.folderId}
          open={isMoveOpen}
          onOpenChange={setIsMoveOpen}
        />
      </div>
    </div>
  );
}
