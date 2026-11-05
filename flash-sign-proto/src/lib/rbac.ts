// ─── FlashSign Role-Based Access Control (RBAC) System ─────────────────────

export type DashboardType = 'admin' | 'my-status';

export interface DashboardAccess {
  defaultDashboard: DashboardType;
  adminDashboard: boolean;
  myStatus: boolean;
}

export type ProjectAccess = 'management' | 'user';

export type TeamAccess = 'management' | 'member';

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  dashboardAccess: DashboardAccess;
  projectAccess: ProjectAccess;
  myTasksAccess: boolean;
  teamAccess: TeamAccess;
  createdAt?: string;
}

export interface DemoUserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  jobTitle?: string;
  department?: string;
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
  avatarColor: string;
  avatarInitials: string;
}

export interface SuperAdminOrg {
  id: string;
  name: string;
  slug: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  industry: string;
  size: string;
  ownerName: string;
  ownerEmail: string;
  status: 'active' | 'pending' | 'inactive';
  memberCount: number;
  projectCount: number;
  website?: string;
  createdAt: string;
}

export interface SuperAdminOrgInvitation {
  id: string;
  organizationName: string;
  ownerEmail: string;
  plan: string;
  message?: string;
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
  expiresAt: string;
}

// ─── Default System and Custom Roles ────────────────────────────────────────

export const INITIAL_ROLES: CustomRole[] = [
  {
    id: 'role-owner',
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
    department: 'Platform Governance',
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
    avatarColor: '#00c2a8',
    avatarInitials: 'SA',
  },
  {
    id: 'demo-owner',
    name: 'Aria Chen',
    email: 'owner@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Chief Executive Officer & Founder',
    department: 'Executive Leadership',
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
    avatarColor: '#009882',
    avatarInitials: 'AC',
  },
  {
    id: 'demo-pm',
    name: 'Marcus Webb',
    email: 'pm@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Senior Project Delivery Manager',
    department: 'Operations & Delivery',
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
    avatarColor: '#5c6bc0',
    avatarInitials: 'MW',
  },
  {
    id: 'demo-team-lead',
    name: 'James Okafor',
    email: 'teamlead@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Engineering Team Lead',
    department: 'Engineering',
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
    avatarColor: '#26a69a',
    avatarInitials: 'JO',
  },
  {
    id: 'demo-dev',
    name: 'Priya Nair',
    email: 'dev@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Senior Fullstack Engineer',
    department: 'Engineering',
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
    avatarColor: '#ab47bc',
    avatarInitials: 'PN',
  },
  {
    id: 'demo-qa',
    name: 'Tom Nakamura',
    email: 'qa@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Lead QA Automation Engineer',
    department: 'Quality Engineering',
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
    avatarColor: '#66bb6a',
    avatarInitials: 'TN',
  },
];

// ─── Initial Super Admin Organizations & Invitations ────────────────────────

export const INITIAL_SUPER_ADMIN_ORGS: SuperAdminOrg[] = [
  {
    id: 'org-flash',
    name: 'Flash Technologies',
    slug: 'flash-technologies',
    plan: 'Enterprise',
    industry: 'Software & Technology',
    size: '51–200 Employees',
    ownerName: 'Aria Chen',
    ownerEmail: 'owner@flashsign.com',
    status: 'active',
    memberCount: 52,
    projectCount: 14,
    website: 'https://flashsign.com',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'org-acme',
    name: 'Acme Digital',
    slug: 'acme-digital',
    plan: 'Enterprise',
    industry: 'Digital Engineering',
    size: '51–200 Employees',
    ownerName: 'Sarah Chen',
    ownerEmail: 'sarah.chen@acmedigital.com',
    status: 'active',
    memberCount: 48,
    projectCount: 12,
    website: 'https://acmedigital.io',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'org-northstar',
    name: 'Northstar Software',
    slug: 'northstar-sw',
    plan: 'Pro',
    industry: 'Financial Services & Fintech',
    size: '11–50 Employees',
    ownerName: 'Alex Rivera',
    ownerEmail: 'alex.rivera@acmedigital.com',
    status: 'active',
    memberCount: 24,
    projectCount: 7,
    website: 'https://northstar.io',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'org-vertex',
    name: 'Vertex Labs',
    slug: 'vertex-labs',
    plan: 'Starter',
    industry: 'Consulting & Professional Services',
    size: 'Just Me',
    ownerName: 'Elena Rostova',
    ownerEmail: 'elena.r@acmedigital.com',
    status: 'pending',
    memberCount: 16,
    projectCount: 5,
    website: 'https://vertexlabs.ai',
    createdAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'org-cloudscale',
    name: 'CloudScale Systems',
    slug: 'cloudscale-sys',
    plan: 'Pro',
    industry: 'Cloud Infrastructure',
    size: '11–50 Employees',
    ownerName: 'David Kim',
    ownerEmail: 'david@cloudscale.net',
    status: 'inactive',
    memberCount: 8,
    projectCount: 2,
    website: 'https://cloudscale.net',
    createdAt: '2026-03-01T09:00:00Z',
  },
];

export const INITIAL_SUPER_ADMIN_INVITATIONS: SuperAdminOrgInvitation[] = [
  {
    id: 'inv-org-1',
    organizationName: 'Quantum Dynamics',
    ownerEmail: 'contact@quantumdynamics.io',
    plan: 'Enterprise',
    message: 'Invitation to onboard enterprise workspace on FlashSign.',
    status: 'pending',
    sentAt: '2026-11-03T10:00:00Z',
    expiresAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'inv-org-2',
    organizationName: 'Aura Health Systems',
    ownerEmail: 'admin@aurahealth.org',
    plan: 'Pro',
    message: 'Welcome to FlashSign compliance and signature workspace.',
    status: 'accepted',
    sentAt: '2026-10-25T08:30:00Z',
    expiresAt: '2026-11-01T08:30:00Z',
  },
  {
    id: 'inv-org-3',
    organizationName: 'Starlight Media',
    ownerEmail: 'founders@starlight.co',
    plan: 'Starter',
    message: 'Join FlashSign to manage collaborative media delivery.',
    status: 'expired',
    sentAt: '2026-10-10T12:00:00Z',
    expiresAt: '2026-10-17T12:00:00Z',
  },
];

// ─── Storage Keys ───────────────────────────────────────────────────────────

export const RBAC_STORAGE_KEYS = {
  CURRENT_USER: 'flashsign_rbac_current_user',
  CUSTOM_ROLES: 'flashsign_rbac_custom_roles',
  DEMO_ACCOUNTS: 'flashsign_rbac_demo_accounts',
  SUPER_ADMIN_ORGS: 'flashsign_super_admin_orgs',
  SUPER_ADMIN_INVITATIONS: 'flashsign_super_admin_invites',
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
