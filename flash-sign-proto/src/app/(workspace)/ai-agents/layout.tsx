import { HubTabs } from '@/components/agents/hub-tabs';
import { FeatureGate } from '@/components/shared/feature-gate';

// AI Agent Hub is an organisation feature (organization_feature 'ai_agents')
export default function AgentHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="ai_agents" fallback="/dashboard">
      <HubTabs />
      {children}
    </FeatureGate>
  );
}
