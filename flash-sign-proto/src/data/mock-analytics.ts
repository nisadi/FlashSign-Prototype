// ── Team analytics demo data ──────────────────────────────────────────────────
// Tasks in the store have no completion date, so the weekly trend on the Team
// Analytics page uses this fixed demo series instead of being derived. The last
// week is the demo "current" week (Mon 19 Oct 2026, today = 21 Oct).

export interface WeeklyTaskFlow {
  /** Monday of the week, YYYY-MM-DD */
  weekStart: string;
  created: number;
  completed: number;
}

export const WEEKLY_TASK_FLOW: WeeklyTaskFlow[] = [
  { weekStart: '2026-08-31', created: 12, completed: 9 },
  { weekStart: '2026-09-07', created: 15, completed: 12 },
  { weekStart: '2026-09-14', created: 11, completed: 13 },
  { weekStart: '2026-09-21', created: 18, completed: 14 },
  { weekStart: '2026-09-28', created: 14, completed: 15 },
  { weekStart: '2026-10-05', created: 16, completed: 13 },
  { weekStart: '2026-10-12', created: 20, completed: 17 },
  { weekStart: '2026-10-19', created: 17, completed: 19 },
];
