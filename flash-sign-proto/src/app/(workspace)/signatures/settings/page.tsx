'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sliders, Mail, PenTool, RotateCcw, ArrowRight } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { SigningDefaults, SignatureSource } from '@/types';
import { DEFAULT_SIGNING_DEFAULTS } from '@/data/mock-signing';
import {
  REMINDER_OPTIONS, EXPIRY_PRESETS, MIN_EXPIRY_DAYS, MAX_EXPIRY_DAYS,
  MAX_SUBJECT_LENGTH, MAX_MESSAGE_LENGTH, SIGNATURE_METHOD_LABELS,
} from '@/lib/signing-options';
import { cn } from '@/lib/utils';
import {
  SettingsPage, SettingsCard, SettingsToggle, SaveButton, SavedNote, useSavedFlash, inputClass,
} from '@/components/settings/settings-layout';
import { CompanySeals } from '@/components/agreements/company-seals';
import { SignatureMark } from '@/components/signature/signature-mark';

export default function AgreementSettingsPage() {
  const { signingDefaults, updateSigningDefaults, savedSignatures } = useApp();
  const user = useCurrentUser();
  const mySignature = savedSignatures.find(s => s.userId === user?.id);
  const [saved, flashSaved] = useSavedFlash();

  const [form, setForm] = useState<SigningDefaults>(signingDefaults);
  // Pick up the stored values once the store has loaded them (or after saving)
  const [loaded, setLoaded] = useState(signingDefaults);
  if (loaded !== signingDefaults) {
    setLoaded(signingDefaults);
    setForm(signingDefaults);
  }

  const isCustomExpiry = !EXPIRY_PRESETS.includes(form.expireDays);
  const expiryValid = Number.isInteger(form.expireDays) && form.expireDays >= MIN_EXPIRY_DAYS && form.expireDays <= MAX_EXPIRY_DAYS;
  const canSave = expiryValid && form.allowedSignatureMethods.length > 0 && form.emailSubject.trim().length > 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(signingDefaults);

  const toggleMethod = (method: SignatureSource, on: boolean) =>
    setForm(f => ({
      ...f,
      allowedSignatureMethods: on
        ? [...f.allowedSignatureMethods, method]
        : f.allowedSignatureMethods.filter(m => m !== method),
    }));

  const handleSave = () => {
    if (!canSave) return;
    updateSigningDefaults(form);
    flashSaved();
  };

  return (
    <SettingsPage
      title="Agreement settings"
      description="Defaults for every new signature request, and the company seals people can apply when signing."
    >
      <SettingsCard
        title="Signing defaults"
        description="New signature requests start with these. The sender can still change them for each request."
        icon={Sliders}
        footer={
          <>
            <button
              type="button"
              onClick={() => setForm(DEFAULT_SIGNING_DEFAULTS)}
              className="mr-auto flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore original defaults
            </button>
            <SavedNote show={saved} />
            <SaveButton disabled={!canSave || !dirty} onClick={handleSave} />
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <span className="block font-semibold text-ink mb-1">Requests expire after</span>
            <div className="flex gap-2">
              <select
                className={inputClass}
                value={isCustomExpiry ? 'custom' : String(form.expireDays)}
                onChange={e => setForm(f => ({ ...f, expireDays: e.target.value === 'custom' ? 45 : Number(e.target.value) }))}
              >
                {EXPIRY_PRESETS.map(d => <option key={d} value={d}>{d} days</option>)}
                <option value="custom">Custom…</option>
              </select>
              {isCustomExpiry && (
                <input
                  type="number"
                  min={MIN_EXPIRY_DAYS}
                  max={MAX_EXPIRY_DAYS}
                  className={cn(inputClass, 'w-24')}
                  value={Number.isNaN(form.expireDays) ? '' : form.expireDays}
                  onChange={e => setForm(f => ({ ...f, expireDays: parseInt(e.target.value, 10) }))}
                  aria-label="Custom number of days"
                />
              )}
            </div>
            {expiryValid
              ? <p className="mt-1 text-muted">Unsigned requests are cancelled automatically after this.</p>
              : <p className="mt-1 text-danger">Enter a whole number from {MIN_EXPIRY_DAYS} to {MAX_EXPIRY_DAYS}.</p>}
          </div>

          <label className="block">
            <span className="block font-semibold text-ink mb-1">Remind signers</span>
            <select
              className={inputClass}
              value={form.reminderFrequency}
              onChange={e => setForm(f => ({ ...f, reminderFrequency: e.target.value as SigningDefaults['reminderFrequency'] }))}
            >
              {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="block mt-1 text-muted">Sent by email until they sign.</span>
          </label>
        </div>

        <div>
          <span className="block font-semibold text-ink mb-1.5">Signing order</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { value: 'sequential', label: 'One after another', hint: 'Each signer is invited when the previous one has signed.' },
              { value: 'parallel', label: 'All at once', hint: 'Everyone is invited at the same time.' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={form.signingOrder === opt.value}
                onClick={() => setForm(f => ({ ...f, signingOrder: opt.value }))}
                className={cn(
                  'text-left p-3 rounded-lg border transition-colors',
                  form.signingOrder === opt.value ? 'border-flash bg-flash/5 ring-1 ring-flash' : 'border-line hover:border-flash/50'
                )}
              >
                <span className="block font-semibold text-ink">{opt.label}</span>
                <span className="block text-muted mt-0.5">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block font-semibold text-ink mb-1.5">Signers may sign by</span>
          <div className="space-y-2">
            {(Object.keys(SIGNATURE_METHOD_LABELS) as SignatureSource[]).map(method => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-flash w-4 h-4"
                  checked={form.allowedSignatureMethods.includes(method)}
                  onChange={e => toggleMethod(method, e.target.checked)}
                />
                <span className="text-ink">{SIGNATURE_METHOD_LABELS[method]}</span>
              </label>
            ))}
          </div>
          {form.allowedSignatureMethods.length === 0 && <p className="mt-1 text-danger">Allow at least one way to sign.</p>}
        </div>

        <SettingsToggle
          label={`Warn the sender ${form.expiryWarningDays} days before a request expires`}
          description="The warning email isn't available yet."
          checked={false}
          onChange={() => {}}
          disabled
          badge="Coming soon"
        />
      </SettingsCard>

      <SettingsCard title="Default email to signers" icon={Mail} description="Use {{document}} to insert the document name.">
        <label className="block">
          <span className="flex justify-between font-semibold text-ink mb-1">
            Subject <span className="font-normal text-muted">{form.emailSubject.length}/{MAX_SUBJECT_LENGTH}</span>
          </span>
          <input
            className={inputClass}
            maxLength={MAX_SUBJECT_LENGTH}
            value={form.emailSubject}
            onChange={e => setForm(f => ({ ...f, emailSubject: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="block font-semibold text-ink mb-1">Message</span>
          <textarea
            className={inputClass}
            rows={4}
            maxLength={MAX_MESSAGE_LENGTH}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />
        </label>
        <div className="flex justify-end">
          <SaveButton disabled={!canSave || !dirty} onClick={handleSave} />
        </div>
      </SettingsCard>

      <CompanySeals />

      <SettingsCard title="Your signature" icon={PenTool} description="Your personal signature and initials are kept with your account settings.">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {mySignature ? (
            <SignatureMark signature={mySignature} size="md" />
          ) : (
            <span className="text-muted">You haven&apos;t saved a signature yet.</span>
          )}
          <Link href="/settings/signature" className="flex items-center gap-1 font-semibold text-flash-deep hover:underline">
            Manage my signature <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
