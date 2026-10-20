'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlashSignLogo } from '@/components/shared/flash-sign-logo';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth-validation';
import { ArrowLeft, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 paper-grain">
      <div className="w-full max-w-md my-auto">
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
          <div className="text-center mb-6">
            <FlashSignLogo showBadge size="md" />
          </div>

          {!isSuccess ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
                  Set new password
                </h1>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                  Choose a robust password to test Flash Sign&apos;s client-side password verification.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                    New Password <span className="text-[var(--danger)]">*</span>
                  </label>
                  <PasswordInput
                    placeholder="Enter at least 8 characters"
                    error={!!errors.password}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-[var(--danger)] mt-1">{errors.password.message}</p>
                  )}

                  {/* Password Strength Meter */}
                  <PasswordStrength password={passwordValue} />
                </div>

                {/* Confirm Password */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                    Confirm New Password <span className="text-[var(--danger)]">*</span>
                  </label>
                  <PasswordInput
                    placeholder="Re-enter your new password"
                    error={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-[var(--danger)] mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success confirmation */
            <div className="text-center py-2 animate-fade-up space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[var(--flash-deep)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[var(--ink)]">
                  Password Updated (Simulated)
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                  Your new demo password was verified locally. You can now return to the login screen and enter any credentials to access the workspace.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[var(--line)]">
            <PrototypeNotice
              variant="subtle"
              message="Simulated password reset. No real account passwords are modified or stored."
            />
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
