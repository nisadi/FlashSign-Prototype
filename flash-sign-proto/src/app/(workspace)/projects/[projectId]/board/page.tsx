'use client';

import { use, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { canCreateProject } from '@/lib/permissions';
import { boardColumnsFor, columnOfTask, stageLabel } from '@/lib/board-columns';
import { BoardColumnsModal } from '@/components/projects/board-columns-modal';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/shared/ui';
import { TaskTimerBadge } from '@/components/agents/task-timer-badge';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Clock,
  MessageSquare,
  GripVertical,
  ChevronDown,
  Sparkles,
  Columns3,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { BoardColumn } from '@/types';

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, users, updateTask, openTaskDrawer, addTask, demoRole } = useApp();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Quick task modal state
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  // Column editor: closed, open, or open with a new column added
  const [columnsEditor, setColumnsEditor] = useState<'closed' | 'edit' | 'add'>('closed');

  const project =
    projects.find((p) => p.id === projectId) ||
    (projectId === 'p-mvhmnblw' ? projects.find((p) => p.id === 'p1') : undefined);
  if (!project) return notFound();

  const effectiveId =
    projectId === 'p-mvhmnblw' && !tasks.some((t) => t.projectId === 'p-mvhmnblw')
      ? 'p1'
      : projectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId || t.projectId === effectiveId);
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));
  const columns = boardColumnsFor(project);
  const canEditColumns = canCreateProject(demoRole);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      const taskLabels = t.labels || t.tags || [];
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        taskLabels.some((l: string) => l.toLowerCase().includes(search.toLowerCase()));
      const matchAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchAssignee && matchPriority;
    });
  }, [projectTasks, search, assigneeFilter, priorityFilter]);

  const onDragStart = (id: string) => setDraggedId(id);

  // A card takes the column's stage as its status; moves between columns of one stage keep the timer as is
  const moveToColumn = (taskId: string, col: BoardColumn) =>
    updateTask(taskId, { status: col.status, columnId: col.id });

  const onDrop = useCallback(
    (col: BoardColumn) => {
      if (draggedId) {
        updateTask(draggedId, { status: col.status, columnId: col.id });
        setDraggedId(null);
        setDragOverCol(null);
      }
    },
    [draggedId, updateTask]
  );

  const handleQuickAdd = (col: BoardColumn) => {
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      projectId,
      status: col.status,
      columnId: col.id,
      priority: 'medium',
      labels: ['Feature'],
      points: 2,
    });
    setQuickTitle('');
    setQuickAddCol(null);
  };

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
              {filteredTasks.length} / {projectTasks.length} tasks
            </span>
            {canEditColumns && (
              <Button variant="secondary" size="sm" icon={Columns3} onClick={() => setColumnsEditor('edit')}>
                Columns
              </Button>
            )}
            <Link href={`/projects/${projectId}/tasks/new`}>
              <Button variant="primary" size="sm" icon={Plus}>
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Board Columns */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-[calc(100vh-250px)] min-h-[500px]">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => columnOfTask(t, columns)?.id === col.id);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  className={cn(
                    'flex flex-col w-72 sm:w-80 shrink-0 rounded-2xl border transition-all bg-paper-elevated shadow-xs overflow-hidden',
                    isOver ? 'border-flash ring-2 ring-flash/20 bg-flash/5' : 'border-line'
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.id);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => onDrop(col)}
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
                      onClick={() => setQuickAddCol(quickAddCol === col.id ? null : col.id)}
                      className="p-1 text-muted hover:text-ink hover:bg-mist rounded-md transition-colors"
                      title={`Quick add to ${col.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Add Form inside column */}
                  {quickAddCol === col.id && (
                    <div className="p-2.5 bg-paper border-b border-line animate-fade-in space-y-2">
                      <input
                        type="text"
                        autoFocus
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAdd(col);
                          if (e.key === 'Escape') setQuickAddCol(null);
                        }}
                        placeholder="Task title…"
                        className="w-full px-2.5 py-1.5 text-xs bg-paper-elevated border border-line rounded-lg outline-none focus:border-flash text-ink"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setQuickAddCol(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleQuickAdd(col)}
                        >
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
                            setDragOverCol(null);
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

                            {/* Dropdown for keyboard/accessibility status change */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="relative"
                            >
                              <select
                                value={col.id}
                                onChange={(e) => {
                                  const target = columns.find((c) => c.id === e.target.value);
                                  if (target) moveToColumn(task.id, target);
                                }}
                                className="text-[10px] bg-paper-elevated border border-line rounded px-1.5 py-0.5 text-muted hover:text-ink cursor-pointer outline-none focus:border-flash"
                              >
                                {columns.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    Move: {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Card Title */}
                          <p className="text-xs font-semibold text-ink line-clamp-2 mb-2.5 leading-snug">
                            {task.title}
                          </p>

                          {/* Labels */}
                          <div className="flex flex-wrap gap-1 mb-2.5">
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
                onClick={() => setColumnsEditor('add')}
                className="w-56 shrink-0 self-start flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-muted hover:text-ink border-2 border-dashed border-line hover:border-flash/50 rounded-2xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add column
              </button>
            )}
          </div>
        </div>
      </div>

      {columnsEditor !== 'closed' && (
        <BoardColumnsModal
          project={project}
          tasks={projectTasks}
          startWithNewColumn={columnsEditor === 'add'}
          onClose={() => setColumnsEditor('closed')}
        />
      )}
    </div>
  );
}
