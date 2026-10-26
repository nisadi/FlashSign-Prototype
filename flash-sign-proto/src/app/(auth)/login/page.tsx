'use client';

import React, { useState, useEffect } from 'react';
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
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, authMessage, clearAuthMessage, users } = useDemoAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>('user-demo-primary');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@flashsign.com',
      password: 'Demo123!',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    // Simulate brief network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 450));

    const result = login(data.email, data.password, data.rememberMe);

    setIsSubmitting(false);

    if (!result.success) {
      if (result.requiresOrgSetup) {
        // User has not completed organization setup -> redirect to create-organization
        router.push('/onboarding/create-organization');
        return;
      }
      setErrorMessage(result.error || 'Invalid email or password. Please try again.');
      return;
    }

    // Success: Redirect directly to Dashboard
    router.push('/dashboard');
  };

  const handleQuickFill = (email: string, password: string, presetId: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setActivePreset(presetId);
    setErrorMessage(null);
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Welcome Back
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              Frontend Prototype
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Sign in to Flash Sign
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Access your projects, team collaboration, agreements, and AI agent workspaces.
          </p>
        </div>

        {/* Success message banner (e.g. after organization creation) */}
        {authMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start justify-between gap-2 animate-fade-in">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium">{authMessage}</span>
            </div>
            <button
              type="button"
              onClick={clearAuthMessage}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold shrink-0 ml-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Global Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--danger)]" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Demo Credentials Highlight Box */}
        <div className="mb-5 p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
              <KeyRound className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              <span>Recommended Demo Account:</span>
            </div>
            <span className="text-[10px] text-[var(--muted)]">1-Click Fill</span>
          </div>

          {/* Primary Demo Credential Badge */}
          <div
            onClick={() => handleQuickFill('demo@flashsign.com', 'Demo123!', 'user-demo-primary')}
            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
              activePreset === 'user-demo-primary'
                ? 'bg-white border-[var(--flash)] shadow-xs ring-1 ring-[var(--flash)]'
                : 'bg-[var(--paper-elevated)] hover:bg-white border-[var(--line)] text-[var(--ink-soft)]'
            }`}
          >
            <div>
              <p className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                demo@flashsign.com
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Default Demo
                </span>
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Password: <code className="font-mono font-semibold text-[var(--ink)]">Demo123!</code> • Role: Owner / CEO
              </p>
            </div>
            {activePreset === 'user-demo-primary' && (
              <Check className="w-4 h-4 text-[var(--flash-deep)] shrink-0 stroke-[3]" />
            )}
          </div>

          {/* Other Preset Personas Toggle / Dropdown */}
          <div className="pt-1">
            <details className="group text-xs text-[var(--muted)]">
              <summary className="cursor-pointer font-medium hover:text-[var(--ink)] list-none flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--flash-deep)]" />
                  Or switch to other demo roles / test accounts
                </span>
                <span className="text-[11px] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="grid grid-cols-1 gap-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                {users.map((preset) => {
                  const isSelected = activePreset === preset.id;
                  const passwordToUse = preset.password || 'Demo123!';
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleQuickFill(preset.email, passwordToUse, preset.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[var(--flash-deep)] text-white shadow-xs font-medium'
                          : 'bg-[var(--paper-elevated)] hover:bg-[var(--mist)]/60 text-[var(--ink-soft)] border border-[var(--line)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: preset.avatarColor || '#00c2a8' }}
                        />
                        <span className="truncate">
                          <strong>{preset.fullName}</strong> ({preset.email})
                          {!preset.organizationSetupCompleted && (
                            <span className="ml-1 text-[10px] text-amber-500 font-bold">
                              [Incomplete Org]
                            </span>
                          )}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
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

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--ink)]">
                Password <span className="text-[var(--danger)]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotNotice((prev) => !prev)}
                className="text-xs font-medium text-[var(--flash-deep)] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Enter your password"
              error={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
            )}

            {/* Informational Forgot Password message */}
            {showForgotNotice && (
              <div className="mt-2 p-2.5 rounded-lg bg-[var(--mist)]/50 border border-[var(--line)] text-xs text-[var(--ink-soft)] flex items-start gap-2 animate-fade-in">
                <Info className="w-4 h-4 text-[var(--flash-deep)] shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-semibold text-[var(--ink)]">Demo Reset: </span>
                  In this prototype, password recovery is simulated. You can use the demo password{' '}
                  <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-[var(--line)]">
                    Demo123!
                  </code>{' '}
                  for any account, or click on a quick-fill persona above.
                </div>
              </div>
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

          {/* Log In Button */}
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
                <span>Log In</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Prototype Disclaimer */}
        <div className="mt-5">
          <PrototypeNotice
            variant="banner"
            message="Frontend prototype only. Mock accounts validate credentials in client-side state without calling external APIs."
          />
        </div>

        {/* Link for New Users */}
        <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-[var(--flash-deep)] hover:underline"
          >
            Sign up
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
