'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Button, Card } from '@/components/shared/ui';
import { AgentRunStatusBadge } from '@/components/shared/badges';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Terminal,
  ThumbsUp, AlertTriangle, Zap,
} from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import type { AgentRunEvent } from '@/types';

export default function AgentRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const { agentRuns, tasks, users, updateAgentRun, currentUserId } = useApp();
  const [approving, setApproving] = useState(false);

  const run = agentRuns.find(r => r.id === runId);
  if (!run) return notFound();

  const task = tasks.find(t => t.id === run.taskId);
  const triggeredBy = users.find(u => u.id === run.triggeredBy);
  const approvedBy = users.find(u => u.id === run.approvedBy);

  const allChecksPassed = run.verificationChecks.every(v => v.status === 'passed');
  const canApprove = (run.status === 'completed' || run.status === 'needs_review') && !run.approvedBy && allChecksPassed;

  const handleApprove = () => {
    setApproving(true);
    setTimeout(() => {
      updateAgentRun(runId, { approvedBy: currentUserId, approvedAt: new Date().toISOString() });
      setApproving(false);
    }, 1200);
  };

  const eventIcons: Record<AgentRunEvent['type'], React.ElementType> = {
    info:    Clock,
    success: CheckCircle2,
    warning: AlertTriangle,
    error:   XCircle,
    code:    Terminal,
  };

  const eventColors: Record<AgentRunEvent['type'], string> = {
    info:    'text-muted',
    success: 'text-emerald-600',
    warning: 'text-waiting',
    error:   'text-danger',
    code:    'text-purple-600',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-up">
      <Link href="/ai-agents" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> AI Agents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-flash" />
            <h1 className="text-lg font-bold text-ink">{task?.title ?? 'Agent Run'}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{task?.key}</span>
            <span>•</span>
            <span>Triggered by {triggeredBy?.name}</span>
            <span>•</span>
            <span>{formatRelative(run.startedAt)}</span>
          </div>
        </div>
        <AgentRunStatusBadge status={run.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-ink/95">
              <Terminal className="w-4 h-4 text-flash" />
              <span className="text-xs font-mono text-white/80">Agent Execution Log</span>
              <div className="ml-auto flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
            </div>
            <div className="bg-ink p-4 font-mono text-xs space-y-2 min-h-48">
              {run.events.map((event, i) => {
                const Icon = eventIcons[event.type];
                return (
                  <div key={i} className={cn('flex items-start gap-2', eventColors[event.type])}>
                    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white/30 mr-2">{formatRelative(event.timestamp)}</span>
                      <span className="text-white/80">{event.message}</span>
                      {event.detail && (
                        <div className="ml-0 mt-1 text-white/40">{event.detail}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {run.status === 'running' && (
                <div className="flex items-center gap-2 text-flash animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-flash" />
                  <span>Running…</span>
                </div>
              )}
            </div>
          </Card>

          {/* Output */}
          {run.output && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-ink mb-3">Agent Output</h2>
              <div className="bg-mist rounded-lg px-4 py-3 text-sm text-ink leading-relaxed">
                {run.output}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Verification Checks */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink mb-3">Verification Checks</h2>
            <div className="space-y-2">
              {run.verificationChecks.map(check => (
                <div key={check.id} className="flex items-start gap-2">
                  {check.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : check.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-xs font-medium ${
                      check.status === 'passed' ? 'text-emerald-700' :
                      check.status === 'failed' ? 'text-danger' : 'text-muted'
                    }`}>{check.label}</p>
                    {check.detail && <p className="text-[10px] text-muted mt-0.5">{check.detail}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Approval */}
            <div className="mt-4 pt-4 border-t border-line">
              {run.approvedBy ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approved by {approvedBy?.name}</span>
                </div>
              ) : canApprove ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={ThumbsUp}
                  onClick={handleApprove}
                  loading={approving}
                >
                  Approve & Close
                </Button>
              ) : (
                <p className="text-xs text-muted">
                  {run.verificationChecks.some(v => v.status === 'failed')
                    ? 'Some checks failed — approval blocked'
                    : run.verificationChecks.some(v => v.status === 'pending')
                    ? 'Waiting for checks to complete'
                    : 'Run in progress'}
                </p>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink mb-3">Run Stats</h2>
            <dl className="space-y-2 text-xs">
              {[
                { label: 'Status', value: run.status.replace('_', ' ') },
                { label: 'Tokens Used', value: run.tokensUsed?.toLocaleString() ?? '—' },
                { label: 'Cost Estimate', value: run.costEstimate ? `$${run.costEstimate.toFixed(2)}` : '—' },
                { label: 'Started', value: formatRelative(run.startedAt) },
                { label: 'Completed', value: run.completedAt ? formatRelative(run.completedAt) : 'In progress' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="font-medium text-ink capitalize">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
