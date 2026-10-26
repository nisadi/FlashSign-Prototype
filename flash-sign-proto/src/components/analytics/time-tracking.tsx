'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Clock, Bot, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { formatMinutes, lastWorkdays, sessionMinutes } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import type { WorkSession } from '@/types';
import { AgentBadge } from '@/components/agents/agent-badge';

const SOURCES: WorkSession['source'][] = ['claude_code', 'codex', 'gemini_cli', 'antigravity', 'web', 'manual'];

/** Teams > Analytics: hours per person and per agent over the last five working days. */
export function TimeTrackingSection() {
  const { workSessions, users } = useApp();
  const now = useNow();

  const data = useMemo(() => {
    if (!now) return null;
    const start = lastWorkdays(now)[0].getTime();
    const sessions = workSessions.filter(w => new Date(w.startedAt).getTime() >= start);

    const people = new Map<string, { minutes: number; running: boolean }>();
    const sources = new Map<WorkSession['source'], number>();
    for (const w of sessions) {
      const m = sessionMinutes(w.startedAt, w.endedAt, now);
      const p = people.get(w.userId) ?? { minutes: 0, running: false };
      people.set(w.userId, { minutes: p.minutes + m, running: p.running || !w.endedAt });
      sources.set(w.source, (sources.get(w.source) ?? 0) + m);
    }
    const total = [...sources.values()].reduce((a, b) => a + b, 0);
    return {
      total,
      people: [...people.entries()].sort((a, b) => b[1].minutes - a[1].minutes),
      sources: SOURCES.filter(s => sources.get(s)).map(s => ({ source: s, minutes: sources.get(s) ?? 0 })),
      runningCount: [...people.values()].filter(p => p.running).length,
    };
  }, [workSessions, now]);

  const maxPerson = data ? Math.max(1, ...data.people.map(([, p]) => p.minutes)) : 1;
  const maxSource = data ? Math.max(1, ...data.sources.map(s => s.minutes)) : 1;

  return (
    <section className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2"><Clock className="w-4 h-4 text-flash-deep" /> Time tracking</h2>
          <p className="text-xs text-muted mt-0.5">
            Last 5 working days · {data ? formatMinutes(data.total) : '—'} recorded
            {data && data.runningCount > 0 && ` · ${data.runningCount} ${data.runningCount === 1 ? 'timer' : 'timers'} running now`}
          </p>
        </div>
        <Link href="/teams/timesheet?view=team" className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:underline whitespace-nowrap">
          View full timesheet <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!data ? (
        <p className="text-xs text-muted py-6 text-center">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Hours per person</p>
            <ul className="space-y-3">
              {data.people.map(([userId, p]) => {
                const person = users.find(u => u.id === userId);
                return (
                  <li key={userId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-ink truncate flex items-center gap-1.5">
                        {person?.name ?? userId}
                        {p.running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Timer running now" />}
                      </span>
                      <span className="text-ink font-semibold tabular-nums">{formatMinutes(p.minutes)}</span>
                    </div>
                    <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-flash" style={{ width: `${(p.minutes / maxPerson) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Hours by agent
            </p>
            <ul className="space-y-3">
              {data.sources.map(({ source, minutes }) => (
                <li key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <AgentBadge source={source} />
                    <span className="text-muted tabular-nums">
                      <span className="text-ink font-semibold">{formatMinutes(minutes)}</span> · {Math.round((minutes / data.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${(minutes / maxSource) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted mt-3">
              Which tool started each block of time. A task can mix agents; it&apos;s still one person&apos;s hours.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
