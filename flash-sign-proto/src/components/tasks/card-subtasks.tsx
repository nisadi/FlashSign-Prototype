'use client';

import { useState } from 'react';
import { CornerDownRight, Timer, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Avatar } from '@/components/shared/avatar';
import { SubtaskStateSelect } from '@/components/tasks/subtask-state-select';
import { inProgressSince, subtaskCounts } from '@/lib/subtasks';
import { useNow } from '@/lib/use-now';
import { cn, formatDate } from '@/lib/utils';
import { formatMinutes, sessionMinutes } from '@/lib/agent-connection';
import type { Task, TaskStatus } from '@/types';

const SEGMENT: Record<TaskStatus, string> = {
  todo: 'bg-mist',
  in_progress: 'bg-blue-400',
  review: 'bg-amber-400',
  done: 'bg-emerald-500',
  blocked: 'bg-red-400',
};

const VISIBLE = 3;

/**
 * The subtasks inside a task card: a progress bar, how long the task has been in progress,
 * and each subtask with its own state that can be changed in place.
 */
export function CardSubtasks({
  task,
  subtasks,
  onAllDone,
}: {
  task: Task;
  subtasks: Task[];
  /** Offered when every subtask is done and the task itself is not in review or done yet */
  onAllDone?: () => void;
}) {
  const { users, workSessions, taskStatusChanges, updateTask, openTaskDrawer } = useApp();
  const now = useNow();
  const [expanded, setExpanded] = useState(false);

  const counts = subtaskCounts(subtasks);
  const since = inProgressSince(task, taskStatusChanges);
  const days = since && now ? Math.max(0, Math.floor((now - new Date(since).getTime()) / 86_400_000)) : undefined;
  const shown = expanded ? subtasks : subtasks.slice(0, VISIBLE);
  const allDone = counts.done === counts.total && task.status !== 'review' && task.status !== 'done';

  return (
    <div className="mb-2.5 space-y-1.5" onClick={e => e.stopPropagation()}>
      <div className="flex gap-0.5" aria-hidden>
        {subtasks.map(sub => (
          <span key={sub.id} className={cn('h-1.5 flex-1 rounded-full', SEGMENT[sub.status])} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted">
        <span>
          {counts.done}/{counts.total} subtasks done
          {counts.in_progress > 0 && ` · ${counts.in_progress} in progress`}
          {counts.blocked > 0 && ` · ${counts.blocked} blocked`}
        </span>
        {days !== undefined && (
          <span className="font-semibold text-blue-700 dark:text-blue-400" title={`In progress since ${new Date(since!).toLocaleString()}`}>
            In progress {days === 0 ? 'today' : `${days}d`}
          </span>
        )}
      </div>

      <ul className="space-y-1">
        {shown.map(sub => {
          const assignee = users.find(u => u.id === sub.assigneeId);
          const sessions = workSessions.filter(w => w.taskId === sub.id);
          const running = sessions.some(w => !w.endedAt);
          const worked = now ? sessions.reduce((sum, w) => sum + sessionMinutes(w.startedAt, w.endedAt, now), 0) : 0;
          const finished = sub.status === 'done' || sub.status === 'review';
          const overdue = !finished && sub.dueDate && now !== null && sub.dueDate.slice(0, 10) < new Date(now).toISOString().slice(0, 10);
          return (
            <li
              key={sub.id}
              onClick={() => openTaskDrawer(sub.id)}
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-mist/50 cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3 shrink-0 text-muted" />
              <span className={cn('flex-1 min-w-0 truncate text-[11px]', sub.status === 'done' ? 'text-muted line-through' : 'text-ink')}>
                {sub.title}
              </span>
              {(sub.effortMinutes || worked > 0) && (
                <span
                  className={cn('shrink-0 text-[9px] font-mono', sub.effortMinutes && worked > sub.effortMinutes ? 'text-waiting font-semibold' : 'text-muted')}
                  title={sub.effortMinutes ? `${formatMinutes(worked)} worked of ${formatMinutes(sub.effortMinutes)} planned` : `${formatMinutes(worked)} worked`}
                >
                  {formatMinutes(worked)}{sub.effortMinutes ? `/${formatMinutes(sub.effortMinutes)}` : ''}
                </span>
              )}
              {sub.dueDate && !finished && (
                <span
                  className={cn('shrink-0 text-[9px] font-mono', overdue ? 'rounded bg-danger/10 px-1 text-danger font-semibold' : 'text-muted')}
                  title={overdue ? 'Overdue' : 'Due date'}
                >
                  {overdue ? 'Overdue · ' : ''}{formatDate(sub.dueDate).replace(/, \d{4}$/, '')}
                </span>
              )}
              {running && <Timer className="w-3 h-3 shrink-0 text-flash-deep" aria-label="Timer running" />}
              {assignee && <Avatar user={assignee} size="xs" />}
              <SubtaskStateSelect
                status={sub.status}
                onChange={status => updateTask(sub.id, { status })}
                aria-label={`State of ${sub.key}`}
              />
            </li>
          );
        })}
      </ul>
      {subtasks.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-semibold text-muted hover:text-ink"
        >
          {expanded ? 'Show less' : `Show ${subtasks.length - VISIBLE} more`}
        </button>
      )}

      {allDone && onAllDone && (
        <button
          type="button"
          onClick={onAllDone}
          className="w-full flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
        >
          All subtasks done · Move to In Review <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
