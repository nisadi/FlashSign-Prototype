'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Trash2, Filter, Search } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { LeaveTypeBadge, TimeOffStatusBadge } from '@/components/collaboration/collaboration-badges';

type StatusTab = 'all' | 'pending' | 'approved' | 'declined';

/** Time-off request list with status tabs, filters and approve / decline actions. */
export function TimeOffRequests() {
  const {
    timeOffRequests,
    users,
    approveTimeOffRequest,
    declineTimeOffRequest,
    deleteTimeOffRequest
  } = useApp();

  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const tabs: { id: StatusTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Requests', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'declined', label: 'Declined', count: counts.declined },
  ];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-flash" />
          {toastMessage}
        </div>
      )}

      {/* Status tabs & filters */}
      <div className="bg-white border border-line/70 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.id === 'pending' && tab.count > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-paper text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search member, leave type, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={selectedLeaveType}
              onChange={e => setSelectedLeaveType(e.target.value)}
              aria-label="Filter by leave type"
              className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
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
        </div>
      </div>

      {/* Request List Table */}
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
    </div>
  );
}
