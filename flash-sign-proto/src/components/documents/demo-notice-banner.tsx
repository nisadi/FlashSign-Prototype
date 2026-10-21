'use client';

import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

interface DemoNoticeBannerProps {
  message?: string;
  variant?: 'info' | 'warning';
  className?: string;
}

export function DemoNoticeBanner({
  message = 'Demo mode: Signature requests and signing actions are simulated for prototype exploration. No legally binding electronic signature or cryptographic certificate is produced.',
  variant = 'info',
  className = '',
}: DemoNoticeBannerProps) {
  return (
    <div
      className={`rounded-xl border p-3.5 flex items-start gap-3 text-xs leading-relaxed transition-all shadow-xs ${
        variant === 'warning'
          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
          : 'bg-mist/35 border-line/70 text-ink-soft'
      } ${className}`}
    >
      <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-bold text-ink">Simulated Workflow Notice: </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
