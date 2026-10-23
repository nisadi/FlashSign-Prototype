'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Building2, CheckSquare, Gauge, Palmtree, Plus, ArrowRight, Video,
  Megaphone, Activity, ChevronRight, OctagonAlert, CircleCheckBig,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AvailabilityBadge, LeaveTypeBadge } from '@/components/collaboration/collaboration-badges';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { CreateTeamDialog } from '@/components/collaboration/create-team-dialog';
import { CreateMemberDialog } from '@/components/collaboration/create-member-dialog';
import { CreateMeetingDialog } from '@/components/collaboration/create-meeting-dialog';
import { CreateAnnouncementDialog } from '@/components/collaboration/create-announcement-dialog';
import { TaskFlowChart, AvailabilityNow, TaskStatusByMember, MeetingLoad } from '@/components/analytics/team-charts';
import { WEEKLY_TASK_FLOW } from '@/data/mock-analytics';
import { FEATURES } from '@/lib/features';

// The demo data is anchored to this date (see data/mock-collaboration.ts)
const TODAY = '2026-10-21';
const WEEK_START = '2026-10-19';
const WEEK_END = '2026-10-25';

const MAX_ANNOUNCEMENTS = 3;

const formatDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

export default function TeamAnalyticsPage() {
  const {
    users, teams, tasks, meetings, timeOffRequests, activities, announcements, milestones,
  } = useApp();

  // Dialog states
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false);

  // Workload per member, highest load first (assumes story points ≈ hours, as before)
  const workload = useMemo(() => {
    return users
      .map(u => {
        const open = tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
        const load = open.reduce((sum, t) => sum + (t.storyPoints || t.points || 3), 0);
        const capacity = u.weeklyCapacity || 40;
        return { user: u, load, capacity, percent: Math.round((load / capacity) * 100) };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [users, tasks]);

  const kpis = useMemo(() => {
    const thisWeek = WEEKLY_TASK_FLOW[WEEKLY_TASK_FLOW.length - 1];
    const lastWeek = WEEKLY_TASK_FLOW[WEEKLY_TASK_FLOW.length - 2];
    return {
      members: users.length,
      activeMembers: users.filter(u => u.isActive !== false).length,
      openTasks: tasks.filter(t => t.status !== 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      completedThisWeek: thisWeek.completed,
      completedDelta: thisWeek.completed - lastWeek.completed,
      atCapacity: workload.filter(w => w.percent >= 85).length,
    };
  }, [users, tasks, workload]);

  // Upcoming time off
  const upcomingTimeOff = useMemo(() => {
    return timeOffRequests
      .filter(r => r.status === 'approved' && r.endDate >= TODAY)
      .slice(0, 4);
  }, [timeOffRequests]);

  // Upcoming deadlines (milestones)
  const upcomingDeadlines = useMemo(() => {
    return milestones
      .filter(m => m.status !== 'completed')
      .slice(0, 4);
  }, [milestones]);

  // Pinned announcements first, at most three
  const latestAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned))
      .slice(0, MAX_ANNOUNCEMENTS);
  }, [announcements]);

  const recentActivities = useMemo(() => activities.slice(0, 5), [activities]);
  const recentMembers = useMemo(() => users.slice(0, 6), [users]);

  const kpiCards = [
    {
      label: 'Members', value: kpis.members, href: '/teams/members', icon: Users, iconClass: 'text-flash-deep',
      note: `${kpis.activeMembers} active`,
    },
    {
      label: 'Open tasks', value: kpis.openTasks, href: '/projects/my-tasks', icon: CheckSquare, iconClass: 'text-indigo-500',
      note: `${kpis.inProgress} in progress`,
    },
    {
      label: 'Blocked', value: kpis.blocked, href: '/projects/my-tasks', icon: OctagonAlert, iconClass: 'text-danger',
      note: kpis.blocked === 0 ? 'Nothing blocked' : 'Need attention',
    },
    {
      label: 'Completed this week', value: kpis.completedThisWeek, href: '/projects/my-tasks', icon: CircleCheckBig, iconClass: 'text-emerald-600',
      note: `${kpis.completedDelta >= 0 ? '+' : ''}${kpis.completedDelta} vs last week (demo)`,
    },
    {
      label: 'At capacity', value: kpis.atCapacity, href: '/teams/workload', icon: Gauge, iconClass: 'text-amber-500',
      note: '≥85% of weekly capacity',
    },
    {
      label: 'Upcoming leave', value: upcomingTimeOff.length, href: '/planner/availability', icon: Palmtree, iconClass: 'text-rose-500',
      note: 'Approved absences',
    },
  ];

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
              Teams
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1.5 tracking-tight">
              Team Analytics
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
              Workload, delivery, availability and meetings at a glance.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <button
              onClick={() => setCreateMemberOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-flash-deep" />
              <span>Add Member</span>
            </button>

            {FEATURES.teams && (
              <button
                onClick={() => setCreateTeamOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-flash-deep" />
                <span>Create Team</span>
              </button>
            )}

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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {kpiCards.map(card => (
            <Link
              key={card.label}
              href={card.href}
              className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs hover:border-flash/60 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-muted mb-2 gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">{card.label}</span>
                <card.icon className={`w-4 h-4 shrink-0 group-hover:scale-110 transition-transform ${card.iconClass}`} />
              </div>
              <p className="text-2xl font-extrabold text-ink">{card.value}</p>
              <p className="text-[10px] text-muted mt-1">{card.note}</p>
            </Link>
          ))}
        </div>

        {/* Announcements: one compact row each */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-line flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-flash-deep" />
              Recent Announcements
            </h2>
            <Link
              href="/teams/announcements"
              className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors whitespace-nowrap"
            >
              <span>Announcements Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {latestAnnouncements.length === 0 ? (
            <p className="p-5 text-center text-xs text-muted">No announcements yet. Use Post Announcement to share an update.</p>
          ) : (
            <ul className="divide-y divide-line">
              {latestAnnouncements.map(ann => {
                const author = users.find(u => u.id === ann.authorId);
                return (
                  <li key={ann.id}>
                    <Link
                      href="/teams/announcements"
                      className="px-4 sm:px-5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 hover:bg-mist/20 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0 sm:max-w-[45%] shrink-0">
                        {ann.isPinned && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0">
                            Pinned
                          </span>
                        )}
                        <span className="font-semibold text-xs text-ink group-hover:text-flash-deep transition-colors truncate">
                          {ann.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted truncate flex-1 min-w-0">{ann.content}</p>
                      <span className="text-[10px] text-muted whitespace-nowrap shrink-0">
                        {author?.name || 'Leadership'} · {formatDate(ann.publishedDate)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Delivery trend + workload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskFlowChart className="lg:col-span-2" />

          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-ink">Workload vs capacity</h2>
                <p className="text-xs text-muted">Open task hours against each person&apos;s weekly capacity</p>
              </div>
              <Link href="/teams/workload" className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors whitespace-nowrap">
                Full Board
              </Link>
            </div>

            <div className="space-y-3">
              {workload.slice(0, 6).map(({ user, load, capacity, percent }) => {
                const level = percent >= 85 ? 'over' : percent >= 70 ? 'high' : 'ok';
                return (
                  <div key={user.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-ink truncate">{user.name}</span>
                      <span className="text-muted text-[11px] tabular-nums shrink-0">
                        {load} / {capacity} h · <span className="font-semibold text-ink">{percent}%</span>
                        {level === 'over' && <span className="ml-1 font-semibold text-danger">At capacity</span>}
                      </span>
                    </div>
                    <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${level === 'over' ? 'bg-rose-500' : level === 'high' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
              <span className="text-muted">Need to rebalance tasks?</span>
              <Link href="/teams/workload" className="font-semibold text-flash-deep hover:underline">
                Reassign tasks &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Task status + meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskStatusByMember users={users} tasks={tasks} className="lg:col-span-2" />
          <MeetingLoad users={users} meetings={meetings} weekStart={WEEK_START} weekEnd={WEEK_END} />
        </div>

        {/* Availability, leave, milestones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AvailabilityNow users={users} />

          {/* Upcoming Time Off */}
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
                    <div key={r.id} className="p-2.5 rounded-lg bg-paper border border-line flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MemberAvatar user={member} size="xs" />
                        <div className="truncate">
                          <p className="font-medium text-ink text-xs truncate">{member?.name}</p>
                          <p className="text-[10px] text-muted">{formatDate(r.startDate)} – {formatDate(r.endDate)}</p>
                        </div>
                      </div>
                      <LeaveTypeBadge type={r.leaveType} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Milestones */}
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-ink truncate">{m.name}</p>
                      <span className="text-[10px] text-muted whitespace-nowrap">{formatDate(m.dueDate)}</span>
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
        </div>

        {/* Teams Directory Preview (hidden while the Teams feature is off) */}
        {FEATURES.teams && (
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
        )}

        {/* Team members + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Team Members */}
          <div className="lg:col-span-2 bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
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
              {[recentMembers.slice(0, 3), recentMembers.slice(3, 6)].map((column, ci) => (
                <div key={ci} className="divide-y divide-line">
                  {column.map(member => {
                    const memberTeamNames = (FEATURES.teams && teams
                      .filter(t => member.teamIds?.includes(t.id))
                      .map(t => t.name)
                      .join(', ')) || member.department;
                    const userTaskCount = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done').length;
  
                    return (
                      <div key={member.id} className="p-4 flex items-center justify-between gap-3 hover:bg-mist/20 transition-colors">
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
                          <span className="hidden sm:inline-block text-[11px] text-muted">{userTaskCount} open</span>
                          {member.availability && <AvailabilityBadge status={member.availability} size="sm" />}
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
              ))}
            </div>
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
                    <span className="text-[10px] text-muted">{formatDate(act.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Modals */}
      {FEATURES.teams && <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} />}
      <CreateMemberDialog open={createMemberOpen} onOpenChange={setCreateMemberOpen} />
      <CreateMeetingDialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen} />
      <CreateAnnouncementDialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen} />
    </div>
  );
}
