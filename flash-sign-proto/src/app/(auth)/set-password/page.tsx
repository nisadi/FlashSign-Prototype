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
import { acceptInviteSchema, type AcceptInviteFormData } from '@/lib/auth-validation';
import { invitationRoleName, isOwnerInvitation } from '@/lib/invitations';
import { checkTempPassword } from '@/lib/temp-password';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowRight, Loader2, AlertCircle, Lock, KeyRound, Building2 } from 'lucide-react';

const fieldClass = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
    hasError ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)] hover:border-[var(--muted)]'
  }`;

/**
 * First login, step 2. The person signed in with the temporary password from their invitation
 * email (step 1, at /login); now they set their own password. Only then is their account
 * (users row) created and the invitation accepted (tables.txt `invitation`).
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const { isHydrated, firstLoginInvitation: invite, completeFirstLogin, roles } = useDemoAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    mode: 'onTouched',
    values: {
      fullName: invite?.fullName ?? '',
      jobTitle: invite?.jobTitle ?? '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    resetOptions: { keepDirtyValues: true },
  });
  const passwordValue = watch('password', '');

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!invite) return;
    // Their own password, not the temporary one from the email
    if (checkTempPassword(data.password, invite.tempPasswordHash)) {
      setError('password', { message: 'Choose a new password, not the temporary one from the email.' });
      return;
    }
    setServerError(null);
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    const result = completeFirstLogin({ fullName: data.fullName, password: data.password, jobTitle: data.jobTitle });
    setIsSubmitting(false);
    if (!result.success) {
      setServerError(result.error ?? 'Unable to finish signing in. Please try again.');
      return;
    }
    if (result.requiresOrganizationSetup) router.replace('/onboarding/complete-organization');
    else if (result.rbacUser?.dashboardAccess.defaultDashboard === 'my-status') router.replace('/projects/home');
    else router.replace('/dashboard');
  };

  const owner = invite ? isOwnerInvitation(invite) : false;

  return (
    <AuthLayout>
      <AuthCard>
        {!isHydrated ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !invite ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--mist)] flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-[var(--muted)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--ink)]">Sign in with your temporary password first</h2>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                Use the email address and temporary password from your invitation email. You&apos;ll set your own password next.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm"
            >
              Go to sign in <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">Set your password</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
                  {invitationRoleName(invite, roles)}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                {owner ? `Become the Owner of ${invite.organizationName}` : `Join ${invite.organizationName}`}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                Your temporary password worked. Check your name and choose your own password; the temporary one stops working.
              </p>
              {invite.message && (
                <blockquote className="mt-3 border-l-2 border-[var(--flash)] pl-3 text-xs text-[var(--ink-soft)] italic whitespace-pre-line">
                  {invite.message}
                </blockquote>
              )}
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Email Address</label>
                <div className="relative">
                  <input type="email" value={invite.email} readOnly className={`${fieldClass(false)} pr-9 bg-[var(--mist)]/40 text-[var(--ink-soft)]`} />
                  <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-label="Set by the invitation" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Full Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input type="text" autoComplete="name" placeholder="e.g. Maya Lin" {...register('fullName')} className={fieldClass(!!errors.fullName)} />
                {errors.fullName && <p className="text-xs text-[var(--danger)] mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Job Title <span className="text-[var(--muted)] font-normal">(Optional)</span>
                </label>
                <input type="text" placeholder="e.g. Frontend Developer" {...register('jobTitle')} className={fieldClass(false)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  New Password <span className="text-[var(--danger)]">*</span>
                </label>
                <PasswordInput autoComplete="new-password" placeholder="At least 8 characters (letters & numbers)" error={!!errors.password} {...register('password')} />
                {errors.password && <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>}
                <PasswordStrength password={passwordValue} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Confirm New Password <span className="text-[var(--danger)]">*</span>
                </label>
                <PasswordInput autoComplete="new-password" placeholder="Re-enter your password" error={!!errors.confirmPassword} {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-xs text-[var(--danger)] mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" {...register('terms')} className="w-4 h-4 mt-0.5 rounded border-[var(--line)] text-[var(--flash-deep)] focus:ring-[var(--flash)] shrink-0" />
                  <span className="text-xs text-[var(--ink-soft)] leading-relaxed select-none">
                    I agree to the Flash Sign{' '}
                    <span className="text-[var(--flash-deep)] font-semibold underline underline-offset-2">Terms of Service</span> and{' '}
                    <span className="text-[var(--flash-deep)] font-semibold underline underline-offset-2">Privacy Policy</span>.
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-[var(--danger)] mt-1">{errors.terms.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                ) : (
                  <><Building2 className="w-4 h-4" /><span>Save password and continue</span><ArrowRight className="w-4 h-4 ml-0.5" /></>
                )}
              </button>
            </form>

            <div className="mt-4">
              <PrototypeNotice variant="banner" message="Frontend prototype only. Mock user data is stored safely in local browser state." />
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
