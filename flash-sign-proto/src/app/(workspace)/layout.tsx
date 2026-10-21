'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { useApp } from '@/context/app-context';
import { cn } from '@/lib/utils';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useApp();

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
