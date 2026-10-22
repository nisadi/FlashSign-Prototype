import { SectionTabs, type SectionTab } from '@/components/shared/section-tabs';

const PLANNING_TABS: SectionTab[] = [
  { label: 'Calendar', href: '/planner/calendar' },
  { label: 'Meetings', href: '/planner/meetings' },
  { label: 'Availability & Time Off', href: '/planner/availability' },
];

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionTabs tabs={PLANNING_TABS} />
      {children}
    </>
  );
}
