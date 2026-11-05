'use client';

import { useDemoAuth } from '@/context/demo-auth-context';
import { canAccessAIOrganizationSettings } from '@/lib/rbac';
import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';

/** Tabs for the AI Agent Hub; Organisation only appears for Organization Owner. */
export function HubTabs() {
  const { currentRbacUser } = useDemoAuth();

  const tabs: SectionTab[] = [
    { label: 'How it works', href: '/ai-agents/how-it-works' },
    { label: 'Connect', href: '/ai-agents/connect' },
    { label: 'My Tokens', href: '/ai-agents/tokens' },
    ...(canAccessAIOrganizationSettings(currentRbacUser)
      ? [{ label: 'Organisation', href: '/ai-agents/organisation' }]
      : []),
  ];
  return <SectionTabs tabs={tabs} />;
}
