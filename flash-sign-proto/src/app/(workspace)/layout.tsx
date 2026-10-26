'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import { cn } from '@/lib/utils';
import { Loader2, Zap } from 'lucide-react';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarCollapsed } = useApp();
  const { isAuthenticated, currentUser, isHydrated } = useDemoAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
    } else if (!currentUser.organizationSetupCompleted) {
      router.replace('/onboarding/create-organization');
    }
  }, [isAuthenticated, currentUser, isHydrated, router]);

  // While checking hydration or unauthenticated, show clean transition placeholder
  if (!isHydrated || !isAuthenticated || !currentUser || !currentUser.organizationSetupCompleted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--flash)] flex items-center justify-center shadow-sm animate-pulse">
            <Zap className="w-5 h-5 text-[var(--ink)]" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--flash-deep)]" />
            <span>Loading workspace session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <AppSidebar />
      {/* Main content shifts based on sidebar width */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 h-screen overflow-hidden transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        )}
      >
        <AppHeader />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <TaskDetailDrawer />
    </div>
  );
}
