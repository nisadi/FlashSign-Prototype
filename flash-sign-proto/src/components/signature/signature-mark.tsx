'use client';

/* eslint-disable @next/next/no-img-element -- signatures are local data URLs, not optimisable assets */
import { cn } from '@/lib/utils';
import type { SavedSignature } from '@/types';
import { signatureFontClass } from './signature-fonts';

export type SignatureDraft = Omit<SavedSignature, 'userId' | 'updatedAt'>;

/** Renders a signature (or its initials) the way it will appear on the document. */
export function SignatureMark({
  signature,
  variant = 'signature',
  size = 'md',
  className,
}: {
  signature: SignatureDraft;
  variant?: 'signature' | 'initials';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const image = variant === 'signature' ? signature.signatureImage : signature.initialsImage;
  const text = variant === 'signature' ? signature.name : signature.initials;
  const heights = { sm: 'h-8', md: 'h-12', lg: 'h-16' };
  const textSizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-4xl' };

  if (signature.source !== 'type' && image) {
    return (
      <img
        src={image}
        alt={variant === 'signature' ? `Signature of ${signature.name}` : `Initials of ${signature.name}`}
        className={cn(heights[size], 'w-auto max-w-full object-contain', className)}
      />
    );
  }

  return (
    <span className={cn(signatureFontClass(signature.styleId), textSizes[size], 'text-ink leading-none whitespace-nowrap', className)}>
      {text || '—'}
    </span>
  );
}
