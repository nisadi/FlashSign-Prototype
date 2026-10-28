'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ScrollText,
  ArrowLeft,
  Save,
  Plus,
  X,
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { TemplateCategory, DocumentType } from '@/types/documents';
import { notify } from '@/components/shared/toaster';

export default function NewTemplatePage() {
  const router = useRouter();
  const { addTemplate } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('contracts');
  const [type, setType] = useState<DocumentType>('contract');
  const [content, setContent] = useState('# {{agreement_title}}\n\nEffective Date: {{effective_date}}\nBetween: {{party_a}} and {{party_b}}\n\n### 1. Scope & Terms\nDescribe terms here...');
  const [placeholderInput, setPlaceholderInput] = useState('');
  const [placeholders, setPlaceholders] = useState<string[]>(['agreement_title', 'effective_date', 'party_a', 'party_b']);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = placeholderInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (tag && !placeholders.includes(tag)) {
      setPlaceholders(prev => [...prev, tag]);
      setContent(prev => prev + ` {{${tag}}}`);
      setPlaceholderInput('');
    }
  };

  const handleRemovePlaceholder = (tag: string) => {
    setPlaceholders(prev => prev.filter(p => p !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Template title is required.');
      return;
    }

    addTemplate({
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      content,
      placeholders,
    });

    notify(`Template "${title.trim()}" created`);
    router.push('/documents/templates');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/documents/templates"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Templates
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-purple-600" />
            Create Document Template
          </h1>
          <p className="text-sm text-muted mt-1">
            Build a reusable document blueprint with dynamic variable slots.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Template Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Master Consulting Services Agreement"
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-flash"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Explain the purpose of this template and when to use it..."
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash capitalize"
              >
                <option value="contracts">Contracts</option>
                <option value="legal">Legal & Compliance</option>
                <option value="project_management">Project Management</option>
                <option value="human_resources">Human Resources</option>
                <option value="procurement">Procurement</option>
                <option value="sales">Sales</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Document Base Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="contract">Contract</option>
                <option value="msa">MSA</option>
                <option value="sow">SOW</option>
                <option value="nda">NDA</option>
                <option value="agreement">Agreement</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
          </div>

          {/* Placeholders Builder */}
          <div className="p-4 bg-paper rounded-xl border border-line space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Template Placeholders (&#123;&#123;variable&#125;&#125;)
              </label>
              <span className="text-[11px] text-muted">{placeholders.length} active</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={placeholderInput}
                onChange={e => setPlaceholderInput(e.target.value)}
                placeholder="e.g. counterparty_name"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash font-mono"
              />
              <button
                type="button"
                onClick={handleAddPlaceholder}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-ink-soft transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {placeholders.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-white text-purple-800 border border-purple-200"
                >
                  &#123;&#123;{tag}&#125;&#125;
                  <button
                    type="button"
                    onClick={() => handleRemovePlaceholder(tag)}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Template Body Content
              </label>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs font-semibold text-flash-deep hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Edit Mode' : 'Preview Format'}
              </button>
            </div>

            {previewMode ? (
              <div className="p-4 bg-paper rounded-xl border border-line min-h-[220px] text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={10}
                className="w-full p-3 text-xs font-mono bg-paper border border-line rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-flash leading-relaxed"
                required
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Link
              href="/documents/templates"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
