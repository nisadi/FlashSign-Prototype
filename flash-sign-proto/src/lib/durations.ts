import type { DurationUnit } from '@/types';
import { diffCalendarDays } from './timeline-calculator';

export type { DurationUnit };

/**
 * Lengths of time as people plan them: "3 months", "2 weeks", "10 days". Dates stay the
 * source of truth; the unit is how a length is entered and shown. Months are calendar
 * months (Jan 31 + 1 month = Feb 28), weeks are 7 days.
 */
export const DURATION_UNITS: { value: DurationUnit; label: string; one: string }[] = [
  { value: 'days', label: 'Days', one: 'day' },
  { value: 'weeks', label: 'Weeks', one: 'week' },
  { value: 'months', label: 'Months', one: 'month' },
];

const parse = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (dt: Date) => dt.toISOString().slice(0, 10);

/** The date `amount` whole units after `start` (YYYY-MM-DD in and out) */
export function addDuration(start: string, amount: number, unit: DurationUnit): string {
  if (!start) return start;
  const n = Math.round(amount);
  const dt = parse(start);
  if (unit === 'days') dt.setUTCDate(dt.getUTCDate() + n);
  if (unit === 'weeks') dt.setUTCDate(dt.getUTCDate() + n * 7);
  if (unit === 'months') {
    const day = dt.getUTCDate();
    dt.setUTCDate(1);
    dt.setUTCMonth(dt.getUTCMonth() + n);
    // Keep the day of the month, or the month's last day when it is shorter
    const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
    dt.setUTCDate(Math.min(day, last));
  }
  return iso(dt);
}

/**
 * A span split into whole units plus the days left over: Aug 21 → Dec 31 in months is
 * 4 months and 10 days. Lengths are always whole numbers; nobody plans "2.5 months".
 */
export function splitSpan(start: string, end: string, unit: DurationUnit): { amount: number; restDays: number } {
  const days = diffCalendarDays(start, end);
  if (unit === 'days' || days <= 0) return { amount: Math.max(0, days), restDays: 0 };
  if (unit === 'weeks') return { amount: Math.floor(days / 7), restDays: days % 7 };
  let amount = 0;
  while (amount < 600 && addDuration(start, amount + 1, 'months') <= end.slice(0, 10)) amount++;
  return { amount, restDays: diffCalendarDays(addDuration(start, amount, 'months'), end) };
}

/** The whole units in a span (the part before any leftover days) */
export function amountIn(start: string, end: string, unit: DurationUnit): number {
  return splitSpan(start, end, unit).amount;
}

/** The unit that describes a span most naturally, used when none was chosen */
export function naturalUnit(start: string, end: string): DurationUnit {
  const days = diffCalendarDays(start, end);
  if (days >= 60 || (days >= 28 && splitSpan(start, end, 'months').restDays === 0)) return 'months';
  if (days >= 14 && days % 7 === 0) return 'weeks';
  return 'days';
}

const plural = (n: number, unit: DurationUnit) => {
  const one = DURATION_UNITS.find(u => u.value === unit)!.one;
  return `${n} ${n === 1 ? one : `${one}s`}`;
};

/** "3 months", "6 weeks", "12 days"; leftover days are spelled out: "4 months 10 days" */
export function formatDuration(start: string, end: string, unit?: DurationUnit): string {
  if (!start || !end) return '';
  const u = unit ?? naturalUnit(start, end);
  const { amount, restDays } = splitSpan(start, end, u);
  if (amount === 0) return plural(restDays, 'days');
  return restDays ? `${plural(amount, u)} ${plural(restDays, 'days')}` : plural(amount, u);
}

/**
 * A length in days (a task estimate) as whole units plus leftover days, counted from `start`.
 * Without a start date, months were counted from the day they were entered, so a month is
 * taken as about 30 days, give or take 3 for short and long months.
 */
export function estimateParts(days: number, unit: DurationUnit, start?: string): { amount: number; restDays: number } {
  if (unit === 'months' && !start) {
    const near = Math.round(days / 30.44);
    if (near >= 1 && Math.abs(days - near * 30.44) <= 3) return { amount: near, restDays: 0 };
    const amount = Math.floor(days / 30.44);
    return { amount, restDays: days - Math.round(amount * 30.44) };
  }
  const from = start?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return splitSpan(from, addDuration(from, days, 'days'), unit);
}

/** A task estimate shown in its unit: 14 → "2 weeks", 10 → "1 week 3 days" */
export function formatDays(days: number, unit: DurationUnit = 'days', start?: string): string {
  const { amount, restDays } = estimateParts(days, unit, start);
  if (amount === 0) return plural(restDays, 'days');
  return restDays ? `${plural(amount, unit)} ${plural(restDays, 'days')}` : plural(amount, unit);
}

/** Days in `amount` whole units counted from `start` (or from today's date when there is no start) */
export function toDays(amount: number, unit: DurationUnit, start?: string): number {
  const from = start || new Date().toISOString().slice(0, 10);
  return Math.max(1, diffCalendarDays(from, addDuration(from, amount, unit)));
}
