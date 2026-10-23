'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Task } from '@/types';
import { ClientPortal } from '@/components/shared/modal';

interface ReassignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSuccess?: () => void;
}

export function ReassignTaskDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: ReassignTaskDialogProps) {
  const { users, reassignTask } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string>(task?.assigneeId || users[0]?.id || '');
  const [success, setSuccess] = useState(false);

  if (!open || !task) return null;

  const currentAssignee = users.find(u => u.id === task.assigneeId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    reassignTask(task.id, selectedUserId);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
      onSuccess?.();
    }, 600);
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-flash/20 flex items-center justify-center text-flash-deep">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-ink">Reassign Task</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleReassign} className="p-5 space-y-4 text-xs">
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>Task reassigned to {selectedUser?.name}! Workload metrics updated.</span>
            </div>
          )}

          {/* Task Info */}
          <div className="p-3 rounded-lg bg-paper border border-line">
            <p className="text-[10px] font-mono text-flash-deep font-semibold">{task.key}</p>
            <p className="text-xs font-semibold text-ink mt-0.5">{task.title}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
              <span>Points: <strong>{task.storyPoints || task.points || 3} pts</strong></span>
              <span>Priority: <strong className="capitalize">{task.priority}</strong></span>
              <span>Status: <strong className="capitalize">{task.status.replace('_', ' ')}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Current Assignee</label>
            <div className="p-2 rounded-lg bg-mist/30 border border-line flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: currentAssignee?.color || '#00c2a8' }}>
                {currentAssignee?.initials || 'UN'}
              </span>
              <span className="text-ink font-medium">{currentAssignee?.name || 'Unassigned'}</span>
              <span className="text-muted text-[11px] ml-auto">({currentAssignee?.title || 'Member'})</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1.5">New Assignee</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1.5 bg-paper rounded-lg border border-line">
              {users.map(u => {
                const isSelected = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors border ${
                      isSelected
                        ? 'bg-flash/10 border-flash/40 text-ink'
                        : 'bg-paper-elevated border-line/40 hover:bg-mist/30 text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: u.color }}>
                        {u.initials}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-medium text-ink truncate">{u.name}</p>
                        <p className="text-[10px] text-muted truncate">{u.title || u.role} · {u.department}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-flash-deep shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUserId === task.assigneeId}
              className="px-4 py-1.5 rounded-lg bg-flash hover:bg-flash-deep disabled:opacity-50 text-ink font-semibold shadow-xs transition-colors"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
