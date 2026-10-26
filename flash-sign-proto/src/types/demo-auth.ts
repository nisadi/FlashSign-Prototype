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
  password?: string;
  jobTitle?: string;
  department?: string;
  timezone?: string;
  bio?: string;
  role: DemoRole;
  organizationId?: string | null;
  registrationCompleted?: boolean;
  organizationSetupCompleted?: boolean;
  avatarColor?: string;
  avatarInitials?: string;
  createdAt?: string;
}

export interface DemoWorkspace {
  id: string;
  name: string;
  description?: string;
  type?: string;
  industry?: string;
  size?: string;
  companySize?: string;
  website?: string;
  slug: string;
  ownerId?: string;
  memberCount: number;
  activeProjectCount: number;
  accentColor?: string;
  initials?: string;
  createdAt?: string;
}

/** An invitation to join an organization. Only the owner signs up directly; everyone else joins through one of these. */
export interface DemoInvitation {
  id: string;
  email: string;
  fullName?: string;
  role: DemoRole;
  jobTitle?: string;
  department?: string;
  message?: string;
  organizationId: string;
  organizationName: string;
  invitedById: string;
  invitedByName: string;
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: string;
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
    id: 'ws-flash',
    name: 'Flash Technologies',
    description: 'Unified project management, digital agreements, and AI agent execution suite.',
    type: 'Software Development',
    industry: 'Software & Technology',
    size: '51–200 Employees',
    companySize: '51–200 Employees',
    website: 'https://flashsign.com',
    slug: 'flash-technologies',
    ownerId: 'user-demo',
    memberCount: 52,
    activeProjectCount: 14,
    accentColor: '#00c2a8',
    initials: 'FT',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'ws-acme',
    name: 'Acme Digital',
    description: 'Enterprise digital engineering & cloud solutions group.',
    type: 'Software Development',
    industry: 'Software & Technology',
    size: '51–200 Employees',
    companySize: '51–200 Employees',
    website: 'https://acmedigital.io',
    slug: 'acme-digital',
    ownerId: 'user-sarah',
    memberCount: 48,
    activeProjectCount: 12,
    accentColor: '#00c2a8',
    initials: 'AD',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'ws-northstar',
    name: 'Northstar Software',
    description: 'B2B SaaS product studio building next-generation fintech tools.',
    type: 'Technology Startup',
    industry: 'Financial Services & Fintech',
    size: '11–50 Employees',
    companySize: '11–50 Employees',
    website: 'https://northstar.io',
    slug: 'northstar-sw',
    ownerId: 'user-alex',
    memberCount: 24,
    activeProjectCount: 7,
    accentColor: '#3b82f6',
    initials: 'NS',
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'ws-vertex',
    name: 'Vertex Labs',
    description: 'Applied AI research & production agent orchestration laboratory.',
    type: 'Consulting',
    industry: 'Consulting & Professional Services',
    size: 'Just Me',
    companySize: 'Just Me',
    website: 'https://vertexlabs.ai',
    slug: 'vertex-labs',
    ownerId: 'user-elena',
    memberCount: 16,
    activeProjectCount: 5,
    accentColor: '#8b5cf6',
    initials: 'VL',
    createdAt: '2026-02-15T09:00:00Z',
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
    id: 'user-demo',
    fullName: 'Demo User',
    email: 'demo@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Product Director',
    department: 'Product Delivery',
    timezone: 'America/New_York (UTC-5)',
    bio: 'Primary demo account for evaluating Flash Sign onboarding, management, and e-signatures.',
    role: 'org_admin',
    organizationId: 'ws-flash',
    registrationCompleted: true,
    organizationSetupCompleted: true,
    avatarColor: '#00c2a8',
    avatarInitials: 'DU',
    createdAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'user-sarah',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@acmedigital.com',
    password: 'Demo123!',
    jobTitle: 'VP of Product',
    department: 'Product & Design',
    timezone: 'America/New_York (UTC-5)',
    bio: 'Overseeing core platform roadmap, cross-functional sprints, and customer deliverables.',
    role: 'product_owner',
    organizationId: 'ws-acme',
    registrationCompleted: true,
    organizationSetupCompleted: true,
    avatarColor: '#00c2a8',
    avatarInitials: 'SC',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-alex',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@acmedigital.com',
    password: 'Demo123!',
    jobTitle: 'Staff Software Architect',
    department: 'Engineering',
    timezone: 'America/Los_Angeles (UTC-8)',
    bio: 'Lead architect building AI-agent workflows and high-concurrency microservices.',
    role: 'engineering_lead',
    organizationId: 'ws-acme',
    registrationCompleted: true,
    organizationSetupCompleted: true,
    avatarColor: '#2563eb',
    avatarInitials: 'AR',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-elena',
    fullName: 'Elena Rostova',
    email: 'elena.r@acmedigital.com',
    password: 'Demo123!',
    jobTitle: 'Head of Legal & Compliance',
    department: 'Legal Operations',
    timezone: 'Europe/London (UTC+0)',
    bio: 'Managing enterprise agreements, digital signature audit trails, and data governance.',
    role: 'document_manager',
    organizationId: 'ws-acme',
    registrationCompleted: true,
    organizationSetupCompleted: true,
    avatarColor: '#7c3aed',
    avatarInitials: 'ER',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-incomplete',
    fullName: 'Taylor Morgan',
    email: 'incomplete@flashsign.com',
    password: 'Demo123!',
    jobTitle: 'Founder & CEO',
    department: 'Executive',
    timezone: 'America/New_York (UTC-5)',
    bio: 'New user registered without completing organization setup.',
    role: 'org_admin',
    organizationId: null,
    registrationCompleted: true,
    organizationSetupCompleted: false,
    avatarColor: '#d97706',
    avatarInitials: 'TM',
    createdAt: '2026-03-01T09:00:00Z',
  },
];

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

/** Invitations the owner of Flash Technologies has sent but nobody has accepted yet */
export const INITIAL_DEMO_INVITATIONS: DemoInvitation[] = [
  {
    id: 'inv-demo-1',
    email: 'ravi.perera@flashsign.io',
    fullName: 'Ravi Perera',
    role: 'developer',
    jobTitle: 'Frontend Developer',
    department: 'Engineering',
    message: 'Welcome aboard! You will be working with Priya on the signing canvas.',
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'user-demo',
    invitedByName: 'Demo User',
    sentAt: daysFromNow(-1),
    expiresAt: daysFromNow(6),
    status: 'pending',
  },
  {
    id: 'inv-demo-2',
    email: 'emma.clarke@flashsign.io',
    fullName: 'Emma Clarke',
    role: 'qa',
    jobTitle: 'QA Engineer',
    department: 'Quality',
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'user-demo',
    invitedByName: 'Demo User',
    sentAt: daysFromNow(-3),
    expiresAt: daysFromNow(4),
    status: 'pending',
  },
  {
    id: 'inv-demo-3',
    email: 'jordan.lee@flashsign.io',
    role: 'project_manager',
    department: 'Delivery',
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'user-demo',
    invitedByName: 'Demo User',
    sentAt: daysFromNow(-9),
    expiresAt: daysFromNow(-2),
    status: 'pending',
  },
];
