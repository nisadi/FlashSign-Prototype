'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { formatDate } from '@/lib/utils';
import {
  Flag,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckSquare,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { Milestone, Task } from '@/types';
import { Modal } from '@/components/shared/modal';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { ConfirmDeleteModal } from '@/components/shared/confirm-delete-modal';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';

export default function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const {
    projects,
    milestones,
    tasks,
    users,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    openTaskDrawer,
    deleteTask,
    updateTask,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

  // Milestone Form State (Create / Edit)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Task creation inside milestone
  const [taskModalMilestoneId, setTaskModalMilestoneId] = useState<string | null>(null);

  // Expanded milestones state
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Record<string, boolean>>({});

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectMilestones = milestones.filter((m) => m.projectId === projectId);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const filteredMilestones = projectMilestones.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const toggleExpandMilestone = (mId: string) => {
    setExpandedMilestoneIds((prev) => ({
      ...prev,
      [mId]: prev[mId] === undefined ? true : !prev[mId],
    }));
  };

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setStartDate(project.startDate ? project.startDate.split('T')[0] : '');
    setEndDate(project.endDate ? project.endDate.split('T')[0] : '');
    setEditingMilestone(null);
    setShowCreateModal(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    setName(m.name);
    setDescription(m.description || '');
    setStartDate(m.startDate || '');
    setEndDate(m.endDate || m.dueDate || '');
    setShowCreateModal(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMilestone) {
      updateMilestone(editingMilestone.id, {
        name: name.trim(),
        description: description.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        dueDate: endDate || editingMilestone.dueDate,
      });
    } else {
      addMilestone({
        name: name.trim(),
        description: description.trim(),
        projectId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        dueDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'pending',
        taskIds: [],
      });
    }

    setShowCreateModal(false);
  };

  const handleToggleComplete = (m: Milestone) => {
    const newStatus = m.status === 'achieved' ? 'pending' : 'achieved';
    updateMilestone(m.id, { status: newStatus });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="milestones" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Flag className="w-5 h-5 text-flash-deep" /> Project Milestones & Epics
            </h1>
            <p className="text-xs text-muted">
              Strategic delivery markers and parent epics for {project.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Milestones ({projectMilestones.length})</option>
              <option value="pending">Pending</option>
              <option value="achieved">Achieved</option>
              <option value="missed">Missed</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openCreateModal}
            >
              New Milestone / Epic
            </Button>
          </div>
        </div>

        {/* Create / Edit Milestone Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Flag className="w-4 h-4 text-flash-deep" />
              <h2 className="text-base font-bold text-ink">
                {editingMilestone ? 'Edit Milestone / Epic' : 'Create Milestone / Epic'}
              </h2>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Milestone / Epic Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beta Client Testing Release or Core Architecture Epic"
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-ink">Description</label>
                  <span className="text-[10px] text-muted font-normal">(Optional)</span>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key strategic deliverables, acceptance gates, and scope…"
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-mist/20 rounded-xl border border-line">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-ink">Start Date</label>
                    <span className="text-[10px] text-muted font-normal">(Optional)</span>
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-ink">Target End Date</label>
                    <span className="text-[10px] text-muted font-normal">(Optional)</span>
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingMilestone ? 'Save Changes' : 'Save Milestone'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Delete Milestone Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={Boolean(deletingMilestoneId)}
          onClose={() => setDeletingMilestoneId(null)}
          onConfirm={() => {
            if (deletingMilestoneId) {
              deleteMilestone(deletingMilestoneId);
              setDeletingMilestoneId(null);
            }
          }}
          title="Delete Milestone"
          message="Are you sure you want to delete this milestone? Any associated tasks will be unlinked and retained in the project backlog."
          confirmLabel="Delete Milestone"
        />

        {/* Modal to add Main Task to a Milestone */}
        {taskModalMilestoneId && (
          <CreateTaskModal
            isOpen={Boolean(taskModalMilestoneId)}
            onClose={() => setTaskModalMilestoneId(null)}
            projectId={projectId}
            defaultMilestoneId={taskModalMilestoneId}
          />
        )}

        {/* Milestone Cards List */}
        {filteredMilestones.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No milestones or epics found"
            description="Create milestone markers to track project deliverables, dates, and nested main tasks."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={openCreateModal}
              >
                Create Milestone / Epic
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredMilestones.map((m) => {
              // Find main tasks belonging to this milestone (either via milestoneId or m.taskIds)
              const milestoneMainTasks = projectTasks.filter(
                (t) => (t.milestoneId === m.id || m.taskIds?.includes(t.id)) && !t.parentId
              );
              // Find all subtasks belonging to these main tasks
              const milestoneSubtasks = projectTasks.filter(
                (t) => t.parentId && milestoneMainTasks.some((mt) => mt.id === t.parentId)
              );

              const allAssociatedTasks = [...milestoneMainTasks, ...milestoneSubtasks];
              const completedTasks = allAssociatedTasks.filter((t) => t.status === 'done');
              const progressPct = allAssociatedTasks.length > 0
                ? Math.round((completedTasks.length / allAssociatedTasks.length) * 100)
                : m.status === 'achieved'
                ? 100
                : 0;

              const totalWorkEffort = milestoneMainTasks.reduce((sum, mt) => {
                const subs = milestoneSubtasks.filter((st) => st.parentId === mt.id);
                if (subs.length > 0) {
                  return sum + subs.reduce((subSum, s) => subSum + (s.estimatedDuration || s.points || 1), 0);
                }
                return sum + (mt.estimatedDuration || mt.points || 3);
              }, 0);

              const isExpanded = expandedMilestoneIds[m.id] ?? true;

              return (
                <Card key={m.id} className="p-5 space-y-4 hover:border-flash/30 transition-all">
                  {/* Milestone Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                            m.status === 'achieved'
                              ? 'bg-flash/15 text-flash-deep'
                              : m.status === 'missed'
                              ? 'bg-danger/15 text-danger'
                              : 'bg-mist text-muted'
                          }`}
                        >
                          {m.status}
                        </span>
                        <h3 className="text-base font-bold text-ink flex items-center gap-2">
                          {m.name}
                        </h3>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted leading-relaxed">{m.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={m.status === 'achieved' ? 'secondary' : 'primary'}
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleToggleComplete(m)}
                      >
                        {m.status === 'achieved' ? 'Mark Pending' : 'Mark Achieved'}
                      </Button>
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-mist/40 transition-colors"
                        title="Edit Milestone"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMilestoneId(m.id)}
                        className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-line text-xs">
                    <div>
                      <span className="text-muted block text-[11px]">Start Date</span>
                      <span className="font-medium text-ink font-mono">
                        {m.startDate ? formatDate(m.startDate) : 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px]">Target End Date</span>
                      <span className="font-medium text-ink font-mono">
                        {m.endDate || m.dueDate ? formatDate(m.endDate || m.dueDate) : 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px]">Main Tasks / Subtasks</span>
                      <span className="font-medium text-ink">
                        <strong>{milestoneMainTasks.length}</strong> main ({milestoneSubtasks.length} subtasks)
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px]">Estimated Work</span>
                      <span className="font-medium text-ink font-mono">
                        {totalWorkEffort} person-days
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Completion Progress</span>
                      <span className="font-mono font-bold text-ink">{progressPct}%</span>
                    </div>
                    <ProgressBar value={progressPct} color="var(--flash)" className="h-2" />
                  </div>

                  {/* Accordion Toggle for Main Tasks inside this milestone */}
                  <div className="pt-2 border-t border-line">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleExpandMilestone(m.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-flash-deep transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>
                          Main Tasks inside this Milestone ({milestoneMainTasks.length})
                        </span>
                      </button>

                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Plus}
                        onClick={() => setTaskModalMilestoneId(m.id)}
                      >
                        Add Main Task
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {milestoneMainTasks.length === 0 ? (
                          <p className="text-xs text-muted italic py-3 text-center bg-paper rounded-xl border border-line/60">
                            No main tasks linked to this milestone yet. Click "Add Main Task" above to add one.
                          </p>
                        ) : (
                          milestoneMainTasks.map((task) => {
                            const subtasks = milestoneSubtasks.filter((s) => s.parentId === task.id);
                            const assignee = users.find((u) => u.id === task.assigneeId);

                            return (
                              <div
                                key={task.id}
                                className="p-3 bg-paper rounded-xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-flash/30 transition-colors"
                              >
                                <div
                                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                                  onClick={() => openTaskDrawer(task.id)}
                                >
                                  <span className="font-mono font-bold text-[11px] text-muted shrink-0">
                                    {task.key}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-ink truncate">{task.title}</p>
                                    {task.description && (
                                      <p className="text-[11px] text-muted truncate max-w-md">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {subtasks.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-mist text-ink-soft font-mono">
                                      {subtasks.length} subtasks
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded bg-paper-elevated border border-line text-[10px] font-mono text-muted flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-flash-deep" />
                                    {task.estimatedDuration || 3}d
                                  </span>
                                  <PriorityBadge priority={task.priority} />
                                  <TaskStatusBadge status={task.status} />
                                  {assignee && <Avatar user={assignee} size="xs" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
