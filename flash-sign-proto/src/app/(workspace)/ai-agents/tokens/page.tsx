'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Plus } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { cn, formatRelative } from '@/lib/utils';
import { maskedToken, tokenStatus, type TokenStatus } from '@/lib/agent-connection';
import { CreateTokenDialog } from '@/components/agents/create-token-dialog';
import { AgentBadge } from '@/components/agents/agent-badge';
import type { AgentClient } from '@/types';
import { SettingsPage, SettingsCard, SaveButton } from '@/components/settings/settings-layout';

const STATUS_STYLES: Record<TokenStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  expired: { label: 'Expired', className: 'bg-amber-500/10 text-amber-800 border-amber-500/20' },
  revoked: { label: 'Revoked', className: 'bg-mist text-muted border-line' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MyTokensPage() {
  const { agentTokens, revokeAgentToken } = useApp();
  const user = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Newest first; revoked and expired ones stay listed for reference
  const tokens = useMemo(
    () => agentTokens.filter(t => t.userId === user?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [agentTokens, user?.id]
  );

  const handleRevoke = (id: string, name: string) => {
    if (!confirm(`Revoke "${name}"? Any AI agent using it stops working immediately.`)) return;
    revokeAgentToken(id);
  };

  return (
    <SettingsPage
      title="My Tokens"
      description="Personal tokens that let your AI agents work with the PM platform on your behalf."
      actions={<SaveButton onClick={() => setDialogOpen(true)}><span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create token</span></SaveButton>}
    >
      <SettingsCard title="Your tokens" icon={KeyRound} description="Revoke a token if it may have been shared, or when you stop using that computer.">
        {tokens.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-muted">You don&apos;t have any tokens yet.</p>
            <Link href="/ai-agents/connect" className="font-semibold text-flash-deep hover:underline">Follow the setup guide</Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  <th className="px-5 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Token</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Used by</th>
                  <th className="px-3 py-2 font-semibold">Last used</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Expires</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tokens.map(token => {
                  const status = tokenStatus(token);
                  return (
                    <tr key={token.id} className={cn(status !== 'active' && 'opacity-70')}>
                      <td className="px-5 py-3 font-semibold text-ink">{token.name}</td>
                      <td className="px-3 py-3 font-mono text-muted whitespace-nowrap">{maskedToken(token)}</td>
                      <td className="px-3 py-3">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border', STATUS_STYLES[status].className)}>
                          {STATUS_STYLES[status].label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {token.usedBy && Object.keys(token.usedBy).length > 0 ? (
                          <span className="flex items-center gap-1">
                            {(Object.keys(token.usedBy) as AgentClient[]).map(a => <AgentBadge key={a} source={a} showLabel={false} />)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">
                        {token.lastUsedAt ? formatRelative(token.lastUsedAt) : 'Never'}
                      </td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">{formatDate(token.createdAt)}</td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">
                        {status === 'revoked' && token.revokedAt ? `Revoked ${formatDate(token.revokedAt)}` : formatDate(token.expiresAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(token.id, token.name)}
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
        )}
      </SettingsCard>

      <p className="text-xs text-muted">
        One token per computer is enough: Claude Code, Codex and Gemini all use it, and each identifies itself when it connects. Tokens only work for the AI agent connection. They can read your tasks and move them to In Progress or In Review, but can&apos;t
        sign in to the web app, mark tasks Done or change other people&apos;s work. Admins can also revoke tokens.
      </p>

      <CreateTokenDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </SettingsPage>
  );
}
