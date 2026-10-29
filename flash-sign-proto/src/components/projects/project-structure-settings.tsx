'use client';

import { useState } from 'react';
import { Network, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Button } from '@/components/shared/ui';
import { notify } from '@/components/shared/toaster';
import { StructureEditor } from '@/components/projects/structure-editor';
import { projectStructure } from '@/lib/structure';
import type { Project, ProjectStructure } from '@/types';

/**
 * Project Settings > Structure: change which levels the project uses and its rules at any time.
 * Switching a level off removes its items; what was inside them moves up a level.
 */
export function ProjectStructureSettings({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const { milestones, epics, stories, setProjectStructure } = useApp();
  const current = projectStructure(project);
  const [draft, setDraft] = useState<ProjectStructure>(current);
  const [confirming, setConfirming] = useState(false);

  const count = {
    phases: milestones.filter(m => m.projectId === project.id).length,
    epics: epics.filter(e => e.projectId === project.id).length,
    stories: stories.filter(s => s.projectId === project.id).length,
  };
  // What switching levels off would remove, and where their contents go
  const removals = [
    current.phases && !draft.phases && count.phases > 0 && `${count.phases} phase${count.phases === 1 ? '' : 's'} (epics, stories and tasks stay, without a phase)`,
    current.epics && !draft.epics && count.epics > 0 && `${count.epics} epic${count.epics === 1 ? '' : 's'} (stories and tasks stay in the epic's phase)`,
    current.stories && !draft.stories && count.stories > 0 && `${count.stories} stor${count.stories === 1 ? 'y' : 'ies'} (tasks stay in the story's epic)`,
  ].filter(Boolean) as string[];
  const added = [
    !current.phases && draft.phases && 'phases',
    !current.epics && draft.epics && 'epics',
    !current.stories && draft.stories && 'stories',
  ].filter(Boolean) as string[];
  const changed = JSON.stringify(current) !== JSON.stringify(draft);

  const save = () => {
    if (removals.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    setProjectStructure(project.id, draft);
    setConfirming(false);
    notify('Project structure saved');
  };

  return (
    <Card className="p-6 space-y-4" id="structure">
      <div className="border-b border-line pb-2">
        <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <Network className="w-4 h-4 text-flash-deep" /> Structure
        </h2>
        <p className="text-xs text-muted mt-1">
          Which plan levels this project uses. Each level is created inside the one above it, and tasks go in the lowest level.
          You can change this at any time.
        </p>
      </div>

      {canEdit ? (
        <StructureEditor value={draft} onChange={s => { setDraft(s); setConfirming(false); }} />
      ) : (
        <p className="text-xs text-muted">Only project managers and admins can change the structure.</p>
      )}

      {added.length > 0 && (
        <p className="text-[11px] text-muted">
          Adding {added.join(' and ')}: existing items show as &quot;Needs a …&quot; on the Plan tab until each one is placed.
        </p>
      )}

      {confirming && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 space-y-2 text-xs text-ink">
          <p className="flex items-center gap-1.5 font-semibold text-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> This removes:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {removals.map(r => <li key={r}>{r}</li>)}
          </ul>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="xs" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="danger" size="xs" onClick={save}>Remove and save</Button>
          </div>
        </div>
      )}

      {canEdit && !confirming && (
        <div className="flex justify-end gap-2">
          {changed && <Button variant="ghost" size="sm" onClick={() => setDraft(current)}>Undo changes</Button>}
          <Button variant="primary" size="sm" onClick={save} disabled={!changed}>Save structure</Button>
        </div>
      )}
    </Card>
  );
}
