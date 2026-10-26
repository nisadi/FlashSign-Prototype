import { cn } from '@/lib/utils';
import { AGENTS } from '@/lib/agent-connection';
import type { AgentEvent, WorkSession } from '@/types';

type Source = WorkSession['source'] | AgentEvent['agent'];

const OTHER: Record<string, { label: string; mark: string; color: string }> = {
  web: { label: 'Web app', mark: 'W', color: '#5a6f6c' },
  manual: { label: 'Manual entry', mark: 'M', color: '#8a8a8a' },
  system: { label: 'PM platform', mark: 'P', color: '#009882' },
};

/** Small coloured mark + name identifying which agent (or the web app) did something. */
export function AgentBadge({ source, showLabel = true, label, className }: {
  source: Source;
  showLabel?: boolean;
  /** Overrides the name shown, e.g. "Gemini" for the product card */
  label?: string;
  className?: string;
}) {
  const info = source in AGENTS ? AGENTS[source as keyof typeof AGENTS] : OTHER[source];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-ink', className)} title={info.label}>
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
        style={{ background: info.color }}
        aria-hidden
      >
        {info.mark}
      </span>
      {showLabel && <span className="font-medium">{label ?? info.label}</span>}
    </span>
  );
}
