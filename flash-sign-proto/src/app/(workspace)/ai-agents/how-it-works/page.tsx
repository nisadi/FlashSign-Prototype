'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowDown, ShieldCheck, Server, LayoutGrid, Timer, BarChart3, KeyRound, Play,
  RotateCcw, UserRound, Ban, ListChecks, History, Hourglass, Info, CircleCheck,
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { AGENT_LIST, AGENTS, formatMinutes, sessionMinutes } from '@/lib/agent-connection';
import { useNow } from '@/lib/use-now';
import { cn } from '@/lib/utils';
import type { AgentClient, Task } from '@/types';
import { AgentBadge } from '@/components/agents/agent-badge';

const STATUS_LABEL: Record<Task['status'], string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done', blocked: 'Blocked',
};

const ACTION_TEXT: Record<string, string> = {
  listed_tasks: 'listed your tasks',
  started: 'started the task',
  continued: 'continued the task',
  paused: 'paused the timer',
  note: 'added a progress note',
  finished: 'moved it to In Review',
  time_logged: 'logged time',
  auto_stopped: 'stopped the timer automatically',
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

interface Message {
  kind: 'user' | 'agent' | 'system';
  agent?: AgentClient;
  text: string;
  tool?: string;
}

export default function HowItWorksPage() {
  const { tasks, workSessions, agentEvents, agentListTasks, agentStartTask, agentContinueTask, agentAddNote, agentFinishTask, projects } = useApp();
  const user = useCurrentUser();
  const now = useNow();

  // Tasks the demo can run on: the current person's open work
  const myTasks = useMemo(
    () => tasks
      .filter(t => t.assigneeId === user?.id && (t.status === 'todo' || t.status === 'in_progress'))
      .sort((a, b) => Number(b.status === 'todo') - Number(a.status === 'todo')), // To Do first, so "start" visibly moves the card
    [tasks, user?.id]
  );
  const [taskId, setTaskId] = useState<string>('');
  const task = tasks.find(t => t.id === taskId) ?? myTasks[0];
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const openSession = workSessions.find(w => w.userId === user?.id && !w.endedAt && w.taskId === task?.id);
  const taskEvents = agentEvents.filter(e => e.userId === user?.id && e.taskId === task?.id).slice(-6).reverse();
  const lastNote = [...agentEvents].reverse().find(e => e.userId === user?.id && e.taskId === task?.id && e.action === 'note');
  const project = projects.find(p => p.id === task?.projectId);

  if (!user) return null;

  const key = task?.key ?? '';
  const steps: { label: string; run: () => Message[] }[] = task
    ? [
        {
          label: 'Ask Claude Code for your tasks',
          run: () => {
            agentListTasks('claude_code');
            const list = tasks
              .filter(t => t.assigneeId === user.id && t.status !== 'done')
              .slice(0, 5)
              .map(t => `• ${t.key}  ${t.title} (${STATUS_LABEL[t.status]})`)
              .join('\n');
            return [
              { kind: 'user', agent: 'claude_code', text: 'What tasks do I have?' },
              { kind: 'agent', agent: 'claude_code', tool: 'list_my_tasks', text: `You have these open tasks:\n${list}` },
            ];
          },
        },
        {
          label: `Start ${key} with Claude Code`,
          run: () => {
            agentStartTask(task.id, 'claude_code');
            return [
              { kind: 'user', agent: 'claude_code', text: `Let's start ${key}` },
              { kind: 'agent', agent: 'claude_code', tool: 'start_task', text: `Started ${key}. The card is now In Progress and your timer is running. Any other running timer was paused first, since you can only have one.` },
            ];
          },
        },
        {
          label: 'Claude saves a progress note',
          run: () => {
            agentAddNote(task.id, 'claude_code', 'Form layout built; validation is next.');
            return [
              { kind: 'agent', agent: 'claude_code', tool: 'add_progress_note', text: 'Progress saved on the task: "Form layout built; validation is next."' },
            ];
          },
        },
        {
          label: 'Claude runs out of usage',
          run: () => [
            { kind: 'system', text: 'Claude Code reached its usage limit. You switch to Gemini in Antigravity. Nothing is lost: the timer and the notes are on the PM platform.' },
          ],
        },
        {
          label: `Continue ${key} in Antigravity`,
          run: () => {
            agentContinueTask(task.id, 'antigravity');
            const started = openSession ? time(openSession.startedAt) : 'earlier';
            return [
              { kind: 'user', agent: 'antigravity', text: `Continue ${key}` },
              {
                kind: 'agent', agent: 'antigravity', tool: 'get_active_work + get_task',
                text: `${key} has been running since ${started} (started via Claude Code). Last note: "${lastNote?.detail ?? 'Form layout built; validation is next.'}" I'll pick up with the validation. Same timer, nothing counted twice.`,
              },
            ];
          },
        },
        {
          label: 'Gemini saves a progress note',
          run: () => {
            agentAddNote(task.id, 'antigravity', 'Validation added; unit tests are next.');
            return [
              { kind: 'agent', agent: 'antigravity', tool: 'add_progress_note', text: 'Progress saved: "Validation added; unit tests are next."' },
            ];
          },
        },
        {
          label: `Finish ${key} with Codex`,
          run: () => {
            agentFinishTask(task.id, 'codex', 'Form with validation and unit tests. PR #142.');
            return [
              { kind: 'user', agent: 'codex', text: "Tests pass. Done, here's the PR: #142" },
              { kind: 'agent', agent: 'codex', tool: 'finish_task', text: `${key} is now In Review with a summary and the PR link. Your timer stopped and the time is on your timesheet. A reviewer will move it to Done.` },
            ];
          },
        },
      ]
    : [];

  const finished = step >= steps.length && steps.length > 0;

  const handleNext = () => {
    if (!task || finished) return;
    if (!taskId) setTaskId(task.id); // lock the task for this run
    setMessages(m => [...m, ...steps[step].run()]);
    setStep(s => s + 1);
  };

  const handleRestart = () => {
    setStep(0);
    setMessages([]);
    setTaskId('');
  };

  const elapsed = openSession && now ? formatMinutes(sessionMinutes(openSession.startedAt, undefined, now)) : null;

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">How AI agents work with the PM platform</h1>
          <p className="text-sm text-muted max-w-3xl">
            Developers manage their tasks by talking to their coding agent, whether that&apos;s Claude Code, Codex or Gemini, without leaving the IDE.
            The PM platform keeps the board, the timer and the hours. It never holds an AI key and never calls an AI itself.
          </p>
        </div>

        {/* Diagram */}
        <section className="bg-paper-elevated border border-line rounded-xl p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] gap-4 items-stretch">
            <DiagramBox title="The developer's agent" subtitle="In the IDE, on their own AI account">
              <div className="space-y-2">
                {AGENT_LIST.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-paper border border-line">
                    <AgentBadge source={a.id} />
                    <span className="text-[10px] text-muted">{a.vendor}</span>
                  </div>
                ))}
              </div>
            </DiagramBox>
            <Arrow label="tool calls + PM token" />
            <DiagramBox title="PM MCP server" subtitle="The only way in" icon={Server} highlight>
              <ul className="space-y-1.5 text-xs text-ink-soft">
                <li className="flex gap-2"><KeyRound className="w-3.5 h-3.5 text-flash-deep shrink-0 mt-0.5" /> Checks the token: who is this?</li>
                <li className="flex gap-2"><ShieldCheck className="w-3.5 h-3.5 text-flash-deep shrink-0 mt-0.5" /> Applies the rules (own tasks only, never Done)</li>
                <li className="flex gap-2"><Timer className="w-3.5 h-3.5 text-flash-deep shrink-0 mt-0.5" /> Runs the timer: one per person</li>
                <li className="flex gap-2"><History className="w-3.5 h-3.5 text-flash-deep shrink-0 mt-0.5" /> Records which agent did what</li>
              </ul>
              <p className="mt-3 text-[11px] text-muted">
                Tools: list_my_tasks · get_task · start_task · add_progress_note · pause_task · finish_task · log_time
              </p>
            </DiagramBox>
            <Arrow label="same data" />
            <DiagramBox title="What people see" subtitle="In the PM web app">
              <div className="space-y-2">
                <DiagramItem icon={LayoutGrid} label="Kanban board" text="Cards move by themselves" />
                <DiagramItem icon={Timer} label="Timesheet" text="Hours per task, per day" />
                <DiagramItem icon={BarChart3} label="Team Analytics" text="Workload and delivery" />
              </div>
            </DiagramBox>
          </div>
        </section>

        {/* Live demo */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2"><Play className="w-4 h-4 text-flash-deep" /> Try it: one task, three agents</h2>
              <p className="text-sm text-muted">
                Click through a real flow. It changes the demo data, so the board, timer, activity and timesheet update as you go.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted"><UserRound className="w-3.5 h-3.5" /> You are <strong className="text-ink">{user.name}</strong></span>
            </div>
          </div>

          {!task ? (
            <div className="flex items-start gap-3 p-5 rounded-xl border border-line bg-paper-elevated text-sm">
              <Info className="w-5 h-5 text-flash-deep shrink-0" />
              <p className="text-muted">
                {user.name} has no open tasks to work on. Switch the demo role to <strong className="text-ink">Developer</strong> (top of the sidebar) to try it.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              {/* Conversation */}
              <div className="bg-paper-elevated border border-line rounded-xl flex flex-col min-h-[460px]">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-line">
                  <label className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-ink">Task</span>
                    <select
                      value={task.id}
                      disabled={step > 0}
                      onChange={e => setTaskId(e.target.value)}
                      className="px-2 py-1 rounded-md bg-paper border border-line text-ink disabled:opacity-70"
                    >
                      {[task, ...myTasks.filter(t => t.id !== task.id)].map(t => <option key={t.id} value={t.id}>{t.key} · {t.title}</option>)}
                    </select>
                  </label>
                  <span className="text-xs text-muted">Step {Math.min(step, steps.length)} of {steps.length}</span>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[520px]" aria-live="polite">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted text-center py-10">
                      Press <strong className="text-ink">{steps[0].label}</strong> to begin.
                    </p>
                  )}
                  {messages.map((m, i) => <Bubble key={i} message={m} />)}
                  {finished && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <CircleCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Done. Three agents worked on {key}, but it&apos;s <strong>one task, one continuous timer, one person&apos;s hours</strong>.{' '}
                        {project && <Link href={`/projects/${project.id}/board`} className="font-semibold underline">Open the board</Link>}{' · '}
                        <Link href="/teams/timesheet" className="font-semibold underline">See the timesheet</Link>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-line">
                  <button type="button" onClick={handleRestart} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                    <RotateCcw className="w-3.5 h-3.5" /> Start over
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={finished}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-flash hover:bg-flash-deep hover:text-white text-ink text-xs font-bold disabled:opacity-40"
                  >
                    {finished ? 'Finished' : steps[step].label} {!finished && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* What the PM platform shows */}
              <div className="space-y-4">
                <div className="bg-paper-elevated border border-line rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">On the Kanban board</p>
                  <div className="p-3 rounded-lg border border-line bg-paper space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-semibold text-muted">{task.key}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        task.status === 'in_progress' ? 'bg-sky-100 text-sky-800' : task.status === 'review' ? 'bg-amber-100 text-amber-900' : 'bg-mist text-muted'
                      )}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink">{task.title}</p>
                    {openSession && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-flash/10 text-flash-deep text-[10px] font-semibold">
                        <Timer className="w-3 h-3" /> In progress via {AGENTS[openSession.source as AgentClient]?.label ?? 'web'}{elapsed && ` · ${elapsed}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-paper-elevated border border-line rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Timer</p>
                  {openSession ? (
                    <p className="text-sm text-ink">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                      Running since <strong>{time(openSession.startedAt)}</strong>{elapsed && ` (${elapsed})`}
                    </p>
                  ) : (
                    <p className="text-sm text-muted">Not running on this task</p>
                  )}
                  <p className="text-[11px] text-muted">One timer per person, whichever agent is talking to the PM platform.</p>
                </div>

                <div className="bg-paper-elevated border border-line rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Task history</p>
                  {taskEvents.length === 0 ? (
                    <p className="text-sm text-muted">Nothing yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {taskEvents.map(e => (
                        <li key={e.id} className="flex items-start gap-2 text-xs">
                          <span className="text-muted w-14 shrink-0">{time(e.at)}</span>
                          <span className="min-w-0">
                            <AgentBadge source={e.agent} /> <span className="text-ink-soft">{ACTION_TEXT[e.action]}</span>
                            {e.detail && <span className="block text-muted truncate">&ldquo;{e.detail}&rdquo;</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Rules */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Rules the PM platform enforces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Rule icon={UserRound} title="Your own work only" text="Agents see and change only the tasks the person is allowed to, using that person's token." />
            <Rule icon={Ban} title="Never Done" text="Agents can move cards To Do → In Progress → In Review. Review and QA stay with people." />
            <Rule icon={Timer} title="One timer per person" text="Starting a task pauses any other. Switching agents continues the same timer, so nothing is counted twice." />
            <Rule icon={History} title="Everything recorded" text="Every change says which agent made it, for whom and when." />
            <Rule icon={Hourglass} title="Forgotten timers stop" text="After 2 hours without activity, or at the end of the day, the timer stops and is flagged for checking." />
            <Rule icon={ListChecks} title="Admins decide" text="Owners and Admins choose which agents and projects are allowed, and can revoke any token." />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/ai-agents/connect" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink-soft">
            Connect your agent <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted">Prototype: agents and the MCP server are simulated with demo data.</p>
        </div>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function DiagramBox({ title, subtitle, icon: Icon, highlight, children }: {
  title: string;
  subtitle: string;
  icon?: React.ElementType;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border p-4', highlight ? 'border-flash/60 bg-flash/5' : 'border-line bg-paper')}>
      <p className="text-sm font-bold text-ink flex items-center gap-1.5">{Icon && <Icon className="w-4 h-4 text-flash-deep" />}{title}</p>
      <p className="text-[11px] text-muted mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex lg:flex-col items-center justify-center gap-1 text-muted">
      <ArrowRight className="w-5 h-5 hidden lg:block" />
      <ArrowDown className="w-5 h-5 lg:hidden" />
      <span className="text-[10px] text-center max-w-[90px]">{label}</span>
    </div>
  );
}

function DiagramItem({ icon: Icon, label, text }: { icon: React.ElementType; label: string; text: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-paper-elevated border border-line">
      <Icon className="w-4 h-4 text-flash-deep shrink-0" />
      <span className="text-xs"><strong className="text-ink">{label}</strong> <span className="text-muted">· {text}</span></span>
    </div>
  );
}

function Rule({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="p-4 rounded-xl border border-line bg-paper-elevated">
      <p className="text-sm font-bold text-ink flex items-center gap-2"><Icon className="w-4 h-4 text-flash-deep" />{title}</p>
      <p className="text-xs text-muted mt-1">{text}</p>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  if (message.kind === 'system') {
    return <p className="text-xs text-center px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">{message.text}</p>;
  }
  const agentLabel = message.agent ? AGENTS[message.agent].label : '';
  if (message.kind === 'user') {
    return (
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-muted mb-0.5">You → {agentLabel}</span>
        <p className="max-w-[85%] px-3 py-2 rounded-xl rounded-tr-sm bg-ink text-white text-xs">{message.text}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <span className="mb-0.5 flex items-center gap-2">
        {message.agent && <AgentBadge source={message.agent} />}
        {message.tool && <code className="text-[10px] px-1.5 py-0.5 rounded bg-flash/10 text-flash-deep">{message.tool}</code>}
      </span>
      <p className="max-w-[90%] px-3 py-2 rounded-xl rounded-tl-sm bg-paper border border-line text-xs text-ink whitespace-pre-line">{message.text}</p>
    </div>
  );
}
