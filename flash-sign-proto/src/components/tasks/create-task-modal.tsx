'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import type { TaskPriority, TaskStatus, TaskType } from '@/types';
import { Plus, AlertCircle, Calendar, Flag, User, Clock, CheckSquare } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultMilestoneId?: string;
  defaultParentId?: string; // If creating a subtask
  parentTaskTitle?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultMilestoneId,
  defaultParentId,
  parentTaskTitle,
}: CreateTaskModalProps) {
  const { milestones, users, addTask, tasks } = useApp();

  const isSubtask = Boolean(defaultParentId);
  const projectMilestones = milestones.filter(m => m.projectId === projectId);
  const projectUsers = users;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(3);
  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId || '');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [errors, setErrors] = useState<{ title?: string; duration?: string; dates?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setEstimatedDuration(isSubtask ? 2 : 5);
      setMilestoneId(defaultMilestoneId || projectMilestones[0]?.id || '');
      setStartDate('');
      setDueDate('');
      setPriority('medium');
      setStatus('todo');
      setAssigneeId(projectUsers[0]?.id || '');
      setErrors({});
    }
  }, [isOpen, defaultMilestoneId, defaultParentId, isSubtask]);

  // If start date and duration are provided, sync due date
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && estimatedDuration > 0 && !dueDate) {
      const d = new Date(val);
      d.setDate(d.getDate() + estimatedDuration);
      setDueDate(d.toISOString().split('T')[0]);
    }
  };

  const handleDurationChange = (val: number) => {
    setEstimatedDuration(val);
    if (startDate && val > 0) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + val);
      setDueDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; duration?: string; dates?: string } = {};

    if (!title.trim()) {
      newErrors.title = isSubtask ? 'Subtask title is required.' : 'Task title is required.';
    }

    if (!estimatedDuration || estimatedDuration <= 0) {
      newErrors.duration = 'Estimated duration must be at least 1 day.';
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      newErrors.dates = 'Due date cannot precede start date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine milestone: if subtask, inherit milestone from parent task if not provided
    let effectiveMilestoneId = milestoneId;
    if (isSubtask && !effectiveMilestoneId && defaultParentId) {
      const parent = tasks.find(t => t.id === defaultParentId);
      effectiveMilestoneId = parent?.milestoneId || '';
    }

    addTask({
      title: title.trim(),
      description: description.trim(), // Optional!
      projectId,
      type: isSubtask ? ('subtask' as TaskType) : ('task' as TaskType),
      status,
      priority,
      assigneeId: assigneeId || undefined,
      parentId: defaultParentId || undefined,
      milestoneId: effectiveMilestoneId || undefined,
      estimatedDuration: Number(estimatedDuration),
      points: Number(estimatedDuration),
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    });

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

          {/* Parent Milestone (For Main Tasks) */}
          {!isSubtask && projectMilestones.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-flash-deep" /> Milestone / Epic Association
              </label>
              <select
                value={milestoneId}
                onChange={e => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              >
                <option value="">No Milestone / Backlog</option>
                {projectMilestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duration & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-mist/20 rounded-xl border border-line">
            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-flash-deep" />
                Duration (Days) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={estimatedDuration || ''}
                onChange={e => handleDurationChange(parseInt(e.target.value, 10) || 1)}
                className={`w-full px-2.5 py-1.5 text-xs bg-paper border font-mono ${
                  errors.duration ? 'border-danger' : 'border-line'
                } rounded-lg outline-none focus:border-flash text-ink`}
              />
              {errors.duration && <p className="text-danger text-[10px] mt-1">{errors.duration}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink font-mono"
              />
            </div>
            {errors.dates && (
              <p className="col-span-3 text-danger text-[11px] flex items-center gap-1">
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
