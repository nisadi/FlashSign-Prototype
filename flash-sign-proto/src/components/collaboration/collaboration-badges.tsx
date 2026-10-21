'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type {
  AvailabilityStatus,
  LeaveType,
  TimeOffStatus,
  MeetingStatus,
  AnnouncementPriority,
} from '@/types';

// ── Availability Badge ────────────────────────────────────────────────────────
interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export function AvailabilityBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: AvailabilityBadgeProps) {
  const configs: Record<AvailabilityStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
    available: {
      label: 'Available',
      dot: 'bg-emerald-500 animate-pulse',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-700',
      border: 'border-emerald-500/20',
    },
    busy: {
      label: 'Busy',
      dot: 'bg-amber-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-700',
      border: 'border-amber-500/20',
    },
    focus_time: {
      label: 'Focus Time',
      dot: 'bg-indigo-500',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-700',
      border: 'border-indigo-500/20',
    },
    out_of_office: {
      label: 'Out of Office',
      dot: 'bg-rose-500',
      bg: 'bg-rose-500/10',
      text: 'text-rose-700',
      border: 'border-rose-500/20',
    },
  };

  const cfg = configs[status] || configs.available;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />}
      <span>{cfg.label}</span>
    </span>
  );
}

// ── Leave Type Badge ──────────────────────────────────────────────────────────
export function LeaveTypeBadge({
  type,
  className,
}: {
  type: LeaveType;
  className?: string;
}) {
  const configs: Record<LeaveType, { label: string; bg: string; text: string; border: string }> = {
    vacation: { label: 'Vacation', bg: 'bg-teal-500/10', text: 'text-teal-700', border: 'border-teal-500/20' },
    sick: { label: 'Sick Leave', bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-500/20' },
    personal: { label: 'Personal', bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/20' },
    parental: { label: 'Parental', bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20' },
    unpaid: { label: 'Unpaid Leave', bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20' },
    other: { label: 'Other Absence', bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20' },
  };

  const cfg = configs[type] || configs.other;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Time Off Status Badge ─────────────────────────────────────────────────────
export function TimeOffStatusBadge({
  status,
  className,
}: {
  status: TimeOffStatus;
  className?: string;
}) {
  const configs: Record<TimeOffStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Pending Review', bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20' },
    approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20' },
    declined: { label: 'Declined', bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-500/20' },
  };

  const cfg = configs[status] || configs.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

// ── Meeting Status Badge ──────────────────────────────────────────────────────
export function MeetingStatusBadge({
  status,
  className,
}: {
  status: MeetingStatus;
  className?: string;
}) {
  const configs: Record<MeetingStatus, { label: string; bg: string; text: string; border: string }> = {
    upcoming: { label: 'Upcoming', bg: 'bg-flash/15', text: 'text-flash-deep', border: 'border-flash/30' },
    completed: { label: 'Completed', bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-500/10', text: 'text-rose-600 line-through', border: 'border-rose-500/20' },
  };

  const cfg = configs[status] || configs.upcoming;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Announcement Priority Badge ───────────────────────────────────────────────
export function AnnouncementPriorityBadge({
  priority,
  className,
}: {
  priority: AnnouncementPriority;
  className?: string;
}) {
  if (priority === 'important') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-danger/10 text-danger border border-danger/25',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
        Important
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-mist/60 text-muted border border-line',
        className
      )}
    >
      Normal
    </span>
  );
}
