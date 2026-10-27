import type { BoardColumn, Project, Task, TaskStatus } from '@/types';

/**
 * The fixed task stages a board column can count as. Timing, AI agents, progress and
 * reports read the stage, so a team can add "QA Testing" (In Progress) or "Ready to
 * Deploy" (In Review) without breaking any of them.
 */
export const TASK_STAGES: { status: TaskStatus; label: string; hint: string }[] = [
  { status: 'todo', label: 'To Do', hint: 'Not started yet' },
  { status: 'in_progress', label: 'In Progress', hint: 'Being worked on — the timer runs' },
  { status: 'review', label: 'In Review', hint: 'Work finished, waiting for a check' },
  { status: 'done', label: 'Done', hint: 'Complete — counts toward progress' },
  { status: 'blocked', label: 'Blocked', hint: 'Stuck on something' },
];

/** Stages every board must keep a column for: the timer and the AI agents move cards into them. */
export const REQUIRED_STAGES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const COLUMN_COLORS = [
  'var(--muted)', '#42a5f5', '#7e57c2', 'var(--waiting)', '#26a69a', 'var(--flash)', '#ec407a', 'var(--danger)',
];

/** Default columns use the stage as their id, so tasks without a columnId land in them. */
export const DEFAULT_BOARD_COLUMNS: BoardColumn[] = [
  { id: 'todo', name: 'To Do', color: 'var(--muted)', status: 'todo' },
  { id: 'in_progress', name: 'In Progress', color: '#42a5f5', status: 'in_progress' },
  { id: 'review', name: 'In Review', color: 'var(--waiting)', status: 'review' },
  { id: 'done', name: 'Done', color: 'var(--flash)', status: 'done' },
  { id: 'blocked', name: 'Blocked', color: 'var(--danger)', status: 'blocked' },
];

export function stageLabel(status: TaskStatus): string {
  return TASK_STAGES.find(s => s.status === status)?.label ?? status;
}

export function boardColumnsFor(project?: Pick<Project, 'boardColumns'>): BoardColumn[] {
  return project?.boardColumns?.length ? project.boardColumns : DEFAULT_BOARD_COLUMNS;
}

/**
 * The column a card shows in: its own column while that still matches its stage, otherwise
 * the first column of its stage. A status change made elsewhere (task drawer, an agent's
 * finish_task) therefore always lands the card in a sensible column.
 */
export function columnOfTask(task: Pick<Task, 'status' | 'columnId'>, columns: BoardColumn[]): BoardColumn | undefined {
  const own = task.columnId ? columns.find(c => c.id === task.columnId) : undefined;
  if (own && own.status === task.status) return own;
  return columns.find(c => c.status === task.status) ?? columns[0];
}

/** Stages from REQUIRED_STAGES that have no column in this list. */
export function missingStages(columns: BoardColumn[]): TaskStatus[] {
  return REQUIRED_STAGES.filter(stage => !columns.some(c => c.status === stage));
}
