'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { Search, FolderKanban, CheckSquare, Flag, Zap, User, X } from 'lucide-react';

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchCommand({ isOpen, onClose }: SearchCommandProps) {
  const router = useRouter();
  const { projects, tasks, milestones, sprints, users, openTaskDrawer } = useApp();
  const [query, setQuery] = useState('');

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingProjects = q ? projects.filter(p => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)) : projects.slice(0, 3);
  const matchingTasks = q ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)) : tasks.slice(0, 4);
  const matchingMilestones = q ? milestones.filter(m => m.name.toLowerCase().includes(q)) : milestones.slice(0, 2);
  const matchingSprints = q ? sprints.filter(s => s.name.toLowerCase().includes(q) || s.goal.toLowerCase().includes(q)) : sprints.slice(0, 2);
  const matchingUsers = q ? users.filter(u => u.name.toLowerCase().includes(q) || u.title?.toLowerCase().includes(q)) : [];

  const hasResults =
    matchingProjects.length > 0 ||
    matchingTasks.length > 0 ||
    matchingMilestones.length > 0 ||
    matchingSprints.length > 0 ||
    matchingUsers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-ink/50 backdrop-blur-xs">
      <div className="bg-paper-elevated border border-line rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Input Header */}
        <div className="p-4 border-b border-line flex items-center gap-3 bg-paper">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, tasks, sprints, milestones, or team..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-mist text-muted font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {!hasResults ? (
            <div className="py-12 text-center text-muted">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Projects */}
              {matchingProjects.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted px-2 mb-1">Projects</h5>
                  <div className="space-y-0.5">
                    {matchingProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          router.push(`/projects/${p.id}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FolderKanban className="w-4 h-4 text-flash-deep shrink-0" />
                          <span className="font-semibold text-ink truncate">{p.name}</span>
                          <span className="text-[10px] text-muted font-mono">{p.key}</span>
                        </div>
                        <span className="text-[10px] text-muted capitalize">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {matchingTasks.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted px-2 mb-1">Tasks</h5>
                  <div className="space-y-0.5">
                    {matchingTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onClose();
                          openTaskDrawer(t.id);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="font-mono text-[10px] font-bold text-ink-soft">{t.key}</span>
                          <span className="font-medium text-ink truncate">{t.title}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-mist text-ink-soft capitalize shrink-0">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {matchingMilestones.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted px-2 mb-1">Milestones</h5>
                  <div className="space-y-0.5">
                    {matchingMilestones.map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onClose();
                          router.push(`/projects/${m.projectId}/milestones`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Flag className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-semibold text-ink truncate">{m.name}</span>
                        </div>
                        <span className="text-[10px] text-muted font-medium">{m.progress}% complete</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sprints */}
              {matchingSprints.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted px-2 mb-1">Sprints</h5>
                  <div className="space-y-0.5">
                    {matchingSprints.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onClose();
                          router.push(`/projects/${s.projectId}/sprints`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Zap className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-semibold text-ink truncate">{s.name}</span>
                          <span className="text-[10px] text-muted truncate">{s.goal}</span>
                        </div>
                        <span className="text-[10px] text-muted capitalize">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members */}
              {matchingUsers.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-muted px-2 mb-1">Team Members</h5>
                  <div className="space-y-0.5">
                    {matchingUsers.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-mist/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.initials}
                          </div>
                          <span className="font-semibold text-ink truncate">{u.name}</span>
                          <span className="text-[10px] text-muted truncate">{u.title}</span>
                        </div>
                        <span className="text-[10px] text-muted">{u.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
