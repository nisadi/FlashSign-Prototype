import { redirect } from 'next/navigation';

// Milestones were removed from Planning; they still show on the calendar.
export default function MilestonesPage() {
  redirect('/planner/calendar?category=milestone');
}
