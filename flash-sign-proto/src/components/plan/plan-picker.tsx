'use client';

import { useApp } from '@/context/app-context';
import { resolvePlan, type PlanLinks } from '@/lib/plan';
import { cn } from '@/lib/utils';

/**
 * Phase → Epic → Story for a task. Each level is optional; choosing a story fills in its epic
 * and phase, choosing an epic fills in its phase, and choosing another phase clears an epic
 * that belongs elsewhere.
 */
export function PlanPicker({
  projectId,
  value,
  onChange,
  className,
  selectClassName,
  labelClassName,
}: {
  projectId: string;
  value: PlanLinks;
  onChange: (links: PlanLinks) => void;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
}) {
  const { milestones, epics, stories } = useApp();
  const phases = milestones.filter(m => m.projectId === projectId);
  const projectEpics = epics.filter(e => e.projectId === projectId);
  const projectStories = stories.filter(s => s.projectId === projectId);

  // Narrow the lists to what fits the levels above
  const epicOptions = value.milestoneId ? projectEpics.filter(e => !e.phaseId || e.phaseId === value.milestoneId) : projectEpics;
  const storyOptions = value.epicId ? projectStories.filter(s => s.epicId === value.epicId) : projectStories;

  const set = (links: PlanLinks) => onChange(resolvePlan(links, projectEpics, projectStories));
  const field = cn('w-full px-2 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink', selectClassName);
  const label = cn('block text-[10px] font-semibold text-muted uppercase mb-1', labelClassName);

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-2', className)}>
      <label>
        <span className={label}>Phase</span>
        <select
          value={value.milestoneId ?? ''}
          onChange={e => {
            const milestoneId = e.target.value || undefined;
            const epic = projectEpics.find(x => x.id === value.epicId);
            const keepEpic = epic && (!epic.phaseId || epic.phaseId === milestoneId);
            set({ milestoneId, epicId: keepEpic ? value.epicId : undefined, storyId: keepEpic ? value.storyId : undefined });
          }}
          className={field}
        >
          <option value="">No phase</option>
          {phases.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Epic</span>
        <select
          value={value.epicId ?? ''}
          onChange={e => set({ milestoneId: value.milestoneId, epicId: e.target.value || undefined })}
          className={field}
        >
          <option value="">No epic</option>
          {epicOptions.map(ep => (
            <option key={ep.id} value={ep.id}>{ep.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Story</span>
        <select
          value={value.storyId ?? ''}
          onChange={e => set({ milestoneId: value.milestoneId, epicId: value.epicId, storyId: e.target.value || undefined })}
          className={field}
        >
          <option value="">No story</option>
          {storyOptions.map(st => (
            <option key={st.id} value={st.id}>{st.title}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
