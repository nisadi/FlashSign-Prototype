'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Button, Card, EmptyState } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  CheckSquare,
  ArrowUpDown,
  Filter,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export default function ProjectTasksListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, users, sprints, milestones, openTaskDrawer, updateTask, deleteTask } =
    useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'key' | 'title' | 'dueDate' | 'priority' | 'status'>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'assignee'>('none');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return projectTasks
      .filter((t) => {
        const taskLabels = t.labels || t.tags || [];
        const matchSearch =
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.key.toLowerCase().includes(search.toLowerCase()) ||
          taskLabels.some((l: string) => l.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
        const matchAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
        return matchSearch && matchStatus && matchPriority && matchAssignee;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'key') {
          valA = a.key;
          valB = b.key;
        } else if (sortBy === 'title') {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (sortBy === 'dueDate') {
          valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        } else if (sortBy === 'priority') {
          const map: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          valA = map[a.priority];
          valB = map[b.priority];
        } else if (sortBy === 'status') {
          valA = a.status;
          valB = b.status;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [projectTasks, search, statusFilter, priorityFilter, assigneeFilter, sortBy, sortDir]);

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTasks.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkComplete = () => {
    selectedIds.forEach((id) => {
      updateTask(id, { status: 'done' });
    });
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      deleteTask(id);
    });
    setSelectedIds([]);
  };

  const handleBulkPriority = (priority: TaskPriority) => {
    selectedIds.forEach((id) => {
      updateTask(id, { priority });
    });
    setSelectedIds([]);
  };

  const handleSort = (column: 'key' | 'title' | 'dueDate' | 'priority' | 'status') => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="tasks" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Controls Bar */}
        <div className="bg-paper-elevated border border-line p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, key, label…"
                className="w-full pl-9 pr-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/projects/${projectId}/tasks/new`}>
                <Button variant="primary" size="sm" icon={Plus}>
                  Create Task
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
            <span className="text-muted text-[11px] font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Priority filter */}
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

            {/* Assignee filter */}
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

            {/* Group by */}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-muted text-[11px]">Group by:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
              >
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="assignee">Assignee</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-ink text-white rounded-xl flex items-center justify-between gap-3 text-xs animate-fade-in shadow-md">
            <span className="font-medium text-flash">
              {selectedIds.length} {selectedIds.length === 1 ? 'task' : 'tasks'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Check}
                onClick={handleBulkComplete}
                className="bg-ink-soft text-white hover:bg-ink-soft/80 border-none"
              >
                Mark Done
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-white/70">Set priority:</span>
                {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleBulkPriority(p)}
                    className="px-2 py-1 rounded bg-ink-soft hover:bg-ink-soft/80 text-[10px] font-mono capitalize"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleBulkDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Task Table */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={
              search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Get started by creating your first task in this project.'
            }
            action={
              <Link href={`/projects/${projectId}/tasks/new`}>
                <Button variant="primary" size="sm" icon={Plus}>
                  Create First Task
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-paper text-muted text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === filteredTasks.length && filteredTasks.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-line text-flash focus:ring-flash"
                      />
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-ink w-24"
                      onClick={() => handleSort('key')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Key <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-ink"
                      onClick={() => handleSort('title')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Title <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-ink w-32"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Status <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-ink w-28"
                      onClick={() => handleSort('priority')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Priority <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="py-3 px-3 w-36">Assignee</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-ink w-28"
                      onClick={() => handleSort('dueDate')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Due Date <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="py-3 px-3 w-20">Points</th>
                    <th className="py-3 px-4 w-32">Labels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredTasks.map((task) => {
                    const isSelected = selectedIds.includes(task.id);
                    const assignee = users.find((u) => u.id === task.assigneeId);
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== 'done';

                    return (
                      <tr
                        key={task.id}
                        onClick={() => openTaskDrawer(task.id)}
                        className={`hover:bg-mist/30 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-flash/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4" onClick={(e) => toggleSelect(task.id, e)}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-line text-flash focus:ring-flash"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] font-semibold text-muted group-hover:text-flash-deep">
                          {task.key}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-medium ${
                              task.status === 'done'
                                ? 'line-through text-muted'
                                : 'text-ink group-hover:text-flash-deep'
                            }`}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                            className="bg-transparent border border-transparent hover:border-line rounded px-1.5 py-0.5 text-xs text-ink cursor-pointer focus:bg-paper-elevated focus:border-flash outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="py-3 px-3">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar user={assignee} size="xs" />
                              <span className="text-ink truncate max-w-[100px]">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted/60 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {task.dueDate ? (
                            <span
                              className={
                                isOverdue ? 'text-danger font-semibold flex items-center gap-1' : 'text-muted'
                              }
                            >
                              {isOverdue && <AlertCircle className="w-3 h-3" />}
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-muted/50">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-muted text-[11px]">
                          {(task.points || task.storyPoints) ? `${task.points || task.storyPoints} pts` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(task.labels || task.tags || []).slice(0, 2).map((label: string) => (
                              <span
                                key={label}
                                className="px-1.5 py-0.5 bg-mist text-muted rounded text-[10px] font-mono"
                              >
                                {label}
                              </span>
                            ))}
                            {(task.labels || task.tags || []).length > 2 && (
                              <span className="text-[10px] text-muted">+{(task.labels || task.tags || []).length - 2}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
