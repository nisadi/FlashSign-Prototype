import type { DurationUnit, Milestone, Task, TaskStatusChange, WorkSession } from '@/types';
import { sessionMinutes } from './agent-connection';
import { formatDays } from './durations';
import { withSubtasks } from './plan';
import {
  epicSpan, forecastEnd, forecastOf, phaseSpan, projectWindow, storySpan, type PlanData, type TimeWindow,
} from './schedule';
import { LINK_KEY, levelsOf, projectStructure, type PlanLevel } from './structure';
import { progressOfTasks } from './subtasks';
import { addDays, diffCalendarDays } from './timeline-calculator';
import { formatDate } from './utils';

/**
 * The numbers behind Reports > Timeline: the plan as a tree with planned and forecast ends,
 * the tasks pushing the end out, phase checkpoints and a summary. All from existing data.
 */

export interface TimelineRow {
  id: string;
  level: PlanLevel;
  name: string;
  depth: number;
  color?: string;
  start: string;
  end: string;
  unit?: DurationUnit;
  /** Uses all of its parent's time rather than its own dates */
  inherited: boolean;
  forecastEnd: string;
  lateBy: number;
  progress: number;
  workedMinutes: number;
  /** Estimated work in days: tasks without subtasks plus subtasks */
  estimateDays: number;
  taskCount: number;
  children: TimelineRow[];
}

export type CheckpointStatus = 'achieved' | 'missed' | 'at_risk' | 'on_track';

export interface Checkpoint {
  phase: Milestone;
  end: string;
  status: CheckpointStatus;
  forecastEnd: string;
  lateBy: number;
}

export interface LateDriver {
  task: Task;
  plannedEnd: string;
  forecastEnd: string;
  lateBy: number;
  /** What it makes finish late: its story, epic, phase and/or the project */
  pushes: string[];
  reason: string;
}

export interface TimelineSummary {
  plannedEnd: string;
  forecastEnd: string;
  lateBy: number;
  timeUsed: number;
  workDone: number;
  pace: 'ahead' | 'on_pace' | 'behind';
  checkpoints: Record<CheckpointStatus, number> & { total: number };
  replans: number;
}

const day = (d?: string) => (d ? d.slice(0, 10) : undefined);
const today = (now: number) => new Date(now).toISOString().slice(0, 10);

interface Ctx {
  data: PlanData;
  projectTasks: Task[];
  mainTasks: Task[];
  changes: TaskStatusChange[];
  sessions: WorkSession[];
  now: number;
}

function rowFor(ctx: Ctx, level: PlanLevel, id: string, span: TimeWindow, depth: number, extra: Partial<TimelineRow>, inherited: boolean): TimelineRow {
  const scope = ctx.mainTasks.filter(t => t[LINK_KEY[level]] === id);
  const all = withSubtasks(scope, ctx.projectTasks);
  const ids = new Set(all.map(t => t.id));
  const leaves = all.filter(t => !all.some(s => s.parentId === t.id));
  const forecast = forecastOf(span.end, scope, ctx.projectTasks, ctx.changes, ctx.now);
  return {
    id,
    level,
    name: span.label,
    depth,
    start: span.start,
    end: span.end,
    inherited,
    forecastEnd: forecast.end,
    lateBy: forecast.lateBy,
    progress: progressOfTasks(all),
    workedMinutes: ctx.sessions.filter(w => ids.has(w.taskId)).reduce((sum, w) => sum + sessionMinutes(w.startedAt, w.endedAt, ctx.now), 0),
    estimateDays: leaves.reduce((sum, t) => sum + Math.max(1, Number(t.estimatedDuration) || 1), 0),
    taskCount: scope.length,
    children: [],
    ...extra,
  };
}

/** The plan as a tree, following the project's structure (e.g. Phase → Epic → Story) */
export function timelineRows(data: PlanData, changes: TaskStatusChange[], sessions: WorkSession[], now: number): TimelineRow[] {
  const { project } = data;
  const structure = projectStructure(project);
  const levels = levelsOf(structure);
  const projectTasks = data.tasks.filter(t => t.projectId === project.id);
  const ctx: Ctx = { data, projectTasks, mainTasks: projectTasks.filter(t => !t.parentId), changes, sessions, now };
  const epics = data.epics.filter(e => e.projectId === project.id);
  const stories = data.stories.filter(s => s.projectId === project.id);

  const storyRow = (st: (typeof stories)[number], depth: number) =>
    rowFor(ctx, 'story', st.id, storySpan(st, data), depth, { unit: st.durationUnit, name: st.title }, !(st.startDate && st.endDate));
  const epicRow = (ep: (typeof epics)[number], depth: number) => {
    const row = rowFor(ctx, 'epic', ep.id, epicSpan(ep, data), depth, { unit: ep.durationUnit, color: ep.color }, !(ep.startDate && ep.endDate));
    if (structure.stories) row.children = stories.filter(s => s.epicId === ep.id).map(s => storyRow(s, depth + 1));
    return row;
  };
  const phaseRow = (ph: Milestone) => {
    const row = rowFor(ctx, 'phase', ph.id, phaseSpan(ph, project), 0, { unit: ph.durationUnit }, false);
    if (structure.epics) row.children = epics.filter(e => e.phaseId === ph.id).map(e => epicRow(e, 1));
    else if (structure.stories) row.children = stories.filter(s => !s.epicId && s.phaseId === ph.id).map(s => storyRow(s, 1));
    return row;
  };

  const sortByStart = (rows: TimelineRow[]) => rows.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  if (levels[0] === 'phase') return sortByStart(data.milestones.filter(m => m.projectId === project.id).map(phaseRow));
  if (levels[0] === 'epic') return sortByStart(epics.map(e => epicRow(e, 0)));
  if (levels[0] === 'story') return sortByStart(stories.map(s => storyRow(s, 0)));
  return [];
}

/** Each phase's checkpoint: achieved, missed, at risk (its work now ends after it) or on track */
export function checkpoints(data: PlanData, rows: TimelineRow[], now: number): Checkpoint[] {
  const t = today(now);
  return data.milestones
    .filter(m => m.projectId === data.project.id)
    .map(phase => {
      const row = rows.find(r => r.level === 'phase' && r.id === phase.id);
      const end = day(phase.endDate || phase.dueDate)!;
      const achieved = phase.status === 'achieved' || phase.status === 'completed';
      const forecast = row?.forecastEnd ?? end;
      const status: CheckpointStatus = achieved ? 'achieved' : end < t ? 'missed' : forecast > end ? 'at_risk' : 'on_track';
      return { phase, end, status, forecastEnd: forecast, lateBy: Math.max(0, diffCalendarDays(end, forecast)) };
    })
    .sort((a, b) => a.end.localeCompare(b.end));
}

/** The tasks (and subtasks) finishing after their planned end, worst first, with the reason */
export function lateDrivers(data: PlanData, changes: TaskStatusChange[], now: number): LateDriver[] {
  const t = today(now);
  const project = projectWindow(data.project);
  const projectTasks = data.tasks.filter(x => x.projectId === data.project.id);
  const drivers: LateDriver[] = [];

  for (const task of projectTasks) {
    const estimate = Math.max(1, Number(task.estimatedDuration) || 1);
    const plannedEnd = day(task.dueDate) ?? (task.startDate ? addDays(day(task.startDate)!, estimate) : undefined);
    const forecast = forecastEnd(task, changes, now);
    if (!plannedEnd || !forecast || forecast <= plannedEnd) continue;

    // What it pushes: the levels it sits in whose planned end comes before its forecast
    const owner = task.parentId ? projectTasks.find(x => x.id === task.parentId) ?? task : task;
    const story = owner.storyId ? data.stories.find(s => s.id === owner.storyId) : undefined;
    const epic = owner.epicId ? data.epics.find(e => e.id === owner.epicId) : undefined;
    const phase = owner.milestoneId ? data.milestones.find(m => m.id === owner.milestoneId) : undefined;
    const pushes: string[] = [];
    if (story && storySpan(story, data).end < forecast) pushes.push(`story "${story.title.length > 32 ? `${story.title.slice(0, 30)}…` : story.title}"`);
    if (epic && epicSpan(epic, data).end < forecast) pushes.push(epic.name);
    if (phase && phaseSpan(phase, data.project).end < forecast) pushes.push(phase.name);
    if (project.end < forecast) pushes.push('the project end');

    const own = changes.filter(c => c.taskId === task.id).sort((a, b) => a.at.localeCompare(b.at));
    const started = day(own.find(c => c.to === 'in_progress')?.at);
    const plannedStart = day(task.startDate);
    const est = formatDays(estimate, task.durationUnit, task.startDate);
    let reason: string;
    if (task.status === 'review' || task.status === 'done') {
      reason = `Finished ${formatDate(forecast)}, after its due date`;
    } else if (started && plannedStart && started > plannedStart) {
      reason = `Started ${diffCalendarDays(plannedStart, started)} days late (${formatDate(started)}); estimate ${est}`;
    } else if (!started && task.status === 'todo' && plannedStart && plannedStart < t) {
      reason = `Should have started ${formatDate(plannedStart)}; not started yet (estimate ${est})`;
    } else if (plannedEnd < t) {
      reason = `Still open after its due date (${formatDate(plannedEnd)})`;
    } else {
      reason = `Its estimate (${est}) runs past its due date`;
    }

    drivers.push({ task, plannedEnd, forecastEnd: forecast, lateBy: diffCalendarDays(plannedEnd, forecast), pushes, reason });
  }
  return drivers.sort((a, b) => b.pushes.length - a.pushes.length || b.lateBy - a.lateBy);
}

export function timelineSummary(data: PlanData, cps: Checkpoint[], now: number): TimelineSummary {
  const { project } = data;
  const w = projectWindow(project);
  const forecastEnd = day(project.currentEndDate) ?? w.end;
  const span = Math.max(1, diffCalendarDays(w.start, w.end));
  const timeUsed = Math.min(100, Math.max(0, Math.round((diffCalendarDays(w.start, today(now)) / span) * 100)));
  const workDone = progressOfTasks(data.tasks.filter(t => t.projectId === project.id));
  const gap = timeUsed - workDone;
  const counts = { achieved: 0, missed: 0, at_risk: 0, on_track: 0, total: cps.length };
  for (const c of cps) counts[c.status] += 1;
  return {
    plannedEnd: w.end,
    forecastEnd,
    lateBy: Math.max(0, diffCalendarDays(w.end, forecastEnd)),
    timeUsed,
    workDone,
    pace: gap > 10 ? 'behind' : gap < -10 ? 'ahead' : 'on_pace',
    checkpoints: counts,
    replans: project.baselineHistory?.length ?? 0,
  };
}

/** Rows flattened for the CSV export */
export function flattenRows(rows: TimelineRow[]): TimelineRow[] {
  return rows.flatMap(r => [r, ...flattenRows(r.children)]);
}

