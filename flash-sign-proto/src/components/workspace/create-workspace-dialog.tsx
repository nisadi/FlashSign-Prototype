'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { PRESET_AVATAR_COLORS } from '@/types/demo-auth';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: string, companySize: string, description?: string, accentColor?: string) => void;
}

export function CreateWorkspaceDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Software Development');
  const [companySize, setCompanySize] = useState('11–50 employees');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState(PRESET_AVATAR_COLORS[0].value);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Workspace name must be at least 2 characters');
      return;
    }
    onCreate(name.trim(), type, companySize, description.trim(), accentColor);
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-up">
      <div className="w-full max-w-lg bg-[var(--paper-elevated)] rounded-2xl border border-[var(--line)] shadow-2xl p-6 sm:p-7 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[var(--flash-deep)] border border-emerald-200 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Fast Setup</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--ink)]">Create Demo Workspace</h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Configure a simulated organization for testing roles, tasks, and digital signatures.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Workspace / Company Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Acme Cloud Corp"
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                error ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
              }`}
            />
            {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Organization Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
              >
                <option value="Software Development">Software Development</option>
                <option value="Consulting">Consulting</option>
                <option value="Design Agency">Design Agency</option>
                <option value="Technology Startup">Technology Startup</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                Company Size
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
              >
                <option value="1–10 employees">1–10 employees</option>
                <option value="11–50 employees">11–50 employees</option>
                <option value="51–200 employees">51–200 employees</option>
                <option value="201–500 employees">201–500 employees</option>
                <option value="500+ employees">500+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Workspace Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this organization focus on?"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
            />
          </div>

          {/* Accent Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Workspace Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {PRESET_AVATAR_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAccentColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    accentColor === c.value ? 'ring-2 ring-offset-2 ring-[var(--ink)] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm transition-all"
            >
              Create Demo Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
