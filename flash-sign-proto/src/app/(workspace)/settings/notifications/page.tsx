'use client';

import React from 'react';
import { Bell, Mail, CheckSquare, FileSignature, CalendarDays, Megaphone, Stamp, Palmtree, Info, Monitor } from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { SettingsPage, SettingsCard, SettingsToggle } from '@/components/settings/settings-layout';
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_EVENTS,
  isNotificationEnabled,
  type DemoPreferences,
  type NotificationEventCategory,
} from '@/types/demo-auth';

const CATEGORY_ICONS: Record<NotificationEventCategory, React.ElementType> = {
  task: CheckSquare,
  signature: FileSignature,
  approval: Stamp,
  meeting: CalendarDays,
  time_off: Palmtree,
  announcement: Megaphone,
  system: Info,
};

const CALENDAR_VIEWS: { value: DemoPreferences['defaultCalendarView']; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
];

const selectClass =
  'px-3 py-2 rounded-lg bg-paper border border-line text-ink text-xs focus:outline-hidden focus:border-flash';

/**
 * Personal settings, the same in every organisation:
 *  - user_preference: theme, default calendar view and the four delivery switches
 *  - user_notification_setting: one switch per notification_event (no row = the event's default)
 */
export default function NotificationSettingsPage() {
  const { preferences, updatePreferences, notificationSettings, setNotificationSetting } = useDemoAuth();

  // Group the fixed event list by its category, in the order the categories first appear
  const groups = NOTIFICATION_EVENTS.reduce<{ category: NotificationEventCategory; events: typeof NOTIFICATION_EVENTS }[]>((acc, ev) => {
    const g = acc.find(x => x.category === ev.category);
    if (g) g.events.push(ev);
    else acc.push({ category: ev.category, events: [ev] });
    return acc;
  }, []);

  const noChannel = !preferences.inAppNotifications && !preferences.emailNotifications && !preferences.desktopNotifications;

  return (
    <SettingsPage
      title="Notifications"
      description="Choose where you hear about things and which events are worth a notification. These settings are yours and apply in every organisation. Changes save automatically."
    >
      <SettingsCard title="Where to notify me" icon={Bell}>
        <SettingsToggle
          label="In-app notifications"
          description="The bell in the top bar."
          checked={preferences.inAppNotifications}
          onChange={v => updatePreferences({ inAppNotifications: v })}
        />
        <SettingsToggle
          label="Email"
          description="Sent to your sign-in email address."
          checked={preferences.emailNotifications}
          onChange={v => updatePreferences({ emailNotifications: v })}
        />
        <SettingsToggle
          label="Desktop notifications"
          description="A browser notification while Flash Sign is open."
          checked={preferences.desktopNotifications}
          onChange={v => updatePreferences({ desktopNotifications: v })}
        />
        <SettingsToggle
          label="Weekly digest"
          description="One email each week summarising your tasks, approvals and signatures."
          checked={preferences.weeklyDigest}
          onChange={v => updatePreferences({ weeklyDigest: v })}
        />
        {noChannel && (
          <p className="text-[11px] font-medium text-amber-700" role="status">
            All channels are off, so the events below won&apos;t reach you anywhere.
          </p>
        )}
      </SettingsCard>

      <SettingsCard
        title="What to notify me about"
        description="Applies to every channel switched on above."
        icon={Mail}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map(group => {
            const Icon = CATEGORY_ICONS[group.category];
            return (
              <div key={group.category} className="space-y-3">
                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <Icon className="w-3.5 h-3.5" /> {NOTIFICATION_CATEGORY_LABELS[group.category]}
                </h3>
                {group.events.map(ev => (
                  <SettingsToggle
                    key={ev.eventKey}
                    label={ev.name}
                    checked={isNotificationEnabled(notificationSettings, ev.eventKey)}
                    onChange={v => setNotificationSetting(ev.eventKey, v)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Display" description="How Flash Sign looks and opens for you." icon={Monitor}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="space-y-1">
            <span className="block font-semibold text-ink">Theme</span>
            <select
              value={preferences.theme}
              onChange={e => updatePreferences({ theme: e.target.value as DemoPreferences['theme'] })}
              className={`${selectClass} w-full`}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block font-semibold text-ink">Default calendar view</span>
            <select
              value={preferences.defaultCalendarView}
              onChange={e => updatePreferences({ defaultCalendarView: e.target.value as DemoPreferences['defaultCalendarView'] })}
              className={`${selectClass} w-full`}
            >
              {CALENDAR_VIEWS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
