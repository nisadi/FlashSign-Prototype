# FlashSign Prototype: Features, Controls and Data Flow (Version 2)

**What this is:** a screen-by-screen reference for the FlashSign Prototype. For every screen it lists each card, list, chart and button, and explains what it shows, where its data comes from, how values are calculated, and what happens when you use it.
**Based on:** the code in `flash-sign-proto/` at commit `ef89bc5` (30 October 2026). Every statement was checked against the source code, and code references are given as `path:line` (relative to `flash-sign-proto/`).
**Builds on:** `Features version 1.md`, which listed what the app is *supposed* to do. This version describes what the code *actually* does, and marks the places where the two differ.
**Readers:** product owner, developers, testers and AI agents writing the SRS.

---

## Contents

- **1. How to read this document**
    - 1.1 Layout of each screen entry
    - 1.2 Words used in this document
    - 1.3 Scope: which app this document covers
- **2. How the app works under the hood**
    - 2.1 The big picture
    - 2.2 The two stores
    - 2.3 What survives a page refresh (important)
    - 2.4 What happens when the app starts
    - 2.5 Things that run by themselves (background automation)
    - 2.6 Feature flags (`src/lib/features.ts`)
    - 2.7 Roles and permissions
    - 2.8 The data model (main records)
    - 2.9 Route map
    - 2.10 Resetting the demo
- **3. App shell and global navigation**
    - 3.1 Root page and app providers — `/`
    - 3.2 Workspace layout and sign-in guard — every page under `src/app/(workspace)/`
    - 3.3 Top header — shown on every workspace page
    - 3.4 Notification bell popover and notification actions
    - 3.5 Left sidebar — shown on every workspace page
    - 3.6 Global search dialog
    - 3.7 Quick Create dialog ("+ New" in the header)
    - 3.8 Toasts and prototype notices
    - 3.Z Data flow summary for this area
- **4. Sign-in, onboarding, workspaces and personal settings**
    - 4.1 How sign-in really works (DemoAuthContext, preset accounts, storage, sync into AppContext)
    - 4.2 Log in — `/login`
    - 4.3 Sign up — `/signup` (and `/register`)
    - 4.4 Create organization — `/onboarding/create-organization` (and `/onboarding`)
    - 4.5 Forgot password — `/forgot-password`
    - 4.6 Reset password — `/reset-password`
    - 4.7 Accept invitation — `/invite/[token]`
    - 4.8 Workspace selection (legacy onboarding step 1) — `/workspace`
    - 4.9 Guided workspace setup — `/workspace/new`
    - 4.10 Onboarding profile — `/onboarding/profile`
    - 4.11 Onboarding preferences — `/onboarding/preferences`
    - 4.12 Onboarding complete — `/onboarding/complete`
    - 4.13 Prototype home — `/prototype-home`
    - 4.14 Settings frame and tabs — `/settings`
    - 4.15 Settings › Profile — `/settings/profile`
    - 4.16 Settings › My Signature — `/settings/signature`
    - 4.17 Settings › Preferences — `/settings/preferences`
    - 4.18 Settings › Notifications — `/settings/notifications`
    - 4.19 Settings › Security — `/settings/security`
    - 4.20 Settings › Users & Roles — `/settings/users`
    - 4.Z Data flow summary for this area
- **5. Dashboards, project lists and the new-project wizard**
    - 5.1 How project progress %, health and timeline are calculated (used on many cards)
    - 5.2 Executive dashboard — `/dashboard`
    - 5.3 Project Management home ("Dashboard" in the sidebar) — `/projects/home`
    - 5.4 Quick Create dialog (opened from "+ Create Item") — modal
    - 5.5 All Projects — `/projects`
    - 5.6 Favorited Projects — `/projects/favorites`
    - 5.7 Recently Viewed Projects — `/projects/recent`
    - 5.8 Multi-Project Strategic Roadmap — `/projects/roadmap`
    - 5.9 Project Planner & Schedule — `/projects/planner`
    - 5.10 My Tasks — `/projects/my-tasks` (and `/my-tasks`)
    - 5.11 Activity Feed — `/activity`
    - 5.12 Task page (stand-alone) — `/tasks/[taskId]`
    - 5.13 Create New Project wizard — `/projects/new`
    - 5.Z Data flow summary for this area
- **6. Inside a project: header, overview, plan, schedule, sprints, team, activity and settings**
    - 6.1 Project header and tab bar (shown on every project page)
    - 6.2 "+ New" menu and the dialogs it opens
    - 6.3 Overview — `/projects/[projectId]`
    - 6.4 Plan — `/projects/[projectId]/plan`
    - 6.5 Schedule (Gantt) — `/projects/[projectId]/timeline`
    - 6.6 Sprints — `/projects/[projectId]/sprints`
    - 6.7 Sprint planning — `/projects/[projectId]/sprints/[sprintId]`
    - 6.8 Team — `/projects/[projectId]/team`
    - 6.9 Activity — `/projects/[projectId]/activity`
    - 6.10 Milestones (old route) — `/projects/[projectId]/milestones`
    - 6.11 Settings — `/projects/[projectId]/settings`
    - 6.12 Shared calculation helpers used in this area (reference)
    - 6.Z Data flow summary for this area
- **7. Kanban boards, task list, task drawer and time tracking**
    - 7.1 Kanban board — `/projects/[projectId]/board`
    - 7.2 Board Columns dialog (modal)
    - 7.3 Project Settings › Boards card — `/projects/[projectId]/settings#boards`
    - 7.4 Task list — `/projects/[projectId]/tasks`
    - 7.5 Create Task / Add Subtask modal
    - 7.6 Create New Task page — `/projects/[projectId]/tasks/new`
    - 7.7 Task Detail Drawer (global, opens over any workspace page)
    - 7.8 Drawer › Progress tab (Time log + "What actually happened")
    - 7.9 Drawer › Journey tab
    - 7.10 "Subtasks still open" dialog (`useGuardedMove`)
    - 7.11 Reassign Task dialog
    - 7.Y Task and timer state machine (as implemented)
    - 7.Z Data flow summary for this area
- **8. Project files, SRS-to-task generation and reports**
    - 8.1 Project Files — `/projects/[projectId]/files`
    - 8.2 "Attach Mock File" dialog (upload) — on `/projects/[projectId]/files`
    - 8.3 File preview modal — on `/projects/[projectId]/files`
    - 8.4 Classify Document modal
    - 8.5 SRS Document Workflow modal ("Analyze & Create Tasks")
    - 8.6 Review Generated Tasks modal
    - 8.7 "Tasks Generated from SRS" history modal
    - 8.8 Project Reports — Overview tab — `/projects/[projectId]/reports`
    - 8.9 Overview health checks — full rule list (`projectHealth`, `src/lib/project-health.ts:67-311`)
    - 8.10 Project Reports — Timeline tab
    - 8.11 Task time report (component) — Project "Task time" tab and `/reports/task-time`
    - 8.12 Company Reports & Analytics — `/reports`
    - 8.13 Task time — `/reports/task-time`
    - 8.14 Agreement Reports — `/agreements/reports`
    - 8.15 CSV exports — how they are built
    - 8.Z Data flow summary for this area
- **9. AI Agent Hub (MCP connection, tokens, timesheet and agent settings)**
    - 9.1 Hub entry, tab bar and old redirect routes — `/ai-agents`, `/ai-agents/activity`, `/ai-agents/timesheet`
    - 9.2 How it works (overview + live demo) — `/ai-agents/how-it-works`
    - 9.3 Connect your AI agent (setup guide) — `/ai-agents/connect`
    - 9.4 Create token dialog (modal)
    - 9.5 My Tokens — `/ai-agents/tokens`
    - 9.6 Organisation (agent rules for the whole org) — `/ai-agents/organisation`
    - 9.7 Agent run detail (old demo page) — `/ai-agents/runs/[runId]`
    - 9.8 Shared agent components used on other screens
    - 9.9 Store actions behind the hub (reference)
    - 9.10 Are the organisation agent settings actually enforced?
    - 9.11 Token storage and security (prototype)
    - 9.Z Data flow summary for this area
- **10. Agreements, e-signatures and company seals**
    - 10.1 Agreements Home — `/agreements`
    - 10.2 Agreements top tabs and `/signatures` layout
    - 10.3 All Signature Requests — `/signatures/all`
    - 10.4 Waiting for My Signature (tab "Action Required") — `/signatures/waiting`
    - 10.5 Sent Requests — `/signatures/sent`
    - 10.6 Completed Signatures — `/signatures/completed`
    - 10.7 Declined Requests — `/signatures/declined`
    - 10.8 Expired Signature Requests — `/signatures/expired`
    - 10.9 Draft Requests — `/signatures/drafts`
    - 10.10 Request Signature wizard — `/signatures/new`
    - 10.11 Request detail (Signing progress) — `/signatures/[requestId]`
    - 10.12 Field Placement Studio — `/signatures/[requestId]/fields`
    - 10.13 Simulated Audit Trail — `/signatures/[requestId]/audit`
    - 10.14 Signing complete — `/signatures/[requestId]/complete`
    - 10.15 Signing experience — `/signatures/sign/[requestId]`
    - 10.16 Agreement settings — `/signatures/settings`
    - 10.X Key questions answered
    - 10.Y Signature request state machine (as implemented)
    - 10.Z Data flow summary for this area
- **11. Documents, templates, contracts and approvals**
    - 11.1 Documents area shell and shared parts — `/documents`
    - 11.2 All Documents — `/documents/all`
    - 11.3 Upload Demo Document dialog (modal)
    - 11.4 Move Document dialog (modal)
    - 11.5 My Documents — `/documents/mine`
    - 11.6 Shared with Me — `/documents/shared`
    - 11.7 Recent Documents — `/documents/recent`
    - 11.8 Favorites — `/documents/favorites`
    - 11.9 Folder Management — `/documents/folders`
    - 11.10 Create Document — `/documents/new`
    - 11.11 Document Details — `/documents/[documentId]`
    - 11.12 Document Content Editor — `/documents/[documentId]/edit`
    - 11.13 Document Templates — `/documents/templates`
    - 11.14 Template Preview & Use dialog (modal)
    - 11.15 Create Document Template — `/documents/templates/new`
    - 11.16 Contracts module — feature flag and reachability
    - 11.17 Contracts Overview — `/contracts` (hidden by flag, URL-only)
    - 11.18 Contract Registry — `/contracts/all` (URL-only)
    - 11.19 Draft Contracts — `/contracts/drafts` (URL-only)
    - 11.20 Contract Review Queue — `/contracts/review` (URL-only)
    - 11.21 Awaiting Signature — `/contracts/awaiting` (URL-only)
    - 11.22 Active Contracts — `/contracts/active` (URL-only)
    - 11.23 Expiring Contracts — `/contracts/expiring` (URL-only)
    - 11.24 Completed Contracts — `/contracts/completed` (URL-only)
    - 11.25 Archived Contracts — `/contracts/archived` (URL-only)
    - 11.26 Create New Contract — `/contracts/new` (URL-only)
    - 11.27 Contract Details — `/contracts/[contractId]` (URL-only)
    - 11.28 Approval Center — `/approvals`
    - 11.Z Data flow summary for this area
- **12. Teams, members and planning (calendar, availability, meetings, time off)**
    - 12.1 Team Analytics — `/teams`
    - 12.2 Members directory — `/teams/members` (tabs: Members, Invited `?tab=invited`)
    - 12.3 Invite people dialog
    - 12.4 Add / Edit Team Member dialog
    - 12.5 Member profile — `/teams/members/[memberId]`
    - 12.6 Add Member page — `/teams/members/new`
    - 12.7 Workload — `/teams/workload`
    - 12.8 Timesheet — `/teams/timesheet` (`?view=team`, `?log=1`)
    - 12.9 Team Activity feed — `/teams/activity`
    - 12.10 Announcements board — `/teams/announcements`
    - 12.11 Post / Edit Announcement dialog
    - 12.12 New announcement page — `/teams/announcements/new`
    - 12.13 Notifications Center — `/teams/notifications`
    - 12.14 Hidden Teams feature: Teams Directory, Team detail, New/Edit team, Create Team dialog
    - 12.15 `/teams/settings`
    - 12.16 Planning layout and redirect routes
    - 12.17 Calendar — `/planner/calendar` (`?category=…`)
    - 12.18 Create / Edit Calendar Event dialog
    - 12.19 Meetings — `/planner/meetings`
    - 12.20 Schedule Meeting dialog
    - 12.21 Meeting detail drawer
    - 12.22 Full scheduler page — `/planner/meetings/new`
    - 12.23 Availability & Time Off — `/planner/availability`
    - 12.24 Request Time Off dialog
    - 12.25 Not used anywhere: Create Milestone dialog
    - 12.26 Formula reference and shared behaviour
    - 12.Z Data flow summary for this area
- **13. Findings register: what is real, simulated, missing or broken**
    - 13.1 Platform-wide
    - 13.2 Sign-in, accounts and settings
    - 13.3 Shell and navigation
    - 13.4 Projects, plan and schedule
    - 13.5 Boards, tasks and time tracking
    - 13.6 Files, SRS and reports
    - 13.7 AI Agent Hub
    - 13.8 Agreements and e-signatures
    - 13.9 Documents, contracts and approvals
    - 13.10 Teams and planning
- **14. "Features version 1" compared with the actual code**
- **15. Using this document**

---


## 1. How to read this document

### 1.1 Layout of each screen entry
Each screen has the same parts:

1. **File:** the source files that draw the screen.
2. **Who can open it:** login checks, role checks and feature flags.
3. **Purpose:** what the screen is for.
4. **Data this screen reads:** each piece of data and where it comes from (store field, seed file or calculation).
5. **Cards, widgets and lists:** for every card, tile, chart, list and badge: what it shows, its data source, the exact calculation, and what shows when there is no data.
6. **Buttons and controls:** one row per button, link, tab, filter, toggle, input and drag action: what happens, which data changes, whether the change survives a page refresh, and side effects (toast, notification, activity log, timer, navigation).
7. **Notes, limits and simulated parts:** fake behaviour, hard-coded numbers, buttons that do nothing, missing checks.

Each area ends with a **data flow summary**: the data it reads, the data it writes, and the store actions it uses.

### 1.2 Words used in this document
| Word | Meaning |
|---|---|
| **Store** | The in-browser data holder. There are two: `AppContext` (business data) and `DemoAuthContext` (login and accounts). See §2.2. |
| **Seed / mock data** | Sample records written in `src/data/*.ts`. The app starts from these. |
| **Store action** | A function in a store that changes data, e.g. `addTask`, `updateProject`. |
| **Saved after refresh** | Whether the change is still there after reloading the page (written to the browser's localStorage). See §2.3. |
| **Derived** | Calculated from other data each time the screen draws; not stored. |
| **Simulated** | Looks real on screen but does nothing real (no email sent, no AI called, no file read). |
| **Hidden by flag** | Switched off in `src/lib/features.ts`. The code is still there but the entry points are hidden. |

### 1.3 Scope: which app this document covers
The repository root holds three requirement-type documents. They do **not** all describe the same app:

| Document | What it describes |
|---|---|
| `flash-sign-proto/` (this document) | The Next.js prototype: project management + e-signatures + AI Agent Hub. **Browser only: no server, database or real email.** |
| `FLASH_SIGN_FEATURES.md` (repo root) | A **different, narrower** e-signature app with an Express API, PostgreSQL (Drizzle), JWT login, real email (Nodemailer) and real PDF handling (pdf.js / pdf-lib). None of that code is in this repository's `flash-sign-proto/` app. |
| `Features version 1.md` | The feature list for `flash-sign-proto`, plus a plan for checking it. Several claims there are only partly true; differences are marked in this document. |

Do not merge the backend facts from `FLASH_SIGN_FEATURES.md` into requirements for this prototype.

---

## 2. How the app works under the hood

### 2.1 The big picture
- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Charts use Recharts; drag-and-drop uses dnd-kit. Zod and react-hook-form are used for some forms. (`package.json`)
- **No backend.** There are no API routes, no server actions, no database, no email sender, no AI model calls and no MCP server in this app. Every page is a client component that reads and writes data held in the browser.
- **Where the data starts:** sample data in `src/data/`:

| Seed file | What it seeds |
|---|---|
| `src/data/mock-data.ts` | users, demo-role users, organisation, teams, projects, sprints, milestones (phases), epics, stories, tasks, project files, SRS task history, agent runs, simple documents, approvals, notifications, audit logs |
| `src/data/mock-collaboration.ts` | calendar events, time-off requests, meetings, announcements, collaboration settings |
| `src/data/mock-documents.ts` | document folders, templates, document items, contracts, signature requests |
| `src/data/mock-signing.ts` | signing defaults, company seals |
| `src/data/mock-agent-activity.ts` | work sessions (timers), agent events, task status changes, agent settings, agent tokens |
| `src/data/mock-analytics.ts` | weekly task flow chart numbers (hard-coded) |
| `src/types/demo-auth.ts` | preset login accounts (`DEMO_PRESET_USERS`) and starter workspaces |

### 2.2 The two stores
Both wrap the whole app in `src/app/layout.tsx` (`DemoAuthProvider` outside, `AppProvider` inside).

**A. `AppContext`: all business data**: `src/context/app-context.tsx`
- Read with `useApp()` and shortcut hooks (`useProjects()`, `useTasks()`, `useCurrentUser()`, `useCurrentRole()`, `useRoleConfig()`, `useNotifications()`, `useDocumentItems()`, `useSignatureRequests()`, etc. at `src/context/app-context.tsx:2574` onwards).
- State shape `AppState` at `src/context/app-context.tsx:61`; all actions `AppActions` at about `:268–437`.
- Saved to localStorage key **`flashsign-proto-state-v6`** after every change (`saveState`, `:520`).

**B. `DemoAuthContext`: login, accounts, workspaces**: `src/context/demo-auth-context.tsx`
- Read with `useDemoAuth()`.
- Holds the signed-in user, the list of registered users, workspaces (organisations), the selected workspace, personal preferences, onboarding progress, pending sign-up and invitations.
- Saved under separate localStorage keys (`src/lib/storage.ts`):
  `flashsign_demo_user`, `flashsign_demo_users_list`, `flashsign_demo_workspaces`, `flashsign_demo_selected_workspace`, `flashsign_demo_preferences`, `flashsign_demo_completed_steps`, `flashsign_demo_session_active`, `flashsign_demo_pending_signup`, `flashsign_demo_auth_success_msg`, `flashsign_demo_invitations`.

**How the two stores connect** (`src/context/app-context.tsx:620–672`): whenever the signed-in account changes, AppContext:
1. adds or updates that person in `users` (matched by id or email), copying name, initials, title, department, colour and time zone;
2. sets `currentUserId` to that person's id;
3. sets `demoRole` to the account's role (`executive` → `ceo`, `qa` → `qa_tester`, other roles unchanged);
4. copies the workspace name and slug into `org`.

> **So the active role is the signed-in account's role.** `FIXED_DEMO_ROLE = 'ceo'` (`src/lib/features.ts`) only applies before this sync runs, e.g. on first load. Signing in as a developer preset account gives the developer role, even with the role switcher hidden.
>
> **The default demo account (`demo@flashsign.com`) has role `org_admin`**, even though the login card says "Owner / CEO". No preset account maps to `ceo`. For `org_admin`, `canCreateTask`, `canSignDocument` and `canRunAgent` are all **false**. The account's id (`user-demo`) owns no seed tasks, notifications, approvals or signature requests, so many "my …" lists are empty for it. Details in §4.1.

### 2.3 What survives a page refresh (important)
`saveState()` (`src/context/app-context.tsx:520–559`) saves only some collections. The rest **reset to the seed data on every reload**.

| Saved (survives refresh) | **Not saved (lost on refresh)** |
|---|---|
| users, teams, projects, tasks, sprints, milestones (phases), epics, stories, project files, SRS task histories | **documentItems** (Documents area) |
| documents (simple list), approvals, notifications | **documentFolders** |
| calendarEvents, timeOffRequests, meetings, announcements, collaborationSettings | **documentTemplates** |
| savedSignatures, signingDefaults, companySeals | **contracts** |
| agentTokens, workSessions (timers), agentEvents, agentSettings, agentRuns | **signatureRequests** (all agreements / e-signature requests) |
| taskStatusChanges (card moves), demoRole, currentUserId | **auditLogs** and **activities** (activity feeds) |
| sidebarCollapsed, recentProjectIds | org (re-copied from the auth store), activeTaskDrawerId |

**What this means for users:** creating a signature request, signing it, uploading or editing a document, making a folder or template, editing a contract, or anything that only adds to the activity feed **works until the page reloads, then disappears.** Project management data (projects, tasks, timers, plans) is kept.

Also, if saved `tasks`, `milestones` or `projects` are an empty list, the seed data is loaded instead (`loadState`, `:493–518`). So deleting every task or project brings the samples back after a refresh.

### 2.4 What happens when the app starts
1. `AppProvider` first renders the seed state, then in a `useEffect` loads `flashsign-proto-state-v6` and merges it over the seed (`:562–582`).
2. Every project's timeline and health is **recalculated** from its tasks, phases and card moves (`calculateProjectTimeline`, `src/lib/timeline-calculator.ts`). This happens on every load, so dates shown are always relative to *today*.
3. On screens narrower than 1024 px the sidebar starts collapsed.
4. `DemoAuthProvider` reads its own keys. Until both are loaded, the workspace layout shows "Loading workspace session…".
5. The workspace layout (`src/app/(workspace)/layout.tsx`) then sends you to `/login` if no one is signed in, or to `/onboarding/create-organization` if the account has not finished organisation setup.
6. The signed-in account is synced into AppContext (§2.2).

### 2.5 Things that run by themselves (background automation)
All run in the browser tab only. **If no tab is open, nothing runs.**

| What | Where | How it works |
|---|---|---|
| Timer auto-stop | `src/context/app-context.tsx:589–620`, `applyAutoStops` in `src/lib/task-time.ts` | Every 60 seconds (and once on load), open work sessions are checked against the idle limit and day cutoff in `agentSettings`. Sessions that went over are stopped with `endReason` `idle_timeout` or `day_cutoff`, marked `needsReview`, and an agent event is added. Details in §7. |
| Activity heartbeat | same effect | Any click or key press (at most once per minute) updates `lastActivityAt` on the current user's open **web** timer, so active users are not idle-stopped. Agent timers are not touched. |
| Persist | `:584` | After any state change, AppContext is written to localStorage. |
| Window resize | `:572` | Below 1024 px wide, the sidebar is forced to collapse. |

There is **no** scheduler for signature reminders or expiry, and no email. Those are covered as simulated in §10.

### 2.6 Feature flags (`src/lib/features.ts`)
| Flag | Value | Effect |
|---|---|---|
| `teams` | `false` | Teams ("squads") are hidden: Teams Directory, team cards, Create Team, team badges, team filters and team pickers. Team data stays in the store. Details in §12. |
| `contracts` | `false` | Contracts as a separate record type are hidden: the Contracts tab under Documents, linking a contract to a signature request, contract counts in Agreements reports. Contract data and routes remain. Details in §11. |
| `roleSwitcher` | `false` | The "Role: …" persona switcher in the sidebar is hidden. The role comes from the signed-in account (§2.2). |

### 2.7 Roles and permissions
There are 12 roles (`DemoRole`, `src/types/index.ts:3`). Each has a label, a colour, a default landing page and a list of navigation groups (`ROLE_CONFIGS`, `src/lib/permissions.ts`).

| Role | Navigation groups | Default page |
|---|---|---|
| `ceo` | dashboard, projects, approvals, documents, reports | `/dashboard` |
| `project_manager` | dashboard, projects, my-tasks, planner, teams, approvals, reports | `/dashboard` |
| `product_owner` | dashboard, projects, my-tasks, planner, ai-agents | `/dashboard` |
| `engineering_lead` | dashboard, projects, my-tasks, teams, ai-agents, reports | `/dashboard` |
| `developer` | dashboard, my-tasks, projects, ai-agents | `/my-tasks` |
| `qa_tester` | dashboard, my-tasks, projects, ai-agents | `/my-tasks` |
| `org_admin` | dashboard, teams, activity, settings | `/settings/users` |
| `document_manager` | dashboard, documents, approvals, reports | `/agreements` |
| `client` | documents | `/agreements` |
| `auditor` | documents, activity, reports, settings | `/reports` |
| `platform_admin` | dashboard, teams, settings, reports | `/dashboard` |
| `integration_service` | activity | `/activity` |

Permission helper functions (`src/lib/permissions.ts`):

| Helper | Roles allowed |
|---|---|
| `canCreateProject` | ceo, project_manager, product_owner, engineering_lead, org_admin, platform_admin |
| `canCreateTask` | project_manager, product_owner, engineering_lead, developer, qa_tester |
| `canApprove` | ceo, project_manager, engineering_lead, document_manager, org_admin |
| `canRunAgent` | developer, engineering_lead, product_owner |
| `canManageDocuments` | document_manager, org_admin, ceo, platform_admin |
| `canSignDocument` | ceo, client, project_manager, document_manager |
| `canManageUsers` | ceo, org_admin, platform_admin |
| `canViewReports` | ceo, project_manager, engineering_lead, org_admin, platform_admin, auditor, document_manager |
| `canManageAgents` | ceo, org_admin, platform_admin |
| `canViewTeamTime` | ceo, project_manager, engineering_lead, org_admin, platform_admin |

> **Important:** these checks only hide or show things in the browser. With no server, nothing *enforces* them: any page can be opened by typing its URL unless that page checks the role itself. Each section says which screens actually check a permission.
>
> **The "Navigation groups" column is not used by the sidebar.** The sidebar shows the same links for every role (§3.5), so the table above is configuration only. The "Default page" is also not where login goes: login always lands on `/dashboard`, while the sidebar's "Dashboard" link opens `/projects/home`.

### 2.8 The data model (main records)
Types are in `src/types/index.ts`, `src/types/documents.ts`, `src/types/collaboration.ts` and `src/types/demo-auth.ts`.

| Record | Key fields | Links to | Store key |
|---|---|---|---|
| **User** | id, name, email, initials, role, title, department, color, isActive, teamIds, projectIds, timeZone, workingHours, skills, availability (`available/busy/focus_time/out_of_office`), weeklyCapacity, company, phone, address | teams, tasks (assignee), sessions | `users` |
| **Organization** | name, slug | (one per app) | `org` |
| **Project** | id, key, name, status (`planning/active/on_hold/completed/cancelled/archived`), health (`on_track/at_risk/off_track/delayed`), healthMode (`auto/manual`), priority, ownerId, memberIds, teamIds, start/end dates, original vs current dates, timelineStatus, progress, durationUnit, **structure**, boardColumns, mainBoardName, extraBoards, baselineHistory, isFavorite, isArchived | tasks, phases, epics, stories, sprints, files | `projects` |
| **ProjectStructure** | phases, epics, stories, subtasks, backlog, allowMove (all on/off) | project | inside project |
| **Phase** (stored as **Milestone**) | id, projectId, name, description, startDate, endDate, dueDate, status (`upcoming/at_risk/completed/missed/pending/achieved`), progress, estimatedDuration, durationUnit | epics, stories, tasks (`task.milestoneId`) | `milestones` |
| **Epic** | id, projectId, **phaseId**, name, description, color, optional start/end (missing = whole phase), durationUnit | stories, tasks | `epics` |
| **Story** | id, projectId, epicId, phaseId (when no epics), title, description, acceptanceCriteria, priority, optional start/end (missing = whole epic) | tasks | `stories` |
| **Task** | id, key (e.g. `FS-42`), title, type (`story/bug/task/epic/subtask`), status (`todo/in_progress/review/done/blocked`), boardId, columnId, priority, assigneeId, reporterId, **parentId** (for subtasks), milestoneId/epicId/storyId, sprintId, estimatedDuration (days), durationUnit, effortMinutes, start/due dates, tags, comments, attachments (names only), checklist, acceptanceCriteria, SRS source fields | project, plan items, sprint, parent task | `tasks` |
| **BoardColumn / ProjectBoard** | column: id, name, color, status (the one task stage it stands for). Extra board: id, name, optional own columns. **No columns = it mirrors the main board's columns.** | project | inside project |
| **Sprint** | id, projectId, name, goal, status (`planned/planning/active/completed`), dates, capacity | tasks | `sprints` |
| **WorkSession** (timer) | id, userId, taskId, startedAt, endedAt, lastActivityAt, source (`web`, `manual`, or agent name), endReason (`paused/finished/switched_task/idle_timeout/day_cutoff`), needsReview, note | task, user | `workSessions` |
| **TaskStatusChange** (card move) | taskId, from, to, at, byUserId, via (`web` or agent), from/to board | task | `taskStatusChanges` |
| **ProjectFile** | id, projectId, taskId, name, type, size (text, e.g. "2.4 MB"), uploadedBy, category (`srs/test_report/doc/other`), analysisStatus (`not_analyzed/analyzed/tasks_created`), analyzedAt, tasksGeneratedCount. **No field for the file's contents: only details about the file are kept.** | SRS history, tasks | `files` |
| **SrsGeneratedTaskRecord** | proposal, edits, outcome (`accepted/rejected`), reason, created task id | file | `srsTaskHistories[fileId]` |
| **AgentAccessToken** | id, userId, name, **lastFour** (only the last 4 characters are stored, not the full token), createdAt, expiresAt, lastUsedAt, usedBy (per agent), revokedAt | user | `agentTokens` |
| **AgentEvent** | userId, taskId, agent, action (`listed_tasks/started/continued/paused/note/finished/time_logged/auto_stopped`), detail, at | task | `agentEvents` |
| **AgentSettings** | enabled, allowedAgents, idleTimeoutMinutes, dayCutoff, allowClaimUnassigned, blockedProjectIds | organisation | `agentSettings` |
| **DocumentItem / Folder / Template** | content (text/markdown), folder, versions, comments, favourite, archived; template placeholders | each other | `documentItems`, `documentFolders`, `documentTemplates` (**not saved**) |
| **Contract** | type, counterparty, value, dates, renewal, reviewers, review comments, status | signature request | `contracts` (**not saved**) |
| **SignatureRequest** | title, signers (order, status), fields, signing order, expiry, reminders, status, audit trail | document / contract | `signatureRequests` (**not saved**) |
| **SavedSignature / SigningDefaults / CompanySeal** | signature image or typed text; default expiry/reminders; seal image, allowed roles, usage count | user / org | saved |
| **ApprovalRequest** | id, documentId, requestedBy, assignedTo, status (`pending/approved/rejected/changes_requested`), comment, createdAt, resolvedAt | document | `approvals` |
| **Notification** | id, userId, title, body, type (`task/document/agent/approval/system`), isRead, link, createdAt | user | `notifications` |
| **AuditLog** | id, actorId, actorName, action, resource, resourceId, detail, ipAddress, timestamp | anything | `auditLogs`, `activities` (**not saved**) |
| **CalendarEvent, TimeOffRequest, Meeting, Announcement** | see §12 | users, projects | saved |
| **DemoUser / DemoWorkspace / DemoInvitation** | login accounts, workspaces, invites | auth store | `flashsign_demo_*` keys |

### 2.9 Route map
Pages under `src/app/(auth)` need no login; pages under `src/app/(workspace)` need a signed-in user with a set-up organisation. Routes marked **→** only redirect.

| Area | Routes | Section |
|---|---|---|
| Entry | `/` → `/login` | §3 |
| Sign-in and onboarding | `/login`, `/signup`, `/register`, `/forgot-password`, `/reset-password`, `/invite/[token]`, `/onboarding` (+ `/profile`, `/create-organization`, `/preferences`, `/complete`), `/workspace`, `/workspace/new`, `/prototype-home` | §4 |
| Settings | `/settings` → `/settings/profile`; `/settings/profile`, `/signature`, `/preferences`, `/notifications`, `/security`, `/users` | §4 |
| Dashboards and lists | `/dashboard`, `/projects/home`, `/projects`, `/projects/favorites`, `/projects/recent`, `/projects/roadmap`, `/projects/planner`, `/projects/my-tasks`, `/my-tasks` (same page), `/activity`, `/tasks/[taskId]`, `/projects/new` | §5 |
| Inside a project | `/projects/[id]` (Overview), `/plan`, `/timeline` (Schedule), `/sprints`, `/sprints/[sprintId]`, `/team`, `/activity`, `/settings`, `/milestones` → `/plan` | §6 |
| Boards and tasks | `/projects/[id]/board`, `/projects/[id]/tasks`, `/projects/[id]/tasks/new`, task drawer (opens on any page) | §7 |
| Files, SRS, reports | `/projects/[id]/files`, `/projects/[id]/reports`, `/reports`, `/reports/task-time`, `/agreements/reports` | §8 |
| AI Agent Hub | `/ai-agents` → `/ai-agents/how-it-works`; `/connect`, `/tokens`, `/organisation`, `/runs/[runId]`; `/ai-agents/activity` → `/projects/home`; `/ai-agents/timesheet` → `/teams/timesheet` | §9 |
| Agreements and signatures | `/agreements`, `/signatures` → `/signatures/all`; `/all`, `/waiting`, `/sent`, `/completed`, `/declined`, `/expired`, `/drafts`, `/new`, `/[requestId]`, `/[requestId]/fields`, `/[requestId]/audit`, `/[requestId]/complete`, `/sign/[requestId]`, `/settings` | §10 |
| Documents, contracts, approvals | `/documents` → `/documents/all`; `/all`, `/mine`, `/recent`, `/shared`, `/favorites`, `/folders`, `/new`, `/templates`, `/templates/new`, `/[documentId]`, `/[documentId]/edit`; `/contracts` and 11 sub-routes; `/approvals` | §11 |
| Teams and planning | `/teams`, `/teams/directory`, `/members`, `/members/new`, `/members/[memberId]`, `/new`, `/[teamId]`, `/[teamId]/edit`, `/activity`, `/announcements`, `/announcements/new`, `/notifications`, `/timesheet`, `/workload`, `/teams/settings` → `/settings/preferences`; `/planner` → `/planner/calendar`; `/planner/availability`, `/calendar`, `/meetings`, `/meetings/new`; `/planner/milestones` → calendar (milestone filter); `/planner/time-off` → `/planner/availability`; `/planner/milestones/new`, `/planner/time-off/new` | §12 |

### 2.10 Resetting the demo
- **AppContext:** `resetDemoData()` (`src/context/app-context.tsx:2563`) removes `flashsign-proto-state-v6` and reloads the seed state.
- **DemoAuthContext:** `resetDemo()` (`src/context/demo-auth-context.tsx:~745`) restores the preset users and starter workspaces, signs in as the first preset user, and clears invitations and pending sign-up.
- Where each is triggered from (e.g. `/prototype-home`) is covered in §4.

---

## 3. App shell and global navigation

This section covers the frame that sits around every workspace page: the root redirect, the
workspace layout guard, the dark left sidebar, the top header (breadcrumbs, search, **+ New**,
notification bell, user menu), the global search box, the Quick Create dialog and the small
"toast" messages. None of these parts talk to a server. They read and write the two browser-side
stores (`AppContext` and `DemoAuthContext`).

> **Important correction to the shared brief (verified in code):** the app does **not** always run
> as role `ceo`. `FIXED_DEMO_ROLE` is only used by `getInitialState()` / `loadState()`
> (`src/context/app-context.tsx:449-450`, `:512`). As soon as someone is signed in, the effect at
> `src/context/app-context.tsx:622-672` overwrites `demoRole` and `currentUserId` with the
> signed-in DemoAuth account (see 4.1). The default demo account `demo@flashsign.com` has role
> `org_admin`, so the default effective role is **Org Admin**, not CEO.

### 3.1 Root page and app providers — `/`

**File:** `src/app/page.tsx`, `src/app/layout.tsx`
**Who can open it:** Anyone.
**Purpose:** `/` sends the visitor to the login page. The root layout wraps every page in both stores.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Nothing | — | `/` is a server-side `redirect('/login')` (`src/app/page.tsx:4`) |

**Cards, widgets and lists**

#### Provider tree
- **Shows:** nothing visible.
- **Data source:** `src/app/layout.tsx:27-29` renders `<DemoAuthProvider><AppProvider>{children}</AppProvider></DemoAuthProvider>`.
- **How it is calculated:** `DemoAuthProvider` is the outer one, so `AppProvider` can call `useDemoAuth()` and copy the signed-in user into its own `users` list (4.1).
- **Empty state:** n/a.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Open `/` | Redirects to `/login` | none | n/a | none |

**Notes, limits and simulated parts**
- `/` always goes to `/login`, even when the user is already signed in. The login page does not
  check for an existing session, so a signed-in user who opens `/` sees the login form again.
- Page `<title>` is "Flash Sign — Authentication & Onboarding Prototype" (`src/app/layout.tsx:15`) for every page that does not set its own.

### 3.2 Workspace layout and sign-in guard — every page under `src/app/(workspace)/`

**File:** `src/app/(workspace)/layout.tsx` (+ `AppSidebar`, `AppHeader`, `TaskDetailDrawer`, `Toaster`)
**Who can open it:** Only a signed-in DemoAuth user whose `organizationSetupCompleted` is true.
**Purpose:** Protects all workspace pages and draws the sidebar, header, task drawer and toasts around them.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `isHydrated`, `isAuthenticated`, `currentUser` | `useDemoAuth()` (`src/app/(workspace)/layout.tsx:17`) | DemoAuth finishes reading localStorage before `isHydrated` becomes true |
| `sidebarCollapsed` | `useApp()` (`:16`) | decides left margin `lg:ml-16` or `lg:ml-60` (`:53`) |

**Cards, widgets and lists**

#### "Loading workspace session..." placeholder
- **Shows:** a pulsing yellow Zap logo and the text "Loading workspace session...".
- **Data source:** the guard flags above.
- **How it is calculated:** shown while `!isHydrated || !isAuthenticated || !currentUser || !currentUser.organizationSetupCompleted` (`:30-44`).
- **Empty state:** n/a.

#### Page frame
- **Shows:** `AppSidebar` (3.5), `AppHeader` (3.3), the page itself inside a scrolling `<main>`, the global `TaskDetailDrawer` and the `Toaster` (`:46-63`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| (automatic) not signed in | `router.replace('/login')` (`:22-23`) | none | n/a | none |
| (automatic) signed in but org setup not done | `router.replace('/onboarding/create-organization')` (`:24-25`) | none | n/a | none |

**Notes, limits and simulated parts**
- The guard checks only that someone is signed in. It does **not** check role permissions for any
  page. Permission checks, where they exist, are inside each page.
- In practice the second redirect almost never fires: `login()` refuses users whose organization
  setup is incomplete (4.2), so such a user never becomes `currentUser`.
- For one render after sign-in, `AppContext` may still point at the seed user `u1` (Aria Chen, CEO)
  because the sync effect (4.1) runs after the first render of the frame.

### 3.3 Top header — shown on every workspace page

**File:** `src/components/layout/app-header.tsx`
**Who can open it:** Any signed-in user (part of the workspace layout).
**Purpose:** Breadcrumb trail, search button, **+ New** (Quick Create), notification bell and user menu.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Current URL | `usePathname()` (`:24`) | split into breadcrumb segments |
| Projects | `useApp().projects` (`:26`) | to show a project's name instead of its id |
| Current user | `useCurrentUser()` = `users.find(u => u.id === currentUserId)` (`src/context/app-context.tsx:2581-2584`) | after sign-in this is the DemoAuth user copied into `users` |
| Notifications | `useNotifications()` = `notifications.filter(n => n.userId === currentUserId)` (`src/context/app-context.tsx:2623-2627`) | seed: `MOCK_NOTIFICATIONS` (`src/data/mock-data.ts:1091-1097`) |
| Workspace name | `useDemoAuth().selectedWorkspace?.name`, fallback `useApp().org.name` (`:188`, `:200`) | `selectedWorkspace` is never null in practice, so the DemoAuth name is always used |

**Cards, widgets and lists**

#### Breadcrumbs
- **Shows:** one crumb per URL segment, separated by `>` icons. The last crumb is bold and not a link; earlier crumbs are links. On small screens only the last crumb is shown (`:44`).
- **Data source:** `pathname`, `projects`.
- **How it is calculated** (`:28-37`):
  - Each crumb's link is the URL up to that segment.
  - Label rules, in order: (1) if it is the last crumb and the URL is in `PAGE_TITLES` → that title (`/teams` → "Team Analytics", `:14-16`); (2) if the URL is in `CRUMB_LABELS` → that label (`/ai-agents` → "AI Agent Hub", `:19-21`); (3) under `/projects/<id>/timeline` the third crumb is "Schedule" (`:33`); (4) if the segment equals a project id → the project name (a hard-coded special case maps id `p-mvhmnblw` to project `p1`, `:31`); (5) otherwise the segment with `-` replaced by spaces and each word capitalised.
- **Empty state:** nothing is rendered when the path has no segments (`:39`).

#### Unread dot on the bell
- **Shows:** a small yellow dot (no number) on the bell.
- **How it is calculated:** `unreadCount = notifications.filter(n => !n.isRead).length` (`:70`); the dot appears when `unreadCount > 0` (`:129-131`).

#### Notifications popover — see 3.4.

#### User chip
- **Shows:** a coloured circle with the user's `initials` (colour = `currentUser.color`, fallback `#00c2a8`), and on very wide screens (`xl`) the name and workspace name (`:180-190`). Only rendered when `currentUser` exists (`:173`).

#### User menu
- **Shows:** name, email, workspace name with a building icon, then "Profile Settings" and "Sign out" (`:193-223`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Hamburger (mobile only, `lg:hidden`) | Opens/closes the sidebar (`:82-88`) | `sidebarCollapsed` via `toggleSidebar` (`src/context/app-context.tsx:2558`) | Yes (`sidebarCollapsed` is saved) | none |
| Breadcrumb links | Navigate to the parent URL | none | n/a | Some parent URLs have no page and show a 404: e.g. `/tasks` (from `/tasks/<id>`), `/signatures/sign` (from `/signatures/sign/<id>`), `/ai-agents/runs` (from `/ai-agents/runs/<id>`) |
| "Search everywhere..." button with `⌘K` hint | Opens Search (3.6) (`:98`) | none | n/a | none |
| **+ New** | Opens Quick Create dialog (3.7) (`:114`) | none | n/a | none |
| Bell | Toggles the notifications popover (`:124`) | none | n/a | none |
| "Mark all read" (inside popover, only when unread > 0) | `markAllNotificationsRead` (`:140`) | `notifications` — **every** user's notifications are set `isRead: true`, not only the current user's (`src/context/app-context.tsx:2552-2555`) | Yes | dot disappears |
| "View all notifications" | Goes to `/teams/notifications`, closes popover (`:161-167`) | none | n/a | none |
| User chip | Toggles user menu (`:176`) | none | n/a | none |
| "Profile Settings" | Goes to `/settings/profile` (`:205-212`) | none | n/a | closes menu |
| "Sign out" | `logout()` then `router.replace('/login')` (`:72-76`) | DemoAuth: clears `currentUser`, `isAuthenticated`; removes keys `flashsign_demo_session_active`, `flashsign_demo_user`, `flashsign_demo_pending_signup`, `flashsign_demo_auth_success_msg` (`src/context/demo-auth-context.tsx:622-632`) | Yes (session removed) | AppContext data is **not** cleared |

**Notes, limits and simulated parts**
- The `⌘K` / Ctrl+K hint is shown, but pressing Ctrl+K does **not** open search. The key handler in
  `search-command.tsx:23-26` only calls `preventDefault()` (comment "toggle") and does nothing else.
  It also blocks the browser's own Ctrl+K shortcut on workspace pages.
- The popovers do not close when you click outside them, and the bell popover and user menu can be open at the same time.
- Only project ids become names in breadcrumbs. Other ids show raw (e.g. `/documents/doc1` → "Doc1", `/teams/members/u5` → "U5").
- The user chip always shows initials. The profile photo from Settings › Profile is not used here.
- Unused imports (`HelpCircle`, `Check`) suggest a removed Help button.

### 3.4 Notification bell popover and notification actions

**File:** `src/components/layout/app-header.tsx:121-170`; actions in `src/context/app-context.tsx:2547-2555`; hook `useNotifications` at `:2623-2627`
**Who can open it:** Any signed-in user.
**Purpose:** Quick list of the current user's notifications.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Current user's notifications | `useNotifications()` → `state.notifications` filtered by `userId === currentUserId` | Seed `MOCK_NOTIFICATIONS` has 5 items for `u5`, `u2`, `u1`, `u7` only (`src/data/mock-data.ts:1092-1096`) |

**Cards, widgets and lists**

#### Notification list
- **Shows:** for each item: bold `title`, smaller `body`, relative time `formatRelative(createdAt)`. Unread items have a light green background (`:151-157`).
- **How it is calculated:** no sorting in the popover; array order (new notifications are added to the front by the store actions that create them). No limit on count; the list scrolls (`max-h-72`).
- **Empty state:** "No notifications" (`:149`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| A notification row | Nothing — rows have no click handler; the `link` field is ignored | none | n/a | none |
| "Mark all read" | see 3.3 | `notifications` (all users) | Yes | none |
| "View all notifications" | see 3.3 | none | n/a | none |

**Notes, limits and simulated parts**
- `markNotificationRead(id)` (`app-context.tsx:2548-2551`) exists and sets one item `isRead: true`,
  but the bell does not use it. Only `/teams/notifications` calls it (`src/app/(workspace)/teams/notifications/page.tsx:150`, `:161`).
- **The default demo user sees an empty bell.** The signed-in DemoAuth user (e.g. id `user-demo`)
  has no seed notifications, because seed notifications are addressed to `u1`, `u2`, `u5`, `u7`.
  The user only gets notifications created during the session by other features (task assignment,
  time-off requests, meetings, announcements — see their sections).
- Notification preferences in Settings › Notifications (4.18) are **not** checked anywhere when notifications are created.

### 3.5 Left sidebar — shown on every workspace page

**File:** `src/components/layout/app-sidebar.tsx`
**Who can open it:** Any signed-in user. The sidebar shows the **same links for every role** —
`canAccess`, `ROLE_CONFIGS` and `useRoleConfig()` are imported/called but never used to filter items.
**Purpose:** Main navigation, organisation name, Reset button.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `sidebarCollapsed` | `useApp()` (`:31`) | saved; forced to `true` on screens < 1024 px at load and on resize (`src/context/app-context.tsx:568-579`) |
| `signatureRequests` | `useApp()` (`:31`) | seed `MOCK_SIGNATURE_REQUESTS` (`src/data/mock-documents.ts:1008`); **not saved** to localStorage |
| `selectedWorkspace` | `useDemoAuth()` (`:33`) | organisation card |
| `FEATURES.teams` | `src/lib/features.ts:13` (`false`) | hides "Teams Directory" |
| Current URL | `usePathname()` | active highlighting and auto-expand |

**Cards, widgets and lists**

#### Logo row
- **Shows:** yellow Zap icon + "FlashSign" (word hidden when collapsed) linking to `/projects/home`, and a collapse/expand icon (`:221-239`).

#### Organisation card (expanded only)
- **Shows:** building icon, `selectedWorkspace.name` (fallback "Flash Technologies") and `selectedWorkspace.slug` in mono font (fallback "flash-technologies") (`:289-305`).
- **How it is calculated:** read straight from DemoAuth. Not clickable.
- **Note:** a workspace switcher (`MOCK_WORKSPACES`, `:22-27`, `:241-288`) is commented out.

#### Role switcher
- Hidden. The whole block is commented out (`:307-345`). It is not driven by `FEATURES.roleSwitcher` at run time; turning the flag on alone would not show it.

#### "Navigation" header with "Expand all / Collapse all" (expanded only)
- **Shows:** label switches between "Expand all" and "Collapse all" (`:350-363`).
- **How it is calculated:** `allOpen = Object.values(openSections).every(Boolean)` (`:195`).

#### Navigation sections (expanded sidebar)
Sections are defined at `:61-156`. A section marked `direct` is a single link; the others are dropdowns.

| Section | Item | Link | Active when |
|---|---|---|---|
| Workspace | Dashboard | `/projects/home` | exact or starts with `/projects/home/` |
| | Projects | `/projects` | exactly `/projects` (`:161`) |
| | My Tasks | `/projects/my-tasks` | exact or child |
| | Planning | `/planner/calendar` | any `/planner...` (`:71`) |
| Agreements (badge) | Home | `/agreements` | exactly `/agreements` |
| | Inbox (badge) | `/signatures/all` | `/signatures...` except `/signatures/settings` (`:90`) |
| | Documents | `/documents/all` | `/documents...` except `/documents/templates`, or any `/contracts...` (`:97-99`) |
| | Templates | `/documents/templates` | exact or child |
| | Reports | `/agreements/reports` | exact or child |
| | Settings | `/signatures/settings` | exact or child |
| Teams | Analytics | `/teams` | `/teams` exactly, or `/teams/workload`, `/teams/announcements`, `/teams/activity`, `/teams/timesheet` (`:116-118`) |
| | Teams Directory | `/teams/directory` | hidden while `FEATURES.teams` is false (`:120`) |
| | Members | `/teams/members` | exact or child |
| AI Agent Hub (direct) | — | `/ai-agents` | any `/ai-agents...` |
| Settings (direct) | — | `/settings/profile` | any `/settings...` |

Hidden (commented out): Notifications (`:73`), Workload, Team Activity, Announcements (`:122-127`).

#### Agreements badge and Inbox badge
- **Shows:** a number pill on the "Agreements" header and on "Inbox".
- **Data source:** `signatureRequests`.
- **How it is calculated:** `signatureRequests.filter(r => r.status === 'sent' || r.status === 'viewed' || r.status === 'partially_signed').length` (`:40`). Shown only when > 0. On a fresh load the seed gives **3** (`sig-13` sent, `sig-1` sent, `sig-3` viewed).
- **Note:** this counts all requests in the organisation that are out for signing, not requests waiting for the current user. Because `signatureRequests` is not saved, the number resets to 3 after refresh.

#### Collapsed sidebar (icons only)
- **Shows:** one icon per section linking to the section's first item (Workspace → `/projects/home`, Agreements → `/agreements`, Teams → `/teams`, AI → `/ai-agents`, Settings → `/settings/profile`) (`:483-507`). The Agreements icon shows a pulsing dot when its badge > 0 (`:501-503`).

#### Footer
- **Shows:** static text "Flash Sign PM v2.0" (expanded only) and a "Reset" button (`:512-521`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| FlashSign logo | Goes to `/projects/home` | none | n/a | none |
| Collapse/expand icon | `toggleSidebar` | `sidebarCollapsed` | Yes | content margin changes |
| Dark overlay (mobile, when open) | `toggleSidebar` closes it (`:206-211`) | `sidebarCollapsed` | Yes | none |
| Section header (dropdown) | Opens/closes that section (`:191-193`) | local `openSections` state | No (resets on reload) | none |
| Expand all / Collapse all | Sets every section open or closed (`:196-201`) | local state | No | none |
| Each nav item / direct section | Next.js `<Link>` navigation | none | n/a | none |
| (automatic) route change | Opens the section that contains the active item (`:183-189`) | local state | No | none |
| Reset (footer) | `resetDemoData()` with **no confirmation** (`:515`) | Removes key `flashsign-proto-state-v6` and replaces all AppContext state with the seed (`src/context/app-context.tsx:2563-2566`) | Yes (seed is then saved again) | see notes |

**Notes, limits and simulated parts**
- **Reset side effect bug:** after Reset, `currentUserId` becomes the seed CEO `u1` (Aria Chen) and the
  signed-in user is removed from `users`. The DemoAuth→AppContext sync effect does not re-run
  (its inputs did not change), so the header shows Aria Chen until the page is refreshed. Reset
  does not touch DemoAuth (accounts, workspaces, invitations stay).
- On mobile, tapping a link does not close the sidebar; the user must tap the overlay or hamburger.
- The resize handler only collapses (below 1024 px); it never re-expands.
- "Expand all" counts the `ai-agents` key, which is a direct link with no dropdown (`:173`). If you
  open all three dropdowns by hand the label still says "Expand all" until you click it once.

### 3.6 Global search dialog

**File:** `src/components/shared/search-command.tsx`
**Who can open it:** Any signed-in user, from the header search button only.
**Purpose:** Search projects, tasks, milestones, sprints and people, and jump to them.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects, tasks, milestones, sprints, users | `useApp()` (`:16`) | all records, no filtering by role, project membership or archive state |

**Cards, widgets and lists**

#### Result groups
The query is trimmed and lower-cased (`:34`). Matching is a simple "contains" test.

| Group | Fields searched | When the box is empty | Row shows | Click goes to |
|---|---|---|---|---|
| Projects (`:36`) | `name`, `key` | first 3 projects | name, key, status | `/projects/<id>` (`:97`) |
| Tasks (`:37`) | `title`, `key` | first 4 tasks | key, title, status (first `_` replaced by a space) | opens the Task Detail Drawer via `openTaskDrawer(t.id)` (`:123`) |
| Milestones (`:38`) | `name` | first 2 milestones | name, "`progress`% complete" | `/projects/<projectId>/plan` (`:151`) |
| Sprints (`:39`) | `name`, `goal` | first 2 sprints | name, goal, status | `/projects/<projectId>/sprints` (`:176`) |
| Team Members (`:40`) | `name`, `title` | none shown | initials circle, name, title, email | **nothing** — rows have no click handler (`:197-213`) |

- **Empty state:** "No results found for "<query>"" (`:81-84`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search input (autofocus) | Filters results as you type | local `query` | No | none |
| X (clear) | Clears the query (`:70`) | local | No | none |
| Escape key | Closes dialog (`:22`) | none | n/a | listener is active even when the dialog is closed |
| Click on dark backdrop | Closes dialog (`:53-55`) | none | n/a | none |
| Ctrl/⌘+K | Nothing (only `preventDefault`) (`:23-26`) | none | n/a | blocks browser shortcut |
| Project / milestone / sprint row | Close + navigate | none | n/a | none |
| Task row | Close + `openTaskDrawer` | `activeTaskDrawerId` | **No** (not saved) | drawer opens over the current page |
| Member row | Nothing | none | n/a | none |

**Notes, limits and simulated parts**
- No email search for people (email is shown but not searched). No search of documents, signature requests or files.
- The typed query is kept when the dialog is closed and reopened (the component stays mounted).
- Archived projects are included.

### 3.7 Quick Create dialog ("+ New" in the header)

**File:** `src/components/shared/quick-create-dialog.tsx`
**Who can open it:** Any signed-in user. **No permission check** — `canCreateTask` / `canCreateProject`
(`src/lib/permissions.ts:105-111`) are not called. (Note: the default role `org_admin` is *not* in
`canCreateTask`, but can still create tasks here.)
**Purpose:** Create a task, project, milestone or sprint without leaving the page.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects | `useApp()` | Project dropdown; default = `defaultProjectId` prop (never passed by the header) or `projects[0]` (`:27`) |
| users | `useApp()` | Assignee dropdown (all users, including bots/clients) |
| current user | `useCurrentUser()` | default assignee and reporter/owner |

**Cards, widgets and lists**

#### Tab bar
- **Shows:** Task, Project, Milestone, Sprint (`:178-215`). Default tab: Task.

#### Task form (`:218-315`)
Fields: **Task Title*** (text), **Project** (select), **Priority** (Low/Medium/High/Critical, default Medium), **Assignee** (Unassigned + all users), **Due Date** (date), **Description** (textarea).

#### Project form (`:318-390`)
Fields: **Project Name*** (typing it also fills Key with the first 4 letters, upper-case, while Key is still empty, `:326-329`), **Project Key*** (forced upper-case), **Priority** (default High), **Description**.

#### Milestone form (`:393-442`)
Fields: **Milestone Name***, **Target Date**, **Description**. There is **no project field** — see notes.

#### Sprint form (`:445-494`)
Fields: **Sprint Name***, **Sprint Goal**, **Capacity (Story Points)** (number, default 30). No project field.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Tab buttons | Switch form | local | No | none |
| X / Cancel / backdrop click | Close dialog | none | n/a | typed values stay for next time |
| **Create Task** | Error toast "Add a title for the task first." if title empty (`:54-57`). Otherwise builds a task (`:58-78`) and calls `addTask` (`:79`) | `tasks` (+1, at the front). Key = `<project key or "FS">-<random 100–899>` (`:59`, `:62`) — the store's `nextTaskKey()` is skipped because a key is passed (`app-context.tsx:831`). Fixed values: `status: 'todo'`, `tags: ['quick-create']`, `reporterId` = current user (fallback `u2`), `id: task-<timestamp>`. Store also recalculates that project's `progress` and timeline (`app-context.tsx:866-874`) | Yes | success toast `Task "<title>" created`. No notification, no activity log |
| **Create Project** | Error toasts if name or key empty (`:86-93`). Builds project (`:94-112`), `addProject` (`:113`), then navigates to `/projects/<new id>` (`:116`) | `projects` (+1 at front), `recentProjectIds` (new id first). Fixed values: `status: 'active'`, `health: 'on_track'`, `teamIds: ['t1']`, `memberIds: [current user]`, start = now, end = now + 60 days, `tags: ['new']`, colour `#00c2a8`. Timeline calculated by `calculateProjectTimeline` (`app-context.tsx:686-738`) | Yes | toast `Project "<name>" created`. No duplicate-key check |
| **Create Milestone** | Error toast if name empty. Builds milestone with `projectId = taskProjectId` (`:127`), due date = picked date or **now** (`:130`), `status: 'upcoming'` → `addMilestone` (`:134`) | `milestones` (+1), that project's timeline recalculated (`app-context.tsx:1026-1048`) | Yes | toast `Milestone "<name>" created` |
| **Create Sprint** | Error toast if name empty. `projectId = taskProjectId` (`:148`), `status: 'planned'`, goal default "Deliver prioritized sprint backlog items", start now, end now + 14 days, capacity = number or 30 → `addSprint` (`:156`) | `sprints` (+1) (`app-context.tsx:1001-1014`) | Yes | toast `Sprint "<name>" created` |

**Notes, limits and simulated parts**
- **Hidden coupling:** Milestone and Sprint are created in whatever project is selected in the
  **Task** tab's Project dropdown (default: the first project in the list). The user cannot see or
  change this on the Milestone/Sprint tabs.
- Random task keys can repeat (only 800 possible numbers per project) and do not follow the project's sequence.
- A `taskSprint` state exists (`:31`) but there is no sprint picker in the form, so quick-created tasks never get a sprint. `taskType` is always `task`.
- Form fields are not cleared after create or cancel; reopening shows the previous values.
- Default assignee is captured once when the header first mounts (`useState(currentUser?.id || 'u2')`, `:30`). Unclear: because of the sync timing in 3.2 this may be the seed CEO `u1` rather than the signed-in user.
- Quick-created projects have no `structure` (plan levels) chosen, unlike the full New Project wizard.

### 3.8 Toasts and prototype notices

**File:** `src/components/shared/toaster.tsx`, `src/components/shared/prototype-notice.tsx`
**Who can open it:** n/a (display only).
**Purpose:** Short success/error messages; "this is a prototype" banners.

**Cards, widgets and lists**

#### Toast stack
- **Shows:** up to 3 toasts at the top right. Success = dark with green tick; error = red with alert icon.
- **How it is calculated:** `notify(message, tone)` keeps only the last 2 old toasts plus the new one (`toasts.slice(-2)`, `:20`). Success disappears after 3.5 s, error after 6 s (`:22`). Store is a module-level variable read with `useSyncExternalStore` (`:13-37`).
- **Empty state:** nothing rendered.
- `<Toaster />` is only mounted in the workspace layout, so `notify()` calls on auth/onboarding pages would not be visible (none of those pages call it).

#### PrototypeNotice
- **Shows:** an info icon and text. Variants: `banner` (green box, "Prototype Notice:" prefix), `pill`, `subtle` (grey centred line). Default text "Interactive frontend prototype — no real account, credentials, or server calls are made." (`:10-46` of the component file).
- Used on: login, signup, forgot/reset password, invite, create organization, onboarding step layout, workspace and prototype-home pages.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| X on a toast | Removes it now (`:53`) | module variable | No | none |

**Notes, limits and simulated parts**
- `src/components/projects/new-menu.tsx` is **not** used by the header. It is used only inside the project header (`src/components/projects/project-header-nav.tsx:132`) and belongs to the Projects section.

### 3.Z Data flow summary for this area

- **Reads (AppContext):** `projects`, `tasks`, `milestones`, `sprints`, `users`, `currentUserId`, `notifications`, `signatureRequests`, `org`, `sidebarCollapsed`, `demoRole` (indirectly).
- **Reads (DemoAuth):** `isHydrated`, `isAuthenticated`, `currentUser`, `selectedWorkspace`.
- **Writes (AppContext):** `tasks`, `projects`, `recentProjectIds`, `milestones`, `sprints` (Quick Create); `notifications` (Mark all read); `sidebarCollapsed`; `activeTaskDrawerId` (search → task, not saved); whole state (Reset).
- **Writes (DemoAuth):** session keys on Sign out.
- **Store actions used:** `toggleSidebar`, `markAllNotificationsRead`, `openTaskDrawer`, `addTask`, `addProject`, `addMilestone`, `addSprint`, `resetDemoData`, DemoAuth `logout`. `markNotificationRead` and `setDemoRole` exist but are not used by the shell.
- **Not persisted here:** `signatureRequests` (sidebar badge), `activeTaskDrawerId`, sidebar dropdown open/closed state, search query.

---

## 4. Sign-in, onboarding, workspaces and personal settings

This section explains how people get into the app (log in, sign up, create an organization,
accept an invitation, password recovery), an older "onboarding" flow that is still in the code
but not linked from the main flow, and the personal Settings pages. Everything is simulated in the
browser by `DemoAuthContext` (`src/context/demo-auth-context.tsx`): passwords are stored in plain
text in localStorage, no email is ever sent, and "organizations" are only labels — every
organization sees the same seed project data.

### 4.1 How sign-in really works (DemoAuthContext, preset accounts, storage, sync into AppContext)

**File:** `src/context/demo-auth-context.tsx`, `src/types/demo-auth.ts`, `src/lib/storage.ts`, `src/lib/invitations.ts`, `src/lib/auth-validation.ts`, `src/lib/permissions.ts`; sync in `src/context/app-context.tsx:620-672`
**Who can open it:** n/a (store).
**Purpose:** Holds accounts, the signed-in user, organizations ("workspaces"), preferences, invitations and onboarding steps.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Preset accounts | `DEMO_PRESET_USERS` (`src/types/demo-auth.ts:239-325`) | 5 accounts, see table below |
| Organizations | `INITIAL_DEMO_WORKSPACES` (`src/types/demo-auth.ts:159-228`) | Flash Technologies (`ws-flash`), Acme Digital (`ws-acme`), Northstar Software (`ws-northstar`), Vertex Labs (`ws-vertex`); member/project counts are hard-coded numbers |
| Invitations | `INITIAL_DEMO_INVITATIONS` (`src/types/demo-auth.ts:330-375`) | Ravi Perera (developer, pending), Emma Clarke (qa, pending), jordan.lee (project_manager, **expired** 2 days ago) |
| Saved state | localStorage keys in `STORAGE_KEYS` (`src/lib/storage.ts:36-47`) | see below |

**Preset accounts**

| Name | Email | Password | DemoAuth role | Effective app role | Organization |
|---|---|---|---|---|---|
| Demo User | demo@flashsign.com | Demo123! | `org_admin` | Org Admin | Flash Technologies |
| Sarah Chen | sarah.chen@acmedigital.com | Demo123! | `product_owner` | Product Owner | Acme Digital |
| Alex Rivera | alex.rivera@acmedigital.com | Demo123! | `engineering_lead` | Engineering Lead | Acme Digital |
| Elena Rostova | elena.r@acmedigital.com | Demo123! | `document_manager` | Document Manager | Acme Digital |
| Taylor Morgan | incomplete@flashsign.com | Demo123! | `org_admin` | — (cannot sign in until an organization is created) | none, `organizationSetupCompleted: false` |

**localStorage keys** (`src/lib/storage.ts:36-47`)

| Key | Holds | Written by |
|---|---|---|
| `flashsign_demo_user` | the signed-in user object (incl. password) | login (if Remember me), acceptInvitation, updateProfile, resetDemo |
| `flashsign_demo_users_list` | all accounts (incl. plain-text passwords) | signUp, createOrganization, acceptInvitation, resetDemo |
| `flashsign_demo_workspaces` | organizations | createOrganization, acceptInvitation, createWorkspace, resetDemo |
| `flashsign_demo_selected_workspace` | chosen organization | login, createOrganization, selectWorkspace, createWorkspace, acceptInvitation, resetDemo — **never read back** on load |
| `flashsign_demo_preferences` | onboarding preferences | updatePreferences, resetDemo |
| `flashsign_demo_completed_steps` | onboarding steps | only `markStepComplete`, which nothing calls |
| `flashsign_demo_session_active` | `true` while signed in | login, acceptInvitation, resetDemo; removed by logout |
| `flashsign_demo_pending_signup` | the half-registered user | signUp, createOrganization, login (incomplete org) |
| `flashsign_demo_auth_success_msg` | green message for the login page | createOrganization |
| `flashsign_demo_invitations` | invitations | send/resend/revoke/accept invitation |

**Cards, widgets and lists**

#### Loading from storage on start (`demo-auth-context.tsx:125-197`)
- Users: preset users merged with saved users by `id` (saved wins) (`:128-139`).
- Workspaces: same merge (`:142-150`).
- Session: if `session_active` is true **and** `flashsign_demo_user` exists, the user is signed in. The user object is taken from the users list first, and only from `flashsign_demo_user` if not found (`:168-171`).
- Selected workspace: the organization matching the user's `organizationId`, else the first one (`:175-178`). The saved `selected_workspace` key is ignored.
- Preferences, completed steps, invitations: loaded if present.
- `isHydrated` is set to true at the end (`:195`); the workspace layout waits for it.

#### How the password is checked — `login()` (`:390-468`)
1. Find a user whose email matches (trimmed, lower-case). If none: error "No account found with this email address…", or, if there is a live invitation for that email, "You haven't joined <org> yet. Open the invitation link…" (`:399-407`).
2. **Password IS checked**, but loosely. It is accepted when it is non-empty **and** equals the
   user's stored password, **or** equals the universal demo passwords `Demo123!` or
   `DemoPassword2026!` (`:411-415`). So `Demo123!` opens **any** account, including newly signed-up
   or invited ones. Wrong password → "Invalid password… (Demo password: Demo123!)" (`:417-422`).
3. If `organizationSetupCompleted` is false → saves the user as pending signup and returns `requiresOrgSetup` (`:425-434`).
4. Success: sets `currentUser`, `isAuthenticated`; picks the organization by `organizationId`, else one the user owns, else the first (`:441-449`); clears the success message and pending signup; sets `session_active = true`; saves `flashsign_demo_user` only if Remember me is ticked (`:458-463`).

#### Sync of the DemoAuth user into AppContext (`src/context/app-context.tsx:620-672`)
- Runs whenever `authUser`, `authOrg` (selected workspace) or `isAuthenticated` changes, and only when signed in.
- Finds an AppContext user with the same `id` **or the same email** (case-insensitive) (`:626-628`).
- Maps the role: `executive` → `ceo`, `qa` → `qa_tester`, any other role keeps its name (`:630-635`).
- Builds an AppContext `User` from the DemoAuth user: `name` ← fullName, `initials` ← avatarInitials (or first 2 letters of the name), `title` ← jobTitle (default "Team Member"), `department` (default "Executive"), `color` ← avatarColor (default `#00c2a8`), `timeZone` (default "America/New_York (EST)"), `isActive: true` (`:637-649`).
- If found, it **merges over** the existing record (`{...existing, ...mapped}`); if not, it adds the user **at the front** of `users` (`:651-656`).
- Copies the organization `name` and `slug` into `AppContext.org` (`:658-662`).
- Sets `currentUserId = authUser.id` and **`demoRole = mappedRole`** (`:664-670`). This is what decides every permission check in the app.
- Because preset emails (e.g. demo@flashsign.com) do not match any seed user email (seed users use `@flashsign.io` etc.), the signed-in user is a brand-new AppContext user with **no seed tasks, projects or notifications** assigned.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| (store) `signUp` | see 4.3 | users list, pending signup | Yes | — |
| (store) `createOrganization` | see 4.4 | workspaces, users, pending, message | Yes | — |
| (store) `login` / `logout` | see above / 3.3 | session keys | Yes | AppContext sync |
| (store) `sendInvitation`, `resendInvitation`, `revokeInvitation` | used by the Members page (`src/components/members/invite-member-dialog.tsx`, `invitations-list.tsx`), not by Settings | `invitations` | Yes | invite link = `/invite/<base64url JSON>` (`src/lib/invitations.ts:51-55`), valid 7 days (`:9`) |
| (store) `acceptInvitation` | see 4.7 | users, workspaces, invitations, session | Yes | — |
| (store) `updateProfile` | merges changes into `currentUser`, recalculates initials if name changed, writes `flashsign_demo_user` (`:701-718`) | currentUser | **Partly — see notes** | adds `profile` to completed steps (not saved) |
| (store) `updatePreferences` | merges into preferences (`:720-728`) | preferences | Yes | adds `preferences` step (not saved) |
| (store) `selectWorkspace` | sets selected organization (`:647-657`) | selectedWorkspace | **No** (key written but ignored on load) | AppContext `org` name/slug follow |
| (store) `createWorkspace` | adds organization at front, selects it (`:659-699`) | workspaces | Yes (list) / No (selection) | no owner, user's `organizationId` unchanged |
| (store) `resetDemo` | restores presets, **signs in as Demo User**, restores invitations and preferences (`:739-760`) | everything in DemoAuth | Yes | AppContext not reset |
| (store) `register` | legacy wrapper around `signUp` with password `DemoPassword2026!` (`:635-645`) | — | — | not called anywhere |

**Notes, limits and simulated parts**
- Passwords are stored in plain text in `flashsign_demo_users_list` and `flashsign_demo_user`, even
  though `src/lib/storage.ts:2-3` says "Never stores passwords".
- **Profile changes made through `updateProfile` (onboarding profile page) are lost on refresh:**
  `updateProfile` updates `currentUser` and `flashsign_demo_user`, but not the users list. On load,
  the users-list copy wins (`:170`), so the old name/role/colour come back.
- **Remember me off** = the session ends on refresh: `session_active` is saved but the user object
  is removed, and both are needed to restore a session (`:168`).
- Role permission lists (`src/lib/permissions.ts`) that matter for the default account (`org_admin`):
  `canManageUsers` yes, `canCreateProject` yes, `canApprove` yes, `canManageDocuments` yes,
  `canManageAgents` yes, `canViewReports` yes, `canViewTeamTime` yes, but `canCreateTask` **no**,
  `canSignDocument` **no**, `canRunAgent` **no**. No preset account maps to `ceo`.
- Invitation links carry the whole invitation as readable base64 JSON. In a browser that has no
  record of that invitation, anyone can edit the token (email, role, organization) and it will be
  accepted (`acceptInvitation` only checks the local copy if it exists, `:544-553`).

### 4.2 Log in — `/login`

**File:** `src/app/(auth)/login/page.tsx` (+ `src/components/auth/auth-layout.tsx`, `auth-card.tsx`, `brand-panel.tsx`, `password-input.tsx`)
**Who can open it:** Anyone. Signed-in users are not redirected away.
**Purpose:** Sign in with email and password, with one-click demo accounts.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `users` | `useDemoAuth()` (`:28`) | the "other demo roles" list = **all** accounts, including ones created by sign-up/invites |
| `authMessage` | `useDemoAuth()` | green banner after organization creation |
| `pendingSignupUser` | `useDemoAuth()` | auto-fills email/password after organization creation (`:50-58`) |

**Cards, widgets and lists**

#### Brand panel (left side, shared by all `AuthLayout` pages)
- **Shows:** "Interactive Product Preview" pill, FlashSign word mark, headline "One workspace. Every commitment.", three decorative cards ("AI Agent Sprint 24 — Claude 3.7 Sonnet • PR #142 Ready / Passed Tests", "Master Service Agreement — 2 of 3 signatures collected / Audit Valid", "Role-Based Access Control — 10 demo personas • Instant switching / Active"), footer "Zero backend setup required / Ready for testing" (`src/components/auth/brand-panel.tsx`).
- **Data source:** all text is hard-coded. Nothing is clickable.

#### Header
- "Welcome Back", "Frontend Prototype" pill, "Sign in to Flash Sign" (`:96-111`).

#### Success banner
- **Shows:** `authMessage` (e.g. `Organization "X" created successfully! Please log in…`) with an × button (`:114-128`).
- **Empty state:** hidden when there is no message.

#### Error banner
- **Shows:** the error text from `login()` (`:131-136`).

#### "Recommended Demo Account" box
- **Shows:** a card "demo@flashsign.com — Default Demo — Password: Demo123! • Role: Owner / CEO" (`:149-171`). A tick shows when it is the selected preset.
- **Note:** the label "Role: Owner / CEO" is wrong — this account's role is `org_admin` (4.1).

#### "Or switch to other demo roles / test accounts" (collapsible `<details>`)
- **Shows:** one row per account in `users`: colour dot, **full name** (email), and "[Incomplete Org]" in amber when `organizationSetupCompleted` is false (`:184-215`).

#### Prototype notice
- Banner text: "Frontend prototype only. Mock accounts validate credentials in client-side state without calling external APIs." (`:320-323`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| × on success banner | `clearAuthMessage()` | removes `flashsign_demo_auth_success_msg` | Yes | none |
| Default demo card | Fills email `demo@flashsign.com` and password `Demo123!` (`:85-90`) | form only | No | clears error |
| Other account rows | Fills that account's email and its **real stored password** (or `Demo123!` if none) (`:186-191`) | form only | No | reveals other users' passwords in the form |
| Email Address* | Zod: required, valid email (`src/lib/auth-validation.ts:4`) | form | No | default value `demo@flashsign.com` |
| Password* (eye icon shows/hides) | Zod: required (`auth-validation.ts:5`) | form | No | default value `Demo123!` |
| "Forgot password?" | **Does not open `/forgot-password`.** Toggles an inline note: "Demo Reset: … use the demo password Demo123! for any account…" (`:250-256`, `:269-281`) | local | No | none |
| "Remember this device for demo" checkbox | Passed to `login()`; default ticked | form | — | unticked → session lost on refresh (4.1) |
| **Log In** | Waits 450 ms (fake network, `:65`), calls `login()` (`:67`). Incomplete org → `router.push('/onboarding/create-organization')` (`:72-75`). Error → banner. Success → `router.push('/dashboard')` (`:82`) | DemoAuth session (4.1) | Yes | AppContext sync sets `currentUserId`, `demoRole`, adds user, updates `org` |
| "Sign up" link | `/signup` | none | n/a | none |

**Notes, limits and simulated parts**
- After login the user goes to `/dashboard`, while the sidebar's "Dashboard" link goes to `/projects/home` — two different pages.
- The "Forgot password?" control makes the real `/forgot-password` page unreachable from the login form (it is only linked from `/prototype-home`).

### 4.3 Sign up — `/signup` (and `/register`)

**File:** `src/app/(auth)/signup/page.tsx`; `src/app/(auth)/register/page.tsx` only does `redirect('/signup')`
**Who can open it:** Anyone.
**Purpose:** "Step 1 of 2": create an account that will own a new organization.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `pendingSignupUser` | `useDemoAuth()` | if present, the form is pre-filled with name, email, job title, password (twice) and Terms ticked (`:43-54`) |

**Cards, widgets and lists**

#### Header and info box
- "Step 1 of 2", "New User Sign Up", "Create your account", and a grey box: "This creates a new organization with you as the owner. Joining an existing team? Use the invitation link…" (`:87-106`).

#### Password strength meter (`src/components/auth/password-strength.tsx`)
- **Shows:** label + 4 bars + checklist ("At least 8 characters", "One uppercase letter", "One lowercase letter", "One number or symbol").
- **How it is calculated:** counts 5 checks (length ≥ 8, upper, lower, digit, symbol). 0 typed → "Too short", ≤2 → Weak (1 bar), 3 → Fair (2), 4 → Good (3), 5 → Strong (4) (`:17-47`). Display only; it does not block submit.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Full Name* | Zod: at least 2 characters (`auth-validation.ts:35`) | form | No | validated on blur (`mode: 'onTouched'`) |
| Email Address* | Zod: required, valid email | form | No | — |
| Job Title (Optional) | free text | form | No | default "Founder & CEO" if empty (`demo-auth-context.tsx:263`) |
| Password* | Zod: ≥ 8 chars, has a letter, has a number (`auth-validation.ts:38-42`) | form | No | strength meter updates |
| Confirm Password* | must equal Password (`:48-51`) | form | No | — |
| Terms checkbox* | must be ticked (`:44-46`). "Terms of Service" and "Privacy Policy" are plain text, not links | form | No | — |
| **Create Account** | Waits 400 ms, calls `signUp()` (`:65-70`). On error shows banner; on success → `/onboarding/create-organization` (`:80`) | `signUp` (`demo-auth-context.tsx:228-291`): blocks if the email has a live invitation ("You've been invited to join <org>…") or belongs to an account with a finished organization ("An account with this email already exists…"). Otherwise creates user `user-<timestamp>` (or reuses the id of an unfinished account), role `org_admin`, department "Executive", colour `#00c2a8`, `organizationSetupCompleted: false`; saves to users list and pending signup | Yes (`flashsign_demo_users_list`, `flashsign_demo_pending_signup`) | **not** signed in yet |
| "Log in" link | `/login` | none | n/a | none |

**Notes, limits and simulated parts**
- Signing up again with the email of an unfinished account (e.g. incomplete@flashsign.com) silently replaces that account's name and password.
- The password rule here (letter + number) is weaker than the reset-password rule (uppercase + number).

### 4.4 Create organization — `/onboarding/create-organization` (and `/onboarding`)

**File:** `src/app/onboarding/create-organization/page.tsx`; `src/app/onboarding/page.tsx` redirects here
**Who can open it:** Anyone with a pending signup or a signed-in user. Otherwise, after hydration, it redirects to `/signup` (`:81-85`).
**Purpose:** "Step 2 of 2": create the organization the new user owns.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `pendingSignupUser` or `currentUser` | `useDemoAuth()` | shown as "Owner: <name> (<email>)" (`:137-144`) |
| Industry and size lists | `ORGANIZATION_INDUSTRIES`, `ORGANIZATION_SIZES` (`src/lib/auth-validation.ts:55-75`) | 10 industries, 6 sizes |

**Cards, widgets and lists**

#### Header
- "Step 2 of 2", "Workspace Setup", "Create Your Organization", owner chip.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Organization Name* | Zod: ≥ 2 chars. While the slug has not been edited by hand, it fills the slug with `generateSlug(name)` (lower-case, spaces → hyphens, symbols removed) (`:71-76`) | form | No | — |
| Workspace Slug* (prefix "flashsign.com/") | Zod: 2–50 chars, `^[a-z0-9]+(?:-[a-z0-9]+)*$` (`auth-validation.ts:79-83`). Typing here stops auto-fill (`:192-194`) | form | No | — |
| Industry* (select) | required | form | No | — |
| Organization Size* (select) | required | form | No | — |
| Company Website (Optional) | must start with `http(s)://` or look like `name.tld` (`auth-validation.ts:86-91`) | form | No | — |
| Organization Description (Optional) | max 300 chars | form | No | — |
| Back | Link to `/signup` (form there is pre-filled) | none | n/a | none |
| **Create Organization** | Waits 300 ms, `createOrganization()` (`:94-101`). Error banner on failure; on success → `router.push('/login')` (`:113`) | `createOrganization` (`demo-auth-context.tsx:294-387`): fails if the slug is already used by any organization (including presets like `flash-technologies`). Creates org `ws-<base36 time>` with `memberCount: 1`, `activeProjectCount: 1`, colour `#00c2a8`, owner = the user. Updates the user: `organizationId`, `organizationSetupCompleted: true`, role `org_admin`. Selects the org; keeps the user as pending signup; sets message `Organization "<name>" created successfully! Please log in to access your workspace.` | Yes (workspaces, users list, selected workspace, pending signup, success message) | user is **not** signed in; login page auto-fills their email and password |

**Notes, limits and simulated parts**
- The new organization is only a name and slug. After login the user sees exactly the same seed projects, tasks and members as every other organization.
- Website, industry, size and description are stored but not shown anywhere in the workspace.

### 4.5 Forgot password — `/forgot-password`

**File:** `src/app/(auth)/forgot-password/page.tsx`
**Who can open it:** Anyone. Only linked from `/prototype-home` (`src/app/prototype-home/page.tsx:230`); the login page's "Forgot password?" does not link here.
**Purpose:** Simulated "send reset link".

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| none | — | no store is used |

**Cards, widgets and lists**

#### Form state / Confirmation state
- Form: "Reset your password", Work Email Address field.
- Confirmation: "Simulated Link Sent", the typed email, and "Prototype Simulation: No real emails are dispatched…" (`:111-152`).
- Footer notice: "No email delivery services or database lookups are performed."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to sign in" | `/login` | none | n/a | none |
| Work Email Address* | Zod: required, valid email (`auth-validation.ts:12`) | local | No | — |
| **Send reset link** | Waits 500 ms, shows confirmation (`:29-35`) | local only | No | **no account lookup, no email** — any valid-looking email "works" |
| "Open Reset Password Screen" | `/reset-password` | none | n/a | none |
| "Try another email address" | back to the form | local | No | none |

**Notes, limits and simulated parts**
- Fully simulated; does not check whether the email belongs to an account.

### 4.6 Reset password — `/reset-password`

**File:** `src/app/(auth)/reset-password/page.tsx`
**Who can open it:** Anyone (no token needed).
**Purpose:** Simulated "set a new password".

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| none | — | — |

**Cards, widgets and lists**

#### Password strength meter — same as 4.3.

#### Success state
- "Password Updated (Simulated)" and the text "…You can now return to the login screen and enter any credentials to access the workspace." (`:135-139`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to sign in" / "Return to Sign In" | `/login` | none | n/a | none |
| New Password* | Zod: ≥ 8 chars, one uppercase, one number (`auth-validation.ts:19-23`) | local | No | strength meter |
| Confirm New Password* | must match | local | No | — |
| **Reset password** | Waits 500 ms, shows success (`:34-39`) | **nothing** | No | the password is **not** changed |

**Notes, limits and simulated parts**
- The success text is misleading: login does not accept "any credentials"; it needs a known email and the stored password or `Demo123!` / `DemoPassword2026!`.

### 4.7 Accept invitation — `/invite/[token]`

**File:** `src/app/(auth)/invite/[token]/page.tsx`; helpers `src/lib/invitations.ts`
**Who can open it:** Anyone with an invitation link (created on the Members page).
**Purpose:** An invited person creates an account and joins the inviting organization directly (no organization step).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| The invitation | `decodeInvite(token)` — base64url JSON in the URL (`src/lib/invitations.ts:42-52`) | must contain `id`, `email`, `organizationId` |
| Local copy of the invitation | `useDemoAuth().invitations` matched by id (`:32`) | gives revoked/accepted status in the inviting browser |
| Existing accounts | `useDemoAuth().users` (`:33`) | "already joined" check |
| Current session | `currentUser`, `isAuthenticated` | grey note "You're signed in as X. Joining signs you in with the new account instead." (`:127-131`) |

**Cards, widgets and lists**

#### Problem cards (`:68-79`, `:88-105`), checked in this order
1. Token can't be decoded → "This invitation link isn't valid".
2. Local status `revoked` → "This invitation was cancelled".
3. Local status `accepted` or an account with that email exists → "You've already joined" + **Log in** button.
4. Expired (`expiresAt` ≤ now, local copy preferred) → "This invitation has expired. Invitations are valid for 7 days…".
- While DemoAuth is loading: "Opening invitation…".

#### Invitation header
- "You're invited", role title pill (from `DEMO_ROLE_OPTIONS`), "Join <organization>", "<inviter> invited you…", and the personal message as a quote if present (`:108-125`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Email Address | read-only, from the invitation, lock icon | none | n/a | — |
| Full Name* | Zod ≥ 2 chars; pre-filled from invitation | form | No | — |
| Job Title (Optional) | pre-filled from invitation | form | No | — |
| Password* / Confirm Password* | Zod: ≥ 8 chars, letter + number, must match (`auth-validation.ts:141-158`) | form | No | strength meter |
| Terms checkbox* | must be ticked | form | No | — |
| **Join <organization>** | Waits 400 ms, `acceptInvitation()` (`:58`). On success `router.replace('/dashboard')` (`:64`) | `acceptInvitation` (`demo-auth-context.tsx:542-619`): re-checks revoked/accepted/expired/existing email; if this browser does not know the organization, creates it from the invitation; adds 1 to `memberCount`; creates user `user-<timestamp>` with the invitation's role, department (default "General"), job title (default invitation title or "Team Member"), colour `#2a78d6`, `organizationSetupCompleted: true`; marks the local invitation `accepted`; signs the user in (always "remembered") | Yes (users list, workspaces, invitations, session keys) | AppContext sync adds the user and sets `demoRole` to the invited role (e.g. `qa` → `qa_tester`) |
| "Log in" links | `/login` | none | n/a | none |

**Notes, limits and simulated parts**
- No email is sent at any point; the inviter copies the link by hand (Members page).
- See 4.1 about tokens being editable.

### 4.8 Workspace selection (legacy onboarding step 1) — `/workspace`

**File:** `src/app/workspace/page.tsx` (+ `src/components/workspace/workspace-card.tsx`, `create-workspace-dialog.tsx`)
**Who can open it:** Anyone — **no sign-in guard**. If nobody is signed in it shows the preset "Demo User" as a stand-in (`:33`).
**Purpose:** Older onboarding flow: choose or create a demo organization. Not linked from login, sign-up or the workspace app; reachable by typing the URL or from `/onboarding/*` and `/prototype-home`.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `workspaces`, `selectedWorkspace`, `currentUser` | `useDemoAuth()` | all organizations, not only the user's |

**Cards, widgets and lists**

#### Header bar
- Logo, user initials/name/email, Sign out (`:62-92`).

#### Page header
- "Step 1 of Onboarding", "Choose your workspace".

#### Workspace cards (one per organization)
- **Shows:** initials square in the accent colour, name, description (or "<type> Workspace"), pills for type, company size, and "Role: <current user's role>" (the same role on every card), counts "<memberCount> members" and "<activeProjectCount> projects", "Selected" pill on the selected card (`workspace-card.tsx:24-107`).
- **Data source:** `DemoWorkspace` fields; counts are hard-coded numbers in the seed (e.g. Flash Technologies 52 members / 14 projects), not real counts.

#### Selected workspace action bar
- **Shows:** initials, "Active Selection", name, "<members> members • <projects> projects" (`:146-184`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Sign out | `logout()` → `/login` (`:54-57`) | session keys | Yes | — |
| "Guided Setup" | `/workspace/new` | none | n/a | — |
| "Create Workspace" | opens Create Demo Workspace dialog | local | No | — |
| Click a card | `selectWorkspace(id)` | `selectedWorkspace` | **No** (ignored on reload) | if signed in, AppContext `org` name/slug change, so header and sidebar show the new name |
| "Open workspace" (on a card) | `selectWorkspace(id)` then `/onboarding/profile` (`:37-41`) | as above | No | — |
| "Skip to Summary" | `/prototype-home` | none | n/a | — |
| "Continue Setup" | same as "Open workspace" for the selected card | as above | No | — |
| Dialog: Workspace / Company Name* | must be ≥ 2 chars after trim, else "Workspace name must be at least 2 characters" (`create-workspace-dialog.tsx:30-33`) | local | No | — |
| Dialog: Organization Type | Software Development / Consulting / Design Agency / Technology Startup / Other | local | No | — |
| Dialog: Company Size | 1–10 … 500+ employees | local | No | — |
| Dialog: Description, Accent Color (6 swatches from `PRESET_AVATAR_COLORS`) | local | local | No | — |
| Dialog: Cancel / X / backdrop | close | none | n/a | — |
| Dialog: **Create Demo Workspace** | `createWorkspace(...)` then `/onboarding/profile` (`:43-52`) | new org `ws-<base36 time>`, slug from name, `memberCount 1`, `activeProjectCount 1`; selected | List: Yes. Selection: No | no slug uniqueness check; user is not made owner or member |

**Notes, limits and simulated parts**
- There is no membership check: any user can "select" any organization. It only changes the name shown; data does not change.

### 4.9 Guided workspace setup — `/workspace/new`

**File:** `src/app/workspace/new/page.tsx` (inside `OnboardingStepLayout`)
**Who can open it:** Anyone (no guard). Linked from `/workspace` and `/prototype-home`.
**Purpose:** Full-page version of "create workspace" with a live preview.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| form values | local `react-hook-form` | — |

**Cards, widgets and lists**

#### Onboarding step layout (shared by 4.9–4.12, `src/components/onboarding/onboarding-step-layout.tsx`)
- Header: logo linking to `/workspace`, selected workspace chip, user chip (initials/name), **Reset** button (`:31-67`).
- Progress stepper: Workspace → User Profile → Preferences → Ready (`src/components/onboarding/onboarding-progress.tsx:16-21`). A step shows a tick if it is in `completedSteps` or before the current step; earlier steps are links (`:51-75`).
- Footer: subtle prototype notice.

#### "Simulated Workspace URL"
- **Shows:** `https://flashsign.app/w/<slugify(name) or "my-workspace">` and "Display-only preview — no domain is reserved." (`:110-120`).

#### Live Workspace Card Preview
- **Shows:** initials (first letters of up to 2 words, or "WS") in the chosen accent, name (or "Your Workspace Name"), description (or "<type> • <size>"), type and size pills, "1 member (You)".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Reset (layout header) | `resetDemo()` — restores DemoAuth presets and **signs in as Demo User** (`demo-auth-context.tsx:739-760`) | all DemoAuth data | Yes | no confirmation; AppContext unchanged |
| Progress step links | go back to an earlier step | none | n/a | — |
| Workspace / Organization Name* | Zod ≥ 2 chars (`auth-validation.ts:107`) | form | No | — |
| Organization Type | select, default Software Development | form | No | — |
| Company Size | select, default 11–50 employees | form | No | — |
| Accent colour swatches (6) | sets accent | local | No | — |
| Description | free text | form | No | — |
| "Back to Workspaces" | `/workspace` | none | n/a | — |
| **Continue to Profile Setup** | `createWorkspace(...)` then `/onboarding/profile` (`:67-76`) | see 4.8 | List: Yes | — |

**Notes, limits and simulated parts**
- `completedSteps` changes (e.g. adding "workspace") are not saved, so the stepper ticks reset on refresh.

### 4.10 Onboarding profile — `/onboarding/profile`

**File:** `src/app/onboarding/profile/page.tsx` (+ `avatar-picker.tsx`, `role-selector.tsx`)
**Who can open it:** Anyone (no guard). If nobody is signed in, the preset Demo User is shown but saving does nothing (`updateProfile` needs a `currentUser`).
**Purpose:** Edit name, title, department, time zone, bio, avatar colour and **demo role**.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `currentUser` | `useDemoAuth()` (fallback `DEMO_PRESET_USERS[0]`) (`:42-43`) | default values |
| Roles | `DEMO_ROLE_OPTIONS` (`src/types/demo-auth.ts:86-157`) | 10 roles with description and badges |
| Colours | `PRESET_AVATAR_COLORS` (`src/types/demo-auth.ts:230-237`) | 6 colours |

**Cards, widgets and lists**

#### Avatar preview
- **Shows:** circle in the chosen colour with initials computed from the typed name (first letter of up to 2 words; "FS" if empty) (`:70-77`), or the uploaded image.

#### Role grid
- **Shows:** 10 cards (CEO / Executive, Project Manager, Product Owner, Engineering Lead, Developer, QA Tester, Organization Admin, Document Manager, Client Stakeholder, Auditor) with description and badges; selected card has a tick (`role-selector.tsx:24-65`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Camera button on avatar | opens file picker (images); shows the image as preview (`avatar-picker.tsx:24-35`) | local | No | **image is never saved** (`avatarImage` is not passed to `updateProfile`) |
| Colour swatches | set avatar colour | local | — | — |
| Full Name* | Zod ≥ 2 chars | form | — | initials update live |
| Job Title* | Zod: required | form | — | — |
| Department* (select) | 7 options; required | form | — | — |
| Primary Timezone* (select) | 9 options | form | — | — |
| Role cards | select role | local + form | — | — |
| Short Professional Bio | max 240 chars | form | — | — |
| "Back to Workspace" | `/workspace` | none | n/a | — |
| **Continue to Preferences** | `updateProfile({...})` then `/onboarding/preferences` (`:84-97`) | DemoAuth `currentUser` (+ `flashsign_demo_user`) | **No** — reverts on refresh (4.1) | AppContext sync runs at once: name/title/department/colour/initials **and `demoRole`** change in the workspace |

**Notes, limits and simulated parts**
- **Hidden role switcher:** choosing a role here changes the app's effective role for the rest of the
  session (via the sync in 4.1). It is the only place in the running app where a user can become
  `ceo` (by picking "CEO / Executive"). The change is lost on refresh.

### 4.11 Onboarding preferences — `/onboarding/preferences`

**File:** `src/app/onboarding/preferences/page.tsx` (+ `src/components/onboarding/preference-toggle.tsx`)
**Who can open it:** Anyone (no guard).
**Purpose:** Choose theme, time zone and notification switches.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `preferences` | `useDemoAuth()` | defaults: light theme, all toggles on, "America/New_York (UTC-5)" (`demo-auth-context.tsx:25-33`) |

**Cards, widgets and lists**

#### Theme cards
- "Paper Light — Default clean workspace" and "Dark Teal — High contrast focus mode", selected card ticked.

#### Notification toggles
- "In-App Notification Center" (Recommended), "Simulated Email Digests" (Daily), "Task & Story Assignment Alerts", "Sprint & Milestone Deadline Reminders", "Signature & Contract Approval Requests" (High Priority) (`:90-131`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Paper Light / Dark Teal | select theme | local | — | — |
| Workspace Timezone (select, 9 options) | select | local | — | — |
| 5 toggle switches | on/off | local | — | — |
| "Back to Profile" | `/onboarding/profile` | none | n/a | — |
| **Complete Onboarding** | `updatePreferences({...})` then `/onboarding/complete` (`:35-47`) | DemoAuth `preferences` | Yes (`flashsign_demo_preferences`) | none |

**Notes, limits and simulated parts**
- **None of these preferences are used anywhere.** The theme is never applied (no dark mode), and
  the notification switches do not affect notifications. They are only displayed back on
  `/onboarding/complete` and `/prototype-home`.
- These are separate from the workspace Settings › Notifications page (4.18), which uses a different store.

### 4.12 Onboarding complete — `/onboarding/complete`

**File:** `src/app/onboarding/complete/page.tsx`
**Who can open it:** Anyone (no guard).
**Purpose:** Summary screen at the end of the legacy onboarding flow.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `currentUser` (fallback Demo User), `selectedWorkspace`, `preferences` | `useDemoAuth()` | — |

**Cards, widgets and lists**

#### "Setup Successfully Verified" badge — static.
#### Selected Workspace card
- initials in accent colour, name, "<companySize> • <type>" (`:48-69`).
#### Demo Persona card
- initials, full name, role with first `_` replaced and words capitalised (`:72-93`).
#### "Completed Onboarding Milestones"
- Four ticks: "Workspace registered & linked", "Persona & permissions initialized", "Theme: Paper Light / Dark Teal", "Notification digests configured" (`:97-130`). All ticks are **always shown**; only the theme name is real data.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Reset (layout) | see 4.9 | all DemoAuth | Yes | signs in as Demo User |
| "Change Workspace" | `/workspace` | none | n/a | — |
| "Review Profile" | `/onboarding/profile` | none | n/a | — |
| "Open Flash Sign Preview" | `/prototype-home` | none | n/a | — |

**Notes, limits and simulated parts**
- There is no link from here into the real workspace app (`/dashboard` or `/projects/home`).

### 4.13 Prototype home — `/prototype-home`

**File:** `src/app/prototype-home/page.tsx`
**Who can open it:** Anyone (no guard; falls back to the preset Demo User).
**Purpose:** Old "end of auth prototype" page with links to re-test flows.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `currentUser`, `selectedWorkspace`, `preferences` | `useDemoAuth()` | — |

**Cards, widgets and lists**

#### "Prototype Boundary Reached" banner
- Text says PM screens, AI agent runner and signature engines are "outside the scope of this module" (`:79-99`). **Out of date** — those screens now exist.
#### Welcome card
- Avatar initials, "Welcome, <name>", "<jobTitle> • <department>", "Role: <role>".
#### Workspace / Profile Identity / Preferences columns
- Workspace: name, "<memberCount> members • <activeProjectCount> projects", type.
- Profile: email, "Timezone: <first word of timezone>", static pill "Initial Setup Complete".
- Preferences: theme name, "In-app alerts: Active/Muted", "Digests: Enabled/Disabled".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Reset Demo" | `resetDemo()` then `/login` (`:41-44`) | all DemoAuth (signs in as Demo User) | Yes | no confirmation; AppContext not reset |
| "Sign out" | `logout()` then `/login` | session keys | Yes | — |
| "Change Workspace" (banner) / "Change" | `/workspace` | none | n/a | — |
| "Edit" | `/onboarding/profile` | none | n/a | — |
| "Adjust" | `/onboarding/preferences` | none | n/a | — |
| "Sign In Screen" | `/login` | none | n/a | — |
| "Registration Screen" | `/register` → redirects to `/signup` | none | n/a | — |
| "Recovery Screen" | `/forgot-password` | none | n/a | — |
| "Create Workspace" | `/workspace/new` | none | n/a | — |

### 4.14 Settings frame and tabs — `/settings`

**File:** `src/app/(workspace)/settings/layout.tsx`, `src/app/(workspace)/settings/page.tsx`, `src/components/settings/settings-tabs.tsx`, `src/components/settings/settings-layout.tsx`
**Who can open it:** Any signed-in user (workspace layout guard). `/settings` redirects to `/settings/profile`.
**Purpose:** Tab bar and shared building blocks for the personal Settings pages.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `demoRole` | `useApp()` (`settings-tabs.tsx:9`) | decides whether "Users & Roles" tab is shown |

**Cards, widgets and lists**

#### Tab bar
- Profile, My Signature, Preferences, Notifications, Security, and **Users & Roles** only when `canManageUsers(demoRole)` (roles `ceo`, `org_admin`, `platform_admin`) (`settings-tabs.tsx:10-17`, `src/lib/permissions.ts:129-132`).
- A tab is active only on an exact URL match; if no tab matches (e.g. `/settings/users` opened by a role without the tab), the whole tab bar disappears (`src/components/shared/section-tabs.tsx:19-30`).

#### Shared pieces (`settings-layout.tsx`)
- `SettingsPage` (title/description), `SettingsCard` (titled box with optional footer), `SettingsToggle` (label + switch), `SaveButton`, `SavedNote` ("Saved" with a green tick for 2.5 s via `useSavedFlash`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Each tab | navigates | none | n/a | — |

### 4.15 Settings › Profile — `/settings/profile`

**File:** `src/app/(workspace)/settings/profile/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Edit your details as other people see them.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Current user | `useCurrentUser()` (AppContext `users`) | loaded into the form once per user id (`:33-45`) |

**Cards, widgets and lists**

#### Personal details card
- **Shows:** photo circle (photo or initials on `user.color`), the fields below, and a footer with "Saved" note and **Save changes**.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Change photo" (file input) | Must be an image ("Choose an image file.") and ≤ 400 KB ("The photo must be 400 KB or smaller.") (`:55-63`); stored as a data URL in the form | local | — | — |
| "Remove" (when a photo is set) | clears the photo in the form | local | — | — |
| Full name* | must not be empty for Save to be enabled (`:53`) | local | — | — |
| Email | disabled, lock icon, hint "Your sign-in email can't be changed here." | none | n/a | — |
| Job title | free text; hint "It doesn't change your permissions." | local | — | — |
| Department, Company, Address | free text | local | — | — |
| Phone | optional; ≤ 24 chars, only digits, spaces, `+ ( ) -` with `+` only first, 1–15 digits (`:14-22`) | local | — | error disables Save |
| **Save changes** | `updateMember(user.id, {...})` with new `initials` from the name (`:65-79`) | AppContext `users` (`app-context.tsx:1368-1371`) | **Partly** — see notes | "Saved" note for 2.5 s; no toast |

**Notes, limits and simulated parts**
- **Name, job title and department revert after a refresh.** On load, the DemoAuth→AppContext sync
  (4.1) merges the DemoAuth account over this record and writes back the DemoAuth `fullName`,
  `jobTitle`, `department`, `avatarInitials` and `avatarColor`. Company, phone, address and photo
  survive because the sync does not touch them.
- This page does not update the DemoAuth account, so the login page and onboarding pages keep showing the old name.
- The photo is shown only here and in `src/components/collaboration/member-avatar.tsx`; the header chip and the shared `Avatar` component show initials.
- Unclear: the hint says Company "fills the Company field when you sign your own documents", but no code reading `user.company` (or phone/address) was found outside this page.

### 4.16 Settings › My Signature — `/settings/signature`

**File:** `src/app/(workspace)/settings/signature/page.tsx` (+ `src/components/signature/signature-editor.tsx`, `signature-mark.tsx`)
**Who can open it:** Any signed-in user.
**Purpose:** Save one personal signature + initials used when signing documents.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Saved signature | `useApp().savedSignatures.find(s => s.userId === user.id)` (`:18`) | seed: empty list (`app-context.tsx:478`) |
| Allowed methods | `useApp().signingDefaults.allowedSignatureMethods` | set under Agreements › Settings |

**Cards, widgets and lists**

#### "Saved signature" card (view mode)
- **Shows:** signature and initials drawn by `SignatureMark` (large), method ("Typed"/"Drawn"/"Uploaded") and "updated <Mon D, YYYY>" (`:74-88`).
- **Empty state:** "You haven't saved a signature yet. Create one now, or you'll be asked the first time you sign." (`:90-92`).

#### Editor card (edit mode)
- **Shows:** Full name, Initials (max 4, upper-case), method tabs (only allowed methods; tabs hidden if only one), then: **Type** → 4 style buttons (Formal, Script, Bold, Elegant); **Draw** → two drawing pads with Clear; **Upload** → two upload boxes (PNG/JPEG/GIF/BMP, ≤ 200 KB, "Use a JPG, PNG, GIF or BMP image." / "The image must be 200 KB or smaller."). A preview appears when the draft is complete (`signature-editor.tsx:36-148`).
- **How "complete" is calculated:** name and initials not empty; for Draw/Upload both a signature image and an initials image are required (`signature-editor.tsx:26-30`).

#### Info box
- Explains per-document "Change signature" while signing, with link "Agreements › Settings" (`/signatures/settings`) (`:119-126`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create signature" / "Change signature" | enters edit mode; new draft = name, initials from name (max 4 letters), first allowed method, style Script (`:24-34`) | local | — | — |
| "Delete" (only when one exists) | browser `confirm()` "Delete your saved signature?…", then `deleteSignature(user.id)` (`:43-47`) | `savedSignatures` (`app-context.tsx:1751-1754`) | Yes | — |
| Full name / Initials inputs | edit draft | local | — | — |
| Method tabs | switch method; images from another method are dropped (`signature-editor.tsx:48-51`) | local | — | — |
| Style buttons (Type) | choose font style | local | — | — |
| Draw pads + Clear | draw / clear image | local | — | — |
| Upload boxes + remove | pick / remove image | local | — | — |
| "Cancel" | leave edit mode | none | — | — |
| **Save signature** (disabled until complete) | `saveSignature({...draft, userId, updatedAt})` (`:36-41`) — replaces any earlier signature of this user (`app-context.tsx:1747-1750`) | `savedSignatures` | Yes | "Signature saved" note |

### 4.17 Settings › Preferences — `/settings/preferences`

**File:** `src/app/(workspace)/settings/preferences/page.tsx`
**Who can open it:** Any signed-in user. **No permission check**, although these values are organisation-wide.
**Purpose:** Calendar and planning defaults, working hours, time zone, workload limit.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `collaborationSettings` | `useApp()` (seed `MOCK_COLLABORATION_SETTINGS`, `src/data/mock-collaboration.ts:644-655`) | one shared object for the whole app, not per user. Copied into local form state once (`:23`) |

**Cards, widgets and lists**

#### Form card
- "Preferences saved." green message for 2.5 s after saving (`:47-52`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Default Calendar View (Month / Week / Day / List-Agenda) | form | local | — | — |
| Week Start Day (Monday / Sunday) | form | local | — | — |
| Default Planning Workspace View (Calendar / Timeline / List buttons) | form | local | — | — |
| Timezone (7 options) | form | local | — | — |
| Work Day Start / End (time inputs) | form | local | — | no check that end is after start |
| Weekly Workload Warning Threshold (slider 30–50, step 5) | form | local | — | — |
| **Save Preferences** | `updateCollaborationSettings(settings)` (`:26-31`) | `collaborationSettings` (`app-context.tsx:1741-1744`) | Yes | green note |
| "Reset Demo State" | `resetDemoData()` with **no confirmation** (`:197-204`) | resets **all** AppContext data to seed (see 3.5) | Yes | the form keeps showing the old values (local state is not reloaded) |

**Notes, limits and simulated parts**
- **None of these settings are read anywhere else in the code** (`defaultCalendarView`,
  `weekStartDay`, `defaultPlanningView`, `workingHoursStart/End`, `timeZone`,
  `workloadThresholdHours` only appear in this page, the type and the seed). Saving them has no visible effect on the calendar, planner or workload pages.
- A "Reset Demo State" button on a personal preferences page wipes every project, task and setting.

### 4.18 Settings › Notifications — `/settings/notifications`

**File:** `src/app/(workspace)/settings/notifications/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Choose channels and events for notifications. "Changes save automatically."

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `collaborationSettings.desktopNotifications`, `emailNotifications`, `weeklyDigest`, `notificationEvents` | `useApp()` | seed: the three channels `true`; `notificationEvents` not set, so every event shows **on** (`events[id] ?? true`, `:90`) |

**Cards, widgets and lists**

#### "Where to notify me"
- In-app notifications ("The bell in the top bar."), Email ("Sent to your sign-in email address."), Weekly summary ("One email on Monday…") (`:54-73`).

#### "What to notify me about"
- Work: task assigned, mentioned, review requested, task blocked. Agreements: signature requested, request signed, request declined, request expiring. Planning: meeting invite, meeting conflict, time-off decision. Teams: announcement (`:8-43`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| In-app / Email / Weekly summary switches | `updateCollaborationSettings({ desktopNotifications | emailNotifications | weeklyDigest: v })` immediately | `collaborationSettings` | Yes | none |
| 12 event switches | `updateCollaborationSettings({ notificationEvents: {...events, [id]: v} })` (`:49-50`) | `collaborationSettings.notificationEvents` | Yes | none |

**Notes, limits and simulated parts**
- **These switches change nothing.** No code that creates notifications reads them, and no email is ever sent.
- The values are stored in the shared `collaborationSettings`, so they are the same for every user, not personal.

### 4.19 Settings › Security — `/settings/security`

**File:** `src/app/(workspace)/settings/security/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Change password (simulated), two-step sign-in (disabled), sessions (static).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| none from stores | — | — |

**Cards, widgets and lists**

#### Change password card — form below.
#### Two-step sign-in card
- Disabled switch "Ask for a code from an authenticator app when I sign in", badge "Coming soon" (`:63-72`).
#### "Where you're signed in"
- Static row "This browser — Active now — Current session" (`:74-84`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Current password (eye toggle) | must not be empty ("Enter your current password.") — **not compared** with the real password | local | — | — |
| New password (eye toggle, strength meter) | same rules as reset password: ≥ 8, uppercase, number (`:24`); must differ from the typed current password (`:31`) | local | — | — |
| Confirm new password | must match ("Passwords do not match") | local | — | — |
| **Update password** | if valid: clears the three fields and shows "Password updated (demo)" (`:35-39`) | **nothing** | No | the account password in DemoAuth is unchanged; no sign-out of other devices despite the description |
| Two-step switch | disabled; `onChange` does nothing | none | n/a | — |

### 4.20 Settings › Users & Roles — `/settings/users`

**File:** `src/app/(workspace)/settings/users/page.tsx`
**Who can open it:** Tab shown only when `canManageUsers(demoRole)` (ceo, org_admin, platform_admin). The page itself has **no guard** — any signed-in user can open the URL; non-admins just don't see the Invite button or "..." column.
**Purpose:** List of organisation members and a (fake) invite form.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| `users` | `useApp()` (seed `MOCK_USERS`, 14 people incl. "CI/CD Bot", plus the signed-in user added by the sync) | not filtered by organisation |
| `demoRole` | `useApp()` | for `canManage` (`:26`) |

**Cards, widgets and lists**

#### Header
- "Users & Invitations", "<users.length> members in your organization" (`:45-55`) — counts every AppContext user, including bots and the client/auditor.

#### User table
- Columns: User (avatar, name, email), Role (shield + label from `ROLE_LABELS`), Department (md+), Status ("Active"/"Inactive" from `isActive`, lg+), and an empty "..." column for managers (`:96-146`).
- **Empty state:** none.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Invite User" (managers only) | opens the inline invite card | local | — | — |
| Email input | free text; only checked to be non-empty | local | — | — |
| Role select (all 12 AppContext roles) | local | local | — | — |
| **Send Invitation** | after 800 ms shows "Invitation sent!", after 2 more seconds closes and clears (`:28-38`) | **nothing** — `setTimeout` fake; does not call `sendInvitation` | No | no email, no invitation record, no link |
| Cancel | closes the card | local | — | — |
| "..." per row (managers only) | **nothing** — button has no `onClick` (`:136-138`) | none | n/a | — |

**Notes, limits and simulated parts**
- The real invitation flow (with links, 7-day expiry, resend/revoke) lives on the Members page (`src/components/members/invite-member-dialog.tsx`, `invitations-list.tsx`) and uses DemoAuth `sendInvitation`. This Settings page is a separate, older, fake version.
- Roles cannot be changed here.

### 4.Z Data flow summary for this area

- **Reads (DemoAuth):** `users`, `workspaces`, `currentUser`, `selectedWorkspace`, `preferences`, `invitations`, `pendingSignupUser`, `authMessage`, `completedSteps`, `isHydrated`, `isAuthenticated`.
- **Writes (DemoAuth, saved in `flashsign_demo_*` keys):** accounts (signUp, createOrganization, acceptInvitation), organizations (createOrganization, createWorkspace, acceptInvitation), session (login, logout, acceptInvitation, resetDemo), preferences, invitations (acceptInvitation), success message, pending signup. **Not saved / lost on refresh:** `updateProfile` changes, selected workspace, completed steps.
- **Reads (AppContext):** `users` / `useCurrentUser()`, `demoRole`, `savedSignatures`, `signingDefaults`, `collaborationSettings`.
- **Writes (AppContext, all saved):** `users` (updateMember from Settings › Profile; the sync effect also adds/merges the signed-in user and sets `currentUserId`, `demoRole`, `org`), `savedSignatures` (saveSignature, deleteSignature), `collaborationSettings` (updateCollaborationSettings), whole state (resetDemoData from Settings › Preferences).
- **Store actions used:** DemoAuth `login`, `logout`, `signUp`, `createOrganization`, `acceptInvitation`, `clearAuthMessage`, `selectWorkspace`, `createWorkspace`, `updateProfile`, `updatePreferences`, `resetDemo`; AppContext `updateMember`, `saveSignature`, `deleteSignature`, `updateCollaborationSettings`, `resetDemoData`. Defined but unused: `register`, `markStepComplete`, `setPendingSignupUser` (outside the store).
- **Purely simulated (change no data):** forgot password, reset password, Settings › Security password change, two-step sign-in, Settings › Users "Send Invitation", all notification and planning preferences (stored but never read).

---

## 5. Dashboards, project lists and the new-project wizard

This section covers the two dashboards (`/dashboard` and `/projects/home`), the project lists (All projects, Favorites, Recent), the portfolio Roadmap and Planner calendars, My Tasks, the Activity feed, the stand-alone task page and the multi-step "Create New Project" wizard. All of these screens read from `AppContext` (`useApp()`); nothing calls a server. Many cards show a project's **progress %**, **health** and **timeline difference**, so section 5.1 explains first exactly how those three numbers are made. Charts on `/dashboard` are hard-coded demo numbers, not real data.

Note on roles: after sign-in, the effect at `src/context/app-context.tsx:622-672` sets `demoRole` to the signed-in account's role (`executive`→`ceo`, `qa`→`qa_tester`, other roles keep their name) and `currentUserId` to that user's id. `FIXED_DEMO_ROLE` (`ceo`) only applies before that sync. So "current user" and "role" below always mean the signed-in account.

---

### 5.1 How project progress %, health and timeline are calculated (used on many cards)

**Files:** `src/lib/subtasks.ts`, `src/lib/timeline-calculator.ts`, `src/lib/schedule.ts` (`forecastEnd`), `src/context/app-context.tsx`
**Purpose:** These are the fields `project.progress`, `project.health`, `project.timelineDifference`, `project.timelineStatus`, `project.currentEndDate`, `project.originalDuration`, `project.currentDuration` that the cards on this area display.

#### Progress % (`project.progress`)
- **Formula** (`progressOfTasks`, `src/lib/subtasks.ts:47-53`):
  - Take all tasks of the project. Keep only "leaf" work: tasks that have no subtasks, plus all subtasks. A task that has subtasks is NOT counted (so it is not counted twice).
  - Weight of each leaf = `max(1, estimatedDuration)` days (missing estimate = 1).
  - `progress = round( sum(weight of leaves with status "done") / sum(weight of all leaves) × 100 )`. No leaves → 0.
  - Only status `done` counts. `review`, `in_progress` count as 0 %.
- **When it is recalculated:** only inside task actions — `addTask` (`app-context.tsx:828`), `addTasks`, `updateTask` (`:942`), `deleteTask`, and similar task moves. Each of these writes the new `progress` onto the project and then calls `calculateProjectTimeline`.
- **Important:** `calculateProjectTimeline` does **not** recompute progress. On first load the seed values written in `src/data/mock-data.ts` (for example p1 = 68, p2 = 42, p6 = 100) are shown unchanged until someone adds, edits or deletes a task in that project. So the seed progress numbers are "typed in", not calculated. A new project from the wizard starts at 0.

#### Timeline (`calculateProjectTimeline`, `src/lib/timeline-calculator.ts:153-264`)
Runs on app load for every project (`app-context.tsx:454` and `:503`), and after every project/task/milestone change.
1. **Baseline (the "original plan"):**
   - `originalStartDate` = `project.originalStartDate` or `startDate` (as YYYY-MM-DD).
   - `originalEndDate` = `project.originalEndDate` or `endDate` or `dueDate`, else start + 90 days.
   - `originalDuration` = stored `originalDuration`, else days between start and end, else 90 (minimum 1).
2. **Latest end of the work** (`maxTaskEndDate`), the latest of:
   - each main task's effective end (`calculateTaskEffectiveSchedule`, `:60-127`): a task with subtasks uses its subtasks' dates (each subtask without dates follows the previous one, length = its estimate); a task without subtasks uses its own `dueDate`, or start + estimate (default 3 days);
   - each task's **forecast end** (`forecastEnd`, `src/lib/schedule.ts:108-123`): finished tasks (review/done) = date they got there; started / in progress / blocked = latest of planned end, start + estimate, and today; not started but planned start is past = latest of planned end and today + estimate; otherwise planned end;
   - each milestone (phase) of the project: its `endDate` or `dueDate`.
3. **Status and difference:**
   - Project `status === 'completed'` → `timelineStatus = 'completed'`, difference 0 (current end stays the original end).
   - Latest end is **after** the original end → `extended`, `currentEndDate = latest end`, `timelineDifference = +days late`.
   - Latest end is **before** the original end AND the project has at least one main task → `shortened`, `timelineDifference = −days early`.
   - Otherwise → `on_schedule`, difference 0.
   - `currentDuration = max(1, days(currentStart → currentEnd))`. The project's `startDate/endDate/dueDate` are overwritten with the current values, so every card that reads `endDate` sees the **current (forecast) end**, not the baseline.
   - `totalWorkDays` = sum of main tasks' work days (subtask estimates summed for tasks with subtasks).

#### Health (`project.health`)
- If `healthMode === 'manual'` (set by hand in Project Settings), the stored value is kept.
- Else if status is `completed` → `on_track`.
- Else `healthFromTimeline(status, difference, originalDuration, paceGap)` (`timeline-calculator.ts:134-139`):
  - `late = difference / originalDuration` (only when `extended`, else 0).
  - `late > 25 %` → **Delayed**.
  - `late > 10 %` OR `paceGap > 25` → **At Risk**.
  - otherwise → **On Track**.
  - `paceGap` (`:142-146`) = (% of baseline time already used, clamped 0–100) − (live work done % from `progressOfTasks` on the current tasks). Example: 60 % of the time used but 30 % of the work done → gap 30 → At Risk.
- **Off Track is never produced automatically.** It only appears when set manually. Seed health values (e.g. p5 `off_track`) are replaced on load because no seed project has `healthMode: 'manual'`.
- Note: health uses the *live* work done %, but the progress bar shows the *stored* `progress` (see above), so the two can disagree for seed projects.

#### Status (`project.status`)
- Not calculated. It is a stored field (`planning`, `active`, `on_hold`, `completed`, `cancelled`, `archived`). The wizard always creates `active`; Quick Create creates `active`; it is changed only in Project Settings (other section).
- `isArchived` is a separate flag toggled by `archiveProject` (`app-context.tsx:811`); it does **not** change `status`, and none of the screens in this section hide archived projects.

---

### 5.2 Executive dashboard — `/dashboard`

**File:** `src/app/(workspace)/dashboard/page.tsx` (+ `src/components/shared/ui.tsx` StatCard/ProgressBar, `src/components/shared/badges.tsx`)
**Who can open it:** Any signed-in user. The login page sends users here after sign-in (`src/app/(auth)/login/page.tsx:82`). It is **not** in the sidebar (sidebar "Dashboard" opens `/projects/home`).
**Purpose:** A one-page summary of projects, tasks, approvals and AI runs.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects, tasks, documents, approvals, agentRuns, users, milestones | `useApp()` (seed: `mock-data.ts`) | all projects, incl. archived and the duplicate seed project |
| Current user | `useCurrentUser()` | first name in greeting |
| Role label/description | `useRoleConfig()` (`src/lib/permissions.ts`) | subtitle |
| Sprint velocity | `SPRINT_VELOCITY` constant (`dashboard/page.tsx:18-24`) | hard-coded |
| Task distribution | `TASK_DIST` constant (`:26-32`) | hard-coded |

**Cards, widgets and lists**

#### Greeting
- **Shows:** "Good morning, {first name} 👋" and "{role label} — {role description}".
- **How:** first word of `currentUser.name` (`:59`). "Good morning" is fixed text — same at any time of day.

#### KPI "Active Projects"
- **Shows:** number + green line "N on track".
- **How:** value = projects with `status === 'active'` (`:39`). The "on track" count = **all** projects (any status) with `health === 'on_track'` (`:74`), not only active ones.

#### KPI "Open Tasks"
- **Shows:** number + red "N overdue" (only if N > 0).
- **How:** tasks (all projects, including subtasks) with `status !== 'done'` (`:40`). Overdue = `dueDate < now` and not done (`:41-43`).

#### KPI "Pending Approvals"
- **How:** `approvals.filter(status === 'pending').length` (`:44`). Not filtered to the current user.

#### KPI "AI Runs Today"
- **How:** `agentRuns` with status `running` or `needs_review` (`:93`). Not limited to today. The line "2 need review" is **hard-coded text** (`:96`).

#### Projects card
- **Shows:** one row per **active** project: name, key, progress bar, timeline badge, up to 3 member avatars, health badge, progress %.
- **Data source:** `projects` with `status === 'active'`; members = `users` whose id is in `project.memberIds`.
- **Timeline badge (`:129-141`):** `timelineDifference > 0` → red "+Nd extended"; `< 0` → "−Nd ahead" (number already has the minus sign, e.g. "-5d ahead"); else "On schedule". See 5.1.
- **Health:** `HealthBadge` (On Track / At Risk / Off Track / Delayed), see 5.1.
- **Empty state:** none (empty list).

#### Sprint Velocity chart
- **Shows:** bar chart, sprints S8–S12, "Planned" vs "Completed".
- **Data source:** hard-coded `SPRINT_VELOCITY`. Not linked to `sprints` or tasks.

#### Task Distribution chart
- **Shows:** donut chart + legend: Done 12, In Progress 6, Review 3, Blocked 2, To Do 9.
- **Data source:** hard-coded `TASK_DIST`. Does not change when tasks change.

#### Upcoming Milestones
- **Shows:** up to 4 milestones: name, badge ("⚠ At Risk" if `status === 'at_risk'`, else "Upcoming"), due date, progress bar.
- **How:** `milestones.filter(status !== 'completed').slice(0, 4)` (`:211`) — array order, **not sorted by date**, from all projects; overdue ones are included. Progress = stored `milestone.progress` (seed values; not calculated).

#### Approvals Needed (only if there is at least 1 pending approval)
- **Shows:** first 3 pending approvals: document title (or "Document"), text "Awaiting your approval".
- **How:** `documents.find(d.id === approval.documentId)`. Not filtered by `assignedTo`, so it says "your approval" even when the approval is assigned to someone else.

#### Recent Activity
- **Shows:** up to 6 lines like "Task FSV2-101 updated" / `"ACME Corp MSA" pending`, with relative time.
- **How (`:45-48`):** the first 3 tasks in the array + first 2 documents, sorted by `updatedAt` newest first. This is **not** a real activity log; it only ever shows these 5 items.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "View all →" (Projects card) | Link to `/projects` | none | — | — |
| Project row | Link to `/projects/{id}` | none (project page calls `addRecentProject`) | — | — |
| "View all" (Approvals Needed) | Link to `/approvals` | none | — | — |
| Approval row | Link to `/approvals` (not to the specific approval) | none | — | — |
| Chart tooltips | Hover shows values | none | — | — |

**Notes, limits and simulated parts**
- Both charts and the "2 need review" line are fixed demo data.
- `myTasks` is calculated (`:50`) but never shown.
- "Recent Activity" is a fake feed built from 3 tasks and 2 documents.

---

### 5.3 Project Management home ("Dashboard" in the sidebar) — `/projects/home`

**File:** `src/app/(workspace)/projects/home/page.tsx` (+ `src/components/agents/my-work-card.tsx`, `src/components/shared/quick-create-dialog.tsx`)
**Who can open it:** Any signed-in user. Sidebar "Workspace → Dashboard" (`src/components/layout/app-sidebar.tsx:67`) and the logo link go here. `/ai-agents/activity` redirects here.
**Purpose:** The main home page: portfolio KPIs, my timer/hours, project cards, deadlines, my tasks and recent audit log.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects, tasks | `useApp()` | all projects, incl. archived |
| auditLogs | `useApp().auditLogs` (seed `MOCK_AUDIT_LOGS`) | **not saved** — resets on refresh |
| workSessions, agentEvents, agentTokens | `useApp()` (in MyWorkCard) | saved |
| Current user | `useCurrentUser()` | |
| Date in header | fixed `new Date('2026-10-20T09:00:00Z')` (`:29`) | hard-coded demo date, not today |

**Cards, widgets and lists**

#### Header
- **Shows:** "Welcome back, {full name}" (or "Project Lead" if no name) and "{date} • Here is your portfolio status…". The date is always **Tuesday, Oct 20, 2026** (hard-coded).

#### KPI "Total Projects"
- **How:** `projects.length` (`:22`). Includes the duplicate seed project "Flash Sign v2.0" (`p-mvhmnblw`) and archived projects. Sub-text "Across all spaces" is fixed.

#### KPI "Active Sprints"
- **How:** label says "Active Sprints" but the value is the number of **projects** with `status === 'active'` (`:23`, `:96`). It does not count sprints.

#### KPI "Completed"
- **How:** projects with `status === 'completed'` (`:24`).

#### KPI "Attention Needed — Overdue tasks"
- **How:** all tasks (all projects, incl. subtasks) with `dueDate < now` and not done (`:25`). Not limited to the current user, although it links to My Tasks.

#### "My work today" card (`MyWorkCard`)
- **Timer box:** the current user's work session with no `endedAt` (`my-work-card.tsx:32`). Shows "Timer running", "{task key} · {title}", minutes since start (`sessionMinutes`, `src/lib/agent-connection.ts:381`) and the source badge (web / agent). Without a running timer: "No timer running" + hint; if the user has no **active** agent token, a "Connect your AI agent" link.
- **Today:** sum of minutes of the user's sessions that **started** today (running sessions count up to now). Format "1h 20m" (`formatMinutes`).
- **Last 5 working days:** sum of minutes of sessions that started on or after the first of the last 5 weekdays (`lastWorkdays`, Mon–Fri only, `agent-connection.ts:394`).
- The clock updates every 30 seconds (`src/lib/use-now.ts`).
- **Latest from your agents:** last 3 `agentEvents` of this user (excluding `listed_tasks`), newest first, e.g. "[Claude] moved to In Review FSV2-101 · 2h ago". Empty: "Nothing yet."
- **Amber bar:** shown when any of the user's sessions has `needsReview` (auto-stopped by idle/day cut-off): "N timers were stopped automatically. Please check your timesheet."

#### Active Project Portfolio
- **Shows:** the **first 4** projects in the array (any status, not only active) as cards: key tile in accent colour, name, group (or "Project"), status in raw form (e.g. "active", "on_hold"), description (2 lines), progress bar + %.
- **How:** `projects.slice(0, 4)` (`:154`). New projects are added at the front of the array, so a newly created project appears first.
- Link "View All ({projects.length})".

#### Upcoming Project Deadlines
- **Shows:** up to 5 tasks: status badge, title, "{project name} • {task key}", priority badge, due date.
- **How:** `tasks.filter(t => t.dueDate && t.status !== 'done').slice(0, 5)` (`:206`). **Not sorted by date** and includes overdue tasks and subtasks; order is the tasks array order (newest added first).

#### Assigned to Me
- **Shows:** up to 5 tasks with key, priority, title, status, due date or "No deadline".
- **How:** `tasks.filter(assigneeId === currentUser.id)` (`:26`) — includes **done** tasks too, although the empty text says "No active tasks assigned."
- **Empty state:** "No active tasks assigned."

#### Recent Team Activity
- **Shows:** first 5 `auditLogs`: initials circle, "**Actor** action words" (dots replaced by spaces, e.g. "document created"), detail, relative time.
- **Data source:** `auditLogs` — not saved; seed + entries added this session (e.g. by the wizard's `addActivity`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "All Projects" button | Link to `/projects` | none | — | — |
| "+ Create Item" button | Opens `QuickCreateDialog` (see 5.4) | — | — | — |
| KPI tiles Total / Active Sprints / Completed | Link to `/projects` (no filter applied) | none | — | — |
| KPI tile "Attention Needed" | Link to `/projects/my-tasks` (no tab preselected) | none | — | — |
| "Log time" (My work) | Link to `/teams/timesheet?log=1` | none | — | — |
| "Open my timesheet" | Link to `/teams/timesheet` | none | — | — |
| Running task name (My work) | `openTaskDrawer(task.id)` → opens the Task drawer | `activeTaskDrawerId` | No (UI only) | — |
| "Connect your AI agent" | Link to `/ai-agents/connect` | none | — | — |
| Amber "timers were stopped" bar | Link to `/teams/timesheet` | none | — | — |
| "View All (N)" (portfolio) | Link to `/projects` | none | — | — |
| Portfolio project card | Link to `/projects/{id}` | none | — | — |
| Deadline row | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No (UI only) | — |
| "View All" (Assigned to Me) | Link to `/projects/my-tasks` | none | — | — |
| Assigned task card | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No | — |
| "Logs" | Link to `/activity` | none | — | — |

**Notes, limits and simulated parts**
- Header date is hard-coded to 20 Oct 2026.
- "Active Sprints" counts projects, not sprints.
- The activity list disappears back to seed data after refresh (`auditLogs` not saved).

---

### 5.4 Quick Create dialog (opened from "+ Create Item") — modal

**File:** `src/components/shared/quick-create-dialog.tsx` (also opened from the top header, `src/components/layout/app-header.tsx:229`)
**Who can open it:** Any signed-in user; no permission check for any tab.
**Purpose:** Create a task, project, milestone or sprint with a few fields.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Tabs Task / Project / Milestone / Sprint | Switch the form | none | — | — |
| Create Task | Needs a title. Calls `addTask` with key `{PROJECTKEY}-{random 100–899}` (`:59-61`), status todo, tag `quick-create`, chosen project/priority/type/assignee/sprint/due date | `tasks`; project `progress` + timeline recalculated | Yes | toast "Task … created" |
| Create Project | Needs name and key. Calls `addProject`: status active, health on_track, owner/member = current user, start today, end today + 60 days, accent `#00c2a8`, tag `new` | `projects`, `recentProjectIds` | Yes | toast; navigates to `/projects/{id}` |
| Create Milestone | Needs name. `addMilestone` for the project selected in the Task tab, due date (or today), status upcoming | `milestones`; project timeline recalculated | Yes | toast |
| Create Sprint | Needs name. `addSprint`: status planned, start today, end +14 days, capacity (default 30) | `sprints` | Yes | toast |

**Notes, limits and simulated parts**
- Quick-created task keys are random numbers and can clash with an existing key (unlike `nextTaskKey` used elsewhere).
- The Quick Create project has no structure, boards, phases or members beyond the creator. Full behaviour of this dialog is described where the header is documented.

---

### 5.5 All Projects — `/projects`

**File:** `src/app/(workspace)/projects/page.tsx` (components `ProjectCardItem` `:207`, `ProjectTable` `:328`)
**Who can open it:** Any signed-in user. "Create Project" buttons are only shown when `canCreateProject(demoRole)` is true (`src/lib/permissions.ts:105`: roles `ceo`, `project_manager`, `product_owner`, `engineering_lead`, `org_admin`, `platform_admin`).
**Purpose:** Directory of all projects with search, filters, sort and grid/table view.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects | `useApp().projects` | all, including archived (no archive filter) |
| users | `useApp().users` | owner and member avatars |
| tasks | `useApp().tasks` | "x/y tasks done" count |
| demoRole | `useApp().demoRole` | create button visibility |

**Cards, widgets and lists**

#### Page header
- **Shows:** "All Projects", "{projects.length} collaborative delivery spaces across your organization" (total count, not filtered count).

#### Filtering and sorting (applies to both views) (`:32-50`)
- Search matches **name, key or description** (case-insensitive, "contains").
- Status, Priority, Space (group) filters must match exactly; Favorites toggle keeps `isFavorite` projects.
- Sort: Name (A→Z), Progress (high→low), Due Date (by `endDate`, which is the **current/forecast** end — earliest first), Priority (critical→low).

#### Project card (grid view, default)
- **Shows:**
  - Key tile in `accentColor` (default `#00c2a8`), name (link), group or "Project Workspace".
  - Star (favourite) and status badge (Planning / Active / On Hold / Completed / Cancelled / Archived).
  - Description (2 lines).
  - "{done}/{total} tasks done": tasks of the project (**including subtasks**) with status `done` / all tasks (`:220-221`). This is a simple count, different from the weighted progress %.
  - Progress % and bar = `project.progress` (5.1). Bar colour by health: On Track = flash green, At Risk = amber, Off Track / Delayed = red (`:223-228`).
  - Timeline line: `timelineDifference > 0` → "+Nd extended ({currentDuration}d total)"; `< 0` → "−Nd shortened ({currentDuration}d)"; else "On schedule ({originalDuration or 90}d)".
  - Footer: up to 3 member avatars, priority badge, deadline label.
- **Deadline label (`:231-233`):** `diffDays = ceil((endDate − now) / 1 day)` where `endDate` is the current end from 5.1. `> 0` → "N days left"; `0` → "Due today"; `< 0` → "Nd overdue" in red. Completed projects can also show "overdue".
- **Empty state:** "No projects match your criteria" + Create Project button (if allowed).

#### Project table (table view)
- **Columns:** star, Project (key + name link), Status, Priority, Progress (bar + %), Timeline ("+Nd extended" / "−Nd shortened" / "On schedule"), Owner name, Team avatars (max 3), Planned End.
- **Planned End:** `currentEndDate || endDate`; if `originalEndDate` differs, a struck-through "Base: {original end}" line is added (`:413-416`).
- Table rows also compute owner/tasks variables that are not shown (`doneCount` unused).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Project" (header, and in empty state) | Link to `/projects/new`; only shown if `canCreateProject(demoRole)` | none | — | — |
| Search box | Filters list as you type (name/key/description) | local state | No | — |
| Status select | All / Active / Planning / On Hold / Completed (no Cancelled/Archived options) | local state | No | — |
| Priority select | All / Critical / High / Medium / Low | local state | No | — |
| Space select | All Spaces + every distinct `project.group`; hidden if no project has a group | local state | No | — |
| "Favorites" toggle | Shows only starred projects | local state | No | — |
| Sort select | Name / Progress / Due Date / Priority | local state | No | — |
| Grid / Table buttons | Switch view | local state | No | — |
| Star on card / in table | `toggleFavoriteProject(id)` flips `isFavorite` (`app-context.tsx:815`) | `projects[].isFavorite` | Yes | none (no toast, `updatedAt` not changed) |
| Project name (card/table) | Link to `/projects/{id}` | none | — | project page then calls `addRecentProject` |

**Notes, limits and simulated parts**
- Filters, sort and view reset when you leave the page (not stored).
- Archived projects are still listed; there is no "archived" filter.
- The seed data contains two identical "Flash Sign v2.0 / FSV2" projects (`p1` and `p-mvhmnblw`, `src/data/mock-data.ts:223-245`); the copy has no tasks, so its timeline shows a different end date and progress stays at the seed 68 %.
- The `/projects/new` route itself has no permission check (see 5.13).

---

### 5.6 Favorited Projects — `/projects/favorites`

**File:** `src/app/(workspace)/projects/favorites/page.tsx`
**Who can open it:** Any signed-in user. **No link in the app points here** (not in the sidebar); reachable only by typing the URL.
**Purpose:** Cards for starred projects.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects with `isFavorite` | `useApp().projects` | seed: p1, p-mvhmnblw, p2, p3 are starred |
| users | `useApp().users` | owner |

**Cards, widgets and lists**

#### Favourite project card
- **Shows:** accent dot, key, status badge, filled star, name (link), description, "Progress {progress}%", bar in the project's accent colour, owner avatar + name, date = `dueDate || endDate` (the current end, 5.1), "Open Project →" button.
- **How:** `projects.filter(isFavorite)`, then search on name or key (`:24-28`). Order = projects array order.
- **Empty state:** "No favorite projects yet" + "Browse All Projects" button.
- `HealthBadge`, `doneTasks` are imported/calculated but not shown.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search favorites | Filters by name/key | local state | No | — |
| Filled star | `toggleFavoriteProject(id)` → card disappears from this page | `projects[].isFavorite` | Yes | — |
| Project name / "Open Project" | Link to `/projects/{id}` | none | — | — |
| "Browse All Projects" (empty state) | Link to `/projects` | none | — | — |

**Notes, limits and simulated parts**
- Orphan route (no navigation leads here).

---

### 5.7 Recently Viewed Projects — `/projects/recent`

**File:** `src/app/(workspace)/projects/recent/page.tsx`
**Who can open it:** Any signed-in user. **No link in the app points here.**
**Purpose:** Table of projects in the order they were last opened.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| recentProjectIds | `useApp().recentProjectIds` (seed `['p1','p2','p3']`, `app-context.tsx:487`) | saved |
| projects, users | `useApp()` | |

**Cards, widgets and lists**

#### Recent projects table
- **How the list is built (`:173-179`):** each id in `recentProjectIds` mapped to its project (missing ids dropped). If the id list is empty, the first 4 projects are shown instead. Then search on name/key.
- **How ids get there:** `addRecentProject(id)` (`app-context.tsx:819-825`) — called by the project page `/projects/{id}` when it opens (`src/app/(workspace)/projects/[projectId]/page.tsx:52`); moves the id to the front, keeps max 10. `addProject` also puts a new project first. `deleteProject` removes it.
- **Columns:** Project (accent dot, name, key, "time viewed"), Status badge, Health badge (5.1), Progress bar (accent colour) + %, Owner, Due Date (`dueDate || endDate`), "Open" button.
- **"Time viewed" is fake:** row 1 = "Just now", row 2 = "10m ago", all others "Earlier today" (`:267`). No view time is stored.
- **Empty state:** "No recently viewed projects" + "View All Projects".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search recent | Filters by name/key | local state | No | — |
| Project cell / "Open" button | Link to `/projects/{id}` (that page moves it to the top of the recent list) | `recentProjectIds` (via project page) | Yes | — |
| "View All Projects" (empty) | Link to `/projects` | none | — | — |

**Notes, limits and simulated parts**
- Orphan route; fake relative times.

---

### 5.8 Multi-Project Strategic Roadmap — `/projects/roadmap`

**File:** `src/app/(workspace)/projects/roadmap/page.tsx` (+ `src/components/shared/modal.tsx`)
**Who can open it:** Any signed-in user. **No link in the app points here.** No permission check on "Add Milestone".
**Purpose:** One row per project on a Q1–Q4 strip, with milestone flags.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| projects, milestones, users | `useApp()` | all projects |

**Cards, widgets and lists**

#### Roadmap rows
- **Left side:** accent dot, name (link), key • owner name (or "Unassigned") • progress %, progress bar.
- **Bar position (`getProjectSpan`, `:61-74`):** uses only the **month number** (0–11) of `startDate` and `dueDate || endDate`; the year is ignored.
  - `left = startMonth / 12 × 100 %`
  - `width = max(15 %, min(100 % − left, (max(endMonth − startMonth, 1) + 1) / 12 × 100 %))`
  - A project crossing into the next year (end month smaller than start month) gets the minimum width (15 %) or a wrong width. Bar shows name and end date.
- **Milestone flags:** each milestone of the project at `left = min(95 %, month(dueDate) / 12 × 100 %)`; hover shows its name. Again year is ignored.
- **Header:** fixed "Q1 (Jan–Mar) … Q4 (Oct–Dec)".
- **Empty state:** none — an empty grid if filters match nothing.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Add Milestone" | Opens the "Add Roadmap Milestone" modal | — | — | — |
| Search | Filters by name/key | local state | No | — |
| Status select | All / Active / Planning / On Hold / Completed | local state | No | — |
| Group select | "All Groups" + distinct groups (`group` or "Core Platform" if empty) | local state | No | A project with no group is listed as "Core Platform" in the menu but does not match that filter (`:39` vs `:47`) |
| Scale "Quarters" / "Months" | Only changes which button is highlighted | local state | No | **Does nothing to the chart** — always quarters |
| Project name | Link to `/projects/{id}` | none | — | — |
| Milestone flag | Hover tooltip only; click does nothing | none | — | — |
| Modal: Milestone Title (required) | text | — | — | — |
| Modal: Project | select, default = first project at page load | — | — | — |
| Modal: Target Date | date input; empty = today + 60 days | — | — | — |
| Modal: Description | text | — | — | — |
| Modal: "Create Milestone" | `addMilestone({ name, description, projectId, dueDate, status: 'pending', taskIds: [] })` (`app-context.tsx:1026`) | `milestones`; that project's timeline/health recalculated | Yes | toast "Milestone … created"; modal closes; date field is not cleared |
| Modal: "Cancel" / close | Closes modal | none | — | — |

**Notes, limits and simulated parts**
- `addMilestone` sets `endDate = dueDate`, and milestone end dates count in the project timeline (5.1). **Adding a milestone dated after the project's end extends the project** ("+Nd extended") and can change its health to At Risk/Delayed.
- Orphan route; "Months" scale is a dead toggle; year is ignored.

---

### 5.9 Project Planner & Schedule — `/projects/planner`

**File:** `src/app/(workspace)/projects/planner/page.tsx`
**Who can open it:** Any signed-in user. **No link in the app points here** (the sidebar "Planning" item opens a different page, `/planner/calendar`).
**Purpose:** Month calendar of task due dates, milestones and project end dates.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| tasks, milestones, projects | `useApp()` | |

**Cards, widgets and lists**

#### Calendar events (`:80-142`)
- Task with `dueDate` → "{key}: {title}", blue (`#3b82f6`), green (`#00c2a8`) if done.
- Milestone with `dueDate` → "Milestone: {name}", purple.
- Project → "Project Delivery: {name}" on `dueDate || endDate` (the current end, 5.1), amber.
- Filtered by project and event type.

#### Month grid (`:145-167`, `:421-479`)
- Sunday-first weeks; blank cells before/after the month; today's date circled.
- **Matching rule:** an event shows on a day only if `event.date === "YYYY-MM-DD"` exactly (`:425`).
- **Bug:** seed tasks and seed milestones store full ISO date-times (e.g. `2026-10-17T09:00:00.000Z`, from `d()` in `mock-data.ts:8-11`), so they **never match** and do not appear. Only project delivery dates (stored as YYYY-MM-DD by `calculateProjectTimeline`) and items created with plain dates (this page's quick create, wizard phases) appear.

#### Legend
- Static legend of the four colours.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Add Scheduled Item" | Opens "Schedule Item on Calendar" modal | — | — | — |
| "Today" | Jumps to the current month | local state | No | — |
| ‹ / › | Previous/next month (in week mode ±7 days, in day mode ±1 day) | local state | No | — |
| Project select | Filter events by project | local state | No | — |
| Event type select | All / Tasks / Milestones / Project Deliveries | local state | No | — |
| Month / Week / Day buttons | Only change prev/next step size; **grid is always a month view** | local state | No | — |
| "+" in a day cell | Pre-fills date and opens the modal. It is styled `opacity-0 group-hover:opacity-100` but the cell has no `group` class, so it stays **invisible** (still clickable if found) | — | — | — |
| Task event | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No | — |
| Milestone / project event | Nothing happens | none | — | — |
| Modal: Item Title (required), Type (Task/Milestone), Date (default today), Project (default first project) | form fields | — | — | — |
| Modal: "Schedule Item" (Task) | `addTask({ title, projectId, status: 'todo', priority: 'medium', dueDate, labels: ['Scheduled'], points: 2 })` → key from `nextTaskKey`, estimate 3 days, no assignee | `tasks`; project progress + timeline recalculated | Yes | toast "Task … added to the calendar" |
| Modal: "Schedule Item" (Milestone) | `addMilestone({ name, projectId, dueDate, status: 'pending', taskIds: [] })` | `milestones`; timeline recalculated | Yes | toast |
| Modal: Cancel / close | Closes modal | none | — | — |

**Notes, limits and simulated parts**
- Orphan route; week/day views not built; seed tasks and milestones are invisible (date format mismatch).
- A task added here is not placed in any phase/epic/story (goes to the Backlog if the project allows it), and a milestone after the project end extends the project timeline.

---

### 5.10 My Tasks — `/projects/my-tasks` (and `/my-tasks`)

**File:** `src/app/(workspace)/projects/my-tasks/page.tsx`; `src/app/(workspace)/my-tasks/page.tsx` just re-exports it (same screen).
**Who can open it:** Any signed-in user. Sidebar "My Tasks". Roles whose `defaultPath` is `/my-tasks` land here (`src/lib/permissions.ts:54`, `:60`).
**Purpose:** The current user's assigned tasks as a list or board, with tabs and filters.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| tasks, projects, users, currentUserId | `useApp()` | current user = `users.find(currentUserId)` or `users[0]` |

**Cards, widgets and lists**

#### Header
- Avatar, "My Tasks Workspace", "Demo User: {name}", "{role} • {N} total tasks assigned" (raw role id, e.g. `ceo`).

#### KPI tiles (also act as tabs) (`:40-54`)
- **All Assigned Tasks:** tasks with `assigneeId === current user` (includes subtasks and done).
- **Due Today:** `dueDate === today as "YYYY-MM-DD"` and not done. Seed due dates are full ISO strings, so this is **almost always 0** (only tasks saved with a plain date match).
- **Overdue:** `dueDate < now` and not done.
- **Completed:** status `done`.
- There is also an "upcoming" filter in code (`dueDate > now`, not done) but **no tile or button opens it**.

#### Count text
- "Showing {N} tasks" = tasks after tab + project + priority + search filters.

#### List view (default)
- Row: done checkbox, key, title (struck through when done), project name (+ " · {board name}" when the project has extra boards, via `placementOf`), priority badge, status badge, due date (red with ⚠ when overdue), points "Npt" if set.
- **Empty state:** "No overdue tasks!" (Overdue tab) or "No tasks match criteria".

#### Board view
- 4 columns: To Do, In Progress, In Review, Done, each with a count. Card: key, priority icon, title, project, due date.
- **Blocked tasks are not shown in board view** (no Blocked column).
- Empty column: "No tasks".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| List / Board toggle | Switch view | local state | No | — |
| KPI tiles (All / Due Today / Overdue / Completed) | Set active tab | local state | No | — |
| Search | Filter by title or key | local state | No | — |
| Project select | Filter by project | local state | No | — |
| Priority select | Filter by priority | local state | No | — |
| Done checkbox (list) | `updateTask(id, { status: done ? 'todo' : 'done' })` (`app-context.tsx:942`) | `tasks` status; `taskStatusChanges` (new record); `workSessions` (a running timer on that task is stopped as "finished"); project `progress` + timeline/health recalculated | Yes | No toast. `columnId` is not changed — Unclear how the Kanban board then places the card |
| Task row / board card | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No | — |

**Notes, limits and simulated parts**
- "Due Today" rarely works because of the date-format comparison.
- Unchecking sets status back to `todo` even if the task was in progress or review before.
- Board view has no drag-and-drop.

---

### 5.11 Activity Feed — `/activity`

**File:** `src/app/(workspace)/activity/page.tsx`
**Who can open it:** Any signed-in user. Linked from "Logs" on `/projects/home`; a role's `defaultPath` may be `/activity` (`src/lib/permissions.ts:96`).
**Purpose:** A list of audit-log entries.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| auditLogs | `useApp().auditLogs` (seed `MOCK_AUDIT_LOGS`, `mock-data.ts:1100`) | **Saved: No — lost on refresh** |

**Cards, widgets and lists**

#### Activity cards
- **Shows:** icon by the first part of `action` (`document` → file, `agent` → bot, `task` → checkbox, `settings` → gear, other → activity), actor name, the action code (e.g. `document.sent`), "— detail", relative time, "IP {ipAddress}".
- **How:** all `auditLogs` in array order. Seed logs are in oldest-first order, and new logs from `addActivity` are put at the front, so the order is mixed (not sorted by time).
- Entries created in the app (e.g. "project.created" from the wizard) have no `ipAddress`, so they show **"IP undefined"**.
- **Empty state:** none.

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| (none) | The page has no filters, search, paging or links | — | — | — |

**Notes, limits and simulated parts**
- IP addresses in the seed are fake. No filtering by user, project or date.

---

### 5.12 Task page (stand-alone) — `/tasks/[taskId]`

**File:** `src/app/(workspace)/tasks/[taskId]/page.tsx`
**Who can open it:** Any signed-in user. **No link in the app points here** (tasks normally open in the Task drawer). Unknown id → Next.js `notFound()` (404).
**Purpose:** A full-page view of one task with status buttons and comments.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| task | `useApp().tasks.find(id)` | |
| project, assignee, reporter, current user | `useApp()` | |

**Cards, widgets and lists**

#### Header card
- Status badge, priority badge, title, five status pills (todo / in progress / review / done / blocked), description (if any), acceptance criteria box (if any).

#### Comments card
- "Comments (N)": avatar, author name, relative time, text. Empty: "No comments yet. Be the first to comment."

#### Details card
- Assignee (avatar + name or "Unassigned"), Reporter, Priority, Due Date, Story Points (`storyPoints` or "—"), Tags, Created and Updated (relative times).

#### AI Agent card
- Static text "Run an AI agent on this task…".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Breadcrumb "Projects" / project name / "Tasks" | Links to `/projects`, `/projects/{id}`, `/projects/{id}/tasks` | none | — | — |
| Edit (pencil) button | **No onClick — does nothing** | none | — | — |
| Status pill | `updateTask(id, { status })` | `tasks`; `taskStatusChanges`; `workSessions` (moving to In Progress starts the assignee's (or current user's) timer and pauses their other timer; leaving In Progress stops it; container tasks with subtasks do not start a timer; a subtask moving to In Progress also starts its parent); project progress + timeline/health | Yes | no toast, no notification |
| Comment textarea + "Comment" | Disabled when empty. `updateTask(id, { comments: [...comments, { id, authorId: currentUserId, body, createdAt }] })` | `tasks[].comments` | Yes | no notification or @mention handling |
| "Open AI Hub" | Link to `/ai-agents` | none | — | — |

**Notes, limits and simulated parts**
- Orphan route; dead Edit button; no permission check on status change.

---

### 5.13 Create New Project wizard — `/projects/new`

**File:** `src/app/(workspace)/projects/new/page.tsx` (+ `src/components/projects/new-project-plan-steps.tsx`, `src/components/projects/structure-editor.tsx`, `src/components/shared/duration-fields.tsx`, `src/lib/structure.ts`, `src/lib/durations.ts`)
**Who can open it:** Any signed-in user who knows the URL. The "Create Project" buttons on `/projects` only appear for roles allowed by `canCreateProject` (5.5), but **the page itself has no permission check**.
**Purpose:** A step-by-step form that creates the project and, optionally, its phases, epics, stories and extra boards.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| users | `useApp().users` | owner list, member pills |
| current user | `useCurrentUser()` | default owner and first member (falls back to `u2`) |
| Structure presets | `STRUCTURE_PRESETS` (`src/lib/structure.ts:126-132`) | |
| Phase templates | `PHASE_TEMPLATES` (`new-project-plan-steps.tsx:63-67`) | |
| Accent colours, spaces, delivery templates | constants `ACCENT_COLORS`, `SPACES`, `TEMPLATES` (`new/page.tsx:22-55`) | hard-coded |

**Steps** (`:94-100`). The step list depends on the Structure choice: `Basics → Structure → Team & timeline → [Phases] → [Epics] → [Stories] → Boards → Goals & review`. Phases/Epics/Stories appear only if that level is ticked. Steps marked "(optional)": Phases, Epics, Stories, Boards. Default structure is "Full", so all 8 steps show.

**Cards, widgets and lists**

#### Step indicator
- Numbered pills; done steps show a ✓, the current step is filled. Clicking an earlier step goes back directly; clicking a later step runs validation of each step on the way (`goTo`, `:173-185`) and stops at the first step with an error.

#### Step 1 — Basics
- **Project Name\*** — must be ≥ 3 characters.
- **Project Key\*** — upper-cased, max 6 characters (input `maxLength`), must be ≥ 2 characters. No check that the key is unique among existing projects.
  - Auto-fill (`:367-370`): while typing the name, if the key is empty it is set to the first 4 letters of the name. **Bug:** the check uses the key value from before the keystroke, so after the first letter is typed the key is no longer empty and stops updating. Typing "Mobile" leaves the key as "M", and validation then fails ("Project key must be 2–6 characters") until the user fixes the key by hand. (Pasting the full name at once fills 4 letters correctly.)
- **Project Description** — optional.
- **Accent Branding Color** — 6 colour circles (Mint Flash `#00c2a8` default, Electric Blue, Royal Violet, Sunset Coral, Emerald Forest, Amber Flame).
- **Workspace Space / Group** — Core Platform (default), Client Engagements, AI & Automation, Product Studio, Compliance & IT, Growth & UX.
- **Delivery Framework Template** — Agile Scrum Delivery (default), Continuous Kanban, Document & E-Sign Pipeline, AI Coding Agent Sandbox. **Only stored as a tag** (`tags: [template, visibility]`, `:218`); it does not change boards, columns, sprints or anything else.

#### Step 2 — Structure (`StructureEditor`)
- **Preset tiles:** Full (Phase → Epic → Story → Task), Agile (Epic → Story → Task), Phased (Phase → Epic → Task), Simple phases (Phase → Task), Tasks only. Clicking a tile sets only phases/epics/stories and keeps the three rules. The highlighted tile is worked out from the ticks (`presetOf`); "Custom" is highlighted when the ticks match no preset (the Custom tile itself is not clickable).
- **Levels checkboxes:** Phases, Epics, Stories. Line "This project: Phase → Epic → Story → Task → Subtask" (`StructureChain`).
- **Rules checkboxes:** Subtasks (tasks can be split one level), Backlog (tasks may wait unplaced), Moving between parents. All three are on in every preset.
- Saved into `project.structure`; it decides which plan steps follow and where tasks must be placed later.

#### Step 3 — Team & timeline
- **Project Owner** — any user (`{name} ({title or role})`). The owner is not forced to be a member.
- **Priority** — Critical / High (default) / Medium / Low.
- **Original Project Timeline** (`DateRangeField`): Start date (default today), Length (whole number) + Unit (Days/Weeks/Months; default 3 Months), Target end date (default start + 3 months). Typing the length moves the end date (`addDuration`; months are calendar months, weeks = 7 days); changing the end works out the length, showing leftover days as "+N days"; changing the unit keeps the number; changing the start keeps the length. Badge "Baseline: 3 months" (`formatDuration`).
  - Validation: length must be ≥ 1 day; end not before start.
- **Assigned Team Members** — pill per user; click to add/remove; the last member cannot be removed (at least 1). Counter "(N selected)".

#### Step 4 — Phases (only if Phases ticked) (`PhasesStep`)
- **Template tiles ("distribute dates"):** Waterfall (Requirements, Design, Development, Testing, Release), Release stages (MVP, Beta, General availability), No phases (clears the list). Clicking a tile **replaces** the list and spreads the project dates evenly (`spreadPhases`, `new-project-plan-steps.tsx:73-81`):
  - `total = max(number of phases, project days)`, `step = total / number of phases`;
  - phase i starts at `projectStart + round(i × step)` and ends at `projectStart + round((i+1) × step)`; the last phase ends exactly on the project end;
  - neighbouring phases share the boundary date; each phase's unit is chosen by `naturalUnit` (≥ 60 days or whole months → months; ≥ 14 days and multiple of 7 → weeks; else days).
- **Phase rows:** number, name (red border when empty), compact date range (start / length+unit / end, limited to the project's dates), delete button.
- **"+ Add phase":** new empty-named phase starting at the previous phase's end (or project start), 14 days long but not past the project end; unit weeks (days if the project is in days).
- Validation: every phase needs a name and end ≥ start; every phase must sit inside the project dates.

#### Step 5 — Epics (only if Epics ticked) (`EpicsStep`)
- If phases are used and none exist: "Add a phase first (previous step)…" and the add row is hidden.
- **Add row:** "New epic name" + phase select (when phases exist; "No phase" option only when phases are not required) + "Add epic" (disabled while empty; Enter also adds). Colour assigned in turn from `EPIC_COLORS`.
- **Epic rows:** editable name, phase select, delete, and a **Time** select: "all of {phase or the project}" or "its own dates inside {…}" (then a date range limited to that window appears).
- Validation: when phases are used every epic must be in an existing phase; own dates must fit inside the phase (or project).

#### Step 6 — Stories (only if Stories ticked) (`StoriesStep`)
- Parent = an epic (if epics used), else a phase (if phases used), else none.
- If a parent level is used but empty: "Add an epic/a phase first…".
- **Add row:** story text ("As a …, I can … so that …") + parent select + "Add story" (Enter also adds).
- **Story rows:** editable title, parent select, delete, Time select (all of parent / own dates). An epic's window is its own dates if set, else its phase/project.
- Validation: every story must have an existing parent (when a parent level is used); own dates must fit the parent's time.

#### Step 7 — Boards (`BoardsStep`)
- **Main board name** (default "Main board").
- **Extra boards list:** name, "Mirrors the main board", delete. Add with text + "Add board" (Enter works; duplicates ignored), or one-click "+ Testing board" (hidden once added).

#### Step 8 — Goals & review
- **Goals list:** two default goals ("Ship MVP within planned sprint cadence", "Achieve zero high-priority blocker defects"); ✕ removes; "Add key milestone or goal..." + "Add Goal" (empty ignored). Goals are shown later on the project Overview.
- **Review:** Project name (key), Timeline "start → end (length)", Structure chain, Phases (names joined by →) / Epics / Stories count — or "None yet (add them on the Plan tab)" —, Boards, Team "N members".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to All Projects" | Link to `/projects` (form data lost) | none | — | — |
| Step pills | Back: jump; forward: validate then jump | local state | No | errors shown on the failing step |
| "Cancel" (step 1) | Link to `/projects` | none | — | — |
| "Back" (steps 2+) | Previous step, no validation | local state | No | — |
| "Next: {step}" / "Skip: {step}" | Validates the current step, then moves on. Label is "Skip" on Phases/Epics/Stories when the list is empty. Pressing Enter in a normal field also submits = Next | local state | No | — |
| All form fields above (name, key, description, colour, space, template, preset tiles, level and rule checkboxes, owner, priority, date range, members, phase/epic/story/board rows, goals) | Update form state only | local state | No | — |
| "Create Project ✓" (last step) | Re-validates every step; then creates everything (see below) | see below | Yes (except activity log) | toast; navigates to `/projects/{newId}` |

**What "Create Project" creates** (`handleSubmit`, `:187-298`)
1. `addProject(newProject)` (`app-context.tsx:686-737`) with: id `p-{timestamp base36}`, name, key (upper case), description, `status: 'active'` (no control on the form), `health: 'on_track'`, owner, `teamIds: ['t1']` (hard-coded), members, start/end/due dates, `progress: 0`, priority, `tags: [template, 'workspace']` (visibility is always "workspace"; no control), accent colour, group, goals, not favourite, not archived, baseline `original*` = chosen dates and `originalDuration` = days, `durationUnit`, `structure`, `mainBoardName`, `extraBoards` (`board-{projectId}-{i}`, no own columns, so they mirror the main board's columns). `addProject` runs `calculateProjectTimeline` (health On Track, "On schedule") and puts the id first in `recentProjectIds`.
2. **Phases** (only if Phases are used): `addMilestone` for each, id `ms-{projectId}-{i}`, name, start/end/due dates, unit, `status: 'upcoming'`. Each call recalculates the project timeline (phases are inside the project, so no extension).
3. **Epics** (only if Epics are used): `addEpic` for each, id `epic-{projectId}-{i}`, phase link, colour, own dates/unit if set.
4. **Stories** (only if Stories are used): `addStory`, id `story-{projectId}-{i}`, linked to its epic, or to its phase when the project has phases but no epics; own dates if set.
5. `addActivity` with action `project.created` and detail "Created project {name} ({key}) with N phases and M epics" → `auditLogs` and `activities` (**not saved — lost on refresh**).
6. Toast "Project "{name}" created with N phases" and redirect to the new project's page.
- **Not created:** no tasks, no sprints, no Kanban columns (the default five columns are used because `boardColumns` is empty), no notifications.

**Notes, limits and simulated parts**
- Key auto-fill bug (only first letter), no unique-key check, no role check on the page.
- Template and visibility only become tags; status is always Active; team is always `t1` (the Teams feature is switched off by `FEATURES.teams = false`).
- If the user adds phases and then goes back and turns Phases off, the toast still counts the draft phases (`:296` uses `phases.length`, not the used phases), though none are created.
- Changing the Structure after visiting later steps changes the step list while the current step number stays the same, so the user may land on a different step. Unclear if this was intended.

---

### 5.Z Data flow summary for this area

- **Reads:** `projects`, `tasks`, `milestones`, `users`, `documents`, `approvals`, `agentRuns`, `auditLogs`, `recentProjectIds`, `workSessions`, `agentEvents`, `agentTokens`, `sprints` (Quick Create), `demoRole`, `currentUserId`; hard-coded `SPRINT_VELOCITY`, `TASK_DIST`, wizard constants, demo date 2026-10-20 on `/projects/home`. (`src/data/mock-analytics.ts` and `src/components/analytics/**` are **not** used by these screens; they belong to `/teams`.)
- **Writes:** `projects` (create, favourite, progress/timeline recalculation), `tasks` (status, comments, quick/planner create), `taskStatusChanges` and `workSessions` (through `updateTask` status moves), `milestones`, `epics`, `stories`, `sprints`, `recentProjectIds` (all saved); `auditLogs`/`activities` (not saved); `activeTaskDrawerId` (UI only, not saved).
- **Store actions used:** `addProject`, `toggleFavoriteProject`, `addRecentProject` (via project page), `addMilestone`, `addEpic`, `addStory`, `addActivity`, `addTask`, `updateTask`, `addSprint` (Quick Create), `openTaskDrawer`. `archiveProject` and `deleteProject` are not called from these screens (only from the project page and settings), and archived projects are not hidden here.
- **Calculations:** `progressOfTasks` (`src/lib/subtasks.ts:47`), `calculateProjectTimeline` + `healthFromTimeline` (`src/lib/timeline-calculator.ts:134-264`), `forecastEnd` (`src/lib/schedule.ts:108`), `spreadPhases` (`new-project-plan-steps.tsx:73`), `addDuration`/`splitSpan`/`naturalUnit`/`formatDuration` (`src/lib/durations.ts`). `src/lib/project-health.ts` (`projectHealth`, `sprintBurndown`) is used by the project Reports pages, not by these screens.

---

## 6. Inside a project: header, overview, plan, schedule, sprints, team, activity and settings

When you open a project at `/projects/<projectId>`, every project page shows the same **project header** (name, star, badges, "+ New" menu and a row of tabs). This section explains the header, the **Overview**, **Plan**, **Schedule** (Gantt), **Sprints**, **Sprint planning**, **Team**, **Activity** and **Settings** tabs, and the old **Milestones** route. The **Tasks**, **Board**, **Files** and **Reports** tabs and the task drawer also live under this route, but other sections cover them. All data comes from `AppContext` (`src/context/app-context.tsx`) in the browser. There is no server.

**About roles (applies to the whole section).** On load, `demoRole` is first set to `FIXED_DEMO_ROLE` (`ceo`) (`src/context/app-context.tsx:512`). After sign-in, an effect copies the signed-in account's role into `demoRole` and its id into `currentUserId` (`src/context/app-context.tsx:622-672`; `executive`→`ceo`, `qa`→`qa_tester`, any other value is used unchanged, e.g. `org_admin`). Controls marked "needs `canCreateProject`" are shown only for the roles `ceo`, `project_manager`, `product_owner`, `engineering_lead`, `org_admin` and `platform_admin` (`src/lib/permissions.ts:105-107`). Roles such as `developer`, `qa_tester` and `designer` do not see them.

**Shared guard.** None of these pages has its own route guard. The workspace layout (`src/app/(workspace)/layout.tsx`) sends signed-out users to `/login` and users without a finished org setup to onboarding. Each page calls `notFound()` if the project id is not in `projects`.

---

### 6.1 Project header and tab bar (shown on every project page)

**File:** `src/components/projects/project-header-nav.tsx` (+ `src/components/projects/new-menu.tsx`, `src/components/shared/badges.tsx`)
**Who can open it:** Any signed-in user. It appears at the top of every project page.
**Purpose:** Shows which project you are in and lets you move between its tabs or create something new.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project | `useApp().projects` (seed `MOCK_PROJECTS`, `src/data/mock-data.ts:222`) | Falls back to `p1` for the special id `p-mvhmnblw`, and then to `projects[0]` if the id is not found (`project-header-nav.tsx:42`) |
| Tasks, sprints, milestones | `useApp().tasks / sprints / milestones` | Used only for the tab counts |
| Toggle favourite | `useApp().toggleFavoriteProject` | |

**Cards, widgets and lists**

#### Title block
- **Shows:** a back arrow, a square with the project **key** (e.g. `FSV2`), the project **name**, a star, a **status badge** (`project.status`) and a **health badge** (`project.health`).
- **Data source:** `project.key`, `project.name`, `project.isFavorite`, `project.status`, `project.health`.
- **How it is calculated:** health is not typed in by hand unless Settings set it to manual. It is worked out by `calculateProjectTimeline()` → `healthFromTimeline()` (`src/lib/timeline-calculator.ts:134-139, 246-250`):
  - if the timeline is *extended* and the delay is more than 25% of the baseline length → **Delayed**;
  - if the delay is more than 10%, **or** the share of baseline time used is more than 25 percentage points ahead of the share of work done (`paceGapOf`, line 142) → **At Risk**;
  - otherwise **On Track**. A project with status `completed` is always On Track.
  - If `healthMode === 'manual'` (set in Settings), the saved health is kept.

#### Tab row
- **Shows:** Overview, Plan (count), Tasks (count), Board, Schedule, Sprints (count), Team (count), Files, Activity, Reports, Settings. The active tab is highlighted.
- **How the counts are calculated** (`project-header-nav.tsx:51-90`):
  - Plan = number of milestones (phases) in the project.
  - Tasks = main tasks only (`!t.parentId`). Subtasks are not counted.
  - Sprints = sprints in the project.
  - Team = `project.memberIds.length`.
- Note: the **Schedule** tab's id and route are still `timeline` (`/projects/<id>/timeline`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Back arrow (←) | Goes to `/projects` | none | – | – |
| Star button | Turns the project's favourite flag on or off | `toggleFavoriteProject` → `projects[].isFavorite` (`app-context.tsx:815`) | Yes | none (no toast) |
| Tab links (11) | Go to the tab's route | none | – | – |
| "+ New" button | Opens or closes the New menu (see 6.2) | none | – | Closes on outside click or Escape |

**Notes, limits and simulated parts**
- Hard-coded fallback: the id `p-mvhmnblw` (a duplicate seed copy of "Flash Sign v2.0", `mock-data.ts:236`) borrows the tasks, sprints and milestones of `p1` when it has no tasks of its own. If an unknown id is used, the header shows the **first project** in the list instead of nothing.
- Status badge and health badge are display only.

---

### 6.2 "+ New" menu and the dialogs it opens

**File:** `src/components/projects/new-menu.tsx` (+ `src/components/plan/plan-modals.tsx`, `src/components/tasks/create-task-modal.tsx`)
**Who can open it:** Any signed-in user. The Phase, Epic and Story items need `canCreateProject(demoRole)` (`new-menu.tsx:62`).
**Purpose:** One menu to create every kind of item in this project. The menu follows the project's structure.

**How the menu list is built** (`new-menu.tsx:73-80`):
1. The plan levels the project uses (`levelsOf(projectStructure(project))`), for example Phase, Epic, Story. These appear **only if** the user has `canCreateProject`.
2. **Task** (always shown).
3. **Subtask**, only if the structure has `subtasks: true`.
4. A divider, then **Sprint**, **Upload file** and **Add member** (always shown).
- Next to each level there is a small grey hint, for example "in a phase" or "in an epic". It comes from `parentLevel()` (`src/lib/structure.ts:46-50`): the nearest level above it that the project uses.
- If the user cannot plan and the project has levels, the menu shows: "Phases, epics and stories are added by project leads."
- A project without a saved `structure` uses the **Full** preset (Phase → Epic → Story → Task, subtasks, backlog and moving allowed) (`structure.ts:36-38`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Phase | Opens **PhaseModal** (6.4.1) | `addMilestone` | Yes | toast |
| Epic | Opens **EpicModal** (6.4.2) | `addEpic` | Yes | toast |
| Story | Opens **StoryModal** (6.4.3) | `addStory` | Yes | toast |
| Task | Goes to `/projects/<id>/tasks/new` (the full-page task form; see the Tasks section) | – | – | – |
| Subtask | Opens the "New subtask" dialog: a dropdown of the project's main tasks ("KEY · title") | none yet | – | If the project has no tasks: "This project has no tasks yet. Create a task first." |
| "New subtask" → Cancel | Closes the dialog | none | – | – |
| "New subtask" → Next (disabled until a task is chosen) | Closes the dialog and opens `CreateTaskModal` with `defaultParentId` = chosen task (the task-creation modal is covered in the Tasks section) | `addTask` (in that modal) | Yes | (see Tasks section) |
| Sprint | Goes to `/projects/<id>/sprints?create=sprint`. The Sprints page sees `?create=sprint` and opens its "Create New Sprint" dialog (6.6) | – | – | – |
| Upload file | Goes to `/projects/<id>/files?create=upload`. The Files page opens its upload dialog (see Files section) | – | – | – |
| Add member | Goes to `/projects/<id>/team?create=member`. The Team page opens its "Add Member" dialog (6.8) | – | – | – |

**Notes, limits and simulated parts**
- The menu opened from the header does **not** pass a parent to the Epic or Story dialog. The user must choose the parent phase or epic inside the dialog. The dialog will not save without it if that level is in use.
- The "Task" item is shown to every role, even though `canCreateTask` exists in `permissions.ts:109`. The menu does not check it.

---

### 6.3 Overview — `/projects/[projectId]`

**File:** `src/app/(workspace)/projects/[projectId]/page.tsx` (+ `src/components/projects/project-timeline-summary.tsx`, `src/components/shared/ui.tsx` `StatCard`)
**Who can open it:** Any signed-in user. No permission checks on any button.
**Purpose:** A one-page summary of the project: counts, timeline against the baseline, progress, goals, urgent tasks, phases, team, admin actions and recent activity.

Note: `src/components/reports/project-overview.tsx` is **not** shown here. It belongs to the Reports tab (`reports/page.tsx:163`).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project | `useApp().projects` | Special case: id `p-mvhmnblw` uses `p1` (`page.tsx:56-59`) |
| Tasks | `useApp().tasks` filtered by `projectId` | Includes subtasks; main tasks are `!parentId` |
| Sprints | `useApp().sprints` | Read but not displayed |
| Milestones (phases) | `useApp().milestones` filtered by project | |
| Activities | `useApp().activities` (seed `MOCK_AUDIT_LOGS`, `mock-data.ts:1100`) | **Not saved** to localStorage |
| Users | `useApp().users` | For owner, members, avatars |
| Recent projects | `addRecentProject(projectId)` runs on page load (`page.tsx:50-54`) | Writes `recentProjectIds` (kept to 10) |

**Cards, widgets and lists**

#### KPI tile "Total Tasks"
- **Shows:** number of main tasks. Under it, "+ N subtasks" if there are subtasks.
- **How it is calculated:** `mainTasks = projectTasks.filter(!parentId)`; `subtaskCount = projectTasks.length − mainTasks.length` (`page.tsx:70-71`).

#### KPI tile "In Progress"
- **Shows:** main tasks with `status === 'in_progress'` (`page.tsx:74`).

#### KPI tile "Completed"
- **Shows:** main tasks with `status === 'done'`, and a line "X% of work".
- **How it is calculated:** X = `progressOfTasks(projectTasks)` (`src/lib/subtasks.ts:47-53`). It takes "leaf" items (tasks without subtasks, plus all subtasks). Each one is weighted by `estimatedDuration` in days (at least 1). X = done weight ÷ total weight × 100, rounded.

#### KPI tile "Overdue / Blocked"
- **Shows:** overdue main tasks + blocked main tasks.
- **How it is calculated:** overdue = `dueDate < now` and status is not `done`; blocked = `status === 'blocked'` (`page.tsx:75-78`). A task that is both overdue **and** blocked is counted **twice**.

#### Project Timeline Summary card (`ProjectTimelineSummary`)
- **Shows:** a status pill, a bar chart of baseline against revised end, a 4-row comparison table and an advice box.
- **Data source:** fields that `calculateProjectTimeline()` wrote onto the project: `originalStartDate`, `originalEndDate`, `originalDuration`, `currentStartDate`, `currentEndDate`, `currentDuration`, `timelineDifference`, `timelineStatus`, `totalWorkDays`, `durationUnit`.
- **How it is calculated** (`src/lib/timeline-calculator.ts:153-264`):
  - Baseline = `originalStartDate`/`originalEndDate`. If these are missing, it uses start/end, or start + 90 days.
  - For each main task, `calculateTaskEffectiveSchedule()` (line 60) finds its end date. If the task has subtasks, it uses the latest subtask end (subtasks without dates are placed one after another). If not, it uses its own `dueDate`, or start + estimate (default 3 days). The work days are added up: subtask estimates if there are subtasks, otherwise the task estimate. This is `totalWorkDays`.
  - Every task's `forecastEnd()` (`src/lib/schedule.ts:202-217`) can push the end out:
    - a finished task (In Review/Done) ends on the date it got there;
    - a started task ends on the latest of: its planned end, its start + estimate, and today;
    - a task that has not started although its start date has passed ends on the later of its planned end and today + estimate.
  - Phases with an end date can also push the end out.
  - If that latest date is after the baseline end, the status is **extended**, `currentEnd` = latest date, and difference = days late. If it is earlier and the project has tasks, the status is **shortened** (negative difference). Otherwise it is **on_schedule**. Status `completed` → **completed**.
  - `currentStart` is always equal to `originalStart`, so the "Start Date" row always says "Unchanged".
- **Status pill:** "Extended (+N calendar days)", "Ahead of Schedule (N days saved)", "On Original Schedule" or "Completed".
- **Timeline bar:** the green fill goes up to *today* as a % of the span from start to the later of the two ends. The amber striped zone and the "Revised" marker appear only when the status is extended.
- **Legend text:** "Total Work: {totalWorkDays} days vs Calendar: {currentDuration} days". If `project.totalWorkDays` is 0, a fallback sums `estimatedDuration || points || 3` over the main tasks (`project-timeline-summary.tsx:46-48`). If the durations are missing they fall back to **90** days (lines 40-41).
- **Table rows:** Start Date; Target End Date (amber when late); Calendar Duration, written in the project's unit with `formatDuration()` (`src/lib/durations.ts:73-79`, e.g. "3 months 10 days"); Total Estimated Work ("N person-days … across X main tasks & Y subtasks").
- **Advice box:** an amber "Project Schedule Extension Notice" if the difference is > 0, or a green "Early Delivery Forecast" if it is < 0.

#### Overall Progress card
- **Shows:** "{done} of {main} tasks completed", a big **{project.progress}%**, a progress bar, Start Date, Target Delivery and Owner.
- **Data source:** `project.progress`, `project.startDate`, `project.dueDate || endDate`, owner from `users`.
- **How it is calculated:** `project.progress` is stored. It is recalculated with `progressOfTasks` only when a task is added, changed or deleted (`updateTask`, `app-context.tsx:958-967`) or when boards are re-laid out. It is **not** recalculated on page load. So seed projects show their seed value (e.g. `p1` = 68%) until a task changes. This number can differ from the "X% of work" on the Completed tile.
- "Target Delivery" shows `dueDate`. `calculateProjectTimeline` overwrites it with the **current (forecast) end**, not the baseline (`timeline-calculator.ts:251-253`).

#### Key Objectives & Goals card
- **Shows:** a numbered list of `project.goals`. The card is hidden when there are no goals.

#### Priority Action Items card
- **Shows:** up to 5 open items: key, title, priority badge, status badge, assignee avatar.
- **How it is calculated:** all project tasks **including subtasks** that are not `done`, sorted by priority (critical → high → medium → low), first 5 (`page.tsx:80-86`).
- **Empty state:** "No open tasks right now."

#### Project Milestones card
- **Shows:** one tile per phase: name, raw status text, description, "Due {dueDate}", a percent and a bar.
- **How it is calculated:** % = done ÷ linked tasks, using `m.taskIds` (`page.tsx:290-296`). If there are no linked tasks: 100% when the status is `achieved`, otherwise 0%.
- **Empty state:** "No milestones created yet."

#### Team Members card
- **Shows:** the first 5 members: avatar, name, "Project Owner" or the raw role id (e.g. `project_manager`), and "N tasks" (tasks assigned, subtasks included).

#### Project Actions card
- Buttons are listed in the table below.

#### Recent Activity card
- **Shows:** up to 6 activity entries: avatar, "{actor} {action} {resource}", date.
- **How it is calculated:** `activities` where `resourceId` equals the project id, or `resource` contains the project key (case-sensitive) (`page.tsx:63-65`).
- **Empty state:** "No recent activity."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Priority Action Item row (click) | Opens the task drawer | `openTaskDrawer` → `activeTaskDrawerId` | No (UI only) | – |
| "View all tasks →" | Goes to `/projects/<id>/tasks` | – | – | – |
| "Manage milestones →" | Goes to `/projects/<id>/plan` | – | – | – |
| "Manage (N)" | Goes to `/projects/<id>/team` | – | – | – |
| "All activity" | Goes to `/projects/<id>/activity` | – | – | – |
| Duplicate | Creates a new project named "{name} (Copy)" with key "{KEY}C", status active, health on_track, progress 0, start today, the same end, owner, members, tags, category and group (`page.tsx:88-105`) | `addProject` → new project `p-<timestamp>` added to the top of `projects` and `recentProjectIds`; its timeline is calculated | Yes | **No toast and no navigation**: you stay on the original project. Phases, epics, stories, tasks, sprints, structure, goals and boards are **not** copied. The key is not checked for uniqueness. |
| Archive / Unarchive | Turns `isArchived` on or off | `archiveProject` (`app-context.tsx:811`) | Yes | No toast. Only the button label changes (see notes). |
| Project Settings | Goes to `/projects/<id>/settings` | – | – | – |
| Delete Project | Shows an inline red box: "Are you sure…?" | none yet | – | – |
| "Yes, Delete" | Deletes and goes to `/projects` | `deleteProject` (`app-context.tsx:803-810`): removes the project, its tasks, sprints and milestones, and its id from `recentProjectIds` | Yes | No toast |
| Cancel (delete box) | Hides the box | – | – | – |

**Notes, limits and simulated parts**
- **Archive has no visible effect.** `isArchived` is read only by these two buttons. No list, sidebar or page hides archived projects or makes them read-only.
- **Delete leaves orphans.** Epics, stories, files, work sessions, status changes and calendar items for the project are not removed (`app-context.tsx:803-810`).
- **The milestone % is 0 for most phases.** The card uses `m.taskIds`. Seed phases have no `taskIds`, and the Plan tab links tasks through `task.milestoneId` instead. Seed phases with status `completed` (e.g. `m6`, `m8`) also show **0%**, because only `achieved` gives 100%.
- **Recent Activity is almost always empty.** Seed audit logs have `resource` values such as "Document" or "Task" with task, document or user ids, so none of them match a project. Task logs written by the drawer also use `resource: 'Task'` and the task id. In practice only the "project.created" log written by the New Project wizard matches, and `activities` is **not saved**, so it disappears after a refresh.
- Overdue tasks that are also blocked are counted twice in the red tile.

---

### 6.4 Plan — `/projects/[projectId]/plan`

**File:** `src/app/(workspace)/projects/[projectId]/plan/page.tsx` (+ `src/components/plan/plan-modals.tsx`, `src/lib/plan.ts`, `src/lib/structure.ts`, `src/lib/schedule.ts`, `src/lib/durations.ts`, `src/components/shared/duration-fields.tsx`, `src/components/shared/confirm-delete-modal.tsx`)
**Who can open it:** Any signed-in user. All add, edit, delete, "Mark achieved" and "Link existing task" controls need `canCreateProject(demoRole)` (`plan/page.tsx:57, 157, 178-179, 381, 401`). Without it the page is read-only.
**Purpose:** Shows the project as a tree (Phase → Epic → Story → Task, using only the levels the project uses), with dates, late warnings and progress for each level.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project + structure | `projects`, `projectStructure(project)` | No `structure` → Full preset |
| Phases | `milestones` for the project, sorted by `endDate || dueDate` ascending (`plan/page.tsx:60-62`) | Phases are stored as milestones |
| Epics | `useApp().epics` (seed `MOCK_EPICS`) | |
| Stories | `useApp().stories` | |
| Tasks | `useApp().tasks` for the project | |
| Status changes | `taskStatusChanges` | Used for the late forecast |
| Clock | `useNow()` (`src/lib/use-now.ts`, ticks every 30 s; `null` during first render) | |

**Cards, widgets and lists**

#### Page heading
- **Shows:** "Plan". Below it, the structure chain as chips (e.g. `phase → epic → story → task → subtask`; "subtask" appears only if subtasks are on).
- **Project time line:** "Project time: {baseline start} → {baseline end} · {length in project unit}." It uses `projectWindow(project)`, which is the **baseline** (`schedule.ts:124-130`).
- If `timelineStatus === 'extended'` it adds: "Work running late moves the end to {currentEndDate} (+N days)."

#### Phase section (one per phase, when phases are the top level)
- **Shows:** a collapse arrow, flag, name, and a status chip:
  - **Achieved** if status is `achieved` or `completed`;
  - **At risk** if `at_risk`;
  - **Upcoming** for anything else, including `missed` and `pending`.
- **Time line:** "{start} → {end} · {length}" (`phaseSpan`, `schedule.ts:133-139`; start defaults to the project start).
- **Late warning:** "Now ends {date} (+N days)" when `forecastOf()` (`schedule.ts:220-225`) finds tasks (or their subtasks) forecast to end after the phase end.
- **Outside warning:** a red "Starts N days before / Ends N days after the project…" (`outsideWindow`, `schedule.ts:180-186`).
- **Counts:** "N epics · N stories · N tasks".
- **Progress bar and %:** `progressOfTasks(withSubtasks(scope))`. `scope` = main tasks whose `milestoneId` is this phase. Leaf tasks and subtasks are weighted by estimated days (`plan/page.tsx:68`; `src/lib/plan.ts:115-118`).
- **Body:** the phase's epics (if epics are on), or its stories (if stories are on but epics are off), or its tasks (if the phase is the lowest level). It also shows a "Needs a {level}" group for tasks placed too high.
- **Empty state:** "Nothing here yet. Add a/an {child}."

#### Epic block
- **Shows:** a coloured left border (`epic.color`), name, description, time line and warnings (`epicSpan`/`epicWindow`). If the epic has no own dates it shows "(all of {parent})".
- **Counts and progress:** "N stories · N tasks", progress bar and %.
- **Body:** stories, or tasks if the epic is the lowest level, or the "Needs a story" group.
- **Empty state:** "No tasks yet." or "No stories yet."

#### Story block
- **Shows:** title, "✓ {acceptance criteria}", time line, priority icon, "N tasks · X%", and a task list.
- **Empty state:** "No tasks yet."

#### Task row (inside any level)
- **Shows:** key, title, "done/total subtasks", an amber placement issue (e.g. "Needs a story", from `taskPlacementIssue`, `structure.ts:59-63`), a red "outside parent" warning (`taskWindow`), the estimate in the task's unit (`formatDays`, `durations.ts:98-102`; default 3 days), a status badge and the assignee avatar.

#### "Tasks" list (Tasks-only structure)
- **Shows:** all main tasks.
- **Empty state:** "No tasks yet."

#### Top-level empty state
- "No {phases/epics/stories} yet. Start with "New {level}"."

#### "Needs a place in the plan" section
- **Shows:** epics without a valid phase (when phases are on), and stories without a valid epic, or without a phase when epics are off (`plan/page.tsx:87-90`).
- **Text:** "Epics need a phase. Stories need an epic. Edit each one to choose it."

#### Backlog section
- **Shows:** main tasks with no phase, epic or story (`inBacklog`, `structure.ts:66`).
- **Title:** "Backlog (N)" if the structure allows a backlog, otherwise an amber "Needs a {lowest level} (N)".
- Shown only if the project has at least one level.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Change structure" link (needs permission) | Goes to `/projects/<id>/settings#structure` | – | – | – |
| "New phase" / "New epic" / "New story" / "New task" (only the top level; needs permission) | Opens PhaseModal, EpicModal, StoryModal, or `CreateTaskModal` with no links (Tasks-only projects) | see 6.4.1–6.4.3 / Tasks section | Yes | toast |
| Collapse arrow / title (phase, epic, story) | Shows or hides the body | local state `collapsed` | No (resets on reload) | – |
| "+ Epic / + Story / + Task" on a card (needs permission) | Opens the dialog for the level directly below, with this card as the parent (`addChild`, `plan/page.tsx:195-203`). For Task: `CreateTaskModal` with `defaultMilestoneId/EpicId/StoryId` | `addEpic` / `addStory` / `addTask` | Yes | toast |
| ✓ "Mark achieved" / ↺ "Reopen phase" (needs permission) | Sets phase status to `achieved` with progress 100, or back to `upcoming` (progress is left at its old value) | `updateMilestone` (`app-context.tsx:1049-1058`) → milestone saved and the project timeline recalculated | Yes | toast "Phase … marked as achieved" / "reopened" |
| ✎ Edit phase / epic / story (needs permission) | Opens the dialog filled with current values | `updateMilestone` / `updateEpic` / `updateStory` | Yes | toast |
| 🗑 Delete phase (needs permission) | Confirm dialog ("Its epics and tasks stay, without a phase") → `deleteMilestone` (`app-context.tsx:1059-1072`): removes the milestone; tasks lose `milestoneId`; epics and stories in it lose `phaseId`; timeline recalculated | milestones, tasks, epics, stories, projects | Yes | toast "Phase deleted". The orphaned epics appear under "Needs a place". |
| 🗑 Delete epic | Confirm → `deleteEpic` (`app-context.tsx:1095-1100`): removes the epic; its stories and tasks lose `epicId`; tasks with a story are re-linked (`relinkTasks` → `resolvePlan`) | epics, stories, tasks | Yes | toast "Epic deleted" |
| 🗑 Delete story | Confirm → `deleteStory` (`app-context.tsx:1124-1128`): removes the story; tasks lose `storyId` and keep their epic and phase | stories, tasks | Yes | toast "Story deleted" |
| Confirm dialog Cancel / Delete | Closes, or runs the delete | as above | – | – |
| "+ Link existing task…" dropdown (lowest level only; needs permission) | Lists main tasks not already here. If moving is off (`allowMove: false`), only Backlog tasks are listed (`plan/page.tsx:156`). Picking one calls `setTaskPlan(task.id, {storyId/epicId/milestoneId})` | `setTaskPlan` (`app-context.tsx:1167-1175`): `resolvePlan()` fills the levels above (story → its epic → its phase) and updates the task | Yes | toast "{KEY} moved here". The project timeline is **not** recalculated (setTaskPlan does not call `calculateProjectTimeline`). |
| Task row (click) | Opens the task drawer | `openTaskDrawer` | No | – |

**Notes, limits and simulated parts**
- Plan actions write no activity log and no notification.
- Progress is only for the tasks linked at that level. A phase's scope includes tasks in its epics and stories, because `resolvePlan` stores every level on the task.
- "Reopen phase" keeps `progress: 100` from the earlier "achieved" step.
- If the user lacks `canCreateProject`, the whole page is read-only. Nothing says why, except the hidden buttons.

#### 6.4.1 PhaseModal (New / Edit phase)
**File:** `src/components/plan/plan-modals.tsx:71-118`

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Phase name * (text) | Required; trimmed | – | – | – |
| Description (textarea) | Optional | – | – | – |
| Start date / Length + unit / End date (checkpoint) (`DateRangeField`) | Pre-filled with the project baseline window. Typing a length (whole number) with a unit (Days/Weeks/Months) moves the end date (`addDuration`). Changing the unit keeps the number. Changing the start keeps the length. The date pickers are limited (min/max) to the project window. Hint: "Inside the project: {start} → {end} ({length})", or a red error | – | – | – |
| Cancel / × | Closes | – | – | – |
| Create phase / Save phase (disabled until name + both dates + no error) | New: `addMilestone({name, description, startDate, endDate, dueDate=end, durationUnit, projectId, status:'upcoming'})`. Edit: `updateMilestone(id, same fields)` | `milestones`; project timeline recalculated (`app-context.tsx:1026-1058`) | Yes | toast "Phase … created/saved" |

- **Validation** (`rangeError`, `duration-fields.tsx:182-185`): the end must not be before the start, and the range must be inside the project baseline window.
- **Bug:** `addMilestone` does not copy `durationUnit` into the new milestone (`app-context.tsx:1027-1040`). A new phase therefore loses the chosen unit and its length is shown in the "natural" unit (`naturalUnit`, `durations.ts:60-65`). Editing the phase later does save the unit.
- When a phase is edited, the epics and stories inside it are not checked. Any that no longer fit show red "outside" warnings on the Plan.

#### 6.4.2 EpicModal (New / Edit epic)
**File:** `src/components/plan/plan-modals.tsx:121-205`

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Epic name * | Required | – | – | – |
| Description | Optional | – | – | – |
| Phase * (dropdown; only when phases are on) | Required when phases are on (red border while empty). Disabled when editing and `allowMove` is off ("Moving to another parent is turned off for this project."). If the phase is changed while editing, it shows: "Its tasks move to the new phase too." | – | – | – |
| Time: "All of {parent}" / "Its own dates inside it" radios | "All of": no own dates (the epic uses its parent's window). "Own dates": shows a `DateRangeField` limited to the phase window (or the project window) | – | – | – |
| Colour swatches (8, `EPIC_COLORS`, `src/lib/plan.ts:84`) | Picks a colour. The default is the first colour not used yet in the project | – | – | – |
| Create epic / Save epic (disabled until name, phase if needed, and no date error) | `addEpic` (`app-context.tsx:1074-1090`, id `epic-<time>-<rand>`) or `updateEpic` (`1091-1094`). An update also re-links tasks of this epic, so their phase follows the epic's new phase | `epics`, `tasks` | Yes | toast |
| Cancel | Closes | – | – | – |

#### 6.4.3 StoryModal (New / Edit story)
**File:** `src/components/plan/plan-modals.tsx:208-309`

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Story * (text, "As a sender, I can … so that …") | Required | – | – | – |
| Acceptance criteria | Optional | – | – | – |
| Notes | Optional (saved as `description`) | – | – | – |
| Epic * (if epics on) **or** Phase * (if epics off and phases on) | Required parent; locked when editing and `allowMove` is off. If the parent changes: "Its tasks move with it." | – | – | – |
| Priority (Low/Medium/High/Critical; default Medium) | Story priority | – | – | – |
| Time radios + `DateRangeField` | As for the epic; the window is the epic, else the phase, else the project (`storyWindow`) | – | – | – |
| Create story / Save story | `addStory` (`app-context.tsx:1101-1119`; `phaseId` is dropped when an epic is set) or `updateStory` (re-links its tasks) | `stories`, `tasks` | Yes | toast "Story created/saved" |
| Cancel | Closes | – | – | – |

#### 6.4.4 Plan picker (used by task forms, documented here for its rules)
**File:** `src/components/plan/plan-picker.tsx`. It is used by `CreateTaskModal`, `/tasks/new` and the task drawer.
- It shows one dropdown per level in use. It returns nothing for a Tasks-only project.
- Each list is narrowed by the levels chosen above it. Choosing a level keeps the levels above it and clears the ones below it. The result goes through `resolvePlan`, which fills the parents from a story or epic.
- The lowest level is required (red border, `*`) unless the backlog is on. Then its empty option reads "Backlog (place it later)". Upper levels show "Any {level}".
- `taskLinksError()` (`structure.ts:69-75`) gives the matching error message for forms.

---

### 6.5 Schedule (Gantt) — `/projects/[projectId]/timeline`

**File:** `src/app/(workspace)/projects/[projectId]/timeline/page.tsx` (+ `src/lib/task-progress.ts` `actualSpan`, `src/lib/durations.ts` `formatDays`, `src/lib/use-now.ts`)
**Who can open it:** Any signed-in user.
**Purpose:** A read-only Gantt chart of tasks and subtasks against the baseline and revised end dates, with "actual work" lines.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project timeline fields | `project.originalStartDate/EndDate/Duration`, `currentEndDate/Duration`, `timelineDifference`, `timelineStatus` | Calculated by `calculateProjectTimeline` (see 6.3) |
| Tasks | `tasks` for the project | |
| Phases | `milestones` for the project | |
| Status changes, work sessions | `taskStatusChanges`, `workSessions` | For the actual-work lines |
| Users | `users` | Avatars |

**Cards, widgets and lists**

#### "Project Schedule & Baseline" banner
- **Shows:** a status pill ("Extended by +N calendar days", "Shortened by N calendar days" or "On Original Schedule"; no pill for `completed`), and 4 metrics: Original Baseline End, Revised Planned End, Baseline Duration and Revised Duration (both "N calendar days").
- Durations fall back to **90** when missing (`timeline/page.tsx:51-52`).

#### Phases strip
- **Shows:** a chip per phase: name and end date. Hidden when there are no phases.

#### Gantt grid
- **Date header** (`timeline/page.tsx:71-94`):
  - **Months** zoom (the default): from 3 days before the baseline start to the latest of today, the baseline end and the current end, plus 7 days. Labels every ⌈days/14⌉ days.
  - **Weeks**: 60 days starting 21 days before today. A label every 5 days.
  - **Days**: 24 days starting 8 days before today. A label every day.
- **Main task row:** key, title (struck through when done), and a bar. The bar is green when done, blue when in progress, dark otherwise.
  - Bar start = `startDate`, else `dueDate − estimate` (default 5 days), else **now**. Bar end = `dueDate`, else start + estimate (default 3 days).
  - The bar is clipped to the grid, with a minimum width of 2%. The tooltip shows the estimate in the task's unit.
- **Actual line** (amber, under the bar): from the first move to In Progress, or the first timer start, to the move to In Review/Done (or now) (`actualSpan`, `src/lib/task-progress.ts:21-48`). The tooltip shows "Actual: {start} → {end|now} (Nd)".
- **Subtask rows** are listed under each main task, with the same bar rules (default estimate 1 day) and the estimate shown inside the bar.
- **Vertical lines:** TODAY (red), Baseline end (dashed, labelled), and Revised end (amber, only when extended).
- **Empty state:** none. If no tasks match, the grid shows only the header and the marker lines.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Status filter dropdown: All Tasks (N), To Do, In Progress, In Review, Done | Filters which **main** tasks are shown (`timeline/page.tsx:57-67`) | local state | No | – |
| Scale buttons: days / weeks / months | Changes the zoom (see above) | local state | No | – |
| Task row / subtask row (click) | Opens the task drawer | `openTaskDrawer` | No | – |

**Notes, limits and simulated parts**
- **Read-only.** Bars cannot be dragged or resized. `updateTask` is loaded but never used (`timeline/page.tsx:34`).
- The filter has no "Blocked" option. "All Tasks (N)" counts subtasks too. The filter checks only main tasks: subtasks of a shown task are always shown, whatever their status. A subtask whose main task is filtered out is hidden.
- Marker lines are placed with `calc(25% + 75% × pct)`, which assumes the title column is 25% wide. On phones the title column is 4/12 (33%), so the lines are out of place. The TODAY line uses `Date.now()`, not the shared clock.
- Tasks with no dates are drawn starting "now", so they move every time you load the page.
- Several imported items are unused (`Link`, `Button`, `ProgressBar`, badges, etc.); this has no effect on the user.

---

### 6.6 Sprints — `/projects/[projectId]/sprints`

**File:** `src/app/(workspace)/projects/[projectId]/sprints/page.tsx`
**Who can open it:** Any signed-in user. No permission checks on any button.
**Purpose:** Lists the project's sprints by state (active, planned, completed). Lets you create, start, complete and delete sprints.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Sprints | `useApp().sprints` (seed in `mock-data.ts`) filtered by project | |
| Tasks | `useApp().tasks` (all projects) | Matched to a sprint by `task.sprintId` |
| `?create=sprint` | URL query (`sprints/page.tsx:37`) | Set by the header "+ New → Sprint" item; opens the dialog |

**Cards, widgets and lists**

#### Active Sprint section
- **Shows:** the **first** sprint with `status === 'active'`, as a SprintCard.
- **Empty state:** "No active sprint — Start an upcoming sprint or plan a new iteration…", plus a "Start {first planned sprint}" button if there is one.

#### Planned / Upcoming (N) section
- **Shows:** sprints with `status === 'planning'`. Hidden when there are none.

#### Completed Sprints (N) section
- **Shows:** sprints with `status === 'completed'`. Hidden when there are none.

#### SprintCard (`sprints/page.tsx:274-392`)
- **Shows:** a status chip, name, goal, Duration ("start – end"), Tasks ("done / total completed"), Story Points ("done / total pts") and Progress (bar + %).
- **How it is calculated:** `sprintTasks = tasks.filter(sprintId === sprint.id)` (subtasks included). Points = sum of `points || 0`. Progress = done ÷ count × 100, rounded (by count, not by points or days).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Sprint" (header) | Opens the "Create New Sprint" dialog | local state | – | – |
| Sprint Name * (text, `required`) | Required. The browser blocks an empty submit; the code also shows the toast "Add a name for the sprint first." | – | – | – |
| Sprint Goal (textarea) | Optional | – | – | – |
| Start Date / End Date (date) | Optional. Defaults: today, and today + 14 days | – | – | – |
| Dialog Cancel / close | Closes; removes `?create=sprint` from the URL with `router.replace` | – | – | – |
| Dialog "Create Sprint" (submit) | `addSprint({name, projectId, goal, startDate, endDate, status:'planning'})` (`app-context.tsx:1001-1014`; id `sprint-<time>`, capacity defaults to 20) | `sprints` | Yes | toast "Sprint … created"; the form is cleared |
| "Start {name}" (empty active section) / "Start Sprint" (planned card) | `updateSprint(id, {status:'active'})` | `sprints` | Yes | No toast |
| "Complete Sprint" (active card) | `updateSprint(id, {status:'completed'})` | `sprints` | Yes | No toast |
| "Sprint Planning →" | Goes to `/projects/<id>/sprints/<sprintId>` | – | – | – |
| 🗑 Delete Sprint | Deletes **immediately, with no confirmation** → `deleteSprint` (`app-context.tsx:1019-1023`): removes the sprint and clears `sprintId` on its tasks | `sprints`, `tasks` | Yes | No toast |

**Notes, limits and simulated parts**
- More than one sprint can be active. Starting a sprint does not stop the current one. Only the first active sprint is shown, and **any other active sprint disappears from the page** (it is not "planning" or "completed").
- There is no check that the end date is after the start date.
- The subtitle mentions "velocity", but nothing calculates it. `capacity` (default 20) is never shown.
- Completing a sprint does nothing to unfinished tasks (they keep their `sprintId`).
- Sprint actions write no activity log and no notification.

---

### 6.7 Sprint planning — `/projects/[projectId]/sprints/[sprintId]`

**File:** `src/app/(workspace)/projects/[projectId]/sprints/[sprintId]/page.tsx`
**Who can open it:** Any signed-in user. The page shows "not found" if the sprint is not in this project.
**Purpose:** Move tasks into or out of one sprint.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Sprint | `sprints` (id and projectId must match) | |
| Tasks | `tasks` | Sprint scope = `sprintId === sprint.id` |
| Users | `users` | Avatars |

**Cards, widgets and lists**

#### Sprint info card
- **Shows:** "← All Sprints", the name, a status chip, "Goal: …", and stats: Sprint Timeline, Tasks Planned ("done / total Done"), Story Points Burned ("done of total pts"), and Completion (bar + %).
- **How it is calculated:** the same formulas as the SprintCard (6.6).

#### Committed Sprint Tasks (N) column
- **Shows:** "N pts total", and rows with key, title, priority, status, points (if any) and avatar.
- **Empty state:** "Sprint is empty — Move tasks from the backlog on the right into this sprint."

#### Project Backlog (N) column
- **Shows:** **all** project tasks not in this sprint: subtasks, done tasks and tasks in **other** sprints included (`sprintId/page.tsx:43-51`). Each row has key, title, priority, points and an "Add to Sprint" button.
- **Empty state:** "No matching backlog tasks."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "← All Sprints" | Goes back to the Sprints list | – | – | – |
| "Start Sprint" (planning) / "Complete Sprint" (active) | `updateSprint(status)` | `sprints` | Yes | No toast |
| Task row (click, either column) | Opens the task drawer | `openTaskDrawer` | No | – |
| "−" Remove from sprint | `updateTask(id, {sprintId: undefined})` | `tasks` (+ project progress and timeline recalculated inside `updateTask`, `app-context.tsx:942-976`) | Yes | No toast |
| Backlog status filter: All Backlog / To Do / In Progress | Filters the backlog column | local state | No | – |
| Backlog search box | Matches title or key (case-insensitive) | local state | No | – |
| "+ Add to Sprint" | `updateTask(id, {sprintId: sprint.id})`. A task in another sprint is silently moved | `tasks` | Yes | No toast |

**Notes, limits and simulated parts**
- There is no drag-and-drop and no capacity check.
- The "Backlog" here means "not in this sprint". It is different from the Plan tab's Backlog (tasks with no phase, epic or story).

---

### 6.8 Team — `/projects/[projectId]/team`

**File:** `src/app/(workspace)/projects/[projectId]/team/page.tsx`
**Who can open it:** Any signed-in user. No permission checks: any role can add or remove members or change the owner.
**Purpose:** Lists project members with their workload, and lets you add or remove members and change the owner.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project members | `users.filter(u => project.memberIds.includes(u.id))` | |
| Available users | `users` not in `memberIds` (the whole user directory) | |
| Tasks | `tasks` for the project (subtasks included) | |
| `?create=member` | URL query (`team/page.tsx:35`) | Opens the Add Member dialog |

**Cards, widgets and lists**

#### Heading
- **Shows:** "{N} team members collaborating on {project}".

#### Member card (one per filtered member)
- **Shows:** avatar, name, a crown if owner, the raw role id, email.
- **Workload Capacity:** "{N} tasks assigned", a bar, "X done", "Y in progress".
- **How it is calculated:** `workloadPct = min(100, tasksAssigned × 20)`. This is a hard-coded rule: **5 tasks = 100%** (`team/page.tsx:177`). The bar turns red above 80%. Subtasks are counted as tasks.
- **Empty state:** none. If the search matches nobody, the grid is just empty.

#### Assigned task list (expandable)
- **Shows:** task title and raw status text.
- **Empty state:** "No tasks assigned to this member."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search box | Filters members by name, email or role (case-insensitive) | local state | No | – |
| "Add Member" | Opens "Add Member from Directory" | local state | – | – |
| Dialog "Add" (per user) | `updateProject(id, {memberIds: [...memberIds, userId]})` and **closes the dialog** (one user per opening) | `projects[].memberIds`; `updateProject` also re-runs `calculateProjectTimeline` (`app-context.tsx:742-748`) | Yes | No toast. If all users are members: "All organization members are already on this project!" |
| Dialog "Close" | Closes; clears `?create=member` | – | – | – |
| 👑 "Make Owner" (non-owners) | `updateProject(id, {ownerId})` at once, no confirmation | `projects[].ownerId` | Yes | No toast |
| 🗑 "Remove from project" (non-owners) | `updateProject(id, {memberIds without user})`, no confirmation. For the owner, a browser `alert()` says "Cannot remove the project owner…" (this path cannot be reached from the UI, because the button is hidden for the owner) | `projects[].memberIds` | Yes | No toast |
| "View Assigned Tasks (N)" / "Hide Assigned Tasks" | Opens or closes the task list for that member | local state | No | – |
| Task line (click) | Opens the task drawer | `openTaskDrawer` | No | – |

**Notes, limits and simulated parts**
- No invitation or email is sent. Adding a member only adds an id to the project.
- A removed member keeps their assigned tasks.
- Team changes write no activity log and no notification.

---

### 6.9 Activity — `/projects/[projectId]/activity`

**File:** `src/app/(workspace)/projects/[projectId]/activity/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Meant to be the project's audit trail.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Activities | `useApp().activities` (seed `MOCK_AUDIT_LOGS`, `mock-data.ts:1100`) | **Not saved**: lost on refresh |
| Users | `users` | Actor avatar |

**Cards, widgets and lists**

#### Activity timeline
- **Shows:** for each entry: an icon, avatar, actor name, action text (e.g. `project.created`), resource, date, and the detail in a grey box.
- **Icon rules:** a checkbox if the resource contains "task" or "fs-"; a bolt for "sprint"; a flag for "milestone"; sparkles otherwise.
- **How it is calculated:** `activities` where `resourceId === projectId`, or `resource` (lower-case) contains the project key or the project name (`activity/page.tsx:36-38`).
- **Empty state:** "No activity records found — Events will automatically appear here as tasks and milestones are modified."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Event" filter: All Events (N), Tasks, Sprints, Milestones, Project Updates | Meant to filter by type. It checks `entityType`, which `AuditLog` does not have (`src/types/index.ts:489-499`), so **every option shows all entries** | local state | No | – |

**Notes, limits and simulated parts**
- **The page is almost always empty.** No seed log matches a project. Task logs (status change and assign in the drawer, `reassignTask`) use `resource: 'Task'` with a task id, so they never match. Plan, sprint, team and settings actions write no logs. The only entry that can appear is the "project.created" log from the New Project wizard. It disappears on refresh because `activities` is not saved.
- The empty-state text ("Events will automatically appear…") promises behaviour that does not exist.
- The filter does nothing (see above).

---

### 6.10 Milestones (old route) — `/projects/[projectId]/milestones`

**File:** `src/app/(workspace)/projects/[projectId]/milestones/page.tsx`
**Who can open it:** Anyone. It is a server redirect.
**Purpose:** Milestones are now the **phases** of the Plan. This route redirects straight to `/projects/<id>/plan` (`milestones/page.tsx:4-7`). It has no UI.

**Unused component:** `src/components/collaboration/create-milestone-dialog.tsx` (a "Create/Edit Milestone" dialog with Project, Target Due Date (default hard-coded `2026-11-15`), Status (Pending/In Progress/Completed), Description and "Link Project Tasks") is **not imported anywhere**. It is dead code. Its "In Progress" status value is not a valid `Milestone.status`.

---

### 6.11 Settings — `/projects/[projectId]/settings`

**File:** `src/app/(workspace)/projects/[projectId]/settings/page.tsx` (+ `src/components/projects/project-structure-settings.tsx`, `src/components/projects/structure-editor.tsx`, `src/components/projects/project-boards-settings.tsx`, `src/components/shared/duration-fields.tsx`)
**Who can open it:** Any signed-in user. The **Structure** and **Boards** cards need `canCreateProject(demoRole)` to edit. The **General** form and the **Danger Zone** have **no permission check**.
**Purpose:** Edit project details and baseline, choose the plan structure, manage boards, archive or delete.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project | `projects` | Form fields start from it (they are not refreshed if the project changes elsewhere while the page is open) |
| Users | `users` (all users) | Owner dropdown |
| Milestones, epics, stories | for the counts in the Structure card | |
| Tasks | for board card counts | |
| `currentUserId` | for the baseline history | |

**Cards, widgets and lists**

#### "Changes saved successfully!" badge
- Appears for 3 seconds after you save the General form (`settings/page.tsx:114-115`).

#### General Information card
- A form. Its fields are listed in the controls table.

#### Baseline info box
- **Shows:** "The baseline is the original plan. The current planned end, {currentEndDate}, is calculated from tasks and milestones."
- If there is history, it adds: "Re-baselined N time(s), last by {name}: "{reason}"." (from `project.baselineHistory`).

#### Structure card (`ProjectStructureSettings`, anchor `#structure`)
- **Shows:** preset cards, level checkboxes, the resulting chain (e.g. Phase → Epic → Story → Task → Subtask), and rule checkboxes.
- Without permission it shows only: "Only project managers and admins can change the structure."
- Adding a level shows: "Adding phases: existing items show as "Needs a …" on the Plan tab until each one is placed."

#### Boards card (`ProjectBoardsSettings`, anchor `#boards`)
- **Shows:** one row per board: name field, "Main board / Mirrors {main} / Own columns · N columns · N cards", and actions.
- Board and column behaviour (including `BoardColumnsModal`) is covered in the Board section. The controls are listed briefly below.

#### Danger Zone card
- Archive and Delete.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Project Name (required) | Edits the draft | – | – | – |
| Project Key (required, max 6, forced UPPER CASE) | Edits the draft | – | – | Existing task keys (e.g. `FSV2-101`) are **not** renamed |
| Description | Edits the draft | – | – | – |
| Lifecycle Status: Active / Planning / On Hold / Completed / Archived | Edits the draft | – | – | `completed` makes the timeline status "completed" and health On Track. "Archived" here is a status value; it is separate from the Archive button's `isArchived` flag |
| Health State: Automatic (from timeline) / On Track / At Risk / Delayed | Auto → `healthMode:'auto'`; any other choice → `healthMode:'manual'` with that health | – | – | Manual health stays until set back to Automatic |
| Project Group / Space (text; default "Core Platform") | Edits the draft | – | – | Used to group projects on the Projects list |
| Project Accent Theme (8 swatches) | Picks `accentColor` | – | – | Used by project cards elsewhere |
| Project Owner (all users, "Name (role)") | Edits the draft | – | – | The owner is **not** added to `memberIds` |
| Baseline start / Length + unit / Baseline end (`DateRangeField`, no window) | Changing either date counts as "re-baselining" | – | – | Shows the required field "Why are you changing the baseline? *" |
| Baseline reason (text) | Required only when re-baselining. Empty → red border and "Add a reason; the old baseline is kept in history with it." | – | – | – |
| "Save Project Details" (submit) | `updateProject(id, {name, description, key, status, health, healthMode, ownerId, accentColor, group, ...re-baseline})`. Re-baselining also sets `originalStartDate`, `originalEndDate`, `originalDuration = days between`, `durationUnit`, and adds `{at, byUserId, reason, old start, old end}` to `baselineHistory` (`settings/page.tsx:84-116`) | `projects`; `updateProject` re-runs `calculateProjectTimeline` (`app-context.tsx:742-748`), so health, current end and difference update | Yes | "Changes saved successfully!" for 3 s (no toast) |
| Structure: preset cards Full / Agile / Phased / Simple phases / Tasks only (`structure.ts:20-26`) | Sets the three level flags in the draft. "Custom" is highlighted when the ticks match no preset (it is not a button) | draft only | – | – |
| Structure: Phases / Epics / Stories checkboxes | Turns levels on or off in the draft | draft only | – | – |
| Structure: Subtasks / Backlog / Moving between parents checkboxes | Rules in the draft. **Subtasks** shows or hides "Subtask" in "+ New" and in the chain (existing subtasks are not deleted). **Backlog** lets tasks stay unplaced. **Moving** locks the parent dropdowns when editing epics and stories, and limits "Link existing task" to Backlog tasks | draft only | – | – |
| "Undo changes" (only when changed) | Resets the draft to the saved structure | – | – | – |
| "Save structure" (disabled until changed) | If a level that still has items is being turned off, it first shows the red "This removes: …" list. Otherwise it calls `setProjectStructure` | see the next row | – | toast "Project structure saved" |
| "Remove and save" / Cancel (confirm box) | `setProjectStructure(projectId, draft)` (`app-context.tsx:1129-1166`). Stories off → the project's stories are **deleted** and tasks lose `storyId`. Epics off → epics are **deleted**; stories move to the epic's phase; tasks lose `epicId`. Phases off → phases (milestones) are **deleted**; epics, stories and tasks lose the phase link. Then all main tasks are re-resolved, `structure` is saved and the timeline is recalculated | `milestones`, `epics`, `stories`, `tasks`, `projects` | Yes | toast. Deletion cannot be undone. |
| Boards: board name field (blur or Enter) | `renameBoard` | `projects` (`mainBoardName` / `extraBoards`) | Yes | toast "Board renamed…" |
| Boards: ▲ / ▼ (extra boards) | `moveBoard` (swaps order) | `projects[].extraBoards` | Yes | – |
| Boards: "Edit columns" | Opens `BoardColumnsModal` → `setBoardColumns` (see the Board section) | `projects`, `tasks` (cards re-placed by the internal `relayoutProject` helper, `app-context.tsx:174-216`, which also records status changes and recalculates progress) | Yes | toast |
| Boards: "Customise" (mirroring board) | `setBoardMirroring(false)`: copies the main board's columns | `projects` | Yes | toast |
| Boards: "Mirror {main}" → confirm "Mirror {main}" / Cancel | `setBoardMirroring(true)`: cards in missing columns move to the first column of the same stage (`relayoutProject`) | `projects`, `tasks` | Yes | toast |
| Boards: 🗑 Remove board | If it has 0 cards → `deleteBoard` at once. Otherwise it asks "Move its N cards → [board]", then "Remove board" / Cancel | `projects`, `tasks` | Yes | toast |
| Boards: "New board name" + "Add board" (or Enter) | `addBoard(projectId, name)` (id `board-<time>`) | `projects[].extraBoards` | Yes | toast "Board … added" |
| "Archive Project" / "Unarchive Project" | `archiveProject` toggles `isArchived` | `projects` | Yes | No toast; no visible effect elsewhere (see 6.3) |
| "Delete Project…" | Shows "Type the project key {KEY} to confirm deletion" | – | – | – |
| Key confirmation input | Must match the key exactly (case-sensitive) | – | – | – |
| Confirm box Cancel | Hides the box and clears the input | – | – | – |
| "Confirm Delete" (disabled until the key matches) | `deleteProject` then go to `/projects` | as in 6.3 (project, tasks, sprints, milestones removed; epics, stories, files etc. left as orphans) | Yes | No toast |

**Notes, limits and simulated parts**
- **Permission gap:** any role (for example a developer) can rename, re-key, re-baseline, archive or delete a project. Only the Structure and Boards cards are protected.
- The Danger Zone text says archived projects "become read-only and are hidden from default project lists". **Neither is implemented.**
- The page's hooks run after an early `return notFound()` (`settings/page.tsx:57-80`). It works in normal use, but it breaks React's rules of hooks.
- The baseline date pickers have no window limits. A phase that no longer fits the new baseline shows red warnings on the Plan, but nothing is changed automatically.
- Changing only the unit (e.g. Weeks → Months) also moves the end date (`setUnit` keeps the number). That counts as re-baselining and asks for a reason.

---

### 6.12 Shared calculation helpers used in this area (reference)

| Helper | File | What it does |
|---|---|---|
| `calculateProjectTimeline` | `src/lib/timeline-calculator.ts:153` | Recalculates current end, difference, timeline status, total work days and health. Runs on load and inside `addProject`, `updateProject`, `addTask(s)`, `updateTask`, `deleteTask`, `addMilestone`, `updateMilestone`, `deleteMilestone` and `setProjectStructure`. It does **not** run in `addEpic`/`updateEpic`/`deleteEpic`, `addStory`/`updateStory`/`deleteStory`, `setTaskPlan` or the sprint actions |
| `forecastEnd` / `forecastOf` | `src/lib/schedule.ts:202-225` | The end date a task or level is forecast to reach (rules in 6.3) |
| `projectWindow`, `phaseSpan`, `epicWindow/Span`, `storyWindow/Span`, `taskWindow`, `subtaskWindow`, `outsideWindow` | `src/lib/schedule.ts` | The date window each level must fit inside, and the warning text when it does not |
| `progressOfTasks` | `src/lib/subtasks.ts:47` | Work-weighted % done: leaves weighted by `estimatedDuration` (at least 1) |
| `resolvePlan`, `withSubtasks`, `planOf` | `src/lib/plan.ts` | Fill a task's phase and epic from its story or epic; add subtasks to a scope |
| `projectStructure`, `levelsOf`, `parentLevel`, `taskLevel`, `taskPlacementIssue`, `inBacklog`, `taskLinksError`, `STRUCTURE_PRESETS` | `src/lib/structure.ts` | Structure rules |
| `addDuration`, `splitSpan`, `naturalUnit`, `formatDuration`, `formatDays`, `estimateParts`, `toDays` | `src/lib/durations.ts` | Days, weeks and months maths. A month is a calendar month (Jan 31 + 1 month = Feb 28). A month estimate without a start date ≈ 30.44 days ± 3 |
| `DateRangeField`, `WindowHint`, `rangeError`, `EstimateField`, `TaskTimeFields`, `EffortField`, `SubtaskTimeFields`, `daysFromDates` | `src/components/shared/duration-fields.tsx` | Date, length and estimate inputs. Lengths take digits only (max 4). Effort is entered in hours and stored in minutes, rounded to 15 (at least 15) |

---

### 6.Z Data flow summary for this area

- **Reads:** `projects`, `tasks`, `sprints`, `milestones`, `epics`, `stories`, `users`, `activities`, `taskStatusChanges`, `workSessions`, `demoRole`, `currentUserId`.
- **Writes (all saved to localStorage `flashsign-proto-state-v6`):** `projects` (favourite, archive, details, baseline, structure, members, owner, boards, progress and timeline), `tasks` (plan links, sprint links, re-placement on boards), `sprints`, `milestones` (phases), `epics`, `stories`, `recentProjectIds`, and `taskStatusChanges`/`workSessions` (only through board re-layout).
- **Writes that are not saved:** `activeTaskDrawerId` (opening the drawer). `activities` is only read here; the logs that would show here are lost on refresh.
- **Store actions used:** `toggleFavoriteProject`, `addRecentProject`, `addProject` (Duplicate), `updateProject`, `archiveProject`, `deleteProject`, `setProjectStructure`, `addMilestone`, `updateMilestone`, `deleteMilestone`, `addEpic`, `updateEpic`, `deleteEpic`, `addStory`, `updateStory`, `deleteStory`, `setTaskPlan`, `addSprint`, `updateSprint`, `deleteSprint`, `updateTask` (sprint planning), `addBoard`, `renameBoard`, `moveBoard`, `setBoardMirroring`, `deleteBoard`, `setBoardColumns`, `openTaskDrawer`. The internal helper `relayoutProject` runs behind the board actions.
- **Persistence quirk:** on load, if the saved `milestones`, `tasks` or `projects` array is **empty**, the seed data comes back (`app-context.tsx:500-502`). For example, deleting every phase in every project brings the seed phases back after a refresh.
- **No side effects:** no action in this area creates notifications or activity logs.

---

## 7. Kanban boards, task list, task drawer and time tracking

This section covers the project Kanban board (one or more boards per project, with editable columns), the hierarchical task list, the two task-creation forms, the global Task Detail Drawer (with its Progress, Time log and Journey views), and the time-tracking ("timer") rules behind them. There is no real timer service: a "timer" is a `WorkSession` record in `AppState.workSessions`, opened and closed by store actions when a card's stage changes. Everything below runs in the browser and is saved to localStorage, except where a row says "No".

**Role note (applies to every screen here):** controls guarded by `canCreateProject(demoRole)` (`src/lib/permissions.ts:105`, roles `ceo`, `project_manager`, `product_owner`, `engineering_lead`, `org_admin`, `platform_admin`) or `canViewTeamTime(demoRole)` (`src/lib/permissions.ts:144`, roles `ceo`, `project_manager`, `engineering_lead`, `org_admin`, `platform_admin`) depend on the **signed-in account's role**. After sign-in, `src/context/app-context.tsx:622-672` sets `demoRole` from the account (`executive`→`ceo`, `qa`→`qa_tester`, others unchanged) and sets `currentUserId` to that user. `FIXED_DEMO_ROLE` (`ceo`) applies only before that sync runs. `canCreateTask` (`src/lib/permissions.ts:109`) exists but **is not used anywhere**, so any signed-in role can create, edit, move and delete tasks.

---

### 7.1 Kanban board — `/projects/[projectId]/board`

**File:** `src/app/(workspace)/projects/[projectId]/board/page.tsx` (+ `src/components/tasks/card-subtasks.tsx`, `src/components/tasks/placement-select.tsx`, `src/components/tasks/subtask-state-select.tsx`, `src/components/tasks/use-guarded-move.tsx`, `src/components/agents/task-timer-badge.tsx`, `src/components/projects/board-columns-modal.tsx`, `src/lib/board-columns.ts`)
**Who can open it:** Any signed-in user (workspace layout guard). Column editing and the "Boards" link need `canCreateProject(demoRole)` (`board/page.tsx:84`). If the project id is not found, `notFound()` (`board/page.tsx:68`). Hard-coded special case: the id `p-mvhmnblw` falls back to project `p1` and its tasks (`board/page.tsx:65-74`).
**Purpose:** Show the project's top-level tasks as cards in columns, one or more boards stacked, and let people move cards (which changes the task's status and starts/stops timers).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project | `useApp().projects` (seed `src/data/mock-data.ts`) | gives `boardColumns`, `mainBoardName`, `extraBoards`, `structure`, `memberIds` |
| Boards and columns | `projectBoards(project)` `src/lib/board-columns.ts:71` | Main board (id `main`) + `extraBoards`; an extra board with no own columns "mirrors" the main board's columns. No saved columns → `DEFAULT_BOARD_COLUMNS` (`board-columns.ts:24`): To Do, In Progress, In Review, Done, Blocked |
| Cards | `useApp().tasks` filtered to project and `!parentId` (`board/page.tsx:74-76`) | Subtasks are never cards; they show inside their parent card |
| Subtasks per card | `subtasksByParent` map (`board/page.tsx:77-80`) | |
| Members (assignee filter) | `users` filtered by `project.memberIds` (`board/page.tsx:81`) | |
| Epics / stories / phases | `useApp().epics`, `stories`, `milestones` | epic chip on cards; quick-add parent picker |
| Timers | `useApp().workSessions` (via `TaskTimerBadge`, `CardSubtasks`) | seed `MOCK_WORK_SESSIONS` in `src/data/mock-agent-activity.ts:100` |
| Status history | `useApp().taskStatusChanges` (via `CardSubtasks`) | seed `MOCK_STATUS_CHANGES` `mock-agent-activity.ts:155` |

**Cards, widgets and lists**

#### Board toolbar counter "X / Y tasks"
- **Shows:** `filteredTasks.length / cardTasks.length` (`board/page.tsx:430-432`).
- **How it is calculated:** Y = all top-level tasks of the project (all boards). X = those passing search + assignee + priority filters.

#### Board sections (only when the project has 2+ boards)
- **Shows:** one folding section per board with a chevron, board name, "N card(s)" badge, and for extra boards "Mirrors <main board>" or "Own columns" (`board/page.tsx:454-516`).
- **How it is calculated:** N = filtered cards whose `placementOf(...).board` is this board (`board/page.tsx:458`). A card with no `boardId`, or a `boardId` of a deleted board, is on the main board (`boardOfTask`, `board-columns.ts:86`).
- **Default open state:** main board open, others folded (`board/page.tsx:85`). Fold state is component state only (lost on refresh/navigation).
- While a card is being dragged, each header shows "Drop here for <board> · <entry column>" (`board/page.tsx:495-499`).
- With only one board, columns render directly without a section header (`board/page.tsx:517-519`).

#### Column
- **Shows:** colour dot, column name, card count, and a small stage chip ("In Progress", etc.) only when the column's name differs from its stage label (`board/page.tsx:174-189`).
- **How it is calculated:** a card is in this column when `placementOf(task, boards)` gives this board and column (`board/page.tsx:152-155`). `columnOfTask` (`board-columns.ts:45`): the card's own `columnId` if that column still has the same stage as the task status; otherwise the first column of that stage; otherwise the first column.
- **Empty state:** dashed box "Drop tasks here" (`board/page.tsx:361-365`).

#### Task card
- **Shows:** priority icon, task key, "Move:" dropdown, title (2 lines max), subtask block (if any), epic chip, timer badge, "SRS" chip (if `isSrsGenerated`), first 2 labels, assignee avatar or "Unassigned", due date, story points "N pts" (`board/page.tsx:246-357`).
- **Data source:** the `Task` object; epic from `epics` by `task.epicId`.
- Clicking anywhere on the card (not the dropdown/subtask block) opens the Task Detail Drawer (`board/page.tsx:257`).

#### Timer badge on a card (`TaskTimerBadge`)
- **Shows:** while any timer is running on the task or one of its subtasks: "⏱ <Web app | agent name> · 1h 20m" (green). Otherwise, if time was logged: grey "⏱ 5h 20m" total. Hidden when total is 0 (`src/components/agents/task-timer-badge.tsx:16-45`).
- **How it is calculated:** sessions whose `taskId` is the task or any direct subtask (`task-timer-badge.tsx:19-20`). Running = first session without `endedAt`; its minutes = now − start. Total = sum of `sessionMinutes(start, end ?? now)` (rounded minutes, `src/lib/agent-connection.ts:381`). Only one running session is shown even if several people have timers. Live value refreshes every 30 s (`useNow`, `src/lib/use-now.ts:16-19`).

#### Subtask block inside a card (`CardSubtasks`)
- **Shows** (`src/components/tasks/card-subtasks.tsx`):
  - A segmented bar, one segment per subtask coloured by its status (`card-subtasks.tsx:50-54`).
  - "D/T subtasks done · N in progress · N blocked" (`card-subtasks.tsx:56-60`) from `subtaskCounts` (`src/lib/subtasks.ts:22`).
  - "In progress today / Nd" when the parent task is In Progress: whole days since its last recorded move into In Progress (`inProgressSince`, `subtasks.ts:29`; `card-subtasks.tsx:43-44`). If no status-change record exists, nothing shows.
  - Up to 3 subtask rows (two lines): title (struck through when Done); second line "worked / planned" hours (amber when worked > planned effort) and "Due <date>" or red "Overdue · <date>" (overdue = not Done/Review and due date before today) (`card-subtasks.tsx:69-116`); a timer icon when a timer is running on that subtask; assignee avatar; a status dropdown.
  - "Show N more / Show less" when more than 3 subtasks (`card-subtasks.tsx:117-125`).
  - Green button "All subtasks done · Move to In Review" when every subtask is Done (not Review) and the task is not already In Review/Done (`card-subtasks.tsx:46, 127-135`).
- Clicking a subtask row opens the drawer for that subtask (`card-subtasks.tsx:79`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Search board…" box (`board/page.tsx:395-400`) | Filters cards by title, key or labels (case-insensitive); a card also matches when any of its subtasks matches (`board/page.tsx:89-103`) | none (component state) | No (UI state) | — |
| "All Assignees" dropdown (`board/page.tsx:403-414`) | Shows cards assigned to the person, or whose subtasks are assigned to them | none | No | Options = project members only |
| "All Priorities" dropdown (`board/page.tsx:416-426`) | Filters by the card's own priority (subtasks ignored) | none | No | — |
| "Columns" button (toolbar; only single-board projects and `canCreateProject`) (`board/page.tsx:433-437`) | Opens the Board Columns dialog for the main board (7.2) | — | — | — |
| "Boards" button (`canCreateProject`) (`board/page.tsx:438-444`) | Link to `/projects/[id]/settings#boards` (7.3) | — | — | — |
| "New Task" button (`board/page.tsx:445-449`) | Link to `/projects/[id]/tasks/new` (7.6) | — | — | No permission check |
| Board header chevron / name (multi-board) (`board/page.tsx:479-500`) | Folds/unfolds the board | none | No | — |
| Board header "Columns" (multi-board, `canCreateProject`) (`board/page.tsx:501-510`) | Opens the Board Columns dialog for that board | — | — | — |
| Drag a card onto a column (`board/page.tsx:108-113, 160-171, 246-256`) | `move(task, placeIn(board, column))`: card takes the column's board, column id, and the column's stage as `status` | `updateTask` → `tasks`; may add `workSessions` and `taskStatusChanges` (see 7.Y) | Yes | If target stage is Done and the task has open subtasks, the "subtasks still open" dialog appears first (7.10). Project `progress` and timeline recalculated |
| Drag a card onto a board header (multi-board) (`board/page.tsx:464-478`) | Drops the card into that board's first **To Do** column (or first column). Dragging over a folded board also unfolds it | same as above, with a board move recorded (`fromBoardId`/`toBoardId`) | Yes | A card that was In Progress goes back to To Do: its timer stops ("paused") |
| "Move:" dropdown on a card (`board/page.tsx:276-284`; `placement-select.tsx`) | Same as drag-and-drop; options grouped by board when there are several | `updateTask` | Yes | Keyboard-accessible alternative to drag |
| Column "+" (quick add) (`board/page.tsx:190-197`) | Opens a small form at the top of the column | none | — | Only one quick-add form open at a time; the typed title is shared between columns |
| Quick add title input (`board/page.tsx:203-214`) | Enter = Add, Escape = close. Placeholder says "(goes to the Backlog)" when the project allows a Backlog | — | — | — |
| Quick add parent dropdown (`board/page.tsx:215-227`) | Shown only when the project's structure does not allow a Backlog: choose the phase/epic/story the task belongs to (level from `taskLevel(structure)`) | — | — | — |
| Quick add "Add" (`board/page.tsx:126-146, 232-234`) | Validates title (toast "Type a title for the task first.") and parent (toast "Choose a …"). Calls `addTask` with title, placed in this board+column (status = column stage), plan links, **priority `medium`, labels `['Feature']`, points `2` (hard-coded)** | `addTask` → `tasks` (+ key like `FSV2-112` from `nextTaskKey`), project `progress` + timeline | Yes | No toast on success, no notification. Quick-adding into an In Progress column does **not** start a timer and records no status change (see 7.Y) |
| Quick add "Cancel" (`board/page.tsx:229-231`) | Closes the form | none | — | Title is kept in state |
| "Add column" tile (`canCreateProject`) (`board/page.tsx:371-380`) | Opens the Board Columns dialog with a new blank column already added | — | — | — |
| Click a card (`board/page.tsx:257`) | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No (not saved) | Drawer opens (7.7) |
| Subtask row click (`card-subtasks.tsx:79`) | Opens the drawer for the subtask | `activeTaskDrawerId` | No | — |
| Subtask status dropdown (`card-subtasks.tsx:108-112`; `subtask-state-select.tsx`) | Choose To Do / In Progress / In Review / Done / Blocked for the subtask | `updateTask(sub.id, {status})` → `tasks`, `workSessions`, `taskStatusChanges` | Yes | Moving a subtask to In Progress starts a timer for the subtask's assignee (or you) and, if the parent card is in To Do, moves the parent to In Progress (7.Y rule 6). No "open subtasks" check here |
| "Show N more / Show less" (`card-subtasks.tsx:117-125`) | Expands the subtask list in the card | none | No | — |
| "All subtasks done · Move to In Review" (`card-subtasks.tsx:127-135`; handler `board/page.tsx:297-300`) | Moves the card to the first In Review column of **the same board** | `updateTask` | Yes | Stops the card's own timer as "finished" if it was In Progress |

**Notes, limits and simulated parts**
- Card status is always the stage of the column it is in. There is no rule about which column may follow which: any card can go from any column to any column (e.g. Done back to To Do).
- Moving within the same stage (e.g. "In Progress" → a custom "QA Testing" column that also counts as In Progress, on the same board) only changes `columnId`: no timer change and **no status-change record**.
- Filters, search, folded boards and drag state are not saved.
- Quick add hard-codes `labels: ['Feature']` and `points: 2` (`board/page.tsx:141-142`).
- The assignee filter matches subtask assignees; the priority filter does not look at subtasks.
- The `p-mvhmnblw` → `p1` fallback is a hard-coded demo shortcut.
- The "+ New" menu and tabs at the top come from the shared `ProjectHeaderNav` (documented with the project header).

---

### 7.2 Board Columns dialog (modal)

**File:** `src/components/projects/board-columns-modal.tsx` (opened from the board page 7.1 and from Project Settings > Boards 7.3)
**Who can open it:** only shown to `canCreateProject(demoRole)` roles (the buttons that open it are hidden otherwise). The dialog itself has no check.
**Purpose:** Add, rename, recolour, reorder and remove one board's columns, and set which stage each column "counts as". Changes are kept in a draft until "Save columns".

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Board and its saved columns | `projectBoards(project)` (`board-columns-modal.tsx:58-60`) | |
| Mirroring boards | boards with `mirrorsMain` (`board-columns-modal.tsx:62`) | |
| Cards for counts | `tasks` prop = all of the project's tasks **including subtasks** (`board/page.tsx:528`, settings page passes the same) filtered to boards that share these columns (`board-columns-modal.tsx:64-65`) | |

**Cards, widgets and lists**

#### Mirror info note
- **Shows:** for a mirroring board: "This board mirrors <main>. Saving here gives it its own columns…"; for the main board with mirrors: "<boards> mirror this board, so they change too. Card counts include those boards." (`board-columns-modal.tsx:165-172`).

#### Column rows
- **Shows:** up/down arrows, colour dot, name input (max 30 chars, red border when blank), "Counts as" stage dropdown, card count, trash button (`board-columns-modal.tsx:174-295`).
- **How it is calculated:** card count = cards whose current column (`columnOfTask` on the saved columns) is this column, following any "move cards to" choices made for removed columns (`board-columns-modal.tsx:79-88`). Because subtasks are included, the count can be higher than the cards visible on the board (subtasks sit in the first column of their stage).
- **Warning line:** "N cards here will change from <old stage> to <new stage>." when a saved column's stage is changed and it holds cards (`board-columns-modal.tsx:178, 257-261`).

#### Missing-stage warning
- **Shows:** "Add a column that counts as <stages> — the timer and AI agents move cards there." when the draft has no column for any of To Do, In Progress, In Review, Done (`REQUIRED_STAGES`, `board-columns.ts:17`; `board-columns-modal.tsx:306-311`). Blocked is optional.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Up / Down arrows (`board-columns-modal.tsx:185-202`) | Reorders the column in the draft | draft only | — | — |
| Colour dot (`board-columns-modal.tsx:205-212`) | Cycles through 8 preset colours (`COLUMN_COLORS`, `board-columns.ts:19`) | draft only | — | — |
| Name input (`board-columns-modal.tsx:214-224`) | Renames the column in the draft | draft only | — | Blank name blocks Save |
| "Counts as" dropdown (`board-columns-modal.tsx:226-239`) | Sets the column's stage (To Do / In Progress / In Review / Done / Blocked) | draft only | — | On save, cards in it change status and timers react (7.Y) |
| Trash (remove column) (`board-columns-modal.tsx:245-254`) | Disabled when it is the last column of a required stage. Empty column: removed at once. Column with cards: shows a "Move its N cards → [column]" row (default target = another column of the same stage) | draft + `moves` map | — | — |
| "Move its N cards" target dropdown, "Cancel", "Remove column" (`board-columns-modal.tsx:263-290`) | Picks where the cards go, cancels, or confirms the removal | draft + `moves` | — | — |
| "Add column" (`board-columns-modal.tsx:297-304`) | Adds a blank column (stage In Progress, next unused colour) just before the first Done column (`board-columns-modal.tsx:35-50`) | draft only | — | Focuses the new name field |
| "Reset to default" (`board-columns-modal.tsx:315-317`) | Replaces the draft with the 5 default columns and clears moves | draft only | — | Cards in removed custom columns fall to the first column of their stage on save |
| "Cancel" / X (`board-columns-modal.tsx:319-321`) | Closes, draft discarded | none | — | — |
| "Save columns" (`board-columns-modal.tsx:147-152, 322-324`) | Disabled unless all required stages exist and no name is blank. Calls `setBoardColumns(projectId, boardId, columns, moves)` | `projects` (`boardColumns` or the extra board's `columns`), `tasks` (`boardId`, `columnId`, `status`), `workSessions`, `taskStatusChanges` via `relayoutProject` (`app-context.tsx:174-217, 747-759`) | Yes | Toast "Columns saved for <board>". Editing the main board also changes mirroring boards; editing a mirroring board gives it its own columns. Every card whose stage changes goes through the timer rules (7.Y) |

**Notes, limits and simulated parts**
- Because subtasks are part of `relayoutProject`'s task loop (`app-context.tsx:191-207`), removing/re-staging a column that a subtask "sits in" can also change that subtask's status and give it a `boardId`/`columnId`. Unclear whether this is intended; subtasks are never shown as cards.
- Column ids of new columns are `col-<timestamp>`.

---

### 7.3 Project Settings › Boards card — `/projects/[projectId]/settings#boards`

**File:** `src/components/projects/project-boards-settings.tsx` (rendered by `src/app/(workspace)/projects/[projectId]/settings/page.tsx:321-325`)
**Who can open it:** anyone who can open project settings; editing needs `canCreateProject(demoRole)` (`settings/page.tsx:324`). Without it the card is read-only (inputs disabled, buttons hidden).
**Purpose:** Add extra boards below the main board (e.g. "Testing"), rename, reorder, customise or re-mirror their columns, and remove them.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Boards | `projectBoards(project)` | |
| Cards per board | project tasks **incl. subtasks** whose `boardOfTask` is the board (`project-boards-settings.tsx:33`) | subtasks have no `boardId`, so they add to the main board's count |

**Cards, widgets and lists**

#### Board row
- **Shows:** (for extra boards) up/down arrows; name input; "Main board" / "Mirrors <main>" / "Own columns" · "N columns · N cards"; buttons (`project-boards-settings.tsx:56-160`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Up / Down (extra boards) (`project-boards-settings.tsx:62-83`) | Swaps the board with its neighbour; main board always first | `moveBoard` → `projects[].extraBoards` (`app-context.tsx:778-789`) | Yes | — |
| Board name input (`project-boards-settings.tsx:85-101`) | On blur/Enter, if changed and not blank, renames | `renameBoard` → `mainBoardName` or the extra board's `name` (`app-context.tsx:768-777`) | Yes | Toast "Board renamed to …". Blank name reverts |
| "Edit columns" (`project-boards-settings.tsx:111-113`) | Opens the Board Columns dialog (7.2) for that board | — | — | — |
| "Customise" (mirroring board) (`project-boards-settings.tsx:114-126`) | Copies the main board's columns into this board | `setBoardMirroring(…, false)` → `relayoutProject` (`app-context.tsx:790-797`) | Yes | Toast. Column ids are kept, so cards stay put |
| "Mirror <main>" + confirm row (own-columns board) (`project-boards-settings.tsx:127-185`) | Confirm: drop own columns and follow the main board again | `setBoardMirroring(…, true)` → `relayoutProject` | Yes | Cards in columns the main board lacks move to the first column of the same stage; toast |
| Trash (extra board) (`project-boards-settings.tsx:138-157`) | 0 cards: removes immediately (no confirm). Otherwise shows "Move its N cards → [board]" | `deleteBoard(projectId, boardId, target)` → `relayoutProject` with `boardMoves` (`app-context.tsx:798-802`) | Yes | Moved cards get a board-move status record; an In Progress card's timer is split (7.Y rule 5). Toast |
| Delete target dropdown / "Cancel" / "Remove board" (`project-boards-settings.tsx:187-222`) | Picks the destination board / cancels / confirms | as above | Yes | — |
| "New board name" input + "Add board" (Enter works) (`project-boards-settings.tsx:229-243`) | Adds a board (id `board-<timestamp>`) at the bottom, mirroring the main board | `addBoard` → `projects[].extraBoards` (`app-context.tsx:760-767`) | Yes | Toast "Board "…" added". Disabled when the name is blank |

**Notes, limits and simulated parts**
- The main board cannot be deleted or moved.
- Card counts include subtasks (see table above), so they may not match the board page.

---

### 7.4 Task list — `/projects/[projectId]/tasks`

**File:** `src/app/(workspace)/projects/[projectId]/tasks/page.tsx` (+ `src/components/tasks/create-task-modal.tsx`, `src/components/shared/confirm-delete-modal.tsx`, `placement-select.tsx`, `subtask-state-select.tsx`, `use-guarded-move.tsx`)
**Who can open it:** Any signed-in user. No permission checks on any control. Same `p-mvhmnblw` → `p1` fallback as the board (`tasks/page.tsx:93-102`).
**Purpose:** A hierarchical list: each main task with its subtasks nested underneath, with filters, quick estimate editing, status changes and deletion.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tasks | `useApp().tasks` for the project; main tasks = no `parentId` (`tasks/page.tsx:102, 127-129`) | |
| Phases | `milestones` for the project (`tasks/page.tsx:103`) | |
| Epics / stories | `epics`, `stories` | |
| Members | `users` in `project.memberIds` | assignee filter |
| Boards | `projectBoards(project)` | status dropdown |
| Timers / status history | `workSessions`, `taskStatusChanges` | "In progress Nd", "Worked" |

**Cards, widgets and lists**

#### "Task Hierarchy" banner
- **Shows:** static "Project → Phase → Epic → Story → Main Tasks → Subtasks" (`tasks/page.tsx:184-210`). The "Phase → Epic → Story" chip links to `/projects/[id]/plan`. Static text: it does not reflect which levels this project actually uses.

#### Main task row
- **Shows** (`tasks/page.tsx:340-515`): expand chevron, key, title (click → drawer), phase chip, epic chip, story title, "D/T subtasks done" (Done only), description (one line), start → due dates, "In progress …" pill, "Worked …", estimate pill, priority badge, status dropdown (+ board name when several boards), assignee avatar, "Add Subtask", trash.
- **"In progress today/Nd" pill:** whole days since the last move into In Progress (`daysInProgress`, `tasks/page.tsx:111-114`). Red when days > effective estimate (title "In progress longer than its N-day estimate"), blue otherwise (`tasks/page.tsx:435-446`).
- **"Worked Xh Ym":** timer minutes of the task and all its subtasks (`workedMinutes`, `tasks/page.tsx:116-117`); hidden when 0.
- **Estimate pill:** `estimateOf` (`tasks/page.tsx:118-119`): with subtasks = sum of subtasks' `estimatedDuration` (missing = 1 day each), shown with "(derived)"; without subtasks = the task's own `estimatedDuration` (default 3). Formatted by `formatDays` in the task's unit.

#### Subtask breakdown (when expanded; expanded by default)
- **Shows:** "Subtask Breakdown (N)" and a note "* Subtasks define detailed work and derive the parent task schedule without double-counting." Each subtask row: key, title, description, dates, estimate pill (`estimatedDuration` or 1 day), priority, status dropdown, avatar, trash (`tasks/page.tsx:518-613`).
- **Empty state:** "No subtasks added yet…" + "Add first subtask" link (`tasks/page.tsx:529-539`).

#### Empty list
- "No tasks found" with a "Create Main Task" button (`tasks/page.tsx:322-337`). Appears both when the project has no tasks and when filters hide all.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Main Task" (banner and empty state) (`tasks/page.tsx:211-218, 328-335`) | Opens Create Task modal (7.5) | — | — | — |
| Search box (`tasks/page.tsx:227-232`) | Matches main task title, key, description, or any subtask title (`tasks/page.tsx:142-146`) | none | No | — |
| "All Phases" (`tasks/page.tsx:243-254`) | Main task's `milestoneId` must match | none | No | — |
| "All Epics" (only if the project has epics) (`tasks/page.tsx:257-270`) | Main task's `epicId` must match | none | No | — |
| "Over estimate" checkbox (`tasks/page.tsx:273-276`) | Shows only tasks currently In Progress for more whole days than `estimateOf` (`tasks/page.tsx:121-124`) | none | No | Compares calendar days with estimated days |
| "All Statuses" (`tasks/page.tsx:279-290`) | Main task status only | none | No | — |
| "All Priorities" (`tasks/page.tsx:293-303`) | Main task priority only | none | No | — |
| "All Assignees" (`tasks/page.tsx:306-317`) | Main task assignee only (unlike the board, subtask assignees do not count) | none | No | — |
| Expand/collapse chevron (`tasks/page.tsx:362-373`) | Shows/hides subtasks | none | No | — |
| Main task title click (`tasks/page.tsx:380-385`) | Opens drawer | `activeTaskDrawerId` | No | — |
| Estimate pill (main task) (`tasks/page.tsx:454-470`) | Opens "Update Estimated Duration" modal with the task's **own** `estimatedDuration` | — | — | For a task with subtasks the pill shows the derived sum, but editing changes the task's own value, which is not what the pill displays |
| Status dropdown (main task) (`tasks/page.tsx:473-488`) | `move(task, placeIn(board, column))` — same as moving on the board | `updateTask` → `tasks`, `workSessions`, `taskStatusChanges`, project progress/timeline | Yes | "Subtasks still open" dialog when moving to Done with open subtasks (7.10) |
| "Add Subtask" (only when `structure.subtasks`) (`tasks/page.tsx:493-503`) | Opens Create Task modal in subtask mode | — | — | — |
| "Add first subtask" link (`tasks/page.tsx:532-538`) | Same as above | — | — | **Not** gated by `structure.subtasks`, so it shows even in projects that do not use subtasks |
| Trash (main task) (`tasks/page.tsx:506-513`) | Opens confirm dialog "Delete Main Task" | — | — | — |
| Subtask row click (`tasks/page.tsx:550-553`) | Opens drawer for the subtask | `activeTaskDrawerId` | No | — |
| Subtask estimate pill (`tasks/page.tsx:580-589`) | Opens the same estimate modal for the subtask | — | — | — |
| Subtask status dropdown (`tasks/page.tsx:592-596`) | `updateTask(subtask.id, {status})` | `tasks`, `workSessions`, `taskStatusChanges` | Yes | Same timer/parent rules as on the board |
| Subtask trash (`tasks/page.tsx:600-607`) | Opens confirm dialog "Delete Subtask" | — | — | — |
| Estimate modal: number + unit (`EstimateField`), "Cancel", "Save & Recalculate Timeline" (`tasks/page.tsx:641-690`) | Saves `estimatedDuration` (in days) and `durationUnit` when value > 0 | `updateTask` → `tasks`; project timeline recalculated | Yes | Toast "Estimate for KEY saved: …" |
| Confirm delete "Delete" (`tasks/page.tsx:695-711`) | `deleteTask(id)` | `tasks` (task + its direct subtasks removed), project progress/timeline (`app-context.tsx:977-998`) | Yes | Work sessions and status changes of deleted tasks are **not** removed (orphans; a running timer stays open) |

**Notes, limits and simulated parts**
- No permission check for create/edit/delete.
- The banner's hierarchy text is static.

---

### 7.5 Create Task / Add Subtask modal

**File:** `src/components/tasks/create-task-modal.tsx` (opened from the task list 7.4; also used by other screens, e.g. the Plan tab via `defaultEpicId`/`defaultStoryId`)
**Who can open it:** no check.
**Purpose:** Create a main task (with plan links) or a subtask of a given task.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Users (assignee) | `useApp().users` — **all users**, not just project members (`create-task-modal.tsx:43`) | default assignee = first user (`create-task-modal.tsx:65`) |
| Allowed date window | `subtaskWindow(parent)` or `taskWindow(planLinks)` (`src/lib/schedule.ts:71-85`) | date pickers limited to it |
| Project structure | `projectStructure(project)` | plan validation |

**Cards, widgets and lists**
- Header "Create Main Task" or "Add Subtask — Nested subtask under <parent title>".
- Window hint "Inside <parent>: start → end (length)" under the date fields (`WindowHint`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Title (required) | Error "Task title is required." / "Subtask title is required." | — | — | — |
| Description (optional) | — | — | — | — |
| Plan picker (main task only) (`create-task-modal.tsx:189-201`) | Choose phase / epic / story. Validation `taskLinksError` (`src/lib/structure.ts:69`): if the structure says tasks live in a level, one must be chosen, unless Backlog is allowed and all are empty | — | — | — |
| Time — main task: Estimate (number + days/weeks/months), Start date, Due date, Effort hours (`TaskTimeFields`, `EffortField`) | Typing an estimate with a start date sets the due date. Default estimate 5 days (2 for subtask) | — | — | Error "Estimated duration must be at least 1 day." if ≤ 0 |
| Time — subtask: Effort hours, Start, Due (`SubtaskTimeFields`) | Subtask length in days = days between dates (`daysFromDates`) | — | — | Effort rounds to 15 min, min 15 min |
| Status dropdown (To Do … Blocked) | Sets initial `status` | — | — | No `columnId`/`boardId` set: the card lands on the main board, first column of that stage |
| Priority, Assignee dropdowns | — | — | — | — |
| "Cancel" | Closes | none | — | — |
| "Save Task" / "Add Subtask" (`create-task-modal.tsx:76-122`) | Validates (title, estimate, dates inside window and end ≥ start, plan). Calls `addTask` | `tasks` (+ key `PROJ-N` or `PARENT-KEY-N`), project `progress` + timeline (`app-context.tsx:828-881`) | Yes | Toast "Task "…" created". No notification to the assignee, no activity log. Creating with status In Progress starts **no** timer and records **no** status change |

**Notes, limits and simulated parts**
- A subtask inherits only the parent's `milestoneId` (phase); epic/story links are not copied (`create-task-modal.tsx:99, 111`).

---

### 7.6 Create New Task page — `/projects/[projectId]/tasks/new`

**File:** `src/app/(workspace)/projects/[projectId]/tasks/new/page.tsx`
**Who can open it:** Any signed-in user (linked from the board's "New Task"). `notFound()` if the project does not exist (no `p-mvhmnblw` fallback here).
**Purpose:** Full-page task form with board placement, sprint, labels and checklist.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project members | `users` in `project.memberIds` | default assignee = first member (`new/page.tsx:60`) |
| Sprints | `sprints` for the project | |
| Main tasks (parent picker) | `tasks` of the project with no `parentId` | |
| Boards | `projectBoards(project)` | default placement = main board, first column |

**Cards, widgets and lists**
- Page header "Create New Task — Add a new task to <project>", window hint under dates.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to Tasks" / "Cancel" (`new/page.tsx:171-175, 449-453`) | Link to `/projects/[id]/tasks` | none | — | Form discarded |
| Task Title (required) | Error "Task title is required." | — | — | — |
| Description | — | — | — | — |
| "Initial Status" (`PlacementSelect`, grouped by board) (`new/page.tsx:220-227`) | Picks board + column | — | — | For a subtask only the column's stage is used |
| Priority / Assignee (project members, "Name (role)") | — | — | — | — |
| "Parent Main Task (Optional — Makes this a Subtask)" (only when `structure.subtasks`) (`new/page.tsx:263-281`) | Turns the form into a subtask form (plan picker hidden; Effort/Start/Due only) | — | — | — |
| Plan picker (main task) (`new/page.tsx:282-301`) | Same rule as 7.5 | — | — | — |
| Time fields (`new/page.tsx:305-340`) | Same as 7.5; default estimate 3 days | — | — | Error "Estimated duration must be a positive number of days." |
| "Sprint (Optional)" (`new/page.tsx:341-355`) | "Backlog (No Sprint)" or a project sprint | — | — | — |
| Labels input + "Add" (Enter works), "×" on a label (`new/page.tsx:359-397`) | Adds/removes labels; **starts with `['Frontend']` pre-filled** (`new/page.tsx:67`) | — | — | Duplicates ignored |
| "Subtasks / Checklist Items" input + "Add Item", trash (`new/page.tsx:400-444`) | Builds a **checklist** (not real subtasks), despite the label | — | — | — |
| "Create Task" (`new/page.tsx:100-159, 454-456`) | Validates, then `addTask` with placement (`placeIn`), plan links or parent phase, estimate/effort/dates, labels, checklist | `tasks`, project `progress` + timeline | Yes | Toast "Task/Subtask "…" created", then navigates to `/projects/[id]/tasks`. No timer even when placed In Progress |

**Notes, limits and simulated parts**
- "Subtasks / Checklist Items" only creates checklist rows inside the task.
- Hooks are declared after the early `return notFound()` (`new/page.tsx:48-71`); harmless in practice because `notFound()` throws, but it breaks React's rules of hooks.

---

### 7.7 Task Detail Drawer (global, opens over any workspace page)

**File:** `src/components/tasks/task-detail-drawer.tsx` (mounted once in `src/app/(workspace)/layout.tsx:61`; + `time-log.tsx`, `task-progress.tsx`, `task-journey.tsx`, `use-guarded-move.tsx`, `src/components/plan/plan-picker.tsx`, `src/components/shared/duration-fields.tsx`)
**Who can open it:** any signed-in user, from any screen that calls `openTaskDrawer(id)` (board, task list, plan, timeline, my-tasks, timesheet, reports, search, etc.). **No permission checks inside** — every role (including client/auditor) can edit, reassign, move and delete.
**Purpose:** View and edit everything about one task or subtask.

Open/close: `openTaskDrawer(id)` sets `activeTaskDrawerId`; `closeTaskDrawer()` clears it (`app-context.tsx:2559-2560`). `activeTaskDrawerId` is **not saved**, so the drawer is closed after refresh. The drawer renders nothing if the id is not found (`task-detail-drawer.tsx:54-57`).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Task, parent, subtasks | `tasks` | subtask = has `parentId` |
| Project, sprint, phase, reporter, assignee | `projects`, `sprints`, `milestones`, `users` | |
| Boards and placement | `projectBoards`, `placementOf` (`task-detail-drawer.tsx:68-69`) | |
| Journey | `taskJourney(...)` only when the project has 2+ boards (`task-detail-drawer.tsx:71`) | |
| Plan | `epics`, `stories`, `milestones`, `planOf` | |
| Time | `workSessions`, `taskStatusChanges` | Progress tab |

**Cards, widgets and lists**

#### Header
- Task key, project name, "SRS Generated" chip when `isSrsGenerated` (`task-detail-drawer.tsx:153-166`).

#### Parent banner (subtasks only)
- "Parent Task: KEY Title" + "View Parent Task →" (`task-detail-drawer.tsx:186-201`).

#### Attribute bar
- Status (label "Status · <board>" with 2+ boards), Priority, Estimate (task) / Effort (subtask), Assignee (`task-detail-drawer.tsx:204-280`). Under Status, "Timer runs on its subtasks" when the task has subtasks.

#### Dates row
- Start date, Due date (+ red "Overdue" chip when due < today and not Done/Review), Effort (task), "Subtasks: Xh planned" (sum of subtasks' effort) (`task-detail-drawer.tsx:283-331`). Date pickers limited to the parent window (`subtaskWindow` / `taskWindow`); a red message appears when outside (`WindowHint`).

#### Plan row
- Task: Plan picker (Phase → Epic → Story). Disabled with note "Moving tasks to another parent is turned off for this project." when `structure.allowMove` is false and the task is not in the Backlog (`task-detail-drawer.tsx:347-359`).
- Subtask: read-only "Plan Phase › Epic › Story (from PARENT-KEY)" (`task-detail-drawer.tsx:335-345`).

#### Tabs
- "Overview & Details", "Subtasks" (task; with "done/total" count) or "Checklist" (subtask), "Progress", "Comments (N)", "Files (N)", "Journey (N)" (only with 2+ boards) (`task-detail-drawer.tsx:364-431`). Default tab "Overview & Details"; the selected tab is remembered while the drawer component lives (it is not reset when another task opens).

#### Overview & Details tab
- Title and Description (editable), "Source SRS Specification" box (when `sourceDocumentName`), "Acceptance Criteria" box (when set), read-only meta grid: Sprint (or "Backlog (No Sprint)"), Story Points (or "Unestimated"), Reporter (or "Automated"), Created date; read-only Labels list "#tag" from `task.tags` (`task-detail-drawer.tsx:435-522`).

#### Subtasks / Checklist tab
- For a task (when `structure.subtasks` or it already has subtasks): "Hierarchical Subtasks (N)", "D of N done", rows (key, title, planned hours or estimate days, due, status dropdown, trash), add-subtask form (only when `structure.subtasks`) (`task-detail-drawer.tsx:527-649`). Empty: "No detailed subtasks created for this task yet…".
- For both: "Quick Checklist" with "D of N done", checkboxes, add form (`task-detail-drawer.tsx:652-694`).

#### Comments tab
- List of comments: author, board-name chip (the board the card was on at that moment, when 2+ boards; `boardNameAt`, `src/lib/task-journey.ts:68`), relative time, body. Empty: "No comments yet. Start the conversation!" (`task-detail-drawer.tsx:698-743`).

#### Files tab
- Read-only list of `task.attachments` strings, each labelled "Sample Spec" (hard-coded). Empty: "No mock attachments linked to this task." No upload (`task-detail-drawer.tsx:758-775`).

#### Progress tab and Journey tab
- See 7.8 and 7.9.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Backdrop click / X (`task-detail-drawer.tsx:145-148, 176-181`) | `closeTaskDrawer()` | `activeTaskDrawerId` | No | — |
| Trash (header) → "Delete Task KEY?" → "Delete Task" / "Cancel" (`task-detail-drawer.tsx:169-175, 780-805`) | `deleteTask(id)` then close | `tasks` (task + direct subtasks), project progress/timeline | Yes | Orphan work sessions/status changes remain |
| "View Parent Task →" (`task-detail-drawer.tsx:193-199`) | Opens the parent in the drawer | `activeTaskDrawerId` | No | — |
| Status — task (`PlacementSelect`) (`task-detail-drawer.tsx:218-226`, handler 73-85) | `move(task, placeIn(board, column))` + `addActivity('task.status.changed', "Moved to <col>" or "Moved to <board> · <col>")` | `tasks`, `workSessions`, `taskStatusChanges` (Yes); `auditLogs`/`activities` | Task/timer: Yes. Activity: **No — lost on refresh** | Activity is logged even if the "subtasks still open" dialog is then cancelled. Actor falls back to `u2` / "Marcus Webb" |
| Status — subtask (`SubtaskStateSelect`) (`task-detail-drawer.tsx:210-217`) | `updateTask(id, {status})` | `tasks`, `workSessions`, `taskStatusChanges` | Yes | No activity log; parent auto-start rule applies |
| Priority (`task-detail-drawer.tsx:235-244`) | `updateTask(id, {priority})` | `tasks` | Yes | — |
| Estimate (task) (`task-detail-drawer.tsx:256-262`) | `updateTask(id, {estimatedDuration, durationUnit})` on every change | `tasks`, timeline | Yes | — |
| Effort hours (subtask in the attribute bar; task in the dates row) (`task-detail-drawer.tsx:254, 316`) | `updateTask(id, {effortMinutes})` | `tasks` | Yes | Rounded to 15 min |
| Assignee (`task-detail-drawer.tsx:269-278`, handler 91-103) | `updateTask(id, {assigneeId})` + `addActivity('task.assigned')` | `tasks` (Yes); activity (**No**) | Mixed | Lists **all** users. No notification (unlike `reassignTask`). A running timer stays with the old person |
| Start date / Due date (`task-detail-drawer.tsx:302-312`) | `updateTask(id, {startDate, dueDate})`; for a subtask also `estimatedDuration = daysFromDates` | `tasks`, timeline | Yes | Out-of-window dates are still saved; only a red hint shows |
| Plan picker (task) (`task-detail-drawer.tsx:348-355`) | `setTaskPlan(id, links)` → `resolvePlan` fills linked levels (`app-context.tsx:1167-1174`) | `tasks` | Yes | No timeline recalculation in `setTaskPlan` |
| Tab buttons (`task-detail-drawer.tsx:365-430`) | Switch tab | none | No | — |
| Title input / Description textarea (`task-detail-drawer.tsx:440-457`) | `updateTask` on every keystroke | `tasks` | Yes | Empty title is allowed |
| Subtask row click (`task-detail-drawer.tsx:550-556`) | Opens the subtask in the drawer | `activeTaskDrawerId` | No | — |
| Subtask status dropdown (`task-detail-drawer.tsx:562-566`) | `updateTask(sub.id, {status})` | as above | Yes | Timer/parent rules |
| Subtask trash (`task-detail-drawer.tsx:567-574`) | `deleteTask(sub.id)` immediately, **no confirm** | `tasks` | Yes | — |
| Add subtask: title, assignee (all users), Effort/Start/Due, "Add Subtask" (`task-detail-drawer.tsx:585-645`) | Validates title (toast "Type a name for the subtask first.") and dates; `addTask({parentId, milestoneId of parent, status 'todo', priority 'medium', type 'subtask', …})` | `tasks` (key `PARENT-KEY-N`) | Yes | Toast "Subtask "…" added to KEY" |
| Checklist checkbox (`task-detail-drawer.tsx:666-671`) | Toggles `completed` | `updateTask(id, {checklist})` | Yes | — |
| Checklist "Add" (`task-detail-drawer.tsx:679-693`) | Adds item `chk-<ts>` (blank ignored) | `tasks` | Yes | — |
| Comment textarea + "Post Comment" (`task-detail-drawer.tsx:727-741`) | Appends `{authorId: current user or 'u2', body, createdAt}` | `updateTask(id, {comments})` | Yes | No notification, no activity log |

**Notes, limits and simulated parts**
- No role checks at all in the drawer.
- Files tab is display-only mock data ("Sample Spec").
- `addActivity` writes `auditLogs` and `activities`, which are not persisted.
- Changing the assignee here does not move or stop a running timer and does not notify anyone.

---

### 7.8 Drawer › Progress tab (Time log + "What actually happened")

**File:** `src/components/tasks/time-log.tsx`, `src/components/tasks/task-progress.tsx` (rendered at `task-detail-drawer.tsx:746-751`, only in the browser once `useNow()` has a value)
**Who can open it:** anyone who opens the drawer. Logging time for **another person** needs `canViewTeamTime(demoRole)` (`time-log.tsx:32`).
**Purpose:** Compare time worked with planned hours, log hours without a timer, and show actual start/finish against planned dates for the task and each subtask.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Time entries | `workSessions` for the task + its subtasks (`time-log.tsx:34-38`) | newest first |
| Status moves | `taskStatusChanges` (`actualSpan`, `src/lib/task-progress.ts:21`) | |
| Users | `users` | names/avatars |

**Cards, widgets and lists**

#### "Time worked" summary (`time-log.tsx:69-93`)
- **Shows:** "Xh Ym of Ph planned (N% over | N% under | Xh left)" or "· no planned hours set"; "Includes its N subtasks".
- **How it is calculated:** worked = Σ `sessionMinutes` of all entries (running ones up to now) (`time-log.tsx:39`). planned = task `effortMinutes` + Σ subtask `effortMinutes` (when it has subtasks) else task `effortMinutes` (`time-log.tsx:40-42`). over% = round((worked − planned)/planned × 100) (`time-log.tsx:43`). "% under" is shown only when the task is In Review/Done; otherwise "left" = planned − worked.

#### Time entries list (`time-log.tsx:121-141`)
- **Shows:** up to **12** most recent entries: avatar, name, date, subtask key (if subtasks), note, running icon, duration, source badge (web / agent / manual). No "show more".
- **Empty state:** "No time logged yet."

#### "What actually happened, compared with the plan" (`task-progress.tsx:197-213`)
- **Shows:** "KEY · <summary>" and, when actual days > the task's `estimatedDuration`, red "(Nd over)". For a task with subtasks: "D/N subtasks done · Xh worked (Ah on the task itself, Bh across subtasks)".
- **How it is calculated** (`actualSpan`, `task-progress.ts:21-48`): start = earliest of moves to In Progress and timer starts; end = last move to Review/Done (or last session end) only when status is Review/Done; days = whole days start→end (or now). Summary = "Done in Nd" / "<Stage> Nd" / "Done (no tracked activity)" / stage label, + "planned <estimate>", + per-person minutes (`task-progress.tsx:187-193`).

#### Plan vs actual bars (`task-progress.tsx:215-251`)
- **Shows:** one row per task/subtask: dashed outline = planned start→due; solid bar = actual start→end (or now while not To Do), coloured by status; red line = today; legend below.
- **How it is calculated:** the time axis spans all planned/actual dates and today, + 1 day (`task-progress.tsx:178-181`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Log time" (`time-log.tsx:92`) | Opens/closes the manual-time form | none | — | — |
| Hours field (`EffortField`) | Hours like 1.5; stored in minutes rounded to 15, min 15 | — | — | — |
| Day (date, max today) | — | — | — | — |
| "On" dropdown (only if subtasks) | Task itself or one subtask | — | — | — |
| "Person" dropdown (only `canViewTeamTime`) | Log for any user; otherwise always yourself | — | — | — |
| Note input | Optional | — | — | — |
| "Cancel" | Closes the form | none | — | — |
| "Save time" (`time-log.tsx:47-66`) | Validates: hours entered ("Enter the hours worked first."), ≤ 24 h ("One entry can be at most 24 hours."), not a future day. Calls `logManualTime(target, minutes, date, note, person)` | `workSessions` (+ a closed `manual` session; `app-context.tsx:1879-1893`) | Yes | Toast "Xh logged on KEY [for Name]". Does not change task status |

**Notes, limits and simulated parts**
- Manual entries always start at **09:00 local time** on the chosen day (`app-context.tsx:1880`), so they may overlap real timer sessions; nothing checks for overlaps or double counting.
- A manual entry on a To Do task makes Reports and `actualSpan` treat the task as "started" at 09:00 that day (start includes session starts).

---

### 7.9 Drawer › Journey tab

**File:** `src/components/tasks/task-journey.tsx` + `src/lib/task-journey.ts`
**Who can open it:** shown only when the project has 2+ boards (`task-detail-drawer.tsx:71, 418`).
**Purpose:** Show which boards the card has been on, who moved it there, who worked on it on each board, comments and Done events.

**Cards, widgets and lists**

#### Journey timeline
- **Shows:** per stage: board name (italic grey "Removed board" if deleted), "from → to/now", "Moved here by <name> (<agent>)", "Worked on by <agent for> Name (Xh)" or "No time logged here", "· timer running" (current stage only), "N comments", "Done on <date> by <name>" (`task-journey.tsx:24-84`).
- **How it is calculated** (`taskJourney`, `task-journey.ts:28-66`): stages are built from status-change records that have `toBoardId`, starting at the task's `createdAt` on its first board. Sessions and comments are placed in a stage by their start/creation time. Workers grouped by person + source, most minutes first. "Done" = last move to Done inside the stage.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| (none) | Read-only | — | — | — |

**Notes, limits and simulated parts**
- Board moves made by column/board edits (`relayoutProject`) are also recorded and appear here.

---

### 7.10 "Subtasks still open" dialog (`useGuardedMove`)

**File:** `src/components/tasks/use-guarded-move.tsx` (used by the board, the task list and the drawer)
**Who can open it:** appears automatically.
**Purpose:** When a task is moved to a Done-stage column while some subtasks are not Done, ask what to do.

**Cards, widgets and lists**
- Title "N subtask(s) is/are still open", description "KEY is moving to Done.", and the list of open subtasks (key + title) (`use-guarded-move.tsx:35-51`). "Open" = status not Done (`openSubtasks`, `src/lib/subtasks.ts:17`), so In Review counts as open.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Cancel" / X | Nothing moves | none | — | In the drawer, the activity "Moved to …" was already logged |
| "Only move the task" | `updateTask(task, placement)` | `tasks`, `workSessions`, `taskStatusChanges` | Yes | Subtask timers keep running |
| "Move subtasks to Done too" | `updateTask(sub, {status:'done'})` for each open subtask, then moves the task | as above | Yes | Each In Progress subtask's timer stops as "finished" |

---

### 7.11 Reassign Task dialog

**File:** `src/components/collaboration/reassign-task-dialog.tsx` (only used on `/teams/workload`, `src/app/(workspace)/teams/workload/page.tsx:359-365`)
**Who can open it:** whoever can reach the Workload page (Teams area; see that section for the `FEATURES.teams` flag behaviour). No permission check in the dialog.
**Purpose:** Pick a new assignee for a task.

**Cards, widgets and lists**
- Task box: key, title, "Points: N pts" (falls back to **3** when the task has no points — hard-coded), priority, status (`reassign-task-dialog.tsx:84-92`).
- "Current Assignee" box (or "Unassigned").
- "New Assignee" list of **all** users with title/role and department.
- Success banner "Task reassigned to <name>! Workload metrics updated." for 0.6 s.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| User row | Selects the new assignee | none | — | Initial selection is `users[0]`, because the dialog is mounted before a task is chosen (`reassign-task-dialog.tsx:24`) |
| "Confirm Reassignment" (disabled when the selection is the current assignee) (`reassign-task-dialog.tsx:32-47`) | `reassignTask(taskId, userId)`; after 600 ms closes | `tasks.assigneeId` (Yes); `notifications` + "New task assigned to you" for the new person (Yes); `auditLogs`/`activities` "reassigned task" (**No — lost on refresh**) (`app-context.tsx:1227-1259`) | Mixed | Toast. Does not touch running timers |
| "Cancel" / X / backdrop | Closes | none | — | — |

---

### 7.Y Task and timer state machine (as implemented)

**Task statuses (the only five):** `todo`, `in_progress`, `review`, `done`, `blocked` (`src/types/index.ts:181`). Labels: To Do, In Progress, In Review, Done, Blocked (`TASK_STAGES`, `src/lib/board-columns.ts:8-14`). Board columns are free-named, but each column "counts as" one of these five (`BoardColumn.status`); a card's status is always its column's stage (`placeIn`, `board-columns.ts:97`). Every board must keep at least one column for To Do, In Progress, In Review and Done (`REQUIRED_STAGES`, `board-columns.ts:17`); Blocked is optional.

**Transitions:** in the web app any stage can go to any other stage (drag, "Move:" dropdown, status dropdowns, column edits). There is no enforced order and no permission check. The only guard is the "subtasks still open" dialog when a task with open subtasks goes to Done (7.10). The simulated AI agents (`app-context.tsx:1791-1878`) follow a narrower path: start = To Do → In Progress, finish = → In Review.

**Difference from the old inventory claim "Backlog/To Do → In Progress → In Review → Done, Blocked":**
- There is **no "Backlog" status**. "Backlog" means two other things: (a) a task with no phase/epic/story link (`inBacklog`, `src/lib/structure.ts:66`; allowed only when the project structure has `backlog`), and (b) "Backlog (No Sprint)" = no sprint. Both kinds of task still have status To Do (or any other).
- The flow is **not linear**: any move is allowed in the web UI, including Done → To Do.
- Column names are customisable (e.g. "QA Testing" counting as In Progress), but the stage set is fixed at the five above.
- Blocked is a real status but not a required column; if a board has no Blocked column, blocked cards show in the first column (`columnOfTask` fallback, `board-columns.ts:45-50`).

**What a "timer" is:** a `WorkSession` `{userId, taskId, startedAt, endedAt?, lastActivityAt, source: 'web'|agent|'manual', endReason?, needsReview?, note?}` (`src/types/index.ts:541-554`). Running = no `endedAt`. There is **no Start/Stop timer button** in the web UI; web timers start and stop only as a side effect of status changes. Every status change is also stored as a `TaskStatusChange` `{from, to, at, byUserId, via, fromBoardId?, toBoardId?}` (`src/types/index.ts:557-569`; created by `statusChange`, `app-context.tsx:122-130`).

**Which actions run the rules:** `updateTask` runs `trackStatusMove` when the status changes or the board changes (`app-context.tsx:942-953`). `relayoutProject` (used by `setBoardColumns`, `setBoardMirroring`, `deleteBoard`) runs it for each card whose stage or board changes (`app-context.tsx:203-205`). `addTask`/`addTasks` do **not** run it (`app-context.tsx:828-941`).

| # | Rule | Exact behaviour | Code |
|---|---|---|---|
| 1 | **Start (web)** | When a task moves **to In Progress**, and it has no subtasks, and its *worker* has no open session on it: every open session of the worker is closed (`endReason: 'switched_task'`), and a new `web` session opens. The worker is the task's **assignee**, or the current user if unassigned — so moving someone else's card starts *their* timer and pauses *their* other timer. | `app-context.tsx:144, 153-162` |
| 1a | **Start (agent, simulated)** | `agentStartTask`: refuses tasks with subtasks; closes the current user's open session (`switched_task`), opens a session with `source` = agent, moves To Do → In Progress (no `columnId` change), runs rule 6. Only called from the demo page `/ai-agents/how-it-works`. | `app-context.tsx:1797-1820` |
| 2 | **One timer per person** | Starting any timer closes all other open sessions of that person (rules 1, 1a). | `app-context.tsx:157-158, 1811` |
| 3 | **Pause (leave In Progress)** | When a task moves **from In Progress** to To Do or Blocked, **all** open sessions on that task (any person) close with `endReason: 'paused'`. Agent `agentPauseTask` closes the current user's open session as `paused` without changing status. | `app-context.tsx:147-151, 1841-1852` |
| 4 | **Finish** | From In Progress to **In Review or Done** → open sessions on the task close with `endReason: 'finished'`. `agentFinishTask` closes the current user's session on the task as `finished`, sets status Review, and adds the summary as a comment "(via <agent>)". | `app-context.tsx:148, 1853-1878` |
| 5 | **Board move split** | Moving a card to another board while it is In Progress closes its sessions (`paused`, or `finished` if the target stage is Review/Done) and, if the target stage is still In Progress, opens a new session — so time is split per board. The move is stored with `fromBoardId`/`toBoardId` and feeds the Journey tab. Dropping on a board header sends the card to that board's To Do column (so the timer pauses). | `app-context.tsx:132, 147, 202-205, 946`; `board/page.tsx:460, 477` |
| 6 | **Subtask / parent** | A task with subtasks is a "container": moving it to In Progress starts **no** timer (`hasSubtasks`). When a **subtask** moves to In Progress and its parent is in **To Do**, the parent moves to the first In Progress column of its board and gets a status-change record (no timer). Parent in Blocked/Review/Done is not touched. Timer badges, "Worked", Time log and Reports add subtask time to the parent. Nothing moves the parent automatically when subtasks finish; the board offers an "All subtasks done · Move to In Review" button (7.1). Moving the parent to Review/Done does **not** stop running subtask timers (rule 3/4 only closes sessions on the parent's own id). | `app-context.tsx:153-155, 219-235, 951-953`; `src/lib/subtasks.ts:13`; `card-subtasks.tsx:127-135` |
| 7 | **Idle cutoff** | Every 60 s (and once at load) `applyAutoStops` checks every open session. Idle limit = `lastActivityAt + agentSettings.idleTimeoutMinutes` (default **120 min**, `src/data/mock-agent-activity.ts:181`). When passed (and earlier than the day cutoff), the session ends **at `lastActivityAt`** (never before its start), `endReason: 'idle_timeout'`, `needsReview: true`, and a `system` agent event "No activity for 2h, stopped at the last activity time. Please check." is added. Activity: any `pointerdown`/`keydown` in the app (throttled to once a minute) updates `lastActivityAt` of the **current user's open `web` session only**. Agent sessions get activity from `agentContinueTask`/`agentAddNote`. So a web timer started for another person (rule 1) gets no activity and will auto-stop at its start time, with 0 minutes. | `app-context.tsx:588-618`; `src/lib/task-time.ts:21-52` |
| 8 | **Day cutoff** | Shift end = `agentSettings.dayCutoff` (default **"20:00"**, `mock-agent-activity.ts:182`) on the local day the session started; if the session started after the cutoff, the shift ends at midnight. When reached before the idle limit, the session ends **at the cutoff**, `endReason: 'day_cutoff'`, `needsReview: true`, event "Shift ended at 20:00, timer stopped. Please check." | `src/lib/task-time.ts:10-28, 42-49` |
| 9 | **Manual log** | `logManualTime(taskId, minutes, date, note, userId)` adds a closed session, `source: 'manual'`, starting **09:00 local** on `date`, ending start + minutes, `endReason: 'paused'`. No status change, no overlap check. UI limits: > 0, ≤ 24 h, not a future day; other people only with `canViewTeamTime`. Also used by the Timesheet page. | `app-context.tsx:1879-1893`; `time-log.tsx:47-66` |
| 10 | **Correct an auto-stopped timer** | `updateWorkSession(id, updates)` merges fields; used only on `/teams/timesheet` to set a corrected end time and/or clear `needsReview`. | `app-context.tsx:1898-1901`; `src/app/(workspace)/teams/timesheet/page.tsx:178, 188` |
| 11 | **Not covered** | No timer change when: a task is created already In Progress (`addTask`); moving between two columns of the same stage on the same board; changing the assignee (`updateTask` assignee or `reassignTask`) — the running session stays with the old person; deleting a task (its open session stays open as an orphan until rule 2, 7 or 8 closes it). | `app-context.tsx:828-881, 948, 977-998, 1227-1259` |

**How minutes are counted:** `sessionMinutes(start, end ?? now)` = rounded whole minutes, never negative (`src/lib/agent-connection.ts:381-384`). Live displays use `useNow()`, which ticks every **30 s** and is `null` during server render (`src/lib/use-now.ts:14-31`).

**Project progress after any task change:** `progressOfTasks` (`src/lib/subtasks.ts:47-53`) = Σ estimated days of Done "leaf" items (tasks without subtasks, and subtasks) ÷ Σ estimated days of all leaf items × 100, rounded; each item weighs at least 1 day. Then `calculateProjectTimeline` re-runs (`app-context.tsx:866-874, 958-968`).

**Task keys:** `nextTaskKey` (`app-context.tsx:241-255`): main task = `<project key>-<highest number + 1>` (project key fallback `TASK`); subtask = `<parent key>-<highest + 1>` (e.g. `FSV2-105-3`). `addTasks` hands keys out one by one so a batch never repeats a key (`app-context.tsx:884-891`).

**Plan re-linking:** `relinkTasks` (`app-context.tsx:258-260`) re-runs `resolvePlan` on tasks linked to an epic/story after that epic/story is edited or deleted (`app-context.tsx:1093, 1099, 1122`), so a task's phase/epic/story links stay consistent.

---

### 7.Z Data flow summary for this area

- **Reads:** `projects` (boards, columns, structure, members), `tasks`, `users`, `milestones`, `epics`, `stories`, `sprints`, `workSessions`, `taskStatusChanges`, `agentSettings` (auto-stop), `demoRole`, `currentUserId`, `activeTaskDrawerId`.
- **Writes (saved):** `tasks`, `projects` (board layout, `progress`, timeline fields), `workSessions`, `taskStatusChanges`, `notifications` (reassign only), `agentEvents` (auto-stop events).
- **Writes (NOT saved — lost on refresh):** `auditLogs` / `activities` (drawer status/assignee changes, `reassignTask`), `activeTaskDrawerId`. All filters, folded boards, drafts and open forms are component state.
- **Store actions used:** `addTask`, `addTasks` (keys only), `updateTask`, `deleteTask`, `reassignTask`, `setTaskPlan`, `addActivity`, `setBoardColumns`, `addBoard`, `renameBoard`, `moveBoard`, `setBoardMirroring`, `deleteBoard`, `logManualTime`, `updateWorkSession` (timesheet), `openTaskDrawer`, `closeTaskDrawer`; internal helpers `trackStatusMove`, `startParentOf`, `relayoutProject`, `nextTaskKey`, `relinkTasks`; background `applyAutoStops` every 60 s plus the pointer/key activity listener.

---

## 8. Project files, SRS-to-task generation and reports

This section covers the **Files** tab of a project (adding files, sorting them into categories, and turning an "SRS" file into tasks), and every **report** screen: the project Reports tab (Overview, Timeline, Task time), the company-wide `/reports` and `/reports/task-time` pages, and the Agreements `/agreements/reports` page.
Two things matter most. **(1) No file is ever really uploaded.** The "upload" form only saves a name, a format, a category and a size you type yourself. **(2) "Analyze SRS" does not read the file.** It always returns the same 6 hard-coded tasks about e-signatures, whatever file you pick.
The project reports, on the other hand, are **real calculations** from tasks, status changes and timer sessions. The company-wide `/reports` page is mostly **hard-coded chart data**.

> **About roles:** after sign-in, `src/context/app-context.tsx:622-672` sets `demoRole` from the signed-in account (`executive`→`ceo`, `qa`→`qa_tester`, otherwise the same name) and sets `currentUserId` to that account. **None of the screens in this section check the role or any permission.** Every signed-in user sees the same buttons and can use all of them. Where the role is used at all, it is only indirect: `addTasks` sets `reporterId` to `currentUserId`.

---

### 8.1 Project Files — `/projects/[projectId]/files`

**File:** `src/app/(workspace)/projects/[projectId]/files/page.tsx` (+ `src/components/projects/project-header-nav.tsx`, `document-classification-modal.tsx`, `srs-action-modal.tsx`, `generated-tasks-review-modal.tsx`, `srs-generated-tasks-modal.tsx`, `src/lib/srs-analysis.ts`)
**Who can open it:** Any signed-in user, through the workspace layout guard. No role or permission check. If the project id is not found, the page shows Next.js `notFound()` (`files/page.tsx:90`).
**Purpose:** Lists the files attached to one project. From here you can add a "mock" file, set its category (SRS / Test Report / DOC / Other), preview it, delete it, and for SRS files run the simulated "Analyze & Create Tasks" flow.

**What is stored about a file (no file content is kept):** `ProjectFile` (`src/types/index.ts:249-262`) has only these fields: `id`, `name`, `type` (format text), `size` (free text such as "2.4 MB"), `projectId`, `taskId?`, `uploadedBy`, `createdAt`, `category?`, `analysisStatus?` (`not_analyzed | analyzed | tasks_created`), `analyzedAt?` and `tasksGeneratedCount?`. There is **no file input and no bytes, Blob, URL or text content anywhere**. The size is whatever the user types.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project | `useApp().projects` (seed `MOCK_PROJECTS`, `src/data/mock-data.ts`) | Special case: if the URL id is `p-mvhmnblw` and that project is missing, it falls back to `p1` (`files/page.tsx:86-88`) |
| Files | `useApp().files` (seed `MOCK_PROJECT_FILES`, `src/data/mock-data.ts:766-777`, 10 files) | Filtered by `projectId === urlId` or `effectiveId`. `effectiveId` becomes `p1` when the id is `p-mvhmnblw` and no file belongs to it (`:92-99`). This is a hard-coded alias, because seed project `p-mvhmnblw` is a copy of `p1` (same name "Flash Sign v2.0", same key `FSV2`) |
| Tasks | `useApp().tasks` | Used only as `tasks.length` to build keys for SRS tasks (`:193`) |
| Users | `useApp().users` | Uploader avatar and name in grid view |
| SRS history | `useApp().srsTaskHistories` (seed `INITIAL_SRS_TASK_HISTORY`, `mock-data.ts:779`) | A map from file id to records. The seed has 6 records for `f1`: 4 accepted (1 of them edited) and 2 rejected (1 of them edited) |

**Cards, widgets and lists**

#### Page header
- **Shows:** the title "Project Assets & Documentation" and the line "`N` files attached to `<project name>` • Click any file to classify or analyze SRS".
- **Data source:** `projectFiles.length` (`:373`).
- **How it is calculated:** the number of the project's files **before** search and filters are applied.

#### Files list (list view, the default)
- **Shows:** a table with the columns File Name (icon + name), Document Type (category badge), Format (`file.type` upper-cased), File Size (`file.size` text), Analysis Status (badge), Uploaded Date (`formatDate(createdAt)`) and Actions.
- **Data source:** `filteredFiles` (`:101-110`).
- **How it is calculated:** a file stays in the list only if all three tests pass:
  - search: the file name contains the search text, or the category **id** (such as `test_report`) contains it. Both sides are lower-cased.
  - format filter: `file.type` equals the chosen format (lower-cased), or the filter is "all".
  - category filter: "all"; or "unclassified", which means the file has no category; or the file's category equals the chosen one.
  The list keeps store order. New files are added at the front (`addFile`).
- **Icon by format** (`:271-283`): pdf shows a red document icon, figma an image icon, csv/xlsx a spreadsheet icon, anything else a code icon.
- **Category badge** (`:285-318`): SRS (green), TEST REPORT (blue), DOC (amber), OTHER (grey), or a dashed "Unclassified" badge.
- **Analysis Status badge** (`:320-351`): `tasks_created` shows a green **clickable** "Tasks Created" pill that opens the history modal (8.7). `analyzed` shows "Analyzed", but **no code ever sets this value** (searching the whole `src` folder finds it only here). Anything else shows "Not Analyzed".
- **Empty state:** an `EmptyState` with the title "No files found", the text "Upload blueprints, specs, and mockups for this project." and an "Upload File" button (`:449-464`).

#### Files grid (grid view)
- **Shows:** one card per file with the format icon, Preview / Change classification / Delete icon buttons, the category badge and status badge, the name, "FORMAT • size", an SRS action button (SRS files only), the uploader avatar and name ("User" if not found), and the upload date.
- **Data source:** the same `filteredFiles`. The uploader comes from `users.find(u => u.id === file.uploadedBy)`.
- **Empty state:** the same as the list view.

#### Floating success toast
- **Shows:** a dark message box at the top right with a check icon.
- **How it works:** a **local** `toastMessage` state that hides after 4.5 s (`:79-84`). It does not use the shared `notify()` toaster.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Project header tabs / "+ New" menu | See the project-header section. "+ New → Upload file" goes to `?create=upload`, which opens the upload dialog (`:55`, `new-menu.tsx:88`) | — | — | — |
| Search box "Search files or categories…" | Filters as the user types (name or category id) | none (local state) | No (resets) | — |
| Category filter dropdown | All Categories / SRS Specifications / Test Reports / Documents (DOC) / Other Assets / Unclassified | none | No | — |
| Format filter dropdown | All File Formats / PDF / Figma / CSV/Data / Code/JSON. There is **no** option for `doc`, `image`, `archive` or `xlsx`, so those files only show under "All" | none | No | — |
| List view / Grid view toggle | Switches the layout | none | No | — |
| "Upload File" button (header and empty state) | Opens the "Attach Mock File" dialog (8.2) | none | — | — |
| Click a list row or grid card | Opens the Classify Document modal (8.4) for that file | none | — | — |
| "Analyze SRS" (list) / "Analyze SRS & Create Tasks" (grid). Only for SRS files that are not `tasks_created` | Opens the SRS Document Workflow modal (8.5) | none | — | — |
| "View Tasks" (list) / "View Generated Tasks" (grid) / "Tasks Created" badge. Only for SRS files that are `tasks_created` | Opens the history modal (8.7) | none | — | — |
| "Change Type" (list) / file-type icon (grid) | Opens the Classify Document modal | none | — | — |
| Eye icon (Preview) | Opens the preview modal (8.3) | none | — | — |
| Trash icon (Delete File) | Calls `deleteFile(file.id)` **right away, with no confirmation and no toast** | `files`: the file is removed (`app-context.tsx:1198`) | Yes | None. The file's `srsTaskHistories` entry is **not** removed. Tasks made from it keep `sourceDocumentId` pointing to a file that no longer exists |

**Notes, limits and simulated parts**
- No real upload. The bytes of a file are never read or stored. "Preview" shows only the stored metadata.
- `uploadedBy` for new files is set to **`project.ownerId`**, not the signed-in user (`:123`).
- The `analyzed` status is never set. The `tasksGeneratedCount` field is written but never shown on this page.
- The `p-mvhmnblw` → `p1` fallback is a hard-coded workaround for a duplicate seed project.
- Delete has no confirmation and no undo.

---

### 8.2 "Attach Mock File" dialog (upload) — on `/projects/[projectId]/files`

**File:** `files/page.tsx:680-767`
**Who can open it:** Any signed-in user. It opens from "Upload File" or from `?create=upload` in the URL.
**Purpose:** Creates a file **record** with values the user types. No real file is picked.

**Cards, widgets and lists**

#### Form fields
- **Shows:** File Name* (text), Format (select), Document Category (select), File Size (free text).
- **Defaults:** name empty, format `pdf`, category `srs`, size `"2.4 MB"` (`:74-77`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| File Name input | Required (HTML `required`). Spaces at the ends are trimmed. An empty name stops the save (`:114`) | — | — | — |
| Format select | PDF Document (`pdf`) / Figma Design (`figma`) / CSV Spreadsheet (`csv`) / JSON / Code (`code`) / DOC Word Document (`doc`) | — | — | — |
| Document Category select | SRS Specification / Test Report / Document (DOC) / Other | — | — | — |
| File Size input | Free text. Not checked at all (any text is accepted) | — | — | — |
| "Attach File" (submit) | Calls `addFile({name, projectId, size, type, category, analysisStatus:'not_analyzed', uploadedBy: project.ownerId, createdAt: now})` | `files`: a new record is added at the front with id `file-<timestamp>` (`app-context.tsx:1177-1193`) | Yes | Local toast `File "<name>" uploaded successfully.` Only the name is reset. Format, size and category keep the last values. The dialog closes and `?create=upload` is removed from the URL |
| "Cancel" / X / backdrop | Closes the dialog. If the URL had `?create=upload`, it is replaced by the plain path | none | — | — |

**Notes, limits and simulated parts**
- The dialog title itself says "Mock File" and "demonstration file attachment". This is clearly a simulation.
- Choosing category SRS here does **not** start the analysis. You must click "Analyze SRS" afterwards.

---

### 8.3 File preview modal — on `/projects/[projectId]/files`

**File:** `files/page.tsx:769-816`
**Who can open it:** Any user, from the eye icon.
**Purpose:** Shows the file's metadata. It does **not** show any content.

**Cards, widgets and lists**

#### Preview body
- **Shows:** the category badge, the file name, and the text "Demonstration preview for **TYPE** (size). Classification: **CATEGORY or UNCLASSIFIED**.", plus "Uploaded <date>".
- **Data source:** the chosen `ProjectFile` object.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Classify Document" | Closes the preview and opens the Classify modal (8.4) | none | — | — |
| "Close Preview" / X | Closes the modal | none | — | — |

---

### 8.4 Classify Document modal

**File:** `src/components/projects/document-classification-modal.tsx`. Its callback is `handleConfirmClassification` in `files/page.tsx:136-160`.
**Who can open it:** Any user, by clicking a file row or card, "Change Type", or "Classify Document" in the preview.
**Purpose:** Sets the file's category. Choosing SRS moves on to the SRS workflow.

**Cards, widgets and lists**

#### File details banner
- **Shows:** the name, type, size and upload date, plus a "Current Type" badge if the file already has a category (`:113-158`).

#### Category options (4 radio cards)
- **Shows:** SRS, Test Report, Document (DOC) and Other. Each card has a title, badge, description and "feature" chips. All of this is static text from the `CATEGORIES` constant (`:37-78`). The SRS card says plainly "Simulated AI Task Generation".
- **Default selection:** the file's current category, or `srs` if it has none (`:86-88`).

#### Footer hint
- **Shows:** "Continuing will open the SRS Analysis & Task Creation flow" when SRS is selected. Otherwise it shows "Document will be saved with the selected classification".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Category card (click, or Enter/Space) | Selects the category (local state) | none | — | — |
| "Continue" | Calls `updateFile(id, {category, analysisStatus: current or 'not_analyzed'})`. If the category is SRS, it opens the SRS Workflow modal (8.5). Otherwise it shows the toast "Document classified as <name> successfully." | `files` (category) | Yes | Toast (not for SRS) |
| "Cancel" / X / backdrop | Closes the modal, nothing saved | none | — | — |

**Notes, limits and simulated parts**
- The category is saved **before** the SRS modal opens. If you then press "Cancel" in the SRS modal, the file stays marked as SRS.
- Changing an analysed SRS file to another category keeps `analysisStatus: 'tasks_created'`. The SRS buttons disappear (they only show for `category === 'srs'`), but the clickable "Tasks Created" badge still shows.
- You can re-classify an already-analysed file as SRS. That opens the SRS modal again, which lets you **re-run the analysis** (see 8.6, history is overwritten).

---

### 8.5 SRS Document Workflow modal ("Analyze & Create Tasks")

**File:** `src/components/projects/srs-action-modal.tsx`. Its callbacks are `handleSrsSaveOnly` and `handleStartAnalysis` in `files/page.tsx:162-182`. The generator is in `src/lib/srs-analysis.ts`.
**Who can open it:** Any user. It opens from "Analyze SRS" or after choosing SRS in the Classify modal.
**Purpose:** Lets you save the SRS category only, or "analyze" the SRS to get suggested tasks.

**How "Analyze" really works (exact):**
1. Clicking "Analyze & Create Tasks" sets `isAnalyzing = true`. A **fake progress animation** then runs through 4 hard-coded step messages ("Parsing SRS document structure & sections...", "Extracting functional requirements & user stories...", "Synthesizing acceptance criteria & priority tags...", "Preparing suggested tasks for review..."). Each step lasts 350 ms, and there is a final 400 ms wait, so about **1.45 s** in total (`srs-action-modal.tsx:33-56`).
2. Then it calls `onStartAnalysis()`, which calls `generateSuggestedTasksFromSrs(file.name, project.name, project.key)` (`files/page.tsx:174-178`).
3. `generateSuggestedTasksFromSrs` (`src/lib/srs-analysis.ts:28-137`) **does not use any of its three arguments**. It does not read the file (there is no content to read). It does no keyword parsing and no AI call. It **always returns the same 6 hard-coded tasks** about the e-signature product. Only the ids are made unique (`sugg-<timestamp>-1..6`):

| # | Title | Type | Priority | Points | Source section (fake) | Tags |
|---|---|---|---|---|---|---|
| 1 | Multi-Party Cryptographic Signature Verification | story | critical | 5 | SRS §3.1.4 | security, cryptography, srs-generated |
| 2 | HTML5 Signature Canvas Biometric Stroke & Pressure Capture | task | high | 3 | SRS §4.2 | frontend, canvas, srs-generated |
| 3 | Automated Multi-Channel Signer Reminder & Escalation Queue | story | medium | 3 | SRS §5.3.1 | notifications, backend, srs-generated |
| 4 | SOC 2 & HIPAA Tamper-Evident Audit Certificate PDF Appendix | task | critical | 5 | SRS §6.1 | compliance, audit, srs-generated |
| 5 | Smart Field Anchor Auto-Detection for PDF Placeholders | story | high | 3 | SRS §2.4 | ai-engine, pdf-processing, srs-generated |
| 6 | Mobile Responsive Signer Interface with Offline State Cache | task | medium | 2 | SRS §7.2 | mobile, offline, srs-generated |

   Each task also has a fixed description and a fixed 3-line acceptance criteria text. The `original*` copies of the fields are filled in, and `isEdited` starts as false.
4. The SRS modal closes and the Review modal (8.6) opens with these 6 tasks.

So an SRS for **any** project (for example "ACME Corp Integration") gets the same FlashSign e-signature tasks.

**Cards, widgets and lists**

#### File card
- **Shows:** the name, the type, the size (or `'3.5 MB'` if the size is empty, a hard-coded fallback at `:97`) and an "SRS" badge.

#### "What happens during analysis?" box
- **Shows:** 3 static bullet points that describe parsing. These claims are **not true** (see above).

#### Progress panel (only while analysing)
- **Shows:** a spinner, the text "Analyzing SRS and generating suggested tasks…", a progress bar (`(step+1)/4 × 100%`) and the current step message.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Cancel" / X / backdrop / Esc | Closes. All of these are disabled while analysing (`:68-71`) | none (but the category was already saved in 8.4) | — | — |
| "Save" | `updateFile(id, {category:'srs', analysisStatus: current or 'not_analyzed'})` and then closes | `files` | Yes | Toast "SRS classification saved successfully." |
| "Analyze & Create Tasks" | Runs the fake 1.45 s animation, then builds the 6 canned tasks and opens the Review modal | none yet | — | — |

---

### 8.6 Review Generated Tasks modal

**File:** `src/components/projects/generated-tasks-review-modal.tsx`. Its callback is `handleAcceptRemainingTasks` in `files/page.tsx:184-269`.
**Who can open it:** It opens only after "Analyze & Create Tasks".
**Purpose:** Lets the user edit or reject each suggested task, then create the accepted ones as real tasks and save an audit history.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Suggested tasks | `srsSuggestedTasks` (page state from `generateSuggestedTasksFromSrs`) | Copied into local state. Edits live only in this modal until you accept |
| Project, file | props | For the header chips |

**Cards, widgets and lists**

#### Header
- **Shows:** "Review Generated Tasks", an "`N` Generated" pill, an "SRS Source: <file>" chip, a "Target Project: <project>" chip, and a "Simulated AI Extraction" label (`:186-188`).

#### Filter tabs bar
- **Shows:** "All Suggestions (N)", "Ready to Accept (accepted)", "Excluded (rejected)", and the text "`accepted` of `N` tasks will be created in To Do".
- **How it is calculated:** accepted = tasks with `!isRejected`, rejected = tasks with `isRejected`.

#### Task cards
- **Shows:** a type chip, a priority badge, "Suggested: To Do", an "Edited" badge if edited, and an "Excluded from Acceptance" badge if rejected. Then the title (struck through if rejected), the description, the acceptance criteria box, "Source: <section>" and #tags.
- **Empty state:** "No tasks match this filter."

#### Inline editor (when editing a card)
- **Shows:** Task Title*, Priority (critical/high/medium/low), Task Type (story/task/bug/epic), Description and Acceptance Criteria.
- **How "Edited" is worked out** (`:92-118`): the task is marked edited if, after trimming, the title, description, acceptance criteria, priority or type differs from its `original*` value. Once a task is edited, it stays edited (`isModified || t.isEdited`). An empty title keeps the old title.

#### Footer summary
- **Shows:** Total Suggested, Accepted for Creation and Rejected counts. If 0 are accepted, it also shows the warning "All tasks rejected. None will be added to project."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Tabs All / Ready to Accept / Excluded | Filters the cards | none (local) | — | — |
| "Edit" | Opens the inline editor with the current values | none | — | — |
| Editor inputs (title, priority, type, description, criteria) | Change the local edit state | none | — | — |
| "Save Changes" | Updates the task in local modal state and sets `isEdited` | none (local) | No, until accepted | — |
| "Cancel" (editor) | Leaves the editor without saving | none | — | — |
| "Reject" | Sets `isRejected = true` and `rejectionReason = 'Excluded during SRS analysis review.'` | none (local) | — | — |
| "Restore" | Sets `isRejected = false` and clears the reason | none (local) | — | — |
| "Accept `N` Tasks" (when at least 1 is accepted) | Runs once (`hasAcceptedBatch` guard). See "Accept" below | `tasks`, `projects`, `srsTaskHistories`, `files` | Yes (all four are saved) | Local toast "`N` tasks added to <project> (`R` rejected). Generation history preserved." |
| "Complete Review (Save History)" (when 0 are accepted) | The same flow with an empty accepted list | `srsTaskHistories`, `files` | Yes | Toast "Review complete: all `N` tasks rejected. SRS generation history preserved." |
| "Cancel" / X / backdrop | Closes the modal. **All suggestions and edits are thrown away.** The file is unchanged | none | — | — |

**"Accept" in detail** (`files/page.tsx:184-269`):
1. For each accepted suggestion it builds a `CreateTaskInput`:
   - `id: task-srs-<timestamp>-<idx>`
   - `key: <project.key>-<tasks.length + idx + 101>`. `tasks.length` is the count of **all tasks in all projects**, so keys can skip numbers and may clash with existing keys.
   - title, description, acceptanceCriteria, priority and type are taken from the suggestion
   - `status:'todo'`
   - `sourceDocumentId/Name` = the file
   - `sourceSection`, `isSrsGenerated:true`, `points`, `tags`
   - `labels: ['SRS Generated', ...tags]`
2. It calls `addTasks(list)` (`app-context.tsx:882-938`). Because the page gives a key, the store's own key generator (`nextTaskKey`) is **not used**. The store fills in `reporterId = currentUserId` (the signed-in user), `estimatedDuration = 3` (default), `storyPoints = points`, and empty comments, attachments and checklist. There is no assignee, sprint, dates or plan level, so the tasks land in the **Backlog**. After that it recalculates `progress` and `calculateProjectTimeline` for the project. It does **not** add a notification, an activity log entry or a status change.
3. It builds one `SrsGeneratedTaskRecord` for **every** suggestion, accepted or rejected. Each record has `outcome` accepted/rejected, the `projectTaskId/Key` of the created task (accepted only), the original and final values, `isEdited`, and `rejectionReason`. For a rejected task with no reason, the reason defaults to "Excluded during SRS analysis review: Not added to project backlog."
4. `saveSrsTaskHistory(file.id, records)` **replaces** the file's earlier history (`app-context.tsx:1199-1205`). It does not add to it.
5. `updateFile(file.id, {category:'srs', analysisStatus:'tasks_created', tasksGeneratedCount: accepted, analyzedAt: now})`.

**Notes, limits and simulated parts**
- If you re-analyse the same file (via Change Type → SRS → Analyze), you get the same 6 tasks **again as new duplicates**, and the old history is overwritten. The earlier tasks stay in the backlog without their history.
- The new tasks have no estimate except the default 3 days. This changes project progress and the timeline straight away.

---

### 8.7 "Tasks Generated from SRS" history modal

**File:** `src/components/projects/srs-generated-tasks-modal.tsx`
**Who can open it:** Any user, from "View Tasks", "View Generated Tasks" or the "Tasks Created" badge.
**Purpose:** A read-only audit list of the suggestions that were accepted, edited or rejected for one file, with the live status of the created tasks.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| History | `srsTaskHistories[file.id]` (page prop) | Seed: 6 records for `f1` |
| Live tasks | `useApp().tasks` | Used to find the current status of accepted tasks |

**Cards, widgets and lists**

#### Header chips
- **Shows:** Source SRS, Project, and "Analyzed: <date>" (only if `file.analyzedAt` is set, using the browser's date format).

#### 4 counters
- **Generated** = number of records. **Accepted** = records with `outcome==='accepted'`. **Edited** = records with `isEdited`. **Rejected** = records with `outcome==='rejected'`. Edited is counted on its own, so it overlaps with the other two.

#### Record cards
- **Shows:**
  - The key: `projectTaskKey`, or `GEN-<n>` for rejected records.
  - The type and the priority.
  - The outcome badge: "Accepted", "Edited & Accepted", "Rejected" or "Edited & Rejected".
  - For accepted records, the **live status**. `getLiveWorkflowStatus` (`:128-137`) looks for the task by `projectTaskId`, then by `projectTaskKey`, then by the same `sourceDocumentId` plus the same title (not case-sensitive). If no task is found, it shows **"todo"**, even if the task was deleted.
  - For rejected records, "Excluded from Backlog".
  - The title (struck through if rejected) and the description.
  - A "Rejection Rationale" box (rejected records). The fallback text is "Excluded during SRS analysis review: Requirement scope deferred or redundant."
  - An "Edited During Review" box, which shows the original title and original priority only when they differ. Edits to the description, criteria or type are not shown.
  - Acceptance criteria. These always show for accepted records, and show for rejected ones only when expanded.
  - "Source: <section>", the points and the #tags.
- **Empty states:** "No generated task history is available for this SRS." when there are no records. An amber banner "All tasks in this batch were rejected during review." shows on the All tab when 0 were accepted. "No tasks match the selected filter." shows when filters leave nothing.

#### Footer
- **Shows:** "Showing `visible` of `total` generated tasks for <file>".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Tabs All / Accepted / Edited / Rejected | Filter by outcome or `isEdited` | none | — | — |
| Search "Search generated tasks…" | **Bug: it never filters anything.** `matchId = t.id.toLowerCase()` is a non-empty string, so it is always "true", and every record matches (`:81-85`) | none | — | — |
| "View Task" (accepted) | `openTaskDrawer(liveTaskId)`, which sets `activeTaskDrawerId` and opens the task drawer | `activeTaskDrawerId` | No (not persisted) | — |
| "View Rejection Details" / "Hide Details" (rejected) | Toggles the expanded state. The rationale box is shown anyway, so only the acceptance criteria appear or disappear | none | — | — |
| Chevron (accepted, has criteria or edits) | Toggles the expanded state. For accepted records the criteria are already always visible, so this changes **nothing you can see** | none | — | — |
| "Close" / X / backdrop | Closes the modal | none | — | — |

**Notes, limits and simulated parts**
- The seed history names the project "FlashSign 2.0 Web Platform", but the seed project is called "Flash Sign v2.0". The text is hard-coded in `mock-data.ts`.
- The search box does not work (see above).

---

### 8.8 Project Reports — Overview tab — `/projects/[projectId]/reports`

**File:** `src/app/(workspace)/projects/[projectId]/reports/page.tsx` (+ `src/components/reports/project-overview.tsx`, `src/lib/project-health.ts`, `src/lib/timeline-report.ts`, `src/lib/subtasks.ts`, `src/lib/schedule.ts`)
**Who can open it:** Any signed-in user. No role or permission check. Unknown project → `notFound()`.
**Purpose:** Shows how the project is doing, calculated live from tasks, status history, timers and the plan. The page has 3 tabs: **Overview** (default), **Timeline** (8.10) and **Task time** (8.11).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Project, tasks, sprints, milestones (phases), epics, stories | `useApp()` | All filtered to this project |
| `taskStatusChanges` | `useApp()` | Used to find when a task was started or finished |
| `workSessions` | `useApp()` | Timer sessions, used for hours |
| `users` | `useApp()` | Team table |
| `now` | `useNow()` (`src/lib/use-now.ts`) | A shared clock that ticks every 30 s. It is `null` during server render, so the overview renders nothing until the page mounts |

**Shared definitions used below** (all in `src/lib`):
- **Finished** (`finishedAt`, `project-health.ts:37-41`): the task status is `review` or `done`. The finish time is the **earliest** status change to review or done. If there is none, it is `task.updatedAt`.
- **Work done %** (`progressOfTasks`, `subtasks.ts:47-53`): uses "leaf" tasks only (tasks without subtasks, plus subtasks). Each leaf has weight `max(1, estimatedDuration or 1)`. Work done = round(Σ weight of leaves with status **`done`** ÷ Σ weight of all leaves × 100). Tasks in **review do not count as done here**, but they **do** count as "finished" in the health checks.
- **Session minutes** (`sessionMinutes`, `agent-connection.ts:381-384`): `max(0, round((endedAt or now − startedAt) / 60 000))`.
- **Day differences** (`diffCalendarDays`): `round((end − start) / 86 400 000)` on date strings.
- **Project window** (`projectWindow`, `schedule.ts:30-36`): start = `originalStartDate or startDate`. Planned end = `originalEndDate or endDate or dueDate`.

**Cards, widgets and lists**

#### Headline banner
- **Shows:** an icon and a label (On track / At risk / Off track / Delayed), then " · <sentence>", then the "facts" joined with " · ".
- **Data source:** `projectHealth(...).headline` (`project-health.ts:275-286, 295`).
- **How it is calculated:**
  - **Label** = `project.health`. This is the value stored by `calculateProjectTimeline`, not something worked out here. In automatic mode (`timeline-calculator.ts:134-139`):
    - `late = (days the current end is past the original end) / originalDuration`, used only when the timeline is "extended".
    - `late > 0.25` → **Delayed**.
    - `late > 0.10`, or `paceGap > 25` → **At risk**. `paceGap` = time used % − work done %.
    - Otherwise **On track**. A completed project is always On track.
    - "Off track" only appears if someone sets health by hand in Settings (`healthMode: 'manual'`).
  - **Sentence:**
    - if `summary.lateBy > 0` → "<project> will finish about N days late (<forecast end>)"
    - else if pace is `behind` → "<project> is planned to finish by <planned end>, but the work is behind the calendar"
    - else → "<project> is on track to finish by <planned end>"
  - **Facts:** "N phases at risk" (checkpoints at_risk + missed), "N overdue", "N blocked". If there is none of these, it shows "N finished this week" instead.
- **Empty state:** none (the banner always shows).

#### "Going well" and "Needs attention" lists
- **Shows:** two cards, each with a count, the first 5 items, and a "Show all N / Show fewer" link. Each item shows its text and a smaller detail line. Items that have a target show a chevron and can be clicked.
- **Data source:** `health.good` and `health.attention`, sorted by `weight` (highest first). The full rule list is in **8.9**.
- **Empty state:** "Nothing to highlight yet." / "Nothing needs attention right now."

#### Key numbers (5 tiles)
| Tile | Formula |
|---|---|
| Work done | `progressOfTasks(projectTasks)` %. Sub-line "`timeUsed`% of the time used" (time used is defined in 8.10) |
| Finished in the last 7 days | Main tasks (no subtasks) with `finishedAt ≥ now − 7 days`. Sub-line compares this with the 7 days before that (`now−14d ≤ at < now−7d`): "N more / N fewer than the week before / Same as the week before" |
| Finished on time | Among finished main tasks that have a `dueDate`: round(count with finish **date** ≤ due **date** ÷ count × 100) %. Shows "—" if there are none |
| Open tasks | Main tasks whose status is not `done` and not `review`. Sub-line "N overdue" = open main tasks whose `dueDate` (date part) is before today |
| Hours in the last 7 days | Each of the project's timer sessions is clipped to start no earlier than `now − 7 days`. Sum of `sessionMinutes` ÷ 60, rounded to whole hours. Sub-line "On the timer" |

#### "Tasks finished per day" chart (bar chart)
- **Shows:** 14 bars, one for each day from today − 13 to today. The tooltip shows "<date> · N tasks finished".
- **How it is calculated:** for each day, the number of finished **main** tasks whose `finishedAt` date is that day (`project-health.ts:289-292`).
- **Empty state:** none. With no data, the bars are all 0.

#### Team table
- **Shows:** Person (avatar, name, "Overloaded" badge), Open, Overdue, Finished (7 days), Hours (7 days). Rows are sorted by Open, highest first.
- **How it is calculated** (`project-health.ts:230-250`):
  - **Members** = users in `project.memberIds`, or anyone assigned a task in the project.
  - **Open work** = leaves (tasks without subtasks, plus subtasks) whose status is not done and not review.
  - **Open** = the member's open work items. **Overdue** = those with `dueDate` before today.
  - **Finished (7 days)** = **main** tasks assigned to them that finished in the last 7 days. Note: this counts main tasks, while Open counts leaves.
  - **Hours (7 days)** = their sessions in the project, clipped to the last 7 days, ÷ 60, rounded.
  - **Overloaded** = `open ≥ 3` and `open ≥ 1.5 × average`. The average is taken over **all** members, including members with 0 open.
  - Members with Open = 0, Finished = 0 and Hours = 0 are hidden.
- **Empty state:** "No one has work in this project yet."

#### Breakdown — "Tasks by Status" (donut)
- **Shows:** slices for Done, In Progress, Review, To Do and Blocked (statuses with a count of 0 are left out), plus a legend with counts.
- **Data source:** `activeTasks` = project **main** tasks (subtasks left out) that match the Sprint and Status filters (`reports/page.tsx:63-69`).
- **Empty state:** "No status data available".

#### Breakdown — "Tasks by Priority" (bar)
- **Shows:** Critical, High, Medium and Low counts from `activeTasks`, and a footer "High / Critical Load: N tasks" (critical + high).
- **Note:** each data row has its own `fill` colour, but no `<Cell>` is used (`:283`). Unclear: whether Recharts 3 applies the row colours. The bars may all show in the default colour.
- **Empty state:** "Loading priority chart…" until the page mounts.

#### Breakdown — "Sprint Burndown" (area chart)
- **Which sprint:** the sprint chosen in the Sprint filter. Otherwise the project's `active` sprint. Otherwise the sprint with the latest start date (`:112-115`).
- **How it is calculated** (`sprintBurndown`, `project-health.ts:317-341`):
  - Items = the sprint's tasks, but a task that has subtasks is replaced by its subtasks.
  - Weight = `max(1, estimatedDuration or 1)`.
  - For each day `d` from sprint start to sprint end (number of days = `max(1, end−start)`):
    - **ideal** = `round(total × (1 − i/days), 1 decimal)`
    - **actual** = Σ weight of items **not finished by the end of `d`** (`finishedAt` is missing, or its date is after `d`). For future days, actual is `null`.
- **Gap pill:** gap = (last actual − its ideal), rounded to 1 decimal. Gap > 0 → "N days of work behind the line". Gap < 0 → "N days of work ahead of the line". Otherwise "On the line".
- **Empty state:** "Add a sprint with tasks to see its burndown." or "No sprints in this project yet". Note: a sprint with no tasks still draws an all-zero chart.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Tabs Overview / Timeline / Task time | Switch the view (local state). The page always opens on Overview | none | No | — |
| "Export CSV" (Overview) | Downloads `<KEY>_Overview_Report.csv` (see 8.15) | none | — | Toast "Overview exported as CSV" (shared `notify`) |
| Click a "Going well"/"Needs attention" item | Depends on the target: `task` → `openTaskDrawer(id)`; `timeline` → switches to the Timeline tab; `person` → `/teams/members/<id>`; `plan` → `/projects/<id>/plan`; `tasks` → `/projects/<id>/tasks`. Items with no target are disabled | `activeTaskDrawerId` (task only) | No | — |
| "Show all N" / "Show fewer" | Expands or collapses the list beyond 5 items | none | No | — |
| Team table row | Goes to `/teams/members/<userId>` | none | — | — |
| Sprint filter (Breakdown) | "All Sprints" or one sprint. Filters the status and priority charts **and** picks the burndown sprint | none | No | — |
| Status filter (Breakdown) | All / To Do / In Progress / In Review / Done / Blocked. Filters the status and priority charts only, not the burndown | none | No | — |

**Notes, limits and simulated parts**
- Everything here is real calculation. There is no hard-coded chart data.
- "Work done" counts only `done`, but "finished" counts `review` too. So a project can have many tasks "finished this week" while work done does not move.
- The headline label comes from `project.health`, which `calculateProjectTimeline` stores on load and on task changes. It is not recalculated as the clock ticks. The sentence and facts, however, are calculated live.
- `useMemo` is called after an early `return notFound()` (`reports/page.tsx:56-63`). This breaks React's hook-order rule if the project disappears while the page is open.

---

### 8.9 Overview health checks — full rule list (`projectHealth`, `src/lib/project-health.ts:67-311`)

"Main" = project tasks with no `parentId`. "Open" = main tasks whose status is not done and not review. "Today" = the UTC date of `now`. Weight sets the sort order: higher shows first. Constants: `REVIEW_STUCK_DAYS = 3`, `OVERLOAD_FACTOR = 1.5`, `ESTIMATE_TOLERANCE = 0.2`.

| # | Check | Condition (exact) | List | Text / detail | Weight | Click goes to |
|---|---|---|---|---|---|---|
| 1 | Late finish | `summary.lateBy > 0` (8.10) | Attention | "Finishing N days late" / "Planned X, now Y" | 100 + lateBy | Timeline tab |
| 1b | On track | else, if pace ≠ behind | Good | "On track to finish by <planned end>" | 100 | Timeline tab |
| 2 | Pace behind | `pace === 'behind'` | Attention | "Work is behind the calendar" / "T% of the time used, W% of the work done" | 80 | Timeline tab |
| 2b | Pace ahead | `pace === 'ahead'` | Good | "Work is ahead of the calendar" | 60 | none |
| 3 | Phase missed | checkpoint status `missed` | Attention | "<phase> missed its checkpoint" / "Due X" | 95 | Timeline tab |
| 4 | Phase at risk | checkpoint status `at_risk` | Attention | "<phase> is at risk" / "Now ends X, N days after its checkpoint" | 90 + lateBy/10 | Timeline tab |
| 5 | Phases achieved | at least 1 checkpoint `achieved` | Good | "N phases achieved" / their names | 70 | Plan page |
| 6 | Phases on track | at least 1 checkpoint `on_track` | Good | "<names> on track" | 65 | Timeline tab |
| 7 | Not started | a late driver (8.10) with status `todo`, main task, reason starting with "Should have started" | Attention | "<KEY> hasn't started" / "It should have started <date>; not started yet (estimate …)" | 75 + lateBy/10 | Task drawer |
| 8 | Delivery this week | finished-this-week > 0 | Good | "N tasks finished in the last 7 days" / compared with the week before | 85 | none |
| 8b | No delivery | else, if open > 0 | Attention | "No tasks finished in the last 7 days" / "N the week before" (if any) | 60 | none |
| 9 | On-time rate | `onTimeRate ≥ 80` | Good | "X% of tasks finished on time" / "a of b by their due date" | 55 | none |
| 9b | On-time rate low | `onTimeRate < 80` | Attention | "Only X% …" or, when 0, "None of the finished tasks were on time" | 50 | none |
| 10 | Estimates | **Hours mode** if at least 2 finished tasks have `effortMinutes`: ratio = timer minutes on the task ÷ effortMinutes (ratios of 0 are dropped). Otherwise **day mode**: leaves with `estimatedDuration` that have a first in_progress change and a finish → `max(1, days(first start → finish)) ÷ estimatedDuration`. Needs at least 2 ratios; avg = mean | Good if \|avg−1\| ≤ 0.2 ("Estimates are close"); Attention if avg > 1.2 ("Work takes longer than estimated"); Good if avg < 0.8 ("Work finishes faster than estimated") | detail "Finished work took 1.3× the planned hours / its estimate on average" | 40 / 45 / 35 | none |
| 11 | Overdue tasks | open main tasks with due date before today | Attention | "N tasks overdue" / first 3 keys + "and N more" | 88 | 1 task → drawer; more → Tasks page |
| 11b | Nothing overdue | else, if open > 0 | Good | "Nothing is overdue" | 30 | none |
| 12 | Overdue subtasks | subtasks not done/review whose due date is before today | Attention | "N subtasks overdue" | 84 | as in 11 |
| 13 | Blocked | **one item per** blocked main task. Days = today − the last change into `blocked` (or `updatedAt`) | Attention | "<KEY> is blocked" / "<title>, blocked since today / for N days" | 86 + days/10 | Task drawer |
| 13b | Nothing blocked | no blocked tasks and open > 0 | Good | "Nothing is blocked" | 30 | none |
| 14 | Stuck in review | main task in `review` for **more than 3** days since its last move into review | Attention | "<KEY> waiting in review for N days" | 70 + days/10 | Task drawer |
| 15 | Over its estimate | main task `in_progress` where days since the last move into in_progress > `estimatedDuration` | Attention | "<KEY> in progress longer than planned" / "N days so far, estimate …" | 72 + (days−est)/10 | Task drawer |
| 16 | Overloaded person | team member flagged overloaded (8.8) | Attention | "<name> has N open tasks and subtasks" / "The team average is X.X" | 65 | Member page |
| 16b | Fair spread | more than 1 team row and no one overloaded | Good | "Work is spread fairly across the team" | 25 | none |
| 17 | Unassigned | open main tasks with no assignee | Attention | "N tasks with no one assigned" / first 3 keys | 55 | Tasks page |
| 18 | Backlog | the project structure has a lowest plan level, and there are main tasks `inBacklog` | Attention | "N tasks waiting in the Backlog" / "Not placed in a <level> yet" | 30 | Plan page |
| 19 | Misplaced | main tasks not in the backlog that have a `taskPlacementIssue` | Attention | "N tasks need a <level>" | 35 | Plan page |
| 20 | Auto-stopped timers | project sessions with `needsReview` | Attention | "N timers stopped by themselves" / "Idle for 2 hours or left on at the end of the day; check the hours" | 40 | none |
| 20b | Timers fine | else, if the project has any sessions | Good | "No timers need checking" | 20 |  none |

Note on #20: the detail text always says "2 hours", but the real idle limit is `agentSettings.idleTimeoutMinutes`, which can be changed.

---

### 8.10 Project Reports — Timeline tab

**File:** `src/components/reports/timeline-report.tsx` (+ `src/lib/timeline-report.ts`, `src/lib/schedule.ts`)
**Who can open it:** Any user, from the "Timeline" tab or from a "Timeline" target in the Overview.
**Purpose:** Shows the plan against time: the planned and forecast end, pace, phase checkpoints, a Gantt-like chart of every phase/epic/story, and the tasks that are pushing the end out.

**Key formulas (exact):**

- **Forecast end of one task** (`forecastEnd`, `schedule.ts:108-124`). First, estimate = `max(1, estimatedDuration or 1)` days, and planned end = `dueDate`, or `startDate + estimate` days.
  1. Status review/done → the date of the **last** change to review or done (or the planned end).
  2. Started (it has an in_progress change), or status in_progress/blocked → the **latest** of: planned end, (first in_progress date + estimate), today.
  3. Not started, but its `startDate` is before today → the latest of: planned end, today + estimate.
  4. Otherwise → the planned end.
- **Forecast end of a level** (`forecastOf`): the latest of the level's planned end and the forecast ends of its tasks and their subtasks. `lateBy = max(0, days(planned end → forecast end))`.
- **Summary** (`timelineSummary`, `timeline-report.ts:200-220`):
  - `plannedEnd` = project window end (original end).
  - `forecastEnd` = `project.currentEndDate` (stored by `calculateProjectTimeline`), or the planned end if that is missing.
  - `lateBy = max(0, days(plannedEnd → forecastEnd))`.
  - `timeUsed = clamp 0..100 of round(days(start → today) ÷ max(1, days(start → plannedEnd)) × 100)`.
  - `workDone = progressOfTasks(project tasks)`.
  - **Pace:** `gap = timeUsed − workDone`. **gap > 10 → Behind; gap < −10 → Ahead; otherwise On pace.**
  - `replans` = `project.baselineHistory.length`.
- **Checkpoint status per phase** (`checkpoints`, `timeline-report.ts:139-152`). The checkpoint date = `phase.endDate or dueDate`.
  - **Achieved** if `phase.status` is `achieved` or `completed`.
  - Otherwise **Missed** if the checkpoint date is before today.
  - Otherwise **At risk** if the phase row's forecast end is after the checkpoint.
  - Otherwise **On track**.
  - `lateBy = max(0, days(checkpoint → forecast))`. The list is sorted by checkpoint date.
  - Note: a phase whose date has passed is "Missed" even if all its work is finished, unless someone marks it achieved.
- **Late drivers** (`lateDrivers`, `timeline-report.ts:155-198`):
  - Every project task **and subtask** whose forecast end is after its planned end. Tasks with no planned end are skipped.
  - **lateBy** = days(planned end → forecast).
  - **"Makes late" (pushes):** for a subtask, use its parent. The list includes the parent's story if the story's end is before the forecast, the epic name if the epic's end is before it, the phase name if the phase's end is before it, and "the project end" if the original project end is before it.
  - **Reason** — the first rule that matches:
    1. review/done → "Finished <date>, after its due date"
    2. started after its planned start → "Started N days late (<date>); estimate …"
    3. todo, not started, planned start before today → "Should have started <date>; not started yet (estimate …)"
    4. planned end before today → "Still open after its due date (<date>)"
    5. otherwise → "Its estimate (…) runs past its due date"
  - **Sort:** by the number of pushes (highest first), then by lateBy (highest first).
- **Plan rows** (`timelineRows`/`rowFor`, `timeline-report.ts:82-136`):
  - The tree follows the project structure (Phase → Epic → Story, or whichever levels are on).
  - For each row, the **scope** = main tasks linked directly to that item.
  - **progress** = `progressOfTasks(scope + their subtasks)`.
  - **workedMinutes** = Σ `sessionMinutes` of all sessions on those tasks. These are all-time and not clipped.
  - **estimateDays** = Σ `max(1, estimatedDuration)` over the leaves.
  - **taskCount** = scope size.
  - **inherited** = the row has no dates of its own, so it spans its parent.
  - Top-level rows are sorted by start date, then end date.

**Cards, widgets and lists**

#### Summary card "End date"
- **Shows:** "Planned <plannedEnd>" and "Now <forecastEnd>", plus a late pill ("+N days" or "On time").

#### Summary card "Time used vs work done"
- **Shows:** the pace label (Behind / On pace / Ahead with an icon), and two bars "Time used X%" and "Work done Y%".

#### Summary card "Phase checkpoints"
- **Shows:** "A of T achieved" and "R at risk · M missed · O on track". If the project has no phases (milestones): "This project doesn't use phases."

#### Summary card "Changes to the plan"
- **Shows:** "Re-planned N times" and "Last: <date>, "<reason>"" from the last `baselineHistory` entry. If there are none: "Original plan, not changed".

#### "The plan over time" chart (custom Gantt, not Recharts)
- **Shows:** one row per phase/epic/story (indented by depth, with the epic colour dot):
  - a grey planned bar (start → end)
  - a teal "done so far" bar from the start to `start + round(days(start→end) × progress/100)`
  - an amber "running late" bar from the planned end to the forecast end
  - hover details: planned dates and length (", all of its parent" if inherited), "Now ends …, N days late" or "On time", "P% done · N tasks", "Worked Xh · estimate Yd"
  - right-hand columns: Ends (forecast), Late, Done %, Worked · est.
  - month ticks, a dashed line at the original end, an amber line at the forecast end (if late), and a red line for today
- **Chart window:** from = the earliest of the planned end, every row start and the project start, **minus 3 days**. To = the latest of the planned end, the forecast end, today and every row's forecast end, **plus 4 days**.
- **Empty state:** "No <levels> to show." or "This project has tasks only; there are no phases, epics or stories to chart."

#### "What's pushing the end out" table
- **Shows:** Task (key + title), Makes late (chips; "the project end" is highlighted; "Only itself" if empty), Late by (pill), Why (reason).
- **Empty state:** "Nothing is running late."

#### "Phase checkpoints" table (only if there are phases)
- **Shows:** Phase, Checkpoint date, a Status badge (Achieved / On track / At risk / Missed), and Forecast:
  - "—" if achieved
  - the date and a late pill if lateBy > 0
  - "Checkpoint passed without being marked achieved" if missed with no lateness
  - otherwise "On time"

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Top-level filter "All <Phases/Epics/Stories>" | Shows one top-level item and its children in the chart only. The summary, drivers and checkpoints are **not** filtered | none | No | — |
| "Show finished" checkbox (default on) | When off, hides rows with progress 100% and lateBy 0, together with their children | none | No | — |
| "Export CSV" | Downloads `<KEY>_Timeline_Report.csv` (8.15). It exports **all** rows and ignores both filters | none | — | Toast "Timeline exported as CSV" |
| Row chevron | Folds or unfolds the row's children | none | No | — |
| Row track (hover or keyboard focus) | Shows the hover details | none | — | — |
| Late-driver row | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No | — |

**Notes, limits and simulated parts**
- `summary.forecastEnd` comes from the stored `project.currentEndDate`. That value is only recalculated on load and when tasks change. The row forecasts, on the other hand, use the live `now`, so the two can differ while the page stays open.
- `forecastEnd` adds `estimatedDuration` as **calendar days**, even when the task's duration unit is weeks or months.

---

### 8.11 Task time report (component) — Project "Task time" tab and `/reports/task-time`

**File:** `src/components/reports/task-time-report.tsx` (+ `src/lib/task-time.ts`)
**Who can open it:** Any signed-in user. In the project tab, `projectId` is fixed and the Project filter is hidden.
**Purpose:** Shows how long each task took from In Progress to In Review: timer time ("worked") against calendar time, with subtasks rolled up into their task.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tasks, sessions, status changes | `useApp().tasks`, `workSessions`, `taskStatusChanges` | Seeds: `MOCK_TASKS`, the work-session seed and the status-change seed |
| Users, projects | `useApp()` | Names and filter options |
| `agentSettings` | `useApp()` | Idle limit and day cutoff, shown in the footer text |
| `now` | `useNow()` (30 s tick) | |

**Formulas (exact):**
- **Per task or subtask row** (`taskTimeRows`, `task-time.ts:75-132`). A task with no in_progress change and no session is **left out**.
  - **startedAt** = the earliest of (all changes to in_progress, all session starts).
  - **reviewAt** (only if the status is review or done) = the **last** change to review. If there is none, the **first** change to done. If there is none, the latest `endedAt` of a session that ended as `finished`.
  - **leftAt** (status is not in_progress and there is no reviewAt, i.e. the task was put back) = the last change *from* in_progress. If there is none, the latest session end.
  - **Worked time** = Σ over the task's sessions of `round((endedAt or now − startedAt)/60 000)` minutes. Each session is rounded separately. Open sessions count up to now. Auto-stopped sessions end at the last activity (idle) or at the cutoff (`applyAutoStops`), so idle time and after-shift time are not counted.
  - **Calendar time** ("In Progress → Review") = `sessionMinutes(startedAt, reviewAt ?? leftAt, now)`. That is, from the first start to the review, or to when the task was put back, or **to now** while it is still in progress.
  - `running` = it has an open session. `autoStops` = sessions with endReason `idle_timeout` or `day_cutoff`. `workerIds` = people sorted by their minutes. If nobody logged time, the assignee is used.
- **Grouped task** (`groupTaskTime`, `task-time.ts:152-201`). It shows when the task itself or any of its subtasks has a row.
  - **Worked** = own minutes + subtask minutes.
  - **Start** = the earliest start.
  - **reviewAt** = only when the **task** itself is in review or done: its own reviewAt, or else the last subtask reviewAt.
  - **Calendar end** = reviewAt. If the work is still active (a running timer, or the task or any subtask is in_progress), the end is **now**. Otherwise it is the latest (part start + part calendar time).
  - **Calendar time** = round((end − start)/60 000).
  - **subtaskDone** counts subtasks in done **or review**.
  - **Planned (effortMinutes)** = the task's `effortMinutes` + its subtasks' `effortMinutes`.
- **Planned vs actual %** (`Planned` component, `:32-45`):
  - `pct = round((worked − planned) / planned × 100)`.
  - pct > 0 → amber "+pct%".
  - pct < 0 **and** the task has been sent to review → green "pct%".
  - Otherwise no percentage is shown.
  - Planned = 0 → "—".
  - When a Person is chosen, a grouped task's planned time counts only the parts (the task or subtasks) assigned to that person.
- **Person filter:** only that person's sessions are counted ("like a timesheet"). Rows are kept if the person is in `workerIds`.
- **Sort order** (`byRecent`, `:73`): rows with no reviewAt use the value `'9'`, so **tasks not yet in review sort first**. Then reviewed tasks follow, most recent review first, and ties are broken by later start first. The code comment claims the opposite order.

**Cards, widgets and lists**

#### Headline tiles (4)
| Tile | Formula |
|---|---|
| Sent to review | The number of grouped tasks with reviewAt. Sub-line "of N tasks worked on", plus " · d/t subtasks done" if there are subtasks |
| Avg worked per task | Mean of worked minutes over the **reviewed** grouped tasks, rounded. Shows "—" if there are none |
| Avg In Progress → Review | Mean calendar minutes over the reviewed grouped tasks, shown as "2d 3h" or "3h 20m". Shows "—" if there are none |
| Timers running now | The number of task **and subtask** rows in the chosen project(s) with an open session. The **state filter is not applied** here. Sub-line: "N auto-stopped sessions" (summed over the filtered groups) or "No auto-stops" |

#### "Worked time per task" chart (horizontal stacked bar)
- **Shows:** the top 12 grouped tasks by worked minutes. Each bar is split into "<KEY> itself" plus one segment per subtask, at most 6 segments, with the rest summed as "Other subtasks". Values are hours (2 decimals). Bars are green (`#00a88f`) if sent to review and blue (`#2a78d6`) if not. Each later segment is lighter (opacity `max(0.4, 1 − i×0.14)`). The tooltip shows the key, title, people, worked time, the parts, and "In Progress → Review" or "In progress for" with the calendar time.
- **Empty state:** "No task time for these filters." ("Loading…" before mount).

#### Table
- **Columns:** Task (fold chevron, key, title, "d/t subtasks"), Worked by (first person's avatar and name, "+N"; the tooltip lists everyone's minutes), Status, Moved to In Progress (`d MMM, HH:mm`), Moved to In Review (the date, or "Still in progress" / "Not sent yet" / "All subtasks done, task not sent yet", with a green pulsing dot if a timer is running), Worked (with an amber warning icon and the auto-stop count), Planned (with %), In Progress → Review (with " so far" if not reviewed), and Via (an agent or source badge for each session source).
- **Empty state:** "No task time for these filters."
- **Footer text:** explains the formulas and uses `agentSettings.idleTimeoutMinutes` and `dayCutoff`.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Project select (global page only) | "All projects" or one project | none | No | — |
| Person select | "Everyone", or a user who has at least 1 session. Shows "Showing <name>'s time only." | none | No | — |
| State tabs All / Sent to review / Not in review yet | Filter by reviewAt present or missing (in grouped mode, the group's reviewAt) | none | No | — |
| "Subtasks grouped" / "Separate rows" | Grouped tree or a flat list of every row. In the flat list, a parent task with no time of its own does not appear | none | No | — |
| "Export CSV" | Downloads a CSV (8.15). Disabled when there are no groups. It **always exports the grouped data**, even in "Separate rows" mode | none | — | Toast "Task time exported as CSV" |
| Row chevron | Folds or unfolds the subtasks | none | No | — |
| Task key/title | `openTaskDrawer(task.id)` | `activeTaskDrawerId` | No | — |

---

### 8.12 Company Reports & Analytics — `/reports`

**File:** `src/app/(workspace)/reports/page.tsx`
**Who can open it:** Any signed-in user. **It is not linked from the sidebar.** The sidebar "Reports" item goes to `/agreements/reports` (`app-sidebar.tsx:102`). The only in-app link to this page is the "← Reports" back link on `/reports/task-time`. The `auditor` role has `defaultPath: '/reports'` in `permissions.ts:84`, but no code uses `defaultPath`.
**Purpose:** A company-wide overview. **Most of it is hard-coded demo data.**

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Projects | `useApp().projects` | KPI tiles |
| Documents | `useApp().documents` | KPI tile |
| Agent runs | `useApp().agentRuns` | KPI tile |
| Chart data | **Constants in the page file** (`:12-39`) | Hard-coded |

**Cards, widgets and lists**

#### KPI tiles (4, real data except the sub-lines)
| Tile | Formula | Sub-line |
|---|---|---|
| Active Projects | count of projects with `status === 'active'` | "Portfolio health" (static text) |
| Avg Completion | round(mean of `progress` over active projects). Shows 0% if there are none | "Across active projects" |
| Documents Signed | count of `documents` with `status === 'signed'` | "This month". **Wrong: it is not filtered by month** |
| AI Runs Total | `agentRuns.length` | "N completed" (`status === 'completed'`) |

#### Task Completion Trend (area chart) — **HARD-CODED**
- `TASK_COMPLETION_DATA`: weeks W39–W42 with fixed completed and created numbers (`:18-23`).

#### Project Health (donut) — **HARD-CODED**
- `PROJECT_HEALTH_DATA`: On Track 3, At Risk 1, Off Track 1 (`:12-16`). It does not use `project.health`.

#### Document Status Breakdown (bar) — **HARD-CODED**
- `DOC_STATUS_DATA`: Signed 2, Pending 1, In Review 1, Draft 1 (`:25-30`).

#### AI Agent Usage (Last 7 Days) (bar) — **HARD-CODED**
- `AI_USAGE_DATA`: 6 fixed days, Oct 15–20, with runs 0 or 1 (`:32-39`). The title says 7 days, but there are only 6 points. The `tokens` values are not drawn.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Task time" link | Goes to `/reports/task-time` (works) | none | — | — |
| "Projects" link | `/reports/projects`. **This route does not exist (404)** | none | — | — |
| "AI Agents" link | `/reports/ai-agents`. **Does not exist (404)** | none | — | — |
| "Documents" link | `/reports/documents`. **Does not exist (404)** | none | — | — |

**Notes, limits and simulated parts**
- 4 of the 4 charts are fake. Only the KPI numbers are real.
- `src/components/analytics/**` and `src/data/mock-analytics.ts` are **not used by any report page**. `WEEKLY_TASK_FLOW` (hard-coded weekly created/completed numbers for 8 weeks, 31 Aug – 19 Oct 2026) and the analytics charts are used only by the Teams Analytics page (`src/app/(workspace)/teams/page.tsx:16-19, 57-58, 247`). The file's own comment says "Tasks in the store have no completion date, so the weekly trend … uses this fixed demo series".

---

### 8.13 Task time — `/reports/task-time`

**File:** `src/app/(workspace)/reports/task-time/page.tsx` (renders `TaskTimeReport` with no `projectId`)
**Who can open it:** Any signed-in user. It is reachable only from the `/reports` "Task time" link or by typing the URL.
**Purpose:** The same report as 8.11, across all projects, with an extra Project filter.

**Cards, widgets and lists**
- Title "Task time" and an intro line. Everything else is as in **8.11**. The CSV file name is `Task_Time_Report.csv`.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "← Reports" link | Goes to `/reports` | none | — | — |
| All 8.11 controls + Project select | See 8.11 | none | — | — |

---

### 8.14 Agreement Reports — `/agreements/reports`

**File:** `src/app/(workspace)/agreements/reports/page.tsx` (+ `src/components/documents/demo-notice-banner.tsx`)
**Who can open it:** Any signed-in user. This is the sidebar "Agreements → Reports" item. Contract parts are hidden because `FEATURES.contracts` is false.
**Purpose:** Signing performance and document status at a glance. It is read-only.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signature requests | `useApp().signatureRequests` (seed in `src/data/mock-signing.ts`) | **Not persisted.** Resets to the seed on refresh |
| Contracts | `useApp().contracts` | Not persisted. Only used if the contracts flag is on (it is off) |
| Document items | `useApp().documentItems` (seed in `mock-documents.ts`) | Not persisted |

**Cards, widgets and lists**

#### Demo notice banner
- **Shows:** "Simulated Workflow Notice: Demo mode: Signature requests and signing actions are simulated … No legally binding electronic signature or cryptographic certificate is produced."

#### KPI tiles (`:27-44`)
| Tile | Formula |
|---|---|
| Requests sent | requests whose status ≠ `draft` |
| Completion rate | round(sent with status `completed` ÷ sent × 100) %. Shows 0% if nothing was sent |
| Avg. days to complete | Mean of `(completedAt − sentAt)` in days over completed requests that have both dates, shown with 1 decimal. Shows "—" if there are none |
| Waiting on signers (shown because contracts are off) | sent requests with status `sent`, `viewed` or `partially_signed` |
| (Active contract value, hidden) | Σ `contractValue or value` of active contracts |

#### "Signature requests by status" and "Documents by status" cards
- **Shows:** one row per status ("partially_signed" is shown as "Partially signed"), with the count and a bar whose width = count ÷ largest count. Sorted by count, highest first. A "Contracts by status" card is hidden by the flag.
- **Empty state:** "No records yet."

#### Recent signing activity
- **Shows:** the 10 newest events across all requests (`request.events`), sorted by timestamp, newest first. Each shows "<actor> <description>", the request title as a link, and the local date and time.
- **Empty state:** "No signing events recorded yet."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "View" on Signature requests card | Goes to `/signatures/all` | none | — | — |
| "View" on Documents card | Goes to `/documents/all` | none | — | — |
| Request title link in activity | Goes to `/signatures/<id>/audit` (the route exists) | none | — | — |

**Notes, limits and simulated parts**
- All numbers are real counts, but they come from collections that **are not saved**. Requests created or signed in this session show here, but they disappear after a refresh.

---

### 8.15 CSV exports — how they are built

| Export | Where | File name | Columns | How it is built and escaped |
|---|---|---|---|---|
| Overview | 8.8 "Export CSV" (`project-overview.tsx:108-132`) | `<KEY>_Overview_Report.csv` | `Section, Item, Detail`. Rows, in order: 1 Headline row (`<Label>: <sentence>`, facts joined by "; "); every Going well item; every Needs attention item; 5 Key numbers rows; one Team row per member (text: "N open, N overdue, N finished and Nh in the last 7 days[, overloaded]"); then **every project task and subtask** (Section "Task"/"Subtask", Item "`KEY title`", Detail "status; priority; assignee or Unassigned; due YYYY-MM-DD") | **Every value is wrapped in double quotes, and inner quotes are doubled.** Comma separator, `\n` line ends, no BOM. A `Blob` of type `text/csv` → `URL.createObjectURL` → a hidden `<a download>` is clicked → the URL is revoked right away |
| Timeline | 8.10 "Export CSV" (`timeline-report.tsx:102-118`) | `<KEY>_Timeline_Report.csv` | `Level, Name, Planned start, Planned end, Length, Forecast end, Days late, Progress %, Worked hours, Estimate days`. One line per plan row, depth-first (`flattenRows`). Name is indented with 2 spaces per depth. Worked hours = minutes/60 with 1 decimal. Exports **all rows**; filters are ignored | Only **Name** (quotes doubled) and **Length** (quoted but **not** escaped) are quoted. The other fields are raw. Built as a `data:text/csv;charset=utf-8,` URL passed through `encodeURI`. **Risk:** `encodeURI` does not encode `#`, so a `#` in any name would cut the file off at that point |
| Task time | 8.11 "Export CSV" (`task-time-report.tsx:115-146`) | `<KEY>_Task_Time_Report.csv` (project) or `Task_Time_Report.csv` (global) | `Level, Task, Parent, Title, Project, People, Status, Started, Sent to review, Worked (h), Planned (h), In Progress to Review (h), Via, Auto-stops`. One line per grouped task (Level "Task" or "Task (with subtasks)") followed by its subtasks (Level "Subtask", Parent = the task key). Dates are raw ISO strings. Hours have 2 decimals. Planned is blank when 0. People and Via are joined with "; ". Follows the Project, Person and State filters. **Always grouped** | Every value is quoted and inner quotes are doubled. Uses a Blob and object URL like the Overview export |

---

### 8.Z Data flow summary for this area

- **Reads:** `projects`, `files`, `tasks`, `users`, `srsTaskHistories`, `sprints`, `milestones`, `epics`, `stories`, `taskStatusChanges`, `workSessions`, `agentSettings`, `documents`, `agentRuns`, `signatureRequests`, `contracts`, `documentItems`.
- **Writes:** `files` (add, update, delete), `tasks` and `projects` (via `addTasks`: new SRS tasks, then project progress and timeline recalculated), `srsTaskHistories` (replaced per file), `activeTaskDrawerId` (opening the task drawer; not persisted). All of these except `activeTaskDrawerId` are saved to localStorage.
- **Store actions used:** `addFile`, `updateFile`, `deleteFile`, `addTasks`, `saveSrsTaskHistory`, `openTaskDrawer`.
- **Pure calculation helpers:** `generateSuggestedTasksFromSrs` (canned output), `projectHealth`, `sprintBurndown`, `timelineRows`, `checkpoints`, `timelineSummary`, `lateDrivers`, `forecastEnd`/`forecastOf`, `progressOfTasks`, `taskTimeRows`, `groupTaskTime`, `sessionMinutes`.
- **Hard-coded data:** the 6 SRS tasks (`srs-analysis.ts`), the seed SRS history for `f1` (`mock-data.ts:779`), all 4 charts on `/reports` (constants in the page), and `WEEKLY_TASK_FLOW` in `mock-analytics.ts` (used by Teams, not by reports).
- **No role or permission checks** anywhere in this area. Roles do not change what is shown here.

---

## 9. AI Agent Hub (MCP connection, tokens, timesheet and agent settings)

The AI Agent Hub explains and simulates how a developer's coding agent (Claude Code, Codex, Gemini CLI, Antigravity) would connect to the PM platform through an MCP server, using a personal token. **There is no MCP server, no network call and no real token check.** Every "agent action" is a function in `AppContext` that edits browser state directly, and the only place in the UI that calls those agent actions is the click-through demo on the "How it works" page. The hub has four tabs (How it works, Connect, My Tokens, Organisation), one old detail page for demo "agent runs", and two old routes that now redirect.

**Role note (applies to the whole section):** the role is not always `ceo`. Before sign-in sync the app uses `FIXED_DEMO_ROLE = 'ceo'` (`src/lib/features.ts:29`). After sign-in, the effect at `src/context/app-context.tsx:622-672` sets `demoRole` to the signed-in account's role (`executive` → `ceo`, `qa` → `qa_tester`, others unchanged) and `currentUserId` to that account's id. A brand-new sign-up account gets role `org_admin` and an id like `user-<timestamp>` (`src/context/demo-auth-context.tsx:259,266`). So it **can** manage agents, but it has **no tasks, no tokens and no timers** in the seed data.

---

### 9.1 Hub entry, tab bar and old redirect routes — `/ai-agents`, `/ai-agents/activity`, `/ai-agents/timesheet`

**File:** `src/app/(workspace)/ai-agents/page.tsx`, `layout.tsx`, `activity/page.tsx`, `timesheet/page.tsx` (+ `src/components/agents/hub-tabs.tsx`, `src/components/shared/section-tabs.tsx`)
**Who can open it:** Any signed-in user. The sidebar item "AI Agent Hub" (`src/components/layout/app-sidebar.tsx:133-139`) is not filtered by role. `canAccess` is imported there but never called, so even roles whose `navGroups` do not list `ai-agents` (for example `ceo`, `org_admin`, `project_manager`; see `src/lib/permissions.ts`) still see it.
**Purpose:** Entry point and tab bar for the hub.

**Cards, widgets and lists**

#### Hub tab bar
- **Shows:** Tabs "How it works", "Connect", "My Tokens", and "Organisation" (Organisation only for roles allowed by `canManageAgents`).
- **Data source:** `useApp().demoRole`; `canManageAgents(role)` = role is `ceo`, `org_admin` or `platform_admin` (`src/lib/permissions.ts:139-141`).
- **How it is calculated:** `src/components/agents/hub-tabs.tsx:10-15`. `SectionTabs` shows the bar only when the current path exactly equals one of the tab links (`src/components/shared/section-tabs.tsx:19-20,30`). On `/ai-agents/runs/[runId]` no tab matches, so **no tab bar is shown** there.
- **Empty state:** none.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Opening `/ai-agents` | Server `redirect('/ai-agents/how-it-works')` (`page.tsx:6`) | none | n/a | — |
| Opening `/ai-agents/activity` | Redirects to `/projects/home` (`activity/page.tsx:5`). The agent activity now lives in the "My work today" card there (see 9.8) | none | n/a | — |
| Opening `/ai-agents/timesheet` | Redirects to `/teams/timesheet` (`timesheet/page.tsx:5`) | none | n/a | — |
| Tab "How it works" / "Connect" / "My Tokens" / "Organisation" | Next.js `Link` navigation | none | n/a | — |

**Notes, limits and simulated parts**
- The task detail page has an "Open AI Hub" button with the text "Run an AI agent on this task to generate code, docs, or tests" (`src/app/(workspace)/tasks/[taskId]/page.tsx:212-220`). It only links to `/ai-agents`, which redirects to How it works. Nothing runs an agent on the task.

---

### 9.2 How it works (overview + live demo) — `/ai-agents/how-it-works`

**File:** `src/app/(workspace)/ai-agents/how-it-works/page.tsx` (+ `src/components/agents/agent-badge.tsx`, `src/lib/agent-connection.ts`, `src/lib/use-now.ts`)
**Who can open it:** Any signed-in user. Returns nothing (`null`) while `useCurrentUser()` is undefined (`:64`).
**Purpose:** Explains the design (agent → MCP server → web app) and offers a 7-step click-through demo. **This is the only place in the UI that calls the `agent*` simulation actions.**

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tasks | `useApp().tasks` (seed `MOCK_TASKS`) | used for demo task list and step texts |
| Work sessions (timers) | `useApp().workSessions` (seed `MOCK_WORK_SESSIONS`, `src/data/mock-agent-activity.ts:100`) | open session on the chosen task |
| Agent events | `useApp().agentEvents` (seed `MOCK_AGENT_EVENTS`, `mock-agent-activity.ts:128`) | task history panel, last note |
| Projects | `useApp().projects` | for the "Open the board" link |
| Current user | `useCurrentUser()` (`users` + `currentUserId`) | after sign-in this is the signed-in account |
| Clock | `useNow()` — ticks every 30 s, `null` during server render (`src/lib/use-now.ts`) | elapsed timer text |
| Agent names / colours | `AGENTS`, `AGENT_LIST` (`src/lib/agent-connection.ts:30-37`) | hard-coded |

**Cards, widgets and lists**

#### Page header
- **Shows:** Title "How AI agents work with the PM platform" and a fixed description (`:176-180`).
- **Data source:** hard-coded text.

#### Diagram (three boxes with arrows)
- **Shows:** Box 1 "The developer's agent" lists all 4 agents with vendor. Box 2 "PM MCP server" lists 4 rules and the tool names `list_my_tasks · get_task · start_task · add_progress_note · pause_task · finish_task · log_time`. Box 3 "What people see" (Kanban board, Timesheet, Team Analytics).
- **Data source:** `AGENT_LIST` and hard-coded text (`:184-217`).
- **How it is calculated:** static.
- **Note:** Purely descriptive. The MCP server does not exist (the page itself says so at `:369`).

#### Demo: task picker
- **Shows:** Dropdown "Task" with the user's eligible tasks.
- **Data source:** `myTasks` (`:47-53`).
- **How it is calculated:** tasks where `assigneeId === user.id` and status is `todo` or `in_progress`, **excluding tasks that have subtasks** (a task with subtasks has no timer of its own), sorted To Do first. The chosen task is `taskId` state, or the first of `myTasks` when nothing is chosen (`:55`).
- **Empty state:** Info box "<name> has no open tasks to work on. Switch the demo role to **Developer** (top of the sidebar) to try it." (`:233-239`). **This advice cannot be followed:** the role switcher is hidden (`FEATURES.roleSwitcher: false`, sidebar block commented out at `app-sidebar.tsx:307-308`). A freshly signed-up account has no tasks, so it always sees this message. It only works for a user who has open, subtask-free tasks assigned (for example seed user u1 before sign-in sync, if they have any; or after you assign tasks to yourself).

#### Demo: step counter
- **Shows:** "Step X of 7".
- **How it is calculated:** `Math.min(step, steps.length)` of `steps.length` (`:256`). `step` is local page state.

#### Demo: conversation panel
- **Shows:** Chat bubbles: user (right, "You → <agent>"), agent (left, with agent badge and a tool-name chip such as `start_task`), and system notices (amber). After the last step, a green box "Done. Three agents worked on <key>, but it's one task, one continuous timer, one person's hours" with links "Open the board" and "See the timesheet".
- **Data source:** local `messages` state, filled by each step's `run()` function (`:68-153`).
- **How it is calculated:** each step returns hard-coded text with the task key inserted. Step 1 builds a task list: the user's not-done tasks, grouped under their parent task, max 4 parents (`:75-82`). Step 5 text uses the open session's start time (or the word "earlier") and the last `note` event's detail, with a hard-coded fallback text (`:123-128`).
- **Empty state:** "Press **<first step label>** to begin."

#### Demo side panel: "On the Kanban board"
- **Shows:** A mini card: task key, status pill (To Do / In Progress / In Review / Done / Blocked), title, and when a timer is open "In progress via <agent label> · <elapsed>".
- **Data source:** the live `task` object from the store and `openSession` (`:59`, `:296-313`).
- **How it is calculated:** `openSession` = first work session of the current user with no `endedAt` and `taskId === task.id`. Elapsed = `formatMinutes(sessionMinutes(startedAt, undefined, now))` (`:170`). `sessionMinutes` rounds (end − start) to whole minutes, minimum 0 (`agent-connection.ts:381-384`). `formatMinutes` gives "45m", "2h" or "2h 5m" (`:386-391`). For a non-agent source (web/manual) the label is "web".

#### Demo side panel: "Timer"
- **Shows:** "Running since <hh:mm> (<elapsed>)" with a pulsing dot, or "Not running on this task". Fixed text: "One timer per person, whichever agent is talking to the PM platform."
- **Data source / calculation:** same `openSession` and `elapsed` (`:316-327`).

#### Demo side panel: "Task history"
- **Shows:** Up to 6 agent events for this task: time, agent badge, action text (e.g. "started the task", "moved it to In Review"), and detail in quotes.
- **Data source:** `agentEvents` filtered to `userId === user.id` and `taskId === task.id`, the **last 6 in array order**, newest shown first (`:60`). Action texts from `ACTION_TEXT` (`:20-29`).
- **Note:** Only agent events are shown. Web-app moves and other people's actions do not appear. Order is array (insertion) order, not sorted by time.
- **Empty state:** "Nothing yet."

#### "Rules the PM platform enforces" (6 cards)
- **Shows:** Your own work only; Never Done; One timer per person; Everything recorded; Forgotten timers stop ("After 2 hours without activity…"); Admins decide.
- **Data source:** hard-coded (`:353-363`).
- **Note:** "After 2 hours" is **hard-coded**. It does not follow the Organisation idle-timeout setting. Most of these rules are **not enforced** by the simulated actions (see 9.10).

#### Footer
- **Shows:** Button "Connect your agent" and the note "Prototype: agents and the MCP server are simulated with demo data." (`:365-370`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Task" dropdown | Chooses the demo task. Disabled after step 1 starts (`disabled={step > 0}`) | local state only | No (page state) | — |
| Step 1 "Ask Claude Code for your tasks" | Calls `agentListTasks('claude_code')` and shows the task list | `agentEvents` + `listed_tasks` event | Yes | none |
| Step 2 "Start <key> with Claude Code" | Calls `agentStartTask(task.id, 'claude_code')` | `workSessions` (closes any other open timer of the user with `endReason: 'switched_task'`, opens a new one with `source: 'claude_code'`), `tasks` (To Do → In Progress; parent To Do → In Progress if this is a subtask), `taskStatusChanges`, `agentEvents` (`paused` for the old timer + `started`) | Yes | Board card moves; timer badge appears on board (9.8). No notification, no activity log |
| Step 3 "Claude saves a progress note" | Calls `agentAddNote(task.id, 'claude_code', 'Form layout built; validation is next.')` | `agentEvents` + `note`; `lastActivityAt` of the user's open timer = now | Yes | Note is **not** added as a task comment |
| Step 4 "Claude runs out of usage" | Adds a system message only | none | — | No store change |
| Step 5 "Continue <key> in Antigravity" | Calls `agentContinueTask(task.id, 'antigravity')` | `agentEvents` + `continued` ("Picked up the running timer"); open timer on this task gets `lastActivityAt` = now | Yes | The session's `source` stays `claude_code` |
| Step 6 "Gemini saves a progress note" | `agentAddNote(task.id, 'antigravity', 'Validation added; unit tests are next.')` | as step 3 | Yes | — |
| Step 7 "Finish <key> with Codex" | `agentFinishTask(task.id, 'codex', 'Form with validation and unit tests. PR #142.')` | `workSessions` (open timer on this task ends, `endReason: 'finished'`, note = summary), `tasks` (status → `review` + a **task comment** "<summary>\n\n(via Codex)" by the current user), `taskStatusChanges` (from → review), `agentEvents` + `finished` | Yes | Card moves to In Review. No notification, no reviewer assigned |
| Next-step button (shows the next label; "Finished" at the end) | Runs the current step, appends messages, `step + 1`. Locks the task on first click. Disabled when finished | as above | — | — |
| "Start over" | Clears messages, step = 0, unlocks task choice | local state only | — | **Does not undo** any store change (timer, status, events, comment stay) |
| "Open the board" link (end box) | Goes to `/projects/<projectId>/board` | none | — | — |
| "See the timesheet" link | Goes to `/teams/timesheet` | none | — | — |
| "Connect your agent" | Goes to `/ai-agents/connect` | none | — | — |

**Notes, limits and simulated parts**
- The demo ignores all Organisation settings. It runs even if agent connections are turned off, if Claude Code/Codex/Antigravity are not allowed, or if the task's project is blocked. It also needs no token at all.
- The demo always acts as `s.currentUserId`. There is no ownership check inside the actions (the page itself filters to the user's tasks).
- The chat text is fixed. It claims "Any other running timer was paused first", which is true (`agentStartTask` does that). It says "Same timer, nothing counted twice", which is true because `agentContinueTask` only touches `lastActivityAt`.
- After a full run the task is In Review, so it leaves `myTasks`. Running again picks another task.
- Leaving the page loses the conversation, but all data changes stay.
- `pause_task` and `log_time` appear as tool names, but no demo step uses `agentPauseTask`, and no action produces a `time_logged` event.

---

### 9.3 Connect your AI agent (setup guide) — `/ai-agents/connect`

**File:** `src/app/(workspace)/ai-agents/connect/page.tsx` (+ `src/lib/agent-connection.ts`, `src/components/agents/code-block.tsx`, `create-token-dialog.tsx`, `agent-badge.tsx`)
**Who can open it:** Any signed-in user. The setup steps are hidden when the selected agent is not allowed (`agentSettings.enabled && agentSettings.allowedAgents[agent]`, `:31`).
**Purpose:** A 5-step guide that shows real-looking config commands for each agent, and fakes the "connection check".

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tokens | `useApp().agentTokens` (seed `MOCK_AGENT_TOKENS`, `mock-agent-activity.ts:196-222`; seed tokens belong to u5, u6, u14, u4 only) | filtered to the current user and status `active` (`:33-36`) |
| Agent settings | `useApp().agentSettings` (seed `DEFAULT_AGENT_SETTINGS`, `mock-agent-activity.ts:178-185`) | `enabled`, `allowedAgents`, `idleTimeoutMinutes`, `dayCutoff` |
| Projects | `useApp().projects` | AGENTS.md project picker |
| Config text | constants and functions in `src/lib/agent-connection.ts` | `PM_SERVER_URL = 'https://pm.example.com'` placeholder (`:7`) |
| Full token value | local `sessionToken` state, set by the Create Token dialog's `onCreated` (`:43,415`) | only during this page visit |

**Cards, widgets and lists**

#### Agent picker ("Which agent are you connecting?")
- **Shows:** 3 product cards: Claude Code (Anthropic), Codex (OpenAI), Gemini (Google). Each card shows "● Connected" / "○ Not connected" per app, or "Turned off by admin" in red.
- **Data source:** `AGENT_FAMILIES` (`agent-connection.ts:54-79`); connection state from tokens.
- **How it is calculated:** an app is "Connected" when **any active token of the current user** has `usedBy[client]` set (`isAppConnected`, `:54`). "Turned off by admin" when no app of the family passes `isAppAllowed` = `enabled && allowedAgents[client]` (`:55,114,130`).
- **Second picker (Gemini only):** "Which Gemini app are you setting up now?" with Gemini CLI and Antigravity, showing "● Connected" / "Not set up yet" (`:149-180`).
- **Coverage text:** `family.coverage` + "You can connect every agent with the same token…". No family defines `coverageVerify`, so the amber verify note under the picker (`:186`) never shows.

#### "Turned off for your organisation" box
- **Shows:** "<Agent> is turned off for your organisation. An Owner or Admin can allow it under AI Agent Hub › Organisation." It replaces all the steps below (`:189-196`).
- **How it is calculated:** `!agentAllowed`.

#### "Once connected, ask <Agent> things like"
- **Shows:** 5 example prompts from `TRY_PROMPTS` (`agent-connection.ts:278-284`, e.g. "Let's start FS-42") and a fixed note that agents can't mark Done.
- **Data source:** hard-coded.

#### Progress tile "<Agent> setup — X of 4"
- **Shows:** count, a progress bar, and "All set. You're connected." or "Next: step N".
- **How it is calculated (`:66-73`):**
  - step 1 done = user has ≥1 active token;
  - step 2 done = "I've saved my token" ticked on this page **or** any active token has `lastUsedAt`;
  - step 3 done = "I've connected <Agent>" ticked for this agent **or** connected;
  - step 4 done = connected (`usedToken` exists = an active token of the user with `usedBy[agent]`).
  - `completed` = number of trues; bar width = completed/4 × 100 %. Current step = first not-done step (5 when all done).
- **Note:** Step 5 is never counted.

#### "Before you start" info box
- Fixed text: install the agent and sign in with your own account (`:226-232`).

#### Step cards (collapsible)
- Each step is a `Step` card. A finished step folds and shows a summary line. You can open/close any step by clicking its header (`:459-494`). The current step has a highlighted border. Done steps show a green check.

#### Step 1 "Create your token (once per computer)"
- **Shows:** Explanation. If the user already has an active token: "You already have a token, so you can skip this step" + link "Manage tokens". Button "Create token" or "Create a token for another computer". After creating: "Your new token is filled into the steps below until you leave this page." Summary when folded: `Using "<newest token name>" (pmat_••••••••XXXX)`.
- **Data source:** `myActiveTokens`, `newestToken` = **last** active token in array order (`:38`).

#### Step 2 "Save the token on your computer (once)"
- **Shows:** OS tabs (Windows / macOS / Linux), the shell name, a command, a "check" command, and a tick box.
- **How it is calculated:** `saveTokenCommand(os, token)` (`agent-connection.ts:122-139`):
  - Windows (PowerShell): `setx PM_TOKEN "<token>"`; check `echo $env:PM_TOKEN`.
  - macOS (zsh): `echo 'export PM_TOKEN="<token>"' >> ~/.zshrc` + `source ~/.zshrc`; check `echo $PM_TOKEN`.
  - Linux (bash): same with `~/.bashrc`.
  - `<token>` is the just-created full token, otherwise the placeholder `pmat_paste_your_token_here` with a hint to replace it.
- Default OS from `detectOperatingSystem()` (user-agent contains "mac" → macOS, "linux" → Linux, else Windows; on the server always Windows) (`:114-120`).
- For Antigravity an extra line: "Antigravity may need the token pasted into its config in step 3 instead."

#### Step 3 "Connect <Agent>"
- **Shows:** "Set up in: <where>", sub-steps with code blocks, an amber "To confirm in the pilot:" note where the recipe is unverified, and a tick box.
- **How it is calculated:** `agentSetup(agent, token)` (`agent-connection.ts:183-233`):
  - **Claude Code:** `.mcp.json` with `mcpServers.pm = { type: 'http', url: '${PM_URL:-https://pm.example.com}/mcp', headers: { Authorization: 'Bearer ${PM_TOKEN}' } }` (no token inside); "Commit it"; approve the server; or personal setup: `claude mcp add --scope user --transport http pm https://pm.example.com/mcp --header "Authorization: Bearer <token>"` (**the full token is written into this command** when one was just created).
  - **Codex:** `~/.codex/config.toml` with `[mcp_servers.pm]`, `url = "https://pm.example.com/mcp"`, `bearer_token_env_var = "PM_TOKEN"`. Verify note about older Codex versions.
  - **Gemini CLI:** `~/.gemini/settings.json` with `mcpServers.pm = { httpUrl, headers: { Authorization: 'Bearer $PM_TOKEN' } }`, or `gemini mcp add --transport http --header "Authorization: Bearer $PM_TOKEN" pm https://pm.example.com/mcp`. Verify note: whether Gemini expands `$PM_TOKEN` in headers.
  - **Antigravity:** `mcp_config.json` with `mcpServers.pm = { serverUrl, headers: { Authorization: 'Bearer <token>' } }` (**full token pasted in**). Verify note about reading PM_TOKEN and file location.

#### Step 4 "Check the connection"
- **Shows:** per-agent check commands from `CHECK_STEPS` (`claude mcp list`, `codex mcp list`, `gemini mcp list`, or Antigravity's "Manage MCP servers"), "Ask <Agent>: 'What tasks do I have?' It should list your tasks from pm.example.com". Then a status box: green "<Agent> is connected — The PM platform last heard from <Agent> on '<token name>' <relative time>." or grey "Not connected yet — This turns green the first time the agent talks to the PM platform." Button "Check connection". Italic note "Prototype: the check is simulated until the PM MCP server is running." A collapsible "Something not working?" list of 5 problems/fixes (`TROUBLESHOOTING`, `agent-connection.ts:255-276`). When connected and the other Gemini app is still free: a dashed button "Also use <other app>?".
- **Data source:** `usedToken`, `lastUsedByAgent = usedToken.usedBy[agent]` (`:39-40`).

#### Step 5 "Add the shared instructions (once per repository)" — tag "Recommended"
- **Shows:** project dropdown; the `AGENTS.md` text from `agentsMd(projectKey)` (`agent-connection.ts:289-304`) with the project key inserted; per-agent text from `INSTRUCTION_FILES` (Claude: `CLAUDE.md` containing `@AGENTS.md`; Codex: nothing; Gemini CLI: copy into GEMINI.md; Antigravity: add as workspace rule). Gemini/Antigravity get an amber verify note.
  - Claude Code only: "Claude Code extras", two collapsible blocks: (1) `.claude/settings.json` permissions allowing `mcp__pm__list_my_tasks`, `mcp__pm__get_task`, `mcp__pm__get_active_work`; (2) hooks JSON (`SessionStart` / `SessionEnd`) plus two Node scripts that call `https://pm.example.com/api/agent/active-work` and `/api/agent/active-work/pause` (**these endpoints do not exist**).
  - Other agents: "Forgot to pause…? The PM platform stops your timer after {Math.round(idleTimeoutMinutes / 60)} hours without activity, or at {dayCutoff}…" (`:400-403`).
- **Done state:** always `done={false}`. Never shows as done.

#### Bottom note
- "Connecting another agent? Pick it at the top. Steps 1 and 2 are already done; just do steps 3 and 4 for that agent." (fixed text).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Product card (Claude Code / Codex / Gemini) | Selects the family's first app not yet connected (or its first app); clears the check error (`:60-65`) | local state | No | Steps re-render for that agent |
| Gemini app card (Gemini CLI / Antigravity) | Selects that app; clears check error | local state | No | — |
| "Manage tokens" link | Goes to `/ai-agents/tokens` | none | — | — |
| "Create token" / "Create a token for another computer" | Opens Create Token dialog (9.4) with `onCreated={setSessionToken}` | via dialog: `agentTokens` | token record Yes; full value No | Full value filled into all code snippets on this page until you leave |
| Step header (any step) | Opens/closes the step card | local state | No | — |
| OS tabs Windows / macOS / Linux | Switches the command set | local state | No | — |
| "Copy" on any code block | `navigator.clipboard.writeText(code)`; label shows "Copied" for 2 s (`code-block.tsx:7-16`) | none | — | Silently does nothing if clipboard is unavailable |
| "I've saved my token" tick box | Marks step 2 done for this page visit. Disabled once connected | local `manualDone.save` | **No** — lost on leaving the page | Progress tile updates |
| "I've connected <Agent>" tick box | Marks step 3 done for this agent. Disabled once connected | local `manualDone['connect-<agent>']` | **No** | Progress tile updates |
| "Check connection" | If the user has no active token: shows error "Create a token first (step 1)." Otherwise shows "Checking…" spinner, and after a **1.2 s `setTimeout`** calls `markAgentTokenUsed(newestToken.id, agent)` (`:79-90`) | `agentTokens`: `lastUsedAt = now`, `usedBy[agent] = now` on the newest active token | Yes | Always "succeeds". **No network request, no check of steps 2–3, no check of the token value.** Step 2 also becomes done (any `lastUsedAt`) |
| "Something not working?" | Expands/collapses the troubleshooting list (`<details>`) | none | — | — |
| "Also use <other app>?" | Switches to the other Gemini app | local state | No | — |
| Project dropdown (step 5) | Changes the project key inside `AGENTS.md` | local state (default: first project's key, or `FS`) | No | — |
| "Skip the approval prompt…" / "Resume check and auto-pause" (Claude only) | Expands code blocks | none | — | — |

**Notes, limits and simulated parts**
- **"Check connection" is fake.** It just stamps the newest active token as used by the selected agent after 1.2 s. It marks the **newest** token even if a different token is on that computer.
- All URLs point to the placeholder `https://pm.example.com`. The hook scripts call API paths that do not exist.
- The full token appears in the Windows/macOS/Linux commands and in two Step-3 snippets (Claude "personal setup" and Antigravity config). It only appears if it was created in this page visit; otherwise the placeholder shows.
- Copy-to-clipboard text for "Save the token" commands includes the real token value, so it may end up in shell history (`setx`) or `~/.zshrc`/`~/.bashrc`. This is what the guide intends, but it is worth knowing.
- Grammar/accuracy bug in step 5 text: `Math.round(idleTimeoutMinutes / 60)` + "hours". With 30 or 60 minutes it says "1 hours". With 30 minutes it is also wrong (it says 1 hour). (`:402`)
- Possible hydration mismatch: `detectOperatingSystem()` returns "windows" on the server, but "macos"/"linux" in the browser for those users (`:47`). Unclear whether React reports a warning in practice.
- Progress tick boxes are not saved. After navigation, steps 2–3 count as done only if a token has been "used" (checked).
- Only the selected agent's allowed state is checked. `blockedProjectIds` is not used, so the step-5 project picker also lists blocked projects.

---

### 9.4 Create token dialog (modal)

**File:** `src/components/agents/create-token-dialog.tsx` (used on `/ai-agents/connect` and `/ai-agents/tokens`)
**Who can open it:** Anyone on those pages. Renders nothing if there is no current user (`:26`).
**Purpose:** Creates a personal access token record and shows the full value once.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Current user | `useCurrentUser()` | token `userId` |
| Expiry options | `TOKEN_EXPIRY_OPTIONS` (`agent-connection.ts:13-17`): 30 days, 90 days (recommended), 1 year | default 90 |

**Cards, widgets and lists**

#### Form view ("Create a personal token")
- Name field (default "Work laptop"), "Expires after" dropdown, explanation that the token can't mark Done or change others' work.

#### Result view ("Copy your token now")
- Amber warning "This is the only time the full token is shown…", a code block with the full token (label = token name), tick box "I've copied my token", "Done" button. The close "X" is hidden in this view.

**How the token is generated (exact):** `generateTokenValue()` (`agent-connection.ts:88-92`): 32 random bytes from `crypto.getRandomValues`; each byte → `BASE62[b % 62]`; result `'pmat_' + 32 characters`. (Small detail: `% 62` on a byte gives a slight bias to the first 8 characters A–H. This matters only if this code were reused for real.)

**What is stored:** `addAgentToken({ id: 'tok-<Date.now()>', userId, name: trimmed name, lastFour: last 4 characters, createdAt: now, expiresAt: now + N days })` (`:46-53`). **The full token value is never put in the store and never saved to localStorage.** Only `lastFour` is saved. No hash is stored either. The full value lives only in the dialog's React state (`created`) and, on the Connect page, in `sessionToken` state.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Name input | Edits name. Pressing Enter runs Create (ignored if empty) | local | — | — |
| "Expires after" dropdown | 30 / 90 / 365 days | local | — | — |
| "Create token" | Disabled if name is blank. Generates the value, calls `addAgentToken`, switches to result view, calls `onCreated(value)` | `agentTokens` + new record (`app-context.tsx:1778`) | Yes (record only, without the full value) | No toast, no notification, no audit log |
| "Cancel" / "X" | Resets the form and closes | none | — | — |
| "Copy" on the token block | Copies the full token to clipboard | none | — | — |
| "I've copied my token" tick box | Enables "Done" | local | — | — |
| "Done" | Resets and closes | none | — | The full value is gone from this dialog |

**Notes, limits and simulated parts**
- No Escape-key or backdrop-click close.
- Duplicate names are allowed. There is no limit on the number of tokens.
- The token value is never checked anywhere (there is no server). It is just shown so it can be copied.

---

### 9.5 My Tokens — `/ai-agents/tokens`

**File:** `src/app/(workspace)/ai-agents/tokens/page.tsx` (+ `create-token-dialog.tsx`, `agent-badge.tsx`, `src/components/settings/settings-layout.tsx`)
**Who can open it:** Any signed-in user.
**Purpose:** Lists the current user's tokens and lets them create or revoke tokens.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tokens | `useApp().agentTokens` (seed `MOCK_AGENT_TOKENS`) | only `t.userId === currentUser.id`, newest `createdAt` first (`:29-32`) |

**Cards, widgets and lists**

#### "Your tokens" table
- **Shows:** columns Name, Token (masked `pmat_••••••••<lastFour>`, `maskedToken` at `agent-connection.ts:102`), Status pill (Active / Expired / Revoked), Used by (one coloured agent mark per agent in `usedBy`, or "—"), Last used (relative time or "Never"), Created (e.g. "Oct 30, 2026"), Expires (date, or "Revoked <date>" for revoked tokens), and a Revoke button for active tokens. Non-active rows are faded.
- **How it is calculated:** `tokenStatus()` (`agent-connection.ts:96-100`): `revokedAt` set → revoked; `expiresAt` < now → expired; else active.
- **Empty state:** "You don't have any tokens yet." + link "Follow the setup guide" → `/ai-agents/connect`. The seed tokens belong to u4, u5, u6 and u14, so the default (u1) user and any newly signed-up user start with an empty list.

#### Footer note
- Fixed text: one token per computer; tokens can move tasks to In Progress/In Review only; admins can revoke (`:114-117`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "+ Create token" (header) | Opens Create Token dialog (no `onCreated`, so the value is only shown in the dialog) | via dialog: `agentTokens` | Yes (record only) | — |
| "Revoke" (row) | Browser `confirm("Revoke …? Any AI agent using it stops working immediately.")`; on OK calls `revokeAgentToken(id)` | `agentTokens`: sets `revokedAt = now` (`app-context.tsx:1779-1782`) | Yes | Row shows "Revoked"; Connect page shows that agent as not connected if no other active token has it in `usedBy`. Nothing else "stops" because nothing uses the token |
| "Follow the setup guide" link (empty state) | Goes to `/ai-agents/connect` | none | — | — |

**Notes, limits and simulated parts**
- There is no delete, rename or "extend expiry". Revoked and expired tokens stay listed forever.
- "Used by" and "Last used" only change through the fake "Check connection" button (or seed data).

---

### 9.6 Organisation (agent rules for the whole org) — `/ai-agents/organisation`

**File:** `src/app/(workspace)/ai-agents/organisation/page.tsx`
**Who can open it:** Anyone can open the URL. If `canManageAgents(demoRole)` is false (role is not `ceo`, `org_admin` or `platform_admin`), the page shows only "Only Owners and Admins can change these settings." with a lock icon (`:18-26`). The tab is also hidden for those roles. Because a new sign-up gets role `org_admin`, a newly signed-up account **does** see this page.
**Purpose:** Organisation-wide switches for agent connections, time-tracking rules, project access, and an all-tokens list.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Agent settings | `useApp().agentSettings` (seed `DEFAULT_AGENT_SETTINGS`: enabled true, all 4 agents allowed, idle 120 min, cutoff "20:00", claim unassigned true, no blocked projects) | |
| All tokens | `useApp().agentTokens` | sorted by `lastUsedAt` newest first; never-used last (`:38`) |
| Users | `useApp().users` | token owner name |
| Projects | `useApp().projects` | **all** projects, no archive filter |

**Cards, widgets and lists**

#### "AI agent connections"
- One toggle "Allow people to connect AI agents" with text "Turning this off stops every agent connection at once…". When off, the next three cards are faded and their controls disabled (`:39`).

#### "Allowed agents"
- For each family/app: agent badge, vendor (or "where" text for Gemini apps), and a switch (`:58-80`). The family heading "Gemini · Google" is shown only for Gemini (2 apps).

#### "Time tracking rules"
- Dropdown "Stop a timer after no activity for": 30 minutes / 1 hour / 2 hours / 4 hours (`IDLE_OPTIONS`, `:13,93`).
- Time input "Stop all timers at the end of the day at" (HH:MM). The help text says "In each person's own time zone".
- Toggle "Let people claim unassigned tasks through their agent".

#### "Projects AI agents may access"
- One switch per project "<KEY> · <Name>". On = not in `blockedProjectIds`.

#### "Everyone's connections" table
- Columns: Person (name, or the raw userId if the user is unknown), Token (name + masked value), Agents used (agent marks or "—"), Last used ("Never" or relative), Status (lower-case word, capitalised by CSS), Revoke button for active tokens. Not faded/disabled when connections are turned off.
- **Empty state:** none. An empty table body just shows headers.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Allow people to connect AI agents" toggle | `updateAgentSettings({ enabled })` | `agentSettings.enabled` (`app-context.tsx:1894-1897`) | Yes | Connect page shows "turned off" for every agent. Nothing else changes (see 9.10) |
| Agent switch (×4) | `updateAgentSettings({ allowedAgents: {...,[agent]: on} })`. Disabled when connections are off | `agentSettings.allowedAgents` | Yes | Only the Connect page reacts |
| Idle timeout dropdown | `updateAgentSettings({ idleTimeoutMinutes: Number(value) })` | `agentSettings.idleTimeoutMinutes` | Yes | **Enforced** by the 60-second auto-stop check (`applyAutoStops`) for all running timers of all users |
| Day cutoff time input | `updateAgentSettings({ dayCutoff: value })` | `agentSettings.dayCutoff` | Yes | **Enforced** by `applyAutoStops`. See the crash bug in notes |
| "Let people claim unassigned tasks" toggle | `updateAgentSettings({ allowClaimUnassigned })` | `agentSettings.allowClaimUnassigned` | Yes | **None** — not read anywhere else |
| Project switch (one per project) | Adds/removes the project id in `blockedProjectIds` | `agentSettings.blockedProjectIds` | Yes | **None** — not read anywhere else |
| "Revoke" (row) | `confirm("Revoke <name>'s token…?")`, then `revokeAgentToken(t.id)` | `agentTokens.revokedAt` | Yes | Works for any user's token, including other people's |

**Notes, limits and simulated parts**
- "Changes apply immediately" is true for the stored values. But only `enabled`, `allowedAgents`, `idleTimeoutMinutes` and `dayCutoff` have any effect, and the first two only change what the Connect page shows (see 9.10).
- There is no "Save" button and no confirmation; every change is written at once.
- **Bug: clearing the day-cutoff time can crash the app (confirmed by logic, not run in the browser).** If the time input is cleared, `dayCutoff` becomes `''`. In `shiftEnd()` (`src/lib/task-time.ts:10-19`) `''.split(':').map(Number)` gives `[0]`, so `setHours(0, undefined, …)` produces an invalid date (NaN). `autoStopFor` then picks `day_cutoff` with `triggerAt = NaN`, so `now < NaN` is false and the timer is stopped. `new Date(NaN).toISOString()` throws "Invalid time value" (`task-time.ts:41`). This happens inside the 60-second `setState` updater (`app-context.tsx:589-594`) whenever any timer is open (the seed has one running timer for u5). The empty value is saved in localStorage, so the error would repeat on every load until the storage is cleared. (I checked the JS behaviour with Node: `setHours(0, undefined)` → NaN, and `toISOString()` on NaN throws.)
- The help text "In each person's own time zone" is not true. `shiftEnd` uses the **browser's** local time for every user's timer.
- `agentSettings.enabled = false` does not stop running timers and does not mark tokens as inactive.

---

### 9.7 Agent run detail (old demo page) — `/ai-agents/runs/[runId]`

**File:** `src/app/(workspace)/ai-agents/runs/[runId]/page.tsx` (+ `AgentRunStatusBadge` in `src/components/shared/badges.tsx:117`)
**Who can open it:** Any signed-in user with the URL. No role check. No tab bar (path is not a tab). Unknown `runId` → Next.js `notFound()` (404).
**Purpose:** Shows a fake "agent run" log with checks and an approve button. The comment in `/ai-agents/page.tsx:3-4` says the old "agent runs" list page was removed. This detail page is still reachable only by typing the URL or through the seed notification `n2` for user u5 ("Agent run completed", link `/ai-agents/runs/run3`, `src/data/mock-data.ts:1093`).

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Agent run | `useApp().agentRuns` (seed `MOCK_AGENT_RUNS`, `src/data/mock-data.ts:946-1000`: `run1` completed + approved, `run2` running, `run3` needs_review) | found by `runId` |
| Task, triggering user, approver | `tasks`, `users` | |

**Cards, widgets and lists**

#### Header
- Task title (or "Agent Run"), task key, "Triggered by <name>", relative start time, and the status badge.

#### "Agent Execution Log" (terminal look)
- One line per `run.events` item: icon/colour by type (info, success, warning, error, code), relative time, message, optional detail. If status is `running`, a pulsing "Running…" line. All text is seed data.

#### "Agent Output"
- `run.output` text, shown only if present.

#### "Verification Checks"
- Each check with a green tick (passed), red X (failed) or clock (pending), label and detail.
- Approval area: "Approved by <name>" if `approvedBy` is set; otherwise the "Approve & Close" button if `canApprove`; otherwise a text: "Some checks failed — approval blocked", "Waiting for checks to complete", or "Run in progress".
- `canApprove` = status is `completed` or `needs_review`, AND not approved yet, AND **every** check is `passed` (`:28-29`).

#### "Run Stats"
- Status (underscore → space), Tokens Used, Cost Estimate (`$x.xx`), Started, Completed (or "In progress"). All from seed values (e.g. 18,420 tokens / $0.55 for run1).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "← AI Agents" link | Goes to `/ai-agents` → redirect to How it works | none | — | — |
| "Approve & Close" | Shows loading; after a **1.2 s `setTimeout`** calls `updateAgentRun(runId, { approvedBy: currentUserId, approvedAt: now })` | `agentRuns` (`app-context.tsx:2542-2545`) | Yes | Status and task are **not** changed ("Close" does nothing). No notification. **With seed data this button never appears**: run1 is already approved, run2 has pending checks, run3 has a failed check |

**Notes, limits and simulated parts**
- Everything on this page is static seed data. Nothing creates runs: `addAgentRun` (`app-context.tsx:2541`) is **never called** anywhere in the UI.
- Runs are saved in localStorage (`agentRuns` is in `saveState`).

---

### 9.8 Shared agent components used on other screens

**Files:** `src/components/agents/my-work-card.tsx`, `task-timer-badge.tsx`, `agent-badge.tsx`, `code-block.tsx`
**Who can open it:** wherever they are rendered.
**Purpose:** Show agent/timer information outside the hub.

**Cards, widgets and lists**

#### "My work today" card (on `/projects/home`, `src/app/(workspace)/projects/home/page.tsx:132`)
- **Shows:** (1) Timer box: "Timer running", task key · title (click opens the task drawer), elapsed time and "started via <badge>". Or "No timer running" + hint, and a "Connect your AI agent" link if the user has no active token. (2) Hours: "Today" and "Last 5 working days". (3) "Latest from your agents": 3 newest agent events (excluding `listed_tasks`), e.g. "[C] started FSV2-102-2 · 2 hours ago". (4) An amber bar "N timers were stopped automatically. Please check your timesheet." when any of the user's sessions has `needsReview`.
- **Data source:** `workSessions`, `agentEvents`, `agentTokens`, `tasks` (`:26-54`).
- **How it is calculated:** running = first session of the user with no `endedAt`. Today = sum of `sessionMinutes` for sessions whose **start** date is today. Week = sum for sessions starting on or after the first of `lastWorkdays(now)` (the 5 most recent Mon–Fri days including today, `agent-connection.ts:394-403`). A running session counts up to now. A session is counted fully on the day it started, even if it ran past midnight.
- **Empty state:** "Nothing yet." for the events list; "—" for hours until the clock is ready.

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "+ Log time" link | `/teams/timesheet?log=1` | none | — | — |
| "Open my timesheet →" | `/teams/timesheet` | none | — | — |
| Running task title | `openTaskDrawer(taskId)` | `activeTaskDrawerId` | No (not saved) | Drawer opens |
| "Connect your AI agent" | `/ai-agents/connect` | none | — | — |
| Amber "timers were stopped automatically" bar | `/teams/timesheet` | none | — | — |

#### Task timer badge (Kanban cards, `src/app/(workspace)/projects/[projectId]/board/page.tsx:319`)
- **Shows:** while any timer is open on the task or its subtasks: "⏱ <Claude Code | Codex | … | Web app> · 1h 20m" (tooltip names the subtask). Otherwise the total worked time "⏱ 5h 20m", or nothing if 0.
- **How it is calculated:** sessions where `taskId` is the task or one of its direct subtasks; total = sum of `sessionMinutes` (`task-timer-badge.tsx:17-23`). "manual" source shows "Web app". Only one open session is shown (the first found), even if two people have timers on the same task.

#### Agent badge
- Small coloured square with a letter + name: Claude Code "C", Codex "X", Gemini CLI "G", Antigravity "A", Web app "W", Manual entry "M", PM platform "P" (`agent-badge.tsx:7-11`, `agent-connection.ts:30-35`).

#### Code block
- Dark box with label and a Copy button (copied state lasts 2 s).

---

### 9.9 Store actions behind the hub (reference)

All in `src/context/app-context.tsx`. All of these collections are saved to localStorage (`flashsign-proto-state-v6`). None of these actions add notifications or audit/activity logs.

| Action | Line | What it really does | Called from UI? |
|---|---|---|---|
| `addAgentToken(token)` | 1778 | Appends the token record as given | Create Token dialog |
| `revokeAgentToken(id)` | 1779-1782 | Sets `revokedAt = now` | My Tokens, Organisation |
| `markAgentTokenUsed(id, agent)` | 1783-1789 | Sets `lastUsedAt = now` and `usedBy[agent] = now` | Connect › "Check connection" (after 1.2 s timeout) |
| `agentListTasks(agent)` | 1793-1796 | Adds a `listed_tasks` event for the current user. Reads nothing | How it works step 1 only |
| `agentStartTask(taskId, agent)` | 1797-1820 | No-op if the user's open timer is already on this task, or if the task has subtasks. Otherwise: ends the user's other open timer (`endReason: 'switched_task'`) + `paused` event; opens a new session `ws-<now>` with `source = agent`; moves a To Do task to In Progress (+ status change `via: agent`); if it is a subtask whose parent is To Do, moves the parent to In Progress and into the board's first In Progress column (`startParentOf`, `:223-237`); adds `started` event. **No checks** of assignee, project block, allowed agent, token, or `allowClaimUnassigned` | How it works step 2 only |
| `agentContinueTask(taskId, agent)` | 1821-1830 | Sets `lastActivityAt = now` on the user's open timer for that task; adds `continued` event. Does not start a timer if none is open | How it works step 5 only |
| `agentAddNote(taskId, agent, text)` | 1831-1840 | Sets `lastActivityAt = now` on the user's open timer (any task); adds `note` event with the text | How it works steps 3 and 6 only |
| `agentPauseTask(agent, note?)` | 1841-1852 | Ends the user's open timer with `endReason: 'paused'`, adds `paused` event | **Never called** |
| `agentFinishTask(taskId, agent, summary)` | 1853-1878 | Ends the open timer on that task (`finished`, note = summary); sets task status to `review` from **any** status (even `done`); adds a task comment "<summary>\n\n(via <Agent>)"; adds status change (if not already review); adds `finished` event. Parent task is not moved | How it works step 7 only |
| `updateAgentSettings(updates)` | 1894-1897 | Shallow-merges into `agentSettings` | Organisation page |
| `updateWorkSession(id, updates)` | 1898-1901 | Shallow-merges into one session | Not in the hub. Used by `/teams/timesheet` (`src/app/(workspace)/teams/timesheet/page.tsx:178,188`) to fix/confirm auto-stopped timers (see the Teams section) |
| `addAgentRun(run)` | 2541 | Appends a run | **Never called** |
| `updateAgentRun(id, updates)` | 2542-2545 | Shallow-merges into one run | Run detail "Approve & Close" |

Related automatic behaviour (`app-context.tsx:588-617`): every 60 s `applyAutoStops(workSessions, agentSettings, now)` stops every open session (all users, all sources) when `lastActivityAt + idleTimeoutMinutes` or the day cutoff has passed, whichever comes first. Idle stop ends the session at the last activity time; cutoff stop ends it at the cutoff. A timer started after the cutoff runs until midnight. The stopped session gets `needsReview: true`, and a `system` `auto_stopped` event is added (`src/lib/task-time.ts:21-52`). Pointer/key events in the web app only refresh `lastActivityAt` for the current user's **web**-source timer. Agent-source timers only get activity from `agentContinueTask`/`agentAddNote`, so the seed running timer (u5, `claude_code`) will be auto-stopped about 2 hours after the data was first loaded. Its `lastActivityAt` is "now − 10 min" at first load (`mock-agent-activity.ts:110`), and after that the saved value is reused.

---

### 9.10 Are the organisation agent settings actually enforced?

| Setting | Where it is read | Enforced? |
|---|---|---|
| `enabled` (Allow people to connect AI agents) | `connect/page.tsx:31,55` (hide steps / "Turned off by admin"); Organisation page (fades controls) | **Only in the Connect page UI.** The `agent*` actions, the How-it-works demo, `tokenStatus()` and the token tables ignore it. Running timers keep running |
| `allowedAgents[agent]` | `connect/page.tsx:31,55` | **Only in the Connect page UI.** The How-it-works demo still uses Claude Code, Antigravity and Codex when they are switched off |
| `idleTimeoutMinutes` | `src/lib/task-time.ts:23,43` via the 60-s interval (`app-context.tsx:592`); display texts in `connect/page.tsx:402` and `src/components/reports/task-time-report.tsx:405` | **Yes**, for all running timers of all users (web, manual and agent). The How-it-works "Rules" card still says "2 hours" (hard-coded) |
| `dayCutoff` | `src/lib/task-time.ts:24,44`; display texts as above | **Yes**, but in the browser's local time zone, not "each person's own time zone". An empty value can crash the app (9.6) |
| `allowClaimUnassigned` | Organisation page only | **No.** Not read anywhere else. No claim feature exists |
| `blockedProjectIds` | Organisation page only | **No.** Not read anywhere else (not by the demo, the Connect project picker, or any action) |

Other "rules" shown in the UI ("Your own work only", "Never Done", "Admins can revoke tokens and agents stop working") are design statements. In the simulation: ownership is not checked inside the actions; `agentFinishTask` never sets Done, but it can move a Done task back to In Review; a revoked token has no effect because no action looks at tokens.

---

### 9.11 Token storage and security (prototype)

- **The full token is NOT stored in localStorage.** The saved `AgentAccessToken` (`src/types/index.ts:523-535`) has only `id`, `userId`, `name`, `lastFour`, `createdAt`, `expiresAt`, `lastUsedAt`, `usedBy`, `revokedAt`. These are saved in plain JSON under `flashsign-proto-state-v6` (`app-context.tsx:546`), so names, last four characters and usage times are readable by anyone with access to the browser.
- The full value exists only in memory: in the dialog (`created` state) until "Done"/close, and on the Connect page (`sessionToken` state) until you leave the page. It is shown in plain text in the code blocks and copied to the clipboard on "Copy".
- No hash is stored, so even in principle the app could not verify a token. The comment at `agent-connection.ts:87` says "The real server generates and hashes these".
- Tokens are created in the browser, not by a server.

---

### 9.Z Data flow summary for this area

- **Reads:** `agentTokens`, `agentSettings`, `agentEvents`, `workSessions`, `agentRuns`, `tasks`, `projects`, `users`, `currentUserId`, `demoRole` (for `canManageAgents`).
- **Writes:** `agentTokens` (create, revoke, mark used), `agentSettings` (Organisation), `agentEvents`, `workSessions`, `tasks` (status + finish comment), `taskStatusChanges` (How-it-works demo), `agentRuns` (approve). All of these are saved to localStorage. Page-local state (demo conversation, setup tick boxes, OS tab, full token value) is not saved.
- **Store actions used in the UI:** `addAgentToken`, `revokeAgentToken`, `markAgentTokenUsed`, `agentListTasks`, `agentStartTask`, `agentContinueTask`, `agentAddNote`, `agentFinishTask`, `updateAgentSettings`, `updateAgentRun`, `openTaskDrawer` (My work card). `updateWorkSession` is used only by `/teams/timesheet`.
- **Defined but never called:** `agentPauseTask`, `addAgentRun`. The `time_logged` event action is never produced.
- **Automatic:** the 60-second `applyAutoStops` loop reads `agentSettings.idleTimeoutMinutes`/`dayCutoff` and writes `workSessions` + `agentEvents`.
- **External:** none. No MCP server, no HTTP calls. All URLs shown point to the placeholder `https://pm.example.com`.

---

## 10. Agreements, e-signatures and company seals

This area covers the Agreements home page, the signature "Inbox" tabs (All, Action Required, Sent, Completed, Declined, Expired, Drafts), the 5-step "Request Signature" wizard, the request detail / fields / audit / completion pages, the signing screen, and Agreement Settings (signing defaults and company seals). **Everything here is simulated in the browser.** There is no PDF, no real e-signature, no email, no identity check and no automatic expiry or reminders. The most important limit: **`signatureRequests` are not saved**. Every new request, signature, decline, cancel, duplicate and field change is lost when the page is refreshed (see 10.X).

Note on the current user and role: after sign-in, the effect at `src/context/app-context.tsx:622-672` sets `currentUserId` to the signed-in account's id and `demoRole` to that account's role ('executive' becomes `ceo`, 'qa' becomes `qa_tester`). Several screens here match the current user **by email** against signer emails, or **by id** against `senderId`. The demo login accounts (`src/types/demo-auth.ts:241-317`, for example `demo@flashsign.com` / `user-demo` / role `org_admin`) do **not** match any seed signer email or seed `senderId` (`u1`, `u2`, `u9`). So with the seed data, "Needs Your Signature", "Action Required" and "Sent" are empty for these accounts until they create their own request.

Seed data used by this area: `MOCK_SIGNATURE_REQUESTS` (`src/data/mock-documents.ts:1008`, 13 requests: sig-13 and sig-1 `sent`, sig-3 `viewed`, sig-2/5/6/7/11/12 `completed`, sig-4 and sig-9 `draft`, sig-8 `declined`, sig-10 `expired`). Dates are relative to "today" (helpers `d()`/`dt()` at `src/data/mock-documents.ts:11-22`). Only sig-13 has a `senderName` (`src/data/mock-documents.ts:1014`). Other seed requests have only `senderId`, so pages that print `req.senderName` directly show an empty "Sender:" for them.

---

### 10.1 Agreements Home — `/agreements`

**File:** `src/app/(workspace)/agreements/page.tsx`
**Who can open it:** Any signed-in user. There is no role check on the page, and the sidebar does not filter groups by role (`canAccess` is imported in `src/components/layout/app-sidebar.tsx:17` but never called). It is the default page for `document_manager` and `client` (`src/lib/permissions.ts:72,78`).
**Purpose:** A dashboard of signature requests: summary numbers, the requests waiting to be signed, recent activity, the next expirations and drafts.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signature requests | `useApp().signatureRequests` (seed `MOCK_SIGNATURE_REQUESTS`) | Not saved. Resets on refresh |
| Document items | `useApp().documentItems` (seed `MOCK_DOCUMENT_ITEMS`) | Only used for the Drafts card (documents with `status === 'draft'`) |
| Users | `useApp().users` | Used to find a sender name when `senderName` is missing (`:54-55`) |
| Current user | `useCurrentUser()` | First name for the greeting, and email for "Needs Your Signature" |

Shared definitions (`:57-97`):
- `sent` = all requests whose status is not `draft`. This **includes** completed, declined, expired and cancelled.
- `inFlight` = sent requests with status `sent`, `viewed` or `partially_signed` (`IN_FLIGHT`, `:32`), sorted by `expiresAt`, earliest first.
- `daysLeft(date)` = `Math.ceil((expiresAt − now) / 1 day)`.
- `myTurn` = in-flight requests where some signer has `email === currentUser.email` and signer status `pending` or `viewed` (`:68-72`). The code comment says "same rule as /signatures/waiting", but the Waiting page uses a different rule (see 10.4).

**Cards, widgets and lists**

#### Hero / greeting
- **Shows:** "Agreements", "Welcome back, {first name}" and a short explanation.
- **Data source:** `currentUser.name.split(' ')[0]` (`:51`).
- **How it is calculated:** The first word of the user's name. If there is no user it shows "Welcome back".

#### KPI tile "All Requests"
- **Shows:** A count, with the note "{n} drafts not sent yet".
- **How it is calculated:** value = `sent.length` (all non-draft requests). Note = `signatureRequests.length − sent.length` (the number of drafts) (`:82-83`). Links to `/signatures/all`, which also lists drafts, so the count there will be higher.
- **Seed value:** 11, with 2 drafts.

#### KPI tile "Completed"
- **Shows:** The number of completed requests and "{x}% of sent requests".
- **How it is calculated:** `completed` = sent requests with status `completed`. **Completion rate = `Math.round(completed / sent × 100)`**, or 0 when `sent` is 0 (`:84-85`). The bottom of the fraction includes declined, expired and cancelled requests.
- **Seed value:** 6, 55% (6/11).

#### KPI tile "In Progress"
- **Shows:** The number of in-flight requests and "{a} signed · {b} left".
- **How it is calculated:** value = `inFlight.length`. `signaturesDone` = the sum over in-flight requests of signers with status `signed`. `signaturesLeft` = the sum of `signers.length` minus `signaturesDone` (`:74-75,86-88`). Every signer counts here, including optional ones.
- **Seed value:** 3. "1 signed · 5 left".

#### KPI tile "Needs Your Signature"
- **Shows:** `myTurn.size` and "Waiting on you". Links to `/signatures/waiting`.
- **How it is calculated:** See the definition of `myTurn` above (`:89`). A signer whose status is `waiting` (later in a sequential order) is **not** counted.
- **Seed value:** 0 for the demo login accounts, because no seed signer email matches them.

#### KPI tile "Expiring Soon"
- **Shows:** A count and "Within 7 days".
- **How it is calculated:** In-flight requests where `daysLeft(expiresAt) <= 7` (`EXPIRING_SOON_DAYS`, `:23,90`). Requests that are **already past** their expiry date (negative days) are also counted, because they stay in-flight (there is no automatic expiry). Links to `/signatures/all`, which has no expiry filter.
- **Seed value:** 0 (the in-flight seed requests expire in 8, 10 and 14 days).

#### KPI tile "Declined / Expired"
- **Shows:** A count and "Need a new request".
- **How it is calculated:** Sent requests with status `declined`, `expired` **or `cancelled`** (`:91`). The label does not mention cancelled. Links to `/signatures/declined`, which shows only declined requests.
- **Seed value:** 2.

#### Card "Awaiting Signature"
- **Shows:** Up to 5 in-flight requests (`inFlight.slice(0,5)`). Each row shows the title (a link to the detail page), "From {sender}", "{signed} of {total} signed", "Expires {date}", a status badge, and a **Sign** button (when it is the current user's turn) or a **View** button.
- **Data source:** `inFlight`, `myTurn` (`:241-279`).
- **How it is calculated:** The sender is `senderName`, else the matching user's name by `senderId`, else "Unknown sender" (`:54-55`).
- **Empty state:** "Nothing is out for signature right now."

#### Card "Recent Activity"
- **Shows:** The 5 most recent sent requests: title, sender, "Sent {date}", "Completed {date}" (if completed), a progress bar, "{signed} of {total} signed", a status badge and an eye icon link.
- **How it is calculated:** `sent` sorted by `sentAt || createdAt`, newest first, then `.slice(0,5)` (`:93-95`). Progress bar width = `signed / total × 100%` (`:320`).
- **Empty state:** "Requests you send will show their progress here."

#### Card "Upcoming Expirations"
- **Shows:** The first 4 in-flight requests by expiry date. Each shows "{signed} of {total} signed" and "{n} days left" ("Due today" when n <= 0). The row is red when n <= 7 (`:357-378`).
- **Empty state:** "No requests are waiting on signers."
- Note: an overdue request shows "Due today" even when it is days past its expiry date.

#### Card "Drafts ({n})"
- **Shows:** Up to 5 draft rows. Each shows the title, the kind ("Signature request" or "Document") and "Updated {date}".
- **How it is calculated:** Signature requests with status `draft` (the date used is `createdAt`; the link is `/signatures/{id}/fields`), plus document items with status `draft` (the date used is `updatedAt`; the link is `/documents/{id}`). They are sorted newest first (`:99-109`). The count in the title covers both kinds.
- **Empty state:** "No drafts. Use Start to begin a new request."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Start" dropdown button | Opens or closes a menu with 4 links (`:128-168`). A full-screen invisible button closes it when you click outside | none (local `startOpen`) | n/a | — |
| Menu: "Get Signatures" | Link to `/signatures/new` | none | n/a | — |
| Menu: "Sign a Document" | Link to the **same** `/signatures/new` wizard. There is no separate self-sign flow (`:27`) | none | n/a | — |
| Menu: "Use a Template" | Link to `/documents/templates` | none | n/a | — |
| Menu: "New Document" | Link to `/documents/new` | none | n/a | — |
| Hero quick buttons "Get Signatures", "Sign Document", "Use Template" | The same links as the first 3 menu items (`:171-180`) | none | n/a | — |
| Each KPI tile | Link (see each tile for the target) | none | n/a | — |
| "View Queue" (Awaiting Signature) | Link to `/signatures/waiting` | none | n/a | — |
| Row title / "View" | Link to `/signatures/{id}` | none | n/a | — |
| Row "Sign" | Link to `/signatures/sign/{id}` (shown only when `myTurn` has the id) | none | n/a | — |
| "All Requests" (Recent Activity) | Link to `/signatures/all` | none | n/a | — |
| Eye icon (Recent Activity) | Link to `/signatures/{id}` | none | n/a | — |
| "Manage" (Upcoming Expirations) / each expiration row | Link to `/signatures/all` / to `/signatures/{id}` | none | n/a | — |
| "View all" (Drafts) / each draft row | Link to `/signatures/drafts` (which lists signature drafts only, not document drafts) / to the draft's link | none | n/a | — |

**Notes, limits and simulated parts**
- All numbers are calculated live from `signatureRequests`, which reset to the seed on refresh.
- "Needs Your Signature" uses signer statuses `pending`/`viewed`. The Waiting page also includes `waiting` signers and draft requests, so the two numbers can differ.
- "Expiring Soon" counts overdue requests, because nothing ever sets the status to `expired` automatically.
- "Declined / Expired" also counts `cancelled` requests.
- No loading or error states. There is no backend.

---

### 10.2 Agreements top tabs and `/signatures` layout

**Files:** `src/components/agreements/agreements-tabs.tsx`, `src/app/(workspace)/signatures/layout.tsx`, `src/app/(workspace)/signatures/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Every `/signatures/*` page is wrapped by `SignaturesLayout`, which renders `<AgreementsTabs group="inbox" />` above the page (`layout.tsx:6`). This includes the wizard, the detail pages, the signing page and settings. `/documents/*` and `/contracts/*` use the `documents` group (out of scope here). `/signatures` itself only redirects to `/signatures/all` (`page.tsx:6`).

**Cards, widgets and lists**

#### Inbox tab bar
- **Shows:** All · Action Required (with a badge) · Sent · Completed · Declined & Expired (with sub-tabs Declined / Expired) · Drafts (`agreements-tabs.tsx:17-31`).
- **How it is calculated:** The "Action Required" badge counts **every** request with status `sent`, `viewed` or `partially_signed`, no matter who must sign (`:12-14`). It is the same number as the sidebar "Agreements"/"Inbox" badge (`src/components/layout/app-sidebar.tsx:40`). But the Action Required page itself lists only requests for the current user, so the badge (seed: 3) and the list (seed: 0 for demo accounts) do not match.
- A tab is active when the path equals its href or one of its sub-tab hrefs (`src/components/shared/section-tabs.tsx:19-20`). On detail pages such as `/signatures/sig-1`, no tab is highlighted.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Each tab / sub-tab | Link to its route | none | n/a | — |

**Notes, limits and simulated parts**
- The documents group shows a "Contracts" tab only when `FEATURES.contracts` is true. It is false, so the tab is hidden (`agreements-tabs.tsx:39`).

---

### 10.3 All Signature Requests — `/signatures/all`

**File:** `src/app/(workspace)/signatures/all/page.tsx` (+ `src/components/documents/document-badges.tsx`, `src/components/documents/demo-notice-banner.tsx`)
**Who can open it:** Any signed-in user.
**Purpose:** A list of every signature request (all statuses, all senders), with search, a status filter and quick actions.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signature requests | `useApp().signatureRequests` | All of them, including drafts |

**Cards, widgets and lists**

#### Demo notice banner
- **Shows:** "Simulated Workflow Notice: Demo mode: Signature requests and signing actions are simulated … No legally binding electronic signature or cryptographic certificate is produced." (`demo-notice-banner.tsx:13`). The same banner appears on every signatures page except settings.

#### Reminder message bar
- **Shows:** "Simulated reminder dispatched to pending signers for {id}" for 3 seconds after you click Remind (`:57-61`). It has a "Dismiss" link.

#### Package count
- **Shows:** "{n} package(s)" = the length of the filtered list (`:133`).

#### Request list
- **Shows:** One row per request: id chip, status badge, "Order: sequential/parallel", "Sender: {senderName}", the title (a link), "{signed} of {total} signers recorded", a %, a progress bar, and a pill for each signer with their signer-status badge.
- **How it is calculated:** filter: status = the chosen filter (unless "all"), and the search text matches the title, senderName, id, or a signer's name or email (case-insensitive). Sort: `createdAt` newest first (`:39-55`). Progress % = `round(signed / total × 100)` (`:153`). Bar colour: completed = flash, declined = danger, otherwise flash-deep.
- **Signer badge labels:** pending = "Action Required", waiting = "Waiting for Turn", viewed, signed, declined (`document-badges.tsx:218-255`).
- **Empty state:** "No signature requests found. Try adjusting your search criteria or create a new signature request."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "New Signature Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list as you type (title, sender, id, signer name/email) | none (local) | No | — |
| Status dropdown | All / Draft / Sent / Viewed / Partially Signed / Completed / Declined / Expired / Cancelled | none (local) | No | — |
| "Remind" (shown when status is not completed/declined/cancelled, so **also for draft and expired**) | Calls `sendSignatureReminder(id)` and shows the message bar | `signatureRequests[i].events` gets "Simulated Reminder Sent" | **No, lost on refresh** | No email. No notification |
| "Test Sign" (same condition) | Link to `/signatures/sign/{id}`. This means you can "sign" a **draft** or an **expired** request | none | n/a | — |
| Copy icon "Duplicate request" (always shown) | `duplicateSignatureRequest(id)` creates a draft "Copy of {title}" | `signatureRequests` (new draft at the top) | **No** | No message and no navigation. The copy appears silently |
| X icon "Cancel request" (same condition as Remind) | `cancelSignatureRequest(id)`. There is **no confirmation** | status → `cancelled`, plus the event "Signature Request Cancelled" | **No** | The linked document or contract is not updated |
| Title link / "Details" | Link to `/signatures/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- "Sender:" is empty for the 12 seed requests that have no `senderName` (`:174`).
- "Remind" says "dispatched", but nothing is sent. It only adds an audit event.
- Imports for `Clock`, `CheckCircle2`, `AlertTriangle` and `SignatureRequestStatus` are unused (harmless).

---

### 10.4 Waiting for My Signature (tab "Action Required") — `/signatures/waiting`

**File:** `src/app/(workspace)/signatures/waiting/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Lists the requests where the current user is a signer who has not signed yet.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signature requests | `useApp().signatureRequests` | |
| Current user | `useCurrentUser()` | Matched **by email** to `signer.email` |

**Cards, widgets and lists**

#### Count line
- **Shows:** "{n} document(s) awaiting action" (`:96`).

#### Waiting list
- **Shows:** id chip, an "Action Required" pill, a status badge, the title (plain text, not a link), "Sender: {senderName}", "Received: {createdAt}", and "Expires: {expiresAt}".
- **How it is calculated:** The request status is **not** completed, declined, cancelled or expired (so **drafts are included**), **and** some signer has `email === currentUser.email` with a status that is not `signed` and not `declined`. This includes `waiting`, so a signer who must wait for their turn is listed too (`:26-37`). Search: title, senderName or id. Sort: `createdAt` newest first.
- **Empty state:** "You're All Caught Up! There are currently no signature packages awaiting your action."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "All Requests" | Link to `/signatures/all` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Review" | Link to `/signatures/{id}` | none | n/a | — |
| "Sign Now (Demo)" | Link to `/signatures/sign/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- `declineSignatureRequest` is pulled from the store but never used on this page (`:21`). You can only decline from the signing page.
- The rule here differs from the Agreements "Needs Your Signature" tile (10.1) and from the tab badge (10.2).
- With seed data and a demo login account, the list is empty.

---

### 10.5 Sent Requests — `/signatures/sent`

**File:** `src/app/(workspace)/signatures/sent/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** The requests sent by the current user.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signature requests | `useApp().signatureRequests` | Filtered by `senderId === currentUser.id` (`:35-37`) |

**Cards, widgets and lists**

#### Count line
- **Shows:** "{n} dispatched package(s)".

#### Sent list
- **Shows:** id chip, status badge, "{order} Signing", "Dispatched: {createdAt}", the title (a link), and "Recipients:" with a pill and status badge for each signer.
- **How it is calculated:** All statuses are included, **drafts too** (the filter is only by sender). Search: title, id or a signer's name. Sort: `createdAt` newest first (`:39-51`). `progressPct` is calculated (`:129`) but never displayed.
- **Empty state:** "No sent requests found. You haven't dispatched any signature requests yet."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Send New Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Remind" (status not completed/declined/cancelled) | `sendSignatureReminder(id)` plus a 3-second message bar | event "Simulated Reminder Sent" | **No** | No email |
| "Audit" | Link to `/signatures/{id}/audit` | none | n/a | — |
| "Progress" / title link | Link to `/signatures/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- `cancelSignatureRequest` is imported but there is no Cancel button on this page.
- Seed requests use sender ids `u1`, `u2` and `u9`. The demo login account ids (`user-demo`, `user-elena`, …) never match them, so this page starts empty. It shows only requests created in this browser session, which disappear on refresh.

---

### 10.6 Completed Signatures — `/signatures/completed`

**File:** `src/app/(workspace)/signatures/completed/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** The requests with status `completed`.

**Cards, widgets and lists**

#### Count line
- **Shows:** "{n} executed package(s)".

#### Completed list
- **Shows:** id chip, status badge, a pill "All {signers.length} Signatures Complete", the title (plain text), "Sender: {senderName}", "Completed: {completedAt date}" (or "Executed" when there is no date), and "Signers: {names}".
- **How it is calculated:** `status === 'completed'`. Search: title, senderName, id or a signer's name. Sort: `completedAt || createdAt`, newest first (`:24-41`).
- **Empty state:** "No completed signature packages yet …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Start New Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Summary" | Builds a Markdown text "Electronic Signature Execution Certificate (Simulated Demo)" in the browser and downloads `{id}_execution_certificate_demo.md` (`:43-68`) | none | n/a | A file download (text, **not a PDF**). It ends with "NOT A LEGALLY BINDING INSTRUMENT" |
| "Audit Log" | Link to `/signatures/{id}/audit` | none | n/a | — |
| "View Package" | Link to `/signatures/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- The audit lines in the summary use `e.name`, but store and seed events only have `eventName`, so each line prints "undefined:" (`:56`). See also 10.13.
- The "All N Signatures Complete" pill counts every signer. It does not check whether each one actually signed (optional signers could be unsigned).

---

### 10.7 Declined Requests — `/signatures/declined`

**File:** `src/app/(workspace)/signatures/declined/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** The requests with status `declined`.

**Cards, widgets and lists**

#### Declined list
- **Shows:** id chip, status badge, the title, "Sender:" and "Signers: {names}". The decline reason is **not** shown.
- **How it is calculated:** `status === 'declined'`. Search: title, senderName or id. Sort: `createdAt` newest first (`:23-39`).
- **Empty state:** "No declined signature requests …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create New Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Duplicate" | `duplicateSignatureRequest(id)`. A new draft "Copy of …" is created | `signatureRequests` | **No** | No message. The copy appears under Drafts |
| "Details" | Link to `/signatures/{id}` | none | n/a | — |

---

### 10.8 Expired Signature Requests — `/signatures/expired`

**File:** `src/app/(workspace)/signatures/expired/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** The requests with status `expired`.

**Cards, widgets and lists**

#### Expired list
- **Shows:** id chip, status badge, the title, "Sender:" and "Expired: {expiresAt date}" (or "Past term").
- **How it is calculated:** `status === 'expired'`. Search: title, senderName or id. Sort: `createdAt` newest first (`:22-38`).
- **Empty state:** "No expired signature packages …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create New Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Duplicate" | `duplicateSignatureRequest(id)` | `signatureRequests` | **No** | No message |
| "Details" | Link to `/signatures/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- Only seed request sig-10 is `expired`. **No code ever changes a request to `expired`.** A request past its `expiresAt` stays `sent`/`viewed`/`partially_signed` and never appears here.

---

### 10.9 Draft Requests — `/signatures/drafts`

**File:** `src/app/(workspace)/signatures/drafts/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** The requests with status `draft` (seed sig-4 and sig-9, plus any duplicates).

**Cards, widgets and lists**

#### Draft list
- **Shows:** id chip, status badge, the title, "{n} signer(s): {names}", "Started {createdAt}", and "Document: {title}" when the linked document exists (or "Contract: …" only when `FEATURES.contracts` is on, which it is not) (`:94-125`).
- **How it is calculated:** `status === 'draft'`. Search: title, id, or a signer's name or email. Sort: `createdAt` newest first.
- **Empty state:** "No draft requests …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create New Request" | Link to `/signatures/new` | none | n/a | — |
| Search box | Filters the list | none | No | — |
| "Edit Fields" | Link to `/signatures/{id}/fields` | none | n/a | — |
| "Details" | Link to `/signatures/{id}` | none | n/a | — |

**Notes, limits and simulated parts**
- **A draft can never be sent.** No button anywhere changes a draft to `sent`: `updateSignatureRequest` exists in the store (`app-context.tsx:2307`) but no page calls it. The wizard always creates requests as `sent`. The only way out of draft is "Test Sign" / "Demo Sign Experience", which jumps straight to `partially_signed`/`completed`, or Cancel.

---

### 10.10 Request Signature wizard — `/signatures/new`

**File:** `src/app/(workspace)/signatures/new/page.tsx`
**Who can open it:** Any signed-in user. No permission check (`canManageDocuments` / `canSignDocument` are not used).
**Purpose:** A 5-step wizard (Document → Signers → Fields → Settings → Review & Dispatch) that creates a signature request with status `sent`.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Document items | `useApp().documentItems` | The options in the "Link Existing Document" dropdown |
| Contracts | `useApp().contracts` | Only shown when `FEATURES.contracts` is on (off) |
| Signing defaults | `useApp().signingDefaults` (seed `DEFAULT_SIGNING_DEFAULTS`, `src/data/mock-signing.ts:4-12`) | The starting order, message, expiry and reminder. Re-applied when the defaults change (`:138-145`) |
| Current user | `useCurrentUser()` | Signer 1 and the sender |
| URL query | `?documentId=` / `?contractId=` | Pre-selects a document or contract and fills the title "Signature Request: {title}" (`:148-163`). `?contractId` works even though the contracts flag is off |

**Cards, widgets and lists**

#### Step indicator
- **Shows:** 5 circles. Completed steps show a tick, the active step is dark (`:313-341`). The circles cannot be clicked.

#### Step 1 — Select Document
- **Shows:** "Package Title *", the "Link Existing Document" dropdown (each option is "{title} ({TYPE})"), the contract dropdown (hidden by the flag), and an "Attached" card for the chosen document showing its version and owner.
- **How it is calculated:** On Continue, an empty title is filled automatically with "Signature Package: {doc title}", "Signature Package: {contract title}" or "New Digital Signature Package" (`:205-212`). The `*` suggests the title is required, but **nothing is required**: you can continue with no title and no document.

#### Step 2 — Signers & order
- **Shows:** The signing order toggle, then one row per signer: order number, Full Name, Email, Role/Title, up/down arrows (sequential only) and delete.
- **Default signers (hard-coded):** 1 = the current user (fallback "Alex Morgan / alex@flashsign.com") with role "Internal Approver". 2 = "Sarah Chen / schen@clientpartner.com" with role "Client Authorized Signatory" (`:65-82`).
- **Validation on Continue:** each signer must have a name and an email that are not empty, otherwise `alert('Please provide valid names and email addresses…')` (`:214-223`). The email **format is not checked**, and duplicate emails are allowed.

#### Step 3 — Signature Fields (preview only)
- **Shows:** A card per signer with "{n} Fields", and the lines "Signature Field: Configured" and "Date Signed Field: Configured", plus the note "Standard signature blocks … automatically staged".
- **How it is calculated:** `n` = the fields whose `signerId` matches the signer. Four fields are hard-coded at start, for `sig-1` and `sig-2` only: a signature and a date field each (`:85-130`). **The "Configured" text is hard-coded**. A signer added in step 2 shows "0 Fields" but still says "Configured". Nothing on this step can be edited.

#### Step 4 — Dispatch Settings
- **Shows:** "Message to Signers" (textarea), "Package Expiration" (options 30/60/90/120 days plus the current value, with "(default)" after the setting's value), and "Remind Signers" (Every day / Every 2 days / Every 3 days / Every week / Never, with "(default)") (`:581-635`, options from `src/lib/signing-options.ts:5-13`).

#### Step 5 — Review & Send
- **Shows:** The title, the workflow mode, the number of signers, the expiry window, the reminder label and the message. Below is a box "🚀 Ready to Dispatch (Simulated) … record this request in local state …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Cancel" (header) | Link to `/signatures`, which redirects to `/signatures/all`. The wizard input is discarded | none | n/a | — |
| Package Title input | Sets the title | local | No | — |
| Link Existing Document dropdown | Sets `selectedDocId` | local | No | — |
| Link Contract dropdown | Hidden (`FEATURES.contracts = false`) | — | — | — |
| "Sequential (1 → 2 → 3)" / "Parallel (All at once)" | Sets the signing order | local | No | Up/down arrows show only in sequential mode |
| Name / Email / Role inputs | Edit a signer | local | No | — |
| Move up / Move down | Swaps the signer with its neighbour and renumbers the order | local | No | — |
| Trash "Remove signer" | Removes the signer (disabled when only 1 is left) and **also deletes that signer's fields** (`:184-188`) | local | No | — |
| "Add Another Signer" | Adds an empty signer with role "Signer". **No fields are created for them** | local | No | — |
| Message textarea | Sets the message | local | No | — |
| Package Expiration dropdown | Sets `expiresInDays` | local | No | — |
| Remind Signers dropdown | Sets the reminder schedule | local | No | — |
| "Back" | Goes to the previous step | local | n/a | — |
| "Continue" | Validates step 1 (auto-title) or step 2 (names/emails), then goes to the next step | local | n/a | `alert()` on step 2 errors |
| "Dispatch Signature Request" (step 5) | `handleSendRequest` (`:236-288`): builds the id `SIG-{random 1000-9999}`, sets `expiresAt` = today + days, sets each signer's status (sequential: first `pending`, others `waiting`; parallel: all `pending`), with colour `#00c2a8` for all. It calls `addSignatureRequest`, and also `updateContract(contractId, {status:'awaiting_signature'})` if a contract was chosen. It then navigates to `/signatures/{id}` | `signatureRequests` (new, status `sent`), `documentItems` (linked doc → `pending`), `contracts` (matching contractId **or** the same documentId → `awaiting_signature`), `auditLogs` and `activities` (+ "sent signature request") (`app-context.tsx:2235-2306`) | **No, all of these lost on refresh** (none of them are in `saveState`) | No email is sent. No notification is created |

**Notes, limits and simulated parts**
- The request id is random with only 9,000 possible values (`:237`), so two requests can get the same id. Pages use `.find()`, so the first match wins.
- The `events` the wizard builds (with `name: 'Request Sent'`) are **ignored**. `addSignatureRequest` writes its own single event "Signature Request Created & Dispatched" (`app-context.tsx:2254-2266`).
- Choosing "Never" for reminders gives `reminderIntervalDays = undefined`, which the store turns into **3** (`|| 3`, `app-context.tsx:2252`). It makes no difference, because nothing reads `reminderIntervalDays`.
- The default email subject from settings is not used, because there is no email.
- Every signer gets `required: true`. There is no control to make a signer optional.
- "Sign a Document" (from the Agreements Start menu) opens this same wizard.

---

### 10.11 Request detail (Signing progress) — `/signatures/[requestId]`

**File:** `src/app/(workspace)/signatures/[requestId]/page.tsx`
**Who can open it:** Any signed-in user who has the id. There is no check that the user is the sender or a signer.
**Purpose:** Shows one request: its header, progress, the signers in order, the message, the linked document and a link to the audit log.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| The request | `signatureRequests.find(id)` | If not found: "Signature Request Not Found — could not be located in local state" with a "Return to Signature Requests" button (`:66-85`). This is what you see for any request created before a refresh |
| Linked document | `documentItems.find(request.documentId)` | |
| Linked contract | `contracts.find(request.contractId)` | Only when `FEATURES.contracts` is on (it is off), so the card never shows |

**Cards, widgets and lists**

#### Header banner
- **Shows:** id, status badge, "{order} Execution", the title, "Sender: {senderName}", "Sent: {createdAt}" (the date of `createdAt`, not `sentAt`), and "Expires: {date}".

#### Workflow progress bar
- **Shows:** "Workflow Progress: {signed} of {total} signers recorded" and "{pct}% Complete".
- **How it is calculated:** `round(signed / total × 100)` (`:87-89`).

#### Signer Sequence & Execution Status
- **Shows:** Each signer: order number, name, signer-status badge, email • role, "Viewed: {date}" and "Signed: {date}" when present, and a "Sign as {first name}" button for the signer's turn.
- **How it is calculated:** The button shows when the request is actionable (not completed/declined/cancelled) and the signer status is `pending` or `viewed` (`:249`). In a parallel request every pending signer gets a button. In a sequential request only the first one does, because later signers stay `waiting`.

#### Message to Signers card
- **Shows:** `request.message` in quotes, when there is one.

#### Attached Document card
- **Shows:** The document title, "Version {currentVersion or versions.length or 1} • {TYPE}", and "Open Document Preview".

#### Event Audit Log card
- **Shows:** "{events.length} simulated lifecycle events recorded …".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Breadcrumb "Signatures" / "All Requests" | Link to `/signatures` (redirects to all) / to `/signatures/all` | none | n/a | — |
| "Back to Requests" | Link to `/signatures/all` | none | n/a | — |
| "Demo Sign Experience" (when actionable, **including draft and expired**) | Link to `/signatures/sign/{id}` | none | n/a | — |
| "Send Reminder" (same condition) | `sendSignatureReminder(id)` plus a 3-second message bar | event "Simulated Reminder Sent" | **No** | No email |
| "Fields Studio" (always, even when completed) | Link to `/signatures/{id}/fields` | none | n/a | — |
| "Audit Trail" / "View Full Audit Trail" | Link to `/signatures/{id}/audit` | none | n/a | — |
| Copy icon "Copy request reference link" | Copies the current page URL to the clipboard (`:93-97`) | local `copied` | n/a | **No visible feedback.** `copied` is set but never displayed |
| "Sign as {first name}" | Link to `/signatures/sign/{id}`. It does **not** pass which signer was clicked. The signing page picks the signer itself (see 10.15) | none | n/a | — |
| "Open Document Preview" | Link to `/documents/{documentId}` | none | n/a | — |
| "View Contract Details" | Hidden (contracts flag off) | — | — | — |
| "Dismiss" (message bar) | Hides the message | local | n/a | — |

**Notes, limits and simulated parts**
- `cancelSignatureRequest` is pulled from the store but there is **no Cancel button** here (`:43`). You can only cancel from the All page.
- There is no "Send" button for a draft.
- Decline reasons are stored on the signer (`declineReason`) but this page does not show them. They appear only in the audit event description.

---

### 10.12 Field Placement Studio — `/signatures/[requestId]/fields`

**File:** `src/app/(workspace)/signatures/[requestId]/fields/page.tsx`
**Who can open it:** Any signed-in user. It opens for a request in any status, including completed.
**Purpose:** Add, assign or remove signature fields for a request. **It is a list, not a real placement tool.**

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| The request | `signatureRequests.find(id)` | "Request not found" when missing |
| Fields | Local copy of `request.fields` taken once when the page opens (`:41`) | Changes stay local until "Save Configuration" |
| Linked document | `documentItems.find(documentId)` | Its `content` text is shown on the "canvas". Otherwise fixed legal text |

**Cards, widgets and lists**

#### "Assign Fields To:" signer list
- **Shows:** Each signer with name, email and position number. The active signer is highlighted (by default the first signer).

#### "Click Field to Add" palette
- **Shows:** Signature Field, Initials Field, Date Signed, Full Name, Text Input, Checkbox.

#### Document Preview Canvas
- **Shows:** The request title, the document text, then "Configured Signature Placements": a **2-column grid** of dashed boxes, one per field, labelled with the field type and the signer's name, plus "[TYPE FIELD]" (`:198-225`).
- **How it is calculated:** Fields are listed in array order. **`positionX`, `positionY`, `width`, `height` and `pageNumber` are never used for drawing.** There is no drag-and-drop.

#### Field Inspector
- **Shows:** For the selected field: its type, an "Assigned Signer" dropdown, a "Mandatory Field" checkbox and "Remove Field". Without a selection: "Click any field on the document canvas to inspect or adjust properties."

#### Summary
- **Shows:** "{n} total fields configured across {signers} signers."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Back arrow | Link to `/signatures/{id}`. **Unsaved changes are lost** without a warning | none | n/a | — |
| Signer buttons ("Assign Fields To") | Sets the active signer for new fields | local | n/a | — |
| Palette buttons (6) | Adds a field with id `field-{Date.now()}`, page 1, **random** `positionX` 30–69 and `positionY` 40–79, width 180 (signature) / 32 (checkbox) / 140 (others), height 32 (checkbox) / 44, required = true. The new field is selected (`:57-71`) | local | n/a | — |
| Click a field box | Selects it | local | n/a | — |
| "Assigned Signer" dropdown | Changes the field's `signerId` | local | n/a | — |
| "Mandatory Field" checkbox | Changes `required` | local | n/a | — |
| "Remove Field" | Removes the field | local | n/a | — |
| "Save Configuration" | `updateSignatureFields(id, fields)` replaces the `fields` array, then goes to `/signatures/{id}` (`:78-81`) | `signatureRequests[i].fields` | **No, lost on refresh** | No audit event, no message |

**Notes, limits and simulated parts**
- **Field positions are not real coordinates.** The type comment says "percentage 0-100 or px" (`src/types/documents.ts:215-216`). The wizard uses 50/250 (which look like px) and the studio uses random 30–79 (which look like %). None of these values is rendered anywhere.
- Fields are **never shown on the signing page** and are never filled in. `field.value` is never written. Signing ignores fields completely.
- There is no PDF or page view. The "canvas" is a styled `div` with text.
- Fields can be changed after a request is completed.

---

### 10.13 Simulated Audit Trail — `/signatures/[requestId]/audit`

**File:** `src/app/(workspace)/signatures/[requestId]/audit/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Shows the list of events stored on the request (`request.events`).

**Cards, widgets and lists**

#### Audit meta card
- **Shows:** Package ID, Package Status (`status.replace('_',' ')`), Dispatched Date (`createdAt`), and Integrity Stamp **"SIMULATED #9182"**. The stamp is hard-coded text (`:140`). There is no hash or certificate.

#### Chronological Event Timeline
- **Shows:** "{n} Events Recorded", then for each event: a heading `ev.name`, the date and time, the description, "Actor: {actorName or 'System Service'}" and "{category} event".
- **How it is calculated:** `request.events` in stored order (oldest first, because actions append to the end). If `events` is `undefined`, one made-up event "Request Initialized" is shown (`:45-54`). An empty array `[]` (seed sig-6, 7, 9, 11, 12 and every duplicate) shows **0 events**.
- **Bug:** the heading uses `ev.name`, but every store action and every seed event sets only `eventName` (`app-context.tsx:2259,2325,2369,2418,2432,2447,2514`). So **every event heading is blank**. Only the fallback event has `name`.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Back arrow | Link to `/signatures/{id}` | none | n/a | — |
| "Print Log" | `window.print()` (prints the whole page) | none | n/a | Browser print dialog |
| "Download Audit File" | Downloads `{id}_audit_trail_demo.md`, a Markdown text listing the events (`:60-79`) | none | n/a | Each line has "undefined" as the event name (same `name` bug). Note: "Not legally binding or cryptographically verified" |

**Notes, limits and simulated parts**
- No IP addresses or device data are captured (`ipAddress` exists in the type but is never set).
- These per-request events are separate from the global `auditLogs`. Only `addSignatureRequest` also writes to `auditLogs`/`activities`. Neither is saved.

---

### 10.14 Signing complete — `/signatures/[requestId]/complete`

**File:** `src/app/(workspace)/signatures/[requestId]/complete/page.tsx`
**Who can open it:** Any signed-in user. The signing page sends you here 600 ms after "Finish".
**Purpose:** A confirmation screen after signing.

**Cards, widgets and lists**

#### Completion card
- **Shows:** When status is `completed`: "Demo Signing Workflow Completed — All designated parties … The linked document has been marked as Signed." Otherwise: "Your Demo Signature is Recorded — Your signature was recorded at {now}…" (`:67-76`).
- **How it is calculated:** "{now}" is the **current time when the page renders**, not the signer's real `signedAt`.

#### Details box
- **Shows:** Package, Package ID, "{signed} of {total} Signers Executed", and "Next Signer in Sequence: {name} ({email})".
- **How it is calculated:** The next signer is the first signer with status `pending` or `waiting` (`:45`). It is shown for parallel requests too.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "View Signing Progress" | Link to `/signatures/{id}` | none | n/a | — |
| "Audit Trail" | Link to `/signatures/{id}/audit` | none | n/a | — |
| "Back to Dashboard" | Link to `/signatures`, which redirects to `/signatures/all` (not to `/agreements`) | none | n/a | — |

**Notes, limits and simulated parts**
- The page always shows a green tick, even if you open it directly for a request that was never signed.
- After a refresh the "marked as Signed" document status has reset (`documentItems` is not saved).

---

### 10.15 Signing experience — `/signatures/sign/[requestId]`

**File:** `src/app/(workspace)/signatures/sign/[requestId]/page.tsx` (+ `src/components/signature/signature-editor.tsx`, `signature-mark.tsx`, `signature-fonts.ts`, `src/components/shared/modal.tsx`)
**Who can open it:** Any signed-in user. **There is no check that the user is a signer, and no check of the request status** (a draft, expired or cancelled request with pending signers can be signed).
**Purpose:** A distraction-free "document" page where you choose or create a signature, optionally add a company seal, accept the terms and "sign". You can also decline here.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| The request | `signatureRequests.find(id)` | "Signature request not found." when missing |
| Linked document / contract | `documentItems` / `contracts` | The document `content` text is shown, or fixed "MASTER SERVICES…" text with the contract counterparty |
| Pending signers | Signers with status `pending`, `viewed` **or `waiting`** (`:49-52`) | `waiting` is included, so the sequential order is **not enforced** |
| Users | `useApp().users` | `signerUser` = the user whose email equals the active signer's email (`:69`) |
| Saved signatures | `useApp().savedSignatures` (saved in localStorage) | The active signer's saved signature, looked up by `signerUser.id` (`:71`) |
| Signing defaults | `signingDefaults.allowedSignatureMethods` | Which tabs (Type / Draw / Upload) the editor offers |
| Company seals + role | `companySeals`, `demoRole` | Seals offered only when `isSelf` (the active signer's email belongs to the current user) **and** `seal.isActive` **and** `seal.allowedRoles.includes(demoRole)` (`:74-76`) |

**Which signer you sign as:** At first, the pending signer whose email equals the current user's email, otherwise the **first** pending signer (`:57-62`). If more than one signer is pending, a "Testing as Signer:" dropdown lets you **switch to any pending signer** and sign for them (`:199-217`).

**Cards, widgets and lists**

#### Header
- **Shows:** "FLASH SIGN — SIMULATED SIGNING EXPERIENCE", with "Decline to Sign" and "Exit Signing".

#### "Testing as Signer" switcher
- **Shows:** Only when there are 2 or more pending signers. Each option is "{name} ({role}) — {STATUS}".

#### Document paper
- **Shows:** "DOCUMENT FOR SIGNATURE", the title, the Package ID, today's date, then the document text (or fixed text) plus two fixed paragraphs ("WHEREAS…", "NOW, THEREFORE…") (`:220-245`). It is **not a PDF**, and the placed fields are **not** shown.

#### "Your signature"
- **Shows:** If the signer has a saved signature: "Using your saved signature from Settings › My Signature …" with a "Change signature" button. If not: the `SignatureEditor` with "You haven't saved a signature yet. Create one to sign this document." (`:255-305`).
- **How it is calculated:** The draft starts from the saved signature, or from {signer name, initials from the name, the first allowed method, style 'script'}. It is reset whenever the active signer or their saved signature changes (`:89-109`).

#### SignatureEditor (component)
- **Shows:** Full name, Initials (max 4, upper-cased), method tabs (only when more than one method is allowed), then one of:
  - **Type:** 4 style cards (Formal = Playfair Display italic, Script = Dancing Script, Bold = Caveat 600, Elegant = Great Vibes; `signature-fonts.ts:5-15`) showing the name and initials.
  - **Draw:** two canvases ("Draw your signature" / "Draw your initials") with "Clear". Each stroke is saved as a PNG data URL when the pointer is released (`signature-editor.tsx:211-215`).
  - **Upload:** two file boxes (JPG/PNG/GIF/BMP, max 200 KB, read as a data URL) with "Remove".
  - A preview of the signature and initials once the draft is complete.
- **Completeness rule:** `isCompleteDraft` needs a name and initials. For draw or upload it also needs **both** a signature image and an initials image (`signature-editor.tsx:26-30`).

#### Company seal (optional)
- **Shows:** Radio buttons "No seal" plus each available seal (image + name), and "Applying a seal is recorded in this request's audit trail." Hidden when no seal is available.

#### Signature block preview
- **Shows:** The signature (`SignatureMark` size lg) above a line, the signer name, the email and date, the initials, and the chosen seal image (rotated -6°).

#### Terms checkbox
- **Shows:** "I acknowledge that I am testing the simulated digital signing workflow … non-binding prototype records."

#### Bottom bar
- **Shows:** "Signer: {name} ({role})", "Cancel", and "Finish Demo Signing" (shows "Recording..." while submitting).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Decline to Sign" | Opens the decline modal | local | n/a | — |
| "Exit Signing" / "Cancel" | Go to `/signatures/{id}` | none | n/a | — |
| "Testing as Signer" dropdown | Changes the active signer. Their saved signature is loaded and the seal choice is reset | local | n/a | — |
| "Change signature" | Opens the editor with a copy of the saved signature. "save as default" is turned off | local | n/a | — |
| "Use my saved signature" | Goes back to the saved signature | local | n/a | — |
| Editor: Full name / Initials inputs | Edit the draft | local | n/a | — |
| Editor: Type / Draw / Upload tabs | Switch method. Images are cleared (`signature-editor.tsx:48-51`) | local | n/a | — |
| Editor: style cards | Set `styleId` | local | n/a | — |
| Editor: draw canvases + "Clear" | Draw with mouse or finger (pointer events) / clear the canvas | local | n/a | — |
| Editor: upload boxes + "Remove" | Validates type and size, reads the file as a data URL / removes it | local | n/a | Error text: "Use a JPG, PNG, GIF or BMP image." / "The image must be 200 KB or smaller." |
| "Save this as my signature for next time" / "Also replace my saved signature with this one" checkbox | Shown when the signer has a user account. **Ticked by default** the first time (no saved signature yet) (`:106`) | local | n/a | See Finish |
| Seal radio buttons | Choose a seal or "No seal" | local | n/a | — |
| Terms checkbox | Required before you can finish | local | n/a | — |
| "Finish Demo Signing" (enabled when the draft is complete and the terms are ticked) | (1) If save-as-default is on: `saveSignature({...draft, userId: signerUser.id})`. (2) `signDocumentSimulated(requestId, signerId, signatureValue, seal?)`. `signatureValue` = `"Typed ({style}): {name}"` for typed signatures, otherwise the signature image data URL (`:140-142`). (3) After 600 ms, goes to `/signatures/{id}/complete` (`:133-153`) | `savedSignatures` (replaces that user's one); `signatureRequests` (signer → `signed` + `signedAt` + `signatureValue`; request → `partially_signed` or `completed`; events); when completed: `documentItems` (→ `signed`) and `contracts` (→ `active`); `companySeals` (usageCount +1, lastUsedAt) (`app-context.tsx:2382-2494`) | `savedSignatures` and `companySeals`: **Yes**. `signatureRequests`, `documentItems`, `contracts`: **No, lost on refresh** | No email and no notification to the sender. The initials are not stored on the request |
| Decline modal: reason textarea | Optional text | local | n/a | — |
| Decline modal: "Back" | Closes the modal | local | n/a | — |
| Decline modal: "Confirm Decline" | `declineSignatureRequest(id, signerId, reason or 'Declined during demo session')`, then goes to `/signatures/{id}` (`:155-160`) | Signer → `declined` + `declinedAt` + `declineReason`; **the whole request** → `declined`; event "Signature Declined" (`app-context.tsx:2495-2526`) | **No** | The modal says it will "notify the sender". **No notification is created.** Linked document and contract statuses do not change |

**Notes, limits and simulated parts**
- **How "sign" works:** it only changes data in memory: the signer status, a timestamp and a string or image. There is no PDF, no cryptography, no hash and no certificate.
- **Signer identity is not checked.** Any logged-in user can sign as any pending signer using the dropdown. Seals are the only thing limited to "self". There is no email link, no access code and no OTP.
- **You can save a signature onto another person's account:** when you sign as a different signer who has a user account, `saveAsDefault` saves the draft under **that** user's id, and it is ticked by default if they have no saved signature yet (`:106,137-139`). Their own saved signature is also pre-filled for you to use.
- **Sequential order is not enforced:** `waiting` signers can be chosen and sign. After a signer signs, the next signer is **not** moved from `waiting` to `pending` (`signDocumentSimulated` changes only the signer who signed). So in a sequential request created by the wizard, signer 2 stays "Waiting for Turn", and the Agreements "Needs Your Signature" rule never counts them.
- **Status is not checked:** a declined, draft, expired or cancelled request that still has pending signers can be signed and becomes `partially_signed` or `completed`. This even reverses a decline.
- Completion counts only `required` signers (`app-context.tsx:2407-2409`). The new status is `partially_signed` even when nobody had signed before.
- **Seal role limit is enforced only in this page's UI.** `signDocumentSimulated` accepts any seal `{id, name}` without checking the role or `isActive`. Because `isSelf` is required, a user signing as someone else never sees seals. Seed seal-1 allows `ceo` and `document_manager`. Seed seal-2 allows `ceo` only and is turned off. So a demo account with role `org_admin` (e.g. `demo@flashsign.com`) sees **no** seals unless an admin adds `org_admin` to a seal.
- Seal usage numbers are saved, but the request that recorded the "Company Seal Applied" event is not. After a refresh the seal shows more uses than any visible request.
- The signer and request status `viewed` is never set by opening this page. It exists only in the seed (sig-3).

---

### 10.16 Agreement settings — `/signatures/settings`

**File:** `src/app/(workspace)/signatures/settings/page.tsx` (+ `src/components/agreements/company-seals.tsx`, `src/components/settings/settings-layout.tsx`)
**Who can open it:** Any signed-in user (sidebar "Agreements › Settings"). **Signing defaults have no permission check:** any role can change them. Company seals check `canManageDocuments(demoRole)` = `document_manager`, `org_admin`, `ceo` or `platform_admin` (`src/lib/permissions.ts:121-123`).
**Purpose:** Organisation defaults for new requests, the default email text, company seals, and a link to your personal signature.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Signing defaults | `useApp().signingDefaults` (seed `DEFAULT_SIGNING_DEFAULTS`: 120 days, every 2 days, sequential, subject "Please sign: {{document}}", message "Please review and sign the attached agreement.", all 3 methods, warning 3 days; `src/data/mock-signing.ts:4-12`) | Saved in localStorage |
| Company seals | `useApp().companySeals` (seed `MOCK_COMPANY_SEALS`, `src/data/mock-signing.ts:29-53`: "Official Company Seal" active for ceo + document_manager, used 12 times; "Finance Department Stamp" turned off, ceo only, used 3 times; images are SVGs drawn in code) | Saved |
| My saved signature | `savedSignatures.find(userId === currentUser.id)` | Saved |

**Cards, widgets and lists**

#### Card "Signing defaults"
- **Shows:** "Requests expire after" (30/60/90/120/Custom…), "Remind signers", "Signing order" (two option cards), "Signers may sign by" (3 checkboxes), and a disabled toggle "Warn the sender {3} days before a request expires" with a "Coming soon" badge.
- **How it is calculated:** Custom expiry shows a number input. Valid = a whole number from 1 to 999 (`signing-options.ts:15-16`, page `:34-35`). Helper texts: "Unsigned requests are cancelled automatically after this." and "Sent by email until they sign." **Both are false**: nothing expires or cancels requests automatically, and no email is sent.

#### Card "Default email to signers"
- **Shows:** Subject (max 100, with a counter) and Message (max 10,000). Hint: "Use {{document}} to insert the document name."
- Note: `emailSubject` is never used anywhere else. The `message` is used as the wizard's default message. `{{document}}` is never replaced.

#### Card "Company seals" (`CompanySeals` component)
- **Shows:** A grey lock note "Only document managers and administrators can add or change seals." when the role cannot manage seals. Then a list of seals: image, name, "Active"/"Turned off" badge, description, "Can be applied by:" role chips, and "Used {n} times · last on {date}".
- **Empty state:** "No seals yet."

#### Card "Your signature"
- **Shows:** Your saved signature (`SignatureMark`) or "You haven't saved a signature yet.", plus a "Manage my signature" link.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Expiry dropdown | Sets `expireDays`. "Custom…" sets 45 | local form | n/a | — |
| Custom days number input | Sets `expireDays` (`parseInt`). Shows red text when invalid | local form | n/a | — |
| "Remind signers" dropdown | Sets `reminderFrequency` | local form | n/a | — |
| "One after another" / "All at once" | Sets `signingOrder` | local form | n/a | — |
| "Signers may sign by" checkboxes (Type / Draw / Upload) | Add or remove a method. At least one is required ("Allow at least one way to sign.") | local form | n/a | — |
| "Warn the sender…" toggle | Disabled. Does nothing (`onChange={() => {}}`) | none | n/a | "Coming soon" |
| Subject input / Message textarea | Edit the email text | local form | n/a | — |
| "Restore original defaults" | Fills the form with `DEFAULT_SIGNING_DEFAULTS`. **Saves nothing** until you press Save | local form | n/a | — |
| "Save changes" (2 buttons: one in the defaults card footer, one in the email card; both save the whole form) | Enabled when the form is valid (valid expiry, at least 1 method, subject not empty) **and** changed. Calls `updateSigningDefaults(form)` | `signingDefaults` (merged) | **Yes** | "Saved" note for 2.5 s |
| Seal: "Turn off" / "Turn on" (managers only) | `updateCompanySeal(id, {isActive: !isActive})` immediately | `companySeals` | **Yes** | — |
| Seal: pencil "Edit" | Opens the edit form filled with the seal | local | n/a | — |
| Seal: trash "Delete" | `confirm('Delete "{name}"? Documents it was already applied to keep their seal.')`, then `deleteCompanySeal(id)` | `companySeals` | **Yes** | Requests store only the seal **name** in an event. No image is kept |
| "Add a seal" (managers only, when no form is open) | Opens an empty form (default roles: ceo + document_manager, active) | local | n/a | — |
| Seal form: image box | File input for PNG/SVG/JPG, max 500 KB, read as a data URL | local | n/a | Errors: "Use a PNG, SVG or JPG image…" / "The image must be 500 KB or smaller." |
| Seal form: Name / "What it's for" inputs | Edit the text | local | n/a | — |
| Seal form: role chips "Who can apply this seal" | Turn each role on or off. All roles except `integration_service` are listed (`company-seals.tsx:16`). At least one is required | local | n/a | — |
| Seal form: "Active" toggle | Sets `isActive` | local | n/a | — |
| Seal form: "Cancel" | Closes the form | local | n/a | — |
| Seal form: "Add seal" / "Save seal" (enabled when name + image + at least 1 role) | `addCompanySeal({...values, createdBy: user.id})` (id `seal-{Date.now()}`, `createdAt`, `usageCount: 0`) or `updateCompanySeal(id, values)` (`app-context.tsx:1761-1771`) | `companySeals` | **Yes** | No audit log |
| "Manage my signature" | Link to `/settings/signature` (that page uses `saveSignature` / `deleteSignature`, `src/app/(workspace)/settings/signature/page.tsx:36-47`; `deleteSignature` removes that user's entry, `app-context.tsx:1751-1754`) | none here | n/a | — |

**Notes, limits and simulated parts**
- The role limit on managing seals is **UI only**. The store actions `addCompanySeal`, `updateCompanySeal` and `deleteCompanySeal` do no checks.
- Seal images (up to 500 KB each) and drawn signatures are stored as data URLs in localStorage. If the browser storage quota is exceeded, `saveState` silently stops saving **all** app data (`app-context.tsx:557-559`, empty `catch`).
- `expiryWarningDays` is shown in the toggle label but can never be changed or used.

---

### 10.X Key questions answered

| Question | Answer (as implemented) | Code |
|---|---|---|
| Is there any real PDF? | **No.** No PDF is shown, generated or stamped. The "document" is the `content` text of a document item, or fixed text, in a styled `div`. Downloads are `.md` text files | `sign/[requestId]/page.tsx:220-245`, `fields/page.tsx:183-195`, `completed/page.tsx:43-68`, `audit/page.tsx:60-79` |
| Are field positions real coordinates? | **No.** `positionX/Y/width/height/pageNumber` are stored but never used to draw. The wizard uses fixed numbers, the studio uses random numbers. Fields are shown as a grid list and are not shown or filled when signing | `new/page.tsx:85-130`, `fields/page.tsx:63-66,198-225`, `types/documents.ts:215-216` |
| How does "sign" work? | `signDocumentSimulated` sets the signer to `signed`, adds `signedAt` and stores `signatureValue` (a text "Typed (style): Name" or an image data URL). The request becomes `completed` when all required signers have signed, otherwise `partially_signed`. On completion the linked document becomes `signed` and contracts become `active`. Events are appended. No cryptography | `app-context.tsx:2382-2494` |
| Is the signer identity checked? | **No.** Any signed-in user can open any request's signing page and sign as any pending (or waiting) signer through the "Testing as Signer" dropdown. Only the seal choice requires the signer's email to belong to the current user | `sign/[requestId]/page.tsx:49-76,199-217` |
| Is there real email? | **No.** "Dispatch", "Remind" and "notify the sender" send nothing and create no in-app notification. `sendSignatureReminder` only appends an event "Simulated Reminder Sent". `emailSubject` is never used | `app-context.tsx:2355-2381` |
| Do signature requests survive a refresh? | **No.** `signatureRequests` is not in `saveState` (`app-context.tsx:520-560`). On load, `loadState` spreads the saved data over the seed, so `signatureRequests` always comes from `MOCK_SIGNATURE_REQUESTS` (`:467,505-507`). **What this means:** new requests disappear and their URLs show "not found"; signatures, declines, cancels, duplicates, reminders and field edits are reverted; document and contract statuses set by signing revert (also not saved); but `savedSignatures`, `signingDefaults` and `companySeals` (including a seal's increased `usageCount`) **are** saved, so seal usage numbers no longer match any visible request | `app-context.tsx:446-560` |
| Are seals restricted to allowed roles? | **In the signing page UI only:** a seal shows when `isActive`, `allowedRoles` contains the current `demoRole`, and you sign as yourself. Managing seals needs `canManageDocuments(demoRole)` in the UI. The store actions do not check anything | `sign/[requestId]/page.tsx:74-76`, `company-seals.tsx:34`, `app-context.tsx:1761-1775,2490-2492` |
| Is expiry automatic? | **No.** No timer or check changes requests to `expired`. Only seed sig-10 is expired. The settings text "Unsigned requests are cancelled automatically" is not true | grep: no code sets `status: 'expired'` |
| Are reminders automatic? | **No.** `reminderIntervalDays` is stored (and "Never" becomes 3) but nothing reads it. Reminders exist only as the manual "Remind" button | `new/page.tsx:264`, `app-context.tsx:2252` |
| Can a draft be sent? | **No.** No UI calls `updateSignatureRequest`, and the wizard always creates `sent` requests | `app-context.tsx:2307-2310` |

---

### 10.Y Signature request state machine (as implemented)

**Request status values** (`SignatureRequestStatus`, `src/types/documents.ts:223-231`): `draft`, `sent`, `viewed`, `partially_signed`, `completed`, `declined`, `expired`, `cancelled`.
**Signer status values** (`SignatureSignerStatus`, `src/types/documents.ts:179-184`): `waiting`, `pending`, `viewed`, `signed`, `declined`.

**Request transitions that the code can perform**

| From | To | Trigger | Code |
|---|---|---|---|
| (none) | `sent` | Wizard "Dispatch Signature Request" → `addSignatureRequest` (status is always `sent`, `sentAt` = now) | `new/page.tsx:236-288`, `app-context.tsx:2235-2306` |
| any (copy of an existing request) | `draft` (new request) | "Duplicate" → `duplicateSignatureRequest`: new id `sig-{Date.now()}`, title "Copy of …", every signer reset to `pending` (even in sequential), `events: []` | `app-context.tsx:2338-2354` |
| any status with at least 1 pending/viewed/waiting signer (**including draft, sent, viewed, partially_signed, declined, expired, cancelled**) | `partially_signed` | A signer signs and some required signer is still not signed | `app-context.tsx:2406-2458` |
| same as above | `completed` | A signer signs and all `required` signers are now `signed` (sets `completedAt`, adds the "Workflow Completed" event, linked doc → `signed`, contracts → `active`) | `app-context.tsx:2406-2482` |
| any (the UI offers it for statuses not in completed/declined/cancelled) | `cancelled` | "Cancel request" (All page only) → `cancelSignatureRequest`, no confirmation | `all/page.tsx:246-254`, `app-context.tsx:2311-2337` |
| any status with at least 1 pending/viewed/waiting signer | `declined` | "Confirm Decline" on the signing page → `declineSignatureRequest`: one decline makes the whole request declined | `sign/[requestId]/page.tsx:155-160`, `app-context.tsx:2495-2526` |
| any | any | `updateSignatureRequest(id, updates)` could set anything, but **no UI calls it** | `app-context.tsx:2307-2310` |

**Transitions that do not exist**
- `draft → sent`: there is no "Send draft" action.
- `sent → viewed` (request or signer): opening the request or the signing page does not set `viewed`. It appears only in seed sig-3.
- `* → expired`: no automatic or manual expiry.
- Signer `waiting → pending`: never happens. After signer 1 signs a sequential request, signer 2 stays `waiting`.
- No guard prevents `completed`, `declined`, `expired` or `cancelled` requests from being signed again through a direct URL, as long as a signer is still pending or waiting.

**Signer transitions**

| From | To | Trigger | Code |
|---|---|---|---|
| (new) | `pending` (parallel, or first signer in sequential) / `waiting` (later sequential signers) | Wizard dispatch | `new/page.tsx:250` |
| (copy) | `pending` (all signers) | Duplicate | `app-context.tsx:2350` |
| `pending` / `viewed` / `waiting` | `signed` | Finish Demo Signing | `app-context.tsx:2394-2404` |
| `pending` / `viewed` / `waiting` | `declined` | Confirm Decline | `app-context.tsx:2504-2508` |

**Events appended to `request.events`** (all use the `eventName` field, which the audit page does not display; see 10.13): "Signature Request Created & Dispatched" (creation), "Simulated Reminder Sent" (delivery), "Signature Request Cancelled" (status), "Demo Signature Executed" (signing), "Company Seal Applied" (signing), "Workflow Completed" (status), "Signature Declined" (status).

None of these transitions survive a page refresh, because `signatureRequests` is not saved.

---

### 10.Z Data flow summary for this area

- **Reads:** `signatureRequests`, `documentItems`, `contracts` (only when the contracts flag is on, or through `?contractId`), `users`, `currentUserId`/`useCurrentUser()`, `demoRole`, `savedSignatures`, `signingDefaults`, `companySeals`.
- **Writes, not saved (lost on refresh):** `signatureRequests` (create, sign, decline, cancel, duplicate, reminder events, fields), `documentItems.status` (`pending` on send, `signed` on completion), `contracts.status`/`signatureRequestId` (`awaiting_signature` on send, `active` on completion), `auditLogs` + `activities` (only from `addSignatureRequest`).
- **Writes, saved in localStorage `flashsign-proto-state-v6`:** `savedSignatures` (from signing with "save as my signature", and from Settings › My Signature), `signingDefaults`, `companySeals` (add, edit, turn on/off, delete, usage count when a seal is applied).
- **Store actions used:** `addSignatureRequest`, `cancelSignatureRequest`, `duplicateSignatureRequest`, `sendSignatureReminder`, `signDocumentSimulated`, `declineSignatureRequest`, `updateSignatureFields`, `saveSignature`, `deleteSignature` (from `/settings/signature`), `updateSigningDefaults`, `addCompanySeal`, `updateCompanySeal`, `deleteCompanySeal`, `updateContract` (wizard, only with a contract). `updateSignatureRequest` exists but is **never called**.
- **Permission checks:** only `canManageDocuments(demoRole)` for managing seals, and `seal.allowedRoles.includes(demoRole)` for applying seals. Both are UI-only. No page in this area checks the role or whether the user is the sender or a signer.
- **Nothing external:** no PDF, no email, no notifications, no timers for expiry or reminders, no signature cryptography.

---

## 11. Documents, templates, contracts and approvals

This area is the document library (all, mine, shared, recent, favorites, folders), the document editor and viewer, the template library, the hidden Contracts module, and the old Approval Center. Everything runs in the browser.
**Important:** the document library (`documentItems`), folders (`documentFolders`), templates (`documentTemplates`) and contracts (`contracts`) are **not saved** by `saveState()` (`src/context/app-context.tsx:520-560`). Every create, edit, move, favorite, delete or comment on these screens is **lost on page refresh**, and the data goes back to the seed in `src/data/mock-documents.ts`. Only the old `documents` list and `approvals` (used by the Approval Center) are saved.

**Who is the "current user" here:** after sign-in, `src/context/app-context.tsx:622-672` sets `currentUserId` to the signed-in account's id (for example `user-demo`) and `demoRole` to that account's role (`executive`→`ceo`, `qa`→`qa_tester`, other roles keep their name). The seed documents, contracts and approvals use the ids `u1`, `u2`, `u3`, `u9`. The preset demo accounts (`user-demo`, `user-sarah`, …, in `src/types/demo-auth.ts`) do not have these ids. So screens that filter by the current user ("My Documents", "Awaiting Your Action") show **no seed rows** for a normal demo login. No screen in this section checks a role permission from `src/lib/permissions.ts`.

**Seed data at start:** 15 documents (`MOCK_DOCUMENT_ITEMS`, `doc-101`…`doc-115`), 6 folders (`MOCK_FOLDERS`), 8 templates (`MOCK_TEMPLATES`), 10 contracts (`MOCK_CONTRACTS`, `cnt-1`…`cnt-10`), plus 5 old-style documents (`MOCK_DOCUMENTS`, `doc1`…`doc5`) and 5 approvals (`MOCK_APPROVALS`) in `src/data/mock-data.ts:1005-1088`. Seed dates are worked out from "today" each time the app loads (`d()`/`dt()` helpers, `src/data/mock-documents.ts:10-22`).

---

### 11.1 Documents area shell and shared parts — `/documents`

**File:** `src/app/(workspace)/documents/layout.tsx`, `src/app/(workspace)/documents/page.tsx` (+ `src/components/agreements/agreements-tabs.tsx`, `src/components/documents/document-badges.tsx`, `src/components/documents/demo-notice-banner.tsx`)
**Who can open it:** Any signed-in user (workspace layout guard only).
**Purpose:** `/documents` opens nothing by itself. It redirects to `/documents/all` (`page.tsx:6`). Every `/documents/**` page (including Templates) gets the Documents top tab bar from the layout.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Tab list | `AgreementsTabs group="documents"` (`agreements-tabs.tsx:32-55`) | static list |
| Contracts tab | only added when `FEATURES.contracts` is true (`agreements-tabs.tsx:39`) | flag is `false`, so the tab is hidden |

**Cards, widgets and lists**

#### Documents top tabs
- **Shows:** All Documents, My Documents, Shared with Me, Recent, Favorites, Folders. (Contracts with 9 sub-chips is hidden by the flag.)
- **Data source:** static array in `agreements-tabs.tsx:32-38`.
- **How it is calculated:** no counts or badges on these tabs.

#### Document status badge (`DocumentStatusBadge`)
- **Shows:** signed → "Signed", pending → "Pending Signature", in_review → "In Review", approved → "Approved", shared → "Shared", rejected → "Rejected", archived → "Archived", draft/anything else → "Draft" (`document-badges.tsx:30-80`).

#### Document type badge (`DocumentTypeBadge`)
- **Shows:** pdf "PDF", docx "Word DOCX", agreement "Agreement", sow "SOW", msa "Master Contract", proposal "Proposal", nda "NDA", spec "Tech Spec", contract "Contract", other/unknown "Document" (`document-badges.tsx:85-102`).

#### Contract status badge (`ContractStatusBadge`)
- **Shows:** Active, Awaiting Signature, Pending Review, Expiring Soon, Completed, Archived, and "Draft" for draft **and for anything else**. The type also allows `expired`, but it has no case, so an expired contract shows "Draft" (`document-badges.tsx:107-157`).

#### Demo notice banner (`DemoNoticeBanner`)
- **Shows:** "Simulated Workflow Notice: Demo mode: Signature requests and signing actions are simulated…" or a custom message (`demo-notice-banner.tsx:12-31`). It is information only.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Each Documents tab | navigates to its route | none | n/a | none |
| Visiting `/documents` | server redirect to `/documents/all` | none | n/a | none |

**Notes, limits and simulated parts**
- Templates (`/documents/templates/**`) sits inside this layout, so it shows the Documents tabs, but no tab is highlighted for it. The sidebar has a separate "Templates" item (`app-sidebar.tsx:101`).
- The breadcrumb "Documents" link on many pages goes to `/documents`, which redirects back to `/documents/all`.

---

### 11.2 All Documents — `/documents/all`

**File:** `src/app/(workspace)/documents/all/page.tsx` (+ `UploadDemoDialog`, `MoveFolderDialog`)
**Who can open it:** Any signed-in user. It is the sidebar "Documents" item (`app-sidebar.tsx:93`).
**Purpose:** The full library list with search, filters, sort, list/grid view and bulk actions.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Documents | `useApp().documentItems` (seed `MOCK_DOCUMENT_ITEMS`) | **not persisted**. Archived documents are included. |
| Folders | `useApp().documentFolders` (seed `MOCK_FOLDERS`) | used for the folder filter and the folder column |
| Users | `useApp().users` | owner name lookup by `ownerId` |
| Projects | `useApp().projects` | read but not shown (only "Linked Project" text) |

**Cards, widgets and lists**

#### Header
- **Shows:** breadcrumb "Documents / Library", title "All Documents", buttons (see the controls table).

#### Documents table (list view, default)
- **Shows:** one row per document: select box, star, title (link), "N pages • size", "Linked Project" if `relatedProjectId` is set, type badge, folder chip (or "Root"), status badge, owner name (or "Legal Admin"), last-modified date, action icons.
- **Data source:** `documentItems`, filtered.
- **How it is calculated:** `filteredDocs` (`all/page.tsx:55-79`):
  - type filter: `doc.type === selectedType`
  - status filter: `doc.status === selectedStatus`
  - folder filter: "unfiled" keeps docs with no `folderId`; a folder id keeps exact matches. Child folders are **not** included.
  - search (case-insensitive) on title, description, or owner name
  - sort: "date" = `updatedAt` newest first (default); "name" = title A-Z; "type" = type text A-Z.
  - pages shows `doc.pages || 1`, size shows `doc.fileSize || '1 MB'`. Owner comes from `users.find(u => u.id === doc.ownerId)`.
- **Empty state:** "No documents match criteria" with a "Clear All Filters" button (`all/page.tsx:268-286`).

#### Documents grid (grid view)
- **Shows:** a card per document with type and status badges, star, title, description (or "Document ready for review and signing."), "N pages • size", folder name, "By {owner}" (or "By Legal"), a Move icon and an "Open" button (`all/page.tsx:445-519`).
- **How it is calculated:** same `filteredDocs` list as the table.

#### Bulk actions bar
- **Shows:** "{n} selected" with Archive and Delete. It appears only when at least one row is ticked (`all/page.tsx:247-263`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Upload Demo File" | opens Upload Demo Document dialog (11.3) | — | — | — |
| "Create Document" | link to `/documents/new` | — | — | — |
| Search box | filters by title / description / owner name | local state | n/a | — |
| Sort dropdown (Recent Modified / Title A-Z / Type) | changes sort | local state | n/a | — |
| List / Grid toggle | switches view | local state | n/a | — |
| Status dropdown | options: All Statuses ({total count}), Draft, Pending Signature, Signed, In Review, Approved, Archived | local state | n/a | No "Shared" or "Rejected" option. Seed `doc-106` has status `shared`. |
| Type dropdown | options: PDF, Word DOCX, Agreements, MSA, SOW, NDA, Specs | local state | n/a | No "Contract" or "Proposal" option. 6 seed docs are `contract` or `proposal`. |
| Folder dropdown | All Folders, Unfiled / Root, each folder | local state | n/a | flat list, no nesting |
| Header select-all box | ticks all filtered rows, or clears if all are ticked | local state | n/a | list view only |
| Row select box | ticks / unticks one row | local state | n/a | list view only |
| Star (row or card) | `toggleFavoriteDocument(id)` flips `isFavorite` | `documentItems` | **No — lost on refresh** | no toast |
| Title link / eye icon / "Open" | go to `/documents/{id}` | — | — | — |
| Folder icon (Move to Folder) | opens Move Document dialog (11.4) | — | — | — |
| Copy icon (Duplicate) — list only | `duplicateDocument(id)` | `documentItems` (new `doc-{timestamp}`, title "Copy of …", status `draft`) | **No — lost on refresh** | no toast, no audit log |
| Trash icon — list only | browser `confirm("Delete …?")`, then `deleteDocumentItem(id)` | `documentItems` (row removed) | **No — lost on refresh** | no toast |
| Bulk "Archive" | `archiveDocumentItem` for every ticked id (no confirm) | `documentItems` (`status: 'archived'`) | **No — lost on refresh** | clears selection |
| Bulk "Delete" | `confirm`, then `deleteDocumentItem` for each ticked id | `documentItems` | **No — lost on refresh** | clears selection |
| "Clear All Filters" (empty state) | resets search, type, status and folder | local state | n/a | — |

**Notes, limits and simulated parts**
- Archived documents stay in the main list (no default "hide archived"). No screen can un-archive a document.
- Delete does not touch linked contracts (`relatedContractId` / `contract.documentId` stay pointing at a missing doc) or signature requests.
- The grid view has no select boxes, duplicate or delete.
- `duplicateDocument` (`app-context.tsx:1988-2001`) copies everything else: favorite flag, folder, versions, comments, sharing, related contract. Two clicks in the same millisecond would create the same id.
- File sizes and page counts are stored text and numbers, not measured from a file.

---

### 11.3 Upload Demo Document dialog (modal)

**File:** `src/components/documents/upload-demo-dialog.tsx` (opened from 11.2)
**Who can open it:** Any signed-in user.
**Purpose:** Registers a "demo file" as a new library document. **The file's bytes are never read or kept.**

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Folders | `documentFolders` | Target Folder dropdown |
| Projects | `projects` | Linked Project dropdown |
| Chosen file | browser `File` object | only `file.name` and `file.size` are used (`upload-demo-dialog.tsx:222-232`) |

**Cards, widgets and lists**

#### Prototype notice
- **Shows:** "Client-Side Demo: Selected files are processed locally in your browser session…" (static text, `:287-292`). In fact nothing is processed.

#### Drop zone
- **Shows:** "Drag & drop … or browse files" before a file is chosen. After choosing: the file name, "{size} MB • Ready to import" and "Choose another file".
- **How it is calculated:** size = `(file.size / 1048576).toFixed(1) + ' MB'`. Title = file name without its extension. Type is `pdf` for `.pdf`, `docx` for `.docx`/`.doc`, otherwise `agreement`.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Drag-and-drop a file | reads the first file's name and size | local state | n/a | the text "up to 25 MB" is not enforced |
| "browse files" / "Choose another file" | opens the file picker (`accept=".pdf,.doc,.docx,.txt"`) | local state | n/a | — |
| Document Title * | text; required | local state | n/a | error "Please provide a document title." |
| Document Category | pdf, docx, agreement, msa, sow, nda, proposal, contract | local state | n/a | — |
| Target Folder | Root/Unfiled or a folder | local state | n/a | — |
| Linked Project (Optional) | project or none | local state | n/a | — |
| "Add to Demo Library" | `addDocumentItem({... status:'draft', fileSize: chosen size or '1.8 MB', pages: 4, content: generated markdown})` (`:243-252`) | `documentItems` (+ `auditLogs`, `activities` entry "created document") | **No — lost on refresh** | toast "Document "…" added to the library"; dialog closes; stays on the list |
| "Cancel", X, click outside | closes the dialog | — | — | — |

**Notes, limits and simulated parts**
- The new document's content is a fixed text: "Uploaded demo file representation ({file name}) … This document record was imported into the Flash Sign demo library…". The real file cannot be viewed, downloaded or signed.
- Page count is always 4. The state exists but has no input.
- The form is not cleared after saving or closing. Re-opening shows the previous file name and title.
- A file can be added with no file chosen at all (only the title is required).

---

### 11.4 Move Document dialog (modal)

**File:** `src/components/documents/move-folder-dialog.tsx` (opened from 11.2 and 11.11)
**Who can open it:** Any signed-in user.
**Purpose:** Moves one document to a folder or to Root.

**Cards, widgets and lists**

#### Folder picker
- **Shows:** "Root / Unfiled" plus every folder with "({documentCount} docs)" and a tick on the selected one.
- **Data source:** `documentFolders`. The count is the **stored** `documentCount` field (`:126`), not a live count. Seed folders show fixed numbers (for example "Approved Org Templates (8 docs)" although it holds 0). New folders always show 0.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Folder row / Root row | selects the target | local state | n/a | — |
| "Move Document" | `moveDocumentToFolder(id, folderId or null)` (`app-context.tsx:1982-1987`) sets `folderId` and `updatedAt` | `documentItems` | **No — lost on refresh** | dialog closes; no toast |
| "Cancel", X, click outside | close | — | — | — |

**Notes, limits and simulated parts**
- **Bug on All Documents:** the selected folder is set only once, when the dialog component first mounts (`:56`). On `/documents/all` it mounts before any document is chosen, so it always starts on "Root / Unfiled". It also remembers the last choice between documents. On the detail page (11.11) it starts correctly on the document's current folder.
- Moving does not update any folder's `documentCount`.

---

### 11.5 My Documents — `/documents/mine`

**File:** `src/app/(workspace)/documents/mine/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Documents whose `ownerId` equals the current user's id.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Documents | `documentItems` filtered by `ownerId === currentUserId` (`mine/page.tsx:38-40`) | not persisted |
| Current user | `useCurrentUser()` | name in the subtitle |
| Folders | `documentFolders` | folder chip |

**Cards, widgets and lists**

#### Header
- **Shows:** "My Documents ({count})" and "Documents authored by you as {user name}."
- **How it is calculated:** count = number of docs owned by `currentUserId`. With a preset demo login this is **0** at start, because seed docs are owned by `u1`/`u2`/`u3`/`u9`. Docs you create in this session (owner = you) appear here until refresh.

#### Filter pills with counts
- **Shows:** All, Drafts, In Review, Awaiting Signature, Completed, each with a count.
- **How it is calculated:** counts over `myDocuments` by status: `draft`, `in_review`, `pending`, `signed` (`:103-109`).

#### Documents table
- **Shows:** star, title link, "N pages • size" (default '1.2 MB'), type, folder (or "Unfiled"), status, last modified, actions.
- **How it is calculated:** filter by pill, then search on title/description, sort by `updatedAt` newest first (`:42-56`).
- **Empty state:** "No documents found matching this filter."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Document" | link `/documents/new` | — | — | — |
| Search box | filters title/description | local state | n/a | — |
| Filter pills | set status filter | local state | n/a | — |
| Star | `toggleFavoriteDocument` | `documentItems` | **No — lost on refresh** | — |
| Title / "Open" | `/documents/{id}` | — | — | — |
| Copy icon | `duplicateDocument` | `documentItems` | **No — lost on refresh** | no toast. The copy keeps the original owner, so it shows here only if you own the original. |
| Trash icon | `confirm`, then `deleteDocumentItem` | `documentItems` | **No — lost on refresh** | — |

**Notes, limits and simulated parts**
- The code has a `'shared'` filter (`:46`) but no pill uses it.

---

### 11.6 Shared with Me — `/documents/shared`

**File:** `src/app/(workspace)/documents/shared/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Lists documents marked as shared.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Documents | `documentItems` where `isShared` is true **or** `sharedWithUserIds` includes `currentUserId` (`shared/page.tsx:277-281`) | not persisted |
| Users | `users` | "Shared By" = owner name |

**Cards, widgets and lists**

#### Header count
- **Shows:** "Shared with Me ({n})". Seed: 10 documents have `isShared: true`, so they show for **every** user, even the user's own documents.

#### "End-to-end encrypted simulated access" label
- Static text. No encryption exists.

#### Shared documents table
- **Shows:** star, title, pages and size, type, Shared By (owner name or "External Legal Lead"), Access Level (`accessType` or "Editor"), status, last modified, actions.
- **How it is calculated:** search on title/description. No sort is applied (store order, newest-created first).
- **Empty state:** "No documents currently shared with you."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search box | filters | local state | n/a | — |
| Star | `toggleFavoriteDocument` | `documentItems` | **No — lost on refresh** | — |
| Title / "Open" | `/documents/{id}` | — | — | — |
| Copy icon ("Copy Demo Share Link") | copies `https://app.flashsign.demo/documents/{id}?access=shared` to the clipboard; icon turns into a tick for 2 s | none | n/a | **the link is fake** (a domain that does not exist) |

**Notes, limits and simulated parts**
- No screen can share a document or set `sharedWithUserIds` / `accessType`. The values come only from the seed.
- Access level is just a label. Viewers can still edit and delete.

---

### 11.7 Recent Documents — `/documents/recent`

**File:** `src/app/(workspace)/documents/recent/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** All documents sorted by last change.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Documents | `documentItems` (all of them) | not persisted |
| Folders | `documentFolders` (as an id → name map) | — |

**Cards, widgets and lists**

#### Demo notice banner
- Default simulated-signing message.

#### Recent list
- **Shows:** title link, type and status badges, description (or "No description provided."), "Modified {Mon d, hh:mm}", "Owner: {ownerName or 'Alex Morgan'}", folder, "v{currentVersion or number of versions}", file size, and action buttons. A count "N documents" sits by the filter.
- **How it is calculated:** type filter plus search on title/description/`ownerName`, sorted by `updatedAt` newest first (`recent/page.tsx:37-48`). It is **not** limited in number and does **not** use `lastOpenedAt`. "Recent" just means every document, newest change first.
- **Empty state:** "No recent documents found" with a hint.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "New Document" | link `/documents/new` | — | — | — |
| Search box | filters | local state | n/a | — |
| Type dropdown | All, Agreements, SOW, NDAs, Proposals, **Specifications**, PDF Uploads | local state | n/a | "Specifications" uses value `specification`, but documents use `spec`, so it **always shows nothing** |
| Star | `toggleFavoriteDocument` | `documentItems` | **No — lost on refresh** | — |
| Copy icon | `duplicateDocument` | `documentItems` | **No — lost on refresh** | no toast |
| Download icon | downloads `{title}_demo.md` containing the document's text (`:50-59`) | none | n/a | a real browser download of markdown text, not the original file |
| Edit icon | link `/documents/{id}/edit` | — | — | — |
| "View" | link `/documents/{id}` | — | — | — |

**Notes, limits and simulated parts**
- `ownerName` is never set on seed documents, and `addDocumentItem` does not copy it either. So the Owner shows **"Alex Morgan" (a made-up fallback) for every document**, and searching by owner name never matches.

---

### 11.8 Favorites — `/documents/favorites`

**File:** `src/app/(workspace)/documents/favorites/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Starred documents.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Documents | `documentItems` where `isFavorite` is true (`favorites/page.tsx:22-24`) | seed: 4 (doc-101, 102, 107, 109). Not persisted. |

**Cards, widgets and lists**

#### Header
- **Shows:** "Starred & Key Agreements ({count of all favorites})".

#### Favorite cards grid
- **Shows:** type badge, filled star, title, description (or "Pinned agreement in your workspace."), status badge, "Open".
- **How it is calculated:** search on title only.
- **Empty state:** "No favorite agreements yet" with a "Browse Library" link. It also shows when the search matches nothing.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search box | filters by title | local state | n/a | — |
| Star ("Remove from favorites") | `toggleFavoriteDocument`; the card disappears | `documentItems` | **No — lost on refresh** | — |
| Title / "Open" | `/documents/{id}` | — | — | — |
| "Browse Library" (empty state) | `/documents/all` | — | — | — |

---

### 11.9 Folder Management — `/documents/folders`

**File:** `src/app/(workspace)/documents/folders/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Create, rename and delete folders, and see the documents inside each one.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Folders | `documentFolders` | not persisted. Shown as a **flat** list; `parentId` (nesting) is ignored. |
| Documents | `documentItems` | used to count and list folder contents |
| Users | `users` | "By {owner}" |

**Cards, widgets and lists**

#### Error banner
- **Shows:** "Cannot delete a folder containing active documents. Please move or reassign the documents first." when delete is blocked. It has an X to dismiss.

#### Repository Folders list (left)
- **Shows:** "{n} folders" and each folder with a **live** document count, plus rename and delete icons.
- **How it is calculated:** count = `documentItems.filter(d => d.folderId === folder.id).length` (`:177`). Archived docs count too. Sub-folders' docs are not added to the parent.
- Seed counts: Legal & Compliance 6, Client Master Contracts 4, Statements of Work 3, Mutual NDAs 1, Engineering Specs & RFCs 1, Approved Org Templates 0.

#### Folder contents (right)
- **Shows:** selected folder name (or "Select a Folder"), "{n} documents filed in this directory", and the list of docs (title, type, pages, size, "By owner", status, eye link). The first folder is selected when the page opens.
- **Empty state:** "No documents currently filed in this folder."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "New Folder" | shows the inline create form | local state | n/a | — |
| Folder name input + "Create" (or Enter) | empty name → error toast "Enter a name for the folder first.". Otherwise `addFolder({name})` (`app-context.tsx:2027-2038`): id `f-{timestamp}`, `parentId` null, owner = current user, `documentCount` 0 | `documentFolders` | **No — lost on refresh** | toast "Folder "…" created" |
| "Cancel" (create form) | hides the form | — | — | — |
| Click a folder row | selects it for the right panel | local state | n/a | — |
| Pencil (Rename) | turns the row into an input | local state | n/a | — |
| Tick (save rename) | non-empty: `updateFolder(id, name)`, toast "Folder renamed to …". Empty: error toast, old name kept | `documentFolders` | **No — lost on refresh** | — |
| X (cancel rename) | leaves edit mode | — | — | — |
| Trash (Delete) | if the live count > 0 → shows the error banner and stops. If 0 → `confirm('Delete this empty folder?')`, then `deleteFolder(id)` (`app-context.tsx:2045-2048`) | `documentFolders` | **No — lost on refresh** | no toast |
| Search folder contents | filters the right panel by title | local state | n/a | — |
| Document title / eye | `/documents/{id}` | — | — | — |

**Notes, limits and simulated parts**
- **What happens to documents inside a deleted folder:** the screen does not allow it. A folder with any document (even archived) cannot be deleted. `deleteFolder` itself only removes the folder record. It does not move docs and does not look at sub-folders. If you delete a parent folder that has sub-folders but no direct docs, the sub-folders keep a `parentId` that points to nothing (not visible, because the list is flat).
- With the seed, only "Approved Org Templates" (0 docs) can be deleted.
- After a delete, the page selects `documentFolders[0]` from the list as it was before the delete.
- There is no "move into folder" here. Use the Move dialog (11.4).

---

### 11.10 Create Document — `/documents/new`

**File:** `src/app/(workspace)/documents/new/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Creates a new library document from a blank page or a template.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Templates | `documentTemplates` | template picker |
| Folders | `documentFolders` | Folder dropdown |
| Projects | `projects` | Linked Project dropdown |

**Cards, widgets and lists**

#### Mode cards
- **Shows:** "Blank Document", "From Template", "Demo File Record".
- **How it is calculated:** only "From Template" changes the page (it shows the template picker). "Demo File Record" **does nothing different**. There is no file input. It is the same form as Blank.

#### Template picker (From Template mode)
- **Shows:** each template's title and "{category} • {n} variables".

#### Editor / preview
- **Shows:** a textarea pre-filled with a sample "# New Agreement…". "Formatted Preview" shows the same raw text (`whitespace-pre-wrap`). **Markdown is not rendered.**

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to Documents" / "Cancel" | link `/documents` (redirects to `/documents/all`) | — | — | — |
| Mode cards | switch mode | local state | n/a | — |
| Template card | copies the template's title, type and **raw content** into the form (`:43-51`) | local state | n/a | **`{{placeholders}}` are NOT filled here.** The text keeps `{{party_a}}` etc. |
| Document Title * | text; required | local state | n/a | error "Please provide a document title." |
| Summary / Purpose | text | local state | n/a | — |
| Document Category | agreement, msa, sow, nda, proposal, contract, spec, pdf | local state | n/a | — |
| Folder | Root/Unfiled or folder | local state | n/a | — |
| Linked Project | none or project | local state | n/a | — |
| Toolbar H2 / Bold / Italic / Bullet / Numbered | **appends** sample text (for example `## Heading 2`) at the end of the content, not at the cursor (`:53-55`) | local state | n/a | — |
| "Formatted Preview" / "Edit Mode" | toggles raw text view | local state | n/a | — |
| Content textarea | free text | local state | n/a | — |
| "Save Document Draft" | `addDocumentItem({title, description, type, folderId, relatedProjectId, content, status:'draft', fileSize:'1.4 MB', pages: ceil(content length / 800) (min 1)})` (`:66-76`). The store adds id `doc-{timestamp}`, owner = current user, version 1 "Initial document created." | `documentItems` (+ `auditLogs`, `activities` "created document") | **No — lost on refresh** | toast "Document "…" saved as a draft"; goes to `/documents/{newId}` |

**Notes, limits and simulated parts**
- File size is always "1.4 MB". It is not calculated.
- If the user refreshes on the new document's page, the document no longer exists and the page shows **404** (11.11).

---

### 11.11 Document Details — `/documents/[documentId]`

**File:** `src/app/(workspace)/documents/[documentId]/page.tsx` (+ `MoveFolderDialog`, `DemoNoticeBanner`)
**Who can open it:** Any signed-in user. An unknown id calls `notFound()` (Next.js 404) (`:62-63`).
**Purpose:** View a document, its versions and comments, and run actions on it.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Document | `documentItems.find(id)` | not persisted |
| Owner | `users` by `ownerId` | fallback "Legal Admin" |
| Folder | `documentFolders` by `folderId` | — |
| Project | `projects` by `relatedProjectId` | — |
| Contract | `contracts.find(c => c.documentId === doc.id || c.id === doc.relatedContractId)` | used only if `FEATURES.contracts` is on (hidden) |

**Cards, widgets and lists**

#### Header
- **Shows:** breadcrumb, title, star.

#### Quick metadata strip
- **Shows:** type badge, status badge, folder chip, "Owner: …", "Modified: {updatedAt date}", plus Move / Duplicate / Export / Archive buttons.

#### Document Preview tab (default)
- **Shows:** "Flash Sign Document Viewer", "Page 1 of {pages}" (always page 1), and the content as **raw text** (markdown symbols like `#` and `**` are shown, not rendered).

#### Versions tab — "Versions ({count})"
- **Shows:** for each entry in `doc.versions` (array order): "Version {n}.0", a "Current" tag on the **first** item (index 0), the change summary, "Authored by {modifiedBy} on {modifiedDate}", and "Restore Version" on every item except the first.
- **How it is calculated:** the stored list as-is (`:276-305`). Seed lists are oldest-first (v1 then v2). So **"Current" marks the oldest version**, and Restore appears on newer ones. New documents have exactly 1 version. **Editing never adds a version** (see 11.12).

#### Review Comments tab — "Review Comments ({count})"
- **Shows:** author, date/time, text for each `doc.comments` entry, and a post box.
- **Empty state:** "No comments yet on this document."

#### Document Metadata card (right)
- **Shows:** Document Type (raw code, for example `MSA`), File Size (or "1.4 MB"), Page Count, Created, Last Updated, Folder, Linked Project (link to `/projects/{id}`).

#### Related Contract card
- **Hidden** because `FEATURES.contracts` is false (`:399`). When on, it shows the associated contract with "View Contract Record", or "Create Contract Record" linking to `/contracts/new?docId=…&title=…`. The new-contract page **ignores** those parameters (11.26).

#### Toast
- Local toast in the top-right for 3 s (`:70-73`). It is not the shared toaster.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Breadcrumb "Documents" | `/documents` → `/documents/all` | — | — | — |
| Star | `toggleFavoriteDocument` | `documentItems` | **No — lost on refresh** | — |
| "Edit Content" | link `/documents/{id}/edit` | — | — | — |
| "Request Signature" | link `/signatures/new?documentId={id}` (the signature wizard reads `documentId` and pre-selects it, `signatures/new/page.tsx:45`) | — | — | see the Signatures section |
| "Move" | opens Move dialog (pre-selects the current folder) | via `moveDocumentToFolder` | **No — lost on refresh** | — |
| "Duplicate" | `duplicateDocument(id)`; you stay on the original | `documentItems` | **No — lost on refresh** | toast "Duplicated document record." |
| "Export" | downloads `{Title}_demo.md` with the document text (`:75-85`) | none | n/a | toast "Demo document downloaded as markdown file." |
| "Archive" | `archiveDocumentItem(id)` (no confirm) → status `archived` | `documentItems` | **No — lost on refresh** | toast "Document marked as archived." There is no Unarchive. |
| Tabs (Preview / Versions / Comments) | switch tab | local state | n/a | — |
| "Restore Version" | `confirm`, then `updateDocumentItem(id, { content: version.content })` (`:95-101`) | `documentItems` (content and `updatedAt` only) | **No — lost on refresh** | toast "Restored content to Version N."; jumps to Preview |
| Comment input + "Post" | empty text is ignored. Otherwise `addDocumentComment(id, text)` (`app-context.tsx:2008-2024`): id `cm-{timestamp}`, author = current user, `status:'open'` | `documentItems[].comments` | **No — lost on refresh** | toast "Comment recorded." |
| Linked Project link | `/projects/{id}` | — | — | — |

**Notes, limits and simulated parts**
- **How version restore works:** it only copies that version's stored `content` into the document. It does not create a new version entry, does not change the "Current" tag, and does not record who restored it. Seed version contents are short placeholders (for example doc-101 v2 = "Revised draft with data residency..."), so restoring **replaces the full agreement text with one line**.
- Comments cannot be resolved, edited or deleted (the `status` field is never changed).
- Delete is not offered on this page (`deleteDocumentItem` is loaded but not used).
- Status changes from the signing flow: sending a signature request sets the doc to `pending`, and finishing all signatures sets it to `signed` (`app-context.tsx:2278-2283`, `2477-2482`). These are not persisted either.

---

### 11.12 Document Content Editor — `/documents/[documentId]/edit`

**File:** `src/app/(workspace)/documents/[documentId]/edit/page.tsx`
**Who can open it:** Any signed-in user. An unknown id gives 404.
**Purpose:** Edit the title, summary and text of a document.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Document | `documentItems.find(id)` | the form starts with its title, description and content |

**Cards, widgets and lists**

#### Header
- **Shows:** "Document Content Editor" and the status badge.

#### Saved banner
- **Shows:** "Changes saved successfully! Redirecting..." after saving.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to Document Preview" / "Cancel" | link `/documents/{id}`; the edits are thrown away | — | — | — |
| Document Title | text (required) | local state | n/a | — |
| Summary / Scope | text | local state | n/a | — |
| Toolbar (H2, H3, Bold, Italic, Bullet, Numbered) | appends sample lines ("## Section", "**Important Covenant**", …) at the end | local state | n/a | — |
| "Formatted Preview" / "Return to Code" | toggles raw text view (no markdown rendering) | local state | n/a | — |
| Content textarea | free text | local state | n/a | — |
| "Save Document" | empty title → error toast. Otherwise `updateDocumentItem(id, {title, description, content, pages: ceil(length/800)})` | `documentItems` (+ `updatedAt`) | **No — lost on refresh** | toast "Changes to "…" saved"; after 0.8 s goes to the detail page |

**Notes, limits and simulated parts**
- Saving **does not add a version** to `versions` and does not bump `currentVersion`. Version history is fixed at what the seed or creation put there.
- No status change on edit (a signed document can be freely edited).
- Code note: `useState` is called after the `notFound()` early return (`:33-40`). This breaks React's hook rules, but it works while the document exists.

---

### 11.13 Document Templates — `/documents/templates`

**File:** `src/app/(workspace)/documents/templates/page.tsx` (+ `TemplatePreviewDialog`)
**Who can open it:** Any signed-in user. It is the sidebar "Templates" item.
**Purpose:** Browse the template library and start a document from a template.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Templates | `documentTemplates` (seed `MOCK_TEMPLATES`, 8) | not persisted |

**Cards, widgets and lists**

#### Header
- **Shows:** "Document Templates ({total})".

#### Template cards grid
- **Shows:** category tag (first `_` replaced by a space), star, title, description, up to 3 placeholder chips `{{name}}` plus "+N more", "Updated {lastUpdated}", and the "Preview" and "Use" buttons.
- **How it is calculated:** category pill filter (`t.category === selected`), then search on title or description (`:37-48`). It does not search placeholders, although the placeholder text says "variable".
- **Empty state:** none. The grid is simply empty.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Template" | link `/documents/templates/new` | — | — | — |
| Search box | filters by title/description | local state | n/a | — |
| Category pills | All, Contracts, Legal & NDAs, Project SOWs, HR & Consulting, Procurement & SLAs, Sales & Handover | local state | n/a | No pill for `general`. Such templates appear only under "All". |
| Star | `toggleFavoriteTemplate(id)` flips `isFavorite` | `documentTemplates` | **No — lost on refresh** | Favorites are not used anywhere else (no favorites filter). |
| "Preview" | opens the Template Preview dialog (11.14) | — | — | — |
| "Use" | opens the **same** dialog as Preview | — | — | — |

**Notes, limits and simulated parts**
- There is no edit or delete for templates. `updateTemplate` exists in the store (`app-context.tsx:2065`) but no screen calls it.

---

### 11.14 Template Preview & Use dialog (modal)

**File:** `src/components/documents/template-preview-dialog.tsx`
**Who can open it:** Any signed-in user (from 11.13).
**Purpose:** Fill in template variables and create a new document.

**Cards, widgets and lists**

#### Header and description
- **Shows:** category, title, description.

#### "Customize Template Placeholders" form
- **Shows:** one text input per entry in `template.placeholders`. The label is the name with its first `_` turned into a space.

#### Template Text Preview
- **Shows:** the template's **raw** content with `{{…}}` tags. The preview **does not update** as you type values.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Placeholder inputs | store values by placeholder name | local state | n/a | values persist between templates (see notes) |
| "Use This Template" | builds the content (see below), then `addDocumentItem({title: "{template title before '('} - New Document", type: template.type, status:'draft', content})` and goes to `/documents/{newId}` (`:39-56`) | `documentItems` (+ `auditLogs`, `activities`) | **No — lost on refresh** | **no toast** |
| "Close", X, click outside | close | — | — | — |

**How `{{placeholders}}` are filled:** for each name in `template.placeholders`, every `{{name}}` in the content is replaced (regex, global) with the typed value. If the input is empty, it becomes `[NAME]` in capitals (for example `[PARTY_A]`) (`:40-45`). Tags in the content that are **not** listed in `placeholders` stay as `{{…}}`.

**Notes, limits and simulated parts**
- The new document has no folder, no project, no description, default file size "1.2 MB" and 1 page.
- The typed values are kept while the page stays open. Opening another template that has a placeholder with the same name (for example `effective_date`) shows the old value.

---

### 11.15 Create Document Template — `/documents/templates/new`

**File:** `src/app/(workspace)/documents/templates/new/page.tsx`
**Who can open it:** Any signed-in user.
**Purpose:** Build a reusable template with `{{variables}}`.

**Cards, widgets and lists**

#### Placeholders builder
- **Shows:** "{n} active" and chips for each placeholder. It starts with `agreement_title`, `effective_date`, `party_a`, `party_b`. The body starts with a sample that uses these.

#### Body content / preview
- **Shows:** a textarea. "Preview Format" shows the same raw text in a monospace font.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to Templates" / "Cancel" | link `/documents/templates` | — | — | — |
| Template Title * | required | local state | n/a | error "Template title is required." |
| Description | text | local state | n/a | — |
| Category | contracts, legal, project_management, human_resources, procurement, sales, general | local state | n/a | — |
| Document Base Type | contract, msa, sow, nda, agreement, proposal | local state | n/a | — |
| Placeholder input + "Add" | text is lower-cased and spaces become `_`. If it is new, it is added to the list **and** ` {{tag}}` is appended to the end of the body (`:225-233`) | local state | n/a | — |
| Chip X | removes the tag from the list only. The `{{tag}}` text stays in the body. | local state | n/a | — |
| "Preview Format" / "Edit Mode" | toggle | local state | n/a | — |
| Body textarea | free text (required) | local state | n/a | Typing `{{x}}` by hand does **not** add `x` to the list, so it will not be filled when the template is used. |
| "Save Template" | `addTemplate({title, description, category, type, content, placeholders})` (`app-context.tsx:2051-2064`): id `tpl-{timestamp}`, `lastUpdated` = today | `documentTemplates` (added at the top) | **No — lost on refresh** | toast "Template "…" created"; goes to `/documents/templates` |

**Notes, limits and simulated parts**
- Pressing **Enter** in the placeholder input submits the whole form (it is inside the `<form>`), which saves the template instead of adding the tag.

---

### 11.16 Contracts module — feature flag and reachability

**Files:** `src/app/(workspace)/contracts/**`, `src/lib/features.ts:20`
**Purpose of this block:** Explains what `FEATURES.contracts = false` hides.

**What the flag hides (entry points removed):**
- The "Contracts" tab and its 9 sub-chips in the Documents tab bar (`agreements-tabs.tsx:39-54`).
- The "Associated Contract" / "Create Contract Record" card on document details (`documents/[documentId]/page.tsx:399`).
- The contract counts and value in Agreements Reports (`agreements/reports/page.tsx:48, 72, 82, 90`).
- The "or Contract" source in the signature wizard (`signatures/new/page.tsx:347, 363, 380`), the linked contract on signature details (`signatures/[requestId]/page.tsx:62`) and on signature drafts (`signatures/drafts/page.tsx:95`).

**What still works:**
- **All `/contracts/**` pages are still reachable by typing the URL.** None of them checks the flag, a role or a permission. The contracts layout even shows the Documents tabs, and the sidebar still highlights "Documents" for `/contracts` paths (`app-sidebar.tsx:97-99`). No visible link in the app leads to `/contracts` while the flag is off.
- The store still holds the 10 seed contracts. The signing flow still updates contract status in the background: sending a request with a `contractId` or a matching `documentId` sets the contract to `awaiting_signature` (`app-context.tsx:2270-2275`), and completing all signatures sets it to `active` (`:2470-2475`).
- All contract changes are **not persisted** (lost on refresh).

**Seed contract statuses:** cnt-1 awaiting_signature ($320,000), cnt-2 active ($0), cnt-3 pending_review ($140,000), cnt-4 active ($75,000), cnt-5 draft ($28,000), cnt-6 expiring ($45,000, expires in 25 days), cnt-7 awaiting_signature ($185,000), cnt-8 active ($18,000), cnt-9 completed ($36,000), cnt-10 archived ($15,000). Values are in `contractValue`. **No seed contract has `value`, `ownerName` or `reviewerName`.** Several screens read those fields, so they show blanks or "N/A" (see each screen below).

---

### 11.17 Contracts Overview — `/contracts` (hidden by flag, URL-only)

**File:** `src/app/(workspace)/contracts/page.tsx`
**Who can open it:** Any signed-in user who types the URL.
**Purpose:** Contract dashboard.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Contracts | `contracts` (seed `MOCK_CONTRACTS`) | not persisted |
| Users | `users` | read, not shown |
| documentItems, signatureRequests | read from the store but not used | — |

**Cards, widgets and lists**

#### Six KPI tiles (each a link)
- **Shows / how it is calculated** (`page.tsx:30-43`):
  - All Contracts = `contracts.length` (seed 10) → `/contracts/all`
  - Active = count `status==='active'` (seed 3); sub-line "${sum of contractValue of active / 1000}k active value" (seed "$93k") → `/contracts/active`
  - Pending Review = count `pending_review` (seed 1) → `/contracts/review`
  - Awaiting Signature = count `awaiting_signature` (seed 2) → `/contracts/awaiting`
  - Expiring Soon = count `status==='expiring'` (seed 1) → `/contracts/expiring`. Sub-line "Within 30–60 days" is fixed text. The number is the **stored status**, not calculated from dates.
  - Completed / Past = count `completed` (seed 1) → `/contracts/completed`. Sub-line "Closed & archived" is wrong: archived contracts are not counted.

#### "Contracts Awaiting Review or Signature"
- **Shows:** up to 4 contracts with status `pending_review` or `awaiting_signature` (store order): title, "Client: …", "Value: $…", status, and a "Review" link. It is hidden when there are none. The name says "my action", but it is **not** filtered by the user.

#### "Recent Contracts Activity"
- **Shows:** the 5 most recently updated contracts: title, counterparty, value, "Expires: {expiryDate}", status, eye link.

#### "Upcoming Expirations"
- **Shows:** up to 4 contracts with `status==='expiring'`: title, client, "Due {expiryDate}".
- **Empty state:** "No contracts currently expiring within 60 days."

#### Contract Tools card
- Three links (see the table).

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Contract" / "Create New Contract" | `/contracts/new` | — | — | — |
| "Request Signature" / "Prepare Signature Package" | `/signatures/new` | — | — | — |
| "Start from Template" | `/documents/templates` (makes a document, not a contract) | — | — | — |
| KPI tiles | links as listed | — | — | — |
| "View Queue" | `/contracts/review` | — | — | — |
| "Review" / title / eye links | `/contracts/{id}` | — | — | — |
| "All Contracts" | `/contracts/all` | — | — | — |
| "Manage" / "Review Expiration Roadmap" | `/contracts/expiring` | — | — | — |
| Breadcrumb "Agreements" | `/agreements` | — | — | — |

---

### 11.18 Contract Registry — `/contracts/all` (URL-only)

**File:** `src/app/(workspace)/contracts/all/page.tsx`
**Who can open it:** Any signed-in user who types the URL.
**Purpose:** Searchable table of all contracts.

**Cards, widgets and lists**

#### Registry table
- **Shows:** title + id, counterparty, type (underscores → spaces), status badge, value (`$contractValue` or "—"), effective date, expiry date, and actions. Header shows "Contract Registry ({total})".
- **How it is calculated:** status filter, type filter, search on title or counterparty. Sort: "date" = `updatedAt` newest first (default), "value" = `contractValue` high to low, "title" = A-Z (`:38-56`).
- **Empty state:** "No contracts found matching your filters."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Export CSV" | downloads `FlashSign_Contracts_Export.csv` of the **filtered** rows (id, title, type, counterparty, value, status, effective date, expiry date) | none | n/a | local toast "Contracts registry exported as CSV." |
| "Create Contract" | `/contracts/new` | — | — | — |
| Search | title/counterparty | local | n/a | — |
| Sort dropdown | date / value / title | local | n/a | — |
| Status dropdown | active, awaiting_signature, pending_review, draft, expiring, completed, archived | local | n/a | no "expired" option |
| Type dropdown | MSA, SOW, NDA, Software License, SLA, Vendor Agreement, Change Request (long type codes) | local | n/a | no `consulting_agreement` (cnt-5) and none of the short codes (`agreement`, `sow`, `msa`, …) that the Create Contract page saves |
| Title / "Details" | `/contracts/{id}` | — | — | — |
| Archive icon | `confirm`, then `archiveContract(id)` → status `archived` | `contracts` | **No — lost on refresh** | toast "Contract archived." |
| Trash icon | `confirm`, then `deleteContract(id)` (removes the record only) | `contracts` | **No — lost on refresh** | toast "Contract deleted."; the linked document keeps a dangling `relatedContractId` |

---

### 11.19 Draft Contracts — `/contracts/drafts` (URL-only)

**File:** `src/app/(workspace)/contracts/drafts/page.tsx`
**Purpose:** Contracts with `status === 'draft'` (seed: cnt-5).

**Cards, widgets and lists**

#### Draft cards
- **Shows:** id, status, title, counterparty, description (or "Draft agreement in progress."), "Type: {raw code}", value **only if `contract.value` is set** (seed drafts have only `contractValue`, so no value shows), and the updated date. Count "N draft contracts".
- **How it is calculated:** search on title, counterparty, type, `ownerName`. Sorted by `updatedAt` newest first.
- **Empty state:** "No draft contracts" with a "Start a New Contract" link.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Create Contract" / "Start a New Contract" | `/contracts/new` | — | — | — |
| Search | filter | local | n/a | — |
| Trash ("Delete draft") | `deleteContract(id)` **with no confirmation** | `contracts` | **No — lost on refresh** | no toast |
| "Move to Review" | `submitContractForReview(id)` (`app-context.tsx:2150-2175`): status → `pending_review`, keeps `reviewerId`, adds an activity entry "Submitted for internal review" | `contracts` | **No — lost on refresh** | the card leaves this list. No reviewer is chosen. No notification. |
| Eye link | `/contracts/{id}` | — | — | — |

---

### 11.20 Contract Review Queue — `/contracts/review` (URL-only)

**File:** `src/app/(workspace)/contracts/review/page.tsx`
**Purpose:** Contracts with `status === 'pending_review'` (seed: cnt-3).

**Cards, widgets and lists**

#### Review cards
- **Shows:** id, status, "Submitted by {ownerName}" (**blank for seed contracts**), title, client, raw type, value (only if `value` is set), updated date. Count "N contracts awaiting review".
- **Empty state:** "Review Queue Clear" with a "View Drafts" link.

#### Comments drawer (per card)
- **Shows:** each review comment's author, time and `comment.content`. Seed comments only have `text`, so **the seed comment body shows empty**.
- **Empty state:** "No review comments recorded yet…"

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "All Contracts" | `/contracts/all` | — | — | — |
| Search | filter (title, counterparty, type, ownerName) | local | n/a | — |
| "Comments (n)" | opens/closes the drawer | local | n/a | — |
| Comment input + send (or Enter) | `addContractReviewComment(id, {authorId, authorName, content})` (`app-context.tsx:2176-2206`), id `rc-{timestamp}`, saved in both `text` and `content` | `contracts[].reviewComments` | **No — lost on refresh** | — |
| "Request Changes" | if text is typed, adds a comment "Requested Changes: …". Then **always** `updateContract(id, {status:'draft'})` (`:65-76`) | `contracts` | **No — lost on refresh** | no activity entry; no confirm |
| "Approve & Move to Sign" | `markContractReviewed(id)` (default `'approved'`): status → `awaiting_signature`, activity "Approved internal review" (`app-context.tsx:2207-2232`) | `contracts` | **No — lost on refresh** | no signature request is created. The contract shows "Not sent yet" on 11.21. |
| "Full Details" | `/contracts/{id}` | — | — | — |

**Notes, limits and simulated parts**
- Anyone can approve. There is no reviewer check (`reviewerId` is ignored).

---

### 11.21 Awaiting Signature — `/contracts/awaiting` (URL-only)

**File:** `src/app/(workspace)/contracts/awaiting/page.tsx`
**Purpose:** Contracts with `status === 'awaiting_signature'` (seed: cnt-1, cnt-7).

**Cards, widgets and lists**

#### Contract cards
- **Shows:** id, status, title, counterparty, signing progress and value (`contractValue ?? value`, so this page shows the correct seed values).
- **How it is calculated:** the linked request = `signatureRequests.find(id === contract.signatureRequestId)`. "Signatures: {signed} of {total} signed" plus a bar with width = signed ÷ total × 100% (`:83-123`). Seed: cnt-1 → sig-1 "1 of 2"; cnt-7 → sig-3 "0 of 2". With no request: "Not sent yet". Search covers title, counterparty, id.
- **Empty state:** "No contracts awaiting signature…"

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search | filter | local | n/a | — |
| "Signing Progress" (when a request exists) | `/signatures/{requestId}` | — | — | — |
| "Request Signature" (no request) | `/signatures/new?contractId=…&documentId=…` | — | — | the wizard reads `contractId`, but the contract picker is hidden by the flag (see the Signatures section) |
| Eye link | `/contracts/{id}` | — | — | — |

---

### 11.22 Active Contracts — `/contracts/active` (URL-only)

**File:** `src/app/(workspace)/contracts/active/page.tsx`
**Purpose:** Contracts with `status === 'active'` (seed: cnt-2, cnt-4, cnt-8).

**Cards, widgets and lists**

#### Contract cards
- **Shows:** id, status, title, counterparty, "Effective: …", "Expires: …", value only if `value` is set (**not shown for seed**). Count "N active".
- **Empty state:** "No active contracts found…"

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "All Contracts" | `/contracts/all` | — | — | — |
| Search | title, counterparty, ownerName | local | n/a | — |
| Type dropdown | Agreements, SOWs, MSAs, NDAs (**short** codes) | local | n/a | seed active contracts use long codes (`non_disclosure_agreement`, `service_level_agreement`, `change_request`), so **any type choice shows nothing** for them |
| "Renew" | `addContract({id: 'CTR-{random 4 digits}', title: "{title} (Renewal)", same type/counterparty/owner/project/renewal, effectiveDate = old expiryDate, value: contract.value, status:'draft', description "Renewal agreement for prior contract …"})` (`:47-63`) | `contracts` (+ `auditLogs`, `activities` "created contract") | **No — lost on refresh** | **no toast or navigation**. The new draft appears only on Drafts. Seed value is lost (`value` is undefined → 0). The new expiry is today + 365 days (store default), not old expiry + term. The random id can repeat. |
| Archive icon | `archiveContract(id)` with **no confirm** | `contracts` | **No — lost on refresh** | — |
| Eye link | `/contracts/{id}` | — | — | — |

---

### 11.23 Expiring Contracts — `/contracts/expiring` (URL-only)

**File:** `src/app/(workspace)/contracts/expiring/page.tsx`
**Purpose:** Contracts near or past their end date.

**Cards, widgets and lists**

#### Expiring list
- **Shows:** id, a days badge ("{n} days remaining", or "Expired ({n}d ago)"), status, title, counterparty, "Expiration: …", "Policy: {renewalType}".
- **How it is calculated** (`:29-68`):
  - only contracts with status `active`, `expiring` or `expired` that have an `expiryDate`
  - `daysRemaining = ceil((expiryDate − now) / 1 day)`; expired if below 0
  - range: All Upcoming = `≤ 90` (expired ones included); 30/60/90 = `0…N`; Expired = `< 0`
  - search on title/counterparty; sorted by days remaining, smallest first
  - badge is red if expired or ≤ 30 days, otherwise amber
  - Seed result: only cnt-6 (25 days). cnt-9's end date has passed, but its status is `completed`, so it is not listed.
- **Empty state:** "No upcoming expirations in selected range…"

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Active Contracts" | `/contracts/active` | — | — | — |
| Search | filter | local | n/a | — |
| Range pills (All Upcoming, < 30, < 60, < 90 Days, Expired) | change range | local | n/a | — |
| "Create Renewal Draft" | same as "Renew" in 11.22 (`addContract`, id `CTR-####`, status draft) | `contracts` (+ logs) | **No — lost on refresh** | no feedback; value lost for seed |
| Eye link | `/contracts/{id}` | — | — | — |

**Notes, limits and simulated parts**
- Nothing in the app ever sets a contract to `expiring` or `expired` automatically. The Overview tile counts only the stored status.

---

### 11.24 Completed Contracts — `/contracts/completed` (URL-only)

**File:** `src/app/(workspace)/contracts/completed/page.tsx`
**Purpose:** Contracts with `status === 'completed'` (seed: cnt-9).

**Cards, widgets and lists**

#### Completed cards
- **Shows:** id, status, a fixed **"100% Signatures Recorded"** tag (hard-coded, not checked), title, counterparty, "Owner: {ownerName}" (blank for seed), value only if `value` is set.
- **Empty state:** "No completed contracts found…"

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Search | title, counterparty, ownerName | local | n/a | — |
| "Demo Copy" | downloads `{id}_executed_demo.md` with a short generated text ("Status: Executed (Simulated)", "[DEMO COPY FOR PROTOTYPE PURPOSES]") | none | n/a | — |
| "View Contract" | `/contracts/{id}` | — | — | — |

**Notes, limits and simulated parts**
- No code path sets a contract to `completed`. The signing flow sets `active`, not `completed`.

---

### 11.25 Archived Contracts — `/contracts/archived` (URL-only)

**File:** `src/app/(workspace)/contracts/archived/page.tsx`
**Purpose:** Contracts with `status === 'archived'` (seed: cnt-10).

**Cards, widgets and lists**

#### Archived cards
- **Shows:** id, status, title, counterparty, "Owner: {ownerName}" (blank for seed), "Archived: {updatedAt date}".
- **Empty state:** "No archived contracts…"

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "All Contracts" | `/contracts/all` | — | — | — |
| Search | filter | local | n/a | — |
| "Restore to Draft" | `updateContract(id, {status:'draft'})` (no confirm) | `contracts` | **No — lost on refresh** | always back to draft, whatever the earlier status |
| Eye link | `/contracts/{id}` | — | — | — |

---

### 11.26 Create New Contract — `/contracts/new` (URL-only)

**File:** `src/app/(workspace)/contracts/new/page.tsx`
**Purpose:** A 4-step wizard that creates a contract record.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Templates | `documentTemplates` | step 2 picker |
| Documents | `documentItems` | step 2 "Attach Existing Document" |
| Projects | `projects` | step 1 |
| Current user | `useCurrentUser()` | owner id and name (fallback `usr-1` / "Alex Morgan") |

**Cards, widgets and lists**

#### Step indicator
- **Shows:** 1 Basic Details, 2 Contract Content, 3 Terms & Value, 4 Review & Submit. Done steps show a tick.

#### Step 4 summary
- **Shows:** title, counterparty, raw type, value (`parseFloat`), effective date, content source, and a "Next Steps" note that mentions "proceed directly to signature dispatch". **There is no button for that.**

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Cancel" | `/contracts` | — | — | — |
| Contract Title * / Counterparty * | required. "Continue" from step 1 checks them ("Contract title is required", "Counterparty organization name is required") | local | n/a | — |
| Contract Type | agreement, sow, nda, msa, proposal, specification (short codes) | local | n/a | — |
| Related Project | optional | local | n/a | — |
| Executive Summary | text → `description` | local | n/a | — |
| Content source cards (Template / Existing Document / Custom) | choose source | local | n/a | — |
| Template list | select a template | local | n/a | **ignored on save.** No document is created from it. |
| Document dropdown | select a doc | local | n/a | saved as `documentId` only if the source is "document" |
| Custom terms textarea | text | local | n/a | **ignored on save** |
| Effective Start Date | date (default today) | local | n/a | — |
| Expiration Date (Optional) | date | local | n/a | empty → store default today + 365 days |
| Contract Value (USD) | number (default 25000) | local | n/a | saved as `value`; the store copies it to `contractValue` |
| Renewal Policy | manual, auto_renew, one_time | local | n/a | — |
| Payment Terms | text | local | n/a | **ignored on save.** The store sets "Net 30 days". |
| Special Conditions & Notes | text | local | n/a | **ignored on save** |
| "Back" / "Continue" | move between steps | local | n/a | only step 1 is validated |
| "Save as Draft" | `addContract({... id: 'CTR-{random 1000-9999}', status:'draft', activity:[{type:'created', description:'Contract draft created', actorName}]})` (`:78-113`) | `contracts` (+ `auditLogs`, `activities` "created contract") | **No — lost on refresh** | goes to `/contracts/{id}`; no toast |
| "Submit for Review" | same, but `status:'pending_review'` (no reviewer is set) | `contracts` (+ logs) | **No — lost on refresh** | goes to `/contracts/{id}` |

**Notes, limits and simulated parts**
- The `?docId=` and `?title=` query parameters (sent by the hidden card in 11.11) are **not read**. The form starts empty.
- The random `CTR-####` id can repeat an existing id.

---

### 11.27 Contract Details — `/contracts/[contractId]` (URL-only)

**File:** `src/app/(workspace)/contracts/[contractId]/page.tsx`
**Who can open it:** Any signed-in user who types the URL (also linked from the other contract pages). An unknown id shows "Contract Not Found" with "Return to Contracts Registry".
**Purpose:** One contract with 6 tabs.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Contract | `contracts.find(id)` | not persisted |
| Linked document | `documentItems` by `contract.documentId` | — |
| Linked signature request | `signatureRequests` by `contract.signatureRequestId` | — |

**Cards, widgets and lists**

#### Header banner
- **Shows:** id, status, type (first `_` → space), title, counterparty, "Owner: {ownerName}" (blank for seed), Effective, Expires.

#### Overview tab
- **Contract Overview card:** description (or a fixed demo sentence), Contract Value = `contract.value` (**"N/A" for all seed contracts**, because they only have `contractValue`), Renewal Policy, Internal Reviewer = `reviewerName` (**"Unassigned" for all seed contracts**).
- **Linked Document card:** title, "Version {currentVersion}" (**empty for seed docs**, field not set), file size, "Preview Document". Else "No specific document record attached."
- **Counterparty card:** 2-letter initials, name, status, effective and expiry dates.
- **E-Signature Link card:** request id, status badge, title, "View Signature Progress". Else "No signature request has been dispatched yet…" with "Initiate Signing".

#### Contract Document tab
- **Shows:** the linked document's raw content. If none, a generated text block with id, counterparty, dates, value (`value || 0`), type, renewal, and "[DEMO PREVIEW ONLY …]".

#### Parties & Signers tab
- **Shows:** fixed "Flash Sign Inc." / "Primary Provider" / owner name, and the counterparty with a fixed "Status: Authorized for Signature". Mostly hard-coded.

#### Review & Comments tab
- **Shows:** comments (author, date, `content`) and a post box. Seed comments have only `text`, so **their body shows empty**.
- **Empty state:** "No review comments recorded yet."

#### Signature Progress tab
- **Shows:** request title, "Dispatched {date}", status, "Open Signature Package", and each signer's name, email and status. Else "No Signature Request Linked" with "Request Signature Now".

#### Audit Trail tab
- **Shows:** `contract.activity` rows as "{actorName} {description} — {date}".
- **How it is calculated:** reads `actorName` and `description`. Seed activity and the store actions (`addContract` default, `submitContractForReview`, `markContractReviewed`) write `actor` and `action` instead. So **those rows show only a date with no text**. Only contracts made in the 11.26 wizard show readable text.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Breadcrumbs / "Back to Registry" | `/contracts`, `/contracts/all` | — | — | — |
| "Submit for Review" (status draft only) | `submitContractForReview(id)` → `pending_review` + activity | `contracts` | **No — lost on refresh** | — |
| "Approve Review" (status pending_review only) | `markContractReviewed(id)` → `awaiting_signature` + activity | `contracts` | **No — lost on refresh** | no reviewer check |
| "Request Signature" (draft, pending_review, awaiting_signature) | `/signatures/new?contractId=…&documentId=…` | — | — | review can be skipped |
| "Demo Export" / "Download Content" | downloads `{id}_{title}_demo.md` (value uses `value`, so $0 for seed) | none | n/a | — |
| "Archive" | `archiveContract(id)`, **no confirm**, stays on the page | `contracts` | **No — lost on refresh** | — |
| Tabs | switch | local | n/a | — |
| "Preview Document" | `/documents/{docId}` | — | — | — |
| "View Signature Progress" / "Open Signature Package" | `/signatures/{requestId}` | — | — | — |
| "Initiate Signing" / "Request Signature Now" | `/signatures/new?contractId=…` | — | — | — |
| Comment input + "Post Comment" (or Enter) | `addContractReviewComment(id, {authorId, authorName, content})` | `contracts[].reviewComments` | **No — lost on refresh** | — |

**Notes, limits and simulated parts**
- There is no way to edit a contract's fields after creation.
- There is no "request changes" on this page (only on 11.20).

---

### 11.28 Approval Center — `/approvals`

**File:** `src/app/(workspace)/approvals/page.tsx` (+ `PageHeader`, `Card`, `Button` from `src/components/shared/ui`, `DocStatusBadge` from `src/components/shared/badges.tsx`)
**Who can open it:** Any signed-in user. It is not in the sidebar. It is reached from the old `/dashboard` page's "View all" / approval links (`dashboard/page.tsx:235, 243`) and from seed notifications n3/n4 (`link: '/approvals'`).
**Purpose:** Approve or reject document approval requests. This is the **old** document model, separate from the library above.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Approvals | `useApp().approvals` (seed `MOCK_APPROVALS`, `mock-data.ts:1082-1088`) | **persisted** |
| Old documents | `useApp().documents` (seed `MOCK_DOCUMENTS`, `doc1`…`doc5`) | **persisted**. These are **not** the library `documentItems`. |
| Users | `users` | requester and approver names |
| Current user id | `currentUserId` | signed-in account id |

**Cards, widgets and lists**

#### "Awaiting Your Action ({n})"
- **Shows:** a card per approval with `assignedTo === currentUserId` and `status === 'pending'`: document title (link), "Requested by {name} • {relative time}", the document status badge, and Approve / Reject / Comment buttons.
- **How it is calculated:** `approvals.filter(...)` (`:18`). Relative time uses `formatRelative` (`src/lib/utils.ts:13-25`): "just now", "Nm ago", "Nh ago", "Nd ago", or a date after 30 days.
- **Empty state:** "You're all caught up! No approvals waiting for your action."
- **In practice:** seed approvals are assigned to `u1` and `u2`. A preset demo login has a different id, so this list is **always empty**, and the Approve/Reject buttons can't be reached in the normal demo.

#### "All Pending Approvals ({n})" table
- **Shows:** document title (link), approver name, requested time, for every approval with `status === 'pending'` (seed: apr1 doc1→Marcus Webb, apr2 doc1→Aria Chen, apr3 doc3→Aria Chen).
- **Empty state:** none (an empty table body).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Document title links (both lists) | go to `/documents/{apr.documentId}`, for example `/documents/doc1` | — | — | **broken:** the detail page looks in `documentItems` (`doc-101`…), so `doc1`…`doc5` give a **404** |
| "Approve" (1st click) | opens the comment box for that card | local | n/a | — |
| "Confirm Approve" | `updateApproval(id, {status:'approved', comment (if typed), resolvedAt: now})` (`app-context.tsx:2535-2538`). Then, if every **other** approval for the same document is already `approved` (or there are none), `updateDocument(docId, {status:'approved'})` (`approvals/page.tsx:21-30`) | `approvals`; maybe `documents` (status + `updatedAt`) | **Yes** (both are persisted) | no toast, notification or audit log |
| "Reject" (1st click) | opens the comment box | local | n/a | — |
| "Confirm Reject" | `updateApproval(id, {status:'rejected', comment, resolvedAt: now})` | `approvals` | **Yes** | the document status is **not** changed; no toast |
| "Comment" | only opens the comment box. There is no "save comment" action on its own. | local | n/a | — |
| Comment textarea | text, saved with approve/reject | local | n/a | optional |
| "Cancel" | closes the box and clears the text | local | n/a | — |

**Notes, limits and simulated parts**
- **What "approve" changes on the target:** only the old `documents` record (`doc1`…`doc5`), and only its `status` → `approved` when all its other approvals are approved. It never touches the library `documentItems`, contracts or signature requests. Example: doc1 has apr1 (u2) and apr2 (u1). The doc becomes approved only when the second of the two is approved.
- The "all others approved" check reads the approvals list from before this click. This is correct for one click at a time.
- No screen creates new approval requests (no `addApproval` action exists).
- The page uses only the shared UI kit and has no demo banner.

---

### 11.Z Data flow summary for this area

- **Reads:** `documentItems`, `documentFolders`, `documentTemplates`, `contracts`, `signatureRequests`, `projects`, `users`, `currentUserId`, `documents` (old model), `approvals`, plus `FEATURES.contracts`.
- **Writes (NOT persisted — lost on refresh):** `documentItems` (`addDocumentItem`, `updateDocumentItem`, `deleteDocumentItem`, `toggleFavoriteDocument`, `moveDocumentToFolder`, `duplicateDocument`, `archiveDocumentItem`, `addDocumentComment`), `documentFolders` (`addFolder`, `updateFolder`, `deleteFolder`), `documentTemplates` (`addTemplate`, `toggleFavoriteTemplate`; `updateTemplate` is unused), `contracts` (`addContract`, `updateContract`, `deleteContract`, `archiveContract`, `submitContractForReview`, `addContractReviewComment`, `markContractReviewed`). `addDocumentItem` and `addContract` also add to `auditLogs` and `activities`, which are also not persisted.
- **Writes (persisted):** `approvals` (`updateApproval`) and `documents` (`updateDocument`, only from the Approval Center). `addDocument` exists but is unused here.
- **Background links from other areas:** signature actions set library doc status (`pending` / `signed`) and contract status (`awaiting_signature` / `active`) (`app-context.tsx:2270-2283`, `2470-2482`).
- **No real files:** uploads keep only the file name and size. Downloads are generated markdown/CSV text. No real sharing, encryption, versioning or e-signature.

---

## 12. Teams, members and planning (calendar, availability, meetings, time off)

This area covers the **Teams** sidebar section (Analytics, Members and the pages opened from Analytics: Workload, Timesheet, Activity, Announcements, Notifications) and the **Planning** item (Calendar, Meetings, Availability & Time Off). All data lives in `AppContext` (people, teams, meetings, time off, calendar events, announcements, work sessions) except invitations, which live in `DemoAuthContext`. Many screens mix live store data with hard-coded demo values and fixed "today" dates (`2026-10-21`), and several edit flows open with an empty form because of how the dialogs keep their state (see 12.4 and 12.26). The Teams ("squads") feature is switched off (`FEATURES.teams = false`). Its pages redirect away and its controls are hidden, but the team data is still in the store.

**About roles in this area.** After sign-in, `src/context/app-context.tsx:622-672` sets `demoRole` to the signed-in account's role (`executive` becomes `ceo`, `qa` becomes `qa_tester`) and sets `currentUserId` to that account's id. `FIXED_DEMO_ROLE` (`ceo`) applies only before that sync runs. If the signed-in account's email does not match a seed user, the account is **added to the front of `users`**, so it appears as an extra member everywhere in this area (`app-context.tsx:640-655`). Only two controls in this area check a permission:
- the Invite button and the Invited-tab actions use `canManageUsers` (ceo, org_admin, platform_admin);
- the Timesheet "Team" view uses `canViewTeamTime` (ceo, project_manager, engineering_lead, org_admin, platform_admin).

Every other edit, delete, approve and cancel action is open to every role.

**FEATURES.teams = false: what is hidden and what still works**
| Item | Effect |
|---|---|
| Sidebar "Teams Directory" item | Hidden (`src/components/layout/app-sidebar.tsx:120`) |
| `/teams/directory`, `/teams/new`, `/teams/[teamId]`, `/teams/[teamId]/edit` | **Do not work by URL**. Their `layout.tsx` calls `redirect('/teams')` (`teams/directory/layout.tsx:6`, `teams/new/layout.tsx:6`, `teams/[teamId]/layout.tsx:6`; the edit page sits under `[teamId]`) |
| "Create Team" button and Active Teams Directory preview on `/teams` | Hidden (`teams/page.tsx:149`, `:374`, `:557`) |
| Squad filters (Members, Workload, Calendar, Meetings, Availability) | Hidden |
| Team pickers in Add/Edit Member, Schedule Meeting, Create Event, full scheduler page | Hidden. New records are saved with `teamIds: []` / `teamId: undefined` |
| Team names on member cards, meeting cards, agenda rows, meeting drawer | Hidden |
| "Teams & Squads" category and team-resource rows in Team Activity | Hidden / filtered out (`teams/activity/page.tsx:21`, `:34`) |
| Team data (`teams`, `user.teamIds`) | Still loaded from `MOCK_TEAMS` and still saved to localStorage |

---

### 12.1 Team Analytics — `/teams`

**File:** `src/app/(workspace)/teams/page.tsx` (+ `src/components/analytics/team-charts.tsx`, `time-tracking.tsx`, `chart-card.tsx`, `collaboration-badges.tsx`, `member-avatar.tsx`)
**Who can open it:** Any signed-in user. Sidebar: Teams → Analytics. The sidebar also highlights it on `/teams/workload`, `/teams/announcements`, `/teams/activity` and `/teams/timesheet` (`app-sidebar.tsx:114-118`). The header title is "Team Analytics".
**Purpose:** A one-page summary of people, open work, meetings, time tracking, leave and milestones, with quick-create buttons.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| People | `useApp().users` (seed `MOCK_USERS`, 14 people incl. client u10, auditor u11, CI/CD Bot u13 with capacity 168) | plus the signed-in account if it is new |
| Tasks | `useApp().tasks` | all tasks, including subtasks |
| Meetings | `useApp().meetings` (seed `MOCK_MEETINGS`, `src/data/mock-collaboration.ts:331`) | |
| Time off | `useApp().timeOffRequests` (seed `MOCK_TIME_OFF`, `mock-collaboration.ts:235`) | |
| Activities | `useApp().activities` (seed `MOCK_AUDIT_LOGS`) | **not saved**: lost on refresh |
| Announcements | `useApp().announcements` (seed `MOCK_ANNOUNCEMENTS`) | includes drafts |
| Milestones | `useApp().milestones` | all projects |
| Weekly created/completed numbers | `WEEKLY_TASK_FLOW` in `src/data/mock-analytics.ts:13` | **hard-coded demo numbers** |
| Work sessions | `useApp().workSessions` (seed `MOCK_WORK_SESSIONS`, `src/data/mock-agent-activity.ts:100`) | |
| "Today" / "this week" | constants `TODAY='2026-10-21'`, `WEEK_START='2026-10-19'`, `WEEK_END='2026-10-25'` (`teams/page.tsx:22-24`) | fixed dates, not the real date |

**Cards, widgets and lists**

#### KPI tiles (6 tiles, each is a link)
- **Shows:** Members, Open tasks, Blocked, Completed this week, At capacity, Upcoming leave, each with a small note.
- **Data source / calculation** (`teams/page.tsx:56-120`):
  - **Members** = `users.length`. Note: "`N` active" = users where `isActive !== false`. Links to `/teams/members`.
  - **Open tasks** = tasks with `status !== 'done'`. Note: "`N` in progress" = status `in_progress`. Links to `/projects/my-tasks`, which shows only *my* tasks while this tile counts everyone's.
  - **Blocked** = tasks with status `blocked`. Note: "Nothing blocked" or "Need attention". Links to `/projects/my-tasks`.
  - **Completed this week** = last row of `WEEKLY_TASK_FLOW` (`completed: 19`). Note: delta vs the previous row (`+2 vs last week (demo)`). **Mock, not from tasks.**
  - **At capacity** = number of people whose workload percent is ≥ 85 (formula in the workload card below). Links to `/teams/workload`.
  - **Upcoming leave** = `upcomingTimeOff.length`, where `upcomingTimeOff` = approved requests with `endDate >= '2026-10-21'`, **cut to the first 4** (`:72-76`). The tile can never show more than 4. Links to `/planner/availability`.
- **Empty state:** none (numbers show 0).

#### Recent Announcements
- **Shows:** up to 3 rows: "Pinned" chip, title, content (one line), author name (or "Leadership") and published date.
- **Data source:** `announcements`.
- **How it is calculated:** pinned first (stable sort on `isPinned`), then the existing array order (newest-added first), `slice(0, 3)` (`:86-90`). Drafts are **not** filtered out. Each row links to `/teams/announcements`.
- **Empty state:** "No announcements yet. Use Post Announcement to share an update."

#### Tasks created vs completed (chart) — `TaskFlowChart`
- **Shows:** line chart for 8 weeks, a legend with this week's values, and a "Demo data" badge.
- **Data source:** `WEEKLY_TASK_FLOW` only (`team-charts.tsx:28-77`). **Entirely mock.** It never changes when tasks change.

#### Workload vs capacity
- **Shows:** the 6 most-loaded people: "load / capacity h · percent%", a coloured bar and an "At capacity" label.
- **How it is calculated** (`teams/page.tsx:45-54`): for each user, `load = Σ (storyPoints || points || 3)` over tasks assigned to them with `status !== 'done'`. `capacity = weeklyCapacity || 40`. `percent = round(load / capacity × 100)`. Sorted from highest percent. Colour: ≥85 rose ("At capacity"), ≥70 amber, else green. The bar width is capped at 100%. Story points are treated as hours. Subtasks without points count as 3 h each, and their parent is counted too.
- Links: "Full Board" and "Reassign tasks →" both go to `/teams/workload`.

#### Task status per member (chart) — `TaskStatusByMember`
- **Shows:** horizontal stacked bars per person (first name), split into To do / In progress / In review / Blocked / Done, with a total at the end. The legend shows the total per status.
- **How it is calculated** (`team-charts.tsx:140-157`): for each user, count every assigned task by `status`. People with 0 tasks are removed. Sorted by total, highest first. Includes done tasks and subtasks.
- Link "My Tasks" goes to `/projects/my-tasks`.

#### Meeting hours (chart) — `MeetingLoad`
- **Shows:** hours of meetings per person for the fixed week 2026-10-19 → 2026-10-25, and the text "This week · X h across N people".
- **How it is calculated** (`team-charts.tsx:240-253`): meetings with `status !== 'cancelled'` and `weekStart ≤ date ≤ weekEnd`. For each user, add `durationMinutes` of meetings where they are organizer **or** participant. `hours = round(minutes/60, 1 decimal)`. People with 0 hours are removed. Sorted by hours, highest first. `completed` meetings count.
- **Empty state:** "No meetings scheduled this week."
- Link "Meetings" goes to `/planner/meetings`.

#### Time tracking — `TimeTrackingSection`
- **Shows:** "Last 5 working days · total recorded · N timers running now"; "Hours per person" bars; "Hours by agent" bars with % share.
- **Data source:** `workSessions`, `users`, live clock `useNow()` (ticks every 30 s, `src/lib/use-now.ts`).
- **How it is calculated** (`time-tracking.tsx:19-39`): `start` = midnight of the oldest of the last 5 weekdays ending today (`lastWorkdays`, `src/lib/agent-connection.ts:394`) using the **real** current date. Sessions with `startedAt ≥ start` are kept. Minutes per session = `round((endedAt or now) − startedAt) / 60000` (`sessionMinutes`, `agent-connection.ts:381`). Results are summed per `userId` and per `source` (claude_code, codex, gemini_cli, antigravity, web, manual). A person is "running" if any session has no `endedAt`. Bars are relative to the largest value. The agent % is `minutes / total × 100`. Time is shown as "Xh Ym" (`formatMinutes`).
- **Empty state:** "Loading…" until the clock is available. No empty text if no sessions.
- Link "View full timesheet" goes to `/teams/timesheet?view=team`.

#### Availability right now — `AvailabilityNow`
- **Shows:** one segmented bar, a legend with counts, and the names of people who are not available.
- **How it is calculated** (`team-charts.tsx:88-129`): group users by `availability || 'available'` into Available / Busy / Focus time / Out of office. Segment width = count / users.length. Description: "`available` of `total` members available". This is the stored `user.availability` field, **not** calculated from meetings or leave.
- Link "Schedule" goes to `/planner/availability`.

#### Upcoming Absences
- **Shows:** up to 4 approved absences: avatar, name, date range, leave-type badge.
- **How it is calculated:** the same `upcomingTimeOff` list as the KPI (approved, `endDate >= '2026-10-21'`, first 4 in array order, **not sorted by date**).
- **Empty state:** "No scheduled absences this week."
- Link "Time Off" goes to `/planner/availability`.

#### Upcoming Milestones
- **Shows:** up to 4 milestones: name, due date, "Progress: N%", status.
- **How it is calculated:** `milestones.filter(status !== 'completed').slice(0, 4)` (`:79-83`). Array order, no date sort, all projects (including past-due).
- **Empty state:** "No pending milestones."
- Link "View All" goes to `/planner/calendar?category=milestone`. That page shows **calendar events** of category milestone, not this milestones list (see 12.17).

#### Team Members
- **Shows:** the first 6 users in `users` array order: avatar with status dot, name, title, department (team names only if FEATURES.teams), "N open" tasks and an availability badge.
- **How it is calculated:** `users.slice(0, 6)`. Open = tasks assigned with `status !== 'done'` (`:478-519`).
- Links: name, chevron, and "All Members" (to `/teams/members`).

#### Recent Activity
- **Shows:** the first 5 activities: actor, action, detail, date.
- **Data source:** `activities.slice(0, 5)`. All kinds of activity (projects, signing, and so on), not only team activity. **Not saved**: entries created in this session vanish on refresh.
- Link "View Feed" goes to `/teams/activity`.
- **Empty state:** none (empty list).

#### Hidden: Active Teams Directory preview
- Only when FEATURES.teams is true (`:374-457`). Team cards show colour, name, department, "Active" (always), avatars, "N tasks" (tasks assigned to any team member) and the lead's first name.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Add Member" | Opens Add Team Member dialog (12.4) | — | — | — |
| "Create Team" | Hidden (FEATURES.teams) | — | — | — |
| "Schedule Meeting" | Opens Schedule Meeting dialog (12.20) | — | — | — |
| "Post Announcement" | Opens Post Announcement dialog (12.11) | — | — | — |
| KPI tiles (6) | Navigate (links above) | — | — | — |
| Announcement row / "Announcements Board" | Go to `/teams/announcements` | — | — | — |
| Chart / Table toggle on each chart card | Switches the card between the chart and a plain table of the same numbers (`chart-card.tsx:126-143`) | local state | No | — |
| "Full Board", "Reassign tasks →" | Go to `/teams/workload` | — | — | — |
| "My Tasks", "Meetings", "Schedule" chart links | Navigate | — | — | — |
| "View full timesheet" | `/teams/timesheet?view=team` | — | — | — |
| "Time Off", "View All" (milestones) | Navigate | — | — | — |
| Member name / chevron, "All Members" | Go to member profile / directory | — | — | — |
| "View Feed" | `/teams/activity` | — | — | — |

**Notes, limits and simulated parts**
- "Completed this week", its delta and the "Tasks created vs completed" chart are hard-coded (`mock-analytics.ts`).
- Fixed dates (`2026-10-21`, week 19–25 Oct) are used for leave and meeting hours, but the Time tracking card uses the real clock. The two parts of the page can describe different weeks.
- The Upcoming leave tile is capped at 4 because it counts a list already cut to 4.
- Workload counts subtasks and their parents, uses "points = hours" and defaults to 3 h per task. The bot (capacity 168), client and auditor are included.
- The Add Member, Schedule Meeting and Post Announcement dialogs on this page keep their old values and the green success message after the first use, because they stay mounted (see 12.26). Reopening after a successful add shows the previous entries and "…added successfully!".

---

### 12.2 Members directory — `/teams/members` (tabs: Members, Invited `?tab=invited`)

**File:** `src/app/(workspace)/teams/members/page.tsx` (+ `components/members/invitations-list.tsx`, `invite-member-dialog.tsx`, `collaboration/create-member-dialog.tsx`)
**Who can open it:** Any signed-in user (sidebar Teams → Members). "Invite people" and the Invited-tab actions require `canManageUsers(demoRole)`: ceo, org_admin, platform_admin (`src/lib/permissions.ts:129`). **Edit and Remove on member cards are not permission-checked.**
**Purpose:** Browse people, filter and sort them, edit or remove them, and manage pending invitations.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Members | `useApp().users` | everyone in AppContext, incl. bot/client/auditor |
| Tasks / projects / teams | `useApp()` | for counts and badges |
| Invitations | `useDemoAuth().invitations` filtered to `organizationId === selectedWorkspace.id` and `status === 'pending'` | stored in localStorage `flashsign_demo_invitations` |
| Role | `useApp().demoRole` | signed-in account's role |

**Cards, widgets and lists**

#### Tabs "Members (N)" / "Invited (N)"
- Members count = `users.length`. Invited count = pending invitations for this workspace (includes expired-but-still-pending ones) (`:45`).

#### Member grid cards (default view)
- **Shows:** avatar with status dot, name (link), title or role, department, email, availability badge, first 3 skills (+N), "N tasks • N projects", "Profile" link. Squad badges only if FEATURES.teams.
- **How it is calculated:** tasks = assigned with `status !== 'done'`. Projects = `projects` whose id is in `member.projectIds` (`:277-280`).
- **Empty state:** "No members found … Reset Filters".

#### Member list (table view)
- Columns: Member, Department (title + department), Squads (hidden), Availability, Active Tasks, Time Zone (`timeZone || 'EST'`), Actions.

#### Invited tab — `InvitationsList`
- **Shows:** a table of pending invitations, newest `sentAt` first: name/email, job title or role title, invited by, sent date, status chip ("Pending · expires in N days" or amber "Expired N days ago") (`invitations-list.tsx:17-22`, `:90-99`).
- Expired = `expiresAt <= now` (`src/lib/invitations.ts:17`). Days text = `ceil((expiresAt − now) / 1 day)` (`invitations.ts:22-26`).
- **Empty state:** "No pending invitations … Invite people" (button only if `canManage`).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Invite people" (only if canManageUsers) | Opens Invite dialog (12.3) | — | — | — |
| Tab "Members" / "Invited" | `router.replace` to `/teams/members` or `?tab=invited` | URL | — | — |
| Search box | Filters by name, email or title (case-insensitive) | local | No | — |
| Department dropdown | Options = distinct `user.department` values. Exact match | local | No | — |
| Squad dropdown | Hidden (FEATURES.teams) | — | — | — |
| Availability dropdown | All / Available / Busy / Focus Time / Out of Office. Exact match on `user.availability` | local | No | — |
| Sort dropdown | Name (A–Z) / Active Tasks (open-task count, high first) / Department (A–Z) | local | No | — |
| Grid / List icons | Switch view | local | No | — |
| "Reset Filters" (empty state) | Clears search, department, team and availability (not sort) | local | No | — |
| Name link / "Profile" | `/teams/members/[id]` | — | — | — |
| Edit (pencil) | Opens CreateMemberDialog in edit mode. **The form opens empty or with stale values** (12.4, 12.26) | `updateMember` on save | Yes (`users`) | toast |
| Remove (trash) → modal "Confirm Remove" | `deleteMember(id)` (`app-context.tsx:1372`) | `users` (removed), `teams[].memberIds` (removed, lead replaced by the next member or '') | Yes | No toast, no activity log. **Tasks are NOT unassigned**, although the modal says "Their task assignments will be unlinked". You can remove yourself |
| Remove modal "Cancel" | Closes | — | — | — |
| Invited: "Copy link" (not expired) | Copies `origin/invite/<token>` to the clipboard, shows "Copied" for 2 s | — | — | — |
| Invited: "Open" (not expired) | Opens the invite link in a new tab | — | — | — |
| Invited: "Resend" | `resendInvitation(id)` (`demo-auth-context.tsx:515`): sets `sentAt = now`, `expiresAt = now + 7 days`, keeps the same id | `invitations` | Yes (`flashsign_demo_invitations`) | No email sent, no toast. Old links still carry the old `expiresAt` inside the token |
| Invited: "Revoke" → modal "Revoke" | `revokeInvitation(id)` (`demo-auth-context.tsx:534`): status becomes `revoked`, the row disappears | `invitations` | Yes | Revocation is checked only in this browser (see notes) |

**Notes, limits and simulated parts**
- The Members list is the AppContext `users` list. An invited person appears only after they sign in **in this browser**, when the sign-in sync adds them (`app-context.tsx:622-672`).
- **Invitation token is NOT encrypted or signed.** It is the invitation JSON (without status) encoded as **base64url** (`src/lib/invitations.ts:30-39`). Anyone can decode it, and anyone can edit it and re-encode it (for example change `role` or `expiresAt`). `decodeInvite` only checks that `id`, `email` and `organizationId` exist (`:41-50`).
- On accept, revoked/accepted status is checked only against this browser's stored list (`demo-auth-context.tsx:543-549`). In another browser, a revoked link still works until the `expiresAt` written in the token.
- "Sort by Active Tasks" counts open tasks, not hours.

---

### 12.3 Invite people dialog

**File:** `src/components/members/invite-member-dialog.tsx`
**Who can open it:** Opened from "Invite people" (canManageUsers only).
**Purpose:** Create a pending invitation and show the link. **No email is sent.**

**Cards, widgets and lists**

#### Email preview (right panel)
- **Shows:** a fake email: From "Flash Sign <no-reply@flashsign.io>", To (typed email), subject "{inviter} invited you to join {org}", greeting with first name, role title and department, personal message, an "Accept invitation" chip (not clickable), "expires in 7 days". It updates as you type (`:189-215`).
- Inviter = `currentUser.fullName` from DemoAuth. Org = `selectedWorkspace.name`.

#### Success view
- "Invitation sent", the read-only invitation link, a "Copy link" button, and the text "Prototype: no email is actually sent…" (`:86-125`).

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Email (required) | Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` | local | — | — |
| Full name, Job title, Personal message (max 500) | Optional text | local | — | — |
| Role dropdown | `INVITABLE_ROLES` = all `DEMO_ROLE_OPTIONS` except `executive` (`invitations.ts:11`) | local | — | — |
| Department (text + suggestion list from user departments) | Optional | local | — | — |
| "Send invitation" | Validates the email, rejects it if an AppContext user has it ("X is already a member."), then calls `sendInvitation` (`demo-auth-context.tsx:471-512`). That rejects: not logged in; a DemoAuth user with the same email in this org; an existing **non-expired** pending invite for that email. Creates `{id: inv-<base36 time>, …, sentAt: now, expiresAt: now+7d, status: 'pending'}`. An expired pending invite to the same email is replaced | `invitations` | Yes (`flashsign_demo_invitations`) | Switches to the success view. No toast, no notification, no activity |
| "Copy link" (success) | Copies the link to the clipboard. Fails silently if blocked | — | — | "Copied" for 2 s |
| Link field | Selects all on focus | — | — | — |
| "Invite another" | Resets the form | — | — | — |
| "Done", "Cancel", X | Reset the form and close | — | — | — |

**Notes:** The link is `window.location.origin + /invite/ + base64url(JSON)`. The link carries the email, role, organization and inviter.

---

### 12.4 Add / Edit Team Member dialog

**File:** `src/components/collaboration/create-member-dialog.tsx`
**Who can open it:** "Add Member" on `/teams`; Edit (pencil) on `/teams/members`; "Edit Profile" on a member profile. No permission check.
**Purpose:** Create or edit a person record in AppContext `users` (not a login account).

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Full Name * | Required (trimmed) | local | — | — |
| Email Address * | Must contain "@" and "."; must not duplicate another user's email (case-insensitive, edit ignores self) | local | — | — |
| Job Title | Default "Senior Engineer" | local | — | — |
| Department | Fixed list of 6 (Engineering … Legal & Compliance) | local | — | — |
| System Role | 8 roles (developer … client). No ceo, auditor or platform_admin option | local | — | — |
| Profile Color (8 swatches) | Picks avatar colour | local | — | — |
| Time Zone | Fixed list of 7 | local | — | — |
| Working Hours (text) | Free text, default "09:00 - 17:00 EST" | local | — | — |
| Initial Availability | available / busy / focus_time / out_of_office | local | — | — |
| Weekly Capacity slider | 10–60 h, step 5, default 40 | local | — | — |
| Assigned Teams chips | Hidden (FEATURES.teams) | — | — | — |
| Assigned Projects chips | Toggle project ids | local | — | — |
| Skills (comma separated) | Split on commas and trimmed. Default "React, TypeScript" | local | — | — |
| "Add Member" (submit, add mode) | `addMember` (`app-context.tsx:1322`): id `u-<time>`, initials from the name, defaults for missing fields, `createdAt` now. Adds the member to each selected team's `memberIds` | `users`, `teams` | Yes | Activity/audit "added a team member" (**activity lost on refresh**), toast "`name` added to the team", green message, closes after 700 ms |
| "Save Changes" (edit mode) | `updateMember(id, {...})` (`:1368`). Plain merge | `users` | Yes | Toast "Changes to `name` saved". **No activity log.** Does not update team `memberIds` if team ids change |
| "Cancel", X, click on backdrop | Close without saving | — | — | — |

**Notes, limits and simulated parts**
- **State is not reset between openings.** The form's `useState` values are set once, on the first render (`:60-75`). The component stays mounted while closed (`if (!open) return null` comes after the hooks). Results:
  - On `/teams/members` the dialog first mounts with `memberToEdit = null`. Clicking Edit on any member shows the **title "Edit Team Member" with an empty name and email and default values**. Saving (after typing a name and email) overwrites that member with those default values.
  - After a successful add, reopening shows the previous values and the old green "…added successfully!" message. Submitting again fails with "already exists".
  - On the profile page the form is filled with the member as at first render. Later changes are not picked up.
- Duplicate-email check covers AppContext users only, not DemoAuth accounts or invitations.
- Changing a user's role here does not change their login role or `demoRole`.

---

### 12.5 Member profile — `/teams/members/[memberId]`

**File:** `src/app/(workspace)/teams/members/[memberId]/page.tsx`
**Who can open it:** Any signed-in user. No permission checks on any button.
**Purpose:** One person's details, workload, tasks, projects and recent actions, with quick status change and task assignment.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Member | `users.find(id === memberId) \|\| users[0]` (`:37`) | **An unknown id silently shows the first user** (usually Aria Chen or the signed-in account); the "Member not found" branch is practically unreachable |
| Tasks, projects, teams | `useApp()` | |
| Activities | `activities` where `actorId === member.id`, first 8 | not saved |

**Cards, widgets and lists**

#### Profile header
- Avatar with status dot, name, role chip (`role.replace('_',' ').toUpperCase()`, only the first underscore is replaced), title or "Specialist", department, email, time zone (or 'EST'), working hours (or '09:00 - 17:00 EST').

#### Current Availability
- `AvailabilityBadge` for `member.availability`, plus a 4-button "Set status" switcher.

#### Assigned Tasks (N)
- Tasks assigned with `status !== 'done'`: key, title, project name (or "Workspace"), "Points: Nh" (`storyPoints || points || 3`), status chip.
- **Empty state:** "No active tasks assigned. Member is currently available for sprint work."

#### Recently Delivered Tasks (N)
- Done tasks, first 4 (array order, not by completion date). No empty text.

#### Active Project Involvements (N)
- Projects in `member.projectIds`: name link to `/projects/[id]`, `progress%`, description. No empty text.

#### Workload & Capacity
- **How it is calculated** (`:57-59`): `totalHours = Σ (storyPoints || points || 3)` over open tasks. `weeklyCap = weeklyCapacity || 40`. `loadPercentage = min(100, round(totalHours / weeklyCap × 100))`. Bar: >85 rose, >65 amber, else green. Status text: >85 "High Workload", else "Balanced". These thresholds differ from Analytics (85/70) and Workload (55/85/100). Because it is capped at 100, overload above 100% is hidden.

#### Assigned Squads
- Hidden (FEATURES.teams).

#### Skills & Expertise
- All skills as pills (only if any).

#### Recent Actions
- Up to 8 activities by this person: action, detail, date. **Empty state:** "No recent log entries for this user."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Back to Member Directory" | `/teams/members` | — | — | — |
| "Assign Task" / "Assign New Task" | Opens Assign Task modal | — | — | — |
| Assign modal: Task Title, Project dropdown, Estimated Points/Hours (1–13) | Inputs. Project defaults to `projects[0]` | local | — | — |
| Assign modal "Assign Task" | Empty title gives an error toast. Otherwise `addTask({title, projectId, assigneeId: member, storyPoints, status: 'in_progress', priority: 'medium', type: 'task', description: "Task assigned directly to …"})` (`app-context.tsx:828`): key from `nextTaskKey`, project progress and timeline recalculated | `tasks`, `projects` | Yes | Toast "Task … assigned to …". No notification, no activity, no status-change record, no timer, no board column set |
| Assign modal "Cancel" | Close | — | — | — |
| "Edit Profile" | Opens CreateMemberDialog filled with this member (as at first render) | `updateMember` | Yes | toast |
| "Schedule" | Link to `/planner/calendar` (not filtered to this person) | — | — | — |
| "Set status" buttons (Available, Busy, Focus time, Out of office) | `updateMemberAvailability(id, status)` (`:1381`) | `users[].availability` | Yes | Activity/audit "updated availability status" (lost on refresh). No toast |
| Project name links | `/projects/[id]` | — | — | — |

---

### 12.6 Add Member page — `/teams/members/new`

**File:** `src/app/(workspace)/teams/members/new/page.tsx`
**Who can open it:** Any signed-in user, **by URL only**. Nothing in the app links here.
**Purpose:** A full-page version of the Add Team Member form.

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Same fields as 12.4 (name, email, title, department, role, avatar colour, time zone, working hours, availability, capacity slider, skills) | Same validation (email must contain "@" and "."; no duplicate email) | local | — | — |
| Assign to Teams chips | Hidden (FEATURES.teams) | — | — | — |
| (Project assignment) | **No UI.** `selectedProjectIds` always `[]` | — | — | — |
| "Add Member" | `addMember({...})` | `users` (+teams) | Yes | Toast, green banner, redirect to `/teams/members` after 800 ms, activity (lost on refresh) |
| "Cancel", "Back to Members Directory" | Link to `/teams/members` | — | — | — |

---

### 12.7 Workload — `/teams/workload`

**File:** `src/app/(workspace)/teams/workload/page.tsx` (+ `collaboration/reassign-task-dialog.tsx`, documented elsewhere)
**Who can open it:** Any signed-in user. Not in the sidebar. Reached from Analytics links.
**Purpose:** Per-person load against capacity, with task reassignment.

**Cards, widgets and lists**

#### 4 category tiles: Available / Balanced / High Workload / Over Capacity
- Counts of the filtered members in each category (formula below). Captions: "< 55%", "55%–85%", "85%–100%", "> 100%".

#### Unassigned tasks notice
- Shown if any task has no `assigneeId` and `status !== 'done'`: "N unassigned tasks in active backlog…".

#### Member Capacity Breakdown (rows)
- **Shows:** avatar, name, category badge, title or role, department, "assigned / capacity hrs", "N% allocated", a bar, and chips for each open task with a reassign icon. Header: "Showing N members".
- **How it is calculated** (`:34-77`):
  - Members are filtered by name search, squad (hidden) and project ("has at least one task in that project", any status).
  - Member tasks = assigned, `status !== 'done'`, and in the selected project if one is chosen.
  - `assignedHours = Σ (storyPoints || points || 3) × (month ? 2 : 1)`.
  - `capacity = (weeklyCapacity || thresholdHours) × (month ? 4 : 1)`.
  - `loadRatio = round(assignedHours / capacity × 100)`.
  - Category: <55 available, ≤85 balanced, ≤100 high, else overloaded. Sorted by loadRatio, highest first. The bar is capped at 100%.
- **Empty state:** none (the list is just empty).

**Buttons and controls**

| Control | What happens when used | Data changed | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Weekly View" / "Monthly View" | Changes the multipliers above. **Monthly shows exactly half of the weekly %** (hours ×2, capacity ×4) | local | No | — |
| Search | Name contains text | local | No | — |
| Squad dropdown | Hidden | — | — | — |
| Project dropdown | Filters members and tasks as described | local | No | — |
| "Baseline Cap" 35h / 40h / 45h | Sets `thresholdHours`, used **only** for members with no `weeklyCapacity`. All seed users have one, so it usually changes nothing | local | No | — |
| "Assign Next Task" | Opens the Reassign dialog for the first unassigned open task | — | — | — |
| Reassign icon on a task chip | Opens the Reassign dialog for that task. Saving calls `reassignTask(taskId, userId)` (`app-context.tsx:1227`) | `tasks[].assigneeId` | Yes | Notification to the new assignee, activity "reassigned task" (lost on refresh), toast |
| Name link / chevron | Member profile | — | — | — |

**Notes:** The global `collaborationSettings.workloadThresholdHours` (set in Settings → Preferences) is **never read** here. The page uses its own local 35/40/45 switch.

---

### 12.8 Timesheet — `/teams/timesheet` (`?view=team`, `?log=1`)

**File:** `src/app/(workspace)/teams/timesheet/page.tsx`
**Who can open it:** Any signed-in user. The My time / Team switch is shown only if `canViewTeamTime(demoRole)` (ceo, project_manager, engineering_lead, org_admin, platform_admin; `permissions.ts:144`). Other roles always see "My time". `/ai-agents/timesheet` redirects here.
**Purpose:** Minutes recorded by timers (any agent or the web) and manual entries, for the last 5 working days.

**Data this screen reads:** `workSessions`, `tasks`, `users`, `demoRole`, `useCurrentUser()`, live clock `useNow()`.

**Cards, widgets and lists**

#### Auto-stopped timers to check (My time only)
- **Shows:** the current user's sessions with `needsReview: true`: task key, day, start time, duration. The text "No activity for 2 hours, so it stopped at the last activity time." is **hard-coded** (`:169`). It shows even for day-cutoff stops, and whatever the real idle limit in agent settings is.

#### Total and by-agent strip
- "X total" = grand total of the grid. Then a badge with minutes for each source that has time.

#### Grid "My hours by task" / "Team hours"
- **How it is calculated** (`:29-61`):
  - `days` = the last 5 weekdays ending today (real date).
  - Sessions with `startedAt ≥ midnight of the first day` are kept.
  - My time: only `userId === current user`, one row per `taskId`. Team: everyone, one row per `userId`.
  - Each session's minutes (`sessionMinutes`, running ones up to now) go into the column of the day whose `toDateString()` matches `startedAt`. Sessions on weekends are skipped.
  - Row total = sum. Footer = per-day totals and the grand total. Rows are sorted by total, highest first. A "running" tag shows if any session in the row has no `endedAt`.
- **Empty state:** "No time recorded in this period." ("Loading…" before the clock is ready.)

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "My time" / "Team" tabs (permitted roles) | Switch view | local | No | — |
| "Log time" (My time only) | Shows or hides the manual-entry row. Opens automatically with `?log=1` | local | — | — |
| Task dropdown | My open tasks (`assigneeId === me`, not done). Defaults to the first | local | — | — |
| Day dropdown | One of the 5 days. Defaults to the latest | local | — | — |
| Hours (min 0.25, step 0.25) | Default 1 | local | — | — |
| Note | Optional | local | — | — |
| "Add" | `minutes = round(hours × 60)`. If there is no task or minutes ≤ 0 it **does nothing silently**. Calls `logManualTime(taskId, minutes, date, note)` (`app-context.tsx:1879`): adds a session `source: 'manual'`, starting `date 09:00` local, ending start + minutes, `endReason: 'paused'` | `workSessions` | Yes | Closes the form. No toast. No overlap check |
| "Adjust" (review item) | Shows a minutes box prefilled with the current duration | local | — | — |
| "Save" (adjust) | If minutes > 0: `updateWorkSession(id, {endedAt: startedAt + minutes, needsReview: false})` | `workSessions` | Yes | — |
| "Looks right" | `updateWorkSession(id, {needsReview: false})` | `workSessions` | Yes | — |

**Notes:** The form note says "Manual entries are labelled as such on the timesheet", but the grid has no per-entry label. Manual time shows only as the "manual" badge in the by-agent strip.

---

### 12.9 Team Activity feed — `/teams/activity`

**File:** `src/app/(workspace)/teams/activity/page.tsx`
**Who can open it:** Any signed-in user. Not in the sidebar ("View Feed" on Analytics).
**Purpose:** A filterable list of all activity/audit entries.

**Cards, widgets and lists**

#### Activity stream
- **Shows:** actor avatar with a resource icon, "**actor** action", detail, the raw ISO timestamp, resource name, and a right-side link by resource: Meeting → "Meetings" (`/planner/meetings`); resource containing "time" → "Time Off" (`/planner/availability`); Announcement → "Board"; Team → "Teams" (`/teams/directory`, which redirects; hidden anyway); anything else → the plain text "Audited".
- **Data source:** `activities` (seed `MOCK_AUDIT_LOGS` plus new entries this session). **Not saved**: new entries vanish on refresh.
- **How it is calculated:** rows with resource "team" are removed (FEATURES.teams off). Then search (action, actor name or detail), member (`actorId`) and category (resource match) filters are applied (`:31-53`). Array order (newest added first).
- **Empty state:** "No activities found. Try resetting search or filter criteria."

**Buttons and controls**

| Control | What happens when used | Data changed | Saved? | Side effects |
|---|---|---|---|---|
| Search | Filter text | local | No | — |
| Member dropdown | All users | local | No | — |
| Category chips | All / Members & Roles / Meetings / Time Off / Announcements / Tasks & Projects ("Teams & Squads" hidden) | local | No | — |
| Right-side links | Navigate as listed | — | — | — |

**Notes:** Milestone entries get a flag icon but there is no Milestone category chip. Many actions in this area (updateMember, deleteMember, deleteTeam, calendar events, meeting edits and deletes, time-off deletes, announcement edits, pins and deletes) write **no** activity entry.

---

### 12.10 Announcements board — `/teams/announcements`

**File:** `src/app/(workspace)/teams/announcements/page.tsx`
**Who can open it:** Any signed-in user. Not in the sidebar (reached from Analytics). No permission checks on pin, edit or delete.
**Purpose:** Read, pin, edit and delete announcements.

**Cards, widgets and lists**

#### Announcement cards
- **Shows:** "Pinned Notice" chip, priority badge (Important or Normal), "Audience: x", "Unread" chip, title (click to expand), content (first 220 characters + "..." unless expanded), author avatar and name (or "Organization Leadership"), date (`publishedDate.slice(0,10)`). A pinned card has an amber border; an unread one has a teal border.
- **Data source:** `announcements`, `users`, `currentUserId`.
- **How it is calculated** (`:36-60`): filter by search (title or content), tab (unread = `!readByUserIds.includes(currentUserId)`, important, pinned) and audience. Sort pinned first, then `publishedDate` newest first. **Drafts are shown like published posts** (no draft label, no filter).
- **Empty state:** "No announcements match your filter".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "New Announcement" | Link to `/teams/announcements/new` | — | — | — |
| Search | Title or content | local | No | — |
| Audience dropdown | Options = distinct `audience` values present | local | No | — |
| Pills all / unread / important / pinned | Tab filter | local | No | — |
| Pin icon | `togglePinAnnouncement(id)` (`app-context.tsx:1731`) | `announcements[].isPinned` | Yes | None |
| Eye / check icon | `markAnnouncementRead(id)`: adds `currentUserId` to `readByUserIds` (no-op if already read; there is no "mark unread") | `announcements` | Yes | None |
| Edit (pencil) | Opens CreateAnnouncementDialog in edit mode. **The form opens empty** (mounted with null first; see 12.26) | `updateAnnouncement` | Yes | toast |
| Trash → modal "Delete Notice" | `deleteAnnouncement(id)` | `announcements` | Yes | No activity, no toast |
| Title click / "Read full announcement" button | Expand or collapse | local | No | — |

**Notes:** The expand button text is a JavaScript string containing `&rarr;`, so it renders literally as **"Read full announcement &rarr;"** (`:252`). Audience has no effect on who can see a post; everyone sees every announcement.

---

### 12.11 Post / Edit Announcement dialog

**File:** `src/components/collaboration/create-announcement-dialog.tsx`
**Who can open it:** "Post Announcement" on `/teams`; Edit on the board.

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Title *, Message Content * | Required (trimmed) | local | — | — |
| Target Audience | all / engineering / design / operations / quality / legal | local | — | — |
| Priority | normal / important | local | — | — |
| Publication Date | Default **2026-10-21**. Saved as `<date>T10:00:00Z` | local | — | — |
| Pin checkbox | `isPinned` | local | — | — |
| "Publish Announcement" | `addAnnouncement({... status: 'published', authorId: current user, readByUserIds: [current user]})` (`app-context.tsx:1675`) | `announcements`, `notifications` | Yes | Activity "posted announcement" (lost on refresh). **One notification, to the author themself** (`userId: currentUserId`), body = first 80 characters + "...". Toast. Closes after 700 ms |
| "Save Changes" (edit) | `updateAnnouncement(id, {...})` | `announcements` | Yes | Toast only |
| Cancel / X / backdrop | Close | — | — | — |

**Notes:** No notifications are sent to the audience. "Important" does nothing beyond the badge. State is kept between openings (old success message and values).

---

### 12.12 New announcement page — `/teams/announcements/new`

**File:** `src/app/(workspace)/teams/announcements/new/page.tsx`
**Who can open it:** Any signed-in user ("New Announcement" button on the board).

| Control | What happens when used | Data changed | Saved? | Side effects |
|---|---|---|---|---|
| Title *, Audience, Priority, Publish Date (default 2026-10-21), Pin checkbox, Message * | Same as 12.11 | local | — | — |
| "Save as Draft" | `addAnnouncement({... status: 'draft'})` | `announcements`, `notifications` | Yes | The banner says "**published** successfully" even for a draft. A notification and activity are still created. Redirect to the board after 700 ms. The draft then shows on the board and on Analytics like a normal post |
| "Publish Announcement" | `addAnnouncement({... status: 'published'})` | same | Yes | Same, no toast |
| "Cancel", "Back to Announcements" | Link | — | — | — |

---

### 12.13 Notifications Center — `/teams/notifications`

**File:** `src/app/(workspace)/teams/notifications/page.tsx`
**Who can open it:** Any signed-in user. Not in the sidebar. Opened by "View all notifications" in the header bell (`app-header.tsx:162`).
**Purpose:** The full list of in-app notifications.

**Cards, widgets and lists**

#### Notification list
- **Shows:** type icon, title, unread dot, body, date (`createdAt.slice(0,10)`), type, "mark read" icon, "View" link.
- **Data source:** `useApp().notifications`. **This is ALL notifications for ALL users, not only mine.** The header bell uses `useNotifications()`, which filters to `userId === currentUserId` (`app-context.tsx:2623`). The page can show more items than the bell, including notifications meant for other people (time-off approvals, meeting invites, task assignments).
- **Empty state:** "You are all caught up!"

**Buttons and controls**

| Control | What happens when used | Data changed | Saved? | Side effects |
|---|---|---|---|---|
| "Mark All Read (N)" (if any unread) | `markAllNotificationsRead()`: marks **every user's** notifications read (`app-context.tsx:2552`) | `notifications` | Yes | — |
| "All Notifications (N)" / "Unread Only (N)" | Filter | local | No | — |
| Type dropdown | task / system / approval / document | local | No | — |
| Eye icon | `markNotificationRead(id)` | `notifications` | Yes | — |
| "View" (if link) | Marks read, then navigates to `n.link` | `notifications` | Yes | — |

---

### 12.14 Hidden Teams feature: Teams Directory, Team detail, New/Edit team, Create Team dialog

**Files:** `teams/directory/page.tsx`, `teams/new/page.tsx`, `teams/[teamId]/page.tsx`, `teams/[teamId]/edit/page.tsx`, `components/collaboration/create-team-dialog.tsx`
**Who can open it:** **Nobody while FEATURES.teams is false.** Every one of these routes redirects to `/teams` in its layout. The code is kept for when the flag is turned on. Short description of what it would do:

- **Directory** (`/teams/directory`): team cards or table with Members (`memberIds.length`), Projects (`projectIds.length`) and Tasks (all tasks assigned to any member, any status). Search (name, description, department), Department, Lead and Sort (name, size, projects) filters, grid/list toggle. Edit opens CreateTeamDialog (same empty-form bug as 12.4, because it mounts with `teamToEdit = null`). Delete calls `deleteTeam` (`app-context.tsx:1312`), which removes the team and strips its id from `users[].teamIds`, with no activity.
- **Team detail** (`/teams/[teamId]`): unknown id falls back to `teams[0]`. Tabs: Overview (goals; completion % = done / all member tasks; in progress; connected projects = `team.projectIds` or `project.teamIds`; members; 4 recent events), Members, Projects, Workload (`points / capacity`, capped at 100%, >85 rose, >65 amber), Activity (activities by members or about this team). Buttons: Edit Team (dialog), Archive toggle (`updateTeam` status active/archived, activity "updated team information"), Delete (modal, then `deleteTeam`, then push to `/teams/directory`, which itself redirects).
- **New team page** (`/teams/new`): name (required, unique), department, mission, lead, colour, members, projects, goals. Calls `addTeam` (`app-context.tsx:1262`), which forces the lead into the members and adds an activity "created a team". Toast, then redirect.
- **Edit team page** (`/teams/[teamId]/edit`): name, department, description, lead, colour, goals. Members, projects and status are kept but have no inputs. Calls `updateTeam`, then redirect.
- **CreateTeamDialog**: same fields as the new team page plus an Active/Archived radio. The lead is always added to `memberIds`.

All of these write `teams` (saved). Their activity entries are not saved.

---

### 12.15 `/teams/settings`

**File:** `src/app/(workspace)/teams/settings/page.tsx`. A server redirect to `/settings/preferences` (old URL). Nothing renders.

---

### 12.16 Planning layout and redirect routes

**File:** `src/app/(workspace)/planner/layout.tsx` (+ `components/shared/section-tabs.tsx`)
**Who can open it:** Any signed-in user. Sidebar Workspace → "Planning" (goes to `/planner/calendar`, active for any `/planner*` path).

- **Tab bar:** Calendar (`/planner/calendar`), Meetings (`/planner/meetings`), Availability & Time Off (`/planner/availability`). These are plain links. The bar is hidden on pages that are not one of the tabs (for example `/planner/meetings/new`).
- **Redirect-only routes (nothing renders):**
  - `/planner` → `/planner/calendar` (`planner/page.tsx:5`)
  - `/planner/milestones` and `/planner/milestones/new` → `/planner/calendar?category=milestone`
  - `/planner/time-off` and `/planner/time-off/new` → `/planner/availability`

---

### 12.17 Calendar — `/planner/calendar` (`?category=…`)

**File:** `src/app/(workspace)/planner/calendar/page.tsx` (+ `create-calendar-event-dialog.tsx`, `create-meeting-dialog.tsx`, `meeting-detail-drawer.tsx`)
**Who can open it:** Any signed-in user. No permission checks.
**Purpose:** Month, week, day and agenda views of calendar events.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Calendar events | `useApp().calendarEvents` (seed `MOCK_CALENDAR_EVENTS`, 16 events, `mock-collaboration.ts:20`) | **the ONLY source drawn on the calendar** |
| Meetings | `useApp().meetings` | used only to decide whether a clicked event opens the meeting drawer |
| Users, teams, projects | `useApp()` | agenda labels |
| `?category=` | URL | preselects the category filter if it is one of meeting, task_deadline, milestone, time_off, team_event |
| "Today" | hard-coded `new Date('2026-10-21')` (`:27`, `:58`, `:82`, `:103`) | |

**Calendar event aggregation: which collections feed the calendar**
- The calendar draws `calendarEvents` only. It does **not** read `milestones`, `tasks` (due dates), `meetings` or `timeOffRequests` directly.
- Records reach `calendarEvents` in these ways:
  - **Meetings:** `addMeeting` creates `evt-meet-<meetingId>` (category `meeting`). `updateMeeting` syncs title, description, times, attendees and link. `cancelMeeting` adds "[CANCELLED] " to the title. `deleteMeeting` removes it (`app-context.tsx:1563-1673`). The 10 seed meetings (`mtg-1…10`) have **no** linked events. Seed events `evt-1, 2, 3, 5, 7, 10, 14` are separate copies with different ids. So seed meetings appear on the calendar only through those copies, and clicking them opens the Edit Event dialog, not the meeting drawer.
  - **Time off:** `approveTimeOffRequest` creates `evt-to-<requestId>` (category `time_off`, all-day, `start T00:00:00Z` → `end T23:59:59Z`). `deleteTimeOffRequest` removes it. Seed approved leave is shown by the separate seed events `evt-6`, `evt-11`, `evt-15`. Deleting seed request `to-1` does not remove `evt-6`.
  - **Milestones and task deadlines:** only the seed events (`evt-4`, `evt-8` milestone; `evt-9`, `evt-13` task_deadline) and events created by hand. Creating a milestone or setting a task due date does not add anything here.
  - **Manual events:** "Create Event" (12.18).
- Day placement: an event appears on the day where `evt.startDate.startsWith(<cell ISO date>)`. **Multi-day events (for example a 4-day leave) show only on their first day.**

**Cards, widgets and lists**

#### Month grid (default view)
- 35 cells (5 weeks, Monday first) starting from the Monday on or before the 1st of the month (`:62-85`). **Months that need 6 rows lose their last days** (for example, a 31-day month starting on a Saturday or Sunday).
- Each cell shows up to 3 events (coloured by category) and "+N" when there are more than 2 (the label counts from 2 while 3 are shown).
- Each cell's ISO date is made with `toISOString()` on a local-midnight date. **In time zones ahead of UTC (for example Sri Lanka, UTC+5:30) every cell is labelled one day early**: events are drawn one day before their real date, and the "today" highlight lands on 22 Oct. Unclear: exact behaviour depends on the browser time zone.
- **Empty state:** empty cells.

#### Week view
- 7 columns Mon–Sun around `currentDate`. Event cards show title, `HH:MM` (from `startDate.slice(11,16)`, not converted to local time) for timed events, and category.

#### Day view
- "Schedule for <date>", "N scheduled events", and cards with title, category, description (or "No description provided"), location, time range or "All Day". It filters by `currentDate.toISOString()` date (time-zone dependent like above).

#### Agenda view
- All filtered events in array order (newest added first, **not sorted by date**): MM/DD and time box, title, category chip, description, project name (squad hidden), and a delete icon.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Schedule Meeting" | Opens Schedule Meeting dialog (12.20) | — | — | — |
| "Create Event" | Opens the event dialog in create mode | — | — | — |
| Prev / Next arrows | Month ±1, week ±7 days, day/agenda ±1 day | local | No | — |
| "Today" | Jumps to the fixed date 2026-10-21 (not the real today) | local | No | — |
| Category dropdown | All / Meetings / Deadlines / Milestones / Time Off / Team Events. **No option for "planning_reminder"** (evt-16 shows only under All) | local | No | — |
| Squad dropdown | Hidden (FEATURES.teams) | — | — | — |
| Member filter | State exists (`memberFilter`) but **there is no control**. Always "all" | — | — | — |
| month / week / day / agenda buttons | Switch view. Always starts on "month"; `collaborationSettings.defaultCalendarView` and `weekStartDay` are ignored | local | No | — |
| Click on an event | If `meetings` has an id equal to the event id with "evt-meet-" removed, or equal to the event id, opens the Meeting drawer (12.21). Otherwise opens the event dialog in **edit mode**. **That form is empty or stale**, because the dialog first mounted with `eventToEdit = null` (12.26) | — | — | — |
| Agenda delete icon | `deleteCalendarEvent(id)` immediately, **no confirmation** (`app-context.tsx:1427`). Deleting a meeting's event leaves the meeting itself in `meetings` | `calendarEvents` | Yes | No toast, no activity |

---

### 12.18 Create / Edit Calendar Event dialog

**File:** `src/components/collaboration/create-calendar-event-dialog.tsx`
**Who can open it:** "Create Event" or a click on a non-meeting event on the Calendar.

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Event Title * | Required | local | — | — |
| Category (6 buttons) | meeting, task_deadline, milestone, team_event, planning_reminder, time_off | local | — | — |
| All-Day checkbox | Switches the inputs to date-only. Skips the end-after-start check | local | — | — |
| Start / End (datetime-local or date) | Default `2026-10-21T10:00` → `T11:00`. Stored as typed (local text, no "Z") | local | — | — |
| Related Team | Hidden | — | — | — |
| Related Project | Optional | local | — | — |
| Attendees chips (all users) | Default: current user | local | — | — |
| Location, Demo Video Link, Description | Optional text | local | — | — |
| "Create Event" | Title required. If not all-day, end must be after start. `addCalendarEvent` (`app-context.tsx:1402`): id `evt-<time>`, organizer = current user, added to the front | `calendarEvents` | Yes | Toast, success message, closes after 700 ms. No activity, no notifications to attendees |
| "Save Changes" (edit) | `updateCalendarEvent(id, {...all fields})` | `calendarEvents` | Yes | Toast. With the stale-form bug this overwrites the event with the default values |
| Cancel / X / backdrop | Close | — | — | — |

**Notes:** The organizer cannot be changed (no input). Creating an event of category "meeting" does **not** create a Meeting record. Creating "time_off" does not create a time-off request.

---

### 12.19 Meetings — `/planner/meetings`

**File:** `src/app/(workspace)/planner/meetings/page.tsx`
**Who can open it:** Any signed-in user (Planning → Meetings tab).
**Purpose:** List, search and open meetings.

**Data this screen reads:** `meetings`, `users`, `teams`, `projects`. "Today" = `new Date().toISOString().split('T')[0]` (**real UTC date**, `:52`). Seed meetings are dated 19–28 Oct 2026, so with the real date after those days every seed meeting counts as "past", while its badge still says "Upcoming" (the status is never updated automatically).

**Cards, widgets and lists**

#### Metric tiles
- **All Sessions** = `meetings.length` (incl. cancelled).
- **Today's Sessions** = `date === today` and not cancelled.
- **Upcoming** = `date >= today` and not cancelled.
- **Past / Completed** = `date < today` or `status === 'completed'` (`:86-92`).

#### Tabs (Upcoming default / Today's Meetings / Past Sessions / All) with counts
- Filter rules (`:55-83`): today = `date === today` (includes cancelled, unlike the tile); upcoming = not (`date < today` or completed), so **cancelled future meetings are listed** although the count excludes them; past = `date < today` or completed. Squad filter hidden. Search on title, description or organizer name. Sort by `new Date("date startTime")`: past newest first, others oldest first.

#### Meeting cards
- Status badge, "date • start - end", duration, project chip, title, description (1 line), "Agenda: a • b • c", up to 4 participant avatars + "+N", "Link" copy button, "View Details".
- **Empty state:** "No meetings found … Schedule Meeting Now".

**Buttons and controls**

| Control | What happens when used | Data changed | Saved? | Side effects |
|---|---|---|---|---|
| "Planning" breadcrumb | `/planner/calendar` | — | — | — |
| "Full Scheduler Page" | `/planner/meetings/new` | — | — | — |
| "Schedule Meeting" / "Schedule Meeting Now" | Opens Schedule Meeting dialog | — | — | — |
| Tabs | Filter | local | No | — |
| Squad dropdown | Hidden | — | — | — |
| Search | Filter | local | No | — |
| Card click / "View Details" | Opens Meeting drawer (12.21), **without an Edit button** (no `onEdit` passed) | — | — | — |
| "Link" | `navigator.clipboard.writeText(meetingLink)` | — | — | Local toast "Mock meeting link copied to clipboard!" |

**Notes:** `deleteMeeting` and `cancelMeeting` are loaded but not used on this page. There is **no way to delete or edit a meeting** in the UI. Cancel is available only in the drawer.

---

### 12.20 Schedule Meeting dialog

**File:** `src/components/collaboration/create-meeting-dialog.tsx`
**Who can open it:** "Schedule Meeting" on `/teams`, `/planner/calendar`, `/planner/meetings`. The edit mode exists but is **never opened** (nobody passes `meetingToEdit`).

**Cards, widgets and lists**

#### Participant Conflict Warning (amber box)
- **How it is calculated** (`:57-88`): same-day meetings that are not cancelled (and not the edited one). Overlap if `max(start1, start2) < min(end1, end2)`, with minutes from `parseMinutes`, which **strips everything except digits and ":"**. So "01:00 PM" becomes 60 minutes (1 AM). Seed meetings use "hh:mm AM/PM", while this dialog uses 24-hour "HH:MM". **Afternoon seed meetings are compared as morning times**, so real clashes are missed and false ones can appear. For each overlapping meeting, every selected participant who is in its `participantIds` is listed. The organizer is not checked unless also selected, and the other meeting's organizer is not checked.

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Meeting Title * | Required | local | — | — |
| Date | Default **2026-10-21** | local | — | — |
| Start / End time | Default 10:00 / 10:45. End must be after start | local | — | — |
| Related Team | Hidden | — | — | — |
| Related Project | Optional | local | — | — |
| Location / Room | Default "Meeting Room Alpha" | local | — | — |
| Demo Video Link | Default `https://meet.flashsign.demo/sync-<last 4 digits of time>` (fake domain) | local | — | — |
| Participants chips | Default: current user. Organizer = current user (no organizer input) | local | — | — |
| Agenda list: trash icon, text box + Enter / "Add" | Remove or add agenda items. Defaults: 3 sample items | local | — | — |
| "Ignore & Allow Conflict" / "Proceed anyway despite conflicts" | Sets `ignoredWarning = true` | local | — | — |
| "Schedule Meeting" (submit) | Validates title and end > start. If conflicts exist and are not ignored, shows an error. `durationMinutes = max(15, end − start)`. Participants = organizer + selected. `addMeeting` (`app-context.tsx:1563`) | `meetings`, `calendarEvents` (+`evt-meet-<id>`), `notifications` | Yes | One notification per participant except the current user ("Invited to: …", link `/planner/meetings`). Activity "scheduled a meeting" (lost on refresh). Toast. Closes after 700 ms |
| Cancel / X / backdrop | Close | — | — | — |

**Notes:** Values and the success message stay when the dialog is reopened (12.26). No email or calendar invite is sent. The video link is fake.

---

### 12.21 Meeting detail drawer

**File:** `src/components/collaboration/meeting-detail-drawer.tsx`
**Who can open it:** Clicking a meeting on `/planner/meetings`, or a meeting-linked event on the calendar.

**Cards, widgets and lists**
- **Date / time / status:** `date`, "start – end (N min)", status badge.
- **Virtual Room / Location:** location (or "FlashSign Conference Room A"), meeting link with "Copy Demo Link".
- **Description** (if any), **Related Project** (or "Workspace Level"); Team hidden.
- **Meeting Agenda:** numbered items.
- **Participants (N):** users whose id is in `participantIds`, with "(Host)" for the organizer, title or department, and availability badge. "Organizer: name".

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Copy Demo Link" | Copies the link. Shows "Copied" for 2 s | — | — | — |
| "Cancel Meeting" (if not cancelled) | **No confirmation.** `cancelMeeting(id)` (`app-context.tsx:1653`): status becomes `cancelled`, the linked calendar event title gets "[CANCELLED] " | `meetings`, `calendarEvents` | Yes | Activity "cancelled meeting" (lost on refresh). Banner "Meeting has been cancelled and attendees notified." **No one is notified** (no notification is created). The drawer closes after 800 ms |
| "Edit" | Shown only if an `onEdit` prop is passed. **No page passes it**, so it never appears | — | — | — |
| "Close", X, backdrop | Close | — | — | — |

**Notes:** The drawer receives the meeting object at click time, so it does not update live. The `cancelled` banner state is not reset: after cancelling one meeting, opening another in the same page visit shows the "has been cancelled" banner again (state kept between openings).

---

### 12.22 Full scheduler page — `/planner/meetings/new`

**File:** `src/app/(workspace)/planner/meetings/new/page.tsx`
**Who can open it:** Any signed-in user ("Full Scheduler Page" on Meetings). No tab bar.
**Purpose:** Full-page version of Schedule Meeting.

**Cards, widgets and lists**

#### Participant Schedule Conflict (amber)
- **How it is calculated** (`:51-70`): for each selected participant, the first same-day, non-cancelled meeting where they are organizer or participant **and `startTime` is exactly the same text**. No overlap logic. The page offers "Proceed anyway", but there is no block: submit works even with conflicts.

**Buttons and controls**

| Control | What happens when used | Data changed | Saved? | Side effects |
|---|---|---|---|---|
| Title * | Required | local | — | — |
| Description | Optional | local | — | — |
| Date * | Default = **tomorrow** (real date, UTC) | local | — | — |
| Start Time dropdown | 14 fixed slots "09:00 AM" … "04:30 PM" | local | — | — |
| Duration dropdown | 15 / 30 / 45 / 60 / 90 min | local | — | — |
| (End time) | **No input, never recalculated**: always "10:45 AM" (`:35`). A 2 PM meeting is saved as "02:00 PM - 10:45 AM" | — | — | — |
| Session Organizer * | All users. Default `users[0]` (not the current user) | local | — | — |
| "Select All Members" / "Clear All" | Selects all users, or resets to just the organizer | local | — | — |
| Participant chips | Toggle. Default `users[0]` and `users[1]`. At least 1 required. The organizer is **not** added automatically | local | — | — |
| Related Squad | Hidden | — | — | — |
| Related Project | Optional | local | — | — |
| Conferencing Link (Demo), Location | Defaults `https://meet.flashsign.demo/sprint-sync`, "Virtual Room #1" | local | — | — |
| Agenda (one per line) | Split by line | local | — | — |
| "Schedule & Sync Calendar" | `addMeeting({...})`, same effects as 12.20. The calendar event `startDate` becomes `"<date>T10:00 AM:00Z"` (not a valid date-time; it still matches the day because the calendar compares the text prefix) | `meetings`, `calendarEvents`, `notifications` | Yes | "Meeting Scheduled!" panel, redirect to `/planner/meetings` after 1.2 s. No toast |
| "Cancel", "Back to Meeting Planner" | Link | — | — | — |

---

### 12.23 Availability & Time Off — `/planner/availability`

**File:** `src/app/(workspace)/planner/availability/page.tsx` (+ `src/components/planner/availability-board.tsx`, `src/components/planner/time-off-requests.tsx`, `create-time-off-dialog.tsx`)
**Who can open it:** Any signed-in user (Planning tab). **Approve, Decline, Delete and status changes have no permission check.** Any role can approve anyone's leave, including their own.
**Purpose:** Weekly availability grid, member status, and the time-off request list.

**Data this screen reads**

| Data | Where it comes from | Notes |
|---|---|---|
| Users | `users` | availability field |
| Approved time off | `timeOffRequests` | |
| Meetings | `meetings` | |
| Calendar events | `calendarEvents` | read by the board but **not used** in the grid cells |
| Week | real current date (`new Date()`) | unlike the Calendar, which is fixed on 2026-10-21 |

**Cards, widgets and lists**

#### Header and banner
- "N pending" badge = requests with status `pending`. The banner says "Approving a request marks the member Out of Office and adds the leave to the team calendar." **Only the second half is true.** `approveTimeOffRequest` does not change `availability` (`app-context.tsx:1480-1522`).

#### Status tiles: Available / Busy / Focus Time / Out of Office (`availability-board.tsx:88-94`)
- Counts of all users by `availability` (missing counts as available). They **ignore** search and filters. The captions ("Ready for tasks…", "In scheduled sessions", "Deep work block", "Approved leave or travel") are fixed text.

#### Availability grid (`availability-board.tsx:303-452`)
- **Columns:** Team Member, "Status & Working Hours", one column per day, Actions.
- **Days:** Week View = Mon–Fri of the current real week + `offset × 7` days. **Day View shows only the Monday of that week, not today** (`:50`). Each column date comes from `toISOString()` of a date carrying the current time (can be one day off near midnight in UTC+ zones). "Today" column highlighted.
- **Rows:** users filtered by squad (hidden), status (tile click), and search (name, **role id** such as "developer", or email).
- **"Status & Working Hours" cell:** availability badge, then the **hard-coded** text "09:00 - 17:00" and "EST (UTC-5)" for everyone. The real `workingHours` and `timeZone` are ignored (`:369-376`).
- **Day cell formula** (`:97-120`, `:381-422`), checked in this order:
  1. An **approved** time-off request where `startDate ≤ day ≤ endDate` gives a rose box "Leave: <type>", "<durationDays>d approved".
  2. Otherwise, meetings on that date, not cancelled, where the member is organizer or participant, give an amber box with the first meeting title, "<start> (<count> mtr)" and "+N more session".
  3. Otherwise, if the member's **current** status is `focus_time`, every free day shows "Focus Block (4h)" (fixed text).
  4. Otherwise "8h Free" (fixed text). This is shown even for a person whose status is Out of Office or Busy.
- **Empty state:** "No team members found matching your search and filter criteria."

#### Member detail modal ("Details")
- Avatar, name, role id, email.
- "Update Availability Status" (4 buttons).
- "Working Hours 09:00 AM - 05:00 PM, Timezone: UTC-5 (EST)" (**hard-coded**).
- "Weekly Commitment `weeklyCapacity || 40` Hours", "Full-time Core Squad" (**hard-coded**).
- "Upcoming Approved Leaves": approved requests for the member, first 3, **including past ones** (no date filter). Empty: "No upcoming scheduled leave requests."

#### Time-Off Requests table (`time-off-requests.tsx`)
- Tabs with counts: All / Pending / Approved / Declined.
- Columns: member (avatar, name link, role id), leave-type badge, "start → end" (+ "Partial Day"), duration "N day(s)", status badge, reason (or notes, or "No notes provided"), actions.
- Sorted by `createdAt`, newest first. Search on member name, reason or leave type. Leave-type filter.
- **Empty state:** "No time-off requests found in this category."

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| "Request Time Off" | Opens dialog (12.24) | — | — | — |
| Status tiles (4) | Toggle the status filter on the grid | local | No | — |
| Search (board) | Name, role id, email | local | No | — |
| "Day View" / "Week View" | 1 column (Monday) or 5 columns | local | No | — |
| ‹ / "This Week" (or "+Nw") / › | Week offset −1 / reset / +1. In Day View the arrows still jump a whole week | local | No | — |
| Squad chips | Hidden | — | — | — |
| "Clear status filter (x)" | Resets the status filter | local | No | — |
| Member name link | `/teams/members/[id]` | — | — | — |
| "Details" | Opens member modal | — | — | — |
| Modal status buttons (4) | `updateMemberAvailability(id, status)` | `users` | Yes | Activity (lost on refresh). No toast |
| Modal "View Full Profile" | Member profile | — | — | — |
| Modal "Done" / ✕ | Close | — | — | — |
| Request tabs, search, leave-type dropdown | Filters | local | No | — |
| "Approve" (pending only) | `approveTimeOffRequest(id)` (`app-context.tsx:1480`): status `approved`; adds calendar event `evt-to-<id>` ("<Name> - <TYPE> Leave", all-day, start to end); notification to the **member** "Time-Off Request Approved"; activity | `timeOffRequests`, `calendarEvents`, `notifications` | Yes (activity: no) | Local toast "Approved leave request for …". Does **not** set the member Out of Office |
| "Decline" (pending only) | `declineTimeOffRequest(id)` (`:1524`): status `declined`; notification to the member; activity | `timeOffRequests`, `notifications` | Yes (activity: no) | Local toast |
| Trash (any status) | Browser `confirm('Cancel and delete this time-off request?')`, then `deleteTimeOffRequest(id)` (`:1556`), which removes the request and its `evt-to-<id>` event | `timeOffRequests`, `calendarEvents` | Yes | Local toast "Time-off entry deleted.". No activity, no notification |

**Notes:** There is no Edit for requests in the UI (`updateTimeOffRequest` is never called). An approved request cannot be "un-approved", only deleted.

---

### 12.24 Request Time Off dialog

**File:** `src/components/collaboration/create-time-off-dialog.tsx`
**Who can open it:** "Request Time Off" on `/planner/availability`.

**Cards, widgets and lists**
- **Estimated Duration** (`:50-69`): if Half-Day is ticked, **0.5** (whatever the date range). Otherwise count the days from start to end that are not Saturday or Sunday (`getDay` on `new Date('YYYY-MM-DD')`, which is parsed as UTC; Unclear: could shift by a day in time zones west of UTC). The result is at least 1, so a weekend-only range counts as 1. End before start gives 0.
- **Overlap warning** (`:72-91`): another request of the same member, not declined, whose range touches this one. It shows "Warning: Member already has <status> <type> from … to …". **It does not block submit.**

**Buttons and controls**

| Control | What happens when used | Data changed (store action) | Saved after refresh? | Side effects |
|---|---|---|---|---|
| Team Member dropdown | All users. Default = current user. **Anyone can file leave for anyone** | local | — | — |
| Leave Type (6 buttons) | vacation / sick / personal / parental / unpaid / other | local | — | — |
| Start / End date | Defaults **2026-10-26 → 2026-10-30** (fixed) | local | — | — |
| Half-Day / Partial Absence checkbox | Sets duration to 0.5 | local | — | — |
| Reason / Note | Saved as `reason`. (There is a `notes` field in state but **no input** for it) | local | — | — |
| "Submit Request" | Requires both dates and end ≥ start. `addTimeOffRequest({... status: 'pending'})` (`app-context.tsx:1433`) | `timeOffRequests`, `notifications` | Yes | Activity "submitted a time-off request" (lost on refresh). **Notification "New Time-Off Request" goes to the current user (the requester), not to a manager.** Toast. Closes after 700 ms |
| "Save Changes" (edit mode) | Never reachable (no page passes `requestToEdit`) | — | — | — |
| Cancel / X / backdrop | Close | — | — | — |

---

### 12.25 Not used anywhere: Create Milestone dialog

**File:** `src/components/collaboration/create-milestone-dialog.tsx`. **Not imported by any page** (dead code). It would call `addMilestone` or `updateMilestone` with `progress = round(done linked tasks / linked tasks × 100)` (or 100 if status is completed and no tasks are linked). Planning milestone routes now redirect to the calendar (12.16).

---

### 12.26 Formula reference and shared behaviour

**Capacity and workload (four different formulas in this area)**
| Screen | Hours per open task | Capacity | Percent | Bands |
|---|---|---|---|---|
| Analytics "Workload vs capacity" + "At capacity" KPI (`teams/page.tsx:45-54`) | `storyPoints \|\| points \|\| 3` | `weeklyCapacity \|\| 40` | `round(load/cap×100)`, not capped | ≥85 at capacity (rose), ≥70 amber, else green |
| Workload page (`teams/workload/page.tsx:47-65`) | same × (month ? 2 : 1), optional project filter | `(weeklyCapacity \|\| baseline 35/40/45) × (month ? 4 : 1)` | `round(hours/cap×100)` | <55 available, ≤85 balanced, ≤100 high, >100 overloaded |
| Member profile (`members/[memberId]/page.tsx:57-59`) | same | `weeklyCapacity \|\| 40` | `min(100, round(...))` | >85 "High Workload" rose, >65 amber |
| Team detail (hidden) (`teams/[teamId]/page.tsx:421-425`) | same | `weeklyCapacity \|\| 40` | `min(100, round(...))` | >85 rose, >65 amber |

"Open task" means `assigneeId === user.id && status !== 'done'`. Subtasks are included, so a parent and its subtasks are both counted.

**Task status by member:** count of every task assigned to the user per status (todo, in_progress, review, blocked, done). Users with 0 are hidden. Sorted by total (`team-charts.tsx:141-155`).

**Meeting hours:** Σ `durationMinutes` / 60 (1 decimal) of non-cancelled meetings dated 2026-10-19…25 where the user is organizer or participant (`team-charts.tsx:240-251`).

**Timesheet and time tracking totals:** minutes per session = `max(0, round((endedAt ?? now) − startedAt) / 60000)`. Window = the last 5 weekdays ending today (real clock). Grouped per task (my view) or per user (team view) and per weekday column. Day totals and the grand total are simple sums. Time tracking on Analytics uses the same window but does not split by day (`time-tracking.tsx:19-39`, `timesheet/page.tsx:32-61`).

**Availability grid cell:** approved leave covering the day → else non-cancelled meetings that day where the member is organizer or participant → else "Focus Block (4h)" if the current status is focus_time → else "8h Free" (`availability-board.tsx:97-120`, `:381-422`).

**Time-off duration:** weekdays between start and end inclusive, at least 1; 0.5 if partial (`create-time-off-dialog.tsx:50-69`).

**Meeting duration:** `max(15, endMinutes − startMinutes)` in the dialog. Chosen from the dropdown on the full page.

**Dialogs keep their state.** CreateMemberDialog, CreateTeamDialog, CreateMeetingDialog, CreateAnnouncementDialog, CreateCalendarEventDialog, CreateTimeOffDialog and MeetingDetailDrawer all call their `useState` hooks before `if (!open) return null`. The pages render them all the time (no `key`). So:
- the form values come from the **first** render only;
- edit dialogs opened later for a different record show empty or old values (Members Edit, Announcement Edit, Calendar event Edit);
- after a successful save, reopening shows the old values and the old green success message.

---

### 12.Z Data flow summary for this area

- **Reads (AppContext):** `users`, `teams`, `tasks`, `projects`, `milestones`, `meetings`, `calendarEvents`, `timeOffRequests`, `announcements`, `activities`, `notifications`, `workSessions`, `demoRole`, `currentUserId`. Mock constant `WEEKLY_TASK_FLOW` (`mock-analytics.ts`). `collaborationSettings` is **not read** by any screen in this area (its calendar view, week start and workload threshold settings have no effect here).
- **Reads (DemoAuthContext):** `invitations`, `selectedWorkspace`, `currentUser`.
- **Writes (saved to localStorage):** `users` (add, update, delete member, availability), `teams` (add/update/delete team, member add/delete side effects; team screens hidden), `tasks` (Assign Task, reassign), `projects` (progress after Assign Task), `meetings`, `calendarEvents`, `timeOffRequests`, `announcements`, `notifications`, `workSessions`; `invitations` (`flashsign_demo_invitations`).
- **Writes that are NOT saved:** `activities` and `auditLogs` entries created by addTeam, updateTeam, addMember, updateMemberAvailability, addTimeOffRequest, approve/decline time off, addMeeting, cancelMeeting, addAnnouncement and reassignTask. They are lost on refresh.
- **Store actions used:** `addMember`, `updateMember`, `deleteMember`, `updateMemberAvailability`, `addTask`, `reassignTask`, `addCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent`, `addTimeOffRequest`, `approveTimeOffRequest`, `declineTimeOffRequest`, `deleteTimeOffRequest`, `addMeeting`, `cancelMeeting`, `addAnnouncement`, `updateAnnouncement`, `markAnnouncementRead`, `togglePinAnnouncement`, `deleteAnnouncement`, `markNotificationRead`, `markAllNotificationsRead`, `logManualTime`, `updateWorkSession`; hidden screens only: `addTeam`, `updateTeam`, `deleteTeam`; DemoAuth: `sendInvitation`, `resendInvitation`, `revokeInvitation`.
- **Defined but unreachable from the UI:** `updateMeeting`, `deleteMeeting`, `updateTimeOffRequest`; `addMilestone`/`updateMilestone` via the unused milestone dialog. `updateCollaborationSettings` is used only by the Settings pages (another section).

---

## 13. Findings register: what is real, simulated, missing or broken

This register collects the most important findings from §3–§12. Each row links to the section with the details and code references. **Type:** *Simulated* = looks real but is fake; *Gap* = missing behaviour; *Persistence* = lost on refresh; *Security* = would be unsafe if shipped as-is; *Bug* = wrong result; *Hard-coded* = fixed numbers or text shown as if live.

### 13.1 Platform-wide
| ID | Type | Finding | See |
|---|---|---|---|
| F-01 | Gap | There is no backend: no API, database, email, AI, PDF engine or MCP server. Everything lives in one browser's localStorage. Two browsers (or two people) never see each other's changes. | §2.1 |
| F-02 | Persistence | Signature requests, document items, folders, templates, contracts and all activity/audit logs are **not saved**, so they reset on every refresh. New records then show "not found" at their own URL. | §2.3, §10, §11 |
| F-03 | Security | Role checks only hide buttons; nothing enforces them. Many write actions (tasks, project settings General/Danger Zone, Quick Create, signing defaults) have no role check at all. `canCreateTask` is never used. | §2.7, §6.11, §7 |
| F-04 | Bug | The sidebar ignores each role's navigation groups and shows the same links to everyone. | §3.5 |
| F-05 | Gap | The default demo account is `org_admin` (labelled "Owner / CEO") with id `user-demo`, which owns no seed tasks, notifications, approvals or signature requests. Many "My …" views are therefore empty for it. | §2.2, §4.1 |
| F-06 | Bug | If saved projects, tasks or milestones are an empty list, the seed data comes back on refresh. | §2.3 |
| F-07 | Gap | Activity feeds (project Activity tab, Overview "Recent Activity", /activity, Teams activity) are mostly empty or seed-only, because most actions write no log and logs are not saved. | §5.11, §6.9, §12.9 |

### 13.2 Sign-in, accounts and settings
| ID | Type | Finding | See |
|---|---|---|---|
| F-10 | Security | Login accepts the stored password **or** the universal passwords `Demo123!` / `DemoPassword2026!` for any account. Passwords are stored in plain text in localStorage. | §4.1, §4.2 |
| F-11 | Simulated | Forgot password, reset password, Security › change password and Settings › Users "Send Invitation" change nothing. | §4.5, §4.6, §4.19, §4.20 |
| F-12 | Security | Invitation tokens are plain base64url JSON, not encrypted or signed: anyone can edit the role or expiry. Revoking only works in the inviting browser. | §4.7, §12.3 |
| F-13 | Gap | Most Preferences and Notifications settings are saved but nothing reads them (theme, calendar start day, working hours, workload limit, notification switches). | §4.17, §4.18 |
| F-14 | Bug | Profile name, title and department edits are overwritten by the sign-in account's values on refresh. | §4.15 |
| F-15 | Gap | Old onboarding pages (`/workspace`, `/workspace/new`, `/onboarding/profile|preferences|complete`, `/prototype-home`) are reachable by URL without signing in. Switching workspace changes only the displayed name; all workspaces share the same data. | §4.8–4.13 |
| F-16 | Gap | Reset Demo (sidebar, prototype home) wipes all app data with no confirmation. | §3.5, §4.13 |

### 13.3 Shell and navigation
| ID | Type | Finding | See |
|---|---|---|---|
| F-20 | Bug | Ctrl/⌘+K is advertised but does nothing (the handler is empty). Clicking a person in search results does nothing. | §3.6 |
| F-21 | Bug | The notification bell shows only the current user's notifications (empty for `user-demo`), but "Mark all read" marks **every** user's notifications. Notification rows cannot be clicked. | §3.4 |
| F-22 | Bug | Quick Create: no permission check; milestone and sprint go to the project chosen on the Task tab; task keys are random and can repeat; no sprint picker. | §3.7 |
| F-23 | Bug | Some breadcrumb links go to routes that don't exist (`/tasks`, `/signatures/sign`, `/ai-agents/runs`). | §3.3 |

### 13.4 Projects, plan and schedule
| ID | Type | Finding | See |
|---|---|---|---|
| F-30 | Bug | Seed project progress % is typed in, not calculated; it changes only when a task in the project changes. Health uses live progress, so the bar and the health badge can disagree. | §5.1 |
| F-31 | Gap | Health is never set to "Off Track" automatically: only On Track / At Risk / Delayed. A project's `endDate` is overwritten with the forecast end. | §5.1 |
| F-32 | Gap | Archiving sets a flag that nothing reads: archived projects are not hidden and not read-only. | §5.5, §6.11 |
| F-33 | Bug | New-project wizard: the key auto-fills one letter (fails the 2–6 character check); no unique-key check; the template and visibility choices are stored only as tags. | §5.13 |
| F-34 | Bug | Overview phase % uses `milestone.taskIds`, which is empty, so it shows 0%. The Overall Progress tile uses the stored value. | §6.3 |
| F-35 | Gap | `deleteProject` leaves epics, stories, files, timers and status changes behind. Several deletes have no confirmation (sprints, team removal, subtasks, files). | §6.11, §7.7, §8.1 |
| F-36 | Bug | Starting a sprint doesn't end the active one; the second active sprint disappears from the page. | §6.6 |
| F-37 | Gap | Schedule (Gantt) is read-only; dates cannot be dragged. | §6.5 |
| F-38 | Bug | Planner and My Tasks "Due today" compare date text exactly, so seed items with full timestamps never match. Roadmap ignores the year. | §5.8–5.10 |
| F-39 | Gap | Favorites, Recent, Roadmap, Planner and `/tasks/[taskId]` pages are not linked from anywhere. | §5.6–5.12 |

### 13.5 Boards, tasks and time tracking
| ID | Type | Finding | See |
|---|---|---|---|
| F-40 | Gap | There are **no Start/Pause timer buttons**. Timers start and stop only when a card's status changes. | §7.Y |
| F-41 | Bug | The timer belongs to the task's **assignee**, not the person moving the card. A timer started for someone else gets no activity and idle-stops at 0 minutes. | §7.Y |
| F-42 | Gap | Timer gaps: creating a task already in In Progress starts no timer; reassigning leaves the old person's timer running; finishing a parent leaves subtask timers running; deleting a task leaves its sessions. | §7.Y |
| F-43 | Gap | There is no "Backlog" status (only todo / in_progress / review / done / blocked). Any status can move to any other. The only guard is the "subtasks still open" prompt when moving to Done. | §7.Y |
| F-44 | Bug | Manual time always starts at 09:00, with no overlap check. | §7.8 |
| F-45 | Bug | Clearing the Day Cutoff time on AI Agent Hub › Organisation makes the cutoff `NaN`. This will likely crash the auto-stop check every minute while a timer is open, and the empty value is saved. (Not reproduced in a browser.) | §9.6, §9.10 |
| F-46 | Bug | The day cutoff uses the browser's time zone for everyone, though the page says "each person's own time zone". | §9.6 |
| F-47 | Hard-coded | Board quick-add always sets label "Feature" and 2 points; the drawer's Files tab is a fixed "Sample Spec" list. | §7.1, §7.7 |

### 13.6 Files, SRS and reports
| ID | Type | Finding | See |
|---|---|---|---|
| F-50 | Simulated | File upload keeps no file. Only a typed name, format, category and size are saved ("Attach Mock File"). | §8.2 |
| F-51 | Simulated | "Analyze SRS" ignores the file and always returns the same 6 built-in e-signature tasks, after a ~1.5 s fake progress bar. | §8.5 |
| F-52 | Bug | SRS-created task keys can clash (based on the count of all tasks); re-analysing adds duplicates and overwrites the history; the history search never filters. | §8.6, §8.7 |
| F-53 | Hard-coded | `/reports` charts are constants; three links on it lead to 404 pages; the sidebar "Reports" goes to Agreement Reports instead. | §8.12 |
| F-54 | Bug | Report formula inconsistencies: "work done" counts only Done but "finished" includes Review; forecast end uses the stored value; Timeline CSV breaks on `#`; Task-time CSV always exports grouped rows. | §8.8–8.15 |

### 13.7 AI Agent Hub
| ID | Type | Finding | See |
|---|---|---|---|
| F-60 | Simulated | "Check connection" is a 1.2 s timer that marks the newest token as used. Setup commands point at `https://pm.example.com` and `/api/agent/...` endpoints that don't exist. | §9.3 |
| F-61 | Gap | Agent tools run only in the "How it works" live demo. They ignore token validity, allowed agents, blocked projects, claim-unassigned and task ownership. | §9.2, §9.10 |
| F-62 | Gap | Only the idle timeout and day cutoff settings take effect. `allowClaimUnassigned` and `blockedProjectIds` are never read. | §9.10 |
| F-63 | Security (positive) | Only the last 4 characters of a token are saved; the full value exists in memory only while on the page. | §9.11 |
| F-64 | Hard-coded | The run detail page is old seed data; "Approve & Close" never appears with the seed data. | §9.7 |

### 13.8 Agreements and e-signatures
| ID | Type | Finding | See |
|---|---|---|---|
| F-70 | Persistence | Every signature request change (create, sign, decline, cancel, remind, fields) is lost on refresh. | §10 |
| F-71 | Simulated | There is no PDF. The document is styled text; field positions are stored but never drawn (fixed or random values); downloads are `.md` text. | §10.12, §10.15 |
| F-72 | Security | Signer identity is not checked: anyone can sign as any pending signer via "Testing as Signer". The default "save as my signature" saves onto the impersonated person's account. | §10.15 |
| F-73 | Gap | A draft can never be sent; nothing sets `viewed` or `expired`; the next sequential signer is never moved to `pending`; declined, cancelled or expired requests can still be signed by URL and become `completed`. | §10.Y |
| F-74 | Simulated | No email and no automatic reminders or expiry. "Never" reminders are stored as 3 days. | §10.16 |
| F-75 | Bug | Audit event titles are blank (`ev.name` vs `eventName`); downloads print "undefined". | §10.13 |
| F-76 | Bug | Counts disagree: sidebar badge and "Action Required" count all in-flight requests; Waiting lists only the user's; "Expiring soon" includes overdue requests. | §10.1–10.4 |
| F-77 | Bug | Wizard request ids are random 4-digit numbers and can collide. | §10.10 |

### 13.9 Documents, contracts and approvals
| ID | Type | Finding | See |
|---|---|---|---|
| F-80 | Persistence | Every document, folder, template and contract change is lost on refresh. | §11 |
| F-81 | Simulated | Upload stores no file (placeholder text, always 4 pages). | §11.3 |
| F-82 | Bug | Versions: editing never adds a version; restoring copies one-line placeholder text over the real content; "Current" marks the oldest version. | §11.11 |
| F-83 | Gap | Template `{{placeholders}}` are filled only in the Preview/Use dialog, not on `/documents/new`. | §11.10, §11.14 |
| F-84 | Gap | Contracts are hidden by flag but every `/contracts/**` URL still works, with blank fields and dropped wizard values. | §11.16–11.27 |
| F-85 | Bug | The Approval Center uses the old `documents` list (links go to 404). Seed approvals belong to u1/u2, so the demo user sees nothing to approve. | §11.28 |
| F-86 | Hard-coded | "End-to-end encrypted", "100% Signatures Recorded" and the `app.flashsign.demo` share link are fixed text. | §11 |

### 13.10 Teams and planning
| ID | Type | Finding | See |
|---|---|---|---|
| F-90 | Gap | With `FEATURES.teams` off, the team pages redirect to `/teams`; team data is still loaded and saved. | §12.14 |
| F-91 | Bug | Edit dialogs (member, announcement, calendar event) open blank or with stale values. | §12.4, §12.11, §12.18 |
| F-92 | Bug | Notifications Center shows and marks **every user's** notifications. | §12.13 |
| F-93 | Bug | Calendar: draws only `calendarEvents`; multi-day leave shows on day one only; 35-cell grid loses days in 6-week months; "today" is fixed at 2026-10-21; dates may shift one day in time zones ahead of UTC. | §12.17 |
| F-94 | Bug | Meetings: edit/delete not reachable; cancel says "attendees notified" but sends nothing; the conflict check misreads PM times. | §12.19–12.22 |
| F-95 | Gap | Time off: anyone can approve anyone's leave (including their own); approval doesn't set Out of Office; the notification goes to the requester. | §12.23 |
| F-96 | Hard-coded | Working hours "09:00 – 17:00", "EST", "8h Free", "Completed this week", the created-vs-completed chart; four screens use four different workload thresholds. | §12.1, §12.7, §12.23 |
| F-97 | Gap | Removing a member doesn't unassign their tasks, though the confirmation says it does. | §12.4 |

---

## 14. "Features version 1" compared with the actual code

How the main claims in `Features version 1.md` (Appendix A) compare with this code.

| Version 1 claim | Actual behaviour | See |
|---|---|---|
| Two contexts persisted to localStorage | True, but only **part** of AppContext is saved (F-02). | §2.3 |
| RBAC enforced across 12 personas | 12 roles exist, but the sidebar ignores them and few screens check permissions (F-03, F-04). Role comes from the signed-in account. | §2.7 |
| Demo persona switcher in sidebar | Hidden by `FEATURES.roleSwitcher = false`. | §2.6 |
| `⌘K` opens command palette | Clicking the search bar works; the shortcut does not (F-20). | §3.6 |
| Search across 5 entity types | See §3.6 for the exact fields; member results do nothing when clicked. | §3.6 |
| Quick Create generates unique keys like `FS-423` | Random `KEY-100..899`, can repeat (F-22). | §3.7 |
| Invitation token is "encrypted base64" | Plain base64url JSON, not encrypted (F-12). | §4.7 |
| Forgot/reset password | Simulated (F-11). | §4.5, §4.6 |
| Executive dashboard KPIs and charts | Mix of real counts and hard-coded charts. | §5.2, §5.3 |
| Health: On Track / At Risk / Off Track / Delayed | Off Track only when set by hand (F-31). | §5.1 |
| New Project wizard with structure, phases, epics | Exists; key and template issues (F-33). | §5.13 |
| Kanban drag starts/stops timers; board move splits time | True (`trackStatusMove`), with the gaps in F-41 and F-42. | §7.Y |
| Delete column with migration mapping; mirror main board | True. | §7.2 |
| Gantt with zoom, Today line, `WindowHint` warnings | Exists; read-only (F-37). | §6.5 |
| "Start Timer / Pause Timer" buttons in the drawer | **Do not exist**; time comes from status moves or manual logging (F-40). | §7.8 |
| Guarded move: parent can't close with open subtasks | True: a prompt when moving to Done. | §7.10 |
| SRS "AI extraction" | Simulated: fixed 6 tasks (F-51). | §8.5 |
| Task time report: worked vs calendar time, CSV | Real calculations from sessions and status changes. | §8.11 |
| Timeline / baseline report: pace, late drivers, checkpoints | Real calculations, with the noted inconsistencies (F-54). | §8.10 |
| MCP tools `list_tasks`, `start_task`, `log_time`, `finish_task` | No MCP server. Tools are simulated in the How-it-works demo (F-60, F-61). | §9 |
| Revoke token "immediately invalidates credentials" | Sets `revokedAt` locally; there is nothing to invalidate. | §9.5 |
| Blocked Project IDs as a security boundary | Saved but never read (F-62). | §9.10 |
| Signature wizard → send → sign → complete | Works within one page session; lost on refresh; drafts can't be sent; no identity check (F-70–F-73). | §10 |
| "Burns signature and seal into document" | No PDF; the signature is stored as a value on the request (F-71). | §10.15 |
| Signature states Draft → Sent → Viewed → Partially Signed → Completed / Declined / Expired | `viewed` and `expired` are never set automatically (F-73). | §10.Y |
| Contract lifecycle module | Hidden by flag; URL-reachable; many fields lost (F-84). | §11.16 |
| Document versions with "Restore Version" | Restore overwrites content with placeholder text (F-82). | §11.11 |
| Approval Center | Uses the old document list; empty for the demo user (F-85). | §11.28 |
| Teams directory and Create Team | Hidden by `FEATURES.teams` (F-90). | §12.14 |
| Leave approve/decline by managers | Anyone can approve (F-95). | §12.23 |
| Idle cutoff and day cutoff auto-stop | True, every 60 s, browser time zone (F-45, F-46). | §2.5, §7.Y |

---

## 15. Using this document

- **For the SRS:** write "current behaviour" from §3–§12. Treat every *Simulated*, *Gap* and *Persistence* item in §13 as either a requirement for the production build or an explicit open question for the product owner.
- **For testing:** each "Buttons and controls" table is a ready-made test checklist. The "Saved after refresh?" column tells testers to reload the page after each action.
- **Keeping it current:** this document matches commit `ef89bc5`. After code changes, update the affected section and its code references.
