'use client';

import React, { useState, useEffect } from 'react';
import type { ProjectFile } from '@/types';
import { Button } from '@/components/shared/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import {
  Sparkles,
  FileCode2,
  Bookmark,
  Wand2,
  Loader2,
} from 'lucide-react';

interface SrsActionModalProps {
  file: ProjectFile;
  isOpen: boolean;
  onClose: () => void;
  onSaveOnly: () => void;
  onStartAnalysis: () => void;
}

export function SrsActionModal({
  file,
  isOpen,
  onClose,
  onSaveOnly,
  onStartAnalysis,
}: SrsActionModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const steps = [
    'Parsing SRS document structure & sections...',
    'Extracting functional requirements & user stories...',
    'Synthesizing acceptance criteria & priority tags...',
    'Preparing suggested tasks for review...',
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing) {
      if (analysisStep < steps.length - 1) {
        timer = setTimeout(() => {
          setAnalysisStep((prev) => prev + 1);
        }, 350);
      } else {
        timer = setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisStep(0);
          onStartAnalysis();
        }, 400);
      }
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing, analysisStep, steps.length, onStartAnalysis]);

  if (!isOpen) return null;

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isAnalyzing ? () => {} : onClose}
      size="md"
      closeOnBackdropClick={!isAnalyzing}
      closeOnEscape={!isAnalyzing}
      aria-labelledby="modal-srs-action-title"
    >
      {/* Header */}
      <ModalHeader
        title="SRS Document Workflow"
        description="Software Requirements Specification Actions & Analysis"
        icon={Sparkles}
        iconColor="text-flash-deep"
        onClose={isAnalyzing ? undefined : onClose}
        id="modal-srs-action-title"
      />

      {/* Body */}
      <ModalBody className="space-y-4">
        {/* File Card */}
        <div className="p-4 rounded-xl bg-mist/30 border border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-paper-elevated border border-line text-flash-deep shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-ink truncate">{file.name}</h4>
              <div className="flex items-center gap-2 text-[11px] text-muted font-mono mt-0.5">
                <span className="uppercase">{file.type}</span>
                <span>•</span>
                <span>{file.size || '3.5 MB'}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              SRS
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <p className="text-xs text-ink-soft leading-relaxed">
            This document is classified as a{' '}
            <strong className="text-ink">Software Requirements Specification (SRS)</strong>. You can
            simulate requirement analysis to automatically extract acceptance criteria, functional
            specs, and generate structured project tasks for your backlog.
          </p>

          <div className="p-3.5 rounded-xl bg-paper border border-line/80 space-y-2 text-xs">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-flash-deep" /> What happens during analysis?
            </div>
            <ul className="space-y-1.5 text-muted pl-5 list-disc text-[11px]">
              <li>Parses functional specifications and security criteria from the document.</li>
              <li>Generates realistic task candidates with priorities, descriptions, and estimates.</li>
              <li>Allows you to review, edit, or reject each task before accepting them into the project.</li>
            </ul>
          </div>
        </div>

        {/* Simulated Loading State */}
        {isAnalyzing && (
          <div className="p-5 rounded-xl bg-paper border border-flash/30 shadow-xs space-y-3 animate-fade-in text-center">
            <div className="flex items-center justify-center gap-2 text-flash-deep">
              <Loader2 className="w-5 h-5 animate-spin text-flash-deep" />
              <span className="text-xs font-bold text-ink">
                Analyzing SRS and generating suggested tasks…
              </span>
            </div>
            <div className="w-full bg-mist h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-flash h-full transition-all duration-300 rounded-full"
                style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-muted animate-pulse">
              {steps[analysisStep]}
            </p>
          </div>
        )}
      </ModalBody>

      {/* Footer */}
      {!isAnalyzing && (
        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Bookmark}
              onClick={onSaveOnly}
              title="Save classification without task generation"
            >
              Save
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={handleStartAnalysis}
            >
              Analyze & Create Tasks
            </Button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}
