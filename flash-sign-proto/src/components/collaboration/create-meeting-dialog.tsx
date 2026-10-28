'use client';

import React, { useState, useMemo } from 'react';
import { X, Video, Calendar, Clock, Check, AlertTriangle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Meeting } from '@/types';
import { FEATURES } from '@/lib/features';
import { ClientPortal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingToEdit?: Meeting | null;
  defaultDate?: string;
  onSuccess?: (meeting: Meeting) => void;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
  meetingToEdit,
  defaultDate,
  onSuccess,
}: CreateMeetingDialogProps) {
  const { users, teams, projects, meetings, addMeeting, updateMeeting, currentUserId } = useApp();

  const [title, setTitle] = useState(meetingToEdit?.title || '');
  const [description, setDescription] = useState(meetingToEdit?.description || '');
  const [date, setDate] = useState(
    meetingToEdit?.date || defaultDate || '2026-10-21'
  );
  const [startTime, setStartTime] = useState(meetingToEdit?.startTime || '10:00');
  const [endTime, setEndTime] = useState(meetingToEdit?.endTime || '10:45');
  const [organizerId, setOrganizerId] = useState(meetingToEdit?.organizerId || currentUserId);
  const [participantIds, setParticipantIds] = useState<string[]>(
    meetingToEdit?.participantIds || [currentUserId]
  );
  const [teamId, setTeamId] = useState(meetingToEdit?.teamId || '');
  const [projectId, setProjectId] = useState(meetingToEdit?.projectId || '');
  const [location, setLocation] = useState(
    meetingToEdit?.location || 'Meeting Room Alpha'
  );
  const [meetingLink, setMeetingLink] = useState(
    meetingToEdit?.meetingLink || `https://meet.flashsign.demo/sync-${Date.now().toString().slice(-4)}`
  );
  const [agendaItems, setAgendaItems] = useState<string[]>(
    meetingToEdit?.agenda || ['Sprint deliverable review', 'Architecture sign-off', 'Open blockers']
  );
  const [newAgendaItem, setNewAgendaItem] = useState('');

  const [ignoredWarning, setIgnoredWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Participant conflict detection
  const conflicts = useMemo(() => {
    if (!date || !startTime || !endTime) return [];
    const conflictList: { userName: string; conflictingMeeting: string }[] = [];

    const startMinutes = parseMinutes(startTime);
    const endMinutes = parseMinutes(endTime);

    const sameDayMeetings = meetings.filter(
      m => m.date === date && m.status !== 'cancelled' && m.id !== meetingToEdit?.id
    );

    for (const m of sameDayMeetings) {
      const mStart = parseMinutes(m.startTime);
      const mEnd = parseMinutes(m.endTime);

      const hasOverlap = Math.max(startMinutes, mStart) < Math.min(endMinutes, mEnd);
      if (hasOverlap) {
        // check if any selected participant is in this meeting
        for (const pid of participantIds) {
          if (m.participantIds.includes(pid)) {
            const user = users.find(u => u.id === pid);
            conflictList.push({
              userName: user?.name || 'Participant',
              conflictingMeeting: `"${m.title}" (${m.startTime} - ${m.endTime})`,
            });
          }
        }
      }
    }

    return conflictList;
  }, [date, startTime, endTime, participantIds, meetings, users, meetingToEdit]);

  if (!open) return null;

  function parseMinutes(timeStr: string): number {
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  const toggleParticipant = (uid: string) => {
    setParticipantIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const addAgenda = () => {
    if (newAgendaItem.trim()) {
      setAgendaItems(prev => [...prev, newAgendaItem.trim()]);
      setNewAgendaItem('');
    }
  };

  const removeAgenda = (idx: number) => {
    setAgendaItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a meeting title');
      return;
    }

    if (parseMinutes(endTime) <= parseMinutes(startTime)) {
      setError('End time must be after start time');
      return;
    }

    if (conflicts.length > 0 && !ignoredWarning) {
      setError('Participant schedule conflicts detected. You can adjust times or click "Proceed Anyway".');
      return;
    }

    const durationMinutes = Math.max(15, parseMinutes(endTime) - parseMinutes(startTime));
    const finalParticipants = Array.from(new Set([organizerId, ...participantIds]));

    if (meetingToEdit) {
      updateMeeting(meetingToEdit.id, {
        title: trimmedTitle,
        description: description.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        organizerId,
        participantIds: finalParticipants,
        teamId: teamId || undefined,
        projectId: projectId || undefined,
        location,
        meetingLink,
        agenda: agendaItems,
      });
      setSuccessMsg('Meeting updated successfully!');
      notify(`Changes to meeting "${trimmedTitle}" saved`);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...meetingToEdit, title: trimmedTitle });
      }, 700);
    } else {
      addMeeting({
        title: trimmedTitle,
        description: description.trim(),
        date,
        startTime,
        endTime,
        durationMinutes,
        organizerId,
        participantIds: finalParticipants,
        teamId: teamId || undefined,
        projectId: projectId || undefined,
        location,
        meetingLink,
        agenda: agendaItems,
      });
      setSuccessMsg('Meeting scheduled and added to calendar!');
      notify(`Meeting "${trimmedTitle}" scheduled`);
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
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 border border-flash/30 flex items-center justify-center text-flash-deep">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {meetingToEdit ? 'Edit Meeting' : 'Schedule Meeting'}
              </h2>
              <p className="text-xs text-muted">
                Coordinate team syncs, sprint ceremonies, client demos, and reviews.
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
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {conflicts.length > 0 && !ignoredWarning && (
                  <button
                    type="button"
                    onClick={() => {
                      setIgnoredWarning(true);
                      setError(null);
                    }}
                    className="mt-1.5 block text-xs font-semibold text-ink underline"
                  >
                    Proceed anyway despite conflicts
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Conflict Warning box if any */}
          {conflicts.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Participant Conflict Warning ({conflicts.length})</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5 pl-1">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    <strong>{c.userName}</strong> already has {c.conflictingMeeting}
                  </li>
                ))}
              </ul>
              {!ignoredWarning && (
                <button
                  type="button"
                  onClick={() => setIgnoredWarning(true)}
                  className="mt-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 rounded font-medium text-[11px] transition-colors"
                >
                  Ignore & Allow Conflict
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Meeting Title */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Meeting Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint 12 Retro & Planning"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>
          </div>

          {/* Team & Project Associations */}
          <div className={`grid grid-cols-1 ${FEATURES.teams ? 'sm:grid-cols-2' : ''} gap-3`}>
            {FEATURES.teams && (
              <div>
                <label className="block font-semibold text-ink mb-1">Related Team (Optional)</label>
                <select
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  <option value="">No specific team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-ink mb-1">Related Project (Optional)</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="">No specific project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Demo Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Location / Room</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Conference Room B or Virtual"
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

          {/* Participants */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">
              Participants ({participantIds.length} invited)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
              {users.map(u => {
                const isSelected = participantIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleParticipant(u.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-md text-left transition-colors border ${
                      isSelected
                        ? 'bg-flash/10 border-flash/30 text-ink'
                        : 'bg-paper-elevated border-line/50 hover:bg-mist/30 text-muted'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                    <span className="text-xs truncate flex-1">{u.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-flash-deep shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Items */}
          <div>
            <label className="block font-semibold text-ink mb-1">Meeting Agenda Items</label>
            <div className="space-y-1.5 mb-2">
              {agendaItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-paper border border-line text-xs">
                  <span className="text-ink">{idx + 1}. {item}</span>
                  <button
                    type="button"
                    onClick={() => removeAgenda(idx)}
                    className="text-muted hover:text-danger p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAgendaItem}
                onChange={e => setNewAgendaItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAgenda();
                  }
                }}
                placeholder="Add agenda topic and press Enter..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
              <button
                type="button"
                onClick={addAgenda}
                className="px-3 py-1.5 bg-mist hover:bg-line text-ink font-semibold rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
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
              {meetingToEdit ? 'Save Changes' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
