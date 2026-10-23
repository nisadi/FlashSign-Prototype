'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  FileText,
  Users,
  PenTool,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Send,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import { SignatureSigner, SignatureField, SigningOrder, ReminderFrequency } from '@/types/documents';
import { REMINDER_OPTIONS, EXPIRY_PRESETS, reminderIntervalDays } from '@/lib/signing-options';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

interface SignerForm {
  id: string;
  name: string;
  email: string;
  role: string;
  order: number;
  required: boolean;
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedContractId = searchParams?.get('contractId') || '';
  const preselectedDocId = searchParams?.get('documentId') || '';

  const {
    documentItems,
    contracts,
    addSignatureRequest,
    updateContract,
    signingDefaults
  } = useApp();
  const currentUser = useCurrentUser();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Document Selection
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId);
  const [selectedContractId, setSelectedContractId] = useState(preselectedContractId);
  const [requestTitle, setRequestTitle] = useState('');

  // Step 2: Signers
  const [signingOrder, setSigningOrder] = useState<SigningOrder>(signingDefaults.signingOrder);
  const [signers, setSigners] = useState<SignerForm[]>([
    {
      id: 'sig-1',
      name: currentUser?.name || 'Alex Morgan',
      email: currentUser?.email || 'alex@flashsign.com',
      role: 'Internal Approver',
      order: 1,
      required: true
    },
    {
      id: 'sig-2',
      name: 'Sarah Chen',
      email: 'schen@clientpartner.com',
      role: 'Client Authorized Signatory',
      order: 2,
      required: true
    }
  ]);

  // Step 3: Fields
  const [fields, setFields] = useState<SignatureField[]>([
    {
      id: 'f-1',
      type: 'signature',
      signerId: 'sig-1',
      pageNumber: 1,
      positionX: 50,
      positionY: 80,
      width: 180,
      height: 48,
      required: true
    },
    {
      id: 'f-2',
      type: 'date',
      signerId: 'sig-1',
      pageNumber: 1,
      positionX: 250,
      positionY: 80,
      width: 140,
      height: 40,
      required: true
    },
    {
      id: 'f-3',
      type: 'signature',
      signerId: 'sig-2',
      pageNumber: 1,
      positionX: 50,
      positionY: 88,
      width: 180,
      height: 48,
      required: true
    },
    {
      id: 'f-4',
      type: 'date',
      signerId: 'sig-2',
      pageNumber: 1,
      positionX: 250,
      positionY: 88,
      width: 140,
      height: 40,
      required: true
    }
  ]);

  // Step 4: Settings & Message
  const [message, setMessage] = useState(signingDefaults.message);
  const [expiresInDays, setExpiresInDays] = useState(signingDefaults.expireDays);
  const [reminderSchedule, setReminderSchedule] = useState<ReminderFrequency>(signingDefaults.reminderFrequency);

  // Start from Agreements > Settings; the saved values arrive once the store has loaded
  const [defaultsApplied, setDefaultsApplied] = useState(signingDefaults);
  if (defaultsApplied !== signingDefaults) {
    setDefaultsApplied(signingDefaults);
    setSigningOrder(signingDefaults.signingOrder);
    setMessage(signingDefaults.message);
    setExpiresInDays(signingDefaults.expireDays);
    setReminderSchedule(signingDefaults.reminderFrequency);
  }

  // Pre-fill title if contract or document is selected
  useEffect(() => {
    if (preselectedContractId) {
      const c = contracts.find(item => item.id === preselectedContractId);
      if (c) {
        setRequestTitle(`Signature Request: ${c.title}`);
        setSelectedContractId(c.id);
        if (c.documentId) setSelectedDocId(c.documentId);
      }
    } else if (preselectedDocId) {
      const d = documentItems.find(item => item.id === preselectedDocId);
      if (d) {
        setRequestTitle(`Signature Request: ${d.title}`);
        setSelectedDocId(d.id);
      }
    }
  }, [preselectedContractId, preselectedDocId, contracts, documentItems]);

  const selectedDocument = documentItems.find(d => d.id === selectedDocId);
  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // Signer management
  const addSigner = () => {
    const newId = `sig-${Date.now()}`;
    setSigners(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        email: '',
        role: 'Signer',
        order: prev.length + 1,
        required: true
      }
    ]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) return;
    setSigners(prev => prev.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
    setFields(prev => prev.filter(f => f.signerId !== id));
  };

  const moveSigner = (index: number, direction: 'up' | 'down') => {
    const newSigners = [...signers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSigners.length) return;
    const temp = newSigners[index];
    newSigners[index] = newSigners[targetIdx];
    newSigners[targetIdx] = temp;
    setSigners(newSigners.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const updateSignerField = (id: string, field: keyof SignerForm, val: any) => {
    setSigners(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  // Step validation
  const validateStep1 = () => {
    if (!requestTitle.trim()) {
      if (selectedDocument) setRequestTitle(`Signature Package: ${selectedDocument.title}`);
      else if (selectedContract) setRequestTitle(`Signature Package: ${selectedContract.title}`);
      else setRequestTitle('New Digital Signature Package');
    }
    return true;
  };

  const validateStep2 = () => {
    return signers.every(s => s.name.trim() !== '' && s.email.trim() !== '');
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) {
      alert('Please provide valid names and email addresses for all signers.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Final Dispatch
  const handleSendRequest = () => {
    const newReqId = `SIG-${Math.floor(1000 + Math.random() * 9000)}`;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiresInDays);

    const convertedSigners: SignatureSigner[] = signers.map((s, i) => ({
      id: s.id,
      name: s.name.trim(),
      email: s.email.trim(),
      role: s.role,
      order: s.order,
      required: s.required,
      color: '#00c2a8',
      status: signingOrder === 'sequential' && i > 0 ? 'waiting' : 'pending'
    }));

    addSignatureRequest({
      id: newReqId,
      title: requestTitle.trim() || 'Electronic Signature Package',
      documentId: selectedDocId || '',
      contractId: selectedContractId || undefined,
      senderId: currentUser?.id || 'usr-1',
      senderName: currentUser?.name || 'Alex Morgan',
      signingOrder,
      status: 'sent',
      message: message.trim(),
      expiresAt: expDate.toISOString(),
      reminderIntervalDays: reminderIntervalDays(reminderSchedule),
      signers: convertedSigners,
      fields: fields,
      events: [
        {
          id: `ev-${Date.now()}`,
          name: 'Request Sent',
          eventName: 'Request Sent',
          description: `Simulated electronic signature request sent to ${signers.length} signers`,
          actorName: currentUser?.name || 'Alex Morgan',
          timestamp: new Date().toISOString(),
          category: 'delivery'
        }
      ]
    });

    if (selectedContractId) {
      updateContract(selectedContractId, {
        status: 'awaiting_signature',
        signatureRequestId: newReqId
      });
    }

    router.push(`/signatures/${newReqId}`);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Request Signature</h1>
            <p className="text-sm text-muted">
              Prepare a digital signing package, configure signer workflows, and dispatch
            </p>
          </div>
          <Link
            href="/signatures"
            className="text-xs text-muted hover:text-ink font-medium"
          >
            Cancel
          </Link>
        </div>

        {/* Wizard Steps */}
        <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm flex items-center justify-between overflow-x-auto">
          {[
            { step: 1, label: 'Document' },
            { step: 2, label: 'Signers' },
            { step: 3, label: 'Fields' },
            { step: 4, label: 'Settings' },
            { step: 5, label: 'Review & Dispatch' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
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

        {/* Step 1: Select Document */}
        {currentStep === 1 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-ink">Step 1 — Select Document or Contract</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Package Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement 2026 — Execution Copy"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Link Existing Document
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="">Choose a document...</option>
                    {documentItems.map(d => (
                      <option key={d.id} value={d.id}>{d.title} ({d.type.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Link Contract Record
                  </label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                  >
                    <option value="">Choose a contract...</option>
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDocument && (
                <div className="p-4 bg-paper rounded-xl border border-line flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-flash-deep" />
                    <div>
                      <h4 className="font-bold text-sm text-ink">{selectedDocument.title}</h4>
                      <p className="text-xs text-muted">Version {selectedDocument.currentVersion || (selectedDocument.versions?.length || 1)} • {selectedDocument.ownerName || 'Alex Morgan'}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-mist px-2.5 py-1 rounded text-ink font-semibold">Attached</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Add Signers & Ordering */}
        {currentStep === 2 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Step 2 — Add Signers & Execution Order</h3>
                <p className="text-xs text-muted">Define who must sign this package and in what sequence</p>
              </div>

              {/* Signing Order Toggle */}
              <div className="flex items-center gap-2 bg-paper p-1 rounded-lg border border-line text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSigningOrder('sequential')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    signingOrder === 'sequential' ? 'bg-ink text-paper-elevated' : 'text-muted hover:text-ink'
                  }`}
                >
                  Sequential (1 → 2 → 3)
                </button>
                <button
                  type="button"
                  onClick={() => setSigningOrder('parallel')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    signingOrder === 'parallel' ? 'bg-ink text-paper-elevated' : 'text-muted hover:text-ink'
                  }`}
                >
                  Parallel (All at once)
                </button>
              </div>
            </div>

            {/* Signers List */}
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div
                  key={signer.id}
                  className="p-4 bg-paper rounded-xl border border-line flex flex-col md:flex-row md:items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-6 h-6 rounded-full bg-mist text-ink-soft text-xs font-bold flex items-center justify-center shrink-0">
                      {signer.order}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Signer Full Name"
                        value={signer.name}
                        onChange={(e) => updateSignerField(signer.id, 'name', e.target.value)}
                        className="px-3 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-flash"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={signer.email}
                        onChange={(e) => updateSignerField(signer.id, 'email', e.target.value)}
                        className="px-3 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-flash"
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={signer.role}
                        onChange={(e) => updateSignerField(signer.id, 'role', e.target.value)}
                        className="px-3 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-flash"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {signingOrder === 'sequential' && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveSigner(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-muted hover:text-ink disabled:opacity-30 rounded hover:bg-mist/50 transition-colors"
                          title="Move up"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSigner(index, 'down')}
                          disabled={index === signers.length - 1}
                          className="p-1.5 text-muted hover:text-ink disabled:opacity-30 rounded hover:bg-mist/50 transition-colors"
                          title="Move down"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => removeSigner(signer.id)}
                      disabled={signers.length <= 1}
                      className="p-1.5 text-muted hover:text-danger disabled:opacity-30 rounded hover:bg-danger/10 transition-colors"
                      title="Remove signer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addSigner}
                className="w-full py-2.5 border border-dashed border-line hover:border-flash/60 bg-paper-elevated hover:bg-flash/5 rounded-xl text-xs font-semibold text-ink-soft transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Another Signer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fields Configuration */}
        {currentStep === 3 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-ink">Step 3 — Signature Fields</h3>
              <p className="text-xs text-muted">Preview configured input fields assigned to each participant</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {signers.map(s => {
                const signerFields = fields.filter(f => f.signerId === s.id);

                return (
                  <div key={s.id} className="p-4 bg-paper rounded-xl border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-ink block">{s.name || 'Unnamed Signer'}</strong>
                        <span className="text-[11px] text-muted">{s.email}</span>
                      </div>
                      <span className="text-[10px] bg-flash/20 text-flash-deep font-bold px-2 py-0.5 rounded-full">
                        {signerFields.length} Fields
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-ink-soft pt-2 border-t border-line">
                      <div className="flex items-center justify-between">
                        <span>Signature Field:</span>
                        <span className="text-flash-deep font-semibold">Configured</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Date Signed Field:</span>
                        <span className="text-flash-deep font-semibold">Configured</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-mist/40 border border-line rounded-lg text-xs text-muted flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-flash-deep shrink-0" />
              <span>
                Standard signature blocks and execution date fields have been automatically staged for all selected participants.
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Settings & Expiration */}
        {currentStep === 4 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-ink">Step 4 — Dispatch Settings & Notifications</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Message to Signers
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Package Expiration
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                  >
                    {[...new Set([...EXPIRY_PRESETS, expiresInDays])].sort((a, b) => a - b).map(days => (
                      <option key={days} value={days}>
                        Expires in {days} days{days === signingDefaults.expireDays ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Remind Signers
                  </label>
                  <select
                    value={reminderSchedule}
                    onChange={(e) => setReminderSchedule(e.target.value as ReminderFrequency)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                  >
                    {REMINDER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}{o.value === signingDefaults.reminderFrequency ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Dispatch */}
        {currentStep === 5 && (
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-ink">Step 5 — Review & Send Request</h3>

            <div className="p-4 bg-paper rounded-xl border border-line space-y-3 text-xs">
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Package Title:</span>
                <strong className="text-ink text-sm">{requestTitle}</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Workflow Mode:</span>
                <strong className="text-ink capitalize">{signingOrder} signing</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Total Signers:</span>
                <strong className="text-ink">{signers.length} participants</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Expiration Window:</span>
                <strong className="text-ink">{expiresInDays} days</strong>
              </div>
              <div className="flex justify-between border-b border-line pb-2">
                <span className="text-muted">Reminders:</span>
                <strong className="text-ink">{REMINDER_OPTIONS.find(o => o.value === reminderSchedule)?.label}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Message to Recipients:</span>
                <span className="text-ink font-medium truncate max-w-xs">{message}</span>
              </div>
            </div>

            <div className="p-4 bg-flash/10 border border-flash/30 rounded-xl text-xs text-ink-soft space-y-1">
              <span className="font-bold text-flash-deep block">🚀 Ready to Dispatch (Simulated)</span>
              <p>
                Sending will record this request in local state, transition linked contracts to &quot;Awaiting Signature&quot;, and enable interactive demo signing.
              </p>
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

          <div>
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper-elevated text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendRequest}
                className="px-6 py-2.5 bg-flash hover:bg-flash-deep text-ink text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                Dispatch Signature Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestSignatureWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading wizard...</div>}>
      <WizardContent />
    </Suspense>
  );
}
