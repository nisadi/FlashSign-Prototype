'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Video,
  Plus,
  Clock,
  Calendar,
  Users,
  Search,
  Filter,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Info,
  CalendarDays
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { MeetingStatusBadge } from '@/components/collaboration/collaboration-badges';
import { CreateMeetingDialog } from '@/components/collaboration/create-meeting-dialog';
import { MeetingDetailDrawer } from '@/components/collaboration/meeting-detail-drawer';
import { Meeting } from '@/types/collaboration';

export default function MeetingPlannerPage() {
  const {
    meetings,
    users,
    teams,
    projects,
    cancelMeeting,
    deleteMeeting
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      // Tab filter
      if (activeTab === 'today' && m.date !== todayStr) return false;
      if (activeTab === 'upcoming' && (m.date < todayStr || m.status === 'completed')) return false;
      if (activeTab === 'past' && m.date >= todayStr && m.status !== 'completed') return false;

      // Squad filter
      if (selectedTeamId !== 'all' && m.teamId !== selectedTeamId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const organizer = users.find(u => u.id === m.organizerId);
        const matchesOrg = organizer?.name.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesOrg) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort upcoming ascending by date, past descending
      if (activeTab === 'past') {
        return new Date(`${b.date} ${b.startTime}`).getTime() - new Date(`${a.date} ${a.startTime}`).getTime();
      }
      return new Date(`${a.date} ${a.startTime}`).getTime() - new Date(`${b.date} ${b.startTime}`).getTime();
    });
  }, [meetings, activeTab, selectedTeamId, searchQuery, todayStr, users]);

  // Tab counts
  const counts = useMemo(() => {
    const all = meetings.length;
    const today = meetings.filter(m => m.date === todayStr && m.status !== 'cancelled').length;
    const upcoming = meetings.filter(m => m.date >= todayStr && m.status !== 'cancelled').length;
    const past = meetings.filter(m => m.date < todayStr || m.status === 'completed').length;
    return { all, today, upcoming, past };
  }, [meetings, todayStr]);

  const handleCopyLink = (e: React.MouseEvent, link?: string) => {
    e.stopPropagation();
    if (!link) return;
    navigator.clipboard?.writeText(link);
    showToast('Mock meeting link copied to clipboard!');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-flash" />
            {toastMessage}
          </div>
        )}

        {/* Header Breadcrumbs & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/planner/calendar" className="hover:text-ink transition-colors">Planning</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Meetings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Video className="w-7 h-7 text-flash-deep" />
              Meeting Planner
            </h1>
            <p className="text-sm text-muted mt-1">
              Organize sprint syncs, architectural reviews, and stakeholder check-ins with automatic calendar reservations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/planner/meetings/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-sm"
            >
              Full Scheduler Page
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* Prototype banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Demo Conferencing:</span> Video room links are simulated for local testing. Scheduled sessions automatically populate the Flash Sign Planner and Team Calendar views.
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">All Sessions</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.all}</div>
            <p className="text-[11px] text-muted mt-0.5">Recorded meetings</p>
          </div>

          <div className="p-4 bg-white border border-flash/40 rounded-xl shadow-xs bg-flash/5">
            <span className="text-xs font-medium text-flash-deep">Today&apos;s Sessions</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.today}</div>
            <p className="text-[11px] text-muted mt-0.5">Active or scheduled for today</p>
          </div>

          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">Upcoming</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.upcoming}</div>
            <p className="text-[11px] text-muted mt-0.5">Future synchronized sessions</p>
          </div>

          <div className="p-4 bg-white border border-line/70 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-muted">Past / Completed</span>
            <div className="text-2xl font-bold text-ink mt-1">{counts.past}</div>
            <p className="text-[11px] text-muted mt-0.5">Historical notes & agendas</p>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-line/60 pb-3">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                { id: 'today', label: "Today's Meetings", count: counts.today },
                { id: 'past', label: 'Past Sessions', count: counts.past },
                { id: 'all', label: 'All', count: counts.all }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-paper'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-paper text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Squad Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <select
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
              >
                <option value="all">All Squads & Projects</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title, agenda, organizer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
            />
          </div>
        </div>

        {/* Meeting Cards List */}
        <div className="space-y-3">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white border border-line/70 rounded-2xl p-12 text-center text-muted shadow-sm">
              <Video className="w-8 h-8 text-muted/60 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-ink">No meetings found</h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                No sessions match the selected tab and filter criteria. You can schedule a new meeting with your squad anytime.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors"
              >
                Schedule Meeting Now
              </button>
            </div>
          ) : (
            filteredMeetings.map(meeting => {
              const organizer = users.find(u => u.id === meeting.organizerId);
              const team = teams.find(t => t.id === meeting.teamId);
              const project = projects.find(p => p.id === meeting.projectId);
              const participants = users.filter(u => meeting.participantIds.includes(u.id));

              return (
                <div
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className="bg-white border border-line/70 hover:border-flash/80 rounded-xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Details */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <MeetingStatusBadge status={meeting.status} />
                      <span className="text-xs font-bold text-ink font-mono bg-paper px-2 py-0.5 rounded border border-line/60">
                        {meeting.date} • {meeting.startTime} - {meeting.endTime}
                      </span>
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meeting.durationMinutes} min
                      </span>
                      {team && (
                        <span className="text-[11px] font-medium text-ink-soft bg-mist/40 px-2 py-0.5 rounded border border-line/40">
                          {team.name}
                        </span>
                      )}
                      {project && (
                        <span className="text-[11px] font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line/40">
                          {project.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-ink truncate hover:text-flash-deep transition-colors">
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="text-xs text-muted line-clamp-1 mt-0.5">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    {/* Agenda items preview */}
                    {meeting.agenda && meeting.agenda.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted pt-1">
                        <FileText className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                        <span className="font-medium text-ink-soft">Agenda:</span>
                        <span className="truncate max-w-lg">
                          {meeting.agenda.join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: People & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-line/50">
                    {/* Participants Avatars */}
                    <div className="flex items-center -space-x-2">
                      {participants.slice(0, 4).map(p => (
                        <div key={p.id} title={`${p.name} (${p.role})`}>
                          <MemberAvatar user={p} size="sm" />
                        </div>
                      ))}
                      {participants.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-paper border-2 border-white flex items-center justify-center text-[10px] font-bold text-muted">
                          +{participants.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Link copy & Details button */}
                    <div className="flex items-center gap-2">
                      {meeting.meetingLink && (
                        <button
                          onClick={e => handleCopyLink(e, meeting.meetingLink)}
                          className="p-2 rounded-lg border border-line bg-paper hover:bg-mist/30 text-ink text-xs flex items-center gap-1 transition-colors"
                          title="Copy Demo Meeting Link"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted" />
                          <span className="hidden sm:inline font-medium">Link</span>
                        </button>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-ink text-white hover:bg-ink-soft text-xs font-semibold transition-colors shadow-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Meeting Dialog */}
        <CreateMeetingDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />

        {/* Meeting Detail Drawer */}
        <MeetingDetailDrawer
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      </div>
    </div>
  );
}
