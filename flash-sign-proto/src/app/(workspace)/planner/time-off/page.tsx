'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  Info,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { LeaveTypeBadge, TimeOffStatusBadge } from '@/components/collaboration/collaboration-badges';
import { CreateTimeOffDialog } from '@/components/collaboration/create-time-off-dialog';
import { LeaveType, TimeOffStatus } from '@/types/collaboration';

export default function TimeOffManagementPage() {
  const {
    timeOffRequests,
    users,
    teams,
    approveTimeOffRequest,
    declineTimeOffRequest,
    deleteTimeOffRequest
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'declined' | 'calendar'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month navigation for Team Calendar view
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return timeOffRequests.filter(req => {
      // Tab filter
      if (activeTab === 'pending' && req.status !== 'pending') return false;
      if (activeTab === 'approved' && req.status !== 'approved') return false;
      if (activeTab === 'declined' && req.status !== 'declined') return false;

      // Leave type filter
      if (selectedLeaveType !== 'all' && req.leaveType !== selectedLeaveType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const member = users.find(u => u.id === req.memberId);
        const memberName = member?.name.toLowerCase() || '';
        const reason = (req.reason || '').toLowerCase();
        const leave = req.leaveType.toLowerCase();
        if (!memberName.includes(q) && !reason.includes(q) && !leave.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [timeOffRequests, activeTab, selectedLeaveType, searchQuery, users]);

  // Tab counts
  const counts = useMemo(() => {
    const all = timeOffRequests.length;
    const pending = timeOffRequests.filter(r => r.status === 'pending').length;
    const approved = timeOffRequests.filter(r => r.status === 'approved').length;
    const declined = timeOffRequests.filter(r => r.status === 'declined').length;
    return { all, pending, approved, declined };
  }, [timeOffRequests]);

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days = [];
    // Previous month padding
    for (let i = 0; i < startingDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, isoDate: '' });
    }
    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: true, isoDate: dateStr });
    }
    return days;
  }, [calendarDate]);

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

        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/planner" className="hover:text-ink transition-colors">Planning</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Time-Off</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-flash-deep" />
              Time-Off & Leave Planning
            </h1>
            <p className="text-sm text-muted mt-1">
              Review team absence requests, coordinate vacation schedules, and approve planned leaves with auto-calendar sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/planner/time-off/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-sm"
            >
              Full Request Form
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Request Time Off
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Simulated Approvals:</span> Approving a request instantly marks the team member as Out of Office during those dates and creates corresponding calendar blocks on the shared Team Calendar.
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">Total Requests</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.all}</div>
            <p className="text-[11px] text-muted mt-0.5">Recorded this quarter</p>
          </div>

          <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs bg-amber-50/20">
            <span className="text-xs font-medium text-amber-800">Pending Review</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{counts.pending}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Awaiting squad approval</p>
          </div>

          <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs bg-emerald-50/20">
            <span className="text-xs font-medium text-emerald-800">Approved Leaves</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{counts.approved}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Scheduled on calendar</p>
          </div>

          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">Declined</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.declined}</div>
            <p className="text-[11px] text-muted mt-0.5">Not approved or withdrawn</p>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-line/60 pb-3">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'All Requests', count: counts.all },
                { id: 'pending', label: 'Pending', count: counts.pending },
                { id: 'approved', label: 'Approved', count: counts.approved },
                { id: 'declined', label: 'Declined', count: counts.declined },
                { id: 'calendar', label: 'Team Calendar', count: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-paper text-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Leave Type Filter */}
            {activeTab !== 'calendar' && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted" />
                <select
                  value={selectedLeaveType}
                  onChange={e => setSelectedLeaveType(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
                >
                  <option value="all">All Leave Types</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="parental">Parental</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>

          {/* Search Bar for List tabs */}
          {activeTab !== 'calendar' && (
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by member name, leave type, reason..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>
          )}
        </div>

        {/* Content View based on Tab */}
        {activeTab === 'calendar' ? (
          /* Team Time-Off Calendar Matrix */
          <div className="bg-white border border-line/70 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-muted">Monthly overview of scheduled and approved squad leaves</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="p-1.5 rounded-lg border border-line hover:bg-paper text-ink"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-ink"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="p-1.5 rounded-lg border border-line hover:bg-paper text-ink"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-muted py-1 border-b border-line">
                  {d}
                </div>
              ))}

              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div key={idx} className="min-h-24 bg-paper/40 rounded-lg border border-line/40 p-1.5 opacity-40">
                      <span className="text-xs text-muted"></span>
                    </div>
                  );
                }

                // Check leaves on this day
                const dayLeaves = timeOffRequests.filter(
                  req => req.status === 'approved' && cell.isoDate >= req.startDate && cell.isoDate <= req.endDate
                );

                const isToday = cell.isoDate === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={cell.isoDate}
                    className={`min-h-24 rounded-lg border p-1.5 flex flex-col justify-between transition-colors ${
                      isToday
                        ? 'border-flash bg-flash/5 ring-1 ring-flash'
                        : 'border-line/70 bg-white hover:border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isToday ? 'text-flash-deep font-bold' : 'text-ink'}`}>
                        {cell.dayNumber}
                      </span>
                      {dayLeaves.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                      {dayLeaves.map(leave => {
                        const m = users.find(u => u.id === leave.memberId);
                        return (
                          <div
                            key={leave.id}
                            className="p-1 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] leading-tight truncate"
                            title={`${m?.name || 'Member'}: ${leave.leaveType} leave`}
                          >
                            <span className="font-semibold">{m?.name.split(' ')[0]}:</span> {leave.leaveType}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Request List Table */
          <div className="bg-white border border-line/70 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-64">Team Member</th>
                    <th className="py-3 px-3">Leave Type</th>
                    <th className="py-3 px-3">Date Range</th>
                    <th className="py-3 px-3 text-center">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Notes / Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-xs">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted">
                        No time-off requests found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => {
                      const member = users.find(u => u.id === req.memberId);
                      return (
                        <tr key={req.id} className="hover:bg-paper/40 transition-colors">
                          {/* Member */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {member && <MemberAvatar user={member} size="sm" />}
                              <div>
                                <Link
                                  href={`/teams/members/${req.memberId}`}
                                  className="font-semibold text-ink hover:text-flash-deep text-xs block"
                                >
                                  {member?.name || 'Unknown Member'}
                                </Link>
                                <span className="text-[11px] text-muted">{member?.role || 'Contributor'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Leave Type */}
                          <td className="py-3.5 px-3">
                            <LeaveTypeBadge type={req.leaveType} />
                          </td>

                          {/* Date Range */}
                          <td className="py-3.5 px-3">
                            <div className="font-mono text-ink text-xs font-medium">
                              {req.startDate} → {req.endDate}
                            </div>
                            {req.isPartialDay && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium mt-0.5 inline-block">
                                Partial Day
                              </span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-3 text-center font-bold text-ink">
                            {req.durationDays} {req.durationDays === 1 ? 'day' : 'days'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <TimeOffStatusBadge status={req.status} />
                          </td>

                          {/* Notes */}
                          <td className="py-3.5 px-3 max-w-xs truncate text-muted" title={req.reason || req.notes}>
                            {req.reason || req.notes || <span className="italic text-muted/60">No notes provided</span>}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      approveTimeOffRequest(req.id);
                                      showToast(`Approved leave request for ${member?.name}`);
                                    }}
                                    className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1"
                                    title="Approve Request"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      declineTimeOffRequest(req.id);
                                      showToast(`Declined leave request for ${member?.name}`);
                                    }}
                                    className="px-2 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
                                    title="Decline Request"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    Decline
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Cancel and delete this time-off request?')) {
                                    deleteTimeOffRequest(req.id);
                                    showToast('Time-off entry deleted.');
                                  }
                                }}
                                className="p-1 hover:bg-rose-50 text-muted hover:text-rose-600 rounded transition-colors"
                                title="Delete / Cancel Request"
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

        {/* Modal Dialog */}
        <CreateTimeOffDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
