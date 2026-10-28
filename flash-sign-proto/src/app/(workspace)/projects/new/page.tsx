'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, useCurrentUser } from '@/context/app-context';
import { notify } from '@/components/shared/toaster';
import type { ProjectStatus, ProjectPriority, ProjectHealth } from '@/types';
import { ArrowLeft, ArrowRight, FolderKanban, Sparkles, Check, Users, Calendar, Flag, Shield, Layers, Rows3 } from 'lucide-react';
import {
  PhasesStep, EpicsStep, BoardsStep, type DraftPhase, type DraftEpic,
} from '@/components/projects/new-project-plan-steps';
import { DateRangeField, type DateRange } from '@/components/shared/duration-fields';
import { addDuration, formatDuration } from '@/lib/durations';
import { diffCalendarDays } from '@/lib/timeline-calculator';

const ACCENT_COLORS = [
  { label: 'Mint Flash', value: '#00c2a8' },
  { label: 'Electric Blue', value: '#3b82f6' },
  { label: 'Royal Violet', value: '#8b5cf6' },
  { label: 'Sunset Coral', value: '#f43f5e' },
  { label: 'Emerald Forest', value: '#10b981' },
  { label: 'Amber Flame', value: '#f59e0b' },
];

const TEMPLATES = [
  { id: 'scrum', name: 'Agile Scrum Delivery', description: 'Sprint planning, capacity forecasting, and backlog refinement.' },
  { id: 'kanban', name: 'Continuous Kanban', description: 'Visual swimlanes with WIP limits and cycle time metrics.' },
  { id: 'esign', name: 'Document & E-Sign Pipeline', description: 'Legal approval workflows and cryptographic audit tracking.' },
  { id: 'agent', name: 'AI Coding Agent Sandbox', description: 'Claude & Gemini automated task execution with review gates.' },
];

/** The New Project form is a step-by-step form; phases, epics and boards are optional steps */
const STEPS = ['Basics', 'Team & timeline', 'Phases', 'Epics', 'Boards', 'Goals & review'] as const;

const SPACES = [
  'Core Platform',
  'Client Engagements',
  'AI & Automation',
  'Product Studio',
  'Compliance & IT',
  'Growth & UX',
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { users, addProject, addActivity, addMilestone, addEpic } = useApp();
  const currentUser = useCurrentUser();

  // Form State
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].value);
  const [ownerId, setOwnerId] = useState(currentUser?.id || 'u2');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([currentUser?.id || 'u2']);
  const [group, setGroup] = useState(SPACES[0]);
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [status, setStatus] = useState<ProjectStatus>('active');
  // The project's planned time; teams mostly plan in months, so it starts at 3 months
  const [timeline, setTimeline] = useState<DateRange>(() => {
    const start = new Date().toISOString().split('T')[0];
    return { start, end: addDuration(start, 3, 'months'), unit: 'months' };
  });
  const { start: startDate, end: endDate } = timeline;
  const duration = startDate && endDate ? diffCalendarDays(startDate, endDate) : 0;
  const [template, setTemplate] = useState('scrum');
  const [visibility, setVisibility] = useState('workspace');
  const [goalText, setGoalText] = useState('');
  const [goals, setGoals] = useState<string[]>([
    'Ship MVP within planned sprint cadence',
    'Achieve zero high-priority blocker defects',
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step-by-step form and the optional plan set up with the project
  const [step, setStep] = useState(0);
  const [phases, setPhases] = useState<DraftPhase[]>([]);
  const [epics, setEpics] = useState<DraftEpic[]>([]);
  const [mainBoardName, setMainBoardName] = useState('Main board');
  const [extraBoards, setExtraBoards] = useState<string[]>([]);

  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleAddGoal = () => {
    if (goalText.trim()) {
      setGoals([...goals, goalText.trim()]);
      setGoalText('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  /** What's wrong on a step, if anything */
  const errorsFor = (n: number): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (n === 0) {
      if (!name.trim() || name.trim().length < 3) newErrors.name = 'Project name must be at least 3 characters.';
      if (!key.trim() || key.trim().length < 2) newErrors.key = 'Project key must be 2–6 characters.';
    }
    if (n === 1) {
      if (duration <= 0) newErrors.duration = 'Project duration must be at least 1 calendar day.';
      if (new Date(endDate) < new Date(startDate)) newErrors.endDate = 'Target end date cannot be earlier than start date.';
    }
    if (n === 2 && phases.some(p => !p.name.trim() || p.endDate < p.startDate)) {
      newErrors.phases = 'Every phase needs a name, and its end date can\'t be before its start date.';
    } else if (n === 2 && phases.some(p => p.startDate < startDate || p.endDate > endDate)) {
      newErrors.phases = 'Every phase has to fit inside the project\'s time.';
    }
    return newErrors;
  };

  const goTo = (target: number) => {
    // Moving forward checks each step on the way
    for (let n = step; n < target; n++) {
      const stepErrors = errorsFor(n);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(n);
        return;
      }
    }
    setErrors({});
    setStep(target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    for (let n = 0; n < STEPS.length; n++) {
      const stepErrors = errorsFor(n);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(n);
        return;
      }
    }

    const newProjectId = `p-${Date.now().toString(36)}`;
    const newProject = {
      id: newProjectId,
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim(),
      status,
      health: 'on_track' as ProjectHealth,
      ownerId,
      teamIds: ['t1'],
      memberIds: selectedMemberIds,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      dueDate: new Date(endDate).toISOString(),
      progress: 0,
      priority,
      tags: [template, visibility],
      accentColor,
      group,
      goals,
      isFavorite: false,
      isArchived: false,
      // Timeline Baseline & Initial Calculated Values
      originalStartDate: startDate,
      originalEndDate: endDate,
      originalDuration: duration,
      currentStartDate: startDate,
      currentEndDate: endDate,
      currentDuration: duration,
      timelineDifference: 0,
      timelineStatus: 'on_schedule' as const,
      totalWorkDays: 0,
      durationUnit: timeline.unit,
      mainBoardName: mainBoardName.trim() || undefined,
      extraBoards: extraBoards.map((boardName, i) => ({ id: `board-${newProjectId}-${i}`, name: boardName })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(newProject);
    // The plan set up in the form: phases (saved as milestones), then epics inside them
    const phaseIds = new Map(phases.map((p, i) => [p.key, `ms-${newProjectId}-${i}`]));
    phases.forEach(p =>
      addMilestone({
        id: phaseIds.get(p.key),
        projectId: newProjectId,
        name: p.name.trim(),
        startDate: p.startDate,
        endDate: p.endDate,
        dueDate: p.endDate,
        durationUnit: p.unit,
        status: 'upcoming',
      })
    );
    epics.forEach((ep, i) =>
      addEpic({
        id: `epic-${newProjectId}-${i}`,
        projectId: newProjectId,
        name: ep.name,
        phaseId: phaseIds.get(ep.phaseKey),
        color: ep.color,
      })
    );
    addActivity({
      id: `act-${Date.now()}`,
      actorId: currentUser?.id || 'u2',
      actorName: currentUser?.name || 'Marcus Webb',
      action: 'project.created',
      resource: 'Project',
      resourceId: newProjectId,
      detail: `Created project ${newProject.name} (${newProject.key})${phases.length ? ` with ${phases.length} phases` : ''}${epics.length ? ` and ${epics.length} epics` : ''}`,
      timestamp: new Date().toISOString(),
    });

    notify(`Project "${newProject.name}" created${phases.length ? ` with ${phases.length} phases` : ''}`);
    router.push(`/projects/${newProjectId}`);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Top Back Nav */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Projects</span>
      </Link>

      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-flash-deep border border-emerald-200 mb-2">
          <FolderKanban className="w-3.5 h-3.5" />
          <span>New Workspace Initiative</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Create New Project
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Configure an agile delivery space with timelines, team roles, and milestone tracking.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5">
            {i > 0 && <span className="w-4 h-px bg-line" />}
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : goTo(i))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                i === step
                  ? 'bg-flash-deep text-white border-flash-deep'
                  : i < step
                    ? 'bg-emerald-50 text-flash-deep border-emerald-200'
                    : 'bg-paper text-muted border-line hover:text-ink'
              }`}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span className="font-mono">{i + 1}</span>}
              {label}
              {(i === 2 || i === 3 || i === 4) && <span className="font-normal opacity-70">(optional)</span>}
            </button>
          </li>
        ))}
      </ol>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-paper-elevated border border-line rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {step === 0 && (<>
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2">
            General Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink mb-1">
                Project Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (!key) setKey(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase());
                }}
                placeholder="e.g. Flash Sign Mobile iOS & Android"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-flash ${
                  errors.name ? 'border-danger ring-1 ring-danger' : 'border-line'
                }`}
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Project Key <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value.toUpperCase())}
                placeholder="e.g. MOB"
                maxLength={6}
                className={`w-full px-3.5 py-2 text-sm font-mono font-bold rounded-lg border bg-paper text-ink uppercase focus:outline-none focus:ring-1 focus:ring-flash ${
                  errors.key ? 'border-danger' : 'border-line'
                }`}
              />
              {errors.key && <p className="text-xs text-danger mt-1">{errors.key}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Project Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is the objective, scope, and target customer for this project?"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            />
          </div>

          {/* Accent Color & Space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Accent Branding Color
              </label>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAccentColor(c.value)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
                      accentColor === c.value ? 'ring-2 ring-offset-2 ring-ink scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {accentColor === c.value && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Workspace Space / Group
              </label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink"
              >
                {SPACES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2">
            Delivery Framework Template
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => setTemplate(tpl.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  template === tpl.id
                    ? 'border-flash-deep bg-emerald-50/50 ring-2 ring-flash/30'
                    : 'border-line bg-paper hover:bg-mist/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-ink">{tpl.name}</span>
                  {template === tpl.id && (
                    <div className="w-4 h-4 rounded-full bg-flash-deep text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{tpl.description}</p>
              </div>
            ))}
          </div>
        </div>
        </>)}

        {step === 1 && (
        /* Ownership, Members & Schedule */
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2">
            Team & Timeline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Project Owner
              </label>
              <select
                value={ownerId}
                onChange={e => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.title || u.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-paper text-ink"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Original Project Timeline Definition */}
          <div className="p-4 rounded-xl border border-line bg-mist/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-flash-deep" />
                  Original Project Timeline
                </label>
                <p className="text-[11px] text-muted">
                  Defines the immutable planned baseline to compare against task progress.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper-elevated border border-line text-[11px] font-mono text-ink">
                <span className="w-2 h-2 rounded-full bg-flash-deep" />
                <span>Baseline: {formatDuration(startDate, endDate, timeline.unit)}</span>
              </div>
            </div>

            <DateRangeField
              value={timeline}
              onChange={(range) => {
                setTimeline(range);
                setErrors((prev) => ({ ...prev, duration: '', endDate: '' }));
              }}
              endLabel="Target end date"
            />
            {(errors.duration || errors.endDate) && (
              <p className="text-[11px] text-danger">{errors.duration || errors.endDate}</p>
            )}
            <p className="text-[11px] text-muted italic">
              Type the length as days, weeks or months; the end date follows. Changing the end date works out the length.
            </p>
          </div>

          {/* Members Multi-select pills */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Assigned Team Members ({selectedMemberIds.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-paper rounded-xl border border-line">
              {users.map(u => {
                const isSelected = selectedMemberIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleMember(u.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-flash-deep text-white font-medium shadow-xs'
                        : 'bg-paper-elevated text-ink hover:bg-mist/50 border border-line'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.initials}
                    </div>
                    <span className="truncate">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-flash-deep" /> Phases
            </h3>
            <PhasesStep phases={phases} onChange={setPhases} startDate={startDate} endDate={endDate} unit={timeline.unit} />
            {errors.phases && <p className="text-xs text-danger">{errors.phases}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-flash-deep" /> Epics
            </h3>
            <EpicsStep epics={epics} onChange={setEpics} phases={phases} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2 flex items-center gap-1.5">
              <Rows3 className="w-3.5 h-3.5 text-flash-deep" /> Boards
            </h3>
            <BoardsStep
              mainBoardName={mainBoardName}
              onMainBoardName={setMainBoardName}
              extraBoards={extraBoards}
              onExtraBoards={setExtraBoards}
            />
          </div>
        )}

        {step === 5 && (<>
        {/* Goals Checklist */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2">
            Project Goals & Deliverables
          </h3>

          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-paper border border-line text-xs">
                <span className="text-ink font-medium">{g}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(i)}
                  className="text-muted hover:text-danger text-xs font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              placeholder="Add key milestone or goal..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink"
            />
            <button
              type="button"
              onClick={handleAddGoal}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-mist hover:bg-line text-ink transition-colors"
            >
              Add Goal
            </button>
          </div>
        </div>

        {/* Review */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-2">Review</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div><dt className="text-muted">Project</dt><dd className="font-semibold text-ink">{name || '—'} <span className="font-mono text-muted">({key || '—'})</span></dd></div>
            <div><dt className="text-muted">Timeline</dt><dd className="font-mono text-ink">{startDate} → {endDate} ({formatDuration(startDate, endDate, timeline.unit)})</dd></div>
            <div>
              <dt className="text-muted">Phases</dt>
              <dd className="text-ink">{phases.length ? phases.map(p => p.name).join(' → ') : 'None (can be added on the Plan tab)'}</dd>
            </div>
            <div>
              <dt className="text-muted">Epics</dt>
              <dd className="text-ink">{epics.length ? epics.map(e => e.name).join(', ') : 'None (can be added on the Plan tab)'}</dd>
            </div>
            <div>
              <dt className="text-muted">Boards</dt>
              <dd className="text-ink">{[mainBoardName || 'Main board', ...extraBoards].join(', ')}</dd>
            </div>
            <div><dt className="text-muted">Team</dt><dd className="text-ink">{selectedMemberIds.length} member{selectedMemberIds.length === 1 ? '' : 's'}</dd></div>
          </dl>
        </div>
        </>)}

        {/* Step Actions */}
        <div className="pt-4 border-t border-line flex items-center justify-between">
          {step === 0 ? (
            <Link
              href="/projects"
              className="px-4 py-2 text-xs font-medium text-muted hover:text-ink rounded"
            >
              Cancel
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-ink rounded inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {step < STEPS.length - 1 ? (
              <>
                <span>{(step === 2 && phases.length === 0) || (step === 3 && epics.length === 0) ? 'Skip' : 'Next'}: {STEPS[step + 1]}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create Project</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
