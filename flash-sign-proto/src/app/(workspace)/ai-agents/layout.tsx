import { HubTabs } from '@/components/agents/hub-tabs';

export default function AgentHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HubTabs />
      {children}
    </>
  );
}
