'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp, useCurrentUser } from '@/context/app-context';
import { Card, StatCard, Button, EmptyState } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  List,
  LayoutGrid,
  CheckCircle2,
  ChevronDown,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { placementOf, projectBoards } from '@/lib/board-columns';

export default function MyTasksPage() {
  const { tasks, projects, updateTask, openTaskDrawer, currentUserId, users } = useApp();
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>(
    'all'
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Tasks assigned to current user
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === currentUser?.id);
  }, [tasks, currentUser]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const dueTodayTasks = myTasks.filter((t) => t.dueDate === todayStr && t.status !== 'done');
  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  );
  const upcomingTasks = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) > now && t.status !== 'done'
  );
  const completedTasks = myTasks.filter((t) => t.status === 'done');

  // Filtered view
  const displayedTasks = useMemo(() => {
    return myTasks
      .filter((t) => {
        if (activeTab === 'today') return t.dueDate === todayStr && t.status !== 'done';
        if (activeTab === 'overdue')
          return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done';
        if (activeTab === 'upcoming')
          return t.dueDate && new Date(t.dueDate) > now && t.status !== 'done';
        if (activeTab === 'completed') return t.status === 'done';
        return true;
      })
      .filter((t) => {
        const matchProject = projectFilter === 'all' || t.projectId === projectFilter;
        const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
        const matchSearch =
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.key.toLowerCase().includes(search.toLowerCase());
        return matchProject && matchPriority && matchSearch;
      });
  }, [myTasks, activeTab, projectFilter, priorityFilter, search, todayStr, now]);

  const toggleTaskDone = (t: Task) => {
    updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' });
  };

  const BOARD_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'var(--muted)' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { id: 'review', label: 'In Review', color: 'var(--waiting)' },
    { id: 'done', label: 'Done', color: 'var(--flash)' },
  ];

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Top Banner with Current Demo User identification */}
      <div className="bg-paper-elevated border-b border-line px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar user={currentUser} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-ink">My Tasks Workspace</h1>
                <span className="text-[10px] bg-flash/15 text-flash-deep px-2 py-0.5 rounded-full font-mono font-bold">
                  Demo User: {currentUser.name}
                </span>
              </div>
              <p className="text-xs text-muted">
                {currentUser.role} • {myTasks.length} total tasks assigned
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-line bg-paper p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                  viewMode === 'list' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                  viewMode === 'board' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'all'
                ? 'border-flash bg-flash/10 shadow-xs'
                : 'border-line bg-paper-elevated hover:border-flash/30'
            }`}
          >
            <div className="text-2xl font-bold font-mono text-ink">{myTasks.length}</div>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-1">
              <CheckSquare className="w-3.5 h-3.5 text-flash-deep" /> All Assigned Tasks
            </div>
          </button>

          <button
            onClick={() => setActiveTab('today')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'today'
                ? 'border-flash bg-flash/10 shadow-xs'
                : 'border-line bg-paper-elevated hover:border-flash/30'
            }`}
          >
            <div className="text-2xl font-bold font-mono text-sky-600">{dueTodayTasks.length}</div>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> Due Today
            </div>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'overdue'
                ? 'border-danger bg-danger/10 shadow-xs'
                : 'border-line bg-paper-elevated hover:border-danger/30'
            }`}
          >
            <div className="text-2xl font-bold font-mono text-danger">{overdueTasks.length}</div>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-danger" /> Overdue
            </div>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'completed'
                ? 'border-flash bg-flash/10 shadow-xs'
                : 'border-line bg-paper-elevated hover:border-flash/30'
            }`}
          >
            <div className="text-2xl font-bold font-mono text-flash-deep">
              {completedTasks.length}
            </div>
            <div className="text-xs text-muted flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-flash-deep" /> Completed
            </div>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-paper-elevated border border-line p-3.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search my tasks…"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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

          <span className="text-xs text-muted font-mono">
            Showing {displayedTasks.length} tasks
          </span>
        </div>

        {/* Tasks Views: List or Board */}
        {displayedTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={activeTab === 'overdue' ? 'No overdue tasks!' : 'No tasks match criteria'}
            description="You are caught up on your personal deliverables."
          />
        ) : viewMode === 'list' ? (
          <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-line">
              {displayedTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const isOverdue =
                  task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                const isDone = task.status === 'done';

                return (
                  <div
                    key={task.id}
                    onClick={() => openTaskDrawer(task.id)}
                    className="p-3.5 hover:bg-mist/30 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskDone(task);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isDone
                            ? 'bg-flash border-flash text-white'
                            : 'border-line hover:border-flash text-transparent'
                        }`}
                        title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <span className="text-xs font-mono text-muted group-hover:text-flash-deep shrink-0">
                        {task.key}
                      </span>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium truncate max-w-md ${
                            isDone ? 'line-through text-muted' : 'text-ink'
                          }`}
                        >
                          {task.title}
                        </p>
                        {project && (
                          <span className="text-[10px] text-muted block">
                            {project.name}
                            {project.extraBoards?.length ? ` · ${placementOf(task, projectBoards(project)).board.name}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <PriorityBadge priority={task.priority} />
                      <TaskStatusBadge status={task.status} />

                      {task.dueDate && (
                        <span
                          className={`text-[11px] font-mono flex items-center gap-1 ${
                            isOverdue ? 'text-danger font-semibold' : 'text-muted'
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="w-3 h-3" />}
                          {formatDate(task.dueDate)}
                        </span>
                      )}

                      {task.points && (
                        <span className="text-[10px] font-mono bg-mist px-1.5 py-0.5 rounded text-muted">
                          {task.points}pt
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Board View for My Tasks */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BOARD_COLUMNS.map((col) => {
              const colTasks = displayedTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="bg-paper-elevated border border-line rounded-2xl p-3 flex flex-col shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-bold text-ink">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-mist px-1.5 py-0.5 rounded-full text-muted">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 min-h-[300px]">
                    {colTasks.map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskDrawer(task.id)}
                          className="p-3 bg-paper hover:bg-mist/40 border border-line rounded-xl cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-muted group-hover:text-ink">
                              {task.key}
                            </span>
                            <PriorityBadge priority={task.priority} showLabel={false} />
                          </div>
                          <p className="text-xs font-medium text-ink line-clamp-2 mb-2 leading-snug">
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted pt-2 border-t border-line/60">
                            <span className="truncate max-w-[120px]">{project?.name}</span>
                            {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="h-24 flex items-center justify-center text-xs text-muted/50 border border-dashed border-line rounded-xl">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
