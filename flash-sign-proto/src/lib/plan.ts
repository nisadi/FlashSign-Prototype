import type { Epic, Milestone, Story, Task } from '@/types';

/**
 * The plan: Phase (stored as a milestone) → Epic → Story → Task → Subtask. Every level above
 * Task is optional. A task stores its lowest link; the levels above follow from it, so moving
 * a story to another epic carries its tasks along.
 */

export const EPIC_COLORS = ['#42a5f5', '#7e57c2', '#26a69a', '#f59e0b', '#ec407a', '#78909c', '#ef5350', '#8d6e63'];

export type PlanLinks = Pick<Task, 'milestoneId' | 'epicId' | 'storyId'>;

/**
 * Make a task's links agree with each other: a story decides the epic (or, in a project without
 * epics, the phase), an epic decides the phase. Links left empty stay empty.
 */
export function resolvePlan(links: PlanLinks, epics: Epic[], stories: Story[]): PlanLinks {
  const story = links.storyId ? stories.find(s => s.id === links.storyId) : undefined;
  const epicId = story ? story.epicId : links.epicId;
  const epic = epicId ? epics.find(e => e.id === epicId) : undefined;
  const phaseId = epic ? epic.phaseId : story?.phaseId;
  return {
    storyId: story?.id,
    epicId: epic?.id,
    milestoneId: phaseId ?? links.milestoneId,
  };
}

/** The phase, epic and story a task sits in; a subtask takes its task's */
export function planOf(task: Task, tasks: Task[], epics: Epic[], stories: Story[], milestones: Milestone[]) {
  const owner = task.parentId ? tasks.find(t => t.id === task.parentId) ?? task : task;
  return {
    phase: owner.milestoneId ? milestones.find(m => m.id === owner.milestoneId) : undefined,
    epic: owner.epicId ? epics.find(e => e.id === owner.epicId) : undefined,
    story: owner.storyId ? stories.find(s => s.id === owner.storyId) : undefined,
  };
}

/** Tasks (not subtasks) matching a filter, with their subtasks appended, for progress */
export function withSubtasks(mainTasks: Task[], tasks: Task[]): Task[] {
  const ids = new Set(mainTasks.map(t => t.id));
  return [...mainTasks, ...tasks.filter(t => t.parentId && ids.has(t.parentId))];
}
