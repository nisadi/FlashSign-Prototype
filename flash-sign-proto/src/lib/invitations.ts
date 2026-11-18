import type { DemoInvitation } from '@/types/demo-auth';
import type { CustomRole } from '@/lib/rbac';

// Invitations (tables.txt `invitation`): one table for Owner and member invitations.
// The email carries a one-time temporary password; there is no invitation link.

export const INVITE_VALID_DAYS = 7;

/** The Organization Owner role: an invitation with this role is an Owner invitation */
export const OWNER_ROLE_ID = 'role-owner';

/** An Owner invitation (sent by a Super Admin): its role is the Organization Owner role */
export function isOwnerInvitation(inv: Pick<DemoInvitation, 'roleId'>): boolean {
  return inv.roleId === OWNER_ROLE_ID;
}

/**
 * The organisation's roles a member invitation can carry (invitation.role_id). The Organization
 * Owner role is not offered: only a Super Admin sends an Owner invitation.
 */
export function invitableRoles(roles: CustomRole[]): CustomRole[] {
  return roles.filter(r => r.id !== OWNER_ROLE_ID);
}

/** The invitation's role name: looked up by role_id, falling back to the name it was sent with. */
export function invitationRoleName(inv: Pick<DemoInvitation, 'roleId' | 'roleName'>, roles: CustomRole[] = []): string {
  return roles.find(r => r.id === inv.roleId)?.name ?? inv.roleName ?? 'Member';
}

export function isInviteExpired(inv: Pick<DemoInvitation, 'expiresAt'>, now = Date.now()): boolean {
  return new Date(inv.expiresAt).getTime() <= now;
}

export type InviteDisplayStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/** How an invitation reads in the UI: expired = pending and past expires_at (not stored) */
export function inviteDisplayStatus(inv: Pick<DemoInvitation, 'status' | 'expiresAt'>, now = Date.now()): InviteDisplayStatus {
  if (inv.status === 'pending' && isInviteExpired(inv, now)) return 'expired';
  return inv.status;
}

/** "in 5 days", "tomorrow", "today", "2 days ago" */
export function daysLeftText(expiresAt: string, now = Date.now()): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
  if (days <= 0) return days === 0 ? 'today' : `${-days} ${days === -1 ? 'day' : 'days'} ago`;
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}
