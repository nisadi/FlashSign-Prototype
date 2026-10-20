'use client';

import React from 'react';
import type { DemoWorkspace, DemoUser } from '@/types/demo-auth';
import { Users, FolderKanban, Check, ArrowRight, Shield } from 'lucide-react';

interface WorkspaceCardProps {
  workspace: DemoWorkspace;
  isSelected: boolean;
  currentUser: DemoUser;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function WorkspaceCard({
  workspace,
  isSelected,
  currentUser,
  onSelect,
  onOpen,
}: WorkspaceCardProps) {
  const accent = workspace.accentColor || '#00c2a8';

  return (
    <div
      onClick={() => onSelect(workspace.id)}
      className={`relative p-5 rounded-xl border bg-[var(--paper-elevated)] transition-all duration-200 cursor-pointer text-left ${
        isSelected
          ? 'border-[var(--flash-deep)] ring-2 ring-[var(--flash)]/30 shadow-md'
          : 'border-[var(--line)] hover:border-[var(--muted)] hover:shadow-sm'
      }`}
    >
      {/* Selection pill */}
      {isSelected && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold text-[var(--flash-deep)] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Selected</span>
        </div>
      )}

      {/* Header: Logo/Initials & Name */}
      <div className="flex items-start gap-3.5 pr-20">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
          style={{ backgroundColor: accent }}
        >
          {workspace.initials || workspace.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base text-[var(--ink)] truncate">
            {workspace.name}
          </h3>
          <p className="text-xs text-[var(--muted)] truncate mt-0.5">
            {workspace.description || `${workspace.type || 'Enterprise'} Workspace`}
          </p>
        </div>
      </div>

      {/* Meta Pills: Type & Size */}
      <div className="flex flex-wrap gap-1.5 my-3.5 pt-1">
        {workspace.type && (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--mist)]/60 text-[var(--ink-soft)] font-medium">
            {workspace.type}
          </span>
        )}
        {workspace.companySize && (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--paper)] text-[var(--muted)] border border-[var(--line)]">
            {workspace.companySize}
          </span>
        )}
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-[var(--flash-deep)] border border-emerald-100 flex items-center gap-1 font-medium">
          <Shield className="w-3 h-3" />
          Role: {currentUser.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>

      {/* Stats & Actions */}
      <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
            <strong className="text-[var(--ink)] font-medium">{workspace.memberCount}</strong> members
          </span>
          <span className="flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-[var(--muted)]" />
            <strong className="text-[var(--ink)] font-medium">{workspace.activeProjectCount}</strong> projects
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(workspace.id);
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            isSelected
              ? 'bg-[var(--flash-deep)] hover:bg-[var(--flash)] text-white shadow-xs'
              : 'bg-[var(--mist)] hover:bg-[var(--line)] text-[var(--ink)]'
          }`}
        >
          <span>Open workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
