'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { DemoRole, AvailabilityStatus } from '@/types';
import { FEATURES } from '@/lib/features';

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

export default function AddMemberPage() {
  const router = useRouter();
  const { teams, projects, users, addMember } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('Senior Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState<DemoRole>('developer');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [timeZone, setTimeZone] = useState(TIMEZONES[0]);
  const [workingHours, setWorkingHours] = useState('09:00 - 17:00 EST');
  const [availability, setAvailability] = useState<AvailabilityStatus>('available');
  const [weeklyCapacity, setWeeklyCapacity] = useState(40);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, GraphQL');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setError('Please provide a valid corporate email address');
      return;
    }

    const isDuplicate = users.some(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (isDuplicate) {
      setError(`A member with email "${trimmedEmail}" already exists`);
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

    setSuccess(true);
    setTimeout(() => {
      router.push('/teams/members');
    }, 800);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Link
          href="/teams/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Members Directory</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Add Team Member
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Provision a new member profile with role assignments, working hours, and initial capacity.
          </p>
        </div>

        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Member added successfully! Redirecting to directory...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Liam Henderson"
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
                  placeholder="liam.henderson@flashsign.io"
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Senior Full Stack Engineer"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Role</label>
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
                <label className="block font-semibold text-ink mb-1">Avatar Color Theme</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Availability Status</label>
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

            {/* Squads */}
            {FEATURES.teams && (
            <div>
              <label className="block font-semibold text-ink mb-1.5">
                Assign to Teams ({selectedTeamIds.length})
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-paper rounded-lg border border-line">
                {teams.map(t => {
                  const isSelected = selectedTeamIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTeam(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
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

            {/* Skills */}
            <div>
              <label className="block font-semibold text-ink mb-1">Technical Skills & Expertise</label>
              <input
                type="text"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
                placeholder="React, TypeScript, Node.js, WebAssembly, Security"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <Link
                href="/teams/members"
                className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
