'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { AuthCard } from '@/components/auth/auth-card';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/auth-validation';
import { ArrowLeft, Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 paper-grain">
      <div className="w-full max-w-md my-auto">
        {/* Back Link */}
        <div className="mb-4 text-left">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>

        <AuthCard>
          {/* Logo */}
          <div className="text-center mb-6">
            <FlashSignLogo showBadge size="md" />
          </div>

          {!isSubmitted ? (
            <>
              {/* Form State */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                  Reset your password
                </h1>
                <p className="text-xs text-[var(--muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Enter your verified work email address and we will generate a simulated password reset link for this prototype.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                    Work Email Address <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
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
                  </div>
                  {errors.email && (
                    <p className="text-xs text-[var(--danger)] mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send reset link</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Confirmation State */
            <div className="text-center py-2 animate-fade-up space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[var(--flash-deep)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">
                  Simulated Link Sent
                </h2>
                <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                  If this were a live production account, password-reset instructions would be dispatched to:
                </p>
                <p className="text-xs font-semibold text-[var(--ink)] mt-1 bg-[var(--paper)] py-1 px-2 rounded-md border border-[var(--line)] inline-block">
                  {submittedEmail}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-[var(--ink-soft)] text-left leading-relaxed">
                <p className="font-semibold text-emerald-900 mb-1">Prototype Simulation:</p>
                No real emails are dispatched. You can proceed directly to the reset password screen to test the form controls and strength meter.
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/reset-password"
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Reset Password Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full py-2 px-3 text-xs text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 rounded-lg transition-colors"
                >
                  Try another email address
                </button>
              </div>
            </div>
          )}

          {/* Prototype Notice */}
          <div className="mt-6 pt-4 border-t border-[var(--line)]">
            <PrototypeNotice
              variant="subtle"
              message="No email delivery services or database lookups are performed."
            />
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
