'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Pin, Eye, Check, ChevronDown, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useDemoAuth } from '@/context/demo-auth-context';
import { canManageTeam } from '@/lib/rbac';
import { formatDate, cn } from '@/lib/utils';
import { AnnouncementPriorityBadge } from '@/components/collaboration/collaboration-badges';

const COLLAPSED_COUNT = 4;

/**
 * Announcements on My Status. Read-only for everyone: people can read each post and mark it
 * as seen. Creating, editing, pinning and deleting stay on the Announcements Board
 * (/teams/announcements), which only team managers can open.
 */
export function MyAnnouncementsCard() {
  const { announcements, users, currentUserId, markAnnouncementRead } = useApp();
  const { currentRbacUser } = useDemoAuth();
  const canOpenBoard = canManageTeam(currentRbacUser);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Published only (drafts stay with their author); pinned first, then newest
  const published = useMemo(
    () =>
      announcements
        .filter(a => a.status === 'published')
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }),
    [announcements]
  );

  const unread = published.filter(a => !a.readByUserIds.includes(currentUserId));
  const visible = showAll ? published : published.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-2xl border border-line bg-paper-elevated shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-flash-deep" />
          <span>Announcements</span>
          {unread.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-flash/20 text-flash-deep border border-flash/40">
              {unread.length} unread
            </span>
          )}
        </h3>

        <div className="flex items-center gap-3">
          {unread.length > 0 && (
            <button
              type="button"
              onClick={() => unread.forEach(a => markAnnouncementRead(a.id))}
              className="text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              Mark all as seen
            </button>
          )}
          {canOpenBoard && (
            <Link
              href="/teams/announcements"
              className="flex items-center gap-1 text-xs font-semibold text-flash-deep hover:text-ink transition-colors whitespace-nowrap"
            >
              <span>Announcements Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* List */}
      {published.length === 0 ? (
        <p className="p-6 text-center text-xs text-muted">No announcements right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map(ann => {
            const author = users.find(u => u.id === ann.authorId);
            const isUnread = !ann.readByUserIds.includes(currentUserId);
            const isExpanded = expandedId === ann.id;

            return (
              <li key={ann.id} className={cn('px-5 py-3 transition-colors', isUnread && 'bg-flash/5')}>
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <span
                    className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', isUnread ? 'bg-flash-deep' : 'bg-transparent')}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                      {ann.priority === 'important' && <AnnouncementPriorityBadge priority={ann.priority} />}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                        aria-expanded={isExpanded}
                        className={cn(
                          'text-left text-xs text-ink hover:text-flash-deep transition-colors',
                          isUnread ? 'font-bold' : 'font-semibold'
                        )}
                      >
                        {ann.title}
                      </button>
                    </div>

                    <p className={cn('text-xs text-muted leading-relaxed whitespace-pre-line', !isExpanded && 'line-clamp-1')}>
                      {ann.content}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-muted">
                      <span>
                        {author?.name || 'Leadership'} · {formatDate(ann.publishedDate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                        className="font-semibold text-flash-deep hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    </div>
                  </div>

                  {/* The only action people have here */}
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => markAnnouncementRead(ann.id)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-[11px] font-semibold text-ink hover:bg-mist transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Mark as seen
                    </button>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      Seen
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {published.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(v => !v)}
          className="w-full px-5 py-2.5 border-t border-line bg-paper text-xs font-semibold text-flash-deep hover:bg-mist/40 transition-colors flex items-center justify-center gap-1"
        >
          {showAll ? 'Show fewer' : `Show all announcements (${published.length})`}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
