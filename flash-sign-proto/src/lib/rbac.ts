// ─── FlashSign Role-Based Access Control (RBAC) System ─────────────────────

export type DashboardType = 'admin' | 'my-status';

export interface DashboardAccess {
  defaultDashboard: DashboardType;
  adminDashboard: boolean;
  myStatus: boolean;
}

export type ProjectAccess = 'management' | 'user';

export type TeamAccess = 'management' | 'member';

/**
 * role: one of an organisation's own roles. The five defaults are copied from role_template when
 * the organisation is created; custom roles have no template. Names are unique per organisation,
 * and a role needs at least one dashboard. The default dashboard is calculated (Admin Dashboard
 * when allowed, otherwise My Status).
 */
export interface CustomRole {
  id: string;
  /** role.role_template_id: the default it was copied from; empty for a custom role */
  roleTemplateId?: string;
  /** role.created_by_user_id: empty for roles copied at organisation creation */
  createdByUserId?: string;
  name: string;
  description: string;
  isSystem: boolean;
  dashboardAccess: DashboardAccess;
  projectAccess: ProjectAccess;
  myTasksAccess: boolean;
  teamAccess: TeamAccess;
  createdAt?: string;
  updatedAt?: string;
}

/** role_template: the platform's default roles, copied into every new organisation. */
export interface RoleTemplate {
  id: string;
  roleKey: 'organization_owner' | 'project_manager' | 'team_lead' | 'developer' | 'qa_tester';
  name: string;
  sortOrder: number;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  { id: 'rt-owner', roleKey: 'organization_owner', name: 'Organization Owner', sortOrder: 1 },
  { id: 'rt-pm', roleKey: 'project_manager', name: 'Project Manager', sortOrder: 2 },
  { id: 'rt-team-lead', roleKey: 'team_lead', name: 'Team Lead', sortOrder: 3 },
  { id: 'rt-dev', roleKey: 'developer', name: 'Developer', sortOrder: 4 },
  { id: 'rt-qa', roleKey: 'qa_tester', name: 'QA Tester', sortOrder: 5 },
];

/** The dashboard a role lands on: calculated, never stored. */
export function defaultDashboardFor(access: Pick<DashboardAccess, 'adminDashboard'>): DashboardType {
  return access.adminDashboard ? 'admin' : 'my-status';
}

export interface DemoUserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  jobTitle?: string;
  organizationId?: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  isOwner: boolean;
  dashboardAccess: DashboardAccess;
  projectAccess: ProjectAccess;
  myTasksAccess: boolean;
  teamAccess: TeamAccess;
  assignedProjectIds: string[];
  avatarInitials: string;
}

// ─── Platform tables (Super Admin) ─────────────────────────────────────────
// These mirror the finalized global tables super_admin, organization,
// organization_invitation and organization_feature. Mock data only.

export type OrgPlan = 'starter' | 'pro' | 'enterprise';
export type OrgStatus = 'active' | 'pending' | 'inactive';

export const ORG_PLANS: OrgPlan[] = ['enterprise', 'pro', 'starter'];
export const ORG_STATUSES: OrgStatus[] = ['active', 'pending', 'inactive'];

export function planLabel(plan: OrgPlan | string): string {
  const p = String(plan).toLowerCase();
  return p === 'enterprise' ? 'Enterprise' : p === 'pro' ? 'Pro' : 'Starter';
}

/** IANA time zone names (organization.timezone). */
export const IANA_TIMEZONES = [
  'Asia/Colombo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'UTC',
];

/** users (global): only the columns the platform screens need. */
export interface PlatformUser {
  id: string;
  name: string;
  email: string;
}

/** super_admin: a person allowed into the Super Admin Dashboard. */
export interface SuperAdminRecord {
  id: string;
  userId: string;
  /** Empty for the first (seeded) Super Admin */
  grantedByUserId?: string;
  createdAt: string;
  revokedAt?: string;
}

/** organization: the tenant itself. Member and project counts are counted, never stored. */
export interface SuperAdminOrg {
  id: string;
  /** The Organization Owner; empty until the Owner accepts the invitation */
  ownerUserId?: string;
  /** The Super Admin who created it, or the Owner on accepting */
  createdByUserId: string;
  name: string;
  slug: string;
  description?: string;
  industry: string;
  website?: string;
  plan: OrgPlan;
  status: OrgStatus;
  /** IANA name, e.g. Asia/Colombo */
  timezone: string;
  /** 'HH:mm' */
  workingHoursStart: string;
  workingHoursEnd: string;
  createdAt: string;
  updatedAt: string;
  /** organization.setup_completed_at: set when the Owner finishes "Complete your organisation"; empty = the Owner is sent there after login */
  setupCompletedAt?: string;
  /** Deleted by the Super Admin (soft delete) */
  deletedAt?: string;
}

export type FeatureKey = 'ai_agents' | 'srs_analysis';

/** organization_feature: one switch per organisation and feature key. */
export interface OrganizationFeature {
  organizationId: string;
  featureKey: FeatureKey;
  isEnabled: boolean;
  updatedByUserId: string;
  updatedAt: string;
}

export const FEATURE_DEFINITIONS: { key: FeatureKey; label: string; description: string; defaultEnabled: boolean }[] = [
  { key: 'ai_agents', label: 'AI Agent Hub', description: 'AI coding-agent connections, tokens and activity (Phase 2).', defaultEnabled: true },
  { key: 'srs_analysis', label: 'SRS analysis', description: 'Analyse uploaded SRS files into proposed tasks (Phase 2).', defaultEnabled: true },
];

/** The effective switches for one organisation: its organization_feature rows over the defaults. */
export function featuresFor(organizationId: string | undefined, rows: OrganizationFeature[]): Record<FeatureKey, boolean> {
  const result = Object.fromEntries(FEATURE_DEFINITIONS.map(f => [f.key, f.defaultEnabled])) as Record<FeatureKey, boolean>;
  if (!organizationId) return result;
  rows.filter(r => r.organizationId === organizationId).forEach(r => { result[r.featureKey] = r.isEnabled; });
  return result;
}

// ─── Default System and Custom Roles ────────────────────────────────────────

export const INITIAL_ROLES: CustomRole[] = [
  {
    id: 'role-owner',
    roleTemplateId: 'rt-owner',
    name: 'Organization Owner',
    description: 'Full workspace authority, role creation, member invites, billing, and organizational AI controls.',
    isSystem: true,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'management',
    myTasksAccess: true,
    teamAccess: 'management',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-pm',
    roleTemplateId: 'rt-pm',
    name: 'Project Manager',
    description: 'Full project CRUD, milestones, timeline reports, sprint management, and team allocation.',
    isSystem: true,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'management',
    myTasksAccess: true,
    teamAccess: 'management',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-team-lead',
    roleTemplateId: 'rt-team-lead',
    name: 'Team Lead',
    description: 'Assigned project leadership, team execution visibility, and delivery coordination.',
    isSystem: false,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'role-dev',
    roleTemplateId: 'rt-dev',
    name: 'Developer',
    description: 'Assigned task execution, Kanban boards, sprint task delivery, and AI agent automation.',
    isSystem: false,
    dashboardAccess: {
      defaultDashboard: 'my-status',
      adminDashboard: false,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'role-qa',
    roleTemplateId: 'rt-qa',
    name: 'QA Tester',
    description: 'Defect verification, regression tracking, and test execution on assigned projects.',
    isSystem: false,
    dashboardAccess: {
      defaultDashboard: 'my-status',
      adminDashboard: false,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    createdAt: '2026-01-15T00:00:00Z',
  },
];

// ─── 6 Predefined Demo User Accounts ────────────────────────────────────────

export const DEMO_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'demo-super-admin',
    name: 'Alex Thorne',
    email: 'superadmin@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Super Administrator',
    organizationId: 'platform',
    roleId: 'super-admin',
    roleName: 'Super Admin',
    isSuperAdmin: true,
    isOwner: false,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: false,
    },
    projectAccess: 'management',
    myTasksAccess: false,
    teamAccess: 'management',
    assignedProjectIds: [],
    avatarInitials: 'SA',
  },
  {
    id: 'demo-owner',
    name: 'Aria Chen',
    email: 'owner@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Chief Executive Officer & Founder',
    organizationId: 'ws-flash',
    roleId: 'role-owner',
    roleName: 'Organization Owner',
    isSuperAdmin: false,
    isOwner: true,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'management',
    myTasksAccess: true,
    teamAccess: 'management',
    assignedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
    avatarInitials: 'AC',
  },
  {
    id: 'demo-pm',
    name: 'Marcus Webb',
    email: 'pm@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Senior Project Delivery Manager',
    organizationId: 'ws-flash',
    roleId: 'role-pm',
    roleName: 'Project Manager',
    isSuperAdmin: false,
    isOwner: false,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'management',
    myTasksAccess: true,
    teamAccess: 'management',
    assignedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
    avatarInitials: 'MW',
  },
  {
    id: 'demo-team-lead',
    name: 'James Okafor',
    email: 'teamlead@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Engineering Team Lead',
    organizationId: 'ws-flash',
    roleId: 'role-team-lead',
    roleName: 'Team Lead',
    isSuperAdmin: false,
    isOwner: false,
    dashboardAccess: {
      defaultDashboard: 'admin',
      adminDashboard: true,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    assignedProjectIds: ['p1', 'p2', 'p3'], // Distinct assigned projects
    avatarInitials: 'JO',
  },
  {
    id: 'demo-dev',
    name: 'Priya Nair',
    email: 'dev@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Senior Fullstack Engineer',
    organizationId: 'ws-flash',
    roleId: 'role-dev',
    roleName: 'Developer',
    isSuperAdmin: false,
    isOwner: false,
    dashboardAccess: {
      defaultDashboard: 'my-status',
      adminDashboard: false,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    assignedProjectIds: ['p1', 'p3', 'p5'], // Distinct assigned projects
    avatarInitials: 'PN',
  },
  {
    id: 'demo-qa',
    name: 'Tom Nakamura',
    email: 'qa@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Lead QA Automation Engineer',
    organizationId: 'ws-flash',
    roleId: 'role-qa',
    roleName: 'QA Tester',
    isSuperAdmin: false,
    isOwner: false,
    dashboardAccess: {
      defaultDashboard: 'my-status',
      adminDashboard: false,
      myStatus: true,
    },
    projectAccess: 'user',
    myTasksAccess: true,
    teamAccess: 'member',
    assignedProjectIds: ['p1', 'p4', 'p6'], // Distinct assigned projects
    avatarInitials: 'TN',
  },
];

// ─── Initial Super Admin Organizations & Invitations ────────────────────────

/** users rows for the people the platform screens refer to (mock reference data). */
export const PLATFORM_USERS: PlatformUser[] = [
  { id: 'demo-super-admin', name: 'Alex Thorne', email: 'superadmin@flashsign.com' },
  { id: 'demo-owner', name: 'Aria Chen', email: 'owner@flashsign.com' },
  { id: 'user-sarah', name: 'Sarah Chen', email: 'sarah.chen@acmedigital.com' },
  { id: 'user-alex', name: 'Alex Rivera', email: 'alex.rivera@northstar.io' },
  { id: 'user-david', name: 'David Kim', email: 'david@cloudscale.net' },
];

/** super_admin rows. The first Super Admin is seeded, so granted_by is empty. */
export const INITIAL_SUPER_ADMINS: SuperAdminRecord[] = [
  { id: 'sa-1', userId: 'demo-super-admin', createdAt: '2026-01-01T09:00:00Z' },
];

/** organization rows. Ids match the workspaces, so each record is that tenant. */
export const INITIAL_SUPER_ADMIN_ORGS: SuperAdminOrg[] = [
  {
    id: 'ws-flash',
    ownerUserId: 'demo-owner',
    createdByUserId: 'demo-super-admin',
    name: 'Flash Technologies',
    slug: 'flash-technologies',
    description: 'Unified project management, digital agreements, and AI agent execution suite.',
    industry: 'Software & Technology',
    website: 'https://flashsign.com',
    plan: 'enterprise',
    status: 'active',
    timezone: 'Asia/Colombo',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    createdAt: '2026-01-15T09:00:00Z',
    setupCompletedAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'ws-acme',
    ownerUserId: 'user-sarah',
    createdByUserId: 'demo-super-admin',
    name: 'Acme Digital',
    slug: 'acme-digital',
    description: 'Enterprise digital engineering & cloud solutions group.',
    industry: 'Software & Technology',
    website: 'https://acmedigital.io',
    plan: 'enterprise',
    status: 'active',
    timezone: 'America/New_York',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    createdAt: '2026-01-10T09:00:00Z',
    setupCompletedAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'ws-northstar',
    ownerUserId: 'user-alex',
    createdByUserId: 'demo-super-admin',
    name: 'Northstar Software',
    slug: 'northstar-sw',
    description: 'B2B SaaS product studio building next-generation fintech tools.',
    industry: 'Financial Services & Fintech',
    website: 'https://northstar.io',
    plan: 'pro',
    status: 'active',
    timezone: 'America/Los_Angeles',
    workingHoursStart: '08:30',
    workingHoursEnd: '17:30',
    createdAt: '2026-02-01T09:00:00Z',
    setupCompletedAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'ws-vertex',
    createdByUserId: 'demo-super-admin',
    name: 'Vertex Labs',
    slug: 'vertex-labs',
    description: 'Applied AI research & production agent orchestration laboratory.',
    industry: 'Consulting & Professional Services',
    website: 'https://vertexlabs.ai',
    plan: 'starter',
    status: 'pending',
    timezone: 'Europe/London',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'ws-cloudscale',
    ownerUserId: 'user-david',
    createdByUserId: 'demo-super-admin',
    name: 'CloudScale Systems',
    slug: 'cloudscale-sys',
    industry: 'Cloud Infrastructure',
    website: 'https://cloudscale.net',
    plan: 'pro',
    status: 'inactive',
    timezone: 'Asia/Singapore',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    createdAt: '2026-03-01T09:00:00Z',
    setupCompletedAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
  },
];

/**
 * Member and project counts per organisation. In production they are counted from the
 * organisation's member and project rows (never stored on organization). The prototype only
 * holds members and projects for Flash Technologies, so the others use these sample counts.
 */
export const MOCK_ORG_COUNTS: Record<string, { members: number; projects: number }> = {
  'ws-acme': { members: 48, projects: 12 },
  'ws-northstar': { members: 24, projects: 7 },
  'ws-cloudscale': { members: 8, projects: 2 },
};

/** organization_invitation rows */
/** organization_feature rows. No row = the feature's default (FEATURE_DEFINITIONS). */
export const INITIAL_ORGANIZATION_FEATURES: OrganizationFeature[] = [];

// ─── Storage Keys ───────────────────────────────────────────────────────────

export const RBAC_STORAGE_KEYS = {
  CURRENT_USER: 'flashsign_rbac_current_user',
  CUSTOM_ROLES: 'flashsign_rbac_custom_roles',
  DEMO_ACCOUNTS: 'flashsign_rbac_demo_accounts',
  SUPER_ADMIN_ORGS: 'flashsign_super_admin_orgs_v2',
  SUPER_ADMINS: 'flashsign_super_admins',
  ORGANIZATION_FEATURES: 'flashsign_organization_features',
};

// ─── Reusable Permission Checking Utilities ─────────────────────────────────

export function canAccessDashboard(
  user: DemoUserAccount | null,
  dashboard: 'admin' | 'my-status'
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) {
    return dashboard === 'admin';
  }
  if (dashboard === 'admin') {
    return Boolean(user.dashboardAccess?.adminDashboard);
  }
  if (dashboard === 'my-status') {
    return Boolean(user.dashboardAccess?.myStatus);
  }
  return false;
}

export function canManageProjects(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return user.isOwner || user.projectAccess === 'management';
}

export function canAccessProject(
  user: DemoUserAccount | null,
  projectId: string
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  if (canManageProjects(user)) return true;
  // User Access check
  if (user.projectAccess === 'user') {
    const assigned = user.assignedProjectIds || [];
    return assigned.includes(projectId) || (projectId === 'p-mvhmnblw' && assigned.includes('p1'));
  }
  return false;
}

export function canViewProjectReports(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  return canManageProjects(user);
}

export function canAccessProjectDangerZone(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  return canManageProjects(user);
}

export function canAccessMyTasks(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return Boolean(user.myTasksAccess);
}

export function canManageTeam(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return user.isOwner || user.teamAccess === 'management';
}

export function canViewTeamAnalytics(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return user.isOwner || user.teamAccess === 'management';
}

export function canManageRoles(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return false;
  return user.isOwner || user.teamAccess === 'management';
}

export function canAccessPreferences(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  return Boolean(user.isOwner);
}

export function canAccessAIOrganizationSettings(user: DemoUserAccount | null): boolean {
  if (!user) return false;
  return Boolean(user.isOwner);
}
