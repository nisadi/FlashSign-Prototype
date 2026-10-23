'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Page frame shared by every Settings tab. */
export function SettingsPage({ title, description, actions, children }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** A titled card holding one group of settings. */
export function SettingsCard({ title, description, icon: Icon, footer, className, children }: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('bg-paper-elevated border border-line rounded-xl shadow-xs', className)}>
      <div className="px-5 pt-5 pb-3 border-b border-line">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-flash-deep" />}
          {title}
        </h2>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <div className="p-5 space-y-4 text-xs">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-line bg-paper/60 rounded-b-xl flex items-center justify-end gap-2">{footer}</div>}
    </section>
  );
}

/** An on/off row: label and description on the left, switch on the right. */
export function SettingsToggle({ label, description, checked, onChange, disabled, badge }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <label className={cn('flex items-start justify-between gap-4', disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer')}>
      <span>
        <span className="font-semibold text-ink flex items-center gap-2">
          {label}
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-mist text-muted border border-line">{badge}</span>
          )}
        </span>
        {description && <span className="block text-muted mt-0.5">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-9 h-5 shrink-0 appearance-none rounded-full bg-line relative transition-colors checked:bg-flash cursor-pointer disabled:cursor-not-allowed
          after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform checked:after:translate-x-4"
      />
    </label>
  );
}

export const inputClass =
  'w-full px-3 py-2 rounded-lg bg-paper border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash disabled:opacity-60';

/** Brief "Saved" confirmation shown next to a save button. */
export function useSavedFlash(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);
  return [saved, () => setSaved(true)];
}

export function SavedNote({ show, text = 'Saved' }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700" role="status">
      <CheckCircle2 className="w-3.5 h-3.5" /> {text}
    </span>
  );
}

export function SaveButton({ children = 'Save changes', disabled, onClick, type = 'button' }: {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-flash hover:bg-flash-deep hover:text-white text-ink text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
