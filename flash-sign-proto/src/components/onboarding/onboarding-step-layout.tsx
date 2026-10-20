'use client';

import React from 'react';
import Link from 'next/link';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { OnboardingProgress, type OnboardingStepId } from '@/components/onboarding/onboarding-progress';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { useDemoAuth } from '@/context/demo-auth-context';
import { RotateCcw, Building2, User } from 'lucide-react';

interface OnboardingStepLayoutProps {
  currentStep: OnboardingStepId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function OnboardingStepLayout({
  currentStep,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}: OnboardingStepLayoutProps) {
  const { currentUser, selectedWorkspace, completedSteps, resetDemo } = useDemoAuth();

  return (
    <div className="min-h-screen flex flex-col paper-grain">
      {/* Top Header */}
      <header className="w-full bg-[var(--paper-elevated)]/80 backdrop-blur-md border-b border-[var(--line)] py-3 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <FlashSignLogo href="/workspace" size="sm" showBadge />

          {/* Quick Context Chips */}
          <div className="flex items-center gap-3">
            {selectedWorkspace && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-soft)]">
                <Building2 className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
                <span className="font-semibold">{selectedWorkspace.name}</span>
              </div>
            )}

            {currentUser && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-soft)]">
                <div
                  className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: currentUser.avatarColor || '#00c2a8' }}
                >
                  {currentUser.avatarInitials || 'FS'}
                </div>
                <span className="font-medium hidden md:inline">{currentUser.fullName}</span>
              </div>
            )}

            <button
              type="button"
              onClick={resetDemo}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 p-1.5 rounded-lg hover:bg-[var(--mist)]/40 transition-colors"
              title="Reset demo data to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="pt-4 px-4">
        <OnboardingProgress currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 animate-fade-up">
        <div className={`w-full ${maxWidth}`}>
          {/* Page Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--muted)] mt-1.5 max-w-lg mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Elevated Card */}
          <div className="bg-[var(--paper-elevated)] rounded-2xl border border-[var(--line)] shadow-xl shadow-slate-900/5 p-6 sm:p-8">
            {children}
          </div>

          {/* Prototype Notice Footer */}
          <div className="mt-6 text-center">
            <PrototypeNotice variant="subtle" />
          </div>
        </div>
      </main>
    </div>
  );
}
