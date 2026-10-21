'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Flag,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  Trash2,
  BarChart2,
  Layers,
  ArrowRight,
  List,
  Kanban,
  Check
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { CreateMilestoneDialog } from '@/components/collaboration/create-milestone-dialog';
import { Milestone } from '@/types/index';

export default function MilestonesPage() {
  const {
    milestones,
    projects,
    tasks,
    users,
    updateMilestone,
    deleteMilestone,
    openTaskDrawer
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'cards'>('list');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      if (selectedProjectId !== 'all' && m.projectId !== selectedProjectId) return false;
      if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const project = projects.find(p => p.id === m.projectId);
        const matchesProj = project?.name.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesDesc && !matchesProj) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [milestones, selectedProjectId, selectedStatus, searchQuery, projects]);

  // Statistics
  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === 'completed' || m.status === 'achieved').length;
    const atRisk = milestones.filter(m => m.status === 'at_risk').length;
    const overdue = milestones.filter(m => m.dueDate < todayStr && m.status !== 'completed' && m.status !== 'achieved').length;
    const upcoming = total - completed - overdue;
    return { total, completed, atRisk, overdue, upcoming };
  }, [milestones, todayStr]);

  const getStatusBadge = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
      case 'achieved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'at_risk':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'missed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-900 border border-red-300">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mist/60 text-ink-soft border border-line">
            Upcoming
          </span>
        );
    }
  };

  const getDaysRemainingText = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) return 'Completed';
    const due = new Date(dueDate).getTime();
    const today = new Date(todayStr).getTime();
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    }
    if (diffDays === 0) {
      return 'Due today';
    }
    return `${diffDays}d left`;
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-flash" />
            {toastMessage}
          </div>
        )}

        {/* Header Breadcrumbs & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/planner" className="hover:text-ink transition-colors">Planning</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Milestones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Flag className="w-7 h-7 text-flash-deep" />
              Milestones & Release Deadlines
            </h1>
            <p className="text-sm text-muted mt-1">
              Cross-project delivery milestones, sprint targets, release readiness, and linked task progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/planner/milestones/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-sm"
            >
              Full Milestone Page
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Milestone
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">Total Milestones</span>
            <div className="text-2xl font-bold text-ink mt-1">{stats.total}</div>
            <p className="text-[11px] text-muted mt-0.5">Across all active projects</p>
          </div>

          <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
            <span className="text-xs font-medium text-emerald-800">Achieved & Completed</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Key targets delivered</p>
          </div>

          <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs bg-amber-50/20">
            <span className="text-xs font-medium text-amber-800">Upcoming Delivery</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.upcoming}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Within schedule targets</p>
          </div>

          <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs bg-rose-50/20">
            <span className="text-xs font-medium text-rose-800">At Risk or Overdue</span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{stats.atRisk + stats.overdue}</div>
            <p className="text-[11px] text-rose-700 mt-0.5">Requires squad attention</p>
          </div>
        </div>

        {/* Filter and View Toolbar */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search milestones, projects, keywords..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-line rounded-lg bg-paper p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Cards
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'timeline' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Timeline
              </button>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">Project:</span>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="at_risk">At Risk</option>
                <option value="completed">Completed</option>
                <option value="missed">Overdue / Missed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Milestone Views */}
        {viewMode === 'list' && (
          <div className="bg-white border border-line/70 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-72">Milestone</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Target Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 w-44">Task Progress</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-xs">
                  {filteredMilestones.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted">
                        No milestones found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMilestones.map(milestone => {
                      const project = projects.find(p => p.id === milestone.projectId);
                      const isComplete = milestone.status === 'completed' || milestone.status === 'achieved';
                      const progress = milestone.progress ?? (isComplete ? 100 : 40);
                      const daysText = getDaysRemainingText(milestone.dueDate, isComplete);
                      const isOverdue = milestone.dueDate < todayStr && !isComplete;

                      // Linked tasks count
                      const linkedTasks = tasks.filter(t => milestone.taskIds?.includes(t.id));

                      return (
                        <tr key={milestone.id} className="hover:bg-paper/40 transition-colors">
                          {/* Milestone info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-ink hover:text-flash-deep text-xs block">
                                {milestone.name}
                              </span>
                              {milestone.description && (
                                <p className="text-[11px] text-muted line-clamp-1">{milestone.description}</p>
                              )}
                            </div>
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-3">
                            {project ? (
                              <Link
                                href={`/projects/${project.id}`}
                                className="font-semibold text-ink-soft hover:text-flash-deep text-xs flex items-center gap-1"
                              >
                                {project.name}
                                <ExternalLink className="w-3 h-3 text-muted" />
                              </Link>
                            ) : (
                              <span className="text-muted italic">General</span>
                            )}
                          </td>

                          {/* Target Date */}
                          <td className="py-3.5 px-3">
                            <div className="font-mono text-xs font-medium text-ink">{milestone.dueDate}</div>
                            <span
                              className={`text-[10px] font-semibold ${
                                isOverdue ? 'text-rose-600' : isComplete ? 'text-emerald-700' : 'text-muted'
                              }`}
                            >
                              {daysText}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {getStatusBadge(milestone.status)}
                          </td>

                          {/* Progress Bar & Linked Tasks */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted font-medium">{linkedTasks.length} linked tasks</span>
                                <span className="font-bold text-ink">{progress}%</span>
                              </div>
                              <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-line/60">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isComplete ? 'bg-emerald-500' : progress > 50 ? 'bg-flash' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isComplete && (
                                <button
                                  onClick={() => {
                                    updateMilestone(milestone.id, { status: 'completed', progress: 100 });
                                    showToast(`Marked "${milestone.name}" as completed!`);
                                  }}
                                  className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1"
                                  title="Mark Milestone Complete"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete milestone "${milestone.name}"?`)) {
                                    deleteMilestone(milestone.id);
                                    showToast('Milestone deleted.');
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 text-muted hover:text-rose-600 rounded transition-colors"
                                title="Delete Milestone"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMilestones.map(milestone => {
              const project = projects.find(p => p.id === milestone.projectId);
              const isComplete = milestone.status === 'completed' || milestone.status === 'achieved';
              const progress = milestone.progress ?? (isComplete ? 100 : 35);
              const daysText = getDaysRemainingText(milestone.dueDate, isComplete);
              const isOverdue = milestone.dueDate < todayStr && !isComplete;
              const linkedTasks = tasks.filter(t => milestone.taskIds?.includes(t.id));

              return (
                <div
                  key={milestone.id}
                  className="bg-white border border-line/70 rounded-xl p-5 shadow-xs space-y-4 hover:border-flash/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">
                        {project?.name || 'Cross-Project'}
                      </span>
                      <h3 className="text-base font-bold text-ink">{milestone.name}</h3>
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>

                  {milestone.description && (
                    <p className="text-xs text-muted line-clamp-2">{milestone.description}</p>
                  )}

                  {/* Date & countdown */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-line/50">
                    <span className="font-mono text-ink flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      {milestone.dueDate}
                    </span>
                    <span
                      className={`font-semibold ${
                        isOverdue ? 'text-rose-600' : isComplete ? 'text-emerald-700' : 'text-muted'
                      }`}
                    >
                      {daysText}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">{linkedTasks.length} linked tasks</span>
                      <span className="font-bold text-ink">{progress}%</span>
                    </div>
                    <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-line/60">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete ? 'bg-emerald-500' : 'bg-flash'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs">
                    {!isComplete ? (
                      <button
                        onClick={() => {
                          updateMilestone(milestone.id, { status: 'completed', progress: 100 });
                          showToast(`Marked "${milestone.name}" as completed!`);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Delete milestone "${milestone.name}"?`)) {
                          deleteMilestone(milestone.id);
                          showToast('Milestone deleted.');
                        }
                      }}
                      className="text-muted hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="bg-white border border-line/70 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Milestone Release Roadmap</h3>
              <p className="text-xs text-muted">Chronological sequencing of organizational delivery goals</p>
            </div>

            <div className="relative border-l-2 border-flash/40 ml-4 space-y-8 pl-6 py-2">
              {filteredMilestones.map((m, idx) => {
                const isComplete = m.status === 'completed' || m.status === 'achieved';
                const project = projects.find(p => p.id === m.projectId);
                return (
                  <div key={m.id} className="relative group">
                    {/* Bullet */}
                    <div
                      className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        isComplete ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-flash ring-2 ring-flash/30'
                      }`}
                    />

                    <div className="bg-paper border border-line/70 rounded-xl p-4 space-y-2 hover:border-line transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-flash-deep uppercase">
                            {project?.name || 'Organizational Milestone'}
                          </span>
                          <h4 className="text-sm font-bold text-ink">{m.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold bg-white px-2 py-0.5 rounded border border-line">
                            {m.dueDate}
                          </span>
                          {getStatusBadge(m.status)}
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs text-muted">{m.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Dialog */}
        <CreateMilestoneDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
