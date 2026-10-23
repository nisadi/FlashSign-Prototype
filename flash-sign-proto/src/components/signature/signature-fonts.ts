import { Playfair_Display, Dancing_Script, Caveat, Great_Vibes } from 'next/font/google';
import type { SignatureStyle } from '@/types';

// The four typed-signature styles Flash Sign offers
const formal = Playfair_Display({ subsets: ['latin'], style: 'italic', display: 'swap' });
const script = Dancing_Script({ subsets: ['latin'], display: 'swap' });
const bold = Caveat({ subsets: ['latin'], weight: '600', display: 'swap' });
const elegant = Great_Vibes({ subsets: ['latin'], weight: '400', display: 'swap' });

export const SIGNATURE_STYLES: { id: SignatureStyle; label: string; className: string }[] = [
  { id: 'formal', label: 'Formal', className: formal.className },
  { id: 'script', label: 'Script', className: script.className },
  { id: 'bold', label: 'Bold', className: bold.className },
  { id: 'elegant', label: 'Elegant', className: elegant.className },
];

export function signatureFontClass(styleId: SignatureStyle | undefined): string {
  return (SIGNATURE_STYLES.find(s => s.id === styleId) ?? SIGNATURE_STYLES[1]).className;
}
