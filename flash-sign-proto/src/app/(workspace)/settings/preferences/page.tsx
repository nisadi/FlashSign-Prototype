'use client';

import React, { useState } from 'react';
import {
  Clock, Calendar, Check, RotateCcw,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { CollaborationSettings } from '@/types';

const TIMEZONES = [
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'America/Chicago (CST)',
  'Europe/London (GMT)',
  'Europe/Berlin (CET)',
  'Asia/Singapore (SGT)',
  'Asia/Tokyo (JST)',
];

export default function PreferencesSettingsPage() {
  const { collaborationSettings, updateCollaborationSettings, resetDemoData } = useApp();

  const [settings, setSettings] = useState<CollaborationSettings>(collaborationSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCollaborationSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Preferences</h1>
          <p className="text-sm text-muted mt-0.5">
            Calendar and planning defaults, working hours, time zone and workload limits.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {saved && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Preferences saved.</span>
              </div>
            )}

            {/* Calendar & Planning Defaults */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-line pb-2">
                <Calendar className="w-4 h-4 text-flash-deep" />
                <span>Calendar & Planning Defaults</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Default Calendar View</label>
                  <select
                    value={settings.defaultCalendarView}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        defaultCalendarView: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  >
                    <option value="month">Month Grid View</option>
                    <option value="week">Week Schedule View</option>
                    <option value="day">Day Time-Slot View</option>
                    <option value="agenda">List / Agenda View</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Week Start Day</label>
                  <select
                    value={settings.weekStartDay}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        weekStartDay: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  >
                    <option value="monday">Monday (ISO 8601)</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Default Planning Workspace View</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['calendar', 'timeline', 'list'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, defaultPlanningView: v }))}
                      className={`p-2.5 rounded-lg border text-center font-semibold capitalize transition-colors ${
                        settings.defaultPlanningView === v
                          ? 'bg-ink text-white border-ink'
                          : 'bg-paper text-muted border-line hover:text-ink'
                      }`}
                    >
                      {v} View
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Working Hours & Timezone */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-line pb-2">
                <Clock className="w-4 h-4 text-flash-deep" />
                <span>Working Hours & Timezone</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Timezone</label>
                  <select
                    value={settings.timeZone}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, timeZone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Work Day Start</label>
                  <input
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Work Day End</label>
                  <input
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  Weekly Workload Warning Threshold:{' '}
                  <strong className="text-flash-deep">{settings.workloadThresholdHours} hours</strong>
                </label>
                <input
                  type="range"
                  min="30"
                  max="50"
                  step="5"
                  value={settings.workloadThresholdHours}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      workloadThresholdHours: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-flash cursor-pointer mt-1"
                />
                <p className="text-[11px] text-muted mt-1">
                  Flag team members as "At Capacity" when assigned tasks exceed this baseline limit.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-between">
              <button
                type="button"
                onClick={resetDemoData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors font-medium text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
