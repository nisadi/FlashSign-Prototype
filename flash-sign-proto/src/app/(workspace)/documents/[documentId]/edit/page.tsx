'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentStatusBadge } from '@/components/documents/document-badges';
import { notify } from '@/components/shared/toaster';

export default function DocumentEditorPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const router = useRouter();
  const { documentId } = use(params);
  const { documentItems, updateDocumentItem } = useApp();

  const doc = documentItems.find(d => d.id === documentId);
  if (!doc) return notFound();

  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || '');
  const [content, setContent] = useState(doc.content);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleInsertText = (prefix: string, suffix: string = '') => {
    setContent(prev => prev + '\n' + prefix + ' ' + suffix);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify('Add a title for the document first.', 'error');
      return;
    }

    updateDocumentItem(doc.id, {
      title: title.trim(),
      description: description.trim(),
      content,
      pages: Math.max(1, Math.ceil(content.length / 800)),
    });

    notify(`Changes to "${title.trim()}" saved`);
    setIsSaved(true);
    setTimeout(() => {
      router.push(`/documents/${doc.id}`);
    }, 800);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/documents/${doc.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Document Preview
            </Link>
            <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-flash-deep" />
              Document Content Editor
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <DocumentStatusBadge status={doc.status} />
          </div>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Changes saved successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink font-bold focus:outline-none focus:ring-2 focus:ring-flash"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Summary / Scope
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>

          {/* Toolbar & Content Area */}
          <div className="space-y-2 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertText('## Section')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink text-xs font-bold"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('### Subsection')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink text-xs font-bold"
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('**Important Covenant**')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('*Confidential Notice*')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('- Obligation point')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('1. Step condition')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs font-semibold text-flash-deep hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Return to Code' : 'Formatted Preview'}
              </button>
            </div>

            {previewMode ? (
              <div className="p-6 bg-paper rounded-xl border border-line min-h-[360px] text-xs text-ink whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={16}
                className="w-full p-4 text-xs font-mono bg-paper border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-flash leading-relaxed"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Link
              href={`/documents/${doc.id}`}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
