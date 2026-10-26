'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return [copied, copy];
}

/** A command or file to copy: label on top, monospace body, Copy button. */
export function CodeBlock({ code, label, className }: { code: string; label?: string; className?: string }) {
  const [copied, copy] = useCopy();

  return (
    <div className={cn('rounded-lg border border-ink-soft/40 bg-ink overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/10">
        <span className="text-[11px] font-mono text-white/60 truncate">{label ?? ''}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white transition-colors shrink-0"
          aria-label={label ? `Copy ${label}` : 'Copy'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-flash" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-3 py-2.5 text-xs leading-relaxed text-white/90 font-mono overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}
