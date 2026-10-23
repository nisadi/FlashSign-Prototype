'use client';

import React, { useState } from 'react';
import type { ProjectFile, DocumentCategory } from '@/types';
import { Button } from '@/components/shared/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { formatDate } from '@/lib/utils';
import {
  FileCode2,
  ShieldCheck,
  FileText,
  FileBox,
  CheckCircle2,
  Calendar,
  HardDrive,
  FileType,
  Sparkles,
} from 'lucide-react';

interface DocumentClassificationModalProps {
  file: ProjectFile;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: DocumentCategory) => void;
}

interface CategoryOption {
  id: DocumentCategory;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  features: string[];
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'srs',
    title: 'SRS (Software Requirements Specification)',
    badge: 'SRS',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: Sparkles,
    description:
      'Defines functional requirements, acceptance criteria, system boundaries, and user workflows. Can be analyzed to automatically generate project tasks.',
    features: ['Simulated AI Task Generation', 'Requirements Extraction', 'Acceptance Criteria Parsing'],
  },
  {
    id: 'test_report',
    title: 'Test Report',
    badge: 'TEST REPORT',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: ShieldCheck,
    description:
      'Quality assurance execution summaries, test pass/fail logs, security audit outcomes, and regression coverage results.',
    features: ['QA Verification Logs', 'Security & Compliance Audits', 'Defect Summaries'],
  },
  {
    id: 'doc',
    title: 'Document (DOC)',
    badge: 'DOC',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: FileText,
    description:
      'General project documentation, system architecture briefs, product proposals, meeting notes, and team guidelines.',
    features: ['Architecture Briefs', 'Product Proposals', 'Standard Documentation'],
  },
  {
    id: 'other',
    title: 'Other',
    badge: 'OTHER',
    badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    icon: FileBox,
    description:
      'Miscellaneous assets, design archives, sample data packages, configuration exports, or wireframe bundles.',
    features: ['Design Archives', 'Raw Data Files', 'External Assets'],
  },
];

export function DocumentClassificationModal({
  file,
  isOpen,
  onClose,
  onConfirm,
}: DocumentClassificationModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(
    file.category || 'srs'
  );

  if (!isOpen) return null;

  const handleContinue = () => {
    onConfirm(selectedCategory);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      aria-labelledby="modal-classify-title"
    >
      {/* Modal Header */}
      <ModalHeader
        title="Classify Document"
        description="Identify the document category to enable document-specific workflows and task generation."
        icon={FileType}
        iconColor="text-flash-deep"
        onClose={onClose}
        id="modal-classify-title"
      />

      {/* Selected File Details Banner */}
      <div className="p-4 bg-mist/30 border-b border-line flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-paper-elevated border border-line text-flash-deep shrink-0">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate max-w-sm sm:max-w-md">
              {file.name}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted font-mono mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 uppercase">
                <FileType className="w-3.5 h-3.5 text-muted/70" />
                {file.type}
              </span>
              {file.size && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-muted/70" />
                  {file.size}
                </span>
              )}
              {file.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted/70" />
                  {formatDate(file.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {file.category && (
          <div className="shrink-0">
            <span className="text-[10px] text-muted block mb-0.5 text-right uppercase tracking-wider font-semibold">
              Current Type
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                CATEGORIES.find((c) => c.id === file.category)?.badgeColor || 'bg-mist text-ink border-line'
              }`}
            >
              {CATEGORIES.find((c) => c.id === file.category)?.badge || file.category}
            </span>
          </div>
        )}
      </div>

      {/* Modal Body: Category Options */}
      <ModalBody className="space-y-3.5">
        <label className="block text-xs font-bold text-ink uppercase tracking-wider">
          Select Document Category <span className="text-danger">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 text-left group ${
                  isSelected
                    ? 'border-flash bg-flash/5 shadow-xs'
                    : 'border-line hover:border-line/80 bg-paper-elevated hover:bg-mist/20'
                }`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setSelectedCategory(cat.id);
                  }
                }}
              >
                <div
                  className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-flash text-ink border-flash shadow-xs'
                      : 'bg-paper text-muted border-line group-hover:text-ink'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{cat.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${cat.badgeColor}`}
                      >
                        {cat.badge}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-flash bg-flash text-ink'
                          : 'border-line bg-paper group-hover:border-muted'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-ink" />}
                    </div>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">{cat.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cat.features.map((feat) => (
                      <span
                        key={feat}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-paper border border-line/70 text-ink-soft font-medium"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>

      {/* Modal Footer */}
      <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-muted">
          {selectedCategory === 'srs' ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Continuing will open the SRS Analysis & Task Creation flow
            </span>
          ) : (
            <span>Document will be saved with the selected classification</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
