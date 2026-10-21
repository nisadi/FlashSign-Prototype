'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  DemoRole, User, Project, Task, Sprint, Document, ApprovalRequest,
  Notification, AuditLog, AgentRun, Milestone, Team, ProjectFile,
} from '@/types';
import {
  MOCK_USERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_SPRINTS, MOCK_DOCUMENTS,
  MOCK_APPROVALS, MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS, MOCK_AGENT_RUNS,
  MOCK_MILESTONES, MOCK_TEAMS, MOCK_PROJECT_FILES, DEMO_ROLE_USERS, MOCK_ORG,
} from '@/data/mock-data';
import { ROLE_CONFIGS } from '@/lib/permissions';
import type { Organization } from '@/types';

// ── State Shape ────────────────────────────────────────────────────────────────
export type CreateProjectInput = Partial<Project> & { name: string };
export type CreateTaskInput = Partial<Task> & { title: string; projectId: string };
export type CreateSprintInput = Partial<Sprint> & { name: string; projectId: string };
export type CreateMilestoneInput = Partial<Milestone> & { name: string; projectId: string };
export type CreateFileInput = Partial<ProjectFile> & { name: string; projectId: string };

export interface AppState {
  demoRole: DemoRole;
  currentUserId: string;
  org: Organization;
  users: User[];
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  milestones: Milestone[];
  teams: Team[];
  files: ProjectFile[];
  documents: Document[];
  approvals: ApprovalRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  activities: AuditLog[];
  agentRuns: AgentRun[];
  sidebarCollapsed: boolean;
  recentProjectIds: string[];
  activeTaskDrawerId: string | null;
}

// ── Actions ────────────────────────────────────────────────────────────────────
interface AppActions {
  setDemoRole: (role: DemoRole) => void;
  // Projects
  addProject: (project: CreateProjectInput) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;
  addRecentProject: (id: string) => void;
  // Tasks
  addTask: (task: CreateTaskInput) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // Sprints
  addSprint: (sprint: CreateSprintInput) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  // Milestones
  addMilestone: (milestone: CreateMilestoneInput) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  // Files
  addFile: (file: CreateFileInput) => void;
  deleteFile: (id: string) => void;
  // Activity
  addActivity: (log: Partial<AuditLog> & { action: string; resource: string; resourceId: string }) => void;
  // Documents
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
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

const STORAGE_KEY = 'flashsign-proto-state';

function getInitialState(): AppState {
  return {
    demoRole: 'project_manager',
    currentUserId: DEMO_ROLE_USERS['project_manager'],
    org: MOCK_ORG,
    users: MOCK_USERS,
    projects: MOCK_PROJECTS,
    tasks: MOCK_TASKS,
    sprints: MOCK_SPRINTS,
    milestones: MOCK_MILESTONES,
    teams: MOCK_TEAMS,
    files: MOCK_PROJECT_FILES,
    documents: MOCK_DOCUMENTS,
    approvals: MOCK_APPROVALS,
    notifications: MOCK_NOTIFICATIONS,
    auditLogs: MOCK_AUDIT_LOGS,
    activities: MOCK_AUDIT_LOGS,
    agentRuns: MOCK_AGENT_RUNS,
    sidebarCollapsed: false,
    recentProjectIds: ['p1', 'p2', 'p3'],
    activeTaskDrawerId: null,
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const saved = JSON.parse(raw) as Partial<AppState>;
    return { ...getInitialState(), ...saved };
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
      projects: state.projects,
      tasks: state.tasks,
      sprints: state.sprints,
      milestones: state.milestones,
      files: state.files,
      documents: state.documents,
      approvals: state.approvals,
      notifications: state.notifications,
      agentRuns: state.agentRuns,
      sidebarCollapsed: state.sidebarCollapsed,
      recentProjectIds: state.recentProjectIds,
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
    setState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

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
      const newProject: Project = {
        id: p.id || `p-${Date.now()}`,
        name: p.name,
        key: p.key || p.name.substring(0, 3).toUpperCase(),
        description: p.description || '',
        status: p.status || 'active',
        health: p.health || 'on_track',
        ownerId: p.ownerId || s.currentUserId,
        teamIds: p.teamIds || [],
        memberIds: p.memberIds || [s.currentUserId],
        startDate: p.startDate || new Date().toISOString().split('T')[0],
        endDate: p.endDate || p.dueDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        dueDate: p.dueDate || p.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        progress: p.progress || 0,
        priority: p.priority || 'medium',
        tags: p.tags || [],
        category: p.category,
        group: p.group,
        isFavorite: p.isFavorite,
        isArchived: p.isArchived,
        accentColor: p.accentColor,
        goals: p.goals,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...s,
        projects: [newProject, ...s.projects],
        recentProjectIds: [newProject.id, ...s.recentProjectIds.filter(id => id !== newProject.id)],
      };
    }),
    updateProject: (id, updates) => update(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p),
    })),
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
        key: t.key || `FS-${s.tasks.length + 1}`,
        title: t.title,
        description: t.description || '',
        type: t.type || 'task',
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        projectId: t.projectId,
        sprintId: t.sprintId,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId || s.currentUserId,
        parentId: t.parentId,
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
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextTasks = [newTask, ...s.tasks];
      // Recalculate project progress
      const projectTasks = nextTasks.filter(item => item.projectId === newTask.projectId);
      const doneCount = projectTasks.filter(item => item.status === 'done').length;
      const progress = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
      return {
        ...s,
        tasks: nextTasks,
        projects: s.projects.map(p => p.id === newTask.projectId ? { ...p, progress, updatedAt: new Date().toISOString() } : p),
      };
    }),
    updateTask: (id, updates) => update(s => {
      const nextTasks = s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
      const updatedTask = nextTasks.find(t => t.id === id);
      const projectId = updatedTask?.projectId;
      let nextProjects = s.projects;
      if (projectId) {
        const projectTasks = nextTasks.filter(t => t.projectId === projectId);
        const doneCount = projectTasks.filter(t => t.status === 'done').length;
        const progress = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
        nextProjects = s.projects.map(p => p.id === projectId ? { ...p, progress, updatedAt: new Date().toISOString() } : p);
      }
      return {
        ...s,
        tasks: nextTasks,
        projects: nextProjects,
      };
    }),
    deleteTask: (id) => update(s => {
      const taskToDelete = s.tasks.find(t => t.id === id);
      const nextTasks = s.tasks.filter(t => t.id !== id);
      const projectId = taskToDelete?.projectId;
      let nextProjects = s.projects;
      if (projectId) {
        const projectTasks = nextTasks.filter(t => t.projectId === projectId);
        const doneCount = projectTasks.filter(t => t.status === 'done').length;
        const progress = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
        nextProjects = s.projects.map(p => p.id === projectId ? { ...p, progress } : p);
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
        dueDate: m.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: m.status || 'pending',
        progress: m.progress || 0,
        taskIds: m.taskIds || [],
      };
      return { ...s, milestones: [...s.milestones, newMilestone] };
    }),
    updateMilestone: (id, updates) => update(s => ({
      ...s,
      milestones: s.milestones.map(m => m.id === id ? { ...m, ...updates } : m),
    })),
    deleteMilestone: (id) => update(s => ({ ...s, milestones: s.milestones.filter(m => m.id !== id) })),

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
      };
      return { ...s, files: [newFile, ...s.files] };
    }),
    deleteFile: (id) => update(s => ({ ...s, files: s.files.filter(f => f.id !== id) })),

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

    // Documents
    addDocument: (doc) => update(s => ({ ...s, documents: [...s.documents, doc] })),
    updateDocument: (id, updates) => update(s => ({
      ...s,
      documents: s.documents.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d),
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
