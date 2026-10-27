'use client';

import type { BoardColumn } from '@/types';
import type { ResolvedBoard } from '@/lib/board-columns';

interface PlacementSelectProps {
  boards: ResolvedBoard[];
  boardId: string;
  columnId?: string;
  onChange: (board: ResolvedBoard, column: BoardColumn) => void;
  /** Text before each column name, e.g. "Move: " */
  prefix?: string;
  className?: string;
  'aria-label'?: string;
}

const SEP = '::';

/**
 * Picks a column, grouped by board when the project has more than one, so a card can move
 * to another board from a list or drawer as well as by dragging.
 */
export function PlacementSelect({ boards, boardId, columnId, onChange, prefix = '', className, ...rest }: PlacementSelectProps) {
  const multi = boards.length > 1;
  const options = (board: ResolvedBoard) =>
    board.columns.map(c => (
      <option key={`${board.id}${SEP}${c.id}`} value={`${board.id}${SEP}${c.id}`}>
        {prefix}{c.name}
      </option>
    ));

  return (
    <select
      value={`${boardId}${SEP}${columnId}`}
      onChange={e => {
        const [b, c] = e.target.value.split(SEP);
        const board = boards.find(x => x.id === b);
        const column = board?.columns.find(x => x.id === c);
        if (board && column) onChange(board, column);
      }}
      className={className}
      aria-label={rest['aria-label']}
    >
      {multi
        ? boards.map(board => (
            <optgroup key={board.id} label={board.name}>
              {options(board)}
            </optgroup>
          ))
        : options(boards[0])}
    </select>
  );
}
