'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { TaskStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Avatar } from '@/components/shared/avatar';
import { Button, Card } from '@/components/shared/ui';
import { formatDate, formatRelative } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, MessageSquare, Paperclip, Clock, User,
  Tag, Target, CheckSquare, Edit3, Zap,
} from 'lucide-react';
import type { TaskStatus } from '@/types';

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { tasks, users, projects, updateTask, currentUserId } = useApp();
  const [newComment, setNewComment] = useState('');

  const task = tasks.find(t => t.id === taskId);
  if (!task) return notFound();

  const project = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const reporter = users.find(u => u.id === task.reporterId);
  const currentUser = users.find(u => u.id === currentUserId);

  const addComment = () => {
    if (!newComment.trim() || !currentUser) return;
    const comment = {
      id: `c-${Date.now()}`,
      authorId: currentUserId,
      body: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    updateTask(taskId, { comments: [...task.comments, comment] });
    setNewComment('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted mb-4">
        <Link href="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        {project && <Link href={`/projects/${project.id}`} className="hover:text-ink">{project.name}</Link>}
        <span>/</span>
        <Link href={`/projects/${task.projectId}/tasks`} className="hover:text-ink">Tasks</Link>
        <span>/</span>
        <span className="font-mono text-ink">{task.key}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Task Header */}
          <Card className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <h1 className="text-lg font-bold text-ink">{task.title}</h1>
              </div>
              <Button variant="ghost" size="sm" icon={Edit3} />
            </div>

            {/* Status picker */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {TASK_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateTask(taskId, { status: s })}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    task.status === s
                      ? 'border-flash bg-flash/10 text-flash font-medium'
                      : 'border-line text-muted hover:border-ink/20'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-semibold text-muted mb-1">Description</p>
                <p className="text-sm text-ink leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && (
              <div className="mt-4 p-3 bg-flash/5 border border-flash/20 rounded-lg">
                <p className="text-xs font-semibold text-flash mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Acceptance Criteria
                </p>
                <p className="text-xs text-ink leading-relaxed">{task.acceptanceCriteria}</p>
              </div>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Comments ({task.comments.length})
            </h2>

            <div className="space-y-3 mb-4">
              {task.comments.map(comment => {
                const author = users.find(u => u.id === comment.authorId);
                return (
                  <div key={comment.id} className="flex gap-3">
                    {author && <Avatar user={author} size="sm" className="shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-ink">{author?.name}</span>
                        <span className="text-[10px] text-muted">{formatRelative(comment.createdAt)}</span>
                      </div>
                      <div className="bg-mist rounded-lg px-3 py-2 text-xs text-ink">{comment.body}</div>
                    </div>
                  </div>
                );
              })}

              {task.comments.length === 0 && (
                <p className="text-xs text-muted">No comments yet. Be the first to comment.</p>
              )}
            </div>

            {/* Add comment */}
            <div className="flex gap-3">
              {currentUser && <Avatar user={currentUser} size="sm" className="shrink-0 mt-0.5" />}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  className="w-full text-sm bg-mist rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-flash/30 resize-none border border-transparent focus:border-flash/30 transition-all placeholder:text-muted text-ink"
                />
                <div className="flex justify-end mt-1.5">
                  <Button variant="primary" size="sm" onClick={addComment} disabled={!newComment.trim()}>
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Details</h2>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-muted mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Assignee</dt>
                <dd>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar user={assignee} size="xs" />
                      <span className="text-ink">{assignee.name}</span>
                    </div>
                  ) : <span className="text-muted">Unassigned</span>}
                </dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Reporter</dt>
                <dd className="text-ink">{reporter?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Priority</dt>
                <dd><PriorityBadge priority={task.priority} /></dd>
              </div>
              <div>
                <dt className="text-muted mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Due Date</dt>
                <dd className="text-ink">{task.dueDate ? formatDate(task.dueDate) : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Story Points</dt>
                <dd className="text-ink">{task.storyPoints ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {task.tags.length > 0
                    ? task.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full bg-mist text-muted text-[10px]">{tag}</span>
                      ))
                    : <span className="text-muted">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Created</dt>
                <dd className="text-ink">{formatRelative(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Updated</dt>
                <dd className="text-ink">{formatRelative(task.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          {/* AI Agent action */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-flash" />
              <h2 className="text-xs font-semibold text-ink">AI Agent</h2>
            </div>
            <p className="text-xs text-muted mb-3">Run an AI agent on this task to generate code, docs, or tests.</p>
            <Link href="/ai-agents">
              <Button variant="secondary" size="sm" className="w-full">Open AI Hub</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
