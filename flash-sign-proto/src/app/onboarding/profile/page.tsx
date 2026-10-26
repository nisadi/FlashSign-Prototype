'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { AvatarPicker } from '@/components/onboarding/avatar-picker';
import { RoleSelector } from '@/components/onboarding/role-selector';
import { profileSetupSchema, type ProfileSetupFormData } from '@/lib/auth-validation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { type DemoRole } from '@/types/demo-auth';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  'America/New_York (UTC-5)',
  'America/Chicago (UTC-6)',
  'America/Denver (UTC-7)',
  'America/Los_Angeles (UTC-8)',
  'Europe/London (UTC+0)',
  'Europe/Paris (UTC+1)',
  'Asia/Tokyo (UTC+9)',
  'Asia/Singapore (UTC+8)',
  'Australia/Sydney (UTC+11)',
];

const DEPARTMENT_OPTIONS = [
  'Product & Design',
  'Engineering',
  'Executive Leadership',
  'Quality Assurance',
  'Legal & Compliance',
  'Operations',
  'Sales & Client Relations',
];

import { DEMO_PRESET_USERS } from '@/types/demo-auth';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser: authUser, updateProfile } = useDemoAuth();
  const currentUser = authUser || DEMO_PRESET_USERS[0];

  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#00c2a8');
  const [avatarImage, setAvatarImage] = useState<string | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<DemoRole>(currentUser.role || 'project_manager');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      fullName: currentUser.fullName || '',
      jobTitle: currentUser.jobTitle || 'Product Manager',
      department: currentUser.department || 'Product & Design',
      timezone: currentUser.timezone || 'America/New_York (UTC-5)',
      bio: currentUser.bio || '',
      role: currentUser.role || 'project_manager',
      avatarColor: currentUser.avatarColor || '#00c2a8',
    },
  });

  const watchedFullName = watch('fullName', currentUser.fullName || '');

  const computedInitials = watchedFullName
    ? watchedFullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FS';

  const handleRoleChange = (role: DemoRole) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = (data: ProfileSetupFormData) => {
    updateProfile({
      fullName: data.fullName,
      jobTitle: data.jobTitle,
      department: data.department,
      timezone: data.timezone,
      bio: data.bio,
      role: selectedRole,
      avatarColor,
      avatarInitials: computedInitials,
    });

    router.push('/onboarding/preferences');
  };

  return (
    <OnboardingStepLayout
      currentStep="profile"
      title="Complete your demo profile"
      subtitle="Set up your identity and choose a simulated role to tailor your Flash Sign experience."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-2">
            Profile Avatar & Accent
          </label>
          <AvatarPicker
            initials={computedInitials}
            selectedColor={avatarColor}
            avatarUrl={avatarImage}
            onColorChange={(color) => {
              setAvatarColor(color);
              setValue('avatarColor', color);
            }}
            onImageChange={setAvatarImage}
          />
        </div>

        {/* Name & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Full Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Chen"
              {...register('fullName')}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.fullName ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Job Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. VP of Product"
              {...register('jobTitle')}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)] transition-all ${
                errors.jobTitle ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--line)]'
              }`}
            />
            {errors.jobTitle && (
              <p className="text-xs text-[var(--danger)] mt-1">{errors.jobTitle.message}</p>
            )}
          </div>
        </div>

        {/* Department & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Department <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              {...register('department')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Primary Timezone <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              {...register('timezone')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Selector Grid */}
        <div className="pt-2">
          <RoleSelector selectedRole={selectedRole} onSelectRole={handleRoleChange} />
          {errors.role && (
            <p className="text-xs text-[var(--danger)] mt-1">{errors.role.message}</p>
          )}
        </div>

        {/* Bio (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
            Short Professional Bio <span className="text-[var(--muted)] font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="A brief summary of your core delivery focus or responsibilities"
            {...register('bio')}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
          />
        </div>

        {/* Navigation Actions */}
        <div className="pt-6 border-t border-[var(--line)] flex items-center justify-between">
          <Link
            href="/workspace"
            className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </Link>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Continue to Preferences</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </OnboardingStepLayout>
  );
}
