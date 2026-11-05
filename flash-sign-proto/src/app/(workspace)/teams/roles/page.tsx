'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  CheckSquare,
  Users,
  Lock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { AccessDenied } from '@/components/shared/access-denied';
import { RoleEditorModal } from '@/components/roles/role-editor-modal';
import { canManageRoles, type CustomRole } from '@/lib/rbac';
import { cn } from '@/lib/utils';

export default function RolesManagementPage() {
  const {
    currentRbacUser,
    roles,
    demoAccounts,
    createRole,
    updateRole,
    deleteRole,
  } = useDemoAuth();

  // Guard: Must have Team Management role or be Owner
  if (!canManageRoles(currentRbacUser)) {
    return (
      <AccessDenied
        title="Role View Restricted"
        message="Access to Role View and customized permission management is restricted to users with Team Management permissions or the Organization Owner."
        requiredRole="Team Management"
        backHref="/teams/members"
      />
    );
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deleteConfirmRoleId, setDeleteConfirmRoleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (role: CustomRole) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleSaveRole = (
    roleData: Omit<CustomRole, 'id' | 'createdAt' | 'isSystem'>
  ) => {
    if (editingRole) {
      updateRole(editingRole.id, roleData);
      showToast(`Role "${roleData.name}" updated successfully. Affected users updated immediately!`);
    } else {
      createRole({ ...roleData, isSystem: false });
      showToast(`New customized role "${roleData.name}" created!`);
    }
  };

  const handleDeleteRole = (id: string) => {
    const res = deleteRole(id);
    if (!res.success) {
      alert(res.error);
      return;
    }
    setDeleteConfirmRoleId(null);
    showToast('Role removed from workspace.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
              Governance & RBAC
            </span>
            <span className="text-xs text-muted">Organization Permission Roles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
            Customized Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Create customized roles, configure dashboard selection, project scope, My Tasks, and team authority.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/teams/members"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-paper-elevated border border-line text-ink hover:bg-mist transition-colors shadow-xs flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-flash-deep" />
            <span>Members Directory</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const assignedCount = demoAccounts.filter((a) => a.roleId === role.id).length;

          return (
            <div
              key={role.id}
              className="p-5 rounded-2xl border border-line bg-paper-elevated shadow-xs flex flex-col justify-between gap-4 hover:border-muted transition-all relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center font-bold shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-sm leading-tight">{role.name}</h3>
                      <span className="text-[10px] text-muted font-mono">{role.id}</span>
                    </div>
                  </div>

                  {role.isSystem ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      System Standard
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      Customized Role
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {role.description || 'No description provided.'}
                </p>

                {/* Permission Attributes */}
                <div className="space-y-2 pt-2 border-t border-line/60 text-[11px]">
                  {/* Dashboard Access */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <LayoutDashboard className="w-3.5 h-3.5 text-muted" /> Dashboard:
                    </span>
                    <span className="font-semibold text-ink">
                      {role.dashboardAccess.adminDashboard && role.dashboardAccess.myStatus
                        ? 'Admin + My Status'
                        : role.dashboardAccess.adminDashboard
                        ? 'Admin Dashboard'
                        : 'My Status Only'}
                    </span>
                  </div>

                  {/* Project Access */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-muted" /> Project Access:
                    </span>
                    <span
                      className={cn(
                        'font-bold px-1.5 py-0.5 rounded text-[10px]',
                        role.projectAccess === 'management'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-teal-50 text-teal-700'
                      )}
                    >
                      {role.projectAccess === 'management'
                        ? 'Management (All)'
                        : 'User Access (Assigned)'}
                    </span>
                  </div>

                  {/* My Tasks Access */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-muted" /> My Tasks:
                    </span>
                    <span
                      className={cn(
                        'font-bold',
                        role.myTasksAccess ? 'text-emerald-700' : 'text-muted'
                      )}
                    >
                      {role.myTasksAccess ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Team Access */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-muted" /> Team Access:
                    </span>
                    <span className="font-semibold text-ink">
                      {role.teamAccess === 'management' ? 'Management Role' : 'Member Role'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                <span className="text-muted font-medium text-[11px]">
                  <strong>{assignedCount}</strong> demo user{assignedCount === 1 ? '' : 's'} assigned
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 rounded-lg border border-line bg-paper hover:bg-mist text-ink transition-colors cursor-pointer"
                    title="Edit role permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmRoleId(role.id)}
                      className="p-1.5 rounded-lg border border-line bg-paper hover:bg-rose-50 text-muted hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete customized role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveRole}
        initialRole={editingRole}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmRoleId && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-danger/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Confirm Role Deletion</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to delete this custom role? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setDeleteConfirmRoleId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-line text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRole(deleteConfirmRoleId)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-danger text-white hover:bg-danger/90 transition-all shadow-xs"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
