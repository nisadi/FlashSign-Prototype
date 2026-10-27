'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { ProjectBoardsSettings } from '@/components/projects/project-boards-settings';
import { canCreateProject } from '@/lib/permissions';
import { Card, Button } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import {
  Settings,
  Save,
  Archive,
  Trash2,
  AlertTriangle,
  Check,
  Palette,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';
import type { ProjectStatus, ProjectHealth } from '@/types';

const ACCENT_COLORS = [
  '#00c2a8', // flash
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#0c1f22', // ink
];

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { projects, users, tasks, demoRole, updateProject, deleteProject, archiveProject } = useApp();

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [key, setKey] = useState(project.key);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [health, setHealth] = useState<ProjectHealth>(project.health);
  const [ownerId, setOwnerId] = useState(project.ownerId);
  const [startDate, setStartDate] = useState(project.startDate);
  const [dueDate, setDueDate] = useState(project.dueDate);
  const [accentColor, setAccentColor] = useState(project.accentColor || '#00c2a8');
  const [group, setGroup] = useState(project.group || 'Core Platform');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');

  const currentMembers = users.filter((u) => project.memberIds.includes(u.id));

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(projectId, {
      name,
      description,
      key,
      status,
      health,
      ownerId,
      startDate,
      dueDate,
      accentColor,
      group,
    });
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const handleArchive = () => {
    archiveProject(projectId);
  };

  const handleDelete = () => {
    if (deleteInputText !== project.key) return;
    deleteProject(projectId);
    router.push('/projects');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="settings" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Settings className="w-5 h-5 text-flash-deep" /> Project Settings
            </h1>
            <p className="text-xs text-muted">
              Configure parameters, team roles, and lifecycle options for {project.name}
            </p>
          </div>

          {showSavedFeedback && (
            <span className="text-xs text-flash-deep font-semibold flex items-center gap-1 bg-flash/10 px-3 py-1.5 rounded-xl border border-flash/30 animate-fade-in">
              <Check className="w-4 h-4" /> Changes saved successfully!
            </span>
          )}
        </div>

        {/* General Settings Form */}
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-ink border-b border-line pb-2">
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Project Key (Prefix)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Lifecycle Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                >
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Health State</label>
                <select
                  value={health}
                  onChange={(e) => setHealth(e.target.value as ProjectHealth)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                >
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project Group / Space</label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-flash-deep" /> Project Accent Theme
              </label>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`w-7 h-7 rounded-xl transition-transform ${
                      accentColor === c ? 'scale-110 ring-2 ring-ink ring-offset-2' : 'hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Dates & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-line">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project Owner</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Save Project Details
              </Button>
            </div>
          </Card>
        </form>

        <ProjectBoardsSettings
          project={project}
          tasks={tasks.filter((t) => t.projectId === project.id)}
          canEdit={canCreateProject(demoRole)}
        />

        {/* Danger Zone: Archive & Delete */}
        <Card className="p-6 border-danger/30 space-y-4">
          <div className="flex items-center gap-2 text-danger">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-sm font-bold">Danger Zone</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Actions in this section modify project state across all dashboard views. All actions remain
            local to your browser prototype.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-line">
            <div>
              <h3 className="text-xs font-bold text-ink">Archive this Project</h3>
              <p className="text-[11px] text-muted">
                Archived projects become read-only and are hidden from default project lists.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Archive}
              onClick={handleArchive}
              className="shrink-0 text-muted hover:text-ink"
            >
              {project.isArchived ? 'Unarchive Project' : 'Archive Project'}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-line">
            <div>
              <h3 className="text-xs font-bold text-danger">Delete this Project</h3>
              <p className="text-[11px] text-muted">
                Permanently removes this project, its sprint iterations, and associated mock tasks.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setConfirmDelete(true)}
              className="shrink-0"
            >
              Delete Project…
            </Button>
          </div>

          {confirmDelete && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-danger">
                Type the project key <span className="font-mono underline">{project.key}</span> to confirm deletion:
              </p>
              <input
                type="text"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                placeholder={project.key}
                className="w-full px-3 py-2 text-xs bg-paper border border-danger/40 rounded-xl outline-none focus:border-danger font-mono text-ink"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteInputText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deleteInputText !== project.key}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
