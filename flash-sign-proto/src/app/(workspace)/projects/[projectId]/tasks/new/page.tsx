'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Button, Card } from '@/components/shared/ui';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  User,
  Tag,
  CheckSquare,
  AlertCircle,
  Zap,
  Clock,
  Flag,
} from 'lucide-react';
import type { TaskPriority } from '@/types';
import { placeIn, projectBoards } from '@/lib/board-columns';
import { PlacementSelect } from '@/components/tasks/placement-select';
import { PlanPicker } from '@/components/plan/plan-picker';
import { projectStructure, taskLinksError } from '@/lib/structure';
import { TaskTimeFields, rangeError, type TaskTime } from '@/components/shared/duration-fields';
import { subtaskWindow, taskWindow } from '@/lib/schedule';
import type { PlanLinks } from '@/lib/plan';

export default function CreateTaskPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { projects, users, sprints, milestones, tasks, epics, stories, addTask } = useApp();

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));
  const projectSprints = sprints.filter((s) => s.projectId === projectId);
  const existingMainTasks = tasks.filter((t) => t.projectId === projectId && !t.parentId);
  const boards = projectBoards(project);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState({ boardId: boards[0].id, columnId: boards[0].columns[0].id });
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState(projectMembers[0]?.id || users[0]?.id || '');
  const [sprintId, setSprintId] = useState('');
  const [planLinks, setPlanLinks] = useState<PlanLinks>({});
  const structure = projectStructure(project);
  const [parentId, setParentId] = useState('');
  const [time, setTime] = useState<TaskTime>({ days: 3, unit: 'days', start: '', due: '' });
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>(['Frontend']);
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [errors, setErrors] = useState<{ title?: string; duration?: string; dates?: string; plan?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()]);
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (lbl: string) => {
    setLabels(labels.filter((l) => l !== lbl));
  };

  const handleAddChecklist = () => {
    if (newChecklistText.trim()) {
      setChecklists([...checklists, newChecklistText.trim()]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklists(checklists.filter((_, i) => i !== idx));
  };

  // The time the task may use: its parent task's (for a subtask), else its story, epic, phase or project
  const parentTask = parentId ? tasks.find((t) => t.id === parentId) : undefined;
  const planData = { project, milestones, epics, stories, tasks };
  const timeWindow = parentTask ? subtaskWindow(parentTask, planData) : taskWindow(planLinks, planData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; duration?: string; dates?: string; plan?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Task title is required.';
    }

    if (!time.days || time.days <= 0) {
      newErrors.duration = 'Estimated duration must be a positive number of days.';
    }

    const dateProblem = rangeError({ start: time.start, end: time.due }, timeWindow);
    if (dateProblem) newErrors.dates = `${dateProblem}.`;
    const planProblem = parentTask ? undefined : taskLinksError(planLinks, structure);
    if (planProblem) newErrors.plan = planProblem;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const checklistItems = checklists.map((item, index) => ({
      id: `chk-${Date.now()}-${index}`,
      text: item,
      completed: false,
    }));

    addTask({
      title: title.trim(),
      description: description.trim(),
      projectId,
      type: parentId ? 'subtask' : 'task',
      // A subtask lives inside its task's card, so it takes only the column's stage; a task is placed on a board
      ...(() => {
        const board = boards.find((b) => b.id === placement.boardId) ?? boards[0];
        const column = board.columns.find((c) => c.id === placement.columnId) ?? board.columns[0];
        return parentId ? { status: column.status } : placeIn(board, column);
      })(),
      priority,
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
      // A subtask is in its task's phase; a task goes where the plan picker says
      ...(parentTask ? { milestoneId: parentTask.milestoneId } : planLinks),
      parentId: parentId || undefined,
      estimatedDuration: time.days,
      durationUnit: time.unit,
      startDate: time.start || undefined,
      dueDate: time.due || undefined,
      labels,
      checklist: checklistItems,
    });

    notify(`${parentTask ? 'Subtask' : 'Task'} "${title.trim()}" created`);
    router.push(`/projects/${projectId}/tasks`);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="tasks" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 animate-fade-up space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">Create New Task</h1>
            <p className="text-xs text-muted">Add a new task to {project.name}</p>
          </div>
          <Link href={`/projects/${projectId}/tasks`}>
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Tasks
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Task Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. Implement responsive navigation bar"
                className={`w-full px-3.5 py-2.5 bg-paper text-sm rounded-xl border ${
                  errors.title ? 'border-danger ring-1 ring-danger' : 'border-line'
                } outline-none focus:border-flash transition-colors text-ink`}
              />
              {errors.title && (
                <p className="text-danger text-[11px] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide task context, requirements, acceptance criteria…"
                className="w-full px-3.5 py-2.5 bg-paper text-sm rounded-xl border border-line outline-none focus:border-flash transition-colors text-ink"
              />
            </div>

            {/* Status & Priority & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Initial Status</label>
                <PlacementSelect
                  boards={boards}
                  boardId={placement.boardId}
                  columnId={placement.columnId}
                  onChange={(b, c) => setPlacement({ boardId: b.id, columnId: c.id })}
                  aria-label="Initial status"
                  className="w-full px-3 py-2 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan: Phase → Epic → Story (a subtask follows its task) */}
            <div className="space-y-3">
              {structure.subtasks && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Parent Main Task (Optional — Makes this a Subtask)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                >
                  <option value="">None (This is a Main Task)</option>
                  {existingMainTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.key} - {t.title}
                    </option>
                  ))}
                </select>
              </div>
              )}
              {!parentTask && (
                <div>
                  <span className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-flash-deep" /> Plan
                  </span>
                  <PlanPicker
                    projectId={projectId}
                    value={planLinks}
                    onChange={(links) => {
                      setPlanLinks(links);
                      setErrors((prev) => ({ ...prev, plan: undefined }));
                    }}
                  />
                  {errors.plan && (
                    <p className="mt-1 text-danger text-[11px] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.plan}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Estimate & dates, inside the parent's time */}
            <div className="p-4 rounded-xl bg-mist/20 border border-line space-y-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                <Clock className="w-3.5 h-3.5 text-flash-deep" /> Time
              </span>
              <TaskTimeFields
                value={time}
                onChange={(t) => {
                  setTime(t);
                  setErrors((prev) => ({ ...prev, duration: undefined, dates: undefined }));
                }}
                window={timeWindow}
              />
              {errors.dates && (
                <p className="text-danger text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.dates}
                </p>
              )}
              <div className="sm:w-1/2">
                <label className="block text-xs font-semibold text-ink mb-1.5">Sprint (Optional)</label>
                <select
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="w-full px-3 py-2 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                >
                  <option value="">Backlog (No Sprint)</option>
                  {projectSprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Labels & Tags</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                  placeholder="Type a tag and press Add"
                  className="flex-1 px-3 py-1.5 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddLabel}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-mist text-muted rounded-lg text-xs font-mono"
                  >
                    {lbl}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(lbl)}
                      className="hover:text-danger"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Checklist Items */}
            <div className="pt-2 border-t border-line">
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Subtasks / Checklist Items
              </label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklist();
                    }
                  }}
                  placeholder="Add item, e.g. Write unit tests…"
                  className="flex-1 px-3 py-1.5 bg-paper text-xs rounded-xl border border-line outline-none focus:border-flash text-ink"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklist}>
                  Add Item
                </Button>
              </div>

              {checklists.length > 0 && (
                <div className="space-y-1.5">
                  {checklists.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-paper text-xs border border-line"
                    >
                      <span className="text-ink flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-muted" /> {item}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklist(idx)}
                        className="text-muted hover:text-danger p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/projects/${projectId}/tasks`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
