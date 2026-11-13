'use client';

import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, RotateCw, ShieldAlert } from 'lucide-react';

/**
 * A mock of one verification_code row (purpose email_verification or password_reset).
 * Frontend only: the code is generated in the browser and shown on screen instead of emailed.
 *  - attempts: the code is locked after 5 wrong tries
 *  - created_at: drives the 60-second resend cooldown
 *  - expires_at: 10 minutes after it is sent (SRS FR-AUTH-002)
 *  - consumed_at: set once the code is used
 */
export interface MockVerificationCode {
  purpose: 'email_verification' | 'password_reset';
  email: string;
  code: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  consumedAt?: number;
}

export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_COOLDOWN_MS = 60_000;
export const CODE_VALID_MS = 10 * 60_000;

export function issueVerificationCode(purpose: MockVerificationCode['purpose'], email: string): MockVerificationCode {
  const now = Date.now();
  return {
    purpose,
    email,
    code: String(Math.floor(100000 + Math.random() * 900000)),
    attempts: 0,
    createdAt: now,
    expiresAt: now + CODE_VALID_MS,
  };
}

const inputClass =
  'w-full px-3.5 py-2.5 text-center tracking-[0.5em] font-mono text-lg rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all';

export function VerificationCodeStep({
  record,
  onChange,
  onVerified,
  onChangeEmail,
}: {
  record: MockVerificationCode;
  onChange: (next: MockVerificationCode) => void;
  onVerified: () => void;
  onChangeEmail: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // A one-second clock for the resend countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const locked = record.attempts >= CODE_MAX_ATTEMPTS;
  const expired = now >= record.expiresAt;
  const cooldownLeft = Math.max(0, Math.ceil((record.createdAt + CODE_RESEND_COOLDOWN_MS - now) / 1000));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || expired) return;
    if (!/^\d{6}$/.test(value)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setChecking(true);
    await new Promise(r => setTimeout(r, 300));
    setChecking(false);
    if (value !== record.code) {
      const attempts = record.attempts + 1;
      onChange({ ...record, attempts });
      setError(
        attempts >= CODE_MAX_ATTEMPTS
          ? 'Too many wrong codes. Request a new code.'
          : `That code isn't right. ${CODE_MAX_ATTEMPTS - attempts} ${CODE_MAX_ATTEMPTS - attempts === 1 ? 'try' : 'tries'} left.`
      );
      return;
    }
    onChange({ ...record, consumedAt: Date.now() });
    onVerified();
  };

  const resend = () => {
    if (cooldownLeft > 0) return;
    onChange(issueVerificationCode(record.purpose, record.email));
    setValue('');
    setError(null);
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left" noValidate>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[var(--flash-deep)] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ink)]">Enter your code</h2>
        <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
          If an account exists for <strong className="text-[var(--ink)]">{record.email}</strong>, we sent it a 6-digit code.
          It works for 10 minutes.
        </p>
      </div>

      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-[var(--ink-soft)] leading-relaxed">
        <span className="font-semibold text-emerald-900">Prototype:</span> no email is sent. Your code is{' '}
        <span className="font-mono font-bold text-[var(--ink)]">{record.code}</span>.
      </div>

      <div>
        <label htmlFor="verification-code" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
          6-digit code
        </label>
        <input
          id="verification-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          disabled={locked || expired}
          onChange={e => {
            setValue(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          className={`${inputClass} ${error ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'}`}
        />
        {(error || locked || expired) && (
          <p className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1" role="alert">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            {expired && !locked ? 'This code has expired. Request a new code.' : locked ? 'Too many wrong codes. Request a new code.' : error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={checking || locked || expired}
        className="w-full py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {checking && <Loader2 className="w-4 h-4 animate-spin" />}
        Verify code
      </button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onChangeEmail} className="text-[var(--muted)] hover:text-[var(--ink)]">
          Use another email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldownLeft > 0}
          className="flex items-center gap-1 font-semibold text-[var(--flash-deep)] disabled:text-[var(--muted)] disabled:cursor-not-allowed"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {cooldownLeft > 0 ? `Resend code in ${cooldownLeft}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
