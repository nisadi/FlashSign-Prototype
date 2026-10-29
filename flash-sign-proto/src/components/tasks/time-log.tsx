'use client';

import { useState } from 'react';
import { Clock, Plus, Timer } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/shared/ui';
import { AgentBadge } from '@/components/agents/agent-badge';
import { EffortField } from '@/components/shared/duration-fields';
import { notify } from '@/components/shared/toaster';
import { formatMinutes, sessionMinutes } from '@/lib/agent-connection';
import { canViewTeamTime } from '@/lib/permissions';
import { cn, formatDate } from '@/lib/utils';
import type { Task } from '@/types';

const field = 'px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink';

/**
 * A task's time: hours worked against its planned hours (its own and its subtasks'), a form to
 * log hours worked without the timer (e.g. without an agent), and every time entry.
 */
export function TimeLog({ task, subtasks, now }: { task: Task; subtasks: Task[]; now: number }) {
  const { users, workSessions, demoRole, logManualTime } = useApp();
  const me = useCurrentUser();
  const today = new Date(now).toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [personId, setPersonId] = useState(me?.id ?? '');
  // Managers can log time for others; everyone else logs their own
  const forOthers = canViewTeamTime(demoRole);

  const items = [task, ...subtasks];
  const keyOf = new Map(items.map(t => [t.id, t.key]));
  const entries = workSessions
    .filter(w => keyOf.has(w.taskId))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const worked = entries.reduce((sum, w) => sum + sessionMinutes(w.startedAt, w.endedAt, now), 0);
  const planned = subtasks.length
    ? subtasks.reduce((sum, s) => sum + (s.effortMinutes ?? 0), 0) + (task.effortMinutes ?? 0)
    : task.effortMinutes ?? 0;
  const over = planned > 0 ? Math.round(((worked - planned) / planned) * 100) : 0;
  const finished = task.status === 'review' || task.status === 'done';
  const [target, setTarget] = useState(task.id);

  const save = () => {
    if (!minutes) {
      notify('Enter the hours worked first.', 'error');
      return;
    }
    if (minutes > 24 * 60) {
      notify('One entry can be at most 24 hours.', 'error');
      return;
    }
    if (date > today) {
      notify("Time can't be logged for a day in the future.", 'error');
      return;
    }
    logManualTime(target, minutes, date, note.trim() || undefined, personId || undefined);
    const who = users.find(u => u.id === personId);
    notify(`${formatMinutes(minutes)} logged on ${keyOf.get(target)}${who && who.id !== me?.id ? ` for ${who.name}` : ''}`);
    setMinutes(undefined);
    setNote('');
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-line bg-paper p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time worked</p>
          <p className="text-sm text-ink">
            <span className="font-semibold tabular-nums">{formatMinutes(worked)}</span>
            {planned > 0 ? (
              <>
                {' '}of <span className="tabular-nums">{formatMinutes(planned)}</span> planned
                {over > 0 ? (
                  <span className="ml-1.5 text-xs font-semibold text-waiting">({over}% over)</span>
                ) : finished && over < 0 ? (
                  <span className="ml-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">({-over}% under)</span>
                ) : (
                  <span className="ml-1.5 text-xs text-muted">({formatMinutes(planned - worked)} left)</span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted"> · no planned hours set</span>
            )}
          </p>
          {subtasks.length > 0 && <p className="text-[11px] text-muted">Includes its {subtasks.length} subtasks</p>}
        </div>
        <Button variant="secondary" size="xs" icon={Plus} onClick={() => setOpen(!open)}>Log time</Button>
      </div>

      {open && (
        <div className="rounded-lg border border-line bg-paper-elevated p-3 space-y-2">
          <p className="text-[11px] text-muted">Hours worked without the timer, for example without an AI agent.</p>
          <div className="flex flex-wrap items-center gap-2">
            <EffortField minutes={minutes} onChange={setMinutes} aria-label="Hours worked" />
            <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className={cn(field, 'font-mono')} aria-label="Day" />
            {subtasks.length > 0 && (
              <select value={target} onChange={e => setTarget(e.target.value)} className={field} aria-label="On">
                <option value={task.id}>{task.key} (the task)</option>
                {subtasks.map(s => <option key={s.id} value={s.id}>{s.key} · {s.title}</option>)}
              </select>
            )}
            {forOthers && (
              <select value={personId} onChange={e => setPersonId(e.target.value)} className={field} aria-label="Person">
                {users.map(u => <option key={u.id} value={u.id}>{u.id === me?.id ? `${u.name} (me)` : u.name}</option>)}
              </select>
            )}
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="What was done (optional)" className={cn(field, 'w-full')} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" size="xs" onClick={save}>Save time</Button>
          </div>
        </div>
      )}

      {entries.length > 0 ? (
        <ul className="divide-y divide-line/60 text-[11px]">
          {entries.slice(0, 12).map(w => {
            const person = users.find(u => u.id === w.userId);
            return (
              <li key={w.id} className="flex items-center gap-2 py-1.5">
                <Avatar user={person} size="xs" />
                <span className="w-24 shrink-0 truncate text-ink">{person?.name ?? 'Someone'}</span>
                <span className="w-20 shrink-0 font-mono text-muted">{formatDate(w.startedAt).replace(/, \d{4}$/, '')}</span>
                {subtasks.length > 0 && <span className="w-20 shrink-0 font-mono text-[10px] text-muted">{keyOf.get(w.taskId)}</span>}
                <span className="flex-1 min-w-0 truncate text-ink-soft" title={w.note}>{w.note ?? ''}</span>
                {!w.endedAt && <Timer className="w-3 h-3 text-flash-deep shrink-0" aria-label="Running" />}
                <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-ink">{formatMinutes(sessionMinutes(w.startedAt, w.endedAt, now))}</span>
                <AgentBadge source={w.source} showLabel={false} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[11px] text-muted">No time logged yet.</p>
      )}
    </div>
  );
}
