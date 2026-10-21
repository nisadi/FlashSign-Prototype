'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Download,
  Copy,
  Archive,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  Edit3,
  ExternalLink,
  ChevronRight,
  FileCheck2,
  Layers
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import {
  ContractStatusBadge,
  SignatureRequestStatusBadge,
  SignerStatusBadge
} from '@/components/documents/document-badges';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function ContractDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.contractId as string;

  const {
    contracts,
    documentItems,
    signatureRequests,
    submitContractForReview,
    markContractReviewed,
    archiveContract,
    addContractReviewComment
  } = useApp();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'overview' | 'document' | 'parties' | 'review' | 'signature' | 'audit'>('overview');
  const [commentText, setCommentText] = useState('');

  const contract = useMemo(() => {
    return contracts.find(c => c.id === contractId);
  }, [contracts, contractId]);

  const linkedDocument = useMemo(() => {
    if (!contract?.documentId) return null;
    return documentItems.find(d => d.id === contract.documentId);
  }, [contract, documentItems]);

  const linkedSignatureRequest = useMemo(() => {
    if (!contract?.signatureRequestId) return null;
    return signatureRequests.find(s => s.id === contract.signatureRequestId);
  }, [contract, signatureRequests]);

  if (!contract) {
    return (
      <div className="min-h-full bg-paper p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <FileText className="w-12 h-12 text-muted/50 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-ink">Contract Not Found</h2>
          <p className="text-sm text-muted mt-1">The contract {contractId} could not be located in local state.</p>
          <div className="mt-4">
            <Link
              href="/contracts/all"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper-elevated rounded-lg text-sm font-semibold hover:bg-ink-soft transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Contracts Registry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadDemo = () => {
    const content = `# ${contract.title}\n\nContract ID: ${contract.id}\nCounterparty: ${contract.counterparty}\nStatus: ${contract.status}\nEffective Date: ${contract.effectiveDate || 'N/A'}\nExpiry Date: ${contract.expiryDate || 'N/A'}\nValue: $${(contract.value || 0).toLocaleString()}\n\n---\n\n${linkedDocument?.content || contract.description || 'Simulated contract content'}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.id}_${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_demo.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addContractReviewComment(contract.id, {
      authorId: currentUser?.id || 'usr-1',
      authorName: currentUser?.name || 'Alex Morgan',
      content: commentText.trim()
    });
    setCommentText('');
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/contracts" className="hover:text-ink transition-colors">Contracts</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/contracts/all" className="hover:text-ink transition-colors">All Contracts</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono text-ink-soft">{contract.id}</span>
          </div>

          <Link
            href="/contracts/all"
            className="text-xs text-muted hover:text-ink flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Registry
          </Link>
        </div>

        {/* Contract Header Banner */}
        <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 bg-paper rounded border border-line text-ink-soft">
                  {contract.id}
                </span>
                <ContractStatusBadge status={contract.status} />
                <span className="text-xs px-2.5 py-0.5 bg-mist/60 rounded text-ink-soft capitalize font-medium">
                  {contract.contractType.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-ink">
                {contract.title}
              </h1>

              <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-ink-soft">
                  <Building2 className="w-4 h-4 text-muted" />
                  {contract.counterparty}
                </span>
                <span>•</span>
                <span>Owner: <strong className="text-ink-soft">{contract.ownerName}</strong></span>
                {contract.effectiveDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      Effective: {contract.effectiveDate}
                    </span>
                  </>
                )}
                {contract.expiryDate && (
                  <>
                    <span>•</span>
                    <span>Expires: {contract.expiryDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {contract.status === 'draft' && (
                <button
                  onClick={() => submitContractForReview(contract.id)}
                  className="px-3.5 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit for Review
                </button>
              )}

              {contract.status === 'pending_review' && (
                <button
                  onClick={() => markContractReviewed(contract.id)}
                  className="px-3.5 py-2 bg-flash hover:bg-flash-deep text-ink font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Review
                </button>
              )}

              {(contract.status === 'pending_review' || contract.status === 'draft' || contract.status === 'awaiting_signature') && (
                <Link
                  href={`/signatures/new?contractId=${contract.id}${contract.documentId ? `&documentId=${contract.documentId}` : ''}`}
                  className="px-3.5 py-2 bg-ink hover:bg-ink-soft text-paper-elevated font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-flash" />
                  Request Signature
                </Link>
              )}

              <button
                onClick={handleDownloadDemo}
                className="px-3 py-2 bg-paper hover:bg-mist/50 border border-line rounded-lg text-xs font-semibold text-ink-soft transition-colors flex items-center gap-1.5"
                title="Download demo markdown document"
              >
                <Download className="w-3.5 h-3.5" />
                Demo Export
              </button>

              <button
                onClick={() => archiveContract(contract.id)}
                className="px-3 py-2 bg-paper hover:bg-mist/50 border border-line rounded-lg text-xs font-semibold text-muted hover:text-danger transition-colors flex items-center gap-1.5"
                title="Archive contract"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-line mt-6 pt-4 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'document', label: 'Contract Document' },
              { id: 'parties', label: 'Parties & Signers' },
              { id: 'review', label: `Review & Comments (${contract.reviewComments?.length || 0})` },
              { id: 'signature', label: 'Signature Progress' },
              { id: 'audit', label: 'Audit Trail' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ink text-paper-elevated'
                    : 'text-muted hover:text-ink hover:bg-mist/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-ink text-base">Contract Overview</h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {contract.description || 'This is a simulated contract agreement record for demonstration purposes in Flash Sign.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-line">
                  <div>
                    <span className="text-xs text-muted block">Contract Value</span>
                    <span className="text-lg font-bold text-ink">
                      {contract.value ? `$${contract.value.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Renewal Policy</span>
                    <span className="text-sm font-semibold text-ink-soft capitalize">
                      {contract.renewalType || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Internal Reviewer</span>
                    <span className="text-sm font-semibold text-ink-soft">
                      {contract.reviewerName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Document Card */}
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-ink text-base mb-3">Linked Document</h3>
                {linkedDocument ? (
                  <div className="p-4 bg-paper rounded-lg border border-line flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-mist flex items-center justify-center text-flash-deep shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink text-sm">{linkedDocument.title}</h4>
                        <p className="text-xs text-muted">Version {linkedDocument.currentVersion} • {linkedDocument.fileSize || 'Text record'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/documents/${linkedDocument.id}`}
                        className="px-3 py-1.5 bg-ink text-paper-elevated text-xs font-semibold rounded-lg hover:bg-ink-soft transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Document
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No specific document record attached.</p>
                )}
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Counterparty & Key Contacts */}
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-ink text-sm uppercase tracking-wider text-muted">Counterparty</h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-flash/10 text-flash flex items-center justify-center font-bold text-base shrink-0 border border-flash/20">
                    {contract.counterparty.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-ink text-sm">{contract.counterparty}</h4>
                    <p className="text-xs text-muted">Primary Client Counterparty</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-line space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Agreement Status:</span>
                    <strong className="text-ink-soft capitalize">{contract.status.replace('_', ' ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Effective Date:</span>
                    <strong className="text-ink-soft">{contract.effectiveDate || 'Pending'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Expiration Date:</span>
                    <strong className="text-ink-soft">{contract.expiryDate || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Linked Signature Workflow */}
              <div className="bg-paper-elevated border border-line rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-ink text-sm uppercase tracking-wider text-muted">E-Signature Link</h3>
                {linkedSignatureRequest ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted">{linkedSignatureRequest.id}</span>
                      <SignatureRequestStatusBadge status={linkedSignatureRequest.status} />
                    </div>
                    <p className="text-xs text-ink-soft font-medium">{linkedSignatureRequest.title}</p>
                    <Link
                      href={`/signatures/${linkedSignatureRequest.id}`}
                      className="w-full py-2 bg-flash/20 hover:bg-flash/30 text-flash-deep text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-flash/30"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Signature Progress
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-xs text-muted">No signature request has been dispatched yet for this contract.</p>
                    <Link
                      href={`/signatures/new?contractId=${contract.id}${contract.documentId ? `&documentId=${contract.documentId}` : ''}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-flash text-ink text-xs font-semibold rounded-lg hover:bg-flash-deep transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Initiate Signing
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document Preview */}
        {activeTab === 'document' && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-bold text-ink text-lg">{contract.title}</h3>
                <p className="text-xs text-muted">Rendered contract preview content</p>
              </div>
              <button
                onClick={handleDownloadDemo}
                className="px-3 py-1.5 bg-paper hover:bg-mist/50 border border-line rounded-lg text-xs font-semibold text-ink transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Content
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-ink bg-paper p-6 rounded-xl border border-line/70 font-mono whitespace-pre-wrap leading-relaxed text-xs">
              {linkedDocument?.content || `
# ${contract.title}
CONTRACT IDENTIFIER: ${contract.id}
COUNTERPARTY: ${contract.counterparty}
EFFECTIVE DATE: ${contract.effectiveDate || 'UPON EXECUTION'}
EXPIRY DATE: ${contract.expiryDate || 'ONE YEAR FROM EFFECTIVE DATE'}

1. PREAMBLE
This Agreement is entered into by and between Flash Sign Inc. ("Company") and ${contract.counterparty} ("Counterparty").

2. SCOPE & COMMERCIAL TERMS
Total Contract Value: $${(contract.value || 0).toLocaleString()}
Contract Type: ${contract.contractType}
Renewal Terms: ${contract.renewalType || 'Manual Renewal'}

3. CONDITIONS
The parties agree to execute all commitments as detailed in associated project statements of work.

[DEMO PREVIEW ONLY - NOT A LEGALLY BINDING INSTRUMENT]
              `.trim()}
            </div>
          </div>
        )}

        {/* Tab 3: Parties & Signers */}
        {activeTab === 'parties' && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-ink text-base">Contract Parties & Stakeholders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-paper rounded-xl border border-line space-y-2">
                <span className="text-xs uppercase font-bold text-flash-deep">Internal Organization</span>
                <h4 className="font-bold text-ink text-base">Flash Sign Inc.</h4>
                <p className="text-xs text-muted">Primary Provider</p>
                <div className="text-xs text-ink-soft pt-2 border-t border-line">
                  Owner: <strong>{contract.ownerName}</strong>
                </div>
              </div>

              <div className="p-4 bg-paper rounded-xl border border-line space-y-2">
                <span className="text-xs uppercase font-bold text-muted">Client Counterparty</span>
                <h4 className="font-bold text-ink text-base">{contract.counterparty}</h4>
                <p className="text-xs text-muted">Authorized Counterparty</p>
                <div className="text-xs text-ink-soft pt-2 border-t border-line">
                  Status: <strong>Authorized for Signature</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Review Comments */}
        {activeTab === 'review' && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink text-base">Internal Review & Comments</h3>
                <p className="text-xs text-muted">Legal, financial, and operational review feedback</p>
              </div>
            </div>

            {(!contract.reviewComments || contract.reviewComments.length === 0) ? (
              <div className="p-8 text-center bg-paper rounded-xl border border-line">
                <MessageSquare className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                <p className="text-xs text-muted">No review comments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contract.reviewComments.map((c) => (
                  <div key={c.id} className="p-4 bg-paper rounded-xl border border-line space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-ink-soft">{c.authorName}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-ink">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Post comment input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add review feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 px-3 py-2 bg-paper border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-ink text-paper-elevated text-xs font-semibold rounded-lg hover:bg-ink-soft transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Post Comment
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Signature Progress */}
        {activeTab === 'signature' && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-ink text-base">Electronic Signature Progress</h3>
            {linkedSignatureRequest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-paper rounded-xl border border-line">
                  <div>
                    <h4 className="font-semibold text-ink text-sm">{linkedSignatureRequest.title}</h4>
                    <p className="text-xs text-muted">Dispatched {new Date(linkedSignatureRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SignatureRequestStatusBadge status={linkedSignatureRequest.status} />
                    <Link
                      href={`/signatures/${linkedSignatureRequest.id}`}
                      className="px-3 py-1.5 bg-flash hover:bg-flash-deep text-ink text-xs font-semibold rounded-lg transition-colors"
                    >
                      Open Signature Package
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-line bg-paper rounded-xl border border-line p-4 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted">Signers Execution Status</h5>
                  {linkedSignatureRequest.signers.map((signer) => (
                    <div key={signer.id} className="pt-3 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-ink">{signer.name}</strong>
                        <span className="text-muted ml-2">({signer.email})</span>
                      </div>
                      <SignerStatusBadge status={signer.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-paper rounded-xl border border-line space-y-3">
                <FileCheck2 className="w-10 h-10 text-muted/40 mx-auto" />
                <h4 className="text-sm font-semibold text-ink">No Signature Request Linked</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Send this contract for digital signing with automated sequential or parallel signer workflows.
                </p>
                <Link
                  href={`/signatures/new?contractId=${contract.id}${contract.documentId ? `&documentId=${contract.documentId}` : ''}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-flash text-ink text-xs font-semibold rounded-lg hover:bg-flash-deep transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Request Signature Now
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-ink text-base">Contract Audit Trail (Demo Simulation)</h3>
              <span className="text-xs text-muted">Mock Event Log</span>
            </div>

            <div className="space-y-3">
              {(contract.activity || [
                { id: 'act-1', type: 'created', description: 'Contract record initialized', timestamp: contract.createdAt, actorName: contract.ownerName }
              ]).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-flash mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-ink-soft">{act.actorName}</span>{' '}
                    <span className="text-ink">{act.description}</span>
                  </div>
                  <span className="text-muted shrink-0">{new Date(act.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
