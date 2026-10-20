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

interface DemoAuthContextType {
  currentUser: DemoUser;
  workspaces: DemoWorkspace[];
  selectedWorkspace: DemoWorkspace;
  preferences: DemoPreferences;
  isAuthenticated: boolean;
  completedSteps: string[];
  login: (email: string, rememberMe?: boolean, userOverride?: Partial<DemoUser>) => void;
  register: (fullName: string, email: string, companyName?: string) => void;
  logout: () => void;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, type: string, companySize: string, description?: string, accentColor?: string) => DemoWorkspace;
  updateProfile: (updates: Partial<DemoUser>) => void;
  updatePreferences: (updates: Partial<DemoPreferences>) => void;
  markStepComplete: (step: string) => void;
  resetDemo: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with safe defaults (SSR safe)
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_PRESET_USERS[0]);
  const [workspaces, setWorkspaces] = useState<DemoWorkspace[]>(INITIAL_DEMO_WORKSPACES);
  const [selectedWorkspace, setSelectedWorkspace] = useState<DemoWorkspace>(INITIAL_DEMO_WORKSPACES[0]);
  const [preferences, setPreferences] = useState<DemoPreferences>(DEFAULT_PREFERENCES);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>(['workspace']);
  const [isHydrated, setIsHydrated] = useState(false);

  // Safely hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedUser = safeStorageGet<DemoUser | null>(STORAGE_KEYS.USER, null);
      if (storedUser) {
        setCurrentUser(storedUser);
      }

      const storedWorkspaces = safeStorageGet<DemoWorkspace[] | null>(STORAGE_KEYS.WORKSPACES, null);
      if (storedWorkspaces && storedWorkspaces.length > 0) {
        setWorkspaces(storedWorkspaces);
      }

      const storedSelectedWs = safeStorageGet<DemoWorkspace | null>(STORAGE_KEYS.SELECTED_WORKSPACE, null);
      if (storedSelectedWs) {
        setSelectedWorkspace(storedSelectedWs);
      }

      const storedPrefs = safeStorageGet<DemoPreferences | null>(STORAGE_KEYS.PREFERENCES, null);
      if (storedPrefs) {
        setPreferences(storedPrefs);
      }

      const storedSteps = safeStorageGet<string[] | null>(STORAGE_KEYS.COMPLETED_STEPS, null);
      if (storedSteps) {
        setCompletedSteps(storedSteps);
      }

      const sessionActive = safeStorageGet<boolean>(STORAGE_KEYS.SESSION_ACTIVE, true);
      setIsAuthenticated(sessionActive);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = useCallback((email: string, rememberMe: boolean = true, userOverride?: Partial<DemoUser>) => {
    // Check if matches a preset user or create on-the-fly demo user
    const matchedPreset = DEMO_PRESET_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    const initials = email.split('@')[0].slice(0, 2).toUpperCase();
    const resolvedUser: DemoUser = {
      ...(matchedPreset ?? {
        id: `user-${Date.now()}`,
        fullName: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: email.trim(),
        jobTitle: 'Product Manager',
        department: 'Product Delivery',
        timezone: 'America/New_York (UTC-5)',
        role: 'project_manager',
        avatarColor: '#00c2a8',
        avatarInitials: initials,
      }),
      ...userOverride,
    };

    setCurrentUser(resolvedUser);
    setIsAuthenticated(true);

    if (rememberMe) {
      safeStorageSet(STORAGE_KEYS.USER, resolvedUser);
      safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
    }
  }, []);

  const register = useCallback((fullName: string, email: string, companyName?: string) => {
    const initials = fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'FS';

    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      fullName,
      email: email.trim(),
      jobTitle: 'Team Member',
      department: companyName ? `${companyName} Team` : 'Engineering',
      timezone: 'America/New_York (UTC-5)',
      role: 'developer',
      avatarColor: '#00c2a8',
      avatarInitials: initials,
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    safeStorageSet(STORAGE_KEYS.USER, newUser);
    safeStorageSet(STORAGE_KEYS.SESSION_ACTIVE, true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    safeStorageRemove(STORAGE_KEYS.SESSION_ACTIVE);
  }, []);

  const selectWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setSelectedWorkspace(ws);
      safeStorageSet(STORAGE_KEYS.SELECTED_WORKSPACE, ws);
      setCompletedSteps((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']));
    }
  }, [workspaces]);

  const createWorkspace = useCallback(
    (name: string, type: string, companySize: string, description?: string, accentColor?: string): DemoWorkspace => {
      const generatedSlug = slugify(name) || `ws-${Date.now().toString(36)}`;
      const initials = name
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
      const updated: DemoUser = { ...prev, ...updates };
      // Regenerate initials if name updated
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
    setCurrentUser(DEMO_PRESET_USERS[0]);
    setWorkspaces(INITIAL_DEMO_WORKSPACES);
    setSelectedWorkspace(INITIAL_DEMO_WORKSPACES[0]);
    setPreferences(DEFAULT_PREFERENCES);
    setIsAuthenticated(true);
    setCompletedSteps(['workspace']);

    safeStorageRemove(STORAGE_KEYS.USER);
    safeStorageRemove(STORAGE_KEYS.WORKSPACES);
    safeStorageRemove(STORAGE_KEYS.SELECTED_WORKSPACE);
    safeStorageRemove(STORAGE_KEYS.PREFERENCES);
    safeStorageRemove(STORAGE_KEYS.COMPLETED_STEPS);
    safeStorageRemove(STORAGE_KEYS.SESSION_ACTIVE);
  }, []);

  return (
    <DemoAuthContext.Provider
      value={{
        currentUser,
        workspaces,
        selectedWorkspace,
        preferences,
        isAuthenticated,
        completedSteps,
        login,
        register,
        logout,
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
