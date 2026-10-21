'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { formatDate } from '@/lib/utils';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Target,
  Edit2,
  Trash2,
  Clock,
  CheckSquare,
} from 'lucide-react';
import type { Sprint } from '@/types';

export default function ProjectSprintsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, sprints, tasks, addSprint, updateSprint, deleteSprint } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectSprints = sprints.filter((s) => s.projectId === projectId);
  const activeSprint = projectSprints.find((s) => s.status === 'active');
  const upcomingSprints = projectSprints.filter((s) => s.status === 'planning');
  const completedSprints = projectSprints.filter((s) => s.status === 'completed');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    addSprint({
      name: sprintName.trim(),
      projectId,
      goal: sprintGoal.trim() || undefined,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate:
        endDate ||
        new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'planning',
    });

    setSprintName('');
    setSprintGoal('');
    setStartDate('');
    setEndDate('');
    setShowCreateModal(false);
  };

  const handleStartSprint = (sprintId: string) => {
    updateSprint(sprintId, { status: 'active' });
  };

  const handleCompleteSprint = (sprintId: string) => {
    updateSprint(sprintId, { status: 'completed' });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="sprints" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Zap className="w-5 h-5 text-flash-deep" /> Sprints & Iterations
            </h1>
            <p className="text-xs text-muted">
              Manage agile iterations, sprint goals, and velocity for {project.name}
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Create Sprint
          </Button>
        </div>

        {/* Create Sprint Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-paper-elevated border border-line rounded-2xl p-6 max-w-md w-full shadow-xl animate-fade-in space-y-4">
              <h2 className="text-base font-bold text-ink">Create New Sprint</h2>
              <form onSubmit={handleCreateSprint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Sprint Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="e.g. Sprint 4: Core Optimization"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Sprint Goal</label>
                  <textarea
                    rows={2}
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    placeholder="e.g. Finalize responsive layout and release preview…"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Create Sprint
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Sprint Section */}
        <div>
          <h2 className="text-xs uppercase font-mono font-bold text-flash-deep tracking-wider mb-3">
            Active Sprint
          </h2>

          {activeSprint ? (
            <SprintCard
              sprint={activeSprint}
              tasks={tasks}
              projectId={projectId}
              onStart={handleStartSprint}
              onComplete={handleCompleteSprint}
              onDelete={deleteSprint}
            />
          ) : (
            <Card className="p-8 text-center text-xs text-muted border-dashed">
              <Zap className="w-8 h-8 mx-auto text-muted/50 mb-2" />
              <p className="font-semibold text-ink mb-1">No active sprint</p>
              <p className="max-w-xs mx-auto mb-4">
                Start an upcoming sprint or plan a new iteration to start tracking progress.
              </p>
              {upcomingSprints.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  onClick={() => handleStartSprint(upcomingSprints[0].id)}
                >
                  Start {upcomingSprints[0].name}
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Upcoming Sprints */}
        {upcomingSprints.length > 0 && (
          <div>
            <h2 className="text-xs uppercase font-mono font-bold text-muted tracking-wider mb-3">
              Planned / Upcoming ({upcomingSprints.length})
            </h2>
            <div className="space-y-4">
              {upcomingSprints.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  tasks={tasks}
                  projectId={projectId}
                  onStart={handleStartSprint}
                  onComplete={handleCompleteSprint}
                  onDelete={deleteSprint}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Sprints */}
        {completedSprints.length > 0 && (
          <div>
            <h2 className="text-xs uppercase font-mono font-bold text-muted tracking-wider mb-3">
              Completed Sprints ({completedSprints.length})
            </h2>
            <div className="space-y-4">
              {completedSprints.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  tasks={tasks}
                  projectId={projectId}
                  onStart={handleStartSprint}
                  onComplete={handleCompleteSprint}
                  onDelete={deleteSprint}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SprintCard({
  sprint,
  tasks,
  projectId,
  onStart,
  onComplete,
  onDelete,
}: {
  sprint: Sprint;
  tasks: any[];
  projectId: string;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const doneTasks = sprintTasks.filter((t) => t.status === 'done');
  const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.points || 0), 0);
  const donePoints = doneTasks.reduce((acc, t) => acc + (t.points || 0), 0);
  const progressPct = sprintTasks.length
    ? Math.round((doneTasks.length / sprintTasks.length) * 100)
    : 0;

  return (
    <Card className="p-5 space-y-4 hover:border-flash/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                sprint.status === 'active'
                  ? 'bg-flash/15 text-flash-deep'
                  : sprint.status === 'completed'
                  ? 'bg-ink text-white'
                  : 'bg-mist text-muted'
              }`}
            >
              {sprint.status}
            </span>
            <h3 className="text-base font-bold text-ink">{sprint.name}</h3>
          </div>
          {sprint.goal && (
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-flash-deep shrink-0" /> {sprint.goal}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {sprint.status === 'planning' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => onStart(sprint.id)}
            >
              Start Sprint
            </Button>
          )}

          {sprint.status === 'active' && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => onComplete(sprint.id)}
            >
              Complete Sprint
            </Button>
          )}

          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
            <Button variant="outline" size="sm" icon={ArrowRight}>
              Sprint Planning
            </Button>
          </Link>

          <button
            onClick={() => onDelete(sprint.id)}
            className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors"
            title="Delete Sprint"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-line text-xs">
        <div>
          <span className="text-muted block text-[11px]">Duration</span>
          <span className="font-mono font-medium text-ink">
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Tasks</span>
          <span className="font-mono font-medium text-ink">
            {doneTasks.length} / {sprintTasks.length} completed
          </span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Story Points</span>
          <span className="font-mono font-medium text-ink">
            {donePoints} / {totalPoints} pts
          </span>
        </div>
        <div>
          <span className="text-muted block text-[11px]">Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <ProgressBar value={progressPct} color="var(--flash)" className="h-2 flex-1" />
            <span className="font-mono font-bold text-ink">{progressPct}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
