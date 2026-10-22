'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PenTool, Search, Eye, Send, Building2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function AwaitingSignatureContractsPage() {
  const { contracts, signatureRequests } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const awaitingContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'awaiting_signature');
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    return awaitingContracts.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.counterparty.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [awaitingContracts, searchQuery]);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-waiting/10 text-waiting flex items-center justify-center border border-waiting/20">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Awaiting Signature</h1>
                <p className="text-sm text-muted">
                  Approved contracts that are out for signature or ready to be sent
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
              placeholder="Search contracts awaiting signature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>
          <div className="text-xs text-muted font-medium">
            {filteredContracts.length} contract{filteredContracts.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Contract Cards */}
        {filteredContracts.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <PenTool className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No contracts awaiting signature</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Contracts move here once their review is approved, and become Active when every signer has signed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => {
              const request = contract.signatureRequestId
                ? signatureRequests.find(s => s.id === contract.signatureRequestId)
                : undefined;
              const signedCount = request?.signers.filter(s => s.status === 'signed').length ?? 0;
              const totalSigners = request?.signers.length ?? 0;
              const value = contract.contractValue ?? contract.value;

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

                    <div className="mt-4 pt-3 border-t border-line/60 space-y-2 text-xs text-muted">
                      {request ? (
                        <>
                          <div className="flex justify-between">
                            <span>Signatures:</span>
                            <strong className="text-ink-soft">{signedCount} of {totalSigners} signed</strong>
                          </div>
                          <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                            <div
                              className="h-full rounded-full bg-flash"
                              style={{ width: `${totalSigners ? (signedCount / totalSigners) * 100 : 0}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span>Signatures:</span>
                          <strong className="text-waiting">Not sent yet</strong>
                        </div>
                      )}
                      {value !== undefined && (
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <strong className="text-ink-soft">${value.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
                    {request ? (
                      <Link
                        href={`/signatures/${request.id}`}
                        className="p-1.5 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors flex items-center gap-1 text-xs"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Signing Progress</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/signatures/new?contractId=${contract.id}${contract.documentId ? `&documentId=${contract.documentId}` : ''}`}
                        className="p-1.5 bg-paper hover:bg-mist/50 text-muted hover:text-ink rounded-lg border border-line transition-colors flex items-center gap-1 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Signature</span>
                      </Link>
                    )}

                    <Link
                      href={`/contracts/${contract.id}`}
                      className="px-3 py-1.5 bg-ink hover:bg-ink-soft text-paper-elevated font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
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
