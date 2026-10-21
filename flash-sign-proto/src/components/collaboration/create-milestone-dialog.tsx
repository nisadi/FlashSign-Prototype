'use client';

import React, { useState } from 'react';
import { X, Flag, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Milestone } from '@/types';

interface CreateMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneToEdit?: Milestone | null;
  onSuccess?: (m: Milestone) => void;
}

export function CreateMilestoneDialog({
  open,
  onOpenChange,
  milestoneToEdit,
  onSuccess,
}: CreateMilestoneDialogProps) {
  const { projects, users, tasks, addMilestone, updateMilestone, currentUserId } = useApp();

  const [name, setName] = useState(milestoneToEdit?.name || '');
  const [description, setDescription] = useState(milestoneToEdit?.description || '');
  const [projectId, setProjectId] = useState(milestoneToEdit?.projectId || projects[0]?.id || '');
  const [dueDate, setDueDate] = useState(milestoneToEdit?.dueDate || '2026-11-15');
  const [status, setStatus] = useState<Milestone['status']>(milestoneToEdit?.status || 'pending');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(milestoneToEdit?.taskIds || []);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a milestone name');
      return;
    }

    // calculate progress based on linked tasks
    let progress = 0;
    if (selectedTaskIds.length > 0) {
      const linked = tasks.filter(t => selectedTaskIds.includes(t.id));
      const done = linked.filter(t => t.status === 'done').length;
      progress = Math.round((done / linked.length) * 100);
    } else if (status === 'completed') {
      progress = 100;
    }

    if (milestoneToEdit) {
      updateMilestone(milestoneToEdit.id, {
        name: trimmedName,
        description: description.trim(),
        projectId,
        dueDate,
        status,
        progress,
        taskIds: selectedTaskIds,
      });
      setSuccessMsg('Milestone updated!');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...milestoneToEdit, name: trimmedName, progress });
      }, 700);
    } else {
      addMilestone({
        name: trimmedName,
        description: description.trim(),
        projectId,
        dueDate,
        status,
        progress,
        taskIds: selectedTaskIds,
      });
      setSuccessMsg('Milestone created!');
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-paper-elevated border border-line rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {milestoneToEdit ? 'Edit Milestone' : 'Create Milestone'}
              </h2>
              <p className="text-xs text-muted">
                Track critical goals, client deliverables, and project deadlines.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Milestone Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. SOC-2 Compliance Audit Sign-Off"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              required
            />
          </div>

          {/* Project & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Project</label>
              <select
                value={projectId}
                onChange={e => {
                  setProjectId(e.target.value);
                  setSelectedTaskIds([]);
                }}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold text-ink mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Milestone['status'])}
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-ink mb-1">Description / Definition of Done</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe requirements for marking this milestone complete..."
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Linked Tasks */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">
              Link Project Tasks ({selectedTaskIds.length} linked)
            </label>
            {projectTasks.length === 0 ? (
              <p className="text-muted italic py-2">No tasks created under this project yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
                {projectTasks.map(t => {
                  const isSelected = selectedTaskIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTask(t.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors border ${
                        isSelected
                          ? 'bg-flash/10 border-flash/40 text-ink'
                          : 'bg-paper-elevated border-line text-muted hover:text-ink'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-mono text-[10px] text-flash-deep mr-1.5 font-semibold">{t.key}</span>
                        <span className="font-medium text-xs text-ink">{t.title}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-flash-deep shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-semibold shadow-xs transition-colors"
            >
              {milestoneToEdit ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
