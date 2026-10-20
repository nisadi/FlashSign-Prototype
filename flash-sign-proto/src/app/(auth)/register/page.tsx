'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { registerSchema, type RegisterFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerDemoUser } = useDemoAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      companyName: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Save demo user to local state (WITHOUT password)
    registerDemoUser(data.fullName, data.email, data.companyName);
    setIsSubmitting(false);
    // Proceed to onboarding flow (workspace selection / creation)
    router.push('/workspace');
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Get Started
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              Demo Registration
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Create your demo account
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Experience complete project management, AI agent workflows, and digital agreements.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Full Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Jordan Miller"
              {...register('fullName')}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.fullName ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Work Email Address <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="jordan@company.com"
              {...register('email')}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.email ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Company Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Company or Organization Name <span className="text-[var(--muted)] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Innovations Inc."
              {...register('companyName')}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Password <span className="text-[var(--danger)]">*</span>
            </label>
            <PasswordInput
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
            )}
            {/* Real-time Strength Meter */}
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

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms')}
                className="w-4 h-4 mt-0.5 rounded border-[var(--line)] text-[var(--flash-deep)] focus:ring-[var(--flash)] shrink-0"
              />
              <span className="text-xs text-[var(--ink-soft)] leading-relaxed select-none">
                I agree to the Flash Sign{' '}
                <span className="text-[var(--flash-deep)] font-medium underline">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-[var(--flash-deep)] font-medium underline">
                  Privacy Policy
                </span>
                .
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-[var(--danger)] mt-1 ml-6.5">{errors.terms.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating demo account...</span>
              </>
            ) : (
              <>
                <span>Create demo account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Prototype Notice */}
        <div className="mt-4">
          <PrototypeNotice
            variant="banner"
            message="Prototype only — no real account is created on a server and passwords are not stored."
          />
        </div>

        {/* Sign In Link */}
        <div className="mt-5 pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--flash-deep)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
