'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { PageHeader, Button, EmptyState, ProgressBar } from '@/components/shared/ui';
import { ProjectStatusBadge, HealthBadge, PriorityBadge } from '@/components/shared/badges';
import { AvatarGroup } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import type { Project, ProjectHealth } from '@/types';
import { canCreateProject } from '@/lib/permissions';
import {
  Plus, LayoutGrid, List, Search, Filter, FolderKanban,
  Star, Clock, Calendar, Users, CheckSquare, ArrowUpDown,
} from 'lucide-react';

type ViewMode = 'card' | 'table';

export default function ProjectsPage() {
  const { projects, users, tasks, demoRole, toggleFavoriteProject } = useApp();
  const [view, setView] = useState<ViewMode>('card');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'dueDate' | 'priority'>('name');

  // Extract unique groups
  const groups = Array.from(new Set(projects.map(p => p.group).filter(Boolean))) as string[];

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    const matchGroup = groupFilter === 'all' || p.group === groupFilter;
    const matchFav = !favoritesOnly || p.isFavorite;
    return matchSearch && matchStatus && matchPriority && matchGroup && matchFav;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'progress') return b.progress - a.progress;
    if (sortBy === 'dueDate') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    if (sortBy === 'priority') {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    }
    return 0;
  });

  const canCreate = canCreateProject(demoRole);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-up">
      <PageHeader
        title="All Projects"
        description={`${projects.length} collaborative delivery spaces across your organization`}
        actions={
          canCreate ? (
            <Link href="/projects/new">
              <Button variant="primary" icon={Plus}>Create Project</Button>
            </Link>
          ) : undefined
        }
      />

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 bg-paper-elevated border border-line rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects by name, key..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash transition-colors text-ink"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Space/Group Filter */}
          {groups.length > 0 && (
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink outline-none focus:border-flash"
            >
              <option value="all">All Spaces</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          {/* Favorites Only Toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              favoritesOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                : 'bg-paper border-line text-muted hover:text-ink'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

        {/* Sort & View Mode */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-xs bg-paper border border-line rounded-lg text-ink"
            >
              <option value="name">Sort: Name</option>
              <option value="progress">Sort: Progress</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
            </select>
          </div>

          <div className="flex items-center border border-line rounded-lg overflow-hidden bg-paper">
            <button
              onClick={() => setView('card')}
              className={`p-1.5 transition-colors ${view === 'card' ? 'bg-flash/15 text-flash-deep' : 'text-muted hover:text-ink'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 transition-colors ${view === 'table' ? 'bg-flash/15 text-flash-deep' : 'text-muted hover:text-ink'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects match your criteria"
          description="Try broadening your filters or create a new project."
          action={canCreate ? (
            <Link href="/projects/new">
              <Button variant="primary" icon={Plus}>Create Project</Button>
            </Link>
          ) : undefined}
        />
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-up">
          {filtered.map(p => (
            <ProjectCardItem
              key={p.id}
              project={p}
              users={users}
              tasks={tasks}
              onToggleFavorite={() => toggleFavoriteProject(p.id)}
            />
          ))}
        </div>
      ) : (
        <ProjectTable
          projects={filtered}
          users={users}
          tasks={tasks}
          onToggleFavorite={toggleFavoriteProject}
        />
      )}
    </div>
  );
}

function ProjectCardItem({
  project,
  users,
  tasks,
  onToggleFavorite,
}: {
  project: Project;
  users: ReturnType<typeof useApp>['users'];
  tasks: ReturnType<typeof useApp>['tasks'];
  onToggleFavorite: () => void;
}) {
  const members = users.filter(u => project.memberIds.includes(u.id));
  const owner = users.find(u => u.id === project.ownerId);
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const doneTasks = projectTasks.filter(t => t.status === 'done').length;

  const healthColors: Record<ProjectHealth, string> = {
    on_track: 'var(--flash)',
    at_risk: 'var(--waiting)',
    off_track: 'var(--danger)',
    delayed: 'var(--danger)',
  };

  // Calculate days left
  const dueDate = new Date(project.endDate);
  const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 3600 * 24));
  const deadlineLabel = diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? 'Due today' : `${Math.abs(diffDays)}d overdue`;

  return (
    <div className="bg-paper-elevated rounded-2xl border border-line p-5 hover:border-flash/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
              style={{ backgroundColor: project.accentColor || '#00c2a8' }}
            >
              {project.key}
            </div>
            <div className="min-w-0">
              <Link href={`/projects/${project.id}`}>
                <h3 className="text-sm font-bold text-ink group-hover:text-flash-deep transition-colors truncate">
                  {project.name}
                </h3>
              </Link>
              <p className="text-[10px] text-muted">{project.group || 'Project Workspace'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={e => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="p-1 text-muted hover:text-amber-500 rounded transition-colors"
              title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>

        <p className="text-xs text-muted mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4 bg-paper p-3 rounded-xl border border-line/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted text-[11px] font-medium flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-flash-deep" />
              <span>{doneTasks}/{projectTasks.length} tasks done</span>
            </span>
            <span className="font-bold text-ink">{project.progress}%</span>
          </div>
          <ProgressBar
            value={project.progress}
            color={healthColors[project.health]}
            height={6}
          />
          {/* Timeline variance badge */}
          <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[10px]">
            <span className="text-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted" />
              <span>Timeline</span>
            </span>
            {project.timelineDifference !== undefined && project.timelineDifference > 0 ? (
              <span className="font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">
                +{project.timelineDifference}d extended ({project.currentDuration}d total)
              </span>
            ) : project.timelineDifference !== undefined && project.timelineDifference < 0 ? (
              <span className="font-bold text-flash-deep bg-flash/10 px-1.5 py-0.5 rounded">
                {project.timelineDifference}d shortened ({project.currentDuration}d)
              </span>
            ) : (
              <span className="text-muted font-medium bg-mist/60 px-1.5 py-0.5 rounded">
                On schedule ({project.originalDuration || 90}d)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <AvatarGroup users={members} max={3} size="xs" />

        <div className="flex items-center gap-2">
          <PriorityBadge priority={project.priority} />
          <span className={`text-[11px] font-medium ${diffDays < 0 ? 'text-danger' : 'text-muted'}`}>
            {deadlineLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectTable({
  projects,
  users,
  tasks,
  onToggleFavorite,
}: {
  projects: Project[];
  users: ReturnType<typeof useApp>['users'];
  tasks: ReturnType<typeof useApp>['tasks'];
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-paper border-b border-line text-[10px] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3 px-4 w-8"></th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Timeline</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-4">Planned End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {projects.map(p => {
              const owner = users.find(u => u.id === p.ownerId);
              const members = users.filter(u => p.memberIds.includes(u.id));
              const pTasks = tasks.filter(t => t.projectId === p.id);
              const doneCount = pTasks.filter(t => t.status === 'done').length;

              return (
                <tr key={p.id} className="hover:bg-mist/30 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => onToggleFavorite(p.id)} className="text-muted hover:text-amber-500">
                      <Star className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-ink hover:text-flash-deep flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-mist px-1.5 py-0.5 rounded text-muted">{p.key}</span>
                      <span>{p.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                        <div className="h-full bg-flash-deep" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-ink">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.timelineDifference !== undefined && p.timelineDifference > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-danger bg-danger/10 px-2 py-0.5 rounded text-[10px]">
                        +{p.timelineDifference}d extended
                      </span>
                    ) : p.timelineDifference !== undefined && p.timelineDifference < 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-flash-deep bg-flash/10 px-2 py-0.5 rounded text-[10px]">
                        {p.timelineDifference}d shortened
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted font-medium bg-mist/60 px-2 py-0.5 rounded text-[10px]">
                        On schedule
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted truncate max-w-[120px]">
                    {owner?.name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <AvatarGroup users={members} max={3} size="xs" />
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    <div>
                      <span className="font-medium text-ink">{formatDate(p.currentEndDate || p.endDate)}</span>
                      {p.originalEndDate && p.originalEndDate !== (p.currentEndDate || p.endDate) && (
                        <div className="text-[9px] text-muted line-through">Base: {formatDate(p.originalEndDate)}</div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
