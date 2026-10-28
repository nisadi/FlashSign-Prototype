'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, ArrowLeft, Mail, Clock, Globe, Briefcase, CheckSquare,
  FolderKanban, Calendar, Edit3, ArrowRight, CheckCircle2,
  AlertCircle, Activity, Plus,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge } from '@/components/collaboration/collaboration-badges';
import { CreateMemberDialog } from '@/components/collaboration/create-member-dialog';
import type { AvailabilityStatus, Task } from '@/types';
import { FEATURES } from '@/lib/features';
import { Modal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;

  const {
    users, teams, projects, tasks, activities, updateMemberAvailability,
    addTask,
  } = useApp();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(projects[0]?.id || '');
  const [newTaskPoints, setNewTaskPoints] = useState(3);

  // Find member
  const member = users.find(u => u.id === memberId) || users[0];

  const memberTeams = useMemo(() => {
    if (!member) return [];
    return teams.filter(t => member.teamIds?.includes(t.id));
  }, [member, teams]);

  const memberProjects = useMemo(() => {
    if (!member) return [];
    return projects.filter(p => member.projectIds?.includes(p.id));
  }, [member, projects]);

  const memberTasks = useMemo(() => {
    return tasks.filter(t => t.assigneeId === member?.id);
  }, [tasks, member]);

  const activeTasks = memberTasks.filter(t => t.status !== 'done');
  const completedTasks = memberTasks.filter(t => t.status === 'done');

  // Workload calculations
  const totalHours = activeTasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 3), 0);
  const weeklyCap = member?.weeklyCapacity || 40;
  const loadPercentage = Math.min(100, Math.round((totalHours / weeklyCap) * 100));

  // Member activity
  const memberActivities = useMemo(() => {
    return activities.filter(a => a.actorId === member?.id).slice(0, 8);
  }, [activities, member]);

  if (!member) {
    return (
      <div className="p-8 text-center text-xs">
        <p className="font-semibold text-ink">Member not found.</p>
        <Link href="/teams/members" className="text-flash-deep underline mt-2 block">
          Return to Member Directory
        </Link>
      </div>
    );
  }

  const handleAvailabilityChange = (newStatus: AvailabilityStatus) => {
    updateMemberAvailability(member.id, newStatus);
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      notify('Add a title for the task first.', 'error');
      return;
    }

    addTask({
      title: newTaskTitle.trim(),
      projectId: newTaskProject,
      assigneeId: member.id,
      storyPoints: newTaskPoints,
      status: 'in_progress',
      priority: 'medium',
      type: 'task',
      description: `Task assigned directly to ${member.name}`,
    });

    notify(`Task "${newTaskTitle.trim()}" assigned to ${member.name}`);
    setNewTaskTitle('');
    setAssignTaskOpen(false);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/teams/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Member Directory</span>
        </Link>

        {/* Profile Hero Header */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <MemberAvatar user={member} size="xl" showAvailability />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                    {member.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-mist text-ink border border-line">
                    {member.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <p className="text-sm font-medium text-ink-soft">
                  {member.title || 'Specialist'} &bull; <span className="text-muted">{member.department}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{member.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{member.timeZone || 'EST'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{member.workingHours || '09:00 - 17:00 EST'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAssignTaskOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Task</span>
              </button>

              <button
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mist/70 hover:bg-mist text-ink font-semibold text-xs transition-colors border border-line"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <Link
                href="/planner/calendar"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mist/70 hover:bg-mist text-ink font-semibold text-xs transition-colors border border-line"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </Link>
            </div>
          </div>

          {/* Quick Availability Switcher */}
          <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">Current Availability:</span>
              {member.availability && <AvailabilityBadge status={member.availability} />}
            </div>

            <div className="flex items-center gap-1.5 bg-paper p-1 rounded-lg border border-line">
              <span className="text-[10px] text-muted px-2 font-medium">Set status:</span>
              {(['available', 'busy', 'focus_time', 'out_of_office'] as AvailabilityStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleAvailabilityChange(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors capitalize ${
                    member.availability === st
                      ? 'bg-ink text-white shadow-2xs'
                      : 'text-muted hover:text-ink hover:bg-mist'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Assigned Tasks & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Tasks */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">Assigned Tasks ({activeTasks.length})</h3>
                  <p className="text-xs text-muted">Active responsibilities in current sprints</p>
                </div>
                <button
                  onClick={() => setAssignTaskOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign New Task</span>
                </button>
              </div>

              {activeTasks.length === 0 ? (
                <p className="text-xs text-muted italic p-4 text-center bg-paper rounded-lg border border-line">
                  No active tasks assigned. Member is currently available for sprint work.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeTasks.map(t => {
                    const prj = projects.find(p => p.id === t.projectId);
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-lg bg-paper border border-line flex items-center justify-between gap-3 text-xs hover:border-flash/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-flash-deep">
                              {t.key}
                            </span>
                            <span className="font-semibold text-ink truncate">{t.title}</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5 truncate">
                            Project: {prj?.name || 'Workspace'} &bull; Points: {t.storyPoints || t.points || 3}h
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 capitalize shrink-0">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed Tasks Summary */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-base font-bold text-ink">Recently Delivered Tasks ({completedTasks.length})</h3>
              <div className="space-y-2">
                {completedTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-paper border border-line flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-ink truncate">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">{t.key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Projects */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-base font-bold text-ink">Active Project Involvements ({memberProjects.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberProjects.map(p => (
                  <div key={p.id} className="p-3 rounded-lg bg-paper border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/projects/${p.id}`} className="font-bold text-xs text-ink hover:text-flash-deep">
                        {p.name}
                      </Link>
                      <span className="text-[10px] font-mono font-bold text-flash-deep">{p.progress}%</span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-1">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Workload Gauge & Activity */}
          <div className="space-y-6">
            {/* Workload Capacity Card */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Workload & Capacity</h3>
                <p className="text-xs text-muted">Weekly task load vs capacity</p>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line text-center space-y-2">
                <span className="text-3xl font-extrabold text-ink font-mono">{loadPercentage}%</span>
                <p className="text-xs text-muted">
                  <strong>{totalHours}</strong> hrs assigned of <strong>{weeklyCap}</strong> hrs weekly capacity
                </p>
                <div className="w-full bg-mist/60 h-2.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      loadPercentage > 85 ? 'bg-rose-500' : loadPercentage > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-muted space-y-1">
                <p>Status: <strong className="text-ink capitalize">{loadPercentage > 85 ? 'High Workload' : 'Balanced'}</strong></p>
                <p>Schedule: <span className="text-ink">{member.workingHours || '09:00 - 17:00 EST'}</span></p>
              </div>
            </div>

            {/* Assigned Squads */}
            {FEATURES.teams && (
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-ink">Assigned Squads</h3>
              <div className="space-y-2">
                {memberTeams.map(t => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="p-3 rounded-lg bg-paper border border-line flex items-center justify-between hover:border-flash/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-semibold text-xs text-ink">{t.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted" />
                  </Link>
                ))}
              </div>
            </div>
            )}

            {/* Skills & Expertise */}
            {member.skills && member.skills.length > 0 && (
              <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-ink">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-mist/60 text-ink border border-line"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Member Activity */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-flash-deep" />
                <span>Recent Actions</span>
              </h3>
              <div className="space-y-2.5">
                {memberActivities.length === 0 ? (
                  <p className="text-xs text-muted italic">No recent log entries for this user.</p>
                ) : (
                  memberActivities.map(act => (
                    <div key={act.id} className="text-xs space-y-0.5">
                      <p className="text-ink font-medium">{act.action}</p>
                      {act.detail && <p className="text-muted text-[11px] truncate">{act.detail}</p>}
                      <span className="text-[10px] text-muted font-mono">{act.timestamp.slice(0, 10)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <CreateMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        memberToEdit={member}
      />

      {/* Assign Task Modal */}
      <Modal
        isOpen={assignTaskOpen}
        onClose={() => setAssignTaskOpen(false)}
        size="sm"
      >
        <div className="p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-ink">Assign New Task to {member.name}</h3>
          <form onSubmit={handleAssignTask} className="space-y-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Task Title</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Implement WebAssembly verification runner"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Project</label>
              <select
                value={newTaskProject}
                onChange={e => setNewTaskProject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Estimated Points / Hours</label>
              <input
                type="number"
                min="1"
                max="13"
                value={newTaskPoints}
                onChange={e => setNewTaskPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setAssignTaskOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
