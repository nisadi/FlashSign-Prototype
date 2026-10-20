'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp, useCurrentUser } from '@/context/app-context';
import { PageHeader, Button, EmptyState, Card } from '@/components/shared/ui';
import { DocStatusBadge } from '@/components/shared/badges';
import { formatRelative } from '@/lib/utils';
import { CheckCircle2, XCircle, MessageSquare, Clock, FileText } from 'lucide-react';

export default function ApprovalsPage() {
  const { approvals, documents, users, updateApproval, updateDocument, currentUserId } = useApp();
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const currentUser = useCurrentUser();

  const myApprovals = approvals.filter(a => a.assignedTo === currentUserId && a.status === 'pending');
  const allPendingApprovals = approvals.filter(a => a.status === 'pending');

  const handleApprove = (aprId: string, docId: string) => {
    updateApproval(aprId, { status: 'approved', comment: comment || undefined, resolvedAt: new Date().toISOString() });
    // Check if all approvals are resolved
    const docApprovals = approvals.filter(a => a.documentId === docId && a.id !== aprId);
    if (docApprovals.every(a => a.status === 'approved')) {
      updateDocument(docId, { status: 'approved' });
    }
    setCommenting(null);
    setComment('');
  };

  const handleReject = (aprId: string) => {
    updateApproval(aprId, { status: 'rejected', comment, resolvedAt: new Date().toISOString() });
    setCommenting(null);
    setComment('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Approval Center"
        description="Review and approve pending documents"
      />

      {/* My Approvals */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          Awaiting Your Action ({myApprovals.length})
        </h2>
        {myApprovals.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-flash mx-auto mb-2" />
            <p className="text-sm text-ink font-medium">You're all caught up!</p>
            <p className="text-xs text-muted mt-1">No approvals waiting for your action.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myApprovals.map(apr => {
              const doc = documents.find(d => d.id === apr.documentId);
              const requester = users.find(u => u.id === apr.requestedBy);
              const isCommenting = commenting === apr.id;
              return (
                <Card key={apr.id} className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-mist flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/documents/${apr.documentId}`} className="text-sm font-semibold text-ink hover:text-flash">
                        {doc?.title ?? 'Unknown Document'}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        Requested by {requester?.name} • {formatRelative(apr.createdAt)}
                      </p>
                    </div>
                    {doc && <DocStatusBadge status={doc.status} />}
                  </div>

                  {isCommenting && (
                    <div className="mb-3">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add a comment (optional)…"
                        rows={3}
                        className="w-full text-sm bg-mist rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-flash/30 resize-none border border-transparent focus:border-flash/30 transition-all placeholder:text-muted text-ink"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => {
                        if (!isCommenting) {
                          setCommenting(apr.id);
                        } else {
                          handleApprove(apr.id, apr.documentId);
                        }
                      }}
                    >
                      {isCommenting ? 'Confirm Approve' : 'Approve'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => {
                        if (!isCommenting) {
                          setCommenting(apr.id);
                        } else {
                          handleReject(apr.id);
                        }
                      }}
                    >
                      {isCommenting ? 'Confirm Reject' : 'Reject'}
                    </Button>
                    {!isCommenting && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={MessageSquare}
                        onClick={() => setCommenting(apr.id)}
                      >
                        Comment
                      </Button>
                    )}
                    {isCommenting && (
                      <Button variant="ghost" size="sm" onClick={() => { setCommenting(null); setComment(''); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* All Pending */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          All Pending Approvals ({allPendingApprovals.length})
        </h2>
        <div className="bg-paper-elevated rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-mist/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Document</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Approver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allPendingApprovals.map(apr => {
                const doc = documents.find(d => d.id === apr.documentId);
                const approver = users.find(u => u.id === apr.assignedTo);
                return (
                  <tr key={apr.id} className="hover:bg-mist/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/documents/${apr.documentId}`} className="font-medium text-ink hover:text-flash text-xs">
                        {doc?.title ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{approver?.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatRelative(apr.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
