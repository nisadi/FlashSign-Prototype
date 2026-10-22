import { redirect } from 'next/navigation';

// Milestones were removed from Planning; they still show on the calendar.
export default function NewMilestonePage() {
  redirect('/planner/calendar?category=milestone');
}
