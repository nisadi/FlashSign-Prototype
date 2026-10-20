'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export type OnboardingStepId = 'workspace' | 'profile' | 'preferences' | 'complete';

interface StepDef {
  id: OnboardingStepId;
  label: string;
  href: string;
  stepNumber: number;
}

const STEPS: StepDef[] = [
  { id: 'workspace', label: 'Workspace', href: '/workspace', stepNumber: 1 },
  { id: 'profile', label: 'User Profile', href: '/onboarding/profile', stepNumber: 2 },
  { id: 'preferences', label: 'Preferences', href: '/onboarding/preferences', stepNumber: 3 },
  { id: 'complete', label: 'Ready', href: '/onboarding/complete', stepNumber: 4 },
];

interface OnboardingProgressProps {
  currentStep: OnboardingStepId;
  completedSteps?: string[];
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  completedSteps = [],
  className = '',
}: OnboardingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={`w-full max-w-2xl mx-auto py-4 ${className}`}>
      {/* Mobile step display */}
      <div className="flex sm:hidden items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold text-[var(--flash-deep)] uppercase tracking-wider">
          Step {currentIndex + 1} of {STEPS.length}
        </span>
        <span className="text-xs font-bold text-[var(--ink)]">
          {STEPS[currentIndex]?.label}
        </span>
      </div>

      <nav aria-label="Onboarding Progress" className="relative">
        <ol className="flex items-center justify-between w-full">
          {STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id) || idx < currentIndex;
            const isCurrent = step.id === currentStep;
            const canNavigate = idx < currentIndex;

            return (
              <li key={step.id} className="relative flex-1 flex flex-col items-center">
                {/* Connector line between steps */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-[2px] transition-colors duration-300 -z-0 ${
                      idx <= currentIndex ? 'bg-[var(--flash-deep)]' : 'bg-[var(--line)]'
                    }`}
                  />
                )}

                {/* Step Circle */}
                {canNavigate ? (
                  <Link
                    href={step.href}
                    className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all bg-[var(--flash-deep)] text-white hover:opacity-90 shadow-xs"
                    title={`Go back to ${step.label}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </Link>
                ) : (
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-[var(--ink)] text-white ring-4 ring-[var(--flash)]/30 shadow-md'
                        : isCompleted
                        ? 'bg-[var(--flash-deep)] text-white'
                        : 'bg-[var(--mist)] text-[var(--muted)] border border-[var(--line)]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.stepNumber}
                  </div>
                )}

                {/* Step Label (Hidden on small mobile) */}
                <span
                  className={`hidden sm:block text-xs font-medium mt-2 text-center transition-colors ${
                    isCurrent
                      ? 'text-[var(--ink)] font-bold'
                      : isCompleted
                      ? 'text-[var(--ink-soft)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
