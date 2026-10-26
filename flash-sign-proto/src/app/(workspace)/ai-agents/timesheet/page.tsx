import { redirect } from 'next/navigation';

// The timesheet lives with team analytics (Teams > Analytics > View full timesheet)
export default function OldAgentTimesheetPage() {
  redirect('/teams/timesheet');
}
