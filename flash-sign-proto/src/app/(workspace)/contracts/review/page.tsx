'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Eye,
  Send,
  Building2,
  UserCheck,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ContractReviewPage() {
  const {
    contracts,
    markContractReviewed,
    addContractReviewComment,
    updateContract
  } = useApp();
  const currentUser = useCurrentUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const reviewContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'pending_review');
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return reviewContracts.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.counterparty.toLowerCase().includes(q) ||
          c.contractType.toLowerCase().includes(q) ||
          (c.ownerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [reviewContracts, searchQuery]);

  const handleAddComment = (contractId: string) => {
    if (!commentText.trim()) return;
    addContractReviewComment(contractId, {
      authorId: currentUser?.id || 'usr-1',
      authorName: currentUser?.name || 'Alex Morgan',
      content: commentText.trim()
    });
    setCommentText('');
  };

  const handleRequestChanges = (contractId: string) => {
    if (commentText.trim()) {
      addContractReviewComment(contractId, {
        authorId: currentUser?.id || 'usr-1',
        authorName: currentUser?.name || 'Alex Morgan',
        content: `Requested Changes: ${commentText.trim()}`
      });
      setCommentText('');
    }
    // Return to draft status
    updateContract(contractId, { status: 'draft' });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-waiting/15 text-waiting flex items-center justify-center border border-waiting/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Contract Review Queue</h1>
                <p className="text-sm text-muted">
                  Contracts pending internal legal, finance, and operational approval before signature dispatch
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contracts/all"
              className="px-4 py-2 bg-paper-elevated border border-line hover:bg-mist/50 text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              All Contracts
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contracts awaiting review..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredContracts.length} contract{filteredContracts.length === 1 ? '' : 's'} awaiting review
          </div>
        </div>

        {/* List of Contracts */}
        {filteredContracts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-flash mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">Review Queue Clear</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              There are currently no contracts pending internal review. Contracts submitted from drafts will appear here.
            </p>
            <div className="mt-4">
              <Link
                href="/contracts/drafts"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper-elevated text-sm font-semibold rounded-lg hover:bg-ink-soft transition-colors"
              >
                View Drafts
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => {
              const formattedDate = new Date(contract.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              const isExpanded = selectedContractId === contract.id;

              return (
                <div
                  key={contract.id}
                  className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden transition-all"
                >
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                          {contract.id}
                        </span>
                        <ContractStatusBadge status={contract.status} />
                        <span className="text-xs text-muted">
                          Submitted by <strong className="text-ink-soft">{contract.ownerName}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-ink">
                        {contract.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-muted mt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-muted" />
                          Client: <strong className="text-ink-soft">{contract.counterparty}</strong>
                        </span>
                        <span>•</span>
                        <span>Type: <strong className="text-ink-soft capitalize">{contract.contractType}</strong></span>
                        {contract.value && (
                          <>
                            <span>•</span>
                            <span>Value: <strong className="text-ink-soft">${contract.value.toLocaleString()}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          Updated {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setSelectedContractId(isExpanded ? null : contract.id)}
                        className="px-3 py-2 bg-paper hover:bg-mist/50 text-ink-soft text-xs font-semibold rounded-lg border border-line transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Comments ({contract.reviewComments?.length || 0})
                      </button>

                      <button
                        onClick={() => handleRequestChanges(contract.id)}
                        className="px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-semibold rounded-lg border border-danger/20 transition-colors flex items-center gap-1.5"
                        title="Return to draft with change notes"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Request Changes
                      </button>

                      <button
                        onClick={() => markContractReviewed(contract.id)}
                        className="px-3.5 py-2 bg-flash hover:bg-flash-deep text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Move to Sign
                      </button>

                      <Link
                        href={`/contracts/${contract.id}`}
                        className="px-3 py-2 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Full Details
                      </Link>
                    </div>
                  </div>

                  {/* Expanded Comments Drawer */}
                  {isExpanded && (
                    <div className="bg-paper p-5 border-t border-line space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-flash-deep" />
                        Internal Review Notes & Discussion
                      </h4>

                      {(!contract.reviewComments || contract.reviewComments.length === 0) ? (
                        <p className="text-xs text-muted italic">
                          No review comments recorded yet. Add recommendations or approval conditions below.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
                          {contract.reviewComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-paper-elevated border border-line rounded-lg p-3 text-xs"
                            >
                              <div className="flex items-center justify-between text-muted mb-1">
                                <span className="font-semibold text-ink-soft">{comment.authorName}</span>
                                <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-ink leading-relaxed">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment box */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Add legal or commercial review notes..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(contract.id)}
                          className="flex-1 px-3 py-2 bg-paper-elevated border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
                        />
                        <button
                          onClick={() => handleAddComment(contract.id)}
                          className="px-4 py-2 bg-ink text-paper-elevated text-xs font-semibold rounded-lg hover:bg-ink-soft transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
