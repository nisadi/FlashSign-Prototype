'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Plus, HelpCircle, ChevronRight, Menu, Check } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import { useApp, useCurrentUser, useNotifications } from '@/context/app-context';
import { QuickCreateDialog } from '@/components/shared/quick-create-dialog';
import { SearchCommand } from '@/components/shared/search-command';

// Pages whose title differs from their URL segment (applied when the page is the current one)
const PAGE_TITLES: Record<string, string> = {
  '/teams': 'Team Analytics',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const { projects } = useApp();

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;
    const matchingProj = projects.find(p => p.id === seg) || (seg === 'p-mvhmnblw' ? projects.find(p => p.id === 'p1') : undefined);
    const label = (isLast && PAGE_TITLES[href])
      || (matchingProj ? matchingProj.name : seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    return { label, href, isLast };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted min-w-0" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className={cn("flex items-center gap-1.5 min-w-0", !crumb.isLast && "hidden sm:flex")}>
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-line shrink-0" />}
          {crumb.isLast ? (
            <span className="text-ink font-semibold truncate max-w-[120px] sm:max-w-[200px]">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-ink transition-colors truncate max-w-[100px] sm:max-w-[150px]">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const currentUser = useCurrentUser();
  const notifications = useNotifications();
  const { markAllNotificationsRead, toggleSidebar } = useApp();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="h-14 bg-paper-elevated border-b border-line flex items-center px-3 sm:px-6 gap-2 sm:gap-3 shrink-0 sticky top-0 z-20 shadow-xs">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-1.5 rounded-md text-muted hover:text-ink hover:bg-mist transition-colors shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Global Search Bar (opens search command) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-mist/70 hover:bg-mist px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-muted hover:text-ink transition-all border border-line justify-center sm:justify-between sm:w-60"
            aria-label="Search"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline truncate">Search everywhere...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] bg-paper-elevated px-1.5 py-0.5 rounded border border-line font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Quick Create Action */}
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 bg-flash-deep text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-flash hover:text-ink transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-flash ring-2 ring-paper-elevated" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-paper-elevated rounded-xl shadow-2xl border border-line z-50 overflow-hidden animate-fade-up">
              <div className="p-3 border-b border-line flex items-center justify-between bg-paper">
                <span className="text-xs font-bold text-ink">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-flash-deep hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-line/60">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted p-4 text-center">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={cn('p-3 hover:bg-mist/30 text-xs transition-colors', !n.isRead && 'bg-emerald-50/40')}>
                      <p className="font-semibold text-ink">{n.title}</p>
                      <p className="text-muted text-[11px] mt-0.5">{n.body}</p>
                      <span className="text-[10px] text-muted/70 mt-1 block">{formatRelative(n.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
              {/* The full list replaces the old sidebar Notifications link */}
              <Link
                href="/teams/notifications"
                onClick={() => setNotifOpen(false)}
                className="block p-2.5 border-t border-line bg-paper text-center text-xs font-semibold text-flash-deep hover:bg-mist/40 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-line">
            <div
              className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: currentUser.color || '#00c2a8' }}
            >
              {currentUser.initials}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-ink">{currentUser.name}</p>
              <p className="text-[10px] text-muted capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <QuickCreateDialog
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
      />

      <SearchCommand
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
