'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { PriorityBadge, TaskStatusBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  Zap,
  ArrowLeft,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { Task, TaskStatus } from '@/types';

export default function SprintPlanningPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>;
}) {
  const { projectId, sprintId } = use(params);
  const { projects, sprints, tasks, users, updateTask, updateSprint, openTaskDrawer } = useApp();

  const [searchBacklog, setSearchBacklog] = useState('');
  const [backlogFilter, setBacklogFilter] = useState('all');

  const project = projects.find((p) => p.id === projectId);
  const sprint = sprints.find((s) => s.id === sprintId && s.projectId === projectId);

  if (!project || !sprint) return notFound();

  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const backlogTasks = tasks
    .filter((t) => t.projectId === projectId && t.sprintId !== sprint.id)
    .filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchBacklog.toLowerCase()) ||
        t.key.toLowerCase().includes(searchBacklog.toLowerCase());
      const matchStatus = backlogFilter === 'all' || t.status === backlogFilter;
      return matchSearch && matchStatus;
    });

  const doneTasks = sprintTasks.filter((t) => t.status === 'done');
  const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.points || 0), 0);
  const donePoints = doneTasks.reduce((acc, t) => acc + (t.points || 0), 0);
  const progressPct = sprintTasks.length
    ? Math.round((doneTasks.length / sprintTasks.length) * 100)
    : 0;

  const handleAddToSprint = (taskId: string) => {
    updateTask(taskId, { sprintId: sprint.id });
  };

  const handleRemoveFromSprint = (taskId: string) => {
    updateTask(taskId, { sprintId: undefined });
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="sprints" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Navigation & Sprint Info */}
        <div className="bg-paper-elevated border border-line p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Link
                href={`/projects/${projectId}/sprints`}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Sprints
              </Link>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-flash-deep" />
                <h1 className="text-xl font-bold text-ink">{sprint.name}</h1>
                <span className="text-[10px] font-mono uppercase bg-flash/10 text-flash-deep font-bold px-2 py-0.5 rounded-full">
                  {sprint.status}
                </span>
              </div>
              {sprint.goal && (
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-flash-deep" /> Goal: {sprint.goal}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {sprint.status === 'planning' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateSprint(sprint.id, { status: 'active' })}
                >
                  Start Sprint
                </Button>
              )}
              {sprint.status === 'active' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateSprint(sprint.id, { status: 'completed' })}
                >
                  Complete Sprint
                </Button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-line text-xs">
            <div>
              <span className="text-muted block text-[11px]">Sprint Timeline</span>
              <span className="font-mono font-medium text-ink">
                {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">Tasks Planned</span>
              <span className="font-mono font-medium text-ink">
                {doneTasks.length} / {sprintTasks.length} Done
              </span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">Story Points Burned</span>
              <span className="font-mono font-medium text-ink">
                {donePoints} of {totalPoints} pts
              </span>
            </div>
            <div>
              <span className="text-muted block text-[11px]">Completion</span>
              <div className="flex items-center gap-2 mt-1">
                <ProgressBar value={progressPct} color="var(--flash)" className="h-2 flex-1" />
                <span className="font-mono font-bold text-ink">{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Planning Workspace: Sprint Tasks vs Backlog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sprint Scope Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <Zap className="w-4 h-4 text-flash-deep" /> Committed Sprint Tasks ({sprintTasks.length})
              </h2>
              <span className="text-xs font-mono text-muted bg-paper px-2 py-0.5 rounded border border-line">
                {totalPoints} pts total
              </span>
            </div>

            {sprintTasks.length === 0 ? (
              <Card className="p-8 text-center text-xs text-muted border-dashed">
                <p className="font-semibold text-ink mb-1">Sprint is empty</p>
                <p>Move tasks from the backlog on the right into this sprint.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {sprintTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskDrawer(task.id)}
                      className="p-3 bg-paper-elevated border border-line rounded-xl hover:border-flash/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-muted group-hover:text-ink">
                          {task.key}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate max-w-xs sm:max-w-md">
                            {task.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                        {task.points && (
                          <span className="text-[10px] font-mono font-bold bg-mist px-1.5 py-0.5 rounded text-muted">
                            {task.points}pt
                          </span>
                        )}
                        {assignee && <Avatar user={assignee} size="xs" />}
                        <button
                          type="button"
                          onClick={() => handleRemoveFromSprint(task.id)}
                          className="p-1 text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                          title="Remove from sprint"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Backlog Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Project Backlog ({backlogTasks.length})</h2>
              <select
                value={backlogFilter}
                onChange={(e) => setBacklogFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-paper border border-line rounded-lg text-ink outline-none"
              >
                <option value="all">All Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            {/* Backlog Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={searchBacklog}
                onChange={(e) => setSearchBacklog(e.target.value)}
                placeholder="Search backlog tasks…"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper-elevated border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            {backlogTasks.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">No matching backlog tasks.</p>
            ) : (
              <div className="space-y-2">
                {backlogTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskDrawer(task.id)}
                      className="p-3 bg-paper border border-line rounded-xl hover:bg-mist/30 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-muted group-hover:text-ink">
                          {task.key}
                        </span>
                        <p className="text-xs font-medium text-ink truncate max-w-xs sm:max-w-md">
                          {task.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge priority={task.priority} />
                        {task.points && (
                          <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded">
                            {task.points}pt
                          </span>
                        )}
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Plus}
                          onClick={() => handleAddToSprint(task.id)}
                        >
                          Add to Sprint
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
