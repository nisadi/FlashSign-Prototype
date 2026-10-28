'use client';

import React, { useState } from 'react';
import { X, Megaphone, Pin, AlertCircle, Check } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Announcement, AnnouncementPriority } from '@/types';
import { ClientPortal } from '@/components/shared/modal';
import { notify } from '@/components/shared/toaster';

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcementToEdit?: Announcement | null;
  onSuccess?: (ann: Announcement) => void;
}

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'Entire Organization' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Product Design' },
  { id: 'operations', label: 'Operations & DevOps' },
  { id: 'quality', label: 'Quality Assurance' },
  { id: 'legal', label: 'Legal & Compliance' },
];

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  announcementToEdit,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const { addAnnouncement, updateAnnouncement, currentUserId } = useApp();

  const [title, setTitle] = useState(announcementToEdit?.title || '');
  const [content, setContent] = useState(announcementToEdit?.content || '');
  const [audience, setAudience] = useState(announcementToEdit?.audience || 'all');
  const [priority, setPriority] = useState<AnnouncementPriority>(
    announcementToEdit?.priority || 'normal'
  );
  const [isPinned, setIsPinned] = useState(announcementToEdit?.isPinned ?? false);
  const [publishedDate, setPublishedDate] = useState(
    announcementToEdit?.publishedDate ? announcementToEdit.publishedDate.slice(0, 10) : '2026-10-21'
  );

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('Please provide an announcement title');
      return;
    }

    if (!trimmedContent) {
      setError('Please enter the announcement body content');
      return;
    }

    if (announcementToEdit) {
      updateAnnouncement(announcementToEdit.id, {
        title: trimmedTitle,
        content: trimmedContent,
        audience,
        priority,
        isPinned,
        publishedDate: `${publishedDate}T10:00:00Z`,
      });
      setSuccessMsg('Announcement updated!');
      notify(`Changes to announcement "${trimmedTitle}" saved`);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.({ ...announcementToEdit, title: trimmedTitle });
      }, 700);
    } else {
      addAnnouncement({
        title: trimmedTitle,
        content: trimmedContent,
        audience,
        priority,
        isPinned,
        authorId: currentUserId,
        publishedDate: `${publishedDate}T10:00:00Z`,
        status: 'published',
        readByUserIds: [currentUserId],
      });
      setSuccessMsg('Announcement published to organization feed!');
      notify(`Announcement "${trimmedTitle}" published`);
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    }
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-paper-elevated border border-line rounded-2xl shadow-2xl w-full max-w-xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-mist/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-flash/20 border border-flash/30 flex items-center justify-center text-flash-deep">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {announcementToEdit ? 'Edit Announcement' : 'Post Announcement'}
              </h2>
              <p className="text-xs text-muted">
                Broadcast organization updates, release notes, or process announcements.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. SOC-2 Type II Certification Audit Complete"
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              required
            />
          </div>

          {/* Audience & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Target Audience</label>
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
                <option value="normal">Normal Priority</option>
                <option value="important">Important / Critical Announcement</option>
              </select>
            </div>
          </div>

          {/* Publication Date */}
          <div>
            <label className="block font-semibold text-ink mb-1">Publication Date</label>
            <input
              type="date"
              value={publishedDate}
              onChange={e => setPublishedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            />
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-mist/20 border border-line">
            <input
              type="checkbox"
              id="pinAnnouncement"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="rounded accent-flash text-flash"
            />
            <label htmlFor="pinAnnouncement" className="font-semibold text-ink cursor-pointer flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-flash-deep" />
              Pin to top of Announcements board
            </label>
          </div>

          {/* Message Content */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Message Content <span className="text-danger">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write announcement details, instructions, links, or contact points..."
              className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-flash hover:bg-flash-deep text-ink font-semibold shadow-xs transition-colors"
            >
              {announcementToEdit ? 'Save Changes' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientPortal>
  );
}
