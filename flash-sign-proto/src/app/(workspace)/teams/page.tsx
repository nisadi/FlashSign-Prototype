'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, Building2, CheckSquare, Gauge, Palmtree,
  Plus, Calendar, ArrowRight, Video, Megaphone, Activity,
  ChevronRight, Clock, Star, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AvailabilityBadge, LeaveTypeBadge } from '@/components/collaboration/collaboration-badges';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { CreateTeamDialog } from '@/components/collaboration/create-team-dialog';
import { CreateMemberDialog } from '@/components/collaboration/create-member-dialog';
import { CreateMeetingDialog } from '@/components/collaboration/create-meeting-dialog';
import { CreateAnnouncementDialog } from '@/components/collaboration/create-announcement-dialog';

export default function TeamOverviewDashboard() {
  const router = useRouter();
  const {
    users, teams, tasks, timeOffRequests, activities, announcements, milestones,
  } = useApp();

  // Dialog states
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);

  // Derived metrics
  const totalMembers = users.length;
  const activeMembers = users.filter(u => u.isActive !== false).length;
  const totalTeams = teams.length;
  const tasksAssigned = tasks.filter(t => t.assigneeId).length;

  // Members at or over capacity (assuming 8 hours/pts per week or weekly capacity)
  const capacityStats = useMemo(() => {
    let atCapacityCount = 0;
    users.forEach(u => {
      const userTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
      const load = userTasks.reduce((acc, t) => acc + (t.storyPoints || t.points || 4), 0);
      const cap = u.weeklyCapacity || 40;
      if (load >= cap * 0.85) {
        atCapacityCount++;
      }
    });
    return atCapacityCount;
  }, [users, tasks]);

  // Upcoming time off
  const upcomingTimeOff = useMemo(() => {
    const today = '2026-10-21';
    return timeOffRequests
      .filter(r => r.status === 'approved' && r.endDate >= today)
      .slice(0, 4);
  }, [timeOffRequests]);

  // Upcoming deadlines (milestones or critical tasks)
  const upcomingDeadlines = useMemo(() => {
    return milestones
      .filter(m => m.status !== 'completed')
      .slice(0, 4);
  }, [milestones]);

  // Recently active members
  const recentMembers = useMemo(() => {
    return users.slice(0, 6);
  }, [users]);

  // Recent announcements
  const latestAnnouncements = useMemo(() => {
    return announcements.slice(0, 3);
  }, [announcements]);

  // Recent activity
  const recentActivities = useMemo(() => {
    return activities.slice(0, 5);
  }, [activities]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Team Collaboration & Planning
              </span>
              <span className="text-xs text-muted">Flash Sign Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1.5 tracking-tight">
              Organization & Team Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
              Real-time directory of squads, cross-functional workload distribution, upcoming team schedules, and announcements.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCreateMemberOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-flash-deep" />
              <span>Add Member</span>
            </button>

            <button
              onClick={() => setCreateTeamOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-flash-deep" />
              <span>Create Team</span>
            </button>

            <button
              onClick={() => setScheduleMeetingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Video className="w-3.5 h-3.5 text-flash-deep" />
              <span>Schedule Meeting</span>
            </button>

            <button
              onClick={() => setCreateAnnouncementOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          </div>
        </div>

        {/* 6 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Link
            href="/teams/members"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Members</span>
              <Users className="w-4 h-4 text-flash-deep group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{totalMembers}</p>
            <p className="text-[10px] text-muted mt-1">Across 4 departments</p>
          </Link>

          <Link
            href="/teams/members"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Active Members</span>
              <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{activeMembers}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">100% active status</p>
          </Link>

          <Link
            href="/teams/directory"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Teams</span>
              <Building2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{totalTeams}</p>
            <p className="text-[10px] text-muted mt-1">Dedicated squads</p>
          </Link>

          <Link
            href="/projects"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Tasks Assigned</span>
              <CheckSquare className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{tasksAssigned}</p>
            <p className="text-[10px] text-muted mt-1">In active sprints</p>
          </Link>

          <Link
            href="/teams/workload"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">At Capacity</span>
              <Gauge className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{capacityStats}</p>
            <p className="text-[10px] text-amber-700 font-medium mt-1">&ge;85% workload load</p>
          </Link>

          <Link
            href="/planner/availability"
            className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Upcoming Leave</span>
              <Palmtree className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{upcomingTimeOff.length}</p>
            <p className="text-[10px] text-muted mt-1">Approved absences</p>
          </Link>
        </div>

        {/* Main Grid: Teams Preview + Workload + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team Directory Preview (2 cols on large) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teams Directory Preview */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Active Teams Directory</h2>
                  <p className="text-xs text-muted">Core cross-functional groups driving deliverables</p>
                </div>
                <Link
                  href="/teams/directory"
                  className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  <span>View All Teams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5">
                {teams.map(team => {
                  const lead = users.find(u => u.id === team.leadId);
                  const memberUsers = users.filter(u => team.memberIds.includes(u.id));
                  const teamTasks = tasks.filter(t => memberUsers.some(m => m.id === t.assigneeId));
                  return (
                    <div
                      key={team.id}
                      className="p-4 rounded-xl border border-line bg-paper hover:border-flash/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                              style={{ backgroundColor: team.color }}
                            >
                              {team.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/teams/${team.id}`}
                                className="font-bold text-sm text-ink hover:text-flash-deep transition-colors line-clamp-1"
                              >
                                {team.name}
                              </Link>
                              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                                {team.department}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            Active
                          </span>
                        </div>

                        <p className="text-xs text-muted mt-2.5 line-clamp-2 leading-relaxed">
                          {team.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {memberUsers.slice(0, 4).map(m => (
                            <MemberAvatar key={m.id} user={m} size="xs" showAvailability />
                          ))}
                          {memberUsers.length > 4 && (
                            <span className="w-6 h-6 rounded-full bg-mist text-[10px] font-bold text-ink flex items-center justify-center border border-white shrink-0">
                              +{memberUsers.length - 4}
                            </span>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-muted">
                          <span>{teamTasks.length} tasks</span>
                          {lead && (
                            <p className="text-[10px] font-medium text-ink truncate max-w-[120px]">
                              Lead: {lead.name.split(' ')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recently Active Members Directory */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Team Members</h2>
                  <p className="text-xs text-muted">Key contributors and their availability</p>
                </div>
                <Link
                  href="/teams/members"
                  className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  <span>All Members</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-line">
                {recentMembers.map(member => {
                  const memberTeamNames = teams
                    .filter(t => member.teamIds?.includes(t.id))
                    .map(t => t.name)
                    .join(', ') || member.department;
                  const userTaskCount = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done').length;

                  return (
                    <div
                      key={member.id}
                      className="p-4 flex items-center justify-between hover:bg-mist/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar user={member} size="md" showAvailability />
                        <div className="min-w-0">
                          <Link
                            href={`/teams/members/${member.id}`}
                            className="font-semibold text-xs text-ink hover:text-flash-deep transition-colors truncate block"
                          >
                            {member.name}
                          </Link>
                          <p className="text-[11px] text-muted truncate">
                            {member.title || member.role} · <span className="text-ink-soft">{memberTeamNames}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-block text-[11px] text-muted">
                          {userTaskCount} active tasks
                        </span>
                        {member.availability && (
                          <AvailabilityBadge status={member.availability} size="sm" />
                        )}
                        <Link
                          href={`/teams/members/${member.id}`}
                          className="p-1 rounded-md text-muted hover:text-ink hover:bg-mist transition-colors"
                          title="View Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Announcements Section */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-flash-deep" />
                  <div>
                    <h2 className="text-base font-bold text-ink">Recent Announcements</h2>
                    <p className="text-xs text-muted">Company updates, releases, and leadership briefs</p>
                  </div>
                </div>
                <Link
                  href="/teams/announcements"
                  className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  <span>Announcements Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-line p-2 sm:p-3">
                {latestAnnouncements.map(ann => {
                  const author = users.find(u => u.id === ann.authorId);
                  return (
                    <div key={ann.id} className="p-3 hover:bg-mist/20 rounded-lg transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {ann.isPinned && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                              Pinned
                            </span>
                          )}
                          <Link
                            href="/teams/announcements"
                            className="font-bold text-xs text-ink hover:text-flash-deep transition-colors"
                          >
                            {ann.title}
                          </Link>
                        </div>
                        <span className="text-[10px] text-muted whitespace-nowrap">
                          {ann.publishedDate.slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {ann.content}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                        <span>By {author?.name || 'Leadership'}</span>
                        <span>&bull;</span>
                        <span className="capitalize">Audience: {ann.audience}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Workload Snapshot + Schedule + Activity Feed */}
          <div className="space-y-6">
            {/* Workload Summary Widget */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Workload Distribution</h3>
                  <p className="text-xs text-muted">Capacity overview across active members</p>
                </div>
                <Link
                  href="/teams/workload"
                  className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  Full Board
                </Link>
              </div>

              <div className="space-y-3">
                {users.slice(0, 5).map(u => {
                  const userTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
                  const assignedPoints = userTasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 3), 0);
                  const maxCap = u.weeklyCapacity || 40;
                  const percent = Math.min(100, Math.round((assignedPoints / maxCap) * 100));

                  const statusColor =
                    percent > 90
                      ? 'bg-rose-500'
                      : percent > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div key={u.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink truncate max-w-[160px]">{u.name}</span>
                        <span className="font-mono text-muted text-[11px]">{assignedPoints} / {maxCap} hrs ({percent}%)</span>
                      </div>
                      <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                <span className="text-muted">Need to rebalance tasks?</span>
                <Link
                  href="/teams/workload"
                  className="font-semibold text-flash-deep hover:underline"
                >
                  Reassign tasks &rarr;
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Upcoming Milestones</h3>
                <Link
                  href="/planner/calendar?category=milestone"
                  className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  View All
                </Link>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-muted italic">No pending milestones.</p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingDeadlines.map(m => (
                    <div key={m.id} className="p-2.5 rounded-lg bg-paper border border-line space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs text-ink truncate">{m.name}</p>
                        <span className="text-[10px] text-muted font-mono">{m.dueDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>Progress: {m.progress || 0}%</span>
                        <span className="capitalize font-medium text-ink">{m.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Time Off Widget */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Upcoming Absences</h3>
                <Link
                  href="/planner/availability"
                  className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  Time Off
                </Link>
              </div>

              {upcomingTimeOff.length === 0 ? (
                <p className="text-xs text-muted italic">No scheduled absences this week.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTimeOff.map(r => {
                    const member = users.find(u => u.id === r.memberId);
                    return (
                      <div key={r.id} className="p-2.5 rounded-lg bg-paper border border-line flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <MemberAvatar user={member} size="xs" />
                          <div className="truncate">
                            <p className="font-medium text-ink text-xs truncate">{member?.name}</p>
                            <p className="text-[10px] text-muted">{r.startDate} to {r.endDate}</p>
                          </div>
                        </div>
                        <LeaveTypeBadge type={r.leaveType} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Team Activity */}
            <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-flash-deep" />
                  <span>Recent Activity</span>
                </h3>
                <Link
                  href="/teams/activity"
                  className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                >
                  View Feed
                </Link>
              </div>

              <div className="space-y-3">
                {recentActivities.map(act => (
                  <div key={act.id} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-flash shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink font-medium leading-tight">
                        <strong>{act.actorName}</strong> {act.action}
                      </p>
                      {act.detail && <p className="text-muted text-[11px] truncate">{act.detail}</p>}
                      <span className="text-[10px] text-muted">{act.timestamp.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Modals */}
      <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
      <CreateMemberDialog open={createMemberOpen} onOpenChange={setCreateMemberOpen} />
      <CreateMeetingDialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen} />
      <CreateAnnouncementDialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen} />
    </div>
  );
}
