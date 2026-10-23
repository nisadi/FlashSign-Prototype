'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone, Pin, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { AnnouncementPriority } from '@/types';

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'Entire Organization' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Product Design' },
  { id: 'operations', label: 'Operations & DevOps' },
  { id: 'quality', label: 'Quality Assurance' },
  { id: 'legal', label: 'Legal & Compliance' },
];

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { addAnnouncement, currentUserId } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [publishedDate, setPublishedDate] = useState('2026-10-21');
  const [isPinned, setIsPinned] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (status: 'published' | 'draft') => {
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('Please provide a title for the announcement');
      return;
    }

    if (!trimmedContent) {
      setError('Please provide content for the announcement message');
      return;
    }

    addAnnouncement({
      title: trimmedTitle,
      content: trimmedContent,
      audience,
      priority,
      isPinned,
      authorId: currentUserId,
      publishedDate: `${publishedDate}T10:00:00Z`,
      status,
      readByUserIds: [currentUserId],
    });

    setSuccess(true);
    setTimeout(() => {
      router.push('/teams/announcements');
    }, 700);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Link
          href="/teams/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Announcements</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Create Team Announcement
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Broadcast an internal update, executive memo, or engineering milestone to selected teams or the entire organization.
          </p>
        </div>

        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs p-6">
          <div className="space-y-5 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Announcement published successfully! Redirecting...</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-ink mb-1">
                Announcement Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q4 Platform Release Freeze & Deployment Schedule"
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink mb-1">Audience Target</label>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  {AUDIENCE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as AnnouncementPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important (Urgent notification)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Publish Date</label>
              <input
                type="date"
                value={publishedDate}
                onChange={e => setPublishedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-mist/30 border border-line">
              <input
                type="checkbox"
                id="pinTogglePage"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="rounded accent-flash text-flash"
              />
              <label htmlFor="pinTogglePage" className="font-semibold text-ink cursor-pointer flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-flash-deep" />
                Pin announcement to the top of the team feed
              </label>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">
                Announcement Message <span className="text-danger">*</span>
              </label>
              <textarea
                rows={7}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write full message, context, action items, and contacts..."
                className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
                required
              />
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <Link
                href="/teams/announcements"
                className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist font-medium"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                className="px-4 py-2 rounded-lg bg-mist hover:bg-line text-ink font-semibold transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                className="px-6 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-bold shadow-xs transition-colors"
              >
                Publish Announcement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
