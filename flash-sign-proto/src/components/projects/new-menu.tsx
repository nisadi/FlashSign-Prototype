'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, Flag, Layers, BookOpen, CheckSquare, CornerDownRight, Zap, Upload, UserPlus, ListChecks } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import { PhaseModal, EpicModal, StoryModal } from '@/components/plan/plan-modals';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { canCreateProject } from '@/lib/permissions';
import { LEVEL_LABEL, levelsOf, parentLevel, projectStructure } from '@/lib/structure';
import { cn } from '@/lib/utils';

type Item = 'phase' | 'epic' | 'story' | 'task' | 'subtask' | 'sprint' | 'upload' | 'member';
type Dialog = 'phase' | 'epic' | 'story' | 'subtask' | null;

const ITEMS: Record<Item, { label: string; icon: React.ElementType }> = {
  phase: { label: 'Phase', icon: Flag },
  epic: { label: 'Epic', icon: Layers },
  story: { label: 'Story', icon: BookOpen },
  task: { label: 'Task', icon: CheckSquare },
  subtask: { label: 'Subtask', icon: CornerDownRight },
  sprint: { label: 'Sprint', icon: Zap },
  upload: { label: 'Upload file', icon: Upload },
  member: { label: 'Add member', icon: UserPlus },
};

/**
 * The project header's "+ New" button. It opens a list of everything that can be created,
 * following the project's structure. Each item asks for the parent it needs, the same way
 * the Plan tab does.
 */
export function NewMenu({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, tasks, demoRole } = useApp();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [subtaskParent, setSubtaskParent] = useState('');
  const [taskForSubtask, setTaskForSubtask] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on a click outside it or on Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  const structure = projectStructure(project);
  const levels = levelsOf(structure);
  const canPlan = canCreateProject(demoRole);
  const mainTasks = tasks.filter(t => t.projectId === projectId && !t.parentId);

  /** Where an item is created, shown beside it: each level goes inside the one above it */
  const insideLabel = (item: Item) => {
    if (item === 'subtask') return 'in a task';
    if (item !== 'phase' && item !== 'epic' && item !== 'story' && item !== 'task') return undefined;
    const parent = parentLevel(item, structure);
    return parent ? `in ${parent === 'epic' ? 'an' : 'a'} ${LEVEL_LABEL[parent].one}` : undefined;
  };

  const items: Item[] = [
    ...(canPlan ? levels : []),
    'task',
    ...(structure.subtasks ? (['subtask'] as const) : []),
    'sprint',
    'upload',
    'member',
  ];

  const run = (item: Item) => {
    setOpen(false);
    if (item === 'phase' || item === 'epic' || item === 'story') setDialog(item);
    else if (item === 'subtask') setDialog('subtask');
    else if (item === 'task') router.push(`/projects/${projectId}/tasks/new`);
    else if (item === 'sprint') router.push(`/projects/${projectId}/sprints?create=sprint`);
    else if (item === 'upload') router.push(`/projects/${projectId}/files?create=upload`);
    else router.push(`/projects/${projectId}/team?create=member`);
  };

  return (
    <div ref={ref} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-flash text-ink text-xs font-semibold hover:bg-flash-deep hover:text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        New
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 z-40 w-60 rounded-xl border border-line bg-paper-elevated p-1 shadow-xl">
          {items.map((item, i) => {
            const Icon = ITEMS[item].icon;
            const where = insideLabel(item);
            const divider = item === 'sprint' && i > 0;
            return (
              <div key={item}>
                {divider && <div className="my-1 border-t border-line" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => run(item)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink hover:bg-mist/60"
                >
                  <Icon className="w-3.5 h-3.5 text-flash-deep shrink-0" />
                  <span className="flex-1 font-medium">{ITEMS[item].label}</span>
                  {where && <span className="text-[10px] text-muted">{where}</span>}
                </button>
              </div>
            );
          })}
          {!canPlan && levels.length > 0 && (
            <p className="px-2.5 py-1.5 text-[10px] text-muted">Phases, epics and stories are added by project leads.</p>
          )}
        </div>
      )}

      {dialog === 'phase' && <PhaseModal projectId={projectId} onClose={() => setDialog(null)} />}
      {dialog === 'epic' && <EpicModal projectId={projectId} onClose={() => setDialog(null)} />}
      {dialog === 'story' && <StoryModal projectId={projectId} onClose={() => setDialog(null)} />}

      {/* A subtask goes in a task: choose it first */}
      {dialog === 'subtask' && (
        <Modal isOpen onClose={() => setDialog(null)} size="sm" aria-labelledby="choose-task-title">
          <ModalHeader id="choose-task-title" title="New subtask" description="Choose the task it belongs to." icon={ListChecks} onClose={() => setDialog(null)} />
          <ModalBody>
            {mainTasks.length === 0 ? (
              <p className="text-xs text-muted">This project has no tasks yet. Create a task first.</p>
            ) : (
              <select
                value={subtaskParent}
                onChange={e => setSubtaskParent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                aria-label="Task"
              >
                <option value="">Choose a task…</option>
                {mainTasks.map(t => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
              </select>
            )}
          </ModalBody>
          <ModalFooter>
            <span />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDialog(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!subtaskParent}
                onClick={() => {
                  setTaskForSubtask(subtaskParent);
                  setDialog(null);
                  setSubtaskParent('');
                }}
              >
                Next
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
      {taskForSubtask && (
        <CreateTaskModal
          isOpen
          onClose={() => setTaskForSubtask(null)}
          projectId={projectId}
          defaultParentId={taskForSubtask}
          parentTaskTitle={tasks.find(t => t.id === taskForSubtask)?.title}
        />
      )}
    </div>
  );
}
