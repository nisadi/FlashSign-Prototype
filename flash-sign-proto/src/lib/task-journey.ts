import type { Task, TaskStatusChange, WorkSession } from '@/types';
import { sessionMinutes } from './agent-connection';
import { MAIN_BOARD_ID, type ResolvedBoard } from './board-columns';

/** One stay of a card on a board, from when it arrived until it moved on. */
export interface JourneyStage {
  boardId: string;
  boardName: string;
  from: string;
  /** When it left this board; undefined for the board it is on now */
  to?: string;
  /** Who moved it onto this board; undefined for the board it started on */
  movedBy?: Pick<TaskStatusChange, 'byUserId' | 'via'>;
  /** Timer time on this board per person and source (web or an agent), most first */
  workers: { userId: string; source: WorkSession['source']; minutes: number }[];
  running: boolean;
  commentCount: number;
  /** The last move to Done while on this board */
  done?: Pick<TaskStatusChange, 'byUserId' | 'via' | 'at'>;
}

const within = (at: string, stage: Pick<JourneyStage, 'from' | 'to'>) => at >= stage.from && (!stage.to || at < stage.to);

/**
 * The boards a card has been on, built from its recorded board moves. Work and comments are
 * placed by time, so a tester sees who worked on it in Development and what was said there.
 */
export function taskJourney(
  task: Task,
  boards: ResolvedBoard[],
  changes: TaskStatusChange[],
  sessions: WorkSession[],
  now: number
): JourneyStage[] {
  const nameOf = (id: string) => boards.find(b => b.id === id)?.name ?? 'Removed board';
  const ownChanges = changes.filter(c => c.taskId === task.id).sort((a, b) => a.at.localeCompare(b.at));
  const moves = ownChanges.filter(c => c.toBoardId);

  const stages: JourneyStage[] = [];
  const open = (boardId: string, from: string, movedBy?: JourneyStage['movedBy']) =>
    stages.push({ boardId, boardName: nameOf(boardId), from, movedBy, workers: [], running: false, commentCount: 0 });

  open(moves[0]?.fromBoardId ?? task.boardId ?? MAIN_BOARD_ID, task.createdAt);
  for (const move of moves) {
    stages[stages.length - 1].to = move.at;
    open(move.toBoardId!, move.at, { byUserId: move.byUserId, via: move.via });
  }

  const ownSessions = sessions.filter(w => w.taskId === task.id);
  for (const stage of stages) {
    const byWorker = new Map<string, JourneyStage['workers'][number]>();
    for (const w of ownSessions.filter(w => within(w.startedAt, stage))) {
      const key = `${w.userId}:${w.source}`;
      const entry = byWorker.get(key) ?? { userId: w.userId, source: w.source, minutes: 0 };
      entry.minutes += sessionMinutes(w.startedAt, w.endedAt, now);
      byWorker.set(key, entry);
      if (!w.endedAt) stage.running = true;
    }
    stage.workers = [...byWorker.values()].sort((a, b) => b.minutes - a.minutes);
    stage.commentCount = (task.comments ?? []).filter(c => within(c.createdAt, stage)).length;
    const done = [...ownChanges].reverse().find(c => c.to === 'done' && within(c.at, stage));
    if (done) stage.done = { byUserId: done.byUserId, via: done.via, at: done.at };
  }
  return stages;
}

/** The board a card was on at a moment (used to tag comments) */
export function boardNameAt(stages: JourneyStage[], at: string): string | undefined {
  return stages.find(s => within(at, s))?.boardName;
}
