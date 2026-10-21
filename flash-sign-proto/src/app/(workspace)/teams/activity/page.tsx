'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity, Search, Filter, Calendar, Users, CheckSquare,
  Video, Palmtree, Megaphone, Flag, Building2, ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';

const CATEGORIES = [
  { id: 'all', label: 'All Activities' },
  { id: 'team', label: 'Teams & Squads' },
  { id: 'member', label: 'Members & Roles' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'time_off', label: 'Time Off' },
  { id: 'announcement', label: 'Announcements' },
  { id: 'task', label: 'Tasks & Projects' },
];

export default function TeamActivityPage() {
  const { activities, users, teams } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch =
        act.action.toLowerCase().includes(search.toLowerCase()) ||
        act.actorName.toLowerCase().includes(search.toLowerCase()) ||
        (act.detail || '').toLowerCase().includes(search.toLowerCase());

      const matchesMember = selectedMember === 'all' || act.actorId === selectedMember;

      let matchesCat = true;
      if (selectedCategory === 'team') matchesCat = act.resource?.toLowerCase() === 'team';
      else if (selectedCategory === 'member') matchesCat = act.resource?.toLowerCase() === 'member';
      else if (selectedCategory === 'meeting') matchesCat = act.resource?.toLowerCase() === 'meeting';
      else if (selectedCategory === 'time_off') matchesCat = act.resource?.toLowerCase().includes('time');
      else if (selectedCategory === 'announcement') matchesCat = act.resource?.toLowerCase() === 'announcement';
      else if (selectedCategory === 'task') matchesCat = act.resource?.toLowerCase() === 'task' || act.resource?.toLowerCase() === 'project';

      return matchesSearch && matchesMember && matchesCat;
    });
  }, [activities, search, selectedMember, selectedCategory]);

  const getActionIcon = (resource?: string) => {
    const r = resource?.toLowerCase() || '';
    if (r === 'team') return <Building2 className="w-4 h-4 text-blue-500" />;
    if (r === 'member') return <Users className="w-4 h-4 text-emerald-500" />;
    if (r === 'meeting') return <Video className="w-4 h-4 text-flash-deep" />;
    if (r.includes('time')) return <Palmtree className="w-4 h-4 text-rose-500" />;
    if (r === 'announcement') return <Megaphone className="w-4 h-4 text-amber-500" />;
    if (r === 'milestone') return <Flag className="w-4 h-4 text-purple-500" />;
    return <CheckSquare className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
              Activity Stream
            </span>
            <span className="text-xs text-muted">Organization & Team Collaboration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
            Team Activity Feed
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Audit logs and chronological event stream for team member actions, meetings, time-off requests, and squad changes.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search activity by actor, action, or details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Member Filter */}
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-ink text-white shadow-2xs'
                    : 'bg-paper text-muted hover:text-ink border border-line'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Stream */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 p-8 space-y-2">
              <Activity className="w-10 h-10 text-muted mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-bold text-ink">No activities found</h3>
              <p className="text-xs text-muted">Try resetting search or filter criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredActivities.map(act => {
                const actor = users.find(u => u.id === act.actorId);
                return (
                  <div
                    key={act.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-mist/20 transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative shrink-0 mt-0.5">
                        <MemberAvatar user={actor} name={act.actorName} size="md" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-paper-elevated border border-line flex items-center justify-center">
                          {getActionIcon(act.resource)}
                        </div>
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <p className="text-ink font-semibold text-xs leading-relaxed">
                          <strong>{act.actorName}</strong> {act.action}
                        </p>
                        {act.detail && (
                          <p className="text-muted text-[11px] leading-relaxed">
                            {act.detail}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted font-mono">
                          <span>{act.timestamp}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{act.resource || 'Collaboration'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {act.resource?.toLowerCase() === 'team' ? (
                        <Link
                          href="/teams/directory"
                          className="font-semibold text-flash-deep hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Teams</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ) : act.resource?.toLowerCase() === 'meeting' ? (
                        <Link
                          href="/planner/meetings"
                          className="font-semibold text-flash-deep hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Meetings</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ) : act.resource?.toLowerCase().includes('time') ? (
                        <Link
                          href="/planner/time-off"
                          className="font-semibold text-flash-deep hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Time Off</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ) : act.resource?.toLowerCase() === 'announcement' ? (
                        <Link
                          href="/teams/announcements"
                          className="font-semibold text-flash-deep hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Board</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-muted">Audited</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
