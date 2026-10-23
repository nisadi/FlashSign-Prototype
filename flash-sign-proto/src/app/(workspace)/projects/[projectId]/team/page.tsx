'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import { Modal } from '@/components/shared/modal';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  CheckSquare,
  Search,
  Crown,
  Briefcase,
} from 'lucide-react';
import type { User } from '@/types';

export default function ProjectTeamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, users, tasks, updateProject, openTaskDrawer } = useApp();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserToView, setSelectedUserToView] = useState<User | null>(null);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const currentMembers = users.filter((u) => project.memberIds.includes(u.id));
  const availableUsers = users.filter((u) => !project.memberIds.includes(u.id));

  const filteredMembers = currentMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = (userId: string) => {
    updateProject(projectId, {
      memberIds: [...project.memberIds, userId],
    });
    setShowAddModal(false);
  };

  const handleRemoveMember = (userId: string) => {
    if (project.ownerId === userId) {
      alert('Cannot remove the project owner. Assign a new owner first.');
      return;
    }
    updateProject(projectId, {
      memberIds: project.memberIds.filter((id) => id !== userId),
    });
  };

  const handleChangeOwner = (userId: string) => {
    updateProject(projectId, {
      ownerId: userId,
    });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="team" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-flash-deep" /> Project Team & Workload
            </h1>
            <p className="text-xs text-muted">
              {currentMembers.length} team members collaborating on {project.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members…"
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-paper-elevated border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setShowAddModal(true)}
            >
              Add Member
            </Button>
          </div>
        </div>

        {/* Add Member Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          size="sm"
        >
          <div className="p-6 space-y-4">
            <h2 className="text-base font-bold text-ink">Add Member from Directory</h2>
            <p className="text-xs text-muted">
              Select an organization member to join {project.name}.
            </p>

            {availableUsers.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">
                All organization members are already on this project!
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {availableUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl border border-line bg-paper flex items-center justify-between hover:border-flash/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={u} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{u.name}</p>
                        <p className="text-[10px] text-muted truncate">{u.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleAddMember(u.id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isOwner = member.id === project.ownerId;
            const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
            const doneTasks = memberTasks.filter((t) => t.status === 'done');
            const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress');
            const workloadPct = Math.min(100, memberTasks.length * 20); // 5 tasks = 100% capacity

            return (
              <Card key={member.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={member} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-ink truncate">{member.name}</h3>
                          {isOwner && (
                            <span
                              className="text-amber-500 shrink-0"
                              title="Project Owner"
                            >
                              <Crown className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-muted/60" /> {member.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => handleChangeOwner(member.id)}
                          className="p-1 text-muted hover:text-amber-500 rounded transition-colors text-[10px]"
                          title="Make Owner"
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-muted hover:text-danger rounded transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted flex items-center gap-1.5 mb-3 font-mono">
                    <Mail className="w-3 h-3 text-muted/60" /> {member.email}
                  </p>

                  {/* Workload Indicator */}
                  <div className="space-y-1.5 pt-2 border-t border-line text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted">Workload Capacity</span>
                      <span className="font-mono font-medium text-ink">
                        {memberTasks.length} tasks assigned
                      </span>
                    </div>
                    <ProgressBar
                      value={workloadPct}
                      color={workloadPct > 80 ? 'var(--danger)' : 'var(--flash)'}
                      className="h-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{doneTasks.length} done</span>
                      <span>{inProgressTasks.length} in progress</span>
                    </div>
                  </div>
                </div>

                {/* View tasks button */}
                <div className="pt-2 border-t border-line/60">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedUserToView(
                        selectedUserToView?.id === member.id ? null : member
                      )
                    }
                    className="w-full text-center py-1.5 rounded-lg bg-paper hover:bg-mist text-xs font-medium text-ink transition-colors"
                  >
                    {selectedUserToView?.id === member.id
                      ? 'Hide Assigned Tasks'
                      : `View Assigned Tasks (${memberTasks.length})`}
                  </button>

                  {selectedUserToView?.id === member.id && (
                    <div className="mt-3 space-y-1.5 animate-fade-in max-h-48 overflow-y-auto">
                      {memberTasks.length === 0 ? (
                        <p className="text-[11px] text-muted text-center py-2">
                          No tasks assigned to this member.
                        </p>
                      ) : (
                        memberTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => openTaskDrawer(t.id)}
                            className="p-2 rounded bg-paper-elevated border border-line text-xs flex items-center justify-between cursor-pointer hover:border-flash/40"
                          >
                            <span className="truncate pr-1 text-ink">{t.title}</span>
                            <span className="text-[10px] font-mono text-muted shrink-0">
                              {t.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
