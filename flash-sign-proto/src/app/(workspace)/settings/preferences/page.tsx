'use client';

import React, { useState } from 'react';
import { Building2, Clock, RotateCcw, ToggleRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import { FEATURE_DEFINITIONS, IANA_TIMEZONES, canAccessPreferences, featuresFor, planLabel, type SuperAdminOrg } from '@/lib/rbac';
import { slugify } from '@/lib/utils';
import { AccessDenied } from '@/components/shared/access-denied';
import { SettingsPage, SettingsCard, SaveButton, SavedNote, useSavedFlash } from '@/components/settings/settings-layout';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]+$/i;

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs';

type OrgForm = Pick<SuperAdminOrg, 'name' | 'slug' | 'description' | 'industry' | 'website' | 'timezone' | 'workingHoursStart' | 'workingHoursEnd'>;

function toForm(org: SuperAdminOrg): OrgForm {
  return {
    name: org.name,
    slug: org.slug,
    description: org.description ?? '',
    industry: org.industry,
    website: org.website ?? '',
    timezone: org.timezone,
    workingHoursStart: org.workingHoursStart,
    workingHoursEnd: org.workingHoursEnd,
  };
}

/**
 * Organization Owner only: the organisation's own settings (finalized table `organization`).
 * Plan, status and feature switches are set by the Super Admin and shown read-only here.
 * Personal settings (theme, calendar view, notifications) are under Settings › Notifications.
 */
export default function PreferencesSettingsPage() {
  const { resetDemoData } = useApp();
  const { currentRbacUser, currentOrganizationRecord, updateOrganization, organizationFeatures } = useDemoAuth();

  // All hooks run before the access guard
  const [form, setForm] = useState<OrgForm | null>(currentOrganizationRecord ? toForm(currentOrganizationRecord) : null);
  const [error, setError] = useState<string | null>(null);
  const [saved, flashSaved] = useSavedFlash();

  if (!canAccessPreferences(currentRbacUser)) {
    return (
      <AccessDenied
        title="Owner Authority Required"
        message="Organisation settings (name, web address, time zone and working hours) can only be changed by the Organization Owner."
        requiredRole="Organization Owner"
        backHref="/settings/profile"
      />
    );
  }

  if (!currentOrganizationRecord || !form) {
    return (
      <SettingsPage title="Preferences" description="Organisation settings.">
        <SettingsCard title="Organisation" icon={Building2}>
          <p className="text-xs text-muted">No organisation record is linked to this workspace.</p>
        </SettingsCard>
      </SettingsPage>
    );
  }

  const set = (patch: Partial<OrgForm>) => {
    setError(null);
    setForm(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(form.slug);
    if (!form.name.trim()) return setError('Enter the organisation name.');
    if (!SLUG_RE.test(slug)) return setError('Use lower-case letters, numbers and single hyphens in the web address.');
    if (form.website?.trim() && !URL_RE.test(form.website.trim())) return setError('Enter the website as a full address, e.g. https://acme.com.');
    if (form.workingHoursStart >= form.workingHoursEnd) return setError('The working day must end after it starts.');
    const result = updateOrganization(currentOrganizationRecord.id, {
      ...form,
      name: form.name.trim(),
      slug,
      description: form.description?.trim() || undefined,
      website: form.website?.trim() || undefined,
    });
    if (!result.success) return setError(result.error ?? 'Could not save.');
    setForm(prev => (prev ? { ...prev, slug } : prev));
    flashSaved();
  };

  const features = featuresFor(currentOrganizationRecord.id, organizationFeatures);

  return (
    <SettingsPage
      title="Preferences"
      description="Your organisation's details, time zone and working hours. Only the Organization Owner can change these."
      actions={<SavedNote show={saved} text="Preferences saved" />}
    >
      <form onSubmit={handleSave} className="space-y-6 text-xs" noValidate>
        <SettingsCard title="Organisation" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Organisation name <span className="text-danger">*</span></span>
              <input value={form.name} onChange={e => set({ name: e.target.value })} className={inputClass} />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Web address <span className="text-danger">*</span></span>
              <div className="flex items-center gap-1">
                <input value={form.slug} onChange={e => set({ slug: e.target.value })} className={`${inputClass} font-mono`} />
                <span className="text-muted font-mono shrink-0">.flashsign.com</span>
              </div>
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Industry</span>
              <input value={form.industry} onChange={e => set({ industry: e.target.value })} className={inputClass} />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Website</span>
              <input type="url" value={form.website ?? ''} onChange={e => set({ website: e.target.value })} placeholder="https://" className={inputClass} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="block font-semibold text-ink">Description</span>
              <textarea rows={2} value={form.description ?? ''} onChange={e => set({ description: e.target.value })} className={`${inputClass} resize-none`} />
            </label>
          </div>
          <p className="text-[11px] text-muted">
            Plan: <strong className="text-ink">{planLabel(currentOrganizationRecord.plan)}</strong> · Status:{' '}
            <strong className="text-ink capitalize">{currentOrganizationRecord.status}</strong> (set by the FlashSign Super Admin)
          </p>
        </SettingsCard>

        <SettingsCard
          title="Time zone & working hours"
          description="Used for due dates, reminders and the planner across the organisation."
          icon={Clock}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Time zone</span>
              <select value={form.timezone} onChange={e => set({ timezone: e.target.value })} className={inputClass}>
                {Array.from(new Set([form.timezone, ...IANA_TIMEZONES])).map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Work day start</span>
              <input type="time" value={form.workingHoursStart} onChange={e => set({ workingHoursStart: e.target.value })} className={inputClass} />
            </label>
            <label className="space-y-1">
              <span className="block font-semibold text-ink">Work day end</span>
              <input type="time" value={form.workingHoursEnd} onChange={e => set({ workingHoursEnd: e.target.value })} className={inputClass} />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard title="Features" description="Turned on or off for your organisation by the FlashSign Super Admin." icon={ToggleRight}>
          <ul className="space-y-2">
            {FEATURE_DEFINITIONS.map(f => (
              <li key={f.key} className="flex items-start justify-between gap-4">
                <span>
                  <span className="font-semibold text-ink block">{f.label}</span>
                  <span className="text-muted">{f.description}</span>
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    features[f.key] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-mist text-muted border border-line'
                  }`}
                >
                  {features[f.key] ? 'On' : 'Off'}
                </span>
              </li>
            ))}
          </ul>
        </SettingsCard>

        {error && <p className="text-danger font-medium" role="alert">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors font-medium text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
          <SaveButton type="submit">Save Preferences</SaveButton>
        </div>
      </form>
    </SettingsPage>
  );
}
