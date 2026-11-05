'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';
import { loginSchema, type LoginFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Building2,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { DemoUserAccount } from '@/lib/rbac';

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    authMessage,
    clearAuthMessage,
    demoAccounts,
    switchDemoAccount,
    pendingSignupUser,
  } = useDemoAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('demo-owner');
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'owner@flashsign.com',
      password: 'Demo123!',
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (pendingSignupUser?.email && pendingSignupUser?.organizationSetupCompleted) {
      setValue('email', pendingSignupUser.email, { shouldValidate: true });
      if (pendingSignupUser.password) {
        setValue('password', pendingSignupUser.password, { shouldValidate: true });
      }
    }
  }, [pendingSignupUser, setValue]);

  const handle1ClickLogin = async (account: DemoUserAccount) => {
    setLoggingInId(account.id);
    setErrorMessage(null);

    await new Promise((resolve) => setTimeout(resolve, 300));
    switchDemoAccount(account.id);

    setLoggingInId(null);

    // Direct routing based on user permissions
    if (account.isSuperAdmin) {
      router.push('/super-admin');
    } else if (account.dashboardAccess.defaultDashboard === 'my-status') {
      router.push('/projects/home');
    } else {
      router.push('/dashboard');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 350));

    const result = login(data.email, data.password, data.rememberMe);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.requiresOrgSetup) {
        router.push('/onboarding/create-organization');
        return;
      }
      setErrorMessage(result.error || 'Invalid email or password. Please try again.');
      return;
    }

    // Direct route based on authenticated account
    if (result.rbacUser?.isSuperAdmin) {
      router.push('/super-admin');
    } else if (result.rbacUser?.dashboardAccess.defaultDashboard === 'my-status') {
      router.push('/projects/home');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSelectAccountForForm = (account: DemoUserAccount) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', 'Demo123!', { shouldValidate: true });
    setSelectedAccountId(account.id);
    setErrorMessage(null);
  };

  return (
    <AuthLayout>
      <AuthCard className="max-w-2xl">
        {/* Card Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">
              Welcome to FlashSign
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-flash-deep border border-emerald-200 font-semibold">
              Prototype RBAC Mode
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
            Sign in to Your Workspace
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Choose a demo role below to explore the updated role-based access control, customized permissions, and dual dashboards.
          </p>
        </div>

        {/* Success message banner */}
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

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--danger)]" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* 6 Predefined Demo Users Grid */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              <span>Select a Demo Account (1-Click Login):</span>
            </div>
            <span className="text-[10px] text-muted font-mono">Password: Demo123!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((account) => {
              const isSelected = selectedAccountId === account.id;
              const isBusy = loggingInId === account.id;

              return (
                <div
                  key={account.id}
                  onClick={() => handleSelectAccountForForm(account)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative group ${
                    isSelected
                      ? 'bg-paper-elevated border-flash ring-2 ring-flash/30 shadow-sm'
                      : 'bg-paper hover:bg-paper-elevated border-line hover:border-muted text-ink-soft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: account.avatarColor }}
                      >
                        {account.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate leading-tight">
                          {account.name}
                        </p>
                        <p className="text-[11px] text-muted truncate font-mono">
                          {account.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        account.isSuperAdmin
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : account.isOwner
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : account.projectAccess === 'management'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {account.roleName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                    <span className="px-1.5 py-0.5 rounded bg-mist/80 border border-line/60">
                      Dashboard:{' '}
                      <strong className="text-ink">
                        {account.isSuperAdmin
                          ? 'Super Admin'
                          : account.dashboardAccess.adminDashboard && account.dashboardAccess.myStatus
                          ? 'Admin + Status'
                          : account.dashboardAccess.adminDashboard
                          ? 'Admin Only'
                          : 'My Status Only'}
                      </strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-mist/80 border border-line/60">
                      Projects:{' '}
                      <strong className="text-ink">
                        {account.projectAccess === 'management'
                          ? 'Management (All)'
                          : `Assigned (${account.assignedProjectIds.length})`}
                      </strong>
                    </span>
                  </div>

                  {/* 1-Click Fast Login Button */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      handle1ClickLogin(account);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-mist hover:bg-flash-deep hover:text-white transition-all text-ink border border-line flex items-center justify-center gap-1.5 mt-0.5 cursor-pointer shadow-2xs"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>1-Click Sign In as {account.roleName}</span>
                        <ArrowRight className="w-3 h-3 text-flash-deep group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Standard Manual Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t border-line">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-medium text-ink">Or sign in with custom credentials:</span>
            <span className="text-[11px]">Fields are prefilled with selected demo persona</span>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Email Address <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register('email')}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
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
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Password <span className="text-[var(--danger)]">*</span>
            </label>
            <PasswordInput
              {...register('password')}
              error={Boolean(errors.password)}
              placeholder="Enter password (default: Demo123!)"
            />
            {errors.password && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white hover:text-[var(--ink)] font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to Selected Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
