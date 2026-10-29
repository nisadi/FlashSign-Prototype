'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  DemoRole, User, Project, Task, Sprint, Document, ApprovalRequest,
  Notification, AuditLog, AgentRun, Milestone, Team, ProjectFile,
  CalendarEvent, TimeOffRequest, Meeting, Announcement, CollaborationSettings,
  AvailabilityStatus, LeaveType, EventCategory, SrsGeneratedTaskRecord, AgentAccessToken,
  AgentClient, AgentEvent, AgentSettings, WorkSession, TaskStatus, TaskStatusChange, BoardColumn, Epic, Story, ProjectStructure,
} from '@/types';
import {
  MOCK_USERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_SPRINTS, MOCK_DOCUMENTS,
  MOCK_APPROVALS, MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS, MOCK_AGENT_RUNS,
  MOCK_MILESTONES, MOCK_TEAMS, MOCK_PROJECT_FILES, DEMO_ROLE_USERS, MOCK_ORG, MOCK_EPICS, MOCK_STORIES,
  INITIAL_SRS_TASK_HISTORY,
} from '@/data/mock-data';
import {
  MOCK_CALENDAR_EVENTS, MOCK_TIME_OFF, MOCK_MEETINGS, MOCK_ANNOUNCEMENTS,
  MOCK_COLLABORATION_SETTINGS,
} from '@/data/mock-collaboration';
import {
  MOCK_DOCUMENT_ITEMS, MOCK_FOLDERS, MOCK_TEMPLATES, MOCK_CONTRACTS,
  MOCK_SIGNATURE_REQUESTS,
} from '@/data/mock-documents';
import type {
  DocumentItem, DocumentFolder, DocumentTemplate, Contract,
  SignatureRequest, SignatureSigner, SignatureField, AuditEvent,
  DocumentComment, ContractReviewComment,
  SavedSignature, SigningDefaults, CompanySeal,
} from '@/types/documents';
import { DEFAULT_SIGNING_DEFAULTS, MOCK_COMPANY_SEALS } from '@/data/mock-signing';
import { MOCK_WORK_SESSIONS, MOCK_AGENT_EVENTS, DEFAULT_AGENT_SETTINGS, MOCK_AGENT_TOKENS, MOCK_STATUS_CHANGES } from '@/data/mock-agent-activity';
import { applyAutoStops } from '@/lib/task-time';
import {
  MAIN_BOARD_ID, boardColumnsFor, boardOfTask, boardsSharingColumns, columnOfTask, projectBoards,
} from '@/lib/board-columns';
import { ROLE_CONFIGS } from '@/lib/permissions';
import { FEATURES, FIXED_DEMO_ROLE } from '@/lib/features';
import type { Organization } from '@/types';
import { useDemoAuth } from '@/context/demo-auth-context';
import { calculateProjectTimeline, diffCalendarDays } from '@/lib/timeline-calculator';
import { hasSubtasks, progressOf, progressOfTasks } from '@/lib/subtasks';
import { resolvePlan, type PlanLinks } from '@/lib/plan';
import { projectStructure } from '@/lib/structure';

// ── State Shape ────────────────────────────────────────────────────────────────
export type CreateProjectInput = Partial<Project> & { name: string };
export type CreateTaskInput = Partial<Task> & { title: string; projectId: string };
export type CreateSprintInput = Partial<Sprint> & { name: string; projectId: string };
export type CreateMilestoneInput = Partial<Milestone> & { name: string; projectId: string };
export type CreateEpicInput = Partial<Epic> & { name: string; projectId: string };
export type CreateStoryInput = Partial<Story> & { title: string; projectId: string };
export type CreateFileInput = Partial<ProjectFile> & { name: string; projectId: string };
export type CreateTeamInput = Partial<Team> & { name: string };
export type CreateMemberInput = Partial<User> & { name: string; email: string };
export type CreateCalendarEventInput = Partial<CalendarEvent> & { title: string; category: EventCategory; startDate: string; endDate: string };
export type CreateTimeOffInput = Partial<TimeOffRequest> & { memberId: string; leaveType: LeaveType; startDate: string; endDate: string; durationDays: number };
export type CreateMeetingInput = Partial<Meeting> & { title: string; date: string; startTime: string; endTime: string };
export type CreateAnnouncementInput = Partial<Announcement> & { title: string; content: string };

export interface AppState {
  demoRole: DemoRole;
  currentUserId: string;
  org: Organization;
  users: User[];
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  milestones: Milestone[];
  /** Plan levels between phases (milestones) and tasks */
  epics: Epic[];
  stories: Story[];
  teams: Team[];
  files: ProjectFile[];
  documents: Document[];
  documentItems: DocumentItem[];
  documentFolders: DocumentFolder[];
  documentTemplates: DocumentTemplate[];
  contracts: Contract[];
  signatureRequests: SignatureRequest[];
  approvals: ApprovalRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  activities: AuditLog[];
  agentRuns: AgentRun[];
  calendarEvents: CalendarEvent[];
  timeOffRequests: TimeOffRequest[];
  meetings: Meeting[];
  announcements: Announcement[];
  collaborationSettings: CollaborationSettings;
  savedSignatures: SavedSignature[];
  signingDefaults: SigningDefaults;
  companySeals: CompanySeal[];
  agentTokens: AgentAccessToken[];
  workSessions: WorkSession[];
  agentEvents: AgentEvent[];
  agentSettings: AgentSettings;
  taskStatusChanges: TaskStatusChange[];
  sidebarCollapsed: boolean;
  recentProjectIds: string[];
  activeTaskDrawerId: string | null;
  srsTaskHistories: Record<string, SrsGeneratedTaskRecord[]>;
}

const AGENT_LABEL: Record<AgentClient, string> = {
  claude_code: 'Claude Code',
  codex: 'Codex',
  gemini_cli: 'Gemini CLI',
  antigravity: 'Antigravity',
};

function agentEvent(
  userId: string,
  agent: AgentEvent['agent'],
  action: AgentEvent['action'],
  taskId?: string,
  detail?: string
): AgentEvent {
  return { id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, userId, taskId, agent, action, detail, at: new Date().toISOString() };
}

function statusChange(
  taskId: string, from: TaskStatus, to: TaskStatus, byUserId: string, via: TaskStatusChange['via'], at: string,
  boardMove?: BoardMove
): TaskStatusChange {
  return {
    id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, taskId, from, to, at, byUserId, via,
    ...(boardMove && { fromBoardId: boardMove.from, toBoardId: boardMove.to }),
  };
}

type BoardMove = { from: string; to: string };

/**
 * A card moved on the board (or in a task view). Moving into In Progress starts the worker's
 * timer (pausing any other one they have running); moving out of In Progress stops it,
 * as finished when it goes to In Review / Done. Moving to another board starts a new timer
 * there, so time splits by board. Every move is recorded for Reports > Task time.
 */
function trackStatusMove(
  s: AppState, task: Task, to: TaskStatus, now: string, boardMove?: BoardMove
): Pick<AppState, 'workSessions' | 'taskStatusChanges'> {
  const from = task.status;
  const workerId = task.assigneeId ?? s.currentUserId;
  let workSessions = s.workSessions;

  if (from === 'in_progress' && (to !== 'in_progress' || boardMove)) {
    const endReason = to === 'review' || to === 'done' ? ('finished' as const) : ('paused' as const);
    workSessions = workSessions.map(w =>
      w.taskId === task.id && !w.endedAt ? { ...w, endedAt: now, lastActivityAt: now, endReason } : w
    );
  }
  // A task with subtasks is a container: moving it only marks it started; people time its subtasks
  const container = hasSubtasks(task.id, s.tasks);
  if (to === 'in_progress' && !container && !workSessions.some(w => w.userId === workerId && w.taskId === task.id && !w.endedAt)) {
    workSessions = [
      ...workSessions.map(w =>
        w.userId === workerId && !w.endedAt ? { ...w, endedAt: now, lastActivityAt: now, endReason: 'switched_task' as const } : w
      ),
      { id: `ws-${Date.now()}`, userId: workerId, taskId: task.id, startedAt: now, lastActivityAt: now, source: 'web' },
    ];
  }
  return {
    workSessions,
    taskStatusChanges: [...s.taskStatusChanges, statusChange(task.id, from, to, s.currentUserId, 'web', now, boardMove)],
  };
}

/**
 * Change a project's boards and re-place its cards to match. Cards follow `columnMoves` out of
 * removed columns (only on the boards in `columnBoards`) and `boardMoves` out of removed boards;
 * otherwise they keep their column, or take the first column of their stage.
 */
function relayoutProject(
  s: AppState,
  projectId: string,
  change: (p: Project) => Project,
  opts: { columnMoves?: Record<string, string>; columnBoards?: string[]; boardMoves?: Record<string, string> } = {}
): AppState {
  const project = s.projects.find(p => p.id === projectId);
  if (!project) return s;
  const now = new Date().toISOString();
  const nextProject = change(project);
  const before = projectBoards(project);
  const after = projectBoards(nextProject);
  let timing: Pick<AppState, 'workSessions' | 'taskStatusChanges'> = {
    workSessions: s.workSessions,
    taskStatusChanges: s.taskStatusChanges,
  };

  const nextTasks = s.tasks.map(t => {
    if (t.projectId !== projectId) return t;
    const fromBoard = boardOfTask(t, before);
    const fromColumn = columnOfTask(t, fromBoard.columns);
    const board = after.find(b => b.id === (opts.boardMoves?.[fromBoard.id] ?? fromBoard.id)) ?? after[0];
    const movedTo = fromColumn && opts.columnBoards?.includes(fromBoard.id) ? opts.columnMoves?.[fromColumn.id] : undefined;
    const column = board.columns.find(c => c.id === (movedTo ?? fromColumn?.id)) ?? columnOfTask({ status: t.status }, board.columns);
    if (!column) return t;

    const nowOn = boardOfTask(t, after);
    if (nowOn.id === board.id && columnOfTask(t, nowOn.columns)?.id === column.id) return t;
    const boardMove = board.id !== fromBoard.id ? { from: fromBoard.id, to: board.id } : undefined;
    if (column.status !== t.status || boardMove) {
      timing = trackStatusMove({ ...s, ...timing }, t, column.status, now, boardMove);
    }
    return { ...t, boardId: board.id, columnId: column.id, status: column.status, updatedAt: now };
  });

  return {
    ...s,
    ...timing,
    tasks: nextTasks,
    projects: s.projects.map(p =>
      p.id === projectId ? { ...nextProject, progress: progressOf(nextTasks, projectId), updatedAt: now } : p
    ),
  };
}

/**
 * A subtask moved into In Progress: if its task is still in To Do, the task card moves to the
 * first In Progress column of its board. The task gets no timer; the subtask's timer runs.
 */
function startParentOf(
  s: AppState, subtaskId: string, now: string, via: TaskStatusChange['via']
): Pick<AppState, 'tasks' | 'taskStatusChanges'> {
  const sub = s.tasks.find(t => t.id === subtaskId);
  const parent = sub?.parentId ? s.tasks.find(t => t.id === sub.parentId) : undefined;
  if (!parent || parent.status !== 'todo') return { tasks: s.tasks, taskStatusChanges: s.taskStatusChanges };
  const board = boardOfTask(parent, projectBoards(s.projects.find(p => p.id === parent.projectId)));
  const column = board.columns.find(c => c.status === 'in_progress');
  return {
    tasks: s.tasks.map(t => (t.id === parent.id ? { ...t, status: 'in_progress' as const, columnId: column?.id, updatedAt: now } : t)),
    taskStatusChanges: [...s.taskStatusChanges, statusChange(parent.id, 'todo', 'in_progress', s.currentUserId, via, now)],
  };
}

/**
 * The next key for a new task: the project's key and the next number (FSV2-112), or for a
 * subtask its task's key and the next number (FSV2-105-3).
 */
function nextTaskKey(tasks: Task[], projects: Project[], projectId: string, parentId?: string): string {
  if (parentId) {
    const parent = tasks.find(t => t.id === parentId);
    if (parent) {
      const nums = tasks.filter(t => t.parentId === parentId).map(t => Number(t.key.slice(parent.key.length + 1))).filter(n => Number.isFinite(n));
      return `${parent.key}-${Math.max(0, ...nums) + 1}`;
    }
  }
  const prefix = projects.find(p => p.id === projectId)?.key ?? 'TASK';
  const nums = tasks
    .filter(t => t.projectId === projectId && !t.parentId && t.key.startsWith(`${prefix}-`))
    .map(t => Number(t.key.slice(prefix.length + 1)))
    .filter(n => Number.isFinite(n));
  return `${prefix}-${Math.max(0, ...nums) + 1}`;
}

/** Re-derive the plan links of the tasks that match, after an epic or story changed */
function relinkTasks(tasks: Task[], affected: (t: Task) => boolean, epics: Epic[], stories: Story[]): Task[] {
  return tasks.map(t => (affected(t) ? { ...t, ...resolvePlan(t, epics, stories) } : t));
}

const withExtraBoards = (p: Project, map: (boards: NonNullable<Project['extraBoards']>) => Project['extraBoards']): Project => ({
  ...p,
  extraBoards: map(p.extraBoards ?? []),
});

// ── Actions ────────────────────────────────────────────────────────────────────
interface AppActions {
  setDemoRole: (role: DemoRole) => void;
  // Projects
  addProject: (project: CreateProjectInput) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  /**
   * Replace one board's columns. Cards in a removed column go to the column named in `moves`
   * (removed column id → target column id); a card whose column now counts as a different
   * stage changes status, with the usual timer handling. Editing the main board also changes
   * the boards that mirror it; editing a mirroring board gives it its own columns.
   */
  setBoardColumns: (projectId: string, boardId: string, columns: BoardColumn[], moves: Record<string, string>) => void;
  /** Add a board below the others; it mirrors the main board's columns */
  addBoard: (projectId: string, name: string) => void;
  renameBoard: (projectId: string, boardId: string, name: string) => void;
  /** Move an extra board up or down (the main board always stays first) */
  moveBoard: (projectId: string, boardId: string, delta: -1 | 1) => void;
  /** Mirror the main board's columns again, or take a copy of them to customise */
  setBoardMirroring: (projectId: string, boardId: string, mirror: boolean) => void;
  /** Remove an extra board; its cards move to `targetBoardId` */
  deleteBoard: (projectId: string, boardId: string, targetBoardId: string) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;
  addRecentProject: (id: string) => void;
  // Tasks
  addTask: (task: CreateTaskInput) => void;
  addTasks: (tasks: CreateTaskInput[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reassignTask: (taskId: string, newAssigneeId: string) => void;
  // Sprints
  addSprint: (sprint: CreateSprintInput) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  // Milestones
  addMilestone: (milestone: CreateMilestoneInput) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  // Plan: epics and stories (both optional levels)
  addEpic: (epic: CreateEpicInput) => void;
  /** Changing an epic's phase moves its tasks to that phase */
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  /** Its stories and tasks stay, without the epic */
  deleteEpic: (id: string) => void;
  addStory: (story: CreateStoryInput) => void;
  /** Changing a story's epic moves its tasks along */
  updateStory: (id: string, updates: Partial<Story>) => void;
  /** Its tasks stay in the epic, without the story */
  deleteStory: (id: string) => void;
  /** Put a task in a phase, epic or story; the links are made to agree (a story decides the epic, an epic the phase) */
  setTaskPlan: (taskId: string, links: PlanLinks) => void;
  /**
   * Change which levels a project uses and its rules. A level switched off is removed: its
   * items' children move up to the level above (e.g. a removed epic's stories stay in its phase).
   */
  setProjectStructure: (projectId: string, structure: ProjectStructure) => void;
  // Teams
  addTeam: (team: CreateTeamInput) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  // Members
  addMember: (user: CreateMemberInput) => void;
  updateMember: (id: string, updates: Partial<User>) => void;
  deleteMember: (id: string) => void;
  updateMemberAvailability: (id: string, availability: AvailabilityStatus) => void;
  // Calendar Events
  addCalendarEvent: (event: CreateCalendarEventInput) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  // Time Off
  addTimeOffRequest: (req: CreateTimeOffInput) => void;
  updateTimeOffRequest: (id: string, updates: Partial<TimeOffRequest>) => void;
  approveTimeOffRequest: (id: string) => void;
  declineTimeOffRequest: (id: string) => void;
  deleteTimeOffRequest: (id: string) => void;
  // Meetings
  addMeeting: (meeting: CreateMeetingInput) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  cancelMeeting: (id: string) => void;
  // Announcements
  addAnnouncement: (announcement: CreateAnnouncementInput) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  markAnnouncementRead: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;
  // Collaboration Settings
  updateCollaborationSettings: (updates: Partial<CollaborationSettings>) => void;
  // Saved signatures, signing defaults & company seals
  saveSignature: (signature: SavedSignature) => void;
  deleteSignature: (userId: string) => void;
  updateSigningDefaults: (updates: Partial<SigningDefaults>) => void;
  addCompanySeal: (seal: Omit<CompanySeal, 'id' | 'createdAt' | 'usageCount'>) => void;
  updateCompanySeal: (id: string, updates: Partial<CompanySeal>) => void;
  deleteCompanySeal: (id: string) => void;
  // AI agent connection tokens
  addAgentToken: (token: AgentAccessToken) => void;
  revokeAgentToken: (id: string) => void;
  markAgentTokenUsed: (id: string, agent: AgentClient) => void;
  // What an AI agent does for the signed-in person (simulates the PM MCP server's tools)
  agentListTasks: (agent: AgentClient) => void;
  agentStartTask: (taskId: string, agent: AgentClient) => void;
  agentContinueTask: (taskId: string, agent: AgentClient) => void;
  agentAddNote: (taskId: string, agent: AgentClient, text: string) => void;
  agentPauseTask: (agent: AgentClient, note?: string) => void;
  agentFinishTask: (taskId: string, agent: AgentClient, summary: string) => void;
  /** Hours worked without the timer; for someone else when `userId` is given (e.g. a manager logging for the team) */
  logManualTime: (taskId: string, minutes: number, date: string, note?: string, userId?: string) => void;
  updateAgentSettings: (updates: Partial<AgentSettings>) => void;
  updateWorkSession: (id: string, updates: Partial<WorkSession>) => void;
  // Files
  addFile: (file: CreateFileInput) => void;
  updateFile: (id: string, updates: Partial<ProjectFile>) => void;
  deleteFile: (id: string) => void;
  saveSrsTaskHistory: (fileId: string, history: SrsGeneratedTaskRecord[]) => void;
  // Activity
  addActivity: (log: Partial<AuditLog> & { action: string; resource: string; resourceId: string }) => void;
  // Documents
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  // Document Items
  addDocumentItem: (doc: Partial<DocumentItem> & { title: string; content?: string }) => string;
  updateDocumentItem: (id: string, updates: Partial<DocumentItem>) => void;
  deleteDocumentItem: (id: string) => void;
  toggleFavoriteDocument: (id: string) => void;
  moveDocumentToFolder: (id: string, folderId: string | null) => void;
  duplicateDocument: (id: string) => void;
  archiveDocumentItem: (id: string) => void;
  addDocumentComment: (docId: string, text: string) => void;
  // Folders
  addFolder: (folder: { name: string; parentId?: string | null }) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  // Templates
  addTemplate: (tpl: Partial<DocumentTemplate> & { title: string; category: any; content: string }) => void;
  updateTemplate: (id: string, updates: Partial<DocumentTemplate>) => void;
  toggleFavoriteTemplate: (id: string) => void;
  // Contracts
  addContract: (contract: Partial<Contract> & { title: string; counterparty: string; contractType: any }) => string;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  archiveContract: (id: string) => void;
  submitContractForReview: (contractId: string, reviewerId?: string) => void;
  addContractReviewComment: (contractId: string, commentOrText: string | { authorId?: string; authorName?: string; content?: string; text?: string; actionRequested?: 'changes' | 'approved' }, actionRequested?: 'changes' | 'approved') => void;
  markContractReviewed: (contractId: string, status?: 'approved' | 'changes_requested') => void;
  // Electronic Signatures
  addSignatureRequest: (req: Partial<SignatureRequest> & { title: string; signers: SignatureSigner[] }) => string;
  updateSignatureRequest: (id: string, updates: Partial<SignatureRequest>) => void;
  cancelSignatureRequest: (id: string) => void;
  duplicateSignatureRequest: (id: string) => void;
  sendSignatureReminder: (requestId: string, signerId?: string) => void;
  signDocumentSimulated: (requestId: string, signerId: string, signatureValue: string, seal?: { id: string; name: string }) => void;
  declineSignatureRequest: (requestId: string, signerId: string, reason: string) => void;
  updateSignatureFields: (requestId: string, fields: SignatureField[]) => void;
  // Approvals
  updateApproval: (id: string, updates: Partial<ApprovalRequest>) => void;
  // Agent Runs
  addAgentRun: (run: AgentRun) => void;
  updateAgentRun: (id: string, updates: Partial<AgentRun>) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // UI & Drawer
  toggleSidebar: () => void;
  openTaskDrawer: (taskId: string) => void;
  closeTaskDrawer: () => void;
  // Reset
  resetDemoData: () => void;
}

export type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

// Bump the version when the demo data changes, so browsers drop older saved demo data
const STORAGE_KEY = 'flashsign-proto-state-v6';

function getInitialState(): AppState {
  return {
    // While the role switcher is hidden the demo always runs as the Owner / CEO
    demoRole: FEATURES.roleSwitcher ? 'project_manager' : FIXED_DEMO_ROLE,
    currentUserId: DEMO_ROLE_USERS[FEATURES.roleSwitcher ? 'project_manager' : FIXED_DEMO_ROLE],
    org: MOCK_ORG,
    users: MOCK_USERS,
    // Worked out from the sample tasks, so the current end and health match today's date
    projects: MOCK_PROJECTS.map(p => calculateProjectTimeline(p, MOCK_TASKS, MOCK_MILESTONES, MOCK_STATUS_CHANGES)),
    tasks: MOCK_TASKS,
    sprints: MOCK_SPRINTS,
    milestones: MOCK_MILESTONES,
    epics: MOCK_EPICS,
    stories: MOCK_STORIES,
    teams: MOCK_TEAMS,
    files: MOCK_PROJECT_FILES,
    documents: MOCK_DOCUMENTS,
    documentItems: MOCK_DOCUMENT_ITEMS,
    documentFolders: MOCK_FOLDERS,
    documentTemplates: MOCK_TEMPLATES,
    contracts: MOCK_CONTRACTS,
    signatureRequests: MOCK_SIGNATURE_REQUESTS,
    approvals: MOCK_APPROVALS,
    notifications: MOCK_NOTIFICATIONS,
    auditLogs: MOCK_AUDIT_LOGS,
    activities: MOCK_AUDIT_LOGS,
    agentRuns: MOCK_AGENT_RUNS,
    calendarEvents: MOCK_CALENDAR_EVENTS,
    timeOffRequests: MOCK_TIME_OFF,
    meetings: MOCK_MEETINGS,
    announcements: MOCK_ANNOUNCEMENTS,
    collaborationSettings: MOCK_COLLABORATION_SETTINGS,
    savedSignatures: [],
    signingDefaults: DEFAULT_SIGNING_DEFAULTS,
    companySeals: MOCK_COMPANY_SEALS,
    agentTokens: MOCK_AGENT_TOKENS,
    workSessions: MOCK_WORK_SESSIONS,
    agentEvents: MOCK_AGENT_EVENTS,
    agentSettings: DEFAULT_AGENT_SETTINGS,
    taskStatusChanges: MOCK_STATUS_CHANGES,
    sidebarCollapsed: false,
    recentProjectIds: ['p1', 'p2', 'p3'],
    activeTaskDrawerId: null,
    srsTaskHistories: INITIAL_SRS_TASK_HISTORY,
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const saved = JSON.parse(raw) as Partial<AppState>;
    const initial = getInitialState();
    const tasks = saved.tasks && saved.tasks.length > 0 ? saved.tasks : initial.tasks;
    const milestones = saved.milestones && saved.milestones.length > 0 ? saved.milestones : initial.milestones;
    const rawProjects = saved.projects && saved.projects.length > 0 ? saved.projects : initial.projects;
    const hydratedProjects = rawProjects.map(p => calculateProjectTimeline(p, tasks, milestones, saved.taskStatusChanges ?? initial.taskStatusChanges));

    return {
      ...initial,
      ...saved,
      projects: hydratedProjects,
      tasks,
      milestones,
      // A role saved from an earlier session is ignored while the switcher is hidden
      ...(FEATURES.roleSwitcher ? {} : { demoRole: FIXED_DEMO_ROLE, currentUserId: DEMO_ROLE_USERS[FIXED_DEMO_ROLE] }),
      srsTaskHistories: saved.srsTaskHistories || INITIAL_SRS_TASK_HISTORY,
    };
  } catch {
    return getInitialState();
  }
}

function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: Partial<AppState> = {
      demoRole: state.demoRole,
      currentUserId: state.currentUserId,
      users: state.users,
      teams: state.teams,
      projects: state.projects,
      tasks: state.tasks,
      sprints: state.sprints,
      milestones: state.milestones,
      epics: state.epics,
      stories: state.stories,
      files: state.files,
      documents: state.documents,
      approvals: state.approvals,
      notifications: state.notifications,
      calendarEvents: state.calendarEvents,
      timeOffRequests: state.timeOffRequests,
      meetings: state.meetings,
      announcements: state.announcements,
      collaborationSettings: state.collaborationSettings,
      savedSignatures: state.savedSignatures,
      signingDefaults: state.signingDefaults,
      companySeals: state.companySeals,
      agentTokens: state.agentTokens,
      workSessions: state.workSessions,
      agentEvents: state.agentEvents,
      agentSettings: state.agentSettings,
      taskStatusChanges: state.taskStatusChanges,
      agentRuns: state.agentRuns,
      sidebarCollapsed: state.sidebarCollapsed,
      recentProjectIds: state.recentProjectIds,
      srsTaskHistories: state.srsTaskHistories,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage quota exceeded — ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    setState({
      ...saved,
      sidebarCollapsed: isMobile ? true : (saved.sidebarCollapsed ?? false),
    });
    setHydrated(true);

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setState(s => s.sidebarCollapsed ? s : { ...s, sidebarCollapsed: true });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Auto-stop running timers after the idle limit or at the end of the shift (checked every minute)
  useEffect(() => {
    if (!hydrated) return;
    const check = () => setState(s => {
      const stopped = applyAutoStops(s.workSessions, s.agentSettings, Date.now());
      return stopped ? { ...s, workSessions: stopped.sessions, agentEvents: [...s.agentEvents, ...stopped.events] } : s;
    });
    check();
    const timer = setInterval(check, 60_000);

    // Using the web app counts as activity for a timer started here (moving a card to In Progress).
    // Agent timers get their activity from the agent's own calls.
    let lastTouch = 0;
    const touch = () => {
      if (Date.now() - lastTouch < 60_000) return;
      lastTouch = Date.now();
      setState(s => {
        const open = s.workSessions.find(w => w.userId === s.currentUserId && !w.endedAt && w.source === 'web');
        if (!open) return s;
        const now = new Date().toISOString();
        return { ...s, workSessions: s.workSessions.map(w => (w === open ? { ...w, lastActivityAt: now } : w)) };
      });
    };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, [hydrated]);

  const { currentUser: authUser, selectedWorkspace: authOrg, isAuthenticated } = useDemoAuth();

  useEffect(() => {
    if (!authUser || !isAuthenticated) return;

    setState((prev) => {
      const existingUserIdx = prev.users.findIndex(
        (u) => u.id === authUser.id || u.email.toLowerCase() === authUser.email.toLowerCase()
      );

      const mappedRole: DemoRole =
        authUser.role === 'executive'
          ? 'ceo'
          : authUser.role === 'qa'
          ? 'qa_tester'
          : (authUser.role as unknown as DemoRole);

      const mappedUser: User = {
        id: authUser.id,
        name: authUser.fullName,
        email: authUser.email,
        initials: authUser.avatarInitials || authUser.fullName.slice(0, 2).toUpperCase(),
        role: mappedRole,
        title: authUser.jobTitle || 'Team Member',
        department: authUser.department || 'Executive',
        color: authUser.avatarColor || '#00c2a8',
        isActive: true,
        timeZone: authUser.timezone || 'America/New_York (EST)',
        createdAt: authUser.createdAt || new Date().toISOString(),
      };

      let nextUsers = [...prev.users];
      if (existingUserIdx >= 0) {
        nextUsers[existingUserIdx] = { ...nextUsers[existingUserIdx], ...mappedUser };
      } else {
        nextUsers = [mappedUser, ...nextUsers];
      }

      const nextOrg: Organization = {
        ...prev.org,
        name: authOrg?.name || prev.org.name,
        slug: authOrg?.slug || prev.org.slug,
      };

      return {
        ...prev,
        currentUserId: authUser.id,
        demoRole: mappedRole,
        users: nextUsers,
        org: nextOrg,
      };
    });
  }, [authUser, authOrg, isAuthenticated]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater);
  }, []);

  const actions: AppActions = useMemo(() => ({
    setDemoRole: (role) => update(s => ({
      ...s,
      demoRole: role,
      currentUserId: DEMO_ROLE_USERS[role] || s.currentUserId,
    })),

    // Projects
    addProject: (p) => update(s => {
      const startDate = p.startDate || new Date().toISOString().split('T')[0];
      const endDate = p.endDate || p.dueDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const duration = Math.max(1, p.originalDuration || diffCalendarDays(startDate, endDate) || 90);

      const baseProject: Project = {
        id: p.id || `p-${Date.now()}`,
        name: p.name,
        key: p.key || p.name.substring(0, 3).toUpperCase(),
        description: p.description || '',
        status: p.status || 'active',
        health: p.health || 'on_track',
        ownerId: p.ownerId || s.currentUserId,
        teamIds: p.teamIds || [],
        memberIds: p.memberIds || [s.currentUserId],
        startDate,
        endDate,
        dueDate: p.dueDate || endDate,
        progress: p.progress || 0,
        priority: p.priority || 'medium',
        tags: p.tags || [],
        category: p.category,
        group: p.group,
        isFavorite: p.isFavorite,
        isArchived: p.isArchived,
        accentColor: p.accentColor,
        goals: p.goals,
        boardColumns: p.boardColumns,
        mainBoardName: p.mainBoardName,
        extraBoards: p.extraBoards,
        structure: p.structure,
        durationUnit: p.durationUnit,
        originalStartDate: p.originalStartDate || startDate,
        originalEndDate: p.originalEndDate || endDate,
        originalDuration: duration,
        currentStartDate: p.currentStartDate || startDate,
        currentEndDate: p.currentEndDate || endDate,
        currentDuration: duration,
        timelineDifference: p.timelineDifference || 0,
        timelineStatus: p.timelineStatus || 'on_schedule',
        totalWorkDays: p.totalWorkDays || 0,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const calculatedProject = calculateProjectTimeline(baseProject, s.tasks, s.milestones, s.taskStatusChanges);

      return {
        ...s,
        projects: [calculatedProject, ...s.projects],
        recentProjectIds: [calculatedProject.id, ...s.recentProjectIds.filter(id => id !== calculatedProject.id)],
      };
    }),
    updateProject: (id, updates) => update(s => ({
      ...s,
      projects: s.projects.map(p => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return calculateProjectTimeline(merged, s.tasks, s.milestones, s.taskStatusChanges);
      }),
    })),
    setBoardColumns: (projectId, boardId, columns, moves) => update(s => {
      const project = s.projects.find(p => p.id === projectId);
      if (!project) return s;
      const columnBoards = boardsSharingColumns(boardId, projectBoards(project)).map(b => b.id);
      return relayoutProject(
        s,
        projectId,
        p => boardId === MAIN_BOARD_ID
          ? { ...p, boardColumns: columns }
          : withExtraBoards(p, boards => boards.map(b => (b.id === boardId ? { ...b, columns } : b))),
        { columnMoves: moves, columnBoards }
      );
    }),
    addBoard: (projectId, name) => update(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...withExtraBoards(p, boards => [...boards, { id: `board-${Date.now()}`, name }]), updatedAt: new Date().toISOString() }
          : p
      ),
    })),
    renameBoard: (projectId, boardId, name) => update(s => ({
      ...s,
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        const renamed = boardId === MAIN_BOARD_ID
          ? { ...p, mainBoardName: name }
          : withExtraBoards(p, boards => boards.map(b => (b.id === boardId ? { ...b, name } : b)));
        return { ...renamed, updatedAt: new Date().toISOString() };
      }),
    })),
    moveBoard: (projectId, boardId, delta) => update(s => ({
      ...s,
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        const boards = [...(p.extraBoards ?? [])];
        const at = boards.findIndex(b => b.id === boardId);
        const to = at + delta;
        if (at === -1 || to < 0 || to >= boards.length) return p;
        [boards[at], boards[to]] = [boards[to], boards[at]];
        return { ...p, extraBoards: boards, updatedAt: new Date().toISOString() };
      }),
    })),
    setBoardMirroring: (projectId, boardId, mirror) => update(s =>
      // A copy keeps the column ids, so cards stay put; mirroring again re-places cards by stage
      relayoutProject(s, projectId, p =>
        withExtraBoards(p, boards => boards.map(b =>
          b.id === boardId ? { ...b, columns: mirror ? undefined : boardColumnsFor(p).map(c => ({ ...c })) } : b
        ))
      )
    ),
    deleteBoard: (projectId, boardId, targetBoardId) => update(s =>
      relayoutProject(s, projectId, p => withExtraBoards(p, boards => boards.filter(b => b.id !== boardId)), {
        boardMoves: { [boardId]: targetBoardId },
      })
    ),
    deleteProject: (id) => update(s => ({
      ...s,
      projects: s.projects.filter(p => p.id !== id),
      tasks: s.tasks.filter(t => t.projectId !== id),
      sprints: s.sprints.filter(sp => sp.projectId !== id),
      milestones: s.milestones.filter(m => m.projectId !== id),
      recentProjectIds: s.recentProjectIds.filter(pid => pid !== id),
    })),
    archiveProject: (id) => update(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, isArchived: !p.isArchived, updatedAt: new Date().toISOString() } : p),
    })),
    toggleFavoriteProject: (id) => update(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p),
    })),
    addRecentProject: (id) => update(s => {
      if (s.recentProjectIds && s.recentProjectIds[0] === id) return s;
      return {
        ...s,
        recentProjectIds: [id, ...(s.recentProjectIds || []).filter(pid => pid !== id)].slice(0, 10),
      };
    }),

    // Tasks
    addTask: (t) => update(s => {
      const newTask: Task = {
        id: t.id || `t-${Date.now()}`,
        key: t.key || nextTaskKey(s.tasks, s.projects, t.projectId, t.parentId),
        title: t.title,
        description: t.description || '',
        type: t.type || (t.parentId ? 'subtask' : 'task'),
        status: t.status || 'todo',
        boardId: t.boardId,
        columnId: t.columnId,
        priority: t.priority || 'medium',
        projectId: t.projectId,
        sprintId: t.sprintId,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId || s.currentUserId,
        parentId: t.parentId,
        ...resolvePlan(t, s.epics, s.stories),
        durationUnit: t.durationUnit,
        effortMinutes: t.effortMinutes,
        estimatedDuration: Math.max(1, Number(t.estimatedDuration) || (t.parentId ? 1 : 3)),
        storyPoints: t.storyPoints || t.points,
        points: t.points || t.storyPoints,
        startDate: t.startDate,
        dueDate: t.dueDate,
        tags: t.tags || t.labels || [],
        labels: t.labels || t.tags || [],
        comments: t.comments || [],
        attachments: t.attachments || [],
        checklist: t.checklist || [],
        acceptanceCriteria: t.acceptanceCriteria,
        sourceDocumentId: t.sourceDocumentId,
        sourceDocumentName: t.sourceDocumentName,
        sourceSection: t.sourceSection,
        isSrsGenerated: t.isSrsGenerated,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextTasks = [newTask, ...s.tasks];
      // Recalculate project progress & dynamic timeline
      const projectTasks = nextTasks.filter(item => item.projectId === newTask.projectId);
      const progress = progressOfTasks(projectTasks);
      
      const nextProjects = s.projects.map(p => {
        if (p.id !== newTask.projectId) return p;
        const updatedP = { ...p, progress, updatedAt: new Date().toISOString() };
        return calculateProjectTimeline(updatedP, nextTasks, s.milestones, s.taskStatusChanges);
      });

      return {
        ...s,
        tasks: nextTasks,
        projects: nextProjects,
      };
    }),
    addTasks: (newTaskList) => update(s => {
      // Keys are handed out one by one, so tasks added together don't share one
      const keyed: Task[] = [];
      const addedTasks: Task[] = newTaskList.map((t, idx) => ({
        id: t.id || `t-${Date.now()}-${idx}`,
        key: t.key || (() => {
          const key = nextTaskKey([...s.tasks, ...keyed], s.projects, t.projectId, t.parentId);
          keyed.push({ key, projectId: t.projectId, parentId: t.parentId } as Task);
          return key;
        })(),
        title: t.title,
        description: t.description || '',
        type: t.type || (t.parentId ? 'subtask' : 'task'),
        status: t.status || 'todo',
        boardId: t.boardId,
        columnId: t.columnId,
        priority: t.priority || 'medium',
        projectId: t.projectId,
        sprintId: t.sprintId,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId || s.currentUserId,
        parentId: t.parentId,
        ...resolvePlan(t, s.epics, s.stories),
        durationUnit: t.durationUnit,
        effortMinutes: t.effortMinutes,
        estimatedDuration: Math.max(1, Number(t.estimatedDuration) || (t.parentId ? 1 : 3)),
        storyPoints: t.storyPoints || t.points,
        points: t.points || t.storyPoints,
        startDate: t.startDate,
        dueDate: t.dueDate,
        tags: t.tags || t.labels || [],
        labels: t.labels || t.tags || [],
        comments: t.comments || [],
        attachments: t.attachments || [],
        checklist: t.checklist || [],
        acceptanceCriteria: t.acceptanceCriteria,
        sourceDocumentId: t.sourceDocumentId,
        sourceDocumentName: t.sourceDocumentName,
        sourceSection: t.sourceSection,
        isSrsGenerated: t.isSrsGenerated,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const nextTasks = [...addedTasks, ...s.tasks];
      const affectedProjectIds = Array.from(new Set(newTaskList.map(t => t.projectId)));
      const nextProjects = s.projects.map(p => {
        if (!affectedProjectIds.includes(p.id)) return p;
        const projectTasks = nextTasks.filter(item => item.projectId === p.id);
        const progress = progressOfTasks(projectTasks);
        const updatedP = { ...p, progress, updatedAt: new Date().toISOString() };
        return calculateProjectTimeline(updatedP, nextTasks, s.milestones, s.taskStatusChanges);
      });

      return {
        ...s,
        tasks: nextTasks,
        projects: nextProjects,
      };
    }),
    updateTask: (id, updates) => update(s => {
      const now = new Date().toISOString();
      const before = s.tasks.find(t => t.id === id);
      const fromBoardId = before?.boardId ?? MAIN_BOARD_ID;
      const boardMove = updates.boardId && updates.boardId !== fromBoardId ? { from: fromBoardId, to: updates.boardId } : undefined;
      const to = updates.status ?? before?.status;
      const timing: Partial<Pick<AppState, 'workSessions' | 'taskStatusChanges'>> = before && to && (to !== before.status || boardMove)
        ? trackStatusMove(s, { ...before, ...updates, status: before.status }, to, now, boardMove)
        : {};
      const parentStart = before?.parentId && to === 'in_progress' && before.status !== 'in_progress'
        ? startParentOf({ ...s, ...timing }, id, now, 'web')
        : undefined;
      const nextTasks = (parentStart?.tasks ?? s.tasks).map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t);
      const updatedTask = nextTasks.find(t => t.id === id);
      const projectId = updatedTask?.projectId;
      let nextProjects = s.projects;
      if (projectId) {
        const projectTasks = nextTasks.filter(t => t.projectId === projectId);
        const progress = progressOfTasks(projectTasks);
        nextProjects = s.projects.map(p => {
          if (p.id !== projectId) return p;
          const updatedP = { ...p, progress, updatedAt: now };
          // Include the move just made, so a late start moves the forecast straight away
          const changes = parentStart?.taskStatusChanges ?? timing.taskStatusChanges ?? s.taskStatusChanges;
          return calculateProjectTimeline(updatedP, nextTasks, s.milestones, changes);
        });
      }
      return {
        ...s,
        ...timing,
        ...(parentStart && { taskStatusChanges: parentStart.taskStatusChanges }),
        tasks: nextTasks,
        projects: nextProjects,
      };
    }),
    deleteTask: (id) => update(s => {
      const taskToDelete = s.tasks.find(t => t.id === id);
      // If deleting a main task, delete all its subtasks as well
      const nextTasks = s.tasks.filter(t => t.id !== id && t.parentId !== id);
      const projectId = taskToDelete?.projectId;
      let nextProjects = s.projects;
      if (projectId) {
        const projectTasks = nextTasks.filter(t => t.projectId === projectId);
        const progress = progressOfTasks(projectTasks);
        nextProjects = s.projects.map(p => {
          if (p.id !== projectId) return p;
          const updatedP = { ...p, progress, updatedAt: new Date().toISOString() };
          return calculateProjectTimeline(updatedP, nextTasks, s.milestones, s.taskStatusChanges);
        });
      }
      return {
        ...s,
        tasks: nextTasks,
        projects: nextProjects,
        activeTaskDrawerId: s.activeTaskDrawerId === id ? null : s.activeTaskDrawerId,
      };
    }),

    // Sprints
    addSprint: (sp) => update(s => {
      const newSprint: Sprint = {
        id: sp.id || `sprint-${Date.now()}`,
        name: sp.name,
        projectId: sp.projectId,
        status: sp.status || 'planning',
        goal: sp.goal || '',
        startDate: sp.startDate || new Date().toISOString().split('T')[0],
        endDate: sp.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        capacity: sp.capacity || 20,
        createdAt: sp.createdAt || new Date().toISOString(),
      };
      return { ...s, sprints: [...s.sprints, newSprint] };
    }),
    updateSprint: (id, updates) => update(s => ({
      ...s,
      sprints: s.sprints.map(sp => sp.id === id ? { ...sp, ...updates } : sp),
    })),
    deleteSprint: (id) => update(s => ({
      ...s,
      sprints: s.sprints.filter(sp => sp.id !== id),
      tasks: s.tasks.map(t => t.sprintId === id ? { ...t, sprintId: undefined } : t),
    })),

    // Milestones
    addMilestone: (m) => update(s => {
      const newMilestone: Milestone = {
        id: m.id || `m-${Date.now()}`,
        name: m.name,
        description: m.description || '',
        projectId: m.projectId,
        startDate: m.startDate,
        endDate: m.endDate || m.dueDate,
        dueDate: m.dueDate || m.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: m.status || 'pending',
        progress: m.progress || 0,
        taskIds: m.taskIds || [],
        estimatedDuration: m.estimatedDuration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextMilestones = [...s.milestones, newMilestone];
      const nextProjects = s.projects.map(p => {
        if (p.id !== m.projectId) return p;
        return calculateProjectTimeline(p, s.tasks, nextMilestones, s.taskStatusChanges);
      });
      return { ...s, milestones: nextMilestones, projects: nextProjects };
    }),
    updateMilestone: (id, updates) => update(s => {
      const nextMilestones = s.milestones.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      const updated = nextMilestones.find(m => m.id === id);
      const projectId = updated?.projectId;
      const nextProjects = s.projects.map(p => {
        if (p.id !== projectId) return p;
        return calculateProjectTimeline(p, s.tasks, nextMilestones, s.taskStatusChanges);
      });
      return { ...s, milestones: nextMilestones, projects: nextProjects };
    }),
    deleteMilestone: (id) => update(s => {
      const target = s.milestones.find(m => m.id === id);
      const nextMilestones = s.milestones.filter(m => m.id !== id);
      const nextTasks = s.tasks.map(t => t.milestoneId === id ? { ...t, milestoneId: undefined } : t);
      // Epics and stories in the phase stay, without a phase
      const epics = s.epics.map(e => (e.phaseId === id ? { ...e, phaseId: undefined } : e));
      const stories = s.stories.map(st => (st.phaseId === id ? { ...st, phaseId: undefined } : st));
      const nextProjects = s.projects.map(p => {
        if (p.id !== target?.projectId) return p;
        return calculateProjectTimeline(p, nextTasks, nextMilestones, s.taskStatusChanges);
      });
      return { ...s, milestones: nextMilestones, epics, stories, tasks: nextTasks, projects: nextProjects };
    }),

    // Plan
    addEpic: (e) => update(s => {
      const now = new Date().toISOString();
      const epic: Epic = {
        id: e.id || `epic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: e.projectId,
        phaseId: e.phaseId,
        name: e.name,
        description: e.description,
        color: e.color || '#42a5f5',
        startDate: e.startDate,
        endDate: e.endDate,
        durationUnit: e.durationUnit,
        createdAt: now,
        updatedAt: now,
      };
      return { ...s, epics: [...s.epics, epic] };
    }),
    updateEpic: (id, updates) => update(s => {
      const epics = s.epics.map(e => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
      return { ...s, epics, tasks: relinkTasks(s.tasks, t => t.epicId === id, epics, s.stories) };
    }),
    deleteEpic: (id) => update(s => {
      const epics = s.epics.filter(e => e.id !== id);
      const stories = s.stories.map(st => (st.epicId === id ? { ...st, epicId: undefined } : st));
      const tasks = s.tasks.map(t => (t.epicId === id ? { ...t, epicId: undefined } : t));
      return { ...s, epics, stories, tasks: relinkTasks(tasks, t => Boolean(t.storyId), epics, stories) };
    }),
    addStory: (st) => update(s => {
      const now = new Date().toISOString();
      const story: Story = {
        id: st.id || `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: st.projectId,
        epicId: st.epicId,
        phaseId: st.epicId ? undefined : st.phaseId,
        title: st.title,
        description: st.description,
        acceptanceCriteria: st.acceptanceCriteria,
        priority: st.priority || 'medium',
        startDate: st.startDate,
        endDate: st.endDate,
        durationUnit: st.durationUnit,
        createdAt: now,
        updatedAt: now,
      };
      return { ...s, stories: [...s.stories, story] };
    }),
    updateStory: (id, updates) => update(s => {
      const stories = s.stories.map(st => (st.id === id ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st));
      return { ...s, stories, tasks: relinkTasks(s.tasks, t => t.storyId === id, s.epics, stories) };
    }),
    deleteStory: (id) => update(s => ({
      ...s,
      stories: s.stories.filter(st => st.id !== id),
      tasks: s.tasks.map(t => (t.storyId === id ? { ...t, storyId: undefined } : t)),
    })),
    setProjectStructure: (projectId, structure) => update(s => {
      const project = s.projects.find(p => p.id === projectId);
      if (!project) return s;
      const before = projectStructure(project);
      let { milestones, epics, stories, tasks } = s;
      const inProject = <T extends { projectId: string }>(x: T) => x.projectId === projectId;

      if (before.stories && !structure.stories) {
        // Tasks keep their epic and phase
        stories = stories.filter(st => !inProject(st));
        tasks = tasks.map(t => (inProject(t) && t.storyId ? { ...t, storyId: undefined } : t));
      }
      if (before.epics && !structure.epics) {
        // Stories and tasks stay in the epic's phase
        const phaseOf = new Map(epics.filter(inProject).map(e => [e.id, e.phaseId]));
        epics = epics.filter(e => !inProject(e));
        stories = stories.map(st => (inProject(st) && st.epicId ? { ...st, epicId: undefined, phaseId: phaseOf.get(st.epicId) } : st));
        tasks = tasks.map(t => (inProject(t) && t.epicId ? { ...t, epicId: undefined } : t));
      }
      if (before.phases && !structure.phases) {
        milestones = milestones.filter(m => !inProject(m));
        epics = epics.map(e => (inProject(e) && e.phaseId ? { ...e, phaseId: undefined } : e));
        stories = stories.map(st => (inProject(st) && st.phaseId ? { ...st, phaseId: undefined } : st));
        tasks = tasks.map(t => (inProject(t) && t.milestoneId ? { ...t, milestoneId: undefined } : t));
      }
      tasks = tasks.map(t => (inProject(t) && !t.parentId ? { ...t, ...resolvePlan(t, epics, stories) } : t));
      const now = new Date().toISOString();
      return {
        ...s,
        milestones,
        epics,
        stories,
        tasks,
        projects: s.projects.map(p =>
          p.id === projectId ? calculateProjectTimeline({ ...p, structure, updatedAt: now }, tasks, milestones, s.taskStatusChanges) : p
        ),
      };
    }),
    setTaskPlan: (taskId, links) => update(s => {
      const resolved = resolvePlan(links, s.epics, s.stories);
      const now = new Date().toISOString();
      return {
        ...s,
        tasks: s.tasks.map(t => (t.id === taskId ? { ...t, ...resolved, updatedAt: now } : t)),
      };
    }),

    // Files
    addFile: (f) => update(s => {
      const newFile: ProjectFile = {
        id: f.id || `file-${Date.now()}`,
        name: f.name,
        projectId: f.projectId,
        size: f.size || '1.2 MB',
        type: f.type || 'pdf',
        uploadedBy: f.uploadedBy || s.currentUserId,
        createdAt: f.createdAt || new Date().toISOString(),
        taskId: f.taskId,
        category: f.category,
        analysisStatus: f.analysisStatus || 'not_analyzed',
        analyzedAt: f.analyzedAt,
        tasksGeneratedCount: f.tasksGeneratedCount,
      };
      return { ...s, files: [newFile, ...s.files] };
    }),
    updateFile: (id, updates) => update(s => ({
      ...s,
      files: s.files.map(f => f.id === id ? { ...f, ...updates } : f),
    })),
    deleteFile: (id) => update(s => ({ ...s, files: s.files.filter(f => f.id !== id) })),
    saveSrsTaskHistory: (fileId, history) => update(s => ({
      ...s,
      srsTaskHistories: {
        ...(s.srsTaskHistories || {}),
        [fileId]: history,
      },
    })),

    // Activity
    addActivity: (log) => update(s => {
      const newLog: AuditLog = {
        id: log.id || `act-${Date.now()}`,
        actorId: log.actorId || s.currentUserId,
        actorName: log.actorName || 'User',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        detail: log.detail,
        timestamp: log.timestamp || new Date().toISOString(),
      };
      return {
        ...s,
        auditLogs: [newLog, ...s.auditLogs],
        activities: [newLog, ...(s.activities || s.auditLogs)],
      };
    }),

    // Reassign Task
    reassignTask: (taskId, newAssigneeId) => update(s => {
      const task = s.tasks.find(t => t.id === taskId);
      const newAssignee = s.users.find(u => u.id === newAssigneeId);
      if (!task) return s;
      const nextTasks = s.tasks.map(t => t.id === taskId ? { ...t, assigneeId: newAssigneeId, updatedAt: new Date().toISOString() } : t);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'reassigned task',
        resource: 'Task',
        resourceId: taskId,
        detail: `Assigned "${task.title}" to ${newAssignee?.name || 'team member'}`,
        timestamp: new Date().toISOString(),
      };
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: newAssigneeId,
        title: 'New task assigned to you',
        body: `You were assigned: "${task.title}"`,
        type: 'task',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: `/projects/${task.projectId}`,
      };
      return {
        ...s,
        tasks: nextTasks,
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [notif, ...s.notifications],
      };
    }),

    // Teams
    addTeam: (t) => update(s => {
      const newTeam: Team = {
        id: t.id || `team-${Date.now()}`,
        name: t.name,
        description: t.description || '',
        leadId: t.leadId || s.currentUserId,
        memberIds: t.memberIds || [s.currentUserId],
        color: t.color || '#00c2a8',
        department: t.department || 'Engineering',
        category: t.category || 'Product Development',
        goals: t.goals || [],
        status: t.status || 'active',
        projectIds: t.projectIds || [],
        icon: t.icon || 'Users',
        createdAt: t.createdAt || new Date().toISOString(),
      };
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'created a team',
        resource: 'Team',
        resourceId: newTeam.id,
        detail: `Created "${newTeam.name}"`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...s,
        teams: [...s.teams, newTeam],
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
      };
    }),
    updateTeam: (id, updates) => update(s => {
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'updated team information',
        resource: 'Team',
        resourceId: id,
        timestamp: new Date().toISOString(),
      };
      return {
        ...s,
        teams: s.teams.map(t => t.id === id ? { ...t, ...updates } : t),
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
      };
    }),
    deleteTeam: (id) => update(s => ({
      ...s,
      teams: s.teams.filter(t => t.id !== id),
      users: s.users.map(u => ({
        ...u,
        teamIds: (u.teamIds || []).filter(tid => tid !== id),
      })),
    })),

    // Members
    addMember: (u) => update(s => {
      const initials = u.initials || u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
      const newMember: User = {
        id: u.id || `u-${Date.now()}`,
        name: u.name,
        email: u.email,
        initials,
        color: u.color || '#00c2a8',
        role: u.role || 'developer',
        department: u.department || 'Engineering',
        title: u.title || 'Specialist',
        avatar: u.avatar,
        isActive: u.isActive ?? true,
        skills: u.skills || ['Collaboration', 'TypeScript'],
        timeZone: u.timeZone || 'America/New_York (EST)',
        workingHours: u.workingHours || '09:00 - 17:00 EST',
        availability: u.availability || 'available',
        weeklyCapacity: u.weeklyCapacity || 40,
        teamIds: u.teamIds || [],
        projectIds: u.projectIds || [],
        createdAt: new Date().toISOString(),
      };
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(usr => usr.id === s.currentUserId)?.name || 'User',
        action: 'added a team member',
        resource: 'Member',
        resourceId: newMember.id,
        detail: `Added ${newMember.name} (${newMember.title})`,
        timestamp: new Date().toISOString(),
      };
      const nextTeams = s.teams.map(t => {
        if (newMember.teamIds?.includes(t.id) && !t.memberIds.includes(newMember.id)) {
          return { ...t, memberIds: [...t.memberIds, newMember.id] };
        }
        return t;
      });
      return {
        ...s,
        users: [...s.users, newMember],
        teams: nextTeams,
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
      };
    }),
    updateMember: (id, updates) => update(s => ({
      ...s,
      users: s.users.map(u => u.id === id ? { ...u, ...updates } : u),
    })),
    deleteMember: (id) => update(s => ({
      ...s,
      users: s.users.filter(u => u.id !== id),
      teams: s.teams.map(t => ({
        ...t,
        memberIds: t.memberIds.filter(mid => mid !== id),
        leadId: t.leadId === id ? (t.memberIds.find(mid => mid !== id) || '') : t.leadId,
      })),
    })),
    updateMemberAvailability: (id, availability) => update(s => {
      const user = s.users.find(u => u.id === id);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'updated availability status',
        resource: 'Member',
        resourceId: id,
        detail: `${user?.name || 'Member'} is now ${availability.replace('_', ' ')}`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...s,
        users: s.users.map(u => u.id === id ? { ...u, availability } : u),
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
      };
    }),

    // Calendar Events
    addCalendarEvent: (evt) => update(s => {
      const newEvent: CalendarEvent = {
        id: evt.id || `evt-${Date.now()}`,
        title: evt.title,
        description: evt.description || '',
        category: evt.category,
        startDate: evt.startDate,
        endDate: evt.endDate,
        allDay: evt.allDay ?? false,
        organizerId: evt.organizerId || s.currentUserId,
        attendeeIds: evt.attendeeIds || [s.currentUserId],
        teamId: evt.teamId,
        projectId: evt.projectId,
        taskId: evt.taskId,
        milestoneId: evt.milestoneId,
        location: evt.location,
        meetingLink: evt.meetingLink,
        createdAt: new Date().toISOString(),
      };
      return { ...s, calendarEvents: [newEvent, ...s.calendarEvents] };
    }),
    updateCalendarEvent: (id, updates) => update(s => ({
      ...s,
      calendarEvents: s.calendarEvents.map(e => e.id === id ? { ...e, ...updates } : e),
    })),
    deleteCalendarEvent: (id) => update(s => ({
      ...s,
      calendarEvents: s.calendarEvents.filter(e => e.id !== id),
    })),

    // Time Off
    addTimeOffRequest: (req) => update(s => {
      const member = s.users.find(u => u.id === req.memberId);
      const newReq: TimeOffRequest = {
        id: req.id || `to-${Date.now()}`,
        memberId: req.memberId,
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        durationDays: req.durationDays,
        isPartialDay: req.isPartialDay ?? false,
        reason: req.reason,
        notes: req.notes,
        status: req.status || 'pending',
        createdAt: new Date().toISOString(),
      };
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'submitted a time-off request',
        resource: 'Time Off',
        resourceId: newReq.id,
        detail: `${member?.name || 'Member'}: ${newReq.leaveType} (${newReq.durationDays} days)`,
        timestamp: new Date().toISOString(),
      };
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: s.currentUserId,
        title: 'New Time-Off Request',
        body: `${member?.name || 'A team member'} requested ${newReq.durationDays} days of ${newReq.leaveType} leave.`,
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/planner/availability',
      };
      return {
        ...s,
        timeOffRequests: [newReq, ...s.timeOffRequests],
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [notif, ...s.notifications],
      };
    }),
    updateTimeOffRequest: (id, updates) => update(s => ({
      ...s,
      timeOffRequests: s.timeOffRequests.map(r => r.id === id ? { ...r, ...updates } : r),
    })),
    approveTimeOffRequest: (id) => update(s => {
      const req = s.timeOffRequests.find(r => r.id === id);
      if (!req) return s;
      const member = s.users.find(u => u.id === req.memberId);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'approved time-off request',
        resource: 'Time Off',
        resourceId: id,
        detail: `Approved ${req.leaveType} for ${member?.name || 'Member'} (${req.durationDays} days)`,
        timestamp: new Date().toISOString(),
      };
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: req.memberId,
        title: 'Time-Off Request Approved',
        body: `Your ${req.leaveType} request for ${req.startDate} to ${req.endDate} has been approved.`,
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/planner/availability',
      };
      // Synchronize with calendar event
      const calendarEvent: CalendarEvent = {
        id: `evt-to-${req.id}`,
        title: `${member?.name || 'Member'} - ${req.leaveType.toUpperCase()} Leave`,
        description: req.reason || 'Approved time off',
        category: 'time_off',
        startDate: `${req.startDate}T00:00:00Z`,
        endDate: `${req.endDate}T23:59:59Z`,
        allDay: true,
        attendeeIds: [req.memberId],
      };
      return {
        ...s,
        timeOffRequests: s.timeOffRequests.map(r => r.id === id ? { ...r, status: 'approved' } : r),
        calendarEvents: [calendarEvent, ...s.calendarEvents],
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [notif, ...s.notifications],
      };
    }),
    declineTimeOffRequest: (id) => update(s => {
      const req = s.timeOffRequests.find(r => r.id === id);
      if (!req) return s;
      const member = s.users.find(u => u.id === req.memberId);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'declined time-off request',
        resource: 'Time Off',
        resourceId: id,
        detail: `Declined ${req.leaveType} for ${member?.name || 'Member'}`,
        timestamp: new Date().toISOString(),
      };
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: req.memberId,
        title: 'Time-Off Request Declined',
        body: `Your ${req.leaveType} request was declined. Please speak with your manager.`,
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/planner/availability',
      };
      return {
        ...s,
        timeOffRequests: s.timeOffRequests.map(r => r.id === id ? { ...r, status: 'declined' } : r),
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [notif, ...s.notifications],
      };
    }),
    deleteTimeOffRequest: (id) => update(s => ({
      ...s,
      timeOffRequests: s.timeOffRequests.filter(r => r.id !== id),
      calendarEvents: s.calendarEvents.filter(e => e.id !== `evt-to-${id}`),
    })),

    // Meetings
    addMeeting: (m) => update(s => {
      const newMeeting: Meeting = {
        id: m.id || `meet-${Date.now()}`,
        title: m.title,
        description: m.description || '',
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        durationMinutes: m.durationMinutes || 45,
        organizerId: m.organizerId || s.currentUserId,
        participantIds: m.participantIds || [s.currentUserId],
        teamId: m.teamId,
        projectId: m.projectId,
        agenda: m.agenda || [],
        location: m.location || 'FlashSign Conference Room A',
        meetingLink: m.meetingLink || 'https://meet.flashsign.demo/live-room',
        status: m.status || 'upcoming',
        createdAt: new Date().toISOString(),
      };
      // Synchronize calendar event
      const calendarEvent: CalendarEvent = {
        id: `evt-meet-${newMeeting.id}`,
        title: newMeeting.title,
        description: newMeeting.description,
        category: 'meeting',
        startDate: `${newMeeting.date}T${newMeeting.startTime.padStart(5, '0')}:00Z`,
        endDate: `${newMeeting.date}T${newMeeting.endTime.padStart(5, '0')}:00Z`,
        allDay: false,
        organizerId: newMeeting.organizerId,
        attendeeIds: newMeeting.participantIds,
        teamId: newMeeting.teamId,
        projectId: newMeeting.projectId,
        location: newMeeting.location,
        meetingLink: newMeeting.meetingLink,
      };
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'scheduled a meeting',
        resource: 'Meeting',
        resourceId: newMeeting.id,
        detail: `Scheduled "${newMeeting.title}" for ${newMeeting.date}`,
        timestamp: new Date().toISOString(),
      };
      const notifications: Notification[] = newMeeting.participantIds
        .filter(pid => pid !== s.currentUserId)
        .map(pid => ({
          id: `notif-${Date.now()}-${pid}`,
          userId: pid,
          title: `Invited to: ${newMeeting.title}`,
          body: `${newMeeting.date} at ${newMeeting.startTime}`,
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/planner/meetings',
        }));
      return {
        ...s,
        meetings: [newMeeting, ...s.meetings],
        calendarEvents: [calendarEvent, ...s.calendarEvents],
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [...notifications, ...s.notifications],
      };
    }),
    updateMeeting: (id, updates) => update(s => {
      const nextMeetings = s.meetings.map(m => m.id === id ? { ...m, ...updates } : m);
      const updatedM = nextMeetings.find(m => m.id === id);
      const nextEvents = s.calendarEvents.map(e => {
        if (e.id === `evt-meet-${id}` && updatedM) {
          return {
            ...e,
            title: updatedM.title,
            description: updatedM.description,
            startDate: `${updatedM.date}T${updatedM.startTime}:00Z`,
            endDate: `${updatedM.date}T${updatedM.endTime}:00Z`,
            attendeeIds: updatedM.participantIds,
            meetingLink: updatedM.meetingLink,
          };
        }
        return e;
      });
      return { ...s, meetings: nextMeetings, calendarEvents: nextEvents };
    }),
    deleteMeeting: (id) => update(s => ({
      ...s,
      meetings: s.meetings.filter(m => m.id !== id),
      calendarEvents: s.calendarEvents.filter(e => e.id !== `evt-meet-${id}`),
    })),
    cancelMeeting: (id) => update(s => {
      const m = s.meetings.find(item => item.id === id);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: s.currentUserId,
        actorName: s.users.find(u => u.id === s.currentUserId)?.name || 'User',
        action: 'cancelled meeting',
        resource: 'Meeting',
        resourceId: id,
        detail: `Cancelled "${m?.title || 'Meeting'}"`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...s,
        meetings: s.meetings.map(item => item.id === id ? { ...item, status: 'cancelled' } : item),
        calendarEvents: s.calendarEvents.map(e => e.id === `evt-meet-${id}` ? { ...e, title: `[CANCELLED] ${e.title}` } : e),
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
      };
    }),

    // Announcements
    addAnnouncement: (ann) => update(s => {
      const newAnn: Announcement = {
        id: ann.id || `ann-${Date.now()}`,
        title: ann.title,
        content: ann.content,
        authorId: ann.authorId || s.currentUserId,
        publishedDate: ann.publishedDate || new Date().toISOString(),
        audience: ann.audience || 'all',
        priority: ann.priority || 'normal',
        isPinned: ann.isPinned ?? false,
        readByUserIds: ann.readByUserIds || [s.currentUserId],
        status: ann.status || 'published',
        createdAt: new Date().toISOString(),
      };
      const author = s.users.find(u => u.id === newAnn.authorId);
      const log: AuditLog = {
        id: `act-${Date.now()}`,
        actorId: newAnn.authorId,
        actorName: author?.name || 'User',
        action: 'posted announcement',
        resource: 'Announcement',
        resourceId: newAnn.id,
        detail: `"${newAnn.title}" to ${newAnn.audience}`,
        timestamp: new Date().toISOString(),
      };
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: s.currentUserId,
        title: `Announcement: ${newAnn.title}`,
        body: newAnn.content.slice(0, 80) + '...',
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/teams/announcements',
      };
      return {
        ...s,
        announcements: [newAnn, ...s.announcements],
        auditLogs: [log, ...s.auditLogs],
        activities: [log, ...s.activities],
        notifications: [notif, ...s.notifications],
      };
    }),
    updateAnnouncement: (id, updates) => update(s => ({
      ...s,
      announcements: s.announcements.map(a => a.id === id ? { ...a, ...updates } : a),
    })),
    markAnnouncementRead: (id) => update(s => ({
      ...s,
      announcements: s.announcements.map(a => {
        if (a.id === id && !a.readByUserIds.includes(s.currentUserId)) {
          return { ...a, readByUserIds: [...a.readByUserIds, s.currentUserId] };
        }
        return a;
      }),
    })),
    togglePinAnnouncement: (id) => update(s => ({
      ...s,
      announcements: s.announcements.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a),
    })),
    deleteAnnouncement: (id) => update(s => ({
      ...s,
      announcements: s.announcements.filter(a => a.id !== id),
    })),

    // Collaboration Settings
    updateCollaborationSettings: (updates) => update(s => ({
      ...s,
      collaborationSettings: { ...s.collaborationSettings, ...updates },
    })),

    // Saved signatures (one per person, replaced on save)
    saveSignature: (signature) => update(s => ({
      ...s,
      savedSignatures: [...s.savedSignatures.filter(sig => sig.userId !== signature.userId), signature],
    })),
    deleteSignature: (userId) => update(s => ({
      ...s,
      savedSignatures: s.savedSignatures.filter(sig => sig.userId !== userId),
    })),

    // Signing defaults & company seals
    updateSigningDefaults: (updates) => update(s => ({
      ...s,
      signingDefaults: { ...s.signingDefaults, ...updates },
    })),
    addCompanySeal: (seal) => update(s => ({
      ...s,
      companySeals: [
        ...s.companySeals,
        { ...seal, id: `seal-${Date.now()}`, createdAt: new Date().toISOString(), usageCount: 0 },
      ],
    })),
    updateCompanySeal: (id, updates) => update(s => ({
      ...s,
      companySeals: s.companySeals.map(seal => (seal.id === id ? { ...seal, ...updates } : seal)),
    })),
    deleteCompanySeal: (id) => update(s => ({
      ...s,
      companySeals: s.companySeals.filter(seal => seal.id !== id),
    })),

    // AI agent connection tokens
    addAgentToken: (token) => update(s => ({ ...s, agentTokens: [...s.agentTokens, token] })),
    revokeAgentToken: (id) => update(s => ({
      ...s,
      agentTokens: s.agentTokens.map(t => (t.id === id ? { ...t, revokedAt: new Date().toISOString() } : t)),
    })),
    markAgentTokenUsed: (id, agent) => update(s => {
      const now = new Date().toISOString();
      return {
        ...s,
        agentTokens: s.agentTokens.map(t => (t.id === id ? { ...t, lastUsedAt: now, usedBy: { ...t.usedBy, [agent]: now } } : t)),
      };
    }),

    // AI agent actions. Rules match the MCP server design: one open timer per person,
    // only To do -> In Progress -> In Review, every action recorded with the agent that did it.
    agentListTasks: (agent) => update(s => ({
      ...s,
      agentEvents: [...s.agentEvents, agentEvent(s.currentUserId, agent, 'listed_tasks')],
    })),
    agentStartTask: (taskId, agent) => update(s => {
      const now = new Date().toISOString();
      const open = s.workSessions.find(w => w.userId === s.currentUserId && !w.endedAt);
      if (open?.taskId === taskId) return s;
      // The MCP server answers start_task on a task with subtasks with its subtasks, so the agent picks one
      if (hasSubtasks(taskId, s.tasks)) return s;
      const parentStart = startParentOf(s, taskId, now, agent);
      const events: AgentEvent[] = [];
      if (open) events.push(agentEvent(s.currentUserId, agent, 'paused', open.taskId, 'Paused automatically to start another task'));
      events.push(agentEvent(s.currentUserId, agent, 'started', taskId));
      const moves = s.tasks.some(t => t.id === taskId && t.status === 'todo');
      return {
        ...s,
        workSessions: [
          ...s.workSessions.map(w => (w === open ? { ...w, endedAt: now, lastActivityAt: now, endReason: 'switched_task' as const } : w)),
          { id: `ws-${Date.now()}`, userId: s.currentUserId, taskId, startedAt: now, lastActivityAt: now, source: agent },
        ],
        tasks: parentStart.tasks.map(t => (t.id === taskId && t.status === 'todo' ? { ...t, status: 'in_progress' as const, updatedAt: now } : t)),
        taskStatusChanges: moves
          ? [...parentStart.taskStatusChanges, statusChange(taskId, 'todo', 'in_progress', s.currentUserId, agent, now)]
          : parentStart.taskStatusChanges,
        agentEvents: [...s.agentEvents, ...events],
      };
    }),
    agentContinueTask: (taskId, agent) => update(s => {
      const now = new Date().toISOString();
      return {
        ...s,
        workSessions: s.workSessions.map(w =>
          w.userId === s.currentUserId && !w.endedAt && w.taskId === taskId ? { ...w, lastActivityAt: now } : w
        ),
        agentEvents: [...s.agentEvents, agentEvent(s.currentUserId, agent, 'continued', taskId, 'Picked up the running timer')],
      };
    }),
    agentAddNote: (taskId, agent, text) => update(s => {
      const now = new Date().toISOString();
      return {
        ...s,
        workSessions: s.workSessions.map(w =>
          w.userId === s.currentUserId && !w.endedAt ? { ...w, lastActivityAt: now } : w
        ),
        agentEvents: [...s.agentEvents, agentEvent(s.currentUserId, agent, 'note', taskId, text)],
      };
    }),
    agentPauseTask: (agent, note) => update(s => {
      const now = new Date().toISOString();
      const open = s.workSessions.find(w => w.userId === s.currentUserId && !w.endedAt);
      if (!open) return s;
      return {
        ...s,
        workSessions: s.workSessions.map(w =>
          w === open ? { ...w, endedAt: now, lastActivityAt: now, endReason: 'paused' as const, note: note ?? w.note } : w
        ),
        agentEvents: [...s.agentEvents, agentEvent(s.currentUserId, agent, 'paused', open.taskId, note)],
      };
    }),
    agentFinishTask: (taskId, agent, summary) => update(s => {
      const now = new Date().toISOString();
      const from = s.tasks.find(t => t.id === taskId)?.status;
      return {
        ...s,
        workSessions: s.workSessions.map(w =>
          w.userId === s.currentUserId && !w.endedAt && w.taskId === taskId
            ? { ...w, endedAt: now, lastActivityAt: now, endReason: 'finished' as const, note: summary }
            : w
        ),
        tasks: s.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: 'review' as const,
                updatedAt: now,
                comments: [...(t.comments || []), { id: `cm-${Date.now()}`, authorId: s.currentUserId, body: `${summary}\n\n(via ${AGENT_LABEL[agent]})`, createdAt: now }],
              }
            : t
        ),
        taskStatusChanges: from && from !== 'review'
          ? [...s.taskStatusChanges, statusChange(taskId, from, 'review', s.currentUserId, agent, now)]
          : s.taskStatusChanges,
        agentEvents: [...s.agentEvents, agentEvent(s.currentUserId, agent, 'finished', taskId, summary)],
      };
    }),
    logManualTime: (taskId, minutes, date, note, userId) => update(s => {
      const start = new Date(`${date}T09:00:00`);
      const end = new Date(start.getTime() + minutes * 60_000);
      return {
        ...s,
        workSessions: [
          ...s.workSessions,
          {
            id: `ws-${Date.now()}`, userId: userId ?? s.currentUserId, taskId, source: 'manual',
            startedAt: start.toISOString(), endedAt: end.toISOString(), lastActivityAt: end.toISOString(),
            endReason: 'paused', note,
          },
        ],
      };
    }),
    updateAgentSettings: (updates) => update(s => ({
      ...s,
      agentSettings: { ...s.agentSettings, ...updates },
    })),
    updateWorkSession: (id, updates) => update(s => ({
      ...s,
      workSessions: s.workSessions.map(w => (w.id === id ? { ...w, ...updates } : w)),
    })),

    // Documents
    addDocument: (doc) => update(s => ({ ...s, documents: [...s.documents, doc] })),
    updateDocument: (id, updates) => update(s => ({
      ...s,
      documents: s.documents.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d),
    })),

    // Document Items
    addDocumentItem: (doc) => {
      const newId = doc.id || `doc-${Date.now()}`;
      update(s => {
        const user = s.users.find(u => u.id === s.currentUserId);
        const newItem: DocumentItem = {
          id: newId,
          title: doc.title,
          description: doc.description || '',
          type: doc.type || 'agreement',
          status: doc.status || 'draft',
          ownerId: doc.ownerId || s.currentUserId,
          folderId: doc.folderId || null,
          relatedProjectId: doc.relatedProjectId,
          relatedContractId: doc.relatedContractId,
          content: doc.content || '# ' + doc.title + '\n\nDraft content initialized.',
          fileSize: doc.fileSize || '1.2 MB',
          pages: doc.pages || 1,
          isFavorite: doc.isFavorite ?? false,
          isShared: doc.isShared ?? false,
          sharedWithUserIds: doc.sharedWithUserIds || [],
          accessType: doc.accessType || 'editor',
          versions: doc.versions || [
            {
              id: `v1.0-${Date.now()}`,
              versionNumber: 1,
              modifiedBy: user?.name || 'User',
              modifiedDate: new Date().toISOString().split('T')[0],
              changeSummary: 'Initial document created.',
              content: doc.content || '# ' + doc.title,
            },
          ],
          comments: doc.comments || [],
          lastOpenedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const log: AuditLog = {
          id: `act-${Date.now()}`,
          actorId: s.currentUserId,
          actorName: user?.name || 'User',
          action: 'created document',
          resource: 'Document',
          resourceId: newId,
          detail: `"${newItem.title}"`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...s,
          documentItems: [newItem, ...s.documentItems],
          auditLogs: [log, ...s.auditLogs],
          activities: [log, ...s.activities],
        };
      });
      return newId;
    },
    updateDocumentItem: (id, updates) => update(s => ({
      ...s,
      documentItems: s.documentItems.map(d =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    })),
    deleteDocumentItem: (id) => update(s => ({
      ...s,
      documentItems: s.documentItems.filter(d => d.id !== id),
    })),
    toggleFavoriteDocument: (id) => update(s => ({
      ...s,
      documentItems: s.documentItems.map(d =>
        d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
      ),
    })),
    moveDocumentToFolder: (id, folderId) => update(s => ({
      ...s,
      documentItems: s.documentItems.map(d =>
        d.id === id ? { ...d, folderId, updatedAt: new Date().toISOString() } : d
      ),
    })),
    duplicateDocument: (id) => update(s => {
      const orig = s.documentItems.find(d => d.id === id);
      if (!orig) return s;
      const cloneId = `doc-${Date.now()}`;
      const clone: DocumentItem = {
        ...orig,
        id: cloneId,
        title: `Copy of ${orig.title}`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...s, documentItems: [clone, ...s.documentItems] };
    }),
    archiveDocumentItem: (id) => update(s => ({
      ...s,
      documentItems: s.documentItems.map(d =>
        d.id === id ? { ...d, status: 'archived', updatedAt: new Date().toISOString() } : d
      ),
    })),
    addDocumentComment: (docId, text) => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      const newComment: DocumentComment = {
        id: `cm-${Date.now()}`,
        authorId: s.currentUserId,
        authorName: user?.name || 'User',
        text,
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      return {
        ...s,
        documentItems: s.documentItems.map(d =>
          d.id === docId ? { ...d, comments: [...(d.comments || []), newComment] } : d
        ),
      };
    }),

    // Folders
    addFolder: (folder) => update(s => {
      const newFolder: DocumentFolder = {
        id: `f-${Date.now()}`,
        name: folder.name,
        parentId: folder.parentId || null,
        ownerId: s.currentUserId,
        documentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...s, documentFolders: [...s.documentFolders, newFolder] };
    }),
    updateFolder: (id, name) => update(s => ({
      ...s,
      documentFolders: s.documentFolders.map(f =>
        f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
      ),
    })),
    deleteFolder: (id) => update(s => ({
      ...s,
      documentFolders: s.documentFolders.filter(f => f.id !== id),
    })),

    // Templates
    addTemplate: (tpl) => update(s => {
      const newTpl: DocumentTemplate = {
        id: tpl.id || `tpl-${Date.now()}`,
        title: tpl.title,
        description: tpl.description || '',
        category: tpl.category || 'general',
        type: tpl.type || 'agreement',
        content: tpl.content,
        placeholders: tpl.placeholders || [],
        isFavorite: tpl.isFavorite ?? false,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      return { ...s, documentTemplates: [newTpl, ...s.documentTemplates] };
    }),
    updateTemplate: (id, updates) => update(s => ({
      ...s,
      documentTemplates: s.documentTemplates.map(t =>
        t.id === id ? { ...t, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : t
      ),
    })),
    toggleFavoriteTemplate: (id) => update(s => ({
      ...s,
      documentTemplates: s.documentTemplates.map(t =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      ),
    })),

    // Contracts
    addContract: (contract) => {
      const newId = contract.id || `cnt-${Date.now()}`;
      update(s => {
        const user = s.users.find(u => u.id === s.currentUserId);
        const newContract: Contract = {
          id: newId,
          title: contract.title,
          contractType: contract.contractType || 'agreement',
          counterparty: contract.counterparty,
          ownerId: contract.ownerId || s.currentUserId,
          ownerName: contract.ownerName || user?.name || 'User',
          relatedProjectId: contract.relatedProjectId,
          documentId: contract.documentId,
          effectiveDate: contract.effectiveDate || new Date().toISOString().split('T')[0],
          expiryDate: contract.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          renewalType: contract.renewalType || 'manual',
          contractValue: contract.contractValue || contract.value || 0,
          value: contract.value || contract.contractValue || 0,
          paymentTerms: contract.paymentTerms || 'Net 30 days',
          specialConditions: contract.specialConditions,
          description: contract.description,
          status: contract.status || 'draft',
          reviewerId: contract.reviewerId,
          signatureRequestId: contract.signatureRequestId,
          reviewComments: contract.reviewComments || [],
          activity: contract.activity || [
            {
              id: `ca-${Date.now()}`,
              action: 'Contract record created',
              actor: user?.name || 'User',
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const log: AuditLog = {
          id: `act-${Date.now()}`,
          actorId: s.currentUserId,
          actorName: user?.name || 'User',
          action: 'created contract',
          resource: 'Contract',
          resourceId: newId,
          detail: `"${newContract.title}" with ${newContract.counterparty}`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...s,
          contracts: [newContract, ...s.contracts],
          auditLogs: [log, ...s.auditLogs],
          activities: [log, ...s.activities],
        };
      });
      return newId;
    },
    updateContract: (id, updates) => update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    })),
    deleteContract: (id) => update(s => ({
      ...s,
      contracts: s.contracts.filter(c => c.id !== id),
    })),
    archiveContract: (id) => update(s => ({
      ...s,
      contracts: s.contracts.map(c =>
        c.id === id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c
      ),
    })),
    submitContractForReview: (contractId, reviewerId) => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      return {
        ...s,
        contracts: s.contracts.map(c => {
          if (c.id === contractId) {
            return {
              ...c,
              status: 'pending_review',
              reviewerId: reviewerId || c.reviewerId,
              updatedAt: new Date().toISOString(),
              activity: [
                ...(c.activity || []),
                {
                  id: `ca-${Date.now()}`,
                  action: 'Submitted for internal review',
                  actor: user?.name || 'User',
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return c;
        }),
      };
    }),
    addContractReviewComment: (contractId, commentOrText, actionRequested) => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      const isObj = typeof commentOrText === 'object' && commentOrText !== null;
      const textVal = isObj ? (commentOrText.text || commentOrText.content || '') : commentOrText;
      const authorIdVal = (isObj && commentOrText.authorId) ? commentOrText.authorId : s.currentUserId;
      const authorNameVal = (isObj && commentOrText.authorName) ? commentOrText.authorName : (user?.name || 'User');
      const actionVal = (isObj && commentOrText.actionRequested) ? commentOrText.actionRequested : actionRequested;

      const newComment: ContractReviewComment = {
        id: `rc-${Date.now()}`,
        authorId: authorIdVal,
        authorName: authorNameVal,
        text: textVal,
        content: textVal,
        createdAt: new Date().toISOString(),
        actionRequested: actionVal,
      };
      return {
        ...s,
        contracts: s.contracts.map(c => {
          if (c.id === contractId) {
            return {
              ...c,
              reviewComments: [...(c.reviewComments || []), newComment],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        }),
      };
    }),
    markContractReviewed: (contractId, status = 'approved') => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      const nextStatus = status === 'approved' ? 'awaiting_signature' : 'draft';
      return {
        ...s,
        contracts: s.contracts.map(c => {
          if (c.id === contractId) {
            return {
              ...c,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
              activity: [
                ...(c.activity || []),
                {
                  id: `ca-${Date.now()}`,
                  action: status === 'approved' ? 'Approved internal review' : 'Changes requested during review',
                  actor: user?.name || 'User',
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return c;
        }),
      };
    }),

    // Electronic Signatures
    addSignatureRequest: (req) => {
      const newId = req.id || `sig-${Date.now()}`;
      update(s => {
        const user = s.users.find(u => u.id === s.currentUserId);
        const newReq: SignatureRequest = {
          id: newId,
          documentId: req.documentId,
          contractId: req.contractId,
          title: req.title,
          senderId: req.senderId || s.currentUserId,
          signers: req.signers,
          signingOrder: req.signingOrder || 'sequential',
          status: 'sent',
          createdAt: new Date().toISOString(),
          sentAt: new Date().toISOString(),
          expiresAt: req.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          message: req.message || 'Please review and execute this document via Flash Sign simulated e-signature.',
          reminderIntervalDays: req.reminderIntervalDays || 3,
          fields: req.fields || [],
          events: [
            {
              id: `ev-${Date.now()}`,
              requestId: newId,
              documentId: req.documentId,
              eventName: 'Signature Request Created & Dispatched',
              actorName: user?.name || 'User',
              actorEmail: user?.email || '',
              description: `Simulated electronic signature request dispatched to ${req.signers.length} signers.`,
              category: 'creation',
              timestamp: new Date().toISOString(),
            },
          ],
        };

        // If linked to contract, update contract status
        const updatedContracts = s.contracts.map(c => {
          if (c.id === req.contractId || (req.documentId && c.documentId === req.documentId)) {
            return { ...c, status: 'awaiting_signature' as const, signatureRequestId: newId };
          }
          return c;
        });

        // Update document status
        const updatedDocs = s.documentItems.map(d => {
          if (d.id === req.documentId) {
            return { ...d, status: 'pending' as const };
          }
          return d;
        });

        const log: AuditLog = {
          id: `act-${Date.now()}`,
          actorId: s.currentUserId,
          actorName: user?.name || 'User',
          action: 'sent signature request',
          resource: 'SignatureRequest',
          resourceId: newId,
          detail: `"${newReq.title}"`,
          timestamp: new Date().toISOString(),
        };

        return {
          ...s,
          signatureRequests: [newReq, ...s.signatureRequests],
          contracts: updatedContracts,
          documentItems: updatedDocs,
          auditLogs: [log, ...s.auditLogs],
          activities: [log, ...s.activities],
        };
      });
      return newId;
    },
    updateSignatureRequest: (id, updates) => update(s => ({
      ...s,
      signatureRequests: s.signatureRequests.map(r => r.id === id ? { ...r, ...updates } : r),
    })),
    cancelSignatureRequest: (id) => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      return {
        ...s,
        signatureRequests: s.signatureRequests.map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: 'cancelled',
              events: [
                ...(r.events || []),
                {
                  id: `ev-${Date.now()}`,
                  requestId: id,
                  eventName: 'Signature Request Cancelled',
                  actorName: user?.name || 'User',
                  description: 'Request was cancelled by the sender.',
                  category: 'status',
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return r;
        }),
      };
    }),
    duplicateSignatureRequest: (id) => update(s => {
      const orig = s.signatureRequests.find(r => r.id === id);
      if (!orig) return s;
      const cloneId = `sig-${Date.now()}`;
      const clone: SignatureRequest = {
        ...orig,
        id: cloneId,
        title: `Copy of ${orig.title}`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        sentAt: undefined,
        completedAt: undefined,
        signers: orig.signers.map(s => ({ ...s, status: 'pending', signedAt: undefined, viewedAt: undefined })),
        events: [],
      };
      return { ...s, signatureRequests: [clone, ...s.signatureRequests] };
    }),
    sendSignatureReminder: (requestId, signerId) => update(s => {
      const user = s.users.find(u => u.id === s.currentUserId);
      return {
        ...s,
        signatureRequests: s.signatureRequests.map(r => {
          if (r.id === requestId) {
            const targetSigner = signerId ? r.signers.find(x => x.id === signerId)?.name : 'All pending signers';
            return {
              ...r,
              events: [
                ...(r.events || []),
                {
                  id: `ev-${Date.now()}`,
                  requestId,
                  eventName: 'Simulated Reminder Sent',
                  actorName: user?.name || 'User',
                  description: `Simulated signature reminder pinged for: ${targetSigner}.`,
                  category: 'delivery',
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return r;
        }),
      };
    }),
    signDocumentSimulated: (requestId, signerId, signatureValue, seal) => update(s => {
      let reqTitle = '';
      let isAllCompleted = false;
      let linkedContractId: string | undefined;
      let linkedDocumentId: string | undefined;

      const updatedRequests = s.signatureRequests.map(r => {
        if (r.id !== requestId) return r;
        reqTitle = r.title;
        linkedContractId = r.contractId;
        linkedDocumentId = r.documentId;

        const updatedSigners = r.signers.map(sgn => {
          if (sgn.id === signerId || sgn.email === signerId) {
            return {
              ...sgn,
              status: 'signed' as const,
              signedAt: new Date().toISOString(),
              signatureValue,
            };
          }
          return sgn;
        });

        // Determine if all required signers have signed
        const allSigned = updatedSigners
          .filter(sgn => sgn.required)
          .every(sgn => sgn.status === 'signed');

        isAllCompleted = allSigned;

        const signerObj = r.signers.find(x => x.id === signerId || x.email === signerId);
        const newEvent: AuditEvent = {
          id: `ev-${Date.now()}`,
          requestId,
          documentId: r.documentId,
          eventName: 'Demo Signature Executed',
          actorName: signerObj?.name || 'Signer',
          actorEmail: signerObj?.email,
          relatedSigner: signerObj?.name,
          description: `Simulated electronic signature recorded for "${signerObj?.name}". (Demo only, non-binding)`,
          category: 'signing',
          timestamp: new Date().toISOString(),
        };

        const sealEvent: AuditEvent | null = seal
          ? {
              id: `ev-seal-${Date.now()}`,
              requestId,
              documentId: r.documentId,
              eventName: 'Company Seal Applied',
              actorName: signerObj?.name || 'Signer',
              actorEmail: signerObj?.email,
              relatedSigner: signerObj?.name,
              description: `"${seal.name}" applied by ${signerObj?.name || 'signer'}.`,
              category: 'signing',
              timestamp: new Date().toISOString(),
            }
          : null;

        const completionEvent: AuditEvent | null = allSigned
          ? {
              id: `ev-comp-${Date.now()}`,
              requestId,
              documentId: r.documentId,
              eventName: 'Workflow Completed',
              actorName: 'Flash Sign Execution Protocol',
              description: 'All required signers have completed the simulated signature process.',
              category: 'status',
              timestamp: new Date().toISOString(),
            }
          : null;

        return {
          ...r,
          signers: updatedSigners,
          status: allSigned ? ('completed' as const) : ('partially_signed' as const),
          completedAt: allSigned ? new Date().toISOString() : undefined,
          events: [
            ...(r.events || []),
            newEvent,
            ...(sealEvent ? [sealEvent] : []),
            ...(completionEvent ? [completionEvent] : []),
          ],
        };
      });

      // If all completed, also update linked contract to active and document to signed!
      const updatedContracts = s.contracts.map(c => {
        if (isAllCompleted && (c.id === linkedContractId || c.signatureRequestId === requestId)) {
          return { ...c, status: 'active' as const, updatedAt: new Date().toISOString() };
        }
        return c;
      });

      const updatedDocs = s.documentItems.map(d => {
        if (isAllCompleted && d.id === linkedDocumentId) {
          return { ...d, status: 'signed' as const, updatedAt: new Date().toISOString() };
        }
        return d;
      });

      const now = new Date().toISOString();
      return {
        ...s,
        signatureRequests: updatedRequests,
        contracts: updatedContracts,
        documentItems: updatedDocs,
        companySeals: seal
          ? s.companySeals.map(cs => (cs.id === seal.id ? { ...cs, usageCount: cs.usageCount + 1, lastUsedAt: now } : cs))
          : s.companySeals,
      };
    }),
    declineSignatureRequest: (requestId, signerId, reason) => update(s => {
      return {
        ...s,
        signatureRequests: s.signatureRequests.map(r => {
          if (r.id === requestId) {
            const signerObj = r.signers.find(x => x.id === signerId || x.email === signerId);
            return {
              ...r,
              status: 'declined',
              signers: r.signers.map(sgn =>
                sgn.id === signerId || sgn.email === signerId
                  ? { ...sgn, status: 'declined' as const, declinedAt: new Date().toISOString(), declineReason: reason }
                  : sgn
              ),
              events: [
                ...(r.events || []),
                {
                  id: `ev-${Date.now()}`,
                  requestId,
                  eventName: 'Signature Declined',
                  actorName: signerObj?.name || 'Signer',
                  description: `Signer declined with reason: "${reason}".`,
                  category: 'status',
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return r;
        }),
      };
    }),
    updateSignatureFields: (requestId, fields) => update(s => ({
      ...s,
      signatureRequests: s.signatureRequests.map(r =>
        r.id === requestId ? { ...r, fields } : r
      ),
    })),

    // Approvals
    updateApproval: (id, updates) => update(s => ({
      ...s,
      approvals: s.approvals.map(a => a.id === id ? { ...a, ...updates } : a),
    })),

    // Agent Runs
    addAgentRun: (run) => update(s => ({ ...s, agentRuns: [...s.agentRuns, run] })),
    updateAgentRun: (id, updates) => update(s => ({
      ...s,
      agentRuns: s.agentRuns.map(r => r.id === id ? { ...r, ...updates } : r),
    })),

    // Notifications
    markNotificationRead: (id) => update(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    })),
    markAllNotificationsRead: () => update(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
    })),

    // UI & Drawer
    toggleSidebar: () => update(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),
    openTaskDrawer: (taskId) => update(s => ({ ...s, activeTaskDrawerId: taskId })),
    closeTaskDrawer: () => update(s => ({ ...s, activeTaskDrawerId: null })),

    // Reset
    resetDemoData: () => {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      update(() => getInitialState());
    },
  }), [update]);

  const value: AppContextValue = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Convenience hooks
export function useCurrentUser(): User | undefined {
  const { users, currentUserId } = useApp();
  return users.find(u => u.id === currentUserId);
}

export function useCurrentRole(): DemoRole {
  return useApp().demoRole;
}

export function useRoleConfig() {
  const role = useCurrentRole();
  return ROLE_CONFIGS[role];
}

export function useProjects() {
  return useApp().projects;
}

export function useTasks() {
  return useApp().tasks;
}

export function useSprints() {
  return useApp().sprints;
}

export function useMilestones() {
  return useApp().milestones;
}

export function useTeams() {
  return useApp().teams;
}

export function useProjectFiles() {
  return useApp().files;
}

export function useDocuments() {
  return useApp().documents;
}

export function useNotifications(userId?: string) {
  const { notifications, currentUserId } = useApp();
  const uid = userId ?? currentUserId;
  return notifications.filter(n => n.userId === uid);
}

export function useCalendarEvents() {
  return useApp().calendarEvents;
}

export function useTimeOffRequests() {
  return useApp().timeOffRequests;
}

export function useMeetings() {
  return useApp().meetings;
}

export function useAnnouncements() {
  return useApp().announcements;
}

export function useCollaborationSettings() {
  return useApp().collaborationSettings;
}

export function useDocumentItems() {
  return useApp().documentItems;
}

export function useDocumentFolders() {
  return useApp().documentFolders;
}

export function useDocumentTemplates() {
  return useApp().documentTemplates;
}

export function useContracts() {
  return useApp().contracts;
}

export function useSignatureRequests() {
  return useApp().signatureRequests;
}
