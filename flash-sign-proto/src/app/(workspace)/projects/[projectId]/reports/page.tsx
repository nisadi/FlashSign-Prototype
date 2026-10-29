'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card } from '@/components/shared/ui';
import { TaskTimeReport } from '@/components/reports/task-time-report';
import { TimelineReport } from '@/components/reports/timeline-report';
import { ProjectOverview } from '@/components/reports/project-overview';
import { sprintBurndown } from '@/lib/project-health';
import { useNow } from '@/lib/use-now';
import { formatDate } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  PieChart as PieIcon,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function ProjectReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, tasks, sprints, milestones, taskStatusChanges } = useApp();
  const now = useNow();
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');
  // Overview (charts), Timeline (the plan against time) or Task time
  const [view, setView] = useState<'overview' | 'timeline' | 'task-time'>('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectSprints = sprints.filter((s) => s.projectId === projectId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId);

  // Filter tasks for analytics
  const activeTasks = useMemo(() => {
    return projectTasks.filter((t) => !t.parentId).filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSprint = sprintFilter === 'all' || t.sprintId === sprintFilter;
      return matchStatus && matchSprint;
    });
  }, [projectTasks, statusFilter, sprintFilter]);

  const doneCount = activeTasks.filter((t) => t.status === 'done').length;
  const inProgressCount = activeTasks.filter((t) => t.status === 'in_progress').length;
  const reviewCount = activeTasks.filter((t) => t.status === 'review').length;
  const todoCount = activeTasks.filter((t) => t.status === 'todo').length;
  const blockedCount = activeTasks.filter((t) => t.status === 'blocked').length;


  // Status Distribution Data
  const statusData = [
    { name: 'Done', count: doneCount, color: '#00c2a8' },
    { name: 'In Progress', count: inProgressCount, color: '#3b82f6' },
    { name: 'Review', count: reviewCount, color: '#c47a12' },
    { name: 'To Do', count: todoCount, color: '#94a3b8' },
    { name: 'Blocked', count: blockedCount, color: '#c23b3b' },
  ].filter((d) => d.count > 0);

  // Priority Distribution Data
  const priorityData = [
    {
      name: 'Critical',
      count: activeTasks.filter((t) => t.priority === 'critical').length,
      fill: '#c23b3b',
    },
    {
      name: 'High',
      count: activeTasks.filter((t) => t.priority === 'high').length,
      fill: '#f97316',
    },
    {
      name: 'Medium',
      count: activeTasks.filter((t) => t.priority === 'medium').length,
      fill: '#00c2a8',
    },
    {
      name: 'Low',
      count: activeTasks.filter((t) => t.priority === 'low').length,
      fill: '#94a3b8',
    },
  ];

  // Burndown from real data: the chosen sprint, else the active one, else the latest that started
  const burndownSprint =
    projectSprints.find((sp) => sp.id === sprintFilter) ??
    projectSprints.find((sp) => sp.status === 'active') ??
    [...projectSprints].sort((x, y) => y.startDate.localeCompare(x.startDate))[0];
  const velocityTrend = burndownSprint && now !== null ? sprintBurndown(burndownSprint, projectTasks, taskStatusChanges, now) : [];
  const lastActual = [...velocityTrend].reverse().find((d) => d.actual !== null);
  const burnGap = lastActual ? Math.round(((lastActual.actual ?? 0) - lastActual.ideal) * 10) / 10 : 0;


  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="reports" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-flash-deep" /> Analytics & Performance Reports
            </h1>
            <p className="text-xs text-muted">
              How the project is doing, worked out live from its tasks, timers and plan
            </p>
          </div>
        </div>

        {/* Report tabs */}
        <div className="flex gap-1 border-b border-line" role="tablist">
          {([
            ['overview', 'Overview'],
            ['timeline', 'Timeline'],
            ['task-time', 'Task time'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`px-3 py-2 -mb-px text-xs font-semibold border-b-2 transition-colors ${
                view === id ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'timeline' && <TimelineReport projectId={projectId} />}

        {view === 'overview' && (<>
        <ProjectOverview projectId={projectId} onOpenTimeline={() => setView('timeline')} />

        {/* Breakdown: the detail charts, with their filters */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Breakdown</h2>
            <p className="text-xs text-muted">Tasks by status and priority, and the sprint burndown. Subtasks count inside their tasks.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
              aria-label="Sprint"
            >
              <option value="all">All Sprints</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
              aria-label="Status"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Chart Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown (Pie) */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-flash-deep" /> Tasks by Status
              </h2>
              <p className="text-xs text-muted mb-4">Distribution of workflow statuses</p>
            </div>

            {mounted && statusData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a3539',
                        borderColor: '#2d4b50',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-muted">
                No status data available
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-line text-xs">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted">{s.name}:</span>
                  <span className="font-mono font-bold text-ink">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Priority Breakdown (Bar) */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-flash-deep" /> Tasks by Priority
              </h2>
              <p className="text-xs text-muted mb-4">Urgency load across active deliverables</p>
            </div>

            {mounted ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c5d4d0" />
                    <XAxis dataKey="name" stroke="#5a6f6c" fontSize={11} />
                    <YAxis stroke="#5a6f6c" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a3539',
                        borderColor: '#2d4b50',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-muted">
                Loading priority chart…
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-line text-xs text-muted">
              <span>High / Critical Load:</span>
              <span className="font-mono font-bold text-danger">
                {activeTasks.filter((t) => t.priority === 'critical' || t.priority === 'high').length}{' '}
                tasks
              </span>
            </div>
          </Card>

          {/* Burndown Velocity Trend */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-flash-deep" /> Sprint Burndown
                </h2>
                <p className="text-xs text-muted">
                  {burndownSprint
                    ? `${burndownSprint.name}: estimated days of work still open each day, against a straight line to zero`
                    : 'No sprints in this project yet'}
                </p>
              </div>
              {lastActual && (
                <span className="text-xs font-semibold text-ink bg-mist px-2 py-0.5 rounded-full">
                  {burnGap > 0 ? `${burnGap} days of work behind the line` : burnGap < 0 ? `${-burnGap} days of work ahead of the line` : 'On the line'}
                </span>
              )}
            </div>

            {mounted && velocityTrend.length > 0 ? (
              <div className="h-60 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c5d4d0" />
                    <XAxis dataKey="day" stroke="#5a6f6c" fontSize={11} />
                    <YAxis stroke="#5a6f6c" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a3539',
                        borderColor: '#2d4b50',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ideal"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      fill="transparent"
                      name="Straight line to zero"
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#00c2a8"
                      fill="#00c2a8"
                      fillOpacity={0.15}
                      name="Work still open (days)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-muted">
                {mounted ? 'Add a sprint with tasks to see its burndown.' : 'Loading burndown trend…'}
              </div>
            )}
          </Card>
        </div>

        </>)}

        {/* Task time: In Progress -> In Review */}
        {view === 'task-time' && (
          <div className="space-y-3">
            <p className="text-xs text-muted">How long each task took from In Progress to In Review.</p>
            <TaskTimeReport projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
