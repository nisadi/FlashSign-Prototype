'use client';

import { Timer } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AGENTS, formatMinutes, sessionMinutes } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import type { AgentClient } from '@/types';

/** "⏱ Claude Code · 1h 20m" on a task card while someone's timer is running on it. */
export function TaskTimerBadge({ taskId }: { taskId: string }) {
  const { workSessions } = useApp();
  const now = useNow();
  const session = workSessions.find(w => w.taskId === taskId && !w.endedAt);
  if (!session) return null;

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
