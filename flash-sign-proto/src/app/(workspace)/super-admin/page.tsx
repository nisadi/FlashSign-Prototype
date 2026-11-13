'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Building2,
  Plus,
  MailPlus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  RotateCcw,
  Users,
  FolderKanban,
  Send,
  Eye,
  SlidersHorizontal,
  ToggleRight,
  Link2,
} from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { useApp } from '@/context/app-context';
import { AccessDenied } from '@/components/shared/access-denied';
import {
  type SuperAdminOrg,
  type SuperAdminOrgInvitation,
  type OrgPlan,
  type OrgStatus,
  ORG_PLANS,
  ORG_STATUSES,
  IANA_TIMEZONES,
  ORG_INVITE_VALID_DAYS,
  FEATURE_DEFINITIONS,
  MOCK_ORG_COUNTS,
  PLATFORM_USERS,
  featuresFor,
  orgInviteDisplayStatus,
  planLabel,
} from '@/lib/rbac';
import { cn, slugify } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const INDUSTRIES = [
  'Software & Technology',
  'Financial Services & Fintech',
  'Healthcare & Life Sciences',
  'Consulting & Professional Services',
  'Cloud Infrastructure',
  'Manufacturing',
  'Education',
  'Government & Public Sector',
];

const inputClass =
  'w-full px-3 py-2 bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash';

function planBadgeClass(plan: OrgPlan) {
  return plan === 'enterprise'
    ? 'bg-purple-100 text-purple-800 border border-purple-200'
    : plan === 'pro'
    ? 'bg-blue-100 text-blue-800 border border-blue-200'
    : 'bg-slate-100 text-slate-700 border border-slate-200';
}

function statusSelectClass(status: OrgStatus) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : status === 'pending'
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-rose-50 text-rose-800 border-rose-200';
}

const INVITE_STATUS_STYLE: Record<ReturnType<typeof orgInviteDisplayStatus>, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-slate-100 text-slate-700',
  revoked: 'bg-rose-100 text-rose-800',
};

interface CreateForm {
  name: string;
  slug: string;
  plan: OrgPlan;
  industry: string;
  status: OrgStatus;
  timezone: string;
  website: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
}

const EMPTY_CREATE: CreateForm = {
  name: '',
  slug: '',
  plan: 'enterprise',
  industry: INDUSTRIES[0],
  status: 'pending',
  timezone: 'Asia/Colombo',
  website: '',
  description: '',
  ownerName: '',
  ownerEmail: '',
};

interface EditForm {
  org: SuperAdminOrg;
  ownerName: string;
  ownerEmail: string;
}

export default function SuperAdminPage() {
  const {
    currentRbacUser,
    demoAccounts,
    superAdmins,
    superAdminOrgs,
    superAdminOrgInvitations,
    organizationFeatures,
    createSuperAdminOrg,
    updateSuperAdminOrg,
    updateSuperAdminOrgStatus,
    deleteSuperAdminOrg,
    inviteSuperAdminOrg,
    updateSuperAdminOrgInvite,
    resendSuperAdminOrgInvite,
    revokeSuperAdminOrgInvite,
    setOrganizationFeature,
  } = useDemoAuth();
  const { projects } = useApp();

  const [activeTab, setActiveTab] = useState<'organizations' | 'invitations' | 'audit'>('organizations');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | OrgPlan>('all');
  const [inviteStatusFilter, setInviteStatusFilter] = useState<'all' | ReturnType<typeof orgInviteDisplayStatus>>('all');

  // Modals
  const [createForm, setCreateForm] = useState<CreateForm | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState<{ organizationName: string; ownerName: string; ownerEmail: string; plan: OrgPlan } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [detailsOrgId, setDetailsOrgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const liveOrgs = useMemo(() => superAdminOrgs.filter((o) => !o.deletedAt), [superAdminOrgs]);

  /** users lookup: platform users plus the demo accounts */
  const userById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    PLATFORM_USERS.forEach((u) => map.set(u.id, u));
    demoAccounts.forEach((a) => map.set(a.id, { name: a.name, email: a.email }));
    return map;
  }, [demoAccounts]);

  /** The organisation's Owner: owner_user_id, or the Owner on its pending invitation */
  const ownerOf = (org: SuperAdminOrg) => {
    if (org.ownerUserId) {
      const u = userById.get(org.ownerUserId);
      return { name: u?.name ?? 'Unknown user', email: u?.email ?? '', accepted: true, invite: undefined };
    }
    const invite = superAdminOrgInvitations
      .filter((i) => i.organizationId === org.id && !i.revokedAt && i.status !== 'accepted')
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
    return { name: invite?.ownerName ?? 'No Owner yet', email: invite?.ownerEmail ?? '', accepted: false, invite };
  };

  /** Counted, never stored: members from the demo accounts and projects from the project list */
  const countsOf = (org: SuperAdminOrg) => {
    const members = demoAccounts.filter((a) => !a.isSuperAdmin && a.organizationId === org.id).length;
    if (members > 0) return { members, projects: org.id === 'ws-flash' ? projects.length : 0 };
    return MOCK_ORG_COUNTS[org.id] ?? { members: 0, projects: 0 };
  };

  const filteredOrgs = useMemo(() => {
    const q = search.toLowerCase();
    return liveOrgs.filter((org) => {
      const owner = ownerOf(org);
      const matchesSearch =
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        owner.name.toLowerCase().includes(q) ||
        owner.email.toLowerCase().includes(q) ||
        org.industry.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
      const matchesPlan = planFilter === 'all' || org.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
    // ownerOf reads invitations and users; both are in the deps through their sources
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOrgs, search, statusFilter, planFilter, superAdminOrgInvitations, userById]);

  const filteredInvites = useMemo(
    () =>
      [...superAdminOrgInvitations]
        .filter((i) => inviteStatusFilter === 'all' || orgInviteDisplayStatus(i) === inviteStatusFilter)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [superAdminOrgInvitations, inviteStatusFilter]
  );

  // Guard: Only Super Admin can access this page (after all hooks)
  if (!currentRbacUser?.isSuperAdmin) {
    return (
      <AccessDenied
        title="Super Admin Authorization Required"
        message="This dashboard is strictly reserved for FlashSign Super Administrators. Regular workspace accounts cannot enter the platform governance center."
        requiredRole="Super Admin"
      />
    );
  }

  // Counts
  const totalOrgsCount = liveOrgs.length;
  const activeOrgsCount = liveOrgs.filter((o) => o.status === 'active').length;
  const pendingOrgsCount = liveOrgs.filter((o) => o.status === 'pending').length;
  const pendingInvitesCount = superAdminOrgInvitations.filter((i) => orgInviteDisplayStatus(i) === 'pending').length;

  const detailsOrg = detailsOrgId ? superAdminOrgs.find((o) => o.id === detailsOrgId) ?? null : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    const slug = slugify(createForm.slug || createForm.name);
    if (!createForm.name.trim()) return setCreateError('Enter the organisation name.');
    if (!SLUG_RE.test(slug)) return setCreateError('Use lower-case letters, numbers and single hyphens in the slug.');
    if (!createForm.ownerName.trim()) return setCreateError("Enter the Owner's name.");
    if (!EMAIL_RE.test(createForm.ownerEmail.trim())) return setCreateError("Enter a valid Owner email address.");
    const result = createSuperAdminOrg({ ...createForm, slug });
    if (!result.success) return setCreateError(result.error ?? 'Could not create the organisation.');
    setCreateForm(null);
    setCreateError(null);
    showToast(`"${createForm.name}" created. An invitation was sent to ${createForm.ownerEmail}.`);
  };

  const handleInviteOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm) return;
    if (!inviteForm.organizationName.trim()) return setInviteError('Enter the organisation name.');
    if (!inviteForm.ownerName.trim()) return setInviteError("Enter the Owner's name.");
    if (!EMAIL_RE.test(inviteForm.ownerEmail.trim())) return setInviteError('Enter a valid Owner email address.');
    const result = inviteSuperAdminOrg(inviteForm);
    if (!result.success) return setInviteError(result.error ?? 'Could not send the invitation.');
    setInviteForm(null);
    setInviteError(null);
    showToast(`Invitation sent to ${inviteForm.ownerEmail}.`);
  };

  const openEdit = (org: SuperAdminOrg) => {
    const owner = ownerOf(org);
    setEditError(null);
    setEditForm({ org: { ...org }, ownerName: owner.invite ? owner.name : '', ownerEmail: owner.invite ? owner.email : '' });
  };

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    const { org } = editForm;
    if (!org.name.trim()) return setEditError('Enter the organisation name.');
    const slug = slugify(org.slug);
    if (!SLUG_RE.test(slug)) return setEditError('Use lower-case letters, numbers and single hyphens in the slug.');
    const owner = ownerOf(superAdminOrgs.find((o) => o.id === org.id) ?? org);
    if (owner.invite) {
      if (!editForm.ownerName.trim()) return setEditError("Enter the Owner's name.");
      if (!EMAIL_RE.test(editForm.ownerEmail.trim())) return setEditError('Enter a valid Owner email address.');
    }
    const result = updateSuperAdminOrg(org.id, {
      name: org.name.trim(),
      slug,
      status: org.status,
      plan: org.plan,
      industry: org.industry,
      website: org.website?.trim() || undefined,
      description: org.description?.trim() || undefined,
      timezone: org.timezone,
    });
    if (!result.success) return setEditError(result.error ?? 'Could not save the organisation.');
    // The Owner's name and email live on the pending invitation until the Owner accepts
    if (owner.invite) {
      updateSuperAdminOrgInvite(owner.invite.id, {
        ownerName: editForm.ownerName.trim(),
        ownerEmail: editForm.ownerEmail.trim(),
        organizationName: org.name.trim(),
        plan: org.plan,
      });
    }
    setEditForm(null);
    showToast(`"${org.name}" updated.`);
  };

  const handleDeleteOrg = (id: string) => {
    const org = superAdminOrgs.find((o) => o.id === id);
    deleteSuperAdminOrg(id);
    setDeletingOrgId(null);
    setDetailsOrgId(null);
    showToast(`"${org?.name ?? 'Organisation'}" deleted.`);
  };

  const tabButton = (key: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(key)}
      className={cn(
        'px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-2',
        activeTab === key ? 'border-flash-deep text-flash-deep font-bold' : 'border-transparent text-muted hover:text-ink'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-up">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Super Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">FlashSign Platform Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Organisations, plans, Owner invitations and per-organisation feature switches.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setInviteError(null);
              setInviteForm({ organizationName: '', ownerName: '', ownerEmail: '', plan: 'enterprise' });
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-paper-elevated border border-line text-ink hover:bg-mist transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <MailPlus className="w-3.5 h-3.5 text-flash-deep" />
            <span>Invite Organization</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateForm({ ...EMPTY_CREATE });
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total Organizations" value={totalOrgsCount} hint="Not counting deleted ones" icon={<Building2 className="w-4 h-4" />} tone="purple" />
        <Kpi label="Active" value={activeOrgsCount} hint="Members can sign in" icon={<CheckCircle2 className="w-4 h-4" />} tone="emerald" />
        <Kpi label="Pending" value={pendingOrgsCount} hint="Waiting for the Owner" icon={<Clock className="w-4 h-4" />} tone="amber" />
        <Kpi label="Pending Invitations" value={pendingInvitesCount} hint="Not yet accepted or expired" icon={<MailPlus className="w-4 h-4" />} tone="blue" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px text-xs font-semibold overflow-x-auto">
        {tabButton('organizations', <Building2 className="w-3.5 h-3.5" />, `Organizations (${totalOrgsCount})`)}
        {tabButton('invitations', <MailPlus className="w-3.5 h-3.5" />, `Invitations (${superAdminOrgInvitations.length})`)}
        {tabButton('audit', <SlidersHorizontal className="w-3.5 h-3.5" />, 'Platform Overview')}
      </div>

      {/* TAB 1: Organizations */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper-elevated p-3 rounded-xl border border-line">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, slug, Owner or industry..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-flash transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | OrgStatus)}
                className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
              >
                <option value="all">All Statuses</option>
                {ORG_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'all' | OrgPlan)}
                className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
              >
                <option value="all">All Plans</option>
                {ORG_PLANS.map((p) => (
                  <option key={p} value={p}>{planLabel(p)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-mist/50 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Members & Projects</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted text-xs">No organizations match your filters.</td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const owner = ownerOf(org);
                      const counts = countsOf(org);
                      return (
                        <tr key={org.id} className="hover:bg-mist/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-flash-deep font-extrabold flex items-center justify-center shrink-0 border border-emerald-200 text-xs">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-ink truncate leading-tight">{org.name}</p>
                                <p className="text-[11px] text-muted font-mono mt-0.5 truncate">{org.slug}.flashsign.com</p>
                                <span className="text-[10px] text-muted/80 block mt-0.5">{org.industry} • {org.timezone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-ink leading-tight">{owner.name}</p>
                            <p className="text-[11px] text-muted font-mono">{owner.email}</p>
                            {!owner.accepted && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700">
                                {owner.invite ? 'Invitation not accepted yet' : 'No pending invitation'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={cn('px-2 py-0.5 rounded-full font-semibold text-[10px]', planBadgeClass(org.plan))}>{planLabel(org.plan)}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <select
                              value={org.status}
                              onChange={(e) => {
                                updateSuperAdminOrgStatus(org.id, e.target.value as OrgStatus);
                                showToast(`${org.name} is now ${e.target.value}.`);
                              }}
                              aria-label={`Status of ${org.name}`}
                              className={cn('text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-colors', statusSelectClass(org.status))}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3 text-xs text-muted">
                              <span className="flex items-center gap-1" title="Members (counted)">
                                <Users className="w-3.5 h-3.5 text-flash-deep" />
                                <strong className="text-ink">{counts.members}</strong>
                              </span>
                              <span className="flex items-center gap-1" title="Projects (counted)">
                                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                                <strong className="text-ink">{counts.projects}</strong>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <IconButton title="View details" onClick={() => setDetailsOrgId(org.id)}><Eye className="w-4 h-4" /></IconButton>
                              <IconButton title="Edit organization" onClick={() => openEdit(org)}><Edit2 className="w-4 h-4" /></IconButton>
                              <IconButton title="Delete organization" danger onClick={() => setDeletingOrgId(org.id)}><Trash2 className="w-4 h-4" /></IconButton>
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

      {/* TAB 2: Organization invitations */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Invitations for an Owner to take over or create an organisation. Each link is valid for {ORG_INVITE_VALID_DAYS} days; resending starts a new {ORG_INVITE_VALID_DAYS}-day period.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={inviteStatusFilter}
                onChange={(e) => setInviteStatusFilter(e.target.value as typeof inviteStatusFilter)}
                className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setInviteError(null);
                  setInviteForm({ organizationName: '', ownerName: '', ownerEmail: '', plan: 'enterprise' });
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-all shadow-xs flex items-center gap-1.5"
              >
                <MailPlus className="w-3.5 h-3.5" />
                <span>Send New Invitation</span>
              </button>
            </div>
          </div>

          <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-mist/50 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-3">Owner</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Sent / Expires</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredInvites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted text-xs">No invitations match this filter.</td>
                    </tr>
                  ) : (
                    filteredInvites.map((inv: SuperAdminOrgInvitation) => {
                      const display = orgInviteDisplayStatus(inv);
                      const linkedOrg = inv.organizationId ? superAdminOrgs.find((o) => o.id === inv.organizationId) : undefined;
                      return (
                        <tr key={inv.id} className="hover:bg-mist/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-ink">{inv.organizationName}</p>
                            <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                              {linkedOrg ? (
                                <><Link2 className="w-3 h-3" /> {linkedOrg.deletedAt ? 'Organisation deleted' : 'Organisation already created'}</>
                              ) : (
                                'Organisation created when the Owner accepts'
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-ink">{inv.ownerName}</p>
                            <p className="font-mono text-muted text-[11px]">{inv.ownerEmail}</p>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-ink">{planLabel(inv.plan)}</td>
                          <td className="py-3.5 px-3">
                            <span className={cn('px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase', INVITE_STATUS_STYLE[display])}>{display}</span>
                            {inv.acceptedAt && (
                              <span className="block text-[10px] text-muted mt-0.5">on {new Date(inv.acceptedAt).toLocaleDateString()}</span>
                            )}
                            {inv.revokedAt && (
                              <span className="block text-[10px] text-muted mt-0.5">on {new Date(inv.revokedAt).toLocaleDateString()}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-[11px] text-muted">
                            <div>Sent: {new Date(inv.sentAt).toLocaleDateString()}</div>
                            <div>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {display !== 'accepted' && !linkedOrg?.deletedAt && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    resendSuperAdminOrgInvite(inv.id);
                                    showToast(`Invitation resent to ${inv.ownerEmail}.`);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-line bg-paper hover:bg-mist text-ink transition-colors flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3 text-flash-deep" />
                                  <span>Resend</span>
                                </button>
                              )}
                              {display === 'pending' && (
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
                              )}
                              {display === 'accepted' && <span className="text-[11px] text-muted/60 italic">Accepted</span>}
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

      {/* TAB 3: Platform overview */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border border-line bg-paper-elevated space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-flash-deep" />
              <span>Organisations by plan</span>
            </h3>
            <div className="space-y-2 text-xs">
              {ORG_PLANS.map((p) => (
                <div key={p} className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                  <span className="text-muted">{planLabel(p)}:</span>
                  <span className="font-bold text-ink">{liveOrgs.filter((o) => o.plan === p).length}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                <span className="text-muted">Deleted (kept for the retention period):</span>
                <span className="font-bold text-ink">{superAdminOrgs.length - liveOrgs.length}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-line bg-paper-elevated space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Super Admins</span>
            </h3>
            <ul className="space-y-2 text-xs">
              {superAdmins.map((sa) => {
                const u = userById.get(sa.userId);
                const by = sa.grantedByUserId ? userById.get(sa.grantedByUserId)?.name : undefined;
                return (
                  <li key={sa.id} className="flex items-center justify-between p-2.5 rounded-lg bg-mist/50 border border-line/60">
                    <div>
                      <p className="font-semibold text-ink">{u?.name ?? sa.userId}</p>
                      <p className="text-[11px] text-muted font-mono">{u?.email}</p>
                    </div>
                    <div className="text-right text-[11px] text-muted">
                      <p>{by ? `Granted by ${by}` : 'First Super Admin (seeded)'}</p>
                      <p>Since {new Date(sa.createdAt).toLocaleDateString()}</p>
                      {sa.revokedAt && <p className="text-danger font-semibold">Revoked</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted leading-relaxed">
              The Super Admin manages organisation records only. The Organization Owner governs their own organisation, roles and members.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: Create organization */}
      {createForm && (
        <ModalShell title="Create New Organization" icon={<Building2 className="w-4 h-4" />} onClose={() => setCreateForm(null)} wide>
          <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs" noValidate>
            <Field label="Organization Name" required>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCreateForm((f) => f && { ...f, name, slug: f.slug && f.slug !== slugify(f.name) ? f.slug : slugify(name) });
                }}
                placeholder="e.g. Acme Corporation"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Workspace Slug" required hint="Unique across FlashSign.">
                <input type="text" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} placeholder="acme-corp" className={cn(inputClass, 'font-mono')} />
              </Field>
              <Field label="Plan">
                <select value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as OrgPlan })} className={inputClass}>
                  {ORG_PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Industry">
                <select value={createForm.industry} onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })} className={inputClass}>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Initial Status" hint="Nobody can sign in to an inactive organisation.">
                <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as OrgStatus })} className={inputClass}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time Zone">
                <select value={createForm.timezone} onChange={(e) => setCreateForm({ ...createForm, timezone: e.target.value })} className={inputClass}>
                  {IANA_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </Field>
              <Field label="Website">
                <input type="url" value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} placeholder="https://acme.com" className={inputClass} />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputClass} />
            </Field>

            <div className="pt-2 border-t border-line space-y-3">
              <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Organization Owner</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Owner Full Name" required>
                  <input type="text" value={createForm.ownerName} onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })} placeholder="e.g. John Doe" className={inputClass} />
                </Field>
                <Field label="Owner Email" required>
                  <input type="email" value={createForm.ownerEmail} onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })} placeholder="owner@company.com" className={cn(inputClass, 'font-mono')} />
                </Field>
              </div>
              <p className="text-[11px] text-muted">
                The Owner gets an invitation valid for {ORG_INVITE_VALID_DAYS} days. They become the Owner when they accept it.
              </p>
            </div>

            {createError && <p className="text-danger font-medium" role="alert">{createError}</p>}
            <ModalActions onCancel={() => setCreateForm(null)} submitLabel="Create Organization" />
          </form>
        </ModalShell>
      )}

      {/* MODAL: Invite organization */}
      {inviteForm && (
        <ModalShell title="Invite Organization" icon={<MailPlus className="w-4 h-4" />} onClose={() => setInviteForm(null)}>
          <form onSubmit={handleInviteOrg} className="space-y-3.5 text-xs" noValidate>
            <Field label="Organization Name" required>
              <input type="text" value={inviteForm.organizationName} onChange={(e) => setInviteForm({ ...inviteForm, organizationName: e.target.value })} placeholder="e.g. NextGen Robotics" className={inputClass} />
            </Field>
            <Field label="Owner Full Name" required>
              <input type="text" value={inviteForm.ownerName} onChange={(e) => setInviteForm({ ...inviteForm, ownerName: e.target.value })} placeholder="e.g. Nimal Perera" className={inputClass} />
            </Field>
            <Field label="Owner Email" required>
              <input type="email" value={inviteForm.ownerEmail} onChange={(e) => setInviteForm({ ...inviteForm, ownerEmail: e.target.value })} placeholder="founder@nextgen.io" className={cn(inputClass, 'font-mono')} />
            </Field>
            <Field label="Plan">
              <select value={inviteForm.plan} onChange={(e) => setInviteForm({ ...inviteForm, plan: e.target.value as OrgPlan })} className={inputClass}>
                {ORG_PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
              </select>
            </Field>
            <p className="text-[11px] text-muted">
              The organisation is created when the Owner accepts. The link is valid for {ORG_INVITE_VALID_DAYS} days.
            </p>
            {inviteError && <p className="text-danger font-medium" role="alert">{inviteError}</p>}
            <ModalActions onCancel={() => setInviteForm(null)} submitLabel="Send Invitation" submitIcon={<Send className="w-3.5 h-3.5" />} />
          </form>
        </ModalShell>
      )}

      {/* MODAL: Organization details + feature switches */}
      {detailsOrg && (
        <ModalShell title={detailsOrg.name} subtitle={`${detailsOrg.slug}.flashsign.com`} onClose={() => setDetailsOrgId(null)} wide>
          {(() => {
            const owner = ownerOf(detailsOrg);
            const counts = countsOf(detailsOrg);
            const creator = userById.get(detailsOrg.createdByUserId)?.name ?? detailsOrg.createdByUserId;
            const features = featuresFor(detailsOrg.id, organizationFeatures);
            return (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Status" value={<span className="capitalize">{detailsOrg.status}</span>} />
                  <Detail label="Plan" value={planLabel(detailsOrg.plan)} />
                  <Detail label="Industry" value={detailsOrg.industry} />
                  <Detail label="Time zone" value={detailsOrg.timezone} />
                  <Detail label="Working hours" value={`${detailsOrg.workingHoursStart} – ${detailsOrg.workingHoursEnd}`} />
                  <Detail label="Website" value={detailsOrg.website || '—'} />
                  <Detail
                    label="Organization Owner"
                    span
                    value={
                      <>
                        {owner.name} {owner.email && <span className="font-mono text-muted">({owner.email})</span>}
                        {!owner.accepted && <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">Invitation not accepted yet</span>}
                      </>
                    }
                  />
                  {detailsOrg.description && <Detail label="Description" span value={detailsOrg.description} />}
                  <Detail label="Members & projects (counted)" value={`${counts.members} members • ${counts.projects} projects`} />
                  <Detail label="Created" value={`${new Date(detailsOrg.createdAt).toLocaleDateString()} by ${creator}`} />
                </div>

                <div className="pt-3 border-t border-line space-y-2">
                  <p className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <ToggleRight className="w-3.5 h-3.5 text-flash-deep" /> Features
                  </p>
                  {FEATURE_DEFINITIONS.map((f) => (
                    <label key={f.key} className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-mist/40 border border-line/60 cursor-pointer">
                      <span>
                        <span className="font-semibold text-ink block">{f.label}</span>
                        <span className="text-muted">{f.description}</span>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={features[f.key]}
                        onChange={(e) => {
                          setOrganizationFeature(detailsOrg.id, f.key, e.target.checked);
                          showToast(`${f.label} ${e.target.checked ? 'enabled' : 'disabled'} for ${detailsOrg.name}.`);
                        }}
                        className="mt-0.5 w-9 h-5 shrink-0 appearance-none rounded-full bg-line relative transition-colors checked:bg-flash cursor-pointer before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:rounded-full before:bg-white before:shadow before:transition-transform checked:before:translate-x-4"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <button type="button" onClick={() => { setDetailsOrgId(null); openEdit(detailsOrg); }} className="px-3.5 py-1.5 rounded-lg border border-line text-ink hover:bg-mist text-xs font-semibold">
                    Edit Organization
                  </button>
                  <button type="button" onClick={() => setDetailsOrgId(null)} className="px-4 py-1.5 rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink text-xs font-bold">
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </ModalShell>
      )}

      {/* MODAL: Edit organization */}
      {editForm && (
        <ModalShell title="Edit Organization" icon={<Edit2 className="w-4 h-4" />} onClose={() => setEditForm(null)} wide>
          {(() => {
            const original = superAdminOrgs.find((o) => o.id === editForm.org.id) ?? editForm.org;
            const owner = ownerOf(original);
            const set = (patch: Partial<SuperAdminOrg>) => setEditForm({ ...editForm, org: { ...editForm.org, ...patch } });
            return (
              <form onSubmit={handleUpdateOrg} className="space-y-3 text-xs" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Organization Name" required>
                    <input type="text" value={editForm.org.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Workspace Slug" required>
                    <input type="text" value={editForm.org.slug} onChange={(e) => set({ slug: e.target.value })} className={cn(inputClass, 'font-mono')} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Status">
                    <select value={editForm.org.status} onChange={(e) => set({ status: e.target.value as OrgStatus })} className={inputClass}>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                  <Field label="Plan">
                    <select value={editForm.org.plan} onChange={(e) => set({ plan: e.target.value as OrgPlan })} className={inputClass}>
                      {ORG_PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
                    </select>
                  </Field>
                  <Field label="Time Zone">
                    <select value={editForm.org.timezone} onChange={(e) => set({ timezone: e.target.value })} className={inputClass}>
                      {IANA_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Industry">
                    <select value={editForm.org.industry} onChange={(e) => set({ industry: e.target.value })} className={inputClass}>
                      {Array.from(new Set([editForm.org.industry, ...INDUSTRIES])).map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Website">
                    <input type="url" value={editForm.org.website ?? ''} onChange={(e) => set({ website: e.target.value })} className={inputClass} />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea rows={2} value={editForm.org.description ?? ''} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
                </Field>

                <div className="pt-2 border-t border-line space-y-2">
                  <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Organization Owner</p>
                  {owner.invite ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Owner Name" required hint="Updates the pending invitation.">
                        <input type="text" value={editForm.ownerName} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} className={inputClass} />
                      </Field>
                      <Field label="Owner Email" required>
                        <input type="email" value={editForm.ownerEmail} onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })} className={cn(inputClass, 'font-mono')} />
                      </Field>
                    </div>
                  ) : (
                    <p className="text-muted">
                      {owner.accepted
                        ? <>{owner.name} <span className="font-mono">({owner.email})</span> accepted the invitation. The Owner&apos;s own account details can&apos;t be changed here.</>
                        : 'No pending Owner invitation. Send one from the Invitations tab.'}
                    </p>
                  )}
                </div>

                {editError && <p className="text-danger font-medium" role="alert">{editError}</p>}
                <ModalActions onCancel={() => setEditForm(null)} submitLabel="Save Changes" />
              </form>
            );
          })()}
        </ModalShell>
      )}

      {/* MODAL: Delete confirmation */}
      {deletingOrgId && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-elevated border border-danger/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Delete this organisation?</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Nobody will be able to sign in to it and its pending Owner invitation stops working. Its data is kept for the retention period
              (signed agreements under retention or legal hold are never removed).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button type="button" onClick={() => setDeletingOrgId(null)} className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-line text-muted hover:text-ink">
                Cancel
              </button>
              <button type="button" onClick={() => handleDeleteOrg(deletingOrgId)} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-danger text-white hover:bg-danger/90 transition-all shadow-xs">
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small building blocks ────────────────────────────────────────────────────

function Kpi({ label, value, hint, icon, tone }: { label: string; value: number; hint: string; icon: React.ReactNode; tone: 'purple' | 'emerald' | 'amber' | 'blue' }) {
  const toneClass = {
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }[tone];
  return (
    <div className="p-4 sm:p-5 rounded-xl border border-line bg-paper-elevated shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', toneClass)}>{icon}</div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">{value}</p>
      <span className="text-[11px] text-muted font-medium mt-1 block">{hint}</span>
    </div>
  );
}

function IconButton({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'p-1.5 rounded-lg text-muted transition-colors cursor-pointer',
        danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-mist hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

function ModalShell({ title, subtitle, icon, onClose, wide, children }: { title: string; subtitle?: string; icon?: React.ReactNode; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className={cn('bg-paper-elevated border border-line rounded-2xl w-full p-6 shadow-2xl animate-fade-in space-y-4 my-8 max-h-[90vh] overflow-y-auto', wide ? 'max-w-lg' : 'max-w-md')}>
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            {icon && <div className="w-7 h-7 rounded-lg bg-flash/20 text-flash-deep flex items-center justify-center">{icon}</div>}
            <div>
              <h3 className="text-base font-bold text-ink leading-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-muted font-mono">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink text-sm p-1 rounded-md hover:bg-mist">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, submitLabel, submitIcon }: { onCancel: () => void; submitLabel: string; submitIcon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink font-semibold">Cancel</button>
      <button type="submit" className="px-4 py-2 rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink font-bold transition-all shadow-xs flex items-center gap-1.5">
        {submitIcon}
        <span>{submitLabel}</span>
      </button>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-semibold text-ink mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

function Detail({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={cn('p-3 rounded-xl bg-mist/50 border border-line/60', span && 'col-span-2')}>
      <span className="text-muted block text-[10px] uppercase font-bold">{label}</span>
      <span className="font-bold text-ink mt-0.5 block">{value}</span>
    </div>
  );
}
