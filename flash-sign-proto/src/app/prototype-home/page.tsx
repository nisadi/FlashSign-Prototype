'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { useDemoAuth } from '@/context/demo-auth-context';
import { DEMO_PRESET_USERS } from '@/types/demo-auth';
import {
  Building2,
  User,
  Shield,
  Sliders,
  LogOut,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  FileSignature,
  Bot,
  ArrowRight,
} from 'lucide-react';

export default function PrototypeHomePage() {
  const router = useRouter();
  const {
    currentUser: authUser,
    selectedWorkspace,
    preferences,
    logout,
    resetDemo,
  } = useDemoAuth();
  const currentUser = authUser || DEMO_PRESET_USERS[0];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleReset = () => {
    resetDemo();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col paper-grain">
      {/* Top Navbar */}
      <header className="w-full bg-[var(--paper-elevated)]/90 backdrop-blur-md border-b border-[var(--line)] py-3 px-4 sm:px-8 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <FlashSignLogo size="sm" showBadge />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--mist)]/40 transition-colors"
              title="Reset all demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-[var(--danger)] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-10 animate-fade-up">
        {/* Banner Alert: Scope of Module */}
        <div className="mb-8 p-4 rounded-2xl bg-teal-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--flash)] bg-white/10 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              <span>Prototype Boundary Reached</span>
            </div>
            <h2 className="text-lg font-bold">Authentication & Onboarding Complete</h2>
            <p className="text-xs text-teal-100/80 leading-relaxed max-w-xl">
              You have completed the entire entry workflow. Per the project specification, the downstream project management screens, AI agent runner, and digital signature engines are outside the scope of this module.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/workspace"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--flash)] hover:bg-[var(--flash-deep)] text-[#0c1f22] transition-colors shadow-xs"
            >
              Change Workspace
            </Link>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-[var(--paper-elevated)] rounded-2xl border border-[var(--line)] shadow-xl p-6 sm:p-8 mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || '#00c2a8' }}
              >
                {currentUser.avatarInitials || 'FS'}
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--flash-deep)] uppercase tracking-wider">
                  Active Demo Session
                </span>
                <h1 className="text-2xl font-extrabold text-[var(--ink)]">
                  Welcome, {currentUser.fullName}
                </h1>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {currentUser.jobTitle} • {currentUser.department}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-xs text-[var(--ink-soft)]">
              <Shield className="w-4 h-4 text-[var(--flash-deep)]" />
              <span>Role: <strong className="text-[var(--ink)] capitalize">{currentUser.role.replace('_', ' ')}</strong></span>
            </div>
          </div>

          {/* Current Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Workspace Column */}
            <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
                  Workspace
                </span>
                <Link
                  href="/workspace"
                  className="text-[11px] text-[var(--flash-deep)] hover:underline"
                >
                  Change
                </Link>
              </div>
              <p className="font-bold text-sm text-[var(--ink)] truncate">
                {selectedWorkspace?.name}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {selectedWorkspace?.memberCount} members • {selectedWorkspace?.activeProjectCount} projects
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[var(--paper-elevated)] border border-[var(--line)] text-[var(--ink-soft)] font-medium">
                {selectedWorkspace?.type}
              </span>
            </div>

            {/* Profile Column */}
            <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
                  Profile Identity
                </span>
                <Link
                  href="/onboarding/profile"
                  className="text-[11px] text-[var(--flash-deep)] hover:underline"
                >
                  Edit
                </Link>
              </div>
              <p className="font-bold text-sm text-[var(--ink)] truncate">
                {currentUser.email}
              </p>
              <p className="text-[11px] text-[var(--muted)] truncate">
                Timezone: {currentUser.timezone?.split(' ')[0]}
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[var(--paper-elevated)] border border-[var(--line)] text-[var(--ink-soft)] font-medium">
                Initial Setup Complete
              </span>
            </div>

            {/* Preferences Column */}
            <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
                  Preferences
                </span>
                <Link
                  href="/onboarding/preferences"
                  className="text-[11px] text-[var(--flash-deep)] hover:underline"
                >
                  Adjust
                </Link>
              </div>
              <p className="font-bold text-sm text-[var(--ink)]">
                Theme: {preferences.theme === 'light' ? 'Paper Light' : 'Dark Teal'}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                In-app alerts: {preferences.inAppNotifications ? 'Active' : 'Muted'}
              </p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[var(--paper-elevated)] border border-[var(--line)] text-[var(--ink-soft)] font-medium">
                Digests: {preferences.emailNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Quick Flow Re-entry Links */}
          <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--muted)]">
              Restart or test any flow from the beginning:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--mist)]/40 text-[var(--ink)] transition-colors"
              >
                Sign In Screen
              </Link>

              <Link
                href="/register"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--mist)]/40 text-[var(--ink)] transition-colors"
              >
                Registration Screen
              </Link>

              <Link
                href="/forgot-password"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--mist)]/40 text-[var(--ink)] transition-colors"
              >
                Recovery Screen
              </Link>

              <Link
                href="/workspace/new"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--mist)]/40 text-[var(--ink)] transition-colors"
              >
                Create Workspace
              </Link>
            </div>
          </div>
        </div>

        {/* Prototype Notice */}
        <div className="text-center">
          <PrototypeNotice
            variant="subtle"
            message="Flash Sign Authentication & Onboarding Prototype — Frontend Only."
          />
        </div>
      </main>
    </div>
  );
}
