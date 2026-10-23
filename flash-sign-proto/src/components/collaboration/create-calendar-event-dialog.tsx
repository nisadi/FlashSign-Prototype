'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { CalendarEvent, EventCategory } from '@/types';
import { FEATURES } from '@/lib/features';
import { ClientPortal } from '@/components/shared/modal';

interface CreateCalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
  onSuccess?: (evt: CalendarEvent) => void;
}

const CATEGORIES: { id: EventCategory; label: string; color: string }[] = [
  { id: 'meeting', label: 'Meeting / Sync', color: '#00c2a8' },
  { id: 'task_deadline', label: 'Task Deadline', color: '#f59e0b' },
  { id: 'milestone', label: 'Milestone', color: '#8b5cf6' },
  { id: 'team_event', label: 'Team Event', color: '#3b82f6' },
  { id: 'planning_reminder', label: 'Planning Reminder', color: '#10b981' },
  { id: 'time_off', label: 'Out of Office / Leave', color: '#f43f5e' },
];

export function CreateCalendarEventDialog({
  open,
  onOpenChange,
  eventToEdit,
  defaultDate,
  onSuccess,
}: CreateCalendarEventDialogProps) {
  const { users, teams, projects, addCalendarEvent, updateCalendarEvent, currentUserId } = useApp();

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [category, setCategory] = useState<EventCategory>(eventToEdit?.category || 'meeting');
  const [startDate, setStartDate] = useState(
    eventToEdit?.startDate ? eventToEdit.startDate.slice(0, 16) : `${defaultDate || '2026-10-21'}T10:00`
  );
  const [endDate, setEndDate] = useState(
    eventToEdit?.endDate ? eventToEdit.endDate.slice(0, 16) : `${defaultDate || '2026-10-21'}T11:00`
  );
  const [allDay, setAllDay] = useState(eventToEdit?.allDay ?? false);
  const [organizerId, setOrganizerId] = useState(eventToEdit?.organizerId || currentUserId);
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    eventToEdit?.attendeeIds || [currentUserId]
  );
  const [teamId, setTeamId] = useState(eventToEdit?.teamId || '');
  const [projectId, setProjectId] = useState(eventToEdit?.projectId || '');
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [meetingLink, setMeetingLink] = useState(eventToEdit?.meetingLink || '');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const toggleAttendee = (uid: string) => {
    setAttendeeIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide an event title');
      return;
    }

    if (!allDay && new Date(endDate) <= new Date(startDate)) {
      setError('End date & time must be after start date & time');
      return;
    }

    if (eventToEdit) {
      updateCalendarEvent(eventToEdit.id, {
        title: trimmedTitle,
        description: description.trim(),
        category,
        startDate,
        endDate,
        allDay,
        organizerId,
        attendeeIds,
        teamId: teamId || undefined,
        projectId: projectId || undefined,
        location,
        meetingLink,
      });
      setSuccessMsg('Event updated successfully!');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...eventToEdit, title: trimmedTitle });
      }, 700);
    } else {
      addCalendarEvent({
        title: trimmedTitle,
        description: description.trim(),
        category,
        startDate,
        endDate,
        allDay,
        organizerId,
        attendeeIds,
        teamId: teamId || undefined,
        projectId: projectId || undefined,
        location,
        meetingLink,
      });
      setSuccessMsg('Event added to calendar!');
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-2xl w-full max-w-xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 border border-flash/30 flex items-center justify-center text-flash-deep">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {eventToEdit ? 'Edit Calendar Event' : 'Create Calendar Event'}
              </h2>
              <p className="text-xs text-muted">
                Schedule meetings, milestones, releases, or planning reminders.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Event Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Platform Release Candidate Sign-off"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">Event Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors border ${
                      isSelected
                        ? 'bg-ink text-white border-ink font-semibold'
                        : 'bg-paper border-line text-muted hover:text-ink'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDayCheckbox"
              checked={allDay}
              onChange={e => setAllDay(e.target.checked)}
              className="rounded accent-flash text-flash"
            />
            <label htmlFor="allDayCheckbox" className="font-semibold text-ink cursor-pointer">
              All-Day Event
            </label>
          </div>

          {/* Start and End Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" /> Start Date & Time
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? startDate.split('T')[0] : startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" /> End Date & Time
              </label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? endDate.split('T')[0] : endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>
          </div>

          {/* Team and Project */}
          <div className={`grid grid-cols-1 ${FEATURES.teams ? 'sm:grid-cols-2' : ''} gap-3`}>
            {FEATURES.teams && (
              <div>
                <label className="block font-semibold text-ink mb-1">Related Team</label>
                <select
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  <option value="">None</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-ink mb-1">Related Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">
              Attendees ({attendeeIds.length})
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
              {users.map(u => {
                const isSelected = attendeeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAttendee(u.id)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-md text-left transition-colors border ${
                      isSelected
                        ? 'bg-flash/10 border-flash/30 text-ink'
                        : 'bg-paper-elevated border-line/50 hover:bg-mist/30 text-muted'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: u.color }}>
                      {u.initials}
                    </span>
                    <span className="truncate text-[11px] flex-1">{u.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-flash-deep shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location and Video Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Town Hall or Room 102"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Demo Video Link</label>
              <input
                type="text"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://meet.flashsign.demo/..."
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-ink mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Context, agenda, or reminders for participants..."
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-semibold shadow-xs transition-colors"
            >
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
