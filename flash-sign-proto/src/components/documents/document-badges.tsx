'use client';

import React from 'react';
import {
  FileText,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  FileCode,
  FileSpreadsheet,
  FileQuestion,
  ScrollText,
  Send,
  Eye,
  CheckCheck
} from 'lucide-react';
import {
  DocumentStatus,
  DocumentType,
  ContractStatus,
  ContractType,
  SignatureRequestStatus,
  SignatureSignerStatus
} from '@/types/documents';

// ── Document Status Badge ───────────────────────────────────────────────────
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'signed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Pending Signature
        </span>
      );
    case 'in_review':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          <Eye className="w-3 h-3 text-sky-600" /> In Review
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
          <CheckCheck className="w-3 h-3 text-teal-600" /> Approved
        </span>
      );
    case 'shared':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Send className="w-3 h-3 text-indigo-600" /> Shared
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Rejected
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Archived
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
  }
}

// ── Document Type Badge / Icon ──────────────────────────────────────────────
export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  const map: Record<DocumentType, { label: string; color: string }> = {
    pdf: { label: 'PDF', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    docx: { label: 'Word DOCX', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    agreement: { label: 'Agreement', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    sow: { label: 'SOW', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    msa: { label: 'Master Contract', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    proposal: { label: 'Proposal', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    nda: { label: 'NDA', color: 'bg-teal-50 text-teal-800 border-teal-200' },
    spec: { label: 'Tech Spec', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    contract: { label: 'Contract', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    other: { label: 'Document', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  };
  const item = map[type] || map.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${item.color}`}>
      {item.label}
    </span>
  );
}

// ── Contract Status Badge ───────────────────────────────────────────────────
export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case 'awaiting_signature':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Awaiting Signature
        </span>
      );
    case 'pending_review':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          Pending Review
        </span>
      );
    case 'expiring':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Expiring Soon
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          <CheckCheck className="w-3.5 h-3.5 text-slate-600" />
          Completed
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Archived
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
  }
}

// ── Signature Request Status Badge ──────────────────────────────────────────
export function SignatureRequestStatusBadge({ status }: { status: SignatureRequestStatus }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Send className="w-3.5 h-3.5 text-blue-600" />
          Sent
        </span>
      );
    case 'viewed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          Viewed
        </span>
      );
    case 'partially_signed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Partially Signed
        </span>
      );
    case 'declined':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Declined
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          Expired
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Cancelled
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
  }
}

// ── Signer Status Badge ─────────────────────────────────────────────────────
export function SignerStatusBadge({ status }: { status: SignatureSignerStatus }) {
  switch (status) {
    case 'signed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed
        </span>
      );
    case 'viewed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          <Eye className="w-3 h-3 text-indigo-600" /> Viewed
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Action Required
        </span>
      );
    case 'waiting':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Waiting for Turn
        </span>
      );
    case 'declined':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Declined
        </span>
      );
  }
}
