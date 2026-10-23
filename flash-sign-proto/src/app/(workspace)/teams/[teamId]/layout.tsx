import { redirect } from 'next/navigation';
import { FEATURES } from '@/lib/features';

// Hidden with the rest of the Teams feature (lib/features.ts)
export default function TeamDetailLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURES.teams) redirect('/teams');
  return children;
}
