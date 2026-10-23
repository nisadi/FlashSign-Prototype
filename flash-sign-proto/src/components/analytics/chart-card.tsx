'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Chart colours, validated as a set (dataviz validate_palette.js, light mode on #ffffff).
// Slots are assigned in this fixed order and never cycled. Several sit below 3:1
// against white, so every chart ships a legend and a table view.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'] as const;

export const CHART_INK = {
  grid: '#e3ebe8',
  axis: '#5a6f6c', // --muted
  text: '#0c1f22', // --ink
  surface: '#ffffff', // --paper-elevated: used for the 2px gap between touching marks
};

export interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted', className)}>
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} aria-hidden />
          <span>{item.label}</span>
          {item.value !== undefined && <span className="font-semibold text-ink tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Recharts tooltip body: values in ink, identity carried by the swatch beside each row. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatLabel?: (label: string | number) => string;
  formatValue?: (value: number | string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper-elevated px-3 py-2 shadow-lg text-xs min-w-[140px]">
      {label !== undefined && (
        <p className="font-semibold text-ink mb-1">{formatLabel ? formatLabel(label) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map(entry => (
          <li key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-sm" style={{ background: entry.color }} aria-hidden />
              {entry.name}
            </span>
            <span className="font-semibold text-ink tabular-nums">
              {entry.value !== undefined && formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

/**
 * Card wrapper for one chart: title, optional link, and a Chart / Table switch so
 * every value is also readable without relying on colour.
 */
export function ChartCard({
  title,
  description,
  action,
  table,
  badge,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  table?: ChartTable;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <section className={cn('bg-paper-elevated border border-line rounded-xl shadow-xs p-5 flex flex-col gap-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            {title}
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-mist text-muted border border-line">
                {badge}
              </span>
            )}
          </h2>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {table && (
            <div className="flex items-center bg-paper rounded-md border border-line p-0.5 text-[11px] font-semibold" role="group" aria-label={`${title} view`}>
              {(['chart', 'table'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={cn(
                    'px-2 py-0.5 rounded capitalize transition-colors',
                    view === v ? 'bg-paper-elevated text-ink shadow-2xs' : 'text-muted hover:text-ink'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          {action && (
            <Link href={action.href} className="text-xs font-semibold text-flash-deep hover:text-ink transition-colors whitespace-nowrap">
              {action.label}
            </Link>
          )}
        </div>
      </div>

      {view === 'table' && table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-muted text-left">
                {table.columns.map((col, i) => (
                  <th key={col} className={cn('py-2 pr-3 font-semibold', i > 0 && 'text-right')}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} className={cn('py-1.5 pr-3 text-ink', i > 0 && 'text-right tabular-nums')}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
