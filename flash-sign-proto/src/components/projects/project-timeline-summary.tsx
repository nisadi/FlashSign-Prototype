'use client';

import React from 'react';
import type { Project, Milestone, Task } from '@/types';
import { Card, ProgressBar } from '@/components/shared/ui';
import { formatDate } from '@/lib/utils';
import { formatDuration } from '@/lib/durations';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flag,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProjectTimelineSummaryProps {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  className?: string;
}

export function ProjectTimelineSummary({
  project,
  milestones,
  tasks,
  className = '',
}: ProjectTimelineSummaryProps) {
  const originalStart = project.originalStartDate || project.startDate;
  const originalEnd = project.originalEndDate || project.endDate || project.dueDate || '';
  const currentStart = project.currentStartDate || project.startDate;
  const currentEnd = project.currentEndDate || project.endDate || project.dueDate || '';

  const originalDays = project.originalDuration || 90;
  const currentDays = project.currentDuration || 90;
  const diffDays = project.timelineDifference ?? (currentDays - originalDays);
  const status = project.timelineStatus || (diffDays > 0 ? 'extended' : diffDays < 0 ? 'shortened' : 'on_schedule');

  // Distinguish sum of estimated work durations from calendar duration
  const totalWorkDays = project.totalWorkDays || tasks
    .filter(t => t.projectId === project.id && !t.parentId)
    .reduce((acc, t) => acc + (t.estimatedDuration || t.points || 3), 0);

  // Calculate percentage positions for timeline bar
  const startTs = new Date(originalStart).getTime();
  const origEndTs = new Date(originalEnd).getTime();
  const currEndTs = new Date(currentEnd).getTime();
  const maxTs = Math.max(origEndTs, currEndTs);
  const spanTs = Math.max(maxTs - startTs, 1);

  const origMarkerPct = Math.min(100, Math.max(0, ((origEndTs - startTs) / spanTs) * 100));
  const currMarkerPct = Math.min(100, Math.max(0, ((currEndTs - startTs) / spanTs) * 100));

  // Today position
  const todayTs = Date.now();
  const todayPct = Math.min(100, Math.max(0, ((todayTs - startTs) / spanTs) * 100));

  return (
    <Card className={`p-5 sm:p-6 space-y-5 border-line ${className}`}>
      {/* Top Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-flash/10 text-flash-deep flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">Project Timeline Summary</h2>
            <p className="text-xs text-muted">
              Comparison between Original Baseline and Revised Planned Schedule
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {status === 'extended' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Extended (+{Math.abs(diffDays)} calendar days)</span>
            </div>
          )}

          {status === 'shortened' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ahead of Schedule ({Math.abs(diffDays)} days saved)</span>
            </div>
          )}

          {status === 'on_schedule' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mist/60 text-ink-soft border border-line">
              <CheckCircle2 className="w-3.5 h-3.5 text-flash-deep shrink-0" />
              <span>On Original Schedule</span>
            </div>
          )}

          {status === 'completed' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Timeline Dual-Marker Chart */}
      <div className="p-4 rounded-xl bg-paper border border-line space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-ink">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-flash-deep" />
            Timeline Visualisation
          </span>
          <span className="text-[11px] text-muted font-mono">
            {formatDate(originalStart)} → {formatDate(currentEnd)}
          </span>
        </div>

        {/* Visual Timeline Bar */}
        <div className="relative pt-6 pb-2">
          {/* Track line */}
          <div className="h-3 w-full bg-mist/80 rounded-full relative overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full bg-flash-deep/70 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(todayPct, 100)}%` }}
            />
            {/* Extended zone */}
            {status === 'extended' && origMarkerPct < currMarkerPct && (
              <div
                className="absolute top-0 bottom-0 bg-amber-400/40 border-l border-amber-500 stripe-pattern"
                style={{
                  left: `${origMarkerPct}%`,
                  width: `${currMarkerPct - origMarkerPct}%`,
                }}
              />
            )}
          </div>

          {/* Original Baseline Marker */}
          <div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none group z-10"
            style={{ left: `${origMarkerPct}%` }}
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink text-white text-[9px] font-mono shadow-xs whitespace-nowrap">
              <Flag className="w-2.5 h-2.5 text-amber-400" />
              <span>Baseline: {formatDate(originalEnd)}</span>
            </div>
            <div className="w-0.5 h-4 bg-ink/60 border-dashed" />
          </div>

          {/* Current Revised Marker */}
          {status === 'extended' && (
            <div
              className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none z-10"
              style={{ left: `${currMarkerPct}%` }}
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-mono shadow-xs whitespace-nowrap">
                <Clock className="w-2.5 h-2.5" />
                <span>Revised: {formatDate(currentEnd)}</span>
              </div>
              <div className="w-0.5 h-4 bg-amber-500" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/60 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-ink" /> Original Baseline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Revised Target
            </span>
            {status === 'extended' && (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-3 h-1.5 bg-amber-400/40 border border-amber-500 rounded-xs" />
                Variance: +{diffDays} days
              </span>
            )}
          </div>
          <span className="font-mono text-[10px]">
            Total Work: <strong>{totalWorkDays} days</strong> vs Calendar: <strong>{currentDays} days</strong>
          </span>
        </div>
      </div>

      {/* Comparison Layout Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-paper border-b border-line text-muted uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-2.5 px-4">Metric</th>
              <th className="py-2.5 px-4">Original Timeline</th>
              <th className="py-2.5 px-4">Current Timeline</th>
              <th className="py-2.5 px-4">Timeline Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-paper-elevated font-mono">
            {/* Start Date */}
            <tr>
              <td className="py-3 px-4 font-sans font-medium text-ink flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted shrink-0" /> Start Date
              </td>
              <td className="py-3 px-4 text-ink-soft">
                {formatDate(originalStart)}
              </td>
              <td className="py-3 px-4 text-ink font-semibold">
                {formatDate(currentStart)}
              </td>
              <td className="py-3 px-4 text-muted">
                {originalStart === currentStart ? 'Unchanged' : formatDate(currentStart)}
              </td>
            </tr>

            {/* End Date */}
            <tr className={diffDays > 0 ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}>
              <td className="py-3 px-4 font-sans font-medium text-ink flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted shrink-0" /> Target End Date
              </td>
              <td className="py-3 px-4 text-ink-soft">
                {formatDate(originalEnd)}
              </td>
              <td className="py-3 px-4 text-ink font-bold">
                {formatDate(currentEnd)}
              </td>
              <td className="py-3 px-4">
                {diffDays > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold font-sans">
                    <AlertTriangle className="w-3.5 h-3.5" /> +{diffDays} calendar days
                  </span>
                ) : diffDays < 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold font-sans">
                    <Sparkles className="w-3.5 h-3.5" /> {Math.abs(diffDays)} days saved
                  </span>
                ) : (
                  <span className="text-muted font-sans">On schedule (0 days)</span>
                )}
              </td>
            </tr>

            {/* Duration */}
            <tr>
              <td className="py-3 px-4 font-sans font-medium text-ink flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-muted shrink-0" /> Calendar Duration
              </td>
              <td className="py-3 px-4 text-ink-soft">
                {/* In the unit the project was planned in, e.g. "3 months" */}
                {formatDuration(originalStart, originalEnd, project.durationUnit)}
              </td>
              <td className="py-3 px-4 text-ink font-semibold">
                {formatDuration(currentStart, currentEnd, project.durationUnit)}
              </td>
              <td className="py-3 px-4">
                {diffDays > 0 ? (
                  <span className="text-amber-700 dark:text-amber-400 font-bold font-sans">
                    +{diffDays} days extended
                  </span>
                ) : diffDays < 0 ? (
                  <span className="text-emerald-600 font-bold font-sans">
                    -{Math.abs(diffDays)} days shortened
                  </span>
                ) : (
                  <span className="text-muted font-sans">0 days variance</span>
                )}
              </td>
            </tr>

            {/* Work Effort vs Calendar Span */}
            <tr className="bg-mist/10 text-[11px]">
              <td className="py-2.5 px-4 font-sans font-medium text-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-flash-deep shrink-0" /> Total Estimated Work
              </td>
              <td className="py-2.5 px-4 text-muted" colSpan={2}>
                <span className="font-sans">
                  <strong>{totalWorkDays} person-days</strong> of planned task work across{' '}
                  <strong>{tasks.filter(t => t.projectId === project.id && !t.parentId).length}</strong> main tasks &{' '}
                  <strong>{tasks.filter(t => t.projectId === project.id && !!t.parentId).length}</strong> subtasks.
                </span>
              </td>
              <td className="py-2.5 px-4 text-muted italic font-sans text-[10px]">
                Work effort ≠ calendar duration
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Advisory Message */}
      {diffDays > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Project Schedule Extension Notice
            </p>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
              The updated task and subtask duration estimates push the planned project end date by{' '}
              <strong>{diffDays} calendar days</strong> (from {formatDate(originalEnd)} to {formatDate(currentEnd)}).
              The original project baseline remains preserved for historical and SLA auditing.
            </p>
          </div>
        </div>
      )}

      {diffDays < 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Early Delivery Forecast
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90">
              The current planned work schedule is forecasting delivery{' '}
              <strong>{Math.abs(diffDays)} calendar days ahead</strong> of the original project baseline.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
