'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Monitor, Smartphone, LogOut } from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { formatDate } from '@/lib/utils';
import { useNow } from '@/lib/use-now';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { resetPasswordSchema } from '@/lib/auth-validation';
import {
  SettingsPage, SettingsCard, SettingsToggle, SaveButton, SavedNote, useSavedFlash,
} from '@/components/settings/settings-layout';

export default function SecuritySettingsPage() {
  const { sessions, revokeSession, revokeOtherSessions } = useDemoAuth();
  const now = useNow() ?? 0;
  // session rows that still work: not revoked and not past expires_at
  const activeSessions = sessions
    .filter(x => !x.revokedAt && new Date(x.expiresAt).getTime() > now)
    .sort((a, b) => Number(!!b.isCurrent) - Number(!!a.isCurrent) || b.lastSeenAt.localeCompare(a.lastSeenAt));
  const otherCount = activeSessions.filter(x => !x.isCurrent).length;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, flashSaved] = useSavedFlash();

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!current) found.current = 'Enter your current password.';
    // Same rules as Reset Password
    const result = resetPasswordSchema.safeParse({ password: next, confirmPassword: confirm });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] === 'confirmPassword' ? 'confirm' : 'next';
        found[key] ??= issue.message;
      }
    }
    if (!found.next && current && next === current) found.next = 'Choose a password you haven\'t used here.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Demo: there is no auth backend in the prototype, so nothing is stored.
    // Changing the password ends the person's other sessions (session.revoked_at).
    revokeOtherSessions();
    setCurrent('');
    setNext('');
    setConfirm('');
    flashSaved();
  };

  return (
    <SettingsPage title="Security" description="Your password and sign-in protection.">
      <SettingsCard
        title="Change password"
        description="Changing it signs you out on your other devices."
        icon={KeyRound}
      >
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md" noValidate>
          <PasswordField label="Current password" value={current} onChange={setCurrent} error={errors.current} autoComplete="current-password" />
          <div>
            <PasswordField label="New password" value={next} onChange={setNext} error={errors.next} autoComplete="new-password" />
            {next && <div className="mt-2"><PasswordStrength password={next} /></div>}
          </div>
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
          <div className="flex items-center gap-3">
            <SaveButton type="submit">Update password</SaveButton>
            <SavedNote show={saved} text="Password updated (demo)" />
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="Two-step sign-in" icon={ShieldCheck}>
        <SettingsToggle
          label="Ask for a code from an authenticator app when I sign in"
          description="Planned for privileged roles and approval actions."
          checked={false}
          onChange={() => {}}
          disabled
          badge="Coming soon"
        />
      </SettingsCard>

      <SettingsCard
        title="Where you're signed in"
        description="Sessions that are still signed in. Signing one out ends it straight away."
        icon={Monitor}
        footer={
          otherCount > 0 ? (
            <button
              type="button"
              onClick={revokeOtherSessions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink hover:text-danger hover:bg-danger/10 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out of all other sessions ({otherCount})
            </button>
          ) : undefined
        }
      >
        {activeSessions.length === 0 ? (
          <p className="text-muted">No active sessions.</p>
        ) : (
          <ul className="space-y-2">
            {activeSessions.map(sess => {
              const mobile = /iphone|android|mobile/i.test(sess.userAgent);
              const Icon = mobile ? Smartphone : Monitor;
              return (
                <li key={sess.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-paper border border-line">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{sess.userAgent}</p>
                      <p className="text-muted">
                        IP {sess.ipAddress} · {sess.isCurrent ? 'Active now' : `Last active ${formatDate(sess.lastSeenAt)}`}
                      </p>
                      <p className="text-[11px] text-muted">
                        Signed in {formatDate(sess.createdAt)} · {sess.rememberMe ? 'Remembered' : 'Not remembered'} · expires {formatDate(sess.expiresAt)}
                      </p>
                    </div>
                  </div>
                  {sess.isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shrink-0">
                      Current session
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeSession(sess.id)}
                      className="shrink-0 px-2.5 py-1 rounded-md border border-line text-muted hover:text-danger hover:bg-danger/10 font-semibold"
                    >
                      Sign out
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SettingsCard>
    </SettingsPage>
  );
}

function PasswordField({ label, value, onChange, error, autoComplete }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="block font-semibold text-ink mb-1">{label}</span>
      <PasswordInput value={value} onChange={e => onChange(e.target.value)} error={!!error} autoComplete={autoComplete} />
      {error && <span className="block mt-1 text-danger">{error}</span>}
    </label>
  );
}
