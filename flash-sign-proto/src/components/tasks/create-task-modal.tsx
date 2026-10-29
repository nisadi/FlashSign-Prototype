'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import type { TaskPriority, TaskStatus, TaskType } from '@/types';
import { Plus, AlertCircle, Calendar, Flag, User, Clock, CheckSquare } from 'lucide-react';
import { PlanPicker } from '@/components/plan/plan-picker';
import { projectStructure, taskLinksError } from '@/lib/structure';
import type { PlanLinks } from '@/lib/plan';
import {
  TaskTimeFields, SubtaskTimeFields, EffortField, daysFromDates, rangeError, type TaskTime,
} from '@/components/shared/duration-fields';
import { subtaskWindow, taskWindow } from '@/lib/schedule';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultMilestoneId?: string;
  /** Start the task inside this epic or story (the Plan tab's "Add task") */
  defaultEpicId?: string;
  defaultStoryId?: string;
  defaultParentId?: string; // If creating a subtask
  parentTaskTitle?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultMilestoneId,
  defaultEpicId,
  defaultStoryId,
  defaultParentId,
  parentTaskTitle,
}: CreateTaskModalProps) {
  const { users, addTask, tasks, projects, milestones, epics, stories } = useApp();

  const isSubtask = Boolean(defaultParentId);
  const projectUsers = users;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState<TaskTime>({ days: 5, unit: 'days', start: '', due: '' });
  // Planned hours of work; optional for tasks and subtasks
  const [effortMinutes, setEffortMinutes] = useState<number | undefined>(undefined);
  const [planLinks, setPlanLinks] = useState<PlanLinks>({});
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [errors, setErrors] = useState<{ title?: string; duration?: string; dates?: string; plan?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setTime({ days: isSubtask ? 2 : 5, unit: 'days', start: '', due: '' });
      setEffortMinutes(undefined);
      setPlanLinks({ milestoneId: defaultMilestoneId, epicId: defaultEpicId, storyId: defaultStoryId });
      setPriority('medium');
      setStatus('todo');
      setAssigneeId(projectUsers[0]?.id || '');
      setErrors({});
    }
  }, [isOpen, defaultMilestoneId, defaultEpicId, defaultStoryId, defaultParentId, isSubtask]);

  // The time the task may use: its parent task's (for a subtask), else its story, epic, phase or project
  const project = projects.find(p => p.id === projectId);
  const parentTask = defaultParentId ? tasks.find(t => t.id === defaultParentId) : undefined;
  const planData = project ? { project, milestones, epics, stories, tasks } : undefined;
  const timeWindow = planData ? (parentTask ? subtaskWindow(parentTask, planData) : taskWindow(planLinks, planData)) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; duration?: string; dates?: string; plan?: string } = {};

    if (!title.trim()) {
      newErrors.title = isSubtask ? 'Subtask title is required.' : 'Task title is required.';
    }

    if (!isSubtask && (!time.days || time.days <= 0)) {
      newErrors.duration = 'Estimated duration must be at least 1 day.';
    }

    const dateProblem = rangeError({ start: time.start, end: time.due }, timeWindow);
    if (dateProblem) newErrors.dates = `${dateProblem}.`;
    const planProblem = !isSubtask && project ? taskLinksError(planLinks, projectStructure(project)) : undefined;
    if (planProblem) newErrors.plan = planProblem;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // A subtask is in its task's phase
    const parentMilestoneId = isSubtask ? tasks.find(t => t.id === defaultParentId)?.milestoneId : undefined;

    addTask({
      title: title.trim(),
      description: description.trim(), // Optional!
      projectId,
      type: isSubtask ? ('subtask' as TaskType) : ('task' as TaskType),
      status,
      priority,
      assigneeId: assigneeId || undefined,
      parentId: defaultParentId || undefined,
      // A subtask follows its task; a task goes where the plan picker says
      ...(isSubtask ? { milestoneId: parentMilestoneId } : planLinks),
      // A subtask's length comes from its dates (it has hours instead of a day estimate)
      estimatedDuration: isSubtask ? daysFromDates(time.start, time.due) : time.days,
      durationUnit: isSubtask ? undefined : time.unit,
      effortMinutes,
      startDate: time.start || undefined,
      dueDate: time.due || undefined,
    });

    notify(`${isSubtask ? 'Subtask' : 'Task'} "${title.trim()}" created`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-flash/10 text-flash-deep flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">
              {isSubtask ? 'Add Subtask' : 'Create Main Task'}
            </h2>
            <p className="text-xs text-muted">
              {isSubtask && parentTaskTitle ? (
                <>
                  Nested subtask under <strong className="text-ink">{parentTaskTitle}</strong>
                </>
              ) : (
                'Configure a planned work item with duration and milestone tracking.'
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              {isSubtask ? 'Subtask Title' : 'Task Title'} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder={isSubtask ? 'e.g. Implement input validation and error states' : 'e.g. Design responsive signature placement canvas'}
              className={`w-full px-3 py-2 text-xs bg-paper border ${
                errors.title ? 'border-danger ring-1 ring-danger' : 'border-line'
              } rounded-xl outline-none focus:border-flash text-ink`}
            />
            {errors.title && (
              <p className="text-danger text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Description (OPTIONAL) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-ink">Description</label>
              <span className="text-[10px] text-muted font-normal">(Optional)</span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Outline technical requirements, scope, or acceptance criteria…"
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
            />
          </div>

          {/* Where the task sits in the plan (for main tasks; every level is optional) */}
          {!isSubtask && (
            <div>
              <span className="block text-xs font-semibold text-ink mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-flash-deep" /> Plan
              </span>
              <PlanPicker projectId={projectId} value={planLinks} onChange={links => { setPlanLinks(links); setErrors(prev => ({ ...prev, plan: undefined })); }} />
              {errors.plan && (
                <p className="mt-1 text-danger text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.plan}
                </p>
              )}
            </div>
          )}

          {/* Estimate & dates, inside the parent's time */}
          <div className="p-3 bg-mist/20 rounded-xl border border-line space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ink">
              <Clock className="w-3 h-3 text-flash-deep" /> Time
            </span>
            {isSubtask ? (
              <SubtaskTimeFields
                value={{ effortMinutes, start: time.start, due: time.due }}
                onChange={t => {
                  setEffortMinutes(t.effortMinutes);
                  setTime(prev => ({ ...prev, start: t.start, due: t.due }));
                  setErrors(prev => ({ ...prev, dates: undefined }));
                }}
                window={timeWindow}
              />
            ) : (
              <>
                <TaskTimeFields value={time} onChange={t => { setTime(t); setErrors(prev => ({ ...prev, duration: undefined, dates: undefined })); }} window={timeWindow} />
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-ink">Effort (optional)</span>
                  <EffortField minutes={effortMinutes} onChange={setEffortMinutes} />
                  <span className="text-[11px] text-muted">planned hours of work, compared with the hours logged</span>
                </div>
              </>
            )}
            {errors.dates && (
              <p className="text-danger text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.dates}
              </p>
            )}
          </div>

          {/* Status, Priority, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink"
              >
                <option value="">Unassigned</option>
                {projectUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Plus}>
              {isSubtask ? 'Add Subtask' : 'Save Task'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
