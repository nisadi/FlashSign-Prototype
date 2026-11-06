# FlashSign schema: changes and why

This lists everything that changed in [`schema.txt`](schema.txt) and where each change came from:
- the new onboarding flow,
- SRS v4.0 (`New folder/FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx`),
- the prototype frontend (`flash-sign-proto/src`).

The schema itself contains only tables and rules; reasons and follow-ups are here.

`schema.txt` is now one continuous list of **100 tables** with no slices: 11 global (platform and per-person) and 89 tenant tables.

**Update (5 Nov 2026, after frontend commit `6a1cc6b`):** the access model in §1 and §8 now follows the frontend as built (`flash-sign-proto/src/lib/rbac.ts`).
- **Removed:** the earlier permission-key design (`permission`, `role_permission`, `role_template_permission`, `org_member_role`, `owner_grant`).
- **Instead:** a role holds four settings, each member has one role, and the Super Admin sends `organization_invitation` rows.
- **SRS edits:** in `New folder/SRS fix instructions - round 3 (access control).md`.

---

## 1. Onboarding and access model

Flow (as built in the frontend): **Super Admin creates or invites an organisation → the Owner accepts and sets it up → the Owner (or a Team Management role) edits and creates roles → invites members with a role and assigned projects.**

### New tables

| Table | What it does |
|---|---|
| `platform_admin` | The Super Admins who use the Super Admin Dashboard (`/super-admin`). Global. |
| `organization_invitation` | A Super Admin's invitation for an Owner, with organisation name, Owner name and email, plan, note, a 7-day link and status pending / accepted / expired. Linked to the organisation when the Super Admin created it first, or once the Owner accepts. Global. |
| `platform_activity_log` | Super Admin actions and sign-in events (outside any one organisation). Global, append-only. |
| `support_access_grant` | A Super Admin can see a tenant's content only through a grant the Owner approves (SRS Annex C §4). |
| `organization_feature` | Per-organisation feature switches (teams, contracts …), replacing hard-coded `FEATURES` in `lib/features.ts`. |
| `role_template` | The platform's five default roles with their settings, copied into every new organisation. Global. |
| `invitation_project` | The projects a member invitation assigns (for Project User Access roles); copied to `project_member` on acceptance. |
| `department` | Organisation's own departments; used by members, invitations, teams and announcement audiences. |

### Changed tables

| Table | Change |
|---|---|
| `role` | **Now per organisation.** Columns: `name`, `description`, `is_system`, `admin_dashboard`, `my_status`, `project_access` (management / user), `my_tasks_access`, `team_access` (management / member), `role_template_id`. The default dashboard is calculated (Admin Dashboard if allowed, else My Status). Unique name per organisation. |
| `organization` | `owner_user_id` may be empty until the Owner accepts. Added `created_by_user_id`, `status` (active / pending / inactive, set by the Super Admin), `deleted_at`, `company_size` (the frontend's six sizes). |
| `org_member` | Has one `role_id`. `is_active` became `status` (active / suspended / removed). `department` became `department_id`. `working_hours` became `working_hours_start` / `working_hours_end`. |
| `project_member` | These rows are the **assigned projects** for Project User Access. Added `assigned_by_user_id`. |
| `invitation` | `role_id` points to the organisation's own roles. Added `department_id`, `sent_at`, and a unique rule for one pending invite per email per organisation. |
| `session` | `active_organization_id` may be empty (a Super Admin, or an Owner before setup). |
| `users` | `is_active` now means account-wide. Super Admin = a `platform_admin` row; Owner = `organization.owner_user_id`. |
| `outbound_email` | `organization_id` may be empty for platform emails (organisation invitation, verification code, password reset). |

### How the frontend maps onto the schema

| Frontend (`lib/rbac.ts`) | Schema |
|---|---|
| `isSuperAdmin` | a `platform_admin` row |
| `isOwner` | `organization.owner_user_id` |
| `roleId`, `roleName` | `org_member.role_id` → `role.name` |
| `dashboardAccess.adminDashboard` / `.myStatus` | `role.admin_dashboard` / `role.my_status` |
| `dashboardAccess.defaultDashboard` | calculated: `admin` if `admin_dashboard`, else `my-status` |
| `projectAccess`, `myTasksAccess`, `teamAccess` | `role.project_access`, `role.my_tasks_access`, `role.team_access` |
| `assignedProjectIds` | `project_member` rows |
| `CustomRole.isSystem` | `role.is_system` |
| `SuperAdminOrg` | `organization` (+ counts calculated, Owner from `owner_user_id` or the pending `organization_invitation`) |
| `SuperAdminOrgInvitation` | `organization_invitation` |
| `DemoInvitation` + chosen role and projects | `invitation` + `invitation_project` |

The SRS and frontend follow-ups for this model are in `New folder/SRS fix instructions - round 3 (access control).md`.
- The frontend gaps (invitations not saving the role and projects; Super Admin organisations not linked to workspaces; etc.) are listed there as G-01 to G-08.

---

## 2. Changes from SRS v4.0

| Area | Change in schema | SRS source |
|---|---|---|
| Teams | Added `team`, `team_member`, `team_goal` (three tables already pointed to a missing `team`). | FR-TEAM-001, ORG-02 |
| Files | `stored_file.mime_type`, `scan_status`, `scanned_at`. | B.5 §6.6 StoredFile, NFR-027, DATA-08 |
| Boards | `board.mirrors_main_board`; `task.board_id` (a card's board can't always be found from its column). | B.2 §3.3, Entity 4 |
| Baselines | `baseline_change` now stores `old_*` and `new_*` start and end dates. | FR-PLAN-002, B.5 §6.6 |
| Tasks | `task.rank` (card order and backlog rank), `project.next_task_number` and `task.next_subtask_number` (keys never reused), new `task_link` (dependencies). | §3.3, REQ-TSK-007, DATA-02, FR-PLAN-001, WI-07 |
| Task history | `task_status_change.from_board_column_id` / `to_board_column_id`. | FR-TASK-008 |
| Comments | `task_comment.via`. | B.3 §4.3, B.5 §6.6, FR-AGENT-007 |
| Work sessions | `logged_by_user_id`, `reviewed_by_user_id`, `reviewed_at`, `board_id`; rules: one running session per person, no overlapping sessions. | REQ-TSK-020/025/026/027, FR-PROJ-005 |
| Sprints | New `sprint_task` (scope history); `sprint.capacity_unit`, `started_at`, `completed_at`, `updated_at`; one active sprint per project. | B.2 §3.5 burndown, FR-PLAN-003, REQ-PRJ-010 |
| Time off | `time_off_request.decision_note`, `updated_at`. | FR-TEAM-003 |
| Activity log | `project_id`, `category`, `user_agent`, `prev_hash` / `hash`; append-only. | FR-PROJ-002, FR-TEAM-006, FR-REP-006, §1.3 |
| Users | `timezone`, `avatar_color`, `anonymized_at`. | FR-TEAM-002, NFR-032, Entity 1, NFR-PRIV-003 |
| Organisation | `deleted_at`, `company_size`. | NFR-INT-003, FR-AUTH-003 |
| Documents | `document.document_template_id`; `superseded` status; `document_version.content_sha256`; `document_approval.document_version_id`. | FR-DOC-003, DOC-06/07 |
| Contracts | `software_license` and other types added; `currency`. | FR-DOC-004 |
| Signature request | `email_subject`, `expire_days`, `signed_file_id`, `certificate_file_id`, `project_id`, `phase_id`, `cancelled_at`, `cancelled_by_user_id`, `retain_until`, `legal_hold`, `purged_at`, `updated_at`. | FR-SIGN-001/014, REQ-AGR-061/064/066, DEC-11/19, §1.3 |
| Signing evidence | New `signature_evidence` (PAdES signature, TSA timestamp, certificate). | REQ-AGR-062, FR-SIGN-013 |
| Signer | `initials_file_id`, `signature_method`, `auth_method`, `consent_text_version`, `consented_at`, `signed_ip`, `signed_user_agent`, `recipient_type`; `role` renamed `role_label`. | FR-SIGN-005/013, REQ-SGN-004/008, NFR-024, Entity 8 |
| Fields | Field type `seal`; `value_file_id` (images no longer stored as data URLs in `value`). | UC-05, NFR-SCALE-003 |
| Audit events | `signature_request_event.user_agent`, `prev_hash`, `hash`; append-only. | REQ-AGR-063, NFR-023 |
| Emails | `outbound_email.status`, `provider_message_id`, `error`, `delivered_at`, `bounced_at`, `created_at`, `copy_recipient_id`, `user_id`; more `kind` values incl. `expiry_warning`; used for all mail, not only signing. | REQ-AGR-071, REQ-TSK-008, GAP-07 |
| Reviewers | `reviewer.review_order`. | DEC-21(a) |
| Seals | `company_seal_use.signature_field_id`; `company_seal.updated_at`; seals are switched off, never deleted. | UC-05, FR-SETT-003 |
| SRS analysis | New `srs_analysis_run`; `project_file.analysis_status` full list, `extracted_text`, `word_count`. On `srs_task_candidate`: `decision` (proposed / accepted / edited / rejected), `source_page`, `suggested_parent`, `original_story_points`; now links to the run. | B.3 §4.4, B.5 §6.6, REQ-AI-020/024/036, FR-SRS-004 |
| Agents | `agent_event.agent_access_token_id`, `project_file_id`, `outcome`, `error_code`, all MCP tool actions plus `blocked`; `agent_setting.allow_server_ai_on_blocked`, `allow_llm_processing`; `agent_access_token.revoked_by_user_id`. | NFR-OBS-003, B.3 §4.3/4.6, REQ-AI-005/011/042, NFR-028 |

## 3. Changes from the frontend

| Change in schema | Frontend source |
|---|---|
| `users.company` | `settings/profile/page.tsx:40,73`, fills the "company" signature field |
| `organization.company_size` | `onboarding/create-organization/page.tsx:98` |
| `project.template`, `project.visibility` (today pushed into tags) | `projects/new/page.tsx:218` |
| `notification_event` lookup; `user_notification_setting` points to it | `settings/notifications/page.tsx:13-41`, `DemoPreferences` |
| `notification.type`: added `signature`, `meeting`, `time_off`, `announcement` | notification events above |
| `announcement_department` (audience = departments, not a fixed list) | `types/collaboration.ts:81` |
| `contract.contract_type`: full list; `renewal_type` mapped | `types/documents.ts:104-122`, `contracts/new/page.tsx` |
| `document.share_scope` (private / organization) | `documents/shared/page.tsx:29,42`, `DocumentItem.isShared` |
| `document_template_placeholder.label`, `sort_order` | `template-preview-dialog.tsx` |
| `copy_recipient.sort_order` | draft recipient order in `signatures/upload` |
| `meeting.start_at` / `end_at` timestamps (two time formats in the UI today) | `planner/meetings/new/page.tsx`, `create-meeting-dialog.tsx` |
| `updated_at` on `calendar_event`, `meeting`, `announcement`, `document_comment`, `signature_request`, `company_seal`, `sprint`, `integration` | all have edit actions in `context/app-context.tsx` |

## 4. Errors in the previous schema that are fixed

1. **`team` was missing** although three tables pointed to it. It is added.
2. **`stored_file_id` types didn't match.** It was `bigserial`, while links to it were `int` and `uuid`. Now uuid everywhere.
3. **`org_member.is_active` was a boolean** whose note listed three states. It is now `status`.
4. **Missing unique rules are added:**
   - one main board per project
   - one active sprint per project
   - one running work session per person
   - one pending invitation per email per organisation
   - no duplicate tags, skills, placeholders, field options, methods, allowed agents or provider scopes
   - `signature_request_file` sort order
5. **`task.effort_minutes`** was described as "hours". It now says minutes.
6. **Subtasks' plan links** were undefined. All three are now empty on subtasks (they follow their parent).
7. **Backlog** was defined as "no column". It now means "no phase / epic / story link", as in the prototype; the card keeps its board and column.

## 5. Removed

| Removed | Why |
|---|---|
| `project.due_date`, `phase.due_date` | Same as `end_date`. |
| `project.status = archived` | `archived_at` already says it. |
| `project.health` in auto mode | Calculated; only stored in manual mode now. |
| `project.icon`, `project.category` | Not read anywhere in the UI or the SRS. |
| `phase.status`, `phase.estimated_duration` | Status is calculated from dates and tasks (FR-PLAN-005); duration comes from the dates. |
| `task.type` values `epic`, `subtask` | Epics are their own table; a subtask is a task with a parent. |
| `calendar_event` categories `task_deadline`, `milestone`, `meeting`, `time_off` and `task_id`, `phase_id` | The calendar reads those from their own tables instead of keeping copies. |
| `contract.status` values `expiring`, `expired` | Calculated from `expiry_date`. |
| `document.is_editable` | A document with a PDF is read-only. |
| `project_file.task_id`, `uploaded_by_user_id`, `file_type` | `task_attachment` links files to tasks; uploader and type come from `stored_file`. |
| `task_attachment.uploaded_by_user_id` | In `stored_file`. |
| `signature_request.document_id` | Kept only on `signature_request_file` (the old text flow is retired, GAP-16). |
| `signature_request_file.sample_id` | Demo samples don't exist in production. |
| `signature_field.signature_request_id` | Reached through its file. |
| `signing_token.expires_at` | Always the request's expiry (BR-10). |
| `agent_access_token.last_used_at` | The latest `agent_token_usage.last_used_at`. |
| `signature_request_event.category = request` | Not in FR-SIGN-012's list. |
| `agent_run`, `agent_run_event`, `agent_run_check` | The SRS uses a pull model: FlashSign never runs agents (B.3 §4.1). The run screen isn't linked from anywhere. |
| `role` as a global list of 12 personas | Replaced by per-organisation roles with four settings (§1). |
| `permission`, `role_permission`, `role_template_permission`, `org_member_role`, `project_member.role_id`, `role.scope` / `color` / `default_path` / `is_invitable` / `archived_at` / `is_owner_role` | The permission-key design of the first version; the frontend uses four role settings, one role per member and no project roles. |
| `owner_grant` (incl. `seat_limit`, `max_organizations`) and `organization.owner_grant_id`, `seat_limit`, `suspended_at`, status values `suspended` / `closed` | Replaced by `organization_invitation` and the frontend's active / pending / inactive status. |
| `platform_admin.level` | The frontend has one kind of Super Admin. |
| `project.visibility` | Who sees a project now comes from the role's project access and `project_member`. |

Kept on purpose although they could be calculated (noted in the schema): `task.status`, `time_off_request.duration_days`, `signature_request_event.actor_name` / `actor_email`, and `organization_id` on child tables.

## 6. Where the SRS or the frontend must change to match

**SRS**
- §3.6 still describes stateless 30-day JWT signing tokens. BR-10 and NFR-022, and the schema, use stored hashed tokens.
- §7.2 gives field coordinates as 0.0–1.0; everywhere else, and in the schema, it is 0–100.
- §3.7 ER diagram and B.5 §6.6 make a user belong to one organisation. The schema allows many (`org_member`, ORG-01).
- The SRS says "Milestone"; the schema keeps `phase` (FR-PROJ-007 "Phases (stored as Milestones)"). Pick one word in the SRS.
- Backlog has three definitions: no column / no plan link / not in a sprint. The schema uses "no plan link".

**Frontend**
- Timezones are display strings (`'America/New_York (EST)'`). They must be IANA names.
- Column colours are CSS variables (`var(--muted)`). They must be stored as hex.
- The "In-app" notification toggle writes `desktopNotifications`. It should write `in_app_notifications`.
- Contract renewal `auto_renew` / `one_time` map to `auto` / `none`.
- Payment terms, special conditions and content on `contracts/new` are never saved.
- Typed signatures must be rendered to an image (no data URLs in `value`).
- Old sample requests store field positions in px; convert them to %.
- `meetings/new` saves `durationMinutes` without updating the end time.
- Manual time for someone else must set `logged_by_user_id`.
- Agent finish notes go to `task_comment.via` instead of "(via Claude Code)" in the text.
- The old `Document` type (approvals, dashboard, reports) should move to `DocumentItem`.

## 7. Open decisions (not in the schema yet)

- **Single-use signing links:** REQ-AGR-038 says single-use, BR-10 says valid until the request ends. Single-use would add `signing_token.consumed_at`.
- **In-person signer (DEC-10):** would add `in_person_signer` and `signer.host_user_id`.
- **Template signing roles and field layouts (GAP-09, DOC-15)** for "Use a template" on Agreements: would add `document_template_recipient_role` and `document_template_field`.
- **Annex C P0 items not modelled:**
  - releases
  - project sponsor and status-change reasons
  - task severity, revision, accountable owner, security level
  - task watchers, comment visibility, mentions
  - saved filters
  - working calendar and holidays
  - Phase 2 repository bindings, delivery evidence, inbound events, outbox, work claims
- **`integration` and `agent_provider`** have no core SRS requirement and no live screen. Confirm they stay.
- **`project.allow_move`, `project_group`, `org_member.availability`, `announcement.is_pinned` / `draft`** are not in the SRS but are used by the frontend. They are kept.
- **Job title at sign-up:** it lives on `org_member`, so it must be held until the organisation exists, or the field should move to onboarding.
- **Retention period** for removed organisations and for anonymised accounts.
- **Admin Dashboard scope (DEC-28):** the frontend shows organisation-wide figures to Team Lead (Project User Access). Decide whether to limit them to assigned projects. No schema change either way.
- **Finer permissions (Annex C ACL-09, several roles per member, project-level roles):** not modelled; the four role settings cover Phase 1. Revisit if per-action permissions are needed.
- **Can the Organization Owner role be given by invitation?** The frontend's invite dialog lists every role, including it. Recommend excluding it.

## 8. Default roles (seed data)

These are the `role_template` rows, copied into each new organisation (`INITIAL_ROLES` in `lib/rbac.ts`):

| `role_key` | Name | System | Admin Dashboard | My Status | Project access | My Tasks | Team access |
|---|---|---|---|---|---|---|---|
| `organization_owner` | Organization Owner | yes | yes | yes | management | yes | management |
| `project_manager` | Project Manager | yes | yes | yes | management | yes | management |
| `team_lead` | Team Lead | no | yes | yes | user | yes | member |
| `developer` | Developer | no | no | yes | user | yes | member |
| `qa_tester` | QA Tester | no | no | yes | user | yes | member |

Rules that need no column:
- The Owner (`organization.owner_user_id`) always has full access.
- Only the Owner can open Settings › Preferences and AI Agent Hub › Organisation.
- Planner and Agreements are open to every member; signing a request sent to you needs no role.

Demo accounts (`DEMO_ACCOUNTS`) are prototype data, not seed data.
