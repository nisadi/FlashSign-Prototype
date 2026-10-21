'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { Card, Button } from '@/components/shared/ui';
import { formatDate } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Flag,
  CheckSquare,
  Clock,
  Sparkles,
  Target,
} from 'lucide-react';

export default function PlannerCalendarPage() {
  const { tasks, projects, milestones, users, openTaskDrawer, addTask, addMilestone } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [projectFilter, setProjectFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'task' | 'milestone' | 'project'>(
    'all'
  );
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickType, setQuickType] = useState<'task' | 'milestone'>('task');
  const [quickProjectId, setQuickProjectId] = useState(projects[0]?.id || '');

  // Year & Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compile calendar events
  const calendarEvents = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      type: 'task' | 'milestone' | 'project';
      projectId: string;
      color: string;
      originalId: string;
    }> = [];

    // Tasks
    tasks.forEach((t) => {
      if (t.dueDate) {
        list.push({
          id: `task-${t.id}`,
          title: `${t.key}: ${t.title}`,
          date: t.dueDate,
          type: 'task',
          projectId: t.projectId,
          color: t.status === 'done' ? '#00c2a8' : '#3b82f6',
          originalId: t.id,
        });
      }
    });

    // Milestones
    milestones.forEach((m) => {
      if (m.dueDate) {
        list.push({
          id: `milestone-${m.id}`,
          title: `Milestone: ${m.name}`,
          date: m.dueDate,
          type: 'milestone',
          projectId: m.projectId,
          color: '#8b5cf6',
          originalId: m.id,
        });
      }
    });

    // Project Deadlines
    projects.forEach((p) => {
      const deadline = p.dueDate || p.endDate;
      if (deadline) {
        list.push({
          id: `project-${p.id}`,
          title: `Project Delivery: ${p.name}`,
          date: deadline,
          type: 'project',
          projectId: p.id,
          color: '#f59e0b',
          originalId: p.id,
        });
      }
    });

    return list.filter((e) => {
      const matchProject = projectFilter === 'all' || e.projectId === projectFilter;
      const matchType = eventTypeFilter === 'all' || e.type === eventTypeFilter;
      return matchProject && matchType;
    });
  }, [tasks, milestones, projects, projectFilter, eventTypeFilter]);

  // Generate 35 or 42 grid cells for month view
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Days before month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: '', dateStr: '', isCurrentMonth: false });
    }

    // Days in month
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // Fill to 35 or 42 cells
    while (days.length % 7 !== 0) {
      days.push({ dayNumber: '', dateStr: '', isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickProjectId) return;

    if (quickType === 'task') {
      addTask({
        title: quickTitle.trim(),
        projectId: quickProjectId,
        status: 'todo',
        priority: 'medium',
        dueDate: quickDate,
        labels: ['Scheduled'],
        points: 2,
      });
    } else {
      addMilestone({
        name: quickTitle.trim(),
        projectId: quickProjectId,
        dueDate: quickDate,
        status: 'pending',
        taskIds: [],
      });
    }

    setQuickTitle('');
    setShowQuickCreate(false);
  };

  const handleEventClick = (event: (typeof calendarEvents)[0]) => {
    if (event.type === 'task') {
      openTaskDrawer(event.originalId);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Top Banner */}
      <div className="bg-paper-elevated border-b border-line px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-flash-deep" /> Project Planner & Schedule
            </h1>
            <p className="text-xs text-muted">
              Unified roadmap calendar for task due dates, milestones, and project release dates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowQuickCreate(true)}
            >
              Add Scheduled Item
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-fade-up">
        {/* Navigation Toolbar */}
        <div className="bg-paper-elevated border border-line p-3.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Month/Date selector */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="xs" onClick={handleToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg border border-line bg-paper hover:bg-mist transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4 text-ink" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg border border-line bg-paper hover:bg-mist transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4 text-ink" />
              </button>
            </div>
            <h2 className="text-base font-bold text-ink min-w-[160px]">
              {monthNames[month]} {year}
            </h2>
          </div>

          {/* Filters & View Modes */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-paper border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Events</option>
              <option value="task">Tasks Only</option>
              <option value="milestone">Milestones Only</option>
              <option value="project">Project Deliveries</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-line bg-paper p-0.5">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-ink text-flash font-semibold shadow-2xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted px-2">
          <span className="font-medium text-ink">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Task Due Date
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00c2a8]" /> Completed Task
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Project Milestone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Project Target Delivery
          </span>
        </div>

        {/* Quick Create Scheduled Item Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-paper-elevated border border-line rounded-2xl p-6 max-w-md w-full shadow-xl animate-fade-in space-y-4">
              <h2 className="text-base font-bold text-ink">Schedule Item on Calendar</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Item Title</label>
                  <input
                    type="text"
                    required
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g. Design review with stakeholders"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Type</label>
                    <select
                      value={quickType}
                      onChange={(e) => setQuickType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                    >
                      <option value="task">Task</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Date</label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Project</label>
                  <select
                    value={quickProjectId}
                    onChange={(e) => setQuickProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowQuickCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Schedule Item
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calendar View Container */}
        <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-line bg-paper text-center py-2.5 text-xs font-bold text-muted uppercase">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-line min-h-[600px]">
            {monthDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = cell.dateStr
                ? calendarEvents.filter((e) => e.date === cell.dateStr)
                : [];

              return (
                <div
                  key={idx}
                  className={`p-2 min-h-[110px] flex flex-col justify-between transition-colors ${
                    !cell.isCurrentMonth
                      ? 'bg-mist/30 text-muted/40'
                      : isToday
                      ? 'bg-flash/5'
                      : 'bg-paper-elevated hover:bg-mist/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-flash text-white flex items-center justify-center font-bold'
                          : 'text-ink'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.isCurrentMonth && (
                      <button
                        onClick={() => {
                          setQuickDate(cell.dateStr);
                          setShowQuickCreate(true);
                        }}
                        className="text-muted/40 hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Add item on this date"
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Events list inside cell */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto no-scrollbar">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        className="p-1 rounded text-[10px] text-white font-medium truncate cursor-pointer hover:opacity-90 shadow-2xs transition-transform"
                        style={{ background: evt.color }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
