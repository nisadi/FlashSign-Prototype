'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Eye,
  Archive,
  RefreshCw,
  Building2,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ActiveContractsPage() {
  const { contracts, archiveContract, addContract } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const activeContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'active');
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return activeContracts.filter(c => {
      if (typeFilter !== 'all' && c.contractType !== typeFilter) return false;
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
  }, [activeContracts, typeFilter, searchQuery]);

  const handleStartRenewal = (contract: (typeof contracts)[0]) => {
    const renewalId = `CTR-${Math.floor(1000 + Math.random() * 9000)}`;
    addContract({
      id: renewalId,
      title: `${contract.title} (Renewal)`,
      contractType: contract.contractType,
      counterparty: contract.counterparty,
      ownerId: contract.ownerId,
      ownerName: contract.ownerName,
      relatedProjectId: contract.relatedProjectId,
      effectiveDate: contract.expiryDate || new Date().toISOString().split('T')[0],
      renewalType: contract.renewalType,
      value: contract.value,
      status: 'draft',
      description: `Renewal agreement for prior contract ${contract.id}`
    });
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
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Active Contracts</h1>
                <p className="text-sm text-muted">
                  Currently executed and operational legal agreements across all counterparties
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

        {/* Search & Filters */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search active contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by contract type"
              className="px-3 py-1.5 bg-paper border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-flash"
            >
              <option value="all">All Types</option>
              <option value="agreement">Agreements</option>
              <option value="sow">SOWs</option>
              <option value="msa">MSAs</option>
              <option value="nda">NDAs</option>
            </select>
            <span className="text-xs text-muted font-medium ml-2">
              {filteredContracts.length} active
            </span>
          </div>
        </div>

        {/* Contract Cards */}
        {filteredContracts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No active contracts found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Contracts transition to Active once all required electronic signatures have been collected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => (
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

                  <div className="mt-4 pt-3 border-t border-line/60 space-y-1.5 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Effective:</span>
                      <strong className="text-ink-soft">{contract.effectiveDate || 'Upon Execution'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <strong className="text-ink-soft">{contract.expiryDate || 'N/A'}</strong>
                    </div>
                    {contract.value && (
                      <div className="flex justify-between">
                        <span>Value:</span>
                        <strong className="text-ink-soft">${contract.value.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStartRenewal(contract)}
                    className="p-1.5 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors flex items-center gap-1 text-xs"
                    title="Generate renewal draft"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renew</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => archiveContract(contract.id)}
                      className="p-1.5 text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                      title="Archive contract"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="px-3 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
