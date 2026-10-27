'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar } from '@/components/shared/ui';
import { PriorityBadge, TaskStatusBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  CornerDownRight,
  Filter,
} from 'lucide-react';
import type { Task } from '@/types';

export default function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, milestones, users, openTaskDrawer, updateTask } = useApp();

  const [zoom, setZoom] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [statusFilter, setStatusFilter] = useState('all');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId);

  const originalStart = project.originalStartDate || project.startDate;
  const originalEnd = project.originalEndDate || project.endDate || project.dueDate || '';
  const currentStart = project.currentStartDate || project.startDate;
  const currentEnd = project.currentEndDate || project.endDate || project.dueDate || '';
  const originalDays = project.originalDuration || 90;
  const currentDays = project.currentDuration || 90;
  const diffDays = project.timelineDifference ?? (currentDays - originalDays);
  const timelineStatus = project.timelineStatus || (diffDays > 0 ? 'extended' : diffDays < 0 ? 'shortened' : 'on_schedule');

  // Filter main tasks
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [projectTasks, statusFilter]);

  // Main tasks and their subtasks
  const mainTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.parentId);
  }, [filteredTasks]);

  // Generate timeline date columns based on project dates window
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const base = new Date(originalStart || Date.now() - 86400000 * 7);
    base.setDate(base.getDate() - 3);

    const daysCount = zoom === 'days' ? 24 : zoom === 'weeks' ? 60 : 120;
    const step = zoom === 'days' ? 1 : zoom === 'weeks' ? 4 : 8;

    for (let i = 0; i < daysCount; i += step) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [zoom, originalStart]);

  const minDate = timelineDates[0]?.getTime() || Date.now();
  const maxDate = timelineDates[timelineDates.length - 1]?.getTime() || Date.now() + 86400000 * 90;
  const totalDuration = Math.max(maxDate - minDate, 1);

  // Helper to calculate left % and width % for a task bar
  const getTaskPosition = (task: Task) => {
    const start = task.startDate
      ? new Date(task.startDate).getTime()
      : task.dueDate
      ? new Date(task.dueDate).getTime() - 86400000 * (task.estimatedDuration || 5)
      : Date.now();
    const end = task.dueDate
      ? new Date(task.dueDate).getTime()
      : start + 86400000 * (task.estimatedDuration || 3);

    const clampedStart = Math.max(start, minDate);
    const clampedEnd = Math.min(end, maxDate);

    const left = Math.max(0, Math.min(100, ((clampedStart - minDate) / totalDuration) * 100));
    const width = Math.max(
      2,
      Math.min(100 - left, ((clampedEnd - clampedStart) / totalDuration) * 100)
    );

    return { left: `${left}%`, width: `${width}%` };
  };

  // Positions for Baseline & Revised markers on Gantt grid
  const origEndTs = new Date(originalEnd).getTime();
  const currEndTs = new Date(currentEnd).getTime();
  const origMarkerPct = Math.max(0, Math.min(100, ((origEndTs - minDate) / totalDuration) * 100));
  const currMarkerPct = Math.max(0, Math.min(100, ((currEndTs - minDate) / totalDuration) * 100));
  const todayLeft = Math.max(0, Math.min(100, ((Date.now() - minDate) / totalDuration) * 100));

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="timeline" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Baseline vs Current Timeline Banner */}
        <div className="p-4 bg-paper-elevated border border-line rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-flash-deep" /> Dynamic Project Timeline & Schedule Baseline
              </h2>
              <p className="text-xs text-muted">
                Original baseline is preserved while task and subtask duration changes dynamically update the planned delivery forecast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {timelineStatus === 'extended' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Extended by +{diffDays} calendar days
                </span>
              )}
              {timelineStatus === 'shortened' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Shortened by {Math.abs(diffDays)} calendar days
                </span>
              )}
              {timelineStatus === 'on_schedule' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mist/60 text-ink-soft border border-line">
                  <CheckCircle2 className="w-3.5 h-3.5 text-flash-deep" />
                  On Original Schedule
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line text-xs font-mono">
            <div>
              <span className="text-muted block text-[10px] font-sans">Original Baseline End</span>
              <span className="font-bold text-ink">{formatDate(originalEnd)}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] font-sans">Revised Planned End</span>
              <span className="font-bold text-ink">{formatDate(currentEnd)}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] font-sans">Baseline Duration</span>
              <span className="text-ink">{originalDays} calendar days</span>
            </div>
            <div>
              <span className="text-muted block text-[10px] font-sans">Revised Duration</span>
              <span className="text-ink">{currentDays} calendar days</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-paper-elevated border border-line p-3.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Tasks ({projectTasks.length})</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Scale:</span>
            <div className="inline-flex rounded-xl border border-line p-0.5 bg-paper">
              {(['days', 'weeks', 'months'] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition-all ${
                    zoom === z
                      ? 'bg-ink text-flash font-semibold shadow-2xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones Markers Bar */}
        {projectMilestones.length > 0 && (
          <div className="bg-paper-elevated border border-line p-3 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-ink">
              <Flag className="w-3.5 h-3.5 text-flash-deep" /> Milestones & Epics:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {projectMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper border border-line text-xs shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-flash-deep" />
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="text-[10px] text-muted font-mono">{formatDate(m.endDate || m.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Grid Table */}
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-xs overflow-hidden">
          {/* Header row with dates */}
          <div className="grid grid-cols-12 border-b border-line bg-paper text-[11px] font-mono text-muted py-2.5 px-4 sticky top-0 z-10">
            <div className="col-span-4 sm:col-span-3 font-sans font-semibold text-ink text-xs uppercase tracking-wide">
              Hierarchy / Task
            </div>
            <div className="col-span-8 sm:col-span-9 relative flex justify-between pr-2">
              {timelineDates.map((d, i) => (
                <span key={i} className="truncate">
                  {formatDate(d.toISOString())}
                </span>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-line relative">
            {/* Today indicator vertical line */}
            <div
              className="absolute top-0 bottom-0 z-0 w-0.5 bg-danger/50 pointer-events-none"
              style={{ left: `calc(25% + (75% * ${todayLeft / 100}))` }}
            >
              <span className="absolute -top-1 -left-4 text-[9px] font-bold text-danger bg-danger/10 px-1 rounded">
                TODAY
              </span>
            </div>

            {/* Baseline Marker Vertical Line */}
            <div
              className="absolute top-0 bottom-0 z-0 w-0.5 border-l-2 border-dashed border-ink pointer-events-none"
              style={{ left: `calc(25% + (75% * ${origMarkerPct / 100}))` }}
            >
              <span className="absolute top-1 -left-8 text-[9px] font-mono font-bold text-white bg-ink px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                Baseline: {formatDate(originalEnd)}
              </span>
            </div>

            {/* Revised Marker Vertical Line (when extended) */}
            {timelineStatus === 'extended' && (
              <div
                className="absolute top-0 bottom-0 z-0 w-0.5 border-l-2 border-amber-500 pointer-events-none"
                style={{ left: `calc(25% + (75% * ${currMarkerPct / 100}))` }}
              >
                <span className="absolute top-6 -left-8 text-[9px] font-mono font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                  Revised: {formatDate(currentEnd)}
                </span>
              </div>
            )}

            {/* Main Tasks & Nested Subtasks */}
            {mainTasks.map((task) => {
              const pos = getTaskPosition(task);
              const assignee = users.find((u) => u.id === task.assigneeId);
              const isDone = task.status === 'done';
              const subtasks = projectTasks.filter((st) => st.parentId === task.id);

              return (
                <div key={task.id} className="divide-y divide-line/40">
                  {/* Main Task Bar */}
                  <div
                    className="grid grid-cols-12 py-3 px-4 items-center hover:bg-mist/30 transition-colors group cursor-pointer"
                    onClick={() => openTaskDrawer(task.id)}
                  >
                    {/* Left main task info */}
                    <div className="col-span-4 sm:col-span-3 pr-3 flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-muted group-hover:text-flash-deep shrink-0">
                        {task.key}
                      </span>
                      <span
                        className={`text-xs truncate font-bold ${
                          isDone ? 'line-through text-muted' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Right bar track */}
                    <div className="col-span-8 sm:col-span-9 relative h-7 bg-paper/40 rounded-lg flex items-center px-1">
                      <div
                        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] text-white font-medium shadow-2xs transition-all ${
                          isDone
                            ? 'bg-flash-deep opacity-80'
                            : task.status === 'in_progress'
                            ? 'bg-sky-600'
                            : 'bg-ink'
                        }`}
                        style={{ left: pos.left, width: pos.width }}
                        title={`${task.title} (${task.estimatedDuration || 3} days)`}
                      >
                        <span className="truncate pr-1 font-semibold">{task.title}</span>
                        {assignee && (
                          <div className="shrink-0 scale-75 origin-right">
                            <Avatar user={assignee} size="xs" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subtask Bars Nested Under Main Task */}
                  {subtasks.map((sub) => {
                    const subPos = getTaskPosition(sub);
                    const subAssignee = users.find((u) => u.id === sub.assigneeId);
                    const subDone = sub.status === 'done';

                    return (
                      <div
                        key={sub.id}
                        className="grid grid-cols-12 py-2 px-4 items-center bg-paper/20 hover:bg-mist/40 transition-colors cursor-pointer"
                        onClick={() => openTaskDrawer(sub.id)}
                      >
                        {/* Subtask left title with connector */}
                        <div className="col-span-4 sm:col-span-3 pl-4 pr-3 flex items-center gap-1.5 min-w-0">
                          <CornerDownRight className="w-3 h-3 text-muted shrink-0" />
                          <span className="text-[9px] font-mono text-muted shrink-0">
                            {sub.key}
                          </span>
                          <span
                            className={`text-[11px] truncate ${
                              subDone ? 'line-through text-muted' : 'text-ink-soft'
                            }`}
                          >
                            {sub.title}
                          </span>
                        </div>

                        {/* Subtask bar */}
                        <div className="col-span-8 sm:col-span-9 relative h-5 flex items-center px-1">
                          <div
                            className={`absolute top-0.5 bottom-0.5 rounded px-1.5 flex items-center justify-between text-[9px] text-white font-medium shadow-2xs transition-all ${
                              subDone
                                ? 'bg-emerald-600/70'
                                : sub.status === 'in_progress'
                                ? 'bg-sky-500'
                                : 'bg-ink-soft/80'
                            }`}
                            style={{ left: subPos.left, width: subPos.width }}
                            title={`${sub.title} (${sub.estimatedDuration || 1}d)`}
                          >
                            <span className="truncate pr-1">{sub.title} ({sub.estimatedDuration || 1}d)</span>
                            {subAssignee && (
                              <div className="shrink-0 scale-65 origin-right">
                                <Avatar user={subAssignee} size="xs" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
