import type {
  User, Organization, Project, Team, Task, Sprint, Milestone,
  Document, ApprovalRequest, Notification, AuditLog, Integration,
  AgentRun, DemoRole, ProjectFile,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function d(offset: number): string {
  const dt = new Date('2026-10-20T09:00:00Z');
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString();
}

// ── Users ────────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Aria Chen', email: 'aria@flashsign.io', initials: 'AC', role: 'ceo', title: 'Chief Executive Officer', department: 'Executive', color: '#009882', isActive: true, createdAt: d(-180) },
  { id: 'u2', name: 'Marcus Webb', email: 'marcus@flashsign.io', initials: 'MW', role: 'project_manager', title: 'Senior Project Manager', department: 'Operations', color: '#5c6bc0', isActive: true, createdAt: d(-160) },
  { id: 'u3', name: 'Sofia Reyes', email: 'sofia@flashsign.io', initials: 'SR', role: 'product_owner', title: 'Product Owner', department: 'Product', color: '#e57373', isActive: true, createdAt: d(-140) },
  { id: 'u4', name: 'James Okafor', email: 'james@flashsign.io', initials: 'JO', role: 'engineering_lead', title: 'Engineering Lead', department: 'Engineering', color: '#26a69a', isActive: true, createdAt: d(-130) },
  { id: 'u5', name: 'Priya Nair', email: 'priya@flashsign.io', initials: 'PN', role: 'developer', title: 'Senior Engineer', department: 'Engineering', color: '#ab47bc', isActive: true, createdAt: d(-120) },
  { id: 'u6', name: 'Lena Fischer', email: 'lena@flashsign.io', initials: 'LF', role: 'developer', title: 'Frontend Engineer', department: 'Engineering', color: '#ff7043', isActive: true, createdAt: d(-110) },
  { id: 'u7', name: 'Tom Nakamura', email: 'tom@flashsign.io', initials: 'TN', role: 'qa_tester', title: 'QA Engineer', department: 'Quality', color: '#66bb6a', isActive: true, createdAt: d(-100) },
  { id: 'u8', name: 'Rachel Kim', email: 'rachel@flashsign.io', initials: 'RK', role: 'org_admin', title: 'IT Administrator', department: 'IT', color: '#42a5f5', isActive: true, createdAt: d(-90) },
  { id: 'u9', name: 'David Osei', email: 'david@flashsign.io', initials: 'DO', role: 'document_manager', title: 'Legal Operations Manager', department: 'Legal', color: '#ffa726', isActive: true, createdAt: d(-80) },
  { id: 'u10', name: 'Claire Dupont', email: 'claire@acmecorp.com', initials: 'CD', role: 'client', title: 'VP of Partnerships', department: 'ACME Corp', color: '#8d6e63', isActive: true, createdAt: d(-30) },
  { id: 'u11', name: 'Ethan Mwangi', email: 'ethan@audit.io', initials: 'EM', role: 'auditor', title: 'Compliance Auditor', department: 'External Audit', color: '#78909c', isActive: true, createdAt: d(-20) },
  { id: 'u12', name: 'Nina Petrov', email: 'nina@flashsign.io', initials: 'NP', role: 'platform_admin', title: 'Platform Administrator', department: 'Platform', color: '#26c6da', isActive: true, createdAt: d(-200) },
  { id: 'u13', name: 'CI/CD Bot', email: 'bot@flashsign.io', initials: 'CB', role: 'integration_service', title: 'Integration Service Account', department: 'Automation', color: '#bdbdbd', isActive: true, createdAt: d(-200) },
  { id: 'u14', name: 'Aditya Sharma', email: 'aditya@flashsign.io', initials: 'AS', role: 'developer', title: 'Backend Engineer', department: 'Engineering', color: '#ef5350', isActive: true, createdAt: d(-95) },
];

export const DEMO_ROLE_USERS: Record<DemoRole, string> = {
  ceo: 'u1',
  project_manager: 'u2',
  product_owner: 'u3',
  engineering_lead: 'u4',
  developer: 'u5',
  qa_tester: 'u7',
  org_admin: 'u8',
  document_manager: 'u9',
  client: 'u10',
  auditor: 'u11',
  platform_admin: 'u12',
  integration_service: 'u13',
};

// ── Organization ──────────────────────────────────────────────────────────────
export const MOCK_ORG: Organization = {
  id: 'org1',
  name: 'Flash Sign HQ',
  slug: 'flashsign-hq',
  plan: 'enterprise',
  memberCount: 14,
  createdAt: d(-200),
};

// ── Teams ─────────────────────────────────────────────────────────────────────
export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Core Platform', description: 'Backend infrastructure and APIs', leadId: 'u4', memberIds: ['u4', 'u5', 'u14'], color: '#26a69a', createdAt: d(-150) },
  { id: 't2', name: 'Product & Design', description: 'Product roadmap, UX, and design systems', leadId: 'u3', memberIds: ['u3', 'u6'], color: '#e57373', createdAt: d(-140) },
  { id: 't3', name: 'Quality Assurance', description: 'Testing, QA, and release validation', leadId: 'u7', memberIds: ['u7'], color: '#66bb6a', createdAt: d(-120) },
  { id: 't4', name: 'Legal & Operations', description: 'Contracts, compliance, and legal ops', leadId: 'u9', memberIds: ['u9', 'u2'], color: '#ffa726', createdAt: d(-100) },
];

// ── Projects ──────────────────────────────────────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1', name: 'Flash Sign v2.0', key: 'FSV2', description: 'Next-generation e-signature platform with AI-assisted document preparation.',
    status: 'active', health: 'on_track', ownerId: 'u2', teamIds: ['t1', 't2', 't3'], memberIds: ['u2', 'u3', 'u4', 'u5', 'u6', 'u7'],
    startDate: d(-60), endDate: d(30), progress: 68, priority: 'critical', tags: ['platform', 'core'],
    isFavorite: true, isArchived: false, group: 'Core Platform', accentColor: '#00c2a8',
    goals: ['Launch v2 public beta by end of month', 'Reach <1s document render latency', 'Complete eIDAS compliance checks'],
    createdAt: d(-60), updatedAt: d(-1),
  },
  {
    id: 'p2', name: 'ACME Corp Integration', key: 'ACME', description: 'Custom API integration and white-label portal for ACME Corporation.',
    status: 'active', health: 'at_risk', ownerId: 'u2', teamIds: ['t1', 't4'], memberIds: ['u2', 'u4', 'u14', 'u9'],
    startDate: d(-30), endDate: d(14), progress: 42, priority: 'high', tags: ['client', 'integration'],
    isFavorite: true, isArchived: false, group: 'Client Engagements', accentColor: '#3b82f6',
    goals: ['Production deployment for 2,000 corporate users', '100% test coverage on webhook queues'],
    createdAt: d(-30), updatedAt: d(-2),
  },
  {
    id: 'p3', name: 'AI Agent Orchestration', key: 'AIAG', description: 'Build infrastructure to run Claude, Codex, and Gemini agents on tasks.',
    status: 'active', health: 'on_track', ownerId: 'u4', teamIds: ['t1'], memberIds: ['u4', 'u5', 'u14'],
    startDate: d(-45), endDate: d(45), progress: 55, priority: 'high', tags: ['ai', 'platform'],
    isFavorite: true, isArchived: false, group: 'AI & Automation', accentColor: '#8b5cf6',
    goals: ['Autonomous bug triaging pipeline', 'Multi-model fallback support (Claude + Gemini)'],
    createdAt: d(-45), updatedAt: d(-3),
  },
  {
    id: 'p4', name: 'Mobile App Beta', key: 'MOB', description: 'iOS and Android mobile client for document signing on the go.',
    status: 'planning', health: 'on_track', ownerId: 'u3', teamIds: ['t2', 't3'], memberIds: ['u3', 'u6', 'u7'],
    startDate: d(5), endDate: d(90), progress: 8, priority: 'medium', tags: ['mobile', 'beta'],
    isFavorite: false, isArchived: false, group: 'Product Studio', accentColor: '#ec4899',
    goals: ['TestFlight beta with 500 external signers', 'Biometric sign unlock'],
    createdAt: d(-10), updatedAt: d(-1),
  },
  {
    id: 'p5', name: 'Security Hardening Q4', key: 'SEC', description: 'Pen testing, SOC 2 gap analysis, and remediation for Q4 audit.',
    status: 'active', health: 'off_track', ownerId: 'u8', teamIds: ['t1', 't4'], memberIds: ['u8', 'u4', 'u14'],
    startDate: d(-20), endDate: d(10), progress: 30, priority: 'critical', tags: ['security', 'compliance'],
    isFavorite: false, isArchived: false, group: 'Compliance & IT', accentColor: '#ef4444',
    goals: ['Zero high-severity findings on re-test', 'Complete SOC 2 Type II audit report'],
    createdAt: d(-20), updatedAt: d(-1),
  },
  {
    id: 'p6', name: 'Onboarding Redesign', key: 'ONB', description: 'Revamp the user onboarding flow based on customer research.',
    status: 'completed', health: 'on_track', ownerId: 'u3', teamIds: ['t2'], memberIds: ['u3', 'u6'],
    startDate: d(-90), endDate: d(-15), progress: 100, priority: 'medium', tags: ['ux', 'growth'],
    isFavorite: false, isArchived: false, group: 'Growth & UX', accentColor: '#10b981',
    goals: ['Increase first-envelope completion rate by 25%'],
    createdAt: d(-90), updatedAt: d(-15),
  },
];

// ── Sprints ───────────────────────────────────────────────────────────────────
export const MOCK_SPRINTS: Sprint[] = [
  { id: 's1', name: 'Sprint 12', projectId: 'p1', status: 'active', goal: 'Ship signing workflow v2 and AI field detection', startDate: d(-14), endDate: d(0), capacity: 40, createdAt: d(-15) },
  { id: 's2', name: 'Sprint 13', projectId: 'p1', status: 'planned', goal: 'Mobile-responsive envelope preparation', startDate: d(1), endDate: d(14), capacity: 40, createdAt: d(-15) },
  { id: 's3', name: 'Sprint 3', projectId: 'p3', status: 'active', goal: 'Claude and Gemini provider integration', startDate: d(-7), endDate: d(7), capacity: 24, createdAt: d(-8) },
  { id: 's4', name: 'Sprint 1', projectId: 'p4', status: 'planned', goal: 'App skeleton, navigation, and auth', startDate: d(5), endDate: d(19), capacity: 20, createdAt: d(-2) },
  { id: 's5', name: 'Sprint 2', projectId: 'p2', status: 'active', goal: 'Webhook integration and client portal API', startDate: d(-10), endDate: d(4), capacity: 32, createdAt: d(-11) },
];

// ── Milestones ────────────────────────────────────────────────────────────────
export const MOCK_MILESTONES: Milestone[] = [
  { id: 'm1', projectId: 'p1', name: 'Beta Launch', description: 'Public beta for v2.0 signing platform', dueDate: d(14), status: 'upcoming', progress: 72 },
  { id: 'm2', projectId: 'p1', name: 'GA Release', description: 'General availability of Flash Sign v2.0', dueDate: d(30), status: 'upcoming', progress: 45 },
  { id: 'm3', projectId: 'p2', name: 'ACME Go-Live', description: 'ACME Corp production deployment', dueDate: d(14), status: 'at_risk', progress: 42 },
  { id: 'm4', projectId: 'p3', name: 'Agent MVP', description: 'Multi-agent task execution for developers', dueDate: d(21), status: 'upcoming', progress: 55 },
  { id: 'm5', projectId: 'p5', name: 'SOC 2 Report', description: 'External auditor delivers final report', dueDate: d(10), status: 'at_risk', progress: 30 },
  { id: 'm6', projectId: 'p6', name: 'Onboarding v2 Live', description: 'New onboarding flow deployed to production', dueDate: d(-15), status: 'completed', progress: 100 },
  { id: 'm7', projectId: 'p4', name: 'Mobile Prototype Alpha', description: 'Internal testing build on TestFlight & Play Beta', dueDate: d(25), status: 'upcoming', progress: 15 },
  { id: 'm8', projectId: 'p2', name: 'API Contract Finalization', description: 'Sign-off on REST OpenAPI specs with ACME architects', dueDate: d(2), status: 'completed', progress: 100 },
  { id: 'm9', projectId: 'p1', name: 'Audit Compliance Baseline', description: 'Cryptographic hash verification for agreement trails', dueDate: d(18), status: 'upcoming', progress: 60 },
];

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const MOCK_TASKS: Task[] = [
  // FSV2 (p1) - Sprint 12 & 13
  {
    id: 'task1', key: 'FSV2-101', title: 'Redesign signature placement canvas',
    description: 'Implement a drag-and-drop canvas for placing signature, date, and text fields on PDF documents.',
    type: 'story', status: 'done', priority: 'high', projectId: 'p1', sprintId: 's1', assigneeId: 'u6', reporterId: 'u3',
    storyPoints: 8, startDate: d(-14), dueDate: d(-3), tags: ['ui', 'canvas'],
    checklist: [
      { id: 'chk1', text: 'Touch device support for tablet users', completed: true },
      { id: 'chk2', text: 'Field snapping guidelines', completed: true },
      { id: 'chk3', text: 'Cross-browser rendering tests', completed: true },
    ],
    comments: [{ id: 'c1', authorId: 'u7', body: 'Testing passed on Chrome and Firefox.', createdAt: d(-2) }],
    attachments: ['Canvas_Spec_v2.pdf'], acceptanceCriteria: 'Users can drag fields onto PDF. Fields snap to grid. Mobile-responsive.',
    createdAt: d(-14), updatedAt: d(-2),
  },
  {
    id: 'task2', key: 'FSV2-102', title: 'AI field auto-detection',
    description: 'Use Claude to auto-suggest signature, date, and initials fields based on document content.',
    type: 'story', status: 'in_progress', priority: 'critical', projectId: 'p1', sprintId: 's1', assigneeId: 'u5', reporterId: 'u3',
    storyPoints: 13, startDate: d(-10), dueDate: d(1), tags: ['ai', 'ml'],
    checklist: [
      { id: 'chk4', text: 'Document tokenization pipeline', completed: true },
      { id: 'chk5', text: 'Bounding box precision verification', completed: false },
    ],
    comments: [], attachments: [], acceptanceCriteria: 'AI detects ≥85% of signature fields. User can accept or dismiss suggestions.',
    createdAt: d(-14), updatedAt: d(-1),
  },
  {
    id: 'task3', key: 'FSV2-103', title: 'Fix email delivery latency',
    description: 'Signing invitation emails take >3 minutes to deliver in production.',
    type: 'bug', status: 'in_progress', priority: 'critical', projectId: 'p1', sprintId: 's1', assigneeId: 'u14', reporterId: 'u7',
    storyPoints: 5, startDate: d(-5), dueDate: d(0), tags: ['email', 'infra'],
    checklist: [
      { id: 'chk6', text: 'SES rate limit audit', completed: true },
      { id: 'chk7', text: 'Queue retry backoff tuning', completed: false },
    ],
    comments: [{ id: 'c2', authorId: 'u4', body: 'Root cause identified — SES queue congestion. Fix in progress.', createdAt: d(-1) }],
    attachments: [], createdAt: d(-10), updatedAt: d(-1),
  },
  {
    id: 'task4', key: 'FSV2-104', title: 'Audit log for signing events',
    description: 'Record IP address, timestamp, and geolocation for every signing action.',
    type: 'story', status: 'review', priority: 'high', projectId: 'p1', sprintId: 's1', assigneeId: 'u5', reporterId: 'u9',
    storyPoints: 5, startDate: d(-12), dueDate: d(2), tags: ['audit', 'compliance'],
    checklist: [
      { id: 'chk8', text: 'Cryptographic SHA-256 event chaining', completed: true },
      { id: 'chk9', text: 'Geo-IP lookups caching layer', completed: true },
    ],
    comments: [], attachments: [], createdAt: d(-12), updatedAt: d(-1),
  },
  {
    id: 'task5', key: 'FSV2-105', title: 'Bulk send agreements',
    description: 'Allow document managers to send a template to multiple recipients in one operation.',
    type: 'story', status: 'todo', priority: 'medium', projectId: 'p1', sprintId: 's2', assigneeId: 'u6', reporterId: 'u3',
    storyPoints: 8, startDate: d(1), dueDate: d(10), tags: ['bulk', 'feature'],
    checklist: [
      { id: 'chk10', text: 'CSV recipient list parsing', completed: false },
      { id: 'chk11', text: 'Per-recipient custom tag merge', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-5), updatedAt: d(-5),
  },
  {
    id: 'task6', key: 'FSV2-106', title: 'Dark mode support',
    description: 'Implement system-aware and manual dark mode for the signing portal.',
    type: 'task', status: 'todo', priority: 'low', projectId: 'p1', sprintId: 's2', assigneeId: 'u6', reporterId: 'u3',
    storyPoints: 3, startDate: d(3), dueDate: d(12), tags: ['ui', 'theme'],
    checklist: [], comments: [], attachments: [], createdAt: d(-4), updatedAt: d(-4),
  },
  {
    id: 'task7', key: 'FSV2-107', title: 'Signing certificate PDF',
    description: 'Generate a verifiable PDF certificate after all parties have signed.',
    type: 'story', status: 'blocked', priority: 'high', projectId: 'p1', sprintId: 's1', assigneeId: 'u14', reporterId: 'u9',
    storyPoints: 8, startDate: d(-12), dueDate: d(3), tags: ['certificate', 'legal'],
    checklist: [
      { id: 'chk12', text: 'Certificate QR code verification link', completed: true },
      { id: 'chk13', text: 'Legal review sign-off', completed: false },
    ],
    comments: [{ id: 'c3', authorId: 'u9', body: 'Blocked on legal template approval from Claire.', createdAt: d(-3) }],
    attachments: [], createdAt: d(-12), updatedAt: d(-3),
  },
  {
    id: 'task8', key: 'FSV2-108', title: 'Optimize PDF rendering performance',
    description: 'PDF pages take 4–8 seconds to render. Target <1 second for typical 20-page documents.',
    type: 'task', status: 'todo', priority: 'high', projectId: 'p1', assigneeId: 'u5', reporterId: 'u4',
    storyPoints: 5, startDate: d(4), dueDate: d(14), tags: ['performance', 'pdf'],
    checklist: [], comments: [], attachments: [], createdAt: d(-3), updatedAt: d(-3),
  },

  // ACME Integration (p2)
  {
    id: 'task9', key: 'ACME-11', title: 'Webhook event delivery',
    description: 'Deliver signing events to ACME\'s endpoint with retry and exponential backoff.',
    type: 'story', status: 'in_progress', priority: 'high', projectId: 'p2', sprintId: 's5', assigneeId: 'u14', reporterId: 'u2',
    storyPoints: 8, startDate: d(-10), dueDate: d(3), tags: ['webhook', 'api'],
    checklist: [
      { id: 'chk14', text: 'HMAC signature verification headers', completed: true },
      { id: 'chk15', text: 'DLQ setup for 5xx responses', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-10), updatedAt: d(-1),
  },
  {
    id: 'task10', key: 'ACME-12', title: 'White-label portal branding',
    description: 'Apply ACME Corp colors, logo, and domain to the signing portal.',
    type: 'story', status: 'review', priority: 'high', projectId: 'p2', sprintId: 's5', assigneeId: 'u6', reporterId: 'u2',
    storyPoints: 5, startDate: d(-8), dueDate: d(2), tags: ['branding', 'portal'],
    checklist: [
      { id: 'chk16', text: 'Custom CNAME domain routing', completed: true },
      { id: 'chk17', text: 'Custom CSS variable injector', completed: true },
    ],
    comments: [], attachments: [], createdAt: d(-8), updatedAt: d(-2),
  },
  {
    id: 'task11', key: 'ACME-13', title: 'API rate limiting implementation',
    description: 'Enforce per-tenant rate limits for the REST API to prevent abuse.',
    type: 'task', status: 'todo', priority: 'medium', projectId: 'p2', sprintId: 's5', assigneeId: 'u4', reporterId: 'u4',
    storyPoints: 5, startDate: d(2), dueDate: d(8), tags: ['api', 'security'],
    checklist: [], comments: [], attachments: [], createdAt: d(-6), updatedAt: d(-6),
  },
  {
    id: 'task12', key: 'ACME-14', title: 'SAML Single Sign-On configuration',
    description: 'Integrate Okta SAML 2.0 identity provider for ACME enterprise signers.',
    type: 'story', status: 'done', priority: 'critical', projectId: 'p2', sprintId: 's5', assigneeId: 'u4', reporterId: 'u2',
    storyPoints: 8, startDate: d(-15), dueDate: d(-4), tags: ['sso', 'security'],
    checklist: [
      { id: 'chk18', text: 'Metadata XML exchange', completed: true },
      { id: 'chk19', text: 'Just-In-Time user provisioning', completed: true },
    ],
    comments: [], attachments: [], createdAt: d(-16), updatedAt: d(-4),
  },
  {
    id: 'task13', key: 'ACME-15', title: 'UAT testing session with ACME team',
    description: 'Coordinate user acceptance testing session and gather feedback on envelope creation.',
    type: 'task', status: 'todo', priority: 'high', projectId: 'p2', assigneeId: 'u2', reporterId: 'u10',
    storyPoints: 3, startDate: d(6), dueDate: d(12), tags: ['uat', 'testing'],
    checklist: [], comments: [], attachments: [], createdAt: d(-2), updatedAt: d(-2),
  },

  // AI Agent (p3)
  {
    id: 'task14', key: 'AIAG-21', title: 'Claude provider integration',
    description: 'Integrate Anthropic Claude API with agent runner — message formatting, tool calls, streaming.',
    type: 'story', status: 'done', priority: 'critical', projectId: 'p3', sprintId: 's3', assigneeId: 'u5', reporterId: 'u4',
    storyPoints: 13, startDate: d(-14), dueDate: d(-5), tags: ['claude', 'ai'],
    checklist: [
      { id: 'chk20', text: 'Tool use schemas for code analysis', completed: true },
      { id: 'chk21', text: 'Token usage streaming calculation', completed: true },
    ],
    comments: [], attachments: [], createdAt: d(-14), updatedAt: d(-5),
  },
  {
    id: 'task15', key: 'AIAG-22', title: 'Gemini provider integration',
    description: 'Integrate Google Gemini 2.0 Flash with the agent runner.',
    type: 'story', status: 'in_progress', priority: 'high', projectId: 'p3', sprintId: 's3', assigneeId: 'u14', reporterId: 'u4',
    storyPoints: 13, startDate: d(-7), dueDate: d(5), tags: ['gemini', 'ai'],
    checklist: [
      { id: 'chk22', text: 'Google GenAI SDK wrapper', completed: true },
      { id: 'chk23', text: 'Function calling response parser', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-14), updatedAt: d(-2),
  },
  {
    id: 'task16', key: 'AIAG-23', title: 'Agent run sandboxing',
    description: 'Execute agent code in an isolated container environment with resource limits.',
    type: 'story', status: 'todo', priority: 'critical', projectId: 'p3', assigneeId: 'u4', reporterId: 'u4',
    storyPoints: 21, startDate: d(2), dueDate: d(18), tags: ['security', 'infra'],
    checklist: [], comments: [], attachments: [], createdAt: d(-7), updatedAt: d(-7),
  },
  {
    id: 'task17', key: 'AIAG-24', title: 'Agent verification gates UI',
    description: 'Display interactive checklist showing test runs, git diff, and security scans before PR merge.',
    type: 'story', status: 'in_progress', priority: 'high', projectId: 'p3', sprintId: 's3', assigneeId: 'u6', reporterId: 'u4',
    storyPoints: 8, startDate: d(-4), dueDate: d(4), tags: ['ui', 'verification'],
    checklist: [
      { id: 'chk24', text: 'Visual diff component integration', completed: true },
      { id: 'chk25', text: 'Approval confirmation trigger', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-5), updatedAt: d(-1),
  },
  {
    id: 'task18', key: 'AIAG-25', title: 'Token spend telemetry and budget limits',
    description: 'Alert project owners when daily LLM token cost exceeds $50.',
    type: 'task', status: 'todo', priority: 'medium', projectId: 'p3', assigneeId: 'u4', reporterId: 'u8',
    storyPoints: 5, startDate: d(8), dueDate: d(16), tags: ['finops', 'ai'],
    checklist: [], comments: [], attachments: [], createdAt: d(-2), updatedAt: d(-2),
  },

  // Mobile App Beta (p4)
  {
    id: 'task19', key: 'MOB-31', title: 'Design mobile navigation architecture',
    description: 'Create wireframes and interactive prototypes for bottom bar and drawer navigation.',
    type: 'story', status: 'in_progress', priority: 'high', projectId: 'p4', sprintId: 's4', assigneeId: 'u3', reporterId: 'u3',
    storyPoints: 5, startDate: d(-5), dueDate: d(3), tags: ['ux', 'mobile'],
    checklist: [
      { id: 'chk26', text: 'Figma review with engineers', completed: true },
      { id: 'chk27', text: 'Interactive touch prototypes', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-6), updatedAt: d(-1),
  },
  {
    id: 'task20', key: 'MOB-32', title: 'Biometric authentication screen',
    description: 'Support Face ID and Touch ID fast unlock for document review.',
    type: 'story', status: 'todo', priority: 'high', projectId: 'p4', sprintId: 's4', assigneeId: 'u6', reporterId: 'u3',
    storyPoints: 5, startDate: d(5), dueDate: d(15), tags: ['mobile', 'auth'],
    checklist: [], comments: [], attachments: [], createdAt: d(-4), updatedAt: d(-4),
  },
  {
    id: 'task21', key: 'MOB-33', title: 'Offline envelope caching',
    description: 'Cache downloaded agreements locally for viewing in low connectivity environments.',
    type: 'story', status: 'todo', priority: 'medium', projectId: 'p4', sprintId: 's4', assigneeId: 'u7', reporterId: 'u3',
    storyPoints: 8, startDate: d(8), dueDate: d(22), tags: ['offline', 'cache'],
    checklist: [], comments: [], attachments: [], createdAt: d(-3), updatedAt: d(-3),
  },
  {
    id: 'task22', key: 'MOB-34', title: 'Push notification deep linking',
    description: 'Tapping a signing notification opens the document review screen directly.',
    type: 'task', status: 'todo', priority: 'medium', projectId: 'p4', sprintId: 's4', assigneeId: 'u6', reporterId: 'u7',
    storyPoints: 3, startDate: d(12), dueDate: d(20), tags: ['notifications', 'mobile'],
    checklist: [], comments: [], attachments: [], createdAt: d(-2), updatedAt: d(-2),
  },

  // Security Hardening (p5)
  {
    id: 'task23', key: 'SEC-5', title: 'Pen test remediation — XSS findings',
    description: 'Fix 3 reflected XSS vulnerabilities found in Q4 pen test report.',
    type: 'bug', status: 'in_progress', priority: 'critical', projectId: 'p5', assigneeId: 'u5', reporterId: 'u8',
    storyPoints: 8, startDate: d(-10), dueDate: d(2), tags: ['security', 'xss'],
    checklist: [
      { id: 'chk28', text: 'Sanitize query parameters in audit log view', completed: true },
      { id: 'chk29', text: 'CSP header tightening in Next.js', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-10), updatedAt: d(-1),
  },
  {
    id: 'task24', key: 'SEC-6', title: 'MFA enforcement rollout',
    description: 'Force MFA for all admin and document manager accounts organization-wide.',
    type: 'task', status: 'todo', priority: 'high', projectId: 'p5', assigneeId: 'u8', reporterId: 'u8',
    storyPoints: 5, startDate: d(1), dueDate: d(7), tags: ['mfa', 'security'],
    checklist: [], comments: [], attachments: [], createdAt: d(-8), updatedAt: d(-8),
  },
  {
    id: 'task25', key: 'SEC-7', title: 'SOC 2 Type II audit evidence collection',
    description: 'Collate pull request review records, change management tickets, and deployment logs.',
    type: 'task', status: 'in_progress', priority: 'critical', projectId: 'p5', assigneeId: 'u8', reporterId: 'u11',
    storyPoints: 13, startDate: d(-15), dueDate: d(6), tags: ['soc2', 'compliance'],
    checklist: [
      { id: 'chk30', text: 'Export GitHub approval histories', completed: true },
      { id: 'chk31', text: 'Database backup integrity test logs', completed: false },
    ],
    comments: [], attachments: [], createdAt: d(-15), updatedAt: d(-2),
  },
  {
    id: 'task26', key: 'SEC-8', title: 'Secrets scanning pipeline in CI',
    description: 'Prevent accidental commit of API keys and signing credentials using Trufflehog.',
    type: 'task', status: 'done', priority: 'high', projectId: 'p5', assigneeId: 'u4', reporterId: 'u8',
    storyPoints: 3, startDate: d(-20), dueDate: d(-12), tags: ['ci', 'security'],
    checklist: [
      { id: 'chk32', text: 'Pre-commit git hooks', completed: true },
      { id: 'chk33', text: 'GitHub Actions scanner setup', completed: true },
    ],
    comments: [], attachments: [], createdAt: d(-20), updatedAt: d(-12),
  },

  // Onboarding Redesign (p6)
  {
    id: 'task27', key: 'ONB-41', title: 'User interview synthesis',
    description: 'Synthesize findings from 12 customer onboarding feedback interviews.',
    type: 'task', status: 'done', priority: 'medium', projectId: 'p6', assigneeId: 'u3', reporterId: 'u3',
    storyPoints: 5, startDate: d(-80), dueDate: d(-60), tags: ['research', 'ux'],
    checklist: [], comments: [], attachments: [], createdAt: d(-85), updatedAt: d(-60),
  },
  {
    id: 'task28', key: 'ONB-42', title: 'Multi-step onboarding prototype',
    description: 'Build interactive stepper for workspace selection, profile creation, and preferences.',
    type: 'story', status: 'done', priority: 'high', projectId: 'p6', assigneeId: 'u6', reporterId: 'u3',
    storyPoints: 8, startDate: d(-55), dueDate: d(-30), tags: ['frontend', 'onboarding'],
    checklist: [], comments: [], attachments: [], createdAt: d(-55), updatedAt: d(-30),
  },
  {
    id: 'task29', key: 'ONB-43', title: 'Onboarding conversion funnel analytics',
    description: 'Track drop-offs across steps 1 through 4 using privacy-friendly events.',
    type: 'story', status: 'done', priority: 'medium', projectId: 'p6', assigneeId: 'u5', reporterId: 'u3',
    storyPoints: 5, startDate: d(-35), dueDate: d(-20), tags: ['analytics', 'growth'],
    checklist: [], comments: [], attachments: [], createdAt: d(-35), updatedAt: d(-20),
  },

  // Cross-project additional tasks to guarantee 34 rich items
  {
    id: 'task30', key: 'FSV2-109', title: 'Verify electronic signature legal validity in EU (eIDAS)',
    description: 'Confirm advanced electronic signature requirements and audit trail formats for European compliance.',
    type: 'task', status: 'in_progress', priority: 'high', projectId: 'p1', assigneeId: 'u9', reporterId: 'u9',
    storyPoints: 5, startDate: d(-3), dueDate: d(8), tags: ['legal', 'eidas'],
    checklist: [], comments: [], attachments: [], createdAt: d(-4), updatedAt: d(-1),
  },
  {
    id: 'task31', key: 'FSV2-110', title: 'Create interactive walkthrough guide for signers',
    description: 'Help first-time signers navigate multi-page contracts with clear highlighted steps.',
    type: 'story', status: 'todo', priority: 'medium', projectId: 'p1', assigneeId: 'u2', reporterId: 'u3',
    storyPoints: 5, startDate: d(5), dueDate: d(15), tags: ['ux', 'guide'],
    checklist: [], comments: [], attachments: [], createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: 'task32', key: 'ACME-16', title: 'Load test signing webhook endpoints',
    description: 'Simulate 500 concurrent signing completions to measure peak webhook queue latency.',
    type: 'task', status: 'todo', priority: 'medium', projectId: 'p2', assigneeId: 'u14', reporterId: 'u4',
    storyPoints: 5, startDate: d(7), dueDate: d(14), tags: ['testing', 'load'],
    checklist: [], comments: [], attachments: [], createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: 'task33', key: 'AIAG-26', title: 'Autonomous code review bot comment format',
    description: 'Standardize markdown review suggestions with line numbers and rationale.',
    type: 'story', status: 'review', priority: 'medium', projectId: 'p3', assigneeId: 'u5', reporterId: 'u4',
    storyPoints: 3, startDate: d(-5), dueDate: d(1), tags: ['ai', 'bot'],
    checklist: [], comments: [], attachments: [], createdAt: d(-6), updatedAt: d(-1),
  },
  {
    id: 'task34', key: 'MOB-35', title: 'Signature canvas stylus pressure sensitivity',
    description: 'Smooth pen curves when signing on iPad with Apple Pencil.',
    type: 'task', status: 'todo', priority: 'low', projectId: 'p4', assigneeId: 'u7', reporterId: 'u3',
    storyPoints: 3, startDate: d(10), dueDate: d(24), tags: ['mobile', 'stylus'],
    checklist: [], comments: [], attachments: [], createdAt: d(-1), updatedAt: d(-1),
  },
];

// ── Project Files ─────────────────────────────────────────────────────────────
export const MOCK_PROJECT_FILES: ProjectFile[] = [
  { id: 'f1', name: 'FlashSign_v2_Architecture_Spec.pdf', type: 'pdf', size: '3.4 MB', projectId: 'p1', uploadedBy: 'u4', createdAt: d(-25) },
  { id: 'f2', name: 'Signing_Canvas_UX_Specs.figma', type: 'figma', size: '18.2 MB', projectId: 'p1', taskId: 'task1', uploadedBy: 'u3', createdAt: d(-14) },
  { id: 'f3', name: 'ACME_REST_OpenAPI_v3.json', type: 'code', size: '240 KB', projectId: 'p2', taskId: 'task9', uploadedBy: 'u14', createdAt: d(-8) },
  { id: 'f4', name: 'ACME_Branding_Guidelines.pdf', type: 'pdf', size: '5.1 MB', projectId: 'p2', taskId: 'task10', uploadedBy: 'u10', createdAt: d(-7) },
  { id: 'f5', name: 'Claude_Agent_Evaluation_Matrix.xlsx', type: 'doc', size: '890 KB', projectId: 'p3', taskId: 'task14', uploadedBy: 'u5', createdAt: d(-10) },
  { id: 'f6', name: 'Q4_Penetration_Testing_Summary.pdf', type: 'pdf', size: '2.1 MB', projectId: 'p5', taskId: 'task23', uploadedBy: 'u11', createdAt: d(-15) },
  { id: 'f7', name: 'Mobile_Navigation_Wireframes.png', type: 'image', size: '1.4 MB', projectId: 'p4', taskId: 'task19', uploadedBy: 'u3', createdAt: d(-4) },
  { id: 'f8', name: 'Customer_Research_Interview_Notes.zip', type: 'archive', size: '12.6 MB', projectId: 'p6', taskId: 'task27', uploadedBy: 'u3', createdAt: d(-75) },
];

// ── Agent Runs ────────────────────────────────────────────────────────────────
export const MOCK_AGENT_RUNS: AgentRun[] = [
  {
    id: 'run1', taskId: 'task11', agentProviderId: 'ap1', status: 'completed',
    startedAt: d(-6), completedAt: d(-6), triggeredBy: 'u5',
    events: [
      { timestamp: d(-6), type: 'info', message: 'Agent initialized with task context' },
      { timestamp: d(-6), type: 'info', message: 'Reading task FSV2-101 description and acceptance criteria' },
      { timestamp: d(-6), type: 'code', message: 'Generated integration module', detail: 'src/lib/claude-provider.ts created (287 lines)' },
      { timestamp: d(-6), type: 'success', message: 'Unit tests passing — 24/24 test cases' },
      { timestamp: d(-6), type: 'success', message: 'PR #142 created for review' },
    ],
    output: 'Created `claude-provider.ts` with streaming support, tool call handling, and retry logic. All tests passing. PR submitted for review.',
    tokensUsed: 18420, costEstimate: 0.55,
    verificationChecks: [
      { id: 'vc1', label: 'Unit tests passing', status: 'passed' },
      { id: 'vc2', label: 'PR created and linked', status: 'passed' },
      { id: 'vc3', label: 'No secrets in diff', status: 'passed' },
      { id: 'vc4', label: 'Human code review approved', status: 'passed' },
    ],
    approvedBy: 'u4', approvedAt: d(-5),
  },
  {
    id: 'run2', taskId: 'task12', agentProviderId: 'ap3', status: 'running',
    startedAt: d(-1), triggeredBy: 'u14',
    events: [
      { timestamp: d(-1), type: 'info', message: 'Agent initialized' },
      { timestamp: d(-1), type: 'info', message: 'Reading Gemini API documentation' },
      { timestamp: d(-1), type: 'code', message: 'Scaffolding provider module' },
      { timestamp: d(-1), type: 'info', message: 'Running integration tests...' },
    ],
    tokensUsed: 5210, costEstimate: 0.12,
    verificationChecks: [
      { id: 'vc5', label: 'Unit tests passing', status: 'pending' },
      { id: 'vc6', label: 'PR created and linked', status: 'pending' },
      { id: 'vc7', label: 'No secrets in diff', status: 'pending' },
      { id: 'vc8', label: 'Human code review approved', status: 'pending' },
    ],
  },
  {
    id: 'run3', taskId: 'task2', agentProviderId: 'ap1', status: 'needs_review',
    startedAt: d(-2), completedAt: d(-2), triggeredBy: 'u5',
    events: [
      { timestamp: d(-2), type: 'info', message: 'Analyzing PDF document structure' },
      { timestamp: d(-2), type: 'info', message: 'Running NLP field detection pipeline' },
      { timestamp: d(-2), type: 'warning', message: 'Confidence below threshold for 2 fields — manual review recommended' },
      { timestamp: d(-2), type: 'success', message: 'Field annotations generated' },
    ],
    output: 'Detected 14 signature fields, 8 date fields, 3 initials fields. 2 fields flagged as low-confidence.',
    tokensUsed: 9840, costEstimate: 0.28,
    verificationChecks: [
      { id: 'vc9',  label: 'Detection accuracy ≥85%', status: 'failed', detail: 'Accuracy at 78% on test set' },
      { id: 'vc10', label: 'PR created and linked', status: 'passed' },
      { id: 'vc11', label: 'No secrets in diff', status: 'passed' },
      { id: 'vc12', label: 'Human code review approved', status: 'pending' },
    ],
  },
];

// ── Documents ─────────────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc1', title: 'ACME Corp Master Services Agreement', type: 'contract', status: 'pending',
    projectId: 'p2', ownerId: 'u9',
    signers: [
      { id: 'sg1', name: 'David Osei', email: 'david@flashsign.io', role: 'Vendor', status: 'signed', signedAt: d(-3) },
      { id: 'sg2', name: 'Claire Dupont', email: 'claire@acmecorp.com', role: 'Client', status: 'pending' },
    ],
    approvers: ['u2', 'u1'],
    dueDate: d(7), pages: 24, notes: 'MSA for 2-year engagement. Legal reviewed on Oct 15.',
    auditEvents: [
      { id: 'ae1', documentId: 'doc1', actorId: 'u9', actorName: 'David Osei', action: 'Document created', timestamp: d(-5) },
      { id: 'ae2', documentId: 'doc1', actorId: 'u9', actorName: 'David Osei', action: 'Sent for signature', timestamp: d(-3) },
      { id: 'ae3', documentId: 'doc1', actorId: 'u9', actorName: 'David Osei', action: 'Signed by David Osei', timestamp: d(-3) },
    ],
    createdAt: d(-5), updatedAt: d(-3),
  },
  {
    id: 'doc2', title: 'Flash Sign — NDA with Acme Corp', type: 'nda', status: 'signed',
    projectId: 'p2', ownerId: 'u9',
    signers: [
      { id: 'sg3', name: 'Aria Chen', email: 'aria@flashsign.io', role: 'Company Rep', status: 'signed', signedAt: d(-25) },
      { id: 'sg4', name: 'Claire Dupont', email: 'claire@acmecorp.com', role: 'Client', status: 'signed', signedAt: d(-24) },
    ],
    approvers: ['u1'],
    signedDate: d(-24), pages: 6,
    auditEvents: [
      { id: 'ae4', documentId: 'doc2', actorId: 'u9', actorName: 'David Osei', action: 'Document created', timestamp: d(-28) },
      { id: 'ae5', documentId: 'doc2', actorId: 'u1', actorName: 'Aria Chen', action: 'Signed by Aria Chen', timestamp: d(-25) },
      { id: 'ae6', documentId: 'doc2', actorId: 'u10', actorName: 'Claire Dupont', action: 'Signed by Claire Dupont', timestamp: d(-24) },
    ],
    createdAt: d(-28), updatedAt: d(-24),
  },
  {
    id: 'doc3', title: 'Software Development SOW — Phase 2', type: 'sow', status: 'in_review',
    projectId: 'p1', ownerId: 'u9',
    signers: [
      { id: 'sg5', name: 'Aria Chen', email: 'aria@flashsign.io', role: 'CEO', status: 'pending' },
      { id: 'sg6', name: 'Marcus Webb', email: 'marcus@flashsign.io', role: 'PM', status: 'pending' },
    ],
    approvers: ['u1', 'u2'],
    dueDate: d(5), pages: 18,
    auditEvents: [
      { id: 'ae7', documentId: 'doc3', actorId: 'u9', actorName: 'David Osei', action: 'Document created', timestamp: d(-4) },
      { id: 'ae8', documentId: 'doc3', actorId: 'u9', actorName: 'David Osei', action: 'Submitted for approval', timestamp: d(-3) },
    ],
    createdAt: d(-4), updatedAt: d(-3),
  },
  {
    id: 'doc4', title: 'Q4 Security Assessment Agreement', type: 'contract', status: 'draft',
    projectId: 'p5', ownerId: 'u9',
    signers: [],
    approvers: [],
    dueDate: d(14), pages: 10,
    auditEvents: [
      { id: 'ae9', documentId: 'doc4', actorId: 'u9', actorName: 'David Osei', action: 'Document created', timestamp: d(-1) },
    ],
    createdAt: d(-1), updatedAt: d(-1),
  },
  {
    id: 'doc5', title: 'Freelance Design Contract — Onboarding', type: 'contract', status: 'signed',
    projectId: 'p6', ownerId: 'u9',
    signers: [
      { id: 'sg7', name: 'Sofia Reyes', email: 'sofia@flashsign.io', role: 'Product Lead', status: 'signed', signedAt: d(-75) },
      { id: 'sg8', name: 'Studio Noir', email: 'hello@studionoir.design', role: 'Contractor', status: 'signed', signedAt: d(-74) },
    ],
    approvers: [],
    signedDate: d(-74), pages: 8,
    auditEvents: [
      { id: 'ae10', documentId: 'doc5', actorId: 'u9', actorName: 'David Osei', action: 'Document created', timestamp: d(-78) },
      { id: 'ae11', documentId: 'doc5', actorId: 'u3', actorName: 'Sofia Reyes', action: 'Signed', timestamp: d(-75) },
    ],
    createdAt: d(-78), updatedAt: d(-74),
  },
];

// ── Approval Requests ─────────────────────────────────────────────────────────
export const MOCK_APPROVALS: ApprovalRequest[] = [
  { id: 'apr1', documentId: 'doc1', requestedBy: 'u9', assignedTo: 'u2', status: 'pending', createdAt: d(-3) },
  { id: 'apr2', documentId: 'doc1', requestedBy: 'u9', assignedTo: 'u1', status: 'pending', createdAt: d(-3) },
  { id: 'apr3', documentId: 'doc3', requestedBy: 'u9', assignedTo: 'u1', status: 'pending', createdAt: d(-3) },
  { id: 'apr4', documentId: 'doc3', requestedBy: 'u9', assignedTo: 'u2', status: 'approved', comment: 'LGTM — numbers look good.', createdAt: d(-3), resolvedAt: d(-2) },
  { id: 'apr5', documentId: 'doc2', requestedBy: 'u9', assignedTo: 'u1', status: 'approved', createdAt: d(-28), resolvedAt: d(-27) },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u5', title: 'Task assigned', body: 'FSV2-102: AI field auto-detection assigned to you', type: 'task', isRead: false, link: '/tasks/task2', createdAt: d(-14) },
  { id: 'n2', userId: 'u5', title: 'Agent run completed', body: 'Agent run for AIAG-21 needs your review', type: 'agent', isRead: false, link: '/ai-agents/runs/run3', createdAt: d(-2) },
  { id: 'n3', userId: 'u2', title: 'Approval requested', body: 'ACME Corp MSA needs your approval', type: 'approval', isRead: false, link: '/approvals', createdAt: d(-3) },
  { id: 'n4', userId: 'u1', title: 'Approval requested', body: 'ACME Corp MSA needs your approval', type: 'approval', isRead: false, link: '/approvals', createdAt: d(-3) },
  { id: 'n5', userId: 'u7', title: 'Task ready for testing', body: 'FSV2-101 moved to Review — please test', type: 'task', isRead: true, link: '/tasks/task1', createdAt: d(-2) },
];

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', actorId: 'u9', actorName: 'David Osei', action: 'document.created', resource: 'Document', resourceId: 'doc1', detail: 'ACME Corp MSA', ipAddress: '102.89.3.12', timestamp: d(-5) },
  { id: 'al2', actorId: 'u9', actorName: 'David Osei', action: 'document.sent', resource: 'Document', resourceId: 'doc1', detail: 'Sent to 2 signers', ipAddress: '102.89.3.12', timestamp: d(-3) },
  { id: 'al3', actorId: 'u5', actorName: 'Priya Nair', action: 'agent.run.started', resource: 'AgentRun', resourceId: 'run3', detail: 'Claude on FSV2-102', ipAddress: '192.168.1.5', timestamp: d(-2) },
  { id: 'al4', actorId: 'u8', actorName: 'Rachel Kim', action: 'user.invited', resource: 'User', resourceId: 'u10', detail: 'claire@acmecorp.com', ipAddress: '10.0.0.1', timestamp: d(-30) },
  { id: 'al5', actorId: 'u13', actorName: 'CI/CD Bot', action: 'integration.sync', resource: 'Integration', resourceId: 'int1', detail: 'GitHub sync — 3 repos updated', ipAddress: '10.0.1.99', timestamp: d(-1) },
  { id: 'al6', actorId: 'u4', actorName: 'James Okafor', action: 'agent.run.approved', resource: 'AgentRun', resourceId: 'run1', detail: 'Approved AIAG-21 Claude run', ipAddress: '192.168.1.4', timestamp: d(-5) },
  { id: 'al7', actorId: 'u8', actorName: 'Rachel Kim', action: 'settings.mfa.updated', resource: 'Settings', resourceId: 'org1', detail: 'MFA required for admins', ipAddress: '10.0.0.1', timestamp: d(-10) },
];

// ── Integrations ──────────────────────────────────────────────────────────────
export const MOCK_INTEGRATIONS: Integration[] = [
  { id: 'int1', name: 'GitHub', category: 'vcs', status: 'connected', connectedBy: 'u8', connectedAt: d(-60), description: 'Sync repositories and link commits to tasks.' },
  { id: 'int2', name: 'GitLab', category: 'vcs', status: 'disconnected', description: 'Connect GitLab repositories and MRs.' },
  { id: 'int3', name: 'Google Calendar', category: 'calendar', status: 'connected', connectedBy: 'u8', connectedAt: d(-45), description: 'Sync sprint milestones and due dates.' },
  { id: 'int4', name: 'Anthropic (Claude)', category: 'ai', status: 'connected', connectedBy: 'u4', connectedAt: d(-30), description: 'Run Claude AI agents on development tasks.' },
  { id: 'int5', name: 'OpenAI (Codex)', category: 'ai', status: 'disconnected', description: 'Use OpenAI Codex for code generation tasks.' },
  { id: 'int6', name: 'Google (Gemini)', category: 'ai', status: 'error', connectedBy: 'u4', connectedAt: d(-5), description: 'Run Gemini agents — API key rotation needed.' },
  { id: 'int7', name: 'Google Drive', category: 'storage', status: 'connected', connectedBy: 'u9', connectedAt: d(-50), description: 'Store and retrieve document files.' },
  { id: 'int8', name: 'Slack', category: 'communication', status: 'connected', connectedBy: 'u8', connectedAt: d(-55), description: 'Send notifications and alerts to channels.' },
];
