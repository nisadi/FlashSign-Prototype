'use client';

import { useState } from 'react';
import { Flag, Layers, BookOpen } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import { EPIC_COLORS } from '@/lib/plan';
import { epicWindow, projectWindow, storyWindow, type PlanData, type TimeWindow } from '@/lib/schedule';
import { naturalUnit } from '@/lib/durations';
import { projectStructure } from '@/lib/structure';
import { DateRangeField, WindowHint, rangeError, type DateRange } from '@/components/shared/duration-fields';
import { cn } from '@/lib/utils';
import type { Epic, Milestone, Story, TaskPriority } from '@/types';

const input = 'w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink';
const labelText = 'block text-xs font-semibold text-ink mb-1';

/** The project's plan data, for working out which time each level may use */
function usePlanData(projectId: string): PlanData | undefined {
  const { projects, milestones, epics, stories, tasks } = useApp();
  const project = projects.find(p => p.id === projectId);
  return project ? { project, milestones, epics, stories, tasks } : undefined;
}

/** The project's structure: which parent each level needs, and whether items may move */
function useStructure(projectId: string) {
  const { projects } = useApp();
  const project = projects.find(p => p.id === projectId);
  return projectStructure(project);
}

/** Shown under a parent picker that can't be changed because moving is turned off */
const LockedNote = () => <p className="mt-1 text-[11px] text-muted">Moving to another parent is turned off for this project.</p>;

/**
 * An epic's or story's time: either all of its parent's time, or its own dates inside it.
 * `own` is undefined while it uses the parent's time.
 */
function OwnTimeField({ own, onChange, window: w, parentName }: { own?: DateRange; onChange: (r?: DateRange) => void; window: TimeWindow; parentName: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-paper p-3">
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={!own} onChange={() => onChange(undefined)} className="accent-flash" />
          All of {parentName}
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={Boolean(own)} onChange={() => onChange({ start: w.start, end: w.end, unit: naturalUnit(w.start, w.end) })} className="accent-flash" />
          Its own dates inside it
        </label>
      </div>
      {own ? <DateRangeField value={own} onChange={onChange} window={w} /> : <WindowHint window={w} />}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelText}>
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}

/** Create or edit a phase: a dated stage of the project that ends in a checkpoint (stored as a milestone). */
export function PhaseModal({ projectId, phase, onClose }: { projectId: string; phase?: Milestone; onClose: () => void }) {
  const { addMilestone, updateMilestone } = useApp();
  const data = usePlanData(projectId);
  const parentWindow = data ? projectWindow(data.project) : undefined;
  const [name, setName] = useState(phase?.name ?? '');
  const [description, setDescription] = useState(phase?.description ?? '');
  const [range, setRange] = useState<DateRange>(() => {
    const start = phase?.startDate?.slice(0, 10) ?? parentWindow?.start ?? '';
    const end = (phase?.endDate ?? phase?.dueDate)?.slice(0, 10) ?? parentWindow?.end ?? '';
    return { start, end, unit: phase?.durationUnit ?? (start && end ? naturalUnit(start, end) : 'weeks') };
  });
  const error = rangeError(range, parentWindow);
  const canSave = name.trim() && range.start && range.end && !error;

  const save = () => {
    if (!canSave) return;
    const fields = {
      name: name.trim(), description: description.trim(),
      startDate: range.start, endDate: range.end, dueDate: range.end, durationUnit: range.unit,
    };
    if (phase) updateMilestone(phase.id, fields);
    else addMilestone({ ...fields, projectId, status: 'upcoming' });
    notify(phase ? `Phase "${fields.name}" saved` : `Phase "${fields.name}" created`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} size="md" aria-labelledby="phase-modal-title">
      <ModalHeader id="phase-modal-title" title={phase ? 'Edit phase' : 'New phase'} description="A stage of the project, e.g. Design or Testing, ending in a checkpoint." icon={Flag} onClose={onClose} />
      <ModalBody className="space-y-3">
        <Field label="Phase name" required>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Development · Beta Launch" className={input} />
        </Field>
        <Field label="Description">
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What this phase delivers" className={input} />
        </Field>
        <DateRangeField value={range} onChange={setRange} window={parentWindow} endLabel="End date (checkpoint)" />
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>{phase ? 'Save phase' : 'Create phase'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/** Create or edit an epic: a large body of work, optionally inside a phase. */
export function EpicModal({ projectId, epic, defaultPhaseId, onClose }: { projectId: string; epic?: Epic; defaultPhaseId?: string; onClose: () => void }) {
  const { milestones, epics, addEpic, updateEpic } = useApp();
  const data = usePlanData(projectId);
  const structure = useStructure(projectId);
  const locked = Boolean(epic) && !structure.allowMove;
  const phases = milestones.filter(m => m.projectId === projectId);
  const used = new Set(epics.filter(e => e.projectId === projectId).map(e => e.color));
  const [name, setName] = useState(epic?.name ?? '');
  const [description, setDescription] = useState(epic?.description ?? '');
  const [phaseId, setPhaseId] = useState(epic?.phaseId ?? defaultPhaseId ?? '');
  const [color, setColor] = useState(epic?.color ?? EPIC_COLORS.find(c => !used.has(c)) ?? EPIC_COLORS[0]);
  const [own, setOwn] = useState<DateRange | undefined>(() =>
    epic?.startDate && epic.endDate ? { start: epic.startDate, end: epic.endDate, unit: epic.durationUnit ?? naturalUnit(epic.startDate, epic.endDate) } : undefined
  );
  const parentWindow = data ? epicWindow(phaseId || undefined, data) : undefined;
  const error = own ? rangeError(own, parentWindow) : undefined;
  const needsPhase = structure.phases && !phaseId;
  const canSave = name.trim() && !error && !needsPhase;

  const save = () => {
    if (!canSave) return;
    const fields = {
      name: name.trim(), description: description.trim(), phaseId: phaseId || undefined, color,
      startDate: own?.start, endDate: own?.end, durationUnit: own?.unit,
    };
    if (epic) updateEpic(epic.id, fields);
    else addEpic({ ...fields, projectId });
    notify(epic ? `Epic "${fields.name}" saved` : `Epic "${fields.name}" created`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} size="md" aria-labelledby="epic-modal-title">
      <ModalHeader id="epic-modal-title" title={epic ? 'Edit epic' : 'New epic'} description="A large body of work that breaks down into stories and tasks." icon={Layers} onClose={onClose} />
      <ModalBody className="space-y-3">
        <Field label="Epic name" required>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Signature canvas" className={input} />
        </Field>
        <Field label="Description">
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={input} />
        </Field>
        {structure.phases && (
          <Field label="Phase" required>
            <select value={phaseId} onChange={e => setPhaseId(e.target.value)} disabled={locked} className={cn(input, needsPhase && 'border-danger')}>
              <option value="">Choose a phase…</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {locked && <LockedNote />}
          </Field>
        )}
        {epic && epic.phaseId !== (phaseId || undefined) && (
          <p className="text-[11px] text-waiting">Its tasks move to the new phase too.</p>
        )}
        {parentWindow && (
          <div>
            <span className={labelText}>Time</span>
            <OwnTimeField own={own} onChange={setOwn} window={parentWindow} parentName={parentWindow.label} />
          </div>
        )}
        <div>
          <span className={labelText}>Colour</span>
          <div className="flex items-center gap-2">
            {EPIC_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn('w-6 h-6 rounded-full transition-transform', color === c ? 'ring-2 ring-ink ring-offset-2 scale-110' : 'hover:scale-105')}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>{epic ? 'Save epic' : 'Create epic'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/** Create or edit a story: a user need, optionally inside an epic. */
export function StoryModal({ projectId, story, defaultEpicId, defaultPhaseId, onClose }: {
  projectId: string; story?: Story; defaultEpicId?: string; defaultPhaseId?: string; onClose: () => void;
}) {
  const { epics, milestones, addStory, updateStory } = useApp();
  const data = usePlanData(projectId);
  const structure = useStructure(projectId);
  const locked = Boolean(story) && !structure.allowMove;
  const projectEpics = epics.filter(e => e.projectId === projectId);
  const phases = milestones.filter(m => m.projectId === projectId);
  // Without epics, a story sits in a phase
  const [phaseId, setPhaseId] = useState(story?.phaseId ?? defaultPhaseId ?? '');
  const [title, setTitle] = useState(story?.title ?? '');
  const [description, setDescription] = useState(story?.description ?? '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(story?.acceptanceCriteria ?? '');
  const [epicId, setEpicId] = useState(story?.epicId ?? defaultEpicId ?? '');
  const [priority, setPriority] = useState<TaskPriority>(story?.priority ?? 'medium');
  const [own, setOwn] = useState<DateRange | undefined>(() =>
    story?.startDate && story.endDate ? { start: story.startDate, end: story.endDate, unit: story.durationUnit ?? naturalUnit(story.startDate, story.endDate) } : undefined
  );
  const parentLink = structure.epics ? { epicId: epicId || undefined } : { phaseId: (structure.phases && phaseId) || undefined };
  const parentWindow = data ? storyWindow(parentLink, data) : undefined;
  const error = own ? rangeError(own, parentWindow) : undefined;
  const needsParent = structure.epics ? !epicId : structure.phases && !phaseId;
  const canSave = title.trim() && !error && !needsParent;

  const save = () => {
    if (!canSave) return;
    const fields = {
      title: title.trim(),
      description: description.trim(),
      acceptanceCriteria: acceptanceCriteria.trim() || undefined,
      epicId: parentLink.epicId,
      phaseId: parentLink.phaseId,
      priority,
      startDate: own?.start, endDate: own?.end, durationUnit: own?.unit,
    };
    if (story) updateStory(story.id, fields);
    else addStory({ ...fields, projectId });
    notify(story ? 'Story saved' : 'Story created');
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} size="md" aria-labelledby="story-modal-title">
      <ModalHeader id="story-modal-title" title={story ? 'Edit story' : 'New story'} description="A need described from the user's point of view." icon={BookOpen} onClose={onClose} />
      <ModalBody className="space-y-3">
        <Field label="Story" required>
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="As a sender, I can … so that …" className={input} />
        </Field>
        <Field label="Acceptance criteria">
          <textarea rows={2} value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} placeholder="When is this story done?" className={input} />
        </Field>
        <Field label="Notes">
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {structure.epics ? (
            <Field label="Epic" required>
              <select value={epicId} onChange={e => setEpicId(e.target.value)} disabled={locked} className={cn(input, needsParent && 'border-danger')}>
                <option value="">Choose an epic…</option>
                {projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
              </select>
              {locked && <LockedNote />}
            </Field>
          ) : structure.phases ? (
            <Field label="Phase" required>
              <select value={phaseId} onChange={e => setPhaseId(e.target.value)} disabled={locked} className={cn(input, needsParent && 'border-danger')}>
                <option value="">Choose a phase…</option>
                {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {locked && <LockedNote />}
            </Field>
          ) : <span />}
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={input}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
        </div>
        {story && (story.epicId !== parentLink.epicId || (!structure.epics && story.phaseId !== parentLink.phaseId)) && (
          <p className="text-[11px] text-waiting">Its tasks move with it.</p>
        )}
        {parentWindow && (
          <div>
            <span className={labelText}>Time</span>
            <OwnTimeField own={own} onChange={setOwn} window={parentWindow} parentName={parentWindow.label} />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>{story ? 'Save story' : 'Create story'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
