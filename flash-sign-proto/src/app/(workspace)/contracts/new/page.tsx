'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  Save,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { ContractType, RenewalType } from '@/types/documents';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function CreateContractPage() {
  const router = useRouter();
  const { addContract, documentTemplates, documentItems, projects } = useApp();
  const currentUser = useCurrentUser();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<ContractType>('agreement');
  const [counterparty, setCounterparty] = useState('');
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [description, setDescription] = useState('');

  // Content Selection
  const [contentSource, setContentSource] = useState<'template' | 'document' | 'blank'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [customContent, setCustomContent] = useState('');

  // Commercial Terms
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [renewalType, setRenewalType] = useState<RenewalType>('manual');
  const [contractValue, setContractValue] = useState<string>('25000');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days upon invoice delivery');
  const [specialConditions, setSpecialConditions] = useState('Confidentiality obligations survive 3 years post-termination.');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = 'Contract title is required';
    if (!counterparty.trim()) errs.counterparty = 'Counterparty organization name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const saveContract = (targetStatus: 'draft' | 'pending_review') => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    const newContractId = `CTR-${Math.floor(1000 + Math.random() * 9000)}`;

    addContract({
      id: newContractId,
      title: title.trim(),
      contractType,
      counterparty: counterparty.trim(),
      ownerId: currentUser?.id || 'usr-1',
      ownerName: currentUser?.name || 'Alex Morgan',
      relatedProjectId: relatedProjectId || undefined,
      documentId: contentSource === 'document' ? selectedDocumentId : undefined,
      effectiveDate,
      expiryDate: expiryDate || undefined,
      renewalType,
      value: contractValue ? parseFloat(contractValue) : undefined,
      status: targetStatus,
      description: description.trim() || undefined,
      activity: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          description: `Contract ${targetStatus === 'draft' ? 'draft created' : 'submitted for internal review'}`,
          timestamp: new Date().toISOString(),
          actorName: currentUser?.name || 'Alex Morgan'
        }
      ]
    });

    router.push(`/contracts/${newContractId}`);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Create New Contract</h1>
            <p className="text-sm text-muted">
              Configure contract metadata, terms, and draft content for internal review or signing
            </p>
          </div>
          <Link
            href="/contracts"
            className="text-xs text-muted hover:text-ink font-medium"
          >
            Cancel
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm flex items-center justify-between">
          {[
            { step: 1, label: 'Basic Details' },
            { step: 2, label: 'Contract Content' },
            { step: 3, label: 'Terms & Value' },
            { step: 4, label: 'Review & Submit' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-flash text-ink'
                      : isActive
                      ? 'bg-ink text-paper-elevated'
                      : 'bg-paper text-muted border border-line'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-ink font-bold' : 'text-muted'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-ink">Step 1 — Basic Details</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Contract Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Master Services Agreement 2026 — Acme Global"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-paper border rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash ${
                    errors.title ? 'border-danger' : 'border-line'
                  }`}
                />
                {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Contract Type
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="agreement">General Agreement</option>
                    <option value="sow">Statement of Work (SOW)</option>
                    <option value="nda">Non-Disclosure Agreement (NDA)</option>
                    <option value="msa">Master Services Agreement (MSA)</option>
                    <option value="proposal">Commercial Proposal</option>
                    <option value="specification">Technical Specification</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Counterparty Client Organization *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Health Systems"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-paper border rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash ${
                      errors.counterparty ? 'border-danger' : 'border-line'
                    }`}
                  />
                  {errors.counterparty && <p className="text-xs text-danger mt-1">{errors.counterparty}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Related Project (Optional)
                </label>
                <select
                  value={relatedProjectId}
                  onChange={(e) => setRelatedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                >
                  <option value="">No linked project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Executive Summary / Scope Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context regarding the objectives and key deliverables of this contract..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contract Content */}
        {currentStep === 2 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-ink">Step 2 — Contract Content & Source</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'template', label: 'Use Pre-approved Template', icon: Sparkles },
                { id: 'document', label: 'Attach Existing Document', icon: FileText },
                { id: 'blank', label: 'Custom Content', icon: Layers }
              ].map((src) => {
                const Icon = src.icon;
                const isSelected = contentSource === src.id;

                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setContentSource(src.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-flash bg-flash/10 text-ink shadow-sm'
                        : 'border-line bg-paper text-muted hover:text-ink hover:bg-mist/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-flash-deep' : 'text-muted'}`} />
                    <span className="text-xs font-bold">{src.label}</span>
                  </button>
                );
              })}
            </div>

            {contentSource === 'template' && (
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Select Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {documentTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs ${
                        selectedTemplateId === tmpl.id
                          ? 'border-flash bg-flash/15 font-semibold text-ink'
                          : 'border-line bg-paper hover:bg-mist/30 text-ink-soft'
                      }`}
                    >
                      <div className="font-bold">{tmpl.title}</div>
                      <div className="text-muted text-[11px] line-clamp-1 mt-0.5">{tmpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentSource === 'document' && (
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Select Document to Link
                </label>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                >
                  <option value="">Select a document...</option>
                  {documentItems.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {contentSource === 'blank' && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Custom Agreement Terms
                </label>
                <textarea
                  rows={6}
                  placeholder="Enter bespoke legal articles and clauses..."
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-flash"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Terms & Commercials */}
        {currentStep === 3 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-ink">Step 3 — Commercial Terms & Schedule</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Effective Start Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Contract Value (USD)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Renewal Policy
                </label>
                <select
                  value={renewalType}
                  onChange={(e) => setRenewalType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                >
                  <option value="manual">Manual Renewal</option>
                  <option value="auto_renew">Auto-Renew Annual</option>
                  <option value="one_time">One-time / Non-Renewable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                Special Conditions & Notes
              </label>
              <textarea
                rows={2}
                value={specialConditions}
                onChange={(e) => setSpecialConditions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-ink">Step 4 — Review Contract Details</h3>

            <div className="p-4 bg-paper rounded-xl border border-line space-y-3 text-xs">
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Title:</span>
                <strong className="text-ink text-sm">{title}</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Counterparty:</span>
                <strong className="text-ink">{counterparty}</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Contract Type:</span>
                <strong className="text-ink capitalize">{contractType}</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Contract Value:</span>
                <strong className="text-ink">${parseFloat(contractValue || '0').toLocaleString()}</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Effective Date:</span>
                <strong className="text-ink">{effectiveDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Content Source:</span>
                <strong className="text-ink capitalize">{contentSource}</strong>
              </div>
            </div>

            <div className="p-3 bg-mist/40 border border-line rounded-lg text-xs text-ink-soft">
              💡 <strong>Next Steps:</strong> You can save this contract as a draft to keep editing, submit it to the internal legal review queue, or proceed directly to signature dispatch.
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-paper-elevated border border-line hover:bg-mist/50 text-ink text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2.5">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper-elevated text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => saveContract('draft')}
                  className="px-4 py-2.5 bg-paper-elevated border border-line hover:bg-mist/50 text-ink text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => saveContract('pending_review')}
                  className="px-5 py-2.5 bg-flash hover:bg-flash-deep text-ink text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
