'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, ProgressBar, EmptyState } from '@/components/shared/ui';
import { formatDate } from '@/lib/utils';
import {
  Flag,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckSquare,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import type { Milestone } from '@/types';

export default function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, milestones, tasks, users, addMilestone, updateMilestone, deleteMilestone, openTaskDrawer } =
    useApp();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectMilestones = milestones.filter((m) => m.projectId === projectId);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const filteredMilestones = projectMilestones.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addMilestone({
      name: name.trim(),
      description: description.trim(),
      projectId,
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      taskIds: [],
    });

    setName('');
    setDescription('');
    setDueDate('');
    setShowModal(false);
  };

  const handleToggleComplete = (m: Milestone) => {
    const newStatus = m.status === 'achieved' ? 'pending' : 'achieved';
    updateMilestone(m.id, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="milestones" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <Flag className="w-5 h-5 text-flash-deep" /> Key Milestones & Releases
            </h1>
            <p className="text-xs text-muted">
              Strategic checkpoints and deliverables for {project.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Milestones ({projectMilestones.length})</option>
              <option value="pending">Pending</option>
              <option value="achieved">Achieved</option>
              <option value="missed">Missed</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowModal(true)}
            >
              New Milestone
            </Button>
          </div>
        </div>

        {/* Create Milestone Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-paper-elevated border border-line rounded-2xl p-6 max-w-md w-full shadow-xl animate-fade-in space-y-4">
              <h2 className="text-base font-bold text-ink">Add New Milestone</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Milestone Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Beta Client Testing Release"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Outline key deliverables and requirements…"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Create Milestone
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Cards Grid */}
        {filteredMilestones.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No milestones found"
            description="Create milestone markers to track project deliverables and targets."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowModal(true)}
              >
                Create Milestone
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredMilestones.map((m) => {
              const linked = projectTasks.filter((t) => m.taskIds?.includes(t.id));
              const doneLinked = linked.filter((t) => t.status === 'done');
              const pct = linked.length
                ? Math.round((doneLinked.length / linked.length) * 100)
                : m.status === 'achieved'
                ? 100
                : 0;

              const isOverdue =
                m.status !== 'achieved' && new Date(m.dueDate) < new Date();

              return (
                <Card key={m.id} className="p-5 space-y-4 hover:border-flash/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                            m.status === 'achieved'
                              ? 'bg-flash/15 text-flash-deep'
                              : m.status === 'missed'
                              ? 'bg-danger/15 text-danger'
                              : 'bg-mist text-muted'
                          }`}
                        >
                          {m.status}
                        </span>
                        <h3 className="text-base font-bold text-ink">{m.name}</h3>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{m.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={m.status === 'achieved' ? 'secondary' : 'primary'}
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleToggleComplete(m)}
                      >
                        {m.status === 'achieved' ? 'Mark Pending' : 'Mark Achieved'}
                      </Button>
                      <button
                        onClick={() => deleteMilestone(m.id)}
                        className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & date info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-line text-xs">
                    <div>
                      <span className="text-muted block text-[11px]">Target Date</span>
                      <span
                        className={`font-mono font-medium flex items-center gap-1 ${
                          isOverdue ? 'text-danger font-semibold' : 'text-ink'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                        {formatDate(m.dueDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px]">Linked Deliverables</span>
                      <span className="font-mono font-medium text-ink">
                        {doneLinked.length} of {linked.length} Tasks Complete
                      </span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px]">Completion</span>
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={pct} color="var(--flash)" className="h-2 flex-1" />
                        <span className="font-mono font-bold text-ink">{pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Linked Tasks List */}
                  {linked.length > 0 && (
                    <div className="pt-2 border-t border-line/60">
                      <span className="text-[11px] font-semibold text-muted block mb-2">
                        Linked Project Tasks:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {linked.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => openTaskDrawer(task.id)}
                            className="p-2 bg-paper rounded-lg border border-line text-xs flex items-center justify-between cursor-pointer hover:border-flash/40 transition-colors"
                          >
                            <span className="truncate pr-2 font-medium text-ink">
                              <span className="text-muted font-mono text-[10px] mr-1.5">
                                {task.key}
                              </span>
                              {task.title}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                task.status === 'done'
                                  ? 'bg-flash/10 text-flash-deep font-bold'
                                  : 'bg-mist text-muted'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
