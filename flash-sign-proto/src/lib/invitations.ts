import type { DemoInvitation, DemoRole } from '@/types/demo-auth';
import { DEMO_ROLE_OPTIONS } from '@/types/demo-auth';

// Invitation links for the frontend prototype. The link carries the invitation itself
// (base64url JSON), so it also opens in another browser or an incognito window, where this
// browser's stored invitations aren't available. A real backend would send an opaque token.

export const INVITE_VALID_DAYS = 7;

/** Roles the owner can invite people as (the owner role itself isn't offered) */
export const INVITABLE_ROLES = DEMO_ROLE_OPTIONS.filter(r => r.id !== 'executive');

export function roleTitle(role: DemoRole): string {
  return DEMO_ROLE_OPTIONS.find(r => r.id === role)?.title ?? role;
}

export function isInviteExpired(inv: Pick<DemoInvitation, 'expiresAt'>, now = Date.now()): boolean {
  return new Date(inv.expiresAt).getTime() <= now;
}

/** "in 5 days", "tomorrow", "today", "2 days ago" */
export function daysLeftText(expiresAt: string, now = Date.now()): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
  if (days <= 0) return days === 0 ? 'today' : `${-days} ${days === -1 ? 'day' : 'days'} ago`;
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

export type InvitePayload = Omit<DemoInvitation, 'status' | 'acceptedAt'>;

export function encodeInvite(inv: DemoInvitation): string {
  // Status lives in the inviting browser; the link only carries what the invitee needs
  const payload: InvitePayload = { ...inv };
  delete (payload as Partial<DemoInvitation>).status;
  delete (payload as Partial<DemoInvitation>).acceptedAt;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const json = new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
    const data = JSON.parse(json) as InvitePayload;
    return data.id && data.email && data.organizationId ? data : null;
  } catch {
    return null;
  }
}

export function inviteLink(inv: DemoInvitation): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/invite/${encodeInvite(inv)}`;
}
