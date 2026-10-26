'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { signUpSchema, type SignUpFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowRight, Loader2, UserPlus, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, pendingSignupUser } = useDemoAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      jobTitle: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  // Pre-fill form if user is navigating back from create organization
  useEffect(() => {
    if (pendingSignupUser) {
      reset({
        fullName: pendingSignupUser.fullName || '',
        email: pendingSignupUser.email || '',
        jobTitle: pendingSignupUser.jobTitle || '',
        password: pendingSignupUser.password || '',
        confirmPassword: pendingSignupUser.password || '',
        terms: true,
      });
    }
  }, [pendingSignupUser, reset]);

  const passwordValue = watch('password', '');

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    // Simulate brief client-side processing
    await new Promise((resolve) => setTimeout(resolve, 400));

    const result = signUp({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      jobTitle: data.jobTitle,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error || 'Unable to complete sign up. Please try again.');
      return;
    }

    // Redirect to Create Organization flow
    router.push('/onboarding/create-organization');
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Step 1 of 2
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              New User Sign Up
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Create your account
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Sign up to start coordinating projects, automating AI workflows, and signing documents with Flash Sign.
          </p>
        </div>

        {/* Global validation error banner */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--danger)]" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Full Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Maya Lin"
              {...register('fullName')}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.fullName
                  ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                  : 'border-[var(--line)] hover:border-[var(--muted)]'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Email Address <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.email
                  ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]'
                  : 'border-[var(--line)] hover:border-[var(--muted)]'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Job Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Job Title <span className="text-[var(--muted)] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. VP of Engineering, Project Director"
              {...register('jobTitle')}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] hover:border-[var(--muted)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Password <span className="text-[var(--danger)]">*</span>
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="At least 8 characters (letters & numbers)"
              error={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
            )}
            {/* Real-time Password Strength Meter */}
            <PasswordStrength password={passwordValue} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Confirm Password <span className="text-[var(--danger)]">*</span>
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-[var(--danger)] mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms & Privacy Policy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms')}
                className="w-4 h-4 mt-0.5 rounded border-[var(--line)] text-[var(--flash-deep)] focus:ring-[var(--flash)] shrink-0"
              />
              <span className="text-xs text-[var(--ink-soft)] leading-relaxed select-none">
                I agree to the Flash Sign{' '}
                <span className="text-[var(--flash-deep)] font-semibold underline underline-offset-2">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-[var(--flash-deep)] font-semibold underline underline-offset-2">
                  Privacy Policy
                </span>
                .
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.terms.message}</p>
            )}
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Prototype Notice */}
        <div className="mt-4">
          <PrototypeNotice
            variant="banner"
            message="Frontend prototype only. Mock user data is stored safely in local browser state."
          />
        </div>

        {/* Link for Existing Users */}
        <div className="mt-5 pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--flash-deep)] hover:underline"
          >
            Log in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
