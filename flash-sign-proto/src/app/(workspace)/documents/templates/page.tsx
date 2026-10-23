'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ScrollText,
  Search,
  Filter,
  Plus,
  Star,
  ArrowRight,
  Eye,
  Sparkles,
  FileText
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { TemplatePreviewDialog } from '@/components/documents/template-preview-dialog';
import { DocumentTemplate, TemplateCategory } from '@/types/documents';

export default function DocumentTemplatesPage() {
  const { documentTemplates, toggleFavoriteTemplate } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'legal', label: 'Legal & NDAs' },
    { id: 'project_management', label: 'Project SOWs' },
    { id: 'human_resources', label: 'HR & Consulting' },
    { id: 'procurement', label: 'Procurement & SLAs' },
    { id: 'sales', label: 'Sales & Handover' },
  ];

  const filteredTemplates = useMemo(() => {
    return documentTemplates.filter(t => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [documentTemplates, selectedCategory, searchQuery]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Templates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <ScrollText className="w-7 h-7 text-purple-600" />
              Document Templates ({documentTemplates.length})
            </h1>
            <p className="text-sm text-muted mt-1">
              Standardized agreement blueprints with interactive placeholder variables ready for instant drafting.
            </p>
          </div>

          <Link
            href="/documents/templates/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>

        {/* Toolbar & Category Pills */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search templates by title, clause, variable..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-line/40 text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-ink text-white'
                    : 'text-muted hover:text-ink hover:bg-paper'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="bg-white border border-line/70 hover:border-purple-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    {tpl.category.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => toggleFavoriteTemplate(tpl.id)}
                    className={`p-1 rounded ${
                      tpl.isFavorite ? 'text-amber-500' : 'text-muted/30 hover:text-amber-500'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-ink text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                {/* Placeholders preview chips */}
                {tpl.placeholders.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {tpl.placeholders.slice(0, 3).map(ph => (
                      <span
                        key={ph}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-paper text-muted border border-line/60"
                      >
                        &#123;&#123;{ph}&#125;&#125;
                      </span>
                    ))}
                    {tpl.placeholders.length > 3 && (
                      <span className="text-[10px] text-muted font-medium">
                        +{tpl.placeholders.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted">Updated {tpl.lastUpdated}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-paper border border-line text-ink hover:bg-mist/30 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted" /> Preview
                  </button>
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Template Preview and Use Dialog */}
        <TemplatePreviewDialog
          template={previewTemplate}
          open={Boolean(previewTemplate)}
          onOpenChange={open => !open && setPreviewTemplate(null)}
        />
      </div>
    </div>
  );
}
