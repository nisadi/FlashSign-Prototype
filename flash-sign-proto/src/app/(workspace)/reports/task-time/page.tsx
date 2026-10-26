'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskTimeReport } from '@/components/reports/task-time-report';

export default function TaskTimeReportPage() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Reports
        </Link>
        <h1 className="text-xl font-bold text-ink">Task time</h1>
        <p className="text-sm text-muted">
          How long each task took from In Progress to In Review, and who worked on it, by agent or by hand.
        </p>
      </div>
      <TaskTimeReport />
    </div>
  );
}
