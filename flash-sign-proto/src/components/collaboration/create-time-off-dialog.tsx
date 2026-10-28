'use client';

import React, { useState, useMemo } from 'react';
import { X, Palmtree, Calendar, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { TimeOffRequest, LeaveType } from '@/types';
import { ClientPortal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

interface CreateTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestToEdit?: TimeOffRequest | null;
  defaultMemberId?: string;
  onSuccess?: (req: TimeOffRequest) => void;
}

const LEAVE_TYPES: { id: LeaveType; label: string; desc: string }[] = [
  { id: 'vacation', label: 'Paid Vacation', desc: 'Planned rest, travel, and personal recharge' },
  { id: 'sick', label: 'Sick Leave', desc: 'Medical appointment, recovery, or illness' },
  { id: 'personal', label: 'Personal Absence', desc: 'Family responsibilities, moving, or emergency' },
  { id: 'parental', label: 'Parental Leave', desc: 'Care for newborn or newly placed child' },
  { id: 'unpaid', label: 'Unpaid Leave', desc: 'Sabbatical or approved personal leave' },
  { id: 'other', label: 'Other', desc: 'Jury duty, bereavement, or special civic leave' },
];

export function CreateTimeOffDialog({
  open,
  onOpenChange,
  requestToEdit,
  defaultMemberId,
  onSuccess,
}: CreateTimeOffDialogProps) {
  const { users, timeOffRequests, addTimeOffRequest, updateTimeOffRequest, currentUserId } = useApp();

  const [memberId, setMemberId] = useState(
    requestToEdit?.memberId || defaultMemberId || currentUserId
  );
  const [leaveType, setLeaveType] = useState<LeaveType>(requestToEdit?.leaveType || 'vacation');
  const [startDate, setStartDate] = useState(requestToEdit?.startDate || '2026-10-26');
  const [endDate, setEndDate] = useState(requestToEdit?.endDate || '2026-10-30');
  const [isPartialDay, setIsPartialDay] = useState(requestToEdit?.isPartialDay || false);
  const [reason, setReason] = useState(requestToEdit?.reason || '');
  const [notes, setNotes] = useState(requestToEdit?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate duration in working days (excluding weekends)
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (isPartialDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  }, [startDate, endDate, isPartialDay]);

  // Check overlap with existing approved/pending time-off for this member
  const overlapWarning = useMemo(() => {
    if (!memberId || !startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);

    const existing = timeOffRequests.find(r => {
      if (r.memberId !== memberId) return false;
      if (r.id === requestToEdit?.id) return false;
      if (r.status === 'declined') return false;

      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);
      return Math.max(s.getTime(), rStart.getTime()) <= Math.min(e.getTime(), rEnd.getTime());
    });

    if (existing) {
      return `Warning: Member already has ${existing.status} ${existing.leaveType} from ${existing.startDate} to ${existing.endDate}`;
    }
    return null;
  }, [memberId, startDate, endDate, timeOffRequests, requestToEdit]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please choose start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date');
      return;
    }

    const memberName = users.find(u => u.id === memberId)?.name || 'member';

    if (requestToEdit) {
      updateTimeOffRequest(requestToEdit.id, {
        memberId,
        leaveType,
        startDate,
        endDate,
        durationDays,
        isPartialDay,
        reason: reason.trim(),
        notes: notes.trim(),
      });
      setSuccessMsg('Time-off request updated!');
      notify(`Changes to time-off request for ${memberName} saved`);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...requestToEdit, leaveType, startDate, endDate });
      }, 700);
    } else {
      addTimeOffRequest({
        memberId,
        leaveType,
        startDate,
        endDate,
        durationDays,
        isPartialDay,
        reason: reason.trim(),
        notes: notes.trim(),
        status: 'pending',
      });
      setSuccessMsg('Time-off request submitted successfully!');
      notify(`Time-off request for ${memberName} submitted`);
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
              <Palmtree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {requestToEdit ? 'Edit Time-Off Request' : 'Request Time Off'}
              </h2>
              <p className="text-xs text-muted">
                Submit planned vacation, medical leave, or personal absence.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {overlapWarning && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{overlapWarning}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Member */}
          <div>
            <label className="block font-semibold text-ink mb-1">Team Member</label>
            <select
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.title || u.role} ({u.department})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">Leave Type</label>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_TYPES.map(lt => {
                const isSelected = leaveType === lt.id;
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => setLeaveType(lt.id)}
                    className={`p-2 rounded-lg text-left transition-colors border ${
                      isSelected
                        ? 'bg-flash/10 border-flash/40 text-ink font-semibold'
                        : 'bg-paper border-line text-muted hover:text-ink'
                    }`}
                  >
                    <p className="text-xs font-semibold">{lt.label}</p>
                    <p className="text-[10px] text-muted truncate">{lt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>
          </div>

          {/* Partial Day toggle & Duration Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-mist/30 border border-line">
            <label className="flex items-center gap-2 cursor-pointer text-ink font-medium">
              <input
                type="checkbox"
                checked={isPartialDay}
                onChange={e => setIsPartialDay(e.target.checked)}
                className="rounded accent-flash text-flash"
              />
              <span>Half-Day / Partial Absence</span>
            </label>
            <div className="text-right">
              <span className="text-xs text-muted">Estimated Duration:</span>
              <p className="text-sm font-bold text-flash-deep">{durationDays} business day(s)</p>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block font-semibold text-ink mb-1">Reason / Note (Optional)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Family vacation, coverage arranged with Priya."
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-semibold shadow-xs transition-colors"
            >
              {requestToEdit ? 'Save Changes' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
