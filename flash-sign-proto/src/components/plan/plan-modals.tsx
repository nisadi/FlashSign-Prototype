'use client';

import { useState } from 'react';
import { Flag, Layers, BookOpen } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import { EPIC_COLORS } from '@/lib/plan';
import { cn } from '@/lib/utils';
import type { Epic, Milestone, Story, TaskPriority } from '@/types';

const input = 'w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink';
const labelText = 'block text-xs font-semibold text-ink mb-1';

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
  const [name, setName] = useState(phase?.name ?? '');
  const [description, setDescription] = useState(phase?.description ?? '');
  const [startDate, setStartDate] = useState(phase?.startDate ?? '');
  const [endDate, setEndDate] = useState(phase?.endDate ?? phase?.dueDate ?? '');
  const datesWrong = Boolean(startDate && endDate && endDate < startDate);
  const canSave = name.trim() && endDate && !datesWrong;

  const save = () => {
    if (!canSave) return;
    const fields = { name: name.trim(), description: description.trim(), startDate: startDate || undefined, endDate, dueDate: endDate };
    if (phase) updateMilestone(phase.id, fields);
    else addMilestone({ ...fields, projectId, status: 'upcoming' });
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={cn(input, 'font-mono')} />
          </Field>
          <Field label="End date (checkpoint)" required>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={cn(input, 'font-mono', datesWrong && 'border-danger')} />
          </Field>
        </div>
        {datesWrong && <p className="text-[11px] text-danger">The end date can&apos;t be before the start date.</p>}
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
  const phases = milestones.filter(m => m.projectId === projectId);
  const used = new Set(epics.filter(e => e.projectId === projectId).map(e => e.color));
  const [name, setName] = useState(epic?.name ?? '');
  const [description, setDescription] = useState(epic?.description ?? '');
  const [phaseId, setPhaseId] = useState(epic?.phaseId ?? defaultPhaseId ?? '');
  const [color, setColor] = useState(epic?.color ?? EPIC_COLORS.find(c => !used.has(c)) ?? EPIC_COLORS[0]);

  const save = () => {
    if (!name.trim()) return;
    const fields = { name: name.trim(), description: description.trim(), phaseId: phaseId || undefined, color };
    if (epic) updateEpic(epic.id, fields);
    else addEpic({ ...fields, projectId });
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
        <Field label="Phase">
          <select value={phaseId} onChange={e => setPhaseId(e.target.value)} className={input}>
            <option value="">No phase</option>
            {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        {epic && epic.phaseId !== (phaseId || undefined) && (
          <p className="text-[11px] text-waiting">Its tasks move to the new phase too.</p>
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
          <Button variant="primary" size="sm" onClick={save} disabled={!name.trim()}>{epic ? 'Save epic' : 'Create epic'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

/** Create or edit a story: a user need, optionally inside an epic. */
export function StoryModal({ projectId, story, defaultEpicId, onClose }: { projectId: string; story?: Story; defaultEpicId?: string; onClose: () => void }) {
  const { epics, addStory, updateStory } = useApp();
  const projectEpics = epics.filter(e => e.projectId === projectId);
  const [title, setTitle] = useState(story?.title ?? '');
  const [description, setDescription] = useState(story?.description ?? '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(story?.acceptanceCriteria ?? '');
  const [epicId, setEpicId] = useState(story?.epicId ?? defaultEpicId ?? '');
  const [priority, setPriority] = useState<TaskPriority>(story?.priority ?? 'medium');

  const save = () => {
    if (!title.trim()) return;
    const fields = {
      title: title.trim(),
      description: description.trim(),
      acceptanceCriteria: acceptanceCriteria.trim() || undefined,
      epicId: epicId || undefined,
      priority,
    };
    if (story) updateStory(story.id, fields);
    else addStory({ ...fields, projectId });
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
          <Field label="Epic">
            <select value={epicId} onChange={e => setEpicId(e.target.value)} className={input}>
              <option value="">No epic</option>
              {projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={input}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
        </div>
        {story && story.epicId !== (epicId || undefined) && (
          <p className="text-[11px] text-waiting">Its tasks move to the new epic (and its phase) too.</p>
        )}
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!title.trim()}>{story ? 'Save story' : 'Create story'}</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
