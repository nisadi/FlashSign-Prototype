'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  PenTool,
  Calendar,
  Type,
  CheckSquare,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { SignatureField, SignatureFieldType } from '@/types/documents';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SignatureFieldPlacementPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const { signatureRequests, updateSignatureFields, documentItems } = useApp();

  const request = useMemo(() => {
    return signatureRequests.find(r => r.id === requestId);
  }, [signatureRequests, requestId]);

  const linkedDoc = useMemo(() => {
    if (!request?.documentId) return null;
    return documentItems.find(d => d.id === request.documentId);
  }, [request, documentItems]);

  const [activeSignerId, setActiveSignerId] = useState<string>(request?.signers[0]?.id || '');
  const [fields, setFields] = useState<SignatureField[]>(request?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  if (!request) {
    return (
      <div className="min-h-full bg-paper p-8 flex items-center justify-center">
        <div className="bg-paper-elevated border border-line rounded-xl p-6 text-center max-w-sm">
          <p className="text-sm text-ink font-semibold">Request not found</p>
          <Link href="/signatures/all" className="text-xs text-flash-deep underline mt-2 block">
            Return to all requests
          </Link>
        </div>
      </div>
    );
  }

  const addField = (type: SignatureFieldType) => {
    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      type,
      signerId: activeSignerId || request.signers[0].id,
      pageNumber: 1,
      positionX: 30 + Math.floor(Math.random() * 40),
      positionY: 40 + Math.floor(Math.random() * 40),
      width: type === 'signature' ? 180 : type === 'checkbox' ? 32 : 140,
      height: type === 'checkbox' ? 32 : 44,
      required: true
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleSave = () => {
    updateSignatureFields(request.id, fields);
    router.push(`/signatures/${request.id}`);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/signatures/${request.id}`}
              className="p-2 bg-paper-elevated border border-line rounded-lg text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-ink">Field Placement Studio</h1>
              <p className="text-sm text-muted">
                {request.title} • {request.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-flash hover:bg-flash-deep text-ink text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>

        {/* 3-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Palette & Active Signer (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Signer Selector */}
            <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                Assign Fields To:
              </label>
              <div className="space-y-1.5">
                {request.signers.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSignerId(s.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      (activeSignerId || request.signers[0].id) === s.id
                        ? 'border-flash bg-flash/15 font-bold text-ink'
                        : 'border-line bg-paper text-muted hover:text-ink'
                    }`}
                  >
                    <div className="truncate">
                      <span>{s.name}</span>
                      <span className="block text-[10px] text-muted truncate">{s.email}</span>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-mist text-ink-soft text-[10px] font-bold flex items-center justify-center shrink-0 ml-1">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Palette */}
            <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                Click Field to Add
              </label>

              <div className="space-y-2">
                {[
                  { type: 'signature', label: 'Signature Field', icon: PenTool },
                  { type: 'initials', label: 'Initials Field', icon: Type },
                  { type: 'date', label: 'Date Signed', icon: Calendar },
                  { type: 'name', label: 'Full Name', icon: UserCheck },
                  { type: 'text', label: 'Text Input', icon: Type },
                  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addField(item.type as any)}
                      className="w-full p-2.5 bg-paper hover:bg-mist/40 border border-line rounded-lg text-xs font-semibold text-ink flex items-center gap-2 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-flash-deep" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Document Canvas Preview (6 Cols) */}
          <div className="lg:col-span-6 bg-paper-elevated border border-line rounded-xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
            <div className="w-full max-w-xl bg-white border border-line shadow-md rounded-lg p-8 min-h-[600px] relative font-serif text-ink text-xs leading-relaxed space-y-4">
              <div className="border-b border-line pb-3 font-sans">
                <span className="text-[10px] font-bold tracking-widest text-muted uppercase">DOCUMENT PREVIEW CANVAS</span>
                <h3 className="font-bold text-sm text-ink">{request.title}</h3>
              </div>

              <p className="text-muted leading-relaxed font-sans">
                {linkedDoc?.content || `
                THIS EXECUTABLE DOCUMENT confirms the formal agreement between the undersigned parties.
                By affixing digital signatures below, each party confirms authority to bind their respective organization.
                All contractual obligations and intellectual property covenants remain in full force.
                `.trim()}
              </p>

              {/* Placed Fields Overlay */}
              <div className="pt-8 border-t border-line font-sans space-y-4">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Configured Signature Placements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.map((f) => {
                    const signer = request.signers.find(s => s.id === f.signerId);
                    const isSelected = selectedFieldId === f.id;

                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFieldId(f.id)}
                        className={`p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                          isSelected
                            ? 'border-flash bg-flash/15 shadow-sm'
                            : 'border-flash-deep/50 bg-mist/30 hover:border-flash'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-ink uppercase">{f.type}</span>
                          <span className="text-[10px] text-muted">{signer?.name}</span>
                        </div>
                        <div className="h-8 bg-paper rounded border border-line/60 flex items-center justify-center text-[10px] text-muted font-mono">
                          [{f.type.toUpperCase()} FIELD]
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Field Properties (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Field Inspector</h3>

              {selectedField ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-muted block mb-1">Field Type</label>
                    <span className="font-bold text-ink capitalize">{selectedField.type}</span>
                  </div>

                  <div>
                    <label className="text-muted block mb-1">Assigned Signer</label>
                    <select
                      value={selectedField.signerId}
                      onChange={(e) => {
                        setFields(prev => prev.map(f => f.id === selectedField.id ? { ...f, signerId: e.target.value } : f));
                      }}
                      className="w-full px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-flash"
                    >
                      {request.signers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <span className="text-muted">Mandatory Field</span>
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={(e) => {
                        setFields(prev => prev.map(f => f.id === selectedField.id ? { ...f, required: e.target.checked } : f));
                      }}
                      className="w-4 h-4 accent-flash"
                    />
                  </div>

                  <div className="pt-3 border-t border-line">
                    <button
                      onClick={() => removeField(selectedField.id)}
                      className="w-full py-2 bg-danger/10 hover:bg-danger/20 text-danger font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Field
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Click any field on the document canvas to inspect or adjust properties.
                </p>
              )}
            </div>

            <div className="bg-paper-elevated border border-line rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-xs font-bold text-ink block">Summary</span>
              <p className="text-xs text-muted">
                {fields.length} total field{fields.length === 1 ? '' : 's'} configured across {request.signers.length} signers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
