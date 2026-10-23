'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Gauge, Users, AlertTriangle, CheckCircle2, ArrowRightLeft,
  Filter, Calendar, ChevronRight, BarChart3, Search,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge } from '@/components/collaboration/collaboration-badges';
import { ReassignTaskDialog } from '@/components/collaboration/reassign-task-dialog';
import type { Task, User } from '@/types';
import { FEATURES } from '@/lib/features';

export default function WorkloadOverviewPage() {
  const { users, teams, projects, tasks } = useApp();

  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [search, setSearch] = useState('');
  const [thresholdHours, setThresholdHours] = useState(40);

  const [reassignTask, setReassignTask] = useState<Task | null>(null);

  // Period multiplier (week vs month = x4)
  const periodMultiplier = period === 'week' ? 1 : 4;

  // Unassigned tasks count
  const unassignedTasks = tasks.filter(t => !t.assigneeId && t.status !== 'done');

  // Filtered members and their calculated workload
  const memberWorkloads = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
        const matchesTeam =
          selectedTeam === 'all' || (u.teamIds && u.teamIds.includes(selectedTeam));
        const matchesProject =
          selectedProject === 'all' ||
          tasks.some(t => t.assigneeId === u.id && t.projectId === selectedProject);

        return matchesSearch && matchesTeam && matchesProject;
      })
      .map(member => {
        const memberTasks = tasks.filter(t => {
          if (t.assigneeId !== member.id || t.status === 'done') return false;
          if (selectedProject !== 'all' && t.projectId !== selectedProject) return false;
          return true;
        });

        const assignedHours = memberTasks.reduce(
          (sum, t) => sum + (t.storyPoints || t.points || 3) * (period === 'month' ? 2 : 1),
          0
        );

        const capacity = (member.weeklyCapacity || thresholdHours) * periodMultiplier;
        const loadRatio = capacity > 0 ? (assignedHours / capacity) * 100 : 0;

        let category: 'available' | 'balanced' | 'high' | 'overloaded';
        if (loadRatio < 55) category = 'available';
        else if (loadRatio <= 85) category = 'balanced';
        else if (loadRatio <= 100) category = 'high';
        else category = 'overloaded';

        return {
          member,
          tasks: memberTasks,
          assignedHours,
          capacity,
          loadRatio: Math.round(loadRatio),
          category,
        };
      })
      .sort((a, b) => b.loadRatio - a.loadRatio);
  }, [users, tasks, selectedTeam, selectedProject, search, period, thresholdHours, periodMultiplier]);

  // Aggregate metrics
  const availableCount = memberWorkloads.filter(m => m.category === 'available').length;
  const balancedCount = memberWorkloads.filter(m => m.category === 'balanced').length;
  const highCount = memberWorkloads.filter(m => m.category === 'high').length;
  const overloadedCount = memberWorkloads.filter(m => m.category === 'overloaded').length;

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Capacity Planning
              </span>
              <span className="text-xs text-muted">Weekly & Monthly Allocation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Team Workload & Capacity
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Monitor engineer allocations, prevent burnout, and rebalance tasks across members with real-time recalculations.
            </p>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="flex items-center bg-paper-elevated border border-line rounded-lg p-1 shadow-2xs text-xs font-semibold">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === 'week' ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                Weekly View
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === 'month' ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                Monthly View
              </button>
            </div>
          </div>
        </div>

        {/* 4 Category Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Available</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{availableCount}</p>
            <p className="text-[10px] text-muted mt-1">&lt; 55% assigned capacity</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Balanced</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{balancedCount}</p>
            <p className="text-[10px] text-muted mt-1">55% &ndash; 85% healthy load</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">High Workload</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{highCount}</p>
            <p className="text-[10px] text-muted mt-1">85% &ndash; 100% capacity</p>
          </div>

          <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Over Capacity</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{overloadedCount}</p>
            <p className="text-[10px] text-rose-600 font-medium mt-1">&gt; 100% needs rebalancing</p>
          </div>
        </div>

        {/* Filter Controls & Threshold Slider */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search member by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Squad Filter */}
            {FEATURES.teams && (
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="all">All Squads</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Threshold controls */}
            <div className="flex items-center gap-2 bg-paper px-3 py-1.5 rounded-lg border border-line text-xs">
              <span className="text-muted whitespace-nowrap">Baseline Cap:</span>
              <div className="flex items-center gap-1 font-semibold">
                {[35, 40, 45].map(hrs => (
                  <button
                    key={hrs}
                    onClick={() => setThresholdHours(hrs)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      thresholdHours === hrs
                        ? 'bg-ink text-white font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Unassigned Tasks Notice */}
        {unassignedTasks.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>{unassignedTasks.length} unassigned tasks</strong> in active backlog ready for delegation.
              </span>
            </div>
            <button
              onClick={() => setReassignTask(unassignedTasks[0])}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-bold rounded-lg transition-colors text-xs shrink-0"
            >
              Assign Next Task
            </button>
          </div>
        )}

        {/* Member Capacity Rows */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">Member Capacity Breakdown</h3>
              <p className="text-xs text-muted">Weekly task load, capacity bar, and quick task reassignment</p>
            </div>
            <span className="text-xs text-muted font-medium">
              Showing {memberWorkloads.length} members
            </span>
          </div>

          <div className="divide-y divide-line">
            {memberWorkloads.map(({ member, tasks: mTasks, assignedHours, capacity, loadRatio, category }) => {
              const statusBadges = {
                available: { text: 'Available', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', bar: 'bg-emerald-500' },
                balanced: { text: 'Balanced', bg: 'bg-blue-500/10 text-blue-700 border-blue-500/20', bar: 'bg-blue-500' },
                high: { text: 'High Workload', bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20', bar: 'bg-amber-500' },
                overloaded: { text: 'Overloaded', bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20', bar: 'bg-rose-500' },
              };

              const badge = statusBadges[category];

              return (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 hover:bg-mist/20 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Member profile info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <MemberAvatar user={member} size="md" showAvailability />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/teams/members/${member.id}`}
                            className="font-bold text-sm text-ink hover:text-flash-deep transition-colors truncate"
                          >
                            {member.name}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate">
                          {member.title || member.role} &bull; <span className="text-ink-soft">{member.department}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-bold text-ink text-sm">
                          {assignedHours} / {capacity} hrs
                        </span>
                        <p className="text-[10px] text-muted">{loadRatio}% allocated</p>
                      </div>

                      <Link
                        href={`/teams/members/${member.id}`}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
                        title="View Member Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-mist/60 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${badge.bar}`}
                      style={{ width: `${Math.min(100, loadRatio)}%` }}
                    />
                  </div>

                  {/* Task list chips with quick reassign button */}
                  {mTasks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-muted text-[10px] mr-1">Tasks ({mTasks.length}):</span>
                      {mTasks.map(t => (
                        <div
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-paper border border-line text-ink"
                        >
                          <span className="font-mono text-flash-deep font-semibold">{t.key}</span>
                          <span className="max-w-[120px] truncate">{t.title}</span>
                          <button
                            onClick={() => setReassignTask(t)}
                            className="p-0.5 rounded hover:bg-line text-muted hover:text-ink ml-0.5 transition-colors"
                            title="Reassign Task"
                          >
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Reassign Dialog */}
      <ReassignTaskDialog
        open={Boolean(reassignTask)}
        onOpenChange={open => {
          if (!open) setReassignTask(null);
        }}
        task={reassignTask}
      />
    </div>
  );
}
