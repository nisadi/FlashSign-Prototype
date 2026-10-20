'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { WorkspaceCard } from '@/components/workspace/workspace-card';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { useDemoAuth } from '@/context/demo-auth-context';
import {
  Plus,
  LogOut,
  Building2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

export default function WorkspaceSelectionPage() {
  const router = useRouter();
  const {
    currentUser,
    workspaces,
    selectedWorkspace,
    selectWorkspace,
    createWorkspace,
    logout,
    resetDemo,
  } = useDemoAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenWorkspace = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    // Navigate to next onboarding step or handoff page
    router.push('/onboarding/profile');
  };

  const handleCreateAndSelect = (
    name: string,
    type: string,
    companySize: string,
    description?: string,
    accentColor?: string
  ) => {
    const newWs = createWorkspace(name, type, companySize, description, accentColor);
    router.push('/onboarding/profile');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col paper-grain">
      {/* Top Navigation */}
      <header className="w-full bg-[var(--paper-elevated)]/80 backdrop-blur-md border-b border-[var(--line)] py-3 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <FlashSignLogo size="sm" showBadge />

          {/* User Profile Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--line)]">
              <div
                className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor || '#00c2a8' }}
              >
                {currentUser.avatarInitials || 'FS'}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-semibold text-[var(--ink)]">{currentUser.fullName}</p>
                <p className="text-[10px] text-[var(--muted)]">{currentUser.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-[var(--muted)] hover:text-[var(--danger)] flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-2"
              title="Return to login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace List */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-10 animate-fade-up">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--flash-deep)] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Step 1 of Onboarding</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              Choose your workspace
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-lg">
              Select an existing organization to preview roles and agreements, or launch a custom demo workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/workspace/new"
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[var(--paper-elevated)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--muted)] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Guided Setup</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workspace</span>
            </button>
          </div>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              isSelected={selectedWorkspace?.id === ws.id}
              currentUser={currentUser}
              onSelect={selectWorkspace}
              onOpen={handleOpenWorkspace}
            />
          ))}
        </div>

        {/* Selected Workspace Action Bar */}
        {selectedWorkspace && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--paper-elevated)] border border-[var(--line)] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                style={{ backgroundColor: selectedWorkspace.accentColor || '#00c2a8' }}
              >
                {selectedWorkspace.initials || selectedWorkspace.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[var(--flash-deep)] uppercase tracking-wider">
                  Active Selection
                </span>
                <p className="text-sm font-bold text-[var(--ink)]">{selectedWorkspace.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {selectedWorkspace.memberCount} members • {selectedWorkspace.activeProjectCount} projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/prototype-home"
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors"
              >
                Skip to Summary
              </Link>

              <button
                type="button"
                onClick={() => handleOpenWorkspace(selectedWorkspace.id)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Continue Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Prototype Disclaimer */}
        <div className="mt-8 text-center">
          <PrototypeNotice
            variant="subtle"
            message="Sample organizations only. Switch workspaces or reset data at any time."
          />
        </div>
      </main>

      {/* Quick Create Workspace Modal */}
      <CreateWorkspaceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreateAndSelect}
      />
    </div>
  );
}
