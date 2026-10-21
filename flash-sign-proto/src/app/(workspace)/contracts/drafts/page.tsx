'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plus,
  Send,
  Eye,
  Trash2,
  Edit3,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function DraftContractsPage() {
  const {
    contracts,
    submitContractForReview,
    deleteContract
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmSubmitId, setConfirmSubmitId] = useState<string | null>(null);

  const draftContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'draft');
  }, [contracts]);

  const filteredDrafts = useMemo(() => {
    return draftContracts.filter(c => {
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
  }, [draftContracts, searchQuery]);

  const handleSubmitForReview = (contractId: string) => {
    submitContractForReview(contractId);
    setConfirmSubmitId(null);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-flash/10 text-flash flex items-center justify-center border border-flash/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Draft Contracts</h1>
                <p className="text-sm text-muted">
                  Contracts currently in preparation before internal legal and commercial review
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contracts/new"
              className="px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Contract
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drafts by title, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredDrafts.length} draft contract{filteredDrafts.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* List of Drafts */}
        {filteredDrafts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <Edit3 className="w-12 h-12 text-muted/50 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No draft contracts</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              All contracts have either been submitted for review, signed, or archived.
            </p>
            <div className="mt-4">
              <Link
                href="/contracts/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-flash text-ink text-sm font-semibold rounded-lg hover:bg-flash-deep transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start a New Contract
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map((contract) => {
              const formattedDate = new Date(contract.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={contract.id}
                  className="bg-paper-elevated border border-line hover:border-flash/50 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {contract.id}
                      </span>
                      <ContractStatusBadge status={contract.status} />
                    </div>

                    <h3 className="font-semibold text-ink text-base group-hover:text-flash-deep transition-colors line-clamp-1">
                      {contract.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate">{contract.counterparty}</span>
                    </div>

                    <p className="text-xs text-muted mt-2 line-clamp-2">
                      {contract.description || 'Draft agreement in progress.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                      <span>Type: <strong className="text-ink-soft capitalize">{contract.contractType}</strong></span>
                      {contract.value && (
                        <span className="font-semibold text-ink-soft">
                          ${contract.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => deleteContract(contract.id)}
                        className="p-1.5 text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSubmitForReview(contract.id)}
                        className="px-2.5 py-1.5 bg-flash/15 hover:bg-flash/25 text-flash-deep font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-flash/30"
                        title="Submit for internal review"
                      >
                        <Send className="w-3 h-3" />
                        Move to Review
                      </button>

                      <Link
                        href={`/contracts/${contract.id}`}
                        className="px-3 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
