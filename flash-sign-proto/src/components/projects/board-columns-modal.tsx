'use client';

import { useState } from 'react';
import { Columns3, ChevronUp, ChevronDown, Trash2, Plus, RotateCcw, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { Button } from '@/components/shared/ui';
import {
  COLUMN_COLORS,
  DEFAULT_BOARD_COLUMNS,
  REQUIRED_STAGES,
  TASK_STAGES,
  boardOfTask,
  boardsSharingColumns,
  columnOfTask,
  missingStages,
  projectBoards,
  stageLabel,
} from '@/lib/board-columns';
import { cn } from '@/lib/utils';
import type { BoardColumn, Project, Task, TaskStatus } from '@/types';

interface BoardColumnsModalProps {
  project: Project;
  /** The board whose columns are edited */
  boardId: string;
  /** All of the project's tasks */
  tasks: Task[];
  onClose: () => void;
  /** Open with a fresh column already added (the board's "Add column" tile) */
  startWithNewColumn?: boolean;
}

function newColumn(columns: BoardColumn[]): BoardColumn {
  const used = new Set(columns.map(c => c.color));
  return {
    id: `col-${Date.now()}`,
    name: '',
    color: COLUMN_COLORS.find(c => !used.has(c)) ?? COLUMN_COLORS[1],
    status: 'in_progress',
  };
}

/** New columns go just before the first Done column, where extra steps usually belong. */
function insertColumn(columns: BoardColumn[], column: BoardColumn): BoardColumn[] {
  const doneAt = columns.findIndex(c => c.status === 'done');
  const at = doneAt === -1 ? columns.length : doneAt;
  return [...columns.slice(0, at), column, ...columns.slice(at)];
}

/**
 * Add, rename, recolour, reorder and remove the columns of one board in a project.
 * Changes stay in the dialog until Save; cards in a removed column move to a column you pick.
 */
export function BoardColumnsModal({ project, boardId, tasks: projectTasks, onClose, startWithNewColumn }: BoardColumnsModalProps) {
  const { setBoardColumns } = useApp();
  const boards = projectBoards(project);
  const board = boards.find(b => b.id === boardId) ?? boards[0];
  const saved = board.columns;
  const mainBoard = boards[0];
  const mirrors = board.isMain ? boards.filter(b => b.mirrorsMain) : [];
  // Cards these columns hold: the main board's edit carries its mirrors along; a mirroring board's edit is its own
  const sharingIds = new Set(board.mirrorsMain ? [board.id] : boardsSharingColumns(board.id, boards).map(b => b.id));
  const tasks = projectTasks.filter(t => sharingIds.has(boardOfTask(t, boards).id));

  const [draft, setDraft] = useState<BoardColumn[]>(() =>
    startWithNewColumn ? insertColumn(saved, newColumn(saved)) : saved
  );
  const [focusId, setFocusId] = useState<string | null>(() =>
    startWithNewColumn ? draft.find(c => !saved.some(s => s.id === c.id))?.id ?? null : null
  );
  // removed column id → column its cards move to
  const [moves, setMoves] = useState<Record<string, string>>({});
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState('');

  // How many cards each draft column will hold, following any moves out of removed columns
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    let id = columnOfTask(task, saved)?.id;
    const seen = new Set<string>();
    while (id && moves[id] && !seen.has(id)) {
      seen.add(id);
      id = moves[id];
    }
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }

  const missing = missingStages(draft);
  const hasBlankName = draft.some(c => !c.name.trim());
  const canSave = missing.length === 0 && !hasBlankName;

  const patch = (id: string, changes: Partial<BoardColumn>) =>
    setDraft(cols => cols.map(c => (c.id === id ? { ...c, ...changes } : c)));

  const moveBy = (index: number, delta: number) =>
    setDraft(cols => {
      const next = [...cols];
      const [col] = next.splice(index, 1);
      next.splice(index + delta, 0, col);
      return next;
    });

  const cycleColor = (col: BoardColumn) => {
    const at = COLUMN_COLORS.indexOf(col.color);
    patch(col.id, { color: COLUMN_COLORS[(at + 1) % COLUMN_COLORS.length] });
  };

  const addColumn = () => {
    const col = newColumn(draft);
    setDraft(cols => insertColumn(cols, col));
    setFocusId(col.id);
  };

  /** Removing the last column of a required stage would leave cards with nowhere to go. */
  const isLastOfRequiredStage = (col: BoardColumn) =>
    REQUIRED_STAGES.includes(col.status) && draft.filter(c => c.status === col.status).length === 1;

  const remove = (id: string, targetId?: string) => {
    setDraft(cols => cols.filter(c => c.id !== id));
    setMoves(m => {
      // Cards already headed into this column follow it to the new target
      const next = Object.fromEntries(Object.entries(m).map(([from, to]) => [from, to === id && targetId ? targetId : to]));
      if (targetId) next[id] = targetId;
      return next;
    });
    setConfirmRemoveId(null);
  };

  const startRemove = (col: BoardColumn) => {
    if (!counts[col.id]) {
      remove(col.id);
      return;
    }
    const others = draft.filter(c => c.id !== col.id);
    setMoveTargetId((others.find(c => c.status === col.status) ?? others[0])?.id ?? '');
    setConfirmRemoveId(col.id);
  };

  const resetToDefault = () => {
    setDraft(DEFAULT_BOARD_COLUMNS);
    setMoves({});
    setConfirmRemoveId(null);
  };

  const save = () => {
    if (!canSave) return;
    setBoardColumns(project.id, board.id, draft.map(c => ({ ...c, name: c.name.trim() })), moves);
    notify(`Columns saved for ${board.name}`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" aria-labelledby="board-columns-title">
      <ModalHeader
        id="board-columns-title"
        title={boards.length > 1 ? `Columns · ${board.name}` : 'Board columns'}
        description={`Set up the columns ${boards.length > 1 ? `of ${board.name}` : `on the ${project.name} board`}. Each column counts as a task stage, so time tracking, AI agents and reports keep working.`}
        icon={Columns3}
        onClose={onClose}
      />

      <ModalBody className="space-y-3">
        {(board.mirrorsMain || mirrors.length > 0) && (
          <p className="flex items-start gap-1.5 rounded-lg border border-line bg-mist/40 px-3 py-2 text-[11px] text-ink-soft">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px text-muted" />
            {board.mirrorsMain
              ? `This board mirrors ${mainBoard.name}. Saving here gives it its own columns, and it stops following ${mainBoard.name}.`
              : `${mirrors.map(b => b.name).join(', ')} mirror${mirrors.length === 1 ? 's' : ''} this board, so ${mirrors.length === 1 ? 'it changes' : 'they change'} too. Card counts include ${mirrors.length === 1 ? 'that board' : 'those boards'}.`}
          </p>
        )}

        <ul className="space-y-2">
          {draft.map((col, index) => {
            const original = saved.find(s => s.id === col.id);
            const count = counts[col.id] ?? 0;
            const stageChanged = original && original.status !== col.status && count > 0;
            const locked = isLastOfRequiredStage(col);

            return (
              <li key={col.id} className="rounded-xl border border-line bg-paper p-2.5">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveBy(index, -1)}
                      disabled={index === 0}
                      className="p-0.5 text-muted hover:text-ink disabled:opacity-30 disabled:hover:text-muted"
                      aria-label={`Move ${col.name || 'column'} left`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBy(index, 1)}
                      disabled={index === draft.length - 1}
                      className="p-0.5 text-muted hover:text-ink disabled:opacity-30 disabled:hover:text-muted"
                      aria-label={`Move ${col.name || 'column'} right`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => cycleColor(col)}
                    className="w-5 h-5 rounded-full border border-line shrink-0 hover:scale-110 transition-transform"
                    style={{ background: col.color }}
                    title="Change colour"
                    aria-label="Change colour"
                  />

                  <input
                    value={col.name}
                    autoFocus={focusId === col.id}
                    onChange={e => patch(col.id, { name: e.target.value })}
                    placeholder="Column name, e.g. QA Testing"
                    maxLength={30}
                    className={cn(
                      'flex-1 min-w-[140px] px-2.5 py-1.5 text-xs bg-paper-elevated border rounded-lg outline-none focus:border-flash text-ink',
                      col.name.trim() ? 'border-line' : 'border-danger/60'
                    )}
                  />

                  <label className="flex items-center gap-1.5 text-[11px] text-muted shrink-0">
                    Counts as
                    <select
                      value={col.status}
                      onChange={e => patch(col.id, { status: e.target.value as TaskStatus })}
                      className="px-2 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
                    >
                      {TASK_STAGES.map(stage => (
                        <option key={stage.status} value={stage.status}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <span className="text-[10px] font-mono text-muted bg-mist px-1.5 py-0.5 rounded-full shrink-0" title="Cards in this column">
                    {count}
                  </span>

                  <button
                    type="button"
                    onClick={() => startRemove(col)}
                    disabled={locked}
                    className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
                    title={locked ? `The board needs at least one ${stageLabel(col.status)} column` : 'Remove column'}
                    aria-label={`Remove ${col.name || 'column'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {stageChanged && (
                  <p className="mt-1.5 ml-7 text-[11px] text-waiting">
                    {count} card{count === 1 ? '' : 's'} here will change from {stageLabel(original.status)} to {stageLabel(col.status)}.
                  </p>
                )}

                {confirmRemoveId === col.id && (
                  <div className="mt-2 ml-7 flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2 text-[11px] text-ink">
                    <span>
                      Move its {count} card{count === 1 ? '' : 's'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted" />
                    <select
                      value={moveTargetId}
                      onChange={e => setMoveTargetId(e.target.value)}
                      className="px-2 py-1 bg-paper-elevated border border-line rounded-md text-xs text-ink outline-none focus:border-flash"
                    >
                      {draft
                        .filter(c => c.id !== col.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name.trim() || 'Untitled column'} ({stageLabel(c.status)})
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Button variant="ghost" size="xs" onClick={() => setConfirmRemoveId(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => remove(col.id, moveTargetId)} disabled={!moveTargetId}>
                        Remove column
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={addColumn}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-muted hover:text-ink border-2 border-dashed border-line hover:border-flash/50 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add column
        </button>

        {missing.length > 0 && (
          <p className="flex items-start gap-1.5 text-[11px] text-danger">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            Add a column that counts as {missing.map(stageLabel).join(', ')} — the timer and AI agents move cards there.
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetToDefault}>
          Reset to default
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={!canSave}>
            Save columns
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
