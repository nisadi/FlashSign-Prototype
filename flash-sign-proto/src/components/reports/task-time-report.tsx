'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Timer, CheckCircle2, Hourglass, AlertTriangle, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '@/context/app-context';
import { formatMinutes } from '@/lib/agent-connection';
import { taskTimeRows, formatSpan, type TaskTimeRow } from '@/lib/task-time';
import { useNow } from '@/lib/use-now';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/shared/avatar';
import { TaskStatusBadge } from '@/components/shared/badges';
import { AgentBadge } from '@/components/agents/agent-badge';

const REVIEWED_COLOR = '#00a88f';
const IN_PROGRESS_COLOR = '#2a78d6';
const CHART_LIMIT = 12;

type StateFilter = 'all' | 'reviewed' | 'in_progress';

const when = (iso: string) => format(new Date(iso), 'd MMM, HH:mm');

/**
 * Reports > Task time: how long each task took from In Progress to In Review.
 * "Worked" is timer time (paused, idle and after-shift time left out); "In Progress → Review" is calendar time.
 */
export function TaskTimeReport({ projectId }: { projectId?: string }) {
  const { tasks, workSessions, taskStatusChanges, users, projects, agentSettings, openTaskDrawer } = useApp();
  const now = useNow();
  const [project, setProject] = useState(projectId ?? 'all');
  const [person, setPerson] = useState('all');
  const [state, setState] = useState<StateFilter>('all');

  const userById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const allRows = useMemo(
    () => (now ? taskTimeRows(tasks, workSessions, taskStatusChanges, now) : []),
    [tasks, workSessions, taskStatusChanges, now]
  );

  const rows = useMemo(() => {
    const filtered = allRows.filter(r =>
      (project === 'all' || r.task.projectId === project) &&
      (person === 'all' || r.workerIds.includes(person)) &&
      (state === 'all' || (state === 'reviewed' ? !!r.reviewAt : !r.reviewAt))
    );
    // Most recently sent to review first, then the ones still being worked on
    return filtered.sort((a, b) => (b.reviewAt ?? '9').localeCompare(a.reviewAt ?? '9') || b.startedAt.localeCompare(a.startedAt));
  }, [allRows, project, person, state]);

  const reviewed = rows.filter(r => r.reviewAt);
  const avg = (list: TaskTimeRow[], key: 'workedMinutes' | 'elapsedMinutes') =>
    list.length ? Math.round(list.reduce((sum, r) => sum + r[key], 0) / list.length) : 0;
  const running = rows.filter(r => r.running).length;
  const autoStops = rows.reduce((sum, r) => sum + r.autoStops, 0);

  const chartData = useMemo(
    () => [...rows]
      .sort((a, b) => b.workedMinutes - a.workedMinutes)
      .slice(0, CHART_LIMIT)
      .map(r => ({
        key: r.task.key,
        title: r.task.title,
        hours: Math.round((r.workedMinutes / 60) * 10) / 10,
        worked: r.workedMinutes,
        elapsed: r.elapsedMinutes,
        reviewed: !!r.reviewAt,
        person: r.workerIds.map(id => userById.get(id)?.name ?? id).join(', '),
      })),
    [rows, userById]
  );

  const people = useMemo(() => {
    const ids = new Set(allRows.flatMap(r => r.workerIds));
    return users.filter(u => ids.has(u.id));
  }, [allRows, users]);

  const downloadCsv = () => {
    const header = ['Task', 'Title', 'Project', 'People', 'Status', 'Started', 'Sent to review', 'Worked (h)', 'In Progress to Review (h)', 'Via', 'Auto-stops'];
    const lines = rows.map(r => [
      r.task.key,
      r.task.title,
      projects.find(p => p.id === r.task.projectId)?.name ?? '',
      r.workerIds.map(id => userById.get(id)?.name ?? id).join('; '),
      r.task.status,
      r.startedAt,
      r.reviewAt ?? '',
      (r.workedMinutes / 60).toFixed(2),
      (r.elapsedMinutes / 60).toFixed(2),
      r.sources.join('; '),
      String(r.autoStops),
    ]);
    const csv = [header, ...lines].map(l => l.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-time.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectClass = 'px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash';

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {!projectId && (
          <select value={project} onChange={e => setProject(e.target.value)} className={selectClass} aria-label="Project">
            <option value="all">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select value={person} onChange={e => setPerson(e.target.value)} className={selectClass} aria-label="Person">
          <option value="all">Everyone</option>
          {people.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div className="flex items-center bg-paper-elevated rounded-lg border border-line p-0.5 text-xs font-semibold" role="tablist" aria-label="Task state">
          {([['all', 'All'], ['reviewed', 'Sent to review'], ['in_progress', 'Not in review yet']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={state === v}
              onClick={() => setState(v)}
              className={cn('px-3 py-1.5 rounded-md', state === v ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper-elevated text-xs font-semibold text-ink hover:bg-mist disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Download CSV
        </button>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sent to review', value: String(reviewed.length), sub: `of ${rows.length} tasks worked on`, icon: CheckCircle2 },
          { label: 'Avg worked per task', value: reviewed.length ? formatMinutes(avg(reviewed, 'workedMinutes')) : '—', sub: 'Timer time, tasks sent to review', icon: Timer },
          { label: 'Avg In Progress → Review', value: reviewed.length ? formatSpan(avg(reviewed, 'elapsedMinutes')) : '—', sub: 'Calendar time on the board', icon: Hourglass },
          { label: 'Timers running now', value: String(running), sub: autoStops ? `${autoStops} auto-stopped ${autoStops === 1 ? 'session' : 'sessions'}` : 'No auto-stops', icon: AlertTriangle },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-paper-elevated rounded-xl border border-line p-4">
            <p className="text-xs text-muted font-medium flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</p>
            <p className="text-2xl font-bold text-ink mt-1 tabular-nums">{now ? value : '—'}</p>
            <p className="text-[11px] text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <section className="bg-paper-elevated rounded-xl border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Worked time per task</h2>
            <p className="text-xs text-muted mt-0.5">
              {rows.length > CHART_LIMIT ? `Top ${CHART_LIMIT} of ${rows.length} by hours` : 'Hours on the timer'} · hover a bar for In Progress → Review time
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: REVIEWED_COLOR }} /> Sent to review</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: IN_PROGRESS_COLOR }} /> Not in review yet</span>
          </div>
        </div>
        {!now ? (
          <p className="text-xs text-muted py-10 text-center">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-xs text-muted py-10 text-center">No task time for these filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 30 + 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} unit="h" />
              <YAxis type="category" dataKey="key" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip
                cursor={{ fill: 'var(--mist)', opacity: 0.5 }}
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload;
                  if (!d) return null;
                  return (
                    <div className="bg-paper-elevated border border-line rounded-lg shadow-sm px-3 py-2 text-xs max-w-[260px]">
                      <p className="font-semibold text-ink">{d.key} · {d.title}</p>
                      <p className="text-muted mt-0.5">{d.person}</p>
                      <p className="mt-1.5 text-ink">Worked <span className="font-semibold tabular-nums">{formatMinutes(d.worked)}</span></p>
                      <p className="text-ink">
                        {d.reviewed ? 'In Progress → Review' : 'In progress for'} <span className="font-semibold tabular-nums">{formatSpan(d.elapsed)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={16} name="Worked">
                {chartData.map(d => <Cell key={d.key} fill={d.reviewed ? REVIEWED_COLOR : IN_PROGRESS_COLOR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Table */}
      <section className="bg-paper-elevated rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line bg-paper/60">
                <th className="px-4 py-2.5 font-semibold">Task</th>
                <th className="px-3 py-2.5 font-semibold">Worked by</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Moved to In Progress</th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Moved to In Review</th>
                <th className="px-3 py-2.5 font-semibold text-right">Worked</th>
                <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">In Progress → Review</th>
                <th className="px-4 py-2.5 font-semibold">Via</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const first = userById.get(r.workerIds[0]);
                return (
                  <tr key={r.task.id} className="border-b border-line/60 last:border-0 hover:bg-mist/30">
                    <td className="px-4 py-2.5 max-w-[280px]">
                      <button type="button" onClick={() => openTaskDrawer(r.task.id)} className="text-left group">
                        <span className="font-mono text-[10px] text-muted mr-1.5">{r.task.key}</span>
                        <span className="font-medium text-ink group-hover:text-flash-deep">{r.task.title}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Avatar user={first} size="xs" />
                        <span className="text-ink">{first?.name ?? 'Unassigned'}</span>
                        {r.workerIds.length > 1 && <span className="text-muted">+{r.workerIds.length - 1}</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap"><TaskStatusBadge status={r.task.status} /></td>
                    <td className="px-3 py-2.5 text-muted whitespace-nowrap tabular-nums">{when(r.startedAt)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {r.reviewAt ? (
                        <span className="text-muted">{when(r.reviewAt)}</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-ink">
                          {r.running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Timer running now" />}
                          {r.task.status === 'in_progress' ? 'Still in progress' : 'Not sent yet'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-ink tabular-nums">{formatMinutes(r.workedMinutes)}</span>
                      {r.autoStops > 0 && (
                        <span
                          className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-700"
                          title={`${r.autoStops} auto-stopped ${r.autoStops === 1 ? 'session' : 'sessions'} (idle or shift end)`}
                        >
                          <AlertTriangle className="w-3 h-3" />{r.autoStops}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted whitespace-nowrap tabular-nums">{formatSpan(r.elapsedMinutes)}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1">
                        {r.sources.map(s => <AgentBadge key={s} source={s} showLabel={false} />)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {now && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No task time for these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-[11px] text-muted border-t border-line bg-paper/40">
          Worked is timer time: it starts when a card moves to In Progress (on the board or by an agent) and stops when it moves to In Review.
          Timers stop on their own after {formatMinutes(agentSettings.idleTimeoutMinutes)} without activity or when the shift ends at {agentSettings.dayCutoff},
          so idle and after-hours time isn&apos;t counted; <AlertTriangle className="inline w-3 h-3 text-amber-700" /> marks those auto-stops.
        </p>
      </section>
    </div>
  );
}
