'use client';

import { Check, ArrowRight } from 'lucide-react';
import { STRUCTURE_PRESETS, presetOf, levelsOf, LEVEL_LABEL } from '@/lib/structure';
import { cn } from '@/lib/utils';
import type { ProjectStructure } from '@/types';

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-2.5 rounded-xl border border-line bg-paper p-3 cursor-pointer hover:border-flash/40">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 accent-flash" />
      <span>
        <span className="block text-xs font-semibold text-ink">{label}</span>
        <span className="block text-[11px] text-muted">{hint}</span>
      </span>
    </label>
  );
}

/** The chain a structure makes, e.g. Phase → Epic → Story → Task → Subtask */
export function StructureChain({ structure, className }: { structure: ProjectStructure; className?: string }) {
  const chain = [...levelsOf(structure).map(l => LEVEL_LABEL[l].one), 'task', ...(structure.subtasks ? ['subtask'] : [])];
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5 text-xs', className)}>
      {chain.map((level, i) => (
        <span key={level} className="flex items-center gap-1.5">
          {i > 0 && <ArrowRight className="w-3 h-3 text-muted" />}
          <span className="px-1.5 py-0.5 rounded-md bg-mist text-ink-soft font-medium capitalize">{level}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Choose a project's structure: a ready-made one or your own mix of levels, plus its rules.
 * Levels always stack Phase → Epic → Story → Task; each is created inside the one above it.
 */
export function StructureEditor({ value, onChange }: { value: ProjectStructure; onChange: (s: ProjectStructure) => void }) {
  const preset = presetOf(value);
  const set = (changes: Partial<ProjectStructure>) => onChange({ ...value, ...changes });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STRUCTURE_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => set({ phases: p.structure.phases, epics: p.structure.epics, stories: p.structure.stories })}
            className={cn(
              'p-3 rounded-xl border text-left transition-all',
              preset === p.id ? 'border-flash-deep bg-emerald-50/50 ring-2 ring-flash/30' : 'border-line bg-paper hover:bg-mist/30'
            )}
          >
            <span className="flex items-center justify-between text-xs font-bold text-ink">
              {p.name}
              {preset === p.id && <Check className="w-3.5 h-3.5 text-flash-deep" />}
            </span>
            <span className="block text-[11px] text-muted">{p.description}</span>
          </button>
        ))}
        <div className={cn('p-3 rounded-xl border text-left', preset === 'custom' ? 'border-flash-deep bg-emerald-50/50 ring-2 ring-flash/30' : 'border-dashed border-line')}>
          <span className="block text-xs font-bold text-ink">Custom</span>
          <span className="block text-[11px] text-muted">Tick the levels below</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink mb-1.5">Levels</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Toggle checked={value.phases} onChange={v => set({ phases: v })} label="Phases" hint="Dated stages, e.g. Design, Testing" />
          <Toggle checked={value.epics} onChange={v => set({ epics: v })} label="Epics" hint="Large bodies of work" />
          <Toggle checked={value.stories} onChange={v => set({ stories: v })} label="Stories" hint="User needs, with acceptance criteria" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          This project: <StructureChain structure={value} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink mb-1.5">Rules</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Toggle
            checked={value.subtasks}
            onChange={v => set({ subtasks: v })}
            label="Subtasks"
            hint="Tasks can be split into subtasks (one level)"
          />
          <Toggle
            checked={value.backlog}
            onChange={v => set({ backlog: v })}
            label="Backlog"
            hint="Tasks can wait unplaced and be put in the plan later"
          />
          <Toggle
            checked={value.allowMove}
            onChange={v => set({ allowMove: v })}
            label="Moving between parents"
            hint="Epics, stories and tasks can be moved after they're created"
          />
        </div>
      </div>
    </div>
  );
}
