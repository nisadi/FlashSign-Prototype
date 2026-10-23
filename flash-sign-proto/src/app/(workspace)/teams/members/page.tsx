'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Search, Filter, LayoutGrid, List,
  Briefcase, Mail, Building2, CheckSquare, ChevronRight,
  Edit3, Trash2, ArrowUpDown,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AvailabilityBadge } from '@/components/collaboration/collaboration-badges';
import { CreateMemberDialog } from '@/components/collaboration/create-member-dialog';
import type { User, AvailabilityStatus } from '@/types';
import { FEATURES } from '@/lib/features';
import { Modal } from '@/components/shared/modal';

export default function MembersDirectoryPage() {
  const router = useRouter();
  const { users, teams, projects, tasks, deleteMember } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'workload' | 'department'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<User | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<User | null>(null);

  // Departments
  const departments = useMemo(() => {
    return Array.from(new Set(users.map(u => u.department || 'Engineering')));
  }, [users]);

  // Filtered and Sorted Members
  const filteredMembers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch =
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.title || '').toLowerCase().includes(search.toLowerCase());

        const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
        const matchesTeam =
          teamFilter === 'all' || (u.teamIds && u.teamIds.includes(teamFilter));
        const matchesAvailability =
          availabilityFilter === 'all' || u.availability === availabilityFilter;

        return matchesSearch && matchesDept && matchesTeam && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'department') return (a.department || '').localeCompare(b.department || '');
        if (sortBy === 'workload') {
          const aCount = tasks.filter(t => t.assigneeId === a.id && t.status !== 'done').length;
          const bCount = tasks.filter(t => t.assigneeId === b.id && t.status !== 'done').length;
          return bCount - aCount;
        }
        return 0;
      });
  }, [users, search, departmentFilter, teamFilter, availabilityFilter, sortBy, tasks]);

  const handleDelete = (member: User) => {
    deleteMember(member.id);
    setDeleteConfirmMember(null);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Directory
              </span>
              <span className="text-xs text-muted">All Organization Contributors</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Team Members Directory
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Explore profiles, active task allocations, working hours, and availability statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMemberToEdit(null);
                setCreateMemberOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Department */}
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Team */}
            {FEATURES.teams && (
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="all">All Squads</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {/* Availability */}
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Availabilities</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="focus_time">Focus Time</option>
              <option value="out_of_office">Out of Office</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="name">Sort by Name</option>
              <option value="workload">Sort by Active Tasks</option>
              <option value="department">Sort by Department</option>
            </select>

            {/* Grid / List toggle */}
            <div className="flex items-center bg-paper rounded-lg border border-line p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-mist text-ink font-bold shadow-2xs' : 'text-muted hover:text-ink'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-mist text-ink font-bold shadow-2xs' : 'text-muted hover:text-ink'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 bg-paper-elevated border border-line rounded-xl p-8 space-y-3">
            <Users className="w-12 h-12 text-muted mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-ink">No members found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No organization members match your search or filter configuration.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setDepartmentFilter('all');
                setTeamFilter('all');
                setAvailabilityFilter('all');
              }}
              className="px-4 py-1.5 bg-mist hover:bg-line text-ink font-semibold rounded-lg text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map(member => {
              const memberTeams = teams.filter(t => member.teamIds?.includes(t.id));
              const memberTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done');
              const memberProjects = projects.filter(p => member.projectIds?.includes(p.id));

              return (
                <div
                  key={member.id}
                  className="bg-paper-elevated border border-line rounded-xl shadow-2xs hover:shadow-xs hover:border-flash/60 transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar + Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <MemberAvatar user={member} size="lg" showAvailability />
                        <div className="min-w-0">
                          <Link
                            href={`/teams/members/${member.id}`}
                            className="font-bold text-sm text-ink group-hover:text-flash-deep transition-colors truncate block"
                          >
                            {member.name}
                          </Link>
                          <p className="text-xs text-muted truncate">{member.title || member.role}</p>
                          <p className="text-[10px] uppercase font-semibold text-muted tracking-wider mt-0.5">
                            {member.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setMemberToEdit(member);
                            setCreateMemberOpen(true);
                          }}
                          className="p-1 rounded text-muted hover:text-ink hover:bg-mist transition-colors"
                          title="Edit Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmMember(member)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Email & Availability */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted flex items-center gap-1 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </span>
                      {member.availability && <AvailabilityBadge status={member.availability} size="sm" />}
                    </div>

                    {/* Squad Badges */}
                    {FEATURES.teams && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted font-medium">Assigned Squads:</span>
                      <div className="flex flex-wrap gap-1">
                        {memberTeams.length === 0 ? (
                          <span className="text-[11px] text-muted italic">Unassigned squad</span>
                        ) : (
                          memberTeams.map(t => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mist/60 border border-line text-ink"
                            >
                              {t.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    )}

                    {/* Skills pills */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-paper border border-line text-muted"
                          >
                            {sk}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="text-[10px] text-muted self-center">
                            +{member.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Stats */}
                  <div className="pt-4 mt-4 border-t border-line flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted">
                      <span><strong>{memberTasks.length}</strong> tasks</span>
                      <span>&bull;</span>
                      <span><strong>{memberProjects.length}</strong> projects</span>
                    </div>

                    <Link
                      href={`/teams/members/${member.id}`}
                      className="font-semibold text-flash-deep hover:text-ink transition-colors flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-mist/40 border-b border-line text-muted uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Department</th>
                    {FEATURES.teams && <th className="py-3 px-4">Squads</th>}
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Active Tasks</th>
                    <th className="py-3 px-4">Time Zone</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredMembers.map(member => {
                    const memberTeams = teams.filter(t => member.teamIds?.includes(t.id));
                    const memberTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'done');
                    return (
                      <tr key={member.id} className="hover:bg-mist/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar user={member} size="sm" showAvailability />
                            <div>
                              <Link
                                href={`/teams/members/${member.id}`}
                                className="font-bold text-ink hover:text-flash-deep transition-colors"
                              >
                                {member.name}
                              </Link>
                              <p className="text-[10px] text-muted">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-ink">{member.title || member.role}</p>
                          <p className="text-[10px] text-muted">{member.department}</p>
                        </td>
                        {FEATURES.teams && (
                          <td className="py-3 px-4">
                            <span className="font-medium text-ink">
                              {memberTeams.map(t => t.name).join(', ') || 'None'}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          {member.availability && <AvailabilityBadge status={member.availability} size="sm" />}
                        </td>
                        <td className="py-3 px-4 font-bold text-ink">{memberTasks.length} tasks</td>
                        <td className="py-3 px-4 text-muted font-mono text-[11px]">{member.timeZone || 'EST'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setMemberToEdit(member);
                                setCreateMemberOpen(true);
                              }}
                              className="p-1 rounded text-muted hover:text-ink hover:bg-mist transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmMember(member)}
                              className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Member Dialog */}
      <CreateMemberDialog
        open={createMemberOpen}
        onOpenChange={setCreateMemberOpen}
        memberToEdit={memberToEdit}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirmMember}
        onClose={() => setDeleteConfirmMember(null)}
        size="xs"
      >
        {deleteConfirmMember && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Remove Member</h3>
            <p className="text-muted leading-relaxed">
              Are you sure you want to remove <strong>{deleteConfirmMember.name}</strong> from the organization? Their task assignments will be unlinked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setDeleteConfirmMember(null)}
                className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmMember)}
                className="px-4 py-1.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
