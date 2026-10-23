'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Send,
  Info
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { FEATURES } from '@/lib/features';

export default function NewMeetingPage() {
  const router = useRouter();
  const { users, teams, projects, meetings, addMeeting } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('10:45 AM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [organizerId, setOrganizerId] = useState(users[0]?.id || '');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([
    users[0]?.id || '',
    users[1]?.id || ''
  ]);
  const [teamId, setTeamId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [agendaText, setAgendaText] = useState('1. Sprint goals review\n2. Architecture blockers\n3. Action items');
  const [meetingLink, setMeetingLink] = useState('https://meet.flashsign.demo/sprint-sync');
  const [location, setLocation] = useState('Virtual Room #1');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Participant conflict detection
  const conflicts = useMemo(() => {
    if (!date || selectedParticipantIds.length === 0) return [];
    const conflicting: { user: string; meeting: string }[] = [];

    const dayMeetings = meetings.filter(m => m.date === date && m.status !== 'cancelled');

    for (const pId of selectedParticipantIds) {
      const busy = dayMeetings.find(
        m => (m.organizerId === pId || m.participantIds.includes(pId)) && m.startTime === startTime
      );
      if (busy) {
        const u = users.find(x => x.id === pId);
        conflicting.push({
          user: u?.name || 'Member',
          meeting: busy.title
        });
      }
    }
    return conflicting;
  }, [date, startTime, selectedParticipantIds, meetings, users]);

  const toggleParticipant = (uId: string) => {
    setSelectedParticipantIds(prev =>
      prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }
    if (!date) {
      setError('Please choose a date.');
      return;
    }
    if (!organizerId) {
      setError('Organizer is required.');
      return;
    }
    if (selectedParticipantIds.length === 0) {
      setError('Select at least one participant.');
      return;
    }

    const agenda = agendaText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    addMeeting({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      durationMinutes,
      organizerId,
      participantIds: selectedParticipantIds,
      teamId: teamId || undefined,
      projectId: projectId || undefined,
      agenda,
      location: location.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
      status: 'upcoming'
    });

    setIsSubmitted(true);
    setTimeout(() => {
      router.push('/planner/meetings');
    }, 1200);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/planner/meetings"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Meeting Planner
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <Video className="w-7 h-7 text-flash-deep" />
            Schedule New Meeting
          </h1>
          <p className="text-sm text-muted mt-1">
            Create an interactive team sync, sprint demo, or 1:1 session with automated conflict warnings and calendar synchronization.
          </p>
        </div>

        {/* Prototype banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Conflict Detection:</span> Flash Sign checks all participants for scheduling overlaps at the chosen time slot. You may adjust the time or proceed with the reservation.
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white border border-emerald-300 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">Meeting Scheduled!</h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              <strong>{title}</strong> has been added to the calendar for {date} at {startTime}. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Participant Schedule Conflict
                </div>
                <p className="text-[11px] text-amber-800">
                  The following participants have overlapping commitments at {startTime}:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-900 font-medium">
                  {conflicts.map((c, i) => (
                    <li key={i}>{c.user} is scheduled for &ldquo;{c.meeting}&rdquo;</li>
                  ))}
                </ul>
                <p className="text-[10px] text-amber-700 italic pt-1">
                  You can proceed anyway to override, or pick another time slot.
                </p>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Meeting Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Sprint 24 Backlog Refinement & Architecture Review"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Description & Purpose
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Briefly describe the context or deliverables for this session..."
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* Date, Start Time, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Start Time
                </label>
                <select
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash font-mono"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={e => {
                    const dur = Number(e.target.value);
                    setDurationMinutes(dur);
                  }}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                >
                  <option value={15}>15 minutes (Quick Standup)</option>
                  <option value={30}>30 minutes (Standard Check-in)</option>
                  <option value={45}>45 minutes (Sync & Review)</option>
                  <option value={60}>60 minutes (1 Hour Deep Dive)</option>
                  <option value={90}>90 minutes (Architecture Workshop)</option>
                </select>
              </div>
            </div>

            {/* Organizer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Session Organizer <span className="text-danger">*</span>
              </label>
              <select
                value={organizerId}
                onChange={e => setOrganizerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Participant selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Attendees / Participants ({selectedParticipantIds.length}) <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedParticipantIds.length === users.length) {
                      setSelectedParticipantIds([organizerId]);
                    } else {
                      setSelectedParticipantIds(users.map(u => u.id));
                    }
                  }}
                  className="text-[11px] text-flash-deep hover:underline font-semibold"
                >
                  {selectedParticipantIds.length === users.length ? 'Clear All' : 'Select All Members'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-line rounded-xl">
                {users.map(u => {
                  const isChecked = selectedParticipantIds.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleParticipant(u.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-flash/10 border-flash ring-1 ring-flash'
                          : 'border-line/60 hover:bg-paper'
                      }`}
                    >
                      <MemberAvatar user={u} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-ink truncate">{u.name}</div>
                        <div className="text-[10px] text-muted truncate">{u.role}</div>
                      </div>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-flash flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Squad & Project Association */}
            <div className={`grid grid-cols-1 ${FEATURES.teams ? 'sm:grid-cols-2' : ''} gap-4`}>
              {FEATURES.teams && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                    Related Squad (Optional)
                  </label>
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                  >
                    <option value="">None / Cross-functional</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Related Project (Optional)
                </label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                >
                  <option value="">None / General</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meeting Link & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Conferencing Link (Demo)
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.flashsign.demo/..."
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Location or Room
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Virtual Room 1 or Conference Room A"
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                />
              </div>
            </div>

            {/* Agenda Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Agenda Items (One per line)
              </label>
              <textarea
                value={agendaText}
                onChange={e => setAgendaText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash font-mono"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <Link
                href="/planner/meetings"
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Schedule & Sync Calendar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
