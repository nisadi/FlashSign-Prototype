'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Save,
  Clock,
  Bell,
  Mail,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DemoNoticeBanner } from '@/components/documents/demo-notice-banner';

export default function SignatureSettingsPage() {
  const [defaultExpiration, setDefaultExpiration] = useState('14');
  const [reminderInterval, setReminderInterval] = useState('every_3days');
  const [defaultOrder, setDefaultOrder] = useState<'sequential' | 'parallel'>('sequential');
  const [defaultMessage, setDefaultMessage] = useState('Please review and sign this agreement via Flash Sign digital signing.');
  const [requireAllSigners, setRequireAllSigners] = useState(true);
  const [allowTypedSignature, setAllowTypedSignature] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setDefaultExpiration('14');
    setReminderInterval('every_3days');
    setDefaultOrder('sequential');
    setDefaultMessage('Please review and sign this agreement via Flash Sign digital signing.');
    setRequireAllSigners(true);
    setAllowTypedSignature(true);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <DemoNoticeBanner />

        {savedSuccess && (
          <div className="p-3 bg-flash/20 border border-flash text-flash-deep font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully in client state.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-mist text-ink-soft flex items-center justify-center border border-line">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">E-Signature Settings</h1>
                <p className="text-sm text-muted">
                  Configure default policies, reminder schedules, and signing workflows
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-paper-elevated border border-line hover:bg-mist/50 text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-flash-deep" />
              Expiration & Reminders
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Default Expiration Period
                </label>
                <select
                  value={defaultExpiration}
                  onChange={(e) => setDefaultExpiration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days (Default)</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Automatic Reminder Cadence
                </label>
                <select
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
                >
                  <option value="every_3days">Every 3 days</option>
                  <option value="daily_3days">Daily when 3 days remaining</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual_only">Manual reminders only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-paper-elevated border border-line rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-flash-deep" />
              Default Workflow & Messaging
            </h3>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                Default Execution Order
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDefaultOrder('sequential')}
                  className={`flex-1 p-3 rounded-lg border text-left text-xs transition-colors ${
                    defaultOrder === 'sequential'
                      ? 'border-flash bg-flash/10 font-bold text-ink'
                      : 'border-line bg-paper text-muted hover:text-ink'
                  }`}
                >
                  Sequential (Ordered Signer 1 → 2 → 3)
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultOrder('parallel')}
                  className={`flex-1 p-3 rounded-lg border text-left text-xs transition-colors ${
                    defaultOrder === 'parallel'
                      ? 'border-flash bg-flash/10 font-bold text-ink'
                      : 'border-line bg-paper text-muted hover:text-ink'
                  }`}
                >
                  Parallel (All Signers Simultaneously)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                Standard Email Message to Recipients
              </label>
              <textarea
                rows={3}
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-flash"
              />
            </div>

            <div className="pt-2 border-t border-line space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAllSigners}
                  onChange={(e) => setRequireAllSigners(e.target.checked)}
                  className="w-4 h-4 accent-flash"
                />
                <span className="text-ink font-medium">Require all participants to complete signature before marking the document Signed</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowTypedSignature}
                  onChange={(e) => setAllowTypedSignature(e.target.checked)}
                  className="w-4 h-4 accent-flash"
                />
                <span className="text-ink font-medium">Enable typed digital signatures alongside cursive font rendering</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-flash hover:bg-flash-deep text-ink text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
