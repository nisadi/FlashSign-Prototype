'use client';

import { useApp, useCurrentUser, useRoleConfig } from '@/context/app-context';
import { StatCard, ProgressBar, PageHeader, Card, EmptyState } from '@/components/shared/ui';
import { TaskStatusBadge, HealthBadge, DocStatusBadge, ProjectStatusBadge } from '@/components/shared/badges';
import { AvatarGroup } from '@/components/shared/avatar';
import { formatDate, formatRelative } from '@/lib/utils';
import Link from 'next/link';
import {
  FolderKanban, CheckSquare, AlertTriangle, FileText, Clock,
  CheckCircle2, TrendingUp, Users, Bot, ArrowRight, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

const SPRINT_VELOCITY = [
  { sprint: 'S8', completed: 28, planned: 32 },
  { sprint: 'S9', completed: 35, planned: 36 },
  { sprint: 'S10', completed: 30, planned: 38 },
  { sprint: 'S11', completed: 38, planned: 40 },
  { sprint: 'S12', completed: 22, planned: 40 },
];

const TASK_DIST = [
  { name: 'Done', value: 12, color: '#00c2a8' },
  { name: 'In Progress', value: 6, color: '#42a5f5' },
  { name: 'Review', value: 3, color: '#ffa726' },
  { name: 'Blocked', value: 2, color: '#c23b3b' },
  { name: 'To Do', value: 9, color: '#c5d4d0' },
];

export default function DashboardPage() {
  const { projects, tasks, documents, approvals, agentRuns, users, milestones } = useApp();
  const currentUser = useCurrentUser();
  const roleConfig = useRoleConfig();

  const activeProjects = projects.filter(p => p.status === 'active');
  const openTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  );
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const recentActivity = [
    ...tasks.slice(0, 3).map(t => ({ type: 'task', text: `Task ${t.key} updated`, time: t.updatedAt })),
    ...documents.slice(0, 2).map(d => ({ type: 'doc', text: `"${d.title}" ${d.status}`, time: d.updatedAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id && t.status !== 'done');

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-up">
      {/* Welcome */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-6 rounded-full bg-flash" />
          <h1 className="text-xl font-bold text-ink">
            Good morning, {currentUser?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <p className="text-sm text-muted ml-5">
          {roleConfig.label} — {roleConfig.description}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          icon={FolderKanban}
          iconColor="var(--flash)"
          delta={`${projects.filter(p => p.health === 'on_track').length} on track`}
          deltaPositive
        />
        <StatCard
          label="Open Tasks"
          value={openTasks.length}
          icon={CheckSquare}
          iconColor="#42a5f5"
          delta={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined}
          deltaPositive={overdueTasks.length === 0}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={FileText}
          iconColor="var(--waiting)"
        />
        <StatCard
          label="AI Runs Today"
          value={agentRuns.filter(r => r.status === 'running' || r.status === 'needs_review').length}
          icon={Bot}
          iconColor="#ab47bc"
          delta="2 need review"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Overview */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="text-sm font-semibold text-ink">Projects</h2>
              <Link href="/projects" className="text-xs text-flash hover:text-flash-deep flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-line">
              {activeProjects.map(project => {
                const projectUsers = users.filter(u => project.memberIds.includes(u.id));
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-mist/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-ink truncate">{project.name}</span>
                        <span className="text-[10px] text-muted font-mono shrink-0">{project.key}</span>
                      </div>
                      <ProgressBar value={project.progress} height={4} />
                    </div>
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      {project.timelineDifference !== undefined && project.timelineDifference > 0 ? (
                        <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">
                          +{project.timelineDifference}d extended
                        </span>
                      ) : project.timelineDifference !== undefined && project.timelineDifference < 0 ? (
                        <span className="text-[10px] font-bold text-flash-deep bg-flash/10 px-2 py-0.5 rounded">
                          {project.timelineDifference}d ahead
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted bg-mist/60 px-2 py-0.5 rounded">
                          On schedule
                        </span>
                      )}
                      <AvatarGroup users={projectUsers} max={3} size="xs" />
                      <HealthBadge health={project.health} />
                      <span className="text-xs text-muted font-medium">{project.progress}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Sprint Velocity Chart */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Sprint Velocity</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SPRINT_VELOCITY} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="sprint" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="planned" fill="var(--mist)" radius={[3, 3, 0, 0]} name="Planned" />
                <Bar dataKey="completed" fill="var(--flash)" radius={[3, 3, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Task Distribution */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink mb-4">Task Distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={TASK_DIST}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  stroke="none"
                >
                  {TASK_DIST.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {TASK_DIST.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Milestones */}
          <Card>
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-sm font-semibold text-ink">Upcoming Milestones</h2>
            </div>
            <div className="divide-y divide-line">
              {milestones.filter(m => m.status !== 'completed').slice(0, 4).map(m => (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-ink">{m.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      m.status === 'at_risk'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-mist text-muted'
                    }`}>
                      {m.status === 'at_risk' ? '⚠ At Risk' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">{formatDate(m.dueDate)}</p>
                  <ProgressBar value={m.progress ?? 0} height={3} className="mt-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <Card>
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">Approvals Needed</h2>
                <Link href="/approvals" className="text-xs text-flash">View all</Link>
              </div>
              <div className="divide-y divide-line">
                {pendingApprovals.slice(0, 3).map(apr => {
                  const doc = documents.find(d => d.id === apr.documentId);
                  return (
                    <Link
                      key={apr.id}
                      href="/approvals"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-mist/40 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-waiting/10 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-waiting" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{doc?.title ?? 'Document'}</p>
                        <p className="text-[10px] text-muted">Awaiting your approval</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-sm font-semibold text-ink">Recent Activity</h2>
            </div>
            <div className="px-4 py-3 space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    item.type === 'task' ? 'bg-flash' : 'bg-waiting'
                  }`} />
                  <div>
                    <p className="text-xs text-ink">{item.text}</p>
                    <p className="text-[10px] text-muted">{formatRelative(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
