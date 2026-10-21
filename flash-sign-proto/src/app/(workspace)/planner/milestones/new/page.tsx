'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flag,
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Check,
  Send,
  Info
} from 'lucide-react';
import { useApp } from '@/context/app-context';

export default function NewMilestonePage() {
  const router = useRouter();
  const { projects, tasks, addMilestone } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'upcoming' | 'at_risk' | 'completed' | 'pending'>('upcoming');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available tasks for the selected project
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === projectId);
  }, [tasks, projectId]);

  // Calculate progress based on linked tasks completion
  const calculatedProgress = useMemo(() => {
    if (status === 'completed') return 100;
    if (selectedTaskIds.length === 0) return 0;
    const completedCount = selectedTaskIds.filter(id => {
      const t = tasks.find(x => x.id === id);
      return t?.status === 'done';
    }).length;
    return Math.round((completedCount / selectedTaskIds.length) * 100);
  }, [selectedTaskIds, tasks, status]);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Milestone title is required.');
      return;
    }
    if (!projectId) {
      setError('Please select an associated project.');
      return;
    }
    if (!dueDate) {
      setError('Target due date is required.');
      return;
    }

    addMilestone({
      name: name.trim(),
      description: description.trim(),
      projectId,
      dueDate,
      status,
      progress: calculatedProgress,
      taskIds: selectedTaskIds
    });

    setIsSubmitted(true);
    setTimeout(() => {
      router.push('/planner/milestones');
    }, 1200);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/planner/milestones"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Milestones & Deadlines
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
            <Flag className="w-7 h-7 text-flash-deep" />
            Create Project Milestone
          </h1>
          <p className="text-sm text-muted mt-1">
            Define key release gates, sprint deliverables, and synchronise linked task progress across the planner.
          </p>
        </div>

        {/* Prototype banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Progress Auto-Calculation:</span> Progress percentage is automatically derived from completed tasks linked to this milestone and syncs across the Planner and Project Timeline.
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white border border-emerald-300 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">Milestone Created!</h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              <strong>{name}</strong> has been added with {selectedTaskIds.length} linked tasks. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-line/70 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Milestone Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Beta Launch, Security Audit Pass, v2.0 Release"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Scope & Deliverables Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Detail key acceptance criteria or sign-off prerequisites for this milestone..."
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* Project & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Associated Project <span className="text-danger">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={e => {
                    setProjectId(e.target.value);
                    setSelectedTaskIds([]); // Reset task links for new project
                  }}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Target Due Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash font-mono"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Milestone Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'at_risk', label: 'At Risk' },
                  { id: 'pending', label: 'Pending Gate' },
                  { id: 'completed', label: 'Completed' }
                ].map(st => (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setStatus(st.id as any)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all ${
                      status === st.id
                        ? 'bg-ink text-white border-ink shadow-xs'
                        : 'bg-paper text-muted hover:text-ink border-line'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Tasks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Link Project Tasks ({selectedTaskIds.length} linked)
                </label>
                <span className="text-[11px] text-muted">
                  Auto Progress: <strong>{calculatedProgress}%</strong>
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto p-2 border border-line rounded-xl space-y-1.5">
                {projectTasks.length === 0 ? (
                  <p className="text-xs text-muted p-3 text-center italic">
                    No tasks found in this project.
                  </p>
                ) : (
                  projectTasks.map(task => {
                    const isChecked = selectedTaskIds.includes(task.id);
                    return (
                      <button
                        type="button"
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                          isChecked
                            ? 'bg-flash/10 border-flash ring-1 ring-flash'
                            : 'border-line/60 hover:bg-paper'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-[10px] text-muted block">{task.key}</span>
                          <span className="text-xs font-medium text-ink truncate block">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-paper border border-line">
                            {task.status}
                          </span>
                          {isChecked && <CheckCircle2 className="w-4 h-4 text-flash" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
              <Link
                href="/planner/milestones"
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                Create Milestone
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
