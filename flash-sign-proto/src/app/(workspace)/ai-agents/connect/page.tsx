'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check, ChevronDown, KeyRound, Terminal, Plug, Activity, Sparkles, MessageSquare, FileText,
  CircleCheck, CircleAlert, Loader2, Info, FlaskConical, Ban, ArrowRight,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { cn, formatRelative } from '@/lib/utils';
import {
  TOKEN_PLACEHOLDER, OS_LABELS, detectOperatingSystem, saveTokenCommand, agentSetup, CHECK_STEPS,
  TROUBLESHOOTING, TRY_PROMPTS, agentsMd, INSTRUCTION_FILES, PERMISSIONS_JSON, HOOKS_JSON,
  SESSION_START_SCRIPT, SESSION_END_SCRIPT, tokenStatus, maskedToken, AGENTS, AGENT_FAMILIES, familyOf, PM_SERVER_URL,
  type OperatingSystem,
} from '@/lib/agent-connection';
import type { AgentClient } from '@/types';
import { CodeBlock } from '@/components/agents/code-block';
import { CreateTokenDialog } from '@/components/agents/create-token-dialog';
import { AgentBadge } from '@/components/agents/agent-badge';
import { SaveButton } from '@/components/settings/settings-layout';

export default function ConnectAgentPage() {
  const { agentTokens, projects, markAgentTokenUsed, agentSettings } = useApp();
  const user = useCurrentUser();

  // The app being set up; the cards group apps by product (Claude Code, Codex, Gemini)
  const [agent, setAgent] = useState<AgentClient>('claude_code');
  const agentInfo = AGENTS[agent];
  const family = familyOf(agent);
  const agentAllowed = agentSettings.enabled && agentSettings.allowedAgents[agent];

  const myActiveTokens = useMemo(
    () => agentTokens.filter(t => t.userId === user?.id && tokenStatus(t) === 'active'),
    [agentTokens, user?.id]
  );
  // One token per computer serves every agent; each agent's use is recorded separately
  const newestToken = myActiveTokens[myActiveTokens.length - 1];
  const usedToken = myActiveTokens.find(t => t.usedBy?.[agent]);
  const lastUsedByAgent = usedToken?.usedBy?.[agent];

  // The full token is only known right after creating it on this page
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const tokenForSnippets = sessionToken ?? TOKEN_PLACEHOLDER;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [os, setOs] = useState<OperatingSystem>(() => detectOperatingSystem());
  const [projectKey, setProjectKey] = useState(projects[0]?.key ?? 'FS');
  const [manualDone, setManualDone] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const connected = !!usedToken;
  const isAppConnected = (client: AgentClient) => myActiveTokens.some(t => t.usedBy?.[client]);
  const isAppAllowed = (client: AgentClient) => agentSettings.enabled && agentSettings.allowedAgents[client];
  // Another app of the same product that isn't connected yet (e.g. Antigravity after Gemini CLI)
  const otherApp = family.apps.find(a => a.client !== agent && !isAppConnected(a.client) && isAppAllowed(a.client));

  // Picking a product card selects its first app that still needs setting up
  const selectFamily = (familyId: string) => {
    const f = AGENT_FAMILIES.find(x => x.id === familyId)!;
    const next = f.apps.find(a => !isAppConnected(a.client)) ?? f.apps[0];
    setAgent(next.client);
    setCheckError(null);
  };
  const done = {
    token: myActiveTokens.length > 0,
    save: manualDone.save || myActiveTokens.some(t => t.lastUsedAt),
    connect: manualDone[`connect-${agent}`] || connected,
    check: connected,
  };
  const completed = Object.values(done).filter(Boolean).length;
  const current = !done.token ? 1 : !done.save ? 2 : !done.connect ? 3 : !done.check ? 4 : 5;
  // Saving the token is once per computer; connecting is once per agent
  const setDone = (key: 'save' | 'connect') => (v: boolean) =>
    setManualDone(m => ({ ...m, [key === 'save' ? 'save' : `connect-${agent}`]: v }));

  // Demo only: there is no MCP server yet, so the check simulates the server seeing the token
  const handleCheck = () => {
    setCheckError(null);
    if (!newestToken) {
      setCheckError('Create a token first (step 1).');
      return;
    }
    setChecking(true);
    setTimeout(() => {
      markAgentTokenUsed(newestToken.id, agent);
      setChecking(false);
    }, 1200);
  };

  const saveCmd = saveTokenCommand(os, tokenForSnippets);
  const setup = agentSetup(agent, tokenForSnippets);
  const instructions = INSTRUCTION_FILES[agent];

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Connect your AI agent</h1>
          <p className="text-sm text-muted">
            Link your coding agent to the PM platform so you can see your tasks, start and finish them, and have your hours
            recorded, without leaving your IDE. About 5 minutes per agent, done once.
          </p>
        </div>

        {/* Agent picker: one card per product */}
        <section className="bg-paper-elevated border border-line rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-ink">Which agent are you connecting?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Agent">
            {AGENT_FAMILIES.map(f => {
              const selected = f.id === family.id;
              const anyAllowed = f.apps.some(a => isAppAllowed(a.client));
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectFamily(f.id)}
                  className={cn(
                    'text-left p-3 rounded-lg border transition-colors',
                    selected ? 'border-flash bg-flash/5 ring-1 ring-flash' : 'border-line hover:border-flash/50'
                  )}
                >
                  <AgentBadge source={f.apps[0].client} label={f.label} />
                  <span className="block text-[11px] text-muted mt-1">{f.vendor}</span>
                  <span className="mt-1.5 flex flex-col gap-0.5">
                    {!anyAllowed ? (
                      <span className="text-[11px] font-semibold text-danger">Turned off by admin</span>
                    ) : (
                      f.apps.map(a => {
                        const on = isAppConnected(a.client);
                        return (
                          <span key={a.client} className={cn('text-[11px] font-semibold', on ? 'text-emerald-700' : 'text-muted')}>
                            {on ? '●' : '○'} {f.apps.length > 1 ? `${a.label} · ` : ''}{on ? 'Connected' : 'Not connected'}
                          </span>
                        );
                      })
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Products with more than one app: choose which one to set up now */}
          {family.apps.length > 1 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-ink">Which {family.label} app are you setting up now?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label={`${family.label} app`}>
                {family.apps.map(a => {
                  const on = isAppConnected(a.client);
                  const selected = a.client === agent;
                  return (
                    <button
                      key={a.client}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => { setAgent(a.client); setCheckError(null); }}
                      className={cn(
                        'flex items-center justify-between gap-3 text-left p-3 rounded-lg border transition-colors',
                        selected ? 'border-flash bg-flash/5 ring-1 ring-flash' : 'border-line hover:border-flash/50'
                      )}
                    >
                      <span>
                        <AgentBadge source={a.client} />
                        <span className="block text-[11px] text-muted mt-0.5">{a.where}</span>
                      </span>
                      <span className={cn('text-[11px] font-semibold shrink-0', on ? 'text-emerald-700' : 'text-muted')}>
                        {on ? '● Connected' : 'Not set up yet'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-muted">
            {family.coverage}{' '}
            You can connect every agent with the same token; they share one timer and one timesheet.
          </p>
          {family.coverageVerify && <VerifyNote text={family.coverageVerify} />}
        </section>

        {!agentAllowed ? (
          <div className="flex items-start gap-3 p-5 rounded-xl border border-danger/30 bg-danger/5 text-sm">
            <Ban className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink">{agentInfo.label} is turned off for your organisation</p>
              <p className="text-muted text-xs mt-1">An Owner or Admin can allow it under AI Agent Hub › Organisation.</p>
            </div>
          </div>
        ) : (
          <>
            {/* What you can do + progress */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
              <div className="bg-paper-elevated border border-line rounded-xl p-5 space-y-3">
                <p className="text-sm font-bold text-ink flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-flash-deep" /> Once connected, ask {agentInfo.label} things like
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRY_PROMPTS.map(p => (
                    <span key={p} className="px-2.5 py-1 rounded-full bg-paper border border-line text-xs text-ink">&ldquo;{p}&rdquo;</span>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Agents can move your cards to <strong className="text-ink">In Progress</strong> and <strong className="text-ink">In Review</strong>.
                  They can&apos;t mark tasks Done or change anyone else&apos;s work.
                </p>
              </div>
              <div className="bg-paper-elevated border border-line rounded-xl p-5 flex flex-col justify-center gap-2">
                <p className="text-xs text-muted">{agentInfo.label} setup</p>
                <p className="text-2xl font-bold text-ink">{completed} of 4</p>
                <div className="h-2 rounded-full bg-mist overflow-hidden">
                  <div className="h-full rounded-full bg-flash transition-all" style={{ width: `${(completed / 4) * 100}%` }} />
                </div>
                <p className="text-xs text-muted">{completed === 4 ? 'All set. You’re connected.' : `Next: step ${current}`}</p>
              </div>
            </div>

            {/* Before you start */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-mist/30 border border-line text-xs text-muted">
              <Info className="w-4 h-4 text-flash-deep shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-ink">Before you start:</span> have <strong className="text-ink">{agentInfo.label}</strong> installed
                and signed in with your own account. Any plan works; the PM platform only checks your PM token.
              </p>
            </div>

            <ol className="space-y-4">
              {/* Step 1 */}
              <Step n={1} title="Create your token (once per computer)" icon={KeyRound} done={done.token} current={current === 1}
                summary={newestToken ? `Using “${newestToken.name}” (${maskedToken(newestToken)})` : undefined}>
                <p>
                  The token tells the PM platform an agent is acting for <strong className="text-ink">you</strong>. One token per computer works for
                  all your agents; each agent identifies itself when it connects. Treat it like a password.
                </p>
                {myActiveTokens.length > 0 && (
                  <p className="flex items-center gap-2 text-ink">
                    <CircleCheck className="w-4 h-4 text-emerald-600" />
                    You already have a token, so you can skip this step for {agentInfo.label}.{' '}
                    <Link href="/ai-agents/tokens" className="font-semibold text-flash-deep hover:underline">Manage tokens</Link>
                  </p>
                )}
                <div>
                  <SaveButton onClick={() => setDialogOpen(true)}>
                    {myActiveTokens.length > 0 ? 'Create a token for another computer' : 'Create token'}
                  </SaveButton>
                </div>
                {sessionToken && (
                  <p className="text-muted">Your new token is filled into the steps below until you leave this page.</p>
                )}
              </Step>

              {/* Step 2 */}
              <Step n={2} title="Save the token on your computer (once)" icon={Terminal} done={done.save} current={current === 2}
                summary="Saved as the PM_TOKEN environment variable">
                <p>
                  Store it as an environment variable called <Code>PM_TOKEN</Code>, so it never ends up in a file that gets committed.
                  All your agents can read the same variable.
                </p>
                <Tabs value={os} onChange={v => setOs(v as OperatingSystem)} options={OS_LABELS} label="Operating system" />
                <SubStep n="a">Open <strong className="text-ink">{saveCmd.shell}</strong> and run:</SubStep>
                <CodeBlock code={saveCmd.command} label={saveCmd.shell} />
                {!sessionToken && <p className="text-muted">Replace <Code>{TOKEN_PLACEHOLDER}</Code> with the token you copied in step 1.</p>}
                <SubStep n="b"><strong className="text-ink">Close and reopen</strong> your terminal and your IDE so they pick up the new variable.</SubStep>
                <SubStep n="c">Check it worked. This should print your token:</SubStep>
                <CodeBlock code={saveCmd.check} label={saveCmd.shell} />
                {agent === 'antigravity' && (
                  <p className="text-muted">Antigravity may need the token pasted into its config in step 3 instead.</p>
                )}
                <DoneToggle checked={done.save} disabled={connected} onChange={setDone('save')} label="I've saved my token" />
              </Step>

              {/* Step 3 */}
              <Step n={3} title={`Connect ${agentInfo.label}`} icon={Plug} done={done.connect} current={current === 3}
                summary={setup.where}>
                <p>Set up in: <strong className="text-ink">{setup.where}</strong></p>
                {setup.steps.map((s, i) => (
                  <React.Fragment key={i}>
                    <SubStep n={String.fromCharCode(97 + i)}>{s.text}</SubStep>
                    {s.code && <CodeBlock code={s.code.content} label={s.code.label} />}
                  </React.Fragment>
                ))}
                {setup.verify && <VerifyNote text={setup.verify} />}
                <DoneToggle checked={done.connect} disabled={connected} onChange={setDone('connect')} label={`I've connected ${agentInfo.label}`} />
              </Step>

              {/* Step 4 */}
              <Step n={4} title="Check the connection" icon={Activity} done={done.check} current={current === 4}
                summary={lastUsedByAgent ? `Connected · last used ${formatRelative(lastUsedByAgent)}` : undefined}>
                {CHECK_STEPS[agent].map((s, i) => (
                  <React.Fragment key={i}>
                    <SubStep n={String.fromCharCode(97 + i)}>{s.text}</SubStep>
                    {s.code && <CodeBlock code={s.code} label="Terminal" />}
                  </React.Fragment>
                ))}
                <SubStep n={String.fromCharCode(97 + CHECK_STEPS[agent].length)}>
                  Ask {agentInfo.label}: <strong className="text-ink">&ldquo;What tasks do I have?&rdquo;</strong> It should list your tasks from{' '}
                  {PM_SERVER_URL.replace('https://', '')}.
                </SubStep>

                <div className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border',
                  connected ? 'bg-emerald-50 border-emerald-200' : 'bg-paper border-line'
                )}>
                  <div className="flex items-center gap-2">
                    {connected ? <CircleCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <CircleAlert className="w-5 h-5 text-muted shrink-0" />}
                    <div>
                      <p className="font-semibold text-ink">{connected ? `${agentInfo.label} is connected` : 'Not connected yet'}</p>
                      <p className="text-muted">
                        {connected && usedToken && lastUsedByAgent
                          ? `The PM platform last heard from ${agentInfo.label} on “${usedToken.name}” ${formatRelative(lastUsedByAgent)}.`
                          : 'This turns green the first time the agent talks to the PM platform.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={checking}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-paper-elevated hover:bg-mist font-semibold text-ink disabled:opacity-60 shrink-0"
                  >
                    {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {checking ? 'Checking…' : 'Check connection'}
                  </button>
                </div>
                {checkError && <p className="text-danger">{checkError}</p>}
                {connected && otherApp && (
                  <button
                    type="button"
                    onClick={() => { setAgent(otherApp.client); setCheckError(null); }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-line hover:border-flash text-left"
                  >
                    <span>
                      <span className="block font-semibold text-ink">Also use {otherApp.label}?</span>
                      <span className="block text-muted">Set it up now or any time later. Your token is already saved, so it&apos;s just steps 3 and 4.</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-flash-deep shrink-0" />
                  </button>
                )}
                <p className="text-[11px] text-muted italic">Prototype: the check is simulated until the PM MCP server is running.</p>

                <details className="group rounded-lg border border-line bg-paper">
                  <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2 font-semibold text-ink">
                    Something not working?
                    <ChevronDown className="w-4 h-4 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="px-3 pb-3 space-y-2">
                    {TROUBLESHOOTING.map(t => (
                      <li key={t.problem}>
                        <p className="font-semibold text-ink">{t.problem}</p>
                        <p className="text-muted">{t.fix}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              </Step>

              {/* Step 5 */}
              <Step n={5} title="Add the shared instructions (once per repository)" icon={FileText} done={false} current={current === 5} optional>
                <p>
                  One file, <Code>AGENTS.md</Code>, tells every agent how to use the task tools and which PM project the repository belongs to.
                  If a teammate already added it, skip this step.
                </p>
                <SubStep n="a">
                  Pick the PM project for this repository:{' '}
                  <select
                    value={projectKey}
                    onChange={e => setProjectKey(e.target.value)}
                    className="ml-1 px-2 py-1 rounded-md bg-paper border border-line text-ink focus:outline-none focus:border-flash"
                    aria-label="Project"
                  >
                    {projects.map(p => <option key={p.id} value={p.key}>{p.key} · {p.name}</option>)}
                  </select>
                </SubStep>
                <SubStep n="b">Create <Code>AGENTS.md</Code> in the repository root and commit it:</SubStep>
                <CodeBlock code={agentsMd(projectKey)} label="AGENTS.md" />
                <SubStep n="c">For {agentInfo.label}: {instructions.text}</SubStep>
                {instructions.code && <CodeBlock code={instructions.code.content} label={instructions.code.label} />}
                {(agent === 'gemini_cli' || agent === 'antigravity') && <VerifyNote text="The exact way this agent picks up AGENTS.md." />}

                {agent === 'claude_code' ? (
                  <>
                    <p className="pt-2 font-semibold text-ink flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-flash-deep" /> Claude Code extras</p>
                    <Extra title="Skip the approval prompt for read-only tools" hint="Add to .claude/settings.json. Starting, pausing and finishing still ask first.">
                      <CodeBlock code={PERMISSIONS_JSON} label=".claude/settings.json" />
                    </Extra>
                    <Extra title="Resume check and auto-pause" hint="On start, Claude tells you if a timer is still running. On exit, the timer pauses.">
                      <CodeBlock code={HOOKS_JSON} label=".claude/settings.json (hooks)" />
                      <CodeBlock code={SESSION_START_SCRIPT} label=".claude/hooks/pm-session-start.mjs" />
                      <CodeBlock code={SESSION_END_SCRIPT} label=".claude/hooks/pm-session-end.mjs" />
                    </Extra>
                  </>
                ) : (
                  <p className="text-muted">
                    Forgot to pause, or closed {agentInfo.label} suddenly? The PM platform stops your timer after{' '}
                    {Math.round(agentSettings.idleTimeoutMinutes / 60)} hours without activity, or at {agentSettings.dayCutoff}, and flags it for you to check.
                  </p>
                )}
              </Step>
            </ol>

            <p className="text-xs text-muted text-center">
              Connecting another agent? Pick it at the top. Steps 1 and 2 are already done; just do steps 3 and 4 for that agent.
            </p>
          </>
        )}
      </div>

      <CreateTokenDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreated={setSessionToken} />
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function Code({ children }: { children: React.ReactNode }) {
  return <code className="px-1 rounded bg-mist text-ink">{children}</code>;
}

function VerifyNote({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900">
      <FlaskConical className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span><strong>To confirm in the pilot:</strong> {text}</span>
    </p>
  );
}

function Tabs<T extends string>({ value, onChange, options, label }: {
  value: T;
  onChange: (v: T) => void;
  options: Record<T, string>;
  label: string;
}) {
  return (
    <div className="flex items-center bg-paper rounded-lg border border-line p-0.5 w-fit" role="tablist" aria-label={label}>
      {(Object.keys(options) as T[]).map(o => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={cn('px-3 py-1 rounded-md font-semibold transition-colors', value === o ? 'bg-paper-elevated text-ink shadow-2xs' : 'text-muted hover:text-ink')}
        >
          {options[o]}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, icon: Icon, done, current, summary, optional, children }: {
  n: number;
  title: string;
  icon: React.ElementType;
  done: boolean;
  current: boolean;
  summary?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  // Finished steps fold away, but can be reopened
  const [open, setOpen] = useState<boolean | null>(null);
  const isOpen = open ?? (!done || current);

  return (
    <li className={cn('bg-paper-elevated border rounded-xl transition-shadow', current ? 'border-flash/60 shadow-md' : 'border-line')}>
      <button type="button" onClick={() => setOpen(!isOpen)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <span className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
          done ? 'bg-emerald-500 text-white' : current ? 'bg-flash text-ink' : 'bg-mist text-muted'
        )}>
          {done ? <Check className="w-4 h-4" /> : n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon className="w-4 h-4 text-flash-deep" /> {title}
            {optional && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-mist text-muted border border-line">Recommended</span>}
          </span>
          {done && summary && !isOpen && <span className="block text-xs text-muted mt-0.5 truncate">{summary}</span>}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-muted transition-transform shrink-0', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="px-5 pb-5 pl-16 space-y-3 text-xs text-ink-soft">{children}</div>}
    </li>
  );
}

function SubStep({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="w-5 h-5 rounded-full bg-mist text-ink text-[10px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <span className="pt-0.5">{children}</span>
    </p>
  );
}

function DoneToggle({ checked, disabled, onChange, label }: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className={cn('flex items-center gap-2 pt-1 font-semibold text-ink', disabled ? 'opacity-70' : 'cursor-pointer')}>
      <input type="checkbox" className="w-4 h-4 accent-flash" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Extra({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-line bg-paper">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-3 py-2">
        <span>
          <span className="block font-semibold text-ink">{title}</span>
          <span className="block text-muted">{hint}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-muted transition-transform group-open:rotate-180 shrink-0" />
      </summary>
      <div className="px-3 pb-3 space-y-2">{children}</div>
    </details>
  );
}
