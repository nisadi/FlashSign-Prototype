'use client';

import { useState } from 'react';
import { AlertCircle, CornerLeftUp } from 'lucide-react';
import { DURATION_UNITS, addDuration, estimateParts, splitSpan, toDays, formatDuration, type DurationUnit } from '@/lib/durations';
import { outsideWindow, type TimeWindow } from '@/lib/schedule';
import { formatDate, cn } from '@/lib/utils';

export interface DateRange {
  start: string;
  end: string;
  unit: DurationUnit;
}

const field = 'w-full px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg outline-none focus:border-flash text-ink';
const label = 'block text-[11px] font-semibold text-ink mb-1';

/**
 * A whole number of days, weeks or months. Only digits can be typed, so a length is never
 * "2.5 months" (use weeks for that) and the browser never refuses the form over it.
 */
function WholeNumberInput({ value, onChange, label: aria }: { value: number; onChange: (n: number) => void; label: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft ?? String(value)}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        setDraft(digits);
        const n = Number(digits);
        if (n > 0) onChange(n);
      }}
      onBlur={() => setDraft(null)}
      className={cn(field, 'w-14 font-mono')}
      aria-label={aria}
    />
  );
}

/** "+10 days" beside a whole length that doesn't land exactly on the end date */
const Rest = ({ days }: { days: number }) =>
  days > 0 ? <span className="text-[11px] text-muted whitespace-nowrap">+{days} day{days === 1 ? '' : 's'}</span> : null;

function UnitSelect({ value, onChange, className }: { value: DurationUnit; onChange: (u: DurationUnit) => void; className?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as DurationUnit)} className={cn(field, 'w-auto', className)} aria-label="Unit">
      {DURATION_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
    </select>
  );
}

/** "Must be inside Beta Launch (Aug 21 → Nov 3)" under a field, or the problem when it doesn't fit */
export function WindowHint({ window: w, error }: { window?: TimeWindow; error?: string }) {
  if (error) {
    return (
      <p className="flex items-start gap-1 text-[11px] text-danger">
        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
        {error}. Pick dates inside {w ? `${w.label} (${formatDate(w.start)} → ${formatDate(w.end)})` : 'its parent'}.
      </p>
    );
  }
  if (!w) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-muted">
      <CornerLeftUp className="w-3 h-3 shrink-0" />
      Inside {w.label}: {formatDate(w.start)} → {formatDate(w.end)} ({formatDuration(w.start, w.end)})
    </p>
  );
}

/** Whether a range breaks its window; forms block saving while this returns a message */
export function rangeError(range: Pick<DateRange, 'start' | 'end'>, w?: TimeWindow): string | undefined {
  if (range.start && range.end && range.end < range.start) return 'The end is before the start';
  return w ? outsideWindow(range.start, range.end, w) : undefined;
}

/**
 * Start, length and end of a project, phase, epic or story. The length is typed as a number
 * with a unit (days, weeks or months) and moves the end date; changing the end works out the
 * length. With a window, the date pickers only offer dates inside the parent's time.
 */
export function DateRangeField({
  value,
  onChange,
  window: w,
  compact,
  startLabel = 'Start date',
  endLabel = 'End date',
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  window?: TimeWindow;
  /** One row without labels, for lists */
  compact?: boolean;
  startLabel?: string;
  endLabel?: string;
}) {
  const { amount, restDays } = value.start && value.end ? splitSpan(value.start, value.end, value.unit) : { amount: 0, restDays: 0 };
  const error = rangeError(value, w);

  const setAmount = (n: number) => {
    if (value.start) onChange({ ...value, end: addDuration(value.start, n, value.unit) });
  };
  // A new unit keeps the number: "3" + Months = 3 months
  const setUnit = (unit: DurationUnit) => {
    const n = Math.max(1, amount);
    onChange({ ...value, unit, end: value.start ? addDuration(value.start, n, unit) : value.end });
  };
  // A new start keeps the length, leftover days included
  const setStart = (start: string) => {
    const end = start ? addDuration(addDuration(start, Math.max(1, amount), value.unit), restDays, 'days') : value.end;
    onChange({ ...value, start, end });
  };

  const min = w?.start;
  const max = w?.end;
  const startInput = (
    <input type="date" value={value.start} min={min} max={max} onChange={e => setStart(e.target.value)} className={cn(field, 'font-mono', compact && 'w-auto')} aria-label={startLabel} />
  );
  const amountInput = (
    <div className="flex items-center gap-1">
      <WholeNumberInput value={amount} onChange={setAmount} label="Length" />
      <UnitSelect value={value.unit} onChange={setUnit} />
      <Rest days={restDays} />
    </div>
  );
  const endInput = (
    <input
      type="date"
      value={value.end}
      min={value.start || min}
      max={max}
      onChange={e => onChange({ ...value, end: e.target.value })}
      className={cn(field, 'font-mono', compact && 'w-auto', error && 'border-danger')}
      aria-label={endLabel}
    />
  );

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {startInput}
          {amountInput}
          <span className="text-muted text-xs">→</span>
          {endInput}
        </div>
        {error && <WindowHint window={w} error={error} />}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label><span className={label}>{startLabel}</span>{startInput}</label>
        <div><span className={label}>Length</span>{amountInput}</div>
        <label><span className={label}>{endLabel}</span>{endInput}</label>
      </div>
      <WindowHint window={w} error={error} />
    </div>
  );
}

/**
 * A task's estimate typed as a number and unit ("2 weeks"); stored in days, counted from the
 * task's start when it has one.
 */
export function EstimateField({
  days,
  unit,
  start,
  onChange,
  className,
}: {
  days: number;
  unit: DurationUnit;
  start?: string;
  onChange: (days: number, unit: DurationUnit) => void;
  className?: string;
}) {
  const { amount, restDays } = estimateParts(days, unit, start);
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <WholeNumberInput value={amount} onChange={n => onChange(toDays(n, unit, start), unit)} label="Estimate" />
      <UnitSelect value={unit} onChange={u => onChange(toDays(Math.max(1, amount), u, start), u)} />
      <Rest days={restDays} />
    </div>
  );
}

export interface TaskTime {
  /** The estimate, in days */
  days: number;
  unit: DurationUnit;
  start: string;
  due: string;
}

/**
 * A task's estimate, start and due date. The estimate is typed in days, weeks or months; with a
 * start date it sets the due date. The date pickers only offer dates inside the task's parent
 * (its story, epic, phase or project, or its task for a subtask).
 */
export function TaskTimeFields({ value, onChange, window: w }: { value: TaskTime; onChange: (t: TaskTime) => void; window?: TimeWindow }) {
  const error = rangeError({ start: value.start, end: value.due }, w);
  const withDue = (t: TaskTime) => ({ ...t, due: t.start ? addDuration(t.start, t.days, 'days') : t.due });
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <span className={label}>Estimate</span>
          <EstimateField days={value.days} unit={value.unit} start={value.start} onChange={(days, unit) => onChange(withDue({ ...value, days, unit }))} />
        </div>
        <label>
          <span className={label}>Start date</span>
          <input
            type="date"
            value={value.start}
            min={w?.start}
            max={w?.end}
            onChange={e => onChange(withDue({ ...value, start: e.target.value }))}
            className={cn(field, 'font-mono')}
          />
        </label>
        <label>
          <span className={label}>Due date</span>
          <input
            type="date"
            value={value.due}
            min={value.start || w?.start}
            max={w?.end}
            onChange={e => onChange({ ...value, due: e.target.value })}
            className={cn(field, 'font-mono', error && 'border-danger')}
          />
        </label>
      </div>
      <WindowHint window={w} error={error} />
    </div>
  );
}
