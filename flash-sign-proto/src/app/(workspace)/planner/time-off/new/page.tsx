'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Info,
  Send
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { LeaveType, TimeOffStatus } from '@/types/collaboration';

export default function NewTimeOffRequestPage() {
  const router = useRouter();
  const { users, timeOffRequests, addTimeOffRequest } = useApp();

  const [memberId, setMemberId] = useState(users[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 11);
    return d.toISOString().split('T')[0];
  });
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<TimeOffStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate working days (excluding weekends)
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    if (isPartialDay) return 0.5;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        // Monday-Friday
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, isPartialDay]);

  // Check for conflicts
  const conflicts = useMemo(() => {
    if (!memberId || !startDate || !endDate) return [];
    return timeOffRequests.filter(
      r =>
        r.memberId === memberId &&
        r.status !== 'declined' &&
        !(endDate < r.startDate || startDate > r.endDate)
    );
  }, [memberId, startDate, endDate, timeOffRequests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId) {
      setError('Please select a team member.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please specify start and end dates.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot precede start date.');
      return;
    }
    if (durationDays <= 0) {
      setError('Selected range has 0 working days.');
      return;
    }

    addTimeOffRequest({
      memberId,
      leaveType,
      startDate,
      endDate,
      durationDays,
      isPartialDay,
      reason: reason.trim(),
      status
    });

    setIsSubmitted(true);
    setTimeout(() => {
      router.push('/planner/time-off');
    }, 1200);
  };

  const selectedMember = users.find(u => u.id === memberId);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/planner/time-off"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Time-Off Management
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-flash-deep" />
            Request Time Off
          </h1>
          <p className="text-sm text-muted mt-1">
            Submit a leave request for vacations, medical appointments, or personal time away from sprint tasks.
          </p>
        </div>

        {/* Prototype banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Calculation Rules:</span> Duration is automatically computed based on Monday–Friday business days. Setting status to &ldquo;Approved&rdquo; immediately marks the member as Out of Office on the Team Calendar and Availability matrix.
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white border border-emerald-300 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">Time-Off Request Submitted!</h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              Your leave request for <strong>{durationDays} working {durationDays === 1 ? 'day' : 'days'}</strong> has been recorded in the prototype schedule. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Overlap Warning */}
            {conflicts.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Overlapping Absence Detected
                </div>
                <p className="text-[11px] text-amber-800">
                  {selectedMember?.name} already has an existing leave ({conflicts[0].leaveType}) from {conflicts[0].startDate} to {conflicts[0].endDate}.
                </p>
              </div>
            )}

            {/* Team Member Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Team Member <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-line rounded-xl">
                {users.map(u => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => setMemberId(u.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                      memberId === u.id
                        ? 'bg-flash/10 border-flash ring-1 ring-flash'
                        : 'border-line/60 hover:bg-paper'
                    }`}
                  >
                    <MemberAvatar user={u} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">{u.name}</div>
                      <div className="text-[10px] text-muted truncate">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Leave Type <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'vacation', label: 'Vacation' },
                  { id: 'sick', label: 'Sick' },
                  { id: 'personal', label: 'Personal' },
                  { id: 'parental', label: 'Parental' },
                  { id: 'unpaid', label: 'Unpaid' },
                  { id: 'other', label: 'Other' }
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setLeaveType(item.id as LeaveType)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${
                      leaveType === item.id
                        ? 'bg-ink text-white border-ink shadow-xs'
                        : 'bg-paper text-muted hover:text-ink border-line'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range & Duration Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Start Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  End Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                  required
                />
              </div>
            </div>

            {/* Partial Day Checkbox & Working Days calculation */}
            <div className="p-4 bg-paper rounded-xl border border-line/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink select-none">
                <input
                  type="checkbox"
                  checked={isPartialDay}
                  onChange={e => setIsPartialDay(e.target.checked)}
                  className="w-4 h-4 rounded text-flash focus:ring-flash"
                />
                <span>Partial Day Leave (Half-day absence)</span>
              </label>

              <div className="text-right">
                <span className="text-xs text-muted block">Calculated Working Days:</span>
                <span className="text-lg font-bold text-ink">
                  {durationDays} {durationDays === 1 ? 'business day' : 'business days'}
                </span>
              </div>
            </div>

            {/* Reason / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Reason or Handover Notes
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Provide context, coverage details, or sprint handoff instructions..."
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* Initial Status selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Initial Status
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'pending'}
                    onChange={() => setStatus('pending')}
                    className="text-flash focus:ring-flash"
                  />
                  <span>Submit as Pending (Awaiting squad lead review)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'approved'}
                    onChange={() => setStatus('approved')}
                    className="text-flash focus:ring-flash"
                  />
                  <span>Pre-approved (Direct schedule entry)</span>
                </label>
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <Link
                href="/planner/time-off"
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Submit Leave Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
