'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, ArrowLeft, Check, AlertCircle, Plus,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';

const TEAM_COLORS = [
  '#00c2a8', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#06b6d4',
];

const DEPARTMENTS = [
  'Engineering',
  'Product Design',
  'Quality Assurance',
  'Operations',
  'Marketing & Growth',
  'Legal & Compliance',
];

export default function CreateTeamPage() {
  const router = useRouter();
  const { users, projects, addTeam, teams } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [category, setCategory] = useState('Core Product Development');
  const [leadId, setLeadId] = useState(users[0]?.id || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    users[0] ? [users[0].id] : []
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [goalsText, setGoalsText] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleMember = (uid: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
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
    if (!trimmedName) {
      setError('Please provide a team name');
      return;
    }

    const isDuplicate = teams.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError(`A team named "${trimmedName}" already exists`);
      return;
    }

    const goals = goalsText
      .split('\n')
      .map(g => g.trim())
      .filter(Boolean);

    const finalMemberIds = Array.from(new Set([leadId, ...selectedMemberIds]));

    addTeam({
      name: trimmedName,
      description: description.trim(),
      department,
      category,
      leadId,
      memberIds: finalMemberIds,
      projectIds: selectedProjectIds,
      color,
      goals,
      status,
    });

    notify(`Team "${trimmedName}" created`);
    setSuccess(true);
    setTimeout(() => {
      router.push('/teams/directory');
    }, 900);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb / Back button */}
        <Link
          href="/teams/directory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams Directory</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Create a New Team
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Group developers, designers, and managers into dedicated squads with clear ownership and project alignments.
          </p>
        </div>

        {/* Main Form Card */}
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
                <span>Team created successfully! Redirecting to directory...</span>
              </div>
            )}

            {/* Team Name & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Team Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Identity & E-Signature Core"
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-ink mb-1">Team Mission & Purpose</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What responsibilities, microservices, and product areas does this team own?"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Team Lead & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Designated Team Lead</label>
                <select
                  value={leadId}
                  onChange={e => {
                    setLeadId(e.target.value);
                    if (!selectedMemberIds.includes(e.target.value)) {
                      setSelectedMemberIds(prev => [...prev, e.target.value]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title || u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Brand Theme Color</label>
                <div className="flex items-center gap-2 pt-1">
                  {TEAM_COLORS.map(c => (
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

            {/* Member Selection */}
            <div>
              <label className="block font-semibold text-ink mb-1.5">
                Assign Members ({selectedMemberIds.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
                {users.map(u => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  const isLead = u.id === leadId;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMember(u.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-md text-left transition-colors border ${
                        isSelected
                          ? 'bg-flash/10 border-flash/30 text-ink'
                          : 'bg-paper-elevated border-line hover:bg-mist/30 text-muted'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate text-ink">
                          {u.name} {isLead && <span className="text-[10px] text-flash-deep font-semibold">(Lead)</span>}
                        </p>
                        <p className="text-[10px] text-muted truncate">{u.title || u.department}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-flash-deep shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Assignments */}
            <div>
              <label className="block font-semibold text-ink mb-1.5">
                Connected Projects ({selectedProjectIds.length})
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-paper rounded-lg border border-line">
                {projects.map(p => {
                  const isSelected = selectedProjectIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProject(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
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

            {/* Goals */}
            <div>
              <label className="block font-semibold text-ink mb-1">
                Team Objectives & Milestones (one per line)
              </label>
              <textarea
                rows={3}
                value={goalsText}
                onChange={e => setGoalsText(e.target.value)}
                placeholder="1. Migrate core signature verification to WebAssembly&#10;2. Implement zero-knowledge audit trail"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <Link
                href="/teams/directory"
                className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
