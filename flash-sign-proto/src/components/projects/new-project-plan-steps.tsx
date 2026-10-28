'use client';

import { useState } from 'react';
import { Plus, Trash2, Flag, Layers, Rows3, Check } from 'lucide-react';
import { EPIC_COLORS } from '@/lib/plan';
import { addDays, diffCalendarDays } from '@/lib/timeline-calculator';
import { cn } from '@/lib/utils';

/** A phase being planned in the New Project form (saved as a milestone on create) */
export interface DraftPhase {
  key: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface DraftEpic {
  key: string;
  name: string;
  phaseKey: string;
  color: string;
}

export const PHASE_TEMPLATES: { id: string; name: string; description: string; phases: string[] }[] = [
  { id: 'waterfall', name: 'Waterfall', description: 'One stage after another', phases: ['Requirements', 'Design', 'Development', 'Testing', 'Release'] },
  { id: 'releases', name: 'Release stages', description: 'Build up to general availability', phases: ['MVP', 'Beta', 'General availability'] },
  { id: 'none', name: 'No phases', description: 'Sprints and epics only', phases: [] },
];

const key = () => Math.random().toString(36).slice(2, 9);
const input = 'w-full px-2.5 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink focus:outline-none focus:border-flash';

/** Split the project's dates evenly across the named phases */
export function spreadPhases(names: string[], startDate: string, endDate: string): DraftPhase[] {
  const total = Math.max(names.length, diffCalendarDays(startDate, endDate));
  const step = total / Math.max(1, names.length);
  return names.map((name, i) => ({
    key: key(),
    name,
    startDate: addDays(startDate, Math.round(i * step)),
    endDate: i === names.length - 1 ? endDate : addDays(startDate, Math.round((i + 1) * step)),
  }));
}

export function PhasesStep({
  phases,
  onChange,
  startDate,
  endDate,
}: {
  phases: DraftPhase[];
  onChange: (phases: DraftPhase[]) => void;
  startDate: string;
  endDate: string;
}) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const patch = (k: string, changes: Partial<DraftPhase>) => onChange(phases.map(p => (p.key === k ? { ...p, ...changes } : p)));
  const add = () => {
    const from = phases.at(-1)?.endDate ?? startDate;
    onChange([...phases, { key: key(), name: '', startDate: from, endDate: addDays(from, 14) > endDate ? endDate : addDays(from, 14) }]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Phases are the big stages of the project, each ending in a checkpoint. They&apos;re optional: skip this step if the project only uses sprints.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PHASE_TEMPLATES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTemplateId(t.id);
              onChange(spreadPhases(t.phases, startDate, endDate));
            }}
            className={cn(
              'p-3 rounded-xl border text-left transition-all',
              templateId === t.id ? 'border-flash-deep bg-emerald-50/50 ring-2 ring-flash/30' : 'border-line bg-paper hover:bg-mist/30'
            )}
          >
            <span className="flex items-center justify-between text-xs font-bold text-ink">
              {t.name}
              {templateId === t.id && <Check className="w-3.5 h-3.5 text-flash-deep" />}
            </span>
            <span className="block text-[11px] text-muted">{t.description}</span>
            {t.phases.length > 0 && <span className="block mt-1 text-[10px] text-muted">{t.phases.join(' → ')}</span>}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {phases.map((p, i) => (
          <li key={p.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper p-2">
            <Flag className="w-3.5 h-3.5 text-flash-deep shrink-0" />
            <span className="text-[10px] font-mono text-muted w-4">{i + 1}</span>
            <input
              value={p.name}
              onChange={e => patch(p.key, { name: e.target.value })}
              placeholder="Phase name"
              className={cn(input, 'flex-1 min-w-[140px]', !p.name.trim() && 'border-danger/60')}
            />
            <input type="date" value={p.startDate} onChange={e => patch(p.key, { startDate: e.target.value })} className={cn(input, 'w-auto font-mono')} aria-label="Phase start" />
            <span className="text-muted text-xs">→</span>
            <input
              type="date"
              value={p.endDate}
              onChange={e => patch(p.key, { endDate: e.target.value })}
              className={cn(input, 'w-auto font-mono', p.endDate < p.startDate && 'border-danger')}
              aria-label="Phase end"
            />
            <button type="button" onClick={() => onChange(phases.filter(x => x.key !== p.key))} className="p-1.5 text-muted hover:text-danger rounded-md" aria-label="Remove phase">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted hover:text-ink border-2 border-dashed border-line hover:border-flash/50 rounded-xl">
        <Plus className="w-4 h-4" /> Add phase
      </button>
    </div>
  );
}

export function EpicsStep({ epics, onChange, phases }: { epics: DraftEpic[]; onChange: (epics: DraftEpic[]) => void; phases: DraftPhase[] }) {
  const [name, setName] = useState('');
  const [phaseKey, setPhaseKey] = useState(phases[0]?.key ?? '');
  const add = () => {
    if (!name.trim()) return;
    onChange([...epics, { key: key(), name: name.trim(), phaseKey, color: EPIC_COLORS[epics.length % EPIC_COLORS.length] }]);
    setName('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Epics are large bodies of work, e.g. &quot;Signature canvas&quot; or &quot;Payments&quot;. Stories and tasks go inside them later, on the Plan tab. Optional.
      </p>
      <ul className="space-y-2">
        {epics.map(ep => (
          <li key={ep.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper p-2" style={{ borderLeft: `4px solid ${ep.color}` }}>
            <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: ep.color }} />
            <input
              value={ep.name}
              onChange={e => onChange(epics.map(x => (x.key === ep.key ? { ...x, name: e.target.value } : x)))}
              className={cn(input, 'flex-1 min-w-[140px]')}
              aria-label="Epic name"
            />
            {phases.length > 0 && (
              <select
                value={ep.phaseKey}
                onChange={e => onChange(epics.map(x => (x.key === ep.key ? { ...x, phaseKey: e.target.value } : x)))}
                className={cn(input, 'w-auto')}
                aria-label="Phase"
              >
                <option value="">No phase</option>
                {phases.map(p => <option key={p.key} value={p.key}>{p.name || 'Untitled phase'}</option>)}
              </select>
            )}
            <button type="button" onClick={() => onChange(epics.filter(x => x.key !== ep.key))} className="p-1.5 text-muted hover:text-danger rounded-md" aria-label="Remove epic">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New epic name"
          className={cn(input, 'flex-1 min-w-[180px] py-2')}
        />
        {phases.length > 0 && (
          <select value={phaseKey} onChange={e => setPhaseKey(e.target.value)} className={cn(input, 'w-auto py-2')} aria-label="Phase for the new epic">
            <option value="">No phase</option>
            {phases.map(p => <option key={p.key} value={p.key}>{p.name || 'Untitled phase'}</option>)}
          </select>
        )}
        <button type="button" onClick={add} disabled={!name.trim()} className="px-3 py-2 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink disabled:opacity-50">
          Add epic
        </button>
      </div>
    </div>
  );
}

export function BoardsStep({
  mainBoardName,
  onMainBoardName,
  extraBoards,
  onExtraBoards,
}: {
  mainBoardName: string;
  onMainBoardName: (name: string) => void;
  extraBoards: string[];
  onExtraBoards: (names: string[]) => void;
}) {
  const [name, setName] = useState('');
  const add = (n: string) => {
    if (!n.trim() || extraBoards.includes(n.trim())) return;
    onExtraBoards([...extraBoards, n.trim()]);
    setName('');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Every project has a main Kanban board. Extra boards, such as Testing, stack below it and start with the same columns. You can change columns later.
      </p>
      <label className="block">
        <span className="block text-xs font-semibold text-ink mb-1">Main board name</span>
        <input value={mainBoardName} onChange={e => onMainBoardName(e.target.value)} placeholder="Main board" className={cn(input, 'py-2')} />
      </label>
      <ul className="space-y-2">
        {extraBoards.map(b => (
          <li key={b} className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2 text-xs text-ink">
            <Rows3 className="w-3.5 h-3.5 text-flash-deep" />
            <span className="flex-1">{b}</span>
            <span className="text-[10px] text-muted">Mirrors the main board</span>
            <button type="button" onClick={() => onExtraBoards(extraBoards.filter(x => x !== b))} className="p-1.5 text-muted hover:text-danger rounded-md" aria-label={`Remove ${b}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(name);
            }
          }}
          placeholder="Extra board name, e.g. Testing"
          className={cn(input, 'flex-1 min-w-[180px] py-2')}
        />
        <button type="button" onClick={() => add(name)} disabled={!name.trim()} className="px-3 py-2 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink disabled:opacity-50">
          Add board
        </button>
        {!extraBoards.includes('Testing') && (
          <button type="button" onClick={() => add('Testing')} className="px-3 py-2 text-xs font-semibold rounded-lg border border-dashed border-line text-muted hover:text-ink">
            + Testing board
          </button>
        )}
      </div>
    </div>
  );
}
