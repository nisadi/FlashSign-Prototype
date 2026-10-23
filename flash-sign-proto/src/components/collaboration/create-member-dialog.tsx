'use client';

import React, { useState } from 'react';
import { X, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { User, DemoRole, AvailabilityStatus } from '@/types';
import { FEATURES } from '@/lib/features';

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberToEdit?: User | null;
  onSuccess?: (user: User) => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Product Design',
  'Quality Assurance',
  'Operations',
  'Marketing & Growth',
  'Legal & Compliance',
];

const TIMEZONES = [
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'America/Chicago (CST)',
  'Europe/London (GMT)',
  'Europe/Berlin (CET)',
  'Asia/Singapore (SGT)',
  'Asia/Tokyo (JST)',
];

const ROLES: { id: DemoRole; label: string }[] = [
  { id: 'developer', label: 'Developer' },
  { id: 'engineering_lead', label: 'Engineering Lead' },
  { id: 'product_owner', label: 'Product Owner' },
  { id: 'project_manager', label: 'Project Manager' },
  { id: 'qa_tester', label: 'QA Tester' },
  { id: 'document_manager', label: 'Document Manager' },
  { id: 'org_admin', label: 'Organization Admin' },
  { id: 'client', label: 'Client Representative' },
];

const MEMBER_COLORS = [
  '#00c2a8', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b'
];

export function CreateMemberDialog({
  open,
  onOpenChange,
  memberToEdit,
  onSuccess,
}: CreateMemberDialogProps) {
  const { teams, projects, addMember, updateMember, users } = useApp();

  const [name, setName] = useState(memberToEdit?.name || '');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [title, setTitle] = useState(memberToEdit?.title || 'Senior Engineer');
  const [department, setDepartment] = useState(memberToEdit?.department || 'Engineering');
  const [role, setRole] = useState<DemoRole>(memberToEdit?.role || 'developer');
  const [color, setColor] = useState(memberToEdit?.color || MEMBER_COLORS[0]);
  const [timeZone, setTimeZone] = useState(memberToEdit?.timeZone || TIMEZONES[0]);
  const [workingHours, setWorkingHours] = useState(memberToEdit?.workingHours || '09:00 - 17:00 EST');
  const [availability, setAvailability] = useState<AvailabilityStatus>(memberToEdit?.availability || 'available');
  const [weeklyCapacity, setWeeklyCapacity] = useState(memberToEdit?.weeklyCapacity || 40);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(memberToEdit?.teamIds || []);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(memberToEdit?.projectIds || []);
  const [skillsInput, setSkillsInput] = useState((memberToEdit?.skills || ['React', 'TypeScript']).join(', '));

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const toggleTeam = (tid: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(tid) ? prev.filter(id => id !== tid) : [...prev, tid]
    );
  };

  const toggleProject = (pid: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please provide a full name');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please provide a valid email address');
      return;
    }

    const isDuplicateEmail = users.some(
      u => u.email.toLowerCase() === trimmedEmail.toLowerCase() && u.id !== memberToEdit?.id
    );
    if (isDuplicateEmail) {
      setError(`A team member with email "${trimmedEmail}" already exists`);
      return;
    }

    const skills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const initials = trimmedName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TM';

    if (memberToEdit) {
      updateMember(memberToEdit.id, {
        name: trimmedName,
        email: trimmedEmail,
        title: title.trim(),
        department,
        role,
        color,
        timeZone,
        workingHours,
        availability,
        weeklyCapacity,
        teamIds: selectedTeamIds,
        projectIds: selectedProjectIds,
        skills,
      });
      setSuccessMsg('Member profile updated!');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...memberToEdit, name: trimmedName, email: trimmedEmail });
      }, 700);
    } else {
      addMember({
        name: trimmedName,
        email: trimmedEmail,
        initials,
        title: title.trim(),
        department,
        role,
        color,
        timeZone,
        workingHours,
        availability,
        weeklyCapacity,
        teamIds: selectedTeamIds,
        projectIds: selectedProjectIds,
        skills,
      });
      setSuccessMsg('Team member added successfully!');
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-paper-elevated border border-line rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {memberToEdit ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <p className="text-xs text-muted">
                Create demonstration profile with role, working hours, capacity, and team assignments.
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

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="elena.rostova@flashsign.io"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>
          </div>

          {/* Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lead Systems Architect"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role & Avatar Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">System Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as DemoRole)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Profile Color</label>
              <div className="flex items-center gap-2 pt-1">
                {MEMBER_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time Zone & Working Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Time Zone</label>
              <select
                value={timeZone}
                onChange={e => setTimeZone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Working Hours</label>
              <input
                type="text"
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value)}
                placeholder="09:00 - 17:00 EST"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>
          </div>

          {/* Availability & Weekly Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Initial Availability</label>
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

          {/* Team Assignments */}
          {FEATURES.teams && (
          <div>
            <label className="block font-semibold text-ink mb-1.5">
              Assigned Teams ({selectedTeamIds.length})
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-paper rounded-lg border border-line">
              {teams.map(t => {
                const isSelected = selectedTeamIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeam(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-flash/15 border-flash/40 text-ink font-semibold'
                        : 'bg-paper-elevated border-line text-muted hover:text-ink'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                    {isSelected && <Check className="w-3 h-3 text-flash-deep ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Project Assignments */}
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
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              placeholder="React, TypeScript, GraphQL, Node.js"
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
              {memberToEdit ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
