'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SectionSubTab {
  label: string;
  href: string;
}

export interface SectionTab {
  label: string;
  href: string;
  badge?: number;
  subTabs?: SectionSubTab[];
}

const isTabActive = (tab: SectionTab, pathname: string) =>
  pathname === tab.href || !!tab.subTabs?.some(s => s.href === pathname);

/**
 * Top tab bar shown under the header on a section's list pages. Pages that are
 * not one of the tabs (detail pages, wizards) render no tab bar.
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname();
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
