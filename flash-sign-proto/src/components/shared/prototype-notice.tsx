import React from 'react';
import { Info } from 'lucide-react';

interface PrototypeNoticeProps {
  message?: string;
  className?: string;
  variant?: 'banner' | 'pill' | 'subtle';
}

export function PrototypeNotice({
  message = 'Interactive frontend prototype — no real account, credentials, or server calls are made.',
  className = '',
  variant = 'banner',
}: PrototypeNoticeProps) {
  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--mist)]/70 text-[var(--ink-soft)] border border-[var(--line)] ${className}`}>
        <Info className="w-3.5 h-3.5 text-[var(--flash-deep)] shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'subtle') {
    return (
      <p className={`text-xs text-[var(--muted)] text-center flex items-center justify-center gap-1.5 ${className}`}>
        <Info className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
        <span>{message}</span>
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg p-3 bg-emerald-50/70 border border-emerald-200/80 text-xs text-[var(--ink-soft)] flex items-start gap-2.5 shadow-xs ${className}`}
    >
      <div className="w-4 h-4 rounded-full bg-[var(--flash)]/20 text-[var(--flash-deep)] flex items-center justify-center shrink-0 mt-0.5">
        <Info className="w-3 h-3" />
      </div>
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold text-[var(--ink)] mr-1">Prototype Notice:</span>
        {message}
      </div>
    </div>
  );
}
