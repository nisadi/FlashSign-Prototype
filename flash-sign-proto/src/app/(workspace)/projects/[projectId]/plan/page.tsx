'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import {
  Flag, Layers, BookOpen, Plus, Pencil, Trash2, ChevronDown, CheckCircle2, RotateCcw, ArrowRight, CornerDownRight, Map,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Button, ProgressBar } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { ConfirmDeleteModal } from '@/components/shared/confirm-delete-modal';
import { CreateTaskModal } from '@/components/tasks/create-task-modal';
import { PhaseModal, EpicModal, StoryModal } from '@/components/plan/plan-modals';
import { withSubtasks, type PlanLinks } from '@/lib/plan';
import { progressOfTasks, subtasksOf } from '@/lib/subtasks';
import { canCreateProject } from '@/lib/permissions';
import { cn, formatDate } from '@/lib/utils';
import type { Epic, Milestone, Story, Task } from '@/types';

type Dialog =
  | { kind: 'phase'; phase?: Milestone }
  | { kind: 'epic'; epic?: Epic; phaseId?: string }
  | { kind: 'story'; story?: Story; epicId?: string }
  | { kind: 'task'; links: PlanLinks }
  | { kind: 'delete'; title: string; message: string; run: () => void };

/**
 * The project plan as a tree: Phase → Epic → Story → Task (subtasks show as a count).
 * Every level above Task is optional, so tasks can also sit directly in an epic or a phase.
 */
export default function ProjectPlanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const {
    projects, tasks, users, milestones, epics, stories, demoRole,
    updateMilestone, deleteMilestone, deleteEpic, deleteStory, setTaskPlan, openTaskDrawer,
  } = useApp();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const project = projects.find(p => p.id === projectId);
  if (!project) return notFound();

  const canEdit = canCreateProject(demoRole);
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const mainTasks = projectTasks.filter(t => !t.parentId);
  const phases = milestones
    .filter(m => m.projectId === projectId)
    .sort((a, b) => (a.endDate || a.dueDate).localeCompare(b.endDate || b.dueDate));
  const projectEpics = epics.filter(e => e.projectId === projectId);
  const projectStories = stories.filter(s => s.projectId === projectId);

  const isOpen = (id: string) => !collapsed[id];
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));
  const progressOf = (scope: Task[]) => progressOfTasks(withSubtasks(scope, projectTasks));

  const tasksInPhase = (phaseId: string) => mainTasks.filter(t => t.milestoneId === phaseId);
  const tasksInEpic = (epicId: string) => mainTasks.filter(t => t.epicId === epicId);
  const tasksInStory = (storyId: string) => mainTasks.filter(t => t.storyId === storyId);

  const unphasedEpics = projectEpics.filter(e => !e.phaseId || !phases.some(p => p.id === e.phaseId));
  const looseStories = projectStories.filter(s => !s.epicId);
  const unplannedTasks = mainTasks.filter(t => !t.milestoneId && !t.epicId && !t.storyId);

  const confirmDelete = (title: string, message: string, run: () => void) => setDialog({ kind: 'delete', title, message, run });

  // ── Rows ────────────────────────────────────────────────────────────────────

  const taskRow = (task: Task) => {
    const subs = subtasksOf(task.id, projectTasks);
    const assignee = users.find(u => u.id === task.assigneeId);
    return (
      <li
        key={task.id}
        onClick={() => openTaskDrawer(task.id)}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 hover:border-flash/50 cursor-pointer"
      >
        <CornerDownRight className="w-3 h-3 text-muted shrink-0" />
        <span className="font-mono text-[10px] font-semibold text-muted">{task.key}</span>
        <span className="flex-1 min-w-[140px] truncate text-xs font-medium text-ink">{task.title}</span>
        {subs.length > 0 && (
          <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded">
            {subs.filter(s => s.status === 'done').length}/{subs.length} subtasks
          </span>
        )}
        <span className="text-[10px] font-mono text-muted">{task.estimatedDuration || 3}d</span>
        <TaskStatusBadge status={task.status} />
        {assignee && <Avatar user={assignee} size="xs" />}
      </li>
    );
  };

  /** "+ Link existing task" for a story, epic or phase */
  const linkTask = (links: PlanLinks, exclude: (t: Task) => boolean) => {
    const options = mainTasks.filter(t => !exclude(t));
    if (!canEdit || options.length === 0) return null;
    return (
      <select
        value=""
        onChange={e => e.target.value && setTaskPlan(e.target.value, links)}
        className="text-[11px] bg-paper border border-dashed border-line rounded-lg px-2 py-1 text-muted hover:text-ink cursor-pointer outline-none focus:border-flash max-w-[220px]"
        aria-label="Link an existing task"
      >
        <option value="">+ Link existing task…</option>
        {options.map(t => (
          <option key={t.id} value={t.id}>{t.key} · {t.title}</option>
        ))}
      </select>
    );
  };

  const actions = (children: React.ReactNode) =>
    canEdit ? <div className="flex flex-wrap items-center gap-1" onClick={e => e.stopPropagation()}>{children}</div> : null;

  const iconAction = (Icon: React.ElementType, label: string, onClick: () => void, danger?: boolean) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn('p-1.5 rounded-md text-muted transition-colors', danger ? 'hover:text-danger hover:bg-danger/10' : 'hover:text-ink hover:bg-mist')}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  const storyBlock = (story: Story) => {
    const scope = tasksInStory(story.id);
    return (
      <div key={story.id} className="rounded-xl border border-line bg-paper-elevated">
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
          <button type="button" onClick={() => toggle(story.id)} className="flex items-start gap-2 min-w-0 flex-1 text-left">
            <ChevronDown className={cn('w-3.5 h-3.5 mt-0.5 text-muted transition-transform shrink-0', !isOpen(story.id) && '-rotate-90')} />
            <BookOpen className="w-3.5 h-3.5 mt-0.5 text-flash-deep shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink">{story.title}</span>
              {story.acceptanceCriteria && <span className="block text-[11px] text-muted">✓ {story.acceptanceCriteria}</span>}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={story.priority} showLabel={false} />
            <span className="text-[10px] text-muted">{scope.length} task{scope.length === 1 ? '' : 's'} · {progressOf(scope)}%</span>
            {actions(<>
              <Button variant="ghost" size="xs" icon={Plus} onClick={() => setDialog({ kind: 'task', links: { storyId: story.id } })}>Task</Button>
              {iconAction(Pencil, "Edit story", () => setDialog({ kind: 'story', story }))}
              {iconAction(Trash2, "Delete story", () => confirmDelete('Delete story', `"${story.title}" will be deleted. Its ${scope.length} task(s) stay in the epic.`, () => deleteStory(story.id)), true)}
            </>)}
          </div>
        </div>
        {isOpen(story.id) && (
          <div className="px-3 pb-2.5 pl-9 space-y-1.5">
            {scope.length > 0 ? (
              <ul className="space-y-1">{scope.map(t => taskRow(t))}</ul>
            ) : (
              <p className="text-[11px] text-muted italic">No tasks yet.</p>
            )}
            {linkTask({ storyId: story.id }, t => t.storyId === story.id)}
          </div>
        )}
      </div>
    );
  };

  const epicBlock = (epic: Epic) => {
    const scope = tasksInEpic(epic.id);
    const epicStories = projectStories.filter(s => s.epicId === epic.id);
    const direct = scope.filter(t => !t.storyId);
    return (
      <div key={epic.id} className="rounded-xl border border-line bg-paper overflow-hidden" style={{ borderLeft: `4px solid ${epic.color}` }}>
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
          <button type="button" onClick={() => toggle(epic.id)} className="flex items-start gap-2 min-w-0 flex-1 text-left">
            <ChevronDown className={cn('w-4 h-4 mt-0.5 text-muted transition-transform shrink-0', !isOpen(epic.id) && '-rotate-90')} />
            <Layers className="w-4 h-4 mt-0.5 shrink-0" style={{ color: epic.color }} />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink">{epic.name}</span>
              {epic.description && <span className="block text-[11px] text-muted">{epic.description}</span>}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {epicStories.length} stor{epicStories.length === 1 ? 'y' : 'ies'} · {scope.length} task{scope.length === 1 ? '' : 's'}
            </span>
            <div className="w-20"><ProgressBar value={progressOf(scope)} /></div>
            <span className="text-[10px] font-mono text-muted w-8 text-right">{progressOf(scope)}%</span>
            {actions(<>
              <Button variant="ghost" size="xs" icon={Plus} onClick={() => setDialog({ kind: 'story', epicId: epic.id })}>Story</Button>
              <Button variant="ghost" size="xs" icon={Plus} onClick={() => setDialog({ kind: 'task', links: { epicId: epic.id } })}>Task</Button>
              {iconAction(Pencil, "Edit epic", () => setDialog({ kind: 'epic', epic }))}
              {iconAction(Trash2, "Delete epic", () => confirmDelete('Delete epic', `"${epic.name}" will be deleted. Its stories and tasks stay, without an epic.`, () => deleteEpic(epic.id)), true)}
            </>)}
          </div>
        </div>
        {isOpen(epic.id) && (
          <div className="px-3 pb-3 pl-9 space-y-2">
            {epicStories.map(s => storyBlock(s))}
            {direct.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Directly in this epic</p>
                <ul className="space-y-1">{direct.map(t => taskRow(t))}</ul>
              </div>
            )}
            {epicStories.length === 0 && direct.length === 0 && <p className="text-[11px] text-muted italic">No stories or tasks yet.</p>}
            {linkTask({ epicId: epic.id }, t => t.epicId === epic.id)}
          </div>
        )}
      </div>
    );
  };

  const phaseSection = (phase: Milestone) => {
    const scope = tasksInPhase(phase.id);
    const phaseEpics = projectEpics.filter(e => e.phaseId === phase.id);
    const direct = scope.filter(t => !t.epicId);
    const achieved = phase.status === 'achieved' || phase.status === 'completed';
    return (
      <section key={phase.id} className="rounded-2xl border border-line bg-paper-elevated shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-line">
          <button type="button" onClick={() => toggle(phase.id)} className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
            <ChevronDown className={cn('w-4 h-4 mt-1 text-muted transition-transform shrink-0', !isOpen(phase.id) && '-rotate-90')} />
            <Flag className="w-4 h-4 mt-1 text-flash-deep shrink-0" />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-ink">{phase.name}</span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
                  achieved ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : phase.status === 'at_risk' ? 'border-waiting/40 bg-waiting/10 text-waiting' : 'border-line text-muted')}>
                  {achieved ? 'Achieved' : phase.status === 'at_risk' ? 'At risk' : 'Upcoming'}
                </span>
              </span>
              <span className="block text-[11px] text-muted font-mono mt-0.5">
                {phase.startDate ? `${formatDate(phase.startDate)} → ` : 'Ends '}{formatDate(phase.endDate || phase.dueDate)}
                {' · '}{phaseEpics.length} epic{phaseEpics.length === 1 ? '' : 's'} · {scope.length} task{scope.length === 1 ? '' : 's'}
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-28"><ProgressBar value={progressOf(scope)} /></div>
            <span className="text-xs font-mono font-semibold text-ink w-9 text-right">{progressOf(scope)}%</span>
            {actions(<>
              <Button variant="secondary" size="xs" icon={Plus} onClick={() => setDialog({ kind: 'epic', phaseId: phase.id })}>Epic</Button>
              <Button variant="ghost" size="xs" icon={Plus} onClick={() => setDialog({ kind: 'task', links: { milestoneId: phase.id } })}>Task</Button>
              {iconAction(
                achieved ? RotateCcw : CheckCircle2,
                achieved ? 'Reopen phase' : 'Mark achieved',
                () => updateMilestone(phase.id, { status: achieved ? 'upcoming' : 'achieved', progress: achieved ? phase.progress : 100 })
              )}
              {iconAction(Pencil, "Edit phase", () => setDialog({ kind: 'phase', phase }))}
              {iconAction(Trash2, "Delete phase", () => confirmDelete('Delete phase', `"${phase.name}" will be deleted. Its epics and tasks stay, without a phase.`, () => deleteMilestone(phase.id)), true)}
            </>)}
          </div>
        </div>
        {isOpen(phase.id) && (
          <div className="p-4 space-y-2.5">
            {phaseEpics.map(e => epicBlock(e))}
            {direct.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Directly in this phase</p>
                <ul className="space-y-1">{direct.map(t => taskRow(t))}</ul>
              </div>
            )}
            {phaseEpics.length === 0 && direct.length === 0 && (
              <p className="text-xs text-muted italic">No epics or tasks yet. Add an epic, or a task straight into this phase.</p>
            )}
            {linkTask({ milestoneId: phase.id }, t => t.milestoneId === phase.id)}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="plan" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2"><Map className="w-5 h-5 text-flash-deep" /> Plan</h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {['Phase', 'Epic', 'Story', 'Task', 'Subtask'].map((level, i) => (
                <span key={level} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="w-3 h-3" />}
                  <span className="px-1.5 py-0.5 rounded-md bg-mist text-ink-soft font-medium">{level}</span>
                </span>
              ))}
              <span className="ml-1">Every level above Task is optional.</span>
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" icon={BookOpen} onClick={() => setDialog({ kind: 'story' })}>New story</Button>
              <Button variant="secondary" size="sm" icon={Layers} onClick={() => setDialog({ kind: 'epic' })}>New epic</Button>
              <Button variant="primary" size="sm" icon={Flag} onClick={() => setDialog({ kind: 'phase' })}>New phase</Button>
            </div>
          )}
        </div>

        {phases.map(p => phaseSection(p))}

        {(unphasedEpics.length > 0 || looseStories.length > 0 || unplannedTasks.length > 0 || phases.length === 0) && (
          <section className="rounded-2xl border border-dashed border-line bg-paper-elevated/50 p-4 space-y-2.5">
            <div>
              <h2 className="text-sm font-bold text-ink">Not in a phase</h2>
              <p className="text-[11px] text-muted">Epics, stories and tasks that aren&apos;t planned into a phase yet.</p>
            </div>
            {unphasedEpics.map(e => epicBlock(e))}
            {looseStories.map(s => storyBlock(s))}
            {unplannedTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Unplanned tasks ({unplannedTasks.length})</p>
                <ul className="space-y-1">{unplannedTasks.map(t => taskRow(t))}</ul>
              </div>
            )}
            {phases.length === 0 && unphasedEpics.length === 0 && unplannedTasks.length === 0 && (
              <p className="text-xs text-muted italic">Nothing planned yet. Start with a phase, or an epic if this project doesn&apos;t use phases.</p>
            )}
          </section>
        )}
      </div>

      {dialog?.kind === 'phase' && <PhaseModal projectId={projectId} phase={dialog.phase} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'epic' && <EpicModal projectId={projectId} epic={dialog.epic} defaultPhaseId={dialog.phaseId} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'story' && <StoryModal projectId={projectId} story={dialog.story} defaultEpicId={dialog.epicId} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'task' && (
        <CreateTaskModal
          isOpen
          onClose={() => setDialog(null)}
          projectId={projectId}
          defaultMilestoneId={dialog.links.milestoneId}
          defaultEpicId={dialog.links.epicId}
          defaultStoryId={dialog.links.storyId}
        />
      )}
      <ConfirmDeleteModal
        isOpen={dialog?.kind === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          if (dialog?.kind === 'delete') dialog.run();
          setDialog(null);
        }}
        title={dialog?.kind === 'delete' ? dialog.title : ''}
        message={dialog?.kind === 'delete' ? dialog.message : ''}
      />
    </div>
  );
}
