'use client';

import React, { useState } from 'react';
import { X, Video, Calendar, Clock, Copy, Check, Users, Ban, Edit3, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Meeting } from '@/types';
import { MeetingStatusBadge, AvailabilityBadge } from './collaboration-badges';
import { FEATURES } from '@/lib/features';
import { ClientPortal } from '@/components/shared/modal';

interface MeetingDetailDrawerProps {
  meeting: Meeting | null;
  onClose: () => void;
  onEdit?: (m: Meeting) => void;
}

export function MeetingDetailDrawer({
  meeting,
  onClose,
  onEdit,
}: MeetingDetailDrawerProps) {
  const { users, teams, projects, cancelMeeting } = useApp();
  const [copied, setCopied] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (!meeting) return null;

  const organizer = users.find(u => u.id === meeting.organizerId);
  const team = teams.find(t => t.id === meeting.teamId);
  const project = projects.find(p => p.id === meeting.projectId);
  const participants = users.filter(u => meeting.participantIds.includes(u.id));

  const copyLink = () => {
    if (meeting.meetingLink) {
      navigator.clipboard.writeText(meeting.meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancel = () => {
    cancelMeeting(meeting.id);
    setCancelled(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex justify-end bg-ink/50 backdrop-blur-xs animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-paper-elevated border-l border-line w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Meeting Details</p>
              <h2 className="text-sm font-bold text-ink truncate max-w-[260px]">{meeting.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {cancelled && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 font-medium flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0" />
              <span>Meeting has been cancelled and attendees notified.</span>
            </div>
          )}

          {/* Status & Timing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
            <div>
              <div className="flex items-center gap-1.5 text-ink font-semibold">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span>{meeting.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted text-[11px] mt-0.5">
                <Clock className="w-3.5 h-3.5 text-muted" />
                <span>{meeting.startTime} – {meeting.endTime} ({meeting.durationMinutes} min)</span>
              </div>
            </div>
            <MeetingStatusBadge status={meeting.status} />
          </div>

          {/* Location & Demo Link */}
          <div className="space-y-2">
            <p className="font-semibold text-ink">Virtual Room / Location</p>
            <div className="p-3 rounded-xl bg-paper border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted">Location:</span>
                <span className="font-medium text-ink">{meeting.location || 'FlashSign Conference Room A'}</span>
              </div>
              {meeting.meetingLink && (
                <div className="pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-flash-deep font-mono text-[11px] truncate max-w-[220px]">
                    {meeting.meetingLink}
                  </span>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-mist/60 hover:bg-line text-ink font-semibold text-[11px] transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Demo Link'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {meeting.description && (
            <div>
              <p className="font-semibold text-ink mb-1">Description</p>
              <p className="p-3 rounded-xl bg-paper border border-line text-muted leading-relaxed">
                {meeting.description}
              </p>
            </div>
          )}

          {/* Context: Team & Project */}
          <div className={`grid ${FEATURES.teams ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {FEATURES.teams && (
              <div className="p-3 rounded-xl bg-paper border border-line">
                <p className="text-[10px] text-muted font-medium">Team</p>
                <p className="font-semibold text-ink mt-0.5">{team?.name || 'General / Cross-functional'}</p>
              </div>
            )}
            <div className="p-3 rounded-xl bg-paper border border-line">
              <p className="text-[10px] text-muted font-medium">Related Project</p>
              <p className="font-semibold text-ink mt-0.5">{project?.name || 'Workspace Level'}</p>
            </div>
          </div>

          {/* Agenda */}
          {meeting.agenda && meeting.agenda.length > 0 && (
            <div>
              <p className="font-semibold text-ink mb-2">Meeting Agenda</p>
              <ul className="space-y-1.5">
                {meeting.agenda.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-paper border border-line">
                    <span className="w-4 h-4 rounded-full bg-flash/15 text-flash-deep text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-ink leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-ink">Participants ({participants.length})</p>
              <span className="text-[11px] text-muted">
                Organizer: <strong>{organizer?.name}</strong>
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-paper border border-line"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.initials}
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-ink truncate">
                        {p.name} {p.id === meeting.organizerId && <span className="text-flash-deep font-semibold">(Host)</span>}
                      </p>
                      <p className="text-[10px] text-muted truncate">{p.title || p.department}</p>
                    </div>
                  </div>
                  {p.availability && <AvailabilityBadge status={p.availability} size="sm" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line bg-mist/20 flex items-center justify-between">
          {meeting.status !== 'cancelled' ? (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 font-medium transition-colors text-xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Meeting</span>
            </button>
          ) : (
            <span className="text-xs text-rose-600 font-medium">Meeting Cancelled</span>
          )}

          <div className="flex items-center gap-2">
            {onEdit && meeting.status !== 'cancelled' && (
              <button
                onClick={() => onEdit(meeting)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-mist hover:bg-line text-ink font-semibold transition-colors text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-ink text-white font-semibold hover:bg-ink-soft transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </ClientPortal>
  );
}
