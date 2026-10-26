import type { AgentEvent, AgentSettings, Task, TaskStatusChange, WorkSession } from '@/types';
import { formatMinutes, sessionMinutes } from './agent-connection';

// ── Auto-stop rules ──────────────────────────────────────────────────────────
// A running timer stops on its own after the idle limit with no activity (ended at the last
// activity), or when the shift ends (ended at the cutoff). Both are flagged for the person to check.

type AutoStop = { triggerAt: number; endedAt: number; reason: 'idle_timeout' | 'day_cutoff' };

function shiftEnd(startedAt: string, dayCutoff: string): number {
  const [h, m] = dayCutoff.split(':').map(Number);
  const end = new Date(startedAt);
  end.setHours(h, m, 0, 0);
  // Started after the cutoff (working late): the shift ends at midnight
  if (end.getTime() <= new Date(startedAt).getTime()) {
    end.setHours(24, 0, 0, 0);
  }
  return end.getTime();
}

export function autoStopFor(w: WorkSession, settings: AgentSettings): AutoStop {
  const lastActivity = new Date(w.lastActivityAt).getTime();
  const idleAt = lastActivity + settings.idleTimeoutMinutes * 60_000;
  const cutoffAt = shiftEnd(w.startedAt, settings.dayCutoff);
  return idleAt <= cutoffAt
    ? { triggerAt: idleAt, endedAt: lastActivity, reason: 'idle_timeout' }
    : { triggerAt: cutoffAt, endedAt: cutoffAt, reason: 'day_cutoff' };
}

/** Stops every open session whose idle limit or shift end has passed. Returns null when nothing changed. */
export function applyAutoStops(
  sessions: WorkSession[],
  settings: AgentSettings,
  now: number
): { sessions: WorkSession[]; events: AgentEvent[] } | null {
  const events: AgentEvent[] = [];
  const next = sessions.map(w => {
    if (w.endedAt) return w;
    const stop = autoStopFor(w, settings);
    if (now < stop.triggerAt) return w;
    const endedAt = new Date(Math.max(stop.endedAt, new Date(w.startedAt).getTime())).toISOString();
    const detail = stop.reason === 'idle_timeout'
      ? `No activity for ${formatMinutes(settings.idleTimeoutMinutes)}, stopped at the last activity time. Please check.`
      : `Shift ended at ${settings.dayCutoff}, timer stopped. Please check.`;
    events.push({
      id: `ev-${now}-${w.id}`, userId: w.userId, taskId: w.taskId, agent: 'system',
      action: 'auto_stopped', detail, at: new Date(now).toISOString(),
    });
    return { ...w, endedAt, endReason: stop.reason, needsReview: true };
  });
  return events.length ? { sessions: next, events } : null;
}

// ── Task time (Reports > Task time) ──────────────────────────────────────────

export interface TaskTimeRow {
  task: Task;
  /** People who recorded time on it, most time first */
  workerIds: string[];
  /** First move to In Progress (or first timer start) */
  startedAt: string;
  /** Last move to In Review, or to Done when review was skipped; undefined while still being worked on */
  reviewAt?: string;
  /** Timer time: what the person actually worked, paused and auto-stopped gaps left out */
  workedMinutes: number;
  /** Calendar time from In Progress to In Review (or to now; or to when it was put back to To Do) */
  elapsedMinutes: number;
  sources: WorkSession['source'][];
  running: boolean;
  autoStops: number;
}

export function taskTimeRows(
  tasks: Task[],
  sessions: WorkSession[],
  changes: TaskStatusChange[],
  now: number
): TaskTimeRow[] {
  const sessionsByTask = new Map<string, WorkSession[]>();
  for (const w of sessions) sessionsByTask.set(w.taskId, [...(sessionsByTask.get(w.taskId) ?? []), w]);
  const changesByTask = new Map<string, TaskStatusChange[]>();
  for (const c of changes) changesByTask.set(c.taskId, [...(changesByTask.get(c.taskId) ?? []), c]);

  const rows: TaskTimeRow[] = [];
  for (const task of tasks) {
    const ws = sessionsByTask.get(task.id) ?? [];
    const cs = (changesByTask.get(task.id) ?? []).sort((a, b) => a.at.localeCompare(b.at));
    const starts = [
      ...cs.filter(c => c.to === 'in_progress').map(c => c.at),
      ...ws.map(w => w.startedAt),
    ].sort();
    if (starts.length === 0) continue;
    const startedAt = starts[0];

    let reviewAt: string | undefined;
    if (task.status === 'review' || task.status === 'done') {
      reviewAt = [...cs].reverse().find(c => c.to === 'review')?.at ?? cs.find(c => c.to === 'done')?.at;
      // Older data without a recorded move: the end of the last finished session
      reviewAt ??= ws.filter(w => w.endReason === 'finished').map(w => w.endedAt!).sort().pop();
    }
    // Put back (To Do / Blocked): the clock stopped when it left In Progress
    const leftAt = task.status === 'in_progress' || reviewAt
      ? undefined
      : [...cs].reverse().find(c => c.from === 'in_progress')?.at ?? ws.map(w => w.endedAt ?? '').sort().pop();

    const byWorker = new Map<string, number>();
    let workedMinutes = 0;
    for (const w of ws) {
      const m = sessionMinutes(w.startedAt, w.endedAt, now);
      workedMinutes += m;
      byWorker.set(w.userId, (byWorker.get(w.userId) ?? 0) + m);
    }
    const workerIds = [...byWorker.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    if (workerIds.length === 0 && task.assigneeId) workerIds.push(task.assigneeId);

    rows.push({
      task,
      workerIds,
      startedAt,
      reviewAt,
      workedMinutes,
      elapsedMinutes: sessionMinutes(startedAt, reviewAt ?? (leftAt || undefined), now),
      sources: [...new Set(ws.map(w => w.source))],
      running: ws.some(w => !w.endedAt),
      autoStops: ws.filter(w => w.endReason === 'idle_timeout' || w.endReason === 'day_cutoff').length,
    });
  }
  return rows;
}

/** "2d 3h" for long spans, "3h 20m" otherwise */
export function formatSpan(minutes: number): string {
  if (minutes < 24 * 60) return formatMinutes(minutes);
  const d = Math.floor(minutes / (24 * 60));
  const h = Math.floor((minutes % (24 * 60)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}
