'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Calendar, Users,
  Activity, Bot, FileText, CheckCircle2, BarChart3, Settings,
  ChevronDown, PanelLeftClose, PanelLeftOpen, Zap,
  Star, Clock, Compass, Plus, Building2,
  UserCheck, Megaphone, CalendarDays, Palmtree, Video, Flag, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, useCurrentUser, useRoleConfig } from '@/context/app-context';
import { canAccess, ROLE_CONFIGS } from '@/lib/permissions';
import type { DemoRole } from '@/types';
import { useState } from 'react';

const MOCK_WORKSPACES = [
  { id: 'ws1', name: 'Acme Digital', plan: 'Enterprise', color: '#00c2a8' },
  { id: 'ws2', name: 'Northstar Studio', plan: 'Pro', color: '#3b82f6' },
  { id: 'ws3', name: 'Vertex Labs', plan: 'Startup', color: '#8b5cf6' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setDemoRole, resetDemoData, demoRole, projects } = useApp();
  const currentUser = useCurrentUser();
  const roleConfig = useRoleConfig();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(MOCK_WORKSPACES[0]);

  const isActive = (href: string) => {
    if (href === '/projects') return pathname === '/projects';
    if (href === '/teams') return pathname === '/teams';
    if (href === '/planner') return pathname === '/planner';
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

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Collaboration Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Collaboration
              </p>
            )}
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/teams"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Team Overview"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Team Overview</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/directory"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/directory') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Teams Directory"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Teams</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/members"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/members') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Members"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Members</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/workload"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/workload') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Workload"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Workload</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/activity"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/activity') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Team Activity"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Team Activity</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/announcements"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/announcements') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Announcements"
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Announcements</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* Planning Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Planning
              </p>
            )}
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/planner"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Planner"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Planner</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/planner/calendar"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner/calendar') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Calendar"
                >
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Calendar</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/planner/availability"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner/availability') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Availability"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Availability</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/planner/time-off"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner/time-off') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Time Off"
                >
                  <Palmtree className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Time Off</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/planner/meetings"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner/meetings') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Meeting Planner"
                >
                  <Video className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Meeting Planner</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/planner/milestones"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/planner/milestones') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Milestones & Deadlines"
                >
                  <Flag className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Milestones & Deadlines</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace Group */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Workspace
              </p>
            )}
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/projects"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/projects') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Projects"
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Projects</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/projects/my-tasks"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/projects/my-tasks') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="My Tasks"
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>My Tasks</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/notifications"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/notifications') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Notifications</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/teams/settings"
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                    isActive('/teams/settings') ? 'bg-flash/15 text-flash font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title="Settings"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Settings</span>}
                </Link>
              </li>
            </ul>
          </div>
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
