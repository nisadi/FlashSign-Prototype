'use client';

import React, { useState } from 'react';
import type { Project, ProjectFile, TaskPriority, TaskType } from '@/types';
import type { SrsSuggestedTask } from '@/lib/srs-analysis';
import { PriorityBadge } from '@/components/shared/badges';
import { Button } from '@/components/shared/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  Check,
  AlertCircle,
  FileCode2,
  FolderKanban,
  BookmarkCheck,
} from 'lucide-react';

interface GeneratedTasksReviewModalProps {
  project: Project;
  file: ProjectFile;
  isOpen: boolean;
  tasks: SrsSuggestedTask[];
  onClose: () => void;
  onAcceptRemaining: (allTasks: SrsSuggestedTask[], acceptedTasks: SrsSuggestedTask[]) => void;
}

export function GeneratedTasksReviewModal({
  project,
  file,
  isOpen,
  tasks: initialTasks,
  onClose,
  onAcceptRemaining,
}: GeneratedTasksReviewModalProps) {
  const [tasks, setTasks] = useState<SrsSuggestedTask[]>(initialTasks);
  const [filterView, setFilterView] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [hasAcceptedBatch, setHasAcceptedBatch] = useState(false);

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAcceptanceCriteria, setEditAcceptanceCriteria] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editType, setEditType] = useState<TaskType>('task');

  if (!isOpen) return null;

  const totalCount = tasks.length;
  const acceptedTasks = tasks.filter((t) => !t.isRejected);
  const acceptedCount = acceptedTasks.length;
  const rejectedCount = tasks.filter((t) => t.isRejected).length;

  const visibleTasks = tasks.filter((t) => {
    if (filterView === 'accepted') return !t.isRejected;
    if (filterView === 'rejected') return t.isRejected;
    return true;
  });

  const handleToggleReject = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const willBeRejected = !t.isRejected;
          return {
            ...t,
            isRejected: willBeRejected,
            rejectionReason: willBeRejected
              ? (t.rejectionReason || 'Excluded during SRS analysis review.')
              : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleStartEdit = (t: SrsSuggestedTask) => {
    setEditingTaskId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description);
    setEditAcceptanceCriteria(t.acceptanceCriteria);
    setEditPriority(t.priority);
    setEditType(t.type);
  };

  const handleSaveEdit = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextTitle = editTitle.trim() || t.title;
        const nextDescription = editDescription.trim();
        const nextAcceptance = editAcceptanceCriteria.trim();
        const isModified =
          nextTitle !== (t.originalTitle || t.title) ||
          nextDescription !== (t.originalDescription ?? t.description) ||
          nextAcceptance !== (t.originalAcceptanceCriteria ?? t.acceptanceCriteria) ||
          editPriority !== (t.originalPriority ?? t.priority) ||
          editType !== (t.originalType ?? t.type);

        return {
          ...t,
          title: nextTitle,
          description: nextDescription,
          acceptanceCriteria: nextAcceptance,
          priority: editPriority,
          type: editType,
          isEdited: isModified || !!t.isEdited,
        };
      })
    );
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleAcceptAll = () => {
    if (acceptedCount === 0 || hasAcceptedBatch) return;
    setHasAcceptedBatch(true);
    onAcceptRemaining(tasks, acceptedTasks);
  };

  const handleCompleteAllRejected = () => {
    if (hasAcceptedBatch) return;
    setHasAcceptedBatch(true);
    onAcceptRemaining(tasks, []);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      aria-labelledby="modal-review-tasks-title"
    >
      {/* Header */}
      <ModalHeader className="flex-col !items-stretch gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-flash/10 text-flash-deep border border-flash/20">
                <Sparkles className="w-4 h-4 text-flash-deep" />
              </span>
              <h2 id="modal-review-tasks-title" className="text-lg font-bold text-ink">
                Review Generated Tasks
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-flash/15 text-flash-deep border border-flash/20">
                {totalCount} Generated
              </span>
            </div>
            <p className="text-xs text-muted">
              Review the suggested tasks before adding them to your project.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-mist/70 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Badges Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-line/60 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-line">
            <FileCode2 className="w-3.5 h-3.5 text-flash-deep" />
            <span className="text-muted text-[11px]">SRS Source:</span>
            <span className="font-semibold text-ink truncate max-w-xs">{file.name}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-line">
            <FolderKanban className="w-3.5 h-3.5 text-muted" />
            <span className="text-muted text-[11px]">Target Project:</span>
            <span className="font-semibold text-ink">{project.name}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-mist/50 border border-line text-[11px] text-ink-soft ml-auto font-mono">
            <Sparkles className="w-3 h-3 text-flash-deep" /> Simulated AI Extraction
          </div>
        </div>
      </ModalHeader>

      {/* View Tabs & Metrics Bar */}
      <div className="px-5 py-2.5 bg-mist/20 border-b border-line flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilterView('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              filterView === 'all'
                ? 'bg-ink text-white'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            All Suggestions ({totalCount})
          </button>
          <button
            onClick={() => setFilterView('accepted')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterView === 'accepted'
                ? 'bg-flash text-ink'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            <Check className="w-3.5 h-3.5" /> Ready to Accept ({acceptedCount})
          </button>
          <button
            onClick={() => setFilterView('rejected')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              filterView === 'rejected'
                ? 'bg-danger text-white'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" /> Excluded ({rejectedCount})
          </button>
        </div>

        <span className="text-[11px] text-muted">
          {acceptedCount} of {totalCount} tasks will be created in To Do
        </span>
      </div>

      {/* Body: Task List */}
      <ModalBody className="space-y-4">
        {visibleTasks.length === 0 ? (
          <div className="text-center py-12 bg-paper rounded-xl border border-line text-muted space-y-2">
            <AlertCircle className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm font-semibold text-ink">No tasks match this filter.</p>
            <p className="text-xs">
              Switch filters above to inspect all proposed requirements.
            </p>
          </div>
        ) : (
          visibleTasks.map((t, idx) => {
            const isEditing = editingTaskId === t.id;

            return (
              <div
                key={t.id}
                className={`rounded-xl border transition-all ${
                  t.isRejected
                    ? 'border-line/60 bg-paper/50 opacity-70'
                    : isEditing
                    ? 'border-flash ring-1 ring-flash/30 bg-paper-elevated shadow-md'
                    : 'border-line bg-paper-elevated hover:border-line/80 shadow-2xs'
                }`}
              >
                {isEditing ? (
                  /* Inline Task Editor */
                  <div className="p-4 sm:p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-line">
                      <span className="text-xs font-bold text-flash-deep flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4" /> Editing Task Candidate #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-muted">{t.sourceSection}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                          Task Title <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-paper border border-line rounded-lg font-semibold text-ink outline-none focus:border-flash"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                            Priority
                          </label>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                            className="w-full px-3 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash capitalize"
                          >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                            Task Type
                          </label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as TaskType)}
                            className="w-full px-3 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash uppercase font-mono text-[11px]"
                          >
                            <option value="story">Story</option>
                            <option value="task">Task</option>
                            <option value="bug">Bug</option>
                            <option value="epic">Epic</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                          Acceptance Criteria
                        </label>
                        <textarea
                          rows={3}
                          value={editAcceptanceCriteria}
                          onChange={(e) => setEditAcceptanceCriteria(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash font-mono leading-relaxed text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                      <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={() => handleSaveEdit(t.id)}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display Card */
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Top Row: Meta Badges & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-mist text-ink-soft font-bold uppercase tracking-wider">
                          {t.type}
                        </span>

                        <PriorityBadge priority={t.priority} />

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mist/60 text-muted border border-line">
                          Suggested: To Do
                        </span>

                        {t.isEdited && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 flex items-center gap-1">
                            <Edit3 className="w-2.5 h-2.5" /> Edited
                          </span>
                        )}

                        {t.isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/15 text-danger border border-danger/25 uppercase">
                            Excluded from Acceptance
                          </span>
                        )}
                      </div>

                      {/* Card Action Buttons: Edit & Reject */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-muted hover:text-ink hover:bg-mist/80 transition-colors flex items-center gap-1"
                          title="Edit task fields"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>

                        {t.isRejected ? (
                          <button
                            onClick={() => handleToggleReject(t.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-flash-deep hover:bg-flash/10 transition-colors flex items-center gap-1"
                            title="Restore to acceptance list"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleReject(t.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-danger hover:bg-danger/10 transition-colors flex items-center gap-1"
                            title="Reject and exclude from project acceptance"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          t.isRejected ? 'line-through text-muted' : 'text-ink'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed mt-1">{t.description}</p>
                    </div>

                    {/* Acceptance Criteria Box */}
                    {t.acceptanceCriteria && (
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                          Acceptance Criteria
                        </span>
                        <div className="text-[11px] text-ink-soft font-mono whitespace-pre-line leading-relaxed">
                          {t.acceptanceCriteria}
                        </div>
                      </div>
                    )}

                    {/* Source Section Ref */}
                    <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-line/60">
                      <span className="font-mono text-muted/80 truncate max-w-md">
                        Source: {t.sourceSection}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-paper border border-line text-muted"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </ModalBody>

      {/* Modal Footer & Summary Bar */}
      <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Summary Counts */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-muted block text-[10px] uppercase font-semibold">Total Suggested</span>
            <span className="font-bold text-ink">{totalCount} Tasks</span>
          </div>
          <div className="h-6 w-px bg-line" />
          <div>
            <span className="text-muted block text-[10px] uppercase font-semibold">Accepted for Creation</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {acceptedCount} Tasks
            </span>
          </div>
          <div className="h-6 w-px bg-line" />
          <div>
            <span className="text-muted block text-[10px] uppercase font-semibold">Rejected</span>
            <span className="font-bold text-muted">{rejectedCount} Tasks</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>

          {acceptedCount === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> All tasks rejected. None will be added to project.
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={hasAcceptedBatch}
                onClick={handleCompleteAllRejected}
              >
                Complete Review (Save History)
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={BookmarkCheck}
              disabled={hasAcceptedBatch}
              onClick={handleAcceptAll}
            >
              Accept {acceptedCount} Tasks
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
