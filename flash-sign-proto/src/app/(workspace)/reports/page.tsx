'use client';

import { useApp } from '@/context/app-context';
import { PageHeader, StatCard } from '@/components/shared/ui';
import { BarChart3, FolderKanban, CheckSquare, FileText, Bot } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';

const PROJECT_HEALTH_DATA = [
  { name: 'On Track', value: 3, color: '#00c2a8' },
  { name: 'At Risk', value: 1, color: '#c47a12' },
  { name: 'Off Track', value: 1, color: '#c23b3b' },
];

const TASK_COMPLETION_DATA = [
  { week: 'W39', completed: 14, created: 18 },
  { week: 'W40', completed: 22, created: 20 },
  { week: 'W41', completed: 19, created: 24 },
  { week: 'W42', completed: 28, created: 22 },
];

const DOC_STATUS_DATA = [
  { name: 'Signed', value: 2, color: '#00c2a8' },
  { name: 'Pending', value: 1, color: '#c47a12' },
  { name: 'In Review', value: 1, color: '#42a5f5' },
  { name: 'Draft', value: 1, color: '#c5d4d0' },
];

const AI_USAGE_DATA = [
  { date: 'Oct 15', runs: 1, tokens: 9840 },
  { date: 'Oct 16', runs: 0, tokens: 0 },
  { date: 'Oct 17', runs: 1, tokens: 18420 },
  { date: 'Oct 18', runs: 0, tokens: 0 },
  { date: 'Oct 19', runs: 1, tokens: 5210 },
  { date: 'Oct 20', runs: 0, tokens: 0 },
];

export default function ReportsPage() {
  const { projects, tasks, documents, agentRuns } = useApp();
  const activeProjects = projects.filter(p => p.status === 'active');
  const avgProgress = Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / Math.max(activeProjects.length, 1));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Reports & Analytics</h1>
          <p className="text-sm text-muted">Organization-wide performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Task time', href: '/reports/task-time' },
            { label: 'Projects', href: '/reports/projects' },
            { label: 'AI Agents', href: '/reports/ai-agents' },
            { label: 'Documents', href: '/reports/documents' },
          ].map(tab => (
            <Link key={tab.href} href={tab.href}>
              <span className="text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg hover:bg-mist">
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects" value={activeProjects.length} icon={FolderKanban} iconColor="var(--flash)" delta="Portfolio health" />
        <StatCard label="Avg Completion" value={`${avgProgress}%`} icon={BarChart3} iconColor="#42a5f5" delta="Across active projects" deltaPositive />
        <StatCard label="Documents Signed" value={documents.filter(d => d.status === 'signed').length} icon={FileText} iconColor="#00c2a8" delta="This month" deltaPositive />
        <StatCard label="AI Runs Total" value={agentRuns.length} icon={Bot} iconColor="#ab47bc" delta={`${agentRuns.filter(r => r.status === 'completed').length} completed`} deltaPositive />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task completion trend */}
        <div className="bg-paper-elevated rounded-xl border border-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Task Completion Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TASK_COMPLETION_DATA}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c2a8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00c2a8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="completed" stroke="#00c2a8" strokeWidth={2} fill="url(#completedGrad)" name="Completed" />
              <Area type="monotone" dataKey="created" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 2" fill="transparent" name="Created" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Health */}
        <div className="bg-paper-elevated rounded-xl border border-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Project Health</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={PROJECT_HEALTH_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {PROJECT_HEALTH_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {PROJECT_HEALTH_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-muted">{d.name}</span>
                  <span className="font-semibold text-ink ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-paper-elevated rounded-xl border border-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">Document Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DOC_STATUS_DATA} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Documents">
                {DOC_STATUS_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Usage */}
        <div className="bg-paper-elevated rounded-xl border border-line p-5">
          <h2 className="text-sm font-semibold text-ink mb-4">AI Agent Usage (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={AI_USAGE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--paper-elevated)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="runs" fill="#ab47bc" radius={[3, 3, 0, 0]} name="Runs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
