'use client';

import { useState } from 'react';
import { Plus, Trash2, Flag, Layers, Rows3, Check } from 'lucide-react';
import { EPIC_COLORS } from '@/lib/plan';
import { addDays, diffCalendarDays } from '@/lib/timeline-calculator';
import { naturalUnit, type DurationUnit } from '@/lib/durations';
import { DateRangeField, WindowHint, type DateRange } from '@/components/shared/duration-fields';
import type { TimeWindow } from '@/lib/schedule';
import { cn } from '@/lib/utils';

/** A phase being planned in the New Project form (saved as a milestone on create) */
export interface DraftPhase {
  key: string;
  name: string;
  startDate: string;
  endDate: string;
  unit: DurationUnit;
}

export interface DraftEpic {
  key: string;
  name: string;
  phaseKey: string;
  color: string;
  /** Its own dates inside its phase; missing = all of its phase (or the project) */
  own?: DateRange;
}

/** The time an epic may use: its phase, or the whole project */
export function draftEpicWindow(ep: Pick<DraftEpic, 'phaseKey'>, phases: DraftPhase[], project: TimeWindow): TimeWindow {
  const phase = phases.find(p => p.key === ep.phaseKey);
  return phase ? { start: phase.startDate, end: phase.endDate, label: phase.name || 'its phase' } : project;
}

/** An epic's own time: its own dates, or all of its phase */
export function draftEpicSpan(ep: DraftEpic, phases: DraftPhase[], project: TimeWindow): TimeWindow {
  const w = draftEpicWindow(ep, phases, project);
  return { ...(ep.own ? { start: ep.own.start, end: ep.own.end } : w), label: ep.name || 'its epic' };
}

/**
 * "All of Development" or "Its own dates" for an epic or story being planned, with the dates
 * limited to its parent's time.
 */
function TimeChoice({ own, onChange, window: w }: { own?: DateRange; onChange: (own?: DateRange) => void; window: TimeWindow }) {
  return (
    <div className="w-full flex flex-wrap items-center gap-2 pl-6">
      <select
        value={own ? 'own' : 'all'}
        onChange={e => onChange(e.target.value === 'own' ? { start: w.start, end: w.end, unit: naturalUnit(w.start, w.end) } : undefined)}
        className={cn(input, 'w-auto')}
        aria-label="Time"
      >
        <option value="all">Time: all of {w.label}</option>
        <option value="own">Time: its own dates inside {w.label}</option>
      </select>
      {own ? <DateRangeField compact value={own} onChange={onChange} window={w} /> : <WindowHint window={w} />}
    </div>
  );
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
  return names.map((name, i) => {
    const start = addDays(startDate, Math.round(i * step));
    const end = i === names.length - 1 ? endDate : addDays(startDate, Math.round((i + 1) * step));
    return { key: key(), name, startDate: start, endDate: end, unit: naturalUnit(start, end) };
  });
}

export function PhasesStep({
  phases,
  onChange,
  startDate,
  endDate,
  unit,
}: {
  phases: DraftPhase[];
  onChange: (phases: DraftPhase[]) => void;
  startDate: string;
  endDate: string;
  /** The unit the project was planned in; new phases start in weeks unless the project uses days */
  unit: DurationUnit;
}) {
  const projectWindow = { start: startDate, end: endDate, label: 'the project' };
  const [templateId, setTemplateId] = useState<string | null>(null);
  const patch = (k: string, changes: Partial<DraftPhase>) => onChange(phases.map(p => (p.key === k ? { ...p, ...changes } : p)));
  const add = () => {
    const from = phases.at(-1)?.endDate ?? startDate;
    const end = addDays(from, 14) > endDate ? endDate : addDays(from, 14);
    onChange([...phases, { key: key(), name: '', startDate: from, endDate: end, unit: unit === 'days' ? 'days' : 'weeks' }]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Phases are the big stages of the project, each ending in a checkpoint. Each phase&apos;s time sits inside the project&apos;s time. They&apos;re optional: skip this step if the project only uses sprints.
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
            <DateRangeField
              compact
              value={{ start: p.startDate, end: p.endDate, unit: p.unit }}
              onChange={r => patch(p.key, { startDate: r.start, endDate: r.end, unit: r.unit })}
              window={projectWindow}
              startLabel="Phase start"
              endLabel="Phase end"
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

export function EpicsStep({
  epics,
  onChange,
  phases,
  requirePhase,
  project,
}: {
  epics: DraftEpic[];
  onChange: (epics: DraftEpic[]) => void;
  phases: DraftPhase[];
  /** The project uses phases, so every epic goes in one */
  requirePhase: boolean;
  /** The project's time, for epics without a phase */
  project: TimeWindow;
}) {
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
        Epics are large bodies of work, e.g. &quot;Signature canvas&quot; or &quot;Payments&quot;. Each epic&apos;s time sits inside
        its phase. Stories and tasks go inside them later, on the Plan tab. Optional.
      </p>
      {requirePhase && phases.length === 0 && (
        <p className="text-xs text-waiting">Add a phase first (previous step), then epics can go in it.</p>
      )}
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
                {!requirePhase && <option value="">No phase</option>}
                {phases.map(p => <option key={p.key} value={p.key}>{p.name || 'Untitled phase'}</option>)}
              </select>
            )}
            <button type="button" onClick={() => onChange(epics.filter(x => x.key !== ep.key))} className="p-1.5 text-muted hover:text-danger rounded-md" aria-label="Remove epic">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <TimeChoice
              own={ep.own}
              onChange={own => onChange(epics.map(x => (x.key === ep.key ? { ...x, own } : x)))}
              window={draftEpicWindow(ep, phases, project)}
            />
          </li>
        ))}
      </ul>
      {(!requirePhase || phases.length > 0) && (
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
            {!requirePhase && <option value="">No phase</option>}
            {phases.map(p => <option key={p.key} value={p.key}>{p.name || 'Untitled phase'}</option>)}
          </select>
        )}
        <button type="button" onClick={add} disabled={!name.trim()} className="px-3 py-2 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink disabled:opacity-50">
          Add epic
        </button>
      </div>
      )}
    </div>
  );
}

export interface DraftStory {
  key: string;
  title: string;
  /** Its epic (projects with epics) or its phase (projects with phases but no epics) */
  parentKey: string;
  /** Its own dates inside its parent; missing = all of its parent */
  own?: DateRange;
}

/** Stories set up with the project, each inside an epic, or a phase when the project has no epics */
export function StoriesStep({
  stories,
  onChange,
  parents,
  parentLabel,
  windowOf,
}: {
  stories: DraftStory[];
  onChange: (stories: DraftStory[]) => void;
  /** The epics or phases a story can go in; empty when the project uses neither */
  parents: { key: string; name: string }[];
  parentLabel: 'epic' | 'phase' | null;
  /** The time a story in this parent may use */
  windowOf: (parentKey: string) => TimeWindow;
}) {
  const [title, setTitle] = useState('');
  const [parentKey, setParentKey] = useState(parents[0]?.key ?? '');
  const add = () => {
    if (!title.trim()) return;
    onChange([...stories, { key: key(), title: title.trim(), parentKey: parentLabel ? parentKey || parents[0]?.key || '' : '' }]);
    setTitle('');
  };
  const parentSelect = (value: string, set: (v: string) => void, aria: string) =>
    parentLabel && (
      <select value={value} onChange={e => set(e.target.value)} className={cn(input, 'w-auto py-2')} aria-label={aria}>
        {parents.map(p => <option key={p.key} value={p.key}>{p.name || `Untitled ${parentLabel}`}</option>)}
      </select>
    );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Stories describe what a user needs, e.g. &quot;As a signer, I can sign on my phone&quot;.
        {parentLabel && ` Each story goes in ${parentLabel === 'epic' ? 'an epic' : 'a phase'}, and its time sits inside it.`} Tasks are added inside stories later, on the Plan tab. Optional.
      </p>
      {parentLabel && parents.length === 0 && (
        <p className="text-xs text-waiting">Add {parentLabel === 'epic' ? 'an epic' : 'a phase'} first (previous step), then stories can go in it.</p>
      )}
      <ul className="space-y-2">
        {stories.map(st => (
          <li key={st.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper p-2">
            <input
              value={st.title}
              onChange={e => onChange(stories.map(x => (x.key === st.key ? { ...x, title: e.target.value } : x)))}
              className={cn(input, 'flex-1 min-w-[200px]')}
              aria-label="Story"
            />
            {parentSelect(st.parentKey, v => onChange(stories.map(x => (x.key === st.key ? { ...x, parentKey: v } : x))), `${parentLabel} for this story`)}
            <button type="button" onClick={() => onChange(stories.filter(x => x.key !== st.key))} className="p-1.5 text-muted hover:text-danger rounded-md" aria-label="Remove story">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <TimeChoice
              own={st.own}
              onChange={own => onChange(stories.map(x => (x.key === st.key ? { ...x, own } : x)))}
              window={windowOf(st.parentKey)}
            />
          </li>
        ))}
      </ul>
      {(!parentLabel || parents.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="As a …, I can … so that …"
            className={cn(input, 'flex-1 min-w-[200px] py-2')}
          />
          {parentSelect(parentKey, setParentKey, `${parentLabel} for the new story`)}
          <button type="button" onClick={add} disabled={!title.trim()} className="px-3 py-2 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink disabled:opacity-50">
            Add story
          </button>
        </div>
      )}
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
