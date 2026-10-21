'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell, Check, Trash2, Filter, ExternalLink, Calendar,
  Megaphone, Palmtree, Video, CheckSquare, Layers, Eye,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { Notification } from '@/types';

export default function NotificationsCenterPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesRead = filter === 'all' || !n.isRead;
      const matchesType = typeFilter === 'all' || n.type === typeFilter;
      return matchesRead && matchesType;
    });
  }, [notifications, filter, typeFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    if (type === 'task') return <CheckSquare className="w-4 h-4 text-indigo-500" />;
    if (type === 'approval') return <Check className="w-4 h-4 text-emerald-500" />;
    if (type === 'document') return <Layers className="w-4 h-4 text-blue-500" />;
    return <Bell className="w-4 h-4 text-flash-deep" />;
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-flash/15 text-flash-deep border border-flash/30">
                Inbox
              </span>
              <span className="text-xs text-muted">Mock In-App Notifications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
              Notifications Center
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Review task delegations, meeting invites, time-off approvals, and broadcast updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-elevated hover:bg-mist text-ink font-semibold rounded-lg border border-line shadow-2xs transition-colors text-xs"
              >
                <Check className="w-3.5 h-3.5 text-flash-deep" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 rounded-xl bg-paper-elevated border border-line shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'bg-paper text-muted hover:text-ink border border-line'
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === 'unread'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'bg-paper text-muted hover:text-ink border border-line'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-paper border border-line text-ink focus:outline-hidden focus:border-flash text-xs"
          >
            <option value="all">All Notification Types</option>
            <option value="task">Tasks & Projects</option>
            <option value="system">Collaboration & System</option>
            <option value="approval">Approvals</option>
            <option value="document">Documents</option>
          </select>
        </div>

        {/* Notifications List */}
        <div className="bg-paper-elevated border border-line rounded-xl shadow-xs overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 p-8 space-y-2 text-xs">
              <Bell className="w-10 h-10 text-muted mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-ink">You are all caught up!</h3>
              <p className="text-muted">No notifications matching current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    !n.isRead ? 'bg-flash/5 hover:bg-flash/10' : 'hover:bg-mist/20'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-paper border border-line flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getTypeIcon(n.type)}
                    </div>

                    <div className="space-y-0.5 min-w-0 text-xs">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${!n.isRead ? 'text-ink font-bold' : 'text-ink-soft'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-flash shrink-0" />
                        )}
                      </div>
                      <p className="text-muted leading-relaxed">{n.body}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-muted font-mono">
                        <span>{n.createdAt.slice(0, 10)}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{n.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors text-xs"
                        title="Mark as read"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => markNotificationRead(n.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-mist/60 hover:bg-line text-ink font-semibold text-xs transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
