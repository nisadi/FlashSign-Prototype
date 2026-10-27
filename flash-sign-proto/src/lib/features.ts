import type { DemoRole } from '@/types';

/**
 * Feature switches for parts of the prototype that are hidden but kept in the code.
 * Flip a value to true to bring that feature back everywhere it appears.
 */
export const FEATURES = {
  /**
   * Teams ("squads"): the Teams Directory, team cards and Create Team, team badges
   * on members, team filters and team pickers. Off while the organisation is small;
   * team data in the store is untouched.
   */
  teams: false,
  /**
   * Contracts as a separate record type: the Contracts tab under Documents, linking
   * a contract to a signature request, and contract counts in Agreements reports.
   * Off because everything here is simply a document to sign; contract data in the
   * store is untouched.
   */
  contracts: false,
  /**
   * The "Role: …" demo persona switcher in the sidebar. Off for the stakeholder demo:
   * the app always runs as FIXED_DEMO_ROLE. Turn on to switch roles again.
   */
  roleSwitcher: false,
} as const;

/** The role the app runs as while the role switcher is off (Owner / CEO). */
export const FIXED_DEMO_ROLE: DemoRole = 'ceo';
