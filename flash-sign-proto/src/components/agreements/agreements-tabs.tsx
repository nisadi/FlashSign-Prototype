'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export type AgreementsTabGroup = 'inbox' | 'documents' | 'contracts';

interface SubTab {
  label: string;
  href: string;
}

interface Tab {
  label: string;
  href: string;
  badge?: number;
  subTabs?: SubTab[];
}

function useTabGroups(): Record<AgreementsTabGroup, Tab[]> {
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
    ],
    contracts: [
      { label: 'Overview', href: '/contracts' },
      { label: 'All Contracts', href: '/contracts/all' },
      {
        label: 'In Progress',
        href: '/contracts/drafts',
        subTabs: [
          { label: 'Drafts', href: '/contracts/drafts' },
          { label: 'In Review', href: '/contracts/review' },
          { label: 'Awaiting Signature', href: '/contracts/awaiting' },
        ],
      },
      {
        label: 'Active',
        href: '/contracts/active',
        subTabs: [
          { label: 'Active', href: '/contracts/active' },
          { label: 'Expiring Soon', href: '/contracts/expiring' },
        ],
      },
      {
        label: 'Closed',
        href: '/contracts/completed',
        subTabs: [
          { label: 'Completed', href: '/contracts/completed' },
          { label: 'Archived', href: '/contracts/archived' },
        ],
      },
    ],
  };
}

const isTabActive = (tab: Tab, pathname: string) =>
  pathname === tab.href || !!tab.subTabs?.some(s => s.href === pathname);

/**
 * Top navigation for the Agreements area. Pages that are not one of the
 * group's tabs (detail pages, wizards, templates, settings) render no tab bar.
 */
export function AgreementsTabs({ group }: { group: AgreementsTabGroup }) {
  const pathname = usePathname();
  const tabs = useTabGroups()[group];
  const activeTab = tabs.find(tab => isTabActive(tab, pathname));

  if (!activeTab) return null;

  return (
    <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto"
        aria-label="Section navigation"
      >
        {tabs.map(tab => {
          const active = tab === activeTab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                active
                  ? 'border-flash text-ink font-semibold'
                  : 'border-transparent text-muted hover:text-ink hover:border-line'
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="text-[10px] bg-waiting/20 text-waiting font-bold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {activeTab.subTabs && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 pt-2 flex gap-2 overflow-x-auto">
          {activeTab.subTabs.map(sub => {
            const active = sub.href === pathname;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors',
                  active
                    ? 'bg-flash/15 text-flash-deep border-flash/30'
                    : 'bg-paper-elevated text-muted border-line hover:text-ink'
                )}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
