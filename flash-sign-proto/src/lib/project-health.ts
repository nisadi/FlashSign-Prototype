import type { Project, Sprint, Task, TaskStatusChange, User, WorkSession } from '@/types';
import { sessionMinutes } from './agent-connection';
import { formatDays } from './durations';
import type { PlanData } from './schedule';
import { inBacklog, projectStructure, taskLevel, taskPlacementIssue, LEVEL_LABEL } from './structure';
import { hasSubtasks, inProgressSince, progressOfTasks } from './subtasks';
import { checkpoints, lateDrivers, timelineRows, timelineSummary } from './timeline-report';
import { addDays, diffCalendarDays } from './timeline-calculator';
import { formatDate } from './utils';

/**
 * Reports > Overview: what's going well and what needs attention in a project, worked out from
 * the tasks, their status history, the timers and the timeline forecast.
 */

/** Waiting in review this long counts as stuck */
export const REVIEW_STUCK_DAYS = 3;
/** Someone with this many times the team's average open tasks is overloaded */
export const OVERLOAD_FACTOR = 1.5;
/** Finished work taking within this share of its estimate counts as "close" */
export const ESTIMATE_TOLERANCE = 0.2;

export interface Insight {
  text: string;
  detail?: string;
  /** Where clicking takes you */
  target?: { kind: 'task'; id: string } | { kind: 'timeline' } | { kind: 'person'; id: string } | { kind: 'plan' } | { kind: 'tasks' };
  /** Higher = shown first */
  weight: number;
}

const DAY = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** When a task was finished (reached In Review or Done), if it is */
export function finishedAt(task: Task, changes: TaskStatusChange[]): string | undefined {
  if (task.status !== 'review' && task.status !== 'done') return undefined;
  const moved = changes.filter(c => c.taskId === task.id && (c.to === 'review' || c.to === 'done')).map(c => c.at).sort()[0];
  return moved ?? task.updatedAt;
}

/** When a task last moved into its current status */
function inStatusSince(task: Task, changes: TaskStatusChange[]): string {
  return changes.filter(c => c.taskId === task.id && c.to === task.status).map(c => c.at).sort().pop() ?? task.updatedAt;
}

export interface ProjectHealth {
  headline: { status: Project['health']; sentence: string; facts: string[] };
  good: Insight[];
  attention: Insight[];
  numbers: {
    workDone: number;
    timeUsed: number;
    finishedThisWeek: number;
    finishedLastWeek: number;
    onTimeRate?: number;
    open: number;
    overdue: number;
    hoursThisWeek: number;
  };
  /** Tasks finished per day over the last 14 days */
  activity: { day: string; finished: number }[];
  team: { user: User; open: number; finishedThisWeek: number; hoursThisWeek: number; overdue: number; overloaded: boolean }[];
}

export function projectHealth(
  data: PlanData,
  users: User[],
  changes: TaskStatusChange[],
  sessions: WorkSession[],
  now: number
): ProjectHealth {
  const { project } = data;
  const today = isoDay(now);
  const structure = projectStructure(project);
  const projectTasks = data.tasks.filter(t => t.projectId === project.id);
  const main = projectTasks.filter(t => !t.parentId);
  const open = main.filter(t => t.status !== 'done' && t.status !== 'review');
  const ids = new Set(projectTasks.map(t => t.id));
  const projectSessions = sessions.filter(w => ids.has(w.taskId));

  // Timeline
  const rows = timelineRows(data, changes, sessions, now);
  const cps = checkpoints(data, rows, now);
  const summary = timelineSummary(data, cps, now);
  const drivers = lateDrivers(data, changes, now);

  // This week and last week: the last 7 days, and the 7 before
  const weekAgo = now - 7 * DAY;
  const twoWeeksAgo = now - 14 * DAY;
  const finished = main.map(t => ({ task: t, at: finishedAt(t, changes) })).filter((x): x is { task: Task; at: string } => Boolean(x.at));
  const finishedThisWeek = finished.filter(x => new Date(x.at).getTime() >= weekAgo);
  const finishedLastWeek = finished.filter(x => new Date(x.at).getTime() >= twoWeeksAgo && new Date(x.at).getTime() < weekAgo);
  const withDue = finished.filter(x => x.task.dueDate);
  const onTime = withDue.filter(x => x.at.slice(0, 10) <= x.task.dueDate!.slice(0, 10));
  const onTimeRate = withDue.length ? Math.round((onTime.length / withDue.length) * 100) : undefined;
  const minutesSince = (from: number, list = projectSessions) =>
    list.reduce((sum, w) => {
      const start = Math.max(new Date(w.startedAt).getTime(), from);
      const end = w.endedAt ? new Date(w.endedAt).getTime() : now;
      return end > start ? sum + sessionMinutes(new Date(start).toISOString(), new Date(end).toISOString(), now) : sum;
    }, 0);
  const hoursThisWeek = Math.round(minutesSince(weekAgo) / 60);

  const overdue = open.filter(t => t.dueDate && t.dueDate.slice(0, 10) < today);
  const blocked = main.filter(t => t.status === 'blocked');

  const good: Insight[] = [];
  const attention: Insight[] = [];
  const taskTarget = (t: Task) => ({ kind: 'task' as const, id: t.id });

  // ── Schedule ──
  if (summary.lateBy > 0) {
    attention.push({
      text: `Finishing ${plural(summary.lateBy, 'day')} late`,
      detail: `Planned ${formatDate(summary.plannedEnd)}, now ${formatDate(summary.forecastEnd)}`,
      target: { kind: 'timeline' },
      weight: 100 + summary.lateBy,
    });
  } else if (summary.pace !== 'behind') {
    good.push({ text: `On track to finish by ${formatDate(summary.plannedEnd)}`, target: { kind: 'timeline' }, weight: 100 });
  }
  if (summary.pace === 'behind') {
    attention.push({
      text: 'Work is behind the calendar',
      detail: `${summary.timeUsed}% of the time used, ${summary.workDone}% of the work done`,
      target: { kind: 'timeline' },
      weight: 80,
    });
  } else if (summary.pace === 'ahead') {
    good.push({ text: 'Work is ahead of the calendar', detail: `${summary.workDone}% done with ${summary.timeUsed}% of the time used`, weight: 60 });
  }
  for (const c of cps) {
    if (c.status === 'missed') attention.push({ text: `${c.phase.name} missed its checkpoint`, detail: `Due ${formatDate(c.end)}`, target: { kind: 'timeline' }, weight: 95 });
    if (c.status === 'at_risk') attention.push({ text: `${c.phase.name} is at risk`, detail: `Now ends ${formatDate(c.forecastEnd)}, ${plural(c.lateBy, 'day')} after its checkpoint`, target: { kind: 'timeline' }, weight: 90 + c.lateBy / 10 });
  }
  const achieved = cps.filter(c => c.status === 'achieved');
  const onTrack = cps.filter(c => c.status === 'on_track');
  if (achieved.length) good.push({ text: `${plural(achieved.length, 'phase')} achieved`, detail: achieved.map(c => c.phase.name).join(', '), target: { kind: 'plan' }, weight: 70 });
  if (onTrack.length) good.push({ text: `${onTrack.map(c => c.phase.name).join(', ')} on track`, target: { kind: 'timeline' }, weight: 65 });

  // ── Tasks that should have started ──
  for (const d of drivers.filter(x => x.task.status === 'todo' && !x.task.parentId && x.reason.startsWith('Should have started'))) {
    attention.push({ text: `${d.task.key} hasn't started`, detail: d.reason.replace(/^Should have started/, 'It should have started'), target: taskTarget(d.task), weight: 75 + d.lateBy / 10 });
  }

  // ── Delivery ──
  const diff = finishedThisWeek.length - finishedLastWeek.length;
  if (finishedThisWeek.length > 0) {
    good.push({
      text: `${plural(finishedThisWeek.length, 'task')} finished in the last 7 days`,
      detail: diff > 0 ? `${diff} more than the week before` : diff < 0 ? `${-diff} fewer than the week before` : 'Same as the week before',
      weight: 85,
    });
  } else if (open.length > 0) {
    attention.push({ text: 'No tasks finished in the last 7 days', detail: finishedLastWeek.length ? `${finishedLastWeek.length} the week before` : undefined, weight: 60 });
  }
  if (onTimeRate !== undefined) {
    if (onTimeRate >= 80) good.push({ text: `${onTimeRate}% of tasks finished on time`, detail: `${onTime.length} of ${withDue.length} by their due date`, weight: 55 });
    else attention.push({
      text: onTimeRate === 0 ? 'None of the finished tasks were on time' : `Only ${onTimeRate}% of tasks finished on time`,
      detail: `${onTime.length} of ${withDue.length} finished by their due date`,
      weight: 50,
    });
  }

  // ── Estimates: hours worked against planned hours where they're set, else calendar days ──
  const workedOn = (t: Task) => projectSessions.filter(w => w.taskId === t.id).reduce((sum, w) => sum + sessionMinutes(w.startedAt, w.endedAt, now), 0);
  const effortRatios = projectTasks
    .filter(t => t.effortMinutes && finishedAt(t, changes))
    .map(t => workedOn(t) / t.effortMinutes!)
    .filter(r => r > 0);
  const dayRatios = projectTasks
    .filter(t => !hasSubtasks(t.id, projectTasks) && t.estimatedDuration)
    .map(t => {
      const started = changes.filter(c => c.taskId === t.id && c.to === 'in_progress').map(c => c.at).sort()[0];
      const end = finishedAt(t, changes);
      return started && end ? Math.max(1, diffCalendarDays(started.slice(0, 10), end.slice(0, 10))) / t.estimatedDuration! : undefined;
    })
    .filter((r): r is number => r !== undefined);
  const byHours = effortRatios.length >= 2;
  const ratios = byHours ? effortRatios : dayRatios;
  if (ratios.length >= 2) {
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const what = byHours ? 'the planned hours' : 'its estimate';
    if (Math.abs(avg - 1) <= ESTIMATE_TOLERANCE) good.push({ text: 'Estimates are close', detail: `Finished work took ${avg.toFixed(1)}× ${what} on average`, weight: 40 });
    else if (avg > 1) attention.push({ text: 'Work takes longer than estimated', detail: `Finished work took ${avg.toFixed(1)}× ${what} on average`, weight: 45 });
    else good.push({ text: 'Work finishes faster than estimated', detail: `${avg.toFixed(1)}× ${what} on average`, weight: 35 });
  }

  // ── Overdue, blocked, stuck ──
  if (overdue.length) {
    attention.push({
      text: `${plural(overdue.length, 'task')} overdue`,
      detail: overdue.slice(0, 3).map(t => t.key).join(', ') + (overdue.length > 3 ? ` and ${overdue.length - 3} more` : ''),
      target: overdue.length === 1 ? taskTarget(overdue[0]) : { kind: 'tasks' },
      weight: 88,
    });
  } else if (open.length) good.push({ text: 'Nothing is overdue', weight: 30 });
  const overdueSubtasks = projectTasks.filter(t => t.parentId && t.status !== 'done' && t.status !== 'review' && t.dueDate && t.dueDate.slice(0, 10) < today);
  if (overdueSubtasks.length) {
    attention.push({
      text: `${plural(overdueSubtasks.length, 'subtask')} overdue`,
      detail: overdueSubtasks.slice(0, 3).map(t => t.key).join(', ') + (overdueSubtasks.length > 3 ? ` and ${overdueSubtasks.length - 3} more` : ''),
      target: overdueSubtasks.length === 1 ? taskTarget(overdueSubtasks[0]) : { kind: 'tasks' },
      weight: 84,
    });
  }
  if (blocked.length) {
    for (const t of blocked) {
      const days = Math.max(0, diffCalendarDays(inStatusSince(t, changes).slice(0, 10), today));
      attention.push({ text: `${t.key} is blocked`, detail: `${t.title}, blocked ${days === 0 ? 'since today' : `for ${plural(days, 'day')}`}`, target: taskTarget(t), weight: 86 + days / 10 });
    }
  } else if (open.length) good.push({ text: 'Nothing is blocked', weight: 30 });
  for (const t of main.filter(x => x.status === 'review')) {
    const days = diffCalendarDays(inStatusSince(t, changes).slice(0, 10), today);
    if (days > REVIEW_STUCK_DAYS) attention.push({ text: `${t.key} waiting in review for ${plural(days, 'day')}`, detail: t.title, target: taskTarget(t), weight: 70 + days / 10 });
  }
  for (const t of main.filter(x => x.status === 'in_progress')) {
    const since = inProgressSince(t, changes);
    const days = since ? diffCalendarDays(since.slice(0, 10), today) : 0;
    const estimate = t.estimatedDuration || 0;
    if (estimate && days > estimate) {
      attention.push({ text: `${t.key} in progress longer than planned`, detail: `${plural(days, 'day')} so far, estimate ${formatDays(estimate, t.durationUnit, t.startDate)}`, target: taskTarget(t), weight: 72 + (days - estimate) / 10 });
    }
  }

  // ── Workload ──
  const members = users.filter(u => project.memberIds.includes(u.id) || projectTasks.some(t => t.assigneeId === u.id));
  // A person's open work: tasks without subtasks, and subtasks (two developers can share one task)
  const openWork = projectTasks.filter(t => !hasSubtasks(t.id, projectTasks) && t.status !== 'done' && t.status !== 'review');
  const overdueWork = openWork.filter(t => t.dueDate && t.dueDate.slice(0, 10) < today);
  const openOf = (u: User) => openWork.filter(t => t.assigneeId === u.id).length;
  const assignedOpen = members.map(openOf);
  const average = assignedOpen.length ? assignedOpen.reduce((a, b) => a + b, 0) / assignedOpen.length : 0;
  const team = members
    .map(user => {
      const mine = openWork.filter(t => t.assigneeId === user.id);
      return {
        user,
        open: mine.length,
        finishedThisWeek: finishedThisWeek.filter(x => x.task.assigneeId === user.id).length,
        hoursThisWeek: Math.round(minutesSince(weekAgo, projectSessions.filter(w => w.userId === user.id)) / 60),
        overdue: mine.filter(t => overdueWork.includes(t)).length,
        overloaded: mine.length >= 3 && mine.length >= average * OVERLOAD_FACTOR,
      };
    })
    .filter(m => m.open || m.finishedThisWeek || m.hoursThisWeek)
    .sort((a, b) => b.open - a.open);
  for (const m of team.filter(x => x.overloaded)) {
    attention.push({ text: `${m.user.name} has ${m.open} open tasks and subtasks`, detail: `The team average is ${average.toFixed(1)}`, target: { kind: 'person', id: m.user.id }, weight: 65 });
  }
  if (team.length > 1 && !team.some(m => m.overloaded)) good.push({ text: 'Work is spread fairly across the team', weight: 25 });
  const unassigned = open.filter(t => !t.assigneeId);
  if (unassigned.length) attention.push({ text: `${plural(unassigned.length, 'task')} with no one assigned`, detail: unassigned.slice(0, 3).map(t => t.key).join(', '), target: { kind: 'tasks' }, weight: 55 });

  // ── Plan placement ──
  const lowest = taskLevel(structure);
  if (lowest) {
    const backlog = main.filter(t => inBacklog(t));
    const misplaced = main.filter(t => !inBacklog(t) && taskPlacementIssue(t, structure));
    if (backlog.length) attention.push({ text: `${plural(backlog.length, 'task')} waiting in the Backlog`, detail: `Not placed in a ${LEVEL_LABEL[lowest].one} yet`, target: { kind: 'plan' }, weight: 30 });
    if (misplaced.length) attention.push({ text: `${plural(misplaced.length, 'task')} need${misplaced.length === 1 ? 's' : ''} a ${LEVEL_LABEL[lowest].one}`, target: { kind: 'plan' }, weight: 35 });
  }

  // ── Timers ──
  const toCheck = projectSessions.filter(w => w.needsReview);
  if (toCheck.length) attention.push({ text: `${plural(toCheck.length, 'timer')} stopped by themselves`, detail: 'Idle for 2 hours or left on at the end of the day; check the hours', weight: 40 });
  else if (projectSessions.length) good.push({ text: 'No timers need checking', weight: 20 });

  good.sort((a, b) => b.weight - a.weight);
  attention.sort((a, b) => b.weight - a.weight);

  // ── Headline ──
  const facts: string[] = [];
  const atRisk = cps.filter(c => c.status === 'at_risk' || c.status === 'missed').length;
  if (atRisk) facts.push(`${plural(atRisk, 'phase')} at risk`);
  if (overdue.length) facts.push(`${overdue.length} overdue`);
  if (blocked.length) facts.push(`${blocked.length} blocked`);
  if (!facts.length) facts.push(`${finishedThisWeek.length} finished this week`);
  const sentence = summary.lateBy > 0
    ? `${project.name} will finish about ${plural(summary.lateBy, 'day')} late (${formatDate(summary.forecastEnd)})`
    : summary.pace === 'behind'
      ? `${project.name} is planned to finish by ${formatDate(summary.plannedEnd)}, but the work is behind the calendar`
      : `${project.name} is on track to finish by ${formatDate(summary.plannedEnd)}`;

  // ── Activity: finished per day, last 14 days ──
  const activity = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    return { day: d, finished: finished.filter(x => x.at.slice(0, 10) === d).length };
  });

  return {
    headline: { status: project.health, sentence, facts },
    good,
    attention,
    numbers: {
      workDone: progressOfTasks(projectTasks),
      timeUsed: summary.timeUsed,
      finishedThisWeek: finishedThisWeek.length,
      finishedLastWeek: finishedLastWeek.length,
      onTimeRate,
      open: open.length,
      overdue: overdue.length,
      hoursThisWeek,
    },
    activity,
    team,
  };
}

/**
 * A sprint's burndown from real data: each day, the estimated days of work in the sprint still
 * not finished, against a straight line down to zero at the sprint's end.
 */
export function sprintBurndown(sprint: Sprint, tasks: Task[], changes: TaskStatusChange[], now: number) {
  const inSprint = tasks.filter(t => t.sprintId === sprint.id);
  const leaves = inSprint.flatMap(t => {
    const subs = tasks.filter(s => s.parentId === t.id);
    return subs.length ? subs : [t];
  });
  const weight = (t: Task) => Math.max(1, Number(t.estimatedDuration) || 1);
  const total = leaves.reduce((sum, t) => sum + weight(t), 0);
  const start = sprint.startDate.slice(0, 10);
  const end = sprint.endDate.slice(0, 10);
  const days = Math.max(1, diffCalendarDays(start, end));
  const today = isoDay(now);
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = addDays(start, i);
    const remaining = leaves.filter(t => {
      const at = finishedAt(t, changes);
      return !at || at.slice(0, 10) > d;
    }).reduce((sum, t) => sum + weight(t), 0);
    return {
      day: formatDate(d).replace(/, \d{4}$/, ''),
      ideal: Math.round((total * (1 - i / days)) * 10) / 10,
      actual: d <= today ? remaining : null,
    };
  });
}
