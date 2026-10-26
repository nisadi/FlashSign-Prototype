'use client';

import React, { useState, useMemo } from 'react';
import type { Project, ProjectFile, SrsGeneratedTaskRecord, TaskStatus } from '@/types';
import { useApp } from '@/context/app-context';
import { PriorityBadge, TaskStatusBadge } from '@/components/shared/badges';
import { Button } from '@/components/shared/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  FileCode2,
  FolderKanban,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Layers,
  Info,
  Clock,
  Tag,
} from 'lucide-react';

interface SrsGeneratedTasksModalProps {
  project: Project;
  file: ProjectFile;
  isOpen: boolean;
  historyTasks?: SrsGeneratedTaskRecord[];
  onClose: () => void;
}

type FilterTab = 'all' | 'accepted' | 'edited' | 'rejected';

export function SrsGeneratedTasksModal({
  project,
  file,
  isOpen,
  historyTasks = [],
  onClose,
}: SrsGeneratedTasksModalProps) {
  const { tasks: projectTasks, openTaskDrawer } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const totalCount = historyTasks.length;
  const acceptedTasks = historyTasks.filter((t) => t.outcome === 'accepted');
  const acceptedCount = acceptedTasks.length;
  const editedTasks = historyTasks.filter((t) => t.isEdited);
  const editedCount = editedTasks.length;
  const rejectedTasks = historyTasks.filter((t) => t.outcome === 'rejected');
  const rejectedCount = rejectedTasks.length;

  const toggleTaskExpanded = (id: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter and search visible tasks
  const visibleTasks = useMemo(() => {
    return historyTasks.filter((t) => {
      // Tab filter
      if (activeFilter === 'accepted' && t.outcome !== 'accepted') return false;
      if (activeFilter === 'rejected' && t.outcome !== 'rejected') return false;
      if (activeFilter === 'edited' && !t.isEdited) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchKey = t.projectTaskKey?.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase();
      const matchSection = t.sourceSection?.toLowerCase().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));

      return matchTitle || matchDesc || matchKey || matchId || matchSection || matchTags;
    });
  }, [historyTasks, activeFilter, searchQuery]);

  if (!isOpen) return null;

  // Helper to determine review outcome badge
  const renderReviewOutcomeBadge = (task: SrsGeneratedTaskRecord) => {
    if (task.outcome === 'accepted') {
      if (task.isEdited) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
            <Edit3 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Edited & Accepted</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Accepted</span>
        </span>
      );
    }

    // Rejected outcomes
    if (task.isEdited) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Edited & Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  };

  // Helper to find live task status in project tasks
  const getLiveWorkflowStatus = (task: SrsGeneratedTaskRecord): TaskStatus | null => {
    if (task.outcome !== 'accepted') return null;
    const found = projectTasks.find(
      (p) =>
        (task.projectTaskId && p.id === task.projectTaskId) ||
        (task.projectTaskKey && p.key === task.projectTaskKey) ||
        (p.sourceDocumentId === file.id && p.title.toLowerCase() === task.title.toLowerCase())
    );
    return found ? found.status : 'todo';
  };

  const getLiveTaskId = (task: SrsGeneratedTaskRecord): string | undefined => {
    if (task.outcome !== 'accepted') return undefined;
    const found = projectTasks.find(
      (p) =>
        (task.projectTaskId && p.id === task.projectTaskId) ||
        (task.projectTaskKey && p.key === task.projectTaskKey) ||
        (p.sourceDocumentId === file.id && p.title.toLowerCase() === task.title.toLowerCase())
    );
    return found ? found.id : task.projectTaskId;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      aria-labelledby="modal-srs-generated-tasks-title"
    >
      {/* Modal Header */}
      <ModalHeader className="flex-col !items-stretch gap-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-flash/10 text-flash-deep border border-flash/20 shrink-0">
                <Sparkles className="w-4 h-4 text-flash-deep" />
              </span>
              <h2 id="modal-srs-generated-tasks-title" className="text-lg font-bold text-ink">
                Tasks Generated from SRS
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-flash/15 text-flash-deep border border-flash/20">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-muted">
              Complete generation audit trail for this specification document, including accepted, edited, and rejected items.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-mist/70 rounded-lg transition-colors shrink-0"
            aria-label="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source SRS & Project Details Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-line/60 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-line">
            <FileCode2 className="w-3.5 h-3.5 text-flash-deep shrink-0" />
            <span className="text-muted text-[11px]">Source SRS:</span>
            <span className="font-semibold text-ink truncate max-w-xs">{file.name}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-line">
            <FolderKanban className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-muted text-[11px]">Project:</span>
            <span className="font-semibold text-ink truncate max-w-xs">{project.name}</span>
          </div>

          {file.analyzedAt && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-line text-[11px] text-muted">
              <Clock className="w-3 h-3 text-muted shrink-0" />
              <span>Analyzed: {new Date(file.analyzedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* 4 Summary Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-paper border border-line flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted block">Generated</span>
              <span className="text-sm font-extrabold text-ink">{totalCount} Tasks</span>
            </div>
            <span className="p-1.5 rounded-lg bg-mist/60 text-muted">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Accepted</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{acceptedCount} Tasks</span>
            </div>
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block">Edited</span>
              <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{editedCount} Tasks</span>
            </div>
            <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600">
              <Edit3 className="w-4 h-4" />
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Rejected</span>
              <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{rejectedCount} Tasks</span>
            </div>
            <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
        </div>
      </ModalHeader>

      {/* Filter Tabs & Search Controls Bar */}
      <div className="px-5 py-2.5 bg-mist/25 border-b border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-ink text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            All Tasks
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-mist text-muted'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('accepted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'accepted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Accepted
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'accepted' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-700'
            }`}>
              {acceptedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('edited')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'edited'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edited
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'edited' ? 'bg-white/20 text-white' : 'bg-teal-500/15 text-teal-700'
            }`}>
              {editedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-mist/50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-700'
            }`}>
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* In-Modal Search Input */}
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search generated tasks…"
            className="w-full sm:w-52 pl-8 pr-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash"
          />
        </div>
      </div>

      {/* Modal Body: Scrollable Task List */}
      <ModalBody className="max-h-[60vh] overflow-y-auto space-y-3.5 p-4 sm:p-5">
        {/* If completely empty history */}
        {totalCount === 0 ? (
          <div className="text-center py-12 px-4 bg-paper rounded-xl border border-line text-muted space-y-2">
            <Info className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm font-semibold text-ink">
              No generated task history is available for this SRS.
            </p>
            <p className="text-xs max-w-sm mx-auto">
              This document has not been analyzed yet or its generated tasks were not saved.
            </p>
          </div>
        ) : acceptedCount === 0 && rejectedCount > 0 && activeFilter === 'all' ? (
          /* Notice banner if all tasks were rejected */
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">All tasks in this batch were rejected during review.</span>
              <span>None of the {rejectedCount} generated requirements were added to the project task backlog.</span>
            </div>
          </div>
        ) : null}

        {/* Filtered empty state */}
        {totalCount > 0 && visibleTasks.length === 0 ? (
          <div className="text-center py-10 bg-paper rounded-xl border border-line text-muted space-y-2">
            <Search className="w-7 h-7 text-muted mx-auto" />
            <p className="text-sm font-semibold text-ink">No tasks match the selected filter.</p>
            <p className="text-xs">
              Try switching tabs above or clearing your search query.
            </p>
          </div>
        ) : (
          visibleTasks.map((task, idx) => {
            const isExpanded = !!expandedTaskIds[task.id];
            const liveWorkflowStatus = getLiveWorkflowStatus(task);
            const liveTaskId = getLiveTaskId(task);

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-all ${
                  task.outcome === 'rejected'
                    ? 'border-line/70 bg-paper/60 opacity-90'
                    : 'border-line bg-paper hover:border-line/80 shadow-2xs'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Top Bar: IDs, Badges, Outcomes & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Task ID / Project Key */}
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-mist text-ink border border-line">
                        {task.projectTaskKey || `GEN-${idx + 1}`}
                      </span>

                      {/* Task Type */}
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-mist/60 text-ink-soft font-bold uppercase tracking-wider">
                        {task.type}
                      </span>

                      {/* Priority */}
                      <PriorityBadge priority={task.priority} />

                      {/* Review Outcome Badge (Accepted, Edited & Accepted, Rejected, Edited & Rejected) */}
                      {renderReviewOutcomeBadge(task)}

                      {/* Current Workflow Status for Accepted Tasks */}
                      {task.outcome === 'accepted' && liveWorkflowStatus && (
                        <div className="flex items-center gap-1.5 pl-1.5 border-l border-line text-xs">
                          <span className="text-[10px] font-semibold text-muted uppercase">Status:</span>
                          <TaskStatusBadge status={liveWorkflowStatus} />
                        </div>
                      )}

                      {/* Excluded Indicator for Rejected Tasks */}
                      {task.outcome === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-mist/60 text-muted border border-line">
                          Excluded from Backlog
                        </span>
                      )}
                    </div>

                    {/* Actions: View Task or View Rejected Details */}
                    <div className="flex items-center gap-1.5">
                      {task.outcome === 'accepted' && liveTaskId && (
                        <button
                          type="button"
                          onClick={() => openTaskDrawer(liveTaskId)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-flash/10 hover:bg-flash/20 text-flash-deep border border-flash/25 transition-colors flex items-center gap-1"
                          title="Open task detail drawer in project"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Task</span>
                        </button>
                      )}

                      {task.outcome === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/25 transition-colors flex items-center gap-1"
                          title="View rejection review details"
                        >
                          <Info className="w-3 h-3" />
                          <span>{isExpanded ? 'Hide Details' : 'View Rejection Details'}</span>
                        </button>
                      )}

                      {(task.acceptanceCriteria || task.isEdited) && task.outcome !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="p-1 text-muted hover:text-ink hover:bg-mist/70 rounded-lg transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand full details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Title */}
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        task.outcome === 'rejected' ? 'text-ink/80 line-through decoration-rose-400/50' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mt-1">{task.description}</p>
                  </div>

                  {/* Rejection Details Box */}
                  {task.outcome === 'rejected' && (
                    <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rejection Rationale</span>
                      </div>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        {task.rejectionReason || 'Excluded during SRS analysis review: Requirement scope deferred or redundant.'}
                      </p>
                      <span className="text-[10px] text-muted block mt-1">
                        Not added to project backlog. Preserved for SRS analysis traceability.
                      </span>
                    </div>
                  )}

                  {/* Edited Details Diff / Comparison */}
                  {task.isEdited && (
                    <div className="p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/20 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                        <Edit3 className="w-3 h-3" />
                        <span>Edited During Review</span>
                      </div>
                      {task.originalTitle && task.originalTitle !== task.title && (
                        <div className="text-[11px] text-muted">
                          <span className="font-semibold text-ink-soft">Original Title:</span> {task.originalTitle}
                        </div>
                      )}
                      {task.originalPriority && task.originalPriority !== task.priority && (
                        <div className="text-[11px] text-muted">
                          <span className="font-semibold text-ink-soft">Original Priority:</span>{' '}
                          <span className="capitalize">{task.originalPriority}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Acceptance Criteria */}
                  {(isExpanded || task.outcome === 'accepted') && task.acceptanceCriteria && (
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        Acceptance Criteria
                      </span>
                      <div className="text-[11px] text-ink-soft font-mono whitespace-pre-line leading-relaxed">
                        {task.acceptanceCriteria}
                      </div>
                    </div>
                  )}

                  {/* Footer Meta: Source SRS Section & Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-[11px] text-muted">
                    <span className="font-mono text-muted/80 truncate max-w-md">
                      Source: {task.sourceSection || file.name}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.points && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-mist border border-line text-ink-soft font-mono">
                          {task.points} pts
                        </span>
                      )}
                      {task.tags?.map((tag) => (
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
              </div>
            );
          })
        )}
      </ModalBody>

      {/* Modal Footer */}
      <ModalFooter className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted">
          Showing <span className="font-semibold text-ink">{visibleTasks.length}</span> of {totalCount} generated tasks for <span className="font-semibold text-ink">{file.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
