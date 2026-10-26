import { redirect } from 'next/navigation';

// The AI Agent Hub opens on the overview and live demo. The earlier demo "agent runs" page
// was replaced; it remains in git history.
export default function AgentHubIndexPage() {
  redirect('/ai-agents/how-it-works');
}
