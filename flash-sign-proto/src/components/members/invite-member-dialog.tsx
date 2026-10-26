'use client';

import React, { useState } from 'react';
import { Send, Copy, Check, Mail, UserPlus, X, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import { INVITABLE_ROLES, INVITE_VALID_DAYS, inviteLink, roleTitle } from '@/lib/invitations';
import type { DemoInvitation, DemoRole } from '@/types/demo-auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs';

/** Owner sends an invitation; the preview shows the email the person will get. */
export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { users } = useApp();
  const { sendInvitation, currentUser, selectedWorkspace } = useDemoAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<DemoRole>('developer');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<DemoInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];
  const inviter = currentUser?.fullName ?? 'Your workspace owner';
  const orgName = selectedWorkspace.name;

  const reset = () => {
    setEmail('');
    setFullName('');
    setRole('developer');
    setJobTitle('');
    setDepartment('');
    setMessage('');
    setError(null);
    setSent(null);
    setCopied(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    const member = users.find(u => u.email.toLowerCase() === trimmed.toLowerCase());
    if (member) {
      setError(`${member.name} is already a member.`);
      return;
    }
    const result = sendInvitation({ email: trimmed, fullName, role, jobTitle, department, message });
    if (!result.success || !result.invitation) {
      setError(result.error ?? 'Could not send the invitation.');
      return;
    }
    setError(null);
    setSent(result.invitation);
  };

  const copyLink = async () => {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(inviteLink(sent));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is still visible to select by hand
    }
  };

  return (
    <Modal isOpen={open} onClose={close} size="xl" aria-labelledby="invite-title">
      {sent ? (
        <div className="p-6 sm:p-8 space-y-5 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-8 h-8 text-flash-deep shrink-0" />
            <div>
              <h2 id="invite-title" className="text-base font-bold text-ink">Invitation sent</h2>
              <p className="text-muted mt-0.5">
                {sent.fullName ?? sent.email} will get an email to join {orgName} as {roleTitle(sent.role)}.
                They&apos;ll appear under Members once they create their account; until then they&apos;re in the Invited tab.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-ink">Invitation link</p>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink(sent)} onFocus={e => e.target.select()} className={`${inputClass} font-mono text-[11px]`} aria-label="Invitation link" />
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-paper-elevated font-semibold text-ink hover:bg-mist shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-flash-deep" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <p className="text-[11px] text-muted">
              Prototype: no email is actually sent. Open this link in a private window to join as the invited person.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button type="button" onClick={reset} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-ink hover:bg-mist font-semibold">
              <UserPlus className="w-3.5 h-3.5" /> Invite another
            </button>
            <button type="button" onClick={close} className="px-4 py-2 rounded-lg bg-ink text-white font-semibold">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="text-xs">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
            <div>
              <h2 id="invite-title" className="text-base font-bold text-ink">Invite people to {orgName}</h2>
              <p className="text-muted mt-0.5">They get an email with a link to create their account and join straight away.</p>
            </div>
            <button type="button" onClick={close} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Form */}
            <div className="p-6 space-y-3.5">
              <label className="block space-y-1">
                <span className="font-semibold text-ink">Email address <span className="text-danger">*</span></span>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-ink">Full name <span className="text-muted font-normal">(optional)</span></span>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="They can change it when they join" className={inputClass} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-semibold text-ink">Role</span>
                  <select value={role} onChange={e => setRole(e.target.value as DemoRole)} className={inputClass}>
                    {INVITABLE_ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-ink">Department</span>
                  <input value={department} onChange={e => setDepartment(e.target.value)} list="invite-departments" placeholder="e.g. Engineering" className={inputClass} />
                  <datalist id="invite-departments">
                    {departments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </label>
              </div>
              <label className="block space-y-1">
                <span className="font-semibold text-ink">Job title <span className="text-muted font-normal">(optional)</span></span>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Developer" className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-ink">Personal message <span className="text-muted font-normal">(optional)</span></span>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Add a note to the invitation email"
                  className={`${inputClass} resize-none`}
                />
              </label>
              {error && <p className="text-danger font-medium" role="alert">{error}</p>}
            </div>

            {/* Email preview */}
            <div className="p-6 bg-paper/70 border-t lg:border-t-0 lg:border-l border-line">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email preview
              </p>
              <div className="rounded-xl border border-line bg-paper-elevated shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-line space-y-0.5 text-[11px]">
                  <p><span className="text-muted">From:</span> <span className="text-ink">Flash Sign &lt;no-reply@flashsign.io&gt;</span></p>
                  <p className="truncate"><span className="text-muted">To:</span> <span className="text-ink">{email.trim() || 'name@company.com'}</span></p>
                  <p className="font-semibold text-ink pt-1">{inviter} invited you to join {orgName} on Flash Sign</p>
                </div>
                <div className="px-4 py-4 space-y-3 text-ink leading-relaxed">
                  <p>Hi {fullName.trim().split(' ')[0] || 'there'},</p>
                  <p>
                    <strong>{inviter}</strong> has invited you to join <strong>{orgName}</strong> on Flash Sign as{' '}
                    <strong>{roleTitle(role)}</strong>{department.trim() && <> in {department.trim()}</>}.
                  </p>
                  {message.trim() && (
                    <blockquote className="border-l-2 border-flash pl-3 text-ink-soft italic whitespace-pre-line">{message.trim()}</blockquote>
                  )}
                  <span className="inline-block px-4 py-2 rounded-lg bg-flash-deep text-white font-semibold">Accept invitation</span>
                  <p className="text-[11px] text-muted">
                    The link expires in {INVITE_VALID_DAYS} days. You&apos;ll set your name and password, then go straight to the {orgName} workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line">
            <button type="button" onClick={close} className="px-3.5 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold">
              <Send className="w-3.5 h-3.5" /> Send invitation
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
