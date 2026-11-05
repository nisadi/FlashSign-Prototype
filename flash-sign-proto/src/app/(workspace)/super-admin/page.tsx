'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  Plus,
  MailPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  RotateCcw,
  Users,
  FolderKanban,
  Check,
  X,
  Send,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { AccessDenied } from '@/components/shared/access-denied';
import { type SuperAdminOrg, type SuperAdminOrgInvitation } from '@/lib/rbac';
import { cn } from '@/lib/utils';

export default function SuperAdminPage() {
  const {
    currentRbacUser,
    superAdminOrgs,
    superAdminOrgInvitations,
    createSuperAdminOrg,
    updateSuperAdminOrg,
    updateSuperAdminOrgStatus,
    deleteSuperAdminOrg,
    inviteSuperAdminOrg,
    resendSuperAdminOrgInvite,
    revokeSuperAdminOrgInvite,
  } = useDemoAuth();

  // Guard: Only Super Admin can access this page
  if (!currentRbacUser?.isSuperAdmin) {
    return (
      <AccessDenied
        title="Super Admin Authorization Required"
        message="This dashboard is strictly reserved for FlashSign Super Administrators. Regular workspace accounts cannot enter the platform governance center."
        requiredRole="Super Admin"
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'organizations' | 'invitations' | 'audit'>('organizations');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Modals state
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [inviteOrgOpen, setInviteOrgOpen] = useState(false);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<SuperAdminOrg | null>(null);
  const [editingOrg, setEditingOrg] = useState<SuperAdminOrg | null>(null);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form states for Create Org
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Enterprise');
  const [newOrgIndustry, setNewOrgIndustry] = useState('Software & Technology');
  const [newOrgSize, setNewOrgSize] = useState('51–200 Employees');
  const [newOrgOwnerName, setNewOrgOwnerName] = useState('');
  const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState('');
  const [newOrgStatus, setNewOrgStatus] = useState<'active' | 'pending' | 'inactive'>('active');

  // Form states for Invite Org
  const [inviteOrgName, setInviteOrgName] = useState('');
  const [inviteOwnerEmail, setInviteOwnerEmail] = useState('');
  const [invitePlan, setInvitePlan] = useState('Enterprise');
  const [inviteMessage, setInviteMessage] = useState('');

  // Filtering
  const filteredOrgs = useMemo(() => {
    return superAdminOrgs.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase()) ||
        org.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        org.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
        org.industry.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
      const matchesPlan = planFilter === 'all' || org.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [superAdminOrgs, search, statusFilter, planFilter]);

  // Counts
  const totalOrgsCount = superAdminOrgs.length;
  const activeOrgsCount = superAdminOrgs.filter((o) => o.status === 'active').length;
  const pendingOrgsCount = superAdminOrgs.filter((o) => o.status === 'pending').length;
  const pendingInvitesCount = superAdminOrgInvitations.filter((i) => i.status === 'pending').length;

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgOwnerEmail.trim()) return;

    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    createSuperAdminOrg({
      name: newOrgName.trim(),
      slug,
      plan: newOrgPlan,
      industry: newOrgIndustry,
      size: newOrgSize,
      ownerName: newOrgOwnerName.trim() || 'Organization Owner',
      ownerEmail: newOrgOwnerEmail.trim(),
      status: newOrgStatus,
      website: `https://${slug}.flashsign.com`,
    });

    setCreateOrgOpen(false);
    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgOwnerName('');
    setNewOrgOwnerEmail('');
    showToast(`Organization "${newOrgName}" successfully created!`);
  };

  const handleInviteOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteOrgName.trim() || !inviteOwnerEmail.trim()) return;

    inviteSuperAdminOrg({
      organizationName: inviteOrgName.trim(),
      ownerEmail: inviteOwnerEmail.trim(),
      plan: invitePlan,
      message: inviteMessage.trim() || undefined,
    });

    setInviteOrgOpen(false);
    setInviteOrgName('');
    setInviteOwnerEmail('');
    setInviteMessage('');
    showToast(`Invitation sent to ${inviteOwnerEmail}!`);
  };

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    updateSuperAdminOrg(editingOrg.id, {
      name: editingOrg.name,
      plan: editingOrg.plan,
      status: editingOrg.status,
      industry: editingOrg.industry,
      size: editingOrg.size,
      ownerName: editingOrg.ownerName,
      ownerEmail: editingOrg.ownerEmail,
    });

    setEditingOrg(null);
    showToast(`Organization "${editingOrg.name}" updated successfully!`);
  };

  const handleDeleteOrg = (id: string) => {
    deleteSuperAdminOrg(id);
    setDeletingOrgId(null);
    showToast('Organization record removed.');
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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Super Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            FlashSign Platform Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Global management of organizations, subscription tiers, platform invitations, and enterprise onboarding.
          </p>
        </div>

        {/* Quick Super Admin Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setInviteOrgOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-paper-elevated border border-line text-ink hover:bg-mist transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <MailPlus className="w-3.5 h-3.5 text-flash-deep" />
            <span>Invite Organization</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateOrgOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Organizations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">{totalOrgsCount}</p>
          <span className="text-[11px] text-muted flex items-center gap-1 mt-1 font-medium">
            Across FlashSign Cloud
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Active Workspaces</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">{activeOrgsCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
            Healthy & Operational
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Pending / Trial Orgs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">{pendingOrgsCount}</p>
          <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
            Requires verification
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Pending Invitations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MailPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">{pendingInvitesCount}</p>
          <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-1">
            Awaiting acceptance
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={cn(
            'px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'organizations'
              ? 'border-flash-deep text-flash-deep font-bold'
              : 'border-transparent text-muted hover:text-ink'
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organizations ({superAdminOrgs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={cn(
            'px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'invitations'
              ? 'border-flash-deep text-flash-deep font-bold'
              : 'border-transparent text-muted hover:text-ink'
          )}
        >
          <MailPlus className="w-3.5 h-3.5" />
          <span>Invitations ({superAdminOrgInvitations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={cn(
            'px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'audit'
              ? 'border-flash-deep text-flash-deep font-bold'
              : 'border-transparent text-muted hover:text-ink'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Platform Overview</span>
        </button>
      </div>

      {/* TAB 1: Organizations List & CRUD */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper-elevated p-3 rounded-xl border border-line">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations by name, owner, slug, or industry..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-flash transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
              >
                <option value="all">All Plans</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Pro">Pro</option>
                <option value="Starter">Starter</option>
              </select>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-mist/50 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-3">Owner Contact</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Members & Projects</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted text-xs">
                        No organizations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      return (
                        <tr key={org.id} className="hover:bg-mist/30 transition-colors">
                          {/* Organization Name & Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-flash-deep font-extrabold flex items-center justify-center shrink-0 border border-emerald-200 text-xs">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-ink truncate leading-tight">
                                  {org.name}
                                </p>
                                <p className="text-[11px] text-muted font-mono mt-0.5 truncate">
                                  {org.slug}.flashsign.com
                                </p>
                                <span className="text-[10px] text-muted/80 block mt-0.5">
                                  {org.industry} • {org.size}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Owner Contact */}
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-ink leading-tight">{org.ownerName}</p>
                            <p className="text-[11px] text-muted font-mono">{org.ownerEmail}</p>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full font-semibold text-[10px]',
                                org.plan === 'Enterprise'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : org.plan === 'Pro'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              )}
                            >
                              {org.plan}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <select
                              value={org.status}
                              onChange={(e) => {
                                updateSuperAdminOrgStatus(org.id, e.target.value as any);
                                showToast(`Status for ${org.name} changed to ${e.target.value}`);
                              }}
                              className={cn(
                                'text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-colors',
                                org.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : org.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              )}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>

                          {/* Members & Projects */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3 text-xs text-muted">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-flash-deep" />
                                <strong className="text-ink">{org.memberCount}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                                <strong className="text-ink">{org.projectCount}</strong>
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrgDetails(org)}
                                title="View details"
                                className="p-1.5 rounded-lg hover:bg-mist text-muted hover:text-ink transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingOrg(org)}
                                title="Edit organization"
                                className="p-1.5 rounded-lg hover:bg-mist text-muted hover:text-ink transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingOrgId(org.id)}
                                title="Delete organization"
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-muted hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Organization Invitations */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Track organizations that have been invited to join FlashSign. Resend or revoke invitations as needed.
            </p>
            <button
              type="button"
              onClick={() => setInviteOrgOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-all shadow-xs flex items-center gap-1.5"
            >
              <MailPlus className="w-3.5 h-3.5" />
              <span>Send New Invitation</span>
            </button>
          </div>

          <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-mist/50 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-3">Owner Contact Email</th>
                    <th className="py-3 px-3">Subscription Tier</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Sent / Expires</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {superAdminOrgInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-mist/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-ink">
                        {inv.organizationName}
                        {inv.message && (
                          <span className="block text-[11px] text-muted font-normal mt-0.5 truncate max-w-xs">
                            &quot;{inv.message}&quot;
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-muted">{inv.ownerEmail}</td>
                      <td className="py-3.5 px-3 font-semibold text-ink">{inv.plan}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full font-semibold text-[10px]',
                            inv.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          )}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-muted">
                        <div>Sent: {new Date(inv.sentAt).toLocaleDateString()}</div>
                        <div>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  resendSuperAdminOrgInvite(inv.id);
                                  showToast(`Invitation resent to ${inv.ownerEmail}`);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-line bg-paper hover:bg-mist text-ink transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3 text-flash-deep" />
                                <span>Resend</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  revokeSuperAdminOrgInvite(inv.id);
                                  showToast('Invitation revoked.');
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                          {inv.status !== 'pending' && (
                            <span className="text-[11px] text-muted/60 italic">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Platform Overview & System Health */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border border-line bg-paper-elevated space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-flash-deep" />
              <span>Multi-Tenant Architecture Health</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Super Admin manages multiple customer organizations in complete data isolation. Normal organization owners and members cannot access this console or manage other tenant organizations.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                <span className="text-muted">Enterprise Workspaces:</span>
                <span className="font-bold text-ink">
                  {superAdminOrgs.filter((o) => o.plan === 'Enterprise').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                <span className="text-muted">Pro Tier Workspaces:</span>
                <span className="font-bold text-ink">
                  {superAdminOrgs.filter((o) => o.plan === 'Pro').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                <span className="text-muted">Starter Workspaces:</span>
                <span className="font-bold text-ink">
                  {superAdminOrgs.filter((o) => o.plan === 'Starter').length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-line bg-paper-elevated space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Super Admin Governance Safeguards</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              All organization creation, status changes, and deletion operations in this prototype use mock state stored in your browser session. Role configurations and demo users remain fully isolated.
            </p>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium space-y-1">
              <p className="font-bold">Super Admin vs Organization Owner:</p>
              <p className="text-[11px] leading-normal text-emerald-800">
                Super Admin governs the platform. The Organization Owner governs their own organization, customized roles, and team assignments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Organization */}
      {createOrgOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-ink">Create New Organization</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateOrgOpen(false)}
                className="text-muted hover:text-ink text-sm p-1 rounded-md hover:bg-mist"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Organization Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Workspace Slug</label>
                  <input
                    type="text"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    placeholder="acme-corp"
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink font-mono focus:outline-none focus:border-flash"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Subscription Plan</label>
                  <select
                    value={newOrgPlan}
                    onChange={(e) => setNewOrgPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Pro">Pro</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Industry</label>
                  <select
                    value={newOrgIndustry}
                    onChange={(e) => setNewOrgIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="Software & Technology">Software & Technology</option>
                    <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Consulting & Professional Services">Consulting & Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Initial Status</label>
                  <select
                    value={newOrgStatus}
                    onChange={(e) => setNewOrgStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-line space-y-3">
                <p className="text-[11px] font-bold text-ink uppercase tracking-wider">
                  Organization Owner (Initial Admin)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      value={newOrgOwnerName}
                      onChange={(e) => setNewOrgOwnerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-ink mb-1">
                      Owner Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newOrgOwnerEmail}
                      onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                      placeholder="owner@company.com"
                      className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink font-mono focus:outline-none focus:border-flash"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCreateOrgOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink font-bold transition-all shadow-xs"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Invite Organization */}
      {inviteOrgOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MailPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-ink">Invite Organization</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteOrgOpen(false)}
                className="text-muted hover:text-ink text-sm p-1 rounded-md hover:bg-mist"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Organization Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteOrgName}
                  onChange={(e) => setInviteOrgName(e.target.value)}
                  placeholder="e.g. NextGen Robotics"
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  Primary Owner / Admin Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteOwnerEmail}
                  onChange={(e) => setInviteOwnerEmail(e.target.value)}
                  placeholder="founder@nextgen.io"
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink font-mono focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Target Subscription Tier</label>
                <select
                  value={invitePlan}
                  onChange={(e) => setInvitePlan(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Pro">Pro</option>
                  <option value="Starter">Starter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Personalized Onboarding Note</label>
                <textarea
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Welcome to FlashSign! Click your secure invite link to set up your executive workspace."
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setInviteOrgOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Organization Details */}
      {selectedOrgDetails && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-flash-deep font-extrabold flex items-center justify-center border border-emerald-200 text-xs">
                  {selectedOrgDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink leading-tight">{selectedOrgDetails.name}</h3>
                  <p className="text-[11px] text-muted font-mono">{selectedOrgDetails.slug}.flashsign.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrgDetails(null)}
                className="text-muted hover:text-ink text-sm p-1 rounded-md hover:bg-mist"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60">
                <span className="text-muted block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-ink capitalize mt-0.5 block">{selectedOrgDetails.status}</span>
              </div>
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60">
                <span className="text-muted block text-[10px] uppercase font-bold">Subscription Plan</span>
                <span className="font-bold text-ink mt-0.5 block">{selectedOrgDetails.plan} Tier</span>
              </div>
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60">
                <span className="text-muted block text-[10px] uppercase font-bold">Industry</span>
                <span className="font-bold text-ink mt-0.5 block">{selectedOrgDetails.industry}</span>
              </div>
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60">
                <span className="text-muted block text-[10px] uppercase font-bold">Team Size</span>
                <span className="font-bold text-ink mt-0.5 block">{selectedOrgDetails.size}</span>
              </div>
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60 col-span-2">
                <span className="text-muted block text-[10px] uppercase font-bold">Organization Owner</span>
                <span className="font-bold text-ink mt-0.5 block">
                  {selectedOrgDetails.ownerName} ({selectedOrgDetails.ownerEmail})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-mist/50 border border-line/60 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Active Statistics</span>
                  <span className="text-xs text-ink font-semibold">
                    {selectedOrgDetails.memberCount} Team Members • {selectedOrgDetails.projectCount} Projects
                  </span>
                </div>
                <span className="text-[11px] text-muted">
                  Created {new Date(selectedOrgDetails.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setEditingOrg(selectedOrgDetails);
                  setSelectedOrgDetails(null);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-line text-ink hover:bg-mist text-xs font-semibold"
              >
                Edit Organization
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrgDetails(null)}
                className="px-4 py-1.5 rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Organization */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink">Edit Organization Record</h3>
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                className="text-muted hover:text-ink text-sm p-1 rounded-md hover:bg-mist"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Status</label>
                  <select
                    value={editingOrg.status}
                    onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Plan</label>
                  <select
                    value={editingOrg.plan}
                    onChange={(e) => setEditingOrg({ ...editingOrg, plan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Pro">Pro</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Owner Name</label>
                <input
                  type="text"
                  value={editingOrg.ownerName}
                  onChange={(e) => setEditingOrg({ ...editingOrg, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Owner Email</label>
                <input
                  type="email"
                  value={editingOrg.ownerEmail}
                  onChange={(e) => setEditingOrg({ ...editingOrg, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink font-mono focus:outline-none focus:border-flash"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink font-bold transition-all shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Organization Confirmation */}
      {deletingOrgId && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-danger/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Organization Deletion</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to remove this organization from FlashSign? This will delete all mock member allocations and active workspaces in your browser state.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setDeletingOrgId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-line text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrg(deletingOrgId)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-danger text-white hover:bg-danger/90 transition-all shadow-xs"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

