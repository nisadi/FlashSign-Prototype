'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  DemoUser,
  DemoWorkspace,
  DemoPreferences,
  DemoInvitation,
  DemoRole,
} from '@/types/demo-auth';
import {
  INITIAL_DEMO_WORKSPACES,
  DEMO_PRESET_USERS,
  INITIAL_DEMO_INVITATIONS,
} from '@/types/demo-auth';
import { INVITE_VALID_DAYS, isInviteExpired, type InvitePayload } from '@/lib/invitations';
import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
  STORAGE_KEYS,
} from '@/lib/storage';
import { slugify } from '@/lib/utils';
import {
  type CustomRole,
  type DemoUserAccount,
  type SuperAdminOrg,
  type SuperAdminOrgInvitation,
  INITIAL_ROLES,
  DEMO_ACCOUNTS,
  INITIAL_SUPER_ADMIN_ORGS,
  INITIAL_SUPER_ADMIN_INVITATIONS,
  RBAC_STORAGE_KEYS,
} from '@/lib/rbac';

const DEFAULT_PREFERENCES: DemoPreferences = {
  theme: 'light',
  inAppNotifications: true,
  emailNotifications: true,
  taskAssignmentAlerts: true,
  deadlineReminders: true,
  approvalReminders: true,
  timezone: 'America/New_York (UTC-5)',
};

export interface DemoAuthContextType {
  currentUser: DemoUser | null;
  currentOrganization: DemoWorkspace | null;
  selectedWorkspace: DemoWorkspace;
  workspaces: DemoWorkspace[];
  organizations: DemoWorkspace[];
  users: DemoUser[];
  preferences: DemoPreferences;
  isAuthenticated: boolean;
  isHydrated: boolean;
  completedSteps: string[];
  pendingSignupUser: DemoUser | null;
  authMessage: string | null;
  invitations: DemoInvitation[];

  // ── RBAC & Role Management ────────────────────────────────────────────────
  currentRbacUser: DemoUserAccount | null;
  roles: CustomRole[];
  demoAccounts: DemoUserAccount[];
  switchDemoAccount: (idOrEmail: string) => DemoUserAccount | undefined;
  createRole: (roleData: Omit<CustomRole, 'id' | 'createdAt'>) => CustomRole;
  updateRole: (roleId: string, roleData: Partial<CustomRole>) => CustomRole | undefined;
  deleteRole: (roleId: string) => { success: boolean; error?: string };
  updateMemberRoleAndProjects: (userId: string, roleId: string, assignedProjectIds: string[]) => void;

  // ── Super Admin Management ────────────────────────────────────────────────
  superAdminOrgs: SuperAdminOrg[];
  superAdminOrgInvitations: SuperAdminOrgInvitation[];
  createSuperAdminOrg: (data: Omit<SuperAdminOrg, 'id' | 'createdAt' | 'memberCount' | 'projectCount'>) => SuperAdminOrg;
  updateSuperAdminOrg: (orgId: string, data: Partial<SuperAdminOrg>) => void;
  updateSuperAdminOrgStatus: (orgId: string, status: 'active' | 'pending' | 'inactive') => void;
  deleteSuperAdminOrg: (orgId: string) => void;
  inviteSuperAdminOrg: (data: { organizationName: string; ownerEmail: string; plan: string; message?: string }) => SuperAdminOrgInvitation;
  resendSuperAdminOrgInvite: (inviteId: string) => void;
  revokeSuperAdminOrgInvite: (inviteId: string) => void;

  // ── Authentication & Onboarding ───────────────────────────────────────────
  signUp: (data: {
    fullName: string;
    email: string;
    password: string;
    jobTitle?: string;
  }) => { success: boolean; user?: DemoUser; error?: string };

  createOrganization: (data: {
    name: string;
    slug: string;
    industry: string;
    size: string;
    website?: string;
    description?: string;
  }) => { success: boolean; organization?: DemoWorkspace; error?: string };

  login: (
    email: string,
    password?: string,
    rememberMe?: boolean
  ) => { success: boolean; error?: string; requiresOrgSetup?: boolean; user?: DemoUser; rbacUser?: DemoUserAccount };

  logout: () => void;
  clearAuthMessage: () => void;

  // ── Invitations ───────────────────────────────────────────────────────────
  sendInvitation: (data: {
    email: string;
    fullName?: string;
    role: DemoRole;
    jobTitle?: string;
    department?: string;
    message?: string;
    roleId?: string;
    assignedProjectIds?: string[];
  }) => { success: boolean; invitation?: DemoInvitation; error?: string };
  resendInvitation: (id: string) => DemoInvitation | undefined;
  revokeInvitation: (id: string) => void;
  acceptInvitation: (
    invite: InvitePayload,
    data: { fullName: string; password: string; jobTitle?: string }
  ) => { success: boolean; error?: string };
  setPendingSignupUser: (user: DemoUser | null) => void;

  // Backward compatibility methods
  register: (fullName: string, email: string, companyName?: string) => void;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (
    name: string,
    type: string,
    companySize: string,
    description?: string,
    accentColor?: string
  ) => DemoWorkspace;
  updateProfile: (updates: Partial<DemoUser>) => void;
  updatePreferences: (updates: Partial<DemoPreferences>) => void;
  markStepComplete: (step: string) => void;
  resetDemo: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<DemoUser[]>(DEMO_PRESET_USERS);
  const [workspaces, setWorkspaces] = useState<DemoWorkspace[]>(INITIAL_DEMO_WORKSPACES);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<DemoWorkspace>(INITIAL_DEMO_WORKSPACES[0]);
  const [preferences, setPreferences] = useState<DemoPreferences>(DEFAULT_PREFERENCES);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>(['workspace']);
  const [pendingSignupUser, setPendingSignupUserState] = useState<DemoUser | null>(null);
  const [authMessage, setAuthMessageState] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<DemoInvitation[]>(INITIAL_DEMO_INVITATIONS);
  const [isHydrated, setIsHydrated] = useState(false);

  // RBAC State
  const [roles, setRoles] = useState<CustomRole[]>(INITIAL_ROLES);
  const [demoAccounts, setDemoAccounts] = useState<DemoUserAccount[]>(DEMO_ACCOUNTS);
  const [currentRbacUser, setCurrentRbacUserState] = useState<DemoUserAccount | null>(DEMO_ACCOUNTS[1]); // Default: Owner

  // Super Admin Organizations and Invitations
  const [superAdminOrgs, setSuperAdminOrgs] = useState<SuperAdminOrg[]>(INITIAL_SUPER_ADMIN_ORGS);
  const [superAdminOrgInvitations, setSuperAdminOrgInvitations] = useState<SuperAdminOrgInvitation[]>(INITIAL_SUPER_ADMIN_INVITATIONS);

  // Safely hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      // Hydrate custom roles
      const storedRoles = safeStorageGet<CustomRole[] | null>(RBAC_STORAGE_KEYS.CUSTOM_ROLES, null);
      if (storedRoles && storedRoles.length > 0) {
        setRoles(storedRoles);
      }

      // Hydrate demo accounts
      const storedDemoAccounts = safeStorageGet<DemoUserAccount[] | null>(RBAC_STORAGE_KEYS.DEMO_ACCOUNTS, null);
      let activeAccounts = DEMO_ACCOUNTS;
      if (storedDemoAccounts && storedDemoAccounts.length > 0) {
        activeAccounts = storedDemoAccounts;
        setDemoAccounts(storedDemoAccounts);
      }

      // Hydrate super admin orgs
      const storedSuperAdminOrgs = safeStorageGet<SuperAdminOrg[] | null>(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, null);
      if (storedSuperAdminOrgs && storedSuperAdminOrgs.length > 0) {
        setSuperAdminOrgs(storedSuperAdminOrgs);
      }

      // Hydrate super admin org invites
      const storedSuperAdminInvites = safeStorageGet<SuperAdminOrgInvitation[] | null>(RBAC_STORAGE_KEYS.SUPER_ADMIN_INVITATIONS, null);
      if (storedSuperAdminInvites && storedSuperAdminInvites.length > 0) {
        setSuperAdminOrgInvitations(storedSuperAdminInvites);
      }

      // Hydrate RBAC current user
      const storedRbacUser = safeStorageGet<DemoUserAccount | null>(RBAC_STORAGE_KEYS.CURRENT_USER, null);
      if (storedRbacUser) {
        const found = activeAccounts.find(a => a.id === storedRbacUser.id) || storedRbacUser;
        setCurrentRbacUserState(found);
      } else {
        setCurrentRbacUserState(DEMO_ACCOUNTS[1]); // Default to Owner
      }

      // 1. Hydrate users list or seed with demo preset users
      const storedUsers = safeStorageGet<DemoUser[] | null>(STORAGE_KEYS.USERS, null);
      let currentUsersList = DEMO_PRESET_USERS;
      if (storedUsers && storedUsers.length > 0) {
        const map = new Map<string, DemoUser>();
        DEMO_PRESET_USERS.forEach((u) => map.set(u.id, u));
        storedUsers.forEach((u) => map.set(u.id, u));
        currentUsersList = Array.from(map.values());
        setUsers(currentUsersList);
      } else {
        setUsers(DEMO_PRESET_USERS);
      }

      // 2. Hydrate organizations / workspaces
      const storedWorkspaces = safeStorageGet<DemoWorkspace[] | null>(STORAGE_KEYS.WORKSPACES, null);
      let currentWorkspacesList = INITIAL_DEMO_WORKSPACES;
      if (storedWorkspaces && storedWorkspaces.length > 0) {
        const wsMap = new Map<string, DemoWorkspace>();
        INITIAL_DEMO_WORKSPACES.forEach((w) => wsMap.set(w.id, w));
        storedWorkspaces.forEach((w) => wsMap.set(w.id, w));
        currentWorkspacesList = Array.from(wsMap.values());
        setWorkspaces(currentWorkspacesList);
      }

      // 3. Hydrate pending registration state
      const storedPending = safeStorageGet<DemoUser | null>(STORAGE_KEYS.PENDING_SIGNUP, null);
      if (storedPending) {
        setPendingSignupUserState(storedPending);
      }

      // 4. Hydrate auth success message
      const storedMsg = safeStorageGet<string | null>(STORAGE_KEYS.AUTH_SUCCESS_MSG, null);
      if (storedMsg) {
        setAuthMessageState(storedMsg);
      }

      // 5. Hydrate session and logged in user
      const sessionActive = safeStorageGet<boolean>(STORAGE_KEYS.SESSION_ACTIVE, false);
      const storedUser = safeStorageGet<DemoUser | null>(STORAGE_KEYS.USER, null);

      if (sessionActive && storedUser) {
        const activeUser = currentUsersList.find((u) => u.id === storedUser.id) || storedUser;
        setCurrentUser(activeUser);
        setIsAuthenticated(true);

        const associatedWs =
          currentWorkspacesList.find((w) => w.id === activeUser.organizationId) ||
          currentWorkspacesList[0];
        setSelectedWorkspace(associatedWs);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }

      // 6. Preferences & Steps
      const storedPrefs = safeStorageGet<DemoPreferences | null>(STORAGE_KEYS.PREFERENCES, null);
      if (storedPrefs) setPreferences(storedPrefs);

      const storedSteps = safeStorageGet<string[] | null>(STORAGE_KEYS.COMPLETED_STEPS, null);
      if (storedSteps) setCompletedSteps(storedSteps);

      // 7. Invitations
      const storedInvitations = safeStorageGet<DemoInvitation[] | null>(STORAGE_KEYS.INVITATIONS, null);
      if (storedInvitations) setInvitations(storedInvitations);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ── Switch Demo Account ───────────────────────────────────────────────────
  const switchDemoAccount = useCallback(
    (idOrEmail: string) => {
      const target = idOrEmail.toLowerCase().trim();
      let account = demoAccounts.find(
        (a) => a.id.toLowerCase() === target || a.email.toLowerCase() === target
      );

      // Fallback for demo@flashsign.com -> Owner
      if (!account && target === 'demo@flashsign.com') {
        account = demoAccounts.find((a) => a.id === 'demo-owner');
      }

      if (!account) return undefined;

      setCurrentRbacUserState(account);
      safeStorageSet(RBAC_STORAGE_KEYS.CURRENT_USER, account);

      // Map to DemoUser
      const mappedRole: DemoRole = account.isSuperAdmin
        ? 'org_admin'
        : account.isOwner
        ? 'executive'
        : account.roleId === 'role-pm'
        ? 'project_manager'
        : account.roleId === 'role-team-lead'
        ? 'engineering_lead'
        : account.roleId === 'role-dev'
        ? 'developer'
        : account.roleId === 'role-qa'
        ? 'qa'
        : 'developer';

      const demoUser: DemoUser = {
        id: account.id,
        fullName: account.name,
        email: account.email,
        jobTitle: account.jobTitle,
        department: account.department,
        role: mappedRole,
        organizationId: account.organizationId || 'ws-flash',
        avatarColor: account.avatarColor,
        avatarInitials: account.avatarInitials,
        registrationCompleted: true,
        organizationSetupCompleted: true,
      };

      setCurrentUser(demoUser);
      setIsAuthenticated(true);
      safeStorageSet(STORAGE_KEYS.USER, demoUser);
      safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);

      return account;
    },
    [demoAccounts]
  );

  // ── Role Management ───────────────────────────────────────────────────────
  const createRole = useCallback(
    (roleData: Omit<CustomRole, 'id' | 'createdAt'>) => {
      const newRole: CustomRole = {
        ...roleData,
        id: `role-${Date.now().toString(36)}`,
        isSystem: false,
        createdAt: new Date().toISOString(),
      };

      const nextRoles = [...roles, newRole];
      setRoles(nextRoles);
      safeStorageSet(RBAC_STORAGE_KEYS.CUSTOM_ROLES, nextRoles);
      return newRole;
    },
    [roles]
  );

  const updateRole = useCallback(
    (roleId: string, roleData: Partial<CustomRole>) => {
      const idx = roles.findIndex((r) => r.id === roleId);
      if (idx === -1) return undefined;

      const updatedRole: CustomRole = { ...roles[idx], ...roleData };
      const nextRoles = [...roles];
      nextRoles[idx] = updatedRole;
      setRoles(nextRoles);
      safeStorageSet(RBAC_STORAGE_KEYS.CUSTOM_ROLES, nextRoles);

      // Immediately propagate updated permissions to all demo users assigned to this role
      setDemoAccounts((prevAccounts) => {
        const updatedAccounts = prevAccounts.map((account) => {
          if (account.roleId === roleId) {
            return {
              ...account,
              roleName: updatedRole.name,
              dashboardAccess: updatedRole.dashboardAccess,
              projectAccess: updatedRole.projectAccess,
              myTasksAccess: updatedRole.myTasksAccess,
              teamAccess: updatedRole.teamAccess,
            };
          }
          return account;
        });

        safeStorageSet(RBAC_STORAGE_KEYS.DEMO_ACCOUNTS, updatedAccounts);

        // Update active RBAC user if matching
        setCurrentRbacUserState((activeUser) => {
          if (activeUser && activeUser.roleId === roleId) {
            const nextActive: DemoUserAccount = {
              ...activeUser,
              roleName: updatedRole.name,
              dashboardAccess: updatedRole.dashboardAccess,
              projectAccess: updatedRole.projectAccess,
              myTasksAccess: updatedRole.myTasksAccess,
              teamAccess: updatedRole.teamAccess,
            };
            safeStorageSet(RBAC_STORAGE_KEYS.CURRENT_USER, nextActive);
            return nextActive;
          }
          return activeUser;
        });

        return updatedAccounts;
      });

      return updatedRole;
    },
    [roles]
  );

  const deleteRole = useCallback(
    (roleId: string) => {
      const targetRole = roles.find((r) => r.id === roleId);
      if (!targetRole) return { success: false, error: 'Role not found.' };
      if (targetRole.isSystem) {
        return { success: false, error: 'System standard roles cannot be deleted.' };
      }

      // Check if any demo account uses this role
      const inUse = demoAccounts.some((a) => a.roleId === roleId);
      if (inUse) {
        return {
          success: false,
          error: 'This role is currently assigned to one or more active members. Reassign members before deleting.',
        };
      }

      const nextRoles = roles.filter((r) => r.id !== roleId);
      setRoles(nextRoles);
      safeStorageSet(RBAC_STORAGE_KEYS.CUSTOM_ROLES, nextRoles);
      return { success: true };
    },
    [roles, demoAccounts]
  );

  const updateMemberRoleAndProjects = useCallback(
    (userId: string, roleId: string, assignedProjectIds: string[]) => {
      const targetRole = roles.find((r) => r.id === roleId);
      if (!targetRole) return;

      setDemoAccounts((prevAccounts) => {
        const nextAccounts = prevAccounts.map((account) => {
          if (account.id === userId) {
            return {
              ...account,
              roleId,
              roleName: targetRole.name,
              dashboardAccess: targetRole.dashboardAccess,
              projectAccess: targetRole.projectAccess,
              myTasksAccess: targetRole.myTasksAccess,
              teamAccess: targetRole.teamAccess,
              assignedProjectIds,
            };
          }
          return account;
        });
        safeStorageSet(RBAC_STORAGE_KEYS.DEMO_ACCOUNTS, nextAccounts);

        setCurrentRbacUserState((active) => {
          if (active && active.id === userId) {
            const nextActive: DemoUserAccount = {
              ...active,
              roleId,
              roleName: targetRole.name,
              dashboardAccess: targetRole.dashboardAccess,
              projectAccess: targetRole.projectAccess,
              myTasksAccess: targetRole.myTasksAccess,
              teamAccess: targetRole.teamAccess,
              assignedProjectIds,
            };
            safeStorageSet(RBAC_STORAGE_KEYS.CURRENT_USER, nextActive);
            return nextActive;
          }
          return active;
        });

        return nextAccounts;
      });
    },
    [roles]
  );

  // ── Super Admin Management ────────────────────────────────────────────────
  const createSuperAdminOrg = useCallback(
    (data: Omit<SuperAdminOrg, 'id' | 'createdAt' | 'memberCount' | 'projectCount'>) => {
      const newOrg: SuperAdminOrg = {
        ...data,
        id: `org-${Date.now().toString(36)}`,
        status: data.status || 'active',
        memberCount: 1,
        projectCount: 0,
        createdAt: new Date().toISOString(),
      };
      const next = [newOrg, ...superAdminOrgs];
      setSuperAdminOrgs(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, next);
      return newOrg;
    },
    [superAdminOrgs]
  );

  const updateSuperAdminOrg = useCallback(
    (orgId: string, data: Partial<SuperAdminOrg>) => {
      const next = superAdminOrgs.map((o) => (o.id === orgId ? { ...o, ...data } : o));
      setSuperAdminOrgs(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, next);
    },
    [superAdminOrgs]
  );

  const updateSuperAdminOrgStatus = useCallback(
    (orgId: string, status: 'active' | 'pending' | 'inactive') => {
      const next = superAdminOrgs.map((o) => (o.id === orgId ? { ...o, status } : o));
      setSuperAdminOrgs(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, next);
    },
    [superAdminOrgs]
  );

  const deleteSuperAdminOrg = useCallback(
    (orgId: string) => {
      const next = superAdminOrgs.filter((o) => o.id !== orgId);
      setSuperAdminOrgs(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, next);
    },
    [superAdminOrgs]
  );

  const inviteSuperAdminOrg = useCallback(
    (data: { organizationName: string; ownerEmail: string; plan: string; message?: string }) => {
      const now = Date.now();
      const newInvite: SuperAdminOrgInvitation = {
        id: `inv-org-${now.toString(36)}`,
        organizationName: data.organizationName,
        ownerEmail: data.ownerEmail,
        plan: data.plan,
        message: data.message,
        status: 'pending',
        sentAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const next = [newInvite, ...superAdminOrgInvitations];
      setSuperAdminOrgInvitations(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_INVITATIONS, next);
      return newInvite;
    },
    [superAdminOrgInvitations]
  );

  const resendSuperAdminOrgInvite = useCallback(
    (inviteId: string) => {
      const now = Date.now();
      const next = superAdminOrgInvitations.map((i) =>
        i.id === inviteId
          ? {
              ...i,
              status: 'pending' as const,
              sentAt: new Date(now).toISOString(),
              expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : i
      );
      setSuperAdminOrgInvitations(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_INVITATIONS, next);
    },
    [superAdminOrgInvitations]
  );

  const revokeSuperAdminOrgInvite = useCallback(
    (inviteId: string) => {
      const next = superAdminOrgInvitations.map((i) =>
        i.id === inviteId ? { ...i, status: 'expired' as const } : i
      );
      setSuperAdminOrgInvitations(next);
      safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_INVITATIONS, next);
    },
    [superAdminOrgInvitations]
  );

  const setPendingSignupUser = useCallback((user: DemoUser | null) => {
    setPendingSignupUserState(user);
    if (user) {
      safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, user);
    } else {
      safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
    }
  }, []);

  const clearAuthMessage = useCallback(() => {
    setAuthMessageState(null);
    safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
  }, []);

  const saveInvitations = useCallback((next: DemoInvitation[]) => {
    setInvitations(next);
    safeStorageSet(STORAGE_KEYS.INVITATIONS, next);
  }, []);

  const openInvitationFor = useCallback(
    (email: string) =>
      invitations.find((i) => i.email.toLowerCase() === email.toLowerCase() && !isInviteExpired(i)),
    [invitations]
  );

  // ── SignUp (Owner creating initial account) ───────────────────────────────
  const signUp = useCallback(
    (data: { fullName: string; email: string; password: string; jobTitle?: string }) => {
      const normalizedEmail = data.email.trim().toLowerCase();
      const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in instead.',
        };
      }

      const generatedId = `user-${Date.now().toString(36)}`;
      const initials =
        data.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'DU';

      const newUser: DemoUser = {
        id: generatedId,
        fullName: data.fullName.trim(),
        email: normalizedEmail,
        password: data.password,
        jobTitle: data.jobTitle?.trim() || 'Founder & CEO',
        department: 'Executive',
        timezone: 'America/New_York (UTC-5)',
        role: 'executive',
        organizationId: null,
        registrationCompleted: true,
        organizationSetupCompleted: false,
        avatarColor: '#00c2a8',
        avatarInitials: initials,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      safeStorageSet(STORAGE_KEYS.USERS, updatedUsers);

      setPendingSignupUserState(newUser);
      safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, newUser);

      return { success: true, user: newUser };
    },
    [users]
  );

  // ── Create Organization ───────────────────────────────────────────────────
  const createOrganization = useCallback(
    (data: {
      name: string;
      slug: string;
      industry: string;
      size: string;
      website?: string;
      description?: string;
    }) => {
      const user = pendingSignupUser || currentUser;
      if (!user) {
        return {
          success: false,
          error: 'User session not found. Please complete the registration step first.',
        };
      }

      const existingSlug = workspaces.find(
        (w) => w.slug.toLowerCase() === data.slug.toLowerCase().trim()
      );
      if (existingSlug) {
        return {
          success: false,
          error: 'This workspace URL slug is already taken. Please choose another one.',
        };
      }

      const orgId = `ws-${slugify(data.slug) || Date.now().toString(36)}`;
      const initials =
        data.name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'FS';

      const newOrg: DemoWorkspace = {
        id: orgId,
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        industry: data.industry,
        size: data.size,
        companySize: data.size,
        type: data.industry,
        website: data.website?.trim() || `https://${data.slug}.flashsign.com`,
        description: data.description?.trim() || 'Flash Sign digital execution and agreement workspace.',
        ownerId: user.id,
        memberCount: 1,
        activeProjectCount: 1,
        accentColor: '#00c2a8',
        initials,
        createdAt: new Date().toISOString(),
      };

      const updatedUser: DemoUser = {
        ...user,
        organizationId: orgId,
        organizationSetupCompleted: true,
        role: 'executive',
      };

      const updatedWorkspaces = [newOrg, ...workspaces.filter((w) => w.id !== orgId)];
      setWorkspaces(updatedWorkspaces);
      setSelectedWorkspace(newOrg);
      safeStorageSet(STORAGE_KEYS.WORKSPACES, updatedWorkspaces);
      safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, newOrg);

      const updatedUsers = users.some((u) => u.id === updatedUser.id)
        ? users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [...users, updatedUser];
      setUsers(updatedUsers);
      safeStorageSet(STORAGE_KEYS.USERS, updatedUsers);

      setPendingSignupUserState(updatedUser);
      safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, updatedUser);

      const successMessage = `Organization "${newOrg.name}" created successfully! Please log in to access your workspace.`;
      setAuthMessageState(successMessage);
      safeStorageSet(STORAGE_KEYS.AUTH_SUCCESS_MSG, successMessage);

      return { success: true, organization: newOrg };
    },
    [workspaces, users, pendingSignupUser, currentUser]
  );

  // ── Step 3: Login (Existing and Demo Users) ────────────────────────────────
  const login = useCallback(
    (email: string, password?: string, rememberMe: boolean = true) => {
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user is logging into one of the demo accounts
      const matchedDemoAccount = demoAccounts.find(
        (a) => a.email.toLowerCase() === normalizedEmail
      ) || (normalizedEmail === 'demo@flashsign.com' ? demoAccounts.find(a => a.id === 'demo-owner') : undefined);

      if (matchedDemoAccount) {
        // Authenticate demo account
        const account = switchDemoAccount(matchedDemoAccount.id);
        return {
          success: true,
          user: currentUser || undefined,
          rbacUser: account,
        };
      }

      // Look up user in general users list
      const matchedUser = users.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );

      if (!matchedUser) {
        const invitation = openInvitationFor(normalizedEmail);
        return {
          success: false,
          error: invitation
            ? `You haven't joined ${invitation.organizationName} yet. Open the invitation link in your email to create your account.`
            : 'No account found with this email address. Please check your credentials or select a demo account.',
        };
      }

      const isValidPassword =
        Boolean(password) &&
        ((matchedUser.password && password === matchedUser.password) ||
          password === 'Demo123!' ||
          password === 'DemoPassword2026!');

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid password. (Demo password: Demo123!).',
        };
      }

      if (!matchedUser.organizationSetupCompleted) {
        setPendingSignupUserState(matchedUser);
        safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, matchedUser);
        return {
          success: false,
          requiresOrgSetup: true,
          user: matchedUser,
          error: 'Organization setup incomplete. Please set up your organization before accessing the workspace.',
        };
      }

      setCurrentUser(matchedUser);
      setIsAuthenticated(true);

      const matchedOrg =
        workspaces.find((w) => w.id === matchedUser.organizationId) ||
        workspaces.find((w) => w.ownerId === matchedUser.id) ||
        workspaces[0];

      if (matchedOrg) {
        setSelectedWorkspace(matchedOrg);
        safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, matchedOrg);
      }

      setAuthMessageState(null);
      safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
      setPendingSignupUserState(null);
      safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);

      safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
      if (rememberMe) {
        safeStorageSet(STORAGE_KEYS.USER, matchedUser);
      } else {
        safeStorageRemove(STORAGE_KEYS.USER);
      }

      return { success: true, user: matchedUser };
    },
    [demoAccounts, switchDemoAccount, users, currentUser, openInvitationFor, workspaces]
  );

  // ── Invitations ───────────────────────────────────────────────────────────
  const sendInvitation = useCallback<DemoAuthContextType['sendInvitation']>(
    (data) => {
      if (!currentRbacUser && !currentUser) return { success: false, error: 'Please log in to invite people.' };
      const email = data.email.trim();
      const normalizedEmail = email.toLowerCase();
      const org = selectedWorkspace;

      const member = users.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail && u.organizationId === org.id
      );
      if (member) {
        return { success: false, error: `${member.fullName} is already a member of ${org.name}.` };
      }
      const existing = invitations.find(
        (i) => i.organizationId === org.id && i.status === 'pending' && i.email.toLowerCase() === normalizedEmail
      );
      if (existing && !isInviteExpired(existing)) {
        return { success: false, error: `${email} already has a pending invitation. Resend it from the Invited tab.` };
      }

      const now = Date.now();
      const invitation: DemoInvitation = {
        id: `inv-${now.toString(36)}`,
        email,
        fullName: data.fullName?.trim() || undefined,
        role: data.role,
        jobTitle: data.jobTitle?.trim() || undefined,
        department: data.department?.trim() || undefined,
        message: data.message?.trim() || undefined,
        organizationId: org.id,
        organizationName: org.name,
        invitedById: currentRbacUser?.id || currentUser?.id || 'demo-owner',
        invitedByName: currentRbacUser?.name || currentUser?.fullName || 'Organization Owner',
        sentAt: new Date(now).toISOString(),
        expiresAt: new Date(now + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      saveInvitations([invitation, ...invitations.filter((i) => i !== existing)]);
      return { success: true, invitation };
    },
    [currentRbacUser, currentUser, selectedWorkspace, users, invitations, saveInvitations]
  );

  const resendInvitation = useCallback(
    (id: string) => {
      const now = Date.now();
      let resent: DemoInvitation | undefined;
      const next = invitations.map((i) => {
        if (i.id !== id) return i;
        resent = {
          ...i,
          sentAt: new Date(now).toISOString(),
          expiresAt: new Date(now + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        };
        return resent;
      });
      saveInvitations(next);
      return resent;
    },
    [invitations, saveInvitations]
  );

  const revokeInvitation = useCallback(
    (id: string) => {
      saveInvitations(invitations.map((i) => (i.id === id ? { ...i, status: 'revoked' as const } : i)));
    },
    [invitations, saveInvitations]
  );

  const acceptInvitation = useCallback<DemoAuthContextType['acceptInvitation']>(
    (invite, data) => {
      const local = invitations.find((i) => i.id === invite.id);
      if (local?.status === 'revoked') {
        return { success: false, error: 'This invitation was cancelled.' };
      }
      if (local?.status === 'accepted') {
        return { success: false, error: 'This invitation has already been accepted.' };
      }

      const org = workspaces.find((w) => w.id === invite.organizationId) || selectedWorkspace;
      const initials =
        data.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'MB';

      const newUser: DemoUser = {
        id: `user-${Date.now().toString(36)}`,
        fullName: data.fullName.trim(),
        email: invite.email.toLowerCase(),
        password: data.password,
        jobTitle: data.jobTitle?.trim() || invite.jobTitle || 'Team Member',
        department: invite.department || 'Engineering',
        timezone: 'America/New_York (UTC-5)',
        role: invite.role,
        organizationId: org.id,
        registrationCompleted: true,
        organizationSetupCompleted: true,
        avatarColor: '#2563eb',
        avatarInitials: initials,
        createdAt: new Date().toISOString(),
      };

      const nextUsers = [...users, newUser];
      setUsers(nextUsers);
      safeStorageSet(STORAGE_KEYS.USERS, nextUsers);

      const nextWorkspaces = workspaces.map((w) =>
        w.id === org.id ? { ...w, memberCount: (w.memberCount || 0) + 1 } : w
      );
      setWorkspaces(nextWorkspaces);
      safeStorageSet(STORAGE_KEYS.WORKSPACES, nextWorkspaces);

      if (local) {
        saveInvitations(
          invitations.map((i) =>
            i.id === local.id ? { ...i, status: 'accepted' as const, acceptedAt: new Date().toISOString() } : i
          )
        );
      }

      setCurrentUser(newUser);
      setIsAuthenticated(true);
      setSelectedWorkspace(org);
      setPendingSignupUserState(null);
      safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
      safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, org);
      safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
      safeStorageSet(STORAGE_KEYS.USER, newUser);
      return { success: true };
    },
    [invitations, users, workspaces, selectedWorkspace, saveInvitations]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRbacUserState(null);
    setPendingSignupUserState(null);
    setAuthMessageState(null);
    safeStorageRemove(STORAGE_KEYS.SESSION_ACTIVE);
    safeStorageRemove(STORAGE_KEYS.USER);
    safeStorageRemove(RBAC_STORAGE_KEYS.CURRENT_USER);
    safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
    safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
  }, []);

  const register = useCallback(
    (fullName: string, email: string, companyName?: string) => {
      signUp({
        fullName,
        email,
        password: 'DemoPassword2026!',
        jobTitle: companyName ? `${companyName} Lead` : 'Team Member',
      });
    },
    [signUp]
  );

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setSelectedWorkspace(ws);
        safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, ws);
        setCompletedSteps((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']));
      }
    },
    [workspaces]
  );

  const createWorkspace = useCallback(
    (
      name: string,
      type: string,
      companySize: string,
      description?: string,
      accentColor?: string
    ): DemoWorkspace => {
      const generatedSlug = slugify(name) || `ws-${Date.now().toString(36)}`;
      const initials =
        name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'WS';

      const newWs: DemoWorkspace = {
        id: `ws-${Date.now().toString(36)}`,
        name,
        type,
        companySize,
        description: description || 'Custom team workspace on Flash Sign.',
        slug: generatedSlug,
        memberCount: 1,
        activeProjectCount: 1,
        accentColor: accentColor || '#00c2a8',
        initials,
      };

      const updated = [newWs, ...workspaces];
      setWorkspaces(updated);
      setSelectedWorkspace(newWs);
      safeStorageSet(STORAGE_KEYS.WORKSPACES, updated);
      safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, newWs);

      setCompletedSteps((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']));
      return newWs;
    },
    [workspaces]
  );

  const updateProfile = useCallback((updates: Partial<DemoUser>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated: DemoUser = { ...prev, ...updates };
      if (updates.fullName) {
        updated.avatarInitials = updates.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
      }
      safeStorageSet(STORAGE_KEYS.USER, updated);
      return updated;
    });

    setCompletedSteps((prev) => (prev.includes('profile') ? prev : [...prev, 'profile']));
  }, []);

  const updatePreferences = useCallback((updates: Partial<DemoPreferences>) => {
    setPreferences((prev) => {
      const updated: DemoPreferences = { ...prev, ...updates };
      safeStorageSet(STORAGE_KEYS.PREFERENCES, updated);
      return updated;
    });

    setCompletedSteps((prev) => (prev.includes('preferences') ? prev : [...prev, 'preferences']));
  }, []);

  const markStepComplete = useCallback((step: string) => {
    setCompletedSteps((prev) => {
      if (prev.includes(step)) return prev;
      const updated = [...prev, step];
      safeStorageSet(STORAGE_KEYS.COMPLETED_STEPS, updated);
      return updated;
    });
  }, []);

  const resetDemo = useCallback(() => {
    setUsers(DEMO_PRESET_USERS);
    setCurrentUser(DEMO_PRESET_USERS[0]);
    setWorkspaces(INITIAL_DEMO_WORKSPACES);
    setSelectedWorkspace(INITIAL_DEMO_WORKSPACES[0]);
    setPreferences(DEFAULT_PREFERENCES);
    setIsAuthenticated(true);
    setCompletedSteps(['workspace']);
    setPendingSignupUserState(null);
    setAuthMessageState(null);
    setInvitations(INITIAL_DEMO_INVITATIONS);

    // Reset RBAC
    setRoles(INITIAL_ROLES);
    setDemoAccounts(DEMO_ACCOUNTS);
    setCurrentRbacUserState(DEMO_ACCOUNTS[1]);
    setSuperAdminOrgs(INITIAL_SUPER_ADMIN_ORGS);
    setSuperAdminOrgInvitations(INITIAL_SUPER_ADMIN_INVITATIONS);

    safeStorageSet(STORAGE_KEYS.USERS, DEMO_PRESET_USERS);
    safeStorageRemove(STORAGE_KEYS.INVITATIONS);
    safeStorageSet(STORAGE_KEYS.WORKSPACES, INITIAL_DEMO_WORKSPACES);
    safeStorageSet(STORAGE_KEYS.USER, DEMO_PRESET_USERS[0]);
    safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, INITIAL_DEMO_WORKSPACES[0]);
    safeStorageSet(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
    safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
    safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);

    safeStorageSet(RBAC_STORAGE_KEYS.CUSTOM_ROLES, INITIAL_ROLES);
    safeStorageSet(RBAC_STORAGE_KEYS.DEMO_ACCOUNTS, DEMO_ACCOUNTS);
    safeStorageSet(RBAC_STORAGE_KEYS.CURRENT_USER, DEMO_ACCOUNTS[1]);
    safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_ORGS, INITIAL_SUPER_ADMIN_ORGS);
    safeStorageSet(RBAC_STORAGE_KEYS.SUPER_ADMIN_INVITATIONS, INITIAL_SUPER_ADMIN_INVITATIONS);
  }, []);

  return (
    <DemoAuthContext.Provider
      value={{
        currentUser,
        currentOrganization: selectedWorkspace,
        selectedWorkspace,
        workspaces,
        organizations: workspaces,
        users,
        preferences,
        isAuthenticated,
        isHydrated,
        completedSteps,
        pendingSignupUser,
        authMessage,
        invitations,

        // RBAC
        currentRbacUser,
        roles,
        demoAccounts,
        switchDemoAccount,
        createRole,
        updateRole,
        deleteRole,
        updateMemberRoleAndProjects,

        // Super Admin
        superAdminOrgs,
        superAdminOrgInvitations,
        createSuperAdminOrg,
        updateSuperAdminOrg,
        updateSuperAdminOrgStatus,
        deleteSuperAdminOrg,
        inviteSuperAdminOrg,
        resendSuperAdminOrgInvite,
        revokeSuperAdminOrgInvite,

        signUp,
        createOrganization,
        login,
        logout,
        clearAuthMessage,
        sendInvitation,
        resendInvitation,
        revokeInvitation,
        acceptInvitation,
        setPendingSignupUser,
        register,
        selectWorkspace,
        createWorkspace,
        updateProfile,
        updatePreferences,
        markStepComplete,
        resetDemo,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
}
