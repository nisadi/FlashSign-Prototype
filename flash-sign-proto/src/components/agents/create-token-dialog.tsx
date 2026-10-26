'use client';

import React, { useState } from 'react';
import { KeyRound, AlertTriangle, X } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { generateTokenValue, TOKEN_EXPIRY_OPTIONS } from '@/lib/agent-connection';
import { inputClass, SaveButton } from '@/components/settings/settings-layout';
import { CodeBlock } from './code-block';

/**
 * Create a personal access token. The full value is shown once; afterwards only the
 * last four characters are kept. `onCreated` receives the full value for this page visit.
 */
export function CreateTokenDialog({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated?: (token: string) => void;
}) {
  const { addAgentToken } = useApp();
  const user = useCurrentUser();
  const [name, setName] = useState('Work laptop');
  const [expiryDays, setExpiryDays] = useState(90);
  const [created, setCreated] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!open || !user) return null;

  const reset = () => {
    setName('Work laptop');
    setExpiryDays(90);
    setCreated(null);
    setConfirmed(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const value = generateTokenValue();
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + expiryDays);
    addAgentToken({
      id: `tok-${now.getTime()}`,
      userId: user.id,
      name: name.trim(),
      lastFour: value.slice(-4),
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });
    setCreated(value);
    onCreated?.(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-token-title">
      <div className="w-full max-w-lg bg-paper-elevated rounded-xl border border-line shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="create-token-title" className="text-sm font-bold text-ink flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-flash-deep" />
            {created ? 'Copy your token now' : 'Create a personal token'}
          </h2>
          {!created && (
            <button type="button" onClick={close} className="p-1 rounded text-muted hover:text-ink" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!created ? (
          <div className="p-5 space-y-4 text-xs">
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Name</span>
              <input
                autoFocus
                className={inputClass}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Work laptop"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <span className="block mt-1 text-muted">Name it after the computer. One token on a computer works for all your agents (Claude, Codex, Gemini).</span>
            </label>
            <label className="block">
              <span className="block font-semibold text-ink mb-1">Expires after</span>
              <select className={inputClass} value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))}>
                {TOKEN_EXPIRY_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
            </label>
            <p className="text-muted">
              The token lets your AI agent see your tasks and move them to In Progress or In Review for you.
              It can&apos;t mark tasks Done or change anyone else&apos;s work.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-line bg-paper-elevated hover:bg-mist font-semibold text-ink">
                Cancel
              </button>
              <SaveButton disabled={!name.trim()} onClick={handleCreate}>Create token</SaveButton>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 text-xs">
            <p className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>This is the only time the full token is shown.</strong> Copy it now and keep it private.
                If you lose it, revoke it and create a new one.
              </span>
            </p>
            <CodeBlock code={created} label={name.trim()} />
            <label className="flex items-center gap-2 text-ink cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-flash" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
              I&apos;ve copied my token
            </label>
            <div className="flex justify-end">
              <SaveButton disabled={!confirmed} onClick={close}>Done</SaveButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
