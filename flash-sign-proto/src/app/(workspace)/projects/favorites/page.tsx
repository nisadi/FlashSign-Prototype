'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { ProjectStatusBadge, HealthBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  Star,
  Search,
  ArrowRight,
  Clock,
  Calendar,
  Layers,
  CheckSquare,
} from 'lucide-react';

export default function FavoritesPage() {
  const { projects, users, tasks, toggleFavoriteProject } = useApp();
  const [search, setSearch] = useState('');

  const favoriteProjects = projects.filter((p) => p.isFavorite);
  const filtered = favoriteProjects.filter((p) =>
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
              <Star className="w-5 h-5 text-amber-500 fill-current" /> Favorited Projects
            </h1>
            <p className="text-xs text-muted">
              Starred projects for quick access and priority tracking
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favorites…"
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-up">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorite projects yet"
            description="Star any project from the project list or overview to pin it here."
            action={
              <Link href="/projects">
                <Button variant="primary" size="sm">
                  Browse All Projects
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const owner = users.find((u) => u.id === project.ownerId);
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const doneTasks = projectTasks.filter((t) => t.status === 'done').length;

              return (
                <Card
                  key={project.id}
                  className="p-5 flex flex-col justify-between hover:border-flash/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: project.accentColor || '#00c2a8' }}
                        />
                        <span className="text-xs font-mono font-bold text-muted bg-mist px-1.5 py-0.5 rounded">
                          {project.key}
                        </span>
                        <ProjectStatusBadge status={project.status} />
                      </div>

                      <button
                        onClick={() => toggleFavoriteProject(project.id)}
                        className="text-amber-500 hover:text-amber-600 p-1"
                        title="Remove from favorites"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-bold text-ink hover:text-flash-deep truncate block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-line mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Progress</span>
                      <span className="font-mono font-bold text-ink">{project.progress}%</span>
                    </div>
                    <ProgressBar
                      value={project.progress}
                      color={project.accentColor || 'var(--flash)'}
                      className="h-1.5"
                    />

                    <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                      <div className="flex items-center gap-1.5">
                        {owner && <Avatar user={owner} size="xs" />}
                        <span className="truncate max-w-[100px]">{owner?.name}</span>
                      </div>
                      <span className="font-mono">{formatDate(project.dueDate || project.endDate)}</span>
                    </div>

                    <Link href={`/projects/${project.id}`}>
                      <Button variant="secondary" size="sm" className="w-full justify-center mt-2">
                        Open Project <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
