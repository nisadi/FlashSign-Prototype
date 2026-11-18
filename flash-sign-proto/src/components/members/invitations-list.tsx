'use client';

import React, { useMemo, useState } from 'react';
import { RotateCw, XCircle, MailPlus, Clock, AlertTriangle, Lock } from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { daysLeftText, invitationRoleName, isInviteExpired, isOwnerInvitation } from '@/lib/invitations';
import { MAX_TEMP_PASSWORD_ATTEMPTS } from '@/lib/temp-password';
import { InvitationEmailCard } from '@/components/members/invitation-email';
import { useApp } from '@/context/app-context';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/shared/modal';
import type { DemoInvitation } from '@/types/demo-auth';

/** Members > Invited: people who have been invited but haven't created their account yet. */
export function InvitationsList({ onInvite, canManage }: { onInvite: () => void; canManage: boolean }) {
  const { invitations, selectedWorkspace, resendInvitation, revokeInvitation, roles } = useDemoAuth();
  const { projects } = useApp();
  const [toRevoke, setToRevoke] = useState<DemoInvitation | null>(null);
  // A resend makes a new temporary password, shown once in the email
  const [resent, setResent] = useState<{ invitation: DemoInvitation; tempPassword: string } | null>(null);

  const rows = useMemo(
    () => invitations
      // Owner invitations are the Super Admin's
      .filter(i => i.organizationId === selectedWorkspace.id && i.status === 'pending' && !isOwnerInvitation(i))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [invitations, selectedWorkspace.id]
  );

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 bg-paper-elevated border border-line rounded-xl p-8 space-y-3">
        <MailPlus className="w-12 h-12 text-muted mx-auto stroke-[1.5]" />
        <h3 className="text-base font-bold text-ink">No pending invitations</h3>
        <p className="text-xs text-muted max-w-sm mx-auto">
          Everyone you invited has joined. Invite more people and they&apos;ll wait here until they create their account.
        </p>
        {canManage && (
          <button onClick={onInvite} className="px-4 py-1.5 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg text-xs transition-colors">
            Invite people
          </button>
        )}
      </div>
    );
  }

  const actionClass = 'flex items-center gap-1 px-2 py-1 rounded-md text-muted hover:text-ink hover:bg-mist transition-colors font-medium';

  return (
    <>
      <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mist/40 border-b border-line text-muted uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Invited person</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Projects</th>
                <th className="py-3 px-4">Invited by</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(inv => {
                const expired = isInviteExpired(inv);
                const locked = (inv.failedAttempts ?? 0) >= MAX_TEMP_PASSWORD_ATTEMPTS;
                return (
                  <tr key={inv.id} className="hover:bg-mist/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-dashed border-line bg-paper flex items-center justify-center text-muted shrink-0">
                          <MailPlus className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{inv.fullName ?? inv.email}</p>
                          {inv.fullName && <p className="text-[10px] text-muted truncate">{inv.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-ink">{invitationRoleName(inv, roles)}</p>
                      <p className="text-[10px] text-muted">{inv.jobTitle}</p>
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[180px]">
                      {inv.projectIds.length === 0 ? (
                        <span title="Management roles see every project">All projects</span>
                      ) : (
                        <span className="line-clamp-2">{inv.projectIds.map(id => projects.find(p => p.id === id)?.name ?? id).join(', ')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink">{inv.invitedByName}</td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">{formatDate(inv.sentAt)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Expired {daysLeftText(inv.expiresAt)}
                        </span>
                      ) : locked ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                          title="Too many wrong temporary passwords. Resend to unlock it."
                        >
                          <Lock className="w-3 h-3" /> Locked · resend to unlock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" /> Pending · expires {daysLeftText(inv.expiresAt)}
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const result = resendInvitation(inv.id);
                              if (result) setResent(result);
                            }}
                            className={actionClass}
                            title="Send the email again with a new temporary password, valid for 7 days"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Resend
                          </button>
                          <button type="button" onClick={() => setToRevoke(inv)} className={`${actionClass} hover:!text-danger hover:!bg-danger/10`} title="Cancel this invitation">
                            <XCircle className="w-3.5 h-3.5" /> Revoke
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!toRevoke} onClose={() => setToRevoke(null)} size="xs">
        {toRevoke && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Revoke invitation</h3>
            <p className="text-muted leading-relaxed">
              The temporary password sent to <strong>{toRevoke.email}</strong> will stop working. You can invite them again later.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button onClick={() => setToRevoke(null)} className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={() => { revokeInvitation(toRevoke.id); setToRevoke(null); }}
                className="px-4 py-1.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!resent} onClose={() => setResent(null)} size="lg">
        {resent && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Invitation sent again</h3>
            <p className="text-muted">
              {resent.invitation.email} gets a new temporary password, valid for 7 days. The old one no longer works.
            </p>
            <InvitationEmailCard invitation={resent.invitation} tempPassword={resent.tempPassword} roleName={invitationRoleName(resent.invitation, roles)} />
            <div className="flex justify-end pt-2 border-t border-line">
              <button onClick={() => setResent(null)} className="px-4 py-1.5 rounded-lg bg-ink text-white font-semibold">Done</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
