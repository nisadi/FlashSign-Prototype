'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  Archive,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  FileSignature
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ContractStatusBadge } from '@/components/documents/document-badges';
import { Contract, ContractStatus, ContractType } from '@/types/documents';

export default function AllContractsPage() {
  const { contracts, users, projects, archiveContract, deleteContract } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'title'>('date');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredContracts = useMemo(() => {
    return contracts
      .filter(c => {
        if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
        if (selectedType !== 'all' && c.contractType !== selectedType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = c.title.toLowerCase().includes(q);
          const matchesClient = c.counterparty.toLowerCase().includes(q);
          if (!matchesTitle && !matchesClient) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'value') return (b.contractValue || 0) - (a.contractValue || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [contracts, selectedStatus, selectedType, searchQuery, sortBy]);

  const handleExportCSV = () => {
    const headers = 'Contract ID,Title,Type,Counterparty,Value,Status,Effective Date,Expiry Date\n';
    const rows = filteredContracts
      .map(
        c =>
          `"${c.id}","${c.title}","${c.contractType}","${c.counterparty}","$${c.contractValue || 0}","${c.status}","${c.effectiveDate}","${c.expiryDate}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FlashSign_Contracts_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Contracts registry exported as CSV.');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-flash" />
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1 font-medium">
              <Link href="/contracts" className="hover:text-ink transition-colors">Contracts</Link>
              <span>/</span>
              <span className="text-ink font-semibold">Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-flash-deep" />
              Contract Registry ({contracts.length})
            </h1>
            <p className="text-sm text-muted mt-1">
              Complete catalog of customer MSAs, vendor agreements, and bilateral legal covenants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-paper text-ink transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-muted" /> Export CSV
            </button>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Contract
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white border border-line/70 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by contract title, client, counterparty..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-flash"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none"
              >
                <option value="date">Sort: Recently Updated</option>
                <option value="value">Sort: Contract Value (High to Low)</option>
                <option value="title">Sort: Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40 text-xs">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="awaiting_signature">Awaiting Signature</option>
              <option value="pending_review">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="expiring">Expiring</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-flash"
            >
              <option value="all">All Types</option>
              <option value="master_services_agreement">MSA</option>
              <option value="statement_of_work">Statement of Work</option>
              <option value="non_disclosure_agreement">NDA</option>
              <option value="software_license">Software License</option>
              <option value="service_level_agreement">SLA</option>
              <option value="vendor_contract">Vendor Agreement</option>
              <option value="change_request">Change Request</option>
            </select>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white border border-line/70 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-paper/70 border-b border-line text-xs font-semibold text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 w-72">Contract Name</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Contract Value</th>
                  <th className="py-3 px-3">Effective Date</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      No contracts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(c => {
                    const owner = users.find(u => u.id === c.ownerId);
                    return (
                      <tr key={c.id} className="hover:bg-paper/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/contracts/${c.id}`}
                            className="font-bold text-ink hover:text-flash-deep text-xs block"
                          >
                            {c.title}
                          </Link>
                          <span className="text-[10px] text-muted font-mono">{c.id}</span>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-ink-soft">
                          {c.counterparty}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-mist/60 text-ink-soft border border-line">
                            {c.contractType.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <ContractStatusBadge status={c.status} />
                        </td>

                        <td className="py-3.5 px-3 font-bold text-ink font-mono">
                          {c.contractValue ? `$${c.contractValue.toLocaleString()}` : '—'}
                        </td>

                        <td className="py-3.5 px-3 text-muted font-mono text-[11px]">
                          {c.effectiveDate}
                        </td>

                        <td className="py-3.5 px-3 text-muted font-mono text-[11px]">
                          {c.expiryDate}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/contracts/${c.id}`}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-paper border border-line text-ink hover:bg-mist/30"
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm(`Archive contract "${c.title}"?`)) {
                                  archiveContract(c.id);
                                  showToast('Contract archived.');
                                }
                              }}
                              className="p-1 hover:bg-paper rounded text-muted hover:text-ink"
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete contract record "${c.title}"?`)) {
                                  deleteContract(c.id);
                                  showToast('Contract deleted.');
                                }
                              }}
                              className="p-1 hover:bg-rose-50 rounded text-muted hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
