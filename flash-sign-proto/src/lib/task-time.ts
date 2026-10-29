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
  /** Timer minutes per person */
  minutesByWorker: Record<string, number>;
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
      minutesByWorker: Object.fromEntries(byWorker),
    });
  }
  return rows;
}

/** A task with its subtasks: the task's totals add up its own time and its subtasks' */
export interface TaskTimeGroup {
  /** The task's figures with its subtasks added in */
  row: TaskTimeRow;
  /** Time logged on the task itself */
  ownMinutes: number;
  subtasks: TaskTimeRow[];
  subtaskTotal: number;
  subtaskDone: number;
  /** Planned hours (minutes): the task's own plus its subtasks' */
  effortMinutes: number;
}

/**
 * Group time rows under their tasks. A task shows up when it or any of its subtasks has time;
 * its start is the earliest start, its review is the task's own move to review, and its
 * worked time, people and sources add up its subtasks'.
 */
export function groupTaskTime(rows: TaskTimeRow[], tasks: Task[], now: number): TaskTimeGroup[] {
  const byId = new Map(rows.map(r => [r.task.id, r]));
  const subRows = new Map<string, TaskTimeRow[]>();
  for (const r of rows) {
    if (r.task.parentId) subRows.set(r.task.parentId, [...(subRows.get(r.task.parentId) ?? []), r]);
  }
  const groups: TaskTimeGroup[] = [];
  for (const task of tasks.filter(t => !t.parentId)) {
    const own = byId.get(task.id);
    const subs = subRows.get(task.id) ?? [];
    if (!own && subs.length === 0) continue;
    const allSubtasks = tasks.filter(t => t.parentId === task.id);
    const parts = [...(own ? [own] : []), ...subs];

    const minutesByWorker: Record<string, number> = {};
    for (const p of parts) for (const [id, m] of Object.entries(p.minutesByWorker)) minutesByWorker[id] = (minutesByWorker[id] ?? 0) + m;
    const workerIds = Object.entries(minutesByWorker).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    if (workerIds.length === 0 && task.assigneeId) workerIds.push(task.assigneeId);

    const startedAt = parts.map(p => p.startedAt).sort()[0];
    const lastSubReview = subs.map(s => s.reviewAt).filter((x): x is string => Boolean(x)).sort().pop();
    const reviewAt = task.status === 'review' || task.status === 'done' ? own?.reviewAt ?? lastSubReview : undefined;
    const running = parts.some(p => p.running);
    const active = running || task.status === 'in_progress' || allSubtasks.some(s => s.status === 'in_progress');
    // Calendar time: to the review, or to now while work goes on, or to where the last piece stopped
    const lastEnd = Math.max(...parts.map(p => new Date(p.startedAt).getTime() + p.elapsedMinutes * 60_000));
    const end = reviewAt ? new Date(reviewAt).getTime() : active ? now : lastEnd;

    groups.push({
      row: {
        task,
        workerIds,
        startedAt,
        reviewAt,
        workedMinutes: parts.reduce((sum, p) => sum + p.workedMinutes, 0),
        elapsedMinutes: Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60_000)),
        sources: [...new Set(parts.flatMap(p => p.sources))],
        running,
        autoStops: parts.reduce((sum, p) => sum + p.autoStops, 0),
        minutesByWorker,
      },
      ownMinutes: own?.workedMinutes ?? 0,
      subtasks: subs.sort((a, b) => a.task.key.localeCompare(b.task.key, undefined, { numeric: true })),
      subtaskTotal: allSubtasks.length,
      subtaskDone: allSubtasks.filter(s => s.status === 'done' || s.status === 'review').length,
      effortMinutes: (task.effortMinutes ?? 0) + allSubtasks.reduce((sum, s) => sum + (s.effortMinutes ?? 0), 0),
    });
  }
  return groups;
}

/** "2d 3h" for long spans, "3h 20m" otherwise */
export function formatSpan(minutes: number): string {
  if (minutes < 24 * 60) return formatMinutes(minutes);
  const d = Math.floor(minutes / (24 * 60));
  const h = Math.floor((minutes % (24 * 60)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}
