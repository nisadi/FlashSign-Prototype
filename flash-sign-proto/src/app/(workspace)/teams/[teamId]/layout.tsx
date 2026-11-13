import { FeatureGate } from '@/components/shared/feature-gate';

// Hidden with the rest of the Teams feature (organization_feature 'teams')
export default function TeamDetailLayout({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature="teams" fallback="/teams">{children}</FeatureGate>;
}
