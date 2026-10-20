'use client';

import React from 'react';
import { Sun, Moon, Check } from 'lucide-react';

interface PreferenceToggleItemProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: string;
}

export function PreferenceToggleItem({
  id,
  label,
  description,
  checked,
  onChange,
  badge,
}: PreferenceToggleItemProps) {
  return (
    <div className="flex items-start justify-between p-3.5 rounded-xl border border-[var(--line)] bg-[var(--paper-elevated)] hover:bg-[var(--paper)]/50 transition-colors">
      <div className="space-y-0.5 pr-4">
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="text-xs font-semibold text-[var(--ink)] cursor-pointer">
            {label}
          </label>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--mist)] text-[var(--ink-soft)] font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed">{description}</p>
      </div>

      {/* Accessible Switch */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--flash)] focus:ring-offset-2 ${
          checked ? 'bg-[var(--flash-deep)]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface ThemeSelectorProps {
  theme: 'light' | 'dark';
  onChange: (theme: 'light' | 'dark') => void;
}

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[var(--ink)]">
        Interface Theme
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* Light Theme */}
        <button
          type="button"
          onClick={() => onChange('light')}
          className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
            theme === 'light'
              ? 'border-[var(--flash-deep)] bg-emerald-50/50 ring-2 ring-[var(--flash)]/30 shadow-xs'
              : 'border-[var(--line)] bg-[var(--paper-elevated)] hover:border-[var(--muted)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--ink)]">Paper Light</p>
              <p className="text-[10px] text-[var(--muted)]">Default clean workspace</p>
            </div>
          </div>
          {theme === 'light' && (
            <div className="w-4 h-4 rounded-full bg-[var(--flash-deep)] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
        </button>

        {/* Dark Theme */}
        <button
          type="button"
          onClick={() => onChange('dark')}
          className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
            theme === 'dark'
              ? 'border-[var(--flash-deep)] bg-emerald-50/50 ring-2 ring-[var(--flash)]/30 shadow-xs'
              : 'border-[var(--line)] bg-[var(--paper-elevated)] hover:border-[var(--muted)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-100 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--ink)]">Dark Teal</p>
              <p className="text-[10px] text-[var(--muted)]">High contrast focus mode</p>
            </div>
          </div>
          {theme === 'dark' && (
            <div className="w-4 h-4 rounded-full bg-[var(--flash-deep)] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
