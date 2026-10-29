'use client';

import React, { Fragment, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Timer, CheckCircle2, Hourglass, AlertTriangle, Download, ChevronDown, CornerDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '@/context/app-context';
import { formatMinutes } from '@/lib/agent-connection';
import { taskTimeRows, groupTaskTime, formatSpan, type TaskTimeRow, type TaskTimeGroup } from '@/lib/task-time';
import { useNow } from '@/lib/use-now';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/shared/avatar';
import { TaskStatusBadge } from '@/components/shared/badges';
import { AgentBadge } from '@/components/agents/agent-badge';
import { Button } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';

const REVIEWED_COLOR = '#00a88f';
const IN_PROGRESS_COLOR = '#2a78d6';
const CHART_LIMIT = 12;
/** Most segments one bar is split into: the task itself plus its subtasks */
const MAX_SEGMENTS = 6;

type StateFilter = 'all' | 'reviewed' | 'in_progress';

const when = (iso: string) => format(new Date(iso), 'd MMM, HH:mm');

/**
 * Planned hours, with how far worked time is over them ("6h +22%"); under the plan only shows
 * once the work is finished, since unfinished work is expected to be under. "—" when none.
 */
function Planned({ worked, planned, finished }: { worked: number; planned: number; finished: boolean }) {
  if (!planned) return <span className="text-muted">—</span>;
  const pct = Math.round(((worked - planned) / planned) * 100);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {formatMinutes(planned)}
      {pct > 0 ? (
        <span className="ml-1 text-[11px] font-semibold text-waiting">+{pct}%</span>
      ) : finished && pct < 0 ? (
        <span className="ml-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{pct}%</span>
      ) : null}
    </span>
  );
}

/**
 * Reports > Task time: how long each task took from In Progress to In Review.
 * "Worked" is timer time (paused, idle and after-shift time left out); "In Progress → Review" is calendar time.
 * A task with subtasks shows its subtasks underneath, and its totals add up their time.
 */
export function TaskTimeReport({ projectId }: { projectId?: string }) {
  const { tasks, workSessions, taskStatusChanges, users, projects, agentSettings, openTaskDrawer } = useApp();
  const now = useNow();
  const [project, setProject] = useState(projectId ?? 'all');
  const [person, setPerson] = useState('all');
  const [state, setState] = useState<StateFilter>('all');
  const [grouped, setGrouped] = useState(true);
  const [folded, setFolded] = useState<Record<string, boolean>>({});

  const userById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  // With a person chosen, only their timer time counts (like a timesheet)
  const allRows = useMemo(() => {
    if (!now) return [];
    const sessions = person === 'all' ? workSessions : workSessions.filter(w => w.userId === person);
    return taskTimeRows(tasks, sessions, taskStatusChanges, now).filter(r => person === 'all' || r.workerIds.includes(person));
  }, [tasks, workSessions, taskStatusChanges, now, person]);

  const inProject = (r: TaskTimeRow) => project === 'all' || r.task.projectId === project;
  const inState = (r: TaskTimeRow) => state === 'all' || (state === 'reviewed' ? !!r.reviewAt : !r.reviewAt);
  // Most recently sent to review first, then the ones still being worked on
  const byRecent = (a: TaskTimeRow, b: TaskTimeRow) => (b.reviewAt ?? '9').localeCompare(a.reviewAt ?? '9') || b.startedAt.localeCompare(a.startedAt);

  const groups = now ? groupTaskTime(allRows.filter(inProject), tasks, now).filter(g => inState(g.row)).sort((a, b) => byRecent(a.row, b.row)) : [];
  const flatRows = allRows.filter(r => inProject(r) && inState(r)).sort(byRecent);

  // Summary: tasks (subtasks count inside them)
  const taskRows = groups.map(g => g.row);
  const reviewed = taskRows.filter(r => r.reviewAt);
  const avg = (list: TaskTimeRow[], key: 'workedMinutes' | 'elapsedMinutes') =>
    list.length ? Math.round(list.reduce((sum, r) => sum + r[key], 0) / list.length) : 0;
  const running = allRows.filter(r => inProject(r) && r.running).length;
  const autoStops = taskRows.reduce((sum, r) => sum + r.autoStops, 0);
  const subTotal = groups.reduce((sum, g) => sum + g.subtaskTotal, 0);
  const subDone = groups.reduce((sum, g) => sum + g.subtaskDone, 0);

  // Chart: one bar per task, split into the task's own time and each subtask's
  const chartGroups = [...groups].sort((a, b) => b.row.workedMinutes - a.row.workedMinutes).slice(0, CHART_LIMIT);
  const chartData = chartGroups.map(g => {
    const parts = [
      ...(g.ownMinutes ? [{ name: g.subtasks.length ? `${g.row.task.key} itself` : g.row.task.key, minutes: g.ownMinutes }] : []),
      ...g.subtasks.map(s => ({ name: `${s.task.key} ${s.task.title}`, minutes: s.workedMinutes })),
    ];
    // Past the last segment, the rest is added up
    const segs = parts.length > MAX_SEGMENTS ? [...parts.slice(0, MAX_SEGMENTS - 1), { name: 'Other subtasks', minutes: parts.slice(MAX_SEGMENTS - 1).reduce((s, p) => s + p.minutes, 0) }] : parts;
    return {
      key: g.row.task.key,
      title: g.row.task.title,
      worked: g.row.workedMinutes,
      elapsed: g.row.elapsedMinutes,
      reviewed: !!g.row.reviewAt,
      person: g.row.workerIds.map(id => userById.get(id)?.name ?? id).join(', '),
      parts: segs,
      ...Object.fromEntries(segs.map((p, i) => [`s${i}`, Math.round((p.minutes / 60) * 100) / 100])),
    };
  });
  const segmentCount = Math.max(1, ...chartData.map(d => d.parts.length));

  const people = useMemo(() => {
    const ids = new Set(workSessions.map(w => w.userId));
    return users.filter(u => ids.has(u.id));
  }, [workSessions, users]);

  const downloadCsv = () => {
    const header = ['Level', 'Task', 'Parent', 'Title', 'Project', 'People', 'Status', 'Started', 'Sent to review', 'Worked (h)', 'Planned (h)', 'In Progress to Review (h)', 'Via', 'Auto-stops'];
    const line = (r: TaskTimeRow, level: string, parent: string, planned: number) => [
      level,
      r.task.key,
      parent,
      r.task.title,
      projects.find(p => p.id === r.task.projectId)?.name ?? '',
      r.workerIds.map(id => userById.get(id)?.name ?? id).join('; '),
      r.task.status,
      r.startedAt,
      r.reviewAt ?? '',
      (r.workedMinutes / 60).toFixed(2),
      planned ? (planned / 60).toFixed(2) : '',
      (r.elapsedMinutes / 60).toFixed(2),
      r.sources.join('; '),
      String(r.autoStops),
    ];
    const lines = groups.flatMap(g => [
      line(g.row, g.subtasks.length ? 'Task (with subtasks)' : 'Task', '', plannedFor(g)),
      ...g.subtasks.map(s => line(s, 'Subtask', g.row.task.key, s.task.effortMinutes ?? 0)),
    ]);
    const csv = [header, ...lines].map(l => l.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    const key = projectId ? projects.find(p => p.id === projectId)?.key : undefined;
    a.download = key ? `${key}_Task_Time_Report.csv` : 'Task_Time_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify('Task time exported as CSV');
  };

  const selectClass = 'px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash';
  /** Planned hours for a task: with a person chosen, only the parts assigned to them */
  const plannedFor = (g: TaskTimeGroup) => {
    if (person === 'all') return g.effortMinutes;
    const parts = [g.row.task, ...tasks.filter(t => t.parentId === g.row.task.id)];
    return parts.filter(t => t.assigneeId === person).reduce((sum, t) => sum + (t.effortMinutes ?? 0), 0);
  };
  const personName = person === 'all' ? undefined : userById.get(person)?.name;

  const row = (r: TaskTimeRow, opts: { planned: number; group?: TaskTimeGroup; sub?: boolean }) => {
    const first = userById.get(r.workerIds[0]);
    const g = opts.group;
    const hasSubs = Boolean(g && g.subtasks.length);
    const open = g ? !folded[g.row.task.id] : false;
    return (
      <tr key={r.task.id} className={cn('border-b border-line/60 last:border-0 hover:bg-mist/30', opts.sub && 'bg-paper/40')}>
        <td className={cn('py-2.5 max-w-[320px]', opts.sub ? 'pl-10 pr-4' : 'px-4')}>
          <span className="flex items-start gap-1">
            {hasSubs ? (
              <button
                type="button"
                onClick={() => setFolded(f => ({ ...f, [g!.row.task.id]: open }))}
                className="p-0.5 mt-px text-muted hover:text-ink"
                aria-expanded={open}
                aria-label={`${open ? 'Fold' : 'Show'} subtasks of ${r.task.key}`}
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !open && '-rotate-90')} />
              </button>
            ) : opts.sub ? <CornerDownRight className="w-3 h-3 mt-0.5 text-muted shrink-0" /> : <span className="w-[18px] shrink-0" />}
            <button type="button" onClick={() => openTaskDrawer(r.task.id)} className="text-left group">
              <span className="font-mono text-[10px] text-muted mr-1.5">{r.task.key}</span>
              <span className={cn('text-ink group-hover:text-flash-deep', opts.sub ? 'text-[12px]' : 'font-medium')}>{r.task.title}</span>
              {g && g.subtaskTotal > 0 && (
                <span className="ml-1.5 text-[10px] font-mono text-muted">{g.subtaskDone}/{g.subtaskTotal} subtasks</span>
              )}
            </button>
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span
            className="flex items-center gap-1.5 whitespace-nowrap"
            title={r.workerIds.map(id => `${userById.get(id)?.name ?? id}: ${formatMinutes(r.minutesByWorker[id] ?? 0)}`).join('\n')}
          >
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
              {g && g.subtaskTotal > 0 && g.subtaskDone === g.subtaskTotal
                ? 'All subtasks done, task not sent yet'
                : r.task.status === 'in_progress' || (g && r.running) ? 'Still in progress' : 'Not sent yet'}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap">
          <span
            className="font-semibold text-ink tabular-nums"
            title={hasSubs ? `${formatMinutes(g!.ownMinutes)} on the task itself + ${formatMinutes(r.workedMinutes - g!.ownMinutes)} on subtasks` : undefined}
          >
            {formatMinutes(r.workedMinutes)}
          </span>
          {r.autoStops > 0 && (
            <span
              className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-amber-700"
              title={`${r.autoStops} auto-stopped ${r.autoStops === 1 ? 'session' : 'sessions'} (idle or shift end)`}
            >
              <AlertTriangle className="w-3 h-3" />{r.autoStops}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right text-ink-soft"><Planned worked={r.workedMinutes} planned={opts.planned} finished={Boolean(r.reviewAt)} /></td>
        <td className="px-3 py-2.5 text-right text-muted whitespace-nowrap tabular-nums">
          {formatSpan(r.elapsedMinutes)}{!r.reviewAt && r.elapsedMinutes > 0 ? ' so far' : ''}
        </td>
        <td className="px-4 py-2.5">
          <span className="flex items-center gap-1">
            {r.sources.map(s => <AgentBadge key={s} source={s} showLabel={false} />)}
          </span>
        </td>
      </tr>
    );
  };

  const empty = grouped ? groups.length === 0 : flatRows.length === 0;

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
        <div className="flex items-center bg-paper-elevated rounded-lg border border-line p-0.5 text-xs font-semibold" role="tablist" aria-label="Subtasks">
          {([[true, 'Subtasks grouped'], [false, 'Separate rows']] as const).map(([v, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={grouped === v}
              onClick={() => setGrouped(v)}
              className={cn('px-3 py-1.5 rounded-md', grouped === v ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" icon={Download} onClick={downloadCsv} disabled={groups.length === 0} className="ml-auto">
          Export CSV
        </Button>
      </div>
      {personName && <p className="-mt-2 text-[11px] text-muted">Showing {personName}&apos;s time only.</p>}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Sent to review',
            value: String(reviewed.length),
            sub: `of ${taskRows.length} tasks worked on${subTotal ? ` · ${subDone}/${subTotal} subtasks done` : ''}`,
            icon: CheckCircle2,
          },
          { label: 'Avg worked per task', value: reviewed.length ? formatMinutes(avg(reviewed, 'workedMinutes')) : '—', sub: 'Timer time incl. subtasks, tasks sent to review', icon: Timer },
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
              {groups.length > CHART_LIMIT ? `Top ${CHART_LIMIT} of ${groups.length} by hours` : 'Hours on the timer'} · a task&apos;s bar is split into its subtasks · hover for details
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
                    <div className="bg-paper-elevated border border-line rounded-lg shadow-sm px-3 py-2 text-xs max-w-[280px]">
                      <p className="font-semibold text-ink">{d.key} · {d.title}</p>
                      <p className="text-muted mt-0.5">{d.person}</p>
                      <p className="mt-1.5 text-ink">Worked <span className="font-semibold tabular-nums">{formatMinutes(d.worked)}</span></p>
                      {d.parts.length > 1 && (
                        <ul className="mt-1 space-y-0.5 text-ink-soft">
                          {d.parts.map((p: { name: string; minutes: number }) => (
                            <li key={p.name} className="flex justify-between gap-3"><span className="truncate">{p.name}</span><span className="tabular-nums">{formatMinutes(p.minutes)}</span></li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-1 text-ink">
                        {d.reviewed ? 'In Progress → Review' : 'In progress for'} <span className="font-semibold tabular-nums">{formatSpan(d.elapsed)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              {Array.from({ length: segmentCount }, (_, i) => (
                <Bar key={i} dataKey={`s${i}`} stackId="worked" maxBarSize={16} stroke="var(--paper-elevated)" strokeWidth={2} name="Worked">
                  {chartData.map(d => (
                    <Cell key={d.key} fill={d.reviewed ? REVIEWED_COLOR : IN_PROGRESS_COLOR} fillOpacity={Math.max(0.4, 1 - i * 0.14)} />
                  ))}
                </Bar>
              ))}
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
                <th className="px-3 py-2.5 font-semibold text-right">Planned</th>
                <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">In Progress → Review</th>
                <th className="px-4 py-2.5 font-semibold">Via</th>
              </tr>
            </thead>
            <tbody>
              {grouped
                ? groups.map(g => (
                    <Fragment key={g.row.task.id}>
                      {row(g.row, { planned: plannedFor(g), group: g })}
                      {!folded[g.row.task.id] && g.subtasks.map(s => row(s, { planned: s.task.effortMinutes ?? 0, sub: true }))}
                    </Fragment>
                  ))
                : flatRows.map(r => row(r, { planned: r.task.effortMinutes ?? 0 }))}
              {now && empty && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted">No task time for these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-[11px] text-muted border-t border-line bg-paper/40">
          Worked is timer time: it starts when a card moves to In Progress (on the board or by an agent) and stops when it moves to In Review,
          plus any hours logged by hand. A task with subtasks adds up their time; Planned is the hours planned for it and its subtasks.
          Timers stop on their own after {formatMinutes(agentSettings.idleTimeoutMinutes)} without activity or when the shift ends at {agentSettings.dayCutoff},
          so idle and after-hours time isn&apos;t counted; <AlertTriangle className="inline w-3 h-3 text-amber-700" /> marks those auto-stops.
        </p>
      </section>
    </div>
  );
}
