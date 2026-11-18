// One-time temporary passwords for invitations (tables.txt: invitation.temp_password_hash,
// invitation.failed_attempts). The invitation email carries the password; only its hash is kept,
// and only until the person sets their own password at first login.
//
// Prototype only: the real backend hashes with bcrypt. This file has no server, so it uses a
// simple stand-in hash. What matters is the same: the readable password is never stored.

/** Wrong temporary passwords allowed before the invitation locks (a resend unlocks it) */
export const MAX_TEMP_PASSWORD_ATTEMPTS = 5;

/** The temporary password of the seeded demo invitations, so they can be tried out */
export const DEMO_TEMP_PASSWORD = 'Welcome-2026';

// No 0/O, 1/l/I: easy to read from an email and type in
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** e.g. "Kx7p-Qm2z-Hd9w" */
export function generateTempPassword(): string {
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map(g => g.join('')).join('-');
}

/** Stand-in for bcrypt (FNV-1a, 64-bit). Never store the password itself. */
export function hashTempPassword(password: string): string {
  let h = BigInt('0xcbf29ce484222325');
  const prime = BigInt('0x100000001b3');
  const mask = (BigInt(1) << BigInt(64)) - BigInt(1);
  for (const ch of new TextEncoder().encode(password)) {
    h = ((h ^ BigInt(ch)) * prime) & mask;
  }
  return 'demo-hash$' + h.toString(16).padStart(16, '0');
}

export function checkTempPassword(password: string, hash: string | undefined): boolean {
  return !!hash && hashTempPassword(password) === hash;
}
