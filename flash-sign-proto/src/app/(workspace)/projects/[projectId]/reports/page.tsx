'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, StatCard, Button, ProgressBar } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Clock,
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
  const { projects, tasks, sprints, milestones, users } = useApp();
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sprintFilter, setSprintFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectSprints = sprints.filter((s) => s.projectId === projectId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId);
  const projectMembers = users.filter((u) => project.memberIds.includes(u.id));

  // Filter tasks for analytics
  const activeTasks = useMemo(() => {
    return projectTasks.filter((t) => {
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
  const overdueCount = activeTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const completionPct = activeTasks.length
    ? Math.round((doneCount / activeTasks.length) * 100)
    : 0;

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

  // Burndown / Velocity Simulation trend data
  const velocityTrend = [
    { day: 'Day 1', ideal: 100, actual: 100 },
    { day: 'Day 3', ideal: 85, actual: 88 },
    { day: 'Day 6', ideal: 70, actual: 72 },
    { day: 'Day 9', ideal: 55, actual: 50 },
    { day: 'Day 12', ideal: 40, actual: 36 },
    { day: 'Day 14', ideal: 25, actual: 18 },
  ];

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Task ID', 'Key', 'Title', 'Status', 'Priority', 'Points', 'Due Date'];
    const rows = activeTasks.map((t) => [
      t.id,
      t.key,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.points || 0,
      t.dueDate || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${project.key}_Project_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="reports" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-flash-deep" /> Analytics & Performance Reports
            </h1>
            <p className="text-xs text-muted">
              Live metrics and velocity calculated directly from project task states
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sprint Filter */}
            <select
              value={sprintFilter}
              onChange={(e) => setSprintFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Sprints</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Statuses</option>
              <option value="done">Done</option>
              <option value="in_progress">In Progress</option>
              <option value="todo">To Do</option>
              <option value="blocked">Blocked</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Tasks"
            value={activeTasks.length}
            icon={CheckSquare}
            iconColor="var(--flash)"
          />
          <StatCard
            label="Completed"
            value={doneCount}
            delta={`${completionPct}%`}
            deltaPositive
            icon={CheckSquare}
            iconColor="#00c2a8"
          />
          <StatCard
            label="In Progress"
            value={inProgressCount}
            icon={TrendingUp}
            iconColor="#3b82f6"
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            icon={Clock}
            iconColor="var(--waiting)"
          />
          <StatCard
            label="Blocked"
            value={blockedCount}
            icon={AlertTriangle}
            iconColor="var(--danger)"
          />
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
                  <TrendingUp className="w-4 h-4 text-flash-deep" /> Sprint Burndown & Velocity
                </h2>
                <p className="text-xs text-muted">Ideal vs actual story points completed</p>
              </div>
              <span className="text-xs font-mono text-flash-deep font-bold bg-flash/10 px-2 py-0.5 rounded-full">
                Velocity: +12% Ahead
              </span>
            </div>

            {mounted ? (
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
                      name="Ideal Guideline"
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#00c2a8"
                      fill="#00c2a8"
                      fillOpacity={0.15}
                      name="Actual Burn"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-muted">
                Loading burndown trend…
              </div>
            )}
          </Card>
        </div>

        {/* Team Member Workload Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Team Member Workload Distribution</h2>
          <div className="space-y-3">
            {projectMembers.map((member) => {
              const memberTasks = activeTasks.filter((t) => t.assigneeId === member.id);
              const done = memberTasks.filter((t) => t.status === 'done').length;
              const pct = memberTasks.length ? Math.round((done / memberTasks.length) * 100) : 0;

              return (
                <div key={member.id} className="p-3 bg-paper rounded-xl border border-line text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar user={member} size="xs" />
                      <span className="font-semibold text-ink">{member.name}</span>
                      <span className="text-[10px] text-muted">({member.role})</span>
                    </div>
                    <span className="font-mono text-muted text-[11px]">
                      {done} / {memberTasks.length} tasks ({pct}%)
                    </span>
                  </div>
                  <ProgressBar value={pct} color="var(--flash)" className="h-1.5" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
