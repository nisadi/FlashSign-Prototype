'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  DemoUser,
  DemoWorkspace,
  DemoPreferences,
} from '@/types/demo-auth';
import {
  INITIAL_DEMO_WORKSPACES,
  DEMO_PRESET_USERS,
} from '@/types/demo-auth';
import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
  STORAGE_KEYS,
} from '@/lib/storage';
import { slugify } from '@/lib/utils';

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

  // Authentication & Onboarding
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
  ) => { success: boolean; error?: string; requiresOrgSetup?: boolean; user?: DemoUser };

  logout: () => void;
  clearAuthMessage: () => void;
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Safely hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      // 1. Hydrate users list or seed with demo preset users
      const storedUsers = safeStorageGet<DemoUser[] | null>(STORAGE_KEYS.USERS, null);
      let currentUsersList = DEMO_PRESET_USERS;
      if (storedUsers && storedUsers.length > 0) {
        // Merge preset users in case updates were made to preset users
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
        // Find latest updated version of this user if in users list
        const activeUser = currentUsersList.find((u) => u.id === storedUser.id) || storedUser;
        setCurrentUser(activeUser);
        setIsAuthenticated(true);

        // Find associated workspace
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
    } finally {
      setIsHydrated(true);
    }
  }, []);

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

  // ── Step 1: Sign Up (New User) ─────────────────────────────────────────────
  const signUp = useCallback(
    (data: { fullName: string; email: string; password: string; jobTitle?: string }) => {
      const normalizedEmail = data.email.trim().toLowerCase();

      // Check if user already exists and has completed setup
      const existingUser = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
      if (existingUser && existingUser.organizationSetupCompleted) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in instead.',
        };
      }

      const initials =
        data.fullName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'FS';

      const newUser: DemoUser = {
        id: existingUser ? existingUser.id : `user-${Date.now()}`,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        jobTitle: data.jobTitle?.trim() || 'Founder & CEO',
        department: 'Executive',
        timezone: 'America/New_York (UTC-5)',
        role: 'org_admin',
        avatarColor: '#00c2a8',
        avatarInitials: initials,
        organizationId: null,
        registrationCompleted: true,
        organizationSetupCompleted: false,
        createdAt: new Date().toISOString(),
      };

      // Update pending registration in memory and storage
      setPendingSignupUserState(newUser);
      safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, newUser);

      // Save user to mock users registry
      const updatedUsers = users.some((u) => u.id === newUser.id)
        ? users.map((u) => (u.id === newUser.id ? newUser : u))
        : [...users, newUser];

      setUsers(updatedUsers);
      safeStorageSet(STORAGE_KEYS.USERS, updatedUsers);

      // DO NOT mark authenticated yet. User must complete org setup then log in.
      return { success: true, user: newUser };
    },
    [users]
  );

  // ── Step 2: Create Organization (New User) ─────────────────────────────────
  const createOrganization = useCallback(
    (data: {
      name: string;
      slug: string;
      industry: string;
      size: string;
      website?: string;
      description?: string;
    }) => {
      const normalizedSlug = data.slug.trim().toLowerCase();

      // Validate duplicate slug against existing organizations
      const isDuplicate = workspaces.some(
        (w) => w.slug.trim().toLowerCase() === normalizedSlug
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Workspace slug "${normalizedSlug}" is already in use. Please enter a different workspace URL.`,
        };
      }

      // User must be pending signup or currently active
      const user = pendingSignupUser || currentUser;
      if (!user) {
        return {
          success: false,
          error: 'No active registration session found. Please fill out the sign up form first.',
        };
      }

      const orgId = `ws-${Date.now().toString(36)}`;
      const initials =
        data.name
          .split(' ')
          .filter(Boolean)
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'WS';

      const newOrg: DemoWorkspace = {
        id: orgId,
        name: data.name.trim(),
        slug: normalizedSlug,
        industry: data.industry,
        size: data.size,
        companySize: data.size,
        website: data.website?.trim() || '',
        description: data.description?.trim() || 'Organization workspace on Flash Sign.',
        ownerId: user.id,
        memberCount: 1,
        activeProjectCount: 1,
        accentColor: '#00c2a8',
        initials,
        createdAt: new Date().toISOString(),
      };

      // Associate user with newly created organization as owner
      const updatedUser: DemoUser = {
        ...user,
        organizationId: orgId,
        organizationSetupCompleted: true,
        role: 'org_admin',
      };

      // Update workspaces
      const updatedWorkspaces = [newOrg, ...workspaces.filter((w) => w.id !== orgId)];
      setWorkspaces(updatedWorkspaces);
      setSelectedWorkspace(newOrg);
      safeStorageSet(STORAGE_KEYS.WORKSPACES, updatedWorkspaces);
      safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, newOrg);

      // Update users
      const updatedUsers = users.some((u) => u.id === updatedUser.id)
        ? users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [...users, updatedUser];
      setUsers(updatedUsers);
      safeStorageSet(STORAGE_KEYS.USERS, updatedUsers);

      // Keep updated user in pending session so login screen can recognize them
      setPendingSignupUserState(updatedUser);
      safeStorageSet(STORAGE_KEYS.PENDING_SIGNUP, updatedUser);

      // Flash success message for login screen
      const successMessage = `Organization "${newOrg.name}" created successfully! Please log in to access your workspace.`;
      setAuthMessageState(successMessage);
      safeStorageSet(STORAGE_KEYS.AUTH_SUCCESS_MSG, successMessage);

      // Do NOT redirect automatically to dashboard. User must log in.
      return { success: true, organization: newOrg };
    },
    [workspaces, users, pendingSignupUser, currentUser]
  );

  // ── Step 3: Login (Existing and Newly Registered Users) ─────────────────────
  const login = useCallback(
    (email: string, password?: string, rememberMe: boolean = true) => {
      const normalizedEmail = email.trim().toLowerCase();

      // Look up user in current users list
      const matchedUser = users.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );

      if (!matchedUser) {
        return {
          success: false,
          error: 'No account found with this email address. Please check your credentials or create an account.',
        };
      }

      // Password validation:
      // Accepts the user's registered password, or the prototype universal demo passwords
      const isValidPassword =
        Boolean(password) &&
        ((matchedUser.password && password === matchedUser.password) ||
          password === 'Demo123!' ||
          password === 'DemoPassword2026!');

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid password. Please check your password and try again (Demo password: Demo123!).',
        };
      }

      // Check organization setup completion
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

      // Validated: Set active user and session
      setCurrentUser(matchedUser);
      setIsAuthenticated(true);

      // Match organization
      const matchedOrg =
        workspaces.find((w) => w.id === matchedUser.organizationId) ||
        workspaces.find((w) => w.ownerId === matchedUser.id) ||
        workspaces[0];

      if (matchedOrg) {
        setSelectedWorkspace(matchedOrg);
        safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, matchedOrg);
      }

      // Clear any pending message and pending signup user
      setAuthMessageState(null);
      safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
      setPendingSignupUserState(null);
      safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);

      // Persist session if rememberMe
      safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
      if (rememberMe) {
        safeStorageSet(STORAGE_KEYS.USER, matchedUser);
      } else {
        safeStorageRemove(STORAGE_KEYS.USER);
      }

      return { success: true, user: matchedUser };
    },
    [users, workspaces]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPendingSignupUserState(null);
    setAuthMessageState(null);
    safeStorageRemove(STORAGE_KEYS.SESSION_ACTIVE);
    safeStorageRemove(STORAGE_KEYS.USER);
    safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
    safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
    // Preserves registered users and organizations in localStorage
  }, []);

  // ── Legacy Register (Backwards compatibility) ──────────────────────────────
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

    safeStorageSet(STORAGE_KEYS.USERS, DEMO_PRESET_USERS);
    safeStorageSet(STORAGE_KEYS.WORKSPACES, INITIAL_DEMO_WORKSPACES);
    safeStorageSet(STORAGE_KEYS.USER, DEMO_PRESET_USERS[0]);
    safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, INITIAL_DEMO_WORKSPACES[0]);
    safeStorageSet(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
    safeStorageRemove(STORAGE_KEYS.PENDING_SIGNUP);
    safeStorageRemove(STORAGE_KEYS.AUTH_SUCCESS_MSG);
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
        signUp,
        createOrganization,
        login,
        logout,
        clearAuthMessage,
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
