# FlashSign database: data dictionary

A column-by-column explanation of the database schema in [`schema.txt`](schema.txt): **86 tables, 723 columns**.
For every column it says **why it's there**, **which requirement it comes from**, **where it shows in the frontend**, and **why it has that data type**.

This document describes `schema.txt` exactly as it is now. It does not change it. Where a column looks wrong or inconsistent, that is noted in its row and listed under "Issues" at the end of each slice.

## How to read it

Each table has a short summary, then one row per column:

| Heading | Meaning |
|---|---|
| **Column / Type / Key** | As written in `schema.txt`. Key: `pk` = primary key, `fk → table` = foreign key to that table. |
| **Why it's there** | What the column records and what would break without it. |
| **Requirement source** | Where the requirement comes from: an ID in the SRS v4.0, or the prototype's data type when the SRS says nothing. |
| **Where it shows in the frontend** | The screen or component that shows or edits it. Paths are relative to `flash-sign-proto/src/`. "Not shown in the UI" means it is used behind the scenes. |
| **Why this data type** | Why that type fits the values the column holds. |

**Requirement IDs** come from `FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx` (in `New folder/`):

| ID looks like | Where in the SRS |
|---|---|
| `FR-AUTH-001`, `FR-SIGN-014`, … | Section 4: functional requirements |
| `NFR-SEC-001`, `NFR-INT-002`, … | Section 6: non-functional requirements |
| Entity 1–11 | Section 7: data dictionary |
| `BR-01` … `BR-11` | Section 9: business rules |
| `GAP-…`, `DEC-…` | Sections 11 and 12A: gaps and decisions |
| `REQ-PRJ-…`, `REQ-AGR-…`, `REQ-AI-…`, `NFR-0xx` | Annex B: detailed specification |
| `ACL-…`, `ORG-…`, `WI-…`, `DOC-…`, `DATA-…`, … | Annex C: project-management requirements |

**Data types used:**

| Type | Holds | Used for |
|---|---|---|
| `uuid` | A 128-bit random id | Primary keys (can be created on any server, can't be guessed) and the foreign keys pointing to them |
| `bigserial` / `int` / `bigint` | Auto-numbered or whole numbers | Currently only `stored_file`'s key and the links to it (see the issues below) |
| `varchar` | Short text | Names, emails, URLs, codes, and status words from a fixed list of allowed values |
| `text` | Long text | Descriptions, messages, document content, notes |
| `boolean` | Yes or no | Flags such as `is_read`, `is_required` |
| `integer` | Whole numbers | Counts, positions, minutes |
| `decimal` | Exact numbers with decimals | Money, percentages, field positions on a page |
| `date` | A calendar day | Start and due dates |
| `time` | A time of day | Working hours, meeting times |
| `timestamp` | An exact moment | When something happened (`created_at`, `signed_at`, …) |

## Most important issues to fix in `schema.txt`

Each slice's full list is at the end of that slice. These affect the whole schema:

1. **The `team` table was removed, but three tables still point to it:** `team_project.team_id`, `calendar_event.team_id` and `meeting.team_id`. Either bring `team` back (teams are only hidden by a feature flag) or remove these links.
2. **`stored_file`'s key no longer matches the links to it.** `stored_file_id` is now `bigserial`, but `organization.logo_file_id` and `users.avatar_file_id` are `int`, and nine other file links are `uuid`. All must use the same type. The header of `schema.txt` also still says every table has a uuid key.
3. **Active / suspended / removed became a yes/no column.** `org_member.is_active` is a boolean, but its note still lists three states, and Annex C ACL-01 needs all three. `users.is_active` also exists, and the difference between the two isn't defined.
4. **Removed columns the frontend still uses:**
   - `users`: time zone, avatar colour, company, and `deleted_at` (needed to record account anonymisation).
   - `organization`: company size.
   - `stored_file`: file type (MIME).
5. **Values stored twice, or stored when they can be calculated:**
   - `task.status` repeats its column's stage.
   - `project.health` is stored even in automatic mode.
   - `time_off_request.duration_days` can be worked out from the dates.
   - `signing_token.expires_at` copies the request's expiry.
   - `project.status = archived` and `archived_at` say the same thing.
6. **Rules the database doesn't enforce yet:**
   - one main board per project
   - one active sprint per project
   - one running work session per person
   - one pending invitation per email per organisation
   - no duplicate tags
   - unique option and method lists
7. **SRS requirements with no column:**
   - the final signed PDF and its hash (REQ-AGR-061)
   - signing evidence: user agent, consent time, event hash chain (REQ-SGN-008, REQ-AGR-063/064)
   - a decline reason for time off (FR-TEAM-003)
   - `updated_at` on several editable tables

## Contents

**Slice 0 — Shared**

[`stored_file`](#stored_file) · [`activity_log`](#activity_log) · [`notification`](#notification) · [`integration`](#integration)

**Slice 1 — Organisations, users and sign-in**

[`organization`](#organization) · [`users`](#users) · [`role`](#role) · [`org_member`](#org_member) · [`org_member_skill`](#org_member_skill) · [`session`](#session) · [`invitation`](#invitation) · [`verification_code`](#verification_code) · [`user_preference`](#user_preference) · [`user_notification_setting`](#user_notification_setting)

**Slice 2 — Project structure**

[`project`](#project) · [`project_member`](#project_member) · [`team_project`](#team_project) · [`project_tag`](#project_tag) · [`project_goal`](#project_goal) · [`user_favorite_project`](#user_favorite_project) · [`user_recent_project`](#user_recent_project) · [`baseline_change`](#baseline_change) · [`board`](#board) · [`board_column`](#board_column) · [`phase`](#phase) · [`epic`](#epic) · [`story`](#story) · [`sprint`](#sprint)

**Slice 3 — Tasks and time**

[`task`](#task) · [`task_tag`](#task_tag) · [`task_comment`](#task_comment) · [`task_checklist_item`](#task_checklist_item) · [`task_attachment`](#task_attachment) · [`task_status_change`](#task_status_change) · [`work_session`](#work_session)

**Slice 4 — Planning and team**

[`calendar_event`](#calendar_event) · [`calendar_event_attendee`](#calendar_event_attendee) · [`meeting`](#meeting) · [`meeting_participant`](#meeting_participant) · [`meeting_agenda_item`](#meeting_agenda_item) · [`time_off_request`](#time_off_request) · [`announcement`](#announcement) · [`announcement_read`](#announcement_read)

**Slice 5 — Documents**

[`document_folder`](#document_folder) · [`document`](#document) · [`document_version`](#document_version) · [`document_comment`](#document_comment) · [`document_share`](#document_share) · [`user_favorite_document`](#user_favorite_document) · [`user_recent_document`](#user_recent_document) · [`document_approval`](#document_approval) · [`document_template`](#document_template) · [`document_template_placeholder`](#document_template_placeholder) · [`user_favorite_template`](#user_favorite_template) · [`project_file`](#project_file) · [`contract`](#contract) · [`contract_review_comment`](#contract_review_comment)

**Slice 6 — E-signature**

[`signature_request`](#signature_request) · [`signature_request_file`](#signature_request_file) · [`signer`](#signer) · [`copy_recipient`](#copy_recipient) · [`reviewer`](#reviewer) · [`signature_field`](#signature_field) · [`signature_field_option`](#signature_field_option) · [`signing_token`](#signing_token) · [`signature_request_event`](#signature_request_event) · [`outbound_email`](#outbound_email) · [`saved_signature`](#saved_signature) · [`signing_default`](#signing_default) · [`signing_default_method`](#signing_default_method) · [`company_seal`](#company_seal) · [`company_seal_allowed_role`](#company_seal_allowed_role) · [`company_seal_use`](#company_seal_use)

**Slice 7 — AI agents (Phase 2)**

[`agent_access_token`](#agent_access_token) · [`agent_token_usage`](#agent_token_usage) · [`agent_event`](#agent_event) · [`agent_setting`](#agent_setting) · [`agent_setting_allowed_agent`](#agent_setting_allowed_agent) · [`agent_blocked_project`](#agent_blocked_project) · [`agent_provider`](#agent_provider) · [`agent_provider_scope`](#agent_provider_scope) · [`agent_run`](#agent_run) · [`agent_run_event`](#agent_run_event) · [`agent_run_check`](#agent_run_check) · [`srs_task_candidate`](#srs_task_candidate) · [`srs_task_candidate_tag`](#srs_task_candidate_tag)

---

## Slice 0 — Shared

### `stored_file`

**What it stores:** One row per file kept in object storage (uploaded PDFs, profile photos, logos, signature images, project files). The file itself is not in the database; this row says where it is and what it is.
**In the prototype today:** `PdfAttachment` in `types/documents.ts` (fileId, name, sizeBytes, pageCount) with the bytes in the browser's IndexedDB (`lib/pdf/file-store.ts`, database `flashsign-demo-files`). Profile photos are a data URL in `User.avatar` (`types/index.ts`); project files are `ProjectFile` in `types/index.ts` (size is a display string, no bytes).
**Main screens:** `app/(workspace)/signatures/upload/page.tsx` (PDF upload), `app/(workspace)/documents/[documentId]/page.tsx` (PDF viewer), `app/(workspace)/projects/[projectId]/files/page.tsx`, `app/(workspace)/settings/profile/page.tsx` (photo), `app/(workspace)/settings/signature/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `stored_file_id` | bigserial | pk | Identifies the file row; other tables point here. | Annex B logical data model (StoredFile); REQ-DOC-007 (today a generated fileId) | Not shown in the UI. Today's equivalent is `PdfAttachment.fileId`, used by `lib/pdf/file-store.ts` to load bytes. | Auto-numbered 64-bit whole number. PROBLEM: the schema rule says every table has a uuid primary key, and most file links (e.g. `pdf_file_id`, `signature_file_id`, `image_file_id`) are uuid, while `organization.logo_file_id` and `users.avatar_file_id` are int. None of these match bigserial. Sequential ids are also guessable, which matters if an id ever appears in a download URL (DATA-07). |
| `organization_id` | uuid | fk → organization | Every file belongs to one organisation, so one tenant can never read another's files. | DATA-01; Annex B convention "orgId is on every top-level table" | Not shown in the UI (the prototype has one organisation per browser). | uuid because it points to `organization.organization_id`, which is uuid. |
| `uploaded_by_user_id` | uuid | fk → users | Who uploaded the file, for audit and for "uploaded by" labels. | Annex B StoredFile (uploadedBy) | `ProjectFile.uploadedBy` shows on `app/(workspace)/projects/[projectId]/files/page.tsx`. | uuid to match `users.user_id`. |
| `storage_key` | varchar | unique | The path/key of the object in object storage. Unique so two rows never claim the same object. | REQ-DOC-012; DATA-07; Annex B StoredFile (storageKey) | Not shown in the UI. Today the IndexedDB key plays this part (`lib/pdf/file-store.ts`). | Short generated text (a path), so varchar. |
| `file_name` | varchar | | The original file name shown to people. | REQ-DOC-006 (failures listed by file name); DATA-08 (validate filename) | `PdfAttachment.name`, shown in the upload wizard `app/(workspace)/signatures/upload/page.tsx` and in Documents lists. | Short text, so varchar. |
| `size_bytes` | bigint | | File size, used for the 5 MB check and for showing size. The schema rule says size is read from here, not copied into other tables. | REQ-DOC-002 (5 MB limit, `MAX_PDF_BYTES` in `lib/pdf/file-store.ts`); DATA-08 | `PdfAttachment.sizeBytes`, shown in the upload wizard and document details. | Whole number of bytes. bigint so very large files (over 2 GB) still fit. |
| `page_count` | integer | | Number of pages, for PDFs only (empty for other files). Read once at upload. | REQ-DOC-005 ("The page count is read at upload") | `PdfAttachment.pageCount`, used by the PDF viewer and field placement (`components/pdf/`). | A small count, so integer. |
| `sha256` | varchar | | Fingerprint of the file. If one byte changes, the fingerprint changes, so tampering can be detected. | REQ-DOC-012; REQ-AGR-060; REQ-AGR-061; NFR-023 | Not shown in the UI yet (REQ-AGR-060 asks to show it on the request summary page). | A SHA-256 hash is a fixed 64-character hex string, so varchar. |
| `created_at` | timestamp | | When the file was stored. No `updated_at` because a stored file is never edited in place. | Annex B StoredFile ("never edited in place") | `ProjectFile.createdAt` shows on the project Files page. | An exact moment, so timestamp. |

### `activity_log`

**What it stores:** An append-only list of what happened: who did what to which record, and when. It feeds the activity feeds and the audit view.
**In the prototype today:** `AuditLog` in `types/index.ts` (actorId, actorName, action, resource, resourceId, detail, ipAddress, timestamp), held as `auditLogs` in `context/app-context.tsx` (lost on reload, see REQ-PLT-005).
**Main screens:** `app/(workspace)/activity/page.tsx`, the "Recent activity" box on `app/(workspace)/projects/home/page.tsx`, `app/(workspace)/projects/[projectId]/activity/page.tsx`, `app/(workspace)/teams/activity/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `activity_log_id` | uuid | pk | Identifies one log entry. | Annex B ActivityLog; NFR-07 (immutable identifiers) | Not shown in the UI (`AuditLog.id` is only a React key). | uuid, the project-wide primary key type. |
| `organization_id` | uuid | fk → organization | Keeps each organisation's log separate. | DATA-01; Annex B ActivityLog (orgId) | Not shown in the UI. | uuid to match `organization.organization_id`. |
| `actor_user_id` | uuid | fk → users | Who did it. Empty for system actions (e.g. a scheduled reminder). The name is read through this link, not copied. | FR-REP-006 (actor attribution); ACL-10 (record who acted); NFR-07 | Actor name on `app/(workspace)/activity/page.tsx` (today from `AuditLog.actorName`). | uuid to match `users.user_id`; may be empty. |
| `action` | varchar | | What happened, as a dotted code such as `task.status.changed`, `document.signed`, `integration.sync`. | FR-REP-006 (action identifiers); REQ-PLT-005 | Shown as the action text on `app/(workspace)/activity/page.tsx`. | Short code from an app-level list, so varchar (new actions need no schema change). |
| `resource_type` | varchar | | What kind of record was touched (project, task, document, ...). Together with `resource_id` it links to the record. | FR-REP-006 (Resource Type); FR-TEAM-006 (resource chip) | Shown next to the action on `app/(workspace)/activity/page.tsx` (`AuditLog.resource`). | Short category word from an app-level list, so varchar. |
| `resource_id` | uuid | | The id of the touched record. Not a foreign key because it can point to many different tables. | FR-REP-006 (Resource ID) | Not shown as text; `AuditLog.resourceId` is kept in `context/app-context.tsx`. | uuid because record ids are uuid. PROBLEM: a `stored_file` row (bigserial id) could not be referenced here. |
| `detail` | text | | A readable sentence about the change (e.g. "GitHub sync, 3 repos updated"). | FR-TEAM-006 (action description) | Shown after the action on `app/(workspace)/activity/page.tsx`. | Free text of any length, so text. |
| `ip_address` | varchar | | The address the request came from, for security review. | FR-REP-006 (Client IP Address); REQ-SGN-008; NFR-026 (personal data, used only for audit) | Shown as "IP ..." on `app/(workspace)/activity/page.tsx`. | Short text that fits both IPv4 and IPv6, so varchar. |
| `created_at` | timestamp | | When it happened. No `updated_at`: entries are never changed. | Annex B ActivityLog ("Append-only"); FR-REP-006 | Relative time ("2 hours ago") on `app/(workspace)/activity/page.tsx` (`AuditLog.timestamp`). | An exact moment, so timestamp. |

### `notification`

**What it stores:** Messages for one person in one organisation, shown under the bell in the top bar.
**In the prototype today:** `Notification` in `types/index.ts` (userId, title, body, type, isRead, link, createdAt), held as `notifications` in `context/app-context.tsx`.
**Main screens:** the bell menu in `components/layout/app-header.tsx`; the full list at `app/(workspace)/teams/notifications/page.tsx` ("View all notifications").

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `notification_id` | uuid | pk | Identifies one notification (needed to mark it read). | Annex B logical data model (Notification) | Not shown; used by `markNotificationRead` in `context/app-context.tsx`. | uuid, the project-wide primary key type. |
| `organization_id` | uuid | fk → organization | A person can be in several organisations; this keeps notifications in the right one. | DATA-01; ORG-01 (users may join more than one organisation) | Not shown in the UI. | uuid to match `organization.organization_id`. |
| `user_id` | uuid | fk → users | Who the notification is for. | Annex B Notification (userId); COL-04 | Not shown; `useNotifications()` in `context/app-context.tsx` filters by it. | uuid to match `users.user_id`. |
| `type` | varchar | | The area it is about: task / document / agent / approval / system. Picks the icon and the filter. | Annex B Notification (type); COL-04 | Icon and type filter on `app/(workspace)/teams/notifications/page.tsx`. | Fixed list of words kept in the app, so varchar. |
| `title` | varchar | | Short headline. | Annex B Notification (title) | Bold line in the bell menu (`components/layout/app-header.tsx`). | Short text, so varchar. |
| `body` | text | | The longer message. | Annex B Notification (body) | Second line in the bell menu and on the notifications page. | Message of any length, so text. |
| `link` | varchar | | Where to go when the person opens it (e.g. a task or request page). | Annex B Notification (link) | "View" link on `app/(workspace)/teams/notifications/page.tsx`. | An in-app path or URL, short text, so varchar. |
| `is_read` | boolean | | Whether the person has seen it; drives the unread count and highlight. | Annex B Notification (isRead) | Unread badge and highlighted rows in `components/layout/app-header.tsx`; "Mark as read" on the notifications page. | Yes/no, so boolean. |
| `created_at` | timestamp | | When it was raised; lists are sorted by it. | Annex B convention (createdAt) | Relative time in the bell menu. | An exact moment, so timestamp. |

### `integration`

**What it stores:** An outside service connected to the organisation (GitHub, a calendar, an AI provider, storage, chat).
**In the prototype today:** `Integration` in `types/index.ts` (name, category, status, connectedBy, connectedAt, logoUrl, description). Sample rows are `MOCK_INTEGRATIONS` in `data/mock-data.ts`, but no screen reads them.
**Main screens:** Not shown in the UI. (The AI Agent Hub at `app/(workspace)/ai-agents/page.tsx` uses agent tokens, not this table.)

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `integration_id` | uuid | pk | Identifies one connection. | API-02 (versioned contracts for integrations) | Not shown in the UI. | uuid, the project-wide primary key type. |
| `organization_id` | uuid | fk → organization | Connections belong to one organisation. | DATA-01 (integration records keep the organisation boundary) | Not shown in the UI. | uuid to match `organization.organization_id`. |
| `connected_by_user_id` | uuid | fk → users | Who connected it. An integration may never have more rights than this person. | ACL-11 (integration scope within the delegating user's permissions) | Not shown in the UI (`Integration.connectedBy`). | uuid to match `users.user_id`. |
| `name` | varchar | | Display name, e.g. "GitHub". | No SRS requirement; from `Integration.name` (`types/index.ts`) | Not shown in the UI. | Short text, so varchar. |
| `category` | varchar | | vcs / calendar / ai / storage / communication, for grouping. | COL-10 (Slack, Teams, calendar as separate integrations) | Not shown in the UI (`Integration.category`). | Fixed list of words kept in the app, so varchar. |
| `status` | varchar | | connected / disconnected / error, so admins can see broken connections. | REP-04 (integration health); UX-07 (connection failure) | Not shown in the UI (`IntegrationStatus` in `types/index.ts`). | Fixed list of words kept in the app, so varchar. |
| `description` | text | | What the connection does. | No SRS requirement; from `Integration.description` | Not shown in the UI. | Free text, so text. |
| `connected_at` | timestamp | | When it was connected. | REP-04 (last successful update; related) | Not shown in the UI (`Integration.connectedAt`). | An exact moment, so timestamp. |

## Slice 1 — Organisations, users and sign-in

### `organization`

**What it stores:** One row per organisation (workspace), the top-level boundary that owns all projects, documents and members, plus its working calendar settings.
**In the prototype today:** `DemoWorkspace` in `types/demo-auth.ts` (name, slug, description, type, industry, website, accentColor, ownerId) and `Organization` in `types/index.ts` (plan, logoUrl). Working-time settings come from `CollaborationSettings` in `types/collaboration.ts`.
**Main screens:** `app/onboarding/create-organization/page.tsx`, `app/workspace/new/page.tsx`, `app/workspace/page.tsx` (cards from `components/workspace/workspace-card.tsx`), `app/onboarding/complete/page.tsx`, `app/(workspace)/settings/preferences/page.tsx` (working hours, week start, time zone, workload threshold).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `organization_id` | uuid | pk | Identifies the organisation; nearly every other table points here. | Section 7 Entity 2 (id); ORG-01 (isolation boundary); DATA-01 | Not shown in the UI (`DemoWorkspace.id`, e.g. `ws-flash`). | uuid, the project-wide primary key type. |
| `owner_user_id` | uuid | fk → users | The person who created the organisation and is its primary administrator. | ORG-01 (primary administrator); FR-AUTH-003 | Not shown directly; `DemoWorkspace.ownerId` is used by `login` in `context/demo-auth-context.tsx` to find the owner's workspace. | uuid to match `users.user_id`. |
| `logo_file_id` | int | fk → stored_file | The company logo image. | FR-SETT-001 (logo); Section 7 Entity 2 (logoUrl) | Not shown in the UI (`Organization.logoUrl` is never read; cards show initials instead). | PROBLEM: int does not match `stored_file.stored_file_id` (bigserial is 64-bit, int is 32-bit), and other file links in the schema are uuid. It should be the same type as the key it points to. |
| `name` | varchar | | The organisation's display name. | FR-AUTH-003 (Step 1); FR-SETT-001; Section 7 Entity 2 | Entered on `app/onboarding/create-organization/page.tsx` and `app/workspace/new/page.tsx`; shown on `components/workspace/workspace-card.tsx` and `app/onboarding/complete/page.tsx`. | Short text, so varchar. |
| `slug` | varchar | unique | The URL-safe name (e.g. `acme-digital`). Unique so two organisations never share an address. | FR-SETT-001 (slug URL-safe and unique); Section 7 Entity 2 | "Workspace URL" on `app/onboarding/create-organization/page.tsx`; duplicate check in `createOrganization` (`context/demo-auth-context.tsx`); 2 to 50 characters in `lib/auth-validation.ts`. | Short text, so varchar. |
| `description` | text | | A short "about" line. | No SRS requirement; from `DemoWorkspace.description` | Entered on `app/onboarding/create-organization/page.tsx`; shown on `components/workspace/workspace-card.tsx`. | Free text, so text. |
| `type` | varchar | | Kind of organisation (e.g. Software Development, Consulting). | No SRS requirement; from `DemoWorkspace.type` | Chosen on `app/workspace/new/page.tsx`; shown on `components/workspace/workspace-card.tsx` and `app/onboarding/complete/page.tsx`. | A word from a list kept in the app, so varchar. |
| `industry` | varchar | | Industry category (e.g. Software and Technology). | FR-AUTH-003 (Step 1: Industry); FR-SETT-001 | Chosen on `app/onboarding/create-organization/page.tsx`. | A word from a list kept in the app, so varchar. |
| `website` | varchar | | Company website. | FR-AUTH-003 (Step 1: Website) | Entered on `app/onboarding/create-organization/page.tsx`. | A URL, short text, so varchar. |
| `accent_color` | varchar | | Brand colour for the organisation badge. | No SRS requirement; from `DemoWorkspace.accentColor` | Picked on `app/workspace/new/page.tsx` (`PRESET_AVATAR_COLORS`); used as the badge colour on `components/workspace/workspace-card.tsx` and `app/onboarding/complete/page.tsx`. | A hex code like `#00c2a8`, so varchar. |
| `plan` | varchar | | Subscription tier: starter / pro / enterprise. | FR-SETT-001; Section 7 Entity 2 (plan) | Not shown in the UI (the sidebar workspace switcher that showed it is commented out in `components/layout/app-sidebar.tsx`). | Fixed list of words kept in the app, so varchar. |
| `timezone` | varchar | | The organisation's time zone, used to show times and count working days. | ORG-01 (timezone); DATA-04 (store UTC, display in user or organisation timezone) | Timezone select on `app/(workspace)/settings/preferences/page.tsx` (`CollaborationSettings.timeZone`). | A zone name like `Europe/London`, so varchar. |
| `working_hours_start` | time | | When the work day starts. | ORG-01 (working calendar) | "Work Day Start" on `app/(workspace)/settings/preferences/page.tsx` (`CollaborationSettings.workingHoursStart`). | A clock time with no date, so time. |
| `working_hours_end` | time | | When the work day ends. | ORG-01 (working calendar) | "Work Day End" on `app/(workspace)/settings/preferences/page.tsx` (`CollaborationSettings.workingHoursEnd`). | A clock time with no date, so time. |
| `week_start_day` | varchar | | Whether calendars start on sunday or monday. | ORG-01 (working calendar; related) | "Week Start Day" on `app/(workspace)/settings/preferences/page.tsx` (`CollaborationSettings.weekStartDay`). No other screen reads it yet. | Fixed list of two words kept in the app, so varchar. |
| `workload_threshold_hours` | integer | | Weekly hours above which a member is flagged "At Capacity". | No exact SRS requirement (FR-REP-004 uses percentages of capacity); from `CollaborationSettings.workloadThresholdHours` | Slider (30 to 50) on `app/(workspace)/settings/preferences/page.tsx`. No other screen reads it yet. | Whole hours, so integer. |
| `created_at` | timestamp | | When the organisation was created. | Section 7 Entity 2 (createdAt) | Not shown in the UI (`DemoWorkspace.createdAt`). | An exact moment, so timestamp. |
| `updated_at` | timestamp | | When its settings last changed. | Annex B convention (updatedAt) | Not shown in the UI. | An exact moment, so timestamp. |

### `users`

**What it stores:** One row per person who can sign in, with their login details and personal profile. Organisation-specific details (role, job title, department, capacity) are in `org_member`.
**In the prototype today:** `DemoUser` in `types/demo-auth.ts` (fullName, email, password, bio) and `User` in `types/index.ts` (name, email, avatar, phone, address, isActive).
**Main screens:** `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/invite/[token]/page.tsx`, `app/onboarding/profile/page.tsx`, `app/(workspace)/settings/profile/page.tsx`, `app/(workspace)/settings/security/page.tsx`, `app/(workspace)/settings/users/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_id` | uuid | pk | Identifies the person everywhere (assignee, author, signer, actor). | Section 7 Entity 1 (id) | Not shown in the UI (`User.id`, `DemoUser.id`). | uuid, the project-wide primary key type. |
| `avatar_file_id` | int | fk → stored_file | The profile photo. Empty means show initials. | Section 7 Entity 1 (photo_url); NFR-PRIV-003 (avatar scrubbed on deletion) | Photo upload on `app/(workspace)/settings/profile/page.tsx` (max 400 KB; today a data URL in `User.avatar`). | PROBLEM: int does not match `stored_file.stored_file_id` (bigserial), and other file links are uuid. It should be the same type as the key it points to. |
| `email` | varchar | unique | Sign-in name and where emails go. Stored lower-case and unique so one person cannot register twice. | FR-AUTH-001 (existing email returns 409); Section 7 Entity 1 (unique lower-case email) | Entered on `app/(auth)/signup/page.tsx` and `app/(auth)/login/page.tsx`; read-only on `app/(workspace)/settings/profile/page.tsx`. `login` lower-cases it in `context/demo-auth-context.tsx`. | Short text, so varchar. |
| `password_hash` | varchar | | The bcrypt hash of the password, never the password itself. | NFR-SEC-001 (bcrypt cost 12 or more); BR-09 (8 characters to 72 bytes); FR-AUTH-005 | Set on `app/(auth)/signup/page.tsx`, `app/(auth)/invite/[token]/page.tsx`, `app/(auth)/reset-password/page.tsx`, changed on `app/(workspace)/settings/security/page.tsx`. Today the prototype keeps a plain `DemoUser.password`. | A bcrypt hash is a fixed 60-character string, so varchar. |
| `name` | varchar | | Full display name. | FR-AUTH-001 (Full Name); Section 7 Entity 1 (name) | "Full name" on `app/(workspace)/settings/profile/page.tsx`; shown everywhere people appear (`components/shared/avatar.tsx` initials). | Short text, so varchar. |
| `phone` | varchar | | Contact phone number. | Section 7 Entity 1 (phone: digits, spaces, + - ( ), max 24 characters); NFR-PRIV-003 | "Phone" on `app/(workspace)/settings/profile/page.tsx` (rule in `phoneError` on that page). | Text, not a number, because it can hold +, spaces and brackets and a leading zero. varchar since it is at most 24 characters. |
| `address` | text | | Postal address. | FR-AUTH-003 (Step 3: Address) | "Address" on `app/(workspace)/settings/profile/page.tsx` (`User.address`). | Several lines of free text, so text. |
| `bio` | text | | A short professional bio. | No SRS requirement; from `DemoUser.bio` | "Short Professional Bio" on `app/onboarding/profile/page.tsx`. | Free text, so text. |
| `email_verified_at` | timestamp | | When the person proved they own the email. Empty means not verified yet; login sends them to verify. | FR-AUTH-002; FR-AUTH-005 (unverified account returns 403) | Not shown in the UI (the prototype has no verify-email screen). | An exact moment, so timestamp. Storing the moment instead of a yes/no flag also answers "when". |
| `last_login_at` | timestamp | | When the person last signed in, for admins and security checks. | FR-REP-006 (`auth.login` events; related) | Not shown in the UI. | An exact moment, so timestamp. |
| `created_at` | timestamp | | When the account was registered. | Section 7 Entity 1 (createdAt) | Not shown in the UI (`User.createdAt`). | An exact moment, so timestamp. |
| `updated_at` | timestamp | | When the profile last changed. | Annex B convention (updatedAt) | Not shown in the UI. | An exact moment, so timestamp. |
| `is_active` | boolean | | Whether the account can sign in at all. Turning it off blocks the person everywhere. | Section 7 Entity 1 (isActive: inactive users cannot authenticate); FR-SETT-002 | "Active / Inactive" badge on `app/(workspace)/settings/users/page.tsx` (`User.isActive`). | Yes/no, so boolean. Note: `org_member.is_active` also exists; this one is account-wide, that one is per organisation. |

### `role`

**What it stores:** The list of the 12 roles a member can hold. Each `org_member` and `invitation` points to one.
**In the prototype today:** `DemoRole` in `types/index.ts` (the 12 codes used here) with labels, menus and landing pages in `ROLE_CONFIGS` (`lib/permissions.ts`). `types/demo-auth.ts` has an older 10-role `DemoRole` that uses `executive` and `qa` instead of `ceo` and `qa_tester` (`DEMO_ROLE_OPTIONS`).
**Main screens:** role select in `components/members/invite-member-dialog.tsx` and on `app/(workspace)/settings/users/page.tsx`; role picker in `components/onboarding/role-selector.tsx`; menus filtered in `components/layout/app-sidebar.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `role_id` | uuid | pk | Identifies the role; members and invitations point here. | ACL-02 (default roles, granted by administration) | Not shown in the UI. | uuid, the project-wide primary key type. |
| `title` | varchar | | The role code: ceo, project_manager, product_owner, engineering_lead, developer, qa_tester, org_admin, document_manager, client, auditor, platform_admin, integration_service. The app maps it to a label and permissions. | FR-AUTH-007 (12 roles, `ROLE_CONFIGS`); Section 7 Entity 1 (role enum DemoRole); ACL-02 | Labels such as "QA Tester" in the Role column on `app/(workspace)/settings/users/page.tsx` and in the invite dialog (`roleTitle` in `lib/invitations.ts`). | A short code, so varchar. Kept as rows (not a database enum) so a role can be added without a schema change. Notes: the name `title` holds a code, not a label, and is easy to confuse with `org_member.title` (job title); it is not marked unique, so the same role could be entered twice. |

### `org_member`

**What it stores:** A person's membership in one organisation: their role there, job details, capacity and availability. A person can belong to several organisations, one row each.
**In the prototype today:** Spread over `User` in `types/index.ts` (role, title, department, workingHours, weeklyCapacity, availability, isActive) and `DemoUser.organizationId` / `jobTitle` / `department` in `types/demo-auth.ts`.
**Main screens:** `app/(workspace)/teams/members/page.tsx`, `app/(workspace)/teams/members/[memberId]/page.tsx`, `components/collaboration/create-member-dialog.tsx` (edit member), `app/(workspace)/settings/users/page.tsx`, `app/(workspace)/planner/availability/page.tsx`, `app/(workspace)/teams/workload/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `org_member_id` | uuid | pk | Identifies one membership. | ACL-01 (organisation memberships) | Not shown in the UI (the prototype uses `User.id` in `/teams/members/[memberId]`). | uuid, the project-wide primary key type. |
| `organization_id` | uuid | fk → organization | Which organisation. | ACL-01; ORG-01 (users may join more than one organisation) | Not shown in the UI (`DemoUser.organizationId`). | uuid to match `organization.organization_id`. |
| `user_id` | uuid | fk → users | Which person. | ACL-01 | Not shown in the UI. | uuid to match `users.user_id`. |
| `role_id` | uuid | fk → role | The person's role in this organisation; it decides menus and permissions. Roles live here, not on `users`, because the same person can have different roles in different organisations. | FR-SETT-002 (reassign roles); FR-AUTH-007; REQ-PLT-002 (role comes from the account); ACL-02 | Role column on `app/(workspace)/settings/users/page.tsx`; sidebar filtering in `components/layout/app-sidebar.tsx` via `lib/permissions.ts`. | uuid to match `role.role_id`. |
| `is_active` | boolean | | Whether the membership is active. Note text says "active / suspended / removed". | ACL-01 (active, suspended or removed membership states); ACL-08 (revoke access on suspension or removal); FR-SETT-002 | "Active / Inactive" badge on `app/(workspace)/settings/users/page.tsx` (today `User.isActive`). | Yes/no, so boolean. PROBLEM: a boolean holds two values, but the note and ACL-01 need three states. Suspended and removed cannot be told apart. Either a varchar status with that list, or the note should be changed. |
| `title` | varchar | | Job title in this organisation (e.g. Frontend Developer). Informational only; it never grants rights. | Section 7 Entity 1 (title); FR-SETT-002; ACL-02 (never infer roles from users.title) | "Job title" on `app/(workspace)/settings/profile/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/invite/[token]/page.tsx`; shown on member cards in `app/(workspace)/teams/members/page.tsx`. | Short text, so varchar. Note: signup asks for job title before any organisation exists, so it must be held until the organisation is created. |
| `department` | varchar | | Department (e.g. Engineering). Used to filter and sort members. | Section 7 Entity 1 (department); FR-SETT-002 | "Department" on `app/(workspace)/settings/profile/page.tsx`; department filter on `app/(workspace)/teams/members/page.tsx`. | Short text, so varchar. |
| `working_hours` | varchar | | The person's usual hours, e.g. "09:00 - 17:00". | FR-TEAM-002 (workingHours) | Edited in `components/collaboration/create-member-dialog.tsx`; shown on `app/(workspace)/teams/members/[memberId]/page.tsx`. | Stored as free text like the prototype (`User.workingHours`). Note: `organization` uses two `time` columns for the same idea, so these values cannot be compared or validated the same way. |
| `weekly_capacity` | integer | | Hours per week the person can work (default 40). Workload reports compare assigned work to it. | FR-TEAM-002 (weeklyCapacity, default 40); FR-REP-004; Section 7 Entity 1 | Edited in `components/collaboration/create-member-dialog.tsx`; used on `app/(workspace)/teams/workload/page.tsx` and `app/(workspace)/teams/members/[memberId]/page.tsx`. | Whole hours, so integer. |
| `availability` | varchar | | Current status: available / busy / focus_time / out_of_office. | No exact SRS ID; from `AvailabilityStatus` in `types/collaboration.ts` (related: FR-TEAM-003 time off) | Status buttons on `app/(workspace)/teams/members/[memberId]/page.tsx`; filter on `app/(workspace)/teams/members/page.tsx`; `components/planner/availability-board.tsx`. | Fixed list of words kept in the app, so varchar. |
| `joined_at` | timestamp | | When the person joined (accepted the invitation or created the organisation). | ACL-10 (audit membership changes; related) | Not shown in the UI. | An exact moment, so timestamp. |
| `created_at` | timestamp | | When the row was created. | Annex B convention | Not shown in the UI. | An exact moment, so timestamp. |
| `updated_at` | timestamp | | When role or details last changed. | Annex B convention | Not shown in the UI. | An exact moment, so timestamp. |

**Rules:** `unique (organization_id, user_id)` — a person can be a member of an organisation only once, so they cannot hold two conflicting memberships (and two roles) in the same organisation. The prototype checks this when inviting ("already a member of ...") in `sendInvitation` (`context/demo-auth-context.tsx`).

### `org_member_skill`

**What it stores:** The skills a member lists (React, TypeScript, ...), one row per skill.
**In the prototype today:** `User.skills` (string array) in `types/index.ts`; entered as a comma-separated text field.
**Main screens:** `components/collaboration/create-member-dialog.tsx` (skills field), skill chips on `app/(workspace)/teams/members/[memberId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `org_member_skill_id` | uuid | pk | Identifies one skill entry. Skills are their own table because the schema never stores lists as comma-separated text. | FR-TEAM-002 (tags skills); schema rule "Lists are their own tables" | Not shown in the UI. | uuid, the project-wide primary key type. |
| `org_member_id` | uuid | fk → org_member | Whose skill it is. Skills hang on the membership, so they can differ per organisation. | FR-TEAM-002; FR-TEAM-007 (search by skill) | Not shown in the UI. | uuid to match `org_member.org_member_id`. |
| `skill` | varchar | | The skill name. | FR-TEAM-007 (directory search by technical skills) | Chips on `app/(workspace)/teams/members/[memberId]/page.tsx` and on member cards in `app/(workspace)/teams/members/page.tsx` (first three). The members search does not cover skills yet. | Short text, so varchar. |

### `session`

**What it stores:** One row per signed-in browser or device. Lets the server check, list and end sessions.
**In the prototype today:** Nothing real: `flashsign_demo_session_active`, `flashsign_demo_user` and `flashsign_demo_selected_workspace` keys in localStorage (`STORAGE_KEYS` in `lib/storage.ts`), set by `login` in `context/demo-auth-context.tsx`.
**Main screens:** `app/(auth)/login/page.tsx` ("Remember me"), "Where you're signed in" card on `app/(workspace)/settings/security/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `session_id` | uuid | pk | Identifies one session (e.g. to end it). | FR-AUTH-005 ("creates a sessions table row") | Not shown in the UI. | uuid, the project-wide primary key type. |
| `user_id` | uuid | fk → users | Who is signed in. | FR-AUTH-005 | Not shown in the UI. | uuid to match `users.user_id`. |
| `active_organization_id` | uuid | fk → organization | Which organisation the person is working in right now in this session. | ORG-01 (users must choose the active context) | The current workspace (`selectedWorkspace` in `context/demo-auth-context.tsx`); chosen on `app/workspace/page.tsx`. | uuid to match `organization.organization_id`. |
| `token_hash` | varchar | unique | Hash of the session token in the cookie. Only the hash is kept, so a database leak does not give working sessions. Unique so a token maps to one session. | NFR-SEC-002 (httpOnly session cookie); schema rule "tokens stored only as hashes" | Not shown in the UI. | A fixed-length hash string, so varchar. |
| `remember_me` | boolean | | Whether the person ticked "Remember me": 30-day session, or end when the browser closes. | FR-AUTH-005 | "Remember me" checkbox on `app/(auth)/login/page.tsx`. | Yes/no, so boolean. |
| `expires_at` | timestamp | | When the session stops working. | FR-AUTH-005 (30 days with Remember me) | Not shown in the UI. | An exact moment, so timestamp. |
| `last_seen_at` | timestamp | | Last time the session was used, for the "Active now" list and idle checks. | FR-AUTH-005 (related); no exact SRS ID | "Active now" on `app/(workspace)/settings/security/page.tsx` (static text today). | An exact moment, so timestamp. |
| `revoked_at` | timestamp | | When the session was ended early (sign out, password change or reset, deactivation). | FR-AUTH-006 (reset revokes all sessions); FR-SETT-002 (deactivation revokes sessions); ACL-08 | "Changing it signs you out on your other devices" on `app/(workspace)/settings/security/page.tsx`. | An exact moment, so timestamp; empty while the session is live. |
| `ip_address` | varchar | | Address the session started from, shown in the device list and kept for security review. | NFR-026 (IP used only for security and audit); no exact SRS ID for sessions | "Where you're signed in" on `app/(workspace)/settings/security/page.tsx` (not shown yet). | Fits IPv4 and IPv6 text, so varchar. |
| `user_agent` | varchar | | Browser and device description, so the person can recognise the session. | No exact SRS ID (REQ-SGN-008 records user agent for signing) | "This browser" on `app/(workspace)/settings/security/page.tsx`. | Short text, so varchar. |
| `created_at` | timestamp | | When the person signed in. | FR-AUTH-005 | Not shown in the UI. | An exact moment, so timestamp. |

### `invitation`

**What it stores:** An invitation for someone to join an organisation with a set role. Only the owner signs up directly; everyone else joins through one of these.
**In the prototype today:** `DemoInvitation` in `types/demo-auth.ts`, created by `sendInvitation` / `resendInvitation` / `revokeInvitation` / `acceptInvitation` in `context/demo-auth-context.tsx`; link helpers in `lib/invitations.ts` (7-day validity, the link carries the invitation as base64 JSON instead of a token).
**Main screens:** `components/members/invite-member-dialog.tsx` and `components/members/invitations-list.tsx` on `app/(workspace)/teams/members/page.tsx`; the invitee's page `app/(auth)/invite/[token]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `invitation_id` | uuid | pk | Identifies one invitation. | FR-AUTH-004 | Not shown in the UI (`DemoInvitation.id`). | uuid, the project-wide primary key type. |
| `organization_id` | uuid | fk → organization | Which organisation the person is invited to. | FR-AUTH-004; ORG-02 | Organisation name on `app/(auth)/invite/[token]/page.tsx` (today copied as `organizationName`; here read through this link). | uuid to match `organization.organization_id`. |
| `role_id` | uuid | fk → role | The role the person will get on joining. | FR-AUTH-004 (pre-assigned role); ACL-02 | Role select in `components/members/invite-member-dialog.tsx` (`INVITABLE_ROLES` in `lib/invitations.ts`); role shown in `components/members/invitations-list.tsx`. | uuid to match `role.role_id`. |
| `invited_by_user_id` | uuid | fk → users | Who sent it. | FR-AUTH-004; ACL-10 (audit invitations) | "Invited by" column in `components/members/invitations-list.tsx`; "... invited you" on `app/(auth)/invite/[token]/page.tsx` (today copied as `invitedByName`). | uuid to match `users.user_id`. |
| `accepted_by_user_id` | uuid | fk → users | The account created (or used) when it was accepted. | ORG-02 (accepted by the intended identity) | Not shown in the UI. | uuid to match `users.user_id`; empty until accepted. |
| `email` | varchar | | Where the invitation is sent, and the email the new account must use. | FR-AUTH-004 | Email field in `components/members/invite-member-dialog.tsx`; listed in `components/members/invitations-list.tsx`. | Short text, so varchar; stored lower-case like all emails. |
| `name` | varchar | | The invitee's name, to pre-fill the join form. | FR-AUTH-004 (Full Name) | Name field in the invite dialog; pre-filled on `app/(auth)/invite/[token]/page.tsx` (`DemoInvitation.fullName`). | Short text, so varchar. |
| `title` | varchar | | Job title to give the new member. | FR-AUTH-004 (Job Title) | "Job title" in `components/members/invite-member-dialog.tsx`; pre-filled on `app/(auth)/invite/[token]/page.tsx` (`DemoInvitation.jobTitle`). | Short text, so varchar. |
| `department` | varchar | | Department to give the new member. | FR-AUTH-004 (Department) | "Department" in `components/members/invite-member-dialog.tsx`; shown in `components/members/invitations-list.tsx`. | Short text, so varchar. |
| `message` | text | | Optional personal note from the sender. | FR-AUTH-004 (optional custom message) | "Personal message" in the invite dialog; quoted on `app/(auth)/invite/[token]/page.tsx`. | Free text of any length, so text. |
| `token_hash` | varchar | unique | Hash of the secret token in the `/invite/[token]` link. Only the hash is stored; unique so one token finds one invitation. | FR-AUTH-004 (cryptographic token); REQ-AGR-038 (single-use, expiring link token; related) | The `[token]` part of `app/(auth)/invite/[token]/page.tsx` (today `encodeInvite` in `lib/invitations.ts`, not a secret). | A fixed-length hash string, so varchar. |
| `status` | varchar | | pending / accepted / revoked. "Expired" is not stored: it is pending with `expires_at` in the past. | FR-AUTH-004; ORG-02 (expire, be revocable) | "Pending / Expired" badges in `components/members/invitations-list.tsx`; error screens on `app/(auth)/invite/[token]/page.tsx`. | Fixed list of words kept in the app, so varchar. Matches `DemoInvitation.status`. |
| `expires_at` | timestamp | | When the link stops working (7 days after sending; reset on resend). | FR-AUTH-004 (default 7 days); ORG-02 | "expires in 5 days" / "Expired 2 days ago" in `components/members/invitations-list.tsx` (`daysLeftText`, `isInviteExpired` in `lib/invitations.ts`). | An exact moment, so timestamp. |
| `accepted_at` | timestamp | | When it was accepted. | FR-AUTH-004 | Not shown in the UI (`DemoInvitation.acceptedAt`). | An exact moment, so timestamp. |
| `revoked_at` | timestamp | | When the sender cancelled it. | FR-AUTH-004 (Revoke); ACL-10 | Revoke button in `components/members/invitations-list.tsx`. | An exact moment, so timestamp. |
| `created_at` | timestamp | | When it was first sent. | FR-AUTH-004 | "Sent" date in `components/members/invitations-list.tsx` (today `DemoInvitation.sentAt`). | An exact moment, so timestamp. |
| `updated_at` | timestamp | | When it last changed (e.g. resent with a new link). | Annex B convention | Not shown in the UI. | An exact moment, so timestamp. |

### `verification_code`

**What it stores:** Short one-time codes sent by email, to verify an email address or to reset a password.
**In the prototype today:** Nothing — new for production. The prototype has no verify-email screen and the reset flow only simulates a link (`app/(auth)/forgot-password/page.tsx`).
**Main screens:** `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`. (The `/verify-email` page named in FR-AUTH-001 does not exist in the prototype.)

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `verification_code_id` | uuid | pk | Identifies one code. | FR-AUTH-002 | Not shown in the UI. | uuid, the project-wide primary key type. |
| `user_id` | uuid | fk → users | Whose code it is. | FR-AUTH-002; FR-AUTH-006 | Not shown in the UI. | uuid to match `users.user_id`. |
| `purpose` | varchar | | email_verification or password_reset, so a code made for one cannot be used for the other. | FR-AUTH-002; FR-AUTH-006 | Not shown in the UI. | Fixed list of two words kept in the app, so varchar. |
| `code_hash` | varchar | | The bcrypt hash of the 6-digit code, never the code. | FR-AUTH-002 (bcrypt-hashed OTP); schema rule "codes stored only as hashes" | Not shown in the UI. | A hash string, so varchar. |
| `attempts` | integer | | Wrong tries so far. After 5 the code is cancelled. | FR-AUTH-002 (5 failed attempts, then HTTP 429) | Not shown in the UI. | A small count, so integer. |
| `expires_at` | timestamp | | When the code stops working (10 minutes after sending). | FR-AUTH-002 (valid for 10 minutes) | Not shown in the UI. | An exact moment, so timestamp. |
| `consumed_at` | timestamp | | When the code was used, so it cannot be used twice. | FR-AUTH-002 (consumes the OTP); FR-AUTH-006 (marks code as consumed) | Not shown in the UI. | An exact moment, so timestamp; empty until used. |
| `created_at` | timestamp | | When it was sent. Also used for the 60-second resend wait. | FR-AUTH-002 (60-second resend cooldown) | Not shown in the UI. | An exact moment, so timestamp. |

### `user_preference`

**What it stores:** One row of personal display and notification-channel choices per person.
**In the prototype today:** `DemoPreferences` in `types/demo-auth.ts` (theme, inAppNotifications, emailNotifications) and `CollaborationSettings` in `types/collaboration.ts` (defaultCalendarView, defaultPlanningView, emailNotifications, desktopNotifications, weeklyDigest).
**Main screens:** `app/onboarding/preferences/page.tsx`, `app/(workspace)/settings/preferences/page.tsx`, `app/(workspace)/settings/notifications/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_preference_id` | uuid | pk | Identifies the row. | FR-SETT-005 | Not shown in the UI. | uuid, the project-wide primary key type. |
| `user_id` | uuid | fk → users; unique | Whose preferences. Unique: one row per person. | FR-SETT-005 | Not shown in the UI. | uuid to match `users.user_id`. |
| `theme` | varchar | | light or dark. | FR-AUTH-003 (Step 2: Theme Light/Dark) | `ThemeSelector` (`components/onboarding/preference-toggle.tsx`) on `app/onboarding/preferences/page.tsx`; shown on `app/onboarding/complete/page.tsx`. | Fixed list of two words kept in the app, so varchar. |
| `default_calendar_view` | varchar | | Which calendar view opens first: month / week / day / agenda. | FR-PLAN-004 (switch Month, Week, Day) | "Default Calendar View" on `app/(workspace)/settings/preferences/page.tsx`. | Fixed list of words kept in the app, so varchar. |
| `default_planning_view` | varchar | | Which planning view opens first: calendar / timeline / list. | No SRS requirement; from `CollaborationSettings.defaultPlanningView` | "Default Planning Workspace View" on `app/(workspace)/settings/preferences/page.tsx`. | Fixed list of words kept in the app, so varchar. |
| `in_app_notifications` | boolean | | Show notifications under the bell. | FR-SETT-005 (inAppNotifications); COL-04 | "In-App Notification Center" on `app/onboarding/preferences/page.tsx`. The "In-app notifications" toggle on `app/(workspace)/settings/notifications/page.tsx` actually writes `desktopNotifications`. | Yes/no, so boolean. |
| `email_notifications` | boolean | | Also send notifications by email. | FR-SETT-005 (emailNotifications); COL-05 | "Email" on `app/(workspace)/settings/notifications/page.tsx`; "Simulated Email Digests" on `app/onboarding/preferences/page.tsx`. | Yes/no, so boolean. |
| `desktop_notifications` | boolean | | Browser/desktop pop-up notifications. | No SRS requirement; from `CollaborationSettings.desktopNotifications` | Bound to the "In-app notifications" toggle on `app/(workspace)/settings/notifications/page.tsx` (see Issues). | Yes/no, so boolean. |
| `weekly_digest` | boolean | | One summary email on Monday. | COL-07 (scheduled digests) | "Weekly summary" on `app/(workspace)/settings/notifications/page.tsx`. | Yes/no, so boolean. |
| `updated_at` | timestamp | | When preferences last changed. | Annex B convention | Not shown in the UI. | An exact moment, so timestamp. |

### `user_notification_setting`

**What it stores:** Per-event on/off switches for notifications (e.g. "a task is assigned to me"). Only events the person changed need a row; a missing row counts as on.
**In the prototype today:** `CollaborationSettings.notificationEvents` (a key-to-boolean map) in `types/collaboration.ts`; also `taskAssignmentAlerts`, `deadlineReminders`, `approvalReminders` in `DemoPreferences` (`types/demo-auth.ts`).
**Main screens:** "What to notify me about" on `app/(workspace)/settings/notifications/page.tsx`; alert toggles on `app/onboarding/preferences/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_notification_setting_id` | uuid | pk | Identifies one setting. | FR-SETT-005 | Not shown in the UI. | uuid, the project-wide primary key type. |
| `user_id` | uuid | fk → users | Whose setting. | FR-SETT-005 | Not shown in the UI. | uuid to match `users.user_id`. |
| `event_key` | varchar | | The event, e.g. task_assigned, mentioned, review_requested, task_blocked, signature_requested, request_signed, request_declined, request_expiring, meeting_invite, meeting_conflict, time_off_decision, announcement. | FR-SETT-005 (task assignments, deadline reminders, approval requests); COL-04 | The event ids in `EVENT_GROUPS` on `app/(workspace)/settings/notifications/page.tsx`. | A short code from an app-level list, so varchar (new events need no schema change). |
| `is_enabled` | boolean | | On or off for that event. | FR-SETT-005 (toggling off suppresses the notification) | Each toggle in "What to notify me about" on `app/(workspace)/settings/notifications/page.tsx`. | Yes/no, so boolean. |

**Rules:** `unique (user_id, event_key)` — one setting per person per event, so there is never a conflicting on and off for the same event. Matches the prototype, where `notificationEvents` is a map with one value per key.

#### Issues found in slices 0–1
- `stored_file.stored_file_id` is `bigserial`, which breaks the schema rule "every table has its own uuid primary key". It also does not match the keys that point to it: `organization.logo_file_id` and `users.avatar_file_id` are `int` (32-bit, smaller than bigserial), and all other file links (`pdf_file_id`, `stored_file_id` in slices 3, 5 and 6, `signature_file_id`, `initials_file_id`, `image_file_id`) are `uuid`. Pick one type and use it everywhere. uuid also keeps file ids from being guessable in download links (DATA-07).
- `activity_log.resource_id` is uuid, so it cannot point to a `stored_file` row while that key is bigserial.
- `stored_file` has no MIME/file type column, although Annex B's StoredFile lists `mime` and DATA-08 asks to validate file type.
- `org_member.is_active` is a boolean, but its note says "active / suspended / removed" and ACL-01 requires three membership states. Either change the column back to a varchar status or change the note.
- `users.is_active` and `org_member.is_active` both exist. The difference (account-wide versus one organisation) should be written down, or FR-SETT-002's "deactivate" could update the wrong one.
- `users` no longer has a time zone, and `org_member` never had one, but the prototype keeps a personal time zone (`User.timeZone`, `DemoUser.timezone`, `DemoPreferences.timezone`; edited in `components/collaboration/create-member-dialog.tsx` and `app/onboarding/preferences/page.tsx`), and FR-TEAM-002 and DATA-04 ask for one. Only `organization.timezone` remains.
- `users` no longer has an avatar colour, but `User.color` drives every avatar (`components/shared/avatar.tsx`), Section 7 Entity 1 lists `color` as required, and onboarding has an avatar colour picker (`components/onboarding/avatar-picker.tsx`). The colour would have to be calculated (e.g. from the user id), or the column is needed.
- `users` lost `deleted_at` and `company`. The profile page still has a "Company" field (`app/(workspace)/settings/profile/page.tsx`, `User.company`) with nowhere to save it. NFR-PRIV-003 (anonymisation) still works by clearing fields, but no column records that an account was anonymised.
- `role.title` holds a code (e.g. `qa_tester`), not a display title. It is easy to confuse with `org_member.title` (job title). It has no unique rule, so the same role could be entered twice.
- Role codes do not agree in the frontend: `types/demo-auth.ts` uses `executive` and `qa` (10 roles), while `types/index.ts` and `schema.txt` use `ceo` and `qa_tester` (12 roles). Invitations and sign-up use the demo-auth codes, so existing data needs mapping. `createOrganization` also makes the owner `org_admin`, while FR-AUTH-003 says the owner gets `ceo`.
- `platform_admin` and `integration_service` are in the role list, but they are platform-wide or system accounts, not normal organisation members. Giving them through `org_member` may not be what is wanted.
- `org_member.working_hours` is free `varchar` (e.g. "09:00 - 17:00 EST"), while `organization` stores the same idea as two `time` columns. They cannot be compared or validated the same way.
- The Preferences page (`app/(workspace)/settings/preferences/page.tsx`) edits personal choices (calendar and planning view → `user_preference`) and organisation-wide settings (time zone, working hours, week start, workload threshold → `organization`) in the same form. In production the organisation part needs an admin permission check.
- The "In-app notifications" toggle on `app/(workspace)/settings/notifications/page.tsx` writes `desktopNotifications`, while `user_preference` has separate `in_app_notifications` and `desktop_notifications` columns. Decide which column that toggle saves to.
- `organization` has no column for company size, though onboarding asks for it (`app/onboarding/create-organization/page.tsx`, `DemoWorkspace.size` / `companySize`) and FR-AUTH-003 lists Company Size.
- Signup asks for a job title (`app/(auth)/signup/page.tsx`) before any organisation exists, but job title is only on `org_member`, so it has to be held until the organisation is created.
- `invitation` has no `sent_at`. On resend the prototype moves `sentAt` forward, and the "Sent" column in `components/members/invitations-list.tsx` shows it. The schema would show either `created_at` (first send) or `updated_at` (any change).
- Nothing in the schema stops two pending invitations for the same email in the same organisation. The prototype blocks this in `sendInvitation` (`context/demo-auth-context.tsx`). A partial unique rule on (organization_id, email) where status = pending would enforce it in the database (DATA-03).
- `integration` has no `created_at` / `updated_at` (the schema says most tables have them) and nothing that records the connection's allowed scopes, which ACL-11 needs. Its data (`MOCK_INTEGRATIONS`) is also not shown on any screen today.

---

## Slice 2 — Project structure

### `project`

**What it stores:** One row per project in an organisation: its name and key, status and health, dates and baseline, look (colour, group), and which plan levels it uses.
**In the prototype today:** `Project` in `types/index.ts` (with `ProjectStructure` folded into the `uses_*` columns). Calculated fields (`progress`, `current*` dates, `timelineDifference`, `timelineStatus`, `totalWorkDays`) are not stored; they are worked out by `lib/timeline-calculator.ts` and `lib/subtasks.ts`. `boardColumns`, `extraBoards`, `mainBoardName`, `baselineHistory`, `tags`, `goals`, `memberIds`, `teamIds` and `isFavorite` moved to their own tables.
**Main screens:** `app/(workspace)/projects/page.tsx` (portfolio list), `app/(workspace)/projects/new/page.tsx` (wizard), `app/(workspace)/projects/[projectId]/page.tsx` (overview), `app/(workspace)/projects/[projectId]/settings/page.tsx`, `components/projects/project-header-nav.tsx`, `app/(workspace)/projects/favorites/page.tsx`, `app/(workspace)/projects/recent/page.tsx`, `app/(workspace)/projects/roadmap/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `project_id` | uuid | pk | Unique id of the project; every board, phase, task, sprint and file points to it. | Section 7 Entity 3 (`id`); DATA-02 | In every project URL: `app/(workspace)/projects/[projectId]/...` | uuid like every primary key: can be created on any server and cannot be guessed from the URL. |
| `organization_id` | uuid | fk → organization | Which organisation owns the project. Keeps one company's projects away from another's and scopes the key check. | DATA-01; FR-PROJ-001 (project in the active organisation); ORG-03 | Not shown directly; the project list only shows projects of the active workspace (`app/(workspace)/projects/page.tsx`). | uuid because `organization.organization_id` is uuid. |
| `owner_user_id` | uuid | fk → users | The person who leads the project (the project manager). Set to the creator by default. | FR-PROJ-001 (creator becomes `ownerId`); Entity 3 (`ownerId`); ORG-03 | Owner picker in the wizard (`app/(workspace)/projects/new/page.tsx`) and in Settings (`app/(workspace)/projects/[projectId]/settings/page.tsx`); owner shown on project cards. | uuid because `users.user_id` is uuid. |
| `name` | varchar | | The project's display name. | FR-PROJ-001; REQ-PRJ-002 (at least 3 characters) | Wizard Basics step, Settings, project header (`components/projects/project-header-nav.tsx`), list cards, search. | Short text: a title of a few words. |
| `project_key` | varchar | | Short code (e.g. FS) used as the prefix of every task key (FS-42). | FR-PROJ-001; REQ-PRJ-002 (2–6 upper-case letters, unique in the organisation); DATA-02 | Wizard and Settings key field; shown next to the name; used by `nextTaskKey` in `context/app-context.tsx` to build task keys. | Short text code of 2–6 letters. |
| `description` | text | | What the project is for and its scope. | FR-PROJ-001; Entity 3 (`description`) | Wizard, Settings, list cards (`app/(workspace)/projects/page.tsx`), search filter (FR-PROJ-009). | Free text of any length. |
| `status` | varchar | | Where the project is in its life: planning, active, on_hold, completed, cancelled or archived. | REQ-PRJ-005; Entity 3 (`status`); ORG-04 | Status select in Settings; status filter on `app/(workspace)/projects/page.tsx`. | Short status word from a fixed list kept in the app (not a database enum), so adding a value needs no schema change. |
| `health` | varchar | | Traffic-light health: on_track, at_risk, off_track or delayed. In auto mode it is worked out from the timeline; in manual mode a manager sets it. | FR-PROJ-003; REQ-PRJ-006 | `HealthBadge` in `components/projects/project-header-nav.tsx`, `app/(workspace)/projects/recent/page.tsx` and project cards; manual pick in Settings. Calculated by `healthFromTimeline` in `lib/timeline-calculator.ts`. | Short status word from an app-level list. Note: in auto mode this is a calculated value being stored (see Issues). |
| `health_mode` | varchar | | Says whether `health` is calculated (auto) or was set by hand (manual), so the app knows whether it may overwrite it. | FR-PROJ-003 (`healthMode`) | "Health" select in `app/(workspace)/projects/[projectId]/settings/page.tsx` ("Auto" or a fixed value); read in `lib/timeline-calculator.ts`. | Short word from a two-value app-level list (auto / manual). |
| `priority` | varchar | | How important the project is: low, medium, high or critical. | FR-PROJ-001; Entity 3 (`priority`) | Wizard priority select; `PriorityBadge` and priority filter/sort on `app/(workspace)/projects/page.tsx`. | Short word from an app-level list. |
| `category` | varchar | | A free category label for the project. | Entity 3 does not list it; FR-PROJ-009 mentions "category grouping". Frontend source: `Project.category (types/index.ts)`. | Not shown in the UI. Only copied when a project is duplicated in `app/(workspace)/projects/[projectId]/page.tsx` and passed through `addProject` in `context/app-context.tsx`. | Short label text. |
| `project_group` | varchar | | The "space" the project belongs to (e.g. Core Platform), used to group and filter projects. | FR-PROJ-009 (category grouping); frontend `Project.group (types/index.ts)` | Space select in the wizard and in Settings; group filter on `app/(workspace)/projects/page.tsx` and `app/(workspace)/projects/roadmap/page.tsx`; label on cards in `app/(workspace)/projects/home/page.tsx`. | Short label text. Named `project_group` because `group` is a reserved word in SQL. |
| `icon` | varchar | | Name of an icon to show for the project. | No SRS requirement. Frontend source: `Project.icon (types/index.ts)`. | Not shown in the UI: no screen reads `project.icon` today. | Short text (an icon name). |
| `accent_color` | varchar | | The project's colour, used for its dot, tile and progress bars. | No SRS requirement. Frontend source: `Project.accentColor (types/index.ts)`. | Colour picker in the wizard and Settings; colour tiles on `app/(workspace)/projects/page.tsx`, `favorites/page.tsx`, `recent/page.tsx`. | Short text holding a colour code such as `#00c2a8`. |
| `start_date` | date | | The day the project is planned to start. | FR-PROJ-001; Entity 3 (`startDate`); REQ-PRJ-003 | Wizard "Team & timeline" step; Settings date range; start of the window in `lib/schedule.ts` (`projectWindow`). | A calendar day with no time. |
| `end_date` | date | | The day the project is planned to finish. | Entity 3 (`endDate`); REQ-PRJ-003 (not before the start) | Project list sorts "Due date" by it (`app/(workspace)/projects/page.tsx`); days-left counter on cards. | A calendar day with no time. |
| `due_date` | date | | The target delivery day. In the prototype it is set to the same value as `end_date`. | FR-PROJ-001 ("Target Due Date") | Shown as "Due" on `app/(workspace)/projects/[projectId]/page.tsx`, `favorites/page.tsx`, `recent/page.tsx` (falls back to `end_date`). | A calendar day with no time. Overlaps `end_date` (see Issues). |
| `original_start_date` | date | | The baseline start: the plan the team agreed to, kept so drift can be measured. | FR-PLAN-001; FR-PLAN-007; Entity 3 (`originalStartDate`) | Baseline range in Settings; grey baseline bar on `app/(workspace)/projects/[projectId]/timeline/page.tsx` and `components/reports/timeline-report.tsx`. | A calendar day with no time. |
| `original_end_date` | date | | The baseline finish. The calculated end is compared with it to give "+N days extended". | FR-PLAN-001; FR-PLAN-007; REQ-PRJ-006 (health from the extension) | Same as above; `components/projects/project-timeline-summary.tsx`. | A calendar day with no time. |
| `duration_unit` | varchar | | The unit the project length was planned in (days, weeks, months), so it is shown as "3 months". | FR-PLAN-006; Entity 3 (`durationUnit`) | Unit select in the wizard and Settings (`components/shared/duration-fields.tsx`); formatted by `lib/durations.ts`. | Short word from an app-level list. |
| `uses_phases` | boolean | | Plan level switch: does this project use phases? | FR-PROJ-007; Annex B §3.2 plan levels | Structure step in the wizard (`components/projects/structure-editor.tsx`) and `components/projects/project-structure-settings.tsx`; read by `lib/structure.ts`. | Yes/no flag. |
| `uses_epics` | boolean | | Plan level switch: does this project use epics? | FR-PROJ-007; Annex B §3.2 | Same structure editor; decides whether the Epics wizard step and epic pickers appear. | Yes/no flag. |
| `uses_stories` | boolean | | Plan level switch: does this project use stories? | FR-PROJ-007; Annex B §3.2 | Same structure editor; decides the Stories wizard step and story pickers. | Yes/no flag. |
| `uses_subtasks` | boolean | | Plan level switch: may tasks have subtasks? | FR-PROJ-007; FR-TASK-003 | Same structure editor. | Yes/no flag. |
| `uses_backlog` | boolean | | Whether a task may wait with no phase, epic or story (in the Backlog). When off, the task must be placed in the lowest level. | FR-PROJ-007; Annex B §3.2 ("With backlog on, a task may have no parent") | Backlog section on `app/(workspace)/projects/[projectId]/plan/page.tsx`; required marker in `components/plan/plan-picker.tsx`; quick-add on the board. | Yes/no flag. |
| `allow_move` | boolean | | Whether epics, stories and tasks may be moved to another parent after they are created. | FR-PROJ-007 (structure rules); frontend `ProjectStructure.allowMove (types/index.ts)` | Toggle in `components/projects/structure-editor.tsx`; locks the parent field in `components/plan/plan-modals.tsx` and the move list in `plan/page.tsx`. | Yes/no flag. |
| `archived_at` | timestamp | | When the project was archived. Empty = not archived. Archived projects are hidden from active views but kept. | FR-PROJ-006; REQ-PRJ-008 ("Archive only hides it"); ORG-06 | Archive button in Settings and on the overview (`archiveProject` in `context/app-context.tsx`). | An exact moment, so the archive time can be shown and audited; empty means "not archived", which replaces the prototype's `isArchived` flag. |
| `created_at` | timestamp | | When the project was created. | Entity 3; FR-PROJ-009 (sort by creation date) | Used for sorting; not shown as a label. | An exact moment. |
| `updated_at` | timestamp | | When the project was last changed. | Frontend `Project.updatedAt (types/index.ts)` | Not shown; set on every change in `context/app-context.tsx`. | An exact moment. |
| `deleted_at` | timestamp | | When the project was deleted (soft delete, so it can go to the Trash). | FR-PROJ-006 (permanent deletion); REQ-PRJ-008 | Not shown in the UI: the prototype deletes a project at once after typing its key (Settings). | An exact moment; empty = not deleted. |

**Rules:** `unique (organization_id, project_key)` — two projects in the same organisation cannot share a key, because the key is the prefix of every task key (REQ-PRJ-002, DATA-02). Different organisations may both use "FS".

### `project_member`

**What it stores:** Which people are members of which project (one row per person per project).
**In the prototype today:** `Project.memberIds (types/index.ts)`, a list of user ids.
**Main screens:** `app/(workspace)/projects/[projectId]/team/page.tsx`, member step in `app/(workspace)/projects/new/page.tsx`, member avatars on `app/(workspace)/projects/page.tsx`, assignee lists in `components/tasks/create-task-modal.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `project_member_id` | uuid | pk | Unique id of this membership row. | Schema rule (lists are their own tables) | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | Entity 3 (`memberIds`); FR-PROJ-002 (member avatars) | Project team page `app/(workspace)/projects/[projectId]/team/page.tsx`. | uuid because `project.project_id` is uuid. |
| `user_id` | uuid | fk → users | The member. | Entity 3 (`memberIds`) | Member avatars on project cards and the team page; default assignee list in `app/(workspace)/projects/[projectId]/tasks/new/page.tsx`. | uuid because `users.user_id` is uuid. |
| `created_at` | timestamp | | When the person was added. | None in SRS; standard audit column | Not shown. | An exact moment. |

**Rules:** `unique (project_id, user_id)` — a person is a member of a project only once.

### `team_project`

**What it stores:** Which teams work on which project.
**In the prototype today:** `Project.teamIds` and `Team.projectIds (types/index.ts)`. Teams are hidden: `FEATURES.teams = false` in `lib/features.ts`.
**Main screens:** Hidden while teams are off. The code is in `app/(workspace)/teams/[teamId]/page.tsx` and `app/(workspace)/teams/page.tsx`; the wizard always sets `teamIds: ['t1']` in `app/(workspace)/projects/new/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `team_project_id` | uuid | pk | Unique id of this link row. | Schema rule (lists are their own tables) | Not shown. | uuid like every primary key. |
| `team_id` | uuid | fk → team | The team. | ORG-02 (teams with project assignments); FR-TEAM-001 (teams) | Hidden (teams feature flag off). | uuid, but it points to a `team` table that no longer exists in schema.txt, so the foreign key cannot be created (see Issues). |
| `project_id` | uuid | fk → project | The project. | ORG-02 | Hidden (teams feature flag off). | uuid because `project.project_id` is uuid. |

**Rules:** `unique (team_id, project_id)` — a team is linked to a project only once.

### `project_tag`

**What it stores:** Free tags on a project (one row per tag).
**In the prototype today:** `Project.tags (types/index.ts)`. The wizard fills it with the chosen template and visibility.
**Main screens:** Not shown in the UI today.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `project_tag_id` | uuid | pk | Unique id of this tag row. | Schema rule (lists are their own tables) | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project the tag belongs to. | FR-PROJ-001 (tags); FR-PROJ-009 (search over tags) | Not shown. | uuid because `project.project_id` is uuid. |
| `tag` | varchar | | The tag text. | FR-PROJ-001; FR-PROJ-009 | Not shown in the UI: set in `app/(workspace)/projects/new/page.tsx` (`tags: [template, visibility]`) and copied on duplicate, but no screen lists it and the search on `app/(workspace)/projects/page.tsx` does not read it yet. | Short text label. |

### `project_goal`

**What it stores:** The goals of a project, in the order they were entered.
**In the prototype today:** `Project.goals (types/index.ts)`, a list of strings.
**Main screens:** "Goals & review" step of `app/(workspace)/projects/new/page.tsx`; goals card on `app/(workspace)/projects/[projectId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `project_goal_id` | uuid | pk | Unique id of this goal row. | Schema rule (lists are their own tables) | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | Annex B §3.2 (wizard step "Goals & review"); ORG-08 (business objectives) | Goals card on the overview. | uuid because `project.project_id` is uuid. |
| `goal` | text | | The goal sentence (e.g. "Achieve zero high-priority blocker defects"). | Annex B §3.2 | Goals list in the wizard and on `app/(workspace)/projects/[projectId]/page.tsx`. | Free text; a goal can be a full sentence. |
| `sort_order` | integer | | Position of the goal in the list, so goals show in the order the user entered them. | None in SRS; needed because a table has no built-in order (the prototype used array order) | Order of the goals list. | Whole number for ordering. |

### `user_favorite_project`

**What it stores:** Which projects each person has starred.
**In the prototype today:** `Project.isFavorite (types/index.ts)`, one flag per project shared by everyone. The table makes it personal.
**Main screens:** Star button on `app/(workspace)/projects/page.tsx` and `components/projects/project-header-nav.tsx`; `app/(workspace)/projects/favorites/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_favorite_project_id` | uuid | pk | Unique id of this favourite row. | Schema rule | Not shown. | uuid like every primary key. |
| `user_id` | uuid | fk → users | The person who starred it. | FR-PROJ-009 ("Favorites" filter chip) | Favourites are shown only to that person. | uuid because `users.user_id` is uuid. |
| `project_id` | uuid | fk → project | The starred project. | FR-PROJ-009 | Star icon (filled when starred) and the Favorites page; `toggleFavoriteProject` in `context/app-context.tsx`. | uuid because `project.project_id` is uuid. |
| `created_at` | timestamp | | When it was starred (can order the favourites list). | None in SRS | Not shown. | An exact moment. |

**Rules:** `unique (user_id, project_id)` — a person can star a project only once; un-starring deletes the row.

### `user_recent_project`

**What it stores:** The projects each person opened recently, with the last time they opened each.
**In the prototype today:** `recentProjectIds` in app state (`context/app-context.tsx`), filled by `addRecentProject`.
**Main screens:** `app/(workspace)/projects/recent/page.tsx`; recent list in `components/layout/app-header.tsx` (per FR-PROJ-008).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_recent_project_id` | uuid | pk | Unique id of this row. | Schema rule | Not shown. | uuid like every primary key. |
| `user_id` | uuid | fk → users | The person. | FR-PROJ-008 (list per user) | Each person sees their own recent list. | uuid because `users.user_id` is uuid. |
| `project_id` | uuid | fk → project | The project they opened. | FR-PROJ-008 | Rows on `app/(workspace)/projects/recent/page.tsx`. | uuid because `project.project_id` is uuid. |
| `last_opened_at` | timestamp | | When they last opened it. Sorting by this gives the "most recent first" order instead of storing a list. | FR-PROJ-008 (ordered list, newest first) | Order of the recent list; updated when `app/(workspace)/projects/[projectId]/page.tsx` loads. | An exact moment, so ordering is precise. |

**Rules:** `unique (user_id, project_id)` — one row per person per project; opening it again only updates `last_opened_at`.

### `baseline_change`

**What it stores:** One row each time someone re-baselines a project (changes its original plan dates), with who, why and the dates.
**In the prototype today:** `Project.baselineHistory`, a list of `BaselineChange (types/index.ts)`.
**Main screens:** Baseline range and reason box in `app/(workspace)/projects/[projectId]/settings/page.tsx`; "last re-plan" and re-plan count in `components/reports/timeline-report.tsx` and `lib/timeline-report.ts`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `baseline_change_id` | uuid | pk | Unique id of this history row. | Schema rule | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project that was re-baselined. | FR-PLAN-002; REQ-PRJ-007 | Timeline report for that project. | uuid because `project.project_id` is uuid. |
| `changed_by_user_id` | uuid | fk → users | Who changed the baseline. | FR-PLAN-002 (user attribution) | Saved from Settings as `byUserId`; read by the timeline report. | uuid because `users.user_id` is uuid. |
| `reason` | text | | Why the baseline changed. Required. | FR-PLAN-002 (mandatory justification); REQ-PRJ-007 | Reason box in Settings (save blocked if empty); last reason in `components/reports/timeline-report.tsx`. | Free text; a reason can be a sentence or more. |
| `start_date` | date | | Baseline start for this change. schema.txt says "new baseline start". | FR-PLAN-002 | Not shown as its own field; the old range is kept in history. | A calendar day. Note: the prototype and FR-PLAN-002 store the baseline as it was before the change, not the new one (see Issues). |
| `end_date` | date | | Baseline end for this change. schema.txt says "new baseline end". | FR-PLAN-002 | As above. | A calendar day. Same meaning problem as `start_date`. |
| `created_at` | timestamp | | When the re-baseline happened (the prototype's `at`). | FR-PLAN-002 (chronological log) | Order of the history; "last re-plan" in the timeline report. | An exact moment. |

### `board`

**What it stores:** The Kanban boards of a project: the main board plus any extra boards (e.g. Testing).
**In the prototype today:** `Project.mainBoardName` and `Project.extraBoards` (a list of `ProjectBoard`) in `types/index.ts`; the main board has the fixed id `main` (`MAIN_BOARD_ID` in `lib/board-columns.ts`).
**Main screens:** `app/(workspace)/projects/[projectId]/board/page.tsx`, `components/projects/project-boards-settings.tsx` (in Settings), Boards step in `components/projects/new-project-plan-steps.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `board_id` | uuid | pk | Unique id of the board. Columns and board moves point to it. | FR-PROJ-005 | Board switcher on the board page. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project the board belongs to. | FR-PROJ-005; PLAN-10 | Boards listed per project. | uuid because `project.project_id` is uuid. |
| `name` | varchar | | Board name, e.g. "Main board", "QA & Testing". | FR-PROJ-005 | Board tabs on the board page; rename in `components/projects/project-boards-settings.tsx` (`renameBoard`). | Short text name. |
| `is_main` | boolean | | Marks the main board: new cards land there and it is always first. | FR-PROJ-005; Annex B §3.3 | Main board label; the main board cannot be deleted or moved (`moveBoard`, `deleteBoard` in `context/app-context.tsx`). | Yes/no flag. |
| `sort_order` | integer | | Order of boards below the main board. | FR-PROJ-005 ("extra boards shown below the main board, in order") | Up/down buttons in `components/projects/project-boards-settings.tsx` (`moveBoard`). | Whole number for ordering. |
| `created_at` | timestamp | | When the board was added. | None in SRS | Not shown. | An exact moment. |

### `board_column`

**What it stores:** The columns of each board, in order, each mapped to one of the five fixed task stages.
**In the prototype today:** `BoardColumn (types/index.ts)`, held in `Project.boardColumns` and `ProjectBoard.columns`; defaults in `DEFAULT_BOARD_COLUMNS` (`lib/board-columns.ts`).
**Main screens:** `app/(workspace)/projects/[projectId]/board/page.tsx`, `components/projects/board-columns-modal.tsx`, `components/projects/project-boards-settings.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `board_column_id` | uuid | pk | Unique id of the column. A task points to the column it sits in. | FR-PROJ-004 | Not shown; used for drag-and-drop targets. | uuid like every primary key. |
| `board_id` | uuid | fk → board | The board the column is on. | FR-PROJ-004; FR-PROJ-005 | Columns drawn per board. | uuid because `board.board_id` is uuid. |
| `name` | varchar | | Column title, e.g. "QA Testing". | FR-PROJ-004 (rename, add) | Column headers on the board; edit in `components/projects/board-columns-modal.tsx`. | Short text name. |
| `color` | varchar | | Column colour. | FR-PROJ-004 (recolour) | Column header colour; choices in `COLUMN_COLORS` (`lib/board-columns.ts`). | Short text: a colour code or CSS variable such as `var(--flash)`. |
| `status` | varchar | | The fixed stage the column counts as (todo, in_progress, review, done, blocked). Timer, agents, progress and reports read the stage, not the column name. | FR-PROJ-004; Annex B §3.3; PLAN-05 | Stage select per column in `components/projects/board-columns-modal.tsx`; dropping a card sets the task status from it (`placeIn` in `lib/board-columns.ts`). | Short word from a fixed app-level list (`TASK_STAGES`), so a new stage needs no schema change. |
| `sort_order` | integer | | Left-to-right position of the column. | FR-PROJ-004 (reorder) | Column order on the board; drag to reorder in the columns modal. | Whole number for ordering. |

### `phase`

**What it stores:** The phases of a project (top plan level), with dates and status.
**In the prototype today:** `Milestone (types/index.ts)` — phases are stored as milestones; tasks link with `milestoneId`.
**Main screens:** `app/(workspace)/projects/[projectId]/plan/page.tsx` (`app/(workspace)/projects/[projectId]/milestones/page.tsx` now redirects there), Phases step in `components/projects/new-project-plan-steps.tsx`, `components/plan/plan-modals.tsx`, milestone list on `app/(workspace)/projects/[projectId]/page.tsx`, `app/(workspace)/planner/milestones/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `phase_id` | uuid | pk | Unique id of the phase. Epics, stories and tasks point to it. | FR-PLAN-005; FR-PROJ-007 | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | FR-PLAN-005 | Phases listed per project on the plan page. | uuid because `project.project_id` is uuid. |
| `name` | varchar | | Phase name, e.g. "Phase 1: Architecture Baseline". | FR-PLAN-005; REQ-PRJ-004 (needs a name) | Plan tree, overview milestones card, calendar. | Short text name. |
| `description` | text | | What the phase covers. | FR-PLAN-005 | Overview milestones card (`app/(workspace)/projects/[projectId]/page.tsx`). | Free text. |
| `start_date` | date | | First day of the phase. | REQ-PRJ-004 (date range inside the project) | Plan modal date range; `phaseSpan` in `lib/schedule.ts`. | A calendar day. |
| `end_date` | date | | Last day of the phase. | REQ-PRJ-004 | Plan modal; timeline rows. | A calendar day. |
| `due_date` | date | | Target date of the phase (milestone date). The plan modal sets it equal to `end_date`. | FR-PLAN-005 (target dates); FR-PLAN-004 (milestones on the calendar) | "Due" on the overview milestones card; `app/(workspace)/planner/calendar/page.tsx`. | A calendar day. Overlaps `end_date` (see Issues). |
| `status` | varchar | | Phase state: upcoming, at_risk, completed, missed, pending or achieved. | FR-PLAN-005 (status from task completion and due date); Annex B §3.5 (checkpoints achieved, missed, at risk) | Status badges on the overview and plan page; "mark achieved" toggle on `plan/page.tsx`. | Short word from an app-level list. The list has overlapping words (see Issues). |
| `estimated_duration` | integer | | Planned length of the phase. | Frontend `Milestone.estimatedDuration (types/index.ts)`; FR-PLAN-006 | Not shown in the UI: no screen or calculation reads it; the phase span comes from its dates (`lib/schedule.ts`). | Whole number of days. |
| `duration_unit` | varchar | | Unit the phase length was entered in, for display ("2 months"). | FR-PLAN-006 | Date range field in `components/plan/plan-modals.tsx` and the wizard. | Short word from an app-level list (days / weeks / months). |
| `created_at` | timestamp | | When the phase was created. | None in SRS | Not shown. | An exact moment. |
| `updated_at` | timestamp | | When the phase was last changed. | None in SRS | Not shown. | An exact moment. |

### `epic`

**What it stores:** Large bodies of work inside a project, optionally inside a phase.
**In the prototype today:** `Epic (types/index.ts)`.
**Main screens:** `app/(workspace)/projects/[projectId]/plan/page.tsx`, `components/plan/plan-modals.tsx`, Epics step in `components/projects/new-project-plan-steps.tsx`, epic filter on `app/(workspace)/projects/[projectId]/tasks/page.tsx`, epic picker in `components/tasks/task-detail-drawer.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `epic_id` | uuid | pk | Unique id of the epic. | FR-PROJ-007 | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | FR-PROJ-007 | Epics listed per project. | uuid because `project.project_id` is uuid. |
| `phase_id` | uuid | fk → phase | The phase the epic sits in. Empty when the project has no phases. | FR-PROJ-007; REQ-PRJ-004 (an epic needs a phase when phases are on) | Phase picker in the epic modal (`components/plan/plan-modals.tsx`); locked when `allow_move` is off. | uuid because `phase.phase_id` is uuid. |
| `name` | varchar | | Epic name. | FR-PROJ-007; REQ-PRJ-004 | Plan tree, epic chips, task filters. | Short text name. |
| `description` | text | | What the epic covers. | FR-PROJ-007 | Epic modal and plan tree. | Free text. |
| `color` | varchar | | Epic colour for chips and plan rows. | FR-PROJ-007 ("name, description, and color") | Epic colour dot; choices in `EPIC_COLORS` (`lib/plan.ts`). | Short text colour code. |
| `start_date` | date | | The epic's own start inside its phase. Empty = the whole phase (or project). | REQ-PRJ-004 (range inside its parent) | Epic modal date range; `epicSpan` in `lib/schedule.ts`. | A calendar day. |
| `end_date` | date | | The epic's own end. | REQ-PRJ-004 | Same. | A calendar day. |
| `duration_unit` | varchar | | Unit the epic length was entered in, for display. | FR-PLAN-006 | Date range field in the epic modal. | Short word from an app-level list. |
| `created_at` | timestamp | | When the epic was created. | None in SRS | Not shown. | An exact moment. |
| `updated_at` | timestamp | | When the epic was last changed. | None in SRS | Not shown. | An exact moment. |

### `story`

**What it stores:** User stories ("As a …, I can …"), inside an epic, or inside a phase when the project has no epics.
**In the prototype today:** `Story (types/index.ts)`.
**Main screens:** `app/(workspace)/projects/[projectId]/plan/page.tsx`, `components/plan/plan-modals.tsx`, Stories step in `components/projects/new-project-plan-steps.tsx`, story picker in `components/plan/plan-picker.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `story_id` | uuid | pk | Unique id of the story. | FR-PROJ-007 | Not shown. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | FR-PROJ-007 | Stories listed per project. | uuid because `project.project_id` is uuid. |
| `epic_id` | uuid | fk → epic | The epic the story belongs to (empty when the project has no epics). | FR-PROJ-007; REQ-PRJ-004 (a story needs a parent) | Epic picker in the story modal. | uuid because `epic.epic_id` is uuid. |
| `phase_id` | uuid | fk → phase | The phase, only when the project uses stories but not epics. | FR-PROJ-007 (each level inside the nearest level used); Annex B §3.2 | Phase picker in the story modal (projects without epics). | uuid because `phase.phase_id` is uuid. |
| `title` | varchar | | The story sentence. | FR-PROJ-007 | Plan tree, story picker. | Short text title. |
| `description` | text | | More detail about the need. | FR-PROJ-007; WI-04 | Story modal. | Free text. |
| `acceptance_criteria` | text | | What must be true for the story to be accepted. | FR-PROJ-007; WI-04 | Story modal and plan page (`plan/page.tsx`). | Free text; criteria are often several lines. |
| `priority` | varchar | | low, medium, high or critical. | WI-05; frontend `Story.priority (types/index.ts)` | Story modal and plan tree. | Short word from an app-level list. |
| `start_date` | date | | The story's own start inside its epic. Empty = the whole epic. | REQ-PRJ-004 | Story modal; `storySpan` in `lib/schedule.ts`. | A calendar day. |
| `end_date` | date | | The story's own end. | REQ-PRJ-004 | Same. | A calendar day. |
| `duration_unit` | varchar | | Unit the story length was entered in, for display. | FR-PLAN-006 | Date range field in the story modal. | Short word from an app-level list. |
| `created_at` | timestamp | | When the story was created. | None in SRS | Not shown. | An exact moment. |
| `updated_at` | timestamp | | When the story was last changed. | None in SRS | Not shown. | An exact moment. |

### `sprint`

**What it stores:** Time-boxed iterations of a project, with goal, dates, status and capacity.
**In the prototype today:** `Sprint (types/index.ts)`.
**Main screens:** `app/(workspace)/projects/[projectId]/sprints/page.tsx`, `app/(workspace)/projects/[projectId]/sprints/[sprintId]/page.tsx`, sprint tab of `components/shared/quick-create-dialog.tsx`, sprint picker in `components/tasks/task-detail-drawer.tsx`; burndown from `sprintBurndown` in `lib/project-health.ts`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `sprint_id` | uuid | pk | Unique id of the sprint. Tasks point to it. | FR-PLAN-003 | In the sprint URL `sprints/[sprintId]`. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project. | FR-PLAN-003 | Sprints listed per project. | uuid because `project.project_id` is uuid. |
| `name` | varchar | | Sprint name, e.g. "Sprint 12". | FR-PLAN-003; PLAN-03 | Sprint cards and sprint detail page. | Short text name. |
| `goal` | text | | What the sprint aims to deliver. | FR-PLAN-003; PLAN-03 | Goal line on sprint cards (`sprints/page.tsx`) and the sprint page. | Free text sentence. |
| `status` | varchar | | planned, planning, active or completed. | FR-PLAN-003; REQ-PRJ-009 | Status badge; Start / Complete buttons on `sprints/page.tsx`. | Short word from an app-level list. "planned" and "planning" overlap (see Issues). |
| `start_date` | date | | First day of the sprint. | FR-PLAN-003; REQ-PRJ-009 (default 14 days) | Sprint cards and burndown. | A calendar day. |
| `end_date` | date | | Last day of the sprint. | FR-PLAN-003 | Sprint cards and burndown. | A calendar day. |
| `capacity` | integer | | How much work the sprint can take (story points or hours). | FR-PLAN-003; REQ-PRJ-009 (default 20); PLAN-08 | Entered in the sprint tab of `components/shared/quick-create-dialog.tsx`; not displayed on the sprint pages. | Whole number. |
| `created_at` | timestamp | | When the sprint was created. | None in SRS | Not shown. | An exact moment. |

## Slice 3 — Tasks and time

### `task`

**What it stores:** Every work item of a project (task, bug, story-type item, subtask): where it sits on the board and in the plan, who does it, its estimate and dates, and where it came from.
**In the prototype today:** `Task (types/index.ts)`. `boardId` is not stored (it comes from the column), `milestoneId` becomes `phase_id`, `points` and `storyPoints` merge into `story_points`, `tags`/`labels` move to `task_tag`, and `comments`, `checklist`, `attachments` move to their own tables. `sourceDocumentName` is not stored (read from the file).
**Main screens:** `app/(workspace)/projects/[projectId]/board/page.tsx`, `app/(workspace)/projects/[projectId]/tasks/page.tsx`, `app/(workspace)/projects/[projectId]/tasks/new/page.tsx`, `components/tasks/create-task-modal.tsx`, `components/shared/quick-create-dialog.tsx`, `components/tasks/task-detail-drawer.tsx`, `app/(workspace)/tasks/[taskId]/page.tsx`, `app/(workspace)/my-tasks/page.tsx`, `app/(workspace)/projects/my-tasks/page.tsx`, `app/(workspace)/projects/[projectId]/plan/page.tsx`, `app/(workspace)/projects/[projectId]/timeline/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_id` | uuid | pk | Unique id of the task. Comments, sessions, moves and subtasks point to it. | Entity 4 (`id`) | In the URL `app/(workspace)/tasks/[taskId]/page.tsx`. | uuid like every primary key. |
| `project_id` | uuid | fk → project | The project the task belongs to. | Entity 4 (`projectId`, cascade on delete); REQ-PRJ-008 | Task lists per project; My Tasks groups by project. | uuid because `project.project_id` is uuid. |
| `board_column_id` | uuid | fk → board_column | The column the card sits in. The board is found through the column, so no `board_id` is stored. schema.txt says it is empty while the task is in the backlog. | FR-TASK-002; FR-PROJ-005; Annex B §3.3 ("Dropping a card on a column sets boardId, columnId and status") | Card position on `board/page.tsx`; "Board placement" in the drawer (`components/tasks/placement-select.tsx`); `placementOf` in `lib/board-columns.ts`. | uuid because `board_column.board_column_id` is uuid. Note: "backlog" in the prototype means "no phase, epic or story", not "not on a board" (see Issues). |
| `parent_task_id` | uuid | fk → task (subtasks) | Makes this task a subtask of another task. Subtasks are one level deep. | FR-TASK-003; BR-02; Annex B §3.3 | Subtask list in the drawer and on cards (`components/tasks/card-subtasks.tsx`); tree rows on `tasks/page.tsx`. | uuid because it points to `task.task_id` in the same table. |
| `sprint_id` | uuid | fk → sprint | The sprint the task is planned in. Empty = not in a sprint. | FR-PLAN-003; Annex B §3.3 (plan links) | Sprint picker in the drawer; sprint task lists on `sprints/[sprintId]/page.tsx`. | uuid because `sprint.sprint_id` is uuid. |
| `phase_id` | uuid | fk → phase | The phase, when phase is the lowest plan level the project uses. | FR-PLAN-005; FR-PROJ-007 (prototype `milestoneId`) | Plan picker in the drawer (`components/plan/plan-picker.tsx`); milestone filter on `tasks/page.tsx`. | uuid because `phase.phase_id` is uuid. |
| `epic_id` | uuid | fk → epic | The epic, when epic is the lowest plan level used. | FR-PROJ-007; FR-TASK-011 (epic filter) | Plan picker; epic filter on `tasks/page.tsx`. | uuid because `epic.epic_id` is uuid. |
| `story_id` | uuid | fk → story | The story, when stories are used. | FR-PROJ-007 | Plan picker in the drawer; story rows on `plan/page.tsx`. | uuid because `story.story_id` is uuid. |
| `assignee_user_id` | uuid | fk → users | The person doing the task. Empty = unassigned. Also the person the timer runs for. | Entity 4 (`assigneeId`); REQ-TSK-021; WI-08 | Assignee avatar on cards; picker in the drawer; My Tasks (`assigneeId === currentUser.id`). | uuid because `users.user_id` is uuid. |
| `reporter_user_id` | uuid | fk → users | The person who created or reported the task. | FR-TASK-001 (`reporterId = currentUser.id`); Entity 4 | Reporter in the drawer and on `app/(workspace)/tasks/[taskId]/page.tsx`. | uuid because `users.user_id` is uuid. |
| `source_project_file_id` | uuid | fk → project_file (SRS-generated tasks) | The SRS file the task was generated from. | Entity 4 (`sourceDocumentId` references `ProjectFile.id`); FR-SRS-006 (traceability link to the source SRS) | Source file name in the drawer Details tab; set in `app/(workspace)/projects/[projectId]/files/page.tsx`. | uuid because `project_file.project_file_id` is uuid. |
| `task_key` | varchar | | Human-readable key, e.g. FS-42 (a subtask uses FS-42-1). Stays the same when the title changes. | FR-TASK-001; REQ-TSK-007; WI-01; DATA-02 | On every card, row and the drawer header; made by `nextTaskKey` in `context/app-context.tsx`. | Short text code. |
| `title` | varchar | | Short title of the task. Required. | FR-TASK-001 ("Title is required") | Cards, lists, drawer. | Short text, one line. |
| `description` | text | | Details, steps or reproduction notes. | FR-TASK-001; Entity 4 | Drawer Details tab; task page. | Free text of any length. |
| `type` | varchar | | story, bug, task, epic or subtask. | FR-TASK-001; Annex B §3.3; WI-01 | Type picker in `components/shared/quick-create-dialog.tsx`; default `subtask` when a parent is set (`addTask` in `context/app-context.tsx`). | Short word from an app-level list. "epic" and "subtask" overlap with the `epic` table and `parent_task_id` (see Issues). |
| `status` | varchar | | The stage: todo, in_progress, review, done or blocked. Drives the timer and progress. Must match the stage of its column. | FR-TASK-002; FR-PROJ-004; Annex B §3.3 and §3.4 | Card column on the board; status filter on `tasks/page.tsx`; My Tasks sections. | Short word from a fixed app-level list. Stored next to the column (see Issues). |
| `priority` | varchar | | low, medium (default), high or critical. | FR-TASK-001; Annex B §3.3; WI-05 | `PriorityBadge` on cards; priority filter. | Short word from an app-level list. |
| `estimated_duration` | integer | | Estimate in days (calendar or work days) used to build the timeline. Default 3, or 1 for a subtask; at least 1. | FR-TASK-001; FR-PLAN-001; FR-PLAN-006; BR-02; BR-04 | Estimate field in the drawer and create modal (`components/shared/duration-fields.tsx`); used by `lib/timeline-calculator.ts`. | Whole number of days; the unit for display is kept separately. |
| `duration_unit` | varchar | | Unit the estimate was entered in, so "2 weeks" shows as typed while the estimate is kept in days. | FR-PLAN-006 | Estimate field; formatted by `formatDays` in `lib/durations.ts`. | Short word from an app-level list. |
| `effort_minutes` | integer | | Planned hours of work, kept in minutes, compared with the time logged by the timer. Separate from the estimate in days. | Annex B §3.3 ("effortMinutes for planned effort"); WI-15 | Effort field in the drawer (`EffortField`); planned vs worked in `components/reports/task-time-report.tsx` and `components/tasks/time-log.tsx`. | Whole number of minutes, so no fractions of hours are needed. The note in schema.txt says "hours" (see Issues). |
| `story_points` | integer | | Agile size estimate (1, 2, 3, 5, 8, 13). | Entity 4 (`storyPoints`); WI-15 (points are not time) | "Story points" in the drawer Details tab; workload views under `app/(workspace)/teams/workload/page.tsx` (teams hidden). | Whole number. |
| `start_date` | date | | Planned start day. | FR-TASK-001; FR-PLAN-001 | Date range in the drawer and create modal; Gantt on `timeline/page.tsx`. | A calendar day. |
| `due_date` | date | | Planned finish (deadline). | FR-TASK-001; FR-PLAN-004 (task deadlines on the calendar) | Due date on cards; overdue counts on the overview; `app/(workspace)/planner/calendar/page.tsx`. | A calendar day. |
| `acceptance_criteria` | text | | Conditions the task must meet to be accepted. | Entity 4; WI-04; WI-10 | Acceptance criteria box in the drawer; task page. | Free text, often several lines. |
| `source_section` | varchar | | The SRS section the task came from, e.g. "§3.1.4". | Entity 4 (`sourceSection`); FR-SRS-006 | Section badge next to the source file in the drawer. | Short text reference. |
| `is_srs_generated` | boolean | | Marks tasks created by the AI SRS analysis, so they can be badged and filtered. | Entity 4 (`isSrsGenerated`) | "SRS Generated" badge in the drawer and "SRS" badge on board cards (`board/page.tsx`). | Yes/no flag. |
| `created_at` | timestamp | | When the task was created. | FR-TASK-001 (creation timestamps); Entity 4 | Not shown as a label; used in reports. | An exact moment. |
| `updated_at` | timestamp | | When the task was last changed. | Frontend `Task.updatedAt (types/index.ts)` | Not shown. | An exact moment. |
| `deleted_at` | timestamp | | When the task was deleted (soft delete). Lets work sessions stay and show as "deleted task" in reports. | REQ-TSK-005; DATA-06 | Not shown in the UI: the prototype removes the task at once (`deleteTask` in `context/app-context.tsx`, after `components/shared/confirm-delete-modal.tsx`). | An exact moment; empty = not deleted. |

**Rules:**
- `unique (project_id, task_key)` — task keys never repeat inside a project, even after deletes and imports (REQ-TSK-007, DATA-02).
- Only one of `phase_id` / `epic_id` / `story_id` is filled: the lowest plan level the project uses. The higher levels are reached through it (a story knows its epic, an epic its phase). This avoids storing the same link twice and keeps the links from disagreeing when a story moves to another epic. It matches `resolvePlan` in `lib/plan.ts`, which today keeps all three in step.

### `task_tag`

**What it stores:** Labels on a task (one row per label).
**In the prototype today:** `Task.tags` and `Task.labels (types/index.ts)` (two copies of the same list).
**Main screens:** Tags in the drawer Details tab (`components/tasks/task-detail-drawer.tsx`); label input on `app/(workspace)/projects/[projectId]/tasks/new/page.tsx`; board search on `board/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_tag_id` | uuid | pk | Unique id of this tag row. | Schema rule (lists are their own tables) | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task. | WI-03 (labels); COL-03 (filter by label) | Tags under the task. | uuid because `task.task_id` is uuid. |
| `tag` | varchar | | The label text, e.g. "Frontend". | WI-03; PLAN-01 (label filter) | Tag chips in the drawer; matched by the board search. | Short text label. |

### `task_comment`

**What it stores:** Comments posted on a task.
**In the prototype today:** `TaskComment (types/index.ts)`, inside `Task.comments`.
**Main screens:** Comments tab of `components/tasks/task-detail-drawer.tsx`; comment counts per board stage in `components/tasks/task-journey.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_comment_id` | uuid | pk | Unique id of the comment. | FR-TASK-010 | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task the comment is on. | FR-TASK-010 | Comment count badge on the Comments tab. | uuid because `task.task_id` is uuid. |
| `author_user_id` | uuid | fk → users | Who wrote it. | FR-TASK-010 (authorship) | Author name and avatar next to each comment. | uuid because `users.user_id` is uuid. |
| `body` | text | | The comment text. | FR-TASK-010 (empty is not allowed) | Comment stream in the drawer. | Free text of any length. |
| `created_at` | timestamp | | When it was posted. | FR-TASK-010 (timestamped, chronological) | Relative time ("2h ago") next to each comment; also used to count comments per board stage (`lib/task-journey.ts`). | An exact moment. |
| `updated_at` | timestamp | | When it was last edited. | None in SRS | Not shown in the UI: the prototype has no comment editing. | An exact moment. |

### `task_checklist_item`

**What it stores:** Checklist items on a task, each ticked or not.
**In the prototype today:** `TaskChecklistItem (types/index.ts)`, inside `Task.checklist`.
**Main screens:** Checklist tab of `components/tasks/task-detail-drawer.tsx`; checklist input on `app/(workspace)/projects/[projectId]/tasks/new/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_checklist_item_id` | uuid | pk | Unique id of the item. | FR-TASK-009 | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task. | FR-TASK-009 | "3 of 5 done" summary in the Checklist tab. | uuid because `task.task_id` is uuid. |
| `text` | varchar | | What needs doing. | FR-TASK-009 | Item text in the checklist. | Short text, one line. |
| `is_completed` | boolean | | Whether the item is ticked. | FR-TASK-009 (`completed`) | Checkbox; completion ratio. | Yes/no flag. |
| `sort_order` | integer | | Position in the list (the prototype used array order). | FR-TASK-009 (items appended in order) | Order of the checklist. | Whole number for ordering. |

### `task_attachment`

**What it stores:** Files attached to a task. The file itself is in object storage; this row links the task to its `stored_file`.
**In the prototype today:** `Task.attachments (types/index.ts)`, a list of file names only (mock, no real file).
**Main screens:** Attachments tab of `components/tasks/task-detail-drawer.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_attachment_id` | uuid | pk | Unique id of this attachment link. | FR-TASK-006 (Attachments tab); WI-09 | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task. | FR-TASK-006; WI-09 | Attachment count on the Attachments tab. | uuid because `task.task_id` is uuid. |
| `stored_file_id` | uuid | fk → stored_file | The file (name, size, storage key come from `stored_file`). | WI-09; DATA-07 (files in storage, not the database) | Attachment name in the Attachments tab. | Written as uuid, but `stored_file.stored_file_id` is now bigserial, so this must be bigint to match (see Issues). |
| `uploaded_by_user_id` | uuid | fk → users | Who attached the file. | WI-06 (actor identity) | Not shown in the UI (the prototype keeps names only). | uuid because `users.user_id` is uuid. |
| `created_at` | timestamp | | When it was attached. | None in SRS | Not shown. | An exact moment. |

### `task_status_change`

**What it stores:** Every move of a task between stages and/or boards: from, to, who, through which tool, and when. It is the history used for task time, the journey, burndown and "finished" dates.
**In the prototype today:** `TaskStatusChange (types/index.ts)`, written by `trackStatusMove` and `startParentOf` in `context/app-context.tsx`.
**Main screens:** Journey tab (`components/tasks/task-journey.tsx`, `lib/task-journey.ts`) in `components/tasks/task-detail-drawer.tsx`; `components/reports/task-time-report.tsx` on `app/(workspace)/reports/task-time/page.tsx`; `components/reports/project-overview.tsx`; `components/tasks/task-progress.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `task_status_change_id` | uuid | pk | Unique id of the move. | FR-TASK-002 (audit record) | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task that moved. | FR-TASK-002; FR-TASK-008 | Journey tab of that task. | uuid because `task.task_id` is uuid. |
| `changed_by_user_id` | uuid | fk → users (for an agent: the person it works for) | Who moved it. For an AI agent, the person it acts for, so a human is always responsible. | FR-TASK-008 (actor); WF-07; WI-08 | "Moved here by …" in `components/tasks/task-journey.tsx`. | uuid because `users.user_id` is uuid. |
| `from_board_id` | uuid | fk → board; set when the card moved board | The board the card left. Empty when the move stayed on one board. | FR-PROJ-005; FR-TASK-008 | Journey stages per board (`lib/task-journey.ts`). | uuid because `board.board_id` is uuid. |
| `to_board_id` | uuid | fk → board | The board the card went to. | FR-PROJ-005; FR-TASK-008 | Journey stage names. | uuid because `board.board_id` is uuid. |
| `from_status` | varchar | | Stage before the move. | FR-TASK-002; WF-07 (prior state) | Used to find when a task entered In Progress (`inProgressSince` in `lib/subtasks.ts`). | Short word from the fixed stage list. |
| `to_status` | varchar | | Stage after the move. | FR-TASK-002; WF-07 (new state); Annex B §3.5 ("finished" = first move into In Review or Done) | Finished dates in `finishedAt` (`lib/project-health.ts`); elapsed time In Progress → In Review in the task time report. | Short word from the fixed stage list. |
| `via` | varchar | | Which channel made the move: web app or an AI agent client (claude_code, codex, gemini_cli, antigravity). | FR-TASK-008 (source web or AI agent); WF-07 (execution provider) | Agent name next to "Moved here by" in `components/tasks/task-journey.tsx`. | Short word from an app-level list (`AgentClient` plus web). |
| `changed_at` | timestamp | | When the move happened. | FR-TASK-002 (records audit timestamp); WF-07 | Journey entry/exit times; burndown (`sprintBurndown` in `lib/project-health.ts`). | An exact moment, needed for minute-level time and ordering. |

### `work_session`

**What it stores:** One block of time one person (or an agent for them) worked on one task. A session is running while `ended_at` is empty. Worked time is the sum of these.
**In the prototype today:** `WorkSession (types/index.ts)`; opened and closed by `trackStatusMove` and the agent actions in `context/app-context.tsx`, auto-stopped by `applyAutoStops` in `lib/task-time.ts`, manual entries by `logManualTime`.
**Main screens:** Progress & Time tab (`components/tasks/time-log.tsx`) in `components/tasks/task-detail-drawer.tsx`; `app/(workspace)/teams/timesheet/page.tsx` (review list); `components/agents/task-timer-badge.tsx`; `components/agents/my-work-card.tsx`; `app/(workspace)/my-tasks/page.tsx`; `app/(workspace)/reports/task-time/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `work_session_id` | uuid | pk | Unique id of the session. | Entity 5 (`id`) | Not shown. | uuid like every primary key. |
| `task_id` | uuid | fk → task | The task worked on. Never a container task (a task with subtasks). | Entity 5; BR-01; REQ-TSK-022; REQ-TSK-029 | Time log per task; worked time on cards and reports. | uuid because `task.task_id` is uuid. |
| `user_id` | uuid | fk → users | The person whose time it is (the assignee, or the mover if none). | Entity 5; REQ-TSK-020; REQ-TSK-021 | Person column in the time log and timesheet; "Claude Code for Ana" in the journey. | uuid because `users.user_id` is uuid. |
| `source` | varchar | | What started it: web (status move in the app), manual (typed-in time) or an AI agent client. | Entity 5 (`source`); Annex B §3.4 | Source shown in `components/reports/task-time-report.tsx` and the journey worker list. | Short word from an app-level list. |
| `started_at` | timestamp | | When the session began. | Entity 5; Annex B §3.4 | Time log rows; running timer in `components/agents/task-timer-badge.tsx`. | An exact moment. |
| `ended_at` | timestamp | | When it ended. Empty while running. | Entity 5; REQ-TSK-020 | Time log rows; timesheet correction sets it (`updateWorkSession`). | An exact moment; empty means "still running". |
| `last_activity_at` | timestamp | | Last sign of activity (pointer, keyboard or agent call). Used for the idle auto-stop. | Entity 5; REQ-TSK-023; REQ-TSK-024 | Not shown in the UI: used by `autoStopFor` in `lib/task-time.ts` (idle timeout ends the session at this time). | An exact moment. |
| `end_reason` | varchar | | Why it ended: paused, finished, switched_task, idle_timeout or day_cutoff. | Entity 5; Annex B §3.4 (trigger table) | Auto-stop counts in the task time report (`taskTimeRows` in `lib/task-time.ts`). | Short word from an app-level list. |
| `needs_review` | boolean | | Set when the system auto-stopped the session, so the person checks and corrects it. | Entity 5; REQ-TSK-027 | "To review" list on `app/(workspace)/teams/timesheet/page.tsx`; warning in `components/agents/my-work-card.tsx`. | Yes/no flag. |
| `note` | text | | What was done (manual entry note, agent pause note or finish summary). | Entity 5 (`note`); REQ-TSK-025 | Note column in `components/tasks/time-log.tsx`. | Free text. |

#### Issues found in slices 2–3

- `team_project.team_id` is `fk → team`, but the `team` table was removed from schema.txt. The foreign key cannot be created. Either restore `team` (teams are only hidden by `FEATURES.teams = false`) or drop `team_project`.
- `task_attachment.stored_file_id` is `uuid`, but `stored_file.stored_file_id` is now `bigserial`. It must be `bigint` to match. The same mismatch exists on `project_file.stored_file_id` (Slice 5), which `task.source_project_file_id` points to.
- `baseline_change.start_date` / `end_date` are described as the "new baseline", but `BaselineChange` in `types/index.ts`, the save code in `projects/[projectId]/settings/page.tsx` and FR-PLAN-002 all store the baseline as it was before the change. Pick one meaning. If it stays "new", the latest row repeats `project.original_start_date` / `original_end_date` (stored twice).
- `project.status = archived` and `project.archived_at` both say "archived": two sources of truth that can disagree. The prototype's `archiveProject` only toggles a flag and does not change status.
- `project.end_date` and `project.due_date` overlap: the wizard sets both to the same day, and screens show `dueDate`, falling back to `endDate`. The meaning of each, and how they relate to `original_end_date`, needs defining, or one should go.
- `project.health` is stored even in auto mode, where it is calculated from the timeline (REQ-PRJ-006). This breaks the "nothing calculated is stored" rule, unless it is meant as a cache or only kept for manual mode.
- `project.category` and `project.icon` are not shown anywhere in the UI (`category` is only copied on duplicate, `icon` is never read). Confirm they are needed.
- `project_tag` has no `unique (project_id, tag)` and `task_tag` has no `unique (task_id, tag)`, so the same tag can be added twice. Project tags are also not shown or searched today, though FR-PROJ-009 says search covers tags.
- `board.is_main` says "one main board per project", but no rule enforces it (needs a partial unique index on `project_id` where `is_main`).
- `board_column` has no way to show that an extra board mirrors the main board's columns (Annex B §3.3; `ProjectBoard.columns` missing = mirror). Each board would need its own copies of the columns, or a mirror flag on `board`. The rule that each board keeps a todo / in_progress / review / done column (`REQUIRED_STAGES`) can only be checked in the app.
- `task.board_column_id` "empty while in the backlog" does not match the prototype. There, backlog means "no phase, epic or story" (`inBacklog` in `lib/structure.ts`) and the card stays on the board. With the column empty, the task's board is also unknown.
- `task.status` repeats the stage of its column ("matches its column's stage"), so it is stored twice. This is needed when a task has no column, but the two must be kept in step.
- The task rule "only one of phase_id / epic_id / story_id is filled" does not say what subtasks hold. In the prototype a subtask takes its parent's plan (`planOf` in `lib/plan.ts`), so all three should be empty on subtasks. The prototype also stores all three links today, so moving data across must keep only the lowest one.
- `task.type` includes `epic` and `subtask`, but epics are their own table and a subtask is defined by `parent_task_id`. The values can disagree (e.g. a task of type `epic`, or type `subtask` with no parent).
- `task.effort_minutes` note says "planned hours of work", but the value is in minutes. The wording should say minutes.
- `phase.status` mixes words that mean the same: `completed` / `achieved` and `upcoming` / `pending`. FR-PLAN-005 also says status is calculated from linked tasks, so storing it repeats a calculated value.
- `phase.due_date` and `phase.end_date` overlap: the plan modal sets them to the same day.
- `phase.estimated_duration` is not read by any screen or calculation. The phase span comes from its dates.
- `sprint.status` has both `planned` and `planning` (mock data uses `planned`, `sprints/page.tsx` creates `planning`). They mean the same thing. REQ-PRJ-010 (only one active sprint per project) is not enforced (needs a partial unique index). `sprint` has no `updated_at`, though sprints are edited (status, dates).
- `work_session` does not enforce REQ-TSK-020 (one running session per person). This needs a partial unique index on `user_id` where `ended_at` is empty.
- `task_comment.updated_at` exists, but the prototype has no comment editing.
- `task_status_change.to_board_id` has no note. It should be set together with `from_board_id` (both empty for a move on the same board), as in the prototype.
- `user_recent_project` has no limit. FR-PROJ-008 says to keep 5, but the code keeps 10 (`addRecentProject` in `context/app-context.tsx`). Trimming the list is an app job and the number needs agreeing.
- `project.deleted_at` and `task.deleted_at` mean soft delete, but the prototype deletes projects and tasks at once and has no project or task Trash (REQ-PRJ-008 calls deletion permanent).

---

## Slice 4 — Planning and team

### `calendar_event`

**What it stores:** One entry on the shared planning calendar: a team event, a planning reminder, a deadline or milestone marker, a meeting, or an approved leave block.
**In the prototype today:** `CalendarEvent` in `types/collaboration.ts` (the `calendarEvents` list in `context/app-context.tsx`). The prototype also writes a copy of every new meeting (`addMeeting`) and every approved leave (`approveTimeOffRequest`) into this list, linked only by an id naming pattern (`evt-meet-<id>`, `evt-to-<id>`).
**Main screens:** `app/(workspace)/planner/calendar/page.tsx` (month, week, day and agenda views, category and member filters), `components/collaboration/create-calendar-event-dialog.tsx` (create and edit), `components/collaboration/meeting-detail-drawer.tsx` (opens when the clicked event is a meeting). `app/(workspace)/planner/page.tsx` and `app/(workspace)/planner/milestones/page.tsx` only redirect to the calendar. The roadmap calendar on `app/(workspace)/projects/planner/page.tsx` is built from tasks and phases directly, not from this table.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `calendar_event_id` | uuid | pk | Identifies one event so it can be opened, edited or deleted. | Annex B §6.6 conventions ("id is a UUID primary key") | Not shown in the UI. `CalendarEvent.id` is used to edit and delete events and to find the linked meeting in `planner/calendar/page.tsx`. | uuid, the project-wide key type: safe to create on any server and not guessable. |
| `organization_id` | uuid | fk → organization | Says which organisation owns the event; every calendar query filters on it so one company never sees another's events. | DATA-01; Annex B §6.6 ("orgId is on every top-level table") | Not shown in the UI (the prototype holds one organisation; `CalendarEvent` has no such field). | uuid, same type as `organization.organization_id`. |
| `organizer_user_id` | uuid | fk → users | The person who created or runs the event. Empty for events the system creates (approved leave). | FR-PLAN-004; FR-TEAM-004 | `CalendarEvent.organizerId`. Defaults to the current user in `create-calendar-event-dialog.tsx`; the member filter in `planner/calendar/page.tsx` matches organizer or attendee. | uuid, same type as `users.user_id`. |
| `team_id` | uuid | fk → team | Links the event to a team so the calendar can be filtered by team. | ORG-02 (teams) | `CalendarEvent.teamId`. "Related Team" picker in `create-calendar-event-dialog.tsx`, team filter and "Squad:" label in `planner/calendar/page.tsx`. All hidden while `FEATURES.teams = false` (`lib/features.ts`). | uuid would match a team key, but **the `team` table no longer exists in schema.txt**, so this foreign key points to nothing. Either restore `team` or drop this column. |
| `project_id` | uuid | fk → project | Optional link to the project the event belongs to. | FR-PLAN-004 (calendar gathers project dates) | `CalendarEvent.projectId`. "Related Project" select in `create-calendar-event-dialog.tsx`; "Project: name" in the agenda view of `planner/calendar/page.tsx`. | uuid, same type as `project.project_id`. Empty when the event is not about a project. |
| `task_id` | uuid | fk → task | For a `task_deadline` entry: the task whose deadline it marks. | FR-PLAN-004 (`task_deadline`: Task Key + Title) | Not shown in the UI. `CalendarEvent.taskId` exists but no screen sets it; task deadlines on `projects/planner/page.tsx` are read from the task's own due date. | uuid, same type as `task.task_id`. |
| `phase_id` | uuid | fk → phase | For a `milestone` entry: the phase (milestone) it marks. | FR-PLAN-004; FR-PLAN-005 (milestones are phases) | Not shown in the UI. Replaces `CalendarEvent.milestoneId`, which no screen sets. `/planner/milestones` redirects to the calendar filtered to milestones. | uuid, same type as `phase.phase_id`. |
| `title` | varchar | | The short name shown on the calendar cell. | FR-PLAN-004 | "Event Title" (required) in `create-calendar-event-dialog.tsx`; shown in every view of `planner/calendar/page.tsx`. | varchar: a short one-line name. |
| `description` | text | | Notes, context or agenda for the event. | FR-PLAN-004 | "Description / Notes" in the dialog; second line in the agenda view. | text: free notes with no fixed length. |
| `category` | varchar | | The kind of entry. Drives the colour badge and the category filter. | FR-PLAN-004 (task_deadline, milestone, meeting, time_off); `team_event` and `planning_reminder` come from `EventCategory` in `types/collaboration.ts` | Category buttons in the dialog; coloured badge and "Deadlines / Milestones / ..." filter in `planner/calendar/page.tsx`. | varchar with a fixed list of allowed values kept in the app (not a database enum), so a new category needs no schema change. |
| `start_at` | timestamp | | When the event starts. | FR-PLAN-004; DATA-04 (store UTC, show in the user's zone) | "Start Date & Time" in the dialog; date and time box in the agenda view. | timestamp with time zone: one exact moment that people in different zones see correctly. For all-day events the app should read only the date in the organisation's time zone. |
| `end_at` | timestamp | | When the event ends. The dialog rejects an end that is not after the start. | FR-PLAN-004; FR-TEAM-004 (end before start is rejected) | "End Date & Time" in the dialog. | timestamp with time zone, same reason as `start_at`. |
| `all_day` | boolean | | Marks a whole-day event (leave, milestone day); the inputs switch to dates only. | FR-PLAN-004; FR-TEAM-003 (approved leave shows as a blocked bar) | "All-Day Event" checkbox in the dialog; approved leave is created with `allDay: true`. | boolean: a yes/no flag. |
| `location` | varchar | | Room or place of the event. | FR-TEAM-004 (meeting details) | "Location" field in the dialog. | varchar: a short place name. |
| `meeting_link` | varchar | | Video call URL so people can join in one click. | FR-TEAM-004 ("video conference links") | "Demo Video Link" field in the dialog. | varchar: a URL, short text. |
| `created_at` | timestamp | | When the event was created. | Annex B §6.6 conventions | Not shown in the UI (`CalendarEvent.createdAt`). | timestamp with time zone: an exact moment. |

### `calendar_event_attendee`

**What it stores:** Who is invited to a calendar event, one row per person per event.
**In the prototype today:** `CalendarEvent.attendeeIds` (a list of user ids) in `types/collaboration.ts`.
**Main screens:** "Attendees" grid in `components/collaboration/create-calendar-event-dialog.tsx`; member filter in `app/(workspace)/planner/calendar/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `calendar_event_attendee_id` | uuid | pk | Identifies one invitation row. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `calendar_event_id` | uuid | fk → calendar_event | The event the person is invited to. | FR-PLAN-004 | Not shown directly; it groups the attendee list of one event. | uuid, same type as `calendar_event.calendar_event_id`. |
| `user_id` | uuid | fk → users | The invited person. For approved leave this is the member on leave. | FR-PLAN-004; FR-TEAM-003 (approved leave blocks the member) | Selected attendee chips in the dialog (`toggleAttendee`); member filter on the calendar page. | uuid, same type as `users.user_id`. |

**Rules:** `unique (calendar_event_id, user_id)`: a person can be on one event only once. It stops double invites if the attendee toggle or an API call adds the same person twice.

### `meeting`

**What it stores:** A scheduled team meeting: date, start and end time, place, video link and status.
**In the prototype today:** `Meeting` in `types/collaboration.ts`. `durationMinutes` is not stored because it can be calculated from the start and end times.
**Main screens:** `app/(workspace)/planner/meetings/page.tsx` (list with Upcoming / Past tabs), `app/(workspace)/planner/meetings/new/page.tsx`, `components/collaboration/create-meeting-dialog.tsx` (also opened from `app/(workspace)/teams/page.tsx` and `app/(workspace)/planner/calendar/page.tsx`), `components/collaboration/meeting-detail-drawer.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `meeting_id` | uuid | pk | Identifies one meeting. | Annex B §6.6 conventions | Not shown in the UI (`Meeting.id`). | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation the meeting belongs to; used to isolate data between companies. | DATA-01; Annex B §6.6 (orgId on top-level tables) | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `organizer_user_id` | uuid | fk → users | The host. The dialog also adds the host to the participants. | FR-TEAM-004 | `Meeting.organizerId`. "Organizer:" and "(Host)" in `meeting-detail-drawer.tsx`; meetings page search covers the organizer. | uuid, same type as `users.user_id`. |
| `team_id` | uuid | fk → team | Links the meeting to a team (squad). | ORG-02 (teams) | `Meeting.teamId`. "Related Squad" picker in `planner/meetings/new/page.tsx` and team filter in `planner/meetings/page.tsx`, both hidden while `FEATURES.teams = false`. | uuid would match a team key, but **the `team` table no longer exists in schema.txt**, so this foreign key points to nothing. |
| `project_id` | uuid | fk → project | Optional project the meeting is about. | No SRS requirement; source is `Meeting.projectId` | Project select in `planner/meetings/new/page.tsx` and the dialog; project name ("Workspace Level" when empty) in `meeting-detail-drawer.tsx`. | uuid, same type as `project.project_id`. |
| `title` | varchar | | Name of the meeting. | FR-TEAM-004 | Title field in `meetings/new`; list rows; drawer header. | varchar: a short name. |
| `description` | text | | What the meeting is for. | FR-TEAM-004 | Description field in `meetings/new` and the dialog; drawer. | text: free text of any length. |
| `meeting_date` | date | | The day of the meeting. | FR-TEAM-004 (Date) | `Meeting.date` (YYYY-MM-DD). Date field in `meetings/new`; Today / Upcoming / Past tabs compare it with today. | date: a calendar day with no time. |
| `start_time` | time | | Start clock time on that day. | FR-TEAM-004 (Start Time) | `Meeting.startTime`, kept today as text such as "10:00 AM". Start time select in `meetings/new`; used for the overlap warning. | time: a clock time of day. It has no time zone, so it must be read in the organisation's zone (`organization.timezone`). |
| `end_time` | time | | End clock time. Must be after the start. | FR-TEAM-004 (End Time; end before start is rejected) | End time in `meetings/new` and the dialog; drawer. | time: a clock time of day (same time-zone note as `start_time`). |
| `location` | varchar | | Room or place. | FR-TEAM-004 | Location field; shown in `meeting-detail-drawer.tsx`. The prototype fills "FlashSign Conference Room A" when empty. | varchar: a short place name. |
| `meeting_link` | varchar | | Video call URL with a join and copy button. | FR-TEAM-004 ("video conference links") | Video link field in `meetings/new`; link and copy button in `meeting-detail-drawer.tsx`. | varchar: a URL. |
| `status` | varchar | | upcoming / completed / cancelled. Cancelling keeps the meeting but marks it. | FR-TEAM-004 | `MeetingStatusBadge` in the drawer; Cancel button calls `cancelMeeting`; Past tab also counts `completed`. No action sets `completed` today (only demo data). | varchar with a fixed list of allowed values kept in the app. |
| `created_at` | timestamp | | When the meeting was scheduled. | Annex B §6.6 conventions | Not shown in the UI (`Meeting.createdAt`). | timestamp with time zone: an exact moment. |

### `meeting_participant`

**What it stores:** The people invited to a meeting, one row per person.
**In the prototype today:** `Meeting.participantIds` (a list of user ids).
**Main screens:** participant picker in `app/(workspace)/planner/meetings/new/page.tsx` and `components/collaboration/create-meeting-dialog.tsx` (with the "overlapping commitments" warning); participant list in `components/collaboration/meeting-detail-drawer.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `meeting_participant_id` | uuid | pk | Identifies one participant row. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `meeting_id` | uuid | fk → meeting | The meeting. | FR-TEAM-004 ("participant lists") | Not shown directly; groups the list for one meeting. | uuid, same type as `meeting.meeting_id`. |
| `user_id` | uuid | fk → users | The invited person; also gets an invite notification. | FR-TEAM-004 ("Meeting appears on all participant calendars") | Avatars and names in `meeting-detail-drawer.tsx`; conflict check in `meetings/new`. | uuid, same type as `users.user_id`. |

**Rules:** `unique (meeting_id, user_id)`: a person is listed once per meeting. The prototype removes duplicates with a `Set` when the host is added; the database rule makes that permanent.

### `meeting_agenda_item`

**What it stores:** The agenda points of a meeting, one row per point, in order.
**In the prototype today:** `Meeting.agenda` (a list of strings).
**Main screens:** agenda textarea in `app/(workspace)/planner/meetings/new/page.tsx` (one point per line), agenda editor in `components/collaboration/create-meeting-dialog.tsx`, numbered agenda in `components/collaboration/meeting-detail-drawer.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `meeting_agenda_item_id` | uuid | pk | Identifies one agenda point. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `meeting_id` | uuid | fk → meeting | The meeting the point belongs to. | FR-TEAM-004 ("meeting agendas") | Not shown directly. | uuid, same type as `meeting.meeting_id`. |
| `item` | text | | The text of the agenda point. | FR-TEAM-004 | Each line of the agenda; list in the drawer. Also searched on `planner/meetings/page.tsx`. | text: a point can be a sentence or more. |
| `sort_order` | integer | | Keeps the points in the order the organizer wrote them (rows in a table have no order of their own). | FR-TEAM-004 | Numbering 1, 2, 3 in `meeting-detail-drawer.tsx`. | integer: a position number. |

### `time_off_request`

**What it stores:** A member's leave request and the manager's decision on it.
**In the prototype today:** `TimeOffRequest` in `types/collaboration.ts`. The prototype does not record who decided or when.
**Main screens:** `app/(workspace)/planner/availability/page.tsx` with `components/planner/time-off-requests.tsx` (table with Approve / Decline) and `components/planner/availability-board.tsx`; `components/collaboration/create-time-off-dialog.tsx`. `planner/time-off/page.tsx` and `planner/time-off/new/page.tsx` redirect to availability.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `time_off_request_id` | uuid | pk | Identifies one request. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation the request belongs to. | DATA-01; Annex B §6.6 | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `user_id` | uuid | fk → users | The member who will be away. | FR-TEAM-003; Section 3.7 (USER submits TIME_OFF_REQUEST) | `TimeOffRequest.memberId`. Member name in `time-off-requests.tsx`; search by member; leave bars on `availability-board.tsx`. | uuid, same type as `users.user_id`. |
| `decided_by_user_id` | uuid | fk → users | The manager who approved or declined. Empty while pending. | FR-TEAM-003 ("Manager clicks Approve or Decline") | Not shown in the UI. The prototype only writes the approver's name into the activity log in `approveTimeOffRequest`. | uuid, same type as `users.user_id`. |
| `leave_type` | varchar | | Kind of leave. | FR-TEAM-003 (vacation, sick, personal, parental, unpaid); `other` from `LeaveType` | Leave-type buttons in the dialog; `LeaveTypeBadge` and leave-type filter in `time-off-requests.tsx`. | varchar with a fixed list of allowed values kept in the app. |
| `start_date` | date | | First day away. | FR-TEAM-003 | Start date in the dialog; "start to end" text in the table and board. | date: leave is booked in whole days, no clock time. |
| `end_date` | date | | Last day away. | FR-TEAM-003 | End date in the dialog and table. | date, same reason. |
| `duration_days` | decimal | | Number of working days off; 0.5 for a partial day. | FR-TEAM-003 ("System calculates durationDays") | Calculated in `create-time-off-dialog.tsx` ("N business day(s)"); shown in the table and on the board. | decimal so a half day (0.5) is stored exactly. Note: this is a calculated value. Storing it keeps the count fixed at request time, but it goes against the schema rule "nothing stored that can be calculated" (see Issues). |
| `is_partial_day` | boolean | | Marks a half-day request. | No SRS requirement; source is `TimeOffRequest.isPartialDay` | Checkbox in the dialog; "Partial Day" tag in `time-off-requests.tsx`. | boolean: yes/no. |
| `reason` | text | | Why the member needs the time off. | FR-TEAM-003 ("inputs reason") | Reason field in the dialog; reason column and search in the table. | text: free text. |
| `notes` | text | | Extra notes for the manager (handover etc.). | No SRS requirement; source is `TimeOffRequest.notes` | Notes field in the dialog; shown in the table when there is no reason. | text: free text. |
| `status` | varchar | | pending / approved / declined. Approving also blocks the member on the calendar. | FR-TEAM-003 | Approve / Decline buttons in `time-off-requests.tsx`; pending count on `planner/availability/page.tsx`. | varchar with a fixed list of allowed values kept in the app. |
| `decided_at` | timestamp | | When the request was approved or declined. | FR-TEAM-003 | Not shown in the UI (new for production). | timestamp with time zone: an exact moment. |
| `created_at` | timestamp | | When the request was submitted. | Annex B §6.6 conventions | Not shown in the UI (`TimeOffRequest.createdAt`). | timestamp with time zone. |

### `announcement`

**What it stores:** A company-wide notice posted by a leader, with priority, audience and pin state.
**In the prototype today:** `Announcement` in `types/collaboration.ts` (`readByUserIds` moves to `announcement_read`).
**Main screens:** `app/(workspace)/teams/announcements/page.tsx`, `app/(workspace)/teams/announcements/new/page.tsx`, `components/collaboration/create-announcement-dialog.tsx` (also opened from `app/(workspace)/teams/page.tsx`). The sidebar link is commented out in `components/layout/app-sidebar.tsx`; the page opens from Teams Analytics.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `announcement_id` | uuid | pk | Identifies one announcement. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation sees it. | FR-TEAM-005 ("visible across the organization"); DATA-01 | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `author_user_id` | uuid | fk → users | Who posted it. | FR-TEAM-005 ("saves Announcement with ... author ID") | "Published by <name>" with avatar on `teams/announcements/page.tsx`. | uuid, same type as `users.user_id`. |
| `title` | varchar | | Headline. | FR-TEAM-005 | Title field on `announcements/new`; card title. | varchar: a short line. |
| `content` | text | | The body of the notice. Empty content cannot be published. | FR-TEAM-005 ("rich text content") | Content editor on `announcements/new`; card body; search. | text: long text of any length. |
| `audience` | varchar | | Which group it is meant for. | No SRS requirement; source is `Announcement.audience` | Audience select on `announcements/new`; "Audience: x" label and audience filter on the list page. | varchar with a fixed list kept in the app. The prototype type also allows any string, and the values look like departments, which are free text in `org_member.department` (see Issues). |
| `priority` | varchar | | normal / important. Important ones get alert styling. | FR-TEAM-005 | Priority select; `AnnouncementPriorityBadge`; "Important" tab. | varchar with a fixed list kept in the app. |
| `is_pinned` | boolean | | Keeps the notice at the top of the feed. | No SRS requirement; source is `Announcement.isPinned` | "Pin to top" checkbox on `announcements/new`; pin toggle (`togglePinAnnouncement`) and "Pinned" tab on the list page; pinned items sort first. | boolean: yes/no. |
| `status` | varchar | | published / draft. Drafts are saved but not yet shown to everyone. | FR-TEAM-005 (publish step) | "Save draft" and publish buttons on `announcements/new` (`handleSubmit('draft')`). | varchar with a fixed list kept in the app. |
| `published_at` | timestamp | | When it was (or will be) published; the feed sorts by it. | FR-TEAM-005 ("with current timestamp") | `Announcement.publishedDate`. Date picker on `announcements/new`; date on the card; sort order. | timestamp with time zone. Can be empty for a draft. |
| `created_at` | timestamp | | When the row was first saved. | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |

### `announcement_read`

**What it stores:** Which person has read which announcement, and when.
**In the prototype today:** `Announcement.readByUserIds` (a list of user ids). Reading time is new.
**Main screens:** "Unread" tab, unread styling and "Mark as read" button (`markAnnouncementRead`) on `app/(workspace)/teams/announcements/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `announcement_read_id` | uuid | pk | Identifies one read record. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `announcement_id` | uuid | fk → announcement | The announcement that was read. | No SRS requirement (FR-TEAM-005 covers publishing only); source is `readByUserIds` | Not shown directly. | uuid, same type as `announcement.announcement_id`. |
| `user_id` | uuid | fk → users | The reader. | Same as above | Drives the unread state for the current user on the list page. | uuid, same type as `users.user_id`. |
| `read_at` | timestamp | | When they read it. | Same as above | Not shown in the UI (new for production). | timestamp with time zone. |

**Rules:** `unique (announcement_id, user_id)`: one read record per person per announcement. Clicking "Mark as read" twice does not add a second row (the prototype checks this in `markAnnouncementRead`).

## Slice 5 — Documents

### `document_folder`

**What it stores:** A folder in the Documents library. A folder can sit inside another folder.
**In the prototype today:** `DocumentFolder` in `types/documents.ts`. `documentCount` is not stored; it is counted from `document`.
**Main screens:** `app/(workspace)/documents/folders/page.tsx` (create, rename, delete, per-folder counts), folder filter on `app/(workspace)/documents/all/page.tsx`, `components/documents/move-folder-dialog.tsx`, folder select on `app/(workspace)/documents/new/page.tsx` and in `components/documents/upload-demo-dialog.tsx`. Folders are flat in the UI today.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_folder_id` | uuid | pk | Identifies one folder. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation owns the folder tree. | Annex B §6.6 (DocumentFolder: orgId); Section 3.7 (ORGANIZATION maintains DOCUMENT_FOLDER) | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `parent_folder_id` | uuid | fk → document_folder | The folder this one sits in; empty for a top-level folder. Lets folders nest. | FR-DOC-001 (nested folders, breadcrumbs; a folder cannot be its own parent); Annex B §6.6 ("parentId?", Tree) | Not shown in the UI. `DocumentFolder.parentId` exists, but `documents/folders/page.tsx` calls `addFolder` with a name only, so every folder is top-level. The column is kept for the requirement. | uuid, same type as this table's own key (a self-reference). |
| `owner_user_id` | uuid | fk → users | Who created the folder. | Annex B §6.6 (ownerId) | Not shown in the UI. `addFolder` sets it to the current user. | uuid, same type as `users.user_id`. |
| `name` | varchar | | Folder name. | FR-DOC-001 | Folder list, rename box on `documents/folders/page.tsx`; folder names in lists and the move dialog. | varchar: a short name. |
| `created_at` | timestamp | | When the folder was made. | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |
| `updated_at` | timestamp | | Last rename. | Annex B §6.6 conventions | Not shown in the UI (`updateFolder` sets it). | timestamp with time zone. |

### `document`

**What it stores:** One item in the Documents library: an uploaded PDF or a text document written in the editor (blank or from a template).
**In the prototype today:** two types are merged here: `DocumentItem` in `types/documents.ts` (the library) and the older `Document` in `types/index.ts` (used by `approvals/page.tsx`, `dashboard/page.tsx` and `reports/page.tsx`). Not stored as columns: `fileSize` and `pages` (from `stored_file`, or calculated), `isFavorite` (→ `user_favorite_document`), `isShared` / `sharedWithUserIds` / `accessType` (→ `document_share`), `lastOpenedAt` (→ `user_recent_document`), `versions` (→ `document_version`), `comments` (→ `document_comment`), `currentVersion` (highest `version_number`), `relatedContractId` (→ `contract.document_id`), `pdf` (→ `pdf_file_id`), older `signers` (→ e-signature tables), older `approvers` (→ `document_approval`). The older `dueDate`, `signedDate`, `notes` and `fileUrl` have no column.
**Main screens:** `app/(workspace)/documents/all/page.tsx`, `mine`, `shared`, `recent`, `favorites`, `folders`, `new`, `[documentId]`, `[documentId]/edit`; `components/documents/upload-demo-dialog.tsx`; `app/(workspace)/signatures/upload/page.tsx` (PDFs uploaded in the signing wizard also become documents); `app/(workspace)/approvals/page.tsx`; `app/(workspace)/dashboard/page.tsx`; `app/(workspace)/reports/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_id` | uuid | pk | Identifies one document. | Annex B §6.6 conventions | In the URL `/documents/[documentId]`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation owns the document; checked on every read and download. | Annex B §6.6 (Document: orgId); DATA-01; DOC-02 | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `document_folder_id` | uuid | fk → document_folder | The folder it is filed in; empty = Unfiled. | FR-DOC-001 | `DocumentItem.folderId`. Folder name in lists, "Unfiled" filter on `documents/all/page.tsx`, `move-folder-dialog.tsx`, folder select on `documents/new/page.tsx`. | uuid, same type as `document_folder.document_folder_id`. |
| `owner_user_id` | uuid | fk → users | The person who created or owns the document. | Annex B §6.6 (ownerId); FR-DOC-007 ("Created by Me") | `DocumentItem.ownerId` / `Document.ownerId`. `documents/mine/page.tsx` filters on it; owner name and owner search on `documents/all/page.tsx`. | uuid, same type as `users.user_id`. |
| `project_id` | uuid | fk → project | Optional link to the project the document belongs to. | FR-DOC-006 (relatedProjectId); DOC-01 | `DocumentItem.relatedProjectId` / `Document.projectId`. Project select on `documents/new/page.tsx`; project chip on `documents/all/page.tsx` and `documents/[documentId]/page.tsx`. The "Linked Documents" list on the project overview from FR-DOC-006 is not built. | uuid, same type as `project.project_id`. |
| `pdf_file_id` | uuid | fk → stored_file | The uploaded PDF file. Empty for text documents. | REQ-DOC-001, REQ-DOC-007, REQ-DOC-012; Annex B §6.6 ("storedFileId? (PDF)") | `DocumentItem.pdf` (bytes in the browser via `lib/pdf/file-store.ts`). PDF page preview, "PDF · name", Export and "Sign it yourself" / "Send for signature" on `documents/[documentId]/page.tsx`; file size and page count come from the stored file. | Written as uuid, but **`stored_file.stored_file_id` is now `bigserial`**, so this must be `bigint` to match the key it points to. |
| `title` | varchar | | Document name. Also the download file name. | FR-DOC-008 (file name `${doc.title}.pdf`) | Title field on `documents/new` and `[documentId]/edit`; every list and page header. | varchar: a short name. |
| `description` | text | | Short summary of the document. | No SRS requirement; source is `DocumentItem.description` | Description field on `documents/new` and edit; card text; search on `documents/all`. | text: free text. |
| `type` | varchar | | The kind of document. A template passes its type on to the new document. | FR-DOC-003; REQ-DOC-008 (uploaded PDFs get type `pdf`); DOC-05 | `DocumentType`. Type select on `documents/new` and the upload dialog; "Document Type" on `documents/[documentId]/page.tsx`. | varchar with a fixed list kept in the app. The list mixes file formats (pdf, docx) with business kinds (nda, sow); the older `Document.type` value `amendment` is missing (see Issues). |
| `status` | varchar | | Where the document is in its life: draft, in review, sent for signing, signed, approved, archived. | REQ-DOC-008 (draft); REQ-DOC-010 (pending when sent, signed when completed); DOC-08 | `DocStatusBadge` (`components/shared/badges.tsx`) in lists; `approvals/page.tsx` sets `approved`; Archive sets `archived`; `reports/page.tsx` counts `signed`. | varchar with a fixed list kept in the app. The older `Document` status `expired` is missing, and `shared` repeats what `document_share` already says (see Issues). |
| `content` | text | | The current text of an editor document (Markdown). Empty for PDFs. | FR-DOC-002; FR-DOC-003 | Editor textarea on `documents/[documentId]/edit/page.tsx`; preview tab and Markdown download on `[documentId]`. The prototype puts "Uploaded PDF: name" here for PDFs. | text: documents can be very long. |
| `is_editable` | boolean | | Says whether the text can be edited. Uploaded PDFs are read-only. | REQ-DOC-008 ("read-only") | `DocumentItem.isEditable`, set to false on PDF upload in `documents/new`, `upload-demo-dialog.tsx` and `signatures/upload/page.tsx`. No screen reads it: `[documentId]` shows "Edit Content" whenever there is no PDF. | boolean: yes/no. It can be worked out from `pdf_file_id` (see Issues). |
| `created_at` | timestamp | | When the document was created. | Annex B §6.6 conventions | "Created" in the metadata panel of `documents/[documentId]/page.tsx`. | timestamp with time zone. |
| `updated_at` | timestamp | | Last change. | Annex B §6.6 conventions | Date and sort order on `documents/recent/page.tsx` (it sorts by this today, not by last opened). | timestamp with time zone. |
| `deleted_at` | timestamp | | When it was moved to the Trash; empty = not deleted. Lets a delete be undone and keeps signed evidence. | schema.txt rule "deleted_at where something can go to the Trash"; DATA-06 | Not shown in the UI. The prototype deletes documents for good (`deleteDocumentItem` from `documents/all` and `documents/mine`); there is no Documents Trash. | timestamp with time zone: both a flag and the moment it happened. |

### `document_version`

**What it stores:** A saved snapshot of a document: its number, who saved it, a change note and the full content (or the PDF file for a PDF version).
**In the prototype today:** `DocumentVersion` in `types/documents.ts` (the `versions` list inside each document). Partly built: only the first version is created (in `addDocumentItem`); saving on the edit page and "Restore Version" overwrite the content without adding a version.
**Main screens:** "Versions" tab with "Restore Version" on `app/(workspace)/documents/[documentId]/page.tsx`; "vN" label on `app/(workspace)/documents/recent/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_version_id` | uuid | pk | Identifies one version. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `document_id` | uuid | fk → document | The document this version belongs to. | FR-DOC-002; Section 3.7 (DOCUMENT_ITEM tracks DOCUMENT_VERSION) | Not shown directly; groups the version list. | uuid, same type as `document.document_id`. |
| `modified_by_user_id` | uuid | fk → users | Who saved this version. | FR-DOC-002 (author) | "Authored by <name>" in the Versions tab. The prototype stores the name as text (`modifiedBy`); the schema stores the user id. | uuid, same type as `users.user_id`. |
| `stored_file_id` | uuid | fk → stored_file | For a PDF document: the PDF file of this version, so a revised PDF never overwrites a signed one. | DOC-06, DOC-07 (controlled versions; signed content is not overwritten) | Not shown in the UI (the prototype has no PDF versions; Annex B §6.6 describes versions as "Text documents only"). | Written as uuid, but **`stored_file.stored_file_id` is now `bigserial`**, so this must be `bigint`. |
| `version_number` | integer | | 1, 2, 3 ... counted per document. | FR-DOC-002 ("incremented versionNumber") | "Version N.0" in the Versions tab; "vN" on `documents/recent/page.tsx`. | integer: a whole counting number. |
| `change_summary` | varchar | | One-line note on what changed (default "Updated content (vN)"). | FR-DOC-002 | Line under each version in the Versions tab. | varchar: a short one-line note. |
| `content` | text | | Full text snapshot of the document at that version. | FR-DOC-002 ("full content snapshot") | Used by "Restore Version" on `documents/[documentId]/page.tsx`. | text: the whole document, any length. |
| `created_at` | timestamp | | When the version was saved. | FR-DOC-002 (modified date) | "on <date>" in the Versions tab (`modifiedDate`). | timestamp with time zone. |

**Rules:** `unique (document_id, version_number)`: each number appears once per document, so two people saving at the same moment cannot both create "version 3". This backs DATA-02 / DATA-03 (no collisions under concurrent writes).

### `document_comment`

**What it stores:** A review comment or note left on a document.
**In the prototype today:** `DocumentComment` in `types/documents.ts` (the `comments` list inside each document). `authorName` is not stored; it comes from `users`.
**Main screens:** "Review Comments" tab on `app/(workspace)/documents/[documentId]/page.tsx` (list and "Post" box, `addDocumentComment`).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_comment_id` | uuid | pk | Identifies one comment. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `document_id` | uuid | fk → document | The document commented on. | COL-01 (item comments) | Not shown directly; groups the comment list. | uuid, same type as `document.document_id`. |
| `author_user_id` | uuid | fk → users | Who wrote it. | COL-01 | Author name on each comment. | uuid, same type as `users.user_id`. |
| `text` | text | | The comment. | COL-01 | Comment text in the tab; the "Add a review comment" box. | text: any length. |
| `status` | varchar | | open / resolved, so handled comments can be closed. | No SRS requirement; source is `DocumentComment.status` | Not shown in the UI: comments are always created `open` and there is no resolve button. | varchar with a fixed list kept in the app. |
| `created_at` | timestamp | | When it was posted. | Annex B §6.6 conventions | Date and time on each comment. | timestamp with time zone. |

### `document_share`

**What it stores:** Who a document is shared with and what they may do (view, edit, sign).
**In the prototype today:** `DocumentItem.isShared`, `sharedWithUserIds` and `accessType`. In the prototype one access type applies to the whole document; here each person has their own.
**Main screens:** `app/(workspace)/documents/shared/page.tsx` ("Shared with me", with an access-type badge). There is no share dialog today.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_share_id` | uuid | pk | Identifies one share. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `document_id` | uuid | fk → document | The shared document. | FR-DOC-007 ("Shared With Me"); ACL-06 | Not shown directly. | uuid, same type as `document.document_id`. |
| `user_id` | uuid | fk → users | The person it is shared with. | FR-DOC-007; ACL-06; DOC-13 | `documents/shared/page.tsx` lists documents shared with the current user. | uuid, same type as `users.user_id`. |
| `access_type` | varchar | | viewer / editor / signer: what the person may do. | ACL-06 (separate rights for preview, editing and signing) | Access badge ("Editor" by default) on `documents/shared/page.tsx`. | varchar with a fixed list kept in the app. |
| `created_at` | timestamp | | When it was shared. | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |

**Rules:** `unique (document_id, user_id)`: a person has one share (one access level) per document. To change the level, update the row instead of adding a second one.

### `user_favorite_document`

**What it stores:** Which documents each person has starred.
**In the prototype today:** `DocumentItem.isFavorite` (and a duplicate `favorite`). In the prototype one flag is shared by everyone; here it is per person.
**Main screens:** star button on `documents/all`, `mine`, `shared`, `recent` and `[documentId]` (`toggleFavoriteDocument`); `app/(workspace)/documents/favorites/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_favorite_document_id` | uuid | pk | Identifies one star. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `user_id` | uuid | fk → users | The person who starred it. | FR-DOC-007 | Decides which stars are filled for the current user. | uuid, same type as `users.user_id`. |
| `document_id` | uuid | fk → document | The starred document. | FR-DOC-007 | Listed on `documents/favorites/page.tsx`. | uuid, same type as `document.document_id`. |
| `created_at` | timestamp | | When it was starred (lets favorites be sorted newest first). | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |

**Rules:** `unique (user_id, document_id)`: a person can star a document once. Un-starring deletes the row.

### `user_recent_document`

**What it stores:** When each person last opened each document, for the "Recent" list.
**In the prototype today:** `DocumentItem.lastOpenedAt`, set only when the document is created. `documents/recent/page.tsx` sorts by `updatedAt` instead.
**Main screens:** `app/(workspace)/documents/recent/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_recent_document_id` | uuid | pk | Identifies one row. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `user_id` | uuid | fk → users | The person. | FR-DOC-007 ("Recent") | Decides whose recent list is shown. | uuid, same type as `users.user_id`. |
| `document_id` | uuid | fk → document | The document they opened. | FR-DOC-007 | Items on `documents/recent/page.tsx`. | uuid, same type as `document.document_id`. |
| `last_opened_at` | timestamp | | Last time this person opened it; the list sorts by it. | FR-DOC-007 | Not used yet: the page sorts by the document's `updated_at`. | timestamp with time zone. |

**Rules:** `unique (user_id, document_id)`: one row per person and document. Opening the document again updates `last_opened_at` instead of adding a row, so the table stays small.

### `document_approval`

**What it stores:** An internal approval step on a document: who asked, who must approve, and the result. This is separate from a signature.
**In the prototype today:** `ApprovalRequest` in `types/index.ts` (the `approvals` list). It points to the older `Document` type, which this schema merges into `document`.
**Main screens:** `app/(workspace)/approvals/page.tsx` (Approval Center: Approve / Reject with an optional comment; when every approval on a document is approved the document becomes `approved`); pending approvals list on `app/(workspace)/dashboard/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_approval_id` | uuid | pk | Identifies one approval request. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `document_id` | uuid | fk → document | The document to approve. | DOC-04 (approvals are not signatures); ORG-05 (pending approvals) | Document title and link on `approvals/page.tsx` and the dashboard. | uuid, same type as `document.document_id`. |
| `requested_by_user_id` | uuid | fk → users | Who asked for the approval. | DOC-04 | "Requested by <name>" on `approvals/page.tsx`. | uuid, same type as `users.user_id`. |
| `assigned_to_user_id` | uuid | fk → users | The approver. | DOC-04; COL-04 (approval request notifications) | "Awaiting Your Action" filter and "Approver" column on `approvals/page.tsx`. | uuid, same type as `users.user_id`. |
| `status` | varchar | | pending / approved / rejected / changes_requested. | DOC-04; DOC-08 ("awaiting approval", "approved for sending") | Approve and Reject buttons; only `pending` rows are listed. No screen sets `changes_requested` today. | varchar with a fixed list kept in the app. |
| `comment` | text | | The approver's note (optional when approving). | No SRS requirement; source is `ApprovalRequest.comment` | Comment textarea on `approvals/page.tsx`. | text: free text. |
| `created_at` | timestamp | | When the approval was requested. | Annex B §6.6 conventions | "Requested" time (relative) on `approvals/page.tsx`. | timestamp with time zone. |
| `resolved_at` | timestamp | | When it was approved or rejected; empty while pending. | DATA-05 (keep decision history) | Not shown in the UI; set by Approve and Reject. | timestamp with time zone. |

### `document_template`

**What it stores:** A reusable document template with `{{placeholder}}` tags that become form fields when someone uses it.
**In the prototype today:** `DocumentTemplate` in `types/documents.ts`. `placeholders` move to `document_template_placeholder`, `isFavorite` to `user_favorite_template`, `lastUpdated` becomes `updated_at`.
**Main screens:** `app/(workspace)/documents/templates/page.tsx` (catalog, category filter, star), `app/(workspace)/documents/templates/new/page.tsx`, `components/documents/template-preview-dialog.tsx` ("Use Template" fills the placeholders and creates a document). The hidden `contracts/new/page.tsx` also lists templates.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_template_id` | uuid | pk | Identifies one template. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation's library the template belongs to. | Annex B §6.6 (DocumentTemplate: orgId) | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `created_by_user_id` | uuid | fk → users | Who made the template. | DOC-15 (templates with ownership) | Not shown in the UI (new; the prototype has no creator field). | uuid, same type as `users.user_id`. |
| `title` | varchar | | Template name. | FR-DOC-003 | Card title on `templates/page.tsx`; title field on `templates/new`; preview dialog header. | varchar: a short name. |
| `description` | text | | What the template is for. | No SRS requirement; source is `DocumentTemplate.description` | Card text; description field on `templates/new`; search. | text: free text. |
| `category` | varchar | | Group in the catalog. | FR-DOC-003 (legal, sales, HR and PM categories) | `TemplateCategory`. Category select on `templates/new`; category badge and filter on `templates/page.tsx`. | varchar with a fixed list kept in the app. |
| `type` | varchar | | The document type a new document gets when made from this template. | FR-DOC-003 | Type select on `templates/new`; copied to the new document in `template-preview-dialog.tsx`. | varchar with the same app-level list as `document.type`. |
| `content` | text | | The template body with `{{placeholder}}` tags. | FR-DOC-003 | Preview in `template-preview-dialog.tsx`; editor on `templates/new`. | text: long body text. |
| `created_at` | timestamp | | When it was created. | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |
| `updated_at` | timestamp | | Last change. | Annex B §6.6 conventions | "Updated <date>" on each card (`lastUpdated`). | timestamp with time zone. |

### `document_template_placeholder`

**What it stores:** The placeholder names a template uses (for example `client_name`), one row per placeholder.
**In the prototype today:** `DocumentTemplate.placeholders` (a list of strings). Annex B §6.6 suggests a JSON column; the schema follows its own rule "lists are their own tables".
**Main screens:** placeholder chips ("+N more") on `app/(workspace)/documents/templates/page.tsx`; tag editor on `app/(workspace)/documents/templates/new/page.tsx`; one input per placeholder in `components/documents/template-preview-dialog.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `document_template_placeholder_id` | uuid | pk | Identifies one placeholder row. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `document_template_id` | uuid | fk → document_template | The template that uses it. | FR-DOC-003 | Not shown directly. | uuid, same type as `document_template.document_template_id`. |
| `placeholder_key` | varchar | | The tag name, matching `{{placeholder_key}}` in the content. | FR-DOC-003 (`{{client_name}}`, `{{effective_date}}`); DOC-15 | Chips on the catalog and in the editor; form field labels in the preview dialog. | varchar: a short code-like name. |

### `user_favorite_template`

**What it stores:** Which templates each person has starred.
**In the prototype today:** `DocumentTemplate.isFavorite` (one flag shared by everyone).
**Main screens:** star button on `app/(workspace)/documents/templates/page.tsx` (`toggleFavoriteTemplate`).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `user_favorite_template_id` | uuid | pk | Identifies one star. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `user_id` | uuid | fk → users | The person who starred it. | No SRS requirement for templates (FR-DOC-007 covers documents); source is `DocumentTemplate.isFavorite` | Decides which stars are filled for the current user. | uuid, same type as `users.user_id`. |
| `document_template_id` | uuid | fk → document_template | The starred template. | Same as above | Star state on each template card. | uuid, same type as `document_template.document_template_id`. |

**Rules:** `unique (user_id, document_template_id)`: a person stars a template once; un-starring deletes the row.

### `project_file`

**What it stores:** A file uploaded to a project (SRS, test report, other document), its category and the state of its SRS analysis.
**In the prototype today:** `ProjectFile` in `types/index.ts`. `size` comes from `stored_file.size_bytes`; `tasksGeneratedCount` is counted from `task.source_project_file_id`.
**Main screens:** `app/(workspace)/projects/[projectId]/files/page.tsx` (upload, classify, "Analyze SRS", type and category filters, preview), `components/projects/srs-generated-tasks-modal.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `project_file_id` | uuid | pk | Identifies one project file. Generated tasks point back to it. | Annex B §6.6 conventions; FR-SRS-006 (traceability links) | Not shown in the UI. | uuid, the project-wide key type. |
| `project_id` | uuid | fk → project | The project the file belongs to. | FR-SRS-001; Annex B §6.6 (ProjectFile belongs to Project); Section 3.7 | The files page lists the files of the open project. | uuid, same type as `project.project_id`. |
| `task_id` | uuid | fk → task | Optional task the file is attached to. | No SRS requirement; source is `ProjectFile.taskId` | Not shown in the UI; no screen sets or reads `ProjectFile.taskId`. | uuid, same type as `task.task_id`. |
| `stored_file_id` | uuid | fk → stored_file | The real file in object storage. | REQ-PRJ-011 (store real content); REQ-AI-020; Annex B §6.6 (storedFileId) | Not shown in the UI: the prototype keeps metadata only and shows a demo preview. | Written as uuid, but **`stored_file.stored_file_id` is now `bigserial`**, so this must be `bigint`. |
| `uploaded_by_user_id` | uuid | fk → users | Who uploaded the file. | Annex B §6.6 (uploadedBy) | Uploader avatar and name in the file row. The prototype sets it to the project owner, not the current user. | uuid, same type as `users.user_id`. The same fact is already in `stored_file.uploaded_by_user_id` (see Issues). |
| `name` | varchar | | Display name of the file. | FR-SRS-001 (Name) | Required name field in the upload dialog; name in each row and in search. | varchar: a short name. Overlaps `stored_file.file_name` (see Issues). |
| `file_type` | varchar | | Kind of file; picks the icon and the type filter. | FR-SRS-001 (.pdf, .doc, .docx, .figma, .archive, .image); `code` comes from `ProjectFile.type` | File icon, type label and type filter on the files page. | varchar with a fixed list kept in the app. |
| `category` | varchar | | srs / test_report / doc / other. Only `srs` files get "Analyze SRS". Empty = unclassified. | FR-SRS-001; REQ-PRJ-011 | Classification modal; category badge and filter (with "Unclassified") on the files page. | varchar with a fixed list kept in the app. |
| `analysis_status` | varchar | | Where the SRS analysis stands. | FR-SRS-001 (`not_analyzed`); FR-SRS-006 (`tasks_created`); Annex B §4.4 (SRS file states) | Status badge and "tasks created" label in each row. | varchar with a fixed list kept in the app. The list is shorter than Annex B §4.4 (see Issues). |
| `analyzed_at` | timestamp | | When the last analysis review was saved. | FR-SRS-006 | "Analyzed: <date>" in `srs-generated-tasks-modal.tsx`; set when the review is saved on the files page. | timestamp with time zone. |
| `created_at` | timestamp | | Upload time. | Annex B §6.6 conventions | Upload date in each row and "Uploaded <date>" in the preview. | timestamp with time zone. |

### `contract`

**What it stores:** A contract record: type, counterparty, dates, value, renewal, reviewer, lifecycle status, and links to its document and project.
**In the prototype today:** `Contract` in `types/documents.ts`. Not stored: `ownerName` and `reviewerName` (from `users`), `value` (an alias of `contractValue`), `signatureRequestId` (`signature_request.contract_id` points back instead), `reviewComments` (→ `contract_review_comment`), `activity` (→ `activity_log`). **Hidden:** `FEATURES.contracts = false` removes the Contracts tab in `components/agreements/agreements-tabs.tsx`; the pages still open by URL.
**Main screens:** `app/(workspace)/contracts/page.tsx`, `contracts/all`, `drafts`, `review`, `awaiting`, `active`, `expiring`, `completed`, `archived`, `new`, `[contractId]`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `contract_id` | uuid | pk | Identifies one contract. | Annex B §6.6 conventions | URL `/contracts/[contractId]`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | Which organisation owns the contract. | Annex B §6.6 (Contract: orgId); DATA-01 | Not shown in the UI. | uuid, same type as `organization.organization_id`. |
| `owner_user_id` | uuid | fk → users | Who is responsible for the contract; gets notified when changes are requested. | FR-DOC-004; FR-DOC-005 (notify the owner) | `Contract.ownerId`; owner name in contract lists. | uuid, same type as `users.user_id`. |
| `reviewer_user_id` | uuid | fk → users | The internal reviewer. | FR-DOC-005 | `Contract.reviewerId` set by `submitContractForReview`; "Internal Reviewer" on `contracts/[contractId]/page.tsx` (shows `reviewerName`). | uuid, same type as `users.user_id`. |
| `project_id` | uuid | fk → project | Optional project the contract supports. | FR-DOC-006 | `Contract.relatedProjectId`; project select on `contracts/new/page.tsx`. | uuid, same type as `project.project_id`. |
| `document_id` | uuid | fk → document | The document that holds the contract text or PDF. | Annex B §6.6 (Contract: documentId?) | "Linked Document" card on `contracts/[contractId]/page.tsx`; the linked contract on `documents/[documentId]/page.tsx` (only when `FEATURES.contracts`). | uuid, same type as `document.document_id`. |
| `title` | varchar | | Contract name. | FR-DOC-004 | Title on `contracts/new` and in every contract list. | varchar: a short name. |
| `contract_type` | varchar | | Kind of contract. | FR-DOC-004 (msa, sow, nda, software_license) | `ContractType`. "Contract Type" select on `contracts/new/page.tsx`; type label in lists and CSV export on `contracts/all`. | varchar with a fixed list kept in the app. The list in schema.txt ends with "..." and is not complete (see Issues). |
| `counterparty` | varchar | | The other party (client or vendor) by name. | FR-DOC-004 (Counterparty Name) | "Counterparty Client Organization" field; Counterparty card on `[contractId]`. | varchar: a short name. |
| `effective_date` | date | | Day the contract starts to apply. | FR-DOC-004 | Effective date on `contracts/new`, `[contractId]`, `contracts/all`. | date: a legal date, no clock time. |
| `expiry_date` | date | | Day it ends; drives the "Expiring Soon" view. | FR-DOC-004 (flag when within 30 days) | `contracts/expiring/page.tsx` works out expiring contracts from it; shown on `[contractId]` and lists. | date: a legal date, no clock time. |
| `renewal_type` | varchar | | What happens at expiry: renews automatically, renewed by hand, or not at all. | FR-DOC-004 (auto, manual, none, one_time) | "Renewal Policy" select on `contracts/new` and label on `[contractId]`. | varchar with a fixed list kept in the app. The list does not match the UI or the SRS (see Issues). |
| `contract_value` | decimal | | The money value of the contract. | FR-DOC-004 (Contract Value, USD); ORG-10 (financial fields need their own permission) | "Contract Value" ($) on `[contractId]`; value in lists and the CSV export. | decimal: exact amounts for money, no rounding errors. There is no currency column; USD is assumed (see Issues). |
| `payment_terms` | text | | Agreed payment terms (for example "Net 30"). | No SRS requirement; source is `Contract.paymentTerms` | Payment terms textarea on `contracts/new/page.tsx`; not shown on the detail page. | text: free text. |
| `special_conditions` | text | | Any special clauses. | No SRS requirement; source is `Contract.specialConditions` | Special conditions textarea on `contracts/new/page.tsx`; not shown on the detail page. | text: free text. |
| `description` | text | | Summary and scope. | No SRS requirement; source is `Contract.description` | "Executive Summary / Scope Description" on `contracts/new`; "Contract Overview" card on `[contractId]`. | text: free text. |
| `status` | varchar | | Lifecycle state. | FR-DOC-004 (draft, pending_review, awaiting_signature, active, expiring, completed, expired, archived) | One tab per status under `contracts/`; `submitContractForReview` sets `pending_review`, `markContractReviewed` sets `awaiting_signature` or `draft`, Archive sets `archived`. | varchar with a fixed list kept in the app. `expiring` and `expired` can be worked out from `expiry_date` (see Issues). |
| `created_at` | timestamp | | When the record was created. | Annex B §6.6 conventions | Not shown in the UI. | timestamp with time zone. |
| `updated_at` | timestamp | | Last change. | Annex B §6.6 conventions | Not shown in the UI (`updateContract` sets it). | timestamp with time zone. |

### `contract_review_comment`

**What it stores:** A reviewer's comment on a contract, optionally asking for changes or approving the terms.
**In the prototype today:** `ContractReviewComment` in `types/documents.ts`. `authorName` is not stored; `text` and `content` (the same value twice) become one `text` column.
**Main screens:** "Review & Comments" tab on `app/(workspace)/contracts/[contractId]/page.tsx`; `app/(workspace)/contracts/review/page.tsx`. Hidden with `FEATURES.contracts = false`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `contract_review_comment_id` | uuid | pk | Identifies one comment. | Annex B §6.6 conventions | Not shown in the UI. | uuid, the project-wide key type. |
| `contract_id` | uuid | fk → contract | The contract commented on. | FR-DOC-005 | Not shown directly; groups the comments (count in the tab label). | uuid, same type as `contract.contract_id`. |
| `author_user_id` | uuid | fk → users | The reviewer who wrote it. | FR-DOC-005 (comments show the author) | Author name on each comment. | uuid, same type as `users.user_id`. |
| `text` | text | | The comment. | FR-DOC-005 | Comment text in the Review tab and on `contracts/review/page.tsx`. | text: free text. |
| `action_requested` | varchar | | changes ("Request Changes") or approved ("Approve Terms"); empty for a plain comment. | FR-DOC-005 | Action badge on each comment; the two buttons on `contracts/review/page.tsx`. | varchar with a fixed list kept in the app. |
| `created_at` | timestamp | | When it was posted. | FR-DOC-005 (comments show a timestamp) | Time on each comment. | timestamp with time zone. |

#### Issues found in slices 4–5

- `calendar_event.team_id` and `meeting.team_id` are `fk -> team`, but the `team` table was removed from schema.txt, so these keys point to nothing. (`team_project.team_id` in Slice 2 has the same problem.) Restore `team` or drop the columns. Team features are hidden today (`FEATURES.teams = false`).
- `document.pdf_file_id`, `document_version.stored_file_id` and `project_file.stored_file_id` are `uuid`, but `stored_file.stored_file_id` is now `bigserial`. They must be `bigint` to match. (`organization.logo_file_id` and `users.avatar_file_id` use `int`, which also differs from bigserial.)
- `meeting` and `calendar_event` both store title, description, organizer, participants or attendees, location, link and project. The prototype writes a copy of each meeting (and of each approved leave) into the calendar, linked only by an id pattern (`evt-meet-<id>`, `evt-to-<id>`). The schema has no `meeting_id` or `time_off_request_id` on `calendar_event`, so either the calendar should read `meeting` and approved `time_off_request` rows directly (and the `meeting` / `time_off` categories should not be stored again), or a link column is needed. As written, the same facts would be stored twice.
- `calendar_event` categories `task_deadline` and `milestone` (with `task_id` / `phase_id`) repeat `task.due_date` and the phase dates. No screen creates these rows; `projects/planner/page.tsx` reads tasks and phases directly. Decide whether these rows are needed.
- `meeting.meeting_date` + `start_time` / `end_time` (date and time with no time zone) cannot be read as an exact moment without the organisation's time zone, while `calendar_event` uses `timestamp`. DATA-04 asks for UTC storage. Consider `start_at` / `end_at` timestamps, or state that meeting times are in `organization.timezone`.
- `time_off_request.duration_days` is a calculated value (working days between the dates, 0.5 for a partial day). This goes against the rule "nothing stored that can be calculated". Keep it on purpose (to fix the count at request time) and say so, or calculate it.
- `time_off_request` has no column for the decline reason. FR-TEAM-003 says declining asks for an optional reason. Add a decision note, or reuse `notes`.
- `calendar_event`, `meeting`, `time_off_request` and `announcement` can all be edited in the prototype (`updateCalendarEvent`, `updateMeeting`, the time-off edit dialog, `updateAnnouncement`), but none has `updated_at`. The same applies to `document_comment` (no resolved by / when) and `contract` (`deleteContract` exists, no `deleted_at`).
- `announcement.audience` is a fixed list (engineering, design, operations, quality, legal), but departments are free text in `org_member.department` and the prototype type accepts any string. Audiences could fall out of step with real departments.
- `document.type` mixes file formats (`pdf`, `docx`) with business kinds (`nda`, `sow`, `contract`). It also lacks `amendment`, which the older `Document.type` in `types/index.ts` uses.
- `document.status` lacks `expired`, which the older `DocumentStatus` in `types/index.ts` uses. `shared` repeats what `document_share` already records, and `pending` / `in_review` overlap with `document_approval.status`.
- `document.is_editable` can be worked out from `pdf_file_id` (PDF = read-only). No screen reads it; `documents/[documentId]/page.tsx` decides by whether a PDF exists.
- The older `Document` fields `dueDate`, `signedDate`, `notes` and `fileUrl` (`types/index.ts`) have no column after the merge. Confirm they can be dropped (`signed` time can come from the signature request).
- `document.deleted_at` exists, but the prototype deletes documents for good and has no Documents Trash.
- `document_version.stored_file_id` (PDF versions) conflicts with Annex B §6.6, which says DocumentVersion is "Text documents only". Text versions also have no content hash, which DOC-06 asks for when a version is sent for approval or signing.
- Prototype gaps the schema already covers: saving on `documents/[documentId]/edit/page.tsx` and "Restore Version" do not create a new version (FR-DOC-002); folders cannot be nested in the UI (FR-DOC-001); there is no share dialog (`document_share`); `user_recent_document.last_opened_at` is not used (the Recent page sorts by `updated_at`); document comments cannot be resolved; `document_approval.status = changes_requested` is never set.
- `document_template_placeholder` has no `unique (document_template_id, placeholder_key)` rule and no `sort_order`, so the same key could be added twice and the form order in `template-preview-dialog.tsx` is not kept.
- `user_favorite_template` has no `created_at`, while `user_favorite_document` (and `user_favorite_project`) do.
- `project_file.uploaded_by_user_id` repeats `stored_file.uploaded_by_user_id`, and `project_file.name` overlaps `stored_file.file_name` (the "nothing stored twice" rule). Keep `name` only if it is a display name that can differ from the original file name.
- `project_file.task_id` overlaps `task_attachment` (Slice 3), which also links a stored file to a task. No screen uses `ProjectFile.taskId`. Pick one way.
- `project_file.analysis_status` allows only not_analyzed / analyzed / tasks_created. Annex B §4.4 also defines ready, needs_ocr, waiting_for_agent, analyzing, proposed and failed. Annex B §6.6 also lists `extractedText` and `wordCount` for ProjectFile (REQ-AI-020), which have no column here.
- `contract.contract_type` ends with "..." in schema.txt, so the allowed list is not complete. `ContractType` in `types/documents.ts` has 15 values, and FR-DOC-004 names `software_license`.
- `contract.renewal_type` allows auto / manual / none, but `contracts/new/page.tsx` saves `manual`, `auto_renew` and `one_time`, and FR-DOC-004 lists `one_time`. Values from the UI would fail the list.
- `contract.status` stores `expiring` and `expired`, which can be worked out from `expiry_date` (FR-DOC-004 says "system flags"; `contracts/expiring/page.tsx` already calculates it). This goes against the "nothing calculated" rule unless a scheduled job owns the change.
- `contract.contract_value` has no currency column (USD is assumed). `contract.counterparty` is free text, while FR-DOC-004 talks of a "counterparty record".

---

## Slice 6 — E-signature

This slice holds everything about getting a PDF signed: the request ("envelope"), its files, the people on it (signers, reviewers, copy recipients), the fields placed on the pages, the private links, the audit trail, the emails, each person's saved signature, the organisation's signing defaults and its company seals.

In the prototype all of this lives in one JSON object per request (`SignatureRequest` in `types/documents.ts`, saved to localStorage) with the PDF bytes in the browser's IndexedDB (`lib/pdf/file-store.ts`). Production splits it into the tables below. The main flow is the PDF flow (`app/(workspace)/signatures/upload/page.tsx` and `components/pdf/*`). The older text-document flow (`app/(workspace)/signatures/new/page.tsx`, `app/(workspace)/signatures/[requestId]/fields/page.tsx`) uses the same records and is to be retired (GAP-16 in FR-SIGN-001).

### `signature_request`

**What it stores:** One signature request (the "envelope"): who sent it, its title and message, whether signers go in order or all at once, its status, its reminder and expiry settings, and its key dates. Drafts and requests in the Trash are rows here too.
**In the prototype today:** `SignatureRequest` in `types/documents.ts` (plus `PdfRequestDraft.step` for `draft_step`). The nested arrays `signers`, `ccRecipients`, `reviewers`, `fields`, `pdfs`, `events` and `emails` become the child tables below.
**Main screens:** Inbox and lists `app/(workspace)/signatures/all/page.tsx`, `sent`, `waiting`, `completed`, `declined`, `expired`, `drafts`, `trash` (all under `app/(workspace)/signatures/`); the dashboard `app/(workspace)/agreements/page.tsx` and `app/(workspace)/agreements/reports/page.tsx`; the wizard `app/(workspace)/signatures/upload/page.tsx`; the detail page `app/(workspace)/signatures/[requestId]/page.tsx` (renders `components/pdf/pdf-request-detail.tsx` for PDF requests); the audit page `app/(workspace)/signatures/[requestId]/audit/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signature_request_id` | uuid | pk | Identifies one request. Every signer, reviewer, field, email, token and audit event points to it. | FR-SIGN-001; SRS Section 7 Entity 7 (`id`) | In every request route (`signatures/[requestId]`, `signatures/sign/[requestId]`, `signatures/review/[requestId]`); shown as "Package ID" on `app/(workspace)/signatures/[requestId]/audit/page.tsx` and as "Reference" on the Signing Summary page of the signed PDF (`lib/pdf/signed-pdf.ts`). Replaces `SignatureRequest.id` (types/documents.ts), today `sig-<timestamp>`. | uuid, the project-wide key type. It matters more here than usual: the id is shown on screen and in URLs, so it must not be guessable (the prototype's timestamp id could be). |
| `organization_id` | uuid | fk → organization | Says which organisation owns the request, so lists, reports and settings only ever show that organisation's requests. | Annex C DATA-01 (every record has an organisation boundary); Annex B §2.9 Inbox visibility, REQ-AGR-072 | Not shown in the UI. The prototype has one organisation and no such field; visibility is worked out in `canSeeSignatureRequest` in `context/app-context.tsx`. | uuid because `organization.organization_id` is uuid. |
| `sender_user_id` | uuid | fk → users | The person who created and sent the request. Only the sender may cancel, trash, restore or delete it. | FR-SIGN-001; Entity 7 `senderId`; REQ-AGR-054 | "Sent by …" on `components/pdf/pdf-request-detail.tsx` and the Signing Summary in `lib/pdf/signed-pdf.ts`; "Sent by me" filter on `app/(workspace)/signatures/all/page.tsx`. Replaces `SignatureRequest.senderId` (and the copied `senderName`, which is now read from `users`). | uuid because `users.user_id` is uuid. |
| `document_id` | uuid | fk → document (library item it was started from) | Links the request to the Documents library item it was started from, so the document can show "pending" while out for signature and "signed" when finished. | Entity 7 `documentId`; REQ-AGR-037 (sending marks linked documents pending); FR-SIGN-001 trigger "Documents › Send for signature" | Drafts list shows the linked document (`app/(workspace)/signatures/drafts/page.tsx`); the text flow picks it in `app/(workspace)/signatures/new/page.tsx`. Replaces `SignatureRequest.documentId`. Empty when the PDF was uploaded directly. | uuid because `document.document_id` is uuid. |
| `contract_id` | uuid | fk → contract | Links the request to a contract record, so finishing the signing sets the contract to active. | Entity 7 `contractId`; FR-DOC-004 (contract lifecycle) | Hidden: contracts are switched off (`contracts: false` in `lib/features.ts`). The code is kept: `app/(workspace)/contracts/awaiting/page.tsx` opens `signatures/new?contractId=…`, and `signDocumentSimulated` in `context/app-context.tsx` sets the contract to active. Replaces `SignatureRequest.contractId`. | uuid because `contract.contract_id` is uuid. |
| `title` | varchar | | The name of the request. The prototype also uses it as the email subject and the signed-file name (`<title> - signed.pdf`). | FR-SIGN-001; Entity 7 `title`; REQ-AGR-023 | Heading of every list row, detail page, audit page, Outbox email subjects (`components/pdf/demo-email-card.tsx`) and the signed PDF summary. Replaces `SignatureRequest.title`. | varchar: a short, one-line name. |
| `message` | text | | The sender's note to the signers, put at the top of the invitation email. | FR-SIGN-001 (Message); FR-SETT-004 (default message) | Typed in the Review & send step of `app/(workspace)/signatures/upload/page.tsx` (pre-filled from Signing Defaults); shown in the invite email body in the Outbox (`signingInvite` in `context/app-context.tsx`). Replaces `SignatureRequest.message`. | text: free-form and can be long (the wizard allows up to 10,000 characters, `MAX_MESSAGE_LENGTH` in `lib/signing-options.ts`). |
| `signing_order` | varchar | | Whether signers sign one after another (`sequential`) or all at once (`parallel`). Decides who is invited first. | FR-SIGN-001, FR-SIGN-003, FR-SIGN-007; BR-07; REQ-AGR-032; Entity 7 `signingOrder` | Toggle in the Recipients step of `app/(workspace)/signatures/upload/page.tsx`; "Signing in order" / "Signing at the same time" on `components/pdf/pdf-request-detail.tsx`. Replaces `SignatureRequest.signingOrder` (`SigningOrder`). | varchar with a fixed list of allowed values (sequential / parallel), checked by the app rather than a database enum, so a new mode can be added without a schema change. |
| `status` | varchar | | Where the request is in its life: draft, sent, viewed, partially_signed, awaiting_review (all signed, waiting for reviewers), then one of the final states completed, declined, expired or cancelled. | Annex B §2.7 state machine; REQ-AGR-050, REQ-AGR-056; FR-SIGN-003/007/008/011/014; BR-11; Entity 7 `status` | Status badge (`SignatureRequestStatusBadge` from `components/documents/document-badges.tsx`) on every list and the detail page; drives which list a request appears in (`signatures/completed`, `declined`, `expired`, `drafts` …) and which buttons show (Remind, Cancel, Sign now, Review now). Replaces `SignatureRequest.status` (`SignatureRequestStatus`). | varchar with a fixed list of allowed values, checked by the app (not a database enum) so a new state, such as the in-person states under discussion, does not need a schema change. |
| `is_self_sign` | boolean | | Marks a "Sign it yourself" request: the sender is the only signer, nothing is emailed and there are no reminders. | Annex B §2.4; REQ-AGR-020…024 | "Signed by yourself" on `components/pdf/pdf-request-detail.tsx`; the wizard opens in self mode at `signatures/upload?mode=self`; the scheduler skips these (`applySignatureSchedule`). Replaces `SignatureRequest.selfSign` and `PdfRequestDraft.mode`. | boolean: it is a plain yes/no. |
| `reminder_frequency` | varchar | | How often people who still have to act get an automatic reminder. | FR-SIGN-001, FR-SIGN-011; Entity 7 `reminderFrequency`; Annex B §2.9 reminder rule | Chosen in the wizard (`app/(workspace)/signatures/upload/page.tsx`, options from `REMINDER_OPTIONS` in `lib/signing-options.ts`); shown as "Reminders: every 2 days" on `components/pdf/pdf-request-detail.tsx`; read by `applySignatureSchedule` in `context/app-context.tsx`. Replaces `SignatureRequest.reminderFrequency` (the older `reminderIntervalDays` number is dropped because it follows from this value). | varchar with a fixed list (daily / every_2_days / every_3_days / weekly / never), checked by the app, not a database enum. |
| `draft_step` | integer | | For a draft, the wizard step the person stopped on, so "Continue draft" reopens at the same step. | REQ-AGR-035 (drafts auto-save and can be continued) | Not shown; used by `app/(workspace)/signatures/upload/page.tsx` (`setStep(d.step)`) when opened from `app/(workspace)/signatures/drafts/page.tsx`. Replaces `PdfRequestDraft.step`. The rest of the prototype's `draft` object is stored in the normal columns and child tables. | integer: a small step number (1 to 4). |
| `expires_at` | timestamp | | The moment after which no one can sign or review any more; the scheduler then sets the status to expired. Signing links expire at the same moment. | FR-SIGN-011; FR-SETT-004 (default 120 days); REQ-AGR-033; BR-10; Entity 7 `expiresAt` | "expires [date]" on `components/pdf/pdf-request-detail.tsx`; "This request has expired" screen in `components/pdf/pdf-signing-view.tsx`; the Expired list `app/(workspace)/signatures/expired/page.tsx`. Replaces `SignatureRequest.expiresAt`. | timestamp: an exact moment with time zone. The prototype stores only a date and treats it as 23:59:59 local time on that day (REQ-AGR-033); production must store that end-of-day moment in the organisation's time zone. |
| `last_reminder_at` | timestamp | | When the last reminder went out, so the scheduler knows when the next one is due. | FR-SIGN-011; Annex B §2.9 reminder rule (`now − (lastReminderAt ?? sentAt) ≥ frequency days`) | Not shown in the UI; used by `applySignatureSchedule` in `context/app-context.tsx`. Replaces `SignatureRequest.lastReminderAt`. | timestamp: an exact moment, compared with "now". |
| `sent_at` | timestamp | | When the request was sent. It is the starting point for the first reminder and for turnaround reports. | FR-SIGN-003 (`sent_at = now`); Entity 7 `sentAt` | "Sent [date]" on `app/(workspace)/agreements/page.tsx`; average time-to-complete on `app/(workspace)/agreements/reports/page.tsx`. Replaces `SignatureRequest.sentAt`. Empty for drafts. | timestamp: an exact moment. |
| `completed_at` | timestamp | | When the request was completed (last signature, or last reviewer approval when there are reviewers). | FR-SIGN-007, FR-SIGN-014; Entity 7 `completedAt` | "Completed: [date]" on `app/(workspace)/signatures/completed/page.tsx`; "Completed" row of the Signing Summary in `lib/pdf/signed-pdf.ts`; reports page. Replaces `SignatureRequest.completedAt`. | timestamp: an exact moment. |
| `created_at` | timestamp | | When the request (or draft) was first created. | Annex B §2.7 ("Draft Created"); generic audit column | Date line on `components/pdf/pdf-request-detail.tsx`; "Started …" on the Drafts page; "Dispatched Date" on the audit page. Replaces `SignatureRequest.createdAt`. | timestamp: an exact moment. |
| `deleted_at` | timestamp | | Set when the sender moves the request to the Trash; clearing it restores the request. Status is not changed. | Annex B §2.9 Trash; REQ-AGR-054 | `app/(workspace)/signatures/trash/page.tsx` ("deleted [date]", Restore, Delete forever); trashed requests are hidden from the Inbox. Replaces `SignatureRequest.deletedAt`. | timestamp: records when it was trashed; empty means "not in the Trash", so no separate yes/no flag is needed. |

### `signature_request_file`

**What it stores:** The PDFs inside one request, in order. The first one is the main PDF. Each row points to the stored file (bytes in object storage) and, if it came from the Documents library, to that library item.
**In the prototype today:** `PdfAttachment` in `types/documents.ts`, held in `SignatureRequest.pdfs` (and `SignatureRequest.pdf` for the first one). File name, size and page count move to `stored_file`.
**Main screens:** Document step of `app/(workspace)/signatures/upload/page.tsx`; pages rendered by `components/pdf/pdf-pages.tsx` on the detail, signing and review pages; "Document 1 of 2: name" headings on `components/pdf/pdf-request-detail.tsx`; signed-PDF build in `lib/pdf/signed-pdf.ts`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signature_request_file_id` | uuid | pk | Identifies one PDF within a request. Fields point to it so they are drawn on the right document. | REQ-AGR-005 (each field records its document); Entity 9 `fileId` | Not shown; used to match fields to documents (`isOnFile` in `components/pdf/fields.tsx`). The prototype uses `PdfAttachment.fileId` for this. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request this PDF belongs to. | FR-SIGN-001 (upload one or more PDFs) | Not shown directly; the detail page lists all of a request's documents. Replaces the nesting in `SignatureRequest.pdfs`. | uuid because `signature_request.signature_request_id` is uuid. |
| `stored_file_id` | uuid | fk → stored_file | Points to the stored PDF bytes and their details (name, size, page count, SHA-256). | FR-SIGN-001; REQ-AGR-060 (store the SHA-256 of each original PDF) | Not shown directly; name and page count show in the wizard and on the detail page. Replaces `PdfAttachment.fileId` and the IndexedDB key in `lib/pdf/file-store.ts`. | Declared uuid, but `stored_file.stored_file_id` is now `bigserial` (a 64-bit number). A foreign key must have the same type as the key it points to, so this should be `bigint`. As written the link cannot be enforced. |
| `document_id` | uuid | fk → document (library item this PDF came from) | The Documents library item this PDF was added from (or saved to), so the document's status follows the request (pending, then signed). | REQ-AGR-037; Annex B §2.4 ("adds documents from the library") | Not shown; used by `markSourceDocsSigned` and `createPdfRequest` in `context/app-context.tsx`. Replaces `PdfAttachment.documentId`. | uuid because `document.document_id` is uuid. |
| `sample_id` | varchar | | Names a built-in sample PDF, so the demo can rebuild it if the stored bytes are gone. | Annex B NFR-004 (samples rebuilt from sampleId); REQ-AGR-009 (Demo) | Sample picker in the Document step of `app/(workspace)/signatures/upload/page.tsx`; rebuild in `lib/pdf/file-store.ts` and `lib/pdf/sample-pdfs.ts`. Replaces `PdfAttachment.sampleId`. | varchar: a short code such as a sample name. Only useful for demo samples; see Issues. |
| `sort_order` | integer | | The order of the PDFs. The first one is the main PDF; the signed PDF joins them in this order. | Annex B §2.8 ("in the order of pdfs[]"); Annex B §2.4 (reorder documents) | Reorder controls in the wizard; "Document 1 of N" on the detail page; page order in `lib/pdf/signed-pdf.ts`. Replaces the array position in `SignatureRequest.pdfs`. | integer: a position number. |

### `signer`

**What it stores:** One person who has to sign a request: name, email, order, status and the timestamps of what they did. If the email belongs to an account it is linked to that user.
**In the prototype today:** `SignatureSigner` in `types/documents.ts` (in `SignatureRequest.signers`).
**Main screens:** Recipients step of `app/(workspace)/signatures/upload/page.tsx`; Signers card on `components/pdf/pdf-request-detail.tsx`; signing page `app/(workspace)/signatures/sign/[requestId]/page.tsx` → `components/pdf/pdf-signing-view.tsx`; old text flow `app/(workspace)/signatures/[requestId]/page.tsx`; Signing Summary in `lib/pdf/signed-pdf.ts`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signer_id` | uuid | pk | Identifies one signer. Fields, tokens, emails and audit events point to it. | Entity 8 `id`; REQ-AGR-004 (each field belongs to one signer) | In demo links `signatures/sign/[requestId]?as=<signerId>` (Outbox and detail page). Replaces `SignatureSigner.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request this signer is on. | Entity 8 `envelopeId` | Not shown directly. Replaces the nesting in `SignatureRequest.signers`. | uuid because `signature_request.signature_request_id` is uuid. |
| `user_id` | uuid | fk → users; set when the email belongs to an account | Links the signer to a user account when their email matches one. Then the signing link requires that person to be logged in, and the request shows in their Inbox. | FR-SIGN-004; BR-08; NFR-SEC-004 | Not shown. The prototype matches by email instead (`canSeeSignatureRequest`, the "Sign now" check in `components/pdf/pdf-request-detail.tsx`). | uuid because `users.user_id` is uuid. Empty for outside signers. |
| `signature_file_id` | uuid | fk → stored_file (adopted signature image) | The signature image the signer adopted (typed, drawn or uploaded, turned into a PNG). | FR-SIGN-005; FR-SIGN-010; REQ-AGR-064 (certificate lists each signer's signature image) | Drawn into signature fields on the signing page and in the signed PDF. Replaces `SignatureSigner.signatureValue` (a data URL or typed text). | Declared uuid, but `stored_file.stored_file_id` is `bigserial`, so this should be `bigint` to match. Also there is no column for the adopted initials image; see Issues. |
| `name` | varchar | | The signer's name as typed by the sender. Used in emails, the summary and to pre-fill Full Name fields. | FR-SIGN-001; Entity 8 `name`; REQ-SGN-006 | Signers card, Outbox "To" line, "It's not your turn yet" screen, Signing Summary. Replaces `SignatureSigner.name`. | varchar: a short name. |
| `email` | varchar | | Where the invitation goes; also how the person is recognised (account match, Inbox visibility). | FR-SIGN-001; Entity 8 `email` (lower-case); SRS 7.2 email rule | Recipients step; Signers card; Outbox. Replaces `SignatureSigner.email`. | varchar: an email address is short text. Stored lower-case (schema header rule). |
| `role` | varchar | | A free label for the signer, e.g. "Client". | Entity 8 `role` | Not shown in the PDF flow; the prototype fills it with "Signer" or "Signer (you)" (`createPdfRequest` in `context/app-context.tsx`). The old text flow shows it. Replaces `SignatureSigner.role`. | varchar: short free text. Note SRS Entity 8 defines `role` as an enum (`needs_to_sign` / `in_person_signer`), not free text; see Issues. |
| `signing_position` | integer | | The signer's place in the order when signing is sequential (1, 2, 3 …). Only the lowest unsigned position is invited. | BR-07; REQ-AGR-032; FR-SIGN-003; Entity 8 `order` | "1. Name" on the Signers card when in order; Signing Summary. Replaces `SignatureSigner.order`. | integer: a position number. |
| `status` | varchar | | Where this signer is: waiting (not their turn), pending (their turn), viewed, signed or declined. | Annex B §2.7 signer transitions; Entity 8 `status`; FR-SIGN-007/008 | `SignerStatusBadge` on the Signers card; decides the blocked screens in `components/pdf/pdf-signing-view.tsx`. Replaces `SignatureSigner.status`. | varchar with a fixed list of allowed values, checked by the app, not a database enum. |
| `is_required` | boolean | | Whether this signer must sign for the request to finish. | No specific requirement; carried over from the prototype type | Not shown in the UI; always true in the PDF flow (`createPdfRequest`). Replaces `SignatureSigner.required`. | boolean: yes/no. |
| `color` | varchar | | The colour that marks this signer's fields while placing and viewing them. | FR-SIGN-002 ("each recipient assigned a distinct accent color"); REQ-AGR-004 | Coloured dot on the Signers card; field colours in `components/pdf/field-placer.tsx` and `components/pdf/fields.tsx`. Set from `SIGNER_COLORS` in `app/(workspace)/signatures/upload/page.tsx`. Replaces `SignatureSigner.color`. | varchar: a short colour code such as `#3b82f6`. |
| `viewed_at` | timestamp | | When the signer first opened the document. | FR-SIGN-004 ("viewed" event); Annex B §2.6; Entity 8 `viewedAt`; REQ-AGR-064 | "Viewed: [date]" in the old text-flow detail `app/(workspace)/signatures/[requestId]/page.tsx`; set by `markPdfSignerViewed`. Replaces `SignatureSigner.viewedAt`. | timestamp: an exact moment. |
| `signed_at` | timestamp | | When the signer finished signing. | FR-SIGN-007; Entity 8 `signedAt` | "Signed [date]" on the Signers card; Signing Summary in the signed PDF. Replaces `SignatureSigner.signedAt`. | timestamp: an exact moment. |
| `declined_at` | timestamp | | When the signer declined. | FR-SIGN-008 | Not shown in the UI; set by `declineSignatureRequest` in `context/app-context.tsx`. The audit trail shows the matching event. Replaces `SignatureSigner.declinedAt`. | timestamp: an exact moment. |
| `decline_reason` | text | | The reason the signer gave for declining (required). | FR-SIGN-008; REQ-SGN-005; Entity 8 `declineReason` | "Declined: “…”" on the Signers card; in the decline email to the sender (Outbox). Replaces `SignatureSigner.declineReason`. | text: free sentence of any length. |

### `copy_recipient`

**What it stores:** People who do not sign but receive a copy (a notice when it is sent and the signed PDF when it is finished).
**In the prototype today:** `CopyRecipient` in `types/documents.ts` (in `SignatureRequest.ccRecipients`).
**Main screens:** "Receives a copy" role in the Recipients step of `app/(workspace)/signatures/upload/page.tsx`; "Receives a copy" list on `components/pdf/pdf-request-detail.tsx`; "Received a copy" on the Signing Summary (`lib/pdf/signed-pdf.ts`); copy emails in `app/(workspace)/signatures/outbox/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `copy_recipient_id` | uuid | pk | Identifies one copy recipient. | REQ-AGR-031 | Not shown. Replaces `CopyRecipient.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request they get a copy of. | REQ-AGR-031 | Not shown directly. Replaces the nesting in `SignatureRequest.ccRecipients`. | uuid because `signature_request.signature_request_id` is uuid. |
| `name` | varchar | | Their name, for emails and the summary page. | FR-SIGN-001 (recipient rows with Name) | "Receives a copy" list; Outbox "To" line. Replaces `CopyRecipient.name`. | varchar: a short name. |
| `email` | varchar | | Where the copy notice and the signed PDF go; also lets them see the request in their Inbox. | FR-SIGN-001; Annex B §2.9 (completed email to copy recipients; Inbox visibility) | "Receives a copy" list; Outbox. Replaces `CopyRecipient.email`. | varchar: an email address, stored lower-case. |
| `role` | varchar | | `copy` for "Receives a copy"; `view` is the old "Needs to view" role, kept only on old requests and treated as a copy. | REQ-AGR-031; Entity 8 note on `needs_to_view` | "(needs to view)" suffix on the Signing Summary for old rows (`lib/pdf/signed-pdf.ts`). Replaces `CopyRecipient.role`. | varchar with a fixed list (copy / view), checked by the app, not a database enum. |

### `reviewer`

**What it stores:** People who must approve the fully signed document before the request is completed. They do not sign. One rejection closes the request as declined.
**In the prototype today:** `SignatureReviewer` in `types/documents.ts` (in `SignatureRequest.reviewers`), status type `ReviewerStatus`.
**Main screens:** "Needs to review" role in `app/(workspace)/signatures/upload/page.tsx`; "Reviews before it is finished" on `components/pdf/pdf-request-detail.tsx`; review page `app/(workspace)/signatures/review/[requestId]/page.tsx` → `components/pdf/pdf-review-view.tsx`; "Reviewed by" on the Signing Summary.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `reviewer_id` | uuid | pk | Identifies one reviewer. Tokens, emails and audit events point to it. | FR-SIGN-014; SRS Entity 11 `id` | In demo links `signatures/review/[requestId]?as=<reviewerId>`. Replaces `SignatureReviewer.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request they review. | Entity 11 `requestId` | Not shown directly. Replaces the nesting in `SignatureRequest.reviewers`. | uuid because `signature_request.signature_request_id` is uuid. |
| `user_id` | uuid | fk → users; set when the email belongs to an account | Links the reviewer to an account when the email matches one, for Inbox visibility and the login gate on their link. | FR-SIGN-004 / BR-08 (same gate as signers); REQ-AGR-074 | Not shown; the prototype matches by email (the "Review now" check in `components/pdf/pdf-request-detail.tsx`). | uuid because `users.user_id` is uuid. Empty for outside reviewers. |
| `name` | varchar | | The reviewer's name. | Entity 11 `name` | Reviews section on the detail page; Outbox; Signing Summary. Replaces `SignatureReviewer.name`. | varchar: a short name. |
| `email` | varchar | | Where the review email goes; must differ from every signer's email on the same request. | Entity 11 `email`; FR-SIGN-001 ("Same Person Twice") | Reviews section; Outbox; "Each recipient needs a different email address" check in the wizard. Replaces `SignatureReviewer.email`. | varchar: an email address, stored lower-case. |
| `status` | varchar | | waiting (signers still signing), pending (asked to review), approved or rejected. | FR-SIGN-014; BR-11; Annex B §2.7 reviewer transitions; Entity 11 `status` | `ReviewerStatusBadge` on the detail page; "Review now" button only while pending. Replaces `SignatureReviewer.status`. | varchar with a fixed list of allowed values, checked by the app, not a database enum. |
| `note` | text | | Optional comment when approving; the required reason when rejecting. | FR-SIGN-014; Entity 11 `note` | Quoted under the reviewer on the detail page (red when rejected); "Comment:" on the Signing Summary; in the rejection emails. Replaces `SignatureReviewer.note`. | text: a free sentence of any length. |
| `reviewed_at` | timestamp | | When they approved or rejected. | FR-SIGN-014; Entity 11 `reviewedAt` | "Approved [date]" / "Rejected [date]" on the detail page; "Reviewed:" on the Signing Summary. Replaces `SignatureReviewer.reviewedAt`. | timestamp: an exact moment. |

### `signature_field`

**What it stores:** One box placed on a PDF page for one signer to fill: its type, page, position and size (as percentages of the page), whether it is required, and the value entered.
**In the prototype today:** `SignatureField` in `types/documents.ts` (in `SignatureRequest.fields`), type list `SignatureFieldType`.
**Main screens:** Place fields step in `app/(workspace)/signatures/upload/page.tsx` with `components/pdf/field-placer.tsx` and the palette in `components/pdf/fields.tsx`; filling in `components/pdf/pdf-signing-view.tsx`; read-only view on `components/pdf/pdf-request-detail.tsx` and `components/pdf/pdf-review-view.tsx`; preview in `components/pdf/recipient-preview.tsx`; burned into the PDF by `lib/pdf/signed-pdf.ts`; old text flow `app/(workspace)/signatures/[requestId]/fields/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signature_field_id` | uuid | pk | Identifies one placed field; the signer's values are saved against it. | Entity 9 `id`; FR-SIGN-002 | Not shown. Replaces `SignatureField.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request the field belongs to. | Entity 9 `envelopeId` | Not shown directly. Replaces the nesting in `SignatureRequest.fields`. | uuid because `signature_request.signature_request_id` is uuid. Redundant with `signature_request_file_id` (the file already belongs to a request); see Issues. |
| `signature_request_file_id` | uuid | fk → signature_request_file | Which of the request's PDFs the field is on. | REQ-AGR-005; Entity 9 `fileId` | Used to draw the field on the right document (`isOnFile` in `components/pdf/fields.tsx`). Replaces `SignatureField.fileId` (where "missing" meant the first PDF). | uuid because `signature_request_file.signature_request_file_id` is uuid. |
| `signer_id` | uuid | fk → signer | The one signer who must fill this field. | REQ-AGR-004; Entity 9 `signerId`; REQ-SGN-001 (signer sees only their fields) | Field colour and assignee picker in the placer; signing page shows only that signer's fields. Replaces `SignatureField.signerId`. | uuid because `signer.signer_id` is uuid. |
| `field_type` | varchar | | What kind of field it is: one of the 14 types (signature, initials, date, name, email, company, title, text, number, checkbox, dropdown, radio, approve, decline). Decides how it is filled and drawn. | FR-SIGN-002; REQ-AGR-001; Annex B §2.3 field table; Entity 9 `type` | Palette groups and labels in `components/pdf/fields.tsx` (`FIELD_META`, `FIELD_GROUPS`). Replaces `SignatureField.type`. | varchar with a fixed list of allowed values, checked by the app, not a database enum, so a new field type needs no schema change. |
| `page_number` | integer | | The page the field is on, starting at 1. | REQ-AGR-005; Entity 9 `pageNumber` | Used to place the field on the right page in `components/pdf/pdf-pages.tsx` and `lib/pdf/signed-pdf.ts`. Replaces `SignatureField.pageNumber`. | integer: a page count. |
| `position_x` | decimal | | Left edge, as a percentage of the page width (0–100), so the field stays in place at any zoom. | FR-SIGN-002; REQ-AGR-002; Annex B §2.3 coordinates; Entity 9 `positionX` | Field position in the placer and viewers; converted to PDF points in `lib/pdf/signed-pdf.ts`. Replaces `SignatureField.positionX`. | decimal: an exact fraction (e.g. 10.25). Exact storage keeps the field exactly where it was placed after saving and loading. |
| `position_y` | decimal | | Top edge, as a percentage of the page height (0–100), measured from the top. | FR-SIGN-002; FR-SIGN-010 (top-left to bottom-left conversion); Entity 9 `positionY` | As above. Replaces `SignatureField.positionY`. | decimal: an exact fraction. |
| `width` | decimal | | Field width, as a percentage of the page width. | REQ-AGR-003 (minimum 2 %); Entity 9 `width` | Resize handles in `components/pdf/field-placer.tsx`; box size in the signed PDF. Replaces `SignatureField.width`. | decimal: an exact fraction. |
| `height` | decimal | | Field height, as a percentage of the page height. | REQ-AGR-003 (minimum 1.5 %); Entity 9 `height` | As above. Replaces `SignatureField.height`. | decimal: an exact fraction. |
| `is_required` | boolean | | Whether the signer must fill it before they can finish. Checkboxes default to optional. | REQ-AGR-007; REQ-SGN-004; FR-SIGN-007; Entity 9 `required` | "Required" tick box in the field settings panel of `app/(workspace)/signatures/upload/page.tsx`; "N required fields left" counter and pulsing empty fields in `components/pdf/pdf-signing-view.tsx`. Replaces `SignatureField.required`. | boolean: yes/no. |
| `value` | text | | What the signer entered: text, a date, "true" for a checkbox, the chosen option, "Approved"/"Declined", or (for signature and initials fields) the image. | FR-SIGN-007 (record field values); FR-SIGN-010; Entity 9 `value` | Filled values show read-only on the detail and review pages and are burned into the signed PDF. Replaces `SignatureField.value`. | text: the length is unknown (the prototype puts a whole PNG data URL here for signature fields). In production, images should live in `stored_file`, not in this column; see Issues. |

### `signature_field_option`

**What it stores:** The choices of one dropdown or radio field, in order.
**In the prototype today:** `SignatureField.options` (a string array) in `types/documents.ts`.
**Main screens:** Options box in the field settings panel of `app/(workspace)/signatures/upload/page.tsx` (one option per line; defaults set in `components/pdf/field-placer.tsx`); the choice list on `components/pdf/pdf-signing-view.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signature_field_option_id` | uuid | pk | Identifies one option. | Entity 9 `options`; schema rule "lists are their own tables" | Not shown. New for production (the prototype keeps a plain array). | uuid, the project-wide key type. |
| `signature_field_id` | uuid | fk → signature_field | The dropdown or radio field this option belongs to. | REQ-AGR-006 | Not shown directly. | uuid because `signature_field.signature_field_id` is uuid. |
| `label` | varchar | | The text of the choice, as shown to the signer and stored as the field's value when picked. | REQ-AGR-006 (default options; sending blocked while none) | Options box in the wizard; choices on the signing page. Replaces one entry of `SignatureField.options`. | varchar: a short label. |
| `sort_order` | integer | | The order the choices appear in. | REQ-AGR-006 | Order of the choices on the signing page. Replaces the array position. | integer: a position number. |

### `signing_token`

**What it stores:** The private link token that lets one signer or one reviewer open their request without logging in (unless their email belongs to an account). Only a hash is stored. The token stops working when the request expires, finishes, is declined or is cancelled.
**In the prototype today:** Nothing. The prototype opens `signatures/sign/[requestId]?as=<signerId>` and `signatures/review/[requestId]?as=<reviewerId>` inside the logged-in workspace with no token (FR-SIGN-004 implementation status).
**Main screens:** None yet. The links that will carry tokens are shown today in the Outbox (`components/pdf/demo-email-card.tsx`, "Open their signing link (demo)" on `components/pdf/pdf-request-detail.tsx`).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signing_token_id` | uuid | pk | Identifies one token record. | FR-SIGN-004; NFR-022 | Not shown in the UI. New for production. | uuid, the project-wide key type. |
| `signer_id` | uuid | fk → signer | The signer the token belongs to (when it is a signing link). | FR-SIGN-004 ("bound to one recipient"); NFR-022 | Not shown; replaces `?as=<signerId>` on the signing route. | uuid because `signer.signer_id` is uuid. |
| `reviewer_id` | uuid | fk → reviewer | The reviewer the token belongs to (when it is a review link). | FR-SIGN-014 ("personal review link"); REQ-AGR-038 | Not shown; replaces `?as=<reviewerId>` on the review route. | uuid because `reviewer.reviewer_id` is uuid. |
| `token_hash` | varchar | unique | The hash of the random token in the link (at least 128 bits). The token itself is never stored, so a database leak does not expose working links. | NFR-022; FR-SIGN-004; schema header rule "tokens are stored only as hashes" | Not shown in the UI. | varchar: a hash is a fixed-length string (e.g. 64 hex characters for SHA-256). Unique so one token always maps to one person. |
| `expires_at` | timestamp | | When the link stops working: the same moment as the request's `expires_at`. | BR-10; NFR-022; DEC-06 | Not shown in the UI. | timestamp: an exact moment. It copies `signature_request.expires_at`, which breaks the "nothing stored twice" rule; see Issues. |
| `revoked_at` | timestamp | | When the link was switched off early (request completed, declined or cancelled, or the person removed). | BR-10; FR-SIGN-008 ("all of its signing links stop working") | Not shown in the UI. | timestamp: records when; empty means still valid. |
| `created_at` | timestamp | | When the token was issued (on send, or when a sequential signer's turn starts). | FR-SIGN-003 (invitation emails with tokenised URLs) | Not shown in the UI. | timestamp: an exact moment. |

**Rules:** `* exactly one of signer_id / reviewer_id is filled` — a token always opens exactly one person's link, either a signer's signing page or a reviewer's review page, never both and never neither. This needs a database check constraint (`num_nonnulls(signer_id, reviewer_id) = 1`), because a token with no owner, or two owners, would be a security hole.

### `signature_request_event`

**What it stores:** The audit trail of a request: one row per thing that happened (created, sent, opened, signed, declined, reminded, reviewed, cancelled, expired, completed, seal applied), with who did it, when and from which IP address. Rows are only added, never changed.
**In the prototype today:** `AuditEvent` in `types/documents.ts` (in `SignatureRequest.events`), built by `requestEvent` in `context/app-context.tsx`.
**Main screens:** `app/(workspace)/signatures/[requestId]/audit/page.tsx` (timeline, print and download); Activity card on `components/pdf/pdf-request-detail.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signature_request_event_id` | uuid | pk | Identifies one audit event. | FR-SIGN-012; REQ-AGR-051 | Not shown. Replaces `AuditEvent.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request the event belongs to. | FR-SIGN-012 | The audit page lists one request's events. Replaces `AuditEvent.requestId`. | uuid because `signature_request.signature_request_id` is uuid. |
| `actor_user_id` | uuid | fk → users | The logged-in user who did it, when there is one. Empty for system actions (scheduler, "Flash Sign") and for outside signers. | FR-SIGN-012 (actor); Annex C DATA-05 | Not shown directly (the name is shown from `actor_name`). New for production; the prototype stores only a name. | uuid because `users.user_id` is uuid. |
| `signer_id` | uuid | fk → signer | The signer the event is about (opened, signed, declined, invited). | FR-SIGN-012 | Not shown as a link; the prototype keeps the signer's name in `AuditEvent.relatedSigner`. | uuid because `signer.signer_id` is uuid. |
| `reviewer_id` | uuid | fk → reviewer | The reviewer the event is about (review approved or rejected). | FR-SIGN-014 ("Review Approved", "Review Rejected" events) | Not shown as a link. New for production. | uuid because `reviewer.reviewer_id` is uuid. |
| `event_name` | varchar | | The event title, e.g. "Signature Request Sent", "Document Signed", "Review Approved", "Request Expired". | FR-SIGN-012; Annex B §2.8 audit event names | Bold title of each timeline entry on the audit page and the Activity card. Replaces `AuditEvent.eventName` (and the older `AuditEvent.name`). | varchar: a short title from a known list, kept as text so new events need no schema change. |
| `category` | varchar | | Groups the event: security, signing, delivery, status, creation or request. | FR-SIGN-012 (event category badge); `AuditEvent.category` | "[category] event" label on the audit page. Replaces `AuditEvent.category`. | varchar with a fixed list of allowed values, checked by the app, not a database enum. |
| `description` | text | | A sentence explaining what happened, e.g. "Claire Dupont filled 4 field(s) and signed." | FR-SIGN-012 | Under each timeline title on the audit page and the Activity card; in the downloaded audit file. Replaces `AuditEvent.description`. | text: free sentence; can include reasons and comments. |
| `actor_name` | varchar | | The name of who did it, as it was at the time. Needed because outside signers have no user row and the trail must not change if a user is renamed. | FR-SIGN-012 (Actor Name) | "Actor: [name]" on the audit page; "· name" on the Activity card. Replaces `AuditEvent.actorName`. | varchar: a short name. A snapshot, on purpose. |
| `actor_email` | varchar | | The email of who did it, as it was at the time. | FR-SIGN-012 (Actor Email); REQ-AGR-064 | Not shown on the audit page today (stored by `signDocumentSimulated` and in mock data only). Replaces `AuditEvent.actorEmail`. | varchar: an email address. |
| `ip_address` | varchar | | The IP address the action came from, for evidence. | FR-SIGN-012 ("with IP addresses"); REQ-SGN-008; REQ-AGR-064 | Not shown and not captured in the prototype (the type has `AuditEvent.ipAddress` but nothing sets it). | varchar: fits both IPv4 and IPv6 text forms. (PostgreSQL's `inet` type would also work and validates the format.) |
| `created_at` | timestamp | | When it happened. | FR-SIGN-012 ("exact ISO Timestamp"); Annex C DATA-04 | Date and time on each timeline entry. Replaces `AuditEvent.timestamp`. | timestamp: an exact moment with time zone. |

### `outbound_email`

**What it stores:** Every email the system sends about a request (invite, copy notice, review request, reminder, completed, declined, cancelled, expired), with its recipient, subject and body.
**In the prototype today:** `DemoEmail` in `types/documents.ts` (in `SignatureRequest.emails`), kind list `DemoEmailKind`; built by `demoEmail`, `signingInvite`, `reviewInvite` and `completedEmails` in `context/app-context.tsx`. No email actually leaves the browser.
**Main screens:** `app/(workspace)/signatures/outbox/page.tsx`; "Emails sent (demo)" card on `components/pdf/pdf-request-detail.tsx`; each email drawn by `components/pdf/demo-email-card.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `outbound_email_id` | uuid | pk | Identifies one email. | REQ-AGR-070 (every email recorded on the request) | Not shown. Replaces `DemoEmail.id`. | uuid, the project-wide key type. |
| `signature_request_id` | uuid | fk → signature_request | The request the email is about. | REQ-AGR-070 | The Outbox shows the request title next to each email. Replaces the nesting in `SignatureRequest.emails`. | uuid because `signature_request.signature_request_id` is uuid. |
| `signer_id` | uuid | fk → signer | For invites and signer reminders: the signer whose personal link is in the email. | Annex B §2.9 (invite carries the personal signing link) | "Open signing link" button on the email card (`components/pdf/demo-email-card.tsx`). Replaces `DemoEmail.signerId`. | uuid because `signer.signer_id` is uuid. |
| `reviewer_id` | uuid | fk → reviewer | For review emails and reviewer reminders: the reviewer whose personal link is in the email. | FR-SIGN-014; Annex B §2.9 (review email) | "Open review link" button on the email card. Replaces `DemoEmail.reviewerId`. | uuid because `reviewer.reviewer_id` is uuid. |
| `kind` | varchar | | What the email is for: invite, copy, review, reminder, completed, declined, cancelled or expired. | Annex B §2.9 email table; FR-SIGN-003/007/008/011/014 | Coloured kind badge on each email card. Replaces `DemoEmail.kind`. | varchar with a fixed list of allowed values, checked by the app, not a database enum. |
| `to_name` | varchar | | The recipient's name, as it was when sent. | REQ-AGR-070 | "To name (email)" line on the email card; Outbox search. Replaces `DemoEmail.toName`. | varchar: a short name. Kept as sent, because the email cannot change later. |
| `to_email` | varchar | | The address it was sent to. | REQ-AGR-070 | Address after the name on the email card; Outbox search. Replaces `DemoEmail.toEmail`. | varchar: an email address. |
| `subject` | varchar | | The subject line. | REQ-AGR-070 | Subject line on the email card; Outbox search. Replaces `DemoEmail.subject`. | varchar: one short line. |
| `body` | text | | The email text. | REQ-AGR-070 | Body on the email card. Replaces `DemoEmail.body`. | text: free text of any length (includes the sender's message). |
| `with_signed_pdf` | boolean | | Whether the signed PDF was attached (completed emails). | FR-SIGN-007 ("emails the flattened signed PDF"); Annex B §2.9 attachment column | `<title> - signed.pdf` download button on the email card. Replaces `DemoEmail.withSignedPdf`. | boolean: yes/no. |
| `sent_at` | timestamp | | When the email was sent. | REQ-AGR-070 | Outbox order (newest first) and time on the card. Replaces `DemoEmail.sentAt`. | timestamp: an exact moment. |

### `saved_signature`

**What it stores:** A person's one saved signature and initials (typed in a style, drawn or uploaded), used to pre-fill fields whenever they sign.
**In the prototype today:** `SavedSignature` in `types/documents.ts` (`savedSignatures` in `context/app-context.tsx`; `saveSignature` replaces the old one).
**Main screens:** `app/(workspace)/settings/signature/page.tsx` (My Signature); the editor `components/signature/signature-editor.tsx`; display `components/signature/signature-mark.tsx`; pre-fill and "save" option in `components/pdf/pdf-signing-view.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `saved_signature_id` | uuid | pk | Identifies the saved signature record. | FR-SIGN-009 | Not shown. New id (the prototype keys by `userId`). | uuid, the project-wide key type. |
| `user_id` | uuid | fk → users; unique (one per person) | The person it belongs to. Unique so each person has at most one saved signature; saving again replaces it. | FR-SIGN-009; BR-05; SRS 7.2 One-Signature-Per-User | Not shown; the signing page uses it to find the logged-in user's signature. Replaces `SavedSignature.userId`. | uuid because `users.user_id` is uuid. |
| `signature_file_id` | uuid | fk → stored_file | The signature image, for drawn or uploaded signatures. | FR-SIGN-009 ("stores signature image"); FR-SIGN-005 | Large signature preview on `app/(workspace)/settings/signature/page.tsx`. Replaces `SavedSignature.signatureImage` (a data URL). | Declared uuid, but `stored_file.stored_file_id` is `bigserial`, so this should be `bigint`. Empty for typed signatures. |
| `initials_file_id` | uuid | fk → stored_file | The initials image, for drawn or uploaded initials. | FR-SIGN-009 ("initials image") | Initials preview on the My Signature page. Replaces `SavedSignature.initialsImage`. | Declared uuid, but should be `bigint` to match `stored_file.stored_file_id` (bigserial). |
| `name` | varchar | | The name used for a typed signature. | FR-SIGN-005 (Type tab: name) | Typed signature preview; editor's Type tab. Replaces `SavedSignature.name`. | varchar: a short name. |
| `initials` | varchar | | The initials used for typed initials. | FR-SIGN-005 (Type tab: initials) | Initials preview; editor's Type tab. Replaces `SavedSignature.initials`. | varchar: a few letters. |
| `source` | varchar | | How the signature was made: type, draw or upload. | FR-SIGN-005; REQ-SGN-003 | "Typed / Drawn / Uploaded" label on the My Signature page; editor tab. Replaces `SavedSignature.source` (`SignatureSource`). | varchar with a fixed list (type / draw / upload), checked by the app, not a database enum. |
| `style` | varchar | | For typed signatures: the font style (formal, script, bold, elegant). | FR-SIGN-005 (4 Google Fonts) | Style picker in `components/signature/signature-editor.tsx` (fonts in `components/signature/signature-fonts.ts`). Replaces `SavedSignature.styleId` (`SignatureStyle`). | varchar with a fixed list, checked by the app. Empty when `source` is draw or upload. |
| `updated_at` | timestamp | | When the signature was last saved. | FR-SIGN-009 | Not shown in the UI; set on save. Replaces `SavedSignature.updatedAt`. | timestamp: an exact moment. |

### `signing_default`

**What it stores:** The organisation's defaults for new signature requests: expiry days, reminder frequency, signing order, email subject and message, and the expiry-warning days. One row per organisation.
**In the prototype today:** `SigningDefaults` in `types/documents.ts` (`signingDefaults` in `context/app-context.tsx`).
**Main screens:** `app/(workspace)/signatures/settings/page.tsx` (Agreements › Settings); defaults read by `app/(workspace)/signatures/upload/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signing_default_id` | uuid | pk | Identifies the defaults record. | FR-SETT-004 | Not shown. New id. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization; unique | The organisation the defaults belong to. Unique: one set of defaults per organisation. | FR-SETT-004 ("organization-wide"); Annex C DATA-01 | Not shown (prototype has one organisation). | uuid because `organization.organization_id` is uuid. |
| `expire_days` | integer | | Default number of days before a new request expires (default 120; allowed 1–999). | FR-SETT-004; BR-10 | Expiry presets 30/60/90/120 or custom on the settings page (`EXPIRY_PRESETS`, `MIN_EXPIRY_DAYS`, `MAX_EXPIRY_DAYS` in `lib/signing-options.ts`); pre-fills the wizard. Replaces `SigningDefaults.expireDays`. | integer: a whole number of days. |
| `reminder_frequency` | varchar | | Default reminder frequency for new requests. | FR-SETT-004; FR-SIGN-001 | Reminder select on the settings page; pre-fills the wizard. Replaces `SigningDefaults.reminderFrequency`. | varchar with the same fixed list as `signature_request.reminder_frequency`, checked by the app. |
| `signing_order` | varchar | | Default signing order for new requests. | FR-SETT-004 (defaults for new requests) | "One after another / All at once" buttons on the settings page; pre-fills the wizard. Replaces `SigningDefaults.signingOrder`. | varchar with a fixed list (sequential / parallel), checked by the app. |
| `email_subject` | varchar | | Default subject for invitation emails. | FR-SETT-004; FR-SIGN-001 (Subject pre-filled from it) | Subject box (max 100 characters, `MAX_SUBJECT_LENGTH`) on the settings page only. Not used yet: requests have no subject and the title is used instead (FR-SIGN-001 implementation status). Replaces `SigningDefaults.emailSubject`. | varchar: one short line. |
| `message` | text | | Default message for invitation emails. | FR-SETT-004 | Message box on the settings page; pre-fills the wizard's message. Replaces `SigningDefaults.message`. | text: can be long (up to 10,000 characters in the prototype). |
| `expiry_warning_days` | integer | | How many days before expiry the sender should be warned. | No SRS requirement; prototype only (`SigningDefaults.expiryWarningDays`, "Saved for later: no warning is sent yet") | "Warn the sender N days before a request expires" on the settings page; nothing sends the warning yet. | integer: a whole number of days. |
| `updated_at` | timestamp | | When the defaults were last changed. | Generic audit column | Not shown in the UI. New for production. | timestamp: an exact moment. |

### `signing_default_method`

**What it stores:** Which ways of signing the organisation allows (type, draw, upload). One row per allowed method.
**In the prototype today:** `SigningDefaults.allowedSignatureMethods` (an array of `SignatureSource`) in `types/documents.ts`.
**Main screens:** Signature-method tick boxes on `app/(workspace)/signatures/settings/page.tsx` (labels from `SIGNATURE_METHOD_LABELS` in `lib/signing-options.ts`); limits the tabs of `components/signature/signature-editor.tsx` in `components/pdf/pdf-signing-view.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `signing_default_method_id` | uuid | pk | Identifies one allowed-method row. | FR-SETT-004; schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `signing_default_id` | uuid | fk → signing_default | The defaults record this belongs to. | FR-SETT-004 | Not shown directly. | uuid because `signing_default.signing_default_id` is uuid. |
| `method` | varchar | | One allowed way to sign: type, draw or upload. At least one must be allowed. | FR-SETT-004 ("permitted signature methods"); REQ-SGN-003 | Tick boxes on the settings page ("Allow at least one way to sign"); tabs shown in the signing dialog. Replaces one entry of `SigningDefaults.allowedSignatureMethods`. | varchar with a fixed list (type / draw / upload), checked by the app, not a database enum. |

### `company_seal`

**What it stores:** An official company seal or stamp image that permitted roles may add when they sign, with a name, description and an on/off switch. How often it was used is counted from `company_seal_use`.
**In the prototype today:** `CompanySeal` in `types/documents.ts` (`companySeals` in `context/app-context.tsx`). `usageCount` and `lastUsedAt` are not stored any more; they come from `company_seal_use`.
**Main screens:** Company Seals section (`components/agreements/company-seals.tsx`) on `app/(workspace)/signatures/settings/page.tsx`; seal picker on the old text signing page `app/(workspace)/signatures/sign/[requestId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `company_seal_id` | uuid | pk | Identifies one seal. | FR-SETT-003; Entity 10 `id` | Not shown. Replaces `CompanySeal.id`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | The organisation the seal belongs to; a seal must never be offered in another organisation. | FR-SETT-003; NFR-SEC-005; Annex C DATA-01 | Not shown (prototype has one organisation). | uuid because `organization.organization_id` is uuid. |
| `created_by_user_id` | uuid | fk → users | The admin who added the seal. | FR-SETT-003 (Org Admin, CEO) | Not shown in the UI. Replaces `CompanySeal.createdBy`. | uuid because `users.user_id` is uuid. |
| `image_file_id` | uuid | fk → stored_file | The seal image (PNG, SVG or JPEG, up to 500 KB). | FR-SETT-003 (upload seal graphic); Entity 10 `image` | Seal thumbnail in the list and preview in the editor (`components/agreements/company-seals.tsx`); stamp on the signing page. Replaces `CompanySeal.image` (a data URL). | Declared uuid, but `stored_file.stored_file_id` is `bigserial`, so this should be `bigint` to match. |
| `name` | varchar | | The seal's name, e.g. "Corporate Executive Seal". | FR-SETT-003; Entity 10 `name` | Seal name in the list, the editor and the signing page picker; in the "Company Seal Applied" audit event. Replaces `CompanySeal.name`. | varchar: a short name. |
| `description` | text | | Optional note on what the seal is for. | FR-SETT-003 (Seal Name and Description) | Under the name in the seal list. Replaces `CompanySeal.description`. | text: free text. |
| `is_active` | boolean | | Turns the seal on or off without deleting it; only active seals can be applied. | FR-SETT-003 ("configure active status"); Entity 10 `isActive` | "Active / Turned off" badge and Turn on/off button in `components/agreements/company-seals.tsx`; filter `seal.isActive` on the signing page. Replaces `CompanySeal.isActive`. | boolean: yes/no. |
| `created_at` | timestamp | | When the seal was added. | FR-SETT-003 | Not shown in the UI. Replaces `CompanySeal.createdAt`. | timestamp: an exact moment. |

### `company_seal_allowed_role`

**What it stores:** Which roles may apply a given seal. One row per seal and role.
**In the prototype today:** `CompanySeal.allowedRoles` (an array of `DemoRole` ids such as `ceo`, `document_manager`) in `types/documents.ts`.
**Main screens:** Role tick boxes in the seal editor and role chips in the seal list (`components/agreements/company-seals.tsx`); the check `seal.allowedRoles.includes(demoRole)` in `app/(workspace)/signatures/sign/[requestId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `company_seal_allowed_role_id` | uuid | pk | Identifies one seal-role permission. | FR-SETT-003; schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `company_seal_id` | uuid | fk → company_seal | The seal. | FR-SETT-003 | Not shown directly. | uuid because `company_seal.company_seal_id` is uuid. |
| `role_id` | uuid | fk → role | A role allowed to apply the seal. The server must refuse (HTTP 403) anyone whose role is not listed. | FR-SIGN-006; FR-SETT-003; BR-06; NFR-SEC-005 | Role chips in the seal list; only matching users see the seal on the signing page. Replaces one entry of `CompanySeal.allowedRoles`. | uuid because `role.role_id` is uuid. |

**Rules:** `* unique (company_seal_id, role_id)` — a role is listed at most once per seal. A duplicate would add nothing and would make "remove this role" leave a copy behind.

### `company_seal_use`

**What it stores:** Each time a seal was applied: which seal, on which request, by which signer, and when. The seal's usage count and last-used date are counted from here.
**In the prototype today:** The `usageCount` and `lastUsedAt` fields on `CompanySeal` (incremented in `signDocumentSimulated` in `context/app-context.tsx`), plus a "Company Seal Applied" audit event.
**Main screens:** "Used N times · last on [date]" in the seal list (`components/agreements/company-seals.tsx`); "Company Seal Applied" on the audit page.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `company_seal_use_id` | uuid | pk | Identifies one use of a seal. | FR-SIGN-006 ("seal usage is logged") | Not shown. New for production. | uuid, the project-wide key type. |
| `company_seal_id` | uuid | fk → company_seal | The seal that was applied. | FR-SIGN-006; REQ-SGN-007 | Counted for "Used N times" in the seal list. | uuid because `company_seal.company_seal_id` is uuid. |
| `signature_request_id` | uuid | fk → signature_request | The request it was applied on. | FR-SIGN-006 ("stamps … onto agreement") | Not shown directly; the request's audit trail shows the matching event. | uuid because `signature_request.signature_request_id` is uuid. |
| `signer_id` | uuid | fk → signer | The signer who applied it (the person is found through `signer.user_id`). | FR-SIGN-006 ("user attribution") | Named in the "Company Seal Applied" audit event. | uuid because `signer.signer_id` is uuid. |
| `used_at` | timestamp | | When it was applied. | FR-SIGN-006 ("logged with timestamp") | "last on [date]" in the seal list (the latest `used_at`). Replaces `CompanySeal.lastUsedAt`. | timestamp: an exact moment. |

## Slice 7 — AI agents (Phase 2)

This slice is Phase 2. It covers three things: (1) connecting a person's own AI coding agent (Claude Code, Codex, Gemini CLI, Antigravity) to the platform over MCP with a personal token, what those agents do, and the organisation's rules for them; (2) the older "agent run" records (a provider runs on a task and a person approves the result); (3) the task proposals an AI makes from an SRS file, which a person reviews before any task is created.

In the prototype all of this is simulated in the browser (`context/app-context.tsx`, `lib/agent-connection.ts`, `lib/task-time.ts`, `lib/srs-analysis.ts`). There is no MCP server yet. The Hub opens at `app/(workspace)/ai-agents/how-it-works/page.tsx` (`app/(workspace)/ai-agents/page.tsx` redirects there); `ai-agents/activity` redirects to `projects/home` and `ai-agents/timesheet` redirects to `teams/timesheet`.

### `agent_access_token`

**What it stores:** A personal access token (`pmat_…`) that a person creates to connect their AI agent. Only a hash and the last four characters are kept; the full token is shown once.
**In the prototype today:** `AgentAccessToken` in `types/index.ts` (`agentTokens` in `context/app-context.tsx`). Its `usedBy` map moves to `agent_token_usage`.
**Main screens:** `app/(workspace)/ai-agents/tokens/page.tsx` (My Tokens); `components/agents/create-token-dialog.tsx`; token check in `app/(workspace)/ai-agents/connect/page.tsx`; all-tokens list for admins on `app/(workspace)/ai-agents/organisation/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_access_token_id` | uuid | pk | Identifies one token. Usage rows point to it. | FR-AGENT-002; SRS Entity 6 `id` | Not shown. Replaces `AgentAccessToken.id`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | The organisation the token works in. The server uses it to apply that organisation's agent policy and to keep the agent inside it. | Annex C INT-04 (enforce organisation scope server-side); DATA-01 | Not shown. New for production (the prototype has one organisation). | uuid because `organization.organization_id` is uuid. |
| `user_id` | uuid | fk → users | The token's owner. Every tool call acts as this person and only on their work. | FR-AGENT-002; Entity 6 `userId`; REQ-AI-043 | "Person" column on the Organisation page token list; My Tokens shows only your own. Replaces `AgentAccessToken.userId`. | uuid because `users.user_id` is uuid. |
| `name` | varchar | | A label the person gives the token, e.g. "Work laptop". | FR-AGENT-002 (empty name not allowed); Entity 6 `name` | First column on My Tokens and the Organisation list; name box in the create dialog; revoke confirmation. Replaces `AgentAccessToken.name`. | varchar: a short label. |
| `token_hash` | varchar | unique | SHA-256 hash of the token. The server hashes the incoming bearer token and looks it up here. The plain token is never stored. | NFR-SEC-003; REQ-AI-001; REQ-AI-002; Entity 6 `tokenHash` | Not shown in the UI. Not in the prototype (it keeps only the last four). | varchar: a SHA-256 hash is a fixed 64-character hex string. Unique so one token maps to one record. |
| `last_four` | varchar | | The last four characters, so the person can tell tokens apart without the full value. | NFR-SEC-003; REQ-AI-001; Entity 6 `lastFour` | Masked token `pmat_••••••••abcd` (`maskedToken` in `lib/agent-connection.ts`) on My Tokens and the Organisation list. Replaces `AgentAccessToken.lastFour`. | varchar: four characters. |
| `expires_at` | timestamp | | When the token stops working: 30, 90 (default) or 365 days after creation. | FR-AGENT-002; Entity 6 `expiresAt`; Annex B §4.2 (token expiry) | "Expires" column on My Tokens; expiry choice in the create dialog (`TOKEN_EXPIRY_OPTIONS` in `lib/agent-connection.ts`); status "Expired" via `tokenStatus`. Replaces `AgentAccessToken.expiresAt`. | timestamp: an exact moment, compared with "now" on every call. |
| `last_used_at` | timestamp | | When any agent last used the token. | Entity 6 `lastUsedAt`; REQ-AI-004 (show the token's last use) | "Last used" column on My Tokens and the Organisation list ("Never" if empty). Replaces `AgentAccessToken.lastUsedAt`. | timestamp: an exact moment. It equals the latest `agent_token_usage.last_used_at`, so it is stored twice; see Issues. |
| `revoked_at` | timestamp | | When the token was revoked. A revoked token is refused on the next call. | FR-AGENT-003; REQ-AI-005; Entity 6 `revokedAt` | "Revoked [date]" on My Tokens; Revoke buttons on My Tokens and the Organisation page. Replaces `AgentAccessToken.revokedAt`. | timestamp: records when; empty means not revoked. |
| `created_at` | timestamp | | When the token was created. | Entity 6 `createdAt` | "Created" column on My Tokens (newest first). Replaces `AgentAccessToken.createdAt`. | timestamp: an exact moment. |

### `agent_token_usage`

**What it stores:** For each token, which agent clients have used it and when each last did. Agents name themselves when they connect, so one token per computer can serve several agents.
**In the prototype today:** `AgentAccessToken.usedBy` (a map from `AgentClient` to a time) in `types/index.ts`, set by `markAgentTokenUsed` in `context/app-context.tsx`.
**Main screens:** "Agents used" badges on `app/(workspace)/ai-agents/tokens/page.tsx` and `app/(workspace)/ai-agents/organisation/page.tsx` (`components/agents/agent-badge.tsx`); "Check connection" and connected state on `app/(workspace)/ai-agents/connect/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_token_usage_id` | uuid | pk | Identifies one token-agent pair. | Entity 6 `usedBy`; schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `agent_access_token_id` | uuid | fk → agent_access_token | The token that was used. | Entity 6 `usedBy` | Not shown directly. | uuid because `agent_access_token.agent_access_token_id` is uuid. |
| `agent_client` | varchar | | Which agent used it: claude_code, codex, gemini_cli or antigravity (from the MCP initialize client info). | FR-AGENT-001; REQ-AI-003; REQ-AI-004 | Agent badges in the token lists; "connected" marks per app on the Connect page. Replaces a key of `AgentAccessToken.usedBy` (`AgentClient`). | varchar with a fixed list of allowed values, checked by the app, not a database enum, so a new agent client needs no schema change (Annex C INT-15). |
| `last_used_at` | timestamp | | When this agent last used this token. | REQ-AI-004 ("the token's last use and the agent that used it") | "Connected · last used …" on the Connect page. Replaces a value of `AgentAccessToken.usedBy`. | timestamp: an exact moment. |

**Rules:** `* unique (agent_access_token_id, agent_client)` — one row per token and agent, which is updated on each use. Without it every call would add a row and the "agents used" list would show duplicates.

### `agent_event`

**What it stores:** A log of what an AI agent did for a person: listed tasks, started, continued, paused, added a note, finished, logged time, or was auto-stopped. Rows are only added.
**In the prototype today:** `AgentEvent` in `types/index.ts` (`agentEvents`), built by `agentEvent` in `context/app-context.tsx` and by `applyAutoStops` in `lib/task-time.ts`.
**Main screens:** "My work today" card (`components/agents/my-work-card.tsx`) on `app/(workspace)/projects/home/page.tsx`; live demo feed on `app/(workspace)/ai-agents/how-it-works/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_event_id` | uuid | pk | Identifies one event. | FR-AGENT-007; REQ-AI-011 | Not shown. Replaces `AgentEvent.id`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | The organisation the event happened in, for admin views and separation. | Annex C DATA-01 | Not shown. New for production. | uuid because `organization.organization_id` is uuid. |
| `user_id` | uuid | fk → users | The person the agent worked for (the token owner). | FR-AGENT-007 ("attributable to the sponsoring developer"); REQ-AI-011 | The card and feed show only the current user's events. Replaces `AgentEvent.userId`. | uuid because `users.user_id` is uuid. |
| `task_id` | uuid | fk → task | The task the action was on. Empty for actions with no task (e.g. listed_tasks). | REQ-AI-011 (taskId/fileId) | Task key next to each event on the card; filter by task on the how-it-works page. Replaces `AgentEvent.taskId`. | uuid because `task.task_id` is uuid. |
| `agent` | varchar | | Which agent did it, or `system` for automatic actions such as an auto-stop. | FR-AGENT-007 (agent badges) | Agent badge (`components/agents/agent-badge.tsx`) on each event. Replaces `AgentEvent.agent`. | varchar with a fixed list (the four agent clients plus system), checked by the app, not a database enum. |
| `action` | varchar | | What was done: listed_tasks, started, continued, paused, note, finished, time_logged, auto_stopped. | FR-AGENT-007; FR-AGENT-005 (auto_stopped); FR-AGENT-006 | Action summary on the card and feed (listed_tasks is hidden on the card). Replaces `AgentEvent.action` (`AgentEventAction`). | varchar with a fixed list, checked by the app. Annex B §4.6 also logs a "blocked" event, which is not in this list; see Issues. |
| `detail` | text | | Extra text, e.g. the note the agent wrote or why a timer was stopped. | FR-AGENT-007; FR-AGENT-005 | Note text on the how-it-works page ("last note"); detail line on the card. Replaces `AgentEvent.detail`. | text: free text of any length. |
| `created_at` | timestamp | | When it happened. | FR-AGENT-007 ("chronological feed") | Order and time on the card and feed. Replaces `AgentEvent.at`. | timestamp: an exact moment. |

### `agent_setting`

**What it stores:** The organisation's rules for AI agents: on/off switch, idle timeout, end-of-day cutoff, and whether agents may pick up unassigned tasks. One row per organisation. The allowed agents and blocked projects are in the two tables after it.
**In the prototype today:** `AgentSettings` in `types/index.ts` (`agentSettings`, defaults `DEFAULT_AGENT_SETTINGS` in `context/app-context.tsx`).
**Main screens:** `app/(workspace)/ai-agents/organisation/page.tsx` (admin only); used by `lib/task-time.ts` (auto-stops), `app/(workspace)/ai-agents/connect/page.tsx` and `components/reports/task-time-report.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_setting_id` | uuid | pk | Identifies the settings record. | FR-AGENT-008 | Not shown. New id. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization; unique | The organisation the rules belong to. Unique: one set of rules per organisation. | FR-AGENT-008; Annex B §4.2 (organisation policy) | Not shown. | uuid because `organization.organization_id` is uuid. |
| `is_enabled` | boolean | | Master switch: when off, every agent request is refused. | FR-AGENT-008 (global AI switch); REQ-AI-003 | Top switch on the Organisation page; the Connect page shows agents as not allowed when off. Replaces `AgentSettings.enabled`. | boolean: yes/no. |
| `idle_timeout_minutes` | integer | | Minutes without activity after which a running timer is stopped and flagged for review (30, 60, 120 or 240). | FR-AGENT-005; Annex B §4.2 | Idle select on the Organisation page (`IDLE_OPTIONS`); explained on the Connect page and in `components/reports/task-time-report.tsx`; used by `applyAutoStops` in `lib/task-time.ts`. Replaces `AgentSettings.idleTimeoutMinutes`. | integer: a whole number of minutes. |
| `day_cutoff` | time | | Clock time (e.g. 20:00) at which any running timer is stopped for the day and flagged. | FR-AGENT-005; Annex B §4.2 | Time box on the Organisation page; text on the Connect page; used by `shiftEnd` in `lib/task-time.ts`. Replaces `AgentSettings.dayCutoff` (a "20:00" string). | time: a time of day with no date. It is read in the organisation's time zone (`organization.timezone`). |
| `allow_claim_unassigned` | boolean | | Whether agents may start tasks nobody is assigned to (otherwise only the owner's own tasks). | REQ-AI-043; Annex B §4.3 (`start_task`) | Switch on the Organisation page. Not enforced yet (no MCP server). Replaces `AgentSettings.allowClaimUnassigned`. | boolean: yes/no. |
| `updated_at` | timestamp | | When the rules were last changed. | Generic audit column | Not shown in the UI. New for production. | timestamp: an exact moment. |

### `agent_setting_allowed_agent`

**What it stores:** For each agent client, whether the organisation allows it. One row per organisation and agent.
**In the prototype today:** `AgentSettings.allowedAgents` (a map from `AgentClient` to yes/no) in `types/index.ts`.
**Main screens:** Agent switches on `app/(workspace)/ai-agents/organisation/page.tsx`; "not allowed" state on `app/(workspace)/ai-agents/connect/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_setting_allowed_agent_id` | uuid | pk | Identifies one row. | FR-AGENT-008; schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `agent_setting_id` | uuid | fk → agent_setting | The organisation's settings record. | FR-AGENT-008 | Not shown directly. | uuid because `agent_setting.agent_setting_id` is uuid. |
| `agent_client` | varchar | | The agent: claude_code, codex, gemini_cli or antigravity. | FR-AGENT-001; FR-AGENT-008 | Label of each switch on the Organisation page. Replaces a key of `AgentSettings.allowedAgents`. | varchar with a fixed list, checked by the app, not a database enum. |
| `is_allowed` | boolean | | Whether that agent may connect. The server refuses calls from an agent that is not allowed. | FR-AGENT-008; REQ-AI-003 | Switch state on the Organisation page; checked by `isAppAllowed` on the Connect page. Replaces a value of `AgentSettings.allowedAgents`. | boolean: yes/no. |

### `agent_blocked_project`

**What it stores:** Projects whose data must never be sent to AI agents (e.g. strict client confidentiality). A project being listed here means it is blocked.
**In the prototype today:** `AgentSettings.blockedProjectIds` in `types/index.ts`. Saved but not enforced anywhere (Annex B §4.6).
**Main screens:** Project tick list on `app/(workspace)/ai-agents/organisation/page.tsx` (ticked means shared with agents; unticked means blocked).

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_blocked_project_id` | uuid | pk | Identifies one blocked-project row. | FR-AGENT-008; schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `agent_setting_id` | uuid | fk → agent_setting | The organisation's settings record. | FR-AGENT-008 | Not shown directly. | uuid because `agent_setting.agent_setting_id` is uuid. |
| `project_id` | uuid | fk → project | The blocked project. Tools refuse it with PROJECT_BLOCKED and list tools leave it out. | FR-AGENT-008; REQ-AI-040, REQ-AI-041, REQ-AI-042, REQ-AI-044 | Unticked project on the Organisation page. Replaces one entry of `AgentSettings.blockedProjectIds`. | uuid because `project.project_id` is uuid. |

**Rules:** `* unique (agent_setting_id, project_id)` — a project is blocked at most once; a second row would add nothing and unblocking would leave a copy behind.

### `agent_provider`

**What it stores:** An AI model configuration the organisation can run on tasks (provider, model, whether set up and turned on). This belongs to the older "agent runs" design.
**In the prototype today:** `AgentProvider` in `types/index.ts`. No provider list exists in the mock data or state; only `AgentRun.agentProviderId` values (`ap1`, `ap3`) in `data/mock-data.ts` refer to one.
**Main screens:** Not shown in the UI.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_provider_id` | uuid | pk | Identifies one provider configuration. Agent runs point to it. | Annex C AI-01 (record exact provider and model for every run); INT-06 | Not shown in the UI. Replaces `AgentProvider.id`. | uuid, the project-wide key type. |
| `organization_id` | uuid | fk → organization | The organisation that owns the configuration. | Annex C AI-10 (organisation model allowlists); DATA-01 | Not shown in the UI. New for production. | uuid because `organization.organization_id` is uuid. |
| `name` | varchar | | A display name for the configuration. | Annex C AI-01 | Not shown in the UI. Replaces `AgentProvider.name`. | varchar: a short name. |
| `provider` | varchar | | Which vendor: claude, codex or gemini. | Annex C AI-01 (Claude, OpenAI, Gemini) | Not shown in the UI. Replaces `AgentProvider.provider` (`AgentProviderType`). | varchar with a fixed list, checked by the app, not a database enum. |
| `model` | varchar | | The exact model name used. | Annex C AI-01; INT-06 | Not shown in the UI. Replaces `AgentProvider.model`. | varchar: a short model identifier. |
| `is_configured` | boolean | | Whether the credentials are set up (the secret itself is kept server-side elsewhere, never here). | Annex C AI-11 | Not shown in the UI. Replaces `AgentProvider.isConfigured`. | boolean: yes/no. |
| `is_enabled` | boolean | | Whether the configuration may be used. | Annex C AI-10 | Not shown in the UI. Replaces `AgentProvider.isEnabled`. | boolean: yes/no. |
| `color` | varchar | | The colour used for this provider's badge. | No SRS requirement; prototype type only | Not shown in the UI. Replaces `AgentProvider.color`. | varchar: a short colour code. |

### `agent_provider_scope`

**What it stores:** The list of things a provider configuration is allowed to do (its scopes). One row per scope.
**In the prototype today:** `AgentProvider.scope` (a string array) in `types/index.ts`.
**Main screens:** Not shown in the UI.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_provider_scope_id` | uuid | pk | Identifies one scope row. | Schema rule "lists are their own tables" | Not shown in the UI. New for production. | uuid, the project-wide key type. |
| `agent_provider_id` | uuid | fk → agent_provider | The provider configuration. | Annex C INT-01 (permitted actions) | Not shown in the UI. | uuid because `agent_provider.agent_provider_id` is uuid. |
| `scope` | varchar | | One permitted action or area, e.g. "code" or "review". | Annex C INT-01, INT-03 (separately scoped tools) | Not shown in the UI. Replaces one entry of `AgentProvider.scope`. | varchar: a short code. No list of allowed values is defined anywhere; see Issues. |

### `agent_run`

**What it stores:** One run of an AI provider on a task: who started it, its status, output, token use and cost, and who approved the result.
**In the prototype today:** `AgentRun` in `types/index.ts` (`agentRuns`, mock data `MOCK_AGENT_RUNS` in `data/mock-data.ts`; `addAgentRun` and `updateAgentRun` in `context/app-context.tsx`).
**Main screens:** `app/(workspace)/ai-agents/runs/[runId]/page.tsx`. No screen links to it any more (the earlier runs list was replaced, see `app/(workspace)/ai-agents/page.tsx`); it opens only by URL.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_run_id` | uuid | pk | Identifies one run. Its events and checks point to it. | Annex C INT-06 (register runs); REP-03 | In the URL `ai-agents/runs/[runId]`. Replaces `AgentRun.id`. | uuid, the project-wide key type. |
| `task_id` | uuid | fk → task | The task the run worked on. | Annex C INT-06 (work item) | Task title and key on the run page. Replaces `AgentRun.taskId`. | uuid because `task.task_id` is uuid. |
| `agent_provider_id` | uuid | fk → agent_provider | Which provider configuration ran. | Annex C AI-01; INT-06 | Not shown on the run page. Replaces `AgentRun.agentProviderId`. | uuid because `agent_provider.agent_provider_id` is uuid. |
| `triggered_by_user_id` | uuid | fk → users | The person who started the run. | Annex C INT-06 (delegated user) | "Triggered by [name]" on the run page. Replaces `AgentRun.triggeredBy`. | uuid because `users.user_id` is uuid. |
| `approved_by_user_id` | uuid | fk → users | The person who approved the result. Approval is allowed only when all checks passed. | Annex C INT-07 (run success is separate from Done); INT-11 | "Approved by [name]" or the Approve button on the run page. Replaces `AgentRun.approvedBy`. | uuid because `users.user_id` is uuid. |
| `status` | varchar | | queued, running, completed, failed or needs_review. | Annex C INT-07; AI-09 | `AgentRunStatusBadge` (`components/shared/badges.tsx`) on the run page; "Running…" line. Replaces `AgentRun.status` (`AgentRunStatus`). | varchar with a fixed list, checked by the app, not a database enum. INT-07 lists more states (blocked, cancelled …), which can be added with no schema change. |
| `output` | text | | The agent's final summary. | Annex C INT-06 | "Agent Output" card on the run page. Replaces `AgentRun.output`. | text: free text of any length. |
| `tokens_used` | integer | | How many model tokens the run used. | Annex C AI-10 (token limits, measured usage) | "Tokens Used" on the run page. Replaces `AgentRun.tokensUsed`. | integer: a whole count. |
| `cost_estimate` | decimal | | Estimated cost of the run in money. | Annex C AI-10 (spending budgets; estimated vs measured usage) | "Cost Estimate" (e.g. $0.55) on the run page. Replaces `AgentRun.costEstimate`. | decimal: money must be exact; a floating-point number would add rounding errors when costs are summed. |
| `started_at` | timestamp | | When the run started. | Annex C INT-06; REP-03 (duration) | Start time and "Started" on the run page. Replaces `AgentRun.startedAt`. | timestamp: an exact moment. |
| `completed_at` | timestamp | | When the run ended. | Annex C REP-03 (duration) | "Completed" (or "In progress") on the run page. Replaces `AgentRun.completedAt`. | timestamp: an exact moment. |
| `approved_at` | timestamp | | When the result was approved. | Annex C INT-07 | Set by the Approve button on the run page. Replaces `AgentRun.approvedAt`. | timestamp: an exact moment. |

### `agent_run_event`

**What it stores:** The step-by-step log of one run (info, success, warning, error, code lines).
**In the prototype today:** `AgentRunEvent` in `types/index.ts` (in `AgentRun.events`; it has no id).
**Main screens:** "Agent Execution Log" on `app/(workspace)/ai-agents/runs/[runId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_run_event_id` | uuid | pk | Identifies one log line. | Annex C INT-06 | Not shown. New id (prototype uses array position). | uuid, the project-wide key type. |
| `agent_run_id` | uuid | fk → agent_run | The run it belongs to. | Annex C INT-06 | Not shown directly. Replaces the nesting in `AgentRun.events`. | uuid because `agent_run.agent_run_id` is uuid. |
| `type` | varchar | | The kind of line: info, success, warning, error or code. Sets its icon and colour. | No SRS requirement; prototype type `AgentRunEvent.type` | Icon and colour of each log line on the run page. Replaces `AgentRunEvent.type`. | varchar with a fixed list, checked by the app, not a database enum. |
| `message` | text | | The main text of the line. | Annex C INT-06 | Log line text on the run page. Replaces `AgentRunEvent.message`. | text: free text. |
| `detail` | text | | Extra detail under the line. | Annex C INT-06 | Smaller text under the line on the run page. Replaces `AgentRunEvent.detail`. | text: free text. |
| `created_at` | timestamp | | When the line was written. | Annex C DATA-04 | Relative time on each log line. Replaces `AgentRunEvent.timestamp`. | timestamp: an exact moment. |

### `agent_run_check`

**What it stores:** The checks a run must pass before it can be approved (e.g. "Unit tests passing", "No secrets in diff").
**In the prototype today:** `VerificationCheck` in `types/index.ts` (in `AgentRun.verificationChecks`).
**Main screens:** "Verification Checks" card on `app/(workspace)/ai-agents/runs/[runId]/page.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `agent_run_check_id` | uuid | pk | Identifies one check. | Annex C INT-11 | Not shown. Replaces `VerificationCheck.id`. | uuid, the project-wide key type. |
| `agent_run_id` | uuid | fk → agent_run | The run being checked. | Annex C INT-11 | Not shown directly. Replaces the nesting in `AgentRun.verificationChecks`. | uuid because `agent_run.agent_run_id` is uuid. |
| `label` | varchar | | What is checked. | Annex C INT-11 (verify delivery facts against a trusted source) | Check name on the run page. Replaces `VerificationCheck.label`. | varchar: a short label. |
| `status` | varchar | | pending, passed or failed. Approval needs every check passed. | Annex C INT-11 | Check icon and the "can approve" rule on the run page. Replaces `VerificationCheck.status`. | varchar with a fixed list, checked by the app, not a database enum. |
| `detail` | text | | Extra detail, e.g. why it failed. | Annex C INT-11 | Under the check on the run page. Replaces `VerificationCheck.detail`. | text: free text. |

### `srs_task_candidate`

**What it stores:** One task the AI proposed from an SRS file, with what the AI proposed (`original_*`), what the reviewer changed it to, and the review outcome (accepted with the created task, or rejected with a reason). Nothing becomes a task without a person accepting it.
**In the prototype today:** `SrsGeneratedTaskRecord` in `types/index.ts` (`srsTaskHistories` keyed by file id, saved by `saveSrsTaskHistory` in `context/app-context.tsx`); proposals built by `lib/srs-analysis.ts`. `isEdited` is not stored any more: a candidate is edited when its values differ from the `original_*` values.
**Main screens:** `app/(workspace)/projects/[projectId]/files/page.tsx`; analysis start `components/projects/srs-action-modal.tsx`; review before creating tasks `components/projects/generated-tasks-review-modal.tsx`; review history `components/projects/srs-generated-tasks-modal.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `srs_task_candidate_id` | uuid | pk | Identifies one proposal. | FR-SRS-002; REQ-AI-035 (one history entry per proposal) | Not shown. Replaces `SrsGeneratedTaskRecord.id` (and `originalId`). | uuid, the project-wide key type. |
| `project_file_id` | uuid | fk → project_file (the analysed SRS) | The SRS file the proposal came from; the project is reached through it. | FR-SRS-001, FR-SRS-002; REQ-AI-023 | Review history is opened per file on the Files page. Replaces `SrsGeneratedTaskRecord.fileId` (and the copied `fileName`, `projectId`, `projectName`). | uuid because `project_file.project_file_id` is uuid. |
| `created_task_id` | uuid | fk → task; set when accepted | The task created from this proposal, for traceability both ways. | FR-SRS-006; REQ-AI-035 | Task key and live task status in `components/projects/srs-generated-tasks-modal.tsx`. Replaces `SrsGeneratedTaskRecord.projectTaskId` (and `projectTaskKey`, read from the task). | uuid because `task.task_id` is uuid. Empty for rejected proposals. |
| `reviewed_by_user_id` | uuid | fk → users | The person who accepted or rejected it. | REQ-AI-030; REQ-AI-036 (who may commit) | Not shown in the UI. New for production. | uuid because `users.user_id` is uuid. |
| `title` | varchar | | The task title after review (what the task gets). | FR-SRS-004; Annex B §4.4 (5–120 characters) | Card title in both modals; edit box in the review modal. Replaces `SrsGeneratedTaskRecord.title`. | varchar: one short line. |
| `original_title` | varchar | | The title as the AI proposed it, kept to show what the reviewer changed. | FR-SRS-004 (`originalTitle`) | "Original" note on edited cards in `components/projects/srs-generated-tasks-modal.tsx`. Replaces `SrsGeneratedTaskRecord.originalTitle`. | varchar: one short line. |
| `description` | text | | The task description after review. | FR-SRS-004; Annex B §4.4 (up to 4,000 characters) | Card text; edit box. Replaces `SrsGeneratedTaskRecord.description`. | text: can be long. |
| `original_description` | text | | The AI's description. | FR-SRS-004 | Shown when edited. Replaces `SrsGeneratedTaskRecord.originalDescription`. | text: can be long. |
| `acceptance_criteria` | text | | The acceptance criteria after review; copied to the task. | FR-SRS-002, FR-SRS-004, FR-SRS-006 | Criteria block on the cards; edit box. Replaces `SrsGeneratedTaskRecord.acceptanceCriteria`. | text, the same as `task.acceptance_criteria`. Annex B §4.4 defines it as a list of 1–10 items, so the items would be stored as lines in one text value. |
| `original_acceptance_criteria` | text | | The AI's acceptance criteria. | FR-SRS-004 | Shown when edited. Replaces `SrsGeneratedTaskRecord.originalAcceptanceCriteria`. | text. |
| `priority` | varchar | | Priority after review: low, medium, high or critical. | FR-SRS-002, FR-SRS-004; REQ-AI-032 | Priority badge and select in the review modal. Replaces `SrsGeneratedTaskRecord.priority`. | varchar with the same fixed list as `task.priority`, checked by the app. |
| `original_priority` | varchar | | The AI's priority. | FR-SRS-004 | Used to tell whether the card was edited. Replaces `SrsGeneratedTaskRecord.originalPriority`. | varchar, same list. |
| `type` | varchar | | Task type after review: story, bug, task, epic or subtask. | FR-SRS-004; REQ-AI-032 | Type select in the review modal. Replaces `SrsGeneratedTaskRecord.type`. | varchar with the same fixed list as `task.type`, checked by the app. |
| `original_type` | varchar | | The AI's type. | FR-SRS-004 | Used to tell whether the card was edited. Replaces `SrsGeneratedTaskRecord.originalType`. | varchar, same list. |
| `source_section` | varchar | | The SRS heading or requirement ID the proposal came from. Required: a proposal without one is rejected. Copied to the task. | FR-SRS-002; FR-SRS-006; REQ-AI-023; Annex C AI-05 | "Source: …" on the cards; searchable in the history modal. Replaces `SrsGeneratedTaskRecord.sourceSection`. | varchar: a short reference such as "FR-SIGN-004". |
| `story_points` | integer | | Suggested size (1, 2, 3, 5, 8 or 13). | FR-SRS-002; Annex B §4.4 (`points`) | Points on the review cards. Replaces `SrsGeneratedTaskRecord.points`. | integer: a whole number. |
| `outcome` | varchar | | The review decision: accepted or rejected. Rejected proposals never become tasks. | FR-SRS-003, FR-SRS-005; REQ-AI-030 | All / Accepted / Edited / Rejected tabs and badges in `components/projects/srs-generated-tasks-modal.tsx`. Replaces `SrsGeneratedTaskRecord.outcome` (`SrsReviewOutcome`). | varchar with a fixed list, checked by the app, not a database enum. There is no value for "not reviewed yet"; see Issues. |
| `rejection_reason` | text | | Optional reason for rejecting. | FR-SRS-005; REQ-AI-032 | Shown on rejected cards ("Excluded during SRS analysis review…" when empty). Replaces `SrsGeneratedTaskRecord.rejectionReason`. | text: free sentence. |
| `created_at` | timestamp | | When the AI proposed it. | FR-SRS-002 | Not shown in the UI. Replaces `SrsGeneratedTaskRecord.createdAt`. | timestamp: an exact moment. |
| `reviewed_at` | timestamp | | When the reviewer committed the decision. | FR-SRS-006 | Not shown in the UI; set on commit in `app/(workspace)/projects/[projectId]/files/page.tsx`. Replaces `SrsGeneratedTaskRecord.reviewedAt`. | timestamp: an exact moment. |

### `srs_task_candidate_tag`

**What it stores:** The tags the AI suggested for a proposal. One row per tag.
**In the prototype today:** `SrsGeneratedTaskRecord.tags` (a string array) in `types/index.ts`, filled by `lib/srs-analysis.ts`.
**Main screens:** Tag chips in `components/projects/generated-tasks-review-modal.tsx`; tag search in `components/projects/srs-generated-tasks-modal.tsx`.

| Column | Type | Key | Why it's there | Requirement source | Where it shows in the frontend | Why this data type |
|---|---|---|---|---|---|---|
| `srs_task_candidate_tag_id` | uuid | pk | Identifies one tag row. | Schema rule "lists are their own tables" | Not shown. New for production. | uuid, the project-wide key type. |
| `srs_task_candidate_id` | uuid | fk → srs_task_candidate | The proposal the tag belongs to. | FR-SRS-002 ("priority tags") | Not shown directly. | uuid because `srs_task_candidate.srs_task_candidate_id` is uuid. |
| `tag` | varchar | | The tag text, e.g. "security". | FR-SRS-002 | Tag chips on the review cards; history search. Replaces one entry of `SrsGeneratedTaskRecord.tags`. | varchar: a short word. |

#### Issues found in slices 6–7

- **Type mismatch with `stored_file`:** `stored_file.stored_file_id` is now `bigserial`, but `signature_request_file.stored_file_id`, `signer.signature_file_id`, `saved_signature.signature_file_id`, `saved_signature.initials_file_id` and `company_seal.image_file_id` are still `uuid`. A foreign key must have the same type as the key it points to, so these should be `bigint`. Slice 1 uses `int` for the same kind of link (`organization.logo_file_id`, `users.avatar_file_id`), which is also too small for a `bigserial`. The schema header also still says "Every table has its own uuid primary key", which `stored_file` no longer follows.
- **`signer` has no place for the initials image:** there is `signature_file_id` but no `initials_file_id`, while a signer adopts both a signature and initials (FR-SIGN-005, Annex B §2.6). Today the images end up in `signature_field.value` as data URLs. Production should store both images in `stored_file` and not put image data in `signature_field.value`.
- **`signer.role` is free text, but SRS Entity 8 defines it as an enum** (`needs_to_sign`, or `in_person_signer` if DEC-10 is approved). The prototype only ever writes "Signer" / "Signer (you)". Decide whether it is a label or a role code.
- **No uniqueness on recipient email within a request:** Entity 11 and FR-SIGN-001 say one email may appear only once across a request's signers and reviewers. The schema has no rule for this, and it cannot be one simple unique key because the emails are in two tables. The app or a trigger has to check it.
- **`signature_request` has no `updated_at`:** the Drafts page sorts by and shows the draft's "saved" time (`PdfRequestDraft.savedAt`). Without `updated_at` this is lost.
- **`signature_request` has no subject column:** FR-SIGN-001 asks for a Subject pre-filled from `signing_default.email_subject`, but there is nowhere to store a request's subject (the prototype uses the title). So `signing_default.email_subject` has no use yet.
- **No column for the final signed PDF or its hash:** REQ-AGR-061 asks the server to store the final PDF read-only with its SHA-256. `signature_request` has no `signed_file_id` (→ stored_file).
- **Audit evidence gaps in `signature_request_event`:** no `user_agent` or consent time (REQ-SGN-008, REQ-AGR-064), and no previous-event hash for the hash chain (REQ-AGR-063).
- **`outbound_email` has no delivery or bounce status** (REQ-AGR-071), and no `copy_recipient_id`, so copy emails cannot be linked back to the copy recipient.
- **Duplicate or derivable values:** `signing_token.expires_at` copies `signature_request.expires_at` (BR-10 says they are always equal); `agent_access_token.last_used_at` equals the latest `agent_token_usage.last_used_at`; `signature_field.signature_request_id` can be reached through `signature_request_file_id`. This goes against the header rule "nothing is stored twice". Either drop them, or keep them on purpose and write down why.
- **`signature_request.document_id` and `signature_request_file.document_id` overlap:** both link to the library document. The request-level one is only needed by the old text flow; once that flow is retired (GAP-16), keep only one.
- **`signature_request_file.sample_id` is demo-only:** built-in sample PDFs do not exist in production. Consider leaving it out of the production schema.
- **`expires_at` precision:** the prototype stores only a date and treats it as 23:59:59 local time (REQ-AGR-033). Production must turn that into a timestamp in the organisation's time zone.
- **SRS conflict on field coordinates:** SRS Section 7.2 says coordinates are normalised between 0.0 and 1.0, while Entity 9, Annex B §2.3 and the schema use 0–100 percentages. The SRS should be corrected to 0–100.
- **Missing unique rules on child lists:** `signing_default_method` (signing_default_id, method), `agent_setting_allowed_agent` (agent_setting_id, agent_client), `agent_provider_scope` (agent_provider_id, scope), `signature_request_file` (signature_request_id, sort_order) and `signature_field_option` (signature_field_id, sort_order) have no unique rules, so duplicates are possible.
- **`company_seal` delete versus history:** the prototype deletes seals for good (`deleteCompanySeal`), which would break `company_seal_use` rows. Production should only turn seals off (`is_active`) or block the delete while uses exist. Seals are also applied only in the old text flow (`signDocumentSimulated`); the PDF signing view has no seal picker (REQ-SGN-007 "Built (text flow)").
- **`agent_event.action` list is missing `blocked`:** Annex B §4.6 logs an agent event when a blocked project is refused. There is also no `project_file_id` for SRS tool calls (REQ-AI-011 says taskId/fileId) and no `agent_access_token_id` to show which token was used.
- **`agent_setting` has no `allow_server_ai_on_blocked`** flag (REQ-AI-042), and no column records who revoked a token (REQ-AI-005 lets an admin revoke anyone's).
- **`agent_provider` / `agent_provider_scope` / `agent_run` / `agent_run_event` / `agent_run_check` have no live screens:** there is no provider list in the prototype, and `app/(workspace)/ai-agents/runs/[runId]/page.tsx` is not linked from anywhere. `agent_provider_scope.scope` has no defined list of values. `agent_run_check` has no `sort_order`, so check order is lost. Confirm whether this older "agent runs" design is still in Phase 2 scope before building it.
- **`srs_task_candidate.outcome` has no "not reviewed" value:** Annex B §4.4 stores proposals as `proposed` before anyone reviews them, but `outcome` only allows accepted / rejected (an empty value would have to mean "proposed"). There is also no link to an analysis run or file version (REQ-AI-024, REQ-AI-035 "each analysis run adds a history entry"), no provider or model record (Annex C AI-01, INT-06), and no `source_page` (Annex B §4.4).
