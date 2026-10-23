'use client';

import { useApp } from '@/context/app-context';
import { canManageUsers } from '@/lib/permissions';
import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';

/** Tabs for the main Settings area; Users & Roles only appears for admins. */
export function SettingsTabs() {
  const { demoRole } = useApp();
  const tabs: SectionTab[] = [
    { label: 'Profile', href: '/settings/profile' },
    { label: 'My Signature', href: '/settings/signature' },
    { label: 'Preferences', href: '/settings/preferences' },
    { label: 'Notifications', href: '/settings/notifications' },
    { label: 'Security', href: '/settings/security' },
    ...(canManageUsers(demoRole) ? [{ label: 'Users & Roles', href: '/settings/users' }] : []),
  ];
  return <SectionTabs tabs={tabs} />;
}
