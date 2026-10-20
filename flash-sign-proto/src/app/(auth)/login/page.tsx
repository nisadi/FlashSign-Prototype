'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { loginSchema, type LoginFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { DEMO_PRESET_USERS } from '@/types/demo-auth';
import { ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useDemoAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_PRESET_USERS[0].email,
      password: 'DemoPassword2026!',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 450));
    login(data.email, data.rememberMe);
    setIsSubmitting(false);
    router.push('/workspace');
  };

  const handleSelectPreset = (presetEmail: string, presetId: string) => {
    setValue('email', presetEmail, { shouldValidate: true });
    setValue('password', 'DemoPassword2026!', { shouldValidate: true });
    setActivePreset(presetId);
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Demo Access
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              Frontend Mode
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Welcome back
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Sign in to explore the Flash Sign unified project and signature suite.
          </p>
        </div>

        {/* Quick Demo Persona Selector */}
        <div className="mb-5 p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
            <span>Quick-fill demo persona:</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_PRESET_USERS.map((preset) => {
              const isSelected = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.email, preset.id)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[var(--flash-deep)] text-white shadow-xs font-medium'
                      : 'bg-[var(--paper-elevated)] hover:bg-[var(--mist)]/60 text-[var(--ink-soft)] border border-[var(--line)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: preset.avatarColor }}
                    />
                    <span className="truncate">
                      <strong>{preset.fullName}</strong> — {preset.jobTitle}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3 h-3 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Work Email Address <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register('email')}
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.email ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)] hover:border-[var(--muted)]'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--ink)]">
                Password <span className="text-[var(--danger)]">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--flash-deep)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Enter password"
              error={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-[var(--line)] text-[var(--flash-deep)] focus:ring-[var(--flash)]"
              />
              <span className="text-xs text-[var(--ink-soft)] select-none">
                Remember this device for demo
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to Flash Sign</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Prototype Disclaimer */}
        <div className="mt-5">
          <PrototypeNotice
            variant="banner"
            message="No server verification. Any valid email and password will simulate login."
          />
        </div>

        {/* Footer Link to Register */}
        <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          Don&apos;t have a demo account?{' '}
          <Link
            href="/register"
            className="font-semibold text-[var(--flash-deep)] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
