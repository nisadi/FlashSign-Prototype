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
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ZoomIn,
  ZoomOut,
  Layers,
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
  const [selectedTaskForDate, setSelectedTaskForDate] = useState<Task | null>(null);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [projectTasks, statusFilter]);

  // Generate timeline date columns based on project dates or current month window
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const base = new Date();
    base.setDate(base.getDate() - 7); // Start 1 week ago

    const daysCount = zoom === 'days' ? 21 : zoom === 'weeks' ? 42 : 90;
    const step = zoom === 'days' ? 1 : zoom === 'weeks' ? 3 : 7;

    for (let i = 0; i < daysCount; i += step) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [zoom]);

  const minDate = timelineDates[0]?.getTime() || Date.now();
  const maxDate = timelineDates[timelineDates.length - 1]?.getTime() || Date.now() + 86400000;
  const totalDuration = Math.max(maxDate - minDate, 1);

  // Helper to calculate left % and width % for a task bar
  const getTaskPosition = (task: Task) => {
    const start = task.startDate
      ? new Date(task.startDate).getTime()
      : task.dueDate
      ? new Date(task.dueDate).getTime() - 86400000 * 5
      : Date.now();
    const end = task.dueDate ? new Date(task.dueDate).getTime() : start + 86400000 * 3;

    const clampedStart = Math.max(start, minDate);
    const clampedEnd = Math.min(end, maxDate);

    const left = Math.max(0, Math.min(100, ((clampedStart - minDate) / totalDuration) * 100));
    const width = Math.max(
      3,
      Math.min(100 - left, ((clampedEnd - clampedStart) / totalDuration) * 100)
    );

    return { left: `${left}%`, width: `${width}%` };
  };

  const todayLeft = Math.max(
    0,
    Math.min(100, ((Date.now() - minDate) / totalDuration) * 100)
  );

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="timeline" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Controls */}
        <div className="bg-paper-elevated border border-line p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-flash-deep" /> Gantt / Timeline
            </h2>
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
              <Flag className="w-3.5 h-3.5 text-flash-deep" /> Target Milestones:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {projectMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper border border-line text-xs shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-flash-deep" />
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="text-[10px] text-muted font-mono">{formatDate(m.dueDate)}</span>
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
              Task Name
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
              className="absolute top-0 bottom-0 z-0 w-0.5 bg-danger/70 pointer-events-none"
              style={{ left: `calc(25% + (75% * ${todayLeft / 100}))` }}
            >
              <span className="absolute -top-1 -left-4 text-[9px] font-bold text-danger bg-danger/10 px-1 rounded">
                TODAY
              </span>
            </div>

            {filteredTasks.map((task) => {
              const pos = getTaskPosition(task);
              const assignee = users.find((u) => u.id === task.assigneeId);
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className="grid grid-cols-12 py-3 px-4 items-center hover:bg-mist/30 transition-colors group cursor-pointer"
                  onClick={() => openTaskDrawer(task.id)}
                >
                  {/* Left task info */}
                  <div className="col-span-4 sm:col-span-3 pr-3 flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-muted group-hover:text-flash-deep shrink-0">
                      {task.key}
                    </span>
                    <span
                      className={`text-xs truncate font-medium ${
                        isDone ? 'line-through text-muted' : 'text-ink'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {/* Right bar track */}
                  <div className="col-span-8 sm:col-span-9 relative h-7 bg-paper/50 rounded-lg flex items-center px-1">
                    <div
                      className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] text-white font-medium shadow-2xs transition-all ${
                        isDone
                          ? 'bg-flash-deep opacity-80'
                          : task.status === 'in_progress'
                          ? 'bg-sky-600'
                          : 'bg-ink'
                      }`}
                      style={{ left: pos.left, width: pos.width }}
                      title={`${task.title} (${task.startDate || 'Start'} to ${task.dueDate || 'Due'})`}
                    >
                      <span className="truncate pr-1">{task.title}</span>
                      {assignee && (
                        <div className="shrink-0 scale-75 origin-right">
                          <Avatar user={assignee} size="xs" />
                        </div>
                      )}
                    </div>
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
