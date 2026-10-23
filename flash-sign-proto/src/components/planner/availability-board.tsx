'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Globe,
  Filter,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge } from '@/components/collaboration/collaboration-badges';
import { AvailabilityStatus } from '@/types/collaboration';
import { FEATURES } from '@/lib/features';

/** Team availability: status summary, weekly schedule grid and member detail modal. */
export function AvailabilityBoard() {
  const {
    users,
    teams,
    meetings,
    timeOffRequests,
    calendarEvents,
    updateMemberAvailability
  } = useApp();

  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Compute days for current view
  const currentDays = useMemo(() => {
    const today = new Date();
    // Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + currentWeekOffset * 7);

    const days = [];
    const count = viewMode === 'day' ? 1 : 5; // 5 working days Monday-Friday

    for (let i = 0; i < count; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        date: d,
        isoString: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday
      });
    }
    return days;
  }, [viewMode, currentWeekOffset]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return users.filter(user => {
      if (selectedTeamId !== 'all' && !(user.teamIds || []).includes(selectedTeamId)) {
        return false;
      }
      if (selectedStatus !== 'all' && user.availability !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesRole = user.role.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesEmail) return false;
      }
      return true;
    });
  }, [users, selectedTeamId, selectedStatus, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const available = users.filter(u => (u.availability || 'available') === 'available').length;
    const busy = users.filter(u => u.availability === 'busy').length;
    const focusTime = users.filter(u => u.availability === 'focus_time').length;
    const outOfOffice = users.filter(u => u.availability === 'out_of_office').length;
    return { available, busy, focusTime, outOfOffice, total: users.length };
  }, [users]);

  // Helper to check member commitments on a specific day
  const getMemberDayCommitments = (memberId: string, isoDate: string) => {
    // Check approved time off
    const timeOff = timeOffRequests.find(t => 
      t.memberId === memberId &&
      t.status === 'approved' &&
      isoDate >= t.startDate &&
      isoDate <= t.endDate
    );

    // Check meetings
    const memberMeetings = meetings.filter(m => 
      m.date === isoDate &&
      m.status !== 'cancelled' &&
      (m.organizerId === memberId || m.participantIds.includes(memberId))
    );

    // Check all-day calendar events
    const memberEvents = calendarEvents.filter(e =>
      e.startDate.startsWith(isoDate) &&
      (e.attendeeIds?.includes(memberId) || e.organizerId === memberId)
    );

    return { timeOff, meetings: memberMeetings, events: memberEvents };
  };

  const selectedMember = useMemo(() => {
    return users.find(u => u.id === selectedMemberId);
  }, [users, selectedMemberId]);

  return (
    <div className="space-y-6">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedStatus(selectedStatus === 'available' ? 'all' : 'available')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedStatus === 'available'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-line/70 hover:border-line hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted">Available</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.available}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Ready for tasks & collaboration</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'busy' ? 'all' : 'busy')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedStatus === 'busy'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-line/70 hover:border-line hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted">Busy / In Meetings</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.busy}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">In scheduled sessions</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'focus_time' ? 'all' : 'focus_time')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedStatus === 'focus_time'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
              : 'bg-white border-line/70 hover:border-line hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted">Focus Time</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.focusTime}</div>
          <p className="text-[11px] text-indigo-700 font-medium mt-1">Deep work block</p>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'out_of_office' ? 'all' : 'out_of_office')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedStatus === 'out_of_office'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-line/70 hover:border-line hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted">Out of Office</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.outOfOffice}</div>
          <p className="text-[11px] text-rose-700 font-medium mt-1">Approved leave or travel</p>
        </button>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-line/70 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search member by name, role, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>

          {/* View Mode & Week Nav */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-line rounded-lg bg-paper p-0.5">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'day' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Day View
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'week' ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Week View
              </button>
            </div>

            {/* Offset Nav */}
            <div className="flex items-center gap-1 border border-line rounded-lg bg-white px-2 py-1">
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                title="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="px-2 py-0.5 text-xs font-medium text-ink hover:bg-paper rounded"
              >
                {currentWeekOffset === 0 ? 'This Week' : `${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}w`}
              </button>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                title="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filters */}
        {(FEATURES.teams || selectedStatus !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40 text-xs">
          {FEATURES.teams && (
            <>
              <span className="text-muted font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter Squad:
              </span>
              <button
                onClick={() => setSelectedTeamId('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedTeamId === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-paper text-muted hover:text-ink border border-line/60'
                }`}
              >
                All Squads
              </button>
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedTeamId === t.id
                      ? 'bg-ink text-white'
                      : 'bg-paper text-muted hover:text-ink border border-line/60'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </>
          )}

          {selectedStatus !== 'all' && (
            <button
              onClick={() => setSelectedStatus('all')}
              className="ml-auto text-xs text-flash-deep hover:underline font-medium"
            >
              Clear status filter ({selectedStatus.replace('_', ' ')})
            </button>
          )}
        </div>
        )}
      </div>

      {/* Availability Schedule Grid */}
      <div className="bg-white border border-line/70 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="py-3 px-4 w-72">Team Member</th>
                <th className="py-3 px-3 w-40">Status & Working Hours</th>
                {currentDays.map(day => (
                  <th
                    key={day.isoString}
                    className={`py-3 px-3 text-center ${
                      day.isToday ? 'bg-flash/10 text-flash-deep font-bold border-x border-flash/30' : ''
                    }`}
                  >
                    <div>{day.dayName}</div>
                    <div className="text-[10px] font-normal lowercase">{day.formatted}</div>
                  </th>
                ))}
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-xs">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={3 + currentDays.length} className="py-12 text-center text-muted">
                    No team members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const memberTeams = FEATURES.teams ? teams.filter(t => (member.teamIds || []).includes(t.id)) : [];
                  return (
                    <tr key={member.id} className="hover:bg-paper/40 transition-colors">
                      {/* Member Profile Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar user={member} size="md" />
                          <div className="min-w-0">
                            <Link
                              href={`/teams/members/${member.id}`}
                              className="font-semibold text-ink hover:text-flash-deep truncate block text-xs"
                            >
                              {member.name}
                            </Link>
                            <div className="text-[11px] text-muted truncate">{member.role}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {memberTeams.slice(0, 2).map(t => (
                                <span
                                  key={t.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-mist/40 text-ink-soft border border-line/40"
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Working Hours */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AvailabilityBadge status={member.availability || 'available'} />
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-muted/80" />
                            09:00 - 17:00
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-1">
                            <Globe className="w-3 h-3 text-muted/80" />
                            EST (UTC-5)
                          </div>
                        </div>
                      </td>

                      {/* Day Slots */}
                      {currentDays.map(day => {
                        const { timeOff, meetings: dayMeetings } = getMemberDayCommitments(member.id, day.isoString);

                        let cellContent = null;
                        if (timeOff) {
                          cellContent = (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-md p-1.5 text-[10px] font-medium leading-tight text-center">
                              <span className="block font-bold">Leave: {timeOff.leaveType}</span>
                              <span className="text-[9px] opacity-80">{timeOff.durationDays}d approved</span>
                            </div>
                          );
                        } else if (dayMeetings.length > 0) {
                          cellContent = (
                            <div className="space-y-1">
                              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-1.5 text-[10px] text-left leading-tight">
                                <div className="font-semibold truncate">{dayMeetings[0].title}</div>
                                <div className="text-[9px] text-amber-600 font-mono">
                                  {dayMeetings[0].startTime} ({dayMeetings.length} mtr)
                                </div>
                              </div>
                              {dayMeetings.length > 1 && (
                                <div className="text-[9px] text-muted text-center font-medium">
                                  +{dayMeetings.length - 1} more session
                                </div>
                              )}
                            </div>
                          );
                        } else if (member.availability === 'focus_time') {
                          cellContent = (
                            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md p-1.5 text-[10px] text-center font-medium">
                              Focus Block (4h)
                            </div>
                          );
                        } else {
                          cellContent = (
                            <div className="text-center py-2 text-[11px] text-emerald-700 font-medium">
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                                8h Free
                              </span>
                            </div>
                          );
                        }

                        return (
                          <td
                            key={day.isoString}
                            className={`py-3.5 px-2 align-middle ${
                              day.isToday ? 'bg-flash/5 border-x border-flash/20' : ''
                            }`}
                          >
                            {cellContent}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedMemberId(member.id)}
                          className="text-xs text-flash-deep hover:underline font-semibold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Schedule Detail Modal / Drawer */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="bg-white border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <MemberAvatar user={selectedMember} size="lg" />
                <div>
                  <h3 className="text-lg font-bold text-ink">{selectedMember.name}</h3>
                  <p className="text-xs text-muted">{selectedMember.role} • {selectedMember.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="p-1 rounded-lg hover:bg-paper text-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            {/* Status Update Quick Controls */}
            <div className="p-3.5 bg-paper rounded-xl border border-line space-y-2">
              <span className="text-xs font-semibold text-ink block">Update Availability Status:</span>
              <div className="grid grid-cols-2 gap-2">
                {(['available', 'busy', 'focus_time', 'out_of_office'] as AvailabilityStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      updateMemberAvailability(selectedMember.id, st);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                      (selectedMember.availability || 'available') === st
                        ? 'bg-ink text-white border-ink'
                        : 'bg-white text-ink border-line hover:border-flash'
                    }`}
                  >
                    <span className="capitalize">{st.replace('_', ' ')}</span>
                    {(selectedMember.availability || 'available') === st && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-flash" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Working Hours & Capacity */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-line rounded-xl">
                <span className="text-muted block text-[11px] mb-1">Working Hours</span>
                <span className="font-semibold text-ink font-mono">09:00 AM - 05:00 PM</span>
                <span className="text-[10px] text-muted block mt-0.5">Timezone: UTC-5 (EST)</span>
              </div>
              <div className="p-3 bg-white border border-line rounded-xl">
                <span className="text-muted block text-[11px] mb-1">Weekly Commitment</span>
                <span className="font-semibold text-ink">{selectedMember.weeklyCapacity || 40} Hours</span>
                <span className="text-[10px] text-muted block mt-0.5">Full-time Core Squad</span>
              </div>
            </div>

            {/* Upcoming Leaves */}
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Upcoming Approved Leaves</h4>
              <div className="space-y-1.5">
                {timeOffRequests
                  .filter(t => t.memberId === selectedMember.id && t.status === 'approved')
                  .slice(0, 3)
                  .map(t => (
                    <div key={t.id} className="p-2.5 rounded-lg border border-line bg-paper/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold capitalize text-ink">{t.leaveType} Leave</span>
                        <p className="text-[11px] text-muted">{t.startDate} to {t.endDate} ({t.durationDays} days)</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Approved
                      </span>
                    </div>
                  ))}
                {timeOffRequests.filter(t => t.memberId === selectedMember.id && t.status === 'approved').length === 0 && (
                  <p className="text-xs text-muted italic">No upcoming scheduled leave requests.</p>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
              <Link
                href={`/teams/members/${selectedMember.id}`}
                className="text-flash-deep hover:underline font-semibold flex items-center gap-1"
              >
                View Full Profile <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-ink-soft transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
