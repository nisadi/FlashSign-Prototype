'use client';

import React from 'react';
import { Power, Bot, Timer, Database, Users, Lock } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { canManageAgents } from '@/lib/permissions';
import { AGENT_LIST, maskedToken, tokenStatus } from '@/lib/agent-connection';
import { cn, formatRelative } from '@/lib/utils';
import type { AgentClient } from '@/types';
import { AgentBadge } from '@/components/agents/agent-badge';
import { SettingsPage, SettingsCard, SettingsToggle, inputClass } from '@/components/settings/settings-layout';

const IDLE_OPTIONS = [30, 60, 120, 240];

export default function AgentOrganisationPage() {
  const { agentSettings, updateAgentSettings, agentTokens, revokeAgentToken, users, projects, demoRole } = useApp();

  if (!canManageAgents(demoRole)) {
    return (
      <SettingsPage title="Organisation" description="AI agent rules for the whole organisation.">
        <p className="flex items-center gap-2 p-4 rounded-xl border border-line bg-paper-elevated text-sm text-muted">
          <Lock className="w-4 h-4" /> Only Owners and Admins can change these settings.
        </p>
      </SettingsPage>
    );
  }

  const setAllowed = (agent: AgentClient, on: boolean) =>
    updateAgentSettings({ allowedAgents: { ...agentSettings.allowedAgents, [agent]: on } });

  const setProjectShared = (projectId: string, shared: boolean) =>
    updateAgentSettings({
      blockedProjectIds: shared
        ? agentSettings.blockedProjectIds.filter(id => id !== projectId)
        : [...agentSettings.blockedProjectIds, projectId],
    });

  const tokens = [...agentTokens].sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
  const disabled = !agentSettings.enabled;

  return (
    <SettingsPage title="Organisation" description="Rules for AI agent connections across the whole organisation. Changes apply immediately.">
      <SettingsCard title="AI agent connections" icon={Power}>
        <SettingsToggle
          label="Allow people to connect AI agents"
          description="Turning this off stops every agent connection at once. Tokens stay, but stop working until it's turned back on."
          checked={agentSettings.enabled}
          onChange={v => updateAgentSettings({ enabled: v })}
        />
      </SettingsCard>

      <SettingsCard
        title="Allowed agents"
        icon={Bot}
        description="Each agent belongs to a different AI company, which receives task titles and descriptions when the agent reads them. Allow only the ones your company has approved."
        className={cn(disabled && 'opacity-60')}
      >
        {AGENT_LIST.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <AgentBadge source={a.id} />
              <span className="text-muted">{a.vendor}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label={`Allow ${a.label}`}
              checked={agentSettings.allowedAgents[a.id]}
              disabled={disabled}
              onChange={e => setAllowed(a.id, e.target.checked)}
              className="w-9 h-5 shrink-0 appearance-none rounded-full bg-line relative transition-colors checked:bg-flash cursor-pointer disabled:cursor-not-allowed
                after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform checked:after:translate-x-4"
            />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title="Time tracking rules" icon={Timer} className={cn(disabled && 'opacity-60')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block font-semibold text-ink mb-1">Stop a timer after no activity for</span>
            <select
              className={inputClass}
              disabled={disabled}
              value={agentSettings.idleTimeoutMinutes}
              onChange={e => updateAgentSettings({ idleTimeoutMinutes: Number(e.target.value) })}
            >
              {IDLE_OPTIONS.map(m => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>)}
            </select>
            <span className="block mt-1 text-muted">The timer stops at the last activity time and is flagged for the person to check.</span>
          </label>
          <label className="block">
            <span className="block font-semibold text-ink mb-1">Stop all timers at the end of the day at</span>
            <input
              type="time"
              className={inputClass}
              disabled={disabled}
              value={agentSettings.dayCutoff}
              onChange={e => updateAgentSettings({ dayCutoff: e.target.value })}
            />
            <span className="block mt-1 text-muted">In each person&apos;s own time zone.</span>
          </label>
        </div>
        <SettingsToggle
          label="Let people claim unassigned tasks through their agent"
          description="Only within projects they're a member of. Assigning tasks to others always stays in the web app."
          checked={agentSettings.allowClaimUnassigned}
          disabled={disabled}
          onChange={v => updateAgentSettings({ allowClaimUnassigned: v })}
        />
      </SettingsCard>

      <SettingsCard
        title="Projects AI agents may access"
        icon={Database}
        description="Turn off confidential projects. Agents then can't read or change their tasks, and their content is never sent to an AI company."
        className={cn(disabled && 'opacity-60')}
      >
        {projects.map(p => (
          <SettingsToggle
            key={p.id}
            label={`${p.key} · ${p.name}`}
            checked={!agentSettings.blockedProjectIds.includes(p.id)}
            disabled={disabled}
            onChange={v => setProjectShared(p.id, v)}
          />
        ))}
      </SettingsCard>

      <SettingsCard title="Everyone's connections" icon={Users} description="Personal tokens across the organisation. Revoke one if a computer is lost or someone leaves.">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-5 py-2 font-semibold">Person</th>
                <th className="px-3 py-2 font-semibold">Token</th>
                <th className="px-3 py-2 font-semibold">Agents used</th>
                <th className="px-3 py-2 font-semibold">Last used</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tokens.map(t => {
                const status = tokenStatus(t);
                const person = users.find(u => u.id === t.userId);
                return (
                  <tr key={t.id} className={cn(status !== 'active' && 'opacity-60')}>
                    <td className="px-5 py-2.5 font-semibold text-ink">{person?.name ?? t.userId}</td>
                    <td className="px-3 py-2.5">
                      <span className="block text-ink">{t.name}</span>
                      <span className="font-mono text-muted">{maskedToken(t)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1">
                        {t.usedBy && Object.keys(t.usedBy).length > 0
                          ? (Object.keys(t.usedBy) as AgentClient[]).map(a => <AgentBadge key={a} source={a} showLabel={false} />)
                          : <span className="text-muted">—</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted whitespace-nowrap">{t.lastUsedAt ? formatRelative(t.lastUsedAt) : 'Never'}</td>
                    <td className="px-3 py-2.5 capitalize text-ink">{status}</td>
                    <td className="px-5 py-2.5 text-right">
                      {status === 'active' && (
                        <button
                          type="button"
                          onClick={() => confirm(`Revoke ${person?.name ?? 'this person'}'s token "${t.name}"? Their agents stop working on that computer immediately.`) && revokeAgentToken(t.id)}
                          className="px-2 py-1 rounded font-semibold text-muted hover:text-danger hover:bg-danger/10"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
