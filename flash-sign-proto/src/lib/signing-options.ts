import type { ReminderFrequency, SignatureSource } from '@/types';

// Choices shared by Agreements > Settings and the send-for-signature wizard (Flash Sign's values)

export const REMINDER_OPTIONS: { value: ReminderFrequency; label: string; intervalDays?: number }[] = [
  { value: 'daily', label: 'Every day', intervalDays: 1 },
  { value: 'every_2_days', label: 'Every 2 days', intervalDays: 2 },
  { value: 'every_3_days', label: 'Every 3 days', intervalDays: 3 },
  { value: 'weekly', label: 'Every week', intervalDays: 7 },
  { value: 'never', label: 'Never' },
];

export const EXPIRY_PRESETS = [30, 60, 90, 120];
export const MIN_EXPIRY_DAYS = 1;
export const MAX_EXPIRY_DAYS = 999;

export const MAX_SUBJECT_LENGTH = 100;
export const MAX_MESSAGE_LENGTH = 10_000;

export const SIGNATURE_METHOD_LABELS: Record<SignatureSource, string> = {
  type: 'Type a name in a signature style',
  draw: 'Draw with a mouse or finger',
  upload: 'Upload an image',
};

export const reminderIntervalDays = (frequency: ReminderFrequency) =>
  REMINDER_OPTIONS.find(o => o.value === frequency)?.intervalDays;
