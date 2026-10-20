'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { workspaceCreateSchema, type WorkspaceCreateFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { slugify } from '@/lib/utils';
import { PRESET_AVATAR_COLORS } from '@/types/demo-auth';
import { ArrowLeft, ArrowRight, Globe, Building2, Check, Sparkles } from 'lucide-react';

const ORG_TYPES = [
  'Software Development',
  'Consulting',
  'Design Agency',
  'Technology Startup',
  'Other',
];

const COMPANY_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '500+ employees',
];

export default function DedicatedWorkspaceNewPage() {
  const router = useRouter();
  const { createWorkspace, currentUser } = useDemoAuth();
  const [selectedAccent, setSelectedAccent] = useState(PRESET_AVATAR_COLORS[0].value);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkspaceCreateFormData>({
    resolver: zodResolver(workspaceCreateSchema),
    defaultValues: {
      name: '',
      type: 'Software Development',
      companySize: '11–50 employees',
      description: '',
      accentColor: PRESET_AVATAR_COLORS[0].value,
    },
  });

  const watchedName = watch('name', '');
  const watchedType = watch('type', 'Software Development');
  const watchedSize = watch('companySize', '11–50 employees');
  const watchedDesc = watch('description', '');

  const generatedSlug = slugify(watchedName) || 'my-workspace';
  const initials = watchedName
    ? watchedName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'WS';

  const onSubmit = (data: WorkspaceCreateFormData) => {
    createWorkspace(
      data.name,
      data.type,
      data.companySize,
      data.description,
      selectedAccent
    );
    router.push('/onboarding/profile');
  };

  return (
    <OnboardingStepLayout
      currentStep="workspace"
      title="Set up your workspace"
      subtitle="Establish your organization hub to organize projects, AI agent runs, and digital agreements."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-4">
            {/* Workspace Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Workspace / Organization Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Digital Systems"
                {...register('name')}
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                  errors.name
                    ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                    : 'border-[var(--line)]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[var(--danger)] mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Generated URL Slug Preview */}
            <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-xs space-y-1">
              <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
                Simulated Workspace URL
              </span>
              <p className="font-mono text-[11px] text-[var(--muted)] break-all">
                https://flashsign.app/w/<span className="text-[var(--flash-deep)] font-bold">{generatedSlug}</span>
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                Display-only preview — no domain is reserved.
              </p>
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Organization Type <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Company Size <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                {...register('companySize')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
              >
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Workspace Accent Color
              </label>
              <div className="flex items-center gap-2">
                {PRESET_AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedAccent(c.value)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
                      selectedAccent === c.value
                        ? 'ring-2 ring-offset-2 ring-[var(--ink)] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                    aria-label={c.label}
                  >
                    {selectedAccent === c.value && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Workspace Mission or Focus (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe your team's objective or client base"
                {...register('description')}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
              />
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-3">
            <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              Live Workspace Card Preview:
            </span>

            {/* Mock Preview Card */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
                  style={{ backgroundColor: selectedAccent }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[var(--ink)] truncate">
                    {watchedName || 'Your Workspace Name'}
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {watchedDesc || `${watchedType} • ${watchedSize}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
                  {watchedType}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--paper-elevated)] border border-[var(--line)] text-[var(--muted)]">
                  {watchedSize}
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--line)] text-[11px] text-[var(--muted)] flex items-center justify-between">
                <span>1 member (You)</span>
                <span className="text-[var(--flash-deep)] font-semibold">Ready to launch</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-[var(--ink-soft)] leading-relaxed">
              <strong className="text-emerald-950">Next:</strong> After setting up your workspace, you will configure your user profile and workspace preferences.
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 border-t border-[var(--line)] flex items-center justify-between">
          <Link
            href="/workspace"
            className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspaces</span>
          </Link>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Continue to Profile Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </OnboardingStepLayout>
  );
}
