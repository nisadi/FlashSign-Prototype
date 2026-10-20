'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp, useCurrentUser } from '@/context/app-context';
import { PageHeader, EmptyState, Card } from '@/components/shared/ui';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { formatDate } from '@/lib/utils';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';

export default function MyTasksPage() {
  const { tasks, projects } = useApp();
  const currentUser = useCurrentUser();
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue'>('all');

  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id);
  const activeTasks = myTasks.filter(t => t.status !== 'done');
  const overdueTasks = myTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  );

  const filtered = filter === 'all' ? myTasks : filter === 'active' ? activeTasks : overdueTasks;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="My Tasks" description="Tasks assigned to you across all projects" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'All Tasks', count: myTasks.length, filter: 'all' as const, color: 'var(--flash)' },
          { label: 'Active', count: activeTasks.length, filter: 'active' as const, color: '#42a5f5' },
          { label: 'Overdue', count: overdueTasks.length, filter: 'overdue' as const, color: 'var(--danger)' },
        ].map(s => (
          <button
            key={s.filter}
            onClick={() => setFilter(s.filter)}
            className={`p-4 rounded-xl border text-left transition-all ${
              filter === s.filter
                ? 'border-flash bg-flash/5'
                : 'border-line bg-paper-elevated hover:border-line/80'
            }`}
          >
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={filter === 'overdue' ? 'No overdue tasks!' : 'No tasks assigned'}
          description="You're all caught up."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-4 p-4 bg-paper-elevated rounded-xl border border-line hover:border-flash/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted">{task.key}</span>
                    {project && <span className="text-[10px] text-muted bg-mist px-1.5 py-0.5 rounded">{project.name}</span>}
                  </div>
                  <p className="text-sm font-medium text-ink truncate">{task.title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} showLabel={false} />
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger' : 'text-muted'}`}>
                      {isOverdue && <AlertTriangle className="w-3 h-3" />}
                      <Clock className="w-3 h-3" />
                      {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
