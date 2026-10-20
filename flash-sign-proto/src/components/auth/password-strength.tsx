'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedCount = [
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  let strengthLabel = 'Too short';
  let strengthColor = 'bg-gray-200';
  let activeBars = 0;

  if (password.length > 0) {
    if (passedCount <= 2) {
      strengthLabel = 'Weak';
      strengthColor = 'bg-[var(--danger)]';
      activeBars = 1;
    } else if (passedCount === 3) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-[var(--waiting)]';
      activeBars = 2;
    } else if (passedCount === 4) {
      strengthLabel = 'Good';
      strengthColor = 'bg-teal-500';
      activeBars = 3;
    } else {
      strengthLabel = 'Strong';
      strengthColor = 'bg-[var(--flash-deep)]';
      activeBars = 4;
    }
  }

  return (
    <div className="space-y-2.5 pt-1">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted)]">Password strength</span>
        <span
          className={`font-semibold ${
            activeBars === 1
              ? 'text-[var(--danger)]'
              : activeBars === 2
              ? 'text-[var(--waiting)]'
              : activeBars >= 3
              ? 'text-[var(--flash-deep)]'
              : 'text-[var(--muted)]'
          }`}
        >
          {strengthLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              index < activeBars ? strengthColor : 'bg-[var(--mist)]'
            }`}
          />
        ))}
      </div>

      {/* Requirement Hints Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        <RequirementItem checked={hasMinLength} label="At least 8 characters" />
        <RequirementItem checked={hasUpperCase} label="One uppercase letter" />
        <RequirementItem checked={hasLowerCase} label="One lowercase letter" />
        <RequirementItem checked={hasNumber || hasSpecial} label="One number or symbol" />
      </div>
    </div>
  );
}

function RequirementItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          checked ? 'bg-emerald-500/20 text-emerald-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {checked ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5" />}
      </div>
      <span className={checked ? 'text-[var(--ink-soft)] font-medium' : 'text-[var(--muted)]'}>
        {label}
      </span>
    </div>
  );
}
