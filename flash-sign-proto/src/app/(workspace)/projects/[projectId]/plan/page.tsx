'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Flag, Layers, BookOpen, Plus, Pencil, Trash2, ChevronDown, CheckCircle2, RotateCcw, ArrowRight, CornerDownRight, Map,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
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
import {
  LEVEL_LABEL, LINK_KEY, inBacklog, levelsOf, projectStructure, taskLevel, taskPlacementIssue, type PlanLevel,
} from '@/lib/structure';
import {
  epicSpan, epicWindow, forecastOf, outsideWindow, phaseSpan, projectWindow, storySpan, storyWindow, taskWindow,
  type PlanData, type TimeWindow,
} from '@/lib/schedule';
import { formatDays, formatDuration, type DurationUnit } from '@/lib/durations';
import { useNow } from '@/lib/use-now';
import { cn, formatDate } from '@/lib/utils';
import type { Epic, Milestone, Story, Task } from '@/types';

type Dialog =
  | { kind: 'phase'; phase?: Milestone }
  | { kind: 'epic'; epic?: Epic; phaseId?: string }
  | { kind: 'story'; story?: Story; epicId?: string; phaseId?: string }
  | { kind: 'task'; links: PlanLinks }
  | { kind: 'delete'; title: string; message: string; run: () => void };

/**
 * The project plan as a tree, following the project's structure (e.g. Phase → Epic → Story →
 * Task). Each card only offers the level directly below it; tasks go in the lowest level.
 */
export default function ProjectPlanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const {
    projects, tasks, users, milestones, epics, stories, demoRole, taskStatusChanges,
    updateMilestone, deleteMilestone, deleteEpic, deleteStory, setTaskPlan, openTaskDrawer,
  } = useApp();
  const now = useNow();
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

  // ── Structure: which levels this project uses ────────────────────────────────
  const structure = projectStructure(project);
  const levels = levelsOf(structure);
  const lowest = taskLevel(structure);
  /** What gets created inside a level: the next level in use below it, or tasks */
  const childOf = (level: PlanLevel): PlanLevel | 'task' => levels[levels.indexOf(level) + 1] ?? 'task';

  const tasksIn = (level: PlanLevel, id: string) => mainTasks.filter(t => t[LINK_KEY[level]] === id);
  /** Tasks in a level that should be one level further down, e.g. in a phase but not in a story */
  const misplacedIn = (level: PlanLevel, id: string) => (level === lowest ? [] : tasksIn(level, id).filter(t => taskPlacementIssue(t, structure)));
  const backlogTasks = mainTasks.filter(t => inBacklog(t));

  const epicsInPhase = (phaseId: string) => projectEpics.filter(e => e.phaseId === phaseId);
  const storiesIn = (parent: 'phase' | 'epic', id: string) =>
    projectStories.filter(st => (parent === 'epic' ? st.epicId === id : !st.epicId && st.phaseId === id));

  // Items whose parent level is in use but which have no parent: shown under "Needs a place"
  const homelessEpics = structure.phases ? projectEpics.filter(e => !e.phaseId || !phases.some(p => p.id === e.phaseId)) : [];
  const homelessStories = projectStories.filter(st =>
    structure.epics ? !st.epicId || !projectEpics.some(e => e.id === st.epicId) : structure.phases && (!st.phaseId || !phases.some(p => p.id === st.phaseId))
  );

  // ── Time at each level ──────────────────────────────────────────────────────
  const planData: PlanData = { project, milestones, epics, stories, tasks };

  /**
   * A level's time: its planned dates and length, then, if its work runs late, when it now ends;
   * and a warning when it doesn't fit inside its parent.
   */
  const timeLine = (span: TimeWindow, unit: DurationUnit | undefined, scope: Task[], parent?: TimeWindow, inherited?: boolean) => {
    const forecast = now !== null ? forecastOf(span.end, scope, projectTasks, taskStatusChanges, now) : undefined;
    const outside = parent ? outsideWindow(span.start, span.end, parent) : undefined;
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono text-muted">
        <span>
          {formatDate(span.start)} → {formatDate(span.end)} · {formatDuration(span.start, span.end, unit)}
          {inherited && <span className="font-sans italic"> (all of {parent?.label})</span>}
        </span>
        {forecast && forecast.lateBy > 0 && (
          <span className="font-sans font-semibold text-waiting" title="Its work is running late, so it now ends later than planned">
            Now ends {formatDate(forecast.end)} (+{forecast.lateBy} day{forecast.lateBy === 1 ? '' : 's'})
          </span>
        )}
        {outside && <span className="font-sans font-semibold text-danger">{outside}</span>}
      </span>
    );
  };

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
        {taskPlacementIssue(task, structure) && !inBacklog(task) && (
          <span className="text-[10px] font-semibold text-waiting">{taskPlacementIssue(task, structure)}</span>
        )}
        {(() => {
          const outside = outsideWindow(task.startDate, task.dueDate, taskWindow(task, planData));
          return outside ? <span className="text-[10px] font-semibold text-danger">{outside}</span> : null;
        })()}
        <span className="text-[10px] font-mono text-muted">{formatDays(task.estimatedDuration || 3, task.durationUnit, task.startDate)}</span>
        <TaskStatusBadge status={task.status} />
        {assignee && <Avatar user={assignee} size="xs" />}
      </li>
    );
  };

  /** "+ Link existing task" for a story, epic or phase */
  const linkTask = (links: PlanLinks, exclude: (t: Task) => boolean) => {
    // With moving turned off, only tasks still in the Backlog can be placed
    const options = mainTasks.filter(t => !exclude(t) && (structure.allowMove || inBacklog(t)));
    if (!canEdit || options.length === 0) return null;
    return (
      <select
        value=""
        onChange={e => {
          const task = mainTasks.find(t => t.id === e.target.value);
          if (!task) return;
          setTaskPlan(task.id, links);
          notify(`${task.key} moved here`);
        }}
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

  /** The one "+" a card gets: the level directly below it in this project's structure */
  const addChild = (level: PlanLevel, id: string) => {
    const child = childOf(level);
    const label = child === 'task' ? 'Task' : child === 'epic' ? 'Epic' : 'Story';
    const open = () =>
      child === 'task' ? setDialog({ kind: 'task', links: { [LINK_KEY[level]]: id } })
        : child === 'epic' ? setDialog({ kind: 'epic', phaseId: id })
          : setDialog({ kind: 'story', epicId: level === 'epic' ? id : undefined, phaseId: level === 'phase' ? id : undefined });
    return <Button variant={level === 'phase' ? 'secondary' : 'ghost'} size="xs" icon={Plus} onClick={open}>{label}</Button>;
  };

  const article = (level: PlanLevel | 'task') => (level === 'epic' ? 'an' : 'a');

  /** Tasks sitting at a level above where this project keeps tasks */
  const misplacedGroup = (list: Task[]) =>
    list.length > 0 && lowest ? (
      <div className="space-y-1 rounded-lg border border-waiting/30 bg-waiting/5 p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-waiting">
          Needs {article(lowest)} {LEVEL_LABEL[lowest].one} ({list.length})
        </p>
        <p className="text-[11px] text-muted">Open a task and choose its {LEVEL_LABEL[lowest].one}.</p>
        <ul className="space-y-1">{list.map(t => taskRow(t))}</ul>
      </div>
    ) : null;

  const storyBlock = (story: Story) => {
    const scope = tasksIn('story', story.id);
    return (
      <div key={story.id} className="rounded-xl border border-line bg-paper-elevated">
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
          <button type="button" onClick={() => toggle(story.id)} className="flex items-start gap-2 min-w-0 flex-1 text-left">
            <ChevronDown className={cn('w-3.5 h-3.5 mt-0.5 text-muted transition-transform shrink-0', !isOpen(story.id) && '-rotate-90')} />
            <BookOpen className="w-3.5 h-3.5 mt-0.5 text-flash-deep shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink">{story.title}</span>
              {story.acceptanceCriteria && <span className="block text-[11px] text-muted">✓ {story.acceptanceCriteria}</span>}
              {timeLine(storySpan(story, planData), story.durationUnit, scope, storyWindow(story, planData), !(story.startDate && story.endDate))}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={story.priority} showLabel={false} />
            <span className="text-[10px] text-muted">{scope.length} task{scope.length === 1 ? '' : 's'} · {progressOf(scope)}%</span>
            {actions(<>
              {addChild('story', story.id)}
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
    const scope = tasksIn('epic', epic.id);
    const epicStories = structure.stories ? storiesIn('epic', epic.id) : [];
    const isLowest = lowest === 'epic';
    return (
      <div key={epic.id} className="rounded-xl border border-line bg-paper overflow-hidden" style={{ borderLeft: `4px solid ${epic.color}` }}>
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
          <button type="button" onClick={() => toggle(epic.id)} className="flex items-start gap-2 min-w-0 flex-1 text-left">
            <ChevronDown className={cn('w-4 h-4 mt-0.5 text-muted transition-transform shrink-0', !isOpen(epic.id) && '-rotate-90')} />
            <Layers className="w-4 h-4 mt-0.5 shrink-0" style={{ color: epic.color }} />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-ink">{epic.name}</span>
              {epic.description && <span className="block text-[11px] text-muted">{epic.description}</span>}
              {timeLine(epicSpan(epic, planData), epic.durationUnit, scope, epicWindow(epic.phaseId, planData), !(epic.startDate && epic.endDate))}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {structure.stories && `${epicStories.length} stor${epicStories.length === 1 ? 'y' : 'ies'} · `}{scope.length} task{scope.length === 1 ? '' : 's'}
            </span>
            <div className="w-20"><ProgressBar value={progressOf(scope)} /></div>
            <span className="text-[10px] font-mono text-muted w-8 text-right">{progressOf(scope)}%</span>
            {actions(<>
              {addChild('epic', epic.id)}
              {iconAction(Pencil, "Edit epic", () => setDialog({ kind: 'epic', epic }))}
              {iconAction(Trash2, "Delete epic", () => confirmDelete('Delete epic', `"${epic.name}" will be deleted. Its stories and tasks stay, without an epic.`, () => deleteEpic(epic.id)), true)}
            </>)}
          </div>
        </div>
        {isOpen(epic.id) && (
          <div className="px-3 pb-3 pl-9 space-y-2">
            {epicStories.map(s => storyBlock(s))}
            {isLowest && scope.length > 0 && <ul className="space-y-1">{scope.map(t => taskRow(t))}</ul>}
            {misplacedGroup(misplacedIn('epic', epic.id))}
            {(isLowest ? scope.length === 0 : epicStories.length === 0) && (
              <p className="text-[11px] text-muted italic">No {isLowest ? 'tasks' : 'stories'} yet.</p>
            )}
            {isLowest && linkTask({ epicId: epic.id }, t => t.epicId === epic.id)}
          </div>
        )}
      </div>
    );
  };

  const phaseSection = (phase: Milestone) => {
    const scope = tasksIn('phase', phase.id);
    const phaseEpics = structure.epics ? epicsInPhase(phase.id) : [];
    const phaseStories = !structure.epics && structure.stories ? storiesIn('phase', phase.id) : [];
    const isLowest = lowest === 'phase';
    const children = isLowest ? scope.length : phaseEpics.length + phaseStories.length;
    const child = childOf('phase');
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
              <span className="block mt-0.5">{timeLine(phaseSpan(phase, project), phase.durationUnit, scope, projectWindow(project))}</span>
              <span className="block text-[11px] text-muted">
                {structure.epics && `${phaseEpics.length} epic${phaseEpics.length === 1 ? '' : 's'} · `}
                {phaseStories.length > 0 && `${phaseStories.length} stor${phaseStories.length === 1 ? 'y' : 'ies'} · `}
                {scope.length} task{scope.length === 1 ? '' : 's'}
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-28"><ProgressBar value={progressOf(scope)} /></div>
            <span className="text-xs font-mono font-semibold text-ink w-9 text-right">{progressOf(scope)}%</span>
            {actions(<>
              {addChild('phase', phase.id)}
              {iconAction(
                achieved ? RotateCcw : CheckCircle2,
                achieved ? 'Reopen phase' : 'Mark achieved',
                () => {
                  updateMilestone(phase.id, { status: achieved ? 'upcoming' : 'achieved', progress: achieved ? phase.progress : 100 });
                  notify(achieved ? `Phase "${phase.name}" reopened` : `Phase "${phase.name}" marked as achieved`);
                }
              )}
              {iconAction(Pencil, "Edit phase", () => setDialog({ kind: 'phase', phase }))}
              {iconAction(Trash2, "Delete phase", () => confirmDelete('Delete phase', `"${phase.name}" will be deleted. Its epics and tasks stay, without a phase.`, () => deleteMilestone(phase.id)), true)}
            </>)}
          </div>
        </div>
        {isOpen(phase.id) && (
          <div className="p-4 space-y-2.5">
            {phaseEpics.map(e => epicBlock(e))}
            {phaseStories.map(st => storyBlock(st))}
            {isLowest && scope.length > 0 && <ul className="space-y-1">{scope.map(t => taskRow(t))}</ul>}
            {misplacedGroup(misplacedIn('phase', phase.id).filter(t => !t.epicId && !t.storyId))}
            {children === 0 && (
              <p className="text-xs text-muted italic">Nothing here yet. Add {article(child)} {LEVEL_LABEL[child].one}.</p>
            )}
            {isLowest && linkTask({ milestoneId: phase.id }, t => t.milestoneId === phase.id)}
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
              {[...levels.map(l => LEVEL_LABEL[l].one), 'task', ...(structure.subtasks ? ['subtask'] : [])].map((level, i) => (
                <span key={level} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="w-3 h-3" />}
                  <span className="px-1.5 py-0.5 rounded-md bg-mist text-ink-soft font-medium capitalize">{level}</span>
                </span>
              ))}
              {canEdit && (
                <Link href={`/projects/${projectId}/settings#structure`} className="ml-1 text-flash-deep hover:underline">
                  Change structure
                </Link>
              )}
            </p>
            {(() => {
              const w = projectWindow(project);
              const lateBy = project.timelineStatus === 'extended' ? project.timelineDifference ?? 0 : 0;
              return (
                <p className="mt-1.5 text-xs text-muted">
                  Project time: <span className="font-mono text-ink">{formatDate(w.start)} → {formatDate(w.end)}</span>
                  {' · '}{formatDuration(w.start, w.end, project.durationUnit)}. Each level&apos;s time sits inside its parent&apos;s.
                  {lateBy > 0 && project.currentEndDate && (
                    <span className="ml-1 font-semibold text-waiting">Work running late moves the end to {formatDate(project.currentEndDate)} (+{lateBy} days).</span>
                  )}
                </p>
              );
            })()}
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Only the top level is created from here; everything else inside its parent */}
              {levels[0] === 'phase' && <Button variant="primary" size="sm" icon={Flag} onClick={() => setDialog({ kind: 'phase' })}>New phase</Button>}
              {levels[0] === 'epic' && <Button variant="primary" size="sm" icon={Layers} onClick={() => setDialog({ kind: 'epic' })}>New epic</Button>}
              {levels[0] === 'story' && <Button variant="primary" size="sm" icon={BookOpen} onClick={() => setDialog({ kind: 'story' })}>New story</Button>}
              {!levels[0] && <Button variant="primary" size="sm" icon={Plus} onClick={() => setDialog({ kind: 'task', links: {} })}>New task</Button>}
            </div>
          )}
        </div>

        {/* The top level of this project's structure */}
        {levels[0] === 'phase' && phases.map(p => phaseSection(p))}
        {levels[0] === 'epic' && projectEpics.map(e => epicBlock(e))}
        {levels[0] === 'story' && projectStories.map(st => storyBlock(st))}
        {!levels[0] && (
          <section className="rounded-2xl border border-line bg-paper-elevated p-4 space-y-2">
            <h2 className="text-sm font-bold text-ink">Tasks</h2>
            {mainTasks.length > 0 ? <ul className="space-y-1">{mainTasks.map(t => taskRow(t))}</ul> : <p className="text-xs text-muted italic">No tasks yet.</p>}
          </section>
        )}
        {levels[0] && (levels[0] === 'phase' ? phases : levels[0] === 'epic' ? projectEpics : projectStories).length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted">
            No {LEVEL_LABEL[levels[0]].many} yet. Start with &quot;New {LEVEL_LABEL[levels[0]].one}&quot;.
          </p>
        )}

        {/* Items whose parent level is in use but which have no parent */}
        {(homelessEpics.length > 0 || homelessStories.length > 0) && (
          <section className="rounded-2xl border border-dashed border-waiting/40 bg-waiting/5 p-4 space-y-2.5">
            <div>
              <h2 className="text-sm font-bold text-ink">Needs a place in the plan</h2>
              <p className="text-[11px] text-muted">
                {homelessEpics.length > 0 && 'Epics need a phase. '}
                {homelessStories.length > 0 && `Stories need ${structure.epics ? 'an epic' : 'a phase'}. `}
                Edit each one to choose it.
              </p>
            </div>
            {homelessEpics.map(e => epicBlock(e))}
            {homelessStories.map(st => storyBlock(st))}
          </section>
        )}

        {/* Tasks not placed anywhere yet */}
        {lowest && backlogTasks.length > 0 && (
          <section className={cn('rounded-2xl border border-dashed p-4 space-y-2', structure.backlog ? 'border-line bg-paper-elevated/50' : 'border-waiting/40 bg-waiting/5')}>
            <div>
              <h2 className="text-sm font-bold text-ink">
                {structure.backlog ? 'Backlog' : `Needs ${article(lowest)} ${LEVEL_LABEL[lowest].one}`} ({backlogTasks.length})
              </h2>
              <p className="text-[11px] text-muted">
                Tasks not placed in {article(lowest)} {LEVEL_LABEL[lowest].one} yet. Open one and choose its {LEVEL_LABEL[lowest].one}, or use
                &quot;Link existing task&quot; on {article(lowest)} {LEVEL_LABEL[lowest].one}.
              </p>
            </div>
            <ul className="space-y-1">{backlogTasks.map(t => taskRow(t))}</ul>
          </section>
        )}
      </div>

      {dialog?.kind === 'phase' && <PhaseModal projectId={projectId} phase={dialog.phase} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'epic' && <EpicModal projectId={projectId} epic={dialog.epic} defaultPhaseId={dialog.phaseId} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'story' && <StoryModal projectId={projectId} story={dialog.story} defaultEpicId={dialog.epicId} defaultPhaseId={dialog.phaseId} onClose={() => setDialog(null)} />}
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
          if (dialog?.kind === 'delete') {
            dialog.run();
            notify(`${dialog.title.replace('Delete ', '').replace(/^./, c => c.toUpperCase())} deleted`);
          }
          setDialog(null);
        }}
        title={dialog?.kind === 'delete' ? dialog.title : ''}
        message={dialog?.kind === 'delete' ? dialog.message : ''}
      />
    </div>
  );
}
