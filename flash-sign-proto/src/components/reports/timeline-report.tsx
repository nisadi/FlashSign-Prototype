'use client';

import { Fragment, useState } from 'react';
import {
  CalendarClock, Gauge, Flag, History, Download, ChevronDown, Clock, CheckCircle2, AlertTriangle, XCircle, CircleDot,
  TrendingDown, TrendingUp, Minus,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Button } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';
import { formatMinutes } from '@/lib/agent-connection';
import { formatDays, formatDuration } from '@/lib/durations';
import { LEVEL_LABEL, levelsOf, projectStructure } from '@/lib/structure';
import { addDays, diffCalendarDays } from '@/lib/timeline-calculator';
import {
  checkpoints as getCheckpoints, flattenRows, lateDrivers, timelineRows, timelineSummary,
  type CheckpointStatus, type TimelineRow,
} from '@/lib/timeline-report';
import { useNow } from '@/lib/use-now';
import { cn, formatDate } from '@/lib/utils';

const CHECKPOINT: Record<CheckpointStatus, { label: string; icon: React.ElementType; className: string }> = {
  achieved: { label: 'Achieved', icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  on_track: { label: 'On track', icon: CircleDot, className: 'border-line bg-paper text-ink-soft' },
  at_risk: { label: 'At risk', icon: AlertTriangle, className: 'border-waiting/40 bg-waiting/10 text-waiting' },
  missed: { label: 'Missed', icon: XCircle, className: 'border-danger/30 bg-danger/10 text-danger' },
};

const PACE = {
  behind: { label: 'Behind', icon: TrendingDown, className: 'text-waiting' },
  on_pace: { label: 'On pace', icon: Minus, className: 'text-ink-soft' },
  ahead: { label: 'Ahead', icon: TrendingUp, className: 'text-emerald-700 dark:text-emerald-400' },
};

function LatePill({ days }: { days: number }) {
  if (days <= 0) return <span className="text-[11px] text-muted">On time</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-waiting/40 bg-waiting/10 px-1.5 py-0.5 text-[11px] font-semibold text-ink whitespace-nowrap">
      <Clock className="w-3 h-3 text-waiting" />+{days} day{days === 1 ? '' : 's'}
    </span>
  );
}

function SummaryCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon className="w-3.5 h-3.5 text-flash-deep" /> {title}
      </p>
      {children}
    </Card>
  );
}

/**
 * Reports > Timeline for one project: how the whole plan is doing against time. A summary, the
 * plan as a chart (planned time, progress and lateness for every phase, epic and story), the
 * tasks pushing the end out, and each phase's checkpoint.
 */
export function TimelineReport({ projectId }: { projectId: string }) {
  const { projects, tasks, milestones, epics, stories, taskStatusChanges, workSessions, openTaskDrawer } = useApp();
  const now = useNow();
  const [topFilter, setTopFilter] = useState('all');
  const [showFinished, setShowFinished] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const project = projects.find(p => p.id === projectId);
  if (!project || now === null) return null;

  const data = { project, milestones, epics, stories, tasks };
  const structure = projectStructure(project);
  const topLevel = levelsOf(structure)[0];
  const allRows = timelineRows(data, taskStatusChanges, workSessions, now);
  const cps = getCheckpoints(data, allRows, now);
  const summary = timelineSummary(data, cps, now);
  const drivers = lateDrivers(data, taskStatusChanges, now);

  // Filters: one top-level item, and whether finished items show
  const keep = (r: TimelineRow): TimelineRow | null => {
    if (!showFinished && r.progress === 100 && r.lateBy === 0) return null;
    return { ...r, children: r.children.map(keep).filter((c): c is TimelineRow => c !== null) };
  };
  const rows = allRows
    .filter(r => topFilter === 'all' || r.id === topFilter)
    .map(keep)
    .filter((r): r is TimelineRow => r !== null);

  // The chart's time window: the project's planned time, stretched to cover lateness and today
  const t = new Date(now).toISOString().slice(0, 10);
  const all = flattenRows(allRows);
  const from = addDays([summary.plannedEnd, ...all.map(r => r.start), (project.originalStartDate || project.startDate).slice(0, 10)].sort()[0], -3);
  const to = addDays([summary.plannedEnd, summary.forecastEnd, t, ...all.map(r => r.forecastEnd)].sort().pop()!, 4);
  const span = Math.max(1, diffCalendarDays(from, to));
  const pct = (d: string) => Math.min(100, Math.max(0, (diffCalendarDays(from, d) / span) * 100));
  const months: { at: string; label: string }[] = [];
  for (let d = new Date(`${from.slice(0, 7)}-01T00:00:00Z`); ; d.setUTCMonth(d.getUTCMonth() + 1)) {
    const at = d.toISOString().slice(0, 10);
    if (at > to) break;
    if (at >= from) months.push({ at, label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC', ...(d.getUTCMonth() === 0 ? { year: 'numeric' } : {}) }) });
  }

  const exportCsv = () => {
    const header = ['Level', 'Name', 'Planned start', 'Planned end', 'Length', 'Forecast end', 'Days late', 'Progress %', 'Worked hours', 'Estimate days'];
    const lines = flattenRows(allRows).map(r => [
      LEVEL_LABEL[r.level].one,
      `"${'  '.repeat(r.depth)}${r.name.replace(/"/g, '""')}"`,
      r.start, r.end, `"${formatDuration(r.start, r.end, r.unit)}"`, r.forecastEnd, r.lateBy, r.progress,
      (r.workedMinutes / 60).toFixed(1), r.estimateDays,
    ]);
    const csv = [header.join(','), ...lines.map(l => l.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${csv}`));
    link.setAttribute('download', `${project.key}_Timeline_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Timeline exported as CSV');
  };

  const renderRow = (r: TimelineRow): React.ReactNode => {
    const open = !collapsed[r.id];
    const doneTo = addDays(r.start, Math.round((diffCalendarDays(r.start, r.end) * r.progress) / 100));
    return (
      <Fragment key={r.id}>
        <div className="group grid grid-cols-[240px_1fr_330px] items-center border-t border-line/60 hover:bg-mist/30 focus-within:bg-mist/30">
          {/* Name */}
          <div className="flex items-center gap-1.5 py-2 pr-2 min-w-0" style={{ paddingLeft: 8 + r.depth * 16 }}>
            {r.children.length > 0 ? (
              <button
                type="button"
                onClick={() => setCollapsed(c => ({ ...c, [r.id]: open }))}
                className="p-0.5 text-muted hover:text-ink"
                aria-expanded={open}
                aria-label={`${open ? 'Fold' : 'Open'} ${r.name}`}
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !open && '-rotate-90')} />
              </button>
            ) : <span className="w-[18px]" />}
            {r.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />}
            <span className={cn('truncate text-xs text-ink', r.depth === 0 ? 'font-bold' : 'font-medium')} title={r.name}>{r.name}</span>
          </div>

          {/* Track: planned bar, progress, lateness */}
          <div className="relative h-8" tabIndex={0} aria-label={`${r.name}: planned ${formatDate(r.start)} to ${formatDate(r.end)}, ${r.progress}% done${r.lateBy ? `, ${r.lateBy} days late` : ''}`}>
            <span
              className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-ink/15"
              style={{ left: `${pct(r.start)}%`, width: `${Math.max(0.6, pct(r.end) - pct(r.start))}%` }}
            />
            {r.progress > 0 && (
              <span
                className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded bg-flash"
                style={{ left: `${pct(r.start)}%`, width: `${Math.max(0.6, pct(doneTo) - pct(r.start))}%` }}
              />
            )}
            {r.lateBy > 0 && (
              <span
                className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-r bg-waiting/70"
                style={{ left: `calc(${pct(r.end)}% + 2px)`, width: `calc(${Math.max(0.6, pct(r.forecastEnd) - pct(r.end))}% - 2px)` }}
              />
            )}
            {/* Hover details */}
            <div
              className="pointer-events-none absolute z-20 top-full mt-0.5 hidden group-hover:block group-focus-within:block w-60 rounded-lg border border-line bg-paper-elevated p-2.5 text-[11px] text-ink-soft shadow-xl"
              style={{ left: `min(${pct(r.start)}%, calc(100% - 15rem))` }}
            >
              <p className="font-semibold text-ink mb-1">{r.name}</p>
              <p>Planned {formatDate(r.start)} → {formatDate(r.end)} ({formatDuration(r.start, r.end, r.unit)}){r.inherited ? ', all of its parent' : ''}</p>
              <p>{r.lateBy > 0 ? `Now ends ${formatDate(r.forecastEnd)}, ${r.lateBy} days late` : 'On time'}</p>
              <p>{r.progress}% done · {r.taskCount} task{r.taskCount === 1 ? '' : 's'}</p>
              <p>Worked {formatMinutes(r.workedMinutes)} · estimate {formatDays(r.estimateDays)}</p>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-[64px_84px_40px_1fr] items-center gap-2 pl-3 pr-2 text-[11px] font-mono text-ink-soft">
            <span>{formatDate(r.forecastEnd).replace(/, \d{4}$/, '')}</span>
            <LatePill days={r.lateBy} />
            <span className="text-right">{r.progress}%</span>
            <span className="whitespace-nowrap text-muted" title={`Worked ${formatMinutes(r.workedMinutes)} on the timer; estimated work ${formatDays(r.estimateDays)}`}>
              {formatMinutes(r.workedMinutes)} · {r.estimateDays}d
            </span>
          </div>
        </div>
        {open && r.children.map(renderRow)}
      </Fragment>
    );
  };

  const lastReplan = project.baselineHistory?.at(-1);
  const Pace = PACE[summary.pace];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {topLevel && (
          <select
            value={topFilter}
            onChange={e => setTopFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            aria-label={`Show one ${LEVEL_LABEL[topLevel].one}`}
          >
            <option value="all">All {LEVEL_LABEL[topLevel].many}</option>
            {allRows.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink cursor-pointer">
          <input type="checkbox" checked={showFinished} onChange={e => setShowFinished(e.target.checked)} className="accent-flash" />
          Show finished
        </label>
        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} className="ml-auto">
          Export CSV
        </Button>
      </div>

      {/* 1. Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={CalendarClock} title="End date">
          <p className="text-sm text-ink">
            Planned <span className="font-semibold">{formatDate(summary.plannedEnd)}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink">
            Now <span className="font-semibold">{formatDate(summary.forecastEnd)}</span> <LatePill days={summary.lateBy} />
          </p>
        </SummaryCard>
        <SummaryCard icon={Gauge} title="Time used vs work done">
          <p className={cn('flex items-center gap-1 text-sm font-semibold', Pace.className)}>
            <Pace.icon className="w-4 h-4" /> {Pace.label}
          </p>
          {[['Time used', summary.timeUsed, 'bg-ink/40'], ['Work done', summary.workDone, 'bg-flash']].map(([label, value, color]) => (
            <div key={label as string} className="flex items-center gap-2 text-[11px] text-ink-soft">
              <span className="w-16 shrink-0">{label}</span>
              <span className="flex-1 h-1.5 rounded-full bg-mist overflow-hidden">
                <span className={cn('block h-full rounded-full', color as string)} style={{ width: `${value}%` }} />
              </span>
              <span className="w-8 text-right font-mono">{value}%</span>
            </div>
          ))}
        </SummaryCard>
        <SummaryCard icon={Flag} title="Phase checkpoints">
          {summary.checkpoints.total ? (
            <>
              <p className="text-sm text-ink">
                <span className="font-semibold">{summary.checkpoints.achieved} of {summary.checkpoints.total}</span> achieved
              </p>
              <p className="text-[11px] text-ink-soft">
                {summary.checkpoints.at_risk} at risk · {summary.checkpoints.missed} missed · {summary.checkpoints.on_track} on track
              </p>
            </>
          ) : (
            <p className="text-xs text-muted">This project doesn&apos;t use phases.</p>
          )}
        </SummaryCard>
        <SummaryCard icon={History} title="Changes to the plan">
          {summary.replans ? (
            <>
              <p className="text-sm text-ink">
                Re-planned <span className="font-semibold">{summary.replans} time{summary.replans === 1 ? '' : 's'}</span>
              </p>
              {lastReplan && <p className="text-[11px] text-ink-soft truncate" title={lastReplan.reason}>Last: {formatDate(lastReplan.at)}, &quot;{lastReplan.reason}&quot;</p>}
            </>
          ) : (
            <p className="text-sm text-ink">Original plan, not changed</p>
          )}
        </SummaryCard>
      </div>

      {/* 2. The plan as a chart */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">The plan over time</h2>
            <p className="text-xs text-muted">Every {levelsOf(structure).map(l => LEVEL_LABEL[l].one).join(', ')}: planned time, progress, and how far it&apos;s running late.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded bg-ink/15" /> Planned</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded bg-flash" /> Done so far</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2.5 rounded bg-waiting/70" /> Running late</span>
            <span className="flex items-center gap-1"><span className="w-px h-3 bg-danger" /> Today</span>
            <span className="flex items-center gap-1"><span className="h-3 border-l border-dashed border-ink/60" /> Original end</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            {topLevel ? `No ${LEVEL_LABEL[topLevel].many} to show.` : 'This project has tasks only; there are no phases, epics or stories to chart.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              {/* Header: month ticks and the end markers */}
              <div className="grid grid-cols-[240px_1fr_330px] items-end text-[10px] text-muted">
                <span className="pl-2 pb-1 font-semibold uppercase tracking-wider">{topLevel ? LEVEL_LABEL[topLevel].many : ''}</span>
                <div className="relative h-6">
                  {months.map(m => (
                    <span key={m.at} className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap" style={{ left: `${pct(m.at)}%` }}>{m.label}</span>
                  ))}
                </div>
                <div className="grid grid-cols-[64px_84px_40px_1fr] gap-2 pl-3 pr-2 pb-1 font-semibold uppercase tracking-wider">
                  <span>Ends</span><span>Late</span><span className="text-right">Done</span><span title="Timer hours · estimated days">Worked · est.</span>
                </div>
              </div>

              <div className="relative">
                {/* Grid lines and markers over the track column */}
                <div className="pointer-events-none absolute inset-y-0 left-[240px] right-[330px]">
                  {months.map(m => <span key={m.at} className="absolute inset-y-0 w-px bg-line/60" style={{ left: `${pct(m.at)}%` }} />)}
                  <span className="absolute inset-y-0 border-l border-dashed border-ink/60" style={{ left: `${pct(summary.plannedEnd)}%` }} title={`Original end ${formatDate(summary.plannedEnd)}`} />
                  {summary.lateBy > 0 && (
                    <span className="absolute inset-y-0 w-0.5 bg-waiting" style={{ left: `${pct(summary.forecastEnd)}%` }} title={`Forecast end ${formatDate(summary.forecastEnd)}`} />
                  )}
                  <span className="absolute inset-y-0 w-px bg-danger" style={{ left: `${pct(t)}%` }} title="Today" />
                </div>
                {rows.map(renderRow)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 3. What's pushing the end out */}
      <Card className="p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">What&apos;s pushing the end out</h2>
          <p className="text-xs text-muted">Tasks finishing after their due date, worst first. Click one to open it.</p>
        </div>
        {drivers.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">Nothing is running late.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3 font-semibold">Task</th>
                  <th className="py-2 pr-3 font-semibold">Makes late</th>
                  <th className="py-2 pr-3 font-semibold">Late by</th>
                  <th className="py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.task.id} onClick={() => openTaskDrawer(d.task.id)} className="border-t border-line/60 cursor-pointer hover:bg-mist/30">
                    <td className="py-2 pr-3">
                      <span className="font-mono text-[10px] text-muted mr-1.5">{d.task.key}</span>
                      <span className="text-ink font-medium">{d.task.title}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {d.pushes.length ? (
                        <span className="flex flex-wrap gap-1">
                          {d.pushes.map(p => (
                            <span key={p} className={cn('rounded-full border px-1.5 py-0.5 text-[10px] whitespace-nowrap', p === 'the project end' ? 'border-waiting/40 bg-waiting/10 text-ink font-semibold' : 'border-line text-ink-soft')}>
                              {p}
                            </span>
                          ))}
                        </span>
                      ) : <span className="text-muted">Only itself</span>}
                    </td>
                    <td className="py-2 pr-3"><LatePill days={d.lateBy} /></td>
                    <td className="py-2 text-ink-soft">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Phase checkpoints */}
      {cps.length > 0 && (
        <Card className="p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Phase checkpoints</h2>
            <p className="text-xs text-muted">Whether each phase will finish by its checkpoint date.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3 font-semibold">Phase</th>
                  <th className="py-2 pr-3 font-semibold">Checkpoint</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {cps.map(c => {
                  const s = CHECKPOINT[c.status];
                  return (
                    <tr key={c.phase.id} className="border-t border-line/60">
                      <td className="py-2 pr-3 font-medium text-ink">{c.phase.name}</td>
                      <td className="py-2 pr-3 font-mono text-ink-soft">{formatDate(c.end)}</td>
                      <td className="py-2 pr-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', s.className)}>
                          <s.icon className="w-3 h-3" /> {s.label}
                        </span>
                      </td>
                      <td className="py-2 text-ink-soft">
                        {c.status === 'achieved' ? '—' : c.lateBy > 0 ? (
                          <span className="flex items-center gap-1.5">{formatDate(c.forecastEnd)} <LatePill days={c.lateBy} /></span>
                        ) : c.status === 'missed' ? 'Checkpoint passed without being marked achieved' : 'On time'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
