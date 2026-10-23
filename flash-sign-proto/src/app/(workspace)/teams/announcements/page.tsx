'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone, Pin, Plus, Search, Filter, Check, Eye, EyeOff,
  Trash2, Edit3, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { MemberAvatar } from '@/components/collaboration/member-avatar';
import { AnnouncementPriorityBadge } from '@/components/collaboration/collaboration-badges';
import { CreateAnnouncementDialog } from '@/components/collaboration/create-announcement-dialog';
import type { Announcement } from '@/types';
import { Modal } from '@/components/shared/modal';

export default function AnnouncementsPage() {
  const {
    announcements, users, currentUserId, markAnnouncementRead,
    togglePinAnnouncement, deleteAnnouncement,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'important' | 'pinned'>('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmAnn, setDeleteConfirmAnn] = useState<Announcement | null>(null);

  // Audiences
  const audienceOptions = useMemo(() => {
    return Array.from(new Set(announcements.map(a => a.audience)));
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter(a => {
        const matchesSearch =
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.content.toLowerCase().includes(search.toLowerCase());

        const isUnread = !a.readByUserIds.includes(currentUserId);

        let matchesTab = true;
        if (filter === 'unread') matchesTab = isUnread;
        else if (filter === 'important') matchesTab = a.priority === 'important';
        else if (filter === 'pinned') matchesTab = a.isPinned;

        const matchesAudience = audienceFilter === 'all' || a.audience === audienceFilter;

        return matchesSearch && matchesTab && matchesAudience;
      })
      .sort((a, b) => {
        // Pinned first, then by published date descending
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      });
  }, [announcements, search, filter, audienceFilter, currentUserId]);

  const handleDelete = (ann: Announcement) => {
    deleteAnnouncement(ann.id);
    setDeleteConfirmAnn(null);
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Announcements Board
              </span>
              <span className="text-xs text-muted">Internal Company Communications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Team Announcements
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Broadcast critical organizational notices, engineering release memos, policy changes, and milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teams/announcements/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-flash hover:bg-flash-deep text-ink font-bold rounded-lg shadow-xs transition-colors text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Announcement</span>
            </Link>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search announcements by title or content..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-paper border border-line text-ink placeholder:text-muted focus:outline-hidden focus:border-flash text-xs"
              />
            </div>

            {/* Audience filter */}
            <select
              value={audienceFilter}
              onChange={e => setAudienceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
            >
              <option value="all">All Audiences</option>
              {audienceOptions.map(aud => (
                <option key={aud} value={aud}>
                  Audience: {aud}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {(['all', 'unread', 'important', 'pinned'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === tab
                    ? 'bg-ink text-white shadow-2xs'
                    : 'bg-paper text-muted hover:text-ink border border-line'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 bg-paper-elevated border border-line rounded-xl p-8 space-y-2">
              <Megaphone className="w-10 h-10 text-muted mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-bold text-ink">No announcements match your filter</h3>
              <p className="text-xs text-muted">Try selecting "All" or posting a new announcement.</p>
            </div>
          ) : (
            filteredAnnouncements.map(ann => {
              const author = users.find(u => u.id === ann.authorId);
              const isUnread = !ann.readByUserIds.includes(currentUserId);
              const isExpanded = expandedId === ann.id;

              return (
                <div
                  key={ann.id}
                  className={`bg-paper-elevated border rounded-xl shadow-xs transition-all overflow-hidden ${
                    ann.isPinned
                      ? 'border-amber-400/60 ring-1 ring-amber-400/20'
                      : isUnread
                      ? 'border-flash/60'
                      : 'border-line'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    {/* Top Row: Badges & Controls */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {ann.isPinned && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/25">
                            <Pin className="w-3 h-3" />
                            Pinned Notice
                          </span>
                        )}
                        <AnnouncementPriorityBadge priority={ann.priority} />
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-mist/60 text-muted border border-line capitalize">
                          Audience: {ann.audience}
                        </span>
                        {isUnread && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-flash/20 text-flash-deep border border-flash/40">
                            Unread
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePinAnnouncement(ann.id)}
                          className={`p-1.5 rounded-lg border border-line transition-colors ${
                            ann.isPinned
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                              : 'text-muted hover:text-ink hover:bg-mist'
                          }`}
                          title={ann.isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => markAnnouncementRead(ann.id)}
                          className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
                          title={isUnread ? 'Mark as Read' : 'Already Read'}
                        >
                          {isUnread ? <Eye className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>

                        <button
                          onClick={() => {
                            setAnnouncementToEdit(ann);
                            setCreateDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
                          title="Edit Announcement"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmAnn(ann)}
                          className="p-1.5 rounded-lg border border-line text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h2
                      onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                      className="text-base font-bold text-ink hover:text-flash-deep cursor-pointer transition-colors"
                    >
                      {ann.title}
                    </h2>

                    {/* Content Preview / Full View */}
                    <div className="text-xs text-muted leading-relaxed whitespace-pre-line">
                      {isExpanded ? ann.content : ann.content.slice(0, 220) + (ann.content.length > 220 ? '...' : '')}
                    </div>

                    {ann.content.length > 220 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                        className="text-xs font-semibold text-flash-deep hover:underline inline-block pt-1"
                      >
                        {isExpanded ? 'Collapse post' : 'Read full announcement &rarr;'}
                      </button>
                    )}

                    {/* Footer: Author & Timestamp */}
                    <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                      <div className="flex items-center gap-2">
                        <MemberAvatar user={author} size="xs" />
                        <span>
                          Published by <strong>{author?.name || 'Organization Leadership'}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-[11px]">{ann.publishedDate.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Announcement Modal */}
      <CreateAnnouncementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        announcementToEdit={announcementToEdit}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirmAnn}
        onClose={() => setDeleteConfirmAnn(null)}
        size="xs"
      >
        {deleteConfirmAnn && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-ink">Delete Announcement</h3>
            <p className="text-muted leading-relaxed">
              Are you sure you want to delete <strong>"{deleteConfirmAnn.title}"</strong>? It will be removed from all team feeds.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setDeleteConfirmAnn(null)}
                className="px-3.5 py-1.5 rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmAnn)}
                className="px-4 py-1.5 rounded-lg bg-danger text-white font-semibold hover:bg-danger/90 transition-colors"
              >
                Delete Notice
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
