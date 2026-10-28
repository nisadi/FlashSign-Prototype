import type { Epic, Milestone, Project, Story, Task, TaskStatusChange } from '@/types';
import { addDays, diffCalendarDays } from './timeline-calculator';

/**
 * Time at every level of the plan. When planning, each level picks its dates inside its
 * parent's time: Project → Phase → Epic → Story → Task → Subtask. A level without its own
 * dates spans its whole parent. When work runs late, the forecast end moves out and carries
 * its parents with it, while the planned dates stay for comparison.
 */

export interface TimeWindow {
  start: string;
  end: string;
  /** What the window belongs to, e.g. "Beta Launch" or "the project" */
  label: string;
}

export interface PlanData {
  project: Project;
  milestones: Milestone[];
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
}

const day = (d?: string) => (d ? d.slice(0, 10) : undefined);
const today = (now: number) => new Date(now).toISOString().slice(0, 10);
const maxDate = (...dates: (string | undefined)[]) => dates.filter(Boolean).sort().pop();

export function projectWindow(project: Project): TimeWindow {
  return {
    start: day(project.originalStartDate || project.startDate)!,
    end: day(project.originalEndDate || project.endDate || project.dueDate)!,
    label: 'the project',
  };
}

/** A phase's own time (a phase without a start begins with the project) */
export function phaseSpan(phase: Milestone, project: Project): TimeWindow {
  return {
    start: day(phase.startDate) ?? projectWindow(project).start,
    end: day(phase.endDate || phase.dueDate)!,
    label: phase.name,
  };
}

/** Where an epic may sit: its phase, or the project */
export function epicWindow(phaseId: string | undefined, data: PlanData): TimeWindow {
  const phase = phaseId ? data.milestones.find(m => m.id === phaseId) : undefined;
  return phase ? phaseSpan(phase, data.project) : projectWindow(data.project);
}

export function epicSpan(epic: Epic, data: PlanData): TimeWindow {
  const parent = epicWindow(epic.phaseId, data);
  return epic.startDate && epic.endDate ? { start: day(epic.startDate)!, end: day(epic.endDate)!, label: epic.name } : { ...parent, label: epic.name };
}

/** Where a story may sit: its epic, or the project */
export function storyWindow(epicId: string | undefined, data: PlanData): TimeWindow {
  const epic = epicId ? data.epics.find(e => e.id === epicId) : undefined;
  return epic ? epicSpan(epic, data) : projectWindow(data.project);
}

export function storySpan(story: Story, data: PlanData): TimeWindow {
  const parent = storyWindow(story.epicId, data);
  const label = storyLabel(story);
  return story.startDate && story.endDate ? { start: day(story.startDate)!, end: day(story.endDate)!, label } : { ...parent, label };
}

/** Where a task may sit: its story, else its epic, else its phase, else the project */
export function taskWindow(links: Pick<Task, 'milestoneId' | 'epicId' | 'storyId'>, data: PlanData): TimeWindow {
  const story = links.storyId ? data.stories.find(s => s.id === links.storyId) : undefined;
  if (story) return storySpan(story, data);
  const epic = links.epicId ? data.epics.find(e => e.id === links.epicId) : undefined;
  if (epic) return epicSpan(epic, data);
  return epicWindow(links.milestoneId, data);
}

/** Where a subtask may sit: inside its task's dates, or the task's own window */
export function subtaskWindow(parent: Task, data: PlanData): TimeWindow {
  if (parent.startDate && parent.dueDate) return { start: day(parent.startDate)!, end: day(parent.dueDate)!, label: parent.key };
  return { ...taskWindow(parent, data), label: parent.key };
}

/** Why a span doesn't fit its window, e.g. "Ends 12 days after Beta Launch" */
export function outsideWindow(start: string | undefined, end: string | undefined, w: TimeWindow): string | undefined {
  const s = day(start);
  const e = day(end);
  if (s && s < w.start) return `Starts ${plural(diffCalendarDays(s, w.start))} before ${w.label} starts`;
  if (e && e > w.end) return `Ends ${plural(diffCalendarDays(w.end, e))} after ${w.label} ends`;
  return undefined;
}

/** A story's title is a sentence; messages quote the start of it */
const storyLabel = (story: Story) => `the story "${story.title.length > 40 ? `${story.title.slice(0, 38).trimEnd()}…` : story.title}"`;

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

// ── Forecast: when work will really end ─────────────────────────────────────

/**
 * When a task will really end:
 * - finished (In Review / Done): when it got there;
 * - started: when it started plus its estimate, but not before its planned end or today;
 * - not started although its planned start has passed: today plus its estimate;
 * - otherwise its planned end.
 */
export function forecastEnd(task: Task, changes: TaskStatusChange[], now: number): string | undefined {
  const estimate = Math.max(1, Number(task.estimatedDuration) || 1);
  const plannedEnd = day(task.dueDate) ?? (task.startDate ? addDays(day(task.startDate)!, estimate) : undefined);
  const own = changes.filter(c => c.taskId === task.id).sort((a, b) => a.at.localeCompare(b.at));

  if (task.status === 'review' || task.status === 'done') {
    return day([...own].reverse().find(c => c.to === 'review' || c.to === 'done')?.at) ?? plannedEnd;
  }
  const started = day(own.find(c => c.to === 'in_progress')?.at);
  const t = today(now);
  if (started || task.status === 'in_progress' || task.status === 'blocked') {
    return maxDate(plannedEnd, started ? addDays(started, estimate) : undefined, t);
  }
  if (task.startDate && day(task.startDate)! < t) return maxDate(plannedEnd, addDays(t, estimate));
  return plannedEnd;
}

/** A level's forecast end: its planned end, pushed out by any of its tasks (and their subtasks) finishing later */
export function forecastOf(plannedEnd: string, tasks: Task[], allTasks: Task[], changes: TaskStatusChange[], now: number) {
  const ids = new Set(tasks.map(t => t.id));
  const scope = [...tasks, ...allTasks.filter(t => t.parentId && ids.has(t.parentId))];
  const end = maxDate(plannedEnd, ...scope.map(t => forecastEnd(t, changes, now)))!;
  return { end, lateBy: Math.max(0, diffCalendarDays(plannedEnd, end)) };
}
