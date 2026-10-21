'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { ProjectStatusBadge, HealthBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  History,
  Clock,
  ArrowRight,
  Search,
  CheckSquare,
} from 'lucide-react';

export default function RecentProjectsPage() {
  const { projects, recentProjectIds, users, tasks } = useApp();
  const [search, setSearch] = useState('');

  // Ordered by recent IDs, fallback to first few projects if history is short
  const recentProjects = (
    recentProjectIds.length > 0
      ? recentProjectIds
          .map((id) => projects.find((p) => p.id === id))
          .filter(Boolean)
      : projects.slice(0, 4)
  ) as typeof projects;

  const filtered = recentProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Top Banner */}
      <div className="bg-paper-elevated border-b border-line px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <History className="w-5 h-5 text-flash-deep" /> Recently Viewed Projects
            </h1>
            <p className="text-xs text-muted">
              Pick up where you left off across recently accessed workspaces
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recent…"
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-up">
        {filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No recently viewed projects"
            description="Projects you explore will appear here automatically."
            action={
              <Link href="/projects">
                <Button variant="primary" size="sm">
                  View All Projects
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-paper text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((project, idx) => {
                  const owner = users.find((u) => u.id === project.ownerId);

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-mist/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <Link href={`/projects/${project.id}`} className="block">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: project.accentColor || '#00c2a8' }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-ink group-hover:text-flash-deep">
                                  {project.name}
                                </span>
                                <span className="text-[10px] font-mono text-muted bg-mist px-1 rounded">
                                  {project.key}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {idx === 0 ? 'Just now' : idx === 1 ? '10m ago' : 'Earlier today'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-3">
                        <ProjectStatusBadge status={project.status} />
                      </td>
                      <td className="py-3.5 px-3">
                        <HealthBadge health={project.health} />
                      </td>
                      <td className="py-3.5 px-3 w-40">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={project.progress}
                            color={project.accentColor || 'var(--flash)'}
                            className="h-1.5 flex-1"
                          />
                          <span className="font-mono text-[11px] font-bold text-ink">
                            {project.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {owner && <Avatar user={owner} size="xs" />}
                          <span className="text-ink truncate">{owner?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-muted">
                        {formatDate(project.dueDate || project.endDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="secondary" size="xs" icon={ArrowRight}>
                            Open
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
