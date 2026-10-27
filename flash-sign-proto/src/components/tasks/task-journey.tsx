'use client';

import { Route, MessageSquare, CheckCircle2, Timer } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AGENTS, formatMinutes } from '@/lib/agent-connection';
import type { ResolvedBoard } from '@/lib/board-columns';
import type { JourneyStage } from '@/lib/task-journey';
import { formatDate } from '@/lib/utils';
import type { AgentClient } from '@/types';

/** The agent's name when something was done through one; null for the web app or typed-in time */
const via = (source: string) => (source in AGENTS ? AGENTS[source as AgentClient].label : null);

/**
 * The boards a card has been on, and who worked on it and commented on each, so a tester
 * picking it up on the Testing board can see what happened in Development.
 */
export function TaskJourney({ stages, boards }: { stages: JourneyStage[]; boards: ResolvedBoard[] }) {
  const { users } = useApp();
  const nameOf = (id: string) => users.find(u => u.id === id)?.name ?? 'Someone';

  return (
    <div className="rounded-xl border border-line bg-paper p-3.5 space-y-3">
      <p className="text-[11px] text-muted flex items-center gap-1.5">
        <Route className="w-3.5 h-3.5 shrink-0" /> The boards this card has been on, and who worked on it on each one.
      </p>
      <ol className="relative space-y-3 border-l border-line ml-1.5">
        {stages.map((stage, i) => {
          const current = i === stages.length - 1;
          const boardGone = !boards.some(b => b.id === stage.boardId);
          return (
            <li key={`${stage.boardId}-${stage.from}`} className="pl-4 relative">
              <span
                className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-paper ${
                  current ? 'bg-flash' : 'bg-muted/50'
                }`}
              />
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className={`font-bold ${boardGone ? 'text-muted italic' : 'text-ink'}`}>{stage.boardName}</span>
                <span className="text-[10px] text-muted font-mono">
                  {formatDate(stage.from)} → {stage.to ? formatDate(stage.to) : 'now'}
                </span>
              </div>

              <div className="mt-1 space-y-1 text-[11px] text-ink-soft">
                {stage.movedBy && (
                  <p>
                    Moved here by {nameOf(stage.movedBy.byUserId)}
                    {via(stage.movedBy.via) && ` (${via(stage.movedBy.via)})`}
                  </p>
                )}
                {stage.workers.length > 0 ? (
                  <p className="flex items-start gap-1">
                    <Timer className="w-3 h-3 mt-0.5 shrink-0 text-muted" />
                    <span>
                      Worked on by{' '}
                      {stage.workers
                        .map(w => `${via(w.source) ? `${via(w.source)} for ` : ''}${nameOf(w.userId)} (${formatMinutes(w.minutes)})`)
                        .join(', ')}
                      {stage.running && current && ' · timer running'}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted">No time logged here</p>
                )}
                {stage.commentCount > 0 && (
                  <p className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-muted" />
                    {stage.commentCount} comment{stage.commentCount === 1 ? '' : 's'}
                  </p>
                )}
                {stage.done && (
                  <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Done on {formatDate(stage.done.at)} by {nameOf(stage.done.byUserId)}
                    {via(stage.done.via) && ` (${via(stage.done.via)})`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
