'use client';

import React, { useState } from 'react';
import { X, Users, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Team } from '@/types';
import { ClientPortal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamToEdit?: Team | null;
  onSuccess?: (team: Team) => void;
}

const TEAM_COLORS = [
  '#00c2a8', // Teal
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
];

const DEPARTMENTS = [
  'Engineering',
  'Product Design',
  'Quality Assurance',
  'Operations',
  'Marketing & Growth',
  'Legal & Compliance',
];

export function CreateTeamDialog({
  open,
  onOpenChange,
  teamToEdit,
  onSuccess,
}: CreateTeamDialogProps) {
  const { users, projects, addTeam, updateTeam, teams } = useApp();

  const [name, setName] = useState(teamToEdit?.name || '');
  const [description, setDescription] = useState(teamToEdit?.description || '');
  const [department, setDepartment] = useState(teamToEdit?.department || 'Engineering');
  const [category, setCategory] = useState(teamToEdit?.category || 'Core Product');
  const [leadId, setLeadId] = useState(teamToEdit?.leadId || users[0]?.id || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    teamToEdit?.memberIds || (users[0] ? [users[0].id] : [])
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    teamToEdit?.projectIds || []
  );
  const [color, setColor] = useState(teamToEdit?.color || TEAM_COLORS[0]);
  const [goalsText, setGoalsText] = useState((teamToEdit?.goals || []).join('\n'));
  const [status, setStatus] = useState<'active' | 'archived'>(teamToEdit?.status || 'active');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

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

    // Check duplicate team name
    const isDuplicate = teams.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== teamToEdit?.id
    );
    if (isDuplicate) {
      setError(`A team named "${trimmedName}" already exists`);
      return;
    }

    const goals = goalsText
      .split('\n')
      .map(g => g.trim())
      .filter(Boolean);

    // Make sure lead is in memberIds
    const finalMemberIds = Array.from(new Set([leadId, ...selectedMemberIds]));

    if (teamToEdit) {
      updateTeam(teamToEdit.id, {
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
      setSuccessMsg('Team updated successfully!');
      notify(`Changes to team "${trimmedName}" saved`);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...teamToEdit, name: trimmedName });
      }, 700);
    } else {
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
      setSuccessMsg('Team created successfully!');
      notify(`Team "${trimmedName}" created`);
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
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
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {teamToEdit ? 'Edit Team' : 'Create New Team'}
              </h2>
              <p className="text-xs text-muted">
                Define team responsibilities, assign leads, members, and connected projects.
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
                placeholder="e.g. Core Platform Engineering"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash focus:ring-1 focus:ring-flash transition-all text-xs"
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
            <label className="block font-semibold text-ink mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this team own and deliver?"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Team Lead & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">Team Lead</label>
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
              <label className="block font-semibold text-ink mb-1">Theme Color</label>
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
              Team Members ({selectedMemberIds.length} selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-paper rounded-lg border border-line">
              {users.map(u => {
                const isSelected = selectedMemberIds.includes(u.id);
                const isLead = u.id === leadId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-md text-left transition-colors border ${
                      isSelected
                        ? 'bg-flash/10 border-flash/30 text-ink'
                        : 'bg-paper-elevated border-line/50 hover:bg-mist/30 text-muted'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                    <div className="min-w-0 flex-1 truncate">
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

          {/* Related Projects */}
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

          {/* Team Goals */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Quarterly Objectives / Goals (one per line)
            </label>
            <textarea
              rows={2}
              value={goalsText}
              onChange={e => setGoalsText(e.target.value)}
              placeholder="e.g. Complete e-signature security audit&#10;Ship mobile responsive client portal"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-ink">Team Status:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="team_status"
                value="active"
                checked={status === 'active'}
                onChange={() => setStatus('active')}
                className="text-flash focus:ring-flash"
              />
              <span className="text-ink">Active</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="team_status"
                value="archived"
                checked={status === 'archived'}
                onChange={() => setStatus('archived')}
                className="text-flash focus:ring-flash"
              />
              <span className="text-muted">Archived</span>
            </label>
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
              {teamToEdit ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
