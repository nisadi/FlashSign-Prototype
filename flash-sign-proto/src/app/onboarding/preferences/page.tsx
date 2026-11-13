'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { ThemeSelector, PreferenceToggleItem } from '@/components/onboarding/preference-toggle';
import { useDemoAuth } from '@/context/demo-auth-context';
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_EVENTS,
  isNotificationEnabled,
  type DemoPreferences,
  type NotificationEventKey,
} from '@/types/demo-auth';
import { ArrowLeft, ArrowRight, Bell, CalendarDays } from 'lucide-react';

const CALENDAR_VIEWS: { value: DemoPreferences['defaultCalendarView']; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
];

/** The per-event switches offered during onboarding (user_notification_setting); the rest are in Settings › Notifications. */
const ONBOARDING_EVENTS: NotificationEventKey[] = ['task_assigned', 'deadline_reminder', 'approval_reminder'];

export default function PreferencesSetupPage() {
  const router = useRouter();
  const { preferences, updatePreferences, notificationSettings, setNotificationSetting } = useDemoAuth();

  // user_preference
  const [theme, setTheme] = useState<'light' | 'dark'>(preferences.theme || 'light');
  const [calendarView, setCalendarView] = useState<DemoPreferences['defaultCalendarView']>(preferences.defaultCalendarView);
  const [inApp, setInApp] = useState(preferences.inAppNotifications);
  const [emailNotifs, setEmailNotifs] = useState(preferences.emailNotifications);
  const [desktop, setDesktop] = useState(preferences.desktopNotifications);
  const [weeklyDigest, setWeeklyDigest] = useState(preferences.weeklyDigest);
  // user_notification_setting (no row = the event's default)
  const [events, setEvents] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ONBOARDING_EVENTS.map(k => [k, isNotificationEnabled(notificationSettings, k)]))
  );

  const handleSaveAndContinue = () => {
    updatePreferences({
      theme,
      defaultCalendarView: calendarView,
      inAppNotifications: inApp,
      emailNotifications: emailNotifs,
      desktopNotifications: desktop,
      weeklyDigest,
    });
    ONBOARDING_EVENTS.forEach(k => setNotificationSetting(k, events[k]));
    router.push('/onboarding/complete');
  };

  return (
    <OnboardingStepLayout
      currentStep="preferences"
      title="Customize your workspace"
      subtitle="Choose your theme, calendar view and how you want to be notified. These are personal and apply in every organisation."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Theme Selector */}
        <ThemeSelector theme={theme} onChange={setTheme} />

        {/* Default calendar view (user_preference.default_calendar_view) */}
        <div className="pt-2">
          <label htmlFor="pref-calendar-view" className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
            <span>Default calendar view</span>
          </label>
          <select
            id="pref-calendar-view"
            value={calendarView}
            onChange={(e) => setCalendarView(e.target.value as DemoPreferences['defaultCalendarView'])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper-elevated)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--flash)]"
          >
            {CALENDAR_VIEWS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Preferences */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[var(--flash-deep)]" />
              <span>Notifications</span>
            </label>
            <span className="text-[11px] text-[var(--muted)]">You can change these later</span>
          </div>

          <div className="space-y-2.5">
            <PreferenceToggleItem
              id="pref-in-app"
              label="In-app notifications"
              description="Show alerts in the bell in the top bar."
              checked={inApp}
              onChange={setInApp}
              badge="Recommended"
            />
            <PreferenceToggleItem
              id="pref-email"
              label="Email notifications"
              description="Send the events you switch on below to your email as well."
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <PreferenceToggleItem
              id="pref-desktop"
              label="Desktop notifications"
              description="Show a browser notification while Flash Sign is open."
              checked={desktop}
              onChange={setDesktop}
            />
            <PreferenceToggleItem
              id="pref-digest"
              label="Weekly digest"
              description="One email each week summarising your tasks, approvals and signatures."
              checked={weeklyDigest}
              onChange={setWeeklyDigest}
              badge="Weekly"
            />
          </div>

          <p className="text-xs font-semibold text-[var(--ink)] pt-2">Notify me when</p>
          <div className="space-y-2.5">
            {ONBOARDING_EVENTS.map((key) => {
              const def = NOTIFICATION_EVENTS.find((e) => e.eventKey === key)!;
              return (
                <PreferenceToggleItem
                  key={key}
                  id={`pref-event-${key}`}
                  label={def.name}
                  description={`${NOTIFICATION_CATEGORY_LABELS[def.category]} • more events in Settings › Notifications`}
                  checked={events[key]}
                  onChange={(v) => setEvents((prev) => ({ ...prev, [key]: v }))}
                />
              );
            })}
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
