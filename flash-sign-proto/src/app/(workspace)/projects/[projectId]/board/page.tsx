'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { LEVEL_LABEL, LINK_KEY, projectStructure, taskLevel } from '@/lib/structure';
import { resolvePlan } from '@/lib/plan';
import { canCreateProject } from '@/lib/permissions';
import { placeIn, placementOf, projectBoards, stageLabel, type ResolvedBoard } from '@/lib/board-columns';
import { BoardColumnsModal } from '@/components/projects/board-columns-modal';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { PlacementSelect } from '@/components/tasks/placement-select';
import { CardSubtasks } from '@/components/tasks/card-subtasks';
import { useGuardedMove } from '@/components/tasks/use-guarded-move';
import { PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/shared/ui';
import { TaskTimerBadge } from '@/components/agents/task-timer-badge';
import {
  Plus,
  Search,
  Clock,
  ChevronDown,
  Sparkles,
  Columns3,
  Rows3,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { BoardColumn } from '@/types';

/** Drag-over / quick-add key for one column on one board */
const slot = (board: ResolvedBoard, col: BoardColumn) => `${board.id}:${col.id}`;

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, users, epics, stories, milestones, openTaskDrawer, addTask, demoRole } = useApp();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Quick task modal state
  const [quickAddSlot, setQuickAddSlot] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  // Where a quick-added task goes, when the project doesn't allow a Backlog
  const [quickParentId, setQuickParentId] = useState('');

  // Column editor for one board, optionally opened with a new column added
  const [columnsEditor, setColumnsEditor] = useState<{ boardId: string; add: boolean } | null>(null);

  // Folded boards: the main board starts open, the boards below it start folded
  const [openBoards, setOpenBoards] = useState<Record<string, boolean>>({});

  // Moving a task to Done asks first when some of its subtasks are still open
  const { move, dialog: openSubtasksDialog } = useGuardedMove();

  const project =
    projects.find((p) => p.id === projectId) ||
    (projectId === 'p-mvhmnblw' ? projects.find((p) => p.id === 'p1') : undefined);
  if (!project) return notFound();

  const effectiveId =
    projectId === 'p-mvhmnblw' && !tasks.some((t) => t.projectId === 'p-mvhmnblw')
      ? 'p1'
      : projectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId || t.projectId === effectiveId);
  // Cards are tasks; subtasks show inside their task's card
  const cardTasks = projectTasks.filter((t) => !t.parentId);
  const subtasksByParent = new Map<string, typeof projectTasks>();
  for (const t of projectTasks) {
    if (t.parentId) subtasksByParent.set(t.parentId, [...(subtasksByParent.get(t.parentId) ?? []), t]);
  }
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));
  const boards = projectBoards(project);
  const multiBoard = boards.length > 1;
  const canEditColumns = canCreateProject(demoRole);
  const isOpen = (board: ResolvedBoard) => openBoards[board.id] ?? board.isMain;
  const setOpen = (boardId: string, open: boolean) => setOpenBoards((o) => ({ ...o, [boardId]: open }));

  // Filter cards; a card also matches through its subtasks (their titles and assignees)
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    const matchesText = (t: (typeof projectTasks)[number]) =>
      t.title.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      (t.labels || t.tags || []).some((l: string) => l.toLowerCase().includes(q));
    return cardTasks.filter((t) => {
      const subs = subtasksByParent.get(t.id) ?? [];
      const matchSearch = matchesText(t) || subs.some(matchesText);
      const matchAssignee =
        assigneeFilter === 'all' || t.assigneeId === assigneeFilter || subs.some((s) => s.assigneeId === assigneeFilter);
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchAssignee && matchPriority;
    });
  }, [cardTasks, subtasksByParent, search, assigneeFilter, priorityFilter]);

  const onDragStart = (id: string) => setDraggedId(id);

  // A card takes the column's stage as its status; moving to another board starts a fresh timer there
  const onDrop = (board: ResolvedBoard, col: BoardColumn) => {
    const task = draggedId ? cardTasks.find((t) => t.id === draggedId) : undefined;
    if (task) move(task, placeIn(board, col));
    setDraggedId(null);
    setDragOverSlot(null);
  };

  // Quick-added tasks go to the Backlog, or, when the project doesn't allow one, into a chosen story (or epic / phase)
  const structure = projectStructure(project);
  const quickLevel = structure.backlog ? undefined : taskLevel(structure);
  const quickParents = quickLevel === 'phase'
    ? milestones.filter((m) => m.projectId === project.id).map((m) => ({ id: m.id, name: m.name }))
    : quickLevel === 'epic'
      ? epics.filter((e) => e.projectId === project.id).map((e) => ({ id: e.id, name: e.name }))
      : quickLevel === 'story'
        ? stories.filter((st) => st.projectId === project.id).map((st) => ({ id: st.id, name: st.title }))
        : [];

  const handleQuickAdd = (board: ResolvedBoard, col: BoardColumn) => {
    if (!quickTitle.trim()) {
      notify('Type a title for the task first.', 'error');
      return;
    }
    if (quickLevel && !quickParentId) {
      notify(`Choose ${quickLevel === 'epic' ? 'an' : 'a'} ${LEVEL_LABEL[quickLevel].one} for the task first.`, 'error');
      return;
    }
    addTask({
      title: quickTitle.trim(),
      projectId,
      ...placeIn(board, col),
      ...(quickLevel ? resolvePlan({ [LINK_KEY[quickLevel]]: quickParentId }, epics, stories) : {}),
      priority: 'medium',
      labels: ['Feature'],
      points: 2,
    });
    setQuickTitle('');
    setQuickAddSlot(null);
  };

  const renderColumns = (board: ResolvedBoard) => (
    <div className="overflow-x-auto pb-2">
      <div className={cn('flex gap-4', multiBoard ? 'h-[560px]' : 'h-[calc(100vh-250px)] min-h-[500px]')}>
        {board.columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => {
            const at = placementOf(t, boards);
            return at.board.id === board.id && at.column?.id === col.id;
          });
          const key = slot(board, col);
          const isOver = dragOverSlot === key;

          return (
            <div
              key={col.id}
              className={cn(
                'flex flex-col w-72 sm:w-80 shrink-0 rounded-2xl border transition-all bg-paper-elevated shadow-xs overflow-hidden',
                isOver ? 'border-flash ring-2 ring-flash/20 bg-flash/5' : 'border-line'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSlot(key);
              }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={() => onDrop(board, col)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-line bg-paper/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-xs font-bold text-ink truncate">{col.name}</span>
                  <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                  {col.name !== stageLabel(col.status) && (
                    <span
                      className="text-[9px] uppercase tracking-wider text-muted border border-line px-1.5 py-0.5 rounded-full shrink-0"
                      title={`Counts as ${stageLabel(col.status)}`}
                    >
                      {stageLabel(col.status)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAddSlot(quickAddSlot === key ? null : key)}
                  className="p-1 text-muted hover:text-ink hover:bg-mist rounded-md transition-colors"
                  title={`Quick add to ${col.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Add Form inside column */}
              {quickAddSlot === key && (
                <div className="p-2.5 bg-paper border-b border-line animate-fade-in space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(board, col);
                      if (e.key === 'Escape') setQuickAddSlot(null);
                    }}
                    placeholder={quickLevel ? 'Task title…' : 'Task title… (goes to the Backlog)'}
                    className="w-full px-2.5 py-1.5 text-xs bg-paper-elevated border border-line rounded-lg outline-none focus:border-flash text-ink"
                  />
                  {quickLevel && (
                    <select
                      value={quickParentId}
                      onChange={(e) => setQuickParentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-paper-elevated border border-line rounded-lg outline-none focus:border-flash text-ink"
                      aria-label={`${LEVEL_LABEL[quickLevel].one} for the new task`}
                    >
                      <option value="">Choose {quickLevel === 'epic' ? 'an' : 'a'} {LEVEL_LABEL[quickLevel].one}…</option>
                      {quickParents.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="xs" onClick={() => setQuickAddSlot(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="xs" onClick={() => handleQuickAdd(board, col)}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Cards Area */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto no-scrollbar">
                {colTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  const isDragging = draggedId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStart(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverSlot(null);
                      }}
                      onClick={() => openTaskDrawer(task.id)}
                      className={cn(
                        'p-3.5 bg-paper hover:bg-mist/30 border rounded-xl cursor-grab active:cursor-grabbing transition-all group shadow-2xs',
                        isDragging
                          ? 'opacity-40 border-flash rotate-1'
                          : 'border-line hover:border-flash/50 hover:shadow-xs'
                      )}
                    >
                      {/* Card Top */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={task.priority} showLabel={false} />
                          <span className="text-[10px] font-mono font-semibold text-muted group-hover:text-ink">
                            {task.key}
                          </span>
                        </div>

                        {/* Dropdown for keyboard/accessibility moves, including to another board */}
                        <div onClick={(e) => e.stopPropagation()} className="relative">
                          <PlacementSelect
                            boards={boards}
                            boardId={board.id}
                            columnId={col.id}
                            prefix="Move: "
                            onChange={(b, c) => move(task, placeIn(b, c))}
                            aria-label={`Move ${task.key}`}
                            className="text-[10px] max-w-[130px] bg-paper-elevated border border-line rounded px-1.5 py-0.5 text-muted hover:text-ink cursor-pointer outline-none focus:border-flash"
                          />
                        </div>
                      </div>

                      {/* Card Title */}
                      <p className="text-xs font-semibold text-ink line-clamp-2 mb-2.5 leading-snug">
                        {task.title}
                      </p>

                      {(subtasksByParent.get(task.id)?.length ?? 0) > 0 && (
                        <CardSubtasks
                          task={task}
                          subtasks={subtasksByParent.get(task.id)!}
                          onAllDone={() => {
                            const review = board.columns.find((c) => c.status === 'review');
                            if (review) move(task, placeIn(board, review));
                          }}
                        />
                      )}

                      {/* Labels */}
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {(() => {
                          const epic = task.epicId ? epics.find((e) => e.id === task.epicId) : undefined;
                          return epic ? (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold"
                              style={{ borderColor: `${epic.color}66`, color: epic.color }}
                              title={`Epic: ${epic.name}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: epic.color }} />
                              {epic.name}
                            </span>
                          ) : null;
                        })()}
                        <TaskTimerBadge taskId={task.id} />
                        {task.isSrsGenerated && (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30 uppercase tracking-wider">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> SRS
                          </span>
                        )}
                        {task.labels && task.labels.slice(0, 2).map((l) => (
                          <span
                            key={l}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-mist text-muted font-mono"
                          >
                            {l}
                          </span>
                        ))}
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[10px] text-muted">
                        <div className="flex items-center gap-1.5">
                          {assignee ? (
                            <Avatar user={assignee} size="xs" />
                          ) : (
                            <span className="italic text-[9px]">Unassigned</span>
                          )}
                          {task.dueDate && (
                            <span className="font-mono flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>

                        {task.points && (
                          <span className="font-mono font-medium px-1.5 py-0.5 bg-mist/80 rounded">
                            {task.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-28 flex flex-col items-center justify-center text-center text-xs text-muted/60 border-2 border-dashed border-line/60 rounded-xl m-1">
                    <span>Drop tasks here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {canEditColumns && (
          <button
            type="button"
            onClick={() => setColumnsEditor({ boardId: board.id, add: true })}
            className="w-56 shrink-0 self-start flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-muted hover:text-ink border-2 border-dashed border-line hover:border-flash/50 rounded-2xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add column
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-paper flex flex-col pb-12">
      <ProjectHeaderNav projectId={projectId} activeTab="board" />

      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 max-w-[1600px] mx-auto w-full">
        {/* Board Controls */}
        <div className="bg-paper-elevated border border-line p-3 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search board…"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Assignees</option>
              {projectMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono">
              {filteredTasks.length} / {cardTasks.length} tasks
            </span>
            {canEditColumns && !multiBoard && (
              <Button variant="secondary" size="sm" icon={Columns3} onClick={() => setColumnsEditor({ boardId: boards[0].id, add: false })}>
                Columns
              </Button>
            )}
            {canEditColumns && (
              <Link href={`/projects/${projectId}/settings#boards`}>
                <Button variant="secondary" size="sm" icon={Rows3}>
                  Boards
                </Button>
              </Link>
            )}
            <Link href={`/projects/${projectId}/tasks/new`}>
              <Button variant="primary" size="sm" icon={Plus}>
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Boards: one board shows as before; several stack, each one folding open or closed */}
        {multiBoard ? (
          <div className="space-y-3">
            {boards.map((board) => {
              const open = isOpen(board);
              const count = filteredTasks.filter((t) => placementOf(t, boards).board.id === board.id).length;
              // Dropping a card on a board's header puts it in that board's first To Do column
              const entryColumn = board.columns.find((c) => c.status === 'todo') ?? board.columns[0];
              const headerSlot = `${board.id}:header`;
              return (
                <section key={board.id} className="rounded-2xl border border-line bg-paper-elevated/40">
                  <div
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-2xl transition-colors',
                      dragOverSlot === headerSlot && 'bg-flash/10 ring-2 ring-flash/30'
                    )}
                    // Dragging a card over a folded board also opens it, so it can go into any column
                    onDragOver={(e) => {
                      if (!draggedId) return;
                      e.preventDefault();
                      setDragOverSlot(headerSlot);
                      if (!open) setOpen(board.id, true);
                    }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={() => onDrop(board, entryColumn)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(board.id, !open)}
                      aria-expanded={open}
                      className="flex items-center gap-2 min-w-0 text-left"
                    >
                      <ChevronDown className={cn('w-4 h-4 text-muted transition-transform', !open && '-rotate-90')} />
                      <span className="text-sm font-bold text-ink truncate">{board.name}</span>
                      <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded-full">
                        {count} card{count === 1 ? '' : 's'}
                      </span>
                      {!board.isMain && (
                        <span className="text-[10px] text-muted border border-line px-1.5 py-0.5 rounded-full">
                          {board.mirrorsMain ? `Mirrors ${boards[0].name}` : 'Own columns'}
                        </span>
                      )}
                      {draggedId && (
                        <span className="text-[10px] font-semibold text-flash-deep">
                          Drop here for {board.name} · {entryColumn.name}
                        </span>
                      )}
                    </button>
                    {canEditColumns && (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Columns3}
                        onClick={() => setColumnsEditor({ boardId: board.id, add: false })}
                      >
                        Columns
                      </Button>
                    )}
                  </div>
                  {open && <div className="px-3 pb-3">{renderColumns(board)}</div>}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="flex-1">{renderColumns(boards[0])}</div>
        )}
      </div>

      {openSubtasksDialog}

      {columnsEditor && (
        <BoardColumnsModal
          project={project}
          boardId={columnsEditor.boardId}
          tasks={projectTasks}
          startWithNewColumn={columnsEditor.add}
          onClose={() => setColumnsEditor(null)}
        />
      )}
    </div>
  );
}
