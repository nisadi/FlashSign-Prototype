'use client';

import { useApp } from '@/context/app-context';
import { PageHeader, Card } from '@/components/shared/ui';
import { formatRelative } from '@/lib/utils';
import { Activity, Bot, FileText, CheckSquare, Settings } from 'lucide-react';

export default function ActivityPage() {
  const { auditLogs, users } = useApp();
  const icons: Record<string, React.ElementType> = {
    'document': FileText, 'agent': Bot, 'task': CheckSquare, 'settings': Settings,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Activity Feed" description="Recent activity across your organization" />
      <div className="space-y-2">
        {auditLogs.map((log, i) => {
          const iconKey = log.action.split('.')[0];
          const Icon = icons[iconKey] ?? Activity;
          return (
            <Card key={log.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{log.actorName}</span>{' '}
                    <span className="font-mono text-xs text-muted bg-mist px-1 rounded">{log.action}</span>
                    {log.detail && <span className="text-muted ml-1">— {log.detail}</span>}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{formatRelative(log.timestamp)} • IP {log.ipAddress}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
