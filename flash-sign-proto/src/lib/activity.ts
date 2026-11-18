import type { ActivityCategory, AuditLog } from '@/types';

/** activity_log.category values, in the order the filter shows them */
export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: 'project', label: 'Projects' },
  { value: 'task', label: 'Tasks' },
  { value: 'time', label: 'Time' },
  { value: 'planning', label: 'Planning' },
  { value: 'team', label: 'Teams' },
  { value: 'member', label: 'Members' },
  { value: 'role', label: 'Roles' },
  { value: 'document', label: 'Documents' },
  { value: 'agreement', label: 'Agreements' },
  { value: 'agent', label: 'AI agents' },
  { value: 'settings', label: 'Settings' },
  { value: 'security', label: 'Security' },
];

const BY_RESOURCE: Record<string, ActivityCategory> = {
  project: 'project',
  task: 'task',
  worksession: 'time',
  'time off': 'planning',
  meeting: 'planning',
  announcement: 'team',
  team: 'team',
  member: 'member',
  user: 'member',
  role: 'role',
  document: 'document',
  signaturerequest: 'agreement',
  agentrun: 'agent',
  integration: 'settings',
  settings: 'settings',
  session: 'security',
};

/** The log's category: stored on new rows; for older rows worked out from the resource type or action. */
export function activityCategoryOf(log: AuditLog): ActivityCategory {
  if (log.category) return log.category;
  const byResource = BY_RESOURCE[log.resource.toLowerCase()];
  if (byResource) return byResource;
  const prefix = log.action.split('.')[0].toLowerCase();
  return (ACTIVITY_CATEGORIES.find(c => c.value === prefix)?.value) ?? 'settings';
}
