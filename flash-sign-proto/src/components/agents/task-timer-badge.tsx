'use client';

import { Timer } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AGENTS, formatMinutes, sessionMinutes } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import type { AgentClient } from '@/types';

/**
 * "⏱ Claude Code · 1h 20m" on a task card while someone's timer is running on it;
 * otherwise the total time worked so far ("⏱ 5h 20m"), if any.
 */
export function TaskTimerBadge({ taskId }: { taskId: string }) {
  const { workSessions } = useApp();
  const now = useNow();
  const sessions = workSessions.filter(w => w.taskId === taskId);
  const session = sessions.find(w => !w.endedAt);

  if (!session) {
    const total = now ? sessions.reduce((sum, w) => sum + sessionMinutes(w.startedAt, w.endedAt, now), 0) : 0;
    if (total === 0) return null;
    return (
      <span
        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-mist text-muted font-semibold border border-line"
        title="Time worked on this task"
      >
        <Timer className="w-2.5 h-2.5" />
        {formatMinutes(total)}
      </span>
    );
  }

  const via = session.source in AGENTS ? AGENTS[session.source as AgentClient].label : 'Web app';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-flash/10 text-flash-deep font-bold border border-flash/30"
      title={`Timer running, started via ${via}`}
    >
      <Timer className="w-2.5 h-2.5" />
      {via}{now && ` · ${formatMinutes(sessionMinutes(session.startedAt, undefined, now))}`}
    </span>
  );
}
