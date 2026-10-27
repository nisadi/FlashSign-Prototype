'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Button, Card, EmptyState } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import { placeIn, placementOf, projectBoards } from '@/lib/board-columns';
import { PlacementSelect } from '@/components/tasks/placement-select';
import {
  Plus,
  Search,
  CheckSquare,
  ArrowUpDown,
  Filter,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Flag,
  CornerDownRight,
  Edit2,
  Calendar,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { ConfirmDeleteModal } from '@/components/shared/confirm-delete-modal';
import { Modal } from '@/components/shared/modal';

export default function ProjectTasksListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const {
    projects,
    tasks,
    users,
    milestones,
    openTaskDrawer,
    updateTask,
    deleteTask,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [expandedMainTaskIds, setExpandedMainTaskIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isCreateMainModalOpen, setIsCreateMainModalOpen] = useState(false);
  const [subtaskParentTask, setSubtaskParentTask] = useState<Task | null>(null);

  // Deletion state
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Quick edit duration modal
  const [editingDurationTask, setEditingDurationTask] = useState<Task | null>(null);
  const [newDurationVal, setNewDurationVal] = useState<number>(1);

  const project =
    projects.find((p) => p.id === projectId) ||
    (projectId === 'p-mvhmnblw' ? projects.find((p) => p.id === 'p1') : undefined);
  if (!project) return notFound();

  const effectiveId =
    projectId === 'p-mvhmnblw' && !tasks.some((t) => t.projectId === 'p-mvhmnblw')
      ? 'p1'
      : projectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId || t.projectId === effectiveId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId || m.projectId === effectiveId);
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));
  const boards = projectBoards(project);

  // Separate Main Tasks (no parentId) from Subtasks
  const mainTasks = useMemo(() => {
    return projectTasks.filter((t) => !t.parentId);
  }, [projectTasks]);

  const toggleExpand = (mainTaskId: string) => {
    setExpandedMainTaskIds((prev) => ({
      ...prev,
      [mainTaskId]: prev[mainTaskId] === undefined ? true : !prev[mainTaskId],
    }));
  };

  // Filtered Main Tasks
  const filteredMainTasks = useMemo(() => {
    return mainTasks.filter((t) => {
      const subtasks = projectTasks.filter((st) => st.parentId === t.id);
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        subtasks.some((s) => s.title.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchMilestone = milestoneFilter === 'all' || t.milestoneId === milestoneFilter;
      const matchAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;

      return matchSearch && matchStatus && matchPriority && matchMilestone && matchAssignee;
    });
  }, [mainTasks, projectTasks, search, statusFilter, priorityFilter, milestoneFilter, assigneeFilter]);

  const openDurationModal = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDurationTask(task);
    setNewDurationVal(task.estimatedDuration || task.points || 3);
  };

  const handleSaveDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDurationTask && newDurationVal > 0) {
      updateTask(editingDurationTask.id, {
        estimatedDuration: Number(newDurationVal),
        points: Number(newDurationVal),
      });
      setEditingDurationTask(null);
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="tasks" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Hierarchy Information Banner */}
        <div className="p-3.5 bg-paper-elevated border border-line rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-flash-deep" />
              Task Hierarchy:
            </span>
            <div className="flex items-center gap-1.5 font-medium text-muted flex-wrap">
              <span className="px-2 py-0.5 rounded bg-mist/60 text-ink-soft">Project</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-mist/60 text-ink-soft flex items-center gap-1">
                <Flag className="w-3 h-3 text-flash-deep" /> Milestones / Epics
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-mist/60 text-ink-soft font-semibold text-ink">
                Main Tasks
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-flash-deep border border-emerald-200 font-semibold">
                Subtasks
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateMainModalOpen(true)}
          >
            Create Main Task
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-paper-elevated border border-line p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search main tasks or subtasks by title, key, keyword…"
                className="w-full pl-9 pr-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash transition-colors text-ink"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
            <span className="text-muted text-[11px] font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Milestone filter */}
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Milestones / Epics</option>
              {projectMilestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Assignees</option>
              {projectMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hierarchical Tasks Tree / Accordion List */}
        {filteredMainTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description="Create main tasks under your project milestones, and break them down into subtasks."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsCreateMainModalOpen(true)}
              >
                Create Main Task
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredMainTasks.map((mainTask) => {
              const subtasks = projectTasks.filter((t) => t.parentId === mainTask.id);
              const milestone = projectMilestones.find((m) => m.id === mainTask.milestoneId);
              const assignee = users.find((u) => u.id === mainTask.assigneeId);
              const isExpanded = expandedMainTaskIds[mainTask.id] ?? true;

              // Calculate main task effective work days
              const effectiveDuration = subtasks.length > 0
                ? subtasks.reduce((sum, s) => sum + (s.estimatedDuration || s.points || 1), 0)
                : mainTask.estimatedDuration || mainTask.points || 3;

              return (
                <div
                  key={mainTask.id}
                  className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs hover:border-flash/30 transition-all"
                >
                  {/* Main Task Header Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper-elevated">
                    {/* Left: Expand toggle, key, title, description */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(mainTask.id)}
                        className="p-1 rounded-md hover:bg-mist/60 text-muted hover:text-ink transition-colors mt-0.5"
                        title={isExpanded ? 'Collapse Subtasks' : 'Expand Subtasks'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-ink" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-ink" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-muted px-2 py-0.5 rounded bg-paper border border-line">
                            {mainTask.key}
                          </span>
                          <span
                            onClick={() => openTaskDrawer(mainTask.id)}
                            className="font-bold text-sm text-ink hover:text-flash-deep cursor-pointer truncate"
                          >
                            {mainTask.title}
                          </span>

                          {milestone && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-mist/50 text-ink-soft border border-line">
                              <Flag className="w-2.5 h-2.5 text-flash-deep" />
                              {milestone.name}
                            </span>
                          )}

                          {subtasks.length > 0 && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {subtasks.filter(s => s.status === 'done').length}/{subtasks.length} subtasks done
                            </span>
                          )}
                        </div>

                        {mainTask.description && (
                          <p className="text-xs text-muted leading-relaxed truncate max-w-2xl">
                            {mainTask.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Dates, Estimated Duration with quick edit, Priority, Status, Assignee, Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Dates */}
                      {(mainTask.startDate || mainTask.dueDate) && (
                        <div className="text-[11px] font-mono text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted" />
                          <span>
                            {mainTask.startDate ? formatDate(mainTask.startDate) : ''}
                            {mainTask.startDate && mainTask.dueDate ? ' → ' : ''}
                            {mainTask.dueDate ? formatDate(mainTask.dueDate) : ''}
                          </span>
                        </div>
                      )}

                      {/* Estimated Duration pill (clickable for quick edit!) */}
                      <button
                        type="button"
                        onClick={(e) => openDurationModal(mainTask, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-mist/40 hover:bg-mist text-ink text-xs font-mono font-semibold border border-line transition-all group"
                        title={
                          subtasks.length > 0
                            ? `Derived from ${subtasks.length} subtasks (${effectiveDuration} days). Click to view/edit.`
                            : 'Click to update estimated duration'
                        }
                      >
                        <Clock className="w-3 h-3 text-flash-deep" />
                        <span>{effectiveDuration} days</span>
                        {subtasks.length > 0 && (
                          <span className="text-[9px] text-muted italic">(derived)</span>
                        )}
                        <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-muted" />
                      </button>

                      <PriorityBadge priority={mainTask.priority} />
                      <TaskStatusBadge status={mainTask.status} />

                      {assignee && <Avatar user={assignee} size="xs" />}

                      {/* Add Subtask Button */}
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Plus}
                        onClick={() => setSubtaskParentTask(mainTask)}
                        title="Add nested subtask"
                      >
                        Add Subtask
                      </Button>

                      {/* Delete Main Task */}
                      <button
                        type="button"
                        onClick={() => setDeletingTask(mainTask)}
                        className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                        title="Delete Main Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nested Subtasks List */}
                  {isExpanded && (
                    <div className="border-t border-line/60 bg-paper/60 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted font-semibold uppercase tracking-wider pl-6 pb-1">
                        <span>Subtask Breakdown ({subtasks.length})</span>
                        {subtasks.length > 0 && (
                          <span className="italic normal-case font-normal text-[10px]">
                            * Subtasks define detailed work and derive the parent task schedule without double-counting.
                          </span>
                        )}
                      </div>

                      {subtasks.length === 0 ? (
                        <div className="pl-6 py-2 text-xs text-muted flex items-center justify-between">
                          <span className="italic">No subtasks added yet. Add subtasks to break down this work.</span>
                          <button
                            type="button"
                            onClick={() => setSubtaskParentTask(mainTask)}
                            className="text-flash-deep font-semibold hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add first subtask
                          </button>
                        </div>
                      ) : (
                        subtasks.map((subtask) => {
                          const subAssignee = users.find((u) => u.id === subtask.assigneeId);

                          return (
                            <div
                              key={subtask.id}
                              className="pl-6 pr-3 py-2.5 rounded-xl bg-paper-elevated border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-flash/30 transition-colors group"
                            >
                              {/* Subtask Info */}
                              <div
                                className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer"
                                onClick={() => openTaskDrawer(subtask.id)}
                              >
                                <CornerDownRight className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                                <span className="font-mono text-[11px] font-bold text-muted shrink-0">
                                  {subtask.key}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-ink truncate group-hover:text-flash-deep transition-colors">
                                    {subtask.title}
                                  </p>
                                  {subtask.description && (
                                    <p className="text-[11px] text-muted truncate max-w-md">
                                      {subtask.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Subtask Duration & Attributes */}
                              <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                                {(subtask.startDate || subtask.dueDate) && (
                                  <span className="text-[10px] font-mono text-muted">
                                    {subtask.startDate ? formatDate(subtask.startDate) : ''}
                                    {subtask.startDate && subtask.dueDate ? ' → ' : ''}
                                    {subtask.dueDate ? formatDate(subtask.dueDate) : ''}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => openDurationModal(subtask, e)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mist/30 hover:bg-mist text-ink text-[11px] font-mono border border-line"
                                  title="Click to update subtask duration"
                                >
                                  <Clock className="w-2.5 h-2.5 text-flash-deep" />
                                  <span>{subtask.estimatedDuration || 1}d</span>
                                  <Edit2 className="w-2 h-2 text-muted" />
                                </button>

                                <PriorityBadge priority={subtask.priority} />
                                <TaskStatusBadge status={subtask.status} />

                                {subAssignee && <Avatar user={subAssignee} size="xs" />}

                                <button
                                  type="button"
                                  onClick={() => setDeletingTask(subtask)}
                                  className="p-1 text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                                  title="Delete Subtask"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Main Task */}
        <CreateTaskModal
          isOpen={isCreateMainModalOpen}
          onClose={() => setIsCreateMainModalOpen(false)}
          projectId={projectId}
        />

        {/* Modal: Create Subtask */}
        {subtaskParentTask && (
          <CreateTaskModal
            isOpen={Boolean(subtaskParentTask)}
            onClose={() => setSubtaskParentTask(null)}
            projectId={projectId}
            defaultParentId={subtaskParentTask.id}
            parentTaskTitle={subtaskParentTask.title}
            defaultMilestoneId={subtaskParentTask.milestoneId}
          />
        )}

        {/* Modal: Quick Edit Duration (Tests Dynamic Timeline Recalculation!) */}
        <Modal
          isOpen={Boolean(editingDurationTask)}
          onClose={() => setEditingDurationTask(null)}
          size="sm"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Clock className="w-4 h-4 text-flash-deep" />
              <h3 className="text-base font-bold text-ink">
                Update Estimated Duration
              </h3>
            </div>

            <p className="text-xs text-muted">
              Adjust duration for <strong className="text-ink">{editingDurationTask?.title}</strong>.
              Updating this duration will immediately recalculate the planned timeline while preserving the original baseline.
            </p>

            <form onSubmit={handleSaveDuration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Estimated Duration (Calendar / Work Days) <span className="text-danger">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newDurationVal}
                    onChange={(e) => setNewDurationVal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                  <span className="text-xs text-muted font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingDurationTask(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save & Recalculate Timeline
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal: Confirm Delete */}
        <ConfirmDeleteModal
          isOpen={Boolean(deletingTask)}
          onClose={() => setDeletingTask(null)}
          onConfirm={() => {
            if (deletingTask) {
              deleteTask(deletingTask.id);
              setDeletingTask(null);
            }
          }}
          title={deletingTask?.parentId ? 'Delete Subtask' : 'Delete Main Task'}
          message={
            deletingTask?.parentId
              ? `Are you sure you want to delete subtask "${deletingTask?.title}"? The parent task schedule and project timeline will be recalculated.`
              : `Are you sure you want to delete "${deletingTask?.title}"? Deleting this main task will also remove all its nested subtasks and recalculate the project timeline.`
          }
          confirmLabel="Delete"
        />
      </div>
    </div>
  );
}
