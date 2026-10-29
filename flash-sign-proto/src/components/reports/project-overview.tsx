'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, ChevronRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/context/app-context';
import { Card, Button } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';
import { Avatar } from '@/components/shared/avatar';
import { projectHealth, type Insight } from '@/lib/project-health';
import { useNow } from '@/lib/use-now';
import { cn, formatDate } from '@/lib/utils';

const HEADLINE = {
  on_track: { label: 'On track', icon: ShieldCheck, className: 'border-emerald-500/30 bg-emerald-500/5', iconClass: 'text-emerald-600 dark:text-emerald-400' },
  at_risk: { label: 'At risk', icon: ShieldAlert, className: 'border-waiting/40 bg-waiting/5', iconClass: 'text-waiting' },
  off_track: { label: 'Off track', icon: ShieldX, className: 'border-danger/30 bg-danger/5', iconClass: 'text-danger' },
  delayed: { label: 'Delayed', icon: ShieldX, className: 'border-danger/30 bg-danger/5', iconClass: 'text-danger' },
};

const LIST_LIMIT = 5;

function Num({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-lg font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-ink-soft">{sub}</p>}
    </div>
  );
}

/**
 * The top of Reports > Overview: one line on how the project is doing, then what's going well
 * next to what needs attention, the few numbers that matter, recent activity and the team.
 */
export function ProjectOverview({ projectId, onOpenTimeline }: { projectId: string; onOpenTimeline: () => void }) {
  const router = useRouter();
  const { projects, tasks, users, milestones, epics, stories, taskStatusChanges, workSessions, openTaskDrawer } = useApp();
  const now = useNow();
  const [showAll, setShowAll] = useState<{ good: boolean; attention: boolean }>({ good: false, attention: false });

  const project = projects.find(p => p.id === projectId);
  if (!project || now === null) return null;

  const health = projectHealth({ project, milestones, epics, stories, tasks }, users, taskStatusChanges, workSessions, now);
  const Head = HEADLINE[health.headline.status] ?? HEADLINE.on_track;
  const n = health.numbers;

  const open = (i: Insight) => {
    const t = i.target;
    if (!t) return;
    if (t.kind === 'task') openTaskDrawer(t.id);
    else if (t.kind === 'timeline') onOpenTimeline();
    else if (t.kind === 'person') router.push(`/teams/members/${t.id}`);
    else if (t.kind === 'plan') router.push(`/projects/${projectId}/plan`);
    else router.push(`/projects/${projectId}/tasks`);
  };

  const list = (kind: 'good' | 'attention') => {
    const items = health[kind];
    const shown = showAll[kind] ? items : items.slice(0, LIST_LIMIT);
    const good = kind === 'good';
    const Icon = good ? CheckCircle2 : AlertTriangle;
    return (
      <Card className="p-4 space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon className={cn('w-4 h-4', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-waiting')} />
          {good ? 'Going well' : 'Needs attention'}
          <span className="text-[11px] font-normal text-muted">({items.length})</span>
        </h2>
        {items.length === 0 ? (
          <p className="py-3 text-xs text-muted">{good ? 'Nothing to highlight yet.' : 'Nothing needs attention right now.'}</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {shown.map((i, k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => open(i)}
                  disabled={!i.target}
                  className="w-full flex items-start gap-2 py-2 text-left disabled:cursor-default group"
                >
                  <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-waiting')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-ink group-enabled:group-hover:text-flash-deep">{i.text}</span>
                    {i.detail && <span className="block text-[11px] text-muted">{i.detail}</span>}
                  </span>
                  {i.target && <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {items.length > LIST_LIMIT && (
          <button type="button" onClick={() => setShowAll(s => ({ ...s, [kind]: !s[kind] }))} className="text-[11px] font-semibold text-flash-deep hover:underline">
            {showAll[kind] ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        )}
      </Card>
    );
  };

  const weekDiff = n.finishedThisWeek - n.finishedLastWeek;

  /** The overview as a CSV: headline, both lists, the key numbers, the team, and every task */
  const exportCsv = () => {
    const rows: string[][] = [['Section', 'Item', 'Detail']];
    rows.push(['Headline', `${Head.label}: ${health.headline.sentence}`, health.headline.facts.join('; ')]);
    health.good.forEach(i => rows.push(['Going well', i.text, i.detail ?? '']));
    health.attention.forEach(i => rows.push(['Needs attention', i.text, i.detail ?? '']));
    rows.push(
      ['Key numbers', 'Work done', `${n.workDone}% (time used ${n.timeUsed}%)`],
      ['Key numbers', 'Finished in the last 7 days', `${n.finishedThisWeek} (week before: ${n.finishedLastWeek})`],
      ['Key numbers', 'Finished on time', n.onTimeRate === undefined ? '' : `${n.onTimeRate}%`],
      ['Key numbers', 'Open tasks', `${n.open} (${n.overdue} overdue)`],
      ['Key numbers', 'Hours in the last 7 days', `${n.hoursThisWeek}h`],
    );
    health.team.forEach(m => rows.push(['Team', m.user.name, `${m.open} open, ${m.overdue} overdue, ${m.finishedThisWeek} finished and ${m.hoursThisWeek}h in the last 7 days${m.overloaded ? ', overloaded' : ''}`]));
    tasks
      .filter(t => t.projectId === projectId)
      .forEach(t => rows.push([t.parentId ? 'Subtask' : 'Task', `${t.key} ${t.title}`, [t.status, t.priority, users.find(u => u.id === t.assigneeId)?.name ?? 'Unassigned', t.dueDate ? `due ${t.dueDate.slice(0, 10)}` : ''].filter(Boolean).join('; ')]));
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.key}_Overview_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Overview exported as CSV');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      {/* Headline */}
      <div className={cn('flex items-start gap-3 rounded-2xl border p-4', Head.className)}>
        <Head.icon className={cn('w-6 h-6 shrink-0', Head.iconClass)} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">
            {Head.label} · {health.headline.sentence}
          </p>
          <p className="text-xs text-ink-soft">{health.headline.facts.join(' · ')}</p>
        </div>
      </div>

      {/* Good and bad side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list('good')}
        {list('attention')}
      </div>

      {/* Key numbers */}
      <Card className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Num label="Work done" value={`${n.workDone}%`} sub={`${n.timeUsed}% of the time used`} />
        <Num
          label="Finished in the last 7 days"
          value={String(n.finishedThisWeek)}
          sub={weekDiff > 0 ? `${weekDiff} more than the week before` : weekDiff < 0 ? `${-weekDiff} fewer than the week before` : 'Same as the week before'}
        />
        <Num label="Finished on time" value={n.onTimeRate === undefined ? '—' : `${n.onTimeRate}%`} sub="Of finished tasks with a due date" />
        <Num label="Open tasks" value={String(n.open)} sub={`${n.overdue} overdue`} />
        <Num label="Hours in the last 7 days" value={`${n.hoursThisWeek}h`} sub="On the timer" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Activity */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Tasks finished per day</h2>
          <p className="text-xs text-muted mb-2">Last 14 days. Shows whether the team is speeding up or slowing down.</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={health.activity} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="day" tickFormatter={d => formatDate(d).replace(/, \d{4}$/, '').replace(/^\w+ /, '')} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--mist)', opacity: 0.5 }}
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload;
                  if (!d) return null;
                  return (
                    <div className="bg-paper-elevated border border-line rounded-lg shadow-sm px-3 py-2 text-xs">
                      <p className="font-semibold text-ink">{formatDate(d.day)}</p>
                      <p className="text-ink-soft">{d.finished} task{d.finished === 1 ? '' : 's'} finished</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="finished" fill="var(--flash)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Team */}
        <Card className="p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-ink">Team</h2>
          <p className="text-xs text-muted mb-2">Open tasks and subtasks, and the last 7 days, per person.</p>
          {health.team.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">No one has work in this project yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-1.5 pr-2 font-semibold">Person</th>
                    <th className="py-1.5 pr-2 font-semibold text-right">Open</th>
                    <th className="py-1.5 pr-2 font-semibold text-right">Overdue</th>
                    <th className="py-1.5 pr-2 font-semibold text-right">Finished (7 days)</th>
                    <th className="py-1.5 font-semibold text-right">Hours (7 days)</th>
                  </tr>
                </thead>
                <tbody>
                  {health.team.map(m => (
                    <tr key={m.user.id} onClick={() => router.push(`/teams/members/${m.user.id}`)} className="border-t border-line/60 cursor-pointer hover:bg-mist/30">
                      <td className="py-1.5 pr-2">
                        <span className="flex items-center gap-2">
                          <Avatar user={m.user} size="xs" />
                          <span className="font-medium text-ink">{m.user.name}</span>
                          {m.overloaded && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-waiting/40 bg-waiting/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                              <AlertTriangle className="w-2.5 h-2.5 text-waiting" /> Overloaded
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums text-ink">{m.open}</td>
                      <td className={cn('py-1.5 pr-2 text-right tabular-nums', m.overdue ? 'font-semibold text-ink' : 'text-muted')}>{m.overdue}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums text-ink-soft">{m.finishedThisWeek}</td>
                      <td className="py-1.5 text-right tabular-nums text-ink-soft">{m.hoursThisWeek}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
