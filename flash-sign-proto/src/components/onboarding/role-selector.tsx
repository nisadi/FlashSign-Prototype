'use client';

import React from 'react';
import { DEMO_ROLE_OPTIONS, type DemoRole } from '@/types/demo-auth';
import { Check } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: DemoRole;
  onSelectRole: (role: DemoRole) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--ink)]">
          Select Your Demo Role <span className="text-[var(--danger)]">*</span>
        </label>
        <span className="text-[11px] text-[var(--muted)]">
          Adjusts your simulated permissions & views
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {DEMO_ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <div
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-[var(--flash-deep)] bg-emerald-50/60 ring-2 ring-[var(--flash)]/30 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--paper-elevated)] hover:border-[var(--muted)] hover:bg-[var(--paper)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--ink)]">{role.title}</span>
                {isSelected ? (
                  <div className="w-4 h-4 rounded-full bg-[var(--flash-deep)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[var(--line)] shrink-0" />
                )}
              </div>

              <p className="text-[11px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                {role.description}
              </p>

              <div className="flex flex-wrap gap-1 mt-2">
                {role.badges.map((b) => (
                  <span
                    key={b}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--mist)]/70 text-[var(--ink-soft)] font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
