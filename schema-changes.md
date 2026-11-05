# FlashSign schema: changes and why

This lists everything that changed in [`schema.txt`](schema.txt) and where each change came from:
- the new onboarding flow,
- SRS v4.0 (`New folder/FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx`),
- the prototype frontend (`flash-sign-proto/src`).

The schema itself contains only tables and rules; reasons and follow-ups are here.

`schema.txt` is now one continuous list of **103 tables** with no slices: 13 global (platform and per-person) and 90 tenant tables.

---

## 1. New onboarding and access model

Flow: **Super Admin dashboard → grants an owner permission → owner creates the organisation → owner defines roles and permissions → owner invites the team.**

### New tables

| Table | What it does |
|---|---|
| `platform_admin` | Platform staff who use the Super Admin dashboard (`super_admin` / `support`). Global. |
| `owner_grant` | The Super Admin's permission for one email to create an organisation, with plan, seat limit, `max_organizations`, expiry and a one-time link. Global. |
| `platform_activity_log` | Platform admin actions and sign-in events (outside any one organisation). Global, append-only. |
| `support_access_grant` | A platform admin can see a tenant's content only through a grant approved by that organisation (SRS Annex C §4, "support access requires an audited grant"). |
| `organization_feature` | Per-organisation feature switches (teams, contracts, ai_agents …), replacing hard-coded `FEATURES` in `lib/features.ts`. |
| `permission` | The fixed list of permission keys the code checks (seed list in §8). Global, platform-owned. |
| `role_template`, `role_template_permission` | The platform's default roles and their permissions, copied into every new organisation. Global. |
| `role_permission` | Which permissions each of an organisation's roles has; `allow` or `deny` (deny wins, ACL-09). |
| `org_member_role` | A member can hold several roles (ACL-09). Replaces `org_member.role_id`. |
| `department` | Organisation's own departments; used by members, invitations, teams and announcement audiences. |

### Changed tables

| Table | Change |
|---|---|
| `role` | **Now per organisation** (was a global fixed list). Added `role_key`, `name`, `description`, `scope` (organization / project), `color`, `default_path`, `is_owner_role`, `is_invitable`, `role_template_id`, `archived_at`. |
| `organization` | Added `owner_grant_id`, `status` (active / suspended / closed), `seat_limit`, `suspended_at`, `deleted_at`, `company_size`. |
| `org_member` | `role_id` removed (see `org_member_role`). `is_active` became `status` (active / suspended / removed) with `suspended_at` / `removed_at`. `department` became `department_id`. `working_hours` became `working_hours_start` / `working_hours_end`. |
| `project_member` | Added `role_id`: an optional project-level role (SRS Annex C §3.1: "developer and QA are normally project roles"). |
| `invitation` | `role_id` now points to the organisation's own roles. Added `department_id` and `sent_at`. Added a unique rule for one pending invite per email per organisation. |
| `session` | `active_organization_id` may be empty: someone with a grant has signed in but not created an organisation yet. |
| `users` | `is_active` now means account-wide (disabled by a platform admin). Membership state is `org_member.status`. |
| `outbound_email` | `organization_id` may be empty for platform emails (owner grant, verification code, password reset). |

### What this changes in the SRS

| SRS item | Today | Needs to say |
|---|---|---|
| FR-AUTH-001 Registration | Anyone can sign up and create an organisation. | Sign-up only through an owner grant link or an invitation link. |
| FR-AUTH-003 Onboarding wizard | Any new user runs the wizard; the owner gets `ceo`. | Only a person with an accepted `owner_grant` can run it. The owner gets the protected **Owner** role; default roles are copied from templates. |
| FR-AUTH-004 Invitations | Role is a `DemoRole`. | Role is one of the organisation's own invitable roles. |
| FR-AUTH-007 Navigation gating | Sidebar is filtered by role name (`ROLE_CONFIGS`). | Sidebar and actions are filtered by the permissions the server returns for the person (ACL-07). |
| FR-AUTH-008 Persona switcher | 12 fixed personas. | Demo-only; not backed by the database. |
| FR-SETT-002 Role administration | Change one `DemoRole`; toggle `isActive`. | Assign several roles; suspend or remove membership. A new screen, **Roles & permissions**, lets the owner create, edit and archive roles. |
| §2.5 Roles | 12 fixed roles, including `platform_admin` and `integration_service`. | 10 default role templates plus custom roles. `platform_admin` becomes the `platform_admin` table. `integration_service` is dropped: agents act for a person through `agent_access_token`. |
| *New requirements* | – | Super Admin dashboard (create, revoke and resend owner grants; suspend organisations; plan and seat limit; feature switches); support access grants. |

### What this changes in the frontend

- New Super Admin pages, and a grant-link landing page before `/signup`.
- `/signup` without a grant or invitation must stop: it currently routes straight to `/onboarding/create-organization`.
- `lib/permissions.ts` (`ROLE_CONFIGS` and the `can*` functions) is replaced by the permission list from the server.
  - `canCreateTask`, `canApprove`, `canRunAgent`, `canSignDocument`, `canViewReports` and `canAccess` are defined but never called today, so those actions are not gated at all.
- There are two role lists:
  - `types/demo-auth.ts` uses `executive` and `qa` (10 roles);
  - `types/index.ts` uses `ceo` and `qa_tester` (12 roles), translated in `context/app-context.tsx:835-840`.
  - Both go; roles come from the database.
- Role labels disagree across `settings/users/page.tsx`, `create-member-dialog.tsx`, `teams/members/new/page.tsx`, `permissions.ts` and `demo-auth.ts`. They should come from `role.name`.
- `INVITABLE_ROLES` (`lib/invitations.ts:11`) becomes `role.is_invitable`.
- Onboarding lets people pick their own role (`onboarding/profile/page.tsx:47`). This must go: roles are granted, never self-chosen (ACL-02).
- `createOrganization` makes the owner `org_admin`. It should assign the Owner role.
- The seal role picker (`company-seals.tsx:16,24`) and the seal filter on the signing page (`signatures/sign/[requestId]/page.tsx:92`) must read the organisation's roles.
- Feature flags (`lib/features.ts`) are read from `organization_feature`.

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
| `role` as a global list; `org_member.role_id` | Replaced by per-organisation roles (§1). |

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

## 8. Default permissions and roles (seed data)

Owner role: every permission, always. `client` gets no permissions: they only see agreements and documents addressed or shared to them. Signing a request sent to you needs no permission.

| Permission | Scope | Default roles |
|---|---|---|
| `organization.manage` (profile, branding, departments, features) | org | ceo, org_admin |
| `member.invite` | org | ceo, org_admin |
| `member.manage` (roles, suspend, remove) | org | ceo, org_admin |
| `role.manage` (create and edit roles and permissions) | org | org_admin |
| `team.manage` | org | ceo, org_admin, project_manager |
| `project.create` | org | ceo, org_admin, project_manager, product_owner, engineering_lead |
| `project.view_all` (incl. members-only projects) | org | ceo, org_admin, auditor |
| `project.manage` (plan, boards, structure, members, baseline) | project | ceo, org_admin, project_manager, product_owner, engineering_lead |
| `project.delete` | project | ceo, org_admin, project_manager |
| `task.create`, `task.edit` (incl. move) | project | ceo, org_admin, project_manager, product_owner, engineering_lead, developer, qa_tester |
| `task.delete` | project | ceo, org_admin, project_manager, product_owner, engineering_lead |
| `sprint.manage` | project | project_manager, product_owner, engineering_lead |
| `time.log` (own time) | project | all except client, auditor, document_manager |
| `time.manage_others` | project | ceo, org_admin, project_manager, engineering_lead |
| `time.view_team` | org | ceo, org_admin, project_manager, engineering_lead |
| `planner.manage` (calendar events) | org | ceo, org_admin, project_manager, product_owner, engineering_lead |
| `meeting.create` | org | all except client, auditor |
| `time_off.approve` | org | ceo, org_admin, project_manager |
| `announcement.publish` | org | ceo, org_admin |
| `document.view` | org | all except client |
| `document.create`, `document.edit` | org | ceo, org_admin, project_manager, product_owner, engineering_lead, document_manager |
| `document.delete` | org | ceo, org_admin, document_manager |
| `document.share` | org | ceo, org_admin, project_manager, document_manager |
| `document.approve` | org | ceo, org_admin, project_manager, engineering_lead, document_manager |
| `template.manage` | org | ceo, org_admin, document_manager |
| `contract.manage` | org | ceo, org_admin, document_manager |
| `contract.review` | org | ceo, document_manager |
| `agreement.send` (prepare, send, sign it yourself) | org | ceo, org_admin, project_manager, product_owner, engineering_lead, document_manager |
| `agreement.view_all` (whole organisation's requests) | org | ceo, org_admin, document_manager, auditor |
| `seal.manage` | org | ceo, org_admin, document_manager |
| `signing_defaults.manage` | org | org_admin, document_manager |
| `srs.analyse`, `srs.review` | project | ceo, org_admin, project_manager, product_owner, engineering_lead |
| `agent.use` (own tokens) | org | all except client, auditor, document_manager |
| `agent.manage` (organisation policy, revoke any token) | org | ceo, org_admin |
| `report.view` | org | ceo, org_admin, project_manager, engineering_lead, document_manager, auditor |
| `activity.view` (audit log) | org | ceo, org_admin, auditor |

Role templates (`role_key`, scope, default page):
- `ceo` (org, /dashboard)
- `org_admin` (org, /settings/users)
- `project_manager` (org, /dashboard)
- `product_owner` (project, /dashboard)
- `engineering_lead` (project, /dashboard)
- `developer` (project, /my-tasks)
- `qa_tester` (project, /my-tasks)
- `document_manager` (org, /agreements)
- `client` (org, /agreements)
- `auditor` (org, /reports)

Sidebar groups show when the person has at least one permission in that module.
