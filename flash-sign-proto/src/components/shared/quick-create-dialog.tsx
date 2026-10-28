'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, useCurrentUser } from '@/context/app-context';
import type { TaskPriority, TaskType, ProjectStatus, ProjectHealth } from '@/types';
import { X, CheckSquare, FolderKanban, Flag, Zap, Check } from 'lucide-react';
import { ClientPortal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

interface QuickCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function QuickCreateDialog({ isOpen, onClose, defaultProjectId }: QuickCreateDialogProps) {
  const router = useRouter();
  const { projects, users, sprints, addTask, addProject, addMilestone, addSprint } = useApp();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'task' | 'project' | 'milestone' | 'sprint'>('task');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjectId, setTaskProjectId] = useState(defaultProjectId || projects[0]?.id || 'p1');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('task');
  const [taskAssignee, setTaskAssignee] = useState(currentUser?.id || 'u2');
  const [taskSprint, setTaskSprint] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Project form state
  const [projName, setProjName] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projPriority, setProjPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  // Milestone form state
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');

  // Sprint form state
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintCapacity, setSprintCapacity] = useState('30');

  if (!isOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      notify('Add a title for the task first.', 'error');
      return;
    }
    const project = projects.find(p => p.id === taskProjectId);
    const count = Math.floor(Math.random() * 800) + 100;
    const newTask = {
      id: `task-${Date.now()}`,
      key: `${project?.key || 'FS'}-${count}`,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      type: taskType,
      status: 'todo' as const,
      priority: taskPriority,
      projectId: taskProjectId,
      sprintId: taskSprint || undefined,
      assigneeId: taskAssignee || undefined,
      reporterId: currentUser?.id || 'u2',
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      tags: ['quick-create'],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addTask(newTask);
    notify(`Task "${newTask.title}" created`);
    onClose();
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      notify('Add a name for the project first.', 'error');
      return;
    }
    if (!projKey.trim()) {
      notify('Add a project key first, for example MOB.', 'error');
      return;
    }
    const newProj = {
      id: `p-${Date.now()}`,
      name: projName.trim(),
      key: projKey.trim().toUpperCase(),
      description: projDesc.trim(),
      status: 'active' as ProjectStatus,
      health: 'on_track' as ProjectHealth,
      ownerId: currentUser?.id || 'u2',
      teamIds: ['t1'],
      memberIds: [currentUser?.id || 'u2'],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      progress: 0,
      priority: projPriority,
      tags: ['new'],
      accentColor: '#00c2a8',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(newProj);
    notify(`Project "${newProj.name}" created`);
    onClose();
    router.push(`/projects/${newProj.id}`);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneName.trim()) {
      notify('Add a name for the milestone first.', 'error');
      return;
    }
    const newM = {
      id: `m-${Date.now()}`,
      projectId: taskProjectId,
      name: milestoneName.trim(),
      description: milestoneDesc.trim(),
      dueDate: milestoneDate ? new Date(milestoneDate).toISOString() : new Date().toISOString(),
      status: 'upcoming' as const,
      progress: 0,
    };
    addMilestone(newM);
    notify(`Milestone "${newM.name}" created`);
    onClose();
  };

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) {
      notify('Add a name for the sprint first.', 'error');
      return;
    }
    const newS = {
      id: `s-${Date.now()}`,
      name: sprintName.trim(),
      projectId: taskProjectId,
      status: 'planned' as const,
      goal: sprintGoal.trim() || 'Deliver prioritized sprint backlog items',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      capacity: parseInt(sprintCapacity, 10) || 30,
      createdAt: new Date().toISOString(),
    };
    addSprint(newS);
    notify(`Sprint "${newS.name}" created`);
    onClose();
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-paper-elevated border border-line rounded-2xl w-full max-w-lg shadow-2xl p-6 relative max-h-[calc(100dvh-32px)] overflow-y-auto my-auto flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-muted hover:text-ink rounded"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Selector */}
        <div className="flex border-b border-line mb-5 gap-3">
          <button
            onClick={() => setActiveTab('task')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'task' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'project' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Project</span>
          </button>
          <button
            onClick={() => setActiveTab('milestone')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'milestone' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Milestone</span>
          </button>
          <button
            onClick={() => setActiveTab('sprint')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sprint' ? 'border-flash-deep text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sprint</span>
          </button>
        </div>

        {/* Task Form */}
        {activeTab === 'task' && (
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Task Title *</label>
              <input
                autoFocus
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-paper text-ink focus:ring-1 focus:ring-flash"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project</label>
                <select
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Assignee</label>
                <select
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                placeholder="Optional details..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-colors shadow-xs"
              >
                Create Task
              </button>
            </div>
          </form>
        )}

        {/* Project Form */}
        {activeTab === 'project' && (
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Project Name *</label>
              <input
                autoFocus
                type="text"
                value={projName}
                onChange={e => {
                  setProjName(e.target.value);
                  if (!projKey) setProjKey(e.target.value.slice(0, 4).toUpperCase());
                }}
                placeholder="e.g. Mobile iOS Client"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-paper text-ink focus:ring-1 focus:ring-flash"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project Key *</label>
                <input
                  type="text"
                  value={projKey}
                  onChange={e => setProjKey(e.target.value.toUpperCase())}
                  placeholder="e.g. MOB"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded border border-line bg-paper text-ink uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Priority</label>
                <select
                  value={projPriority}
                  onChange={e => setProjPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={2}
                value={projDesc}
                onChange={e => setProjDesc(e.target.value)}
                placeholder="Project overview & objectives..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-colors shadow-xs"
              >
                Create Project
              </button>
            </div>
          </form>
        )}

        {/* Milestone Form */}
        {activeTab === 'milestone' && (
          <form onSubmit={handleCreateMilestone} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Milestone Name *</label>
              <input
                autoFocus
                type="text"
                value={milestoneName}
                onChange={e => setMilestoneName(e.target.value)}
                placeholder="e.g. Beta Sign-off"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-paper text-ink"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Target Date</label>
              <input
                type="date"
                value={milestoneDate}
                onChange={e => setMilestoneDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-line bg-paper text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={2}
                value={milestoneDesc}
                onChange={e => setMilestoneDesc(e.target.value)}
                placeholder="What determines completion?"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-paper text-ink"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-colors shadow-xs"
              >
                Create Milestone
              </button>
            </div>
          </form>
        )}

        {/* Sprint Form */}
        {activeTab === 'sprint' && (
          <form onSubmit={handleCreateSprint} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Sprint Name *</label>
              <input
                autoFocus
                type="text"
                value={sprintName}
                onChange={e => setSprintName(e.target.value)}
                placeholder="e.g. Sprint 14"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-paper text-ink"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Sprint Goal</label>
              <input
                type="text"
                value={sprintGoal}
                onChange={e => setSprintGoal(e.target.value)}
                placeholder="e.g. Deliver mobile signing canvas"
                className="w-full px-3 py-1.5 text-xs rounded border border-line bg-paper text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Capacity (Story Points)</label>
              <input
                type="number"
                value={sprintCapacity}
                onChange={e => setSprintCapacity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded border border-line bg-paper text-ink"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-flash-deep text-white hover:bg-flash hover:text-ink transition-colors shadow-xs"
              >
                Create Sprint
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </ClientPortal>
  );
}
