export type DemoRole =
  | 'executive'
  | 'project_manager'
  | 'product_owner'
  | 'engineering_lead'
  | 'developer'
  | 'qa'
  | 'org_admin'
  | 'document_manager'
  | 'client'
  | 'auditor';

export interface DemoUser {
  id: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  timezone?: string;
  bio?: string;
  role: DemoRole;
  avatarColor?: string;
  avatarInitials?: string;
}

export interface DemoWorkspace {
  id: string;
  name: string;
  description?: string;
  type?: string;
  companySize?: string;
  slug: string;
  memberCount: number;
  activeProjectCount: number;
  accentColor?: string;
  initials?: string;
}

export interface DemoPreferences {
  theme: 'light' | 'dark';
  inAppNotifications: boolean;
  emailNotifications: boolean;
  taskAssignmentAlerts: boolean;
  deadlineReminders: boolean;
  approvalReminders: boolean;
  timezone: string;
}

export interface RoleOption {
  id: DemoRole;
  title: string;
  category: 'leadership' | 'delivery' | 'quality' | 'governance';
  description: string;
  badges: string[];
}

export const DEMO_ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'executive',
    title: 'CEO / Executive',
    category: 'leadership',
    description: 'Portfolio-level oversight, financial burn rates, high-stakes agreement approvals.',
    badges: ['Portfolio KPIs', 'Exec Approvals'],
  },
  {
    id: 'project_manager',
    title: 'Project Manager',
    category: 'leadership',
    description: 'Sprint planning, resource workload, team delivery milestones, and timeline tracking.',
    badges: ['Sprint Planning', 'Timelines'],
  },
  {
    id: 'product_owner',
    title: 'Product Owner',
    category: 'delivery',
    description: 'Backlog prioritization, user stories, acceptance criteria, and release scope.',
    badges: ['Backlog', 'Requirements'],
  },
  {
    id: 'engineering_lead',
    title: 'Engineering Lead',
    category: 'delivery',
    description: 'Sprint velocity, technical architecture, AI agent code review gates, and QA signs.',
    badges: ['Code Review', 'Agent Gates'],
  },
  {
    id: 'developer',
    title: 'Developer',
    category: 'delivery',
    description: 'Active task execution, Kanban boards, AI code generation, and pull request handoffs.',
    badges: ['Kanban', 'AI Agents'],
  },
  {
    id: 'qa',
    title: 'QA Tester',
    category: 'quality',
    description: 'Test case execution, bug regression tracking, release readiness verification.',
    badges: ['Testing', 'Bug Tracking'],
  },
  {
    id: 'org_admin',
    title: 'Organization Admin',
    category: 'governance',
    description: 'User provisioning, role-based access control, workspace configurations, integrations.',
    badges: ['Security', 'Admin Access'],
  },
  {
    id: 'document_manager',
    title: 'Document Manager',
    category: 'governance',
    description: 'Contract templates, electronic-signature pipelines, audit certificates, and legal compliance.',
    badges: ['E-Sign', 'Audit Trail'],
  },
  {
    id: 'client',
    title: 'Client Stakeholder',
    category: 'governance',
    description: 'Milestone sign-offs, statement of work reviews, and external delivery visibility.',
    badges: ['Sign-offs', 'External Review'],
  },
  {
    id: 'auditor',
    title: 'Auditor',
    category: 'governance',
    description: 'Read-only compliance verification, activity logs, cryptographic signature hashes.',
    badges: ['Read-only', 'Compliance Logs'],
  },
];

export const INITIAL_DEMO_WORKSPACES: DemoWorkspace[] = [
  {
    id: 'ws-acme',
    name: 'Acme Digital',
    description: 'Enterprise digital engineering & cloud solutions group.',
    type: 'Software Development',
    companySize: '51–200 employees',
    slug: 'acme-digital',
    memberCount: 48,
    activeProjectCount: 12,
    accentColor: '#00c2a8',
    initials: 'AD',
  },
  {
    id: 'ws-northstar',
    name: 'Northstar Software',
    description: 'B2B SaaS product studio building next-generation fintech tools.',
    type: 'Technology Startup',
    companySize: '11–50 employees',
    slug: 'northstar-sw',
    memberCount: 24,
    activeProjectCount: 7,
    accentColor: '#3b82f6',
    initials: 'NS',
  },
  {
    id: 'ws-vertex',
    name: 'Vertex Labs',
    description: 'Applied AI research & production agent orchestration laboratory.',
    type: 'Consulting',
    companySize: '1–10 employees',
    slug: 'vertex-labs',
    memberCount: 16,
    activeProjectCount: 5,
    accentColor: '#8b5cf6',
    initials: 'VL',
  },
];

export const PRESET_AVATAR_COLORS = [
  { label: 'Mint Flash', value: '#00c2a8' },
  { label: 'Deep Emerald', value: '#009882' },
  { label: 'Ocean Blue', value: '#2563eb' },
  { label: 'Royal Violet', value: '#7c3aed' },
  { label: 'Amber Flame', value: '#d97706' },
  { label: 'Slate Ink', value: '#1a3539' },
];

export const DEMO_PRESET_USERS: DemoUser[] = [
  {
    id: 'user-sarah',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@acmedigital.com',
    jobTitle: 'VP of Product',
    department: 'Product & Design',
    timezone: 'America/New_York (UTC-5)',
    bio: 'Overseeing core platform roadmap, cross-functional sprints, and customer deliverables.',
    role: 'product_owner',
    avatarColor: '#00c2a8',
    avatarInitials: 'SC',
  },
  {
    id: 'user-alex',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@acmedigital.com',
    jobTitle: 'Staff Software Architect',
    department: 'Engineering',
    timezone: 'America/Los_Angeles (UTC-8)',
    bio: 'Lead architect building AI-agent workflows and high-concurrency microservices.',
    role: 'engineering_lead',
    avatarColor: '#2563eb',
    avatarInitials: 'AR',
  },
  {
    id: 'user-elena',
    fullName: 'Elena Rostova',
    email: 'elena.r@acmedigital.com',
    jobTitle: 'Head of Legal & Compliance',
    department: 'Legal Operations',
    timezone: 'Europe/London (UTC+0)',
    bio: 'Managing enterprise agreements, digital signature audit trails, and data governance.',
    role: 'document_manager',
    avatarColor: '#7c3aed',
    avatarInitials: 'ER',
  },
];
