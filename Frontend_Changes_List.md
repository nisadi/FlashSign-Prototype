# Frontend Changes List: Finalized Database Tables

Prototype: `flash-sign-proto` (Next.js 16, React 19, TypeScript, Tailwind v4)
Scope: frontend only. All data is mock data held in React state and `localStorage`. No API, database, SQL, migration or server code was added.

---

## 1. Overview

The prototype was updated so its screens, forms and mock records match the 30 finalized tables. The work covered:

- **Platform and organisation.** The Super Admin Dashboard now uses the `organization`, `organization_invitation`, `organization_feature` and `super_admin` columns. Feature switches are now set per organisation instead of being hard-coded.
- **People and access.** Invitations now carry `role_id` and their assigned projects (`invitation_project`). An accepted invitation now creates the member with that role and those projects (gap G-01). Role names are unique within an organisation (G-07). Settings › Users & Roles now uses the role's Team Management setting (G-04).
- **Personal settings.** `user_preference`, `notification_event` + `user_notification_setting`, `session` and `verification_code` now have working screens. Settings › Preferences is now the Owner's organisation settings page.
- **Projects.** `project.template`, `archived_at`, `next_task_number`, per-person favourites (`user_favorite_project`), `baseline_change` old/new dates, hex `board_column.color`, and the `activity_log` categories.

Checks run: `npx tsc --noEmit` passes with no errors. ESLint shows no new errors in any changed file. The project already had 173 lint errors before this work, and none of the changes added to them. `next build` and browser testing were **not** run.

Where the SRS and the finalized tables disagree, the prototype was **not** changed to pick a side. Each case is listed in §9.

---

## 2. Reference Materials

| Material | Used for |
|---|---|
| Finalized database tables (pasted list, 30 tables) | Main source for fields, values and rules |
| FlashSign SRS v4.0 (full) and v4.1 (compact) | Requirement checks. FR-AUTH-002, -003 and -006, FR-PLAN-002 and FR-SETT-005 are quoted in §9 |
| `schema-changes.md` §6 (frontend list) and §7 (open decisions) | Timezones as IANA names, hex column colours, the in-app toggle bug, keeping the Owner role out of invitations |
| `SRS fix instructions - round 3 (access control).md`, gaps G-01 to G-08 | G-01, G-04 and G-07 fixed. The rest are in §9 |
| Existing prototype code | Starting point for every change |

---

## 3. Table-wise Changes

Tables not in the finalized list (`org_member`, `department`, `team`, `team_member`, `project_tag`, `user_recent_project`, `platform_activity_log`, `support_access_grant`, and others) were left alone. The places that depend on them are listed in §9.

### super_admin
- **Columns:** user_id, granted_by_user_id, created_at, revoked_at
- **Before:** No record. The Super Admin was just a flag on a demo account.
- **Change:** Added the `SuperAdminRecord` type and `INITIAL_SUPER_ADMINS` mock rows (`lib/rbac.ts`). Platform Overview now lists the Super Admins with who granted access, when, and whether it was revoked.
- **Fields:** Added granted by, created, and revoked.
- **Related:** `super-admin/page.tsx`, `demo-auth-context.tsx` (`superAdmins`)

### organization_invitation
- **Columns:** organization_id, invited_by_user_id, accepted_by_user_id, organization_name, owner_name, owner_email, plan, status (pending / accepted / expired), sent_at, expires_at (+7 days), accepted_at, revoked_at
- **Before:** Had a free-text `message`. Had no Owner name, no link to the organisation, and no revoked date.
- **Change:** Remodelled as `SuperAdminOrgInvitation`. Revoking sets the status to `expired` and fills `revoked_at`. `orgInviteDisplayStatus()` turns these into four labels: pending, accepted, expired and revoked. A pending invitation past its `expires_at` shows as expired. Only one pending invitation is allowed per (owner_email, organization_name). Resending moves `sent_at` and gives a new 7-day expiry. Creating an organisation also creates a pending invitation linked to it.
- **Fields:** Added owner_name, organization_id, accepted_by_user_id, accepted_at, revoked_at and created/updated. Removed message. Plan values are now lowercase.
- **Related:** `super-admin/page.tsx` (Invitations tab and Invite modal), `lib/rbac.ts`, `demo-auth-context.tsx`

### organization
- **Columns:** owner_user_id, created_by_user_id, name, slug, description, industry, website, plan (starter / pro / enterprise), status (active / pending / inactive), timezone (IANA), working_hours_start/end, deleted_at
- **Before:** The Super Admin list had size, type, logo, accent colour, stored member/project counts, owner name/email typed in as text, and plans with capital letters. Organisation settings sat in `CollaborationSettings`.
- **Change:**
  - The Super Admin list now uses only these columns. The Owner is looked up through `owner_user_id`, or comes from the pending invitation until the Owner accepts.
  - Member and project counts are counted, not stored.
  - Deleting is a soft delete: it sets `deleted_at` and revokes the pending invitation.
  - Nobody can sign in to an inactive or deleted organisation, except the Super Admin.
  - The Owner edits name, slug, description, industry, website, timezone and working hours in **Settings › Preferences**. Slugs must be unique across FlashSign.
  - Self sign-up (`/onboarding/create-organization`) now also creates the organisation row, with the person as owner and creator, plan `starter` and status `pending`. It also asks for the time zone.
- **Fields:** Added timezone (IANA), working hours, created_by, deleted_at. Removed size, type, logo, accent, stored counts and owner text fields from the Super Admin record.
- **Related:** `super-admin/page.tsx`, `settings/preferences/page.tsx`, `onboarding/create-organization/page.tsx`, `demo-auth-context.tsx` (`createSuperAdminOrg`, `updateSuperAdminOrg`, `updateOrganization`, `createOrganization`, `login`)

### organization_feature
- **Columns:** organization_id, feature_key, is_enabled, updated_by_user_id, updated_at
- **Before:** `lib/features.ts` hard-coded `teams`, `contracts`, `aiAgents` and `srsAnalysis` for everyone.
- **Change:**
  - The switches are now per organisation. Mock rows are stored in `localStorage`.
  - `FEATURE_DEFINITIONS` holds the defaults: teams and contracts off, ai_agents and srs_analysis on.
  - The Super Admin flips them in the organisation details modal. The Owner sees them read-only in Settings › Preferences.
  - `FEATURES.*` now reads the active organisation's values, so its 43 existing call sites didn't need changing.
  - Three new gates were added: the AI Agent Hub sidebar entry and route, and the "Analyze SRS" buttons.
  - The Teams layouts used to run on the server, where they would always see the defaults. They now use a client-side `FeatureGate`.
- **Related:** `lib/features.ts`, `lib/rbac.ts`, `components/shared/feature-gate.tsx`, `app-sidebar.tsx`, `ai-agents/layout.tsx`, `teams/{directory,new,[teamId]}/layout.tsx`, `projects/[projectId]/files/page.tsx`

### users
- **Columns:** avatar_file_id, email, name, bio, company, is_active, email_verified_at, last_login_at
- **Before:** `DemoUser.timezone` used display strings. The profile page had phone and address but no bio.
- **Change:** Removed the per-person timezone from the type, the onboarding profile step, the prototype home page and the app-context mapping. Added the optional fields company, avatarUrl, isActive, emailVerifiedAt and lastLoginAt. Settings › Profile gained **Bio** (240 characters at most).
- **Fields:** Added bio. Removed timezone. Phone, address and avatar colour were kept (conflict, see §9).
- **Related:** `types/demo-auth.ts`, `types/index.ts`, `settings/profile/page.tsx`, `onboarding/profile/page.tsx`, `prototype-home/page.tsx`, `context/app-context.tsx`

### session
- **Columns:** user_id, active_organization_id, remember_me, expires_at, last_seen_at, revoked_at, ip_address, user_agent
- **Before:** Settings › Security showed a fixed "This browser" card.
- **Change:**
  - Added the `DemoSession` type. Mock sessions are seeded when a demo account signs in.
  - The Security page lists each active session (not revoked and not expired) with its device, IP, last activity, sign-in date, remember-me and expiry.
  - People can sign out one session, or all other sessions at once.
  - Changing the password signs out all the other sessions.
- **Related:** `settings/security/page.tsx`, `demo-auth-context.tsx` (`sessions`, `revokeSession`, `revokeOtherSessions`)

### verification_code
- **Columns:** purpose (email_verification / password_reset), code_hash, attempts (locked after 5), expires_at, consumed_at, created_at (drives the 60-second resend cooldown)
- **Before:** Forgot Password showed "Simulated link sent", and anyone could open the Reset Password page.
- **Change:**
  - Added `VerificationCodeStep`, which mocks one code row: 6 digits, valid for 10 minutes, locked after 5 wrong tries, resendable after 60 seconds, and marked used on success.
  - Forgot Password now asks for this code. A correct code moves the person on to `/reset-password?email=…&verified=1`.
  - Reset Password only shows its form after the code has been verified.
  - The same message is shown whether or not the email has an account.
- **Related:** `components/auth/verification-code-step.tsx`, `(auth)/forgot-password/page.tsx`, `(auth)/reset-password/page.tsx`

### user_preference
- **Columns:** theme, default_calendar_view, in_app_notifications, email_notifications, desktop_notifications, weekly_digest
- **Before:** `DemoPreferences` held taskAssignmentAlerts, deadlineReminders, approvalReminders and timezone. Settings › Notifications read `CollaborationSettings`, and its In-app toggle wrote to `desktopNotifications` (a bug).
- **Change:** `DemoPreferences` now holds exactly these six fields. Settings › Notifications and the onboarding Preferences step both save to it. The In-app toggle now writes `inAppNotifications`.
- **Related:** `types/demo-auth.ts`, `settings/notifications/page.tsx`, `onboarding/preferences/page.tsx`, `lib/auth-validation.ts`

### notification_event / user_notification_setting
- **Columns:** event_key (14 keys), name, category, default_enabled. Per person: (user_id, event) → is_enabled.
- **Before:** The settings page had a hand-written list of 12 events, without `deadline_reminder` and `approval_reminder`. Choices were saved organisation-wide in `CollaborationSettings`.
- **Change:** Added `NOTIFICATION_EVENTS` with all 14 events, and `NOTIFICATION_CATEGORY_LABELS`. Choices are now saved per person. An event with no saved choice uses its `default_enabled` value (`isNotificationEnabled()`). The settings page groups events by category. The onboarding step offers task_assigned, deadline_reminder and approval_reminder.
- **Related:** `types/demo-auth.ts`, `demo-auth-context.tsx` (`notificationSettings`, `setNotificationSetting`), both settings pages

### role_template / role
- **Columns:** role_template_id, created_by_user_id, name (unique per organisation), is_system, the dashboard and access settings, updated_at
- **Before:** Roles had no template link, and duplicate names were allowed (G-07).
- **Change:**
  - Added `ROLE_TEMPLATES` (Owner, PM, Team Lead, Developer, QA). `CustomRole` gained `roleTemplateId`, `createdByUserId` and `updatedAt`.
  - The role editor rejects duplicate names and names over 60 characters.
  - A role can't be deleted while a pending invitation uses it. The error now shows inside the delete dialog instead of a browser `alert()`.
  - The default dashboard is worked out from the role's settings, not stored (`defaultDashboardFor`).
  - Teams › Roles no longer calls hooks after its access check.
- **Related:** `lib/rbac.ts`, `components/roles/role-editor-modal.tsx`, `teams/roles/page.tsx`, `demo-auth-context.tsx`

### invitation / invitation_project
- **Columns:** role_id, department, invited_by_user_id, accepted_by_user_id, email, name, title, message, status (pending / accepted / revoked), sent_at, expires_at, accepted_at, revoked_at. Plus the projects for each invitation.
- **Before:** The dialog collected a role and projects but didn't save them (G-01). It also offered the old persona list, including the Owner.
- **Change:**
  - `DemoInvitation` now carries `roleId`, `roleName`, `projectIds`, `acceptedByUserId`, `revokedAt` and `createdAt`.
  - The dialog lists the organisation's roles, but not Organization Owner.
  - Roles limited to assigned projects (Project User Access) must have at least one project chosen. Archived projects aren't offered.
  - Accepting creates the member with that role and those projects.
  - The Invited list shows the role (looked up by `role_id`) and the projects.
- **Related:** `invite-member-dialog.tsx`, `invitations-list.tsx`, `(auth)/invite/[token]/page.tsx`, `lib/invitations.ts`, `demo-auth-context.tsx`

### activity_log
- **Columns:** category (13 values), action, resource_type, resource_id, project_id, detail, ip_address, user_agent
- **Before:** `AuditLog` had no category or user agent. The feed guessed icons from the start of the action name.
- **Change:** Added `ActivityCategory` and the optional fields `category`, `projectId` and `userAgent`. `lib/activity.ts` works out the category for older entries from the resource type. The Activity page now has a category filter and shows the category and user agent.
- **Related:** `types/index.ts`, `lib/activity.ts`, `app/(workspace)/activity/page.tsx`, `data/mock-data.ts`

### notification
- **Columns:** type (task / document / signature / agent / approval / meeting / time_off / announcement / system), notification_event_id
- **Change:** Added the missing type values and an optional `eventKey` to `Notification`.

### project
- **Columns:** template, status (no `archived`), archived_at, next_task_number, project_group, accent_color, original dates, duration_unit, uses_*, allow_move, health_mode/health, deleted_at
- **Before:** `ProjectStatus` included `'archived'`. Archiving was an `isArchived` flag. The template and a visibility value were saved inside `tags`. Task keys were worked out as the highest existing number + 1, so a deleted task's key could be handed out again.
- **Change:**
  - `ProjectTemplate` is saved in `project.template`. The unused visibility value was removed.
  - `'archived'` was removed from `ProjectStatus`. `archivedAt` replaces `isArchived`, and the Archive action sets or clears it.
  - The project list hides archived projects. A new "Archived" option in the status filter shows them, and a "Cancelled" option was added.
  - `nextTaskNumber` is now a counter that only goes up, so task keys are never reused.
  - Older saved data (including any `'archived'` status) is converted when it loads (`migrateProject`).
- **Related:** `types/index.ts`, `projects/new/page.tsx`, `projects/page.tsx`, `projects/[projectId]/page.tsx`, `projects/[projectId]/settings/page.tsx`, `components/shared/badges.tsx`, `context/app-context.tsx`, `data/mock-data.ts`

### user_favorite_project
- **Before:** A single `project.isFavorite` flag, shared by everyone.
- **Change:** Favourites are now per person (`UserFavoriteProject` rows, at most one per person and project). Added `favoriteProjectIds` for the signed-in person. Deleting a project removes its favourites. The Projects list, Favorites page and project header all read the per-person list.

### baseline_change
- **Columns:** changed_by_user_id, old_start_date, old_end_date, new_start_date, new_end_date, created_at (**no reason**)
- **Before:** Each entry was `{at, byUserId, reason, startDate, endDate}`, with the old dates only.
- **Change:** Entries now store the old and new dates. `reason` was kept as an optional field (conflict, see §9). Project Settings and the Timeline report show "old → new". Older entries are converted when they load.

### board / board_column
- **Columns:** board is_main, mirrors_main_board, sort_order. board_column color (**hex**), status, sort_order.
- **Change:** The default colours and the colour choices are now hex values. Previously saved `var(--…)` colours are converted to hex when they load (`toHexColumnColor`). The board structure (main board, extra boards in order, a missing column list means "mirrors main board") already matched, so it was left as it was.

### Unchanged (already matched)
`integration` (categories and statuses already match), `project_goal` (`goals[]` in order), `project_member` (`memberIds`; see §9 for `assigned_by_user_id`), `stored_file` (see §9), `team_project` (Teams feature is off; see §9).

---

## 4. Page-wise Changes

| Page / route | Change |
|---|---|
| `/super-admin` | Rewritten for the new tables. Organisations tab: search, status and plan filters, Owner from user or invitation, counted members and projects, status changes, edit, soft delete. Invitations tab: all four statuses with a status filter, accepted and revoked dates, resend, revoke. Platform Overview: organisations by plan, deleted count, Super Admin list. Details modal: time zone, working hours, creator, **feature switches**. All hooks now run before the access check. |
| `/settings/preferences` (Owner) | Now the organisation's own settings: name, slug, industry, website, description, IANA time zone and working hours. Plan, status and features are shown read-only. Removed: week start, planning view, workload threshold and calendar view (calendar view moved to the personal settings). |
| `/settings/notifications` | Delivery switches (in-app, email, desktop, weekly digest), 14 events grouped by category, and a **Display** card (theme, default calendar view). |
| `/settings/profile` | Bio added. |
| `/settings/security` | Live session list with sign-out buttons. Changing the password signs out the other sessions. |
| `/settings/users` | Uses the role's Team Management setting (G-04). |
| `/teams/roles` | Duplicate-name check, delete errors shown in the dialog, hooks order fixed. |
| `/forgot-password`, `/reset-password` | 6-digit code step. The reset form only appears after the code is verified. |
| `/invite/[token]` | Shows the role name from the invitation's `role_id`. |
| `/onboarding/create-organization` | Time zone field added. The organisation row is created. |
| `/onboarding/profile` | Time zone removed. |
| `/onboarding/preferences` | Rewritten for `user_preference` and the three event switches. |
| `/projects`, `/projects/favorites`, project header | Per-person favourites. Archived and Cancelled filter options. |
| `/projects/new` | Saves `template`. Visibility removed. `nextTaskNumber: 1`. |
| `/projects/[id]/settings`, Timeline report | Baseline history shows old → new dates. Archive uses `archivedAt`. |
| `/projects/[id]/files` | "Analyze SRS" only appears when `srs_analysis` is on. |
| `/activity` | Category filter, category label, user agent. |
| `/ai-agents/*`, Teams sub-routes | Shown only when the organisation has the feature switched on. |
| Sidebar | AI Agent Hub entry hidden when `ai_agents` is off. |

---

## 5. Form and Field Changes

| Form | Added | Removed | Validation |
|---|---|---|---|
| Super Admin › Create Organization | Owner full name\*, Owner email\*, time zone (IANA), website, description, initial status | Company size, organisation type | Name required. Slug in lower-case-with-hyphens format and unique. Valid Owner email. |
| Super Admin › Invite Organization | Owner full name\* | Personal message, onboarding note | Valid email. Only one pending invitation per (email, organisation name). |
| Super Admin › Edit Organization | Time zone, website, description. Owner name/email editable only while the invitation is pending. | Size, stored counts | Slug unique |
| Settings › Preferences (Owner) | Name\*, slug\*, industry, website, description, time zone, working day start/end | Week start, planning view, workload threshold, calendar view | Slug format and unique, `https://` website, work day must end after it starts |
| Settings › Profile | Bio (≤240) | n/a | Bio length |
| Invite member | Role list without Owner. Assigned projects\* when the role is limited to assigned projects. | The hidden legacy role field | At least one project for those roles |
| Role editor | n/a | n/a | Name unique in the organisation. 60 characters at most. |
| Onboarding › Create organisation | Time zone\* | n/a | Required |
| Onboarding › Profile | n/a | Primary time zone | n/a |
| Onboarding › Preferences | Calendar view, desktop, weekly digest, three event switches | Time zone, the old alert fields | n/a |
| Forgot password | 6-digit code | n/a | 6 digits, 5 tries, 10-minute expiry, 60-second resend |
| New project | n/a | Visibility (was saved in tags) | Template is now typed |

---

## 6. Table and Display Changes

- **Super Admin organisations table:** columns are Organisation (name, slug, industry, time zone), Owner (with an "Invitation not accepted yet" label), Plan, Status (can be changed in the table), counted Members & Projects, and Actions. Deleted organisations are hidden.
- **Super Admin invitations table:** columns are Organisation (with its link state), Owner name and email, Plan, Status (pending, accepted, expired or revoked, with the date), Sent / Expires, and Actions. It has a status filter.
- **Members › Invited:** new **Projects** column ("All projects" for roles that see every project). The Role column shows the role name from `role_id`.
- **Projects list:** status filter adds Cancelled and Archived. Archived projects no longer appear in "All".
- **Activity feed:** category filter. Each row shows category, time, IP and user agent.
- **Security › sessions:** one row per active session.
- **Baseline history:** "old start – old end → new start – new end".

---

## 7. Functional Changes

- **Accepting an invitation (G-01):** creates the member with the invitation's role and assigned projects, and records `accepted_by_user_id`.
- **Role rules:** a role can't be deleted while a member or a pending invitation uses it. Names are unique.
- **Organisation lifecycle:** create (with a linked Owner invitation), edit, change status, soft delete (which also revokes the pending invitation), and sign-in blocked for inactive or deleted organisations.
- **Organisation invitations:** expire after 7 days. Resending starts a new 7-day period. Revoking sets the status to expired and records `revoked_at`.
- **Per-organisation features** are applied live across the app.
- **Per-person favourites.** **Archiving** is a timestamp, separate from status.
- **Task keys** come from a counter that only goes up.
- **Sessions:** sign out one session or all others. A password change ends the other sessions.
- **Verification codes:** 5-try lock, 60-second cooldown, 10-minute expiry, the same message whether or not the email exists.
- **Saved-data conversion:** older browser data is converted when it loads (archived flag/status, favourites, baselines, column colours). The super-admin storage keys moved to `_v2`.

---

## 8. Removed or Outdated Functionality

- `CollaborationSettings` (type, mock data, `updateCollaborationSettings`, `useCollaborationSettings`): the week start day, default planning view, workload threshold and display-string time zone had no column in any finalized table.
- `ProjectStatus 'archived'`, `project.isArchived`, `project.isFavorite`, the template and visibility values saved in `project.tags`.
- Super Admin organisation fields: size, type, logo, accent colour, stored member/project counts, typed-in owner name/email, capitalised plans. The organisation invitation `message`.
- `DemoUser.timezone`. The old `DemoPreferences` fields (taskAssignmentAlerts, deadlineReminders, approvalReminders, timezone).
- `INVITABLE_ROLES` / `roleTitle` (the old persona list) in invitations.
- Hard-coded feature switches. Server-side redirects in the Teams layouts.
- The `BaselineChange` fields `startDate` / `endDate` (replaced by old/new dates).
- The fixed "This browser" session card. The "Simulated link sent" password reset screen.

---

## 9. Unresolved Issues

**SRS and finalized tables disagree (the prototype was not changed to pick a side; a decision is needed):**

| # | Issue | What the prototype does now |
|---|---|---|
| U-1 | **Baseline reason:** FR-PLAN-002 says a re-baseline reason is required. `baseline_change` has no reason column. | The reason is still asked for and kept as an optional field. Either add `baseline_change.reason` or drop the requirement. |
| U-2 | **Company size:** FR-AUTH-003 Step 1 asks for it. `organization` has no size column. | Kept on the legacy self-sign-up form only (the old workspace record). Removed from the Super Admin forms and not saved on the organisation row. |
| U-3 | **Phone, address, avatar colour:** FR-AUTH-003 Step 3 asks for them. `users` has none of them (it has `avatar_file_id`). | Kept in Settings › Profile and onboarding. |
| U-4 | **Time zone:** FR-AUTH-003 Step 2 treats it as a personal preference. The tables only have `organization.timezone`. | Moved to the organisation (create-organisation step and Owner Preferences). |
| U-5 | **Notification switches:** FR-SETT-005 names `taskAssignmentAlerts`, `deadlineReminders` and `approvalReminders` as preferences. The tables make them event rows. | Mapped to task_assigned, deadline_reminder and approval_reminder. The SRS wording should be updated. |
| U-6 | **Self sign-up (G-05):** FR-AUTH-003 describes self sign-up. Change request N1 says accounts come only from invitations. | The routes still exist and are not linked. Self sign-up now creates an organisation row with plan `starter` and status `pending`, which needs confirming. |

**Missing from the finalized tables, or needing clarification:**

| # | Issue |
|---|---|
| U-7 | Job title, department and member time zone live on `org_member` / `department`, which were not in the provided list. They are still shown and edited (profile, invitation, Teams pages) exactly as before. |
| U-8 | `team_project` depends on `team`, which was not provided. The Teams feature is off by default, so this was not wired up. |
| U-9 | `user_recent_project` was not provided. The existing `recentProjectIds` list was left as it is. |
| U-10 | `project_member.assigned_by_user_id` is not recorded. Project members are still a plain `memberIds` list. |
| U-11 | `stored_file.scan_status` (files hidden from others until clean) is not shown on any file list. The current file types have no scan state. Clarify whether the prototype should simulate scanning. |
| U-12 | `verification_code` with purpose `email_verification` (FR-AUTH-002, `/verify-email`) has no page. Accounts come from invitations (N1), so whether email verification is still needed should be confirmed. The code component can be reused if it is. |
| U-13 | **Who controls `organization_feature`?** The table doesn't say. The prototype gives control to the Super Admin and shows it read-only to the Owner. |
| U-14 | **Where personal display settings belong:** Settings › Preferences is Owner-only (round 3), so theme and default calendar view were put on the Notifications page under "Display". The theme value is saved but the app has no dark mode. |
| U-15 | **No page to accept an organisation invitation (G-02).** Accepting one, and filling `organization.owner_user_id`, can't be shown end to end. |
| U-16 | Project fields with no column: `dueDate`, `category`, `icon` and `progress` (calculated). Tags would need `project_tag`. These were kept because many screens read them. Removing them would be a separate clean-up. |
| U-17 | The legacy `DemoWorkspace` still holds size, type, accent colour and stored counts for the older `/workspace` pages. It is kept in step with the organisation record where the two overlap. |
| U-18 | Still open from round 3: G-03 (Admin Dashboard scope for Team Lead, DEC-28), G-06 (the old persona list still used for company seals and board editing), G-08 (all checks run only in the browser). The `p-mvhmnblw` special case (part of G-07) was kept because routes depend on it. |

---

## 10. Implementation Summary

- **Files changed:** 44, plus 3 new files (`components/auth/verification-code-step.tsx`, `components/shared/feature-gate.tsx`, `lib/activity.ts`).
- **Tables applied:** super_admin, organization_invitation, organization, organization_feature, users, session, verification_code (password reset), user_preference, notification_event, user_notification_setting, role_template, role, invitation, invitation_project, activity_log, notification, project, user_favorite_project, baseline_change, board_column.
- **Already matched, no change needed:** integration, project_goal, board.
- **Partly applied or only reported:** project_member (assigned_by), team_project, stored_file, verification_code (email verification). See §9.
- **Fix-list items closed:** G-01, G-04, G-07 (duplicate names), the IANA time zones, hex column colours, the in-app toggle bug, and keeping the Owner role out of invitations (`schema-changes.md` §6 and §7).
- **Checks:** TypeScript passes. No new ESLint errors in changed files. Not run: `next build` and browser testing. Recommended before the demo: Super Admin create/invite/feature switches, the invite → accept flow, Settings (Preferences, Notifications, Security), and the forgot-password code flow.
- **Constraints kept:** frontend and mock data only. No new dependencies. Existing design components and stack kept. Pages unrelated to the finalized tables were not changed.
