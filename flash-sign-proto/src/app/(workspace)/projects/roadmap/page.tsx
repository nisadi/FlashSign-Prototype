'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Card, Button, ProgressBar } from '@/components/shared/ui';
import { ProjectStatusBadge, HealthBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';
import {
  Compass,
  Search,
  Filter,
  Plus,
  Flag,
  Calendar,
  Layers,
  ArrowRight,
  Target,
  Sparkles,
} from 'lucide-react';
import type { Project, Milestone } from '@/types';

export default function ProjectRoadmapPage() {
  const { projects, milestones, users, addMilestone } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [quarterScale, setQuarterScale] = useState<'quarters' | 'months'>('quarters');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');

  const groups = Array.from(new Set(projects.map((p) => p.group || 'Core Platform')));

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchGroup = groupFilter === 'all' || p.group === groupFilter;
      return matchSearch && matchStatus && matchGroup;
    });
  }, [projects, search, statusFilter, groupFilter]);

  // Quarters Definition
  const quarters = [
    { label: 'Q1 (Jan–Mar)', key: 'q1', start: 0, end: 2 },
    { label: 'Q2 (Apr–Jun)', key: 'q2', start: 3, end: 5 },
    { label: 'Q3 (Jul–Sep)', key: 'q3', start: 6, end: 8 },
    { label: 'Q4 (Oct–Dec)', key: 'q4', start: 9, end: 11 },
  ];

  // Helper to place project bar
  const getProjectSpan = (project: Project) => {
    const start = new Date(project.startDate);
    const end = new Date(project.dueDate || project.endDate);
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();

    const left = Math.max(0, Math.min(100, (startMonth / 12) * 100));
    const width = Math.max(
      15,
      Math.min(100 - left, ((Math.max(endMonth - startMonth, 1) + 1) / 12) * 100)
    );

    return { left: `${left}%`, width: `${width}%` };
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneName.trim()) {
      notify('Add a title for the milestone first.', 'error');
      return;
    }
    if (!targetProjectId) {
      notify('Choose a project for the milestone first.', 'error');
      return;
    }

    addMilestone({
      name: newMilestoneName.trim(),
      description: newMilestoneDesc.trim(),
      projectId: targetProjectId,
      dueDate:
        newMilestoneDate ||
        new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      taskIds: [],
    });

    notify(`Milestone "${newMilestoneName.trim()}" created`);
    setNewMilestoneName('');
    setNewMilestoneDesc('');
    setShowMilestoneModal(false);
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Top Banner */}
      <div className="bg-paper-elevated border-b border-line px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Compass className="w-5 h-5 text-flash-deep" /> Multi-Project Strategic Roadmap
            </h1>
            <p className="text-xs text-muted">
              Quarterly timeline and milestone execution across all active initiatives
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowMilestoneModal(true)}
            >
              Add Milestone
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Toolbar */}
        <div className="bg-paper-elevated border border-line p-3.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roadmap initiatives…"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Scale:</span>
            <div className="inline-flex rounded-xl border border-line bg-paper p-0.5">
              <button
                onClick={() => setQuarterScale('quarters')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  quarterScale === 'quarters'
                    ? 'bg-ink text-flash font-semibold shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Quarters
              </button>
              <button
                onClick={() => setQuarterScale('months')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  quarterScale === 'months'
                    ? 'bg-ink text-flash font-semibold shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Months
              </button>
            </div>
          </div>
        </div>

        {/* Create Milestone Modal */}
        <Modal
          isOpen={showMilestoneModal}
          onClose={() => setShowMilestoneModal(false)}
          size="sm"
        >
          <div className="p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Add Roadmap Milestone</h2>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder="e.g. SOC2 Certification Audit"
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Target Date</label>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  placeholder="Key deliverables…"
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMilestoneModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Milestone
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Roadmap Grid */}
        <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
          {/* Header Quarters */}
          <div className="grid grid-cols-12 border-b border-line bg-paper text-xs font-bold text-muted py-3 px-4">
            <div className="col-span-4 font-sans text-ink uppercase tracking-wider text-[11px]">
              Initiative / Project
            </div>
            <div className="col-span-8 grid grid-cols-4 text-center divide-x divide-line font-mono text-[11px]">
              {quarters.map((q) => (
                <span key={q.key}>{q.label}</span>
              ))}
            </div>
          </div>

          {/* Project Roadmap Rows */}
          <div className="divide-y divide-line">
            {filteredProjects.map((project) => {
              const owner = users.find((u) => u.id === project.ownerId);
              const pMilestones = milestones.filter((m) => m.projectId === project.id);
              const span = getProjectSpan(project);

              return (
                <div key={project.id} className="grid grid-cols-12 p-4 items-center hover:bg-mist/20 transition-colors group">
                  {/* Left Initiative Meta */}
                  <div className="col-span-4 pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: project.accentColor || '#00c2a8' }} />
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xs font-bold text-ink hover:text-flash-deep truncate flex items-center gap-1"
                      >
                        {project.name} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span>{project.key}</span>
                      <span>•</span>
                      <span>{owner?.name || 'Unassigned'}</span>
                      <span>•</span>
                      <span className="font-mono">{project.progress}%</span>
                    </div>

                    <ProgressBar value={project.progress} color={project.accentColor || 'var(--flash)'} className="h-1" />
                  </div>

                  {/* Right Timeline Bar Track */}
                  <div className="col-span-8 relative h-12 bg-paper/60 rounded-xl flex items-center px-1 border border-line/40">
                    {/* Project Span Bar */}
                    <div
                      className="absolute top-2 bottom-2 rounded-lg px-2 flex items-center justify-between text-[10px] text-white font-medium shadow-2xs opacity-90 transition-all"
                      style={{
                        left: span.left,
                        width: span.width,
                        background: project.accentColor || '#00c2a8',
                      }}
                    >
                      <span className="truncate pr-1 font-bold">{project.name}</span>
                      <span className="font-mono text-[9px] opacity-80 shrink-0">
                        {formatDate(project.dueDate || project.endDate)}
                      </span>
                    </div>

                    {/* Milestones Markers */}
                    {pMilestones.map((m) => {
                      const mMonth = new Date(m.dueDate).getMonth();
                      const mLeft = Math.max(0, Math.min(95, (mMonth / 12) * 100));

                      return (
                        <div
                          key={m.id}
                          className="absolute z-10 -top-1 transform -translate-x-1/2 flex flex-col items-center cursor-pointer group/m"
                          style={{ left: `${mLeft}%` }}
                          title={`${m.name} (${formatDate(m.dueDate)})`}
                        >
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Flag className="w-2.5 h-2.5" />
                          </div>
                          <span className="hidden group-hover/m:block absolute top-5 bg-ink text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
                            {m.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
