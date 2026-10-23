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
} as const;
