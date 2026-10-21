'use client';

import { use, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/shared/ui';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Clock,
  MessageSquare,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'var(--muted)' },
  { id: 'in_progress', label: 'In Progress', color: '#42a5f5' },
  { id: 'review', label: 'In Review', color: 'var(--waiting)' },
  { id: 'done', label: 'Done', color: 'var(--flash)' },
  { id: 'blocked', label: 'Blocked', color: 'var(--danger)' },
];

export default function KanbanBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, users, updateTask, openTaskDrawer, addTask } = useApp();

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Quick task modal state
  const [quickAddCol, setQuickAddCol] = useState<TaskStatus | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));

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

  const onDrop = useCallback(
    (status: TaskStatus) => {
      if (draggedId) {
        updateTask(draggedId, { status });
        setDraggedId(null);
        setDragOverCol(null);
      }
    },
    [draggedId, updateTask]
  );

  const handleQuickAdd = (status: TaskStatus) => {
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      projectId,
      status,
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
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
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
                  onDrop={() => onDrop(col.id)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-line bg-paper/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-bold text-ink">{col.label}</span>
                      <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickAddCol(quickAddCol === col.id ? null : col.id)}
                      className="p-1 text-muted hover:text-ink hover:bg-mist rounded-md transition-colors"
                      title={`Quick add to ${col.label}`}
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
                          if (e.key === 'Enter') handleQuickAdd(col.id);
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
                          onClick={() => handleQuickAdd(col.id)}
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
                                value={task.status}
                                onChange={(e) =>
                                  updateTask(task.id, { status: e.target.value as TaskStatus })
                                }
                                className="text-[10px] bg-paper-elevated border border-line rounded px-1.5 py-0.5 text-muted hover:text-ink cursor-pointer outline-none focus:border-flash"
                              >
                                {COLUMNS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    Move: {c.label}
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
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {task.labels.slice(0, 2).map((l) => (
                                <span
                                  key={l}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-mist text-muted font-mono"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
