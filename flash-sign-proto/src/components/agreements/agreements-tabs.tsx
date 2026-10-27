'use client';

import { useApp } from '@/context/app-context';
import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';
import { FEATURES } from '@/lib/features';

export type AgreementsTabGroup = 'inbox' | 'documents';

function useTabGroups(): Record<AgreementsTabGroup, SectionTab[]> {
  const { signatureRequests } = useApp();
  // Same count as the sidebar "Action Required" badge
  const actionRequired = signatureRequests?.filter(
    r => r.status === 'sent' || r.status === 'viewed' || r.status === 'partially_signed'
  ).length || 0;

  return {
    inbox: [
      { label: 'All', href: '/signatures/all' },
      { label: 'Action Required', href: '/signatures/waiting', badge: actionRequired || undefined },
      { label: 'Sent', href: '/signatures/sent' },
      { label: 'Completed', href: '/signatures/completed' },
      {
        label: 'Declined & Expired',
        href: '/signatures/declined',
        subTabs: [
          { label: 'Declined', href: '/signatures/declined' },
          { label: 'Expired', href: '/signatures/expired' },
        ],
      },
      { label: 'Drafts', href: '/signatures/drafts' },
    ],
    documents: [
      { label: 'All Documents', href: '/documents/all' },
      { label: 'My Documents', href: '/documents/mine' },
      { label: 'Shared with Me', href: '/documents/shared' },
      { label: 'Recent', href: '/documents/recent' },
      { label: 'Favorites', href: '/documents/favorites' },
      { label: 'Folders', href: '/documents/folders' },
      ...(FEATURES.contracts ? [{
        // Contracts live inside Documents; each lifecycle stage is a chip
        label: 'Contracts',
        href: '/contracts',
        subTabs: [
          { label: 'Overview', href: '/contracts' },
          { label: 'All', href: '/contracts/all' },
          { label: 'Drafts', href: '/contracts/drafts' },
          { label: 'In Review', href: '/contracts/review' },
          { label: 'Awaiting Signature', href: '/contracts/awaiting' },
          { label: 'Active', href: '/contracts/active' },
          { label: 'Expiring Soon', href: '/contracts/expiring' },
          { label: 'Completed', href: '/contracts/completed' },
          { label: 'Archived', href: '/contracts/archived' },
        ],
      }] : []),
    ],
  };
}

/** Top navigation for the Agreements area. */
export function AgreementsTabs({ group }: { group: AgreementsTabGroup }) {
  return <SectionTabs tabs={useTabGroups()[group]} />;
}
