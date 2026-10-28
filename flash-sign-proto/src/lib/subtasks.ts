import type { Task, TaskStatus, TaskStatusChange } from '@/types';

/**
 * Subtasks live inside their task's card (one level deep) and each has its own state.
 * A task with subtasks is a container: it has no timer of its own; people time the
 * subtasks, and the task's time is its subtasks' time added up.
 */

export function subtasksOf(taskId: string, tasks: Task[]): Task[] {
  return tasks.filter(t => t.parentId === taskId);
}

export function hasSubtasks(taskId: string, tasks: Pick<Task, 'parentId'>[]): boolean {
  return tasks.some(t => t.parentId === taskId);
}

export function openSubtasks(subtasks: Task[]): Task[] {
  return subtasks.filter(s => s.status !== 'done');
}

/** How many subtasks are at each stage, for the card's progress bar */
export function subtaskCounts(subtasks: Task[]): Record<TaskStatus, number> & { total: number } {
  const counts = { todo: 0, in_progress: 0, review: 0, done: 0, blocked: 0, total: subtasks.length };
  for (const s of subtasks) counts[s.status] += 1;
  return counts;
}

/** When the task last moved into In Progress, while it is still there */
export function inProgressSince(task: Pick<Task, 'id' | 'status'>, changes: TaskStatusChange[]): string | undefined {
  if (task.status !== 'in_progress') return undefined;
  return changes
    .filter(c => c.taskId === task.id && c.to === 'in_progress')
    .map(c => c.at)
    .sort()
    .pop();
}

/**
 * Project progress counts the work itself: tasks without subtasks and subtasks, weighted by
 * estimated days. A task with subtasks is not counted on top of them.
 */
export function progressOf(tasks: Task[], projectId: string): number {
  return progressOfTasks(tasks.filter(t => t.projectId === projectId));
}

/** progressOf for a list that already holds only one project's tasks */
export function progressOfTasks(projectTasks: Task[]): number {
  const leaves = projectTasks.filter(t => !hasSubtasks(t.id, projectTasks));
  const weight = (t: Task) => Math.max(1, Number(t.estimatedDuration) || 1);
  const total = leaves.reduce((sum, t) => sum + weight(t), 0);
  const done = leaves.filter(t => t.status === 'done').reduce((sum, t) => sum + weight(t), 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
