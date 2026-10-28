import { redirect } from 'next/navigation';

/** Milestones are now the phases of the Plan tab (Phase → Epic → Story → Task). */
export default async function MilestonesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/plan`);
}
