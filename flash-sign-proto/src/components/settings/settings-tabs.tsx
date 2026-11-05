'use client';

import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import { canAccessPreferences, canManageTeam } from '@/lib/rbac';
import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';

/** Tabs for the main Settings area; Preferences only appears for Organization Owner. */
export function SettingsTabs() {
  const { currentRbacUser } = useDemoAuth();

  const tabs: SectionTab[] = [
    { label: 'Profile', href: '/settings/profile' },
    { label: 'My Signature', href: '/settings/signature' },
    ...(canAccessPreferences(currentRbacUser) ? [{ label: 'Preferences', href: '/settings/preferences' }] : []),
    { label: 'Notifications', href: '/settings/notifications' },
    { label: 'Security', href: '/settings/security' },
    ...(canManageTeam(currentRbacUser) ? [{ label: 'Users & Roles', href: '/settings/users' }] : []),
  ];
  return <SectionTabs tabs={tabs} />;
}
