import type { Project, ProjectHealth, Task, Milestone, TimelineStatus } from '@/types';

/**
 * Standardize date to YYYY-MM-DD string
 */
export function toDateString(d: Date | string | number | undefined, fallback?: string): string {
  if (!d) return fallback || new Date().toISOString().split('T')[0];
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return fallback || new Date().toISOString().split('T')[0];
    return dt.toISOString().split('T')[0];
  } catch {
    return fallback || new Date().toISOString().split('T')[0];
  }
}

/**
 * Add calendar days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  dt.setDate(dt.getDate() + Math.round(days));
  return dt.toISOString().split('T')[0];
}

/**
 * Calculate difference in calendar days between two date strings (end - start)
 */
export function diffCalendarDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Resolved schedule for a task (main task or subtask)
 */
export interface ResolvedTaskSchedule {
  taskId: string;
  startDate: string;
  dueDate: string;
  estimatedDuration: number; // in days
  isDerivedFromSubtasks: boolean;
  subtaskCount: number;
}

/**
 * Calculate effective schedule for a single main task and its subtasks.
 *
 * Rule: Avoid double counting!
 * - A main task without subtasks contributes its own estimated duration.
 * - A main task with subtasks derives its effective duration and dates from its subtasks.
 *   The main task duration can be retained as an estimate, but is NOT added on top of subtasks.
 */
export function calculateTaskEffectiveSchedule(
  mainTask: Task,
  subtasks: Task[],
  fallbackStartDate: string
): ResolvedTaskSchedule {
  const baseStart = mainTask.startDate || fallbackStartDate;

  // Case 1: Main task has subtasks -> derived from subtasks
  if (subtasks.length > 0) {
    let earliestSubStart: string | null = null;
    let latestSubEnd: string | null = null;
    let runningSubStart = baseStart;
    let totalSubtaskWorkDays = 0;

    for (const sub of subtasks) {
      const subDuration = Math.max(1, Number(sub.estimatedDuration) || 1);
      totalSubtaskWorkDays += subDuration;

      const subStart = sub.startDate || runningSubStart;
      const subEnd = sub.dueDate || addDays(subStart, subDuration);

      if (!earliestSubStart || new Date(subStart) < new Date(earliestSubStart)) {
        earliestSubStart = subStart;
      }
      if (!latestSubEnd || new Date(subEnd) > new Date(latestSubEnd)) {
        latestSubEnd = subEnd;
      }

      // Next sequential subtask starts after this one finishes if dates aren't explicit
      runningSubStart = subEnd;
    }

    const effectiveStart = earliestSubStart || baseStart;
    const effectiveEnd = latestSubEnd || addDays(effectiveStart, totalSubtaskWorkDays);
    const calendarSpan = Math.max(1, diffCalendarDays(effectiveStart, effectiveEnd));

    return {
      taskId: mainTask.id,
      startDate: effectiveStart,
      dueDate: effectiveEnd,
      estimatedDuration: totalSubtaskWorkDays, // Work duration = sum of subtasks
      isDerivedFromSubtasks: true,
      subtaskCount: subtasks.length,
    };
  }

  // Case 2: Main task without subtasks -> uses its own estimate
  const taskDuration = Math.max(
    1,
    Number(mainTask.estimatedDuration) ||
      (mainTask.dueDate && mainTask.startDate
        ? diffCalendarDays(mainTask.startDate, mainTask.dueDate)
        : 3)
  );

  const start = mainTask.startDate || baseStart;
  const end = mainTask.dueDate || addDays(start, taskDuration);
  const calendarSpan = Math.max(1, diffCalendarDays(start, end));

  return {
    taskId: mainTask.id,
    startDate: start,
    dueDate: end,
    estimatedDuration: taskDuration,
    isDerivedFromSubtasks: false,
    subtaskCount: 0,
  };
}

/**
 * Health that follows the timeline: more than 10% later than the baseline is At Risk,
 * more than 25% is Delayed.
 */
export function healthFromTimeline(status: TimelineStatus, difference: number, originalDuration: number): ProjectHealth {
  if (status !== 'extended') return 'on_track';
  const late = difference / Math.max(1, originalDuration);
  if (late > 0.25) return 'delayed';
  if (late > 0.1) return 'at_risk';
  return 'on_track';
}

/**
 * Calculate dynamic project timeline based on all milestones, main tasks, and subtasks.
 */
export function calculateProjectTimeline(
  project: Project,
  allTasks: Task[],
  milestones: Milestone[]
): Project {
  // Determine baseline start & end
  const originalStartDate = toDateString(
    project.originalStartDate || project.startDate,
    new Date().toISOString().split('T')[0]
  );

  const originalEndDate = toDateString(
    project.originalEndDate || project.endDate || project.dueDate,
    addDays(originalStartDate, 90)
  );

  const originalDuration = Math.max(
    1,
    Number(project.originalDuration) || diffCalendarDays(originalStartDate, originalEndDate) || 90
  );

  // Filter tasks belonging to this project
  const projectTasks = allTasks.filter((t) => t.projectId === project.id);
  const mainTasks = projectTasks.filter((t) => !t.parentId);

  // Project Milestones
  const projectMilestones = milestones.filter((m) => m.projectId === project.id);

  let maxTaskEndDate: string | null = null;
  let totalWorkDays = 0;

  // Process all main tasks and their subtasks
  for (const mainTask of mainTasks) {
    const subtasks = projectTasks.filter((t) => t.parentId === mainTask.id);
    const resolved = calculateTaskEffectiveSchedule(mainTask, subtasks, originalStartDate);

    totalWorkDays += resolved.estimatedDuration;

    if (!maxTaskEndDate || new Date(resolved.dueDate) > new Date(maxTaskEndDate)) {
      maxTaskEndDate = resolved.dueDate;
    }
  }

  // Also verify milestones with explicit end dates
  for (const m of projectMilestones) {
    const mEnd = m.endDate || m.dueDate;
    if (mEnd && (!maxTaskEndDate || new Date(mEnd) > new Date(maxTaskEndDate))) {
      maxTaskEndDate = mEnd;
    }
  }

  const currentStartDate = originalStartDate;
  let currentEndDate = originalEndDate;
  let timelineDifference = 0;
  let timelineStatus: TimelineStatus = 'on_schedule';

  if (project.status === 'completed') {
    timelineStatus = 'completed';
    timelineDifference = diffCalendarDays(originalEndDate, currentEndDate);
  } else if (maxTaskEndDate) {
    const diffFromOriginal = diffCalendarDays(originalEndDate, maxTaskEndDate);

    if (diffFromOriginal > 0) {
      // Extended beyond original timeline
      currentEndDate = maxTaskEndDate;
      timelineDifference = diffFromOriginal;
      timelineStatus = 'extended';
    } else if (diffFromOriginal < 0 && mainTasks.length > 0) {
      // Planned schedule is completed earlier than original baseline!
      currentEndDate = maxTaskEndDate;
      timelineDifference = diffFromOriginal; // negative number of days saved
      timelineStatus = 'shortened';
    } else {
      // Exactly on original schedule
      currentEndDate = originalEndDate;
      timelineDifference = 0;
      timelineStatus = 'on_schedule';
    }
  }

  const currentDuration = Math.max(1, diffCalendarDays(currentStartDate, currentEndDate));

  return {
    ...project,
    // Health follows the timeline unless someone set it by hand in Settings
    health: project.healthMode === 'manual' ? project.health : healthFromTimeline(timelineStatus, timelineDifference, originalDuration),
    startDate: currentStartDate,
    endDate: currentEndDate,
    dueDate: currentEndDate,
    originalStartDate,
    originalEndDate,
    originalDuration,
    currentStartDate,
    currentEndDate,
    currentDuration,
    timelineDifference,
    timelineStatus,
    totalWorkDays,
  };
}
