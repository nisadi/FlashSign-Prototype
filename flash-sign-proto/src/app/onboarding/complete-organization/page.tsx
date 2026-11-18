'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { PrototypeNotice } from '@/components/shared/prototype-notice';
import { ORGANIZATION_INDUSTRIES } from '@/lib/auth-validation';
import { IANA_TIMEZONES } from '@/lib/rbac';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowRight, Building2, Loader2, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';

const fieldClass =
  'w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] hover:border-[var(--muted)] bg-[var(--paper-elevated)] text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all';

/**
 * "Complete your organisation": after the Owner's first login. The Super Admin already set the
 * name, slug and plan; the Owner completes the rest (tables.txt `organization`). Saving sets
 * organization.setup_completed_at; until then the Owner is sent here after login.
 */
export default function CompleteOrganizationPage() {
  const router = useRouter();
  const { isHydrated, currentRbacUser, currentOrganizationRecord: org, updateOrganization } = useDemoAuth();

  const [form, setForm] = useState({
    industry: '',
    website: '',
    description: '',
    timezone: 'UTC',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
  });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start from what the Super Admin entered
  if (org && loadedFor !== org.id) {
    setLoadedFor(org.id);
    setForm({
      industry: org.industry ?? '',
      website: org.website ?? '',
      description: org.description ?? '',
      timezone: org.timezone || 'UTC',
      workingHoursStart: org.workingHoursStart || '09:00',
      workingHoursEnd: org.workingHoursEnd || '17:00',
    });
  }

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    if (!form.industry) return setError('Choose your industry.');
    if (form.website.trim() && !/^https?:\/\/\S+\.\S+/.test(form.website.trim())) {
      return setError('Enter the website as a full address, e.g. https://acme.com');
    }
    if (form.workingHoursStart >= form.workingHoursEnd) return setError('The working day must end after it starts.');
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = updateOrganization(org.id, {
      industry: form.industry,
      website: form.website.trim() || undefined,
      description: form.description.trim() || undefined,
      timezone: form.timezone,
      workingHoursStart: form.workingHoursStart,
      workingHoursEnd: form.workingHoursEnd,
      setupCompletedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (!result.success) return setError(result.error ?? 'Could not save your organisation.');
    router.replace('/dashboard');
  };

  const isOwner = Boolean(currentRbacUser?.isOwner);
  const industries = Array.from(new Set([...(form.industry ? [form.industry] : []), ...ORGANIZATION_INDUSTRIES]));

  return (
    <AuthLayout>
      <AuthCard>
        {!isHydrated ? (
          <div className="py-16 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !org || !isOwner ? (
          <div className="py-4 space-y-4 text-center">
            <h2 className="text-xl font-bold text-[var(--ink)]">Only the Organization Owner can do this</h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Sign in as the Owner of the organisation to complete its details.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm">
              Go to sign in <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : org.setupCompletedAt ? (
          <div className="py-4 space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-[var(--flash-deep)] mx-auto" />
            <h2 className="text-xl font-bold text-[var(--ink)]">{org.name} is already set up</h2>
            <p className="text-xs text-[var(--muted)]">You can change these details later in Settings › Preferences.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm">
              Go to the dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--flash-deep)]">Complete your organisation</span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)] mt-1">Welcome, {currentRbacUser?.name.split(' ')[0]}</h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                You&apos;re now the Owner of <strong className="text-[var(--ink)]">{org.name}</strong>. Add a few details before you invite your team.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[var(--danger)] flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Organisation</label>
                <div className="relative">
                  <input value={`${org.name}  ·  ${org.slug}.flashsign.com`} readOnly className={`${fieldClass} pr-9 bg-[var(--mist)]/40 text-[var(--ink-soft)]`} />
                  <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-label="Set by the Super Admin" />
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">Set by FlashSign. Contact support to change the name or address.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Industry <span className="text-[var(--danger)]">*</span>
                </label>
                <select value={form.industry} onChange={(e) => set({ industry: e.target.value })} className={`${fieldClass} cursor-pointer`}>
                  <option value="">Choose your industry</option>
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Website <span className="text-[var(--muted)] font-normal">(Optional)</span>
                </label>
                <input type="url" value={form.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://acme.com" className={fieldClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Description <span className="text-[var(--muted)] font-normal">(Optional)</span>
                </label>
                <textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What your organisation does" className={`${fieldClass} resize-none`} />
              </div>

              <div>
                <label htmlFor="org-timezone" className="block text-xs font-semibold text-[var(--ink)] mb-1">Time zone</label>
                <select id="org-timezone" value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} className={`${fieldClass} cursor-pointer`}>
                  {Array.from(new Set([form.timezone, ...IANA_TIMEZONES])).map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Working day starts</label>
                  <input type="time" value={form.workingHoursStart} onChange={(e) => set({ workingHoursStart: e.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Working day ends</label>
                  <input type="time" value={form.workingHoursEnd} onChange={(e) => set({ workingHoursEnd: e.target.value })} className={fieldClass} />
                </div>
              </div>
              <p className="text-[11px] text-[var(--muted)] -mt-1">The time zone and working hours apply to every member.</p>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                ) : (
                  <><Building2 className="w-4 h-4" /><span>Save and open the dashboard</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-4">
              <PrototypeNotice variant="banner" message="Frontend prototype only. Mock data is stored in local browser state." />
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
