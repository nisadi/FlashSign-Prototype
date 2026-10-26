import type { DemoRole } from '@/types';

export interface RoleConfig {
  id: DemoRole;
  label: string;
  description: string;
  color: string;
  navGroups: NavGroupKey[];
  defaultPath: string;
}

export type NavGroupKey =
  | 'dashboard'
  | 'projects'
  | 'my-tasks'
  | 'planner'
  | 'teams'
  | 'activity'
  | 'ai-agents'
  | 'documents'
  | 'approvals'
  | 'reports'
  | 'settings';

export const ROLE_CONFIGS: Record<DemoRole, RoleConfig> = {
  ceo: {
    id: 'ceo', label: 'CEO / Executive', description: 'Full portfolio overview, approvals, and management reports.',
    color: '#009882',
    navGroups: ['dashboard', 'projects', 'approvals', 'documents', 'reports'],
    defaultPath: '/dashboard',
  },
  project_manager: {
    id: 'project_manager', label: 'Project Manager', description: 'Manage projects, sprints, tasks, and team workloads.',
    color: '#5c6bc0',
    navGroups: ['dashboard', 'projects', 'my-tasks', 'planner', 'teams', 'approvals', 'reports'],
    defaultPath: '/dashboard',
  },
  product_owner: {
    id: 'product_owner', label: 'Product Owner', description: 'Backlog management, story writing, and sprint planning.',
    color: '#e57373',
    navGroups: ['dashboard', 'projects', 'my-tasks', 'planner', 'ai-agents'],
    defaultPath: '/dashboard',
  },
  engineering_lead: {
    id: 'engineering_lead', label: 'Engineering Lead', description: 'Team delivery, code reviews, and AI agent oversight.',
    color: '#26a69a',
    navGroups: ['dashboard', 'projects', 'my-tasks', 'teams', 'ai-agents', 'reports'],
    defaultPath: '/dashboard',
  },
  developer: {
    id: 'developer', label: 'Developer', description: 'Assigned tasks, Kanban board, and AI agent runs.',
    color: '#ab47bc',
    navGroups: ['dashboard', 'my-tasks', 'projects', 'ai-agents'],
    defaultPath: '/my-tasks',
  },
  qa_tester: {
    id: 'qa_tester', label: 'QA Tester', description: 'Testing queues, bug tracking, and verification checklists.',
    color: '#66bb6a',
    navGroups: ['dashboard', 'my-tasks', 'projects', 'ai-agents'],
    defaultPath: '/my-tasks',
  },
  org_admin: {
    id: 'org_admin', label: 'Org Admin', description: 'User management, roles, and organization settings.',
    color: '#42a5f5',
    navGroups: ['dashboard', 'teams', 'activity', 'settings'],
    defaultPath: '/settings/users',
  },
  document_manager: {
    id: 'document_manager', label: 'Document Manager', description: 'Agreements, signatures, and approval workflows.',
    color: '#ffa726',
    navGroups: ['dashboard', 'documents', 'approvals', 'reports'],
    defaultPath: '/agreements',
  },
  client: {
    id: 'client', label: 'Client', description: 'View shared documents and sign agreements.',
    color: '#8d6e63',
    navGroups: ['documents'],
    defaultPath: '/agreements',
  },
  auditor: {
    id: 'auditor', label: 'Auditor', description: 'Read-only access to audit records and document history.',
    color: '#78909c',
    navGroups: ['documents', 'activity', 'reports', 'settings'],
    defaultPath: '/reports',
  },
  platform_admin: {
    id: 'platform_admin', label: 'Platform Admin', description: 'Platform-level administration and organization overview.',
    color: '#26c6da',
    navGroups: ['dashboard', 'teams', 'settings', 'reports'],
    defaultPath: '/dashboard',
  },
  integration_service: {
    id: 'integration_service', label: 'Integration Service', description: 'System actor — appears in audit and activity logs.',
    color: '#bdbdbd',
    navGroups: ['activity'],
    defaultPath: '/activity',
  },
};

// Permission checks
export function canAccess(role: DemoRole, group: NavGroupKey): boolean {
  return ROLE_CONFIGS[role].navGroups.includes(group);
}

export function canCreateProject(role: DemoRole): boolean {
  return ['ceo', 'project_manager', 'product_owner', 'engineering_lead', 'org_admin', 'platform_admin'].includes(role);
}

export function canCreateTask(role: DemoRole): boolean {
  return ['project_manager', 'product_owner', 'engineering_lead', 'developer', 'qa_tester'].includes(role);
}

export function canApprove(role: DemoRole): boolean {
  return ['ceo', 'project_manager', 'engineering_lead', 'document_manager', 'org_admin'].includes(role);
}

export function canRunAgent(role: DemoRole): boolean {
  return ['developer', 'engineering_lead', 'product_owner'].includes(role);
}

export function canManageDocuments(role: DemoRole): boolean {
  return ['document_manager', 'org_admin', 'ceo', 'platform_admin'].includes(role);
}

export function canSignDocument(role: DemoRole): boolean {
  return ['ceo', 'client', 'project_manager', 'document_manager'].includes(role);
}

export function canManageUsers(role: DemoRole): boolean {
  return ['org_admin', 'platform_admin'].includes(role);
}

export function canViewReports(role: DemoRole): boolean {
  return ['ceo', 'project_manager', 'engineering_lead', 'org_admin', 'platform_admin', 'auditor', 'document_manager'].includes(role);
}

/** Owner and Admin: organisation-wide AI agent settings (AI Agent Hub > Organisation) */
export function canManageAgents(role: DemoRole): boolean {
  return ['ceo', 'org_admin', 'platform_admin'].includes(role);
}

/** Roles that see the whole team's timesheet, not only their own */
export function canViewTeamTime(role: DemoRole): boolean {
  return ['ceo', 'project_manager', 'engineering_lead', 'org_admin', 'platform_admin'].includes(role);
}
