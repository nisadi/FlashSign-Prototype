'use client';

import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { ProjectStatusBadge, HealthBadge } from '@/components/shared/badges';
import { Button } from '@/components/shared/ui';
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Calendar,
  Zap,
  Flag,
  Users,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Plus,
  ArrowLeft,
  Star,
} from 'lucide-react';
import type { Project } from '@/types';

interface ProjectHeaderNavProps {
  projectId: string;
  activeTab:
    | 'overview'
    | 'tasks'
    | 'board'
    | 'timeline'
    | 'sprints'
    | 'milestones'
    | 'team'
    | 'files'
    | 'activity'
    | 'reports'
    | 'settings';
}

export function ProjectHeaderNav({ projectId, activeTab }: ProjectHeaderNavProps) {
  const { projects, tasks, sprints, milestones, toggleFavoriteProject } = useApp();
  const project = projects.find((p) => p.id === projectId) || (projectId === 'p-mvhmnblw' ? projects.find(p => p.id === 'p1') : undefined) || projects[0];

  if (!project) return null;

  const effectiveId = (projectId === 'p-mvhmnblw' && !tasks.some(t => t.projectId === 'p-mvhmnblw')) ? 'p1' : projectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId || t.projectId === effectiveId);
  const projectSprints = sprints.filter((s) => s.projectId === projectId || s.projectId === effectiveId);
  const projectMilestones = milestones.filter((m) => m.projectId === projectId || m.projectId === effectiveId);

  const tabs = [
    { id: 'overview', label: 'Overview', href: `/projects/${projectId}`, icon: LayoutDashboard },
    {
      id: 'tasks',
      label: 'Tasks',
      href: `/projects/${projectId}/tasks`,
      icon: CheckSquare,
      count: projectTasks.length,
    },
    { id: 'board', label: 'Board', href: `/projects/${projectId}/board`, icon: Kanban },
    { id: 'timeline', label: 'Timeline', href: `/projects/${projectId}/timeline`, icon: Calendar },
    {
      id: 'sprints',
      label: 'Sprints',
      href: `/projects/${projectId}/sprints`,
      icon: Zap,
      count: projectSprints.length,
    },
    {
      id: 'milestones',
      label: 'Milestones',
      href: `/projects/${projectId}/milestones`,
      icon: Flag,
      count: projectMilestones.length,
    },
    {
      id: 'team',
      label: 'Team',
      href: `/projects/${projectId}/team`,
      icon: Users,
      count: project.memberIds.length,
    },
    { id: 'files', label: 'Files', href: `/projects/${projectId}/files`, icon: FileText },
    { id: 'activity', label: 'Activity', href: `/projects/${projectId}/activity`, icon: Activity },
    { id: 'reports', label: 'Reports', href: `/projects/${projectId}/reports`, icon: BarChart3 },
    { id: 'settings', label: 'Settings', href: `/projects/${projectId}/settings`, icon: Settings },
  ];

  return (
    <div className="border-b border-line bg-paper-elevated sticky top-0 z-10 shadow-2xs">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/projects"
              className="p-1.5 text-muted hover:text-ink hover:bg-mist/60 rounded-lg transition-colors shrink-0"
              title="All Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="w-9 h-9 rounded-xl bg-ink text-flash font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-flash/20">
              {project.key}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-ink truncate">{project.name}</h1>
                <button
                  type="button"
                  onClick={() => toggleFavoriteProject(project.id)}
                  className={`p-1 rounded-md transition-colors ${
                    project.isFavorite
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-muted/40 hover:text-amber-500'
                  }`}
                  title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <ProjectStatusBadge status={project.status} />
                <HealthBadge health={project.health} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link href={`/projects/${projectId}/tasks/new`}>
              <Button variant="primary" size="sm" icon={Plus}>
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab row */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-flash text-ink font-semibold bg-flash/5 rounded-t-lg'
                    : 'border-transparent text-muted hover:text-ink hover:border-line'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-flash-deep' : 'text-muted'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-flash/20 text-flash-deep font-semibold'
                        : 'bg-mist text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
