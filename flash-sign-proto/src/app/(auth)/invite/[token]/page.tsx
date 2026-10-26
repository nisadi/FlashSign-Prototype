'use client';

import React, { use, useMemo, useState } from 'react';
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
import { decodeInvite, isInviteExpired, roleTitle } from '@/lib/invitations';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowRight, Loader2, AlertCircle, Lock, MailPlus, Building2 } from 'lucide-react';

const fieldClass = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
    hasError ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)] hover:border-[var(--muted)]'
  }`;

/** Where an invitation link lands: create an account and join the inviting organization directly. */
export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isHydrated, invitations, users, currentUser, isAuthenticated, acceptInvitation } = useDemoAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invite = useMemo(() => decodeInvite(token), [token]);
  const local = invite ? invitations.find(i => i.id === invite.id) : undefined;
  const accountExists = !!invite && users.some(u => u.email.trim().toLowerCase() === invite.email.trim().toLowerCase());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: invite?.fullName ?? '',
      jobTitle: invite?.jobTitle ?? '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });
  const passwordValue = watch('password', '');

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!invite) return;
    setServerError(null);
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    const result = acceptInvitation(invite, { fullName: data.fullName, password: data.password, jobTitle: data.jobTitle });
    setIsSubmitting(false);
    if (!result.success) {
      setServerError(result.error ?? 'Unable to join. Please try again.');
      return;
    }
    router.replace('/dashboard');
  };

  // Links that can't be used: show why, and where to go instead
  let problem: { title: string; body: string; action?: { href: string; label: string } } | null = null;
  if (!isHydrated) {
    problem = null;
  } else if (!invite) {
    problem = { title: 'This invitation link isn’t valid', body: 'The link may be incomplete. Copy the whole link from your invitation email, or ask the workspace owner to send it again.' };
  } else if (local?.status === 'revoked') {
    problem = { title: 'This invitation was cancelled', body: `Ask ${invite.invitedByName} to invite you to ${invite.organizationName} again.` };
  } else if (local?.status === 'accepted' || accountExists) {
    problem = { title: 'You’ve already joined', body: `There is already an account for ${invite.email}. Log in to open ${invite.organizationName}.`, action: { href: '/login', label: 'Log in' } };
  } else if (isInviteExpired(local ?? invite)) {
    problem = { title: 'This invitation has expired', body: `Invitations are valid for 7 days. Ask ${invite.invitedByName} to resend it from the Members page.` };
  }

  return (
    <AuthLayout>
      <AuthCard>
        {!isHydrated ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Opening invitation…
          </div>
        ) : problem ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--mist)] flex items-center justify-center">
              <MailPlus className="w-6 h-6 text-[var(--muted)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--ink)]">{problem.title}</h2>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{problem.body}</p>
            </div>
            {problem.action && (
              <Link
                href={problem.action.href}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm"
              >
                {problem.action.label} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : invite && (
          <>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">You&apos;re invited</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
                  {roleTitle(invite.role)}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Join {invite.organizationName}</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                <strong className="text-[var(--ink)]">{invite.invitedByName}</strong> invited you to work with the team on Flash Sign.
                Create your account to go straight to the workspace.
              </p>
              {invite.message && (
                <blockquote className="mt-3 border-l-2 border-[var(--flash)] pl-3 text-xs text-[var(--ink-soft)] italic whitespace-pre-line">
                  {invite.message}
                </blockquote>
              )}
            </div>

            {isAuthenticated && currentUser && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--mist)] text-xs text-[var(--ink-soft)]">
                You&apos;re signed in as <strong>{currentUser.fullName}</strong>. Joining signs you in with the new account instead.
              </div>
            )}

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
                  Password <span className="text-[var(--danger)]">*</span>
                </label>
                <PasswordInput autoComplete="new-password" placeholder="At least 8 characters (letters & numbers)" error={!!errors.password} {...register('password')} />
                {errors.password && <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>}
                <PasswordStrength password={passwordValue} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Confirm Password <span className="text-[var(--danger)]">*</span>
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
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Joining…</span></>
                ) : (
                  <><Building2 className="w-4 h-4" /><span>Join {invite.organizationName}</span><ArrowRight className="w-4 h-4 ml-0.5" /></>
                )}
              </button>
            </form>

            <div className="mt-4">
              <PrototypeNotice variant="banner" message="Frontend prototype only. Mock user data is stored safely in local browser state." />
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[var(--flash-deep)] hover:underline">Log in</Link>
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
