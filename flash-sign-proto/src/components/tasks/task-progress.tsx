'use client';

import { BarChart3, Timer } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { formatMinutes } from '@/lib/agent-connection';
import { actualSpan, type ActualSpan } from '@/lib/task-progress';
import { stageLabel } from '@/lib/board-columns';
import { formatDate, cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

const BAR: Record<TaskStatus, string> = {
  todo: 'bg-mist',
  in_progress: 'bg-blue-400',
  review: 'bg-amber-400',
  done: 'bg-emerald-500',
  blocked: 'bg-red-400',
};

const DAY = 86_400_000;
const time = (iso?: string) => (iso ? new Date(iso).getTime() : undefined);

/**
 * What actually happened on a task and each of its subtasks against the plan: when work
 * started and finished, how long it took, and who worked on it. Planned dates show as an
 * outline, actual work as a solid bar.
 */
export function TaskProgress({ task, subtasks, now }: { task: Task; subtasks: Task[]; now: number }) {
  const { users, taskStatusChanges, workSessions } = useApp();
  const rows = [task, ...subtasks].map(t => ({ task: t, actual: actualSpan(t, taskStatusChanges, workSessions, now) }));
  const nameOf = (id: string) => users.find(u => u.id === id)?.name.split(' ')[0] ?? 'Someone';

  // The window covers every planned and actual date, and today
  const points = rows.flatMap(r => [time(r.task.startDate), time(r.task.dueDate), time(r.actual.start), time(r.actual.end)]).filter((x): x is number => x !== undefined);
  const from = Math.min(now, ...points);
  const to = Math.max(now, ...points) + DAY;
  const pct = (t: number) => ((t - from) / (to - from)) * 100;

  const ownMinutes = rows[0].actual.workedMinutes;
  const totalMinutes = rows.reduce((sum, r) => sum + r.actual.workedMinutes, 0);
  const planned = task.estimatedDuration;

  const summary = (t: Task, a: ActualSpan) => {
    if (!a.start) return t.status === 'done' ? 'Done (no tracked activity)' : stageLabel(t.status);
    const length = `${a.days === 0 ? 'under a day' : `${a.days}d`}`;
    const workers = a.workers.map(w => `${nameOf(w.userId)} ${formatMinutes(w.minutes)}`).join(', ');
    const state = a.end ? `Done in ${length}` : `${stageLabel(t.status)} ${length}`;
    return [state, t.estimatedDuration ? `planned ${t.estimatedDuration}d` : '', workers].filter(Boolean).join(' · ');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-paper p-3.5 space-y-1">
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" /> What actually happened, compared with the plan
        </p>
        <p className="text-xs text-ink">
          <span className="font-semibold">{task.key}</span> · {summary(task, rows[0].actual)}
          {planned && rows[0].actual.days !== undefined && rows[0].actual.days > planned && (
            <span className="ml-1.5 text-danger font-semibold">({rows[0].actual.days - planned}d over)</span>
          )}
        </p>
        {subtasks.length > 0 && (
          <p className="text-[11px] text-muted">
            {subtasks.filter(s => s.status === 'done').length}/{subtasks.length} subtasks done · {formatMinutes(totalMinutes)} worked
            {totalMinutes > 0 && ` (${formatMinutes(ownMinutes)} on the task itself, ${formatMinutes(totalMinutes - ownMinutes)} across subtasks)`}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {rows.map(({ task: t, actual }, i) => {
          const pStart = time(t.startDate);
          const pEnd = time(t.dueDate);
          const aStart = time(actual.start);
          const aEnd = time(actual.end) ?? (aStart !== undefined && t.status !== 'todo' ? now : undefined);
          return (
            <div key={t.id} className={cn('space-y-1', i > 0 && 'pl-4')}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-[10px] text-muted mr-1.5">{i > 0 ? '↳ ' : ''}{t.key}</span>
                  <span className={cn('text-ink', i === 0 && 'font-semibold')}>{t.title}</span>
                </span>
                {actual.running && <Timer className="w-3 h-3 shrink-0 text-flash-deep" aria-label="Timer running" />}
              </div>
              <div className="relative h-3.5 rounded bg-mist/40">
                {pStart !== undefined && pEnd !== undefined && (
                  <span
                    className="absolute top-0 h-full rounded border border-dashed border-muted/60"
                    style={{ left: `${pct(pStart)}%`, width: `${Math.max(1, pct(pEnd) - pct(pStart))}%` }}
                    title={`Planned ${formatDate(t.startDate!)} → ${formatDate(t.dueDate!)}`}
                  />
                )}
                {aStart !== undefined && aEnd !== undefined && (
                  <span
                    className={cn('absolute top-0.5 h-2.5 rounded', BAR[t.status])}
                    style={{ left: `${pct(aStart)}%`, width: `${Math.max(0.8, pct(aEnd) - pct(aStart))}%` }}
                    title={`Actual ${formatDate(actual.start!)} → ${actual.end ? formatDate(actual.end) : 'now'}`}
                  />
                )}
                <span className="absolute top-0 h-full w-px bg-danger/60" style={{ left: `${pct(now)}%` }} title="Today" />
              </div>
              <p className="text-[10px] text-muted">{summary(t, actual)}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted border-t border-line pt-2">
        <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded border border-dashed border-muted/60" /> Planned</span>
        <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-blue-400" /> Actual (in progress)</span>
        <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-emerald-500" /> Actual (done)</span>
        <span className="flex items-center gap-1"><span className="w-px h-3 bg-danger/60" /> Today</span>
      </div>
    </div>
  );
}
