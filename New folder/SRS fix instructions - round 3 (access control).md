# SRS fix instructions: round 3 (roles, permissions and dashboards)

These edits bring the two Word documents in line with the frontend as built in commit `6a1cc6b` ("New Update", 5 Nov 2026). That commit implements the change request **"FlashSign – Updated Role-Based Access Control and Dashboard Management"**:
- a Super Admin;
- an Organization Owner;
- custom roles;
- two dashboards with a switcher;
- project, My Tasks and Team access levels;
- Owner-only areas;
- six demo login accounts;
- Access Denied guards.

**Where the change request and the built frontend differ, the frontend wins.** Section 0 lists the frontend facts this file is based on.

- **v4.0** = `FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx` (the master)
- **Compact** = `PROJECT_MANAGEMENT_REQUIREMENTS.docx` (the PRM, short version)

## How to use this file

- **Find** is text to search for with Ctrl+F (a short, unique part is enough). **Replace with** is the new text. Text in grey boxes is exact. Keep the backticks (`` ` ``); they are already in the documents.
- Some **Find** boxes have two or three lines. Each line is its own paragraph in Word, and Ctrl+F cannot search across paragraphs.
  - Search for the first line inside the requirement named under **Where**. This matters because lines like `Actor/Role: Org Admin, CEO` appear in several requirements.
  - The other lines come straight after it. Replace each line with the matching line of **Replace with**.
- **Select from … to …** means: click before the first text, Shift+click after the last, then paste the new text over the selection.
- **Insert after** means: click at the end of the named paragraph, press Enter, and paste. New FR bullets use **List Bullet** and new FR headings use **Heading 3**, the same styles as the requirements around them.
- Do **Part 1 (v4.0)** first. Several Compact fixes in Part 2 reuse the text written in Part 1.
- Numbering continues from the earlier instruction files (V-18, C-13, R-08). **Do not renumber existing requirements.** New requirements get the next free number in their module.
- Rounds 1 and 2 must already be done; the Find texts below assume them.
- All file paths are under `flash-sign-proto/src/`.

---

## 0. What the frontend now does (the facts these edits follow)

### Permission code
`lib/rbac.ts` holds the permission settings and the check functions:
- `canAccessDashboard`
- `canManageProjects`
- `canAccessProject`
- `canViewProjectReports`
- `canAccessProjectDangerZone`
- `canAccessMyTasks`
- `canManageTeam`
- `canViewTeamAnalytics`
- `canManageRoles`
- `canAccessPreferences`
- `canAccessAIOrganizationSettings`

`context/demo-auth-context.tsx` holds the signed-in user, the roles, the demo accounts and the Super Admin data.

### A role has four settings plus name and description
| Setting | Values | Built in |
|---|---|---|
| Dashboard access | Admin Dashboard (and "Does this user also need access to My Status?" Yes / No), or My Status | `components/roles/role-editor-modal.tsx` |
| Project access | `management` (all projects) / `user` (assigned projects only) | same |
| My Tasks | Yes / No | same |
| Team access | `management` / `member` | same |

The role editor also says: *"Planner and Agreements are accessible to all organization members."* The only validation is "Role name is required."

### Default roles (`INITIAL_ROLES`)
| Role | System role | Dashboard | Project | My Tasks | Team |
|---|---|---|---|---|---|
| Organization Owner | yes | Admin + My Status | management | yes | management |
| Project Manager | yes | Admin + My Status | management | yes | management |
| Team Lead | no | Admin + My Status | user | yes | member |
| Developer | no | My Status | user | yes | member |
| QA Tester | no | My Status | user | yes | member |

- System roles can be edited but not deleted.
- A role assigned to anyone cannot be deleted: *"This role is currently assigned to one or more active members. Reassign members before deleting."*
- Editing a role updates every user who has it immediately.
- **The Owner always has full access because they are the Owner (`isOwner`), whatever the Owner role's settings say.**

### Demo accounts (`DEMO_ACCOUNTS`, password `Demo123!`)
| Account | Email | Role | Assigned projects |
|---|---|---|---|
| Super Admin | superadmin@flashsign.com | – | – |
| Owner | owner@flashsign.com | Organization Owner | all |
| Project Manager | pm@flashsign.com | Project Manager | all |
| Team Lead | teamlead@flashsign.com | Team Lead | p1, p2, p3 |
| Developer | dev@flashsign.com | Developer | p1, p3, p5 |
| QA | qa@flashsign.com | QA Tester | p1, p4, p6 |

### Login (`app/(auth)/login/page.tsx`)
- A grid of the six accounts for 1-click login, plus an email and password form.
- There is **no sign-up link any more**.
- After login: Super Admin goes to `/super-admin`, a role whose default is My Status goes to `/projects/home`, and everyone else goes to `/dashboard`.
- The header's user menu has **"Switch Demo Persona"**, which changes account without logging out, and a Logout.

### Super Admin (`app/(workspace)/super-admin/page.tsx`)
**Navigation:** Admin Dashboard (`/super-admin`), Organizations, Invitations.

**Tabs:** Organizations, Invitations and Platform Overview, with search plus status and plan filters.

**Organisations:** name, slug, plan (Starter / Pro / Enterprise), industry, size, owner name and email, website, and status (active / pending / inactive).
- **Create Organization** asks for name, slug, plan, industry, initial status, owner name and owner email.
- **Invite Organization** asks for organisation name, owner email, plan and an onboarding note. The invitation is valid for 7 days. It can be resent; Revoke marks it expired.
- Each organisation can be viewed, edited (name, status, plan, owner name and email) and deleted (with a confirmation).

**Access:** the page is blocked for anyone who is not a Super Admin. A Super Admin is refused on every organisation page.

### Dashboards
- The sidebar shows **Admin Dashboard** (`/dashboard`) and/or **My Status** (`/projects/home`).
- `components/layout/dashboard-switcher.tsx` sits in the header and appears only when both are allowed.
- Each dashboard blocks roles without access to it.
- The Admin Dashboard's figures are **not** limited to assigned projects.

### Projects
- **Project list:** shows only accessible projects, titled "My Assigned Projects" for User Access.
- **Opening a project:** `projects/[projectId]/layout.tsx` blocks unassigned projects ("Project Access Restricted").
- **Creating a project:** `/projects/new` is blocked without Management Access.
- **Reports:** the Reports tab is hidden for User Access (`project-header-nav.tsx`) and `/projects/[projectId]/reports` is blocked.
- **Project Settings for User Access:** the page opens in **"View Only Mode"**. Configuration is read-only and the **Danger Zone is hidden**.
- **Project overview:** Duplicate and Archive are hidden for User Access.

### My Tasks
- The sidebar item and `/projects/my-tasks` follow the role's My Tasks setting.

### Team section
**Sidebar:**
- **Analytics** (`/teams`): Team Management only.
- **Members** (`/teams/members`): everyone.
- **Roles & Permissions** (`/teams/roles`): Team Management only.

**Blocked for Team Member roles:** `/teams`, `/teams/roles`, `/teams/new` and `/teams/members/new`.

**Members page:** Team Members see "Read-only" instead of the Edit and Remove buttons.

**Invite and edit dialogs:** a **Customized Role** select and, for User Access roles, **Assign Projects** checkboxes.

### Settings and AI Agent Hub
- **Settings:** the Preferences tab and page are Owner-only. The Users & Roles tab shows for Team Management.
- **AI Agent Hub:** the Organisation tab and page are Owner-only ("Owner Authority Required").

### Access Denied
`components/shared/access-denied.tsx` is shown **in place** on the blocked page; there is no separate route. It has:
- a title and a message;
- the permission that is needed;
- **Go Back**;
- a link to a sensible page.

### Planner and Agreements
Open to every organisation role; nothing restricts sending.

## What changed from the first version of this file

| Earlier version | Now (follows the frontend) |
|---|---|
| Super Admin page at `/admin` and `/admin/organizations` (proposed) | `/super-admin`, with Organizations / Invitations / Platform Overview tabs |
| Role View at `/teams/roles` (proposed) | `/teams/roles` is built; sidebar label **Roles & Permissions** |
| `/access-denied` page (proposed) | No route: an in-place Access Denied panel with Go Back and a link |
| Role name "QA" | **QA Tester**; Owner role is named **Organization Owner** |
| Owner role cannot be edited | Owner and Project Manager are **system roles**: editable, not deletable. The Owner keeps full access regardless. |
| "Duplicate role name" error | Not built; only "Role name is required." |
| Login: demo accounts replace the role switcher | Login has 1-click demo accounts **and** an email + password form. The header keeps a **Switch Demo Persona** menu. |
| User Access "is not read-only"; Danger Zone hidden | Project **Settings** are **view-only** for User Access and the Danger Zone is hidden. Duplicate and Archive are hidden on the overview. Project creation is blocked. Work inside the project (tasks, board, plan…) stays available. |
| N7: Admin Dashboard limited to assigned projects | **Not built.** Now an open decision (DEC-28) and a gap (G-03). |
| Organisation invitations: Pending / Accepted / Expired / Revoked | Organisation invitations: **Pending / Accepted / Expired** (Revoke sets Expired). Member invitations keep Pending / Accepted / Revoked (Expired is worked out from the date). |
| Super Admin "Create Organization" makes it Pending | The Super Admin picks the **initial status** (Active, Pending or Inactive) |

## Decisions these fixes assume

| # | Decision | Why |
|---|---|---|
| N1 | The Super Admin is separate from the Organization Owner. Organisations are created or invited by the Super Admin. The login page no longer offers sign-up; accounts come from an invitation. | Change request §2. The login page has no sign-up link. `/signup` and `/onboarding` still exist in code but are not linked (gap G-05). Matches `schema.txt` (`platform_admin`, `organization_invitation`). |
| N2 | The 12 fixed `DemoRole` personas are replaced by Owner-defined roles with four settings. Default roles: Organization Owner, Project Manager, Team Lead, Developer, QA Tester. | `lib/rbac.ts` `INITIAL_ROLES`. |
| N3 | Planner and **Agreements are open to every organisation role**, including sending signature requests. **This reverses decision D5** from round 1 ("Developers cannot send agreements"). | Change request §5.5–5.6 and the built frontend: nothing restricts sending. If you want to keep D5, skip V-34, the agreement row of V-45, and C-21. |
| N4 | Settings › Preferences and AI Agent Hub › Organisation are Owner-only. | `canAccessPreferences`, `canAccessAIOrganizationSettings`. |
| N5 | My Status is the existing `/projects/home` page, unchanged. The Admin Dashboard is `/dashboard`. | Change request §4.3; sidebar labels. |
| N6 | The prototype login has six demo accounts and a header "Switch Demo Persona" menu. Production login stays email + password. | `login/page.tsx`, `app-header.tsx`. |
| N7 | Owner and Project Manager are system roles: they can be edited but not deleted. No role can be deleted while assigned. The Owner always has full access. | `deleteRole` in `demo-auth-context.tsx`; the `isOwner` checks in `lib/rbac.ts`. |

---

# Part 1: v4.0 (`FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx`)

## V-19 New terms in 1.5 Definitions

**Where:** Section 1.5, the Term / Definition table. Add these rows in alphabetical order (right-click a row › Insert › Rows Below).

| Term | Definition |
|---|---|
| **Access Denied** | The panel shown in place of a page the user's role may not open. It names the missing permission and offers Go Back and a link to an allowed page. |
| **Admin Dashboard** | The organisation overview page (`/dashboard`), shown only to roles whose Dashboard Access includes it. |
| **Custom Role** | A role created in Team › Roles & Permissions by choosing Dashboard Access, Project Access, My Tasks access and Team Access. |
| **Danger Zone** | The Archive and Delete section of project Settings. Only roles with Project Management Access can see it. |
| **My Status** | The personal home dashboard (`/projects/home`): my work today, agent activity and deadlines. |
| **Organization Owner** | The one person who owns an organisation. Always has full access to its workspace, and is the only one who can open Settings › Preferences and AI Agent Hub › Organisation. |
| **Project Management Access** | Role setting: can see and fully manage every project in the organisation, including members, Reports, Settings and the Danger Zone. |
| **Project User Access** | Role setting: can see only the projects assigned to them and work inside them. Cannot create projects, change project Settings (view only), open project Reports or the Danger Zone. |
| **Super Admin** | Platform-level administrator who creates and invites organisations from the Super Admin Dashboard (`/super-admin`). Not a member of any organisation workspace. |
| **System Role** | A default role that can be edited but not deleted (Organization Owner, Project Manager). |
| **Team Management** | Role setting: full Team section access, including Analytics, member invite/edit/remove, Roles & Permissions and role assignment. |
| **Team Member** | Role setting: can view the organisation's members and their details only. |

## V-20 Product functions summary

**Where:** Section 2.3.

Find:
```text
Organization & Multi-Tenancy Management: Self-service registration, 4-step organization onboarding, workspace slug generation, and secure team invitation links.
```
Replace with:
```text
Organization & Multi-Tenancy Management: Super Admin Dashboard for creating, inviting and managing organisations; Owner onboarding; workspace slug generation; custom roles (dashboard, project, My Tasks and team access); member invitations with role and project assignment; and permission-checked navigation, pages and actions.
```

## V-21 User classes

**Where:** Section 2.4.

**1. Add a new first line** above `Executive / CEO: …`:
```text
Super Admin: Platform administrators who create organisations, invite their Owners, and manage each organisation's plan and status from a separate Super Admin Dashboard. They do not work inside organisation workspaces.
```

**2.** Find:
```text
Organization Administrator: System managers administering user rosters, invitation links, billing, security policies, and workspace preferences.
```
Replace with:
```text
Organization Owner: The owner of one organisation, with full access to its workspace. Creates and edits roles, invites members, assigns roles and projects, and alone manages organisation preferences and organisation-wide AI agent policy.
```

**3. Add after the Automated AI Coding Agent line**, as a new last line:
```text
The persona descriptions above describe typical users. What each person can open and do is decided by their organisation role (Section 2.5), not by their job title.
```

## V-22 Replace 2.5 User Roles and Permissions

**Where:** Section 2.5.

**Steps:**
1. Select from `The platform defines 12 distinct persona roles (DemoRole).` down to the last cell of the role table (`` `projects`, `ai-agents` ``, the `integration_service` row), just before the heading **2.6 Operating Environment**.
2. Delete it, and paste the text below in **Normal** style.
3. Build the two tables as Word tables in the same table style as the old one.

**New text:**
```text
FlashSign has two levels of administration and organisation roles defined by the Owner.

Super Admin (platform level): uses a separate Super Admin Dashboard (`/super-admin`) with its own navigation to view, create, edit and delete organisations, invite organisations (their Owner) to FlashSign, resend or revoke those invitations, and set each organisation's plan and status (Active, Pending, Inactive). A Super Admin is not a member of any organisation and cannot open organisation pages.

Organization Owner: each organisation has one Owner, who always has full access to the workspace.

Organisation roles: roles are created and edited in Team › Roles & Permissions (`/teams/roles`). Each role has a name, an optional description and four settings:
1. Dashboard Access — Admin Dashboard (with "Does this user also need access to My Status?" Yes or No) or My Status only. The first allowed dashboard opens after login; with both, a dashboard switcher is shown in the header.
2. Project Access — Management Access (every organisation project; create, edit, duplicate, archive and delete projects; manage members; project Reports; project Settings including the Danger Zone) or User Access (only assigned projects; work inside them on tasks, board, plan and files; project Settings are view-only; no project creation, Reports or Danger Zone).
3. My Tasks — Yes or No.
4. Team Access — Management (Team Analytics; invite, edit and remove members; Roles & Permissions; assign roles and projects) or Member (view members and member details only).

Every organisation role can use Planner and Agreements. Settings › Preferences and AI Agent Hub › Organisation are Owner-only. Every page, route and action checks these permissions; hiding a navigation link is never the only control (REQ-PLT-001). A blocked page shows an Access Denied panel naming the missing permission, with Go Back and a link to an allowed page.

Organization Owner and Project Manager are system roles: they can be edited but not deleted. A role assigned to anyone cannot be deleted until they are given another role. Changes to a role apply at once to everyone who has it.

Actor/Role lines in Section 4 name typical personas (e.g. CEO, Engineering Lead, Document Manager). They are examples; access is decided by the role settings above.
```

**Table 1: Default roles** (header row plus five rows):

| Role | Dashboard | Project Access | My Tasks | Team Access |
|---|---|---|---|---|
| Organization Owner (system) | Admin Dashboard + My Status | Management | Yes | Management |
| Project Manager (system) | Admin Dashboard + My Status | Management | Yes | Management |
| Team Lead | Admin Dashboard + My Status | User | Yes | Member |
| Developer | My Status | User | Yes | Member |
| QA Tester | My Status | User | Yes | Member |

**Table 2: Default dashboard** (header row plus three rows):

| Role configuration | Default dashboard | Other dashboard |
|---|---|---|
| Admin Dashboard + My Status: Yes | Admin Dashboard | My Status available (switcher shown) |
| Admin Dashboard + My Status: No | Admin Dashboard | Not available |
| My Status | My Status | Not available |

## V-23 FR-AUTH-001: accounts from an invitation

**Where:** Section 4.1.

**1. Heading.** Change `FR-AUTH-001: User Registration & Account Creation` to `FR-AUTH-001: Account Creation from an Invitation`. Keep the `[PHASE 1] ` prefix.

**2. Steps:** Select the bullets from `Requirement Name: Self-Service User Sign-up` to `Acceptance Criteria: The system successfully creates the account, enforces password constraints, and halts progression until verification or onboarding is complete.`, and replace them with:
```text
Requirement Name: Account Creation from an Invitation
Description: The system shall create a user account only from a valid invitation: an organisation invitation sent by a Super Admin to the organisation's Owner (FR-AUTH-009), or a member invitation sent by the Owner or a Team Management role (FR-AUTH-004). The login page offers no open sign-up.
Actor/Role: Invited Owner or Invited Member
Preconditions: The visitor holds a pending, unexpired invitation link.
Trigger: Opening the invitation link (`/invite/[token]`).
Main Flow:
The visitor opens the invitation link; the system shows the organisation name and, for a member invitation, the assigned role.
The visitor enters Full Name and Password (email is fixed by the invitation).
The system validates input formats (email regex, password length $\ge 8$ chars, password bytes $\le 72$).
The system creates the account, verifies the email address by the invitation itself or by a 6-digit OTP (FR-AUTH-002), and links the account to the organisation.
An invited Owner continues to organisation setup (FR-AUTH-003); an invited member lands on their role's default dashboard (FR-AUTH-010).
Alternative/Error Flow:
Login Without an Account: Signing in with an email that has a pending invitation shows: \"You haven't joined <organisation> yet. Open the invitation link in your email to create your account.\"
Existing Email: If the email already has an account, the visitor signs in and the invitation is attached to that account.
Prototype State: The login page has no sign-up link. The older `/signup`, `/register` and onboarding routes still exist in code but are not linked, and are to be removed or limited to invitation links.
Postconditions: A user account exists and belongs to the inviting organisation.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/app/(auth)/login/page.tsx`, `flash-sign-proto/src/app/(auth)/invite/[token]/page.tsx`, `flash-sign-proto/src/context/demo-auth-context.tsx` (`login`, `acceptInvitation`); `schema.txt` (`organization_invitation`, `invitation`, `invitation_project`).
Implementation Status: Partially Implemented (prototype: member invitations work in mock state; organisation invitations are not yet linked to account creation).
Acceptance Criteria: No account or organisation can be created without a valid invitation; accepted invitations join the correct organisation with the invited role.
```

## V-24 FR-AUTH-003: Owner sets up the organisation

**Where:** FR-AUTH-003.

**1.** Find:
```text
Description: The system shall guide a newly registered user through a 4-step onboarding wizard to establish their primary organization workspace.
```
Replace with:
```text
Description: The system shall guide an Organization Owner, after accepting the Super Admin's organisation invitation, through a 4-step onboarding wizard to complete their organisation workspace.
```

**2.** Find:
```text
Preconditions: User is authenticated but `organizationSetupCompleted` is false.
```
Replace with:
```text
Preconditions: User is authenticated as the Owner of an organisation that a Super Admin created or invited (FR-AUTH-009), and `organizationSetupCompleted` is false.
```

**3.** Find:
```text
Postconditions: Organization workspace record is initialized and user is assigned the `ceo` / owner role.
```
Replace with:
```text
Postconditions: Organization workspace is completed, its status becomes Active, the user holds the Organization Owner role, and the default roles (Project Manager, Team Lead, Developer, QA Tester) are available for the Owner to adjust.
```

**4. Add a bullet** after the Main Flow bullet `Step 1 (Organization Info): …`:
```text
Fields the Super Admin already entered (name, slug, plan, industry) are pre-filled and can be changed.
```

**5.** Find:
```text
Implementation Status: Implemented (Client-side interactive wizard persisted to localStorage).
```
(It is the `Implementation Status` line of FR-AUTH-003.) Replace with:
```text
Implementation Status: Partially Implemented (the wizard exists; it is not yet started from a Super Admin organisation invitation).
```

## V-25 FR-AUTH-004: invite with a custom role and projects

**Where:** FR-AUTH-004.

**1.** Find:
```text
Description: The system shall allow Organization Administrators and Owners to invite team members via email with pre-assigned roles, allowing invitees to join via a secure token link without creating an organization.
```
Replace with:
```text
Description: The system shall allow the Organization Owner and Team Management roles to invite members by email with one of the organisation's roles and, for roles with Project User Access, the projects assigned to them, allowing invitees to join via a secure token link without creating an organization.
```

**2.** Find:
```text
Actor/Role: Org Admin / CEO (Sender); Invited User (Recipient)
```
Replace with:
```text
Actor/Role: Organization Owner or Team Management role (Sender); Invited User (Recipient)
```

**3.** Find:
```text
Preconditions: Inviting user possesses administrative permissions.
```
Replace with:
```text
Preconditions: Inviting user's role has Team Management access. Team Member roles see no invite action, and `/teams/members/new` shows Access Denied.
```

**4.** Find:
```text
Admin inputs invitee Email, Full Name, assigned `DemoRole`, Job Title, Department, and optional custom message.
```
Replace with:
```text
Sender inputs invitee Name, Email, a Customized Role (each option shows whether it gives All Projects or User Access), Job Title, Department and optional message; if the role has Project User Access, the sender ticks the assigned projects.
```

**5. Add a bullet** under **Alternative/Error Flow**, after the `Revoked Token: …` bullet:
```text
Already a Member or Already Invited: \"<email> already has a pending invitation. Resend it from the Invited tab.\" Invitation states: Pending, Accepted, Revoked; Expired is shown when a pending invitation passes its expiry. The prototype sends no email.
```

**6.** Find:
```text
Implementation Status: Implemented (Full UI and validation flow present in prototype).
```
Replace with:
```text
Implementation Status: Partially Implemented (the invite dialog collects the role and projects, but the prototype does not yet store them on the invitation; on acceptance the old role mapping is used).
```

## V-26 FR-AUTH-005: land on the right dashboard; demo login; logout

**Where:** FR-AUTH-005.

**1.** Find:
```text
generates an `httpOnly` JWT cookie (`flash_sign_token`), and redirects to `/dashboard` (or `?next=` destination).
```
Replace with:
```text
generates an `httpOnly` JWT cookie (`flash_sign_token`), and redirects a Super Admin to `/super-admin` and anyone else to their default dashboard (`/dashboard` or `/projects/home`, FR-AUTH-010), or to the `?next=` destination if the user may open it.
```

**2. Add a bullet** after the Main Flow bullet that starts `If \"Remember Me\" is selected`:
```text
Logout ends the session and returns the user to `/login`. In the prototype, the login page also offers six demo accounts (FR-AUTH-008); the email and password form accepts their emails with the password `Demo123!`.
```

## V-27 FR-AUTH-007: permission-based navigation and route protection

**Where:** FR-AUTH-007.

**1. Heading.** Change `FR-AUTH-007: Role-Based Navigation & Page Access Control` to `FR-AUTH-007: Permission-Based Navigation & Route Protection`.

**2. Steps:** Select the bullets from `Requirement Name: RBAC Navigation Gating` to `Acceptance Criteria: Each role accesses only designated views; unauthorized navigation links are hidden from DOM.`, and replace them with:
```text
Requirement Name: Permission-Based Navigation & Route Protection
Description: The system shall decide navigation items, pages, routes and actions (create, edit, delete, view) from the signed-in user's permissions: Super Admin or organisation member, Owner, Dashboard Access, Project Access and assigned projects, My Tasks access and Team Access (Section 2.5), using one central set of permission checks.
Actor/Role: Any authenticated user
Preconditions: User holds an active session.
Trigger: Rendering the sidebar, opening any page, or showing any action.
Main Flow:
A Super Admin sees only the Super Admin navigation: Admin Dashboard (`/super-admin`), Organizations and Invitations.
For organisation users the sidebar shows: Admin Dashboard and/or My Status as their role allows; Projects; My Tasks only if allowed; Planning; the Agreements section; in Team, Analytics and Roles & Permissions only for Team Management, and Members for everyone; AI Agent Hub; Settings.
Inside AI Agent Hub the Organisation tab appears only for the Owner; inside Settings the Preferences tab appears only for the Owner and Users & Roles only for Team Management.
Every restricted page checks the same permissions before rendering: Admin Dashboard, My Status, My Tasks, project creation, unassigned projects, project Reports, the project Danger Zone, Team Analytics, Roles & Permissions, team and member creation, Settings › Preferences, AI Agent Hub › Organisation and the Super Admin Dashboard.
For a project page the system checks both the user's Project Access and, for User Access, that the project is in their assigned projects.
Action buttons (create, edit, duplicate, archive, delete, invite) appear only when the user's permissions allow them; otherwise the page shows the data read-only.
Alternative/Error Flow:
Unauthorized Access Attempt: Opening a restricted URL shows an Access Denied panel in place of the page, naming the missing permission, with Go Back and a link to an allowed page.
Postconditions: The interface and routes reflect the user's current permissions; a role change applies immediately.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/lib/rbac.ts`, `flash-sign-proto/src/components/layout/app-sidebar.tsx`, `flash-sign-proto/src/components/shared/access-denied.tsx`, `flash-sign-proto/src/app/(workspace)/projects/[projectId]/layout.tsx`.
Implementation Status: Implemented (prototype, mock data; client-side checks only).
Acceptance Criteria: For each demo account, every restricted page listed in the Main Flow is hidden from navigation and shows Access Denied by direct URL; allowed pages open.
```

## V-28 FR-AUTH-008: demo accounts and persona switcher

**Where:** FR-AUTH-008.

**1. Heading.** Change `FR-AUTH-008: Demo Persona Switcher` to `FR-AUTH-008: Demo Accounts and Persona Switcher (Prototype)`.

**2. Steps:** Select the bullets from `Requirement Name: Interactive Role Persona Switching` to ``Acceptance Criteria: Toggling persona updates `currentUserId`, navigation permissions, and header badges without page reload.``, and replace them with:
```text
Requirement Name: Demo Accounts and Persona Switcher (Prototype)
Description: For prototype demonstrations, the login page shall list six demo accounts (Super Admin, Owner, Project Manager, Team Lead, Developer, QA), each with predefined mock permissions and project assignments, and the header user menu shall let evaluators switch between them without logging out.
Actor/Role: Demonstration Evaluator
Preconditions: Prototype build.
Trigger: Selecting a demo account on `/login`, or choosing an account under Switch Demo Persona in the header user menu.
Main Flow:
The login page shows each demo account with name, role and what it can access; one click signs in. The email and password form is pre-filled with the selected account (password `Demo123!`).
The system signs in as that user with their role's permissions and assigned projects (Team Lead: 3 projects, Developer: 3, QA: 3, each a different set).
The system opens the user's starting page (FR-AUTH-005) and builds the sidebar from their permissions (FR-AUTH-007).
Switch Demo Persona in the header changes account immediately; Logout returns to `/login`.
Alternative/Error Flow:
None.
Postconditions: The selected demo user and their permissions are available throughout the app.
Priority: Could Have (Prototype/Demo capability)
Source Evidence: `flash-sign-proto/src/app/(auth)/login/page.tsx`, `flash-sign-proto/src/components/layout/app-header.tsx`, `flash-sign-proto/src/lib/rbac.ts` (`DEMO_ACCOUNTS`).
Implementation Status: Implemented (replaces the sidebar role switcher, `FEATURES.roleSwitcher`).
Acceptance Criteria: Each of the six accounts signs in, lands on its starting page and sees only its permitted navigation; switching accounts updates navigation immediately.
```

## V-29 New FR-AUTH-009: Super Admin Dashboard

**Where:** Insert after the last FR-AUTH-008 bullet (`Acceptance Criteria: Each of the six accounts signs in…`), before **4.2 Module 2**.

Heading (**Heading 3**):
```text
[PHASE 1] FR-AUTH-009: Super Admin Dashboard & Organization Management
```
Bullets (**List Bullet**):
```text
Requirement ID: FR-AUTH-009
Requirement Name: Super Admin Dashboard & Organization Management
Description: The system shall provide Super Admins with a separate dashboard and navigation to view, create, edit and delete organisations, invite organisations (their Owner) to FlashSign, manage those invitations, and set each organisation's plan and status.
Actor/Role: Super Admin
Preconditions: User is signed in as a Super Admin.
Trigger: Opening the Super Admin Dashboard (`/super-admin`).
Main Flow:
The dashboard shows summary figures and three tabs: Organizations, Invitations and Platform Overview.
Organizations lists every organisation with name, slug, owner, plan (Starter, Pro, Enterprise), industry, size, members, projects and status (Active, Pending, Inactive), with search and status and plan filters.
Create Organization: Super Admin enters organisation name, workspace slug, plan, industry, initial status, and the Owner's full name and email.
Invite Organization: Super Admin enters organisation name, Owner email, plan and an optional onboarding note; the invitation is Pending and valid for 7 days.
Invitations lists organisation invitations (Pending, Accepted, Expired); a Super Admin can resend one (new 7-day expiry) or revoke it (it becomes Expired).
Each organisation can be viewed, edited (name, status, plan, Owner name and email) or deleted after confirmation.
Alternative/Error Flow:
Non-Super-Admin Access: Any other user opening `/super-admin` sees Access Denied (\"Super Admin Authorization Required\").
Postconditions: Organisation records and organisation invitations are created or updated.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/app/(workspace)/super-admin/page.tsx`, `flash-sign-proto/src/context/demo-auth-context.tsx` (`createSuperAdminOrg`, `inviteSuperAdminOrg`, `resendSuperAdminOrgInvite`, `revokeSuperAdminOrgInvite`); `schema.txt` (`platform_admin`, `organization_invitation`, `organization.status`).
Implementation Status: Implemented (prototype, mock data; organisations here are not yet linked to real workspaces or Owner accounts).
Acceptance Criteria: A Super Admin can create, invite, edit and delete organisations and see their status; a Super Admin cannot open organisation pages; organisation users cannot open the Super Admin Dashboard.
```

## V-30 New FR-AUTH-010: Dashboard access and switching

**Where:** Insert after FR-AUTH-009's last bullet.

Heading:
```text
[PHASE 1] FR-AUTH-010: Dashboard Access & Switching
```
Bullets:
```text
Requirement ID: FR-AUTH-010
Requirement Name: Dashboard Access & Switching
Description: The system shall give each user the dashboards their role allows (Admin Dashboard at `/dashboard`, My Status at `/projects/home`), open the default one after login, and show a dashboard switcher in the header only when both are allowed.
Actor/Role: Any organisation user
Preconditions: User's role has Dashboard Access set (Section 2.5).
Trigger: Login, or selecting a dashboard in the header switcher or the sidebar.
Main Flow:
Admin Dashboard + My Status: Yes → default Admin Dashboard; switcher and both sidebar items shown.
Admin Dashboard + My Status: No → Admin Dashboard only; no switcher.
My Status only → default My Status; Admin Dashboard is hidden and blocked.
Alternative/Error Flow:
Opening a dashboard the role does not allow shows Access Denied (\"Admin Dashboard Restricted\" or \"My Status Restricted\") with a link to the allowed dashboard.
Postconditions: User sees only their allowed dashboards.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/components/layout/dashboard-switcher.tsx`, `flash-sign-proto/src/app/(workspace)/dashboard/page.tsx`, `flash-sign-proto/src/app/(workspace)/projects/home/page.tsx` (My Status, unchanged).
Implementation Status: Implemented (prototype). Open: whether Admin Dashboard figures should be limited to assigned projects for User Access roles (DEC-28).
Acceptance Criteria: Owner, Project Manager and Team Lead land on the Admin Dashboard and can switch to My Status; Developer and QA Tester land on My Status and cannot open `/dashboard`.
```

## V-31 Project requirements: who may manage projects

**1. FR-PROJ-001.** Find:
```text
Actor/Role: Project Manager, Product Owner, CEO, Org Admin
Preconditions: User belongs to the active organization and possesses project creation permissions.
```
Replace with:
```text
Actor/Role: Users whose role has Project Management Access (Organization Owner and Project Manager by default)
Preconditions: User belongs to the active organization and their role has Project Management Access. Others do not see New Project, and `/projects/new` shows Access Denied (\"Project Creation Restricted\").
```

**2. FR-PROJ-002.** Find:
```text
Actor/Role: Authenticated User with Project Access
```
Replace with:
```text
Actor/Role: Authenticated user with access to the project (Project Management Access: any project; Project User Access: assigned projects only, FR-PROJ-010). Duplicate and Archive actions appear only for Project Management Access.
```

**3. FR-PROJ-006.** Find:
```text
Actor/Role: Project Manager, Org Admin, CEO
Preconditions: Project exists.
Trigger: User selects \"Archive Project\" from project menu.
```
Replace with:
```text
Actor/Role: Users whose role has Project Management Access
Preconditions: Project exists.
Trigger: User selects Archive on the project overview, or Archive or Delete in the Danger Zone of project Settings (`/projects/[projectId]/settings`).
```
Then add this bullet after `Alternative/Error Flow:`:
```text
Project User Access: Archive is not shown on the overview and the Danger Zone is not shown in Settings (FR-PROJ-010).
```

**4. FR-PROJ-009.** Find:
```text
Description: The system shall provide real-time debounced search, status filtering, category grouping, and sorting across the organization's project portfolio.
```
Replace with:
```text
Description: The system shall provide real-time debounced search, status filtering, category grouping, and sorting across the projects the user may see: every organisation project for Project Management Access (\"All Projects\"), and assigned projects only for Project User Access (\"My Assigned Projects\").
```

## V-32 New FR-PROJ-010: Project access scope

**Where:** Insert after FR-PROJ-009's last bullet, before **4.3 Module 3**.

Heading:
```text
[PHASE 1] FR-PROJ-010: Project Access Scope (Management and User Access)
```
Bullets:
```text
Requirement ID: FR-PROJ-010
Requirement Name: Project Access Scope (Management and User Access)
Description: The system shall limit what a user can see and do in projects according to their role's Project Access and, for User Access, their assigned projects.
Actor/Role: Any organisation user
Preconditions: User's role has Project Access set (Section 2.5); User Access users have assigned projects (FR-AUTH-004, FR-TEAM-008).
Trigger: Opening the project list or any project page.
Main Flow:
Management Access: the user sees every organisation project and can create, edit, duplicate, archive and delete projects, manage details, plan levels, tasks and project members, open project Reports (`/projects/[projectId]/reports`) and change project Settings including the Danger Zone.
User Access: the user sees only assigned projects. Inside them, they can work on the project's tasks, board, plan, timeline, sprints, files, activity and Team Work (`/projects/[projectId]/team`).
User Access users cannot create projects, do not see Duplicate or Archive, do not see the Reports tab, see project Settings in View Only Mode (read-only, no Danger Zone).
Alternative/Error Flow:
Unassigned Project: Opening an unassigned project by URL shows Access Denied (\"Project Access Restricted\").
Project Reports: Opening `/projects/[projectId]/reports` without Management Access shows Access Denied (\"Project Reports Restricted\").
Postconditions: Project data outside the user's scope is never shown in project pages.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/lib/rbac.ts` (`canAccessProject`, `canManageProjects`, `canViewProjectReports`, `canAccessProjectDangerZone`), `flash-sign-proto/src/app/(workspace)/projects/[projectId]/layout.tsx`, `…/[projectId]/settings/page.tsx`, `…/[projectId]/reports/page.tsx`, `flash-sign-proto/src/components/projects/project-header-nav.tsx`.
Implementation Status: Implemented (prototype, mock project assignments).
Acceptance Criteria: Team Lead, Developer and QA Tester see only their assigned projects, can work inside them, see Settings read-only, and are blocked from Reports, the Danger Zone, project creation and unassigned projects; Project Manager can create, edit and delete any project.
```

## V-33 FR-TASK-012: My Tasks is a role setting

**Where:** FR-TASK-012.

Find:
```text
Actor/Role: Authenticated User (Developer, QA Tester, Lead)
```
Replace with:
```text
Actor/Role: Users whose role has My Tasks access (all default roles)
```
Add this bullet after `Alternative/Error Flow:`:
```text
No My Tasks Access: My Tasks is hidden from the sidebar and `/projects/my-tasks` shows Access Denied (\"My Tasks Restricted\").
```

## V-34 Agreements are open to every organisation role (decision N3)

**Skip this fix if you keep decision D5.**

**1. FR-SIGN-001.** Find:
```text
Actor/Role: Document Manager, Project Manager, CEO
Preconditions: User possesses agreement creation permissions.
```
Replace with:
```text
Actor/Role: Any organisation user
Preconditions: User is a member of the organisation. Agreements has no role-level restriction (DEC-27).
```

**2. FR-SIGN-006.** Find:
```text
Description: The system shall allow authorized executive roles (e.g., `ceo`, `org_admin`) to stamp official corporate seals on agreements
```
Replace with:
```text
Description: The system shall allow the roles chosen on each seal (e.g., Organization Owner, Project Manager) to stamp official corporate seals on agreements
```

## V-35 FR-AGENT-008: Owner only

**Where:** FR-AGENT-008.

Find:
```text
Actor/Role: Org Admin, CEO
Preconditions: Admin access to Organization settings.
```
Replace with:
```text
Actor/Role: Organization Owner
Preconditions: User is the Organization Owner. The Organisation tab of AI Agent Hub is hidden from all other roles and `/ai-agents/organisation` shows Access Denied (\"Owner Authority Required\"); other AI Agent Hub tabs stay available.
```

## V-36 Team requirements: Team Management vs Team Member

**1. FR-TEAM-001.** Find (the first `Actor/Role` line after the FR-TEAM-001 heading):
```text
Actor/Role: Org Admin, Project Manager, Engineering Lead
```
Replace with:
```text
Actor/Role: Users whose role has Team Management access (others see Access Denied on `/teams/new`)
```

**2. FR-TEAM-002.** Find:
```text
Actor/Role: Org Admin, Team Member (Self)
```
Replace with:
```text
Actor/Role: Team Management roles (any member); every user (their own profile)
```

**3. FR-TEAM-007.** Add this bullet after `Alternative/Error Flow:`:
```text
Team Member roles can view the member list and member details; instead of Edit and Remove they see \"Read-only\".
```

## V-37 New FR-TEAM-008 and FR-TEAM-009

**Where:** Insert after FR-TEAM-007's last bullet, before **4.10 Module 10**.

**FR-TEAM-008**

Heading:
```text
[PHASE 1] FR-TEAM-008: Team Access Levels and Member Management
```
Bullets:
```text
Requirement ID: FR-TEAM-008
Requirement Name: Team Access Levels and Member Management
Description: The system shall give Team Management roles full control of the Team section and give Team Member roles a view of the organisation's members only.
Actor/Role: Organization Owner; Team Management roles; Team Member roles
Preconditions: User's role has Team Access set (Section 2.5).
Trigger: Opening Team › Analytics (`/teams`), Members (`/teams/members`) or Roles & Permissions (`/teams/roles`).
Main Flow:
Team Management: sees Analytics, Members and Roles & Permissions; can invite (FR-AUTH-004), create, edit and remove members; can change a member's Customized Role and, for Project User Access roles, their assigned projects; can view, create, edit and delete roles (FR-TEAM-009).
Changing a member's role or projects applies their new permissions immediately.
Team Member: sees Members only, with member details read-only.
Removing a member asks for confirmation; each action shows a success or error message.
Alternative/Error Flow:
A Team Member opening `/teams`, `/teams/roles`, `/teams/new` or `/teams/members/new` sees Access Denied.
Postconditions: Member records, roles and assignments are updated.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/app/(workspace)/teams/members/page.tsx`, `flash-sign-proto/src/components/collaboration/create-member-dialog.tsx`, `flash-sign-proto/src/components/members/invite-member-dialog.tsx`, `flash-sign-proto/src/context/demo-auth-context.tsx` (`updateMemberRoleAndProjects`).
Implementation Status: Implemented (prototype, mock data).
Acceptance Criteria: Owner and Project Manager can perform every Team action; Team Lead, Developer and QA Tester see only Members, read-only, and cannot reach Analytics, Roles & Permissions or any create, edit or delete action.
```

**FR-TEAM-009**

Heading:
```text
[PHASE 1] FR-TEAM-009: Custom Role Creation and Editing
```
Bullets:
```text
Requirement ID: FR-TEAM-009
Requirement Name: Custom Role Creation and Editing
Description: The system shall let the Organization Owner and Team Management roles view, create, edit and delete organisation roles, each defined by Basic Information, Dashboard Access, Project Access, My Tasks access and Team Access.
Actor/Role: Organization Owner; Team Management roles
Preconditions: User's role has Team Management access.
Trigger: Create Custom Role, or Edit on a role card, in Team › Roles & Permissions (`/teams/roles`).
Main Flow:
Basic Information: Role Name (required) and Role Description (optional).
Dashboard Access: Admin Dashboard or My Status. Choosing Admin Dashboard reveals \"Does this user also need access to My Status?\" — Yes (both dashboards via the switcher) or No (Admin Dashboard only). Choosing My Status makes it the default dashboard.
Project Access: Management Access or User Access, each with a short explanation (FR-PROJ-010).
My Tasks: \"Does this role need access to My Tasks?\" Yes (shown in sidebar, route allowed) or No (hidden and blocked).
Team Access: Management or Member, each with a short explanation (FR-TEAM-008).
The form notes that Planner and Agreements are available to every organisation member.
Saving stores the role; editing shows the role's current settings; the page lists every role with its settings and marks system roles.
Users holding an edited role receive the new permissions immediately.
Alternative/Error Flow:
Missing Role Name: \"Role name is required.\"
System Role: Organization Owner and Project Manager can be edited but not deleted (\"System standard roles cannot be deleted.\").
Role In Use: \"This role is currently assigned to one or more active members. Reassign members before deleting.\"
Deleting a role asks for confirmation.
Postconditions: Role saved and available in invitations and member role assignment.
Priority: Must Have
Source Evidence: `flash-sign-proto/src/app/(workspace)/teams/roles/page.tsx`, `flash-sign-proto/src/components/roles/role-editor-modal.tsx`, `flash-sign-proto/src/context/demo-auth-context.tsx` (`createRole`, `updateRole`, `deleteRole`); `schema.txt` (`role`, `role_template`).
Implementation Status: Implemented (prototype, mock data).
Acceptance Criteria: The Owner creates a role with My Status only, My Tasks No, Project User Access and Team Member; a user given that role lands on My Status, has no My Tasks, sees only assigned projects and has Team Member restrictions.
```

## V-38 Settings requirements

**1. FR-SETT-001.** Find:
```text
Actor/Role: Org Admin, CEO
Preconditions: Administrative permissions.
Trigger: Updating organization form in `/settings/preferences` or `/settings/profile`.
```
Replace with:
```text
Actor/Role: Organization Owner
Preconditions: User is the Organization Owner. The Preferences tab is hidden from all other roles and `/settings/preferences` shows Access Denied (\"Owner Authority Required\"); other Settings pages keep their existing rules.
Trigger: Updating the organisation form in `/settings/preferences`.
```

**2. FR-SETT-002.** Change the heading `FR-SETT-002: Member Role Administration & Seat Management` to `FR-SETT-002: Member Role Assignment & Deactivation`. Then:

Find:
```text
Description: The system shall permit administrators to reassign user roles (`DemoRole`), update job titles and departments, or deactivate departing team members.
Actor/Role: Org Admin
Preconditions: Admin access to `/settings/users`.
```
Replace with:
```text
Description: The system shall permit the Owner and Team Management roles to change a member's organisation role, update assigned projects, job titles and departments, or deactivate or remove departing members.
Actor/Role: Organization Owner; Team Management roles
Preconditions: User's role has Team Management access (Team › Members, or the Users & Roles tab in Settings).
```
Find:
```text
Admin changes Role dropdown (e.g., from `developer` to `engineering_lead`).
```
Replace with:
```text
Admin changes the Customized Role to another organisation role (e.g., from Developer to Team Lead) and, for Project User Access roles, updates the assigned projects.
```
Find:
```text
Self-Deactivation: System prevents an admin from deactivating their own account or revoking their own admin role.
```
Replace with:
```text
Self-Deactivation: System prevents a user from deactivating their own account or removing their own Team Management access. The Owner keeps full access whatever role settings change.
```

**3. FR-SETT-003.** Find:
```text
Admin selects role checkboxes for authorized application (e.g., `ceo`, `org_admin`).
```
Replace with:
```text
Admin selects the organisation roles allowed to apply the seal (e.g., Organization Owner, Project Manager).
```

**4. FR-SETT-006.** Find:
```text
System re-hydrates state from `mock-data.ts` and resets active role to `FIXED_DEMO_ROLE`.
```
Replace with:
```text
System re-hydrates state from `mock-data.ts`, restores the default roles, demo accounts and Super Admin organisations, and signs out to the demo login page.
```

## V-39 Entity 1 `User`: role

**Where:** Section 7.1, Entity 1 `User`, row `role`.
- Change the first cell `role` to `roleId`.
- Change the type cell `` enum (DemoRole) `` to `` string (Role ID) ``.
- Change the last cell `` One of 12 system roles (`ceo`, `project_manager`, `developer`, etc.). `` to:

```text
The user's organisation role (Section 2.5). Users also carry isOwner, isSuperAdmin and, for Project User Access, assignedProjectIds. Super Admins have no organisation role.
```

## V-40 UC-01: organisation set up through the Super Admin

**Where:** Section 8.1.

**Steps:** Select the bullets from `Primary Actor: Organization Owner / CEO` to `Related Requirements: FR-AUTH-001, FR-AUTH-003, FR-AUTH-004, FR-AUTH-007.` and replace them with:
```text
Primary Actor: Super Admin; Organization Owner
Supporting Actors: Invited Team Member, System Mailer
Preconditions: A Super Admin is signed in.
Trigger: Super Admin selects Invite Organization on the Super Admin Dashboard (`/super-admin`).
Main Success Scenario:
Super Admin enters organisation name (\"Acme Corp\"), the Owner's email and the plan; the invitation shows as Pending.
Owner opens the invitation, creates their account and completes onboarding; the organisation becomes Active.
Owner lands on the Admin Dashboard and opens Team › Roles & Permissions.
Owner creates the role \"Contractor\": My Status only, Project User Access, My Tasks Yes, Team Member.
Owner opens Team › Members, clicks \"Invite Member\", enters name and email (\"dev@acme.com\"), selects \"Contractor\" and ticks two projects.
System creates the invitation (Pending) and sends the link (`/invite/[token]`).
The member accepts, lands on My Status, and sees only the two assigned projects.
Alternative Flows:
Expired Invite: If the member opens the invitation after 7 days, the system shows \"Invite Expired\" with a button to request a new invitation.
Related Requirements: FR-AUTH-001, FR-AUTH-003, FR-AUTH-004, FR-AUTH-007, FR-AUTH-009, FR-AUTH-010, FR-TEAM-008, FR-TEAM-009.
```

## V-41 New business rules BR-12 and BR-13

**Where:** Section 9.1. Insert after BR-11's `Source: …` bullet, before **9.2 Architectural and Operational Constraints**. Use **Heading 4** for the rule names and **List Bullet** for the text, like BR-11.

```text
BR-12: Assigned-Project Scope
Rule Statement: A user whose role has Project User Access may open and act only on projects assigned to them. They cannot create projects, change project Settings, open project Reports or use the Danger Zone.
Source: `flash-sign-proto/src/lib/rbac.ts` (`canAccessProject`, `canManageProjects`).
BR-13: Owner-Only Organisation Settings
Rule Statement: Only the Organization Owner may open Settings › Preferences and AI Agent Hub › Organisation. The Owner always has full workspace access, whatever the settings of the Organization Owner role.
Source: `flash-sign-proto/src/lib/rbac.ts` (`canAccessPreferences`, `canAccessAIOrganizationSettings`).
```

## V-42 Traceability matrix rows

**Where:** Section 10.2.

**1. Add five rows**, each after the last row of its module:

| Req ID | Requirement Summary | Source Code Reference | Verification Method | Acceptance Test ID | Status |
|---|---|---|---|---|---|
| **FR-AUTH-009** | Super Admin Dashboard & Organization Management | `src/app/(workspace)/super-admin/page.tsx` | T, D | TC-AUTH-09 | Implemented (mock) |
| **FR-AUTH-010** | Dashboard Access & Switching | `src/components/layout/dashboard-switcher.tsx` | T, D | TC-AUTH-10 | Implemented |
| **FR-PROJ-010** | Project Access Scope | `src/lib/rbac.ts`, `src/app/(workspace)/projects/[projectId]/layout.tsx` | T, D | TC-PROJ-10 | Implemented |
| **FR-TEAM-008** | Team Access Levels and Member Management | `src/app/(workspace)/teams/members/page.tsx` | T, D | TC-TEAM-08 | Implemented |
| **FR-TEAM-009** | Custom Role Creation and Editing | `src/app/(workspace)/teams/roles/page.tsx` | T, D | TC-TEAM-09 | Implemented |

**2. Change these existing rows:**

| Row | Requirement Summary | Source Code Reference |
|---|---|---|
| **FR-AUTH-007** | `Permission-Based Navigation & Route Protection` | `src/lib/rbac.ts` |
| **FR-AUTH-008** | `Demo Accounts and Persona Switcher (Prototype)` | `src/app/(auth)/login/page.tsx` |

## V-43 Route inventory

**Where:** Section 12.2.

**1. Change these Access Control cells:**

| Route | Old Access Control | New Access Control |
|---|---|---|
| `/login` | `Public (Guest)` | `Public (Guest); six demo accounts and email/password` |
| `/dashboard` | `Protected (RBAC)` | `Admin Dashboard access` |
| `/projects/home` | `Protected` | `My Status access` |
| `/my-tasks` | `Protected` | `My Tasks access` |
| `/projects/[projectId]/settings` | `Role: PM / Admin` | `Project access; editing and Danger Zone: Project Management Access` |
| `/teams` | `Protected` | `Team Management access (Team Analytics)` |
| `/teams/members` | `Protected` | `Any organisation user (view); Team Management (invite, edit, remove)` |
| `/settings/users` | `Role: Org Admin` | `Team Management access` |
| `/ai-agents/organisation` | `Role: Admin / CEO` | `Organization Owner only` |

**2. Change one description cell:** for `/dashboard`, change `Executive portfolio overview & health distribution` to `Admin Dashboard: organisation overview & health distribution`.

**3. Add these rows** at the end of the table:

| Route | Purpose | Access Control |
|---|---|---|
| `/super-admin` | Super Admin Dashboard: Organizations, Invitations, Platform Overview | Super Admin only |
| `/teams/roles` | Roles & Permissions: list, create, edit, delete roles | Team Management access |
| `/settings/preferences` | Organisation preferences | Organization Owner only |
| `/projects/new` | New Project wizard | Project Management Access |
| `/projects/[projectId]/reports` | Project reports | Project Management Access |
| `/projects/[projectId]/team` | Team Work for the project | Project access (assigned projects for User Access) |
| `/projects/my-tasks` | My Tasks (sidebar link) | My Tasks access |

## V-44 Decisions register

**Where:** Section 12A, after DEC-25. Add three paragraphs in the same style:

```text
DEC-26 — Access model: Resolved: the 12 fixed persona roles are replaced by a Super Admin (platform level), one Organization Owner per organisation, and roles built from Dashboard Access, Project Access, My Tasks and Team Access (Section 2.5). Default roles: Organization Owner and Project Manager (system roles), Team Lead, Developer, QA Tester. Organisations are created or invited by the Super Admin; the login page has no open sign-up.
DEC-27 — Agreements and Planner access: Resolved: every organisation role can open and use Planner and Agreements, including preparing and sending signature requests. This replaces the earlier rule that developers could not send agreements. Company seals keep their own per-seal role list (FR-SETT-003).
DEC-28 — Dashboard scope for User Access: Open: the Admin Dashboard shows organisation-wide figures to every role that has it, including Team Lead (Project User Access). Decide whether its figures should be limited to the user's assigned projects.
```

## V-45 Annex B §1.4 Personas and permissions

**Where:** Annex B, §1.4 Personas and permissions.

**Steps:**
1. Select from the first table's header cell `Persona` down to the sentence `Developers can sign documents addressed to them but cannot prepare or send agreements (FR-SIGN-001, Annex C §4).`. **Do not** select the REQ-PLT-001 table below it.
2. Replace the selection with the text and tables below.

```text
Roles are defined per organisation in Team › Roles & Permissions (core Section 2.5). The defaults are:
```

| Role | Dashboard | Project Access | My Tasks | Team Access |
|---|---|---|---|---|
| Super Admin | Super Admin Dashboard (`/super-admin`) | — (platform level) | — | — |
| Organization Owner | Admin Dashboard + My Status | Management | Yes | Management |
| Project Manager | Admin Dashboard + My Status | Management | Yes | Management |
| Team Lead | Admin Dashboard + My Status | User | Yes | Member |
| Developer | My Status | User | Yes | Member |
| QA Tester | My Status | User | Yes | Member |
| External signer | No account | — | — | — |

| Action | Owner | Project Management Access | Project User Access | External signer |
|---|---|---|---|---|
| Create, duplicate, archive, delete projects; edit project Settings; Danger Zone; project Reports | Yes | Yes | No | — |
| Work inside a project: tasks, board, plan, files, Team Work | Yes | Yes (all projects) | Yes (assigned projects) | — |
| Send agreements; sign it yourself | Yes | Yes | Yes | — |
| Sign or decline a request sent to them | Yes | Yes | Yes | Yes (own fields only) |
| Create or revoke own agent tokens | Yes | Yes | Yes | — |
| Organisation agent policy (AI Agent Hub › Organisation) | Yes | No | No | — |
| Settings › Preferences | Yes | No | No | — |
| Team: invite, edit, remove members; manage roles | Yes | If Team Management | If Team Management | — |

**3. Change the Status cell of REQ-PLT-001**, which starts `New (today only Create project…`, to:
```text
Prototype: central permission checks and in-page Access Denied guards (FR-AUTH-007); server enforcement still required.
```

## V-46 Annex C §4: note that core 2.5 governs

**Where:** Annex C, section **4 Roles and default visibility**.

Insert after the paragraph `Permissions must be explicit capabilities applied at organization, project, work item, and document scope. Role names define default bundles, while membership and security classifications determine which resources those bundles apply to.`:
```text
For Phase 1 the role model in core Section 2.5 governs: a Super Admin, one Organization Owner per organisation, and roles built from Dashboard Access, Project Access, My Tasks and Team Access. The role table below is a reference for later, finer-grained permission bundles; where it conflicts with Section 2.5 (for example, which roles may send agreements, DEC-27), Section 2.5 applies.
```

## V-47 Prototype gaps (Section 11.1)

**Where:** Section 11.1 Prototype Gaps Catalog. Add the gaps G-01 to G-08 from the end of this file as new rows (or bullets), in the catalogue's existing format. Use the next free GAP numbers.

---

# Part 2: Compact (`PROJECT_MANAGEMENT_REQUIREMENTS.docx`)

FR tables in the Compact use these rows: Description, Actor / trigger, Preconditions, Main flow, Alternative / error flow, Postconditions / priority, Acceptance criteria, Prototype status, Source evidence.

When an instruction says **"copy from V-xx"**:
- Put the v4.0 text in the matching cell.
- Join the Main Flow bullets into one paragraph, separated by spaces.
- Put the Actor and the Trigger in the **Actor / trigger** cell, separated by `; `.
- Put the Postconditions and the Priority in the **Postconditions / priority** cell, separated by `; `.
- Put the Implementation Status in **Prototype status**.

## C-14 Terms (1.5)

**Where:** Section 1.5, Term / Meaning table. Add rows for these terms, with the definitions from **V-19**:
- Access Denied
- Admin Dashboard
- Custom Role
- Danger Zone
- My Status
- Organization Owner
- Project Management Access
- Project User Access
- Super Admin
- System Role
- Team Management
- Team Member

## C-15 Product functions (2.2)

**Where:** Section 2.2, row **Identity and organization**, right cell.

Find:
```text
Registration, verification, login/logout, recovery, invitations, organization setup, roles and permissions.
```
Replace with:
```text
Super Admin organisation management, invitation-based accounts, verification, login/logout, recovery, member invitations with role and project assignment, organization setup, custom roles, dashboard access and permission-checked pages.
```

## C-16 User classes and roles (2.3)

**Where:** Section 2.3.

Find:
```text
The platform supports organization administrators and business/project roles such as CEO/executive, project manager, product owner, engineering lead, developer and QA tester, together with other configured members. Permissions are role- and organization-scoped. A hidden navigation item must never be treated as the sole authorization control.
```
Replace with:
```text
FlashSign has a Super Admin (platform level, separate Super Admin Dashboard at `/super-admin`, creates and invites organisations) and, in each organisation, one Organization Owner with full access. Roles are built in Team › Roles & Permissions from four settings: Dashboard Access (Admin Dashboard, optionally with My Status, or My Status only), Project Access (Management, or User: assigned projects only, Settings view-only, no project creation, Reports or Danger Zone), My Tasks (Yes/No) and Team Access (Management or Member). Default roles: Organization Owner and Project Manager (system roles), Team Lead, Developer, QA Tester. Every role can use Planner and Agreements; Settings › Preferences and AI Agent Hub › Organisation are Owner-only. A hidden navigation item must never be treated as the sole authorization control.
```

## C-17 Authentication requirements (4.1)

Change each table as follows. The heading and Requirement Name changes are the same as in v4.0.

| Requirement | What to change |
|---|---|
| **FR-AUTH-001** | Heading: `FR-AUTH-001: Account Creation from an Invitation`. Replace every cell with the text from **V-23**. |
| **FR-AUTH-003** | Description, Preconditions and Postconditions: copy from **V-24** items 1–3. |
| | Main flow: add the V-24 item 4 sentence at the end. |
| | Prototype status: copy from V-24 item 5. |
| **FR-AUTH-004** | Description: copy from **V-25** item 1. |
| | Actor / trigger: replace `Org Admin / CEO (Sender)` with `Organization Owner or Team Management role (Sender)`. |
| | Preconditions: copy from V-25 item 3. |
| | Main flow: replace the sentence that starts `Admin inputs invitee Email` with V-25 item 4. |
| | Alternative / error flow: add the V-25 item 5 sentence at the end. |
| | Prototype status: copy from V-25 item 6. |
| **FR-AUTH-005** | Main flow: make the same two changes as **V-26**. |
| **FR-AUTH-007** | Heading: `FR-AUTH-007: Permission-Based Navigation & Route Protection`. Replace every cell with the text from **V-27**. |
| **FR-AUTH-008** | Heading: `FR-AUTH-008: Demo Accounts and Persona Switcher (Prototype)`. Replace every cell with the text from **V-28**. |

## C-18 New authentication requirements

**Where:** After the FR-AUTH-008 table, before **4.2 Module 2**.

Copy the FR-AUTH-008 table (heading + table), paste it twice and fill them in:
- `[PHASE 1] FR-AUTH-009: Super Admin Dashboard & Organization Management`, with every cell from **V-29**.
- `[PHASE 1] FR-AUTH-010: Dashboard Access & Switching`, with every cell from **V-30**.

## C-19 Project requirements (4.2)

| Requirement | What to change |
|---|---|
| **FR-PROJ-001** | Actor / trigger: replace `Project Manager, Product Owner, CEO, Org Admin` with `Users whose role has Project Management Access (Organization Owner and Project Manager by default)`. Preconditions: copy the second line of the **V-31** item 1 replacement. |
| **FR-PROJ-002** | Actor / trigger: same change as **V-31** item 2. |
| **FR-PROJ-006** | Actor / trigger: replace `Project Manager, Org Admin, CEO; User selects \"Archive Project\" from project menu.` with `Users whose role has Project Management Access; User selects Archive on the project overview, or Archive or Delete in the Danger Zone of project Settings (`/projects/[projectId]/settings`).`. |
| | Alternative / error flow: add the **V-31** item 3 bullet at the end. |
| **FR-PROJ-009** | Description: copy from **V-31** item 4. |
| *New* | After the FR-PROJ-009 table, add `[PHASE 1] FR-PROJ-010: Project Access Scope (Management and User Access)`, with every cell from **V-32**. |

## C-20 My Tasks (FR-TASK-012)

Actor / trigger cell. Find:
```text
Authenticated User (Developer, QA Tester, Lead); Navigation to `/my-tasks` or `/projects/my-tasks`.
```
Replace with:
```text
Users whose role has My Tasks access (all default roles); Navigation to `/my-tasks` or `/projects/my-tasks`.
```
Alternative / error flow cell: add at the end the **V-33** bullet.

## C-21 Agreements open to every role (decision N3)

**Skip this fix if you keep decision D5.**

**FR-SIGN-001**
- Actor / trigger cell: replace `Document Manager, Project Manager, CEO;` with `Any organisation user;`.
- Preconditions cell: replace `User possesses agreement creation permissions.` with `User is a member of the organisation. Agreements has no role-level restriction (DEC-27).`

**FR-SIGN-006**
- Description cell: the same change as **V-34** item 2.

## C-22 AI Agent Hub Organisation (FR-AGENT-008)

- Actor / trigger cell: replace `Org Admin, CEO;` with `Organization Owner;`.
- Preconditions cell: copy from **V-35**.

## C-23 Team requirements (4.9)

| Requirement | What to change |
|---|---|
| **FR-TEAM-001** | Actor / trigger: replace `Org Admin, Project Manager, Engineering Lead;` with `Users whose role has Team Management access;`. |
| **FR-TEAM-002** | Actor / trigger: replace `Org Admin, Team Member (Self);` with `Team Management roles (any member); every user (their own profile);`. |
| **FR-TEAM-007** | Alternative / error flow: add the **V-36** item 3 sentence at the end. |
| *New* | After the FR-TEAM-007 table, add `[PHASE 1] FR-TEAM-008: Team Access Levels and Member Management` and `[PHASE 1] FR-TEAM-009: Custom Role Creation and Editing`, with every cell from **V-37**. |

## C-24 Settings requirements (4.11)

| Requirement | What to change |
|---|---|
| **FR-SETT-001** | Actor / trigger: `Organization Owner; Updating the organisation form in `/settings/preferences`.` Preconditions: copy from **V-38** item 1. |
| **FR-SETT-002** | Heading: `FR-SETT-002: Member Role Assignment & Deactivation`. |
| | Description: copy from V-38 item 2. |
| | Actor / trigger: `Organization Owner; Team Management roles; Modifying a member's role, projects or status in Team › Members or Settings › Users & Roles.` |
| | Preconditions: `User's role has Team Management access.` |
| | Main flow and Alternative / error flow: make the same two replacements as V-38 item 2. |
| **FR-SETT-003** | Main flow: the same replacement as **V-38** item 3. |
| **FR-SETT-006** | Main flow: the same replacement as **V-38** item 4. |

## C-25 User interface (5.1)

**Where:** Section 5.1, the second paragraph (the one that starts `Agreements screens include:`). Add at the end:
```text
Access screens include: the login page with six demo accounts (prototype), the Super Admin Dashboard (`/super-admin`: Organizations, Invitations, Platform Overview), the Admin Dashboard (`/dashboard`) and My Status (`/projects/home`) with a header dashboard switcher for roles that have both, Team › Analytics (`/teams`), Members (`/teams/members`) and Roles & Permissions (`/teams/roles`) with the Create/Edit Role form, and an Access Denied panel shown in place of any restricted page. Settings › Preferences and AI Agent Hub › Organisation are shown only to the Owner.
```

## C-26 Core entities (7.1)

**1. Row User, right cell.** Find:
```text
Identity, email, password/session references, role and profile attributes.
```
Replace with:
```text
Identity, email, password/session references, profile attributes, organisation role, Owner and Super Admin flags and, for Project User Access, assigned projects.
```

**2. Row Organization, right cell.** Find:
```text
Tenant/workspace, members, settings, plan and ownership attributes.
```
Replace with:
```text
Tenant/workspace, Owner, members, roles, settings, plan (Starter, Pro, Enterprise) and status (Active, Pending, Inactive); created or invited by a Super Admin.
```

**3. Add a row** after Organization:

| Entity | Purpose / key relationships |
|---|---|
| Role | Organisation role: name, description, Dashboard Access, Project Access, My Tasks access, Team Access, and whether it is a system role (cannot be deleted). |

## C-27 UC-01

**Where:** Section 8, UC-01.

Find:
```text
An administrator creates or configures an organization, verifies identity, assigns roles and invites members. Invitees accept a time-limited invitation and join the authorized workspace.
```
Replace with:
```text
A Super Admin creates or invites an organisation; the Owner accepts, completes setup, creates custom roles in Roles & Permissions (dashboard, project, My Tasks and team access), and invites members with a role and, where needed, assigned projects. Invitees accept a time-limited invitation and land on their role's default dashboard with only their permitted navigation (full steps: v4.0 UC-01).
```

## C-28 Business rules (9)

**Where:** Section 9, Rule / Requirement table. Add two rows after BR-11:

| Rule | Requirement |
|---|---|
| BR-12 Assigned-project scope | A user with Project User Access may open and act only on projects assigned to them. They cannot create projects, change project Settings, open project Reports or use the Danger Zone. |
| BR-13 Owner-only settings | Only the Organization Owner may open Settings › Preferences and AI Agent Hub › Organisation. The Owner always has full workspace access, whatever the Organization Owner role's settings. |

## C-29 Decisions (12)

**Where:** The decisions table, after DEC-25. Add three rows (three cells each, like the rows above):

| Decision | Question / resolution | Note |
|---|---|---|
| DEC-26 | Resolved: Super Admin + one Owner per organisation + roles built from Dashboard, Project, My Tasks and Team access replace the 12 persona roles; no open sign-up on the login page. | Full text in v4.0 Section 12A. |
| DEC-27 | Resolved: every organisation role can use Planner and Agreements, including sending signature requests. | Replaces the earlier "developers cannot send" rule. |
| DEC-28 | Should Admin Dashboard figures be limited to assigned projects for User Access roles (e.g. Team Lead)? | Today they show the whole organisation. |

## C-30 Prototype gaps (11)

**Where:** Section 11.1 Prototype Evidence. Add one paragraph:
```text
Access-control prototype gaps (round 3): invitations do not yet store the chosen role and projects; Super Admin organisations are not linked to real workspaces; the Admin Dashboard is not limited to assigned projects; Settings › Users & Roles still uses the old role checks; old sign-up routes remain in code; company seals and some board actions still use the old role list; duplicate role names are allowed; all checks are client-side only. Details: v4.0 Section 11.1.
```

---

## Prototype gaps found while checking the frontend (for V-47 and C-30)

These are in the code as built in `6a1cc6b`. They are not document edits; they are things the frontend still needs to fix, recorded as gaps.

| # | Gap | Where |
|---|---|---|
| G-01 | The invite dialog collects the Customized Role and assigned projects, but `sendInvitation` does not save them on the invitation, and `acceptInvitation` gives the new user the old `DemoRole`. | `context/demo-auth-context.tsx` (`sendInvitation`, `acceptInvitation`) |
| G-02 | Super Admin organisations and organisation invitations are a separate mock list. Creating or inviting one does not create a workspace or an Owner account, and there is no page to accept an organisation invitation. | `super-admin/page.tsx`, `demo-auth-context.tsx` |
| G-03 | The Admin Dashboard shows organisation-wide projects and figures to Team Lead (Project User Access). | `app/(workspace)/dashboard/page.tsx` (DEC-28) |
| G-04 | Settings › Users & Roles shows for Team Management roles, but the page still uses the old `canManageUsers(demoRole)`, so a Project Manager sees it read-only. | `app/(workspace)/settings/users/page.tsx` |
| G-05 | `/signup`, `/register` and `/onboarding` still exist (not linked from login); self sign-up still creates an organisation. | `app/(auth)/signup`, `context/demo-auth-context.tsx` (`signUp`, `createOrganization`) |
| G-06 | The old 12-role list still runs alongside the new roles: company seals (`canManageDocuments`) and board column editing (`canCreateProject`) use it, through a mapping from the new roles. | `lib/permissions.ts`, `components/agreements/company-seals.tsx`, `projects/[projectId]/board/page.tsx` |
| G-07 | Duplicate role names are allowed. One project id is special-cased in `canAccessProject` (`p-mvhmnblw` follows `p1`). | `lib/rbac.ts`, `role-editor-modal.tsx` |
| G-08 | All checks run in the browser only; production must enforce them on the server (REQ-PLT-001). | `lib/rbac.ts` |

---

## Checklist

| # | Document | Where | Done |
|---|---|---|---|
| V-19 | v4.0 | 1.5: twelve new terms | ☐ |
| V-20 | v4.0 | 2.3: Organization & Multi-Tenancy line | ☐ |
| V-21 | v4.0 | 2.4: Super Admin, Organization Owner, persona note | ☐ |
| V-22 | v4.0 | 2.5: replace the 12-role table with the new model and two tables | ☐ |
| V-23 | v4.0 | FR-AUTH-001: Account Creation from an Invitation | ☐ |
| V-24 | v4.0 | FR-AUTH-003: Owner of a Super-Admin-created organisation | ☐ |
| V-25 | v4.0 | FR-AUTH-004: Customized Role and assigned projects | ☐ |
| V-26 | v4.0 | FR-AUTH-005: starting page, demo login, logout | ☐ |
| V-27 | v4.0 | FR-AUTH-007: Permission-Based Navigation & Route Protection | ☐ |
| V-28 | v4.0 | FR-AUTH-008: Demo Accounts and Persona Switcher | ☐ |
| V-29 | v4.0 | New FR-AUTH-009: Super Admin Dashboard (`/super-admin`) | ☐ |
| V-30 | v4.0 | New FR-AUTH-010: Dashboard Access & Switching | ☐ |
| V-31 | v4.0 | FR-PROJ-001, 002, 006, 009 | ☐ |
| V-32 | v4.0 | New FR-PROJ-010: Project Access Scope | ☐ |
| V-33 | v4.0 | FR-TASK-012: My Tasks setting | ☐ |
| V-34 | v4.0 | FR-SIGN-001, 006: Agreements open to all (N3) | ☐ |
| V-35 | v4.0 | FR-AGENT-008: Owner only | ☐ |
| V-36 | v4.0 | FR-TEAM-001, 002, 007 | ☐ |
| V-37 | v4.0 | New FR-TEAM-008, FR-TEAM-009 | ☐ |
| V-38 | v4.0 | FR-SETT-001, 002, 003, 006 | ☐ |
| V-39 | v4.0 | Entity 1 `roleId` | ☐ |
| V-40 | v4.0 | UC-01 rewritten | ☐ |
| V-41 | v4.0 | BR-12, BR-13 | ☐ |
| V-42 | v4.0 | RTM: five new rows, two changed | ☐ |
| V-43 | v4.0 | Route inventory: access cells and new rows | ☐ |
| V-44 | v4.0 | DEC-26, DEC-27, DEC-28 | ☐ |
| V-45 | v4.0 | Annex B §1.4 tables | ☐ |
| V-46 | v4.0 | Annex C §4 note | ☐ |
| V-47 | v4.0 | 11.1: gaps G-01 to G-08 | ☐ |
| C-14 | Compact | 1.5: new terms | ☐ |
| C-15 | Compact | 2.2: Identity and organization row | ☐ |
| C-16 | Compact | 2.3: roles paragraph | ☐ |
| C-17 | Compact | FR-AUTH-001, 003, 004, 005, 007, 008 | ☐ |
| C-18 | Compact | New FR-AUTH-009, 010 | ☐ |
| C-19 | Compact | FR-PROJ-001, 002, 006, 009; new FR-PROJ-010 | ☐ |
| C-20 | Compact | FR-TASK-012 | ☐ |
| C-21 | Compact | FR-SIGN-001, 006 (N3) | ☐ |
| C-22 | Compact | FR-AGENT-008 | ☐ |
| C-23 | Compact | FR-TEAM-001, 002, 007; new FR-TEAM-008, 009 | ☐ |
| C-24 | Compact | FR-SETT-001, 002, 003, 006 | ☐ |
| C-25 | Compact | 5.1: access screens | ☐ |
| C-26 | Compact | 7.1: User, Organization, new Role row | ☐ |
| C-27 | Compact | UC-01 | ☐ |
| C-28 | Compact | BR-12, BR-13 rows | ☐ |
| C-29 | Compact | DEC-26, DEC-27, DEC-28 rows | ☐ |
| C-30 | Compact | 11.1: access-control gaps paragraph | ☐ |
