'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Video, Palmtree, Flag, CheckSquare, Users, Building2,
  CalendarDays, Filter, ArrowRight, ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge, LeaveTypeBadge, MeetingStatusBadge } from '@/components/collaboration/collaboration-badges';
import { CreateMeetingDialog } from '@/components/collaboration/create-meeting-dialog';
import { CreateTimeOffDialog } from '@/components/collaboration/create-time-off-dialog';
import { CreateCalendarEventDialog } from '@/components/collaboration/create-calendar-event-dialog';
import { CreateMilestoneDialog } from '@/components/collaboration/create-milestone-dialog';
import { MeetingDetailDrawer } from '@/components/collaboration/meeting-detail-drawer';
import type { CalendarEvent, Meeting } from '@/types';

export default function PlannerOverviewPage() {
  const {
    calendarEvents, meetings, timeOffRequests, milestones, tasks,
    users, teams, currentUserId,
  } = useApp();

  // Navigation date
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-21'));
  const [view, setView] = useState<'week' | 'month' | 'day'>('week');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');

  // Modals
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [createTimeOffOpen, setCreateTimeOffOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Date navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() - 1);
    else if (view === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (view === 'month') next.setMonth(next.getMonth() + 1);
    else if (view === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-10-21'));
  };

  // Week days calculation
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    start.setDate(diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: iso === '2026-10-21',
      };
    });
  }, [currentDate]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(evt => {
      const matchesCat = categoryFilter === 'all' || evt.category === categoryFilter;
      const matchesTeam = teamFilter === 'all' || evt.teamId === teamFilter;
      const matchesMember =
        memberFilter === 'all' ||
        evt.organizerId === memberFilter ||
        (evt.attendeeIds && evt.attendeeIds.includes(memberFilter));
      return matchesCat && matchesTeam && matchesMember;
    });
  }, [calendarEvents, categoryFilter, teamFilter, memberFilter]);

  // Upcoming meetings
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => m.status !== 'cancelled' && m.date >= '2026-10-21')
      .slice(0, 4);
  }, [meetings]);

  // Upcoming time-off
  const upcomingTimeOff = useMemo(() => {
    return timeOffRequests
      .filter(r => r.status === 'approved' && r.endDate >= '2026-10-21')
      .slice(0, 4);
  }, [timeOffRequests]);

  // Upcoming deadlines
  const upcomingMilestones = useMemo(() => {
    return milestones
      .filter(m => m.status !== 'completed')
      .slice(0, 4);
  }, [milestones]);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header & Quick Create */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Planning Center
              </span>
              <span className="text-xs text-muted">Tasks, Milestones, Meetings & Availability</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Planner Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Unified cross-project timeline tracking sprint milestones, meeting schedules, and team time-off.
            </p>
          </div>

          {/* Quick Actions Dropdown / Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCreateMeetingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Video className="w-3.5 h-3.5 text-flash-deep" />
              <span>Schedule Meeting</span>
            </button>

            <button
              onClick={() => setCreateTimeOffOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
              <span>Request Leave</span>
            </button>

            <button
              onClick={() => setCreateMilestoneOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
            >
              <Flag className="w-3.5 h-3.5 text-purple-600" />
              <span>Add Milestone</span>
            </button>

            <button
              onClick={() => setCreateEventOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Calendar Control Toolbar */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-paper border border-line rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 rounded hover:bg-mist text-muted hover:text-ink transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold hover:bg-mist rounded text-ink transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded hover:bg-mist text-muted hover:text-ink transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm font-bold text-ink whitespace-nowrap">{monthYearLabel}</h2>
          </div>

          {/* Filters & View switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Events</option>
              <option value="meeting">Meetings</option>
              <option value="task_deadline">Deadlines</option>
              <option value="milestone">Milestones</option>
              <option value="time_off">Time Off</option>
              <option value="team_event">Team Events</option>
            </select>

            {/* Squad filter */}
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Squads</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-paper rounded-lg border border-line p-0.5 font-semibold">
              <button
                onClick={() => setView('day')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  view === 'day' ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  view === 'week' ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  view === 'month' ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                Month
              </button>
            </div>

            <Link
              href="/planner/calendar"
              className="px-3 py-1.5 rounded-lg bg-mist/60 hover:bg-line text-ink font-semibold flex items-center gap-1 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5 text-flash-deep" />
              <span>Full Calendar</span>
            </Link>
          </div>
        </div>

        {/* Weekly Schedule Grid Preview */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-mist/30 text-center text-xs">
            {weekDays.map(d => (
              <div
                key={d.iso}
                className={`p-2.5 sm:p-3 border-r last:border-r-0 border-line ${
                  d.isToday ? 'bg-flash/10' : ''
                }`}
              >
                <p className="text-[10px] uppercase font-semibold text-muted">{d.dayName}</p>
                <p
                  className={`text-sm font-extrabold mt-0.5 inline-block w-7 h-7 leading-7 rounded-full ${
                    d.isToday ? 'bg-flash text-ink font-black' : 'text-ink'
                  }`}
                >
                  {d.dayNum}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 min-h-[220px] divide-x divide-line">
            {weekDays.map(d => {
              const dayEvents = filteredEvents.filter(e => e.startDate.startsWith(d.iso));
              return (
                <div
                  key={d.iso}
                  className={`p-1.5 sm:p-2 space-y-1.5 text-xs ${
                    d.isToday ? 'bg-flash/5' : ''
                  }`}
                >
                  {dayEvents.map(evt => {
                    const categoryColors: Record<string, string> = {
                      meeting: 'bg-flash/20 text-ink border-flash/40',
                      task_deadline: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
                      milestone: 'bg-purple-500/15 text-purple-900 border-purple-500/30',
                      time_off: 'bg-rose-500/15 text-rose-900 border-rose-500/30',
                      team_event: 'bg-blue-500/15 text-blue-900 border-blue-500/30',
                    };
                    const colorStyle = categoryColors[evt.category] || 'bg-mist text-ink border-line';

                    return (
                      <div
                        key={evt.id}
                        onClick={() => {
                          const matchingMeeting = meetings.find(m => m.id === evt.id.replace('evt-meet-', ''));
                          if (matchingMeeting) setSelectedMeeting(matchingMeeting);
                        }}
                        className={`p-1.5 rounded-md border text-[11px] font-medium leading-tight cursor-pointer hover:opacity-90 transition-opacity truncate ${colorStyle}`}
                        title={`${evt.title} (${evt.category.replace('_', ' ')})`}
                      >
                        <p className="truncate font-semibold">{evt.title}</p>
                        {!evt.allDay && (
                          <p className="text-[9px] opacity-75 font-mono">
                            {evt.startDate.slice(11, 16)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lower 3 Columns: Upcoming Meetings, Absences, Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upcoming Meetings */}
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-flash-deep" />
                <h3 className="text-sm font-bold text-ink">Upcoming Meetings</h3>
              </div>
              <Link href="/planner/meetings" className="text-xs font-semibold text-flash-deep hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingMeetings.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className="p-3 rounded-lg bg-paper border border-line hover:border-flash/60 cursor-pointer transition-colors space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink truncate">{m.title}</p>
                    <MeetingStatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>{m.date} at {m.startTime}</span>
                    <span>{m.durationMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Time Off */}
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-ink">Scheduled Time Off</h3>
              </div>
              <Link href="/planner/time-off" className="text-xs font-semibold text-flash-deep hover:underline">
                Leave Calendar
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingTimeOff.map(r => {
                const member = users.find(u => u.id === r.memberId);
                return (
                  <div key={r.id} className="p-3 rounded-lg bg-paper border border-line space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemberAvatar user={member} size="xs" />
                        <span className="font-bold text-ink">{member?.name}</span>
                      </div>
                      <LeaveTypeBadge type={r.leaveType} />
                    </div>
                    <p className="text-[11px] text-muted">
                      {r.startDate} to {r.endDate} ({r.durationDays} days)
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-ink">Target Milestones</h3>
              </div>
              <Link href="/planner/milestones" className="text-xs font-semibold text-flash-deep hover:underline">
                Roadmap
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingMilestones.map(m => (
                <div key={m.id} className="p-3 rounded-lg bg-paper border border-line space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink truncate">{m.name}</p>
                    <span className="font-mono text-[10px] font-bold text-flash-deep">{m.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Due: {m.dueDate}</span>
                    <span className="capitalize">{m.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Modals */}
      <CreateMeetingDialog open={createMeetingOpen} onOpenChange={setCreateMeetingOpen} />
      <CreateTimeOffDialog open={createTimeOffOpen} onOpenChange={setCreateTimeOffOpen} />
      <CreateCalendarEventDialog open={createEventOpen} onOpenChange={setCreateEventOpen} />
      <CreateMilestoneDialog open={createMilestoneOpen} onOpenChange={setCreateMilestoneOpen} />
      <MeetingDetailDrawer meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
    </div>
  );
}
