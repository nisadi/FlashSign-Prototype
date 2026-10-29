import type { AgentAccessToken, AgentClient, AgentEvent, AgentSettings, TaskStatusChange, WorkSession } from '@/types';
import { MOCK_TASKS } from './mock-data';

// Demo work sessions, agent activity and card moves for the AI Agent Hub (Activity, Timesheet),
// the Kanban timer badges and Reports > Task time. Times are anchored to the start of today so the week always looks current.

const startOfToday = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/** The last ten working days, newest first (0 = today if it's a weekday). */
const WORKDAY_OFFSETS = (() => {
  const offsets: number[] = [];
  for (let back = 0; offsets.length < 10; back++) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - back);
    if (d.getDay() !== 0 && d.getDay() !== 6) offsets.push(back);
  }
  return offsets;
})();

function at(workday: number, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(startOfToday);
  d.setDate(d.getDate() - WORKDAY_OFFSETS[workday]);
  d.setHours(h, m, 0, 0);
  return d;
}

const taskId = (key: string) => MOCK_TASKS.find(t => t.key === key)?.id ?? key;

type Spec = [
  user: string,
  taskKey: string,
  workday: number, // 0 = today, 1 = previous working day …
  start: string,
  minutes: number | null, // null = still running
  source: WorkSession['source'],
  end?: WorkSession['endReason'],
  note?: string,
];

const SPECS: Spec[] = [
  // Older work on tasks that have since gone to review or done (Reports > Task time)
  ['u5', 'ONB-43', 9, '09:00', 180, 'claude_code', 'paused', 'Funnel events tracked from each onboarding step'],
  ['u5', 'ONB-43', 8, '10:00', 150, 'claude_code', 'finished', 'Conversion dashboard; PR #188'],
  ['u6', 'ONB-42', 9, '09:30', 240, 'gemini_cli', 'paused'],
  ['u6', 'ONB-42', 8, '09:15', 200, 'web', 'paused'],
  ['u6', 'ONB-42', 7, '10:00', 120, 'gemini_cli', 'finished', 'Prototype linked in Figma; PR #191'],
  ['u4', 'SEC-8', 7, '13:00', 160, 'claude_code', 'idle_timeout'],
  ['u4', 'SEC-8', 6, '09:00', 140, 'codex', 'finished', 'Gitleaks step added to CI; PR #196'],
  ['u4', 'ACME-14', 6, '13:30', 90, 'manual', 'paused', 'Call with ACME IT about their IdP'],
  ['u4', 'ACME-14', 5, '09:00', 200, 'claude_code', 'finished', 'SAML login working with Okta and Azure AD; PR #199'],
  ['u5', 'FSV2-104', 5, '14:00', 120, 'codex', 'paused', 'Event schema agreed'],
  ['u6', 'ACME-12', 5, '09:00', 180, 'claude_code', 'paused'],
  // Priya Nair (developer)
  ['u5', 'SEC-5', 4, '09:10', 150, 'claude_code', 'paused', 'Escaped user input in comment renderer'],
  ['u5', 'SEC-5', 4, '13:30', 120, 'claude_code', 'paused'],
  ['u5', 'FSV2-104', 3, '09:05', 210, 'codex', 'finished', 'Audit log events for sign/decline/void; PR #212'],
  ['u5', 'AIAG-26', 3, '14:00', 95, 'gemini_cli', 'finished', 'Comment templates for review bot; PR #219'],
  ['u5', 'FSV2-102-1', 7, '09:00', 240, 'claude_code', 'paused', 'OCR pass over sample NDAs'],
  ['u5', 'FSV2-102-1', 6, '09:30', 210, 'claude_code', 'finished', 'Bounding boxes and line anchors; PR #201'],
  ['u5', 'FSV2-102-2', 2, '09:30', 180, 'claude_code', 'paused', 'Field detection model wired up; confidence threshold next'],
  ['u5', 'FSV2-102-2', 2, '13:45', 160, 'antigravity', 'paused'],
  ['u5', 'SEC-5', 1, '09:00', 230, 'claude_code', 'idle_timeout'],
  ['u5', 'FSV2-102-2', 1, '14:10', 140, 'codex', 'paused', 'Threshold configurable; tests added'],
  ['u5', 'FSV2-102-2', 0, '09:40', null, 'claude_code'],
  // Lena Fischer
  ['u6', 'ACME-12', 4, '10:00', 200, 'claude_code', 'finished', 'Branding theme tokens per tenant; PR #205'],
  ['u6', 'AIAG-24', 3, '09:20', 240, 'gemini_cli', 'paused'],
  ['u6', 'AIAG-24', 2, '10:15', 190, 'gemini_cli', 'paused', 'Gate list UI done; wiring status icons'],
  ['u6', 'AIAG-24', 1, '09:45', 120, 'web', 'paused'],
  ['u6', 'AIAG-24', 0, '09:05', 150, 'claude_code', 'paused'],
  ['u6', 'FSV2-105-1', 1, '14:00', 150, 'web', 'paused', 'CSV columns mapped to signer fields'],
  ['u6', 'FSV2-105-1', 0, '11:45', 75, 'claude_code', 'paused', 'Validation errors shown per row'],
  // Aditya Sharma
  ['u14', 'FSV2-103', 4, '09:30', 260, 'codex', 'paused'],
  ['u14', 'ACME-11', 3, '10:00', 180, 'codex', 'paused', 'Retry with exponential backoff'],
  ['u14', 'AIAG-22', 2, '09:00', 300, 'gemini_cli', 'paused'],
  ['u14', 'FSV2-103', 1, '13:00', 150, 'manual', 'paused', 'Debugging session with email provider (call)'],
  ['u14', 'ACME-11', 0, '08:50', 130, 'codex', 'paused'],
  // James Okafor
  ['u4', 'ACME-13', 4, '11:00', 120, 'claude_code', 'paused'],
  ['u4', 'AIAG-23', 2, '09:30', 210, 'claude_code', 'paused', 'Sandbox container spike'],
  ['u4', 'AIAG-23', 1, '10:00', 180, 'web', 'paused'],
  ['u4', 'FSV2-105-2', 1, '16:00', 60, 'manual', 'paused', 'Design review of the dispatch queue (no agent)'],
  ['u4', 'FSV2-105-2', 0, '09:30', 120, 'codex', 'paused', 'Queue worker skeleton with retries'],
  // Aria Chen (owner / CEO)
  ['u1', 'ACME-17', 1, '15:00', 45, 'web', 'paused', 'Reviewed discount tiers with Marcus'],
  ['u1', 'ACME-17', 0, '10:30', 30, 'claude_code', 'paused', 'Compared renewal pricing with last year'],
  // Marcus Webb (project manager)
  ['u2', 'FSV2-110', 3, '15:00', 90, 'web', 'paused', 'Walkthrough outline drafted'],
];

let n = 0;
const id = (prefix: string) => `${prefix}-demo-${++n}`;

export const MOCK_WORK_SESSIONS: WorkSession[] = SPECS.map(([userId, key, workday, start, minutes, source, endReason, note]) => {
  const startedAt = at(workday, start);
  const endedAt = minutes === null ? undefined : new Date(startedAt.getTime() + minutes * 60_000);
  return {
    id: id('ws'),
    userId,
    taskId: taskId(key),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt?.toISOString(),
    // A running demo timer was last active a few minutes ago, so it isn't auto-stopped on load
    lastActivityAt: (endedAt ?? new Date(Math.max(startedAt.getTime(), Date.now() - 10 * 60_000))).toISOString(),
    source,
    endReason,
    needsReview: endReason === 'idle_timeout' || endReason === 'day_cutoff',
    note,
  };
});

const END_ACTION: Record<NonNullable<WorkSession['endReason']>, AgentEvent['action']> = {
  paused: 'paused',
  finished: 'finished',
  switched_task: 'paused',
  idle_timeout: 'auto_stopped',
  day_cutoff: 'auto_stopped',
};

const isAgent = (source: WorkSession['source']): source is AgentClient => source !== 'web' && source !== 'manual';

export const MOCK_AGENT_EVENTS: AgentEvent[] = MOCK_WORK_SESSIONS.filter(s => isAgent(s.source)).flatMap(s => {
  const agent = s.source as AgentClient;
  const events: AgentEvent[] = [
    { id: id('ev'), userId: s.userId, taskId: s.taskId, agent, action: 'started', at: s.startedAt },
  ];
  if (s.note) {
    events.push({ id: id('ev'), userId: s.userId, taskId: s.taskId, agent, action: 'note', detail: s.note, at: s.lastActivityAt });
  }
  if (s.endedAt && s.endReason) {
    const auto = s.endReason === 'idle_timeout' || s.endReason === 'day_cutoff';
    events.push({
      id: id('ev'),
      userId: s.userId,
      taskId: s.taskId,
      agent: auto ? 'system' : agent,
      action: END_ACTION[s.endReason],
      detail: auto ? 'No activity for 2 hours, stopped at the last activity time. Please check.' : undefined,
      at: s.endedAt,
    });
  }
  return events;
});

// Card moves that go with the sessions above: In Progress at the first session, In Review when
// the work was finished, Done a day later after review, To Do again when it was put back.
const REVIEWER: Record<string, string> = { p1: 'u4', p2: 'u2', p3: 'u4', p5: 'u8', p6: 'u3' };

export const MOCK_STATUS_CHANGES: TaskStatusChange[] = MOCK_TASKS.flatMap(task => {
  const sessions = MOCK_WORK_SESSIONS.filter(w => w.taskId === task.id).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  if (sessions.length === 0) return [];
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const via = (w: WorkSession) => (isAgent(w.source) ? w.source : 'web');
  const move = (from: TaskStatusChange['from'], to: TaskStatusChange['to'], at: string, byUserId: string, by: TaskStatusChange['via']): TaskStatusChange =>
    ({ id: id('sc'), taskId: task.id, from, to, at, byUserId, via: by });

  const changes = [move('todo', 'in_progress', first.startedAt, first.userId, via(first))];
  if (task.status === 'review' || task.status === 'done') {
    const finished = [...sessions].reverse().find(w => w.endReason === 'finished') ?? last;
    changes.push(move('in_progress', 'review', finished.endedAt!, finished.userId, via(finished)));
    if (task.status === 'done') {
      const doneAt = new Date(new Date(finished.endedAt!).getTime() + 20 * 60 * 60_000).toISOString();
      changes.push(move('review', 'done', doneAt, REVIEWER[task.projectId] ?? 'u2', 'web'));
    }
  } else if (task.status === 'todo' && last.endedAt) {
    changes.push(move('in_progress', 'todo', last.endedAt, last.userId, 'web'));
  }
  return changes;
});

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  enabled: true,
  allowedAgents: { claude_code: true, codex: true, gemini_cli: true, antigravity: true },
  idleTimeoutMinutes: 120,
  dayCutoff: '20:00',
  allowClaimUnassigned: true,
  blockedProjectIds: [],
};

const daysAgo = (days: number, time = '10:00') => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(startOfToday);
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** Teammates' tokens, so the Organisation view has something to show */
export const MOCK_AGENT_TOKENS: AgentAccessToken[] = [
  {
    id: 'tok-demo-1', userId: 'u5', name: 'Work laptop', lastFour: 'q7Zk',
    createdAt: daysAgo(20), expiresAt: daysAgo(-70), lastUsedAt: daysAgo(0, '09:40'),
    usedBy: { claude_code: daysAgo(0, '09:40'), codex: daysAgo(1, '14:10'), gemini_cli: daysAgo(3, '14:00'), antigravity: daysAgo(2, '13:45') },
  },
  {
    id: 'tok-demo-2', userId: 'u6', name: 'MacBook Pro', lastFour: 'Lm03',
    createdAt: daysAgo(14), expiresAt: daysAgo(-76), lastUsedAt: daysAgo(0, '09:05'),
    usedBy: { claude_code: daysAgo(0, '09:05'), gemini_cli: daysAgo(2, '10:15') },
  },
  {
    id: 'tok-demo-3', userId: 'u14', name: 'Desktop – office', lastFour: '8Rtx',
    createdAt: daysAgo(30), expiresAt: daysAgo(-60), lastUsedAt: daysAgo(0, '08:50'),
    usedBy: { codex: daysAgo(0, '08:50'), gemini_cli: daysAgo(2, '09:00') },
  },
  {
    id: 'tok-demo-4', userId: 'u4', name: 'Work laptop', lastFour: 'Yc21',
    createdAt: daysAgo(40), expiresAt: daysAgo(-50), lastUsedAt: daysAgo(2, '09:30'),
    usedBy: { claude_code: daysAgo(2, '09:30') },
  },
  {
    id: 'tok-demo-5', userId: 'u4', name: 'Old laptop', lastFour: 'pP9a',
    createdAt: daysAgo(120), expiresAt: daysAgo(-30), lastUsedAt: daysAgo(60), revokedAt: daysAgo(45),
    usedBy: { claude_code: daysAgo(60) },
  },
];
