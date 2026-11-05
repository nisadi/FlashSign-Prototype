# FlashSign Prototype — Feature, Behaviour & Data-Flow Inventory

**Purpose:** Discovery baseline for creating a complete, code-verified Software Requirements Specification (SRS).  
**Suggested repository path:** `FLASH_SIGN_FEATURE_AND_DATA_FLOW_INVENTORY.md`  
**Status:** Based on the supplied feature inventory; implementation details still require source-code verification.  
**Audience:** AI coding agents, developers, testers and product owners.

## How to use this document

This document preserves the full feature inventory supplied by the project owner and adds a data-flow analysis framework, entity checklist, source-code inspection plan, gap register and instructions for the AI agent that will create the SRS.

### Evidence labels
- **[INVENTORY]** — explicitly stated in the supplied inventory.
- **[DERIVED FLOW]** — a reasonable interpretation of the described behaviour, but not yet confirmed against code.
- **[VERIFY IN CODE]** — must be traced to the exact component, handler, state key, API, database table, external service or test.
- **[OPEN REQUIREMENT]** — a product/business decision cannot safely be inferred.
- **[GAP TO TEST]** — implementation may be incomplete, simulated, unpersisted or untested.

A visible button is not proof that a feature works end-to-end. Verify its event handler, validation, permissions, read source, write destination, refresh behaviour, errors and side effects. Never invent implementation details in the SRS.

## 1. Critical repository-scope check

The supplied inventory describes a broad application with project management, Kanban, planning, time tracking, SRS-to-task generation, MCP AI agents, e-signatures, contracts, documents, approvals, teams, scheduling, reporting and administration.

The public repository root also contains `FLASH_SIGN_FEATURES.md`, which describes a narrower DocuSign-style e-signature app, alongside a `flash-sign-proto/` directory and `PROJECT_MANAGEMENT_REQUIREMENTS.docx`. Before combining these requirements, the AI agent **must determine which app/package each document describes and whether they represent the same version**. Do not merge feature sets into one SRS until repository boundaries are verified.

Inspect:
- The repository root and every nested application/package.
- `flash-sign-proto/`, root `FLASH_SIGN_FEATURES.md`, `PROJECT_MANAGEMENT_REQUIREMENTS.docx`, README files and architecture docs.
- Package manifests, route entry points, state providers, database schema, API handlers and environment examples.
- Whether the supplied inventory describes committed code, a local working tree, a design prototype or planned functionality.

## 2. Product areas and high-level data flow

| Product area | Likely source records | Processing/transformations to verify | Main displayed outputs |
|---|---|---|---|
| App shell/search | Current route, user, workspace, projects, tasks, milestones, sprints, members, notifications | Route-to-label resolution; text matching; unread filtering; count calculation | Breadcrumbs, search results, badges, notification cards |
| Identity/workspaces | Users, roles/personas, invitations, organizations, preferences | Authentication, invitation validation, active workspace selection, role filtering | Login/onboarding, workspace cards, profile and navigation |
| Executive dashboard | Projects, tasks, approvals, work sessions, AI runs, activity | Scope by user/workspace; status/date filters; KPI aggregation and chart bucketing | KPI cards, charts, action list, activity feed |
| Project delivery | Projects, phases, epics, stories, tasks, sprints, boards, files | Parent/child tree construction; task counts; progress/health calculations | Project directory, project tabs, plan, schedule, reports |
| Kanban/time tracking | Boards, columns, task placement/status, work sessions, journey events | Filters; canonical status mapping; timer transitions; elapsed-time calculation | Board cards, counters, live timer, timesheet, task journey |
| SRS extraction | Uploaded file, extracted text, proposed tasks, review decisions | File parsing/OCR, AI extraction, source-section mapping, human edits and acceptance | Review cards, history, diffs and created tasks |
| AI Agent Hub | Tokens, allow-list/settings, tasks, agent sessions and tool calls | Token validation, scope checks, tool execution, session timing and audit | Connect wizard, token list, timesheet, organisation settings |
| Agreements/signatures | Documents, requests/envelopes, recipients, routing, fields, signature values, activity | Required-field validation, signer routing, state transitions, PDF generation | Inbox, wizard, signer view, completion state and signed artifact |
| Contracts | Contract terms, parties, reviewers, comments, approvals, linked request | Review state transitions, expiry/renewal calculations | Contract detail, review, signature status, audit |
| Documents/templates | Files/content, folders, versions, comments, favourites, templates | Folder filtering, version selection, placeholder substitution | Repository, document viewer, version history, template preview |
| Approvals | Approval requests, target records, approvers, decisions, comments | Permission checks; all-approvers rules; target state transition | Personal queue and organisation-wide pending list |
| Teams/planner | Members, teams, capacity, availability, meetings, leave, calendar events | Time-zone handling, capacity ratios, overlap detection, calendar aggregation | Team analytics, directory, availability grid, calendar |
| Reports | Tasks, sessions, projects, documents, agent activity, baselines | Grouping, time calculations, variances, forecast comparisons, CSV serialization | Charts, metrics, timeline and exports |
| Settings/admin | Profile, signatures, preferences, notification settings, sessions, roles | Validation, permission checks, preference persistence, session revocation | Settings forms and member administration |

### Standard read flow to document for every screen
1. Route/component mounts.
2. A provider, hook, selector, API call or query requests data.
3. Source returns records from seed fixtures, in-memory state, browser storage, backend API, database, uploaded file or external service.
4. Records are scoped by current user/workspace/project and filtered/sorted.
5. Values are joined, calculated or formatted for display.
6. UI renders loading, empty, error, unauthorized or populated state.
7. Refresh strategy is applied: on mount, focus, polling, mutation, event or manual refresh.

### Standard write flow to document for every control
1. User action triggers the named handler.
2. Inputs are validated, and permission/ownership rules are checked.
3. A domain action constructs a payload and changes state or calls an API.
4. Data is persisted (or remains in UI-only state; identify which).
5. Related computed values, activity events, notifications, files or timers are updated.
6. UI displays success/failure and refreshes affected views.
7. Record whether the operation is atomic, idempotent and auditable.

## 3. Candidate data-source classes

Every displayed field must be classified as one of the following:
- Seed/demo fixture or hard-coded sample.
- In-memory component state.
- Context/provider state.
- Browser persistence (`localStorage`, `sessionStorage`, IndexedDB or cookie).
- Backend API (record method, path, payload, response and errors).
- Database (table/collection, keys, relationships and constraints).
- Uploaded file or generated artifact (bytes, metadata, location, retention).
- External service (AI model, email provider, MCP client/server or other connector).
- Derived value (formula, filters, grouping and recalculation trigger).
- Placeholder/mock/simulation (UI feedback without real external or persistent side effect).

The supplied inventory says `AppContext` and `DemoAuthContext` use `localStorage`; verify that claim against every module. Do not assume all modules use the same persistence layer.

## 4. Entity and relationship discovery checklist

The following are **candidate entities from the feature inventory**, not a confirmed database schema.

| Entity | Fields to locate | Relationship/rules to verify |
|---|---|---|
| User/persona | ID, name, email, role, profile, preferences, active status | Multiple workspaces? Demo-only role switching? |
| Organization/workspace | ID, name, slug, owner, members, settings | Is all data tenant-scoped? What happens on switch? |
| Invitation | Token, email, role, workspace, expiry, status | Signed/encrypted or merely encoded? Reuse/revoke rules? |
| Project | ID/key, owner, status, health, dates, priority, structure settings | Key uniqueness, archive/delete effects, project membership |
| Phase/milestone | Project, title, target/start/end dates, progress | Are phase and milestone the same entity? |
| Epic/story/task/subtask | IDs/keys, parent, status, dates, assignee, estimates | Hierarchy constraints, cycles, progress formulas, guarded transitions |
| Board/column | Board ID, project, name, order, status mapping | Can several columns map to one status? Delete/migration rules? |
| Sprint | Project, name, goal, capacity, dates, state | Capacity/velocity calculation |
| Work session/time log | Task, worker, source, start/end, duration, reason, review flag | One active timer scope, pause handling, time zone |
| Comment/checklist/attachment | Parent ID, author, body/file metadata, timestamp | Edit/delete permissions, limits, retention |
| Project file/SRS history | File metadata/category, extracted sections, proposals, review decisions | Parsing, source offsets, audit and AI retention |
| AI token/work session/tool call | Owner, token state/expiry, agent, task, tool, arguments/results | Hashing, scope, revocation, audit, blocked-project enforcement |
| Document/folder/version/template | Content/file reference, folder, version, category, placeholders | Storage type, folder cascade, version restore semantics |
| Contract/party/reviewer | Terms, value/currency, dates, parties, review state | Renewal rules, review cycles, signature linkage |
| Approval | Target, requester, approvers, decision, comments, timestamps | Sequential/parallel rules, resubmission |
| Signature request/envelope | Sender, documents, recipients, fields, expiry, reminders, status | Routing, signer access, generated PDF, audit |
| Recipient/signature field | Identity/role/order, field type, page, coordinates, value | Coordinate system, identity assurance, required-field validation |
| Company seal | Image, title, permitted roles, usage count | Authorization and audit trail |
| Notification/activity/audit event | Actor, target, type, timestamp, read state, metadata | Which actions emit events? Immutable or editable? |
| Team/member/availability | Team, lead, skills, capacity, availability blocks | Privacy, working hours, time-zone rules |
| Meeting/calendar/time off | Attendees, date/time, type, status, links | Overlap, approval, recurrence, cancellation |
| Report/baseline | Filters, source records, snapshots, calculation metadata | Live aggregate or snapshot? Baseline immutability? |

## 5. Feature-by-feature data-flow analysis

### 5.1 App shell, global search and quick create
**Read:** current route, current user/role, active workspace, project/task/member collections and notifications. Search matches project names/keys, task titles/keys, milestone titles, sprint names/goals and member names/job titles. Breadcrumbs resolve IDs/paths into display labels.

**Transform/display:** filter matching records, create typed results, resolve labels and navigation destinations, calculate unread/action badges, format relative timestamps and avatar initials.

**Write/actions:** quick create validates fields, assigns IDs/keys/defaults, creates the selected entity and refreshes central state. Project creation also creates default board columns and navigates to project detail. Notification actions mark one/all read. Logout clears session. Persona switch changes the demo context.

**Verify:** whether search is cross-workspace, whether notifications are real events or fixtures, key collision handling, form validation, stale links, keyboard behaviour, role-sensitive results and whether persona switching changes actual authorization.

### 5.2 Authentication, onboarding, invitations and workspace
**Read:** credentials/user lookup, pending profile values, organization settings, invitation token and expiry, workspace list/member/project counts.

**Write/actions:** signup creates pending user state; onboarding saves profile/preferences and creates a workspace; invitation acceptance provisions membership; workspace switch changes active scope; reset password changes credentials and should invalidate sessions where applicable.

**Transform/display:** password-strength meter, validation errors, onboarding stepper, workspace cards, invitation summary and completion screen.

**Verify:** real vs simulated authentication, credential storage, invitation signing/expiry/revocation, role escalation, duplicate email, last-admin protection, session expiry, onboarding resume and cross-workspace data isolation. Base64 is encoding, not encryption; verify any claim that invitation tokens are encrypted.

### 5.3 Executive dashboard
**Read:** projects, tasks, approvals, active timers, AI sessions and activity events. Identify exact user/workspace scope for every widget.

**Transform/display:** count active projects/open tasks/pending approvals/timers, group portfolio health, bucket task creation/completion by week, filter “Needs My Action,” sort activity and format charts.

**Write/actions:** shortcuts navigate to the underlying create/task/approval workflows.

**Verify:** formulas, archived/deleted record treatment, date window/time zone, zero-data display, missing assignees, polling/cache behaviour and consistency with detailed reports.

### 5.4 Projects and project detail
**Read:** project metadata plus task counts, progress, members, dates, health/status, board, hierarchy, sprints, files, activity, reports and settings.

**Write/actions:** project wizard creates metadata and structure settings, phases/epics, default board columns and timeline. Project `NewMenu` creates tasks/phases/epics/stories/sprints/files. Favourite changes may be user-specific or project-global; verify.

**Transform/display:** filters, grid/table mode, progress, status/health badges, avatar stack and date formatting.

**Verify:** duplicate key, date validation, phase date distribution, hierarchy toggles, progress/health formulas, owner/membership rules, archive/delete cascades and per-tab permissions.

### 5.5 Kanban boards
**Read:** board definitions, ordered columns, tasks on the selected board, assignee, priority, sprint, type, hierarchy and status mapping.

**Write/actions:** drag-and-drop changes placement/status; may start/stop work sessions and update parent status. Board settings rename/reorder/add/delete columns and migrate cards. Extra boards may mirror main-board columns.

**Transform/display:** filter cards, map each column to canonical status, compute column counts and render card badges.

**Verify:** failed-save rollback, duplicate column names, deleting occupied columns, status remapping, mirror semantics, cross-board movement, permissions, touch/keyboard support and simultaneous edits.

### 5.6 Plan hierarchy and Gantt schedule
**Read:** project hierarchy Phase/Milestone → Epic → Story → Task → Subtask and date ranges.

**Transform/display:** construct tree, calculate durations/counts/progress, map dates to Gantt bars by zoom, show today line/milestone markers and warn when children fall outside parent windows.

**Write/actions:** add child entities; edit dates; expand/collapse hierarchy.

**Verify:** date propagation vs warning-only behaviour, missing dates, zero-duration milestones, disabled hierarchy levels, re-parenting/cycles, timezone boundaries and progress consistency.

### 5.7 Task drawer, subtasks, checklist, comments, attachments and time
**Read:** task details, parent plan nodes, assignee, sprint, labels, subtasks, checklist, comments, attachments, work sessions and journey events.

**Transform/display:** active elapsed time, checklist/subtask progress, planned effort vs worked time, session history, worker/source badges and board journey.

**Write/actions:** edit task fields; create subtasks; toggle checklist items; post comments; upload attachments; start/pause timer; log manual time; change placement/status; delete with confirmation. Guarded moves should prevent Done while required subtasks remain incomplete.

**Verify:** timer recovery after refresh, single active timer scope, pause arithmetic, manual log overlaps, permissions for logging on behalf of others, attachment limits/scanning, deletion cascade, comments edits and journey immutability.

### 5.8 SRS upload, AI extraction and task review
**Read:** uploaded file bytes/metadata, extracted text and source sections.

**Transform/display:** parser/OCR/AI returns candidate tasks with title, description, acceptance criteria, priority, points, tags and source section. Review UI shows original proposal, edits and decision history.

**Write/actions:** upload file; analyze; edit proposal; accept/reject with optional reason; bulk-create accepted tasks and link them to the source section/document.

**Verify:** real AI vs simulation, provider/model/prompts, file types/size, OCR, prompt injection, data sent externally, retries/idempotency, duplicate proposals, source accuracy, partial commit and post-commit editing.

### 5.9 AI Agent Hub and MCP
**Read:** token metadata, allowed agent families, organisation settings, tasks available to agents, work sessions and tool-call history.

**Write/actions:** create/revoke token; test handshake; agent calls `list_tasks`, `start_task`, `log_time`, `finish_task`; modify allow-list, idle/day cutoff, unassigned-task claim and blocked project IDs.

**Transform/display:** token expiry/last-use labels, connection status, work-session duration/end reason and timesheet groups.

**Verify:** whether MCP server/tools actually exist, token hashing and one-time display, expiry/revocation, least privilege, rate limiting, blocked-project checks on every tool, prompt injection, duplicate calls, disconnect behaviour and audit logs.

### 5.10 Agreements and e-signatures
**Read:** document(s), recipients, routing order, field placements, request status, signature values, expiry/reminders and activity.

**Transform/display:** request KPI counts, completion percentage, signer state, PDF page canvas and recipient-specific field positions.

**Write/actions:** create/save draft; add recipients; choose sequential/parallel routing; place fields; configure expiry/reminders; send; view; sign/decline; send reminder; void/cancel; select seal; generate final PDF and notify recipients.

**Verify:** signing-link validation, recipient identity/turn order, required fields/consent, normalized PDF coordinates, page rotation, multiple documents, duplicate submissions, decline/expiry, email failure, final PDF consistency, audit completeness and signature assurance. Do not call a visual signature mark a cryptographic digital signature unless the implementation proves it.

### 5.11 Contract lifecycle
**Read:** contract terms, value/currency, effective/expiry dates, renewal policy, parties, reviewers, comments, approvals, linked document/signature request and audit.

**Write/actions:** create; submit for review; request changes; approve; link/send for signature; record lifecycle events.

**Transform/display:** status badges, expiry/renewal indicators, review thread and audit timeline.

**Verify:** currency handling, date rules, auto-renewal logic, reviewer changes, re-review after edits, editing after approval, signature cancellation and confidential-field permissions.

### 5.12 Document repository, folders, versions and templates
**Read:** document metadata/content, folder hierarchy, type/size/pages, favourites, archive state, versions, comments and templates.

**Write/actions:** upload; create/rename/delete folder; move; favourite; duplicate; download; archive/delete; restore version; instantiate template and replace placeholders.

**Transform/display:** folder tree, document cards/rows, content preview, version list, comments and template preview.

**Verify:** actual file storage format, upload limits, folder deletion cascades, cycle prevention, version restore semantics, placeholder escaping/missing values, orphan files, download authorization and retention.

### 5.13 Approval centre
**Read:** approvals assigned to current user and all pending approvals the current role can view.

**Write/actions:** approve/reject with optional comment; update target to approved when all required reviewers pass; notify participants and update audit.

**Transform/display:** requester/title/time, pending status and personal vs organization-wide queue.

**Verify:** self-approval, double decisions, approver removal, sequential/parallel rules, resubmission after rejection, archived targets and audit/notification behaviour.

### 5.14 Teams, availability, calendar, meetings and time off
**Read:** team members, skills, weekly capacity, tasks, availability blocks, meetings, leave, focus time, calendar events, announcements and invitations.

**Transform/display:** utilization ratios, task-flow charts, daily/five-day schedule grids, unified calendar event layers, meeting countdowns and directory cards.

**Write/actions:** create team/invite member; change availability; create meeting/event; update agenda; request/approve/decline leave; post announcement; resend/revoke invitation.

**Verify:** time zones, overlapping events, meeting end-before-start, capacity denominator, privacy of availability, unauthorized leave decisions, deactivated member assignments, recurrence and invite expiry.

### 5.15 Reports and BI
**Read:** project/task/document/AI records, work sessions, subtasks, workers and baseline snapshots.

**Transform/display:** task-flow aggregates, health distribution, document status, worked/calendar time, planned-vs-actual variance, late drivers and baseline-vs-forecast timeline. CSV export serializes filtered rows.

**Verify:** exact formulas, pause/idle treatment, rounding, timezone, missing baselines, deleted records, CSV escaping/formula injection, export permissions and chart/table consistency.

### 5.16 Settings and organization administration
**Read:** profile, saved signature, preferences, notifications, active sessions, skills/capacity, workspace members and organization settings.

**Write/actions:** update profile/preferences; create/update/delete saved signature; change password; revoke sessions; change member role/active state; modify organization-wide AI/signing defaults.

**Verify:** server-side permission enforcement, last-admin protection, session invalidation on deactivation, field validation, cross-device preference sync, signature image storage and role changes in open sessions.

### 5.17 State machines and automation
The supplied inventory describes task progression (Backlog/To Do → In Progress → In Review → Done, with Blocked state), signature request progression (Draft → Sent/Viewed/Partially Signed → Completed, with Declined/Expired outcomes) and timer automation. The agent must find the actual transition functions and confirm whether these labels match implementation enums.

| Trigger | Expected behaviour in supplied inventory | Must verify |
|---|---|---|
| Task enters In Progress | Start web work session | Is the assignee, actor or current user timed? |
| Start another task timer | Pause existing active timer | Per user, workspace, device or globally? |
| Task moves to Review/Done | Stop session as finished | Atomic with task status? |
| Subtask enters In Progress | Advance parent without parent timer | What if parent is Done/Blocked? |
| Idle cutoff exceeded | Flag session for review and set idle-timeout reason | What counts as activity and who receives review? |
| Day cutoff reached | Auto-stop session | Which timezone controls cutoff? |
| Final signer completes | Complete request, generate signed document and notify recipients | Is artifact generation atomic with status/email? |
| Request expires | Expire/void according to rules | Scheduler reliability and idempotency? |

## 6. Screen-level data contract

For every route and feature, the SRS must answer:
1. Purpose and user goal.
2. Exact route, component and access requirements.
3. Source of each displayed field.
4. Query scope: user, workspace, project, status, date and deletion filters.
5. Transformations: filtering, joining, grouping, formatting, calculations and redaction.
6. Refresh strategy.
7. Loading, empty, partial, error, unauthorized, stale and success states.
8. Every control and its handler/navigation destination.
9. Validation rules and cross-field constraints.
10. Write effects, computed-field updates, events, notifications, file changes and timer changes.
11. Permission/ownership rules.
12. Error codes/messages and retry paths.
13. Audit fields: actor, timestamp, before/after values, reason and target.
14. Test scenarios and acceptance criteria.

## 7. Required source-code inspection plan

### 7.1 Establish the actual app boundary
- Print the complete repository tree and package manifests.
- Identify every app, server, worker, script and shared package.
- Compare this inventory against root `FLASH_SIGN_FEATURES.md`, `PROJECT_MANAGEMENT_REQUIREMENTS.docx`, README files and architecture documents.
- Determine which documents describe committed code, local working-tree changes, design-only UI or future plans.

### 7.2 Map every route and control
For each route, record the route file, layout/provider/guard, rendered components, data hooks/context/API calls, every button/form/menu/toggle/drag handler, navigation targets, permission checks and loading/empty/error states.

### 7.3 Map every data source
Search for:
- `localStorage`, `sessionStorage`, cookies, IndexedDB.
- Context providers, reducers, state setters and persistence effects.
- `fetch`, API clients, route handlers and server actions.
- Database schema, query functions, seed scripts and migrations.
- File upload/download, Blob/data URL and PDF parsing/flattening.
- AI SDKs/prompts, MCP tool/server definitions and token verification.
- Email, scheduler and background jobs.
- `TODO`, `FIXME`, `mock`, `demo`, `placeholder`, `simulate`.
- Permission helpers and role checks.
- Tests, CI workflows, lint/build configuration.

For every finding record path, symbol, caller, payload, persistence target, display consumer and test evidence.

### 7.4 Trace these complete user journeys
1. Sign up → verify → login → logout/session expiry.
2. Create project → phase/epic/story/task → board → report.
3. Move task → timer start/stop → time report.
4. Upload SRS → analyze → review/edit/accept → task creation → source link.
5. Create/revoke agent token → MCP handshake → tool call → work session → timesheet.
6. Upload document → create signing request → recipient opens link → signs/declines → final PDF/email/audit.
7. Create contract → review → approval → signature → completed state.
8. Upload/move/version/restore document → comments/download.
9. Request leave → manager decision → calendar/availability update.
10. Change role/workspace → verify all routes and records remain correctly scoped.

### 7.5 Runtime checks
If the environment is available, install dependencies from the lockfile, configure environment variables without exposing secrets, run lint/build and documented setup, start required processes, and test representative flows with demo/new data. Record logs and failures. Do not send real emails, create external accounts or change production data without explicit authorization.

## 8. Mandatory gap and risk register

These are questions to investigate, not assertions that every defect exists.

| ID | Area | Investigation question | Evidence required | Status |
|---|---|---|---|---|
| GAP-001 | Scope | Does the inventory describe `flash-sign-proto/` or the root e-sign app? | Tree, manifests, routes | Open |
| GAP-002 | Persistence | Is each entity stored in localStorage, DB, API or only memory? | Persistence code and refresh tests | Open |
| GAP-003 | Authentication | Is authentication real or demo simulation? | Auth provider and credential flow | Open |
| GAP-004 | Authorization | Are permissions enforced at write boundaries? | Mutation handlers/API guards | Open |
| GAP-005 | Tenant isolation | Are search, reports, files and all queries workspace-scoped? | Query filters and cross-workspace test | Open |
| GAP-006 | AI extraction | Real model-backed processing or simulated response? | Handler, provider, prompt and tests | Open |
| GAP-007 | MCP | Is a real MCP server/tool implementation present? | Server/tool source and handshake test | Open |
| GAP-008 | Token security | Are tokens hashed, scoped, expired and revoked server-side? | Schema and verification path | Open |
| GAP-009 | File storage | Where are originals, attachments, signatures and PDFs stored? | Upload/download code and configuration | Open |
| GAP-010 | Signature assurance | Visual mark, auditable e-signature or cryptographic signature? | PDF implementation and assurance design | Open |
| GAP-011 | PDF fidelity | Multiple documents, page rotation, coordinates and field types? | PDF code and representative tests | Open |
| GAP-012 | Email | Real SMTP/provider delivery or console/mock output? | Mailer and runtime test | Open |
| GAP-013 | Background jobs | Are reminders, expiry and timer cutoffs reliable after restart? | Scheduler and persisted state | Open |
| GAP-014 | State transitions | Consistent across UI, API and agent tools? | Transition functions and handlers | Open |
| GAP-015 | Reporting | Defined formulas consistent across dashboards/reports? | Formula source and test fixtures | Open |
| GAP-016 | Time tracking | Pause, idle, manual logs, overlap and timezone semantics? | Session model and tests | Open |
| GAP-017 | Versioning | Does restore replace content or create a new version? | Version handler | Open |
| GAP-018 | Deletion | Which entities are soft/hard deleted or cascade deleted? | Delete handlers/schema | Open |
| GAP-019 | Notifications | Which actions create events and are channels real? | Event producers and notification UI | Open |
| GAP-020 | Testing | Feature, security and end-to-end tests present? | Test tree, scripts, CI | Open |
| GAP-021 | Accessibility | Keyboard, screen-reader, contrast and touch support? | Accessibility review/tests | Open |
| GAP-022 | Performance | Large projects, PDFs, task lists and long histories? | Pagination, limits, profiling | Open |
| GAP-023 | Privacy | What personal/document data reaches AI providers or browser storage? | Data-flow/provider configuration | Open |
| GAP-024 | Recovery | Backups, restore, migrations and demo reset? | DB setup and operational docs | Open |

## 9. Completeness checklist

### Repository and architecture
- [ ] Every app, package, server, worker and script identified.
- [ ] Runtime entry points and environment variables documented.
- [ ] All routes, guards, providers, hooks and state persistence mapped.
- [ ] All APIs, database entities, seed scripts and external services mapped.

### Feature coverage
- [ ] Every feature in Appendix A mapped to source files.
- [ ] Every control mapped to its handler and outcome.
- [ ] Every visible field mapped to source, transformation and display.
- [ ] Every mutation mapped to persistence, refresh and side effects.
- [ ] Loading, empty, error and unauthorized states documented.
- [ ] Placeholder, simulated, disabled, partial and unreachable features listed.
- [ ] Background automations and state transitions traced.

### Data and security
- [ ] Entity relationships, ownership and workspace scoping verified.
- [ ] Role/permission matrix verified against enforcement code.
- [ ] Personal data, files, signatures, tokens and AI data transfer traced.
- [ ] Upload/download validation and access control verified.
- [ ] Sessions, invitations, tokens and signing links threat-checked.
- [ ] Delete/archive/restore/retention/audit behaviour documented.

### SRS quality
- [ ] Functional requirements have unique IDs and are testable.
- [ ] Non-functional requirements include measurable acceptance criteria where possible.
- [ ] Current behaviour is separated from desired future behaviour.
- [ ] Unresolved business rules are explicit questions.
- [ ] Each requirement traces to source evidence and test cases.
- [ ] Discrepancies among docs, UI, code and runtime are recorded.
- [ ] Prototype limitations are not represented as production guarantees.

## 10. Prompt for the AI agent that will produce the SRS

> Read `FLASH_SIGN_FEATURE_AND_DATA_FLOW_INVENTORY.md` and inspect the entire repository, including every nested app, root `FLASH_SIGN_FEATURES.md`, `PROJECT_MANAGEMENT_REQUIREMENTS.docx`, README files, package manifests, routes, providers, API handlers, database schema, seed scripts, environment examples, integrations and tests.
>
> Do not write the final SRS from this inventory alone. First establish which app/version each document describes. Build an evidence-backed implementation map. For each feature, identify route/component, controls, read source, query scope, transformations, write handler, persistence target, authorization, validation, displayed output, refresh behaviour, errors, audit/notification side effects and tests. Cite exact file paths and symbol names.
>
> Classify every feature as: Implemented and verified; Implemented but unverified; Partially implemented; UI-only/mock/simulated; Documented but missing; Present in code but undocumented; Broken/unreachable; Security/privacy concern; or Requires product decision.
>
> Never invent tables, endpoints, formulas, integrations or security properties. Mark unknowns and ask specific questions. Separate current behaviour from recommendations. If documents conflict with source code, report the discrepancy.
>
> Produce: (1) a complete SRS, (2) route-to-feature and feature-to-source matrices, (3) a control-to-data-flow catalogue, (4) a gap/bug/mock/placeholder register with evidence and severity, (5) a role-permission matrix, (6) entity/relationship and retention documentation, (7) end-to-end tests for critical workflows, and (8) unresolved product-owner questions. Do not claim a feature is complete without implementation and behaviour evidence.

## Appendix A. Supplied feature inventory (preserved verbatim)

The full inventory supplied by the project owner follows. Preserve its route names, component names, terminology, workflow descriptions and state-machine notes as source material. It is not independent proof that each described feature is implemented.

---

# FlashSign Prototype — Complete Feature & Control Inventory

> **Document Purpose:** An exhaustive, button-by-button, feature-by-feature reference cataloging every capability, UI control, modal, drawer, workflow, and data mechanism in the FlashSign Prototype.
> **Scope:** Entire Next.js application (`flash-sign-proto`) including Project Management, Electronic Signatures, AI Agent Hub (MCP), Documents, Contracts, Team Collaboration, Reports, and System Settings.

---

## Table of Contents
1. [Platform Architecture & Core Concepts](#1-platform-architecture--core-concepts)
2. [Global Application Shell & Navigation](#2-global-application-shell--navigation)
3. [Authentication, Onboarding & Workspace Management](#3-authentication-onboarding--workspace-management)
4. [Executive Dashboard](#4-executive-dashboard)
5. [Project Management & Delivery Engine](#5-project-management--delivery-engine)
6. [Interactive Kanban Board & Multi-Board System](#6-interactive-kanban-board--multi-board-system)
7. [Plan Hierarchy & Schedule Gantt Engine](#7-plan-hierarchy--schedule-gantt-engine)
8. [Task Detail Drawer, Time Tracking & Subtask System](#8-task-detail-drawer-time-tracking--subtask-system)
9. [SRS Requirements Engineering & AI Task Generation](#9-srs-requirements-engineering--ai-task-generation)
10. [AI Agent Hub (MCP Protocol & Work Sessions)](#10-ai-agent-hub-mcp-protocol--work-sessions)
11. [Agreements, Electronic Signatures & Company Seals](#11-agreements-electronic-signatures--company-seals)
12. [Contract Lifecycle Management](#12-contract-lifecycle-management)
13. [Document Repository & Template System](#13-document-repository--template-system)
14. [Approval Center](#14-approval-center)
15. [Team Collaboration, Availability & Planner](#15-team-collaboration-availability--planner)
16. [Reports & Business Intelligence](#16-reports--business-intelligence)
17. [Settings & Organization Administration](#17-settings--organization-administration)
18. [State Machines & Transition Rules Reference](#18-state-machines--transition-rules-reference)

---

## 1. Platform Architecture & Core Concepts

FlashSign Prototype bridges DocuSign-style electronic signature execution with Jira-style Agile project management and Model Context Protocol (MCP) AI agent workflows.

### 1.1 State Management Architecture
The application runs on two primary client-side state contexts persisted to `localStorage`:
* **`AppContext` (`STORAGE_KEY: flashsign-proto-state-v6`):** Manages all business entities: projects, tasks, sprints, milestones, epics, stories, boards, teams, users, project files, SRS histories, AI agent tokens, work sessions, timers, audit logs, documents, folders, templates, contracts, signature requests, company seals, and signing defaults.
* **`DemoAuthContext` (`STORAGE_KEYS`):** Manages user authentication, demo preset accounts, role switching, invitations, organizations/workspaces, and personal user preferences.

### 1.2 Persona & RBAC Matrix
The system enforces Role-Based Access Control across 12 personas (`DemoRole`):
1. **CEO / Executive (`ceo`):** Portfolio oversight, financial burn, company seal authority, agreement sign-off.
2. **Project Manager (`project_manager`):** Timeline baselines, project structure, sprints, re-assignment, schedule reports.
3. **Product Owner (`product_owner`):** Backlog, user stories, acceptance criteria, SRS document classification.
4. **Engineering Lead (`engineering_lead`):** Architecture, board column mappings, agent connection gates, code reviews.
5. **Developer (`developer`):** Task execution, timer logging, Kanban cards, AI tool runner.
6. **QA Tester (`qa_tester`):** Test board columns, bug verification, test report analysis.
7. **Organization Admin (`org_admin`):** User management, invites, workspace creation, company-wide settings.
8. **Document Manager (`document_manager`):** Company seals, document templates, contract lifecycle, signing defaults.
9. **Client (`client`):** Read-only project view, signature signing interface, document review.
10. **Auditor (`auditor`):** Complete audit log access, tamper-evident document event history.
11. **Platform Admin (`platform_admin`):** Global configurations and developer tokens.
12. **Integration Service (`integration_service`):** Automated API and MCP agent headless worker.

---

## 2. Global Application Shell & Navigation

The application shell wraps every workspace route with a consistent header, collapsible sidebar, command palette, and quick action dialog.

### 2.1 Top App Header (`AppHeader`)
* **Breadcrumb Trail:**
  * Displays hierarchical location (e.g., `Workspace > Projects > FlashSign V2 > Schedule`).
  * Dynamic name resolution for IDs (resolves `p1` to project name; resolves `/teams` to "Team Analytics").
  * Clickable crumbs allow navigation up the tree.
* **Mobile Sidebar Toggle Button (`Menu` icon):**
  * Opens and closes the left sidebar on screens narrower than `lg`.
* **Global Search Bar & Command Menu Trigger:**
  * Shows "Search everywhere..." placeholder with keyboard shortcut badge (`⌘K` or `Ctrl+K`).
  * Clicking opens the **Command Palette (`SearchCommand`)**.
* **Quick Create Action (`+ New` button):**
  * High-visibility Flash-accented button.
  * Clicking opens the universal **Quick Create Dialog**.
* **Notifications Popover (`Bell` icon):**
  * Shows unread notification dot badge when `unreadCount > 0`.
  * Clicking opens a dropdown menu displaying recent notifications (Tasks, Documents, Agents, Approvals).
  * **"Mark all read" button:** Clears all unread notification badges.
  * Individual notification cards show icon, title, relative timestamp, and clickable link.
* **User Profile & Logout Menu:**
  * Shows current user avatar with initials and online status badge.
  * Dropdown displays: User Name, Email, Organization name, and Current Role.
  * **"Profile Settings" link:** Navigates directly to `/settings/profile`.
  * **"Sign out" button:** Clears session and redirects to `/login`.

### 2.2 Global Search & Command Palette (`SearchCommand`)
* **Trigger:** Click search bar or press `Cmd+K` / `Ctrl+K`. Closes on `Escape` or clicking overlay backdrop.
* **Search Input:** Real-time query matching across 5 entity types simultaneously:
  1. **Projects:** Searches name and project key. Click navigates to `/projects/[id]`.
  2. **Tasks:** Searches title and task key (e.g., `FSV2-101`). Click opens the **Task Detail Drawer**.
  3. **Milestones:** Searches milestone title. Click navigates to project plan.
  4. **Sprints:** Searches sprint name and sprint goal. Click navigates to `/projects/[id]/sprints`.
  5. **Team Members:** Searches name and job title. Click navigates to team directory.
* **Clear Query Button (`X` icon):** Resets search input to empty.

### 2.3 Universal Quick Create Dialog (`QuickCreateDialog`)
* **Trigger:** Header `+ New` button.
* **Tab Switcher:** Four modes:
  1. **Task Tab:**
     * Inputs: Task Title, Project Selector dropdown, Priority (Low, Medium, High, Critical), Task Type (Task, Bug, Story, Epic), Assignee dropdown, Sprint selector, Due Date picker, Description textarea.
     * **"Create Task" button:** Generates unique key (e.g., `FS-423`), prepends to task store, notifies toast, and closes dialog.
  2. **Project Tab:**
     * Inputs: Project Name, Project Key (e.g., `PRJ`), Description, Priority.
     * **"Create Project" button:** Initializes project with default boards, sets start date to today and end date to +60 days, redirects user directly to `/projects/[id]`.
  3. **Milestone Tab:**
     * Inputs: Project selector, Milestone Title, Target Due Date, Description.
     * **"Create Milestone" button:** Adds upcoming milestone to the selected project.
  4. **Sprint Tab:**
     * Inputs: Project selector, Sprint Name, Sprint Goal, Story Point Capacity.
     * **"Create Sprint" button:** Adds planned sprint ready for backlog grooming.

### 2.4 Left Sidebar Navigation (`AppSidebar`)
* **Brand Header:** FlashSign logo + lightning bolt icon. Clicking navigates to `/projects/home`.
* **Sidebar Toggle Button:** Collapses sidebar into compact icon-only mode (`16rem` to `4rem`).
* **Active Organization Card:** Displays current workspace name (e.g., "Flash Technologies") and slug.
* **"Navigation" Header & Accordion Toggle (`ChevronsUpDown` button):**
  * One-click action to "Expand all" or "Collapse all" sidebar sections.
* **Section 1: Workspace (Collapsible):**
  * **Dashboard:** Link to `/projects/home`.
  * **Projects:** Link to `/projects` (all projects directory).
  * **My Tasks:** Link to `/projects/my-tasks` (current user assigned work).
  * **Planning:** Link to `/planner/calendar` (active on all `/planner/*` routes).
* **Section 2: Agreements (Collapsible):**
  * Badge counter displays total signature requests requiring action (`sent`, `viewed`, `partially_signed`).
  * **Home:** Link to `/agreements`.
  * **Inbox:** Link to `/signatures/all` (shows active action required badge).
  * **Documents:** Link to `/documents/all` (includes contracts sub-views).
  * **Templates:** Link to `/documents/templates`.
  * **Reports:** Link to `/agreements/reports`.
  * **Settings:** Link to `/signatures/settings` (defaults & company seals).
* **Section 3: Teams (Collapsible):**
  * **Analytics:** Link to `/teams`.
  * **Teams Directory:** Link to `/teams/directory`.
  * **Members:** Link to `/teams/members`.
* **Section 4: AI Agent Hub (Direct Link):**
  * Direct route to `/ai-agents` (MCP connection & agent activities).
* **Section 5: Settings (Direct Link):**
  * Direct route to `/settings/profile`.
* **Demo Persona Switcher (Stakeholder Demo Support):**
  * Select dropdown to instantly simulate any of the 12 personas with zero credential re-entry.

---

## 3. Authentication, Onboarding & Workspace Management

### 3.1 Authentication Views
* **Login (`/login`):**
  * Inputs: Email address, Password with toggle visibility (`Eye`/`EyeOff` icon), "Remember this device" checkbox.
  * **"Sign In" button:** Authenticates against `DemoAuthContext`. If user has no organization set up, routes to `/onboarding/create-organization`. Otherwise routes to `/projects/home`.
  * **"Quick Demo Login" pills:** One-click prefill buttons for sample personas (CEO, Project Manager, Lead Engineer).
  * **"Forgot password?" link:** Routes to `/forgot-password`.
  * **"Create an account" link:** Routes to `/signup`.
* **Register / Signup (`/signup` & `/register`):**
  * Inputs: Full Name, Work Email, Password with real-time password strength meter (Weak, Fair, Good, Strong checking length, numbers, symbols), Job Title.
  * **"Continue" button:** Registers pending user and immediately triggers 4-step Onboarding.
* **Forgot Password (`/forgot-password`):**
  * Inputs: Account email.
  * **"Send Reset Instructions" button:** Simulates dispatching reset token, displays confirmation message.
* **Reset Password (`/reset-password`):**
  * Inputs: New Password, Confirm Password.
  * **"Update Password" button:** Updates credential store, redirects to `/login` with success banner.
* **Invitation Acceptance (`/invite`):**
  * Validates encrypted base64 payload token (`invitations.ts`).
  * Displays Organization Name, Inviter Name, Assigned Role, and Expiration (7-day validity).
  * Inputs: Full Name, Set Password, Job Title.
  * **"Accept Invitation & Join Team" button:** Provisions membership directly without requiring new organization creation.

### 3.2 4-Step Onboarding Wizard (`/onboarding`)
* **Step Progress Header (`OnboardingProgress`):** Visual 4-step stepper with active/completed indicators.
* **Step 1: Profile Details (`/onboarding/profile`):**
  * Avatar color picker (`AvatarPicker`), Bio textarea, Timezone dropdown, Department selector.
  * **"Save & Continue" button:** Commits profile updates.
* **Step 2: Organization Setup (`/onboarding/create-organization`):**
  * Inputs: Organization Name, Auto-generated Slug input, Industry selector, Company Size dropdown, Website URL, Description.
  * **"Create Organization" button:** Provisions workspace aggregate and sets user as Owner.
* **Step 3: Preferences (`/onboarding/preferences`):**
  * Toggles: In-App Notifications, Email Notifications, Task Assignment Alerts, Deadline Reminders, Approval Requests.
  * Theme selector (Light / Dark mode).
  * **"Save Preferences" button:** Persists user settings.
* **Step 4: Complete (`/onboarding/complete`):**
  * Celebration screen summarizing configured workspace.
  * **"Launch Workspace" button:** Transitions directly into `/projects/home`.

### 3.3 Workspace Switcher & Creator (`/workspace`)
* **Workspace Selector Grid:** Cards showing organization logo/color, member count, active projects, creation date.
* **"Switch to Workspace" button:** Hot-swaps the active organization context.
* **"Create New Workspace" button:** Opens dialog with name, industry, size, and accent color fields.
* **Prototype Boundary Hub (`/prototype-home`):** Overview landing page with "Reset Demo Data" and "Change Workspace" controls.

---

## 4. Executive Dashboard (`/projects/home` & `/dashboard`)

Designed for executive and portfolio-level visibility.

### 4.1 KPI Cards Row
1. **Active Projects:** Count of non-archived projects + on-track status indicator.
2. **Open Tasks:** Total tasks across all projects with breakdown of In Progress vs Blocked.
3. **Pending Approvals:** Documents awaiting signature or managerial sign-off.
4. **Active Timers / AI Runs:** Number of live developer timers and AI agent sessions.

### 4.2 Interactive Dashboard Widgets
* **Portfolio Health Chart:** Visual breakdown of projects categorized into On Track, At Risk, Off Track, and Delayed.
* **Weekly Task Flow:** Bar/Area chart showing task creation vs completion velocity over 4 weeks.
* **Needs My Action Panel:** Immediate tasks and signature requests assigned to the logged-in user.
* **Recent Activity Feed:** Live audit events (status transitions, document shares, timer events).
* **"New Project" quick button:** Opens project creation wizard.

---

## 5. Project Management & Delivery Engine (`/projects`)

### 5.1 All Projects Directory (`/projects`)
* **Header Controls:**
  * Search input filtering by name and key.
  * Status Filter dropdown: All, Planning, Active, On Hold, Completed, Archived.
  * Health Filter dropdown: All, On Track, At Risk, Off Track.
  * View Toggle: Grid Card View vs Compact Table View.
  * **"New Project" button:** Routes to `/projects/new`.
* **Project Cards:**
  * Displays: Project Key badge, Accent Color bar, Project Name, Star/Favorite toggle, Health Badge, Status Badge, Due Date, Progress bar (0–100% computed from tasks), Team member avatar stack, Task count.
  * Clicking card navigates to `/projects/[id]`.

### 5.2 New Project Wizard (`/projects/new`)
A structured multi-step planning tool:
* **Step 1: General Details:**
  * Project Name, Key prefix (e.g., `FSV2`), Owner selector, Category, Priority (Low, Medium, High, Critical), Description.
  * Planning Unit selector (`DurationUnit`): Days, Weeks, or Months.
  * Date Range: Start Date & Planned End Date.
* **Step 2: Project Structure Configuration (`ProjectStructure`):**
  * Checkbox toggles:
    * `Phases` (Milestones as overarching delivery stages).
    * `Epics` (Large feature groupings).
    * `Stories` (User requirements).
    * `Subtasks` (Atomic work units).
    * `Backlog` (Holding area before assignment to a parent).
    * `Allow Move` (Permit re-parenting across the hierarchy).
* **Step 3: Phases Planning (`PhasesStep`):**
  * Template Selector: **Waterfall** (Requirements, Design, Development, Testing, Release), **Release Stages** (MVP, Beta, GA), or **No Phases**.
  * **"Distribute Dates Evenly" button:** Automatically segments project timeline across phases.
  * Custom phase builder: Add phase, rename, adjust start/end dates.
* **Step 4: Epics & Stories Setup:**
  * Create initial epics with custom color pickers (`EPIC_COLORS`).
  * Choose time allocation: "All of its phase" vs "Custom dates inside phase".
* **"Create Project" button:** Instantiates project, creates default board columns, calculates timeline, and routes to `/projects/[id]`.

### 5.3 Project Detail Header (`ProjectHeaderNav`)
Sticky navigation bar across all 11 project sub-views:
* **Back to Projects button (`ArrowLeft`):** Returns to directory.
* **Project Key Badge:** Styled with project accent color.
* **Project Title:** Direct text display.
* **Favorite Toggle (`Star` icon):** Adds/removes from sidebar and favorites filter.
* **Project Status Badge & Health Badge:** Color-coded status indicators.
* **`NewMenu` Dropdown (`+ New` button):**
  * `Add Task` (opens `CreateTaskModal`).
  * `Add Phase` (opens milestone modal).
  * `Add Epic` (opens epic creation modal).
  * `Add Story` (opens user story modal).
  * `Add Sprint` (opens sprint planning modal).
  * `Upload File` (opens project file upload dialog).
* **Navigation Tabs:**
  1. `Overview` (`/projects/[id]`)
  2. `Plan` (`/projects/[id]/plan`)
  3. `Tasks` (`/projects/[id]/tasks`)
  4. `Board` (`/projects/[id]/board`)
  5. `Schedule` (`/projects/[id]/timeline`)
  6. `Sprints` (`/projects/[id]/sprints`)
  7. `Team` (`/projects/[id]/team`)
  8. `Files` (`/projects/[id]/files`)
  9. `Activity` (`/projects/[id]/activity`)
  10. `Reports` (`/projects/[id]/reports`)
  11. `Settings` (`/projects/[id]/settings`)

---

## 6. Interactive Kanban Board & Multi-Board System (`/projects/[id]/board`)

FlashSign features a multi-board Kanban architecture where tasks can move between different boards (e.g., Development Board to QA/Testing Board), preserving comments and tracking time separately per board.

### 6.1 Multi-Board Selector & Controls
* **Board Switcher Tabs:** Switch between "Main Board" and custom boards (e.g., "QA & Verification Board").
* **"Board Settings" button (`Sliders` icon):** Opens `BoardColumnsModal`.
* **Search & Filter Bar:** Filter cards by assignee, priority, sprint, or text search.
* **"Add Task" button:** Direct column-level task creation.

### 6.2 Kanban Columns & Drag-and-Drop
* **Column Headers:** Shows column name, color accent pill, and card counter badge.
* **Stage Mapping:** Every column maps to one canonical task status (`todo`, `in_progress`, `review`, `done`, `blocked`).
* **Timer Automation on Drag (`trackStatusMove`):**
  * Dragging a card into an **In Progress** column: Automatically starts the assignee's work session timer (pausing any other active timer).
  * Dragging a card out of **In Progress** to **Review** or **Done**: Stops the timer and marks the work session `finished`.
  * Dragging a card to another board: Splits the time log across boards.
* **Parent-Child Synchronization:** Moving a subtask into In Progress automatically advances its parent task to In Progress without starting a parent timer.

### 6.3 Board Customization Modal (`BoardColumnsModal`)
* **Rename Board:** Edit board display name.
* **Add Column button:** Create custom columns (e.g., "Code Review", "UAT", "Staging").
* **Column Stage Selector:** Select canonical status for each column.
* **Reorder Columns:** Move columns left or right.
* **Delete Column with Migration Mapping:** If a column with active tasks is deleted, a dropdown requires mapping where existing cards should move.
* **Mirror Main Board Columns toggle:** Keeps extra board columns synchronized with the main board.
* **"Add Extra Board" button:** Provisions an additional Kanban board.

---

## 7. Plan Hierarchy & Schedule Gantt Engine

### 7.1 Plan Tree View (`/projects/[id]/plan`)
Enforces the 5-level hierarchy: **Phase (Milestone) → Epic → Story → Task → Subtask**.
* **Expand / Collapse All Controls:** Toggles tree visibility.
* **Phase Nodes:** Show target date, duration in weeks/months, progress bar, and "Add Epic" action.
* **Epic Nodes:** Colored badge, duration, story count, and "Add Story" action.
* **Story Nodes:** Acceptance criteria preview, task count, and "Add Task" action.
* **Inline Task Creator:** Add tasks directly under stories with automatic relationship linking (`setTaskPlan`).

### 7.2 Schedule & Gantt Timeline (`/projects/[id]/timeline`)
* **Interactive Gantt View:**
  * Visual timeline bars for every phase, epic, story, and task.
  * Current date indicator ("Today" vertical line).
  * Milestone diamond markers.
* **Timeline Zoom Controls:** Switch timeline scale between Days, Weeks, and Months.
* **Date Bounds Enforcement (`WindowHint`):** Tasks cannot be scheduled outside their parent story/phase window; displays visual warning indicators when dates exceed bounds.

---

## 8. Task Detail Drawer, Time Tracking & Subtask System

Clicking any task opens the full-featured **Task Detail Drawer (`TaskDetailDrawer`)**.

### 8.1 Drawer Header & Actions
* **Task Key Badge:** Displays key (e.g., `FSV2-104`). Click to copy key.
* **Task Type Icon:** Story, Bug, Task, Epic, Subtask.
* **Title Input:** Direct editable task title.
* **Board & Placement Select (`PlacementSelect`):** Switch task board and target column directly from drawer.
* **Subtask State Select (`SubtaskStateSelect`):** For subtasks, quick dropdown to toggle status.
* **Delete Task button (`Trash2` icon):** Opens confirmation modal before removal.
* **Close Drawer button (`X` icon):** Closes drawer.

### 8.2 Drawer Tabs
1. **Details Tab:**
   * **Description Area:** Rich text / markdown editing.
   * **Plan Picker (`PlanPicker`):** Choose Phase, Epic, and Story parentage.
   * **Priority Dropdown:** Low, Medium, High, Critical.
   * **Assignee Selector:** Dropdown of team members with avatar and availability badges.
   * **Sprint Selector:** Assign task to active or planned sprint.
   * **Estimated Duration (`EstimateField`):** Duration input with units (Days, Weeks, Months).
   * **Effort Field (`EffortField`):** Planned work hours (effort minutes) compared against timer logs.
   * **Date Range Pickers:** Start Date & Due Date with calendar constraints.
   * **Tags / Labels:** Pill tags with remove button and add tag input.
   * **SRS Source Link:** If generated from SRS document, displays badge and section link.
   * **Subtasks Section (`CardSubtasks`):**
     * List of subtasks with inline completion checkboxes.
     * **"Add Subtask" form:** Subtask title, assignee, and date range inputs.
     * Prevents parent task from closing if subtasks remain incomplete (`useGuardedMove`).
   * **Live Time Log (`TimeLog`):**
     * **Live Timer Widget:** Displays active running duration (HH:MM:SS), blinking recording indicator.
     * **"Start Timer" / "Pause Timer" buttons:** Real-time web session time capture.
     * **"Log Manual Time" accordion:** Inputs for minutes, date worked, notes, and worker selection (for managers logging on behalf of team members).
     * **Session History Table:** List of sessions with duration, worker avatar, source (web, AI agent, manual), and auto-stop badges.
2. **Checklist Tab:**
   * Interactive checkboxes with strikethrough.
   * Progress bar showing completion percentage.
   * Add checklist item input + "Add" button.
3. **Progress Tab (`TaskProgress`):**
   * Combined progress visualization: Subtask progress + Checklist progress + Effort vs Worked time.
4. **Comments Tab:**
   * Chronological thread with author avatars, names, and relative timestamps.
   * Textarea with "Send Comment" button.
5. **Attachments Tab:**
   * Attached files list with file size and type icons.
   * "Upload Attachment" file input.
6. **Journey Tab (`TaskJourney`):**
   * Visual timeline showing the card moving between columns and boards.
   * Displays duration spent in each column, actor (human vs AI agent), and timestamps.

---

## 9. SRS Requirements Engineering & AI Task Generation

Located under `/projects/[id]/files`. Transforms raw specification documents into verified, trackable Kanban tasks.

### 9.1 Project Files Manager
* **"Upload Document" button:** Opens upload modal with category classification.
* **Document Categories:** `SRS` (Software Requirements Specification), `Test Report`, `Doc`, `Other`.
* **"Analyze Document" button (Sparkles icon):** Triggers simulated AI requirements extraction.

### 9.2 Review Generated Tasks Modal (`GeneratedTasksReviewModal`)
* **Review Counter:** Displays total generated tasks, accepted count, and rejected count.
* **Task Review Cards:**
  * Editable Title, Description, Acceptance Criteria, Priority, Story Points, and Tags.
  * Shows extracted "Source Section" from document.
  * **"Accept Task" button:** Approves task for project creation.
  * **"Reject Task" button:** Marks task rejected with optional rejection reason.
* **"Commit Accepted Tasks" button:** Bulk-creates all accepted tasks in the project backlog/board.

### 9.3 SRS Task History & Audit Modal (`SrsGeneratedTasksModal`)
* **Audit Trail Filter Tabs:** `All`, `Accepted`, `Edited & Accepted`, `Rejected`.
* **Search Input:** Filter by title, key, or source section.
* **Diff Comparison View:** Shows original AI-extracted text vs human-edited modifications.
* **Direct Task Link:** Click navigation to open created task in Task Detail Drawer.

---

## 10. AI Agent Hub (MCP Protocol & Work Sessions)

Accessible via `/ai-agents`. Connects external AI coding agents (Claude Code, OpenAI Codex, Gemini CLI, Google Antigravity) to FlashSign via Model Context Protocol.

### 10.1 Sub-Pages & Tabs (`HubTabs`)
* **How It Works (`/ai-agents/how-it-works`):** Architectural overview of the MCP server, tools exposed to agents (`list_tasks`, `start_task`, `log_time`, `finish_task`), and session guardrails.
* **Connect Wizard (`/ai-agents/connect`):**
  * **Agent Family Cards:** Select Claude Code, Codex, or Gemini / Antigravity.
  * **Step 1: Create Token:** Opens `CreateTokenDialog` (Token name, expiry: 30 days, 90 days, 1 year, no expiry). Displays full token once with copy button.
  * **Step 2: Save Token:** OS switcher (macOS, Linux, Windows PowerShell, CMD) with copyable shell export commands.
  * **Step 3: Connect Agent:** Copyable CLI setup commands (e.g., `claude mcp add flashsign`, `.agents/mcp_config.json` snippet, hooks scripts).
  * **Step 4: Check Connection button:** Simulates agent handshake ping; shows verified checkmark.
  * **Step 5: Sample Prompts:** Copyable prompt templates for testing agent commands.
* **My Tokens (`/ai-agents/tokens`):**
  * List of personal access tokens, creation date, expiry, last used agent client.
  * **"Revoke Token" button:** Immediately invalidates credentials.
* **Timesheet (`/ai-agents/timesheet`):**
  * Work sessions logged by AI agents. Shows task key, agent badge, duration, and end reason.
* **Organisation Settings (`/ai-agents/organisation`):**
  * Global toggle: Enable / Disable AI agent access.
  * Allowed Agents checkboxes: Claude Code, Codex, Gemini CLI, Antigravity.
  * Idle Timeout setting (minutes before automated session pause).
  * Day Cutoff Time (e.g., `20:00` auto-stop).
  * "Allow Claim Unassigned Tasks" toggle.
  * Blocked Project IDs (security boundary preventing sensitive projects from being read by AI).

---

## 11. Agreements, Electronic Signatures & Company Seals

### 11.1 Agreements Home Dashboard (`/agreements`)
* **KPI Metrics:** Sent, Drafts, Completed, Completion Rate %, In Progress, Needs My Action, Expiring Soon.
* **"Start an Agreement" Action Dropdown:**
  * `Get Signatures` (routes to `/signatures/new`).
  * `Sign a Document` (routes to `/signatures/new`).
  * `Use a Template` (routes to `/documents/templates`).
  * `New Document` (routes to `/documents/new`).
* **In-Flight Signatures Table:** Status badges, signer count, days remaining until expiration, "Sign Now" direct link.
* **Recent Drafts Table:** Resume editing unfinished drafts.

### 11.2 Signatures Inbox & Status Views (`/signatures/*`)
* Filter views: `/signatures/all`, `/waiting` (waiting for others), `/sent`, `/completed`, `/declined`, `/expired`.
* Search input by title and recipient.
* Cards show sender, recipient status badges, expiration date, and completion percentage.

### 11.3 5-Step Signature Request Wizard (`/signatures/new`)
1. **Step 1: Document Selection:** Choose existing document, contract, or enter request title.
2. **Step 2: Recipient Configuration:**
   * Add recipient form: Name, Email, Role.
   * Signing Order: **Sequential** (routing order 1, 2, 3) vs **Parallel** (all sign simultaneously).
   * Reorder recipients with Up/Down buttons.
3. **Step 3: Field Placement:**
   * Place fields on document pages: Signature, Initials, Date, Name, Text, Checkbox.
   * Assign fields to specific recipients.
4. **Step 4: Settings & Reminders:**
   * Expiration days preset (7, 14, 30, 60, 90 days).
   * Automated reminder frequency: Daily, Every 2 Days, Every 3 Days, Weekly, Never.
   * Custom email subject and message body.
5. **Step 5: Review & Send:**
   * Pre-send verification summary.
   * **"Send Signature Request" button:** Activates request, transitions signers to `pending`, dispatches notifications.

### 11.4 Signature Request Detail & Management (`/signatures/[requestId]`)
* **Progress Bar:** Ratio of completed signers to total signers.
* **Signers List:** Shows status per signer (Waiting, Pending, Viewed, Signed, Declined).
* **"Send Reminder" button:** Sends immediate notification ping to pending signers.
* **"Copy Signing Link" button:** Copies direct simulation link to clipboard.
* **"Cancel Request" button:** Voids the signature envelope.

### 11.5 Interactive Signing Experience (`/signatures/sign/[requestId]`)
* **Signer Persona Switcher:** Allows toggling recipient identity during simulation.
* **Document Reading Canvas:** Displays document text and placed signing fields.
* **Interactive Signature Editor Modal (`SignatureEditor`):**
  * **Type Tab:** Choose between 4 font styles: Formal, Script, Bold, Elegant.
  * **Draw Tab:** Canvas drawing area with pen width and "Clear" eraser button.
  * **Upload Tab:** File upload for scanned signatures (PNG, JPG).
  * **"Save as my default signature" checkbox:** Updates user's saved profile signature.
* **Company Seal Selector:** Choose an authorized corporate seal image.
* **Consent Checkbox:** "I agree to use electronic records and signatures."
* **"Sign & Complete" button:** Burns signature and seal into document, marks signer `signed`, advances routing order.
* **"Decline to Sign" button:** Opens modal with mandatory decline reason input.

### 11.6 Agreements Settings & Company Seals (`/signatures/settings`)
* **Default Settings:** Default expiration days, reminder frequency, and allowed signature methods.
* **Company Seals Registry (`CompanySeals`):**
  * List of corporate seals with usage counters and creator name.
  * **"Add Company Seal" button:** Upload PNG/SVG seal image, title, description, and assign authorized roles (`DemoRole`).
  * Edit and Delete seal actions.

---

## 12. Contract Lifecycle Management (`/contracts`)

### 12.1 Contracts Overview & Views (`/contracts/*`)
* Filter tabs: `All`, `Active`, `Pending Review`, `Awaiting Signature`, `Expiring`, `Completed`, `Archived`.
* Metric Cards: Total Active Value ($), Contracts Expiring in 30 Days, Pending Approvals.
* **"Create Contract" button:** Routes to `/contracts/new`.

### 12.2 Contract Creation (`/contracts/new`)
* Inputs: Title, Contract Type (MSA, SOW, NDA, Software License, Vendor Contract, etc.), Counterparty Name, Contract Value ($), Effective Date, Expiry Date, Renewal Type (Auto, Manual, None), Payment Terms, Special Conditions, Reviewer selection.

### 12.3 Contract Detail Hub (`/contracts/[contractId]`)
Six tabs governing contract progression:
1. **Overview Tab:** Contract commercial terms, value, timeline dates, and status badge.
2. **Document Tab:** Markdown contract body, download contract markdown button.
3. **Parties Tab:** Internal owner, external counterparty, assigned legal reviewers.
4. **Review Tab:** Review discussion thread, **"Submit for Review" button**, **"Request Changes" button**, and **"Approve Contract" button**.
5. **Signature Tab:** Linked signature request status and direct link to sign.
6. **Audit Tab:** Event history of contract creation, reviews, approvals, and signatures.

---

## 13. Document Repository & Template System (`/documents`)

### 13.1 Document Browser (`/documents/all`, `/folders`, `/templates`)
* **Folder Navigation:** Hierarchical folder tree; create folder, rename, and delete folder actions.
* **Document Cards & Rows:** File size, pages, document type badge (PDF, DOCX, Agreement, SOW, NDA), favorite star.
* **"Upload Document" button:** Opens `UploadDemoDialog` (drag-and-drop, title, folder picker, project picker).

### 13.2 Document Detail View (`/documents/[documentId]`)
* **Document Viewer:** Content display with markdown preview.
* **Action Bar:**
  * **"Move to Folder" button:** Opens `MoveFolderDialog`.
  * **"Favorite" toggle:** Adds/removes star.
  * **"Duplicate" button:** Clones document.
  * **"Download" button:** Exports markdown file.
  * **"Archive" / "Delete" buttons.**
* **Tabs:**
  * `Preview`: Document content.
  * `Versions`: Version history list with **"Restore Version" button**.
  * `Comments`: Document review feedback thread.

### 13.3 Document Templates (`/documents/templates`)
* Categories: Contracts, Legal, Sales, Project Management, HR, Procurement, General.
* Template Cards show title, description, and placeholder tags (e.g., `{{client_name}}`, `{{effective_date}}`).
* **"Preview Template" button:** Opens `TemplatePreviewDialog`.
* **"Use Template" button:** Instantiates a new document prepopulated with template text.

---

## 14. Approval Center (`/approvals`)

* **"Awaiting Your Action" Section:**
  * Cards showing document title, requesting user, and relative time.
  * **"Approve" button:** Resolves approval requirement; advances document to `approved` when all reviewers pass.
  * **"Reject" button:** Rejects document with feedback comment.
  * **"Add Comment" field:** Optional notes accompanying approval decision.
* **"All Pending Approvals" Section:** Managerial view of all approvals across the organization.

---

## 15. Team Collaboration, Availability & Planner

### 15.1 Availability Board (`/planner/availability`)
* **View Modes:** Day View vs 5-Day Working Week View.
* **Offset Navigation:** Previous Week (`ChevronLeft`) and Next Week (`ChevronRight`).
* **Filter Controls:** Filter by Team, Availability Status (Available, Busy, Focus Time, Out of Office), and Search Query.
* **Schedule Grid:** Shows each member's daily schedule, booked meetings, approved time-off, and focus hours.
* **Status Override:** Quick dropdown to update current availability status.

### 15.2 Master Calendar (`/planner/calendar`)
* Displays unified view of: Task Deadlines, Milestone Targets, Scheduled Meetings, Time Off, and Planning Reminders.
* Category filter checkboxes to toggle event layers.
* **"New Event" button:** Opens `CreateCalendarEventDialog`.

### 15.3 Meetings Management (`/planner/meetings`)
* **"Schedule Meeting" button:** Opens `CreateMeetingDialog` (Title, Date, Start/End Time, Organizer, Attendees, Team, Project, Agenda items, Meeting URL link).
* Meeting cards show participant avatars and countdown timer.
* Clicking meeting opens **`MeetingDetailDrawer`** with agenda checklist and direct meeting join button.

### 15.4 Time Off & Leave Requests (`/planner/time-off`)
* **"Request Time Off" button:** Opens `CreateTimeOffDialog` (Leave type: Vacation, Sick, Personal, Parental, Unpaid; Start/End Dates; Partial day toggle; Reason).
* Tabbed views: Pending Requests, Approved Leaves, History.
* Managerial actions: **"Approve" button** and **"Decline" button**.

### 15.5 Team Analytics & Directory (`/teams`, `/teams/directory`, `/teams/members`)
* **Analytics Dashboard (`/teams`):**
  * Capacity Utilization: Highlights members near or over 100% weekly capacity.
  * Task Flow Chart & Task Status by Member.
  * **"Post Announcement" button:** Opens `CreateAnnouncementDialog` (Title, Content, Audience, Priority, Pin to top).
* **Teams Directory (`/teams/directory`):** Team cards showing Team Lead, member count, assigned projects, and "Create Team" dialog.
* **Members Directory (`/teams/members`):**
  * Member cards with role badges, department, skills pills, and weekly capacity.
  * **"Invite Member" button:** Opens `InviteMemberDialog`.
  * **Pending Invitations Table:** Copy invite link, Resend email invitation, Revoke invitation.

---

## 16. Reports & Business Intelligence (`/reports`)

### 16.1 Organization Reports Overview (`/reports`)
* Executive KPI summary: Active Projects, Average Completion %, Documents Signed, Total AI Runs.
* Recharts visual graphs: Task Completion Velocity (Area), Project Health (Pie), Document Status (Bar).

### 16.2 Task Time Report (`/reports/task-time`)
* Focuses on actual execution efficiency from **In Progress → In Review**.
* **Metrics:**
  * "Worked Time" (actual running timer minutes, excluding pauses and idle cutoffs).
  * "Calendar Time" (calendar duration from start to review).
  * "Planned Effort" vs "Actual Worked" comparison with `+XX%` overage or `-XX%` savings badges.
* **Subtask Time Breakdown:** Expandable rows showing parent task totals and individual subtask contributions.
* **Filters:** Filter by Project, Worker/Person, Status (Reviewed vs In Progress).
* **"Export Report" button:** Downloads time report CSV.

### 16.3 Project Timeline & Baseline Report (`TimelineReport`)
* **Baseline Comparison:** Compares Original Baseline Start/End dates with Current Calculated Timeline.
* **Pace Indicator:** Visual indicator displaying whether project is `Ahead`, `On Pace`, or `Behind`.
* **Late Drivers Panel:** Highlights specific tasks and subtasks driving project delivery delays with responsible assignees.
* **Checkpoint Statuses:** Milestone health indicators (`Achieved`, `On Track`, `At Risk`, `Missed`).
* **Visual Plan Gantt Chart:** Bars comparing planned vs forecast durations across Phases, Epics, Stories, and Tasks.

---

## 17. Settings & Organization Administration (`/settings`)

### 17.1 User Settings
* **Profile (`/settings/profile`):** Full name, email, avatar color/initials, job title, department, company, phone, physical address, timezone, weekly work capacity (hours), skills tags. Save changes button.
* **My Signature (`/settings/signature`):** Personal default signature & initials builder using `SignatureEditor`. Type, Draw, or Upload with preview mark.
* **Preferences (`/settings/preferences`):** Theme toggle (Light/Dark), default landing view, time formatting, calendar start day (Monday/Sunday).
* **Notifications (`/settings/notifications`):** Email notifications toggle, desktop push alerts, task assignment pings, deadline warning threshold.
* **Security (`/settings/security`):** Password change inputs, active session manager with "Revoke All Other Sessions" button.

### 17.2 Organization Administration (`/settings/users`)
* Restricted to Admin / CEO roles via `canManageUsers`.
* **User Management Table:** List all workspace members, edit assigned demo role, activate / deactivate user accounts.

---

## 18. State Machines & Transition Rules Reference

### 18.1 Task Lifecycle State Machine
```
[ Backlog / To Do ]
       │
       ▼ (Drag to In Progress / Start Timer)
[ In Progress ] ──(Pause Timer)──► [ In Progress (Paused) ]
       │
       ▼ (Drag to In Review / Agent Finish)
[ In Review ]
       │
       ▼ (Approve / Verification Passed)
[ Done ] ◄── (Guarded: all subtasks must be Done)
       ▲
       └── (Blocked: marked with impediment reason)
```

### 18.2 Signature Envelope State Machine
```
[ Draft ]
   │
   ▼ (Send Request / Sequential or Parallel)
[ Sent ] ──► [ Viewed ] ──► [ Partially Signed ]
   │                               │
   │ (Any signer declines)         ▼ (Last signer completes)
   ├──► [ Declined ]          [ Completed ]
   │
   └──► (Past expiry date) ──► [ Expired ]
```

### 18.3 Work Session Timer Automation Rules
1. **Drag into In Progress:** Automatically creates `WorkSession` with `source: 'web'`.
2. **Single Active Timer Rule:** Starting a timer on Task B automatically pauses Task A with `endReason: 'switched_task'`.
3. **Move to Review / Done:** Automatically terminates timer with `endReason: 'finished'`.
4. **Subtask Container Rule:** Moving a parent task with subtasks does NOT start a timer on the parent; work timers run exclusively on individual subtasks.
5. **Idle Cutoff Rule:** Sessions exceeding configured idle threshold are flagged `needsReview` with `endReason: 'idle_timeout'`.
6. **Day Cutoff Rule:** Sessions running past configured day cutoff (e.g. 20:00) auto-stop with `endReason: 'day_cutoff'`.

