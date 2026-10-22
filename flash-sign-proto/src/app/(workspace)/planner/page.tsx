import { redirect } from 'next/navigation';

// Planning is a single calendar page; the old overview opens it.
export default function PlannerIndexPage() {
  redirect('/planner/calendar');
}
