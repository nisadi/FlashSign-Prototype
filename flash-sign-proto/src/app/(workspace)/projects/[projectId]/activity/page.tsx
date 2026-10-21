'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, EmptyState, Button } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  Activity as ActivityIcon,
  Filter,
  CheckSquare,
  Zap,
  Flag,
  FileText,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, activities, users, openTaskDrawer } = useApp();

  const [typeFilter, setTypeFilter] = useState<string>('all');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectActivities = (activities || []).filter(
    (a) => a.resourceId === projectId || a.resource.toLowerCase().includes(project.key.toLowerCase()) || a.resource.toLowerCase().includes(project.name.toLowerCase())
  );

  const filteredActivities = projectActivities.filter((a) => {
    if (typeFilter !== 'all' && (a as any).entityType && (a as any).entityType !== typeFilter) return false;
    return true;
  });

  const getEntityIcon = (res: string) => {
    const lower = (res || '').toLowerCase();
    if (lower.includes('task') || lower.includes('fs-')) {
      return <CheckSquare className="w-3.5 h-3.5 text-flash-deep" />;
    }
    if (lower.includes('sprint')) {
      return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (lower.includes('milestone')) {
      return <Flag className="w-3.5 h-3.5 text-indigo-500" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-flash" />;
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="activity" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-flash-deep" /> Project Audit & Activity Log
            </h1>
            <p className="text-xs text-muted">
              Live audit trail of changes, sprint events, and updates in {project.name}
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Event:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Events ({projectActivities.length})</option>
              <option value="task">Tasks</option>
              <option value="sprint">Sprints</option>
              <option value="milestone">Milestones</option>
              <option value="project">Project Updates</option>
            </select>
          </div>
        </div>

        {/* Timeline Log */}
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity records found"
            description="Events will automatically appear here as tasks and milestones are modified."
          />
        ) : (
          <Card className="p-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-line">
              {filteredActivities.map((act) => {
                const actor = users.find((u) => u.id === act.actorId || u.id === (act as any).userId);

                return (
                  <div key={act.id} className="relative flex items-start gap-3.5 text-xs group">
                    {/* Event Dot */}
                    <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-paper-elevated border-2 border-flash flex items-center justify-center shrink-0 shadow-xs">
                      {getEntityIcon(act.resource)}
                    </div>

                    <div className="flex-1 bg-paper hover:bg-mist/40 p-3.5 rounded-xl border border-line transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar user={actor} size="xs" />
                          <span className="font-bold text-ink">{actor?.name || act.actorName || 'User'}</span>
                          <span className="text-muted">{act.action}</span>
                          <span className="font-semibold text-flash-deep font-mono">
                            {act.resource || (act as any).entityTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted font-mono shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted/60" />
                          {formatDate(act.timestamp || (act as any).createdAt)}
                        </span>
                      </div>

                      {act.detail && (
                        <div className="text-[11px] text-muted font-mono bg-paper-elevated/70 p-2 rounded-lg border border-line/60 mt-1">
                          {act.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
