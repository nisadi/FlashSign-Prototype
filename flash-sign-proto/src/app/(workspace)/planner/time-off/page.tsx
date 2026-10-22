import { redirect } from 'next/navigation';

// Time Off is part of the Availability & Time Off page.
export default function TimeOffPage() {
  redirect('/planner/availability');
}
