'use client';

import React, { useState } from 'react';
import { X, UserCog, Check } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import type { User, DemoRole, AvailabilityStatus } from '@/types';
import { ClientPortal } from '@/components/shared/modal';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { notify } from '@/components/shared/toaster';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: User;
}

/**
 * The PM screens still read a legacy persona (User.role); keep it in step with the
 * organisation role (users.role_id) chosen here.
 */
const LEGACY_ROLE_FOR: Record<string, DemoRole> = {
  'role-owner': 'ceo',
  'role-pm': 'project_manager',
  'role-team-lead': 'engineering_lead',
  'role-dev': 'developer',
  'role-qa': 'qa_tester',
};

/**
 * The Owner edits what belongs to the membership (tables.txt `users`): role_id, title,
 * availability, weekly_capacity, and project_member rows. Name and email are the person's
 * own login and profile, so they are shown but not editable here. People join only
 * through an invitation, so there is no "add member" form.
 */
export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const { projects, updateMember } = useApp();
  const { roles, demoAccounts, updateMemberRoleAndProjects } = useDemoAuth();

  // Start from the member's current role, not a fixed default
  const currentRoleId =
    demoAccounts.find(a => a.id === member.id)?.roleId ??
    Object.keys(LEGACY_ROLE_FOR).find(id => LEGACY_ROLE_FOR[id] === member.role) ??
    roles[0]?.id ??
    '';

  const [roleId, setRoleId] = useState(currentRoleId);
  const [title, setTitle] = useState(member.title || '');
  const [availability, setAvailability] = useState<AvailabilityStatus>(member.availability || 'available');
  const [weeklyCapacity, setWeeklyCapacity] = useState(member.weeklyCapacity || 40);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(member.projectIds || []);

  if (!open) return null;

  const toggleProject = (pid: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(member.id, {
      title: title.trim(),
      role: LEGACY_ROLE_FOR[roleId] ?? 'developer',
      availability,
      weeklyCapacity,
      projectIds: selectedProjectIds,
    });
    updateMemberRoleAndProjects(member.id, roleId, selectedProjectIds);
    notify(`Changes to ${member.name} saved`);
    onOpenChange(false);
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-flash-deep">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Edit Member</h2>
              <p className="text-xs text-muted">
                Role, job title, availability, capacity and project assignments.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Who (read-only: name and email belong to the person's own profile) */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-paper border border-line">
            <MemberAvatar user={member} size="sm" />
            <div className="min-w-0">
              <div className="font-semibold text-ink truncate">{member.name}</div>
              <div className="text-muted truncate">{member.email}</div>
            </div>
          </div>

          {/* Role & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Role</label>
              <select
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.projectAccess === 'management' ? 'All Projects' : 'Assigned Only'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lead Systems Architect"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
              <p className="mt-1 text-[11px] text-muted">A label only; access comes from the role.</p>
            </div>
          </div>

          {/* Availability & Weekly Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Availability</label>
              <select
                value={availability}
                onChange={e => setAvailability(e.target.value as AvailabilityStatus)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                <option value="available">Available</option>
                <option value="busy">Busy / Deep Work</option>
                <option value="focus_time">Focus Time</option>
                <option value="out_of_office">Out of Office</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">
                Weekly Capacity (Hours): <strong className="text-flash-deep">{weeklyCapacity}h</strong>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={weeklyCapacity}
                onChange={e => setWeeklyCapacity(Number(e.target.value))}
                className="w-full accent-flash cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Project Assignments (project_member) */}
          <div>
            <label className="block font-semibold text-ink mb-1.5">
              Assigned Projects ({selectedProjectIds.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
              {projects.map(p => {
                const isSelected = selectedProjectIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProject(p.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-ink text-white border-ink'
                        : 'bg-paper-elevated text-muted border-line hover:text-ink'
                    }`}
                  >
                    {isSelected && <Check className="inline w-3 h-3 mr-1 -mt-0.5" />}
                    {p.name}
                  </button>
                );
              })}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
