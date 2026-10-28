'use client';

import { useState } from 'react';
import { Rows3, ChevronUp, ChevronDown, Trash2, Plus, Columns3, Copy, Link2, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import { Card, Button } from '@/components/shared/ui';
import { BoardColumnsModal } from '@/components/projects/board-columns-modal';
import { boardOfTask, projectBoards, type ResolvedBoard } from '@/lib/board-columns';
import type { Project, Task } from '@/types';

interface ProjectBoardsSettingsProps {
  project: Project;
  tasks: Task[];
  canEdit: boolean;
}

/**
 * Project Settings > Boards: the main board plus extra boards stacked below it on the Board
 * page (e.g. Testing). New boards mirror the main board's columns until customised.
 */
export function ProjectBoardsSettings({ project, tasks, canEdit }: ProjectBoardsSettingsProps) {
  const { addBoard, renameBoard, moveBoard, setBoardMirroring, deleteBoard } = useApp();
  const boards = projectBoards(project);
  const mainBoard = boards[0];

  const [newName, setNewName] = useState('');
  const [editingColumnsOf, setEditingColumnsOf] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState(mainBoard.id);
  const [confirmMirrorId, setConfirmMirrorId] = useState<string | null>(null);

  const cardsOn = (board: ResolvedBoard) => tasks.filter(t => boardOfTask(t, boards).id === board.id).length;

  const add = () => {
    if (!newName.trim()) return;
    addBoard(project.id, newName.trim());
    notify(`Board "${newName.trim()}" added`);
    setNewName('');
  };

  return (
    <Card className="p-6 space-y-4" id="boards">
      <div className="border-b border-line pb-2">
        <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <Rows3 className="w-4 h-4 text-flash-deep" /> Boards
        </h2>
        <p className="text-xs text-muted mt-1">
          Extra boards appear below the main board, e.g. a Testing board. Drag a card from one board to another; it
          keeps its comments, history and the people who worked on it. New boards mirror the main board&apos;s columns
          until you customise them.
        </p>
      </div>

      <ul className="space-y-2">
        {boards.map((board, index) => {
          const count = cardsOn(board);
          const extraIndex = index - 1;
          return (
            <li key={board.id} className="rounded-xl border border-line bg-paper p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {!board.isMain && canEdit && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveBoard(project.id, board.id, -1)}
                      disabled={extraIndex === 0}
                      className="p-0.5 text-muted hover:text-ink disabled:opacity-30"
                      aria-label={`Move ${board.name} up`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBoard(project.id, board.id, 1)}
                      disabled={index === boards.length - 1}
                      className="p-0.5 text-muted hover:text-ink disabled:opacity-30"
                      aria-label={`Move ${board.name} down`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <input
                  // Remount when the saved name changes so the field shows it
                  key={board.name}
                  defaultValue={board.name}
                  disabled={!canEdit}
                  maxLength={40}
                  onBlur={e => {
                    const name = e.target.value.trim();
                    if (name && name !== board.name) {
                      renameBoard(project.id, board.id, name);
                      notify(`Board renamed to "${name}"`);
                    } else e.target.value = board.name;
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                  className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs font-semibold bg-paper-elevated border border-line rounded-lg outline-none focus:border-flash text-ink disabled:opacity-80"
                  aria-label="Board name"
                />

                <span className="text-[11px] text-muted">
                  {board.isMain ? 'Main board' : board.mirrorsMain ? `Mirrors ${mainBoard.name}` : 'Own columns'}
                  {' · '}
                  {board.columns.length} columns · {count} card{count === 1 ? '' : 's'}
                </span>

                {canEdit && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Button variant="secondary" size="xs" icon={Columns3} onClick={() => setEditingColumnsOf(board.id)}>
                      Edit columns
                    </Button>
                    {!board.isMain && (board.mirrorsMain ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Copy}
                        onClick={() => {
                          setBoardMirroring(project.id, board.id, false);
                          notify(`${board.name} now has its own columns`);
                        }}
                        title={`Copy ${mainBoard.name}'s columns so this board can have its own`}
                      >
                        Customise
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Link2}
                        onClick={() => setConfirmMirrorId(board.id)}
                        title={`Use ${mainBoard.name}'s columns again`}
                      >
                        Mirror {mainBoard.name}
                      </Button>
                    ))}
                    {!board.isMain && (
                      <button
                        type="button"
                        onClick={() => {
                          if (count === 0) {
                            deleteBoard(project.id, board.id, mainBoard.id);
                            notify(`Board "${board.name}" removed`);
                          }
                          else {
                            setDeleteTargetId(mainBoard.id);
                            setConfirmDeleteId(board.id);
                          }
                        }}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                        aria-label={`Remove ${board.name}`}
                        title="Remove board"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {confirmMirrorId === board.id && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-mist/40 p-2 text-[11px] text-ink">
                  <span>
                    Use {mainBoard.name}&apos;s columns again? Cards in columns {mainBoard.name} doesn&apos;t have move to the
                    first column of the same stage.
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button variant="ghost" size="xs" onClick={() => setConfirmMirrorId(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        setBoardMirroring(project.id, board.id, true);
                        notify(`${board.name} now mirrors ${mainBoard.name}`);
                        setConfirmMirrorId(null);
                      }}
                    >
                      Mirror {mainBoard.name}
                    </Button>
                  </div>
                </div>
              )}

              {confirmDeleteId === board.id && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2 text-[11px] text-ink">
                  <span>
                    Move its {count} card{count === 1 ? '' : 's'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted" />
                  <select
                    value={deleteTargetId}
                    onChange={e => setDeleteTargetId(e.target.value)}
                    className="px-2 py-1 bg-paper-elevated border border-line rounded-md text-xs text-ink outline-none focus:border-flash"
                  >
                    {boards
                      .filter(b => b.id !== board.id)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button variant="ghost" size="xs" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => {
                        deleteBoard(project.id, board.id, deleteTargetId);
                        notify(`Board "${board.name}" removed; its cards moved to ${boards.find(b => b.id === deleteTargetId)?.name}`);
                        setConfirmDeleteId(null);
                      }}
                    >
                      Remove board
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="New board name, e.g. Testing"
            maxLength={40}
            className="flex-1 min-w-[200px] px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
          />
          <Button variant="primary" size="sm" icon={Plus} onClick={add} disabled={!newName.trim()}>
            Add board
          </Button>
        </div>
      )}

      {editingColumnsOf && (
        <BoardColumnsModal
          project={project}
          boardId={editingColumnsOf}
          tasks={tasks}
          onClose={() => setEditingColumnsOf(null)}
        />
      )}
    </Card>
  );
}
