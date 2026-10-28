'use client';

import { TASK_STATUS_CONFIG } from '@/components/shared/badges';
import { TASK_STAGES } from '@/lib/board-columns';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';

/**
 * A subtask's state, changeable in place. Subtasks live inside their task's card rather than
 * in board columns, so they use the five task stages.
 */
export function SubtaskStateSelect({
  status,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value as TaskStatus)}
      onClick={e => e.stopPropagation()}
      aria-label={ariaLabel}
      className={cn(
        'rounded-full border px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-flash',
        TASK_STATUS_CONFIG[status].className,
        className
      )}
    >
      {TASK_STAGES.map(stage => (
        <option key={stage.status} value={stage.status}>
          {stage.label}
        </option>
      ))}
    </select>
  );
}
