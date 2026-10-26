/**
 * Safe client-side storage helper for Flash Sign demo.
 * Never stores passwords or sensitive credentials.
 */

export function safeStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[FlashSign Storage] Failed to read key "${key}":`, err);
    return defaultValue;
  }
}

export function safeStorageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[FlashSign Storage] Failed to write key "${key}":`, err);
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[FlashSign Storage] Failed to remove key "${key}":`, err);
  }
}

export const STORAGE_KEYS = {
  USER: 'flashsign_demo_user',
  USERS: 'flashsign_demo_users_list',
  WORKSPACES: 'flashsign_demo_workspaces',
  SELECTED_WORKSPACE: 'flashsign_demo_selected_workspace',
  PREFERENCES: 'flashsign_demo_preferences',
  COMPLETED_STEPS: 'flashsign_demo_completed_steps',
  SESSION_ACTIVE: 'flashsign_demo_session_active',
  PENDING_SIGNUP: 'flashsign_demo_pending_signup',
  AUTH_SUCCESS_MSG: 'flashsign_demo_auth_success_msg',
} as const;

