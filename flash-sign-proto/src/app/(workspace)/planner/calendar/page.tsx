'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  Plus, Video, Palmtree, Flag, CheckSquare, Users, Building2,
  CalendarDays, Filter, ArrowRight, List, Grid, Edit3, Trash2,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge, MeetingStatusBadge } from '@/components/collaboration/collaboration-badges';
import { CreateCalendarEventDialog } from '@/components/collaboration/create-calendar-event-dialog';
import { CreateMeetingDialog } from '@/components/collaboration/create-meeting-dialog';
import { MeetingDetailDrawer } from '@/components/collaboration/meeting-detail-drawer';
import type { CalendarEvent, Meeting } from '@/types';
import { FEATURES } from '@/lib/features';

const CATEGORIES = ['meeting', 'task_deadline', 'milestone', 'time_off', 'team_event'];

function FullCalendarView() {
  const { calendarEvents, meetings, deleteCalendarEvent, users, teams, projects } = useApp();
  // Links such as ?category=time_off open the calendar pre-filtered
  const categoryParam = useSearchParams().get('category');

  const [currentDate, setCurrentDate] = useState(new Date('2026-10-21'));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [categoryFilter, setCategoryFilter] = useState(
    categoryParam && CATEGORIES.includes(categoryParam) ? categoryParam : 'all'
  );
  const [teamFilter, setTeamFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Month / Day navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-10-21'));
  };

  // Month dates generator (42 cells)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 is Sunday
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startOffset);

    return Array.from({ length: 35 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        date: d,
        iso,
        dayNum: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: iso === '2026-10-21',
      };
    });
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
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

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getEventBadgeClass = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-flash/15 text-flash-deep border-flash/30';
      case 'task_deadline':
        return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
      case 'milestone':
        return 'bg-purple-500/15 text-purple-900 border-purple-500/30';
      case 'time_off':
        return 'bg-rose-500/15 text-rose-900 border-rose-500/30';
      case 'team_event':
        return 'bg-blue-500/15 text-blue-900 border-blue-500/30';
      default:
        return 'bg-mist text-ink border-line';
    }
  };

  const handleEventClick = (evt: CalendarEvent) => {
    const meetId = evt.id.replace('evt-meet-', '');
    const foundMeet = meetings.find(m => m.id === meetId || m.id === evt.id);
    if (foundMeet) {
      setSelectedMeeting(foundMeet);
    } else {
      setEventToEdit(evt);
      setCreateEventOpen(true);
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Full Calendar
              </span>
              <span className="text-xs text-muted">Cross-Team Schedules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Organization Calendar
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Interactive timeline view with Month, Week, Day, and Agenda perspectives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateMeetingOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-paper-elevated border border-line hover:bg-mist text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Video className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
            <button
              onClick={() => {
                setEventToEdit(null);
                setCreateEventOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-paper border border-line rounded-lg p-0.5 font-semibold">
              <button
                onClick={handlePrev}
                className="p-1 rounded hover:bg-mist text-muted hover:text-ink transition-colors"
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
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm font-bold text-ink whitespace-nowrap">{monthYearLabel}</h2>
          </div>

          {/* Filters & View Modes */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Categories</option>
              <option value="meeting">Meetings</option>
              <option value="task_deadline">Deadlines</option>
              <option value="milestone">Milestones</option>
              <option value="time_off">Time Off</option>
              <option value="team_event">Team Events</option>
            </select>

            {FEATURES.teams && (
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
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-paper rounded-lg border border-line p-0.5 font-semibold">
              {(['month', 'week', 'day', 'agenda'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded transition-colors capitalize ${
                    viewMode === mode ? 'bg-ink text-white shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Renderers */}
        {viewMode === 'month' && (
          /* Month Grid View */
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
            {/* Days header */}
            <div className="grid grid-cols-7 border-b border-line bg-mist/30 text-center text-xs font-semibold text-muted py-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid 35/42 cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-line min-h-[500px]">
              {monthDays.map(d => {
                const dayEvents = filteredEvents.filter(e => e.startDate.startsWith(d.iso));
                return (
                  <div
                    key={d.iso}
                    className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors ${
                      !d.isCurrentMonth
                        ? 'bg-mist/10 text-muted/60'
                        : d.isToday
                        ? 'bg-flash/5'
                        : 'hover:bg-mist/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          d.isToday ? 'bg-flash text-ink font-black shadow-2xs' : 'text-ink'
                        }`}
                      >
                        {d.dayNum}
                      </span>
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted font-medium">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[85px]">
                      {dayEvents.slice(0, 3).map(evt => (
                        <div
                          key={evt.id}
                          onClick={() => handleEventClick(evt)}
                          className={`px-1.5 py-1 rounded text-[10px] font-medium border truncate cursor-pointer transition-opacity hover:opacity-85 ${getEventBadgeClass(
                            evt.category
                          )}`}
                        >
                          <span className="font-semibold">{evt.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          /* Week View */
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-mist/30 text-center text-xs">
              {weekDays.map(d => (
                <div key={d.iso} className={`p-3 border-r last:border-r-0 border-line ${d.isToday ? 'bg-flash/10' : ''}`}>
                  <p className="text-[10px] uppercase font-semibold text-muted">{d.dayName}</p>
                  <p className={`text-sm font-extrabold mt-0.5 inline-block w-7 h-7 leading-7 rounded-full ${d.isToday ? 'bg-flash text-ink font-black' : 'text-ink'}`}>
                    {d.dayNum}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-h-[400px] divide-x divide-line">
              {weekDays.map(d => {
                const dayEvents = filteredEvents.filter(e => e.startDate.startsWith(d.iso));
                return (
                  <div key={d.iso} className={`p-2 space-y-2 ${d.isToday ? 'bg-flash/5' : ''}`}>
                    {dayEvents.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-2xs transition-all space-y-1 ${getEventBadgeClass(evt.category)}`}
                      >
                        <p className="font-bold text-ink leading-tight truncate">{evt.title}</p>
                        {!evt.allDay && (
                          <p className="text-[10px] opacity-75 font-mono">{evt.startDate.slice(11, 16)}</p>
                        )}
                        <span className="inline-block text-[9px] uppercase font-semibold tracking-wider">
                          {evt.category.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          /* Day View */
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink">
                Schedule for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <span className="text-xs text-muted">
                {filteredEvents.filter(e => e.startDate.startsWith(currentDate.toISOString().split('T')[0])).length} scheduled events
              </span>
            </div>

            <div className="space-y-3">
              {filteredEvents
                .filter(e => e.startDate.startsWith(currentDate.toISOString().split('T')[0]))
                .map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-xs transition-all ${getEventBadgeClass(
                      evt.category
                    )}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{evt.title}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white/40">
                          {evt.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {evt.description || 'No description provided'}
                      </p>
                      {evt.location && <p className="text-[11px] text-muted">Location: {evt.location}</p>}
                    </div>
                    <div className="text-right text-xs font-mono font-bold text-ink">
                      {evt.allDay ? 'All Day' : `${evt.startDate.slice(11, 16)} - ${evt.endDate.slice(11, 16)}`}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {viewMode === 'agenda' && (
          /* Agenda / List View */
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
            <div className="divide-y divide-line">
              {filteredEvents.map(evt => {
                const organizer = users.find(u => u.id === evt.organizerId);
                const team = teams.find(t => t.id === evt.teamId);
                const project = projects.find(p => p.id === evt.projectId);

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-mist/20 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-paper border border-line flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-[10px] text-muted font-mono">{evt.startDate.slice(5, 7)}/{evt.startDate.slice(8, 10)}</span>
                        <span className="font-bold text-xs text-ink">{evt.startDate.slice(11, 16) || 'Day'}</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink truncate">{evt.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getEventBadgeClass(evt.category)}`}>
                            {evt.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-muted truncate">{evt.description || 'No description'}</p>
                        <div className="flex items-center gap-3 pt-0.5 text-[11px] text-muted">
                          {FEATURES.teams && team && <span>Squad: <strong>{team.name}</strong></span>}
                          {project && <span>Project: <strong>{project.name}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteCalendarEvent(evt.id);
                        }}
                        className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Dialogs */}
      <CreateCalendarEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        eventToEdit={eventToEdit}
      />

      <CreateMeetingDialog
        open={createMeetingOpen}
        onOpenChange={setCreateMeetingOpen}
      />

      <MeetingDetailDrawer
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </div>
  );
}

export default function FullCalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading calendar...</div>}>
      <FullCalendarView />
    </Suspense>
  );
}
