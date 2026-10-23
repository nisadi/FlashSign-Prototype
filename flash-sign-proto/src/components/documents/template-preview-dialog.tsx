'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScrollText,
  X,
  Copy,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentTemplate } from '@/types/documents';
import { ClientPortal } from '@/components/shared/modal';

interface TemplatePreviewDialogProps {
  template: DocumentTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  const router = useRouter();
  const { addDocumentItem } = useApp();

  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  if (!open || !template) return null;

  const handlePlaceholderChange = (key: string, val: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: val }));
  };

  const handleCreateDocument = () => {
    let replacedContent = template.content;
    template.placeholders.forEach(ph => {
      const val = placeholderValues[ph] || `[${ph.toUpperCase()}]`;
      const regex = new RegExp(`{{${ph}}}`, 'g');
      replacedContent = replacedContent.replace(regex, val);
    });

    const newDocId = addDocumentItem({
      title: `${template.title.split('(')[0].trim()} - New Document`,
      type: template.type,
      status: 'draft',
      content: replacedContent,
    });

    onOpenChange(false);
    router.push(`/documents/${newDocId}`);
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-white border border-line rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[calc(100dvh-32px)] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">
                {template.category.replace('_', ' ')}
              </span>
              <h3 className="text-base font-bold text-ink">{template.title}</h3>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg hover:bg-paper text-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <p className="text-xs text-muted leading-relaxed">{template.description}</p>

          {/* Placeholders Editor */}
          {template.placeholders.length > 0 && (
            <div className="p-3.5 bg-paper rounded-xl border border-line/70 space-y-2.5">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-flash-deep" />
                Customize Template Placeholders:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {template.placeholders.map(ph => (
                  <div key={ph} className="space-y-1">
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
                      {ph.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter ${ph.replace('_', ' ')}...`}
                      value={placeholderValues[ph] || ''}
                      onChange={e => handlePlaceholderChange(ph, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Markdown Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Template Text Preview
            </label>
            <pre className="p-4 bg-paper rounded-xl border border-line/70 text-xs text-ink font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {template.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-line shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink"
          >
            Close
          </button>
          <button
            onClick={handleCreateDocument}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Use This Template
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  </ClientPortal>
  );
}
