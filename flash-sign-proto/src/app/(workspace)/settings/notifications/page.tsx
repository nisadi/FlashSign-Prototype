'use client';

import React from 'react';
import { Bell, Mail, CheckSquare, FileSignature, CalendarDays, Megaphone } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { SettingsPage, SettingsCard, SettingsToggle } from '@/components/settings/settings-layout';

const EVENT_GROUPS = [
  {
    title: 'Work',
    icon: CheckSquare,
    events: [
      { id: 'task_assigned', label: 'A task is assigned to me' },
      { id: 'mentioned', label: 'Someone mentions me in a comment' },
      { id: 'review_requested', label: 'My review is requested' },
      { id: 'task_blocked', label: 'A task I own is blocked' },
    ],
  },
  {
    title: 'Agreements',
    icon: FileSignature,
    events: [
      { id: 'signature_requested', label: 'A document is waiting for my signature' },
      { id: 'request_signed', label: 'Someone signs a request I sent' },
      { id: 'request_declined', label: 'Someone declines a request I sent' },
      { id: 'request_expiring', label: 'A request I sent is about to expire' },
    ],
  },
  {
    title: 'Planning',
    icon: CalendarDays,
    events: [
      { id: 'meeting_invite', label: 'I am invited to a meeting' },
      { id: 'meeting_conflict', label: 'A meeting clashes with my schedule' },
      { id: 'time_off_decision', label: 'My time-off request is approved or declined' },
    ],
  },
  {
    title: 'Teams',
    icon: Megaphone,
    events: [{ id: 'announcement', label: 'A new announcement is posted' }],
  },
];

export default function NotificationSettingsPage() {
  const { collaborationSettings, updateCollaborationSettings } = useApp();
  const events = collaborationSettings.notificationEvents ?? {};

  const setEvent = (id: string, on: boolean) =>
    updateCollaborationSettings({ notificationEvents: { ...events, [id]: on } });

  return (
    <SettingsPage title="Notifications" description="Choose where you hear about things, and which events are worth a notification. Changes save automatically.">
      <SettingsCard title="Where to notify me" icon={Bell}>
        <SettingsToggle
          label="In-app notifications"
          description="The bell in the top bar."
          checked={collaborationSettings.desktopNotifications}
          onChange={v => updateCollaborationSettings({ desktopNotifications: v })}
        />
        <SettingsToggle
          label="Email"
          description="Sent to your sign-in email address."
          checked={collaborationSettings.emailNotifications}
          onChange={v => updateCollaborationSettings({ emailNotifications: v })}
        />
        <SettingsToggle
          label="Weekly summary"
          description="One email on Monday with completed work and team capacity."
          checked={collaborationSettings.weeklyDigest}
          onChange={v => updateCollaborationSettings({ weeklyDigest: v })}
        />
      </SettingsCard>

      <SettingsCard
        title="What to notify me about"
        description="Applies to both in-app and email notifications."
        icon={Mail}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENT_GROUPS.map(group => (
            <div key={group.title} className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <group.icon className="w-3.5 h-3.5" /> {group.title}
              </h3>
              {group.events.map(ev => (
                <SettingsToggle
                  key={ev.id}
                  label={ev.label}
                  checked={events[ev.id] ?? true}
                  onChange={v => setEvent(ev.id, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
