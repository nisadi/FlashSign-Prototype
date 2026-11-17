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
  /** users.bio */
  bio?: string;
  /** users.avatar_file_id (shown as a data URL in the prototype) */
  avatarUrl?: string;
  /** users.is_active: false = disabled by a platform admin */
  isActive?: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
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

/**
 * An invitation to join an organization (finalized tables `invitation` + `invitation_project`).
 * Only the Owner comes in through an organisation invitation; everyone else joins through one
 * of these. The invitee gets one of the organisation's own roles (`roleId`) and, for a Project
 * User Access role, the projects in `projectIds` (copied to project_member on acceptance).
 * Expired = status 'pending' and past `expiresAt` (not a stored status).
 */
export interface DemoInvitation {
  id: string;
  email: string;
  /** invitation.name */
  fullName?: string;
  /** invitation.role_id: one of this organisation's roles */
  roleId: string;
  /** Role name at the time of sending (display only; the role is looked up by roleId) */
  roleName?: string;
  /** invitation.title (job title; never grants access) */
  jobTitle?: string;
  message?: string;
  /** invitation_project rows */
  projectIds: string[];
  organizationId: string;
  organizationName: string;
  invitedById: string;
  invitedByName: string;
  acceptedByUserId?: string;
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: string;
  revokedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Personal settings, the same in every organisation (finalized table `user_preference`). */
export interface DemoPreferences {
  theme: 'light' | 'dark';
  defaultCalendarView: 'month' | 'week' | 'day' | 'agenda';
  inAppNotifications: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  weeklyDigest: boolean;
}

export type NotificationEventKey =
  | 'task_assigned'
  | 'mentioned'
  | 'review_requested'
  | 'task_blocked'
  | 'deadline_reminder'
  | 'approval_reminder'
  | 'signature_requested'
  | 'request_signed'
  | 'request_declined'
  | 'request_expiring'
  | 'meeting_invite'
  | 'meeting_conflict'
  | 'time_off_decision'
  | 'announcement';

export type NotificationEventCategory = 'task' | 'signature' | 'approval' | 'meeting' | 'time_off' | 'announcement' | 'system';

/** The fixed list of events a person can switch on or off (finalized table `notification_event`). */
export interface NotificationEventDef {
  eventKey: NotificationEventKey;
  name: string;
  category: NotificationEventCategory;
  defaultEnabled: boolean;
}

export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  { eventKey: 'task_assigned', name: 'A task is assigned to me', category: 'task', defaultEnabled: true },
  { eventKey: 'mentioned', name: 'Someone mentions me in a comment', category: 'task', defaultEnabled: true },
  { eventKey: 'review_requested', name: 'My review is requested', category: 'task', defaultEnabled: true },
  { eventKey: 'task_blocked', name: 'A task I own is blocked', category: 'task', defaultEnabled: true },
  { eventKey: 'deadline_reminder', name: 'A task I own is close to its due date', category: 'task', defaultEnabled: true },
  { eventKey: 'approval_reminder', name: 'An approval is waiting for me', category: 'approval', defaultEnabled: true },
  { eventKey: 'signature_requested', name: 'A document is waiting for my signature', category: 'signature', defaultEnabled: true },
  { eventKey: 'request_signed', name: 'Someone signs a request I sent', category: 'signature', defaultEnabled: true },
  { eventKey: 'request_declined', name: 'Someone declines a request I sent', category: 'signature', defaultEnabled: true },
  { eventKey: 'request_expiring', name: 'A request I sent is about to expire', category: 'signature', defaultEnabled: true },
  { eventKey: 'meeting_invite', name: 'I am invited to a meeting', category: 'meeting', defaultEnabled: true },
  { eventKey: 'meeting_conflict', name: 'A meeting clashes with my schedule', category: 'meeting', defaultEnabled: true },
  { eventKey: 'time_off_decision', name: 'My time-off request is approved or declined', category: 'time_off', defaultEnabled: true },
  { eventKey: 'announcement', name: 'A new announcement is posted', category: 'announcement', defaultEnabled: true },
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationEventCategory, string> = {
  task: 'Tasks',
  signature: 'Signatures',
  approval: 'Approvals',
  meeting: 'Meetings',
  time_off: 'Time off',
  announcement: 'Announcements',
  system: 'System',
};

/**
 * user_notification_setting rows for one person: event key → is_enabled.
 * No entry = the event's default_enabled.
 */
export type UserNotificationSettings = Partial<Record<NotificationEventKey, boolean>>;

export function isNotificationEnabled(settings: UserNotificationSettings, key: NotificationEventKey): boolean {
  return settings[key] ?? NOTIFICATION_EVENTS.find(e => e.eventKey === key)?.defaultEnabled ?? true;
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
    roleId: 'role-dev',
    roleName: 'Developer',
    projectIds: ['p1', 'p3'],
    jobTitle: 'Frontend Developer',
    message: 'Welcome aboard! You will be working with Priya on the signing canvas.',
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'demo-owner',
    invitedByName: 'Aria Chen',
    sentAt: daysFromNow(-1),
    expiresAt: daysFromNow(6),
    status: 'pending',
  },
  {
    id: 'inv-demo-2',
    email: 'emma.clarke@flashsign.io',
    fullName: 'Emma Clarke',
    roleId: 'role-qa',
    roleName: 'QA Tester',
    projectIds: ['p1', 'p4'],
    jobTitle: 'QA Engineer',
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'demo-owner',
    invitedByName: 'Aria Chen',
    sentAt: daysFromNow(-3),
    expiresAt: daysFromNow(4),
    status: 'pending',
  },
  {
    id: 'inv-demo-3',
    email: 'jordan.lee@flashsign.io',
    roleId: 'role-pm',
    roleName: 'Project Manager',
    projectIds: [],
    organizationId: 'ws-flash',
    organizationName: 'Flash Technologies',
    invitedById: 'demo-owner',
    invitedByName: 'Aria Chen',
    sentAt: daysFromNow(-9),
    expiresAt: daysFromNow(-2),
    status: 'pending',
  },
];
