// ─── User & Roles ───────────────────────────────────────────────────────────

export type DemoRole =
  | 'ceo'
  | 'project_manager'
  | 'product_owner'
  | 'engineering_lead'
  | 'developer'
  | 'qa_tester'
  | 'org_admin'
  | 'document_manager'
  | 'client'
  | 'auditor'
  | 'platform_admin'
  | 'integration_service';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: DemoRole;
  department?: string;
  title?: string;
  color: string;
  isActive: boolean;
  teamIds?: string[];
  projectIds?: string[];
  timeZone?: string;
  workingHours?: string;
  skills?: string[];
  availability?: 'available' | 'busy' | 'focus_time' | 'out_of_office';
  weeklyCapacity?: number;
  /** Profile details edited in Settings > Profile */
  company?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

// ─── Organization ───────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  memberCount: number;
  logoUrl?: string;
  createdAt: string;
}

// ─── Projects ───────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type ProjectHealth = 'on_track' | 'at_risk' | 'off_track' | 'delayed';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type TimelineStatus = 'on_schedule' | 'extended' | 'shortened' | 'completed';

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerId: string;
  teamIds: string[];
  memberIds: string[];
  startDate: string;
  endDate: string;
  dueDate?: string;
  progress: number; // 0–100
  priority: ProjectPriority;
  tags: string[];
  category?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  icon?: string;
  accentColor?: string;
  goals?: string[];
  group?: string;
  createdAt: string;
  updatedAt: string;
  // Timeline management (Original vs Current Calculated)
  originalStartDate?: string;
  originalEndDate?: string;
  originalDuration?: number; // calendar days
  currentStartDate?: string;
  currentEndDate?: string;
  currentDuration?: number; // calendar days
  timelineDifference?: number; // calendar days diff (positive = extended, negative = shortened)
  timelineStatus?: TimelineStatus;
  totalWorkDays?: number; // sum of estimated work durations, distinguished from calendar span
}

// ─── Teams ──────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  color: string;
  department?: string;
  category?: string;
  goals?: string[];
  status?: 'active' | 'archived';
  projectIds?: string[];
  icon?: string;
  createdAt: string;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'story' | 'bug' | 'task' | 'epic' | 'subtask';

export interface TaskComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  key: string; // e.g. "FS-42"
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  reporterId: string;
  parentId?: string;
  milestoneId?: string;
  estimatedDuration?: number; // Duration in calendar/work days
  storyPoints?: number;
  points?: number;
  startDate?: string;
  dueDate?: string;
  tags: string[];
  labels?: string[];
  comments: TaskComment[];
  attachments: string[];
  checklist?: TaskChecklistItem[];
  acceptanceCriteria?: string;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  sourceSection?: string;
  isSrsGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory = 'srs' | 'test_report' | 'doc' | 'other';
export type FileAnalysisStatus = 'not_analyzed' | 'analyzed' | 'tasks_created';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'figma' | 'archive' | 'image' | 'code' | string;
  size: string;
  projectId: string;
  taskId?: string;
  uploadedBy: string;
  createdAt: string;
  category?: DocumentCategory;
  analysisStatus?: FileAnalysisStatus;
  analyzedAt?: string;
  tasksGeneratedCount?: number;
}

export type SrsReviewOutcome = 'accepted' | 'rejected';

export interface SrsGeneratedTaskRecord {
  id: string;
  originalId?: string;
  projectTaskId?: string;
  projectTaskKey?: string;
  fileId: string;
  fileName: string;
  projectId: string;
  projectName?: string;
  title: string;
  originalTitle?: string;
  description: string;
  originalDescription?: string;
  acceptanceCriteria?: string;
  originalAcceptanceCriteria?: string;
  priority: TaskPriority;
  originalPriority?: TaskPriority;
  type: TaskType;
  originalType?: TaskType;
  sourceSection: string;
  points?: number;
  tags?: string[];
  isEdited: boolean;
  outcome: SrsReviewOutcome;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
}


// ─── Sprints ─────────────────────────────────────────────────────────────────

export type SprintStatus = 'planned' | 'planning' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  status: SprintStatus;
  goal?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  createdAt: string;
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  dueDate: string;
  status: 'upcoming' | 'at_risk' | 'completed' | 'missed' | 'pending' | 'achieved';
  progress?: number;
  taskIds?: string[];
  estimatedDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── AI Agents ───────────────────────────────────────────────────────────────

export type AgentProviderType = 'claude' | 'codex' | 'gemini';
export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'needs_review';

export interface AgentProvider {
  id: string;
  name: string;
  provider: AgentProviderType;
  model: string;
  isConfigured: boolean;
  isEnabled: boolean;
  scope: string[];
  color: string;
}

export interface AgentRunEvent {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'code';
  message: string;
  detail?: string;
}

export interface AgentRun {
  id: string;
  taskId: string;
  agentProviderId: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  events: AgentRunEvent[];
  output?: string;
  tokensUsed?: number;
  costEstimate?: number;
  verificationChecks: VerificationCheck[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface VerificationCheck {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'failed';
  detail?: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentStatus = 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'signed' | 'expired';
export type SignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';

export interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: SignerStatus;
  signedAt?: string;
}

export interface DocumentAuditEvent {
  id: string;
  documentId: string;
  actorId: string;
  actorName: string;
  action: string;
  detail?: string;
  timestamp: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'nda' | 'contract' | 'sow' | 'proposal' | 'amendment' | 'other';
  status: DocumentStatus;
  projectId?: string;
  ownerId: string;
  signers: Signer[];
  approvers: string[];
  dueDate?: string;
  signedDate?: string;
  pages: number;
  fileUrl?: string;
  notes?: string;
  auditEvents: DocumentAuditEvent[];
  createdAt: string;
  updatedAt: string;
}

// ─── Approval Requests ───────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface ApprovalRequest {
  id: string;
  documentId: string;
  requestedBy: string;
  assignedTo: string;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'task' | 'document' | 'agent' | 'approval' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId: string;
  detail?: string;
  ipAddress?: string;
  timestamp: string;
}

// ─── Integration ─────────────────────────────────────────────────────────────

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  name: string;
  category: 'vcs' | 'calendar' | 'ai' | 'storage' | 'communication';
  status: IntegrationStatus;
  connectedBy?: string;
  connectedAt?: string;
  logoUrl?: string;
  description: string;
}

export * from './collaboration';
export * from './documents';

// ─── AI Agent Connection (MCP) ──────────────────────────────────────────────

/** A personal access token a person uses to connect their AI agent to the PM platform.
 *  Only the last four characters are kept; the full token is shown once at creation. */
export interface AgentAccessToken {
  id: string;
  userId: string;
  name: string;
  lastFour: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
  /** When each agent last used this token. Agents identify themselves when they connect
   *  (MCP client info), so one token per computer serves all of them. */
  usedBy?: Partial<Record<AgentClient, string>>;
  revokedAt?: string;
}

/** AI coding agents that can connect to the PM platform through the MCP server */
export type AgentClient = 'claude_code' | 'codex' | 'gemini_cli' | 'antigravity';

/** One block of time on one task. One open session per person, whichever agent started it. */
export interface WorkSession {
  id: string;
  userId: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  /** Agent that started it; 'web' = started in the web app, 'manual' = typed-in time */
  source: AgentClient | 'web' | 'manual';
  endReason?: 'paused' | 'finished' | 'switched_task' | 'idle_timeout' | 'day_cutoff';
  /** Auto-stopped sessions the person should check */
  needsReview?: boolean;
  note?: string;
}

/** A card moving between board columns; In Progress -> In Review gives the task's time */
export interface TaskStatusChange {
  id: string;
  taskId: string;
  from: TaskStatus;
  to: TaskStatus;
  at: string;
  /** Who moved it (for an agent, the person it works for) */
  byUserId: string;
  via: AgentClient | 'web';
}

export type AgentEventAction =
  | 'listed_tasks'
  | 'started'
  | 'continued'
  | 'paused'
  | 'note'
  | 'finished'
  | 'time_logged'
  | 'auto_stopped';

/** Something an agent did for a person (shown in My Agent Activity and the task history) */
export interface AgentEvent {
  id: string;
  userId: string;
  taskId?: string;
  agent: AgentClient | 'system';
  action: AgentEventAction;
  detail?: string;
  at: string;
}

/** Organisation-wide rules for AI agent connections (AI Agent Hub > Organisation) */
export interface AgentSettings {
  enabled: boolean;
  allowedAgents: Record<AgentClient, boolean>;
  idleTimeoutMinutes: number;
  dayCutoff: string; // "20:00"
  allowClaimUnassigned: boolean;
  /** Projects whose data may NOT be sent to AI providers */
  blockedProjectIds: string[];
}
