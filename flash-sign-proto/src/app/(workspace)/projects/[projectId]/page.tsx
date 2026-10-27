'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { ProjectTimelineSummary } from '@/components/projects/project-timeline-summary';
import { Card, StatCard, Button, ProgressBar } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { AvatarGroup, Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  Archive,
  Trash2,
  Copy,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const {
    projects,
    tasks,
    sprints,
    milestones,
    users,
    activities,
    openTaskDrawer,
    archiveProject,
    deleteProject,
    addProject,
    addRecentProject,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (projectId) {
      addRecentProject(projectId);
    }
  }, [projectId, addRecentProject]);

  const project = projects.find((p) => p.id === projectId) || (projectId === 'p-mvhmnblw' ? projects.find(p => p.id === 'p1') : undefined);
  if (!project) return notFound();

  const effectiveId = (projectId === 'p-mvhmnblw' && !tasks.some(t => t.projectId === 'p-mvhmnblw')) ? 'p1' : projectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId || t.projectId === effectiveId);
  const projectSprints = sprints.filter((s) => s.projectId === projectId || s.projectId === effectiveId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId || m.projectId === effectiveId);
  const projectActivities = (activities || []).filter(
    (a) => a.resourceId === projectId || a.resourceId === effectiveId || a.resource.includes(project.key)
  ).slice(0, 6);
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const owner = users.find((u) => u.id === project.ownerId);

  const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress').length;
  const blockedTasks = projectTasks.filter((t) => t.status === 'blocked').length;
  const overdueTasks = projectTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const urgentTasks = projectTasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
    })
    .slice(0, 5);

  const handleDuplicate = () => {
    addProject({
      name: `${project.name} (Copy)`,
      key: `${project.key}C`,
      description: project.description,
      status: 'active',
      health: 'on_track',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: project.endDate || project.dueDate,
      dueDate: project.dueDate || project.endDate,
      ownerId: project.ownerId,
      memberIds: [...project.memberIds],
      tags: [...project.tags],
      category: project.category,
      group: project.group,
    });
  };

  const handleDelete = () => {
    deleteProject(project.id);
    router.push('/projects');
  };

  const handleArchive = () => {
    archiveProject(project.id);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="overview" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={projectTasks.length}
            icon={CheckSquare}
            iconColor="var(--flash)"
          />
          <StatCard
            label="In Progress"
            value={inProgressTasks}
            icon={TrendingUp}
            iconColor="#42a5f5"
          />
          <StatCard
            label="Completed"
            value={doneTasks}
            delta={`${Math.round((doneTasks / Math.max(projectTasks.length, 1)) * 100)}%`}
            deltaPositive
            icon={CheckSquare}
            iconColor="#00c2a8"
          />
          <StatCard
            label="Overdue / Blocked"
            value={overdueTasks + blockedTasks}
            icon={AlertTriangle}
            iconColor="var(--danger)"
          />
        </div>

        {/* Project Timeline Summary (Original vs Current Planned Timeline) */}
        <ProjectTimelineSummary
          project={project}
          milestones={projectMilestones}
          tasks={projectTasks}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Progress, Goals, Urgent Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress & Milestones Summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-ink">Overall Progress</h2>
                  <p className="text-xs text-muted">
                    {doneTasks} of {projectTasks.length} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-ink">
                    {project.progress}%
                  </span>
                </div>
              </div>

              <ProgressBar value={project.progress} color="var(--flash)" className="h-3 mb-5" />

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-line text-xs">
                <div>
                  <span className="text-muted block">Start Date</span>
                  <span className="font-medium text-ink font-mono">
                    {formatDate(project.startDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Target Delivery</span>
                  <span className="font-medium text-ink font-mono">
                    {formatDate(project.dueDate || project.endDate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Owner</span>
                  <span className="font-medium text-ink truncate block">{owner?.name || 'Unassigned'}</span>
                </div>
              </div>
            </Card>

            {/* Project Goals */}
            {project.goals && project.goals.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-flash-deep" />
                  <h2 className="text-sm font-semibold text-ink">Key Objectives & Goals</h2>
                </div>
                <ul className="space-y-2">
                  {project.goals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-ink/90">
                      <div className="w-4 h-4 rounded-full bg-flash/10 text-flash-deep flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed">{goal}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* High Priority / Urgent Tasks */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-danger" />
                  <h2 className="text-sm font-semibold text-ink">Priority Action Items</h2>
                </div>
                <Link
                  href={`/projects/${projectId}/tasks`}
                  className="text-xs text-flash-deep hover:underline flex items-center gap-1"
                >
                  View all tasks <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {urgentTasks.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">No open tasks right now.</p>
              ) : (
                <div className="space-y-2">
                  {urgentTasks.map((task) => {
                    const assignee = users.find((u) => u.id === task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => openTaskDrawer(task.id)}
                        className="flex items-center justify-between p-3 rounded-xl bg-paper hover:bg-mist/40 border border-line cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-mono text-muted group-hover:text-ink">
                            {task.key}
                          </span>
                          <span className="text-xs font-medium text-ink truncate max-w-[260px] sm:max-w-md">
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={task.priority} />
                          <TaskStatusBadge status={task.status} />
                          {assignee && <Avatar user={assignee} size="xs" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Milestones Preview */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-flash-deep" />
                  <h2 className="text-sm font-semibold text-ink">Project Milestones</h2>
                </div>
                <Link
                  href={`/projects/${projectId}/milestones`}
                  className="text-xs text-flash-deep hover:underline flex items-center gap-1"
                >
                  Manage milestones <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {projectMilestones.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">No milestones created yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projectMilestones.map((m) => {
                    const linked = tasks.filter((t) => m.taskIds?.includes(t.id));
                    const completedLinked = linked.filter((t) => t.status === 'done').length;
                    const pct = linked.length
                      ? Math.round((completedLinked / linked.length) * 100)
                      : m.status === 'achieved'
                      ? 100
                      : 0;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-line bg-paper flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-ink truncate">{m.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                m.status === 'achieved'
                                  ? 'bg-flash/15 text-flash-deep'
                                  : m.status === 'missed'
                                  ? 'bg-danger/15 text-danger'
                                  : 'bg-mist text-muted'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted line-clamp-2 mb-2">{m.description}</p>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-muted mb-1">
                            <span>Due {formatDate(m.dueDate)}</span>
                            <span>{pct}%</span>
                          </div>
                          <ProgressBar value={pct} color="var(--flash)" className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Col: Team, Details, Quick Actions, Recent Activity */}
          <div className="space-y-6">
            {/* Team Members Card */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted" />
                  <h2 className="text-sm font-semibold text-ink">Team Members</h2>
                </div>
                <Link
                  href={`/projects/${projectId}/team`}
                  className="text-xs text-flash-deep hover:underline"
                >
                  Manage ({members.length})
                </Link>
              </div>

              <div className="space-y-2.5">
                {members.slice(0, 5).map((member) => {
                  const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
                  const isOwner = member.id === project.ownerId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar user={member} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{member.name}</p>
                          <p className="text-[10px] text-muted truncate">
                            {isOwner ? 'Project Owner' : member.role}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {memberTasks.length} tasks
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions & Administrative Tools */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Project Actions</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={handleDuplicate}
                  className="justify-start text-muted hover:text-ink"
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Archive}
                  onClick={handleArchive}
                  className="justify-start text-muted hover:text-ink"
                >
                  {project.isArchived ? 'Unarchive' : 'Archive'}
                </Button>
                <Link href={`/projects/${projectId}/settings`} className="col-span-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-muted hover:text-ink">
                    Project Settings
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setConfirmDelete(true)}
                  className="col-span-2 justify-start text-danger hover:bg-danger/10 border-danger/20"
                >
                  Delete Project
                </Button>
              </div>

              {confirmDelete && (
                <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs space-y-2 animate-fade-in">
                  <p className="font-semibold text-danger">Are you sure you want to delete this project?</p>
                  <p className="text-muted text-[11px]">This prototype action will remove it from local state.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                      Yes, Delete
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink">Recent Activity</h2>
                <Link
                  href={`/projects/${projectId}/activity`}
                  className="text-xs text-flash-deep hover:underline"
                >
                  All activity
                </Link>
              </div>

              {projectActivities.length === 0 ? (
                <p className="text-xs text-muted py-3 text-center">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {projectActivities.map((act) => {
                    const actor = users.find((u) => u.id === act.actorId || u.id === (act as any).userId);
                    return (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs">
                        <Avatar user={actor} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-ink leading-tight">
                            <span className="font-medium">{actor?.name || act.actorName || 'User'}</span>{' '}
                            {act.action} <span className="font-medium text-flash-deep">{act.resource || (act as any).entityTitle}</span>
                          </p>
                          <span className="text-[10px] text-muted block mt-0.5">
                            {formatDate(act.timestamp || (act as any).createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
