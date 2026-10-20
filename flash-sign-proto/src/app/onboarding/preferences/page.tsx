'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { ThemeSelector, PreferenceToggleItem } from '@/components/onboarding/preference-toggle';
import { useDemoAuth } from '@/context/demo-auth-context';
import { ArrowLeft, ArrowRight, Bell, Clock, ShieldCheck, Mail } from 'lucide-react';

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

export default function PreferencesSetupPage() {
  const router = useRouter();
  const { preferences, updatePreferences } = useDemoAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(preferences.theme || 'light');
  const [inApp, setInApp] = useState(preferences.inAppNotifications);
  const [emailNotifs, setEmailNotifs] = useState(preferences.emailNotifications);
  const [taskAlerts, setTaskAlerts] = useState(preferences.taskAssignmentAlerts);
  const [deadlineReminders, setDeadlineReminders] = useState(preferences.deadlineReminders);
  const [approvalReminders, setApprovalReminders] = useState(preferences.approvalReminders);
  const [timezone, setTimezone] = useState(preferences.timezone || 'America/New_York (UTC-5)');

  const handleSaveAndContinue = () => {
    updatePreferences({
      theme,
      inAppNotifications: inApp,
      emailNotifications: emailNotifs,
      taskAssignmentAlerts: taskAlerts,
      deadlineReminders,
      approvalReminders,
      timezone,
    });

    router.push('/onboarding/complete');
  };

  return (
    <OnboardingStepLayout
      currentStep="preferences"
      title="Customize your workspace"
      subtitle="Tailor your visual theme, notification dispatch settings, and deadline alerts."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Theme Selector */}
        <ThemeSelector theme={theme} onChange={setTheme} />

        {/* Timezone Configuration */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
            <span>Workspace Timezone</span>
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Preferences */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              <span>Simulated Notification Feeds</span>
            </label>
            <span className="text-[11px] text-[var(--muted)]">Toggle notification triggers</span>
          </div>

          <div className="space-y-2.5">
            <PreferenceToggleItem
              id="pref-in-app"
              label="In-App Notification Center"
              description="Receive realtime badge alerts and toast banners in the top navigation bar."
              checked={inApp}
              onChange={setInApp}
              badge="Recommended"
            />

            <PreferenceToggleItem
              id="pref-email"
              label="Simulated Email Digests"
              description="Daily summary of sprint velocity, blocker mentions, and AI agent pull requests."
              checked={emailNotifs}
              onChange={setEmailNotifs}
              badge="Daily"
            />

            <PreferenceToggleItem
              id="pref-tasks"
              label="Task & Story Assignment Alerts"
              description="Notify immediately when Jira/ClickUp-style stories are assigned to your persona."
              checked={taskAlerts}
              onChange={setTaskAlerts}
            />

            <PreferenceToggleItem
              id="pref-deadlines"
              label="Sprint & Milestone Deadline Reminders"
              description="Warning alerts 48 hours before milestone deadlines or sprint cut-offs."
              checked={deadlineReminders}
              onChange={setDeadlineReminders}
            />

            <PreferenceToggleItem
              id="pref-approvals"
              label="Signature & Contract Approval Requests"
              description="High-priority alerts when Master Service Agreements or code sign-offs require your signature."
              checked={approvalReminders}
              onChange={setApprovalReminders}
              badge="High Priority"
            />
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="pt-6 border-t border-[var(--line)] flex items-center justify-between">
          <Link
            href="/onboarding/profile"
            className="px-4 py-2 text-xs font-medium rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--mist)]/40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveAndContinue}
            className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Complete Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </OnboardingStepLayout>
  );
}
