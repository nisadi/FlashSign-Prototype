'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Save,
  Eye,
  ScrollText,
  UploadCloud,
  CheckCircle2,
  Folder,
  Send,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentType } from '@/types/documents';

export default function NewDocumentPage() {
  const router = useRouter();
  const { addDocumentItem, documentFolders, documentTemplates, projects } = useApp();

  const [mode, setMode] = useState<'blank' | 'template' | 'upload'>('blank');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DocumentType>('agreement');
  const [folderId, setFolderId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [content, setContent] = useState('# New Agreement\n\n### 1. Purpose\nSpecify business objectives and scope...\n\n### 2. Obligations\nDetail reciprocal commitments and delivery requirements.');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = documentTemplates.find(t => t.id === tplId);
    if (tpl) {
      setTitle(tpl.title);
      setContent(tpl.content);
      setType(tpl.type);
    }
  };

  const handleInsertText = (prefix: string, suffix: string = '') => {
    setContent(prev => prev + '\n' + prefix + ' ' + suffix);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    const newId = addDocumentItem({
      title: title.trim(),
      description: description.trim(),
      type,
      folderId: folderId || null,
      relatedProjectId: projectId || undefined,
      content,
      status: 'draft',
      fileSize: '1.4 MB',
      pages: Math.max(1, Math.ceil(content.length / 800)),
    });

    router.push(`/documents/${newId}`);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Documents
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-flash-deep" />
            Create Document
          </h1>
          <p className="text-sm text-muted mt-1">
            Author agreements from scratch, customize approved legal templates, or register imported agreements.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === 'blank'
                ? 'bg-white border-flash ring-2 ring-flash/30 shadow-xs'
                : 'bg-paper hover:bg-white border-line/70 text-muted'
            }`}
          >
            <FileText className={`w-5 h-5 mb-1.5 ${mode === 'blank' ? 'text-flash-deep' : 'text-muted'}`} />
            <div className="text-xs font-bold text-ink">Blank Document</div>
            <p className="text-[11px] text-muted mt-0.5">Start with a clean editor surface</p>
          </button>

          <button
            type="button"
            onClick={() => setMode('template')}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === 'template'
                ? 'bg-white border-flash ring-2 ring-flash/30 shadow-xs'
                : 'bg-paper hover:bg-white border-line/70 text-muted'
            }`}
          >
            <ScrollText className={`w-5 h-5 mb-1.5 ${mode === 'template' ? 'text-purple-600' : 'text-muted'}`} />
            <div className="text-xs font-bold text-ink">From Template</div>
            <p className="text-[11px] text-muted mt-0.5">Use approved NDA or MSA forms</p>
          </button>

          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`p-4 rounded-xl border text-left transition-all ${
              mode === 'upload'
                ? 'bg-white border-flash ring-2 ring-flash/30 shadow-xs'
                : 'bg-paper hover:bg-white border-line/70 text-muted'
            }`}
          >
            <UploadCloud className={`w-5 h-5 mb-1.5 ${mode === 'upload' ? 'text-blue-600' : 'text-muted'}`} />
            <div className="text-xs font-bold text-ink">Demo File Record</div>
            <p className="text-[11px] text-muted mt-0.5">Register a simulated PDF or DOCX</p>
          </button>
        </div>

        {/* Template Picker if mode === 'template' */}
        {mode === 'template' && (
          <div className="p-4 bg-white border border-line/70 rounded-2xl space-y-3 shadow-xs">
            <span className="text-xs font-bold text-ink uppercase tracking-wider block">
              Choose Pre-approved Template
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
              {documentTemplates.map(tpl => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                    selectedTemplateId === tpl.id
                      ? 'bg-purple-50/60 border-purple-400 ring-1 ring-purple-300'
                      : 'border-line/60 hover:bg-paper'
                  }`}
                >
                  <div className="font-bold text-ink truncate">{tpl.title}</div>
                  <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
                    {tpl.category} • {tpl.placeholders.length} variables
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Document Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement 2026"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Summary / Purpose
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of document scope or deliverables..."
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>
          </div>

          {/* Folder & Project & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Document Category
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="agreement">Agreement</option>
                <option value="msa">Master Services Agreement</option>
                <option value="sow">Statement of Work</option>
                <option value="nda">Non-Disclosure Agreement</option>
                <option value="proposal">Proposal</option>
                <option value="contract">Contract</option>
                <option value="spec">Technical Spec</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Folder
              </label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="">Root / Unfiled</option>
                {documentFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Linked Project
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="">None / Standalone</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Editor Area with Toolbar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertText('## Heading 2')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink text-xs font-bold"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('**Bold Text**')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('*Italic Text*')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('- Bullet item')}
                  className="p-1.5 rounded hover:bg-paper text-muted hover:text-ink"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('1. Numbered item')}
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
                {previewMode ? 'Edit Mode' : 'Formatted Preview'}
              </button>
            </div>

            {previewMode ? (
              <div className="p-6 bg-paper rounded-xl border border-line min-h-[300px] text-xs text-ink whitespace-pre-wrap leading-relaxed font-sans">
                {content}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={12}
                placeholder="Draft contract terms, clauses, and scope definitions..."
                className="w-full p-4 text-xs font-mono bg-paper border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-flash leading-relaxed"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Link
              href="/documents"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Document Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
