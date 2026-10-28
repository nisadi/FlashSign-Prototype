'use client';

import React, { useState } from 'react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate, formatRelative } from '@/lib/utils';
import { placeIn, placementOf, projectBoards, type ResolvedBoard } from '@/lib/board-columns';
import { boardNameAt, taskJourney } from '@/lib/task-journey';
import { useNow } from '@/lib/use-now';
import { PlacementSelect } from '@/components/tasks/placement-select';
import { SubtaskStateSelect } from '@/components/tasks/subtask-state-select';
import { PlanPicker } from '@/components/plan/plan-picker';
import { planOf } from '@/lib/plan';
import { EstimateField } from '@/components/shared/duration-fields';
import { formatDays, type DurationUnit } from '@/lib/durations';
import { notify } from '@/components/shared/toaster';
import { useGuardedMove } from '@/components/tasks/use-guarded-move';
import { TaskJourney } from '@/components/tasks/task-journey';
import { TaskProgress } from '@/components/tasks/task-progress';
import type { BoardColumn, TaskPriority } from '@/types';
import {
  X, Trash2, CheckSquare, MessageSquare, Paperclip, Clock, Tag,
  Calendar, User as UserIcon, Plus, Check, AlertCircle, FileText, Sparkles,
} from 'lucide-react';
import { ClientPortal, Modal } from '@/components/shared/modal';

export function TaskDetailDrawer() {
  const {
    activeTaskDrawerId, closeTaskDrawer, tasks, updateTask, deleteTask,
    users, projects, sprints, milestones, addTask, openTaskDrawer, addActivity, taskStatusChanges, workSessions,
    epics, stories, setTaskPlan
  } = useApp();
  const now = useNow();
  // Moving a task to Done asks first when some of its subtasks are still open
  const { move, dialog: openSubtasksDialog } = useGuardedMove();

  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'progress' | 'comments' | 'attachments' | 'journey'>('details');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDuration, setNewSubtaskDuration] = useState(2);
  const [newSubtaskUnit, setNewSubtaskUnit] = useState<DurationUnit>('days');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!activeTaskDrawerId) return null;

  const task = tasks.find(t => t.id === activeTaskDrawerId);
  if (!task) return null;

  const project = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const reporter = users.find(u => u.id === task.reporterId);
  const sprint = sprints.find(s => s.id === task.sprintId);
  const milestone = milestones.find(m => m.id === task.milestoneId);
  const parentTask = task.parentId ? tasks.find(t => t.id === task.parentId) : undefined;
  const subtasks = tasks.filter(t => t.parentId === task.id);
  const boards = projectBoards(project);
  const placement = placementOf(task, boards);
  // The Journey matters once a project has more than one board
  const journey = boards.length > 1 ? taskJourney(task, boards, taskStatusChanges, workSessions, now ?? 0) : [];

  const handleStatusChange = (board: ResolvedBoard, col: BoardColumn) => {
    move(task, placeIn(board, col));
    addActivity({
      id: `act-${Date.now()}`,
      actorId: currentUser?.id || 'u2',
      actorName: currentUser?.name || 'Marcus Webb',
      action: 'task.status.changed',
      resource: 'Task',
      resourceId: task.id,
      detail: board.id === placement.board.id ? `Moved to ${col.name}` : `Moved to ${board.name} · ${col.name}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask(task.id, { priority });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTask(task.id, { assigneeId });
    addActivity({
      id: `act-${Date.now()}`,
      actorId: currentUser?.id || 'u2',
      actorName: currentUser?.name || 'Marcus Webb',
      action: 'task.assigned',
      resource: 'Task',
      resourceId: task.id,
      detail: `Assigned to ${users.find(u => u.id === assigneeId)?.name || 'unassigned'}`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleToggleChecklist = (itemIndex: number) => {
    const nextChecklist = (task.checklist || []).map((c, i) =>
      i === itemIndex ? { ...c, completed: !c.completed } : c
    );
    updateTask(task.id, { checklist: nextChecklist });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const nextChecklist = [
      ...(task.checklist || []),
      { id: `chk-${Date.now()}`, text: newChecklistText.trim(), completed: false },
    ];
    updateTask(task.id, { checklist: nextChecklist });
    setNewChecklistText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser?.id || 'u2',
      body: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    updateTask(task.id, { comments: [...task.comments, newComment] });
    setNewCommentText('');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    closeTaskDrawer();
  };

  return (
    <ClientPortal lockScroll={true}>
      <div className="fixed inset-0 z-[1000] flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
          onClick={closeTaskDrawer}
        />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-2xl bg-paper-elevated border-l border-line shadow-2xl flex flex-col h-full z-10 animate-slide-in-right">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-line flex items-center justify-between shrink-0 bg-paper">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-mist text-ink-soft border border-line">
              {task.key}
            </span>
            <span className="text-xs text-muted truncate max-w-[200px]">
              {project?.name}
            </span>
            {task.isSrsGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> SRS Generated
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-muted hover:text-danger rounded hover:bg-mist/60 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeTaskDrawer}
              className="p-1.5 text-muted hover:text-ink rounded hover:bg-mist/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Parent Task Banner if Subtask */}
        {parentTask && (
          <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-ink">
              <span className="text-[10px] uppercase font-bold text-flash-deep">Parent Task:</span>
              <span className="font-mono text-[11px] font-bold text-muted">{parentTask.key}</span>
              <span className="font-semibold truncate max-w-xs">{parentTask.title}</span>
            </div>
            <button
              type="button"
              onClick={() => openTaskDrawer(parentTask.id)}
              className="text-xs text-flash-deep font-semibold hover:underline"
            >
              View Parent Task →
            </button>
          </div>
        )}

        {/* Quick Attribute Bar */}
        <div className="p-4 sm:px-6 border-b border-line grid grid-cols-2 sm:grid-cols-4 gap-3 bg-paper-elevated text-xs">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase mb-1">
              {boards.length > 1 && !parentTask ? `Status · ${placement.board.name}` : 'Status'}
            </label>
            {parentTask ? (
              <SubtaskStateSelect
                status={task.status}
                onChange={status => updateTask(task.id, { status })}
                aria-label="Status"
                className="w-full rounded px-2 py-1 text-xs"
              />
            ) : (
              <PlacementSelect
                boards={boards}
                boardId={placement.board.id}
                columnId={placement.column?.id}
                onChange={handleStatusChange}
                aria-label="Status"
                className="w-full text-xs font-medium px-2 py-1 rounded border border-line bg-paper text-ink focus:ring-1 focus:ring-flash"
              />
            )}
            {subtasks.length > 0 && (
              <p className="mt-1 text-[10px] text-muted">Timer runs on its subtasks</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase mb-1">Priority</label>
            <select
              value={task.priority}
              onChange={e => handlePriorityChange(e.target.value as TaskPriority)}
              className="w-full text-xs font-medium px-2 py-1 rounded border border-line bg-paper text-ink focus:ring-1 focus:ring-flash"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Estimated Duration (Live Timeline Recalculation!) */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase mb-1 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-flash-deep" />
              Estimate
            </label>
            <EstimateField
              key={task.id}
              days={task.estimatedDuration || 3}
              unit={task.durationUnit ?? 'days'}
              start={task.startDate?.slice(0, 10)}
              onChange={(days, unit) => updateTask(task.id, { estimatedDuration: days, durationUnit: unit })}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] font-semibold text-muted uppercase mb-1">Assignee</label>
            <select
              value={task.assigneeId || ''}
              onChange={e => handleAssigneeChange(e.target.value)}
              className="w-full text-xs font-medium px-2 py-1 rounded border border-line bg-paper text-ink focus:ring-1 focus:ring-flash"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Where the task sits in the plan: Phase → Epic → Story (a subtask follows its task) */}
        <div className="px-4 sm:px-6 py-3 border-b border-line bg-paper-elevated">
          {parentTask ? (
            (() => {
              const plan = planOf(task, tasks, epics, stories, milestones);
              const path = [plan.phase?.name, plan.epic?.name, plan.story?.title].filter(Boolean);
              return (
                <p className="text-[11px] text-muted">
                  <span className="font-semibold uppercase text-[10px] mr-1.5">Plan</span>
                  {path.length ? path.join(' › ') : 'Not planned'} <span className="italic">(from {parentTask.key})</span>
                </p>
              );
            })()
          ) : (
            <PlanPicker
              projectId={task.projectId}
              value={{ milestoneId: task.milestoneId, epicId: task.epicId, storyId: task.storyId }}
              onChange={links => setTaskPlan(task.id, links)}
              selectClassName="py-1 rounded"
            />
          )}
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-line px-6 gap-5 text-xs font-semibold shrink-0 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'checklist' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span>{parentTask ? 'Checklist' : 'Subtasks'}</span>
            {!parentTask && subtasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-mist text-ink-soft">
                {subtasks.filter(s => s.status === 'done').length}/{subtasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'progress' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'comments' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span>Comments</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-mist text-ink-soft">
              {task.comments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'attachments' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <span>Files</span>
            {task.attachments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-mist text-ink-soft">
                {task.attachments.length}
              </span>
            )}
          </button>
          {journey.length > 0 && (
            <button
              onClick={() => setActiveTab('journey')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'journey' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <span>Journey</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-mist text-ink-soft" title="Boards this card has been on">
                {journey.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="text-[10px] font-semibold text-muted uppercase">Title</label>
                <input
                  type="text"
                  value={task.title}
                  onChange={e => updateTask(task.id, { title: e.target.value })}
                  className="w-full text-base font-bold text-ink bg-transparent hover:bg-mist/30 focus:bg-paper-elevated px-2 py-1 rounded border border-transparent focus:border-line focus:ring-1 focus:ring-flash transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-semibold text-muted uppercase mb-1.5 block">Description</label>
                <textarea
                  rows={4}
                  value={task.description}
                  onChange={e => updateTask(task.id, { description: e.target.value })}
                  className="w-full text-sm text-ink-soft bg-paper border border-line rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-flash"
                  placeholder="Add a detailed description..."
                />
              </div>

              {/* Source Document Reference */}
              {task.sourceDocumentName && (
                <div className="p-3.5 rounded-xl bg-mist/30 border border-line space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-flash-deep" /> Source SRS Specification
                    </span>
                    {task.sourceSection && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-paper border border-line text-ink-soft">
                        {task.sourceSection}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-ink pt-0.5">
                    <FileText className="w-4 h-4 text-flash-deep shrink-0" />
                    <span className="truncate">{task.sourceDocumentName}</span>
                  </div>
                </div>
              )}

              {/* Acceptance Criteria */}
              {task.acceptanceCriteria && (
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                  <h4 className="text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700" /> Acceptance Criteria
                  </h4>
                  <p className="text-xs text-emerald-900 font-mono whitespace-pre-line leading-relaxed">{task.acceptanceCriteria}</p>
                </div>
              )}

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-line">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Sprint</span>
                  <span className="font-medium text-ink">{sprint?.name || 'Backlog (No Sprint)'}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Story Points</span>
                  <span className="font-medium text-ink">{task.storyPoints ? `${task.storyPoints} pts` : 'Unestimated'}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Reporter</span>
                  <span className="font-medium text-ink">{reporter?.name || 'Automated'}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Created</span>
                  <span className="font-medium text-ink">{formatDate(task.createdAt)}</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[10px] font-semibold text-muted uppercase mb-1.5 block">Labels</label>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-mist text-ink-soft font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Hierarchical Subtasks Section (one level: subtasks don't get their own) */}
              {!parentTask && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-line">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-flash-deep" />
                    Hierarchical Subtasks ({subtasks.length})
                  </h4>
                  <span className="text-xs text-muted">
                    {subtasks.filter(s => s.status === 'done').length} of {subtasks.length} done
                  </span>
                </div>

                {subtasks.length === 0 ? (
                  <p className="text-xs text-muted italic py-2">
                    No detailed subtasks created for this task yet. Add subtasks below to schedule granular work.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map(sub => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl border border-line bg-paper flex items-center justify-between gap-2 text-xs"
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          onClick={() => openTaskDrawer(sub.id)}
                        >
                          <span className="font-mono text-[10px] font-bold text-muted">{sub.key}</span>
                          <span className="font-semibold text-ink truncate hover:text-flash-deep">{sub.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-mist text-ink">
                            {formatDays(sub.estimatedDuration || 1, sub.durationUnit, sub.startDate)}
                          </span>
                          <SubtaskStateSelect
                            status={sub.status}
                            onChange={status => updateTask(sub.id, { status })}
                            aria-label={`State of ${sub.key}`}
                          />
                          <button
                            type="button"
                            onClick={() => deleteTask(sub.id)}
                            className="p-1 text-muted hover:text-danger rounded"
                            title="Delete subtask"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Subtask Form */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!newSubtaskTitle.trim()) {
                      notify('Type a name for the subtask first.', 'error');
                      return;
                    }
                    addTask({
                      title: newSubtaskTitle.trim(),
                      projectId: task.projectId,
                      parentId: task.id,
                      milestoneId: task.milestoneId,
                      estimatedDuration: newSubtaskDuration,
                      durationUnit: newSubtaskUnit,
                      status: 'todo',
                      priority: 'medium',
                      type: 'subtask',
                    });
                    notify(`Subtask "${newSubtaskTitle.trim()}" added to ${task.key}`);
                    setNewSubtaskTitle('');
                    setNewSubtaskDuration(2);
                    setNewSubtaskUnit('days');
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="New subtask title..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <EstimateField
                      days={newSubtaskDuration}
                      unit={newSubtaskUnit}
                      onChange={(days, unit) => {
                        setNewSubtaskDuration(days);
                        setNewSubtaskUnit(unit);
                      }}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-flash text-ink hover:bg-flash-deep hover:text-white transition-colors"
                    >
                      Add Subtask
                    </button>
                  </div>
                </form>
              </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-3 pt-3 border-t border-line">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Quick Checklist</h4>
                  <span className="text-xs text-muted">
                    {task.checklist ? `${task.checklist.filter(c => c.completed).length} of ${task.checklist.length} done` : '0 items'}
                  </span>
                </div>

                <div className="space-y-2">
                  {(task.checklist || []).map((item, idx) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-line bg-paper hover:bg-mist/40 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(idx)}
                        className="w-4 h-4 rounded text-flash-deep focus:ring-flash"
                      />
                      <span className={`text-xs flex-1 ${item.completed ? 'line-through text-muted' : 'text-ink font-medium'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>

                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    placeholder="Add checklist item..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {task.comments.length === 0 ? (
                  <p className="text-xs text-muted py-6 text-center">No comments yet. Start the conversation!</p>
                ) : (
                  task.comments.map(c => {
                    const author = users.find(u => u.id === c.authorId);
                    const onBoard = journey.length > 0 ? boardNameAt(journey, c.createdAt) : undefined;
                    return (
                      <div key={c.id} className="p-3 rounded-lg border border-line bg-paper space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-ink flex items-center gap-1.5">
                            {author?.name || 'Team Member'}
                            {onBoard && (
                              <span className="text-[9px] font-medium text-muted border border-line px-1.5 py-0.5 rounded-full">
                                {onBoard}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted">{formatRelative(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-ink-soft leading-relaxed">{c.body}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                <textarea
                  rows={2}
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full text-xs text-ink bg-paper border border-line rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-flash"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-flash text-ink hover:bg-flash-deep hover:text-white transition-colors"
                >
                  Post Comment
                </button>
              </form>
            </div>
          )}

          {/* Actual work against the plan, for the task and each subtask */}
          {activeTab === 'progress' && now !== null && <TaskProgress task={task} subtasks={subtasks} now={now} />}

          {/* The boards a card has been on (only when the project has more than one board) */}
          {activeTab === 'journey' && journey.length > 0 && (
            <TaskJourney stages={journey} boards={boards} />
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Attached Project Documents</h4>
              {task.attachments.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">No mock attachments linked to this task.</p>
              ) : (
                task.attachments.map(att => (
                  <div key={att} className="flex items-center justify-between p-3 rounded-lg border border-line bg-paper">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-flash-deep" />
                      <span className="text-xs font-medium text-ink">{att}</span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">Sample Spec</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="xs"
      >
        <div className="p-5 space-y-3">
          <h3 className="font-bold text-sm text-ink">Delete Task {task.key}?</h3>
          <p className="text-xs text-muted">
            Are you sure you want to permanently delete this task? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-xs text-muted hover:text-ink rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-semibold bg-danger text-white rounded hover:opacity-90 transition-opacity"
            >
              Delete Task
            </button>
          </div>
        </div>
      </Modal>
      {openSubtasksDialog}
    </div>
  </ClientPortal>
  );
}
