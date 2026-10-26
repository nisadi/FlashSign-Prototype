'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp, useCurrentUser } from '@/context/app-context';
import { formatDate, formatRelative } from '@/lib/utils';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { QuickCreateDialog } from '@/components/shared/quick-create-dialog';
import { MyWorkCard } from '@/components/agents/my-work-card';
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle, Plus, ArrowRight,
  TrendingUp, Users, Calendar, Sparkles, Activity, CheckCircle2,
} from 'lucide-react';

export default function ProjectManagementHomePage() {
  const { projects, tasks, auditLogs, openTaskDrawer } = useApp();
  const currentUser = useCurrentUser();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id);

  // Today formatted
  const todayStr = new Date('2026-10-20T09:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto animate-fade-up">
      {/* Top Banner & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-flash-deep border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Welcome back, {currentUser?.name || 'Project Lead'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {todayStr} • Here is your portfolio status and upcoming commitments.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/projects"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-paper-elevated border border-line text-ink hover:bg-mist/50 transition-colors shadow-xs"
          >
            All Projects
          </Link>

          <button
            onClick={() => setQuickCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Item</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Link href="/projects" className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs hover:border-muted transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-flash-deep flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-ink mt-2">{totalProjects}</p>
          <span className="text-[11px] text-muted flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-flash-deep" /> Across all spaces
          </span>
        </Link>

        {/* Active Projects */}
        <Link href="/projects" className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs hover:border-muted transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Active Sprints</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-ink mt-2">{activeProjects.length}</p>
          <span className="text-[11px] text-teal-600 font-medium flex items-center gap-1 mt-1">
            In progress delivery
          </span>
        </Link>

        {/* Completed Projects */}
        <Link href="/projects" className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs hover:border-muted transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-ink mt-2">{completedProjects.length}</p>
          <span className="text-[11px] text-muted flex items-center gap-1 mt-1">
            Delivered successfully
          </span>
        </Link>

        {/* Overdue Tasks */}
        <Link href="/projects/my-tasks" className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs hover:border-muted transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Attention Needed</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-danger flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-danger mt-2">{overdueTasks.length}</p>
          <span className="text-[11px] text-danger font-medium flex items-center gap-1 mt-1">
            Overdue tasks
          </span>
        </Link>
      </div>

      {/* Running timer, hours and agent activity */}
      <MyWorkCard />

      {/* Main Grid: Projects & My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Projects (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-5 rounded-2xl border border-line bg-paper-elevated shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Active Project Portfolio</h3>
                <p className="text-xs text-muted">Delivery velocity and milestone status</p>
              </div>
              <Link
                href="/projects"
                className="text-xs text-flash-deep font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All ({projects.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {projects.slice(0, 4).map(proj => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="p-4 rounded-xl border border-line bg-paper hover:bg-mist/30 transition-all space-y-3 block group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: proj.accentColor || '#00c2a8' }}
                      >
                        {proj.key}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-ink group-hover:text-flash-deep transition-colors truncate">
                          {proj.name}
                        </h4>
                        <p className="text-[10px] text-muted">{proj.group || 'Project'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-mist text-ink-soft">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted font-medium">
                      <span>Progress</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full rounded-full bg-flash-deep transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines Table */}
          <div className="p-5 rounded-2xl border border-line bg-paper-elevated shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Upcoming Project Deadlines</h3>
            <div className="divide-y divide-line/60">
              {tasks.filter(t => t.dueDate && t.status !== 'done').slice(0, 5).map(task => {
                const proj = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    onClick={() => openTaskDrawer(task.id)}
                    className="py-2.5 flex items-center justify-between hover:bg-mist/30 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <TaskStatusBadge status={task.status} />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-ink truncate">{task.title}</p>
                        <p className="text-[10px] text-muted font-mono">{proj?.name} • {task.key}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs font-medium text-ink-soft flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted" />
                        {task.dueDate ? formatDate(task.dueDate) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: My Tasks & Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* My Tasks Section */}
          <div className="p-5 rounded-2xl border border-line bg-paper-elevated shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Assigned to Me</h3>
              <Link href="/projects/my-tasks" className="text-xs text-flash-deep font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">No active tasks assigned.</p>
              ) : (
                myTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    onClick={() => openTaskDrawer(task.id)}
                    className="p-3 rounded-xl border border-line bg-paper hover:bg-mist/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted">{task.key}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p className="text-xs font-semibold text-ink leading-snug line-clamp-2">{task.title}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted">
                      <TaskStatusBadge status={task.status} />
                      <span>{task.dueDate ? formatDate(task.dueDate) : 'No deadline'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="p-5 rounded-2xl border border-line bg-paper-elevated shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-flash-deep" />
                <span>Recent Team Activity</span>
              </h3>
              <Link href="/activity" className="text-xs text-muted hover:text-ink">
                Logs
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-mist text-ink-soft text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {log.actorName ? log.actorName.slice(0, 2).toUpperCase() : 'FS'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink leading-snug">
                      <strong>{log.actorName}</strong> {log.action.replace(/\./g, ' ')}
                    </p>
                    <p className="text-[10px] text-muted truncate">{log.detail}</p>
                    <span className="text-[9px] text-muted/70">{formatRelative(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Quick Create Modal */}
      <QuickCreateDialog
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
      />
    </div>
  );
}
