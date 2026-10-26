import type { AgentAccessToken, AgentClient } from '@/types';

// Everything the "Connect your AI agent" guide shows, for each supported agent.
// One PM MCP server serves all of them; only the client-side config differs.

/** Set by the platform administrator; placeholder until the MCP server is deployed. */
export const PM_SERVER_URL = 'https://pm.example.com';
export const MCP_URL = `${PM_SERVER_URL}/mcp`;
export const MCP_SERVER_NAME = 'pm';
export const TOKEN_ENV_VAR = 'PM_TOKEN';
export const TOKEN_PLACEHOLDER = 'pmat_paste_your_token_here';

export const TOKEN_EXPIRY_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days (recommended)' },
  { days: 365, label: '1 year' },
];

// ── Agents ────────────────────────────────────────────────────────────────────

export interface AgentInfo {
  id: AgentClient;
  label: string;
  vendor: string;
  /** Short mark for badges */
  mark: string;
  color: string;
}

export const AGENTS: Record<AgentClient, AgentInfo> = {
  claude_code: { id: 'claude_code', label: 'Claude Code', vendor: 'Anthropic', mark: 'C', color: '#d97757' },
  codex: { id: 'codex', label: 'Codex', vendor: 'OpenAI', mark: 'X', color: '#0c1f22' },
  gemini_cli: { id: 'gemini_cli', label: 'Gemini CLI', vendor: 'Google', mark: 'G', color: '#3b78e7' },
  antigravity: { id: 'antigravity', label: 'Antigravity', vendor: 'Google', mark: 'A', color: '#7b5cd6' },
};

export const AGENT_LIST = Object.values(AGENTS);

// ── Tokens ────────────────────────────────────────────────────────────────────

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** `pmat_` + 32 random base62 characters. The real server generates and hashes these. */
export function generateTokenValue(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'pmat_' + Array.from(bytes, b => BASE62[b % BASE62.length]).join('');
}

export type TokenStatus = 'active' | 'expired' | 'revoked';

export function tokenStatus(token: AgentAccessToken, now = Date.now()): TokenStatus {
  if (token.revokedAt) return 'revoked';
  if (new Date(token.expiresAt).getTime() < now) return 'expired';
  return 'active';
}

export const maskedToken = (token: AgentAccessToken) => `pmat_••••••••${token.lastFour}`;

// ── Step 2: store the token as an environment variable ───────────────────────

export type OperatingSystem = 'windows' | 'macos' | 'linux';

export const OS_LABELS: Record<OperatingSystem, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
};

export function detectOperatingSystem(): OperatingSystem {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'windows';
}

export function saveTokenCommand(os: OperatingSystem, token: string): { shell: string; command: string; check: string } {
  switch (os) {
    case 'windows':
      return { shell: 'PowerShell', command: `setx ${TOKEN_ENV_VAR} "${token}"`, check: `echo $env:${TOKEN_ENV_VAR}` };
    case 'macos':
      return {
        shell: 'Terminal (zsh)',
        command: `echo 'export ${TOKEN_ENV_VAR}="${token}"' >> ~/.zshrc\nsource ~/.zshrc`,
        check: `echo $${TOKEN_ENV_VAR}`,
      };
    case 'linux':
      return {
        shell: 'Terminal (bash)',
        command: `echo 'export ${TOKEN_ENV_VAR}="${token}"' >> ~/.bashrc\nsource ~/.bashrc`,
        check: `echo $${TOKEN_ENV_VAR}`,
      };
  }
}

// ── Step 3: connect the agent (one recipe per agent) ─────────────────────────

export interface SetupStep {
  text: string;
  code?: { label: string; content: string };
}

export interface AgentSetup {
  /** Where the connection is configured */
  where: string;
  steps: SetupStep[];
  /** Parts of this recipe not yet confirmed against the vendor's official docs */
  verify?: string;
}

const claudeMcpJson = JSON.stringify(
  {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        type: 'http',
        url: `\${PM_URL:-${PM_SERVER_URL}}/mcp`,
        headers: { Authorization: `Bearer \${${TOKEN_ENV_VAR}}` },
      },
    },
  },
  null,
  2
);

const codexToml = `[mcp_servers.${MCP_SERVER_NAME}]
url = "${MCP_URL}"
bearer_token_env_var = "${TOKEN_ENV_VAR}"`;

const geminiSettings = JSON.stringify(
  { mcpServers: { [MCP_SERVER_NAME]: { httpUrl: MCP_URL, headers: { Authorization: `Bearer $${TOKEN_ENV_VAR}` } } } },
  null,
  2
);

const antigravityConfig = (token: string) =>
  JSON.stringify({ mcpServers: { [MCP_SERVER_NAME]: { serverUrl: MCP_URL, headers: { Authorization: `Bearer ${token}` } } } }, null, 2);

export function agentSetup(agent: AgentClient, token: string): AgentSetup {
  switch (agent) {
    case 'claude_code':
      return {
        where: '.mcp.json in the repository (shared, no token inside)',
        steps: [
          { text: 'In the repository root, create a file named .mcp.json:', code: { label: '.mcp.json', content: claudeMcpJson } },
          { text: 'Commit it. It contains no token; each person’s own PM_TOKEN is used.' },
          { text: 'Open Claude Code in the repository. The first time, it asks whether to use the "pm" server. Approve it.' },
          {
            text: 'Prefer a personal setup instead? Run this once; it works in every folder:',
            code: { label: 'Terminal', content: `claude mcp add --scope user --transport http ${MCP_SERVER_NAME} ${MCP_URL} --header "Authorization: Bearer ${token}"` },
          },
        ],
      };
    case 'codex':
      return {
        where: '~/.codex/config.toml (your user settings)',
        steps: [
          { text: 'Open (or create) ~/.codex/config.toml and add:', code: { label: '~/.codex/config.toml', content: codexToml } },
          { text: 'Codex reads the token from PM_TOKEN itself; the file holds only the variable’s name.' },
          { text: 'Start a new Codex session so it loads the server.' },
        ],
        verify: 'Older Codex versions needed an experimental setting for this server type; check your version.',
      };
    case 'gemini_cli':
      return {
        where: '~/.gemini/settings.json (your user settings)',
        steps: [
          { text: 'Open ~/.gemini/settings.json and add the "pm" entry inside "mcpServers":', code: { label: '~/.gemini/settings.json', content: geminiSettings } },
          {
            text: 'Or add it with one command:',
            code: { label: 'Terminal', content: `gemini mcp add --transport http --header "Authorization: Bearer $${TOKEN_ENV_VAR}" ${MCP_SERVER_NAME} ${MCP_URL}` },
          },
          { text: 'Start a new Gemini CLI session so it loads the server.' },
        ],
        verify: 'That Gemini CLI fills in $PM_TOKEN inside headers.',
      };
    case 'antigravity':
      return {
        where: 'Antigravity: Manage MCP servers → View raw config (mcp_config.json)',
        steps: [
          { text: 'In Antigravity, open the agent panel menu → Manage MCP servers → View raw config.' },
          { text: 'Add the "pm" entry inside "mcpServers" (Antigravity uses "serverUrl"):', code: { label: 'mcp_config.json', content: antigravityConfig(token) } },
          { text: 'Save, then refresh the MCP servers list.' },
        ],
        verify: 'Whether Antigravity can read PM_TOKEN instead of the token being pasted, and the config file location.',
      };
  }
}

// ── Step 4: check ────────────────────────────────────────────────────────────

export const CHECK_STEPS: Record<AgentClient, { text: string; code?: string }[]> = {
  claude_code: [
    { text: 'Run this; "pm" should show ✔ Connected:', code: 'claude mcp list' },
    { text: 'Inside Claude Code, /mcp shows the server and its tools.' },
  ],
  codex: [
    { text: 'Run this; "pm" should be listed:', code: 'codex mcp list' },
    { text: 'Inside Codex, /mcp shows the connected servers.' },
  ],
  gemini_cli: [
    { text: 'Run this; "pm" should show as connected:', code: 'gemini mcp list' },
    { text: 'Inside Gemini CLI, /mcp shows the server and its tools.' },
  ],
  antigravity: [
    { text: 'In Manage MCP servers, "pm" should show as connected with its tools listed.' },
  ],
};

export const TROUBLESHOOTING: { problem: string; fix: string }[] = [
  {
    problem: 'Needs authentication / 401',
    fix: 'The token is wrong, expired or revoked. Check it on the My Tokens tab, create a new one if needed, and update PM_TOKEN.',
  },
  {
    problem: 'Failed to connect',
    fix: 'Your computer can’t reach the PM server. Check you are on the company network or VPN, and that the address in your setup is correct.',
  },
  {
    problem: 'The "pm" server isn’t listed',
    fix: 'Check the config file is in the right place and saved, then start a new session. For Claude Code repository setups, approve the server when asked.',
  },
  {
    problem: 'PM_TOKEN is empty',
    fix: 'Close and reopen your terminal and your IDE after saving the token, so they pick up the new variable.',
  },
  {
    problem: 'The agent shows tasks from the wrong project',
    fix: 'Check the project key in the repository’s AGENTS.md (step 5).',
  },
];

export const TRY_PROMPTS = [
  'What tasks do I have?',
  'Tell me about FS-42',
  "Let's start FS-42",
  'Pause, going to lunch',
  "Done, here's the PR: <link>",
];

// ── Step 5: shared instructions (AGENTS.md) and extras ───────────────────────

/** One instructions file for every agent. Codex reads AGENTS.md directly. */
export function agentsMd(projectKey: string): string {
  return `# Agent instructions

## Task tracking (PM platform)
This repository belongs to PM project **${projectKey}**. Use it as the default project for the pm tools.

- When I say I'm starting a task (for example "let's do ${projectKey}-42"), call \`start_task\` before writing code.
- If \`get_active_work\` shows a task already running, ask me whether to continue it or pause it first.
- After each meaningful step, call \`add_progress_note\` with one or two lines: what's done and what's next.
  Another agent may continue this task later and will rely on these notes.
- When I say a task is finished, call \`finish_task\` with a short summary and the PR link if there is one.
- Never claim a task is Done; only move it to In Review.
- If a tool says the task was changed by someone else, tell me and don't retry.`;
}

export const INSTRUCTION_FILES: Record<AgentClient, { text: string; code?: { label: string; content: string } }> = {
  claude_code: {
    text: 'Claude Code reads CLAUDE.md. Make it import the shared file with one line:',
    code: { label: 'CLAUDE.md', content: '@AGENTS.md' },
  },
  codex: { text: 'Codex reads AGENTS.md automatically. Nothing else to do.' },
  gemini_cli: {
    text: 'Gemini CLI reads GEMINI.md by default. Either copy the AGENTS.md text into GEMINI.md, or set Gemini to read AGENTS.md as its context file.',
  },
  antigravity: { text: 'Add the AGENTS.md text as a workspace rule in Antigravity, so its agent follows the same habits.' },
};

export const PERMISSIONS_JSON = JSON.stringify(
  {
    permissions: {
      allow: [
        `mcp__${MCP_SERVER_NAME}__list_my_tasks`,
        `mcp__${MCP_SERVER_NAME}__get_task`,
        `mcp__${MCP_SERVER_NAME}__get_active_work`,
      ],
    },
  },
  null,
  2
);

export const HOOKS_JSON = JSON.stringify(
  {
    hooks: {
      SessionStart: [
        { matcher: 'startup', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/pm-session-start.mjs"' }] },
      ],
      SessionEnd: [
        { hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/pm-session-end.mjs"', timeout: 10 }] },
      ],
    },
  },
  null,
  2
);

export const SESSION_START_SCRIPT = `// Tells the AI if a work timer is still running from an earlier session.
const base = process.env.PM_URL ?? '${PM_SERVER_URL}';
const token = process.env.${TOKEN_ENV_VAR};
if (!token) process.exit(0);

try {
  const res = await fetch(\`\${base}/api/agent/active-work\`, { headers: { Authorization: \`Bearer \${token}\` } });
  if (res.ok) {
    const work = await res.json();
    if (work?.taskKey) {
      console.log(\`PM: \${work.taskKey} "\${work.title}" has been running since \${work.startedAt} (\${work.elapsed}). Ask the user whether to continue, pause now, or pause at the time they stopped.\`);
    }
  }
} catch {
  // PM server unreachable: say nothing, don't block the session
}`;

export const SESSION_END_SCRIPT = `// Pauses the running timer when the session ends normally.
const base = process.env.PM_URL ?? '${PM_SERVER_URL}';
const token = process.env.${TOKEN_ENV_VAR};
if (!token) process.exit(0);

try {
  await fetch(\`\${base}/api/agent/active-work/pause\`, {
    method: 'POST',
    headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'session_end' }),
  });
} catch {
  // Ignore: the server's idle timeout is the safety net
}`;

// ── Time helpers ─────────────────────────────────────────────────────────────

export function sessionMinutes(startedAt: string, endedAt: string | undefined, now: number): number {
  const end = endedAt ? new Date(endedAt).getTime() : now;
  return Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60_000));
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** The last five working days ending today, oldest first. */
export function lastWorkdays(now: number): Date[] {
  const days: Date[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  while (days.length < 5) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}
