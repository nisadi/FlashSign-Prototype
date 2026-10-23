'use client';

/* eslint-disable @next/next/no-img-element -- seal images are local data URLs */
import React, { useState } from 'react';
import { Stamp, Plus, Pencil, Trash2, Upload, ShieldCheck, Lock } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { ROLE_CONFIGS, canManageDocuments } from '@/lib/permissions';
import type { CompanySeal, DemoRole } from '@/types';
import { cn } from '@/lib/utils';
import { SettingsCard, SettingsToggle, SaveButton, inputClass } from '@/components/settings/settings-layout';

const MAX_SEAL_BYTES = 500 * 1024;
const SEAL_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg'];

// Integration accounts never sign, so they can't hold a seal
const SEAL_ROLES = (Object.keys(ROLE_CONFIGS) as DemoRole[]).filter(r => r !== 'integration_service');

type SealForm = Pick<CompanySeal, 'name' | 'description' | 'image' | 'allowedRoles' | 'isActive'>;

const EMPTY_FORM: SealForm = {
  name: '',
  description: '',
  image: '',
  allowedRoles: ['ceo', 'document_manager'],
  isActive: true,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function CompanySeals() {
  const { companySeals, addCompanySeal, updateCompanySeal, deleteCompanySeal, demoRole } = useApp();
  const user = useCurrentUser();
  const canManage = canManageDocuments(demoRole);

  // null = closed, 'new' = adding, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<SealForm>(EMPTY_FORM);
  const [imageError, setImageError] = useState<string | null>(null);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setImageError(null);
    setEditing('new');
  };

  const openEdit = (seal: CompanySeal) => {
    setForm({ name: seal.name, description: seal.description ?? '', image: seal.image, allowedRoles: seal.allowedRoles, isActive: seal.isActive });
    setImageError(null);
    setEditing(seal.id);
  };

  const handleImage = (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!SEAL_TYPES.includes(file.type)) return setImageError('Use a PNG, SVG or JPG image. A PNG with a transparent background looks best.');
    if (file.size > MAX_SEAL_BYTES) return setImageError('The image must be 500 KB or smaller.');
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const toggleRole = (role: DemoRole) =>
    setForm(f => ({
      ...f,
      allowedRoles: f.allowedRoles.includes(role) ? f.allowedRoles.filter(r => r !== role) : [...f.allowedRoles, role],
    }));

  const canSave = form.name.trim() && form.image && form.allowedRoles.length > 0;

  const handleSave = () => {
    if (!canSave || !editing) return;
    const values = { ...form, name: form.name.trim(), description: form.description?.trim() || undefined };
    if (editing === 'new') addCompanySeal({ ...values, createdBy: user?.id ?? 'unknown' });
    else updateCompanySeal(editing, values);
    setEditing(null);
  };

  const handleDelete = (seal: CompanySeal) => {
    if (!confirm(`Delete "${seal.name}"? Documents it was already applied to keep their seal.`)) return;
    deleteCompanySeal(seal.id);
    if (editing === seal.id) setEditing(null);
  };

  return (
    <SettingsCard
      title="Company seals"
      description="Official seal or stamp images that approved roles can add to a document when they sign. Every use is recorded in the request's audit trail."
      icon={Stamp}
    >
      {!canManage && (
        <p className="flex items-center gap-2 p-3 rounded-lg bg-mist/40 border border-line text-muted">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          Only document managers and administrators can add or change seals.
        </p>
      )}

      {companySeals.length === 0 && editing !== 'new' && (
        <p className="py-4 text-center text-muted">No seals yet.</p>
      )}

      <ul className="space-y-3">
        {companySeals.map(seal => (
          <li key={seal.id} className={cn('p-3 rounded-lg border bg-paper flex items-start gap-4', seal.isActive ? 'border-line' : 'border-dashed border-line opacity-75')}>
            <img src={seal.image} alt={seal.name} className="w-16 h-16 object-contain shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-ink">{seal.name}</p>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                  seal.isActive ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-mist text-muted border-line'
                )}>
                  {seal.isActive ? 'Active' : 'Turned off'}
                </span>
              </div>
              {seal.description && <p className="text-muted">{seal.description}</p>}
              <p className="flex items-center gap-1.5 flex-wrap text-muted">
                <ShieldCheck className="w-3.5 h-3.5" /> Can be applied by:
                {seal.allowedRoles.map(r => (
                  <span key={r} className="px-1.5 py-0.5 rounded bg-paper-elevated border border-line text-ink">
                    {ROLE_CONFIGS[r as DemoRole]?.label ?? r}
                  </span>
                ))}
              </p>
              <p className="text-muted">
                Used {seal.usageCount} {seal.usageCount === 1 ? 'time' : 'times'}
                {seal.lastUsedAt && ` · last on ${formatDate(seal.lastUsedAt)}`}
              </p>
            </div>
            {canManage && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => updateCompanySeal(seal.id, { isActive: !seal.isActive })}
                  className="px-2 py-1 rounded text-muted hover:text-ink hover:bg-mist font-semibold"
                >
                  {seal.isActive ? 'Turn off' : 'Turn on'}
                </button>
                <button type="button" onClick={() => openEdit(seal)} className="p-1.5 rounded text-muted hover:text-ink hover:bg-mist" aria-label={`Edit ${seal.name}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => handleDelete(seal)} className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10" aria-label={`Delete ${seal.name}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {canManage && !editing && (
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-line hover:border-flash text-ink font-semibold w-full justify-center"
        >
          <Plus className="w-4 h-4 text-flash-deep" /> Add a seal
        </button>
      )}

      {canManage && editing && (
        <div className="p-4 rounded-lg border border-flash/40 bg-flash/5 space-y-4">
          <p className="font-bold text-sm text-ink">{editing === 'new' ? 'Add a seal' : 'Edit seal'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
            <div>
              <span className="block font-semibold text-ink mb-1">Seal image</span>
              <label className="flex items-center justify-center w-32 h-32 rounded-lg border border-dashed border-line bg-paper-elevated hover:border-flash cursor-pointer">
                {form.image ? (
                  <img src={form.image} alt="Seal preview" className="w-28 h-28 object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-muted text-center px-2">
                    <Upload className="w-5 h-5" /> PNG, SVG or JPG · max 500 KB
                  </span>
                )}
                <input type="file" accept={SEAL_TYPES.join(',')} className="sr-only" onChange={e => handleImage(e.target.files?.[0])} />
              </label>
              {imageError && <p className="mt-1 text-danger">{imageError}</p>}
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="block font-semibold text-ink mb-1">Name</span>
                <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Official Company Seal" />
              </label>
              <label className="block">
                <span className="block font-semibold text-ink mb-1">What it&apos;s for (optional)</span>
                <input className={inputClass} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contracts and statements of work" />
              </label>
            </div>
          </div>

          <div>
            <span className="block font-semibold text-ink mb-1.5">Who can apply this seal</span>
            <div className="flex flex-wrap gap-2">
              {SEAL_ROLES.map(role => {
                const on = form.allowedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border font-medium transition-colors',
                      on ? 'bg-ink text-white border-ink' : 'bg-paper-elevated text-muted border-line hover:text-ink'
                    )}
                  >
                    {ROLE_CONFIGS[role].label}
                  </button>
                );
              })}
            </div>
            {form.allowedRoles.length === 0 && <p className="mt-1 text-danger">Choose at least one role.</p>}
          </div>

          <SettingsToggle
            label="Active"
            description="Turned-off seals stay in the list but can't be applied."
            checked={form.isActive}
            onChange={v => setForm(f => ({ ...f, isActive: v }))}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg border border-line bg-paper-elevated hover:bg-mist font-semibold text-ink"
            >
              Cancel
            </button>
            <SaveButton disabled={!canSave} onClick={handleSave}>{editing === 'new' ? 'Add seal' : 'Save seal'}</SaveButton>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
