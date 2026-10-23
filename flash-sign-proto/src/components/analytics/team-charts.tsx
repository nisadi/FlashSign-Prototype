'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Rectangle,
} from 'recharts';
import type { User, Task, Meeting, AvailabilityStatus } from '@/types';
import { WEEKLY_TASK_FLOW } from '@/data/mock-analytics';
import { ChartCard, ChartLegend, ChartTooltip, SERIES_COLORS, CHART_INK } from './chart-card';

const formatWeek = (iso: string | number) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const firstName = (name: string) => name.split(' ')[0];

// Bars match the page's progress bars (h-2): thin, with fully rounded ends.
// Stacked bars get 2px extra because the 2px surface-coloured gap stroke eats 1px each side.
const BAR_THICKNESS = 8;

const axisProps = {
  tick: { fill: CHART_INK.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART_INK.grid },
};

// ── Tasks created vs completed (demo trend) ──────────────────────────────────
export function TaskFlowChart({ className }: { className?: string }) {
  const latest = WEEKLY_TASK_FLOW[WEEKLY_TASK_FLOW.length - 1];
  const series = [
    { key: 'created', label: 'Created', color: SERIES_COLORS[0] },
    { key: 'completed', label: 'Completed', color: SERIES_COLORS[1] },
  ] as const;

  return (
    <ChartCard
      className={className}
      title="Tasks created vs completed"
      description="Per week, last 8 weeks"
      badge="Demo data"
      table={{
        columns: ['Week of', 'Created', 'Completed'],
        rows: WEEKLY_TASK_FLOW.map(w => [formatWeek(w.weekStart), w.created, w.completed]),
      }}
    >
      <ChartLegend items={series.map(s => ({ label: `${s.label} this week`, color: s.color, value: latest[s.key] }))} />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEEKLY_TASK_FLOW} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis dataKey="weekStart" tickFormatter={formatWeek} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
            <Tooltip
              content={<ChartTooltip formatLabel={l => `Week of ${formatWeek(l)}`} />}
              cursor={{ stroke: CHART_INK.grid, strokeWidth: 1 }}
            />
            {series.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: s.color, stroke: CHART_INK.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: s.color, stroke: CHART_INK.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Availability right now ───────────────────────────────────────────────────
// Same hues as the AvailabilityBadge chips (validated as a set), so chart and badges agree.
const AVAILABILITY: { status: AvailabilityStatus; label: string; color: string }[] = [
  { status: 'available', label: 'Available', color: '#10b981' },
  { status: 'busy', label: 'Busy', color: '#f59e0b' },
  { status: 'focus_time', label: 'Focus time', color: '#6366f1' },
  { status: 'out_of_office', label: 'Out of office', color: '#f43f5e' },
];

export function AvailabilityNow({ users }: { users: User[] }) {
  const groups = AVAILABILITY.map(a => ({
    ...a,
    members: users.filter(u => (u.availability || 'available') === a.status),
  }));
  const total = users.length || 1;
  const away = groups.filter(g => g.status !== 'available' && g.members.length > 0);

  return (
    <ChartCard
      title="Availability right now"
      description={`${groups[0].members.length} of ${users.length} members available`}
      action={{ label: 'Schedule', href: '/planner/availability' }}
      table={{
        columns: ['Status', 'Members'],
        rows: groups.map(g => [g.label, g.members.length]),
      }}
    >
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px]" role="img" aria-label={groups.map(g => `${g.label}: ${g.members.length}`).join(', ')}>
        {groups.filter(g => g.members.length > 0).map(g => (
          <div
            key={g.status}
            title={`${g.label}: ${g.members.length}`}
            style={{ width: `${(g.members.length / total) * 100}%`, background: g.color }}
          />
        ))}
      </div>
      <ChartLegend items={groups.map(g => ({ label: g.label, color: g.color, value: g.members.length }))} />

      {away.length > 0 && (
        <ul className="space-y-1.5 border-t border-line pt-3 text-xs">
          {away.map(g => (
            <li key={g.status} className="flex gap-2">
              <span className="text-muted shrink-0 w-24">{g.label}</span>
              <span className="text-ink">{g.members.map(m => m.name).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

// ── Task status per member ───────────────────────────────────────────────────
const STATUS_SERIES = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'review', label: 'In review' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
] as const;

export function TaskStatusByMember({ users, tasks, className }: { users: User[]; tasks: Task[]; className?: string }) {
  const rows = useMemo(() => {
    return users
      .map(u => {
        const mine = tasks.filter(t => t.assigneeId === u.id);
        const counts = Object.fromEntries(
          STATUS_SERIES.map(s => [s.key, mine.filter(t => t.status === s.key).length])
        ) as Record<(typeof STATUS_SERIES)[number]['key'], number>;
        // The first and last non-empty segments carry the rounded ends; the last also carries the total
        const firstKey = STATUS_SERIES.find(s => counts[s.key] > 0)?.key;
        const lastKey = [...STATUS_SERIES].reverse().find(s => counts[s.key] > 0)?.key;
        return { name: firstName(u.name), fullName: u.name, total: mine.length, firstKey, lastKey, ...counts };
      })
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [users, tasks]);

  const totals = STATUS_SERIES.map(s => rows.reduce((sum, r) => sum + r[s.key], 0));

  return (
    <ChartCard
      className={className}
      title="Task status per member"
      description="Every task assigned to each person, by workflow status"
      action={{ label: 'My Tasks', href: '/projects/my-tasks' }}
      table={{
        columns: ['Member', ...STATUS_SERIES.map(s => s.label), 'Total'],
        rows: rows.map(r => [r.fullName, ...STATUS_SERIES.map(s => r[s.key]), r.total]),
      }}
    >
      <ChartLegend items={STATUS_SERIES.map((s, i) => ({ label: s.label, color: SERIES_COLORS[i], value: totals[i] }))} />
      <div style={{ height: Math.max(160, rows.length * 34 + 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="name" width={64} {...axisProps} axisLine={false} />
            <Tooltip
              content={<ChartTooltip formatLabel={l => rows.find(r => r.name === l)?.fullName ?? String(l)} />}
              cursor={{ fill: 'rgba(12, 31, 34, 0.04)' }}
            />
            {STATUS_SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="status"
                fill={SERIES_COLORS[i]}
                stroke={CHART_INK.surface}
                strokeWidth={2}
                barSize={BAR_THICKNESS + 2}
                isAnimationActive={false}
                shape={(props: unknown) => {
                  const p = props as React.ComponentProps<typeof Rectangle> & {
                    payload?: { firstKey?: string; lastKey?: string };
                  };
                  const r = BAR_THICKNESS / 2;
                  const left = p.payload?.firstKey === s.key ? r : 0;
                  const right = p.payload?.lastKey === s.key ? r : 0;
                  return <Rectangle {...p} radius={[left, right, right, left]} />;
                }}
              >
                <LabelList
                  dataKey="total"
                  content={(props: unknown) => {
                    const { x, y, width, height, index } = props as {
                      x?: number | string; y?: number | string; width?: number | string; height?: number | string; index?: number;
                    };
                    const row = index !== undefined ? rows[index] : undefined;
                    if (!row || row.lastKey !== s.key) return null;
                    return (
                      <text
                        x={Number(x) + Number(width) + 6}
                        y={Number(y) + Number(height) / 2}
                        dy={4}
                        fill={CHART_INK.text}
                        fontSize={11}
                      >
                        {row.total}
                      </text>
                    );
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ── Meeting hours this week ──────────────────────────────────────────────────
export function MeetingLoad({ users, meetings, weekStart, weekEnd }: {
  users: User[];
  meetings: Meeting[];
  /** YYYY-MM-DD, inclusive */
  weekStart: string;
  weekEnd: string;
}) {
  const rows = useMemo(() => {
    const thisWeek = meetings.filter(m => m.status !== 'cancelled' && m.date >= weekStart && m.date <= weekEnd);
    return users
      .map(u => {
        const minutes = thisWeek
          .filter(m => m.organizerId === u.id || m.participantIds.includes(u.id))
          .reduce((sum, m) => sum + m.durationMinutes, 0);
        return { name: firstName(u.name), fullName: u.name, hours: Math.round((minutes / 60) * 10) / 10 };
      })
      .filter(r => r.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [users, meetings, weekStart, weekEnd]);

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);

  return (
    <ChartCard
      title="Meeting hours"
      description={`This week · ${Math.round(totalHours * 10) / 10} h across ${rows.length} people`}
      action={{ label: 'Meetings', href: '/planner/meetings' }}
      table={{ columns: ['Member', 'Hours'], rows: rows.map(r => [r.fullName, r.hours]) }}
    >
      {rows.length === 0 ? (
        <p className="text-xs text-muted py-8 text-center">No meetings scheduled this week.</p>
      ) : (
        <div style={{ height: Math.max(140, rows.length * 30 + 30) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" width={64} {...axisProps} axisLine={false} />
              <Tooltip
                content={<ChartTooltip formatLabel={l => rows.find(r => r.name === l)?.fullName ?? String(l)} formatValue={v => `${v} h`} />}
                cursor={{ fill: 'rgba(12, 31, 34, 0.04)' }}
              />
              <Bar
                dataKey="hours"
                name="Meeting hours"
                fill={SERIES_COLORS[0]}
                barSize={BAR_THICKNESS}
                radius={BAR_THICKNESS / 2}
                isAnimationActive={false}
              >
                <LabelList dataKey="hours" position="right" fill={CHART_INK.text} fontSize={11} formatter={(v: unknown) => `${v} h`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
