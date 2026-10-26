'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { useDemoAuth } from '@/context/demo-auth-context';
import {
  CheckCircle2,
  Building2,
  User,
  Shield,
  Sliders,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';

import { DEMO_PRESET_USERS } from '@/types/demo-auth';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { currentUser: authUser, selectedWorkspace, preferences } = useDemoAuth();
  const currentUser = authUser || DEMO_PRESET_USERS[0];

  return (
    <OnboardingStepLayout
      currentStep="complete"
      title="Your workspace is ready"
      subtitle="Onboarding is complete. Your demo profile, workspace, and preferences are fully configured."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 animate-fade-up">
        {/* Success Icon Graphic */}
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-[var(--flash-deep)] text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20 mb-3 animate-fade-up">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold text-[var(--flash-deep)] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Setup Successfully Verified
          </span>
        </div>

        {/* Setup Summary Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Workspace Card */}
          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              Selected Workspace
            </span>
            <div className="flex items-center gap-2.5 pt-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: selectedWorkspace?.accentColor || '#00c2a8' }}
              >
                {selectedWorkspace?.initials || 'WS'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[var(--ink)] truncate">
                  {selectedWorkspace?.name}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {selectedWorkspace?.companySize} • {selectedWorkspace?.type}
                </p>
              </div>
            </div>
          </div>

          {/* User Persona Card */}
          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              Demo Persona
            </span>
            <div className="flex items-center gap-2.5 pt-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: currentUser.avatarColor || '#00c2a8' }}
              >
                {currentUser.avatarInitials || 'FS'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[var(--ink)] truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-[var(--flash-deep)] font-semibold truncate">
                  {currentUser.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Checklist */}
        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--paper-elevated)] space-y-2.5">
          <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
            Completed Onboarding Milestones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Workspace registered & linked</span>
            </div>

            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Persona & permissions initialized</span>
            </div>

            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Theme: {preferences.theme === 'light' ? 'Paper Light' : 'Dark Teal'}</span>
            </div>

            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Notification digests configured</span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/workspace"
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors"
            >
              Change Workspace
            </Link>

            <Link
              href="/onboarding/profile"
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors"
            >
              Review Profile
            </Link>
          </div>

          <Link
            href="/prototype-home"
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Open Flash Sign Preview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </OnboardingStepLayout>
  );
}
