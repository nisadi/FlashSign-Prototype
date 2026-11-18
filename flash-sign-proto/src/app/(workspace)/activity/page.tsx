'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader, Card } from '@/components/shared/ui';
import { formatRelative } from '@/lib/utils';
import { ACTIVITY_CATEGORIES, activityCategoryOf } from '@/lib/activity';
import type { ActivityCategory } from '@/types';
import {
  Activity, Bot, FileText, CheckSquare, Settings, FolderKanban, Clock, CalendarDays, Users, UserRound,
  Shield, FileSignature, Lock,
} from 'lucide-react';

const ICONS: Record<ActivityCategory, React.ElementType> = {
  project: FolderKanban,
  task: CheckSquare,
  time: Clock,
  planning: CalendarDays,
  team: Users,
  member: UserRound,
  role: Shield,
  document: FileText,
  agreement: FileSignature,
  agent: Bot,
  settings: Settings,
  security: Lock,
};

/** The organisation's activity log (activity_log): append-only, newest first, filterable by category. */
export default function ActivityPage() {
  const { auditLogs } = useApp();
  const [category, setCategory] = useState<'all' | ActivityCategory>('all');

  const rows = auditLogs
    .map(log => ({ log, cat: activityCategoryOf(log) }))
    .filter(r => category === 'all' || r.cat === category);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Activity Feed" description="Recent activity across your organization" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</p>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as 'all' | ActivityCategory)}
          aria-label="Filter by category"
          className="px-2.5 py-1.5 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:border-flash"
        >
          <option value="all">All categories</option>
          {ACTIVITY_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && (
          <Card className="p-6 text-center text-xs text-muted">
            <Activity className="w-5 h-5 mx-auto mb-2" />
            No activity in this category yet.
          </Card>
        )}
        {rows.map(({ log, cat }) => {
          const Icon = ICONS[cat] ?? Activity;
          return (
            <Card key={log.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{log.actorName}</span>{' '}
                    <span className="font-mono text-xs text-muted bg-mist px-1 rounded">{log.action}</span>
                    {log.detail && <span className="text-muted ml-1">— {log.detail}</span>}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    <span className="capitalize">{ACTIVITY_CATEGORIES.find(c => c.value === cat)?.label ?? cat}</span>
                    {' • '}{formatRelative(log.timestamp)}
                    {log.ipAddress && <> • IP {log.ipAddress}</>}
                    {log.userAgent && <> • {log.userAgent}</>}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
