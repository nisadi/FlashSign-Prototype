import { redirect } from 'next/navigation';

// Workspace preferences moved into the main Settings area
export default function OldWorkspaceSettingsPage() {
  redirect('/settings/preferences');
}
