'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, Building2, ArrowLeft, Edit3, Trash2, CheckCircle2,
  FolderKanban, CheckSquare, Target, Activity, Calendar,
  ArrowRight, Plus, ExternalLink, Archive, UserPlus,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AvailabilityBadge } from '@/components/collaboration/collaboration-badges';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { CreateTeamDialog } from '@/components/collaboration/create-team-dialog';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const { teams, users, projects, tasks, activities, deleteTeam, updateTeam } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'workload' | 'activity'>('overview');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Find team
  const team = teams.find(t => t.id === teamId) || teams[0];

  const lead = users.find(u => u.id === team?.leadId);
  const memberUsers = useMemo(() => {
    if (!team) return [];
    return users.filter(u => team.memberIds.includes(u.id));
  }, [team, users]);

  const teamProjects = useMemo(() => {
    if (!team) return [];
    return projects.filter(p => team.projectIds?.includes(p.id) || p.teamIds?.includes(team.id));
  }, [team, projects]);

  const teamTasks = useMemo(() => {
    return tasks.filter(t => memberUsers.some(m => m.id === t.assigneeId));
  }, [tasks, memberUsers]);

  const completedTasksCount = teamTasks.filter(t => t.status === 'done').length;
  const taskCompletionRate = teamTasks.length > 0
    ? Math.round((completedTasksCount / teamTasks.length) * 100)
    : 0;

  const teamActivities = useMemo(() => {
    return activities
      .filter(a => memberUsers.some(m => m.id === a.actorId) || a.resourceId === team?.id)
      .slice(0, 10);
  }, [activities, memberUsers, team]);

  if (!team) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-ink">Team not found.</p>
        <Link href="/teams/directory" className="text-xs text-flash-deep underline">
          Back to Teams Directory
        </Link>
      </div>
    );
  }

  const handleDeleteTeam = () => {
    deleteTeam(team.id);
    router.push('/teams/directory');
  };

  const handleToggleArchive = () => {
    updateTeam(team.id, {
      status: team.status === 'archived' ? 'active' : 'archived',
    });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/teams/directory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams Directory</span>
        </Link>

        {/* Team Hero Header */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-xs shrink-0"
                style={{ backgroundColor: team.color }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                    {team.name}
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      team.status === 'archived'
                        ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                    }`}
                  >
                    {team.status === 'archived' ? 'Archived' : 'Active Squad'}
                  </span>
                </div>

                <p className="text-xs text-muted max-w-2xl leading-relaxed">
                  {team.description || 'No description provided for this team.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted">
                  <span>Department: <strong className="text-ink font-semibold">{team.department}</strong></span>
                  <span>&bull;</span>
                  {lead && (
                    <span>
                      Team Lead: <strong className="text-ink font-semibold">{lead.name}</strong>
                    </span>
                  )}
                  <span>&bull;</span>
                  <span><strong>{team.memberIds.length}</strong> Members</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mist/70 hover:bg-mist text-ink font-semibold text-xs transition-colors border border-line"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Team</span>
              </button>

              <button
                onClick={handleToggleArchive}
                className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
                title={team.status === 'archived' ? 'Unarchive Team' : 'Archive Team'}
              >
                <Archive className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-1.5 rounded-lg border border-line text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                title="Delete Team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="pt-2 border-t border-line flex items-center gap-1 overflow-x-auto">
            {(['overview', 'members', 'projects', 'workload', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-ink text-white'
                    : 'text-muted hover:text-ink hover:bg-mist/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Goals & Task Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Team Goals Card */}
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-ink font-bold">
                  <Target className="w-4 h-4 text-flash-deep" />
                  <h3 className="text-sm">Team Objectives & Deliverables</h3>
                </div>
                {team.goals && team.goals.length > 0 ? (
                  <ul className="space-y-2">
                    {team.goals.map((g, i) => (
                      <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-paper border border-line text-xs">
                        <CheckCircle2 className="w-4 h-4 text-flash-deep shrink-0 mt-0.5" />
                        <span className="text-ink leading-relaxed">{g}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted italic">No specific goals entered for this sprint cycle.</p>
                )}
              </div>

              {/* Task Completion Progress Overview */}
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Task Execution & Progress</h3>
                    <p className="text-xs text-muted">Assigned tasks currently tracked for team members</p>
                  </div>
                  <span className="font-extrabold text-base text-flash-deep font-mono">
                    {taskCompletionRate}%
                  </span>
                </div>

                <div className="w-full bg-mist/60 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-flash rounded-full transition-all duration-300"
                    style={{ width: `${taskCompletionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="p-2.5 rounded-lg bg-paper border border-line">
                    <span className="text-[10px] text-muted block">Total Tasks</span>
                    <strong className="text-sm font-bold text-ink">{teamTasks.length}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-paper border border-line">
                    <span className="text-[10px] text-muted block">In Progress</span>
                    <strong className="text-sm font-bold text-amber-600">
                      {teamTasks.filter(t => t.status === 'in_progress').length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-paper border border-line">
                    <span className="text-[10px] text-muted block">Completed</span>
                    <strong className="text-sm font-bold text-emerald-600">{completedTasksCount}</strong>
                  </div>
                </div>
              </div>

              {/* Projects Preview */}
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Connected Projects</h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-flash-deep hover:underline"
                  >
                    View All ({teamProjects.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamProjects.map(p => (
                    <div key={p.id} className="p-3 rounded-lg bg-paper border border-line space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Link href={`/projects/${p.id}`} className="font-bold text-xs text-ink hover:text-flash-deep">
                          {p.name}
                        </Link>
                        <span className="font-mono text-[10px] text-muted">{p.progress}%</span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Member Summary & Quick Workload */}
            <div className="space-y-6">
              {/* Member Summary */}
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Team Members</h3>
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-xs font-semibold text-flash-deep hover:underline"
                  >
                    Full List
                  </button>
                </div>

                <div className="divide-y divide-line">
                  {memberUsers.map(m => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MemberAvatar user={m} size="xs" showAvailability />
                        <div className="min-w-0 truncate">
                          <Link href={`/teams/members/${m.id}`} className="font-semibold text-xs text-ink truncate block">
                            {m.name}
                          </Link>
                          <span className="text-[10px] text-muted truncate block">{m.title || m.role}</span>
                        </div>
                      </div>
                      {m.availability && <AvailabilityBadge status={m.availability} size="sm" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-ink">Recent Team Events</h3>
                <div className="space-y-2.5">
                  {teamActivities.length === 0 ? (
                    <p className="text-xs text-muted italic">No recorded activity yet.</p>
                  ) : (
                    teamActivities.slice(0, 4).map(act => (
                      <div key={act.id} className="text-xs space-y-0.5">
                        <p className="text-ink font-medium">
                          <strong>{act.actorName}</strong> {act.action}
                        </p>
                        <span className="text-[10px] text-muted font-mono">{act.timestamp.slice(0, 10)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Members */}
        {activeTab === 'members' && (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Team Members ({memberUsers.length})</h3>
                <p className="text-xs text-muted">Full list of contributors assigned to {team.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberUsers.map(m => {
                const isLead = m.id === team.leadId;
                const mTasks = tasks.filter(t => t.assigneeId === m.id && t.status !== 'done');
                return (
                  <div key={m.id} className="p-4 rounded-xl bg-paper border border-line space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <MemberAvatar user={m} size="md" showAvailability />
                        <div>
                          <Link href={`/teams/members/${m.id}`} className="font-bold text-xs text-ink hover:text-flash-deep">
                            {m.name}
                          </Link>
                          <p className="text-[10px] text-muted">{m.title || m.role}</p>
                        </div>
                      </div>
                      {isLead && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-flash/15 text-flash-deep border border-flash/30">
                          Lead
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted space-y-1">
                      <p>Email: <span className="text-ink">{m.email}</span></p>
                      <p>Time Zone: <span className="text-ink">{m.timeZone || 'EST'}</span></p>
                      <p>Tasks in Sprint: <strong className="text-ink">{mTasks.length}</strong></p>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      {m.availability && <AvailabilityBadge status={m.availability} size="sm" />}
                      <Link
                        href={`/teams/members/${m.id}`}
                        className="text-xs font-semibold text-flash-deep hover:underline"
                      >
                        Profile &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Projects */}
        {activeTab === 'projects' && (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Assigned Projects ({teamProjects.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamProjects.map(p => (
                <div key={p.id} className="p-4 rounded-xl bg-paper border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/projects/${p.id}`} className="font-bold text-sm text-ink hover:text-flash-deep">
                      {p.name}
                    </Link>
                    <span className="text-xs font-mono font-bold text-flash-deep">{p.progress}%</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
                    <span className="text-muted">Status: <strong className="capitalize text-ink">{p.status}</strong></span>
                    <Link href={`/projects/${p.id}`} className="font-semibold text-flash-deep hover:underline flex items-center gap-1">
                      <span>Open Project</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Workload */}
        {activeTab === 'workload' && (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Team Capacity & Workload</h3>
                <p className="text-xs text-muted">Weekly task load assigned to {team.name} members</p>
              </div>
              <Link href="/teams/workload" className="text-xs font-semibold text-flash-deep hover:underline">
                Open Full Workload Planner &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {memberUsers.map(u => {
                const mTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
                const points = mTasks.reduce((s, t) => s + (t.storyPoints || t.points || 3), 0);
                const cap = u.weeklyCapacity || 40;
                const pct = Math.min(100, Math.round((points / cap) * 100));

                return (
                  <div key={u.id} className="p-3 rounded-lg bg-paper border border-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{u.name} ({u.title || 'Engineer'})</span>
                      <span className="font-mono text-muted">{points} / {cap} hrs ({pct}%)</span>
                    </div>
                    <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 85 ? 'bg-rose-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Activity */}
        {activeTab === 'activity' && (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Team Activity Feed</h3>
            <div className="space-y-3">
              {teamActivities.map(act => (
                <div key={act.id} className="p-3 rounded-lg bg-paper border border-line flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-flash shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-ink font-semibold">
                      {act.actorName} <span className="font-normal text-muted">{act.action}</span>
                    </p>
                    {act.detail && <p className="text-muted text-[11px] mt-0.5">{act.detail}</p>}
                    <span className="text-[10px] text-muted font-mono">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CreateTeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        teamToEdit={team}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-paper-elevated border border-line rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Delete Team</h3>
            <p className="text-muted leading-relaxed">
              Are you sure you want to delete <strong>{team.name}</strong>? This action will remove the squad and unlink assigned members.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                className="px-4 py-1.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
