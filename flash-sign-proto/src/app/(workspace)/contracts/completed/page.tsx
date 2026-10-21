'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  Eye,
  FileCheck2
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function CompletedContractsPage() {
  const { contracts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const completedContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'completed' || c.status === 'active');
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return completedContracts.filter(c => {
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
  }, [completedContracts, searchQuery]);

  const handleDownloadDemo = (contract: (typeof contracts)[0]) => {
    const content = `# Executed Contract — ${contract.title}\nID: ${contract.id}\nCounterparty: ${contract.counterparty}\nStatus: Executed (Simulated)\nSigned: ${contract.updatedAt}\n\n[DEMO COPY FOR PROTOTYPE PURPOSES]`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.id}_executed_demo.md`;
    a.click();
    URL.revokeObjectURL(url);
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
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Completed Contracts</h1>
                <p className="text-sm text-muted">
                  Fully executed legal contracts with completed electronic signature packages
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search executed contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredContracts.length} executed agreement{filteredContracts.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Contracts Table */}
        {filteredContracts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No completed contracts found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              When all required signers finish signing a contract, it will be catalogued here.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                        {contract.id}
                      </span>
                      <ContractStatusBadge status={contract.status} />
                      <span className="text-xs text-flash-deep font-semibold bg-flash/10 px-2 py-0.5 rounded border border-flash/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        100% Signatures Recorded
                      </span>
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
                      {contract.value && (
                        <>
                          <span>•</span>
                          <span>Value: <strong className="text-ink-soft">${contract.value.toLocaleString()}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleDownloadDemo(contract)}
                      className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line text-ink-soft text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title="Download executed demo copy"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Demo Copy
                    </button>

                    <Link
                      href={`/contracts/${contract.id}`}
                      className="px-3.5 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Contract
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
