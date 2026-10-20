'use client';

import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority, ProjectStatus, ProjectHealth, DocumentStatus, AgentRunStatus } from '@/types';
import {
  Circle, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Minus, Flame,
  TrendingUp, TrendingDown, Minus as MinusIcon,
} from 'lucide-react';

// ── Status Badge ──────────────────────────────────────────────────────────────
const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string; icon: React.ElementType }> = {
  todo:        { label: 'To Do',       className: 'bg-mist text-muted border-line',           icon: Circle },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200',  icon: Clock },
  review:      { label: 'In Review',   className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  done:        { label: 'Done',        className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  blocked:     { label: 'Blocked',     className: 'bg-red-50 text-red-700 border-red-200',     icon: XCircle },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string; icon: React.ElementType }> = {
  critical: { label: 'Critical', className: 'text-danger', icon: Flame },
  high:     { label: 'High',     className: 'text-orange-600', icon: ArrowUp },
  medium:   { label: 'Medium',   className: 'text-waiting',  icon: ArrowRight },
  low:      { label: 'Low',      className: 'text-muted',    icon: ArrowDown },
};

export function PriorityBadge({ priority, showLabel = true }: { priority: TaskPriority; showLabel?: boolean }) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', config.className)}>
      <Icon className="w-3 h-3" />
      {showLabel && config.label}
    </span>
  );
}

// ── Project Status Badge ──────────────────────────────────────────────────────
const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning:  { label: 'Planning',  className: 'bg-sky-50 text-sky-700 border-sky-200' },
  active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  on_hold:   { label: 'On Hold',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = PROJECT_STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}

// ── Health Badge ──────────────────────────────────────────────────────────────
const HEALTH_CONFIG: Record<ProjectHealth, { label: string; color: string; Icon: React.ElementType }> = {
  on_track:  { label: 'On Track',  color: '#00c2a8', Icon: TrendingUp },
  at_risk:   { label: 'At Risk',   color: '#c47a12', Icon: MinusIcon },
  off_track: { label: 'Off Track', color: '#c23b3b', Icon: TrendingDown },
};

export function HealthBadge({ health }: { health: ProjectHealth }) {
  const config = HEALTH_CONFIG[health];
  const { Icon } = config;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: config.color }}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ── Document Status Badge ─────────────────────────────────────────────────────
const DOC_STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending:   { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'In Review',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved:  { label: 'Approved',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:  { label: 'Rejected',   className: 'bg-red-50 text-red-700 border-red-200' },
  signed:    { label: 'Signed',     className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  expired:   { label: 'Expired',    className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const config = DOC_STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}

// ── Agent Run Status ──────────────────────────────────────────────────────────
const AGENT_STATUS_CONFIG: Record<AgentRunStatus, { label: string; className: string; dot: string }> = {
  queued:       { label: 'Queued',       className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  running:      { label: 'Running',      className: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500 animate-pulse' },
  completed:    { label: 'Completed',    className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  failed:       { label: 'Failed',       className: 'bg-red-50 text-red-700',       dot: 'bg-red-500' },
  needs_review: { label: 'Needs Review', className: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
};

export function AgentRunStatusBadge({ status }: { status: AgentRunStatus }) {
  const config = AGENT_STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

// ── Generic Badge ─────────────────────────────────────────────────────────────
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'flash' | 'danger' | 'warning' | 'success';
  className?: string;
}) {
  const variants = {
    default: 'bg-mist text-muted',
    flash:   'bg-flash/15 text-flash-deep',
    danger:  'bg-red-50 text-danger',
    warning: 'bg-amber-50 text-waiting',
    success: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
