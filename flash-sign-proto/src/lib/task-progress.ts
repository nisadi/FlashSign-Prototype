import type { Task, TaskStatusChange, WorkSession } from '@/types';
import { sessionMinutes } from './agent-connection';

/**
 * What actually happened on a task, from its recorded moves and timers, to compare with the
 * plan (its start and due dates and estimate).
 */
export interface ActualSpan {
  /** First move to In Progress, or the first timer start */
  start?: string;
  /** When it reached In Review or Done; undefined while still open */
  end?: string;
  /** Calendar days from start to end (or to now) */
  days?: number;
  workedMinutes: number;
  /** Timer time per person, most first */
  workers: { userId: string; minutes: number }[];
  running: boolean;
}

export function actualSpan(task: Task, changes: TaskStatusChange[], sessions: WorkSession[], now: number): ActualSpan {
  const own = changes.filter(c => c.taskId === task.id).sort((a, b) => a.at.localeCompare(b.at));
  const ws = sessions.filter(w => w.taskId === task.id);
  const start = [...own.filter(c => c.to === 'in_progress').map(c => c.at), ...ws.map(w => w.startedAt)].sort()[0];

  let end: string | undefined;
  if (task.status === 'review' || task.status === 'done') {
    end = [...own].reverse().find(c => c.to === 'review' || c.to === 'done')?.at
      ?? ws.map(w => w.endedAt ?? '').filter(Boolean).sort().pop();
  }

  const byWorker = new Map<string, number>();
  let workedMinutes = 0;
  for (const w of ws) {
    const m = sessionMinutes(w.startedAt, w.endedAt, now);
    workedMinutes += m;
    byWorker.set(w.userId, (byWorker.get(w.userId) ?? 0) + m);
  }

  return {
    start,
    end,
    days: start ? Math.max(0, Math.floor(((end ? new Date(end).getTime() : now) - new Date(start).getTime()) / 86_400_000)) : undefined,
    workedMinutes,
    workers: [...byWorker.entries()].map(([userId, minutes]) => ({ userId, minutes })).sort((a, b) => b.minutes - a.minutes),
    running: ws.some(w => !w.endedAt),
  };
}
