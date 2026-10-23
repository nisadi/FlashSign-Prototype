'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, Search, Plus, LayoutGrid, List, Filter,
  ArrowUpDown, MoreVertical, Edit3, Trash2, ExternalLink,
  CheckCircle2, FolderKanban, CheckSquare,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { CreateTeamDialog } from '@/components/collaboration/create-team-dialog';
import type { Team } from '@/types';
import { Modal } from '@/components/shared/modal';

export default function TeamsDirectoryPage() {
  const router = useRouter();
  const { teams, users, projects, tasks, deleteTeam } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'projects'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<Team | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(teams.map(t => t.department || 'Engineering'));
    return Array.from(set);
  }, [teams]);

  // Filtered & Sorted teams
  const filteredTeams = useMemo(() => {
    return teams
      .filter(t => {
        const matchesSearch =
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          (t.department || '').toLowerCase().includes(search.toLowerCase());

        const matchesDept = departmentFilter === 'all' || t.department === departmentFilter;
        const matchesLead = leadFilter === 'all' || t.leadId === leadFilter;

        return matchesSearch && matchesDept && matchesLead;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.memberIds.length - a.memberIds.length;
        if (sortBy === 'projects') return (b.projectIds?.length || 0) - (a.projectIds?.length || 0);
        return 0;
      });
  }, [teams, search, departmentFilter, leadFilter, sortBy]);

  const handleDelete = (team: Team) => {
    deleteTeam(team.id);
    setDeleteConfirmTeam(null);
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
              <span className="text-xs text-muted">All Squads & Functional Groups</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Teams Directory
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Browse squads, assign team leads, track active project ownership, and manage memberships.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTeamToEdit(null);
                setCreateTeamOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search teams by name, description, or domain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Lead Filter */}
              <select
                value={leadFilter}
                onChange={e => setLeadFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="all">All Team Leads</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    Lead: {u.name}
                  </option>
                ))}
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Member Count</option>
                <option value="projects">Sort by Project Count</option>
              </select>

              {/* Grid / List toggle */}
              <div className="flex items-center bg-paper rounded-lg border border-line p-0.5">
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
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-16 bg-paper-elevated border border-line rounded-xl p-8 space-y-3">
            <Building2 className="w-12 h-12 text-muted mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-ink">No teams matched your criteria</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Try adjusting your search terms or filter selection, or create a new team for your organization.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setDepartmentFilter('all');
                setLeadFilter('all');
              }}
              className="px-4 py-1.5 bg-mist hover:bg-line text-ink font-semibold rounded-lg text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTeams.map(team => {
              const lead = users.find(u => u.id === team.leadId);
              const memberUsers = users.filter(u => team.memberIds.includes(u.id));
              const teamTasks = tasks.filter(t => memberUsers.some(m => m.id === t.assigneeId));
              const projectCount = team.projectIds?.length || 0;

              return (
                <div
                  key={team.id}
                  className="bg-paper-elevated border border-line rounded-xl shadow-2xs hover:shadow-xs hover:border-flash/60 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs shrink-0"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/teams/${team.id}`}
                            className="font-bold text-sm text-ink group-hover:text-flash-deep transition-colors line-clamp-1"
                          >
                            {team.name}
                          </Link>
                          <span className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                            {team.department}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setTeamToEdit(team);
                            setCreateTeamOpen(true);
                          }}
                          className="p-1 rounded text-muted hover:text-ink hover:bg-mist transition-colors"
                          title="Edit Team"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTeam(team)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {team.description}
                    </p>

                    {/* Team Lead */}
                    {lead && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-paper border border-line">
                        <MemberAvatar user={lead} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted">Team Lead</p>
                          <p className="font-semibold text-xs text-ink truncate">{lead.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-lg bg-paper border border-line">
                        <span className="text-[10px] text-muted block">Members</span>
                        <strong className="text-sm font-bold text-ink">{team.memberIds.length}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-paper border border-line">
                        <span className="text-[10px] text-muted block">Projects</span>
                        <strong className="text-sm font-bold text-ink">{projectCount}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-paper border border-line">
                        <span className="text-[10px] text-muted block">Tasks</span>
                        <strong className="text-sm font-bold text-ink">{teamTasks.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 border-t border-line bg-mist/20 flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {memberUsers.slice(0, 4).map(m => (
                        <MemberAvatar key={m.id} user={m} size="xs" showAvailability />
                      ))}
                      {memberUsers.length > 4 && (
                        <span className="w-6 h-6 rounded-full bg-mist text-[10px] font-bold text-ink flex items-center justify-center border border-white shrink-0">
                          +{memberUsers.length - 4}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors"
                    >
                      <span>Explore</span>
                      <ExternalLink className="w-3 h-3" />
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
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Lead</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Projects</th>
                    <th className="py-3 px-4">Tasks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredTeams.map(team => {
                    const lead = users.find(u => u.id === team.leadId);
                    const memberUsers = users.filter(u => team.memberIds.includes(u.id));
                    const teamTasks = tasks.filter(t => memberUsers.some(m => m.id === t.assigneeId));
                    return (
                      <tr key={team.id} className="hover:bg-mist/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: team.color }}
                            >
                              {team.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <Link
                                href={`/teams/${team.id}`}
                                className="font-bold text-ink hover:text-flash-deep transition-colors"
                              >
                                {team.name}
                              </Link>
                              <p className="text-[10px] text-muted line-clamp-1">{team.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-ink-soft">{team.department}</td>
                        <td className="py-3.5 px-4">
                          {lead ? (
                            <div className="flex items-center gap-2">
                              <MemberAvatar user={lead} size="xs" />
                              <span className="font-medium text-ink">{lead.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-ink">{team.memberIds.length} members</td>
                        <td className="py-3.5 px-4 font-bold text-ink">{team.projectIds?.length || 0}</td>
                        <td className="py-3.5 px-4 font-bold text-ink">{teamTasks.length}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setTeamToEdit(team);
                                setCreateTeamOpen(true);
                              }}
                              className="p-1 rounded text-muted hover:text-ink hover:bg-mist transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmTeam(team)}
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

      {/* Create / Edit Team Dialog */}
      <CreateTeamDialog
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        teamToEdit={teamToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={!!deleteConfirmTeam}
        onClose={() => setDeleteConfirmTeam(null)}
        size="xs"
      >
        {deleteConfirmTeam && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Delete Team</h3>
            <p className="text-muted leading-relaxed">
              Are you sure you want to delete <strong>{deleteConfirmTeam.name}</strong>? Member assignments to this team will be unlinked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setDeleteConfirmTeam(null)}
                className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmTeam)}
                className="px-4 py-1.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
