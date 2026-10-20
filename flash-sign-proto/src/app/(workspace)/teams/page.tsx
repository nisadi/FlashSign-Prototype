'use client';

import { useApp } from '@/context/app-context';
import { PageHeader, Card } from '@/components/shared/ui';
import { AvatarGroup, Avatar } from '@/components/shared/avatar';

export default function TeamsPage() {
  const { teams, users } = useApp();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Teams" description={`${teams.length} teams in your organization`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => {
          const members = users.filter(u => team.memberIds.includes(u.id));
          const lead = users.find(u => u.id === team.leadId);
          return (
            <Card key={team.id} className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ background: team.color }}>
                  {team.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{team.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{team.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <AvatarGroup users={members} max={5} size="sm" />
                <div className="text-right">
                  {lead && <p className="text-xs text-muted">Lead: <span className="text-ink font-medium">{lead.name.split(' ')[0]}</span></p>}
                  <p className="text-xs text-muted">{members.length} members</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
