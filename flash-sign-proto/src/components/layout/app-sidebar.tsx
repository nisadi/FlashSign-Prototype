'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Calendar, Users,
  Activity, Bot, FileText, CheckCircle2, BarChart3, Settings,
  ChevronDown, PanelLeftClose, PanelLeftOpen, Zap,
  Star, Clock, Compass, Plus, Building2,
  UserCheck, Megaphone, CalendarDays, Palmtree, Video, Flag, Bell,
  FileSignature, Folder, ScrollText, Send, Inbox, CheckCheck, FileWarning, Layers, Sliders,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, useCurrentUser, useRoleConfig } from '@/context/app-context';
import { canAccess, ROLE_CONFIGS } from '@/lib/permissions';
import type { DemoRole } from '@/types';
import { useState, useEffect } from 'react';

const MOCK_WORKSPACES = [
  { id: 'ws1', name: 'Acme Digital', plan: 'Enterprise', color: '#00c2a8' },
  { id: 'ws2', name: 'Northstar Studio', plan: 'Pro', color: '#3b82f6' },
  { id: 'ws3', name: 'Vertex Labs', plan: 'Startup', color: '#8b5cf6' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setDemoRole, resetDemoData, demoRole, projects, documentItems, contracts, signatureRequests, agentRuns } = useApp();
  const currentUser = useCurrentUser();
  const roleConfig = useRoleConfig();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(MOCK_WORKSPACES[0]);

  const pendingReviewsCount = agentRuns?.filter(r => r.status === 'needs_review').length || 0;
  const actionRequiredSignatures = signatureRequests?.filter(r => r.status === 'sent' || r.status === 'viewed' || r.status === 'partially_signed').length || 0;

  interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }

  interface NavSection {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      id: 'documents',
      title: 'Documents',
      icon: FileText,
      badge: documentItems?.length,
      items: [
        { label: 'Documents Home', href: '/documents', icon: FileText },
        { label: 'All Documents', href: '/documents/all', icon: Layers },
        { label: 'My Documents', href: '/documents/mine', icon: UserCheck },
        { label: 'Shared with Me', href: '/documents/shared', icon: Users },
        { label: 'Recent Documents', href: '/documents/recent', icon: Clock },
        { label: 'Favorites', href: '/documents/favorites', icon: Star },
        { label: 'Templates', href: '/documents/templates', icon: ScrollText },
        { label: 'Folders', href: '/documents/folders', icon: Folder },
      ],
    },
    {
      id: 'contracts',
      title: 'Contracts',
      icon: Building2,
      badge: contracts?.length,
      items: [
        { label: 'Contracts Overview', href: '/contracts', icon: Building2 },
        { label: 'All Contracts', href: '/contracts/all', icon: ScrollText },
        { label: 'Draft Contracts', href: '/contracts/drafts', icon: Clock },
        { label: 'Pending Review', href: '/contracts/review', icon: Activity },
        { label: 'Active Contracts', href: '/contracts/active', icon: CheckCircle2 },
        { label: 'Expiring Soon', href: '/contracts/expiring', icon: FileWarning },
        { label: 'Completed', href: '/contracts/completed', icon: CheckCheck },
        { label: 'Archived', href: '/contracts/archived', icon: Folder },
      ],
    },
    {
      id: 'signatures',
      title: 'E-Signatures',
      icon: FileSignature,
      badge: actionRequiredSignatures > 0 ? actionRequiredSignatures : undefined,
      items: [
        { label: 'Signature Dashboard', href: '/signatures', icon: FileSignature },
        { label: 'All Requests', href: '/signatures/all', icon: Layers },
        { label: 'Action Required', href: '/signatures/waiting', icon: Inbox, badge: actionRequiredSignatures > 0 ? actionRequiredSignatures : undefined },
        { label: 'Sent Requests', href: '/signatures/sent', icon: Send },
        { label: 'Completed', href: '/signatures/completed', icon: CheckCheck },
        { label: 'Declined', href: '/signatures/declined', icon: FileWarning },
        { label: 'Expired', href: '/signatures/expired', icon: Clock },
        { label: 'E-Sign Settings', href: '/signatures/settings', icon: Sliders },
      ],
    },
    {
      id: 'ai-agents',
      title: 'AI Coding Agents',
      icon: Bot,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      items: [
        { label: 'AI Agent Hub', href: '/ai-agents', icon: Bot },
        { label: 'SRS Story Generator', href: '/ai-agents/story-generator', icon: FileText },
        { label: 'Task Assignment & IDE', href: '/ai-agents/assign', icon: FolderKanban },
        { label: 'Provider Settings', href: '/ai-agents/settings', icon: Settings },
        { label: 'AI Audit Trail', href: '/ai-agents/audit', icon: Activity },
      ],
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      icon: Users,
      items: [
        { label: 'Team Overview', href: '/teams', icon: Users },
        { label: 'Teams Directory', href: '/teams/directory', icon: Building2 },
        { label: 'Members', href: '/teams/members', icon: UserCheck },
        { label: 'Workload', href: '/teams/workload', icon: BarChart3 },
        { label: 'Team Activity', href: '/teams/activity', icon: Activity },
        { label: 'Announcements', href: '/teams/announcements', icon: Megaphone },
      ],
    },
    {
      id: 'planning',
      title: 'Planning',
      icon: CalendarDays,
      items: [
        { label: 'Planner', href: '/planner', icon: LayoutDashboard },
        { label: 'Calendar', href: '/planner/calendar', icon: CalendarDays },
        { label: 'Availability', href: '/planner/availability', icon: Clock },
        { label: 'Time Off', href: '/planner/time-off', icon: Palmtree },
        { label: 'Meeting Planner', href: '/planner/meetings', icon: Video },
        { label: 'Milestones & Deadlines', href: '/planner/milestones', icon: Flag },
      ],
    },
    {
      id: 'workspace',
      title: 'Workspace',
      icon: FolderKanban,
      items: [
        { label: 'Projects', href: '/projects', icon: FolderKanban },
        { label: 'PM Home', href: '/projects/home', icon: LayoutDashboard },
        { label: 'My Tasks', href: '/projects/my-tasks', icon: CheckSquare },
        { label: 'Notifications', href: '/teams/notifications', icon: Bell },
        { label: 'Settings', href: '/teams/settings', icon: Settings },
      ],
    },
  ];

  // Accordion state: open sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      documents: false,
      contracts: false,
      signatures: false,
      'ai-agents': false,
      collaboration: false,
      planning: false,
      workspace: false,
    };
    if (pathname.startsWith('/documents')) initial.documents = true;
    else if (pathname.startsWith('/contracts')) initial.contracts = true;
    else if (pathname.startsWith('/signatures')) initial.signatures = true;
    else if (pathname.startsWith('/ai-agents')) initial['ai-agents'] = true;
    else if (pathname.startsWith('/teams')) initial.collaboration = true;
    else if (pathname.startsWith('/planner')) initial.planning = true;
    else if (pathname.startsWith('/projects')) initial.workspace = true;
    else initial.documents = true;
    return initial;
  });

  // Automatically expand the section that matches the current route
  useEffect(() => {
    sections.forEach(sec => {
      if (sec.items.some(item => isActive(item.href))) {
        setOpenSections(prev => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allOpen = Object.values(openSections).every(Boolean);
  const toggleAllSections = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    sections.forEach(s => { updated[s.id] = nextState; });
    setOpenSections(updated);
  };

  const isActive = (href: string) => {
    if (href === '/projects') return pathname === '/projects';
    if (href === '/teams') return pathname === '/teams';
    if (href === '/planner') return pathname === '/planner';
    if (href === '/documents') return pathname === '/documents';
    if (href === '/contracts') return pathname === '/contracts';
    if (href === '/signatures') return pathname === '/signatures';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Overlay on mobile */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-ink/40 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300 hero-wash border-r border-ink-soft/50',
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-60'
        )}
        style={{ background: 'linear-gradient(180deg, #0c1f22 0%, #0f2a2e 100%)' }}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center h-14 px-4 border-b border-ink-soft/50 shrink-0">
          <Link href="/projects/home" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-flash flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-ink" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-white tracking-tight text-base truncate">
                Flash<span className="text-flash">Sign</span>
              </span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="ml-auto text-white/40 hover:text-white transition-colors p-1 rounded shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace Selector Dropdown */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-ink-soft/30 relative">
            <button
              onClick={() => {
                setWorkspaceSwitcherOpen(!workspaceSwitcherOpen);
                setRoleSwitcherOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors border border-white/5"
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: selectedWorkspace.color }}
              >
                {selectedWorkspace.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{selectedWorkspace.name}</p>
                <p className="text-[10px] text-white/50">{selectedWorkspace.plan} Workspace</p>
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-white/40 transition-transform', workspaceSwitcherOpen && 'rotate-180')} />
            </button>

            {workspaceSwitcherOpen && (
              <div className="absolute top-12 left-3 right-3 z-40 bg-ink-soft rounded-lg overflow-hidden border border-white/10 shadow-2xl py-1">
                <p className="text-[10px] text-white/40 font-semibold px-3 py-1 uppercase">Switch Workspace</p>
                {MOCK_WORKSPACES.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setWorkspaceSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 text-xs text-white/80 transition-colors',
                      selectedWorkspace.id === ws.id && 'bg-flash/15 text-flash font-semibold'
                    )}
                  >
                    <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: ws.color }} />
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Demo Role Switcher */}
        {!sidebarCollapsed && (
          <div className="px-3 py-1.5 border-b border-ink-soft/30">
            <div
              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5 transition-colors text-[11px]"
              onClick={() => {
                setRoleSwitcherOpen(!roleSwitcherOpen);
                setWorkspaceSwitcherOpen(false);
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: roleConfig.color }} />
              <span className="text-white/60 truncate flex-1">Role: <strong className="text-white/90">{roleConfig.label}</strong></span>
              <ChevronDown className={cn('w-3 h-3 text-white/40 transition-transform', roleSwitcherOpen && 'rotate-180')} />
            </div>

            {roleSwitcherOpen && (
              <div className="mt-1 bg-ink-soft rounded-lg overflow-hidden border border-white/10 shadow-xl max-h-48 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-white/10">
                  <p className="text-[10px] text-white/50 font-medium">Switch Demo Persona</p>
                </div>
                {Object.values(ROLE_CONFIGS).map((rc) => (
                  <button
                    key={rc.id}
                    onClick={() => { setDemoRole(rc.id as DemoRole); setRoleSwitcherOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 text-xs text-white/80 transition-colors',
                      demoRole === rc.id && 'bg-flash/10 text-flash'
                    )}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: rc.color }} />
                    <span className="truncate">{rc.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items (Collapsible Accordion Dropdowns) */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar">
          {/* Quick Header Toggle */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 mb-2 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              <span>Navigation</span>
              <button
                type="button"
                onClick={toggleAllSections}
                className="text-[10px] text-white/50 hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                title={allOpen ? 'Collapse all dropdowns' : 'Expand all dropdowns'}
              >
                <ChevronsUpDown className="w-3 h-3 text-flash/70" />
                <span className="normal-case">{allOpen ? 'Collapse all' : 'Expand all'}</span>
              </button>
            </div>
          )}

          {/* Expanded Sidebar: Accordion Dropdown Sections */}
          {!sidebarCollapsed ? (
            sections.map(section => {
              const isOpen = !!openSections[section.id];
              const hasActiveChild = section.items.some(item => isActive(item.href));
              const SectionIcon = section.icon;

              return (
                <div key={section.id} className="rounded-lg transition-colors">
                  {/* Dropdown Section Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all group select-none',
                      hasActiveChild
                        ? 'text-white bg-white/10 shadow-xs'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SectionIcon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          hasActiveChild ? 'text-flash' : 'text-white/40 group-hover:text-flash'
                        )}
                      />
                      <span className="truncate text-xs">{section.title}</span>
                      {section.badge !== undefined && (
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                            typeof section.badge === 'number' && section.badge > 0
                              ? 'bg-flash/20 text-flash'
                              : 'bg-white/10 text-white/60'
                          )}
                        >
                          {section.badge}
                        </span>
                      )}
                    </div>

                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-white/40 group-hover:text-white/80 shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-0 text-white/70' : '-rotate-90'
                      )}
                    />
                  </button>

                  {/* Dropdown Options */}
                  {isOpen && (
                    <ul className="mt-1 space-y-0.5 ml-3 pl-2.5 border-l border-white/10 animate-fade-in">
                      {section.items.map(item => {
                        const active = isActive(item.href);
                        const ItemIcon = item.icon;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all justify-between group',
                                active
                                  ? 'bg-flash/15 text-flash font-semibold shadow-xs'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                              )}
                              title={item.label}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ItemIcon
                                  className={cn(
                                    'w-3.5 h-3.5 shrink-0 transition-colors',
                                    active ? 'text-flash' : 'text-white/40 group-hover:text-white/80'
                                  )}
                                />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className="text-[10px] bg-waiting/20 text-waiting font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          ) : (
            /* Collapsed Sidebar: Clean Icon-Only Section Launchers */
            <div className="space-y-2 py-1">
              {sections.map(section => {
                const hasActive = section.items.some(item => isActive(item.href));
                const SectionIcon = section.icon;
                return (
                  <div key={section.id} className="relative group flex justify-center">
                    <Link
                      href={section.items[0]?.href || '#'}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                        hasActive
                          ? 'bg-flash/20 text-flash font-bold shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      )}
                      title={section.title}
                    >
                      <SectionIcon className="w-4 h-4" />
                    </Link>
                    {section.badge !== undefined && typeof section.badge === 'number' && section.badge > 0 && (
                      <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-flash animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-ink-soft/50 text-[11px] text-white/40 flex items-center justify-between">
          {!sidebarCollapsed && <span>Flash Sign PM v2.0</span>}
          <button
            onClick={resetDemoData}
            className="hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
            title="Reset demo data"
          >
            Reset
          </button>
        </div>
      </aside>
    </>
  );
}
