'use client';

import { useApp } from '@/context/app-context';
import { resolvePlan, type PlanLinks } from '@/lib/plan';
import { LEVEL_LABEL, LINK_KEY, levelsOf, projectStructure, taskLevel, type PlanLevel } from '@/lib/structure';
import { cn } from '@/lib/utils';

/**
 * Where a task goes in the plan, following the project's structure: only the levels the project
 * uses are shown. The lowest one is where the task sits (required unless the project allows a
 * Backlog); the ones above it narrow the list, and are filled in from it.
 */
export function PlanPicker({
  projectId,
  value,
  onChange,
  disabled,
  className,
  selectClassName,
  labelClassName,
}: {
  projectId: string;
  value: PlanLinks;
  onChange: (links: PlanLinks) => void;
  /** Read-only, e.g. when moving tasks is turned off for the project */
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
}) {
  const { projects, milestones, epics, stories } = useApp();
  const project = projects.find(p => p.id === projectId);
  const structure = projectStructure(project);
  const levels = levelsOf(structure);
  const lowest = taskLevel(structure);
  if (!lowest) return null;

  const phases = milestones.filter(m => m.projectId === projectId);
  const projectEpics = epics.filter(e => e.projectId === projectId);
  const projectStories = stories.filter(s => s.projectId === projectId);

  // Each list is narrowed by the levels chosen above it
  const options: Record<PlanLevel, { id: string; name: string }[]> = {
    phase: phases.map(p => ({ id: p.id, name: p.name })),
    epic: projectEpics.filter(e => !value.milestoneId || e.phaseId === value.milestoneId).map(e => ({ id: e.id, name: e.name })),
    story: projectStories
      .filter(s => (value.epicId ? s.epicId === value.epicId : !value.milestoneId || resolvePlan({ storyId: s.id }, projectEpics, projectStories).milestoneId === value.milestoneId))
      .map(s => ({ id: s.id, name: s.title })),
  };

  /** Choosing a level keeps the levels above it and clears the ones below it */
  const choose = (level: PlanLevel, id: string) => {
    const keep = levels.slice(0, levels.indexOf(level));
    const links: PlanLinks = {};
    for (const l of keep) links[LINK_KEY[l]] = value[LINK_KEY[l]];
    links[LINK_KEY[level]] = id || undefined;
    onChange(resolvePlan(links, projectEpics, projectStories));
  };

  const field = cn(
    'w-full px-2 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink disabled:opacity-70',
    selectClassName
  );
  const label = cn('block text-[10px] font-semibold text-muted uppercase mb-1', labelClassName);
  const missing = !value[LINK_KEY[lowest]];

  return (
    <div className={cn('grid grid-cols-1 gap-2', levels.length === 3 ? 'sm:grid-cols-3' : levels.length === 2 ? 'sm:grid-cols-2' : '', className)}>
      {levels.map(level => {
        const isLowest = level === lowest;
        const empty = isLowest
          ? structure.backlog ? 'Backlog (place it later)' : `Choose ${level === 'epic' ? 'an' : 'a'} ${LEVEL_LABEL[level].one}…`
          : `Any ${LEVEL_LABEL[level].one}`;
        return (
          <label key={level}>
            <span className={label}>
              {LEVEL_LABEL[level].one}
              {isLowest && !structure.backlog && <span className="text-danger"> *</span>}
            </span>
            <select
              value={value[LINK_KEY[level]] ?? ''}
              onChange={e => choose(level, e.target.value)}
              disabled={disabled}
              className={cn(field, isLowest && missing && !structure.backlog && 'border-danger')}
            >
              <option value="">{empty}</option>
              {options[level].map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        );
      })}
    </div>
  );
}
