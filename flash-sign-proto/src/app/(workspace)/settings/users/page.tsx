'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { PageHeader, Button, Card } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import { formatRelative } from '@/lib/utils';
import { canManageUsers } from '@/lib/permissions';
import { Users, Plus, Mail, MoreHorizontal, Shield, Check, X } from 'lucide-react';
import type { DemoRole } from '@/types';

const ROLE_LABELS: Record<DemoRole, string> = {
  ceo: 'CEO', project_manager: 'Project Manager', product_owner: 'Product Owner',
  engineering_lead: 'Engineering Lead', developer: 'Developer', qa_tester: 'QA Tester',
  org_admin: 'Org Admin', document_manager: 'Document Manager', client: 'Client',
  auditor: 'Auditor', platform_admin: 'Platform Admin', integration_service: 'Integration Service',
};

export default function UsersSettingsPage() {
  const { users, demoRole } = useApp();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<DemoRole>('developer');
  const [inviteSent, setInviteSent] = useState(false);

  const canManage = canManageUsers(demoRole);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setTimeout(() => {
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        setInviteOpen(false);
        setInviteEmail('');
      }, 2000);
    }, 800);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* The Settings tabs above replace this page's old side menu */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <PageHeader
            title="Users & Invitations"
            description={`${users.length} members in your organization`}
            actions={
              canManage ? (
                <Button variant="primary" icon={Plus} onClick={() => setInviteOpen(true)}>
                  Invite User
                </Button>
              ) : undefined
            }
          />

          {/* Invite modal */}
          {inviteOpen && (
            <Card className="p-4 mb-4 border-flash/20">
              <h3 className="text-sm font-semibold text-ink mb-3">Invite a team member</h3>
              <div className="flex gap-3 mb-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@company.com"
                  className="flex-1 px-3 py-2 text-sm bg-mist border border-line rounded-lg outline-none focus:border-flash transition-colors"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as DemoRole)}
                  className="px-3 py-2 text-sm bg-mist border border-line rounded-lg text-ink outline-none focus:border-flash"
                >
                  {(Object.entries(ROLE_LABELS) as [DemoRole, string][]).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {inviteSent ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                    <Check className="w-4 h-4" /> Invitation sent!
                  </span>
                ) : (
                  <>
                    <Button variant="primary" size="sm" icon={Mail} onClick={handleInvite}>Send Invitation</Button>
                    <Button variant="ghost" size="sm" icon={X} onClick={() => setInviteOpen(false)}>Cancel</Button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted mt-2">Demo only — no real email will be sent.</p>
            </Card>
          )}

          {/* User table */}
          <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-mist/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted hidden lg:table-cell">Status</th>
                    {canManage && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-mist/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} size="sm" />
                          <div>
                            <p className="font-medium text-ink">{u.name}</p>
                            <p className="text-[10px] text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Shield className="w-3 h-3" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted">{u.department}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <button className="text-muted hover:text-ink transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
