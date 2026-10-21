'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  RefreshCw,
  Eye,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ExpiringContractsPage() {
  const { contracts, addContract } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [rangeFilter, setRangeFilter] = useState<'all' | '30' | '60' | '90' | 'expired'>('all');

  const now = new Date();

  const expiringContractsWithMetrics = useMemo(() => {
    return contracts
      .filter(c => c.status === 'active' || c.status === 'expired')
      .map(c => {
        let daysRemaining: number | null = null;
        let isExpired = false;

        if (c.expiryDate) {
          const exp = new Date(c.expiryDate);
          const diffTime = exp.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining < 0;
        }

        return {
          ...c,
          daysRemaining,
          isExpired
        };
      })
      .filter(c => {
        if (c.daysRemaining === null) return false;
        if (rangeFilter === '30') return c.daysRemaining >= 0 && c.daysRemaining <= 30;
        if (rangeFilter === '60') return c.daysRemaining >= 0 && c.daysRemaining <= 60;
        if (rangeFilter === '90') return c.daysRemaining >= 0 && c.daysRemaining <= 90;
        if (rangeFilter === 'expired') return c.daysRemaining < 0;
        return c.daysRemaining <= 90 || c.daysRemaining < 0;
      })
      .filter(c => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            c.counterparty.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
  }, [contracts, rangeFilter, searchQuery]);

  const handleStartRenewalDraft = (contract: (typeof expiringContractsWithMetrics)[0]) => {
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
      description: `Renewal generated from approaching expiration of contract ${contract.id}`
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
              <div className="w-10 h-10 rounded-xl bg-waiting/15 text-waiting flex items-center justify-center border border-waiting/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Expiring Contracts</h1>
                <p className="text-sm text-muted">
                  Agreements reaching conclusion within 90 days requiring renewal or renegotiation
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contracts/active"
              className="px-4 py-2 bg-paper-elevated border border-line hover:bg-mist/50 text-ink font-semibold rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              Active Contracts
            </Link>
          </div>
        </div>

        {/* Filters and Thresholds */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expiring contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: 'All Upcoming' },
              { id: '30', label: '< 30 Days' },
              { id: '60', label: '< 60 Days' },
              { id: '90', label: '< 90 Days' },
              { id: 'expired', label: 'Expired' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRangeFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  rangeFilter === r.id
                    ? 'bg-ink text-paper-elevated'
                    : 'bg-paper text-muted hover:text-ink hover:bg-mist/50 border border-line'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Expiring Contracts */}
        {expiringContractsWithMetrics.length === 0 ? (
          <div className="bg-paper-elevated border border-line rounded-xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-flash mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No upcoming expirations in selected range</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              Your active contracts have plenty of term remaining or have already been extended.
            </p>
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line">
              {expiringContractsWithMetrics.map((contract) => {
                let badgeClass = 'bg-waiting/15 text-waiting border-waiting/30';
                let label = `${contract.daysRemaining} days remaining`;

                if (contract.isExpired) {
                  badgeClass = 'bg-danger/15 text-danger border-danger/30';
                  label = `Expired (${Math.abs(contract.daysRemaining || 0)}d ago)`;
                } else if ((contract.daysRemaining || 0) <= 30) {
                  badgeClass = 'bg-danger/15 text-danger border-danger/30';
                }

                return (
                  <div
                    key={contract.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-mist/20 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-medium text-muted bg-paper px-2 py-0.5 rounded border border-line">
                          {contract.id}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {label}
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
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted" />
                          Expiration: <strong>{contract.expiryDate}</strong>
                        </span>
                        <span>•</span>
                        <span>Policy: <strong className="text-ink-soft capitalize">{contract.renewalType || 'Manual'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleStartRenewalDraft(contract)}
                        className="px-3.5 py-2 bg-flash hover:bg-flash-deep text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Create Renewal Draft
                      </button>

                      <Link
                        href={`/contracts/${contract.id}`}
                        className="px-3 py-2 bg-ink hover:bg-ink-soft text-paper-elevated text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
