'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, Plus, AlertTriangle, Check, Users, UserRound } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { canViewTeamTime } from '@/lib/permissions';
import { formatMinutes, sessionMinutes, lastWorkdays } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import { cn } from '@/lib/utils';
import type { WorkSession } from '@/types';
import { AgentBadge } from '@/components/agents/agent-badge';
import { SettingsCard, SaveButton, inputClass } from '@/components/settings/settings-layout';

const SOURCES: WorkSession['source'][] = ['claude_code', 'codex', 'gemini_cli', 'antigravity', 'web', 'manual'];

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function TimesheetView() {
  const searchParams = useSearchParams();
  const { workSessions, tasks, users, demoRole, updateWorkSession, logManualTime } = useApp();
  const user = useCurrentUser();
  const now = useNow();
  const teamAllowed = canViewTeamTime(demoRole);
  // Links can open the team view (?view=team) or the log-time form (?log=1)
  const [view, setView] = useState<'me' | 'team'>(searchParams.get('view') === 'team' ? 'team' : 'me');
  const showTeam = teamAllowed && view === 'team';

  const days = useMemo(() => (now ? lastWorkdays(now) : []), [now]);
  const taskById = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

  const inRange = useMemo(() => {
    if (!now || days.length === 0) return [];
    const start = days[0].getTime();
    return workSessions.filter(w => new Date(w.startedAt).getTime() >= start);
  }, [workSessions, days, now]);

  const minutesOf = (w: WorkSession) => (now ? sessionMinutes(w.startedAt, w.endedAt, now) : 0);
  const dayIndex = (w: WorkSession) => days.findIndex(d => new Date(w.startedAt).toDateString() === d.toDateString());

  // Rows: my tasks, or team members
  const rows = useMemo(() => {
    const sessions = showTeam ? inRange : inRange.filter(w => w.userId === user?.id);
    const keyOf = (w: WorkSession) => (showTeam ? w.userId : w.taskId);
    const map = new Map<string, { cells: number[]; total: number; running: boolean }>();
    for (const w of sessions) {
      const i = dayIndex(w);
      if (i < 0) continue;
      const row = map.get(keyOf(w)) ?? { cells: days.map(() => 0), total: 0, running: false };
      const m = minutesOf(w);
      row.cells[i] += m;
      row.total += m;
      if (!w.endedAt) row.running = true;
      map.set(keyOf(w), row);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange, showTeam, user?.id, days, now]);

  const dayTotals = days.map((_, i) => rows.reduce((sum, [, r]) => sum + r.cells[i], 0));
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  const bySource = useMemo(() => {
    const sessions = showTeam ? inRange : inRange.filter(w => w.userId === user?.id);
    const totals = new Map<WorkSession['source'], number>();
    for (const w of sessions) totals.set(w.source, (totals.get(w.source) ?? 0) + minutesOf(w));
    return SOURCES.filter(s => totals.get(s)).map(s => ({ source: s, minutes: totals.get(s) ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange, showTeam, user?.id, now]);

  const toReview = workSessions.filter(w => w.userId === user?.id && w.needsReview);

  // Manual entry form
  const myOpenTasks = tasks.filter(t => t.assigneeId === user?.id && t.status !== 'done');
  const [logOpen, setLogOpen] = useState(searchParams.get('log') === '1');
  const [logTask, setLogTask] = useState('');
  const [logDate, setLogDate] = useState('');
  const [logHours, setLogHours] = useState('1');
  const [logNote, setLogNote] = useState('');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustMinutes, setAdjustMinutes] = useState('');

  const handleLog = () => {
    const minutes = Math.round(parseFloat(logHours) * 60);
    const taskId = logTask || myOpenTasks[0]?.id;
    const date = logDate || (days.length ? isoDate(days[days.length - 1]) : '');
    if (!taskId || !date || !minutes || minutes <= 0) return;
    logManualTime(taskId, minutes, date, logNote.trim() || undefined);
    setLogOpen(false);
    setLogNote('');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Timesheet</h1>
            <p className="text-sm text-muted mt-0.5">
              Time recorded from start, pause and finish, whichever agent or screen was used. Last five working days.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {teamAllowed && (
              <div className="flex items-center bg-paper-elevated rounded-lg border border-line p-0.5 text-xs font-semibold" role="tablist" aria-label="Timesheet view">
                {([['me', 'My time', UserRound], ['team', 'Team', Users]] as const).map(([v, label, Icon]) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md', view === v ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
            {!showTeam && (
              <SaveButton onClick={() => setLogOpen(o => !o)}>
                <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Log time</span>
              </SaveButton>
            )}
          </div>
        </div>

        {/* Manual entry */}
        {logOpen && !showTeam && (
          <div className="p-4 rounded-xl border border-flash/40 bg-flash/5 grid grid-cols-1 sm:grid-cols-[2fr_1fr_100px_2fr_auto] gap-3 items-end text-xs">
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Task</span>
              <select className={inputClass} value={logTask || myOpenTasks[0]?.id || ''} onChange={e => setLogTask(e.target.value)}>
                {myOpenTasks.map(t => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Day</span>
              <select className={inputClass} value={logDate || (days.length ? isoDate(days[days.length - 1]) : '')} onChange={e => setLogDate(e.target.value)}>
                {days.map(d => <option key={d.toISOString()} value={isoDate(d)}>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Hours</span>
              <input className={inputClass} type="number" min="0.25" step="0.25" value={logHours} onChange={e => setLogHours(e.target.value)} />
            </label>
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Note</span>
              <input className={inputClass} value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="Call with the client" />
            </label>
            <SaveButton onClick={handleLog}>Add</SaveButton>
            <p className="sm:col-span-5 text-muted">Manual entries are labelled as such on the timesheet.</p>
          </div>
        )}

        {/* Auto-stopped blocks to check */}
        {!showTeam && toReview.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {toReview.length} {toReview.length === 1 ? 'timer was' : 'timers were'} stopped automatically. Please check.
            </p>
            {toReview.map(w => {
              const t = taskById.get(w.taskId);
              return (
                <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-paper-elevated border border-amber-200 text-xs">
                  <span className="text-ink">
                    <strong>{t?.key}</strong> · {new Date(w.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                    {new Date(w.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} for {formatMinutes(minutesOf(w))}
                    <span className="block text-muted">No activity for 2 hours, so it stopped at the last activity time.</span>
                  </span>
                  {adjusting === w.id ? (
                    <span className="flex items-center gap-2">
                      <input className={cn(inputClass, 'w-24')} type="number" min="1" value={adjustMinutes} onChange={e => setAdjustMinutes(e.target.value)} aria-label="Minutes" />
                      <span className="text-muted">min</span>
                      <SaveButton onClick={() => {
                        const mins = parseInt(adjustMinutes, 10);
                        if (mins > 0) {
                          updateWorkSession(w.id, { endedAt: new Date(new Date(w.startedAt).getTime() + mins * 60_000).toISOString(), needsReview: false });
                        }
                        setAdjusting(null);
                      }}>Save</SaveButton>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={() => { setAdjusting(w.id); setAdjustMinutes(String(minutesOf(w))); }} className="px-3 py-1.5 rounded-lg border border-line bg-paper hover:bg-mist font-semibold text-ink">
                        Adjust
                      </button>
                      <button type="button" onClick={() => updateWorkSession(w.id, { needsReview: false })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink text-white font-semibold">
                        <Check className="w-3.5 h-3.5" /> Looks right
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* By agent */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-line bg-paper-elevated">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-flash-deep" /> {now ? formatMinutes(grandTotal) : '—'} total</span>
          <span className="text-line">|</span>
          {bySource.map(({ source, minutes }) => (
            <span key={source} className="flex items-center gap-1.5 text-xs">
              <AgentBadge source={source} /> <span className="text-muted tabular-nums">{formatMinutes(minutes)}</span>
            </span>
          ))}
        </div>

        {/* Grid */}
        <SettingsCard title={showTeam ? 'Team hours' : 'My hours by task'} icon={Clock}>
          {!now ? (
            <p className="text-muted py-6 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted py-6 text-center">No time recorded in this period.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="px-5 py-2 text-left font-semibold">{showTeam ? 'Person' : 'Task'}</th>
                    {days.map(d => (
                      <th key={d.toISOString()} className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}<span className="block font-normal">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </th>
                    ))}
                    <th className="px-5 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(([key, row]) => {
                    const t = taskById.get(key);
                    const person = users.find(u => u.id === key);
                    return (
                      <tr key={key}>
                        <td className="px-5 py-2.5">
                          {showTeam ? (
                            <span className="font-semibold text-ink">{person?.name ?? key}</span>
                          ) : (
                            <span><span className="font-mono font-semibold text-ink">{t?.key}</span> <span className="text-muted">{t?.title}</span></span>
                          )}
                          {row.running && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> running</span>}
                        </td>
                        {row.cells.map((m, i) => (
                          <td key={i} className={cn('px-3 py-2.5 text-right tabular-nums', m ? 'text-ink' : 'text-line')}>{m ? formatMinutes(m) : '–'}</td>
                        ))}
                        <td className="px-5 py-2.5 text-right font-semibold text-ink tabular-nums">{formatMinutes(row.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line font-semibold text-ink">
                    <td className="px-5 py-2.5">Total</td>
                    {dayTotals.map((m, i) => <td key={i} className="px-3 py-2.5 text-right tabular-nums">{m ? formatMinutes(m) : '–'}</td>)}
                    <td className="px-5 py-2.5 text-right tabular-nums">{formatMinutes(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </SettingsCard>
      </div>
    </div>
  );
}

export default function TimesheetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading timesheet…</div>}>
      <TimesheetView />
    </Suspense>
  );
}
