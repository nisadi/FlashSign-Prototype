'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  DemoRole, User, Project, Task, Sprint, Document, ApprovalRequest,
  Notification, AuditLog, AgentRun, Milestone, Team, ProjectFile,
  CalendarEvent, TimeOffRequest, Meeting, Announcement, CollaborationSettings,
  AvailabilityStatus, LeaveType, EventCategory,
} from '@/types';
import {
  MOCK_USERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_SPRINTS, MOCK_DOCUMENTS,
  MOCK_APPROVALS, MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS, MOCK_AGENT_RUNS,
  MOCK_MILESTONES, MOCK_TEAMS, MOCK_PROJECT_FILES, DEMO_ROLE_USERS, MOCK_ORG,
} from '@/data/mock-data';
import {
  MOCK_CALENDAR_EVENTS, MOCK_TIME_OFF, MOCK_MEETINGS, MOCK_ANNOUNCEMENTS,
  MOCK_COLLABORATION_SETTINGS,
} from '@/data/mock-collaboration';
import { ROLE_CONFIGS } from '@/lib/permissions';
import type { Organization } from '@/types';

// ── State Shape ────────────────────────────────────────────────────────────────
export type CreateProjectInput = Partial<Project> & { name: string };
export type CreateTaskInput = Partial<Task> & { title: string; projectId: string };
export type CreateSprintInput = Partial<Sprint> & { name: string; projectId: string };
export type CreateMilestoneInput = Partial<Milestone> & { name: string; projectId: string };
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
  teams: Team[];
  files: ProjectFile[];
  documents: Document[];
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
  reassignTask: (taskId: string, newAssigneeId: string) => void;
  // Sprints
  addSprint: (sprint: CreateSprintInput) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  // Milestones
  addMilestone: (milestone: CreateMilestoneInput) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
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
    calendarEvents: MOCK_CALENDAR_EVENTS,
    timeOffRequests: MOCK_TIME_OFF,
    meetings: MOCK_MEETINGS,
    announcements: MOCK_ANNOUNCEMENTS,
    collaborationSettings: MOCK_COLLABORATION_SETTINGS,
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
      users: state.users,
      teams: state.teams,
      projects: state.projects,
      tasks: state.tasks,
      sprints: state.sprints,
      milestones: state.milestones,
      files: state.files,
      documents: state.documents,
      approvals: state.approvals,
      notifications: state.notifications,
      calendarEvents: state.calendarEvents,
      timeOffRequests: state.timeOffRequests,
      meetings: state.meetings,
      announcements: state.announcements,
      collaborationSettings: state.collaborationSettings,
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
        link: '/planner/time-off',
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
        link: '/planner/time-off',
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
        link: '/planner/time-off',
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

