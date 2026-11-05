'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  CheckSquare,
  Users,
  Check,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import {
  type CustomRole,
  type DashboardType,
  type ProjectAccess,
  type TeamAccess,
} from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface RoleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Omit<CustomRole, 'id' | 'createdAt' | 'isSystem'>) => void;
  initialRole?: CustomRole | null;
}

export function RoleEditorModal({
  isOpen,
  onClose,
  onSave,
  initialRole,
}: RoleEditorModalProps) {
  const isEditing = Boolean(initialRole);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Dashboard state
  const [selectedDashboardType, setSelectedDashboardType] = useState<DashboardType>('admin');
  const [alsoMyStatus, setAlsoMyStatus] = useState<boolean>(true);

  // Project access state
  const [projectAccess, setProjectAccess] = useState<ProjectAccess>('management');

  // My Tasks access
  const [myTasksAccess, setMyTasksAccess] = useState<boolean>(true);

  // Team access
  const [teamAccess, setTeamAccess] = useState<TeamAccess>('management');

  // Validation
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole) {
      setName(initialRole.name);
      setDescription(initialRole.description || '');

      if (initialRole.dashboardAccess.adminDashboard) {
        setSelectedDashboardType('admin');
        setAlsoMyStatus(initialRole.dashboardAccess.myStatus);
      } else {
        setSelectedDashboardType('my-status');
        setAlsoMyStatus(true);
      }

      setProjectAccess(initialRole.projectAccess);
      setMyTasksAccess(initialRole.myTasksAccess);
      setTeamAccess(initialRole.teamAccess);
    } else {
      setName('');
      setDescription('');
      setSelectedDashboardType('admin');
      setAlsoMyStatus(true);
      setProjectAccess('management');
      setMyTasksAccess(true);
      setTeamAccess('management');
    }
    setError(null);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required.');
      return;
    }

    const adminDashboard = selectedDashboardType === 'admin';
    const myStatus = selectedDashboardType === 'admin' ? alsoMyStatus : true;
    const defaultDashboard: DashboardType =
      selectedDashboardType === 'admin' ? 'admin' : 'my-status';

    onSave({
      name: name.trim(),
      description: description.trim(),
      dashboardAccess: {
        defaultDashboard,
        adminDashboard,
        myStatus,
      },
      projectAccess,
      myTasksAccess,
      teamAccess,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-paper-elevated border border-line rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fade-in space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line sticky -top-6 bg-paper-elevated z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                {isEditing ? `Edit Role: ${initialRole?.name}` : 'Create Customized Role'}
              </h2>
              <p className="text-xs text-muted">
                Configure customized permissions, dashboards, and module access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink text-sm p-1.5 rounded-lg hover:bg-mist transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* 5.1 Basic Role Information */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span>1. Basic Role Information</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Role Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Delivery Lead, External QA, Designer..."
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  Role Description <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the scope and responsibilities of contributors assigned to this role..."
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash text-xs"
                />
              </div>
            </div>
          </section>

          {/* 5.2 Dashboard Access */}
          <section className="space-y-3 pt-3 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                2. Dashboard Access
              </h3>
              <span className="text-[11px] text-flash-deep font-semibold">Dual Dashboard Option</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Admin Dashboard */}
              <div
                onClick={() => setSelectedDashboardType('admin')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  selectedDashboardType === 'admin'
                    ? 'bg-flash/10 border-flash ring-1 ring-flash'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <LayoutDashboard className="w-4 h-4 text-flash-deep" />
                    <span>Option A: Admin Dashboard</span>
                  </div>
                  {selectedDashboardType === 'admin' && (
                    <Check className="w-4 h-4 text-flash-deep stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  User can access the comprehensive executive and operations Admin Dashboard.
                </p>
              </div>

              {/* Option B: My Status */}
              <div
                onClick={() => setSelectedDashboardType('my-status')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  selectedDashboardType === 'my-status'
                    ? 'bg-flash/10 border-flash ring-1 ring-flash'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Option B: My Status</span>
                  </div>
                  {selectedDashboardType === 'my-status' && (
                    <Check className="w-4 h-4 text-flash-deep stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  My Status becomes their only dashboard. They cannot access Admin Dashboard.
                </p>
              </div>
            </div>

            {/* Sub-option if Admin Dashboard is selected */}
            {selectedDashboardType === 'admin' && (
              <div className="p-3.5 rounded-xl bg-paper border border-line/80 space-y-2.5 animate-fade-in">
                <p className="font-semibold text-ink text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-flash-deep" />
                  <span>Does this user also need access to My Status?</span>
                </p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                    <input
                      type="radio"
                      name="alsoMyStatus"
                      checked={alsoMyStatus === true}
                      onChange={() => setAlsoMyStatus(true)}
                      className="text-flash-deep focus:ring-flash"
                    />
                    <span>Yes (Access both Admin Dashboard + My Status via Switcher)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                    <input
                      type="radio"
                      name="alsoMyStatus"
                      checked={alsoMyStatus === false}
                      onChange={() => setAlsoMyStatus(false)}
                      className="text-flash-deep focus:ring-flash"
                    />
                    <span>No (Admin Dashboard only)</span>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* 5.3 Project Access */}
          <section className="space-y-3 pt-3 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              3. Project Access
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Management Access */}
              <div
                onClick={() => setProjectAccess('management')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  projectAccess === 'management'
                    ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    <span>Option A: Management Access</span>
                  </div>
                  {projectAccess === 'management' && (
                    <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Full CRUD access to all organization projects (create, edit, delete, milestones, epics, tasks, subtasks, project members, reports, and Settings Danger Zone).
                </p>
              </div>

              {/* Option B: User Access */}
              <div
                onClick={() => setProjectAccess('user')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  projectAccess === 'user'
                    ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Option B: User Access</span>
                  </div>
                  {projectAccess === 'user' && (
                    <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Can only view and work inside explicitly assigned projects. Cannot create, edit, or delete projects.
                </p>
              </div>
            </div>

            {/* Restrictions Box when User Access is chosen */}
            {projectAccess === 'user' && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5 animate-fade-in">
                <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Enforced Restrictions for User Access:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1 pl-1">
                  <li>Users will only see the Team Work section for their assigned projects.</li>
                  <li>Users cannot see or access the Reports section (blocked via UI & URL).</li>
                  <li>Users cannot see or access the Danger Zone inside project Settings.</li>
                  <li>Unassigned projects are hidden and inaccessible.</li>
                </ul>
              </div>
            )}
          </section>

          {/* 5.4 My Tasks Access */}
          <section className="space-y-3 pt-3 border-t border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                4. My Tasks Access
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-paper border border-line space-y-2">
              <p className="font-semibold text-ink text-xs flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-flash-deep" />
                <span>Does this role need access to My Tasks?</span>
              </p>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                  <input
                    type="radio"
                    name="myTasksAccess"
                    checked={myTasksAccess === true}
                    onChange={() => setMyTasksAccess(true)}
                    className="text-flash-deep focus:ring-flash"
                  />
                  <span>Yes (Display My Tasks in sidebar and allow route access)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                  <input
                    type="radio"
                    name="myTasksAccess"
                    checked={myTasksAccess === false}
                    onChange={() => setMyTasksAccess(false)}
                    className="text-flash-deep focus:ring-flash"
                  />
                  <span>No (Hide My Tasks from sidebar and block route access)</span>
                </label>
              </div>
            </div>
          </section>

          {/* 5.5 & 5.6 Planner & Agreements Access (Universal) */}
          <section className="p-3 rounded-xl bg-mist/50 border border-line/60 text-[11px] text-muted space-y-1">
            <p className="font-semibold text-ink">Global Workspace Modules:</p>
            <p>
              • <strong>Planner</strong> and <strong>Agreements</strong> are accessible to all organization members according to FlashSign security baseline.
            </p>
          </section>

          {/* Section 6: Team Section Permissions */}
          <section className="space-y-3 pt-3 border-t border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              5. Team Access Role
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Management Role */}
              <div
                onClick={() => setTeamAccess('management')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  teamAccess === 'management'
                    ? 'bg-purple-50/60 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Option A: Management Role</span>
                  </div>
                  {teamAccess === 'management' && (
                    <Check className="w-4 h-4 text-purple-600 stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Full CRUD access to Team: can view Team Analytics, create/edit/delete members, view roles, and create/edit/delete custom roles.
                </p>
              </div>

              {/* Option B: Member Role */}
              <div
                onClick={() => setTeamAccess('member')}
                className={cn(
                  'p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 select-none',
                  teamAccess === 'member'
                    ? 'bg-purple-50/60 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-paper hover:bg-mist/40 border-line'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span>Option B: Member Role</span>
                  </div>
                  {teamAccess === 'member' && (
                    <Check className="w-4 h-4 text-purple-600 stroke-[3]" />
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Can view organization members directory. Restricted from member CRUD, Team Analytics, and Role View / Role Management.
                </p>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line sticky -bottom-6 bg-paper-elevated py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink font-bold transition-all shadow-xs"
            >
              {isEditing ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

