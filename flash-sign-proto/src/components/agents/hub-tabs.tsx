'use client';

import { useApp } from '@/context/app-context';
import { canManageAgents } from '@/lib/permissions';
import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';

/** Tabs for the AI Agent Hub; Organisation only appears for Owners and Admins. */
export function HubTabs() {
  const { demoRole } = useApp();
  const tabs: SectionTab[] = [
    { label: 'How it works', href: '/ai-agents/how-it-works' },
    { label: 'Connect', href: '/ai-agents/connect' },
    { label: 'My Tokens', href: '/ai-agents/tokens' },
    ...(canManageAgents(demoRole) ? [{ label: 'Organisation', href: '/ai-agents/organisation' }] : []),
  ];
  return <SectionTabs tabs={tabs} />;
}
