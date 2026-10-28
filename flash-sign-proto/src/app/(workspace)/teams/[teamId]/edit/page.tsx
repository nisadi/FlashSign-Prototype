'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
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

export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;

  const { teams, users, projects, updateTeam } = useApp();
  const team = teams.find(t => t.id === teamId) || teams[0];

  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [department, setDepartment] = useState(team?.department || 'Engineering');
  const [leadId, setLeadId] = useState(team?.leadId || users[0]?.id || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(team?.memberIds || []);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(team?.projectIds || []);
  const [color, setColor] = useState(team?.color || TEAM_COLORS[0]);
  const [goalsText, setGoalsText] = useState((team?.goals || []).join('\n'));
  const [status, setStatus] = useState<'active' | 'archived'>(team?.status || 'active');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!team) {
    return (
      <div className="p-8 text-center text-xs">
        <p className="font-semibold text-ink">Team not found.</p>
        <Link href="/teams/directory" className="text-flash-deep underline mt-2 block">
          Return to Teams Directory
        </Link>
      </div>
    );
  }

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

    const goals = goalsText
      .split('\n')
      .map(g => g.trim())
      .filter(Boolean);

    const finalMembers = Array.from(new Set([leadId, ...selectedMemberIds]));

    updateTeam(team.id, {
      name: trimmedName,
      description: description.trim(),
      department,
      leadId,
      memberIds: finalMembers,
      projectIds: selectedProjectIds,
      color,
      goals,
      status,
    });

    notify(`Changes to team "${trimmedName}" saved`);
    setSuccess(true);
    setTimeout(() => {
      router.push(`/teams/${team.id}`);
    }, 700);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Link
          href={`/teams/${team.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {team.name}</span>
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Edit Team Details</h1>
          <p className="text-xs text-muted mt-1">Update squad configuration, leadership, and project links.</p>
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
                <span>Team updated! Redirecting...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Team Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Team Lead</label>
                <select
                  value={leadId}
                  onChange={e => setLeadId(e.target.value)}
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
                <label className="block font-semibold text-ink mb-1">Color Theme</label>
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

            <div>
              <label className="block font-semibold text-ink mb-1">Objectives & Deliverables</label>
              <textarea
                rows={3}
                value={goalsText}
                onChange={e => setGoalsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
              <Link
                href={`/teams/${team.id}`}
                className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
