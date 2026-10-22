'use client';

import React, { useState } from 'react';
import { Clock, Plus, Info, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { AvailabilityBoard } from '@/components/planner/availability-board';
import { TimeOffRequests } from '@/components/planner/time-off-requests';
import { CreateTimeOffDialog } from '@/components/collaboration/create-time-off-dialog';

export default function AvailabilityAndTimeOffPage() {
  const { timeOffRequests } = useApp();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const pendingCount = timeOffRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
              <Clock className="w-7 h-7 text-flash-deep" />
              Availability &amp; Time Off
            </h1>
            <p className="text-sm text-muted mt-1">
              See who is free this week, and review or request planned leave.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Request Time Off
          </button>
        </div>

        {/* Prototype Clarification Banner */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink">Simulated data:</span> availability reflects planned schedules,
            meetings and approved leave, not live presence. Approving a request marks the member Out of Office and adds
            the leave to the team calendar.
          </div>
        </div>

        {/* Team availability */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">Team Availability</h2>
          <AvailabilityBoard />
        </section>

        {/* Time-off requests */}
        <section className="space-y-4 pt-2">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-flash-deep" />
            Time-Off Requests
            {pendingCount > 0 && (
              <span className="normal-case tracking-normal text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <TimeOffRequests />
        </section>
      </div>

      <CreateTimeOffDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
