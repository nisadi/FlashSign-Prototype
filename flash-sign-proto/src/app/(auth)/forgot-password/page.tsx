'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { AuthCard } from '@/components/auth/auth-card';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/auth-validation';
import { useRouter } from 'next/navigation';
import { VerificationCodeStep, issueVerificationCode, type MockVerificationCode } from '@/components/auth/verification-code-step';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  // verification_code (purpose password_reset), kept in page state for the prototype
  const [code, setCode] = useState<MockVerificationCode | null>(null);
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
    // The same answer whether or not the account exists, so emails can't be discovered
    setCode(issueVerificationCode('password_reset', data.email.trim().toLowerCase()));
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

          {!code ? (
            <>
              {/* Form State */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                  Reset your password
                </h1>
                <p className="text-xs text-[var(--muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Enter your work email address and we will send you a 6-digit code to reset your password.
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
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send code</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Code step: 6 digits, locked after 5 wrong tries, resend after 60 seconds */
            <VerificationCodeStep
              record={code}
              onChange={setCode}
              onChangeEmail={() => setCode(null)}
              onVerified={() => router.push(`/reset-password?email=${encodeURIComponent(code.email)}&verified=1`)}
            />
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
