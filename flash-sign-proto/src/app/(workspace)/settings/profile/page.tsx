'use client';

/* eslint-disable @next/next/no-img-element -- profile photo is a local data URL */
import React, { useState } from 'react';
import { Camera, Lock, UserRound } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import {
  SettingsPage, SettingsCard, SaveButton, SavedNote, useSavedFlash, inputClass,
} from '@/components/settings/settings-layout';

const MAX_PHOTO_BYTES = 400 * 1024;

// Flash Sign's phone rule: digits, spaces and + ( ) -, '+' only first, max 24 chars, 1–15 digits
function phoneError(phone: string): string | null {
  const value = phone.trim();
  if (!value) return null;
  if (value.length > 24) return 'Use 24 characters or fewer.';
  if (!/^\+?[\d\s()-]+$/.test(value)) return "Use digits, spaces and + ( ) - only, with '+' only at the start.";
  const digits = value.replace(/\D/g, '').length;
  if (digits < 1 || digits > 15) return 'A phone number has 1 to 15 digits.';
  return null;
}

export default function ProfileSettingsPage() {
  const { updateMember } = useApp();
  const user = useCurrentUser();
  const [saved, flashSaved] = useSavedFlash();

  const [form, setForm] = useState({ name: '', title: '', department: '', company: '', phone: '', address: '', avatar: '' });
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Load the signed-in user's details (and reload when the demo role switches user)
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (user && loadedFor !== user.id) {
    setLoadedFor(user.id);
    setForm({
      name: user.name,
      title: user.title ?? '',
      department: user.department ?? '',
      company: user.company ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
      avatar: user.avatar ?? '',
    });
  }

  if (!user) return null;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const phoneProblem = phoneError(form.phone);
  const canSave = form.name.trim().length > 0 && !phoneProblem;

  const handlePhoto = (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) return setPhotoError('Choose an image file.');
    if (file.size > MAX_PHOTO_BYTES) return setPhotoError('The photo must be 400 KB or smaller.');
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!canSave) return;
    const name = form.name.trim();
    updateMember(user.id, {
      name,
      initials: name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase(),
      title: form.title.trim() || undefined,
      department: form.department.trim() || undefined,
      company: form.company.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      avatar: form.avatar || undefined,
    });
    flashSaved();
  };

  return (
    <SettingsPage title="Profile" description="Your details as other people see them, and what fills in when you sign your own documents.">
      <SettingsCard
        title="Personal details"
        icon={UserRound}
        footer={<><SavedNote show={saved} /><SaveButton disabled={!canSave} onClick={handleSave} /></>}
      >
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold overflow-hidden shrink-0"
            style={{ background: user.color }}
          >
            {form.avatar ? <img src={form.avatar} alt="" className="w-full h-full object-cover" /> : user.initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-paper-elevated hover:bg-mist font-semibold text-ink cursor-pointer">
                <Camera className="w-3.5 h-3.5" /> Change photo
                <input type="file" accept="image/*" className="sr-only" onChange={e => handlePhoto(e.target.files?.[0])} />
              </label>
              {form.avatar && (
                <button type="button" onClick={() => setForm(f => ({ ...f, avatar: '' }))} className="text-muted hover:text-ink">
                  Remove
                </button>
              )}
            </div>
            <p className="text-muted">JPG or PNG, up to 400 KB.</p>
            {photoError && <p className="text-danger">{photoError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input className={inputClass} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email" hint="Your sign-in email can't be changed here.">
            <div className="relative">
              <input className={inputClass} value={user.email} disabled />
              <Lock className="w-3.5 h-3.5 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </Field>
          <Field label="Job title" hint="Shown on your profile. It doesn't change your permissions.">
            <input className={inputClass} value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Department">
            <input className={inputClass} value={form.department} onChange={set('department')} />
          </Field>
          <Field label="Company" hint="Fills the Company field when you sign your own documents.">
            <input className={inputClass} value={form.company} onChange={set('company')} />
          </Field>
          <Field label="Phone" error={phoneProblem}>
            <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="+94 77 123 4567" />
          </Field>
        </div>
        <Field label="Address">
          <textarea className={inputClass} rows={2} value={form.address} onChange={set('address')} />
        </Field>
      </SettingsCard>
    </SettingsPage>
  );
}

function Field({ label, hint, error, required, children }: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block font-semibold text-ink mb-1">
        {label}{required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {error ? <p className="mt-1 text-danger">{error}</p> : hint && <p className="mt-1 text-muted">{hint}</p>}
    </div>
  );
}
