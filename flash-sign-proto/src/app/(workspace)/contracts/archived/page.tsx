'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Archive,
  RotateCcw,
  Eye,
  Building2,
  Clock
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ArchivedContractsPage() {
  const { contracts, updateContract } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const archivedContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'archived');
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return archivedContracts.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.counterparty.toLowerCase().includes(q) ||
          (c.ownerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [archivedContracts, searchQuery]);

  const handleRestore = (id: string) => {
    updateContract(id, { status: 'draft' });
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-mist text-ink-soft flex items-center justify-center border border-line">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Archived Contracts</h1>
                <p className="text-sm text-muted">
                  Superseded, cancelled, or terminated agreements preserved for historical reference
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
              placeholder="Search archived contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredContracts.length} archived contract{filteredContracts.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* List */}
        {filteredContracts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <Archive className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No archived contracts</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Contracts archived from the registry will appear here and can be restored back to draft.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {contract.id}
                      </span>
                      <ContractStatusBadge status={contract.status} />
                    </div>

                    <h3 className="font-bold text-ink text-base">
                      {contract.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-muted" />
                        {contract.counterparty}
                      </span>
                      <span>•</span>
                      <span>Owner: <strong className="text-ink-soft">{contract.ownerName}</strong></span>
                      <span>•</span>
                      <span>Archived: {new Date(contract.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleRestore(contract.id)}
                      className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title="Restore to Draft"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore to Draft
                    </button>

                    <Link
                      href={`/contracts/${contract.id}`}
                      className="px-3.5 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
