'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Timer, AlertTriangle, ArrowRight, Plus, Plug } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { formatMinutes, lastWorkdays, sessionMinutes, tokenStatus } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import { cn, formatRelative } from '@/lib/utils';
import type { AgentEvent } from '@/types';
import { AgentBadge } from './agent-badge';

const ACTION_TEXT: Record<AgentEvent['action'], string> = {
  listed_tasks: 'listed your tasks',
  started: 'started',
  continued: 'continued',
  paused: 'paused',
  note: 'added a note to',
  finished: 'moved to In Review',
  time_logged: 'logged time on',
  auto_stopped: 'stopped the timer on',
};

/** Dashboard card: the person's running timer, hours, latest agent actions and things to check. */
export function MyWorkCard() {
  const { workSessions, agentEvents, agentTokens, tasks, openTaskDrawer } = useApp();
  const user = useCurrentUser();
  const now = useNow();

  const taskById = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const mine = useMemo(() => workSessions.filter(w => w.userId === user?.id), [workSessions, user?.id]);
  const running = mine.find(w => !w.endedAt);
  const runningTask = running ? taskById.get(running.taskId) : undefined;
  const toCheck = mine.filter(w => w.needsReview).length;
  const hasToken = agentTokens.some(t => t.userId === user?.id && tokenStatus(t) === 'active');

  const totals = useMemo(() => {
    if (!now) return null;
    const todayKey = new Date(now).toDateString();
    const weekStart = lastWorkdays(now)[0].getTime();
    let today = 0;
    let week = 0;
    for (const w of mine) {
      const m = sessionMinutes(w.startedAt, w.endedAt, now);
      if (new Date(w.startedAt).toDateString() === todayKey) today += m;
      if (new Date(w.startedAt).getTime() >= weekStart) week += m;
    }
    return { today, week };
  }, [mine, now]);

  const recent = useMemo(
    () => agentEvents.filter(e => e.userId === user?.id && e.action !== 'listed_tasks').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3),
    [agentEvents, user?.id]
  );

  return (
    <section className="bg-paper-elevated border border-line rounded-xl shadow-xs">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-line">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Timer className="w-4 h-4 text-flash-deep" /> My work today
        </h2>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link href="/teams/timesheet?log=1" className="flex items-center gap-1 text-muted hover:text-ink">
            <Plus className="w-3.5 h-3.5" /> Log time
          </Link>
          <Link href="/teams/timesheet" className="flex items-center gap-1 text-flash-deep hover:underline">
            Open my timesheet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_auto_1.4fr] gap-5 p-5">
        {/* Timer */}
        <div className={cn('rounded-lg p-4 border', running ? 'bg-emerald-50 border-emerald-200' : 'bg-paper border-line')}>
          {running && runningTask ? (
            <>
              <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Timer running
              </p>
              <button type="button" onClick={() => openTaskDrawer(runningTask.id)} className="block text-left mt-1 text-sm font-bold text-ink hover:text-flash-deep">
                {runningTask.key} · {runningTask.title}
              </button>
              <p className="mt-1 text-xs text-muted flex items-center gap-1.5 flex-wrap">
                {now ? formatMinutes(sessionMinutes(running.startedAt, undefined, now)) : '—'} · started via <AgentBadge source={running.source} />
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">No timer running</p>
              <p className="mt-1 text-xs text-muted">
                Tell your agent &ldquo;let&apos;s start &lt;task key&gt;&rdquo;, or log time by hand.
              </p>
              {!hasToken && (
                <Link href="/ai-agents/connect" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-flash-deep hover:underline">
                  <Plug className="w-3.5 h-3.5" /> Connect your AI agent
                </Link>
              )}
            </>
          )}
        </div>

        {/* Hours */}
        <div className="flex md:flex-col justify-around md:justify-center gap-4 md:px-4 md:border-x border-line">
          <div>
            <p className="text-[11px] text-muted">Today</p>
            <p className="text-xl font-bold text-ink tabular-nums">{totals ? formatMinutes(totals.today) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted">Last 5 working days</p>
            <p className="text-xl font-bold text-ink tabular-nums">{totals ? formatMinutes(totals.week) : '—'}</p>
          </div>
        </div>

        {/* Recent agent actions */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Latest from your agents</p>
          {recent.length === 0 ? (
            <p className="text-xs text-muted">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map(e => {
                const t = e.taskId ? taskById.get(e.taskId) : undefined;
                return (
                  <li key={e.id} className="text-xs flex items-center gap-1.5 flex-wrap">
                    <AgentBadge source={e.agent} showLabel={false} />
                    <span className="text-ink-soft">{ACTION_TEXT[e.action]}</span>
                    {t && <span className="font-mono font-semibold text-ink">{t.key}</span>}
                    <span className="text-muted">· {formatRelative(e.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {toCheck > 0 && (
        <Link
          href="/teams/timesheet"
          className="flex items-center gap-2 px-5 py-2.5 border-t border-amber-200 bg-amber-50 rounded-b-xl text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {toCheck} {toCheck === 1 ? 'timer was' : 'timers were'} stopped automatically. Please check your timesheet.
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </Link>
      )}
    </section>
  );
}
