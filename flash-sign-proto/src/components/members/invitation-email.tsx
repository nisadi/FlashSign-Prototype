'use client';

import React, { useState } from 'react';
import { Copy, Check, KeyRound, Mail } from 'lucide-react';
import type { DemoInvitation } from '@/types/demo-auth';
import { isOwnerInvitation } from '@/lib/invitations';
import { formatDate } from '@/lib/utils';

/**
 * The invitation email, with its one-time temporary password. The prototype sends no email,
 * so the sender sees it here, once. Only the password's hash is stored
 * (invitation.temp_password_hash); outbound_email keeps the body with the password masked.
 */
export function InvitationEmailCard({
  invitation,
  tempPassword,
  roleName,
}: {
  invitation: DemoInvitation;
  tempPassword: string;
  roleName: string;
}) {
  const [copied, setCopied] = useState(false);
  const loginUrl = typeof window === 'undefined' ? '/login' : `${window.location.origin}/login`;
  const owner = isOwnerInvitation(invitation);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the password is still visible to select by hand
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5" /> Invitation email
      </p>
      <div className="rounded-xl border border-line bg-paper-elevated shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-line space-y-0.5 text-[11px]">
          <p><span className="text-muted">From:</span> <span className="text-ink">Flash Sign &lt;no-reply@flashsign.io&gt;</span></p>
          <p className="truncate"><span className="text-muted">To:</span> <span className="text-ink">{invitation.email}</span></p>
          <p className="font-semibold text-ink pt-1">
            {owner
              ? `You're invited to become the Owner of ${invitation.organizationName} on Flash Sign`
              : `${invitation.invitedByName} invited you to join ${invitation.organizationName} on Flash Sign`}
          </p>
        </div>
        <div className="px-4 py-4 space-y-3 text-ink leading-relaxed">
          <p>Hi {invitation.fullName?.split(' ')[0] || 'there'},</p>
          <p>
            You&apos;ve been invited to join <strong>{invitation.organizationName}</strong> as <strong>{roleName}</strong>.
            Sign in at <span className="font-mono">{loginUrl}</span> with:
          </p>
          <div className="rounded-lg bg-mist/50 border border-line p-3 space-y-1.5">
            <p><span className="text-muted">Email:</span> <span className="font-mono">{invitation.email}</span></p>
            <div className="flex items-center gap-2">
              <span className="text-muted">Temporary password:</span>
              <span className="font-mono font-bold tracking-wide">{tempPassword}</span>
              <button
                type="button"
                onClick={copy}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md border border-line bg-paper-elevated font-semibold hover:bg-mist shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-flash-deep" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            It works once, until {formatDate(invitation.expiresAt)}. You&apos;ll set your own password when you first sign in.
          </p>
        </div>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] text-muted">
        <KeyRound className="w-3.5 h-3.5 shrink-0 mt-px" />
        Prototype: no email is sent, so the temporary password is shown here. This is the only time it appears; Flash Sign
        keeps only a scrambled copy. Resending makes a new one.
      </p>
    </div>
  );
}
