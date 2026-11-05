'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Sparkles, House } from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { cn } from '@/lib/utils';

interface DashboardSwitcherProps {
  variant?: 'header' | 'sidebar';
}

export function DashboardSwitcher({ variant = 'header' }: DashboardSwitcherProps) {
  const pathname = usePathname();
  const { currentRbacUser } = useDemoAuth();

  // Only render switcher if the current user has access to BOTH dashboards
  if (!currentRbacUser) return null;
  const canAccessBoth =
    currentRbacUser.dashboardAccess?.adminDashboard &&
    currentRbacUser.dashboardAccess?.myStatus;

  if (!canAccessBoth) return null;

  const isAdminActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isStatusActive = pathname === '/projects/home';

  if (variant === 'sidebar') {
    return (
      <div className="px-3 py-2 border-b border-ink-soft/40 space-y-1.5">
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold px-1">
          Switch Dashboard
        </p>
        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-semibold transition-all',
              isAdminActive
                ? 'bg-flash text-ink shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Admin</span>
          </Link>

          <Link
            href="/projects/home"
            className={cn(
              'flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-semibold transition-all',
              isStatusActive
                ? 'bg-flash text-ink shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">My Status</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center bg-mist/90 p-1 rounded-xl border border-line shadow-2xs">
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
          isAdminActive
            ? 'bg-paper-elevated text-ink shadow-xs border border-line/60 font-bold'
            : 'text-muted hover:text-ink'
        )}
      >
        <LayoutDashboard className={cn('w-3.5 h-3.5', isAdminActive ? 'text-flash-deep' : 'text-muted')} />
        <span>Admin Dashboard</span>
      </Link>

      <Link
        href="/projects/home"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
          isStatusActive
            ? 'bg-paper-elevated text-ink shadow-xs border border-line/60 font-bold'
            : 'text-muted hover:text-ink'
        )}
      >
        <Sparkles className={cn('w-3.5 h-3.5', isStatusActive ? 'text-flash-deep' : 'text-muted')} />
        <span>My Status</span>
      </Link>
    </div>
  );
}

