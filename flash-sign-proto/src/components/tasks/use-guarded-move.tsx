'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import { openSubtasks, subtasksOf } from '@/lib/subtasks';
import type { Task } from '@/types';

/**
 * Moves a task, but asks first when it would go to Done while some of its subtasks are
 * still open: move them to Done too, move only the task, or cancel.
 */
export function useGuardedMove() {
  const { tasks, updateTask } = useApp();
  const [pending, setPending] = useState<{ task: Task; updates: Partial<Task>; open: Task[] } | null>(null);

  const move = (task: Task, updates: Partial<Task>) => {
    const open = openSubtasks(subtasksOf(task.id, tasks));
    if (updates.status === 'done' && task.status !== 'done' && open.length > 0) {
      setPending({ task, updates, open });
      return;
    }
    updateTask(task.id, updates);
  };

  const finish = (withSubtasks: boolean) => {
    if (!pending) return;
    if (withSubtasks) pending.open.forEach(sub => updateTask(sub.id, { status: 'done' }));
    updateTask(pending.task.id, pending.updates);
    setPending(null);
  };

  const dialog = pending && (
    <Modal isOpen onClose={() => setPending(null)} size="sm" aria-labelledby="open-subtasks-title">
      <ModalHeader
        id="open-subtasks-title"
        title={`${pending.open.length} subtask${pending.open.length === 1 ? ' is' : 's are'} still open`}
        description={`${pending.task.key} is moving to Done.`}
        icon={AlertTriangle}
        onClose={() => setPending(null)}
      />
      <ModalBody className="space-y-1.5">
        {pending.open.map(sub => (
          <p key={sub.id} className="text-xs text-ink-soft">
            <span className="font-mono text-[10px] text-muted mr-1.5">{sub.key}</span>
            {sub.title}
          </p>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => finish(false)}>
            Only move the task
          </Button>
          <Button variant="primary" size="sm" onClick={() => finish(true)}>
            Move subtasks to Done too
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );

  return { move, dialog };
}
