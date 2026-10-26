'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import {
  createOrganizationSchema,
  generateSlug,
  ORGANIZATION_SIZES,
  ORGANIZATION_INDUSTRIES,
  type CreateOrganizationFormData,
} from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const {
    createOrganization,
    pendingSignupUser,
    currentUser,
    workspaces,
    isHydrated,
  } = useDemoAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const activeUser = pendingSignupUser || currentUser;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      slug: '',
      industry: '',
      size: '',
      website: '',
      description: '',
    },
  });

  const orgName = watch('name');
  const currentSlug = watch('slug');

  // Auto-generate slug as organization name is typed (unless user manually touched slug)
  useEffect(() => {
    if (!slugManuallyEdited && orgName) {
      const generated = generateSlug(orgName);
      setValue('slug', generated, { shouldValidate: true });
    }
  }, [orgName, slugManuallyEdited, setValue]);

  // If page is refreshed and there is no user session at all, redirect to signup
  useEffect(() => {
    if (isHydrated && !pendingSignupUser && !currentUser) {
      router.replace('/signup');
    }
  }, [isHydrated, pendingSignupUser, currentUser, router]);

  const onSubmit = async (data: CreateOrganizationFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    // Simulate brief client-side processing
    await new Promise((resolve) => setTimeout(resolve, 450));

    const result = createOrganization({
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      size: data.size,
      website: data.website,
      description: data.description,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create organization. Please try again.');
      return;
    }

    // Required by prompt:
    // Mark organization setup as completed -> Display success message -> Redirect the user to the Login page.
    // The user must log in after organization creation. Do not automatically redirect them to the dashboard.
    router.push('/login');
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Navigation / Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Step 2 of 2
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              Workspace Setup
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Create Your Organization
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Set up your organization to start managing projects, collaborating with your team, and using Flash Sign.
          </p>

          {activeUser && (
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--paper)] border border-[var(--line)] text-xs text-[var(--ink-soft)]">
              <span className="w-2 h-2 rounded-full bg-[var(--flash)]" />
              <span>
                Owner: <strong>{activeUser.fullName}</strong> ({activeUser.email})
              </span>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--danger)]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Organization Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Organization Name <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Flash Technologies"
                {...register('name')}
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                  errors.name
                    ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                    : 'border-[var(--line)] hover:border-[var(--muted)]'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Workspace Slug / URL */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Workspace Slug <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] focus-within:ring-2 focus-within:ring-[var(--flash)] focus-within:border-[var(--flash)] transition-all overflow-hidden">
              <span className="px-3 py-2.5 text-xs text-[var(--muted)] bg-[var(--paper)] border-r border-[var(--line)] select-none whitespace-nowrap">
                flashsign.com/
              </span>
              <input
                type="text"
                placeholder="flash-technologies"
                {...register('slug', {
                  onChange: () => setSlugManuallyEdited(true),
                })}
                className="w-full px-3 py-2 text-sm bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              {errors.slug ? (
                <p className="text-xs text-[var(--danger)]">{errors.slug.message}</p>
              ) : (
                <p className="text-[11px] text-[var(--muted)]">
                  Unique subdomain for your team workspace URL.
                </p>
              )}
            </div>
          </div>

          {/* Industry & Size Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Industry <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                <select
                  {...register('industry')}
                  className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all appearance-none cursor-pointer ${
                    errors.industry
                      ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                      : 'border-[var(--line)] hover:border-[var(--muted)]'
                  }`}
                >
                  <option value="">Select industry</option>
                  {ORGANIZATION_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              {errors.industry && (
                <p className="text-xs text-[var(--danger)] mt-1">{errors.industry.message}</p>
              )}
            </div>

            {/* Organization Size */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Organization Size <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                <select
                  {...register('size')}
                  className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all appearance-none cursor-pointer ${
                    errors.size
                      ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                      : 'border-[var(--line)] hover:border-[var(--muted)]'
                  }`}
                >
                  <option value="">Select company size</option>
                  {ORGANIZATION_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
              {errors.size && (
                <p className="text-xs text-[var(--danger)] mt-1">{errors.size.message}</p>
              )}
            </div>
          </div>

          {/* Company Website (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Company Website <span className="text-[var(--muted)] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="https://company.com"
                {...register('website')}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] hover:border-[var(--muted)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all"
              />
            </div>
            {errors.website && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.website.message}</p>
            )}
          </div>

          {/* Organization Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Organization Description <span className="text-[var(--muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of your company's mission or main product focus..."
              {...register('description')}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--line)] hover:border-[var(--muted)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all resize-none"
            />
          </div>

          {/* Action Buttons: Back to Sign Up + Create Organization */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-4 py-2.5 rounded-lg border border-[var(--line)] hover:border-[var(--muted)] text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating organization...</span>
                </>
              ) : (
                <>
                  <span>Create Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Prototype Notice */}
        <div className="mt-5">
          <PrototypeNotice
            variant="banner"
            message="On submission, the organization is linked with your mock account and you will be directed to sign in."
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
