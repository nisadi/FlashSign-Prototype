import type { DemoRole } from '@/types';
import { FEATURE_DEFINITIONS, type FeatureKey } from '@/lib/rbac';

/**
 * Feature switches per organisation (finalized table `organization_feature`).
 *
 * The switches are no longer hard-coded: the Super Admin turns them on or off per organisation
 * (Super Admin Dashboard › organisation details › Features), and the demo-auth context pushes
 * the active organisation's switches in here with `setActiveOrganizationFeatures`. A feature with
 * no organization_feature row uses its default from FEATURE_DEFINITIONS.
 *
 * `FEATURES.contracts` etc. keep working everywhere they are read; they now return the active
 * organisation's value.
 */
const DEFAULTS = Object.fromEntries(FEATURE_DEFINITIONS.map(f => [f.key, f.defaultEnabled])) as Record<FeatureKey, boolean>;

let active: Record<FeatureKey, boolean> = { ...DEFAULTS };

/** Called by the demo-auth context whenever the active organisation or its switches change. */
export function setActiveOrganizationFeatures(features: Record<FeatureKey, boolean>): void {
  active = { ...DEFAULTS, ...features };
}

export const FEATURES = {
  /** Contracts as a separate record type under Documents. */
  get contracts(): boolean {
    return active.contracts;
  },
  /** AI Agent Hub (Phase 2). */
  get aiAgents(): boolean {
    return active.ai_agents;
  },
  /** SRS analysis of uploaded project files (Phase 2). */
  get srsAnalysis(): boolean {
    return active.srs_analysis;
  },
  /**
   * The "Role: …" demo persona switcher in the sidebar. A prototype-only switch (not an
   * organisation feature); off for the stakeholder demo.
   */
  roleSwitcher: false,
};

/** The role the app runs as while the role switcher is off (Owner / CEO). */
export const FIXED_DEMO_ROLE: DemoRole = 'ceo';
