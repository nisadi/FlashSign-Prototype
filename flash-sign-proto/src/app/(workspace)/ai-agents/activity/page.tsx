import { redirect } from 'next/navigation';

// Agent activity is shown on the Workspace dashboard ("My work today")
export default function OldAgentActivityPage() {
  redirect('/projects/home');
}
