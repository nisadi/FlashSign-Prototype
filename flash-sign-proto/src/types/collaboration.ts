// ─── Team Collaboration & Planning Types ─────────────────────────────────────

import type { User, Project, Task } from './index';

export type AvailabilityStatus = 'available' | 'busy' | 'focus_time' | 'out_of_office';

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'parental' | 'unpaid' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'declined';

export interface TimeOffRequest {
  id: string;
  memberId: string;
  leaveType: LeaveType;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  durationDays: number;
  isPartialDay?: boolean;
  reason?: string;
  notes?: string;
  status: TimeOffStatus;
  createdAt: string;
}

export type EventCategory =
  | 'task_deadline'
  | 'milestone'
  | 'meeting'
  | 'time_off'
  | 'team_event'
  | 'planning_reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  startDate: string; // ISO datetime or YYYY-MM-DD
  endDate: string;
  allDay: boolean;
  organizerId?: string;
  attendeeIds?: string[];
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  location?: string;
  meetingLink?: string;
  createdAt?: string;
}

export type MeetingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:00 AM" or "10:00"
  endTime: string;   // e.g. "11:00 AM" or "11:00"
  durationMinutes: number;
  organizerId: string;
  participantIds: string[];
  projectId?: string;
  agenda?: string[];
  location?: string;
  meetingLink?: string;
  status: MeetingStatus;
  createdAt: string;
}

export type AnnouncementPriority = 'normal' | 'important';
export type AnnouncementStatus = 'published' | 'draft';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishedDate: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  readByUserIds: string[];
  status: AnnouncementStatus;
  createdAt: string;
}

