'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { PageHeader, Button, Card, EmptyState } from '@/components/shared/ui';
import { AgentRunStatusBadge } from '@/components/shared/badges';
import { formatRelative } from '@/lib/utils';
import {
  Bot, Play, Settings, Zap, CheckCircle2, XCircle, Clock,
  Eye, ChevronRight, Cpu, BarChart3, BookOpen,
} from 'lucide-react';

const AGENT_PROVIDERS = [
  { id: 'ap1', name: 'Claude 3.5 Sonnet', provider: 'claude', color: '#f5a623', isConnected: true, model: 'claude-3-5-sonnet-20241022', scope: ['code', 'review', 'docs'] },
  { id: 'ap2', name: 'Codex (GPT-4o)', provider: 'codex', color: '#74aa9c', isConnected: false, model: 'gpt-4o', scope: ['code'] },
  { id: 'ap3', name: 'Gemini 2.0 Flash', provider: 'gemini', color: '#4285f4', isConnected: true, model: 'gemini-2.0-flash', scope: ['code', 'analysis'] },
];

export default function AIAgentsPage() {
  const { agentRuns, tasks } = useApp();
  const [activeTab, setActiveTab] = useState<'hub' | 'runs' | 'reviews'>('hub');

  const totalRuns = agentRuns.length;
  const completedRuns = agentRuns.filter(r => r.status === 'completed').length;
  const needsReview = agentRuns.filter(r => r.status === 'needs_review').length;
  const running = agentRuns.filter(r => r.status === 'running').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="AI Agent Hub"
        description="Manage AI coding agents and monitor execution runs"
        actions={
          <Link href="/ai-agents/settings">
            <Button variant="secondary" icon={Settings}>Configure</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Runs', value: totalRuns, icon: Cpu, color: '#ab47bc' },
          { label: 'Completed', value: completedRuns, icon: CheckCircle2, color: 'var(--flash)' },
          { label: 'Needs Review', value: needsReview, icon: Eye, color: 'var(--waiting)' },
          { label: 'Running', value: running, icon: Play, color: '#42a5f5' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted">{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-line mb-6">
        {[
          { key: 'hub',     label: 'Provider Hub' },
          { key: 'runs',    label: 'Run History' },
          { key: 'reviews', label: 'Needs Review' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-flash text-flash'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.key === 'reviews' && needsReview > 0 && (
              <span className="ml-2 text-[10px] bg-waiting/20 text-waiting px-1.5 py-0.5 rounded-full">{needsReview}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENT_PROVIDERS.map(agent => (
            <Card key={agent.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${agent.color}20` }}>
                  <Bot className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  agent.isConnected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">{agent.name}</h3>
              <p className="text-xs text-muted font-mono mb-3">{agent.model}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {agent.scope.map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-mist text-muted">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                {agent.isConnected ? (
                  <>
                    <Link href="/ai-agents/story-generator" className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        <Zap className="w-3 h-3" /> Run
                      </Button>
                    </Link>
                    <Link href="/ai-agents/settings">
                      <Button variant="secondary" size="sm" icon={Settings} />
                    </Link>
                  </>
                ) : (
                  <Link href="/ai-agents/settings" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Connect</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-3">
          {agentRuns.map(run => {
            const task = tasks.find(t => t.id === run.taskId);
            return (
              <Link key={run.id} href={`/ai-agents/runs/${run.id}`}>
                <Card className="p-4 hover:border-flash/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-ink truncate">{task?.title ?? 'Unknown Task'}</p>
                        <AgentRunStatusBadge status={run.status} />
                      </div>
                      <p className="text-xs text-muted">{task?.key} • Started {formatRelative(run.startedAt)}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {run.tokensUsed && (
                        <span className="text-[10px] text-muted">{run.tokensUsed.toLocaleString()} tokens</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {agentRuns.filter(r => r.status === 'needs_review' || r.status === 'completed').map(run => {
            const task = tasks.find(t => t.id === run.taskId);
            const failedChecks = run.verificationChecks.filter(v => v.status === 'failed');
            const pendingChecks = run.verificationChecks.filter(v => v.status === 'pending');
            return (
              <Link key={run.id} href={`/ai-agents/runs/${run.id}`}>
                <Card className="p-4 hover:border-flash/30 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{task?.title}</p>
                      <p className="text-xs text-muted">{task?.key}</p>
                    </div>
                    <AgentRunStatusBadge status={run.status} />
                  </div>
                  <div className="space-y-1.5">
                    {run.verificationChecks.map(check => (
                      <div key={check.id} className="flex items-center gap-2 text-xs">
                        {check.status === 'passed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : check.status === 'failed' ? (
                          <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                        )}
                        <span className={check.status === 'failed' ? 'text-danger' : check.status === 'passed' ? 'text-emerald-700' : 'text-muted'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
          {agentRuns.filter(r => r.status === 'needs_review' || r.status === 'completed').length === 0 && (
            <EmptyState icon={CheckCircle2} title="All clear!" description="No agent runs need review right now." />
          )}
        </div>
      )}
    </div>
  );
}
