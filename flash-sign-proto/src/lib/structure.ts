import type { Project, ProjectStructure, Task } from '@/types';
import type { PlanLinks } from './plan';

/**
 * Which plan levels a project uses, and the rules that follow from it: each level is created
 * inside the nearest level above it that the project uses; tasks go inside the lowest one.
 */

export type PlanLevel = 'phase' | 'epic' | 'story';

export const LEVEL_LABEL: Record<PlanLevel | 'task', { one: string; many: string }> = {
  phase: { one: 'phase', many: 'phases' },
  epic: { one: 'epic', many: 'epics' },
  story: { one: 'story', many: 'stories' },
  task: { one: 'task', many: 'tasks' },
};

const FLEXIBLE = { subtasks: true, backlog: true, allowMove: true };

export const STRUCTURE_PRESETS: { id: string; name: string; description: string; structure: ProjectStructure }[] = [
  { id: 'full', name: 'Full', description: 'Phase → Epic → Story → Task', structure: { phases: true, epics: true, stories: true, ...FLEXIBLE } },
  { id: 'agile', name: 'Agile', description: 'Epic → Story → Task', structure: { phases: false, epics: true, stories: true, ...FLEXIBLE } },
  { id: 'phased', name: 'Phased', description: 'Phase → Epic → Task', structure: { phases: true, epics: true, stories: false, ...FLEXIBLE } },
  { id: 'simple-phases', name: 'Simple phases', description: 'Phase → Task', structure: { phases: true, epics: false, stories: false, ...FLEXIBLE } },
  { id: 'tasks', name: 'Tasks only', description: 'Task', structure: { phases: false, epics: false, stories: false, ...FLEXIBLE } },
];

export function presetOf(s: ProjectStructure): string {
  return STRUCTURE_PRESETS.find(p => p.structure.phases === s.phases && p.structure.epics === s.epics && p.structure.stories === s.stories)?.id ?? 'custom';
}

/**
 * The project's structure. A project without one saved uses the company's full structure
 * (Phase → Epic → Story → Task), so every phase offers epics, every epic stories, and so on.
 */
export function projectStructure(project?: Pick<Project, 'structure'>): ProjectStructure {
  return project?.structure ?? STRUCTURE_PRESETS[0].structure;
}

/** The levels in use, top first */
export function levelsOf(s: ProjectStructure): PlanLevel[] {
  return (['phase', 'epic', 'story'] as PlanLevel[]).filter(l => (l === 'phase' ? s.phases : l === 'epic' ? s.epics : s.stories));
}

/** Where a level is created: the nearest level above it in use, or the project itself */
export function parentLevel(level: PlanLevel | 'task', s: ProjectStructure): PlanLevel | undefined {
  const order: (PlanLevel | 'task')[] = ['phase', 'epic', 'story', 'task'];
  const above = order.slice(0, order.indexOf(level)) as PlanLevel[];
  return above.filter(l => levelsOf(s).includes(l)).pop();
}

/** The level tasks are created in (undefined = directly in the project) */
export const taskLevel = (s: ProjectStructure) => parentLevel('task', s);

/** The link a level is stored under on a task */
export const LINK_KEY: Record<PlanLevel, keyof PlanLinks> = { phase: 'milestoneId', epic: 'epicId', story: 'storyId' };

/** What a task is missing, e.g. "Needs a story"; undefined when it's where the structure wants it */
export function taskPlacementIssue(task: Pick<Task, 'milestoneId' | 'epicId' | 'storyId'>, s: ProjectStructure): string | undefined {
  const level = taskLevel(s);
  if (!level || task[LINK_KEY[level]]) return undefined;
  return `Needs ${level === 'epic' ? 'an' : 'a'} ${LEVEL_LABEL[level].one}`;
}

/** A task with no plan links at all: it's in the Backlog */
export const inBacklog = (task: Pick<Task, 'milestoneId' | 'epicId' | 'storyId'>) => !task.milestoneId && !task.epicId && !task.storyId;

/** Why a new task's plan links aren't allowed, if they aren't */
export function taskLinksError(links: PlanLinks, s: ProjectStructure): string | undefined {
  const level = taskLevel(s);
  if (!level) return undefined;
  if (links[LINK_KEY[level]]) return undefined;
  if (s.backlog && inBacklog(links)) return undefined;
  return `Choose ${level === 'epic' ? 'an' : 'a'} ${LEVEL_LABEL[level].one} for the task${s.backlog ? ', or leave everything empty to put it in the Backlog' : ''}.`;
}
