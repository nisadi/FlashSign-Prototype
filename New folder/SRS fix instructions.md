# SRS fix instructions

Step-by-step edits for the two Word documents in `New folder`:

- **v4.0** = `FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx` (the master)
- **Compact** = `PROJECT_MANAGEMENT_REQUIREMENTS.docx` (calls itself v4.1, the short version)

## How to use this file

- **Find** is text to search for with Ctrl+F (searching for a short, unique part is enough). **Replace with** is the new text.
- Text in grey boxes is exact. The backticks (`` ` ``) and `$...$` maths codes are already written that way in both documents, so keep them.
- Do **Part 1 (v4.0)** first. Several Compact fixes in Part 2 copy text from v4.0.
- The tag after each heading, e.g. **(A1)**, is the problem number from the error list. Items marked **(new)** were found while writing these instructions.
- When an instruction says "use Ctrl+H", Word's Replace dialog is fine. When a sentence appears in more than one requirement, the instruction says which one to change.

## Decisions these fixes assume

| # | Decision | Why |
|---|---|---|
| D1 | v4.0 is the master. The Compact document is a summary of it. | Compact leaves out Annex B, Annex C, the route list and the traceability table that developers need. |
| D2 | **Product behaviour** follows Annex B and the app: request statuses `draft, sent, viewed, partially_signed, awaiting_review, completed, declined, expired, cancelled`; signer status `pending` (instead of `needs_to_sign`); 14 field types; field positions in % (0–100); project key 2–6 letters; the Annex B health formula; deleting a project needs its key. | These are more detailed and are what is built. `needs_to_sign` stays only as a **role** name, so the role and the status no longer share a name. |
| D3 | **Production infrastructure** stays as Section 4 says: a secure link token, a login gate for registered recipients, the signed PDF built on the server, and a server scheduler every 15 minutes. Each "Implementation Status" line now says what the prototype really does. The link token follows NFR-022 (it expires with its request), which removes the 30-day / 120-day mismatch. | The prototype is evidence only (v4.0 Document Control, precedence rule 4). |
| D4 | Operational targets follow Section 6: 99.9 % availability, RPO 15 minutes, RTO 4 hours. | Section 6 and Annex C already agree on these. Only Annex B NFR-033 differs. |
| D5 | Developers cannot send agreements. | FR-SIGN-001, Annex C and the app (`canManageDocuments`) agree. Only the Annex B permission table said Yes. |

If you disagree with a decision, skip the fixes that depend on it. They are V-06 to V-11 and C-05 to C-06 for D2 and D3, V-16 for D4, and V-12 for D5.

---

# Part 1: v4.0 (`FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx`)

## V-01 Phased preset and FR-PROJ-007 title (A1, A16)

In the app, every preset allows subtasks and a backlog, and **Phased** has epics (`lib/structure.ts:21-25`).

**1. Section 4.2, FR-PROJ-007, Description.**

Find:
```text
Presets are Full (Phases › Epics › Stories › Tasks › Subtasks, default), Agile (Epics › Stories › Tasks › Subtasks), Phased (Phases › Tasks › Subtasks), Simple phases (Phases › Tasks) and Tasks only.
```
Replace with:
```text
Presets are Full (Phases › Epics › Stories › Tasks › Subtasks, default), Agile (Epics › Stories › Tasks › Subtasks), Phased (Phases › Epics › Tasks › Subtasks), Simple phases (Phases › Tasks › Subtasks) and Tasks only (Tasks › Subtasks).
```

**2. FR-PROJ-007 heading and Requirement Name.** The heading still says the old fixed 4-tier structure.
- Heading: change `Project Hierarchical Structure (Phase $\rightarrow$ Epic $\rightarrow$ Story)` to `Configurable Plan Structure (Plan Levels)`. Keep the `[PHASE 1] FR-PROJ-007: ` prefix.
- Bullet `Requirement Name: Multi-Tier Work Breakdown Structure`: change it to `Requirement Name: Configurable Plan Structure (Plan Levels)`.

**3. Annex B, §3.2 "Projects and plan structure", preset table.** Change three rows:

| Preset | Old Levels cell | New Levels cell |
|---|---|---|
| Phased | `Phases › Tasks › Subtasks` | `Phases › Epics › Tasks › Subtasks` |
| Simple phases | `Phases › Tasks` | `Phases › Tasks › Subtasks` |
| Tasks only | `Tasks (› Subtasks)` | `Tasks › Subtasks` |

## V-02 FR-SIGN-012 / 013 / 014: order and styles (A2, A7)

**Where:** Section 4.8, after FR-SIGN-011.

**How it is now:**
1. Heading FR-SIGN-012, with nothing under it.
2. Heading FR-SIGN-013, followed by two paragraphs ("Requirement: …" and "Acceptance criteria: …").
3. `[PHASE 1] FR-SIGN-014: Post-Signing Reviewer Approval`, in **Normal** style, followed by its paragraphs.
4. Bullets starting `Requirement ID: FR-SIGN-012` (the audit-trail text), which now read as part of FR-SIGN-014.
5. Heading 4.9 Module 9.

**Steps:**
1. Select the bullets from `Requirement ID: FR-SIGN-012` down to its last bullet (`Acceptance Criteria: Audit trail details exact timestamps…`, just before the heading **4.9 Module 9**). Cut them.
2. Paste them directly under the heading `[PHASE 1] FR-SIGN-012: Comprehensive Agreement Audit Trail`.
3. In the pasted bullets, change `Requirement Name: Immutable Signature Audit Event Logging` to `Requirement Name: Comprehensive Agreement Audit Trail`.
4. Click in `[PHASE 1] FR-SIGN-014: Post-Signing Reviewer Approval` and apply **Heading 3**. Change the text to:
   ```text
   [PHASE 1] FR-SIGN-014: Reviewer Approval Before Finalisation
   ```
5. Select every paragraph under FR-SIGN-014, from `Requirement ID: FR-SIGN-014` to `Acceptance Criteria: …`, and apply **List Bullet**, the style every other FR body uses.

**Result:**
- FR-SIGN-012 heading, then the audit bullets
- FR-SIGN-013 heading, then the two advanced-signature paragraphs
- FR-SIGN-014 heading, then the reviewer bullets
- 4.9 Module 9

## V-03 BR-10 and BR-11 are mixed together (new)

**Where:** Section 9.1.

**Problem:** BR-11's heading and rule were pasted between BR-10's heading and BR-10's rule. BR-11's "Rule Statement" paragraph is also styled as a heading, so it appears in the contents.

**Steps:**
1. Select the heading `BR-11: Reviewer Approval Gate` and the paragraph below it, `Rule Statement: A signature request that has at least one reviewer…`. Cut both.
2. Paste them after BR-10's bullet `Source: \`server/lib/signing-token.ts\`, \`FLASH_SIGN_FEATURES.md §8 (Item 8)\`.`, just before **9.2 Architectural and Operational Constraints**.
3. Apply **List Bullet** to the BR-11 `Rule Statement: …` paragraph. Keep **Heading 4** on `BR-11: Reviewer Approval Gate`.
4. Add this **List Bullet** under it:
   ```text
   Source: `flash-sign-proto/src/context/app-context.tsx` (`completePdfSigning`, `approvePdfReview`, `rejectPdfReview`).
   ```
5. Then rewrite BR-10 as described in **V-07**.

## V-04 Paragraph styled as a heading (A4)

**Where:** Section 2.11 Prototype Limitations and Production Gaps.

The paragraph `Two signing flows in the prototype. The prototype contains two signing implementations. …` is styled as **Heading 3**.

1. Apply **List Bullet**, the same style as the "Client-Side State Storage: …" item below it.
2. Change the opening words `Two signing flows in the prototype. The prototype contains` to `Two Signing Flows: The prototype contains`, which matches the "Name: text" pattern of the other bullets.

## V-05 Punctuation (A5)

1. **Annex B.1, §2.5 "Get signatures from others".**
   Find:
   ```text
   The user lands on the request detail page Every reviewer gets a "you will be asked to review" notice.
   ```
   Replace with:
   ```text
   Every reviewer gets a "you will be asked to review" notice. The user lands on the request detail page.
   ```

2. **Annex B.1, §2.8, the line starting `Audit event names (current):`.**
   Find:
   ```text
   Demo: Time Moved Forward Waiting for Review · Review Approved · Review Rejected
   ```
   Replace with:
   ```text
   Demo: Time Moved Forward · Waiting for Review · Review Approved · Review Rejected.
   ```

## V-06 Status names (A8)

**1. Section 7.1, Entity 7 `SignatureRequest`, `status` row, last cell.**

Find:
```text
`needs_to_sign`, `waiting_for_others`, `awaiting_review`, `completed`, `draft`, `voided`.
```
Replace with:
```text
`draft`, `sent`, `viewed`, `partially_signed`, `awaiting_review`, `completed`, `declined`, `expired`, `cancelled`. Open statuses: `sent`, `viewed`, `partially_signed`, `awaiting_review`. A decline, an expiry and a cancellation each have their own final status (Annex B.1 §2.7).
```

**2. Entity 8 `SignatureSigner`, `status` row.**

Find:
```text
`waiting`, `needs_to_sign`, `viewed`, `signed`, `declined`.
```
Replace with:
```text
`waiting` (not their turn yet), `pending` (their turn to sign), `viewed`, `signed`, `declined`.
```

**3. Entity 8, `role` row.**

Find:
```text
`needs_to_sign`, `in_person_signer`. Copy recipients
```
Replace with:
```text
`needs_to_sign`, or `in_person_signer` if DEC-10 brings in-person signing into Phase 1. Copy recipients
```

**4. Find and replace these phrases** (Ctrl+H, one at a time, checking each hit):

| Where | Find | Replace with |
|---|---|---|
| 1.5 Definitions, "Active Signer" row | ``currently assigned status `needs_to_sign` whose turn`` | ``currently assigned status `pending` whose turn`` |
| 4.8 FR-SIGN-003, Main Flow | ``(setting status to `needs_to_sign`)`` | ``(setting status to `pending`)`` |
| 4.8 FR-SIGN-003, Main Flow | ``System sets envelope status to `waiting_for_others`, sets`` | ``System sets envelope status to `sent`, sets`` |
| 4.8 FR-SIGN-004, Main Flow | `If envelope is completed or voided, render status screen` | `If the request is completed, declined, expired or cancelled, render status screen` |
| 4.8 FR-SIGN-004, Main Flow | ``If recipient is not active (`waiting_turn`)`` | ``If the recipient is not yet active (`waiting`)`` |
| 4.8 FR-SIGN-007, Main Flow | ``setting their status to `needs_to_sign`.`` | ``setting their status to `pending`.`` |
| 4.8 FR-SIGN-008, Requirement Name | `Envelope Decline and Voiding` | `Recipient Decline Workflow` |
| 4.8 FR-SIGN-008, Preconditions | ``Recipient status is `needs_to_sign`.`` | ``Recipient status is `pending` or `viewed` (it is their turn).`` |
| 4.8 FR-SIGN-008, Main Flow | ``System transitions envelope status to `voided`.`` | ``System transitions envelope status to `declined`.`` |
| 4.8 FR-SIGN-008, Postconditions | `Envelope voided; subsequent signing links deactivated.` | `Envelope declined; all of its signing links stop working.` |
| 4.8 FR-SIGN-012 (audit text moved in V-02), Description | `signed, declined, voided, reminder sent, and completed events` | `signed, declined, cancelled, expired, reminder sent, review requested, review approved, review rejected and completed events` |
| 8.5 UC-05, Main Success Scenario | ``sets envelope status to `waiting_for_others`, and dispatches`` | ``sets envelope status to `sent`, and dispatches`` |
| 8.5 UC-05, Client Declines | `system immediately voids the envelope` | ``system immediately sets the envelope to `declined` `` |
| 9.1 BR-07, Rule Statement | ``are assigned status `needs_to_sign` and dispatched`` | ``are assigned status `pending` and dispatched`` |
| 12.3 Glossary, "Active Signer" | ``designated with status `needs_to_sign` whose turn`` | ``designated with status `pending` whose turn`` |

FR-SIGN-011 is handled in **V-08**.

**Leave these alone:**
- The **role** name `needs_to_sign` (FR-SIGN-001, the Entity 8 role row, Annex C).
- Annex C DOC-08 / DOC-12, Annex D.2 "resend/void controls", and the Compact "resend/void" gap row. These describe a sender action, not a status.

## V-07 Signing link: FR-SIGN-004, BR-10 and DEC-06 (A9)

**FR-SIGN-004, Description.**

Find:
```text
via stateless JWT tokens (`/sign/[token]`) without requiring account registration
```
Replace with:
```text
via a personal signing link (`/sign/[token]`) carrying a random token of at least 128 bits, bound to one recipient and one request (NFR-022), without requiring account registration
```

**FR-SIGN-004, Main Flow.**

Find:
```text
System verifies JWT token signature and expiration (30 days).
```
Replace with:
```text
System verifies the token and that its request is open. The token expires with the request and stops working after completion, decline or cancellation (BR-10).
```

**FR-SIGN-004, Source Evidence.**

Find:
```text
`server/lib/signing.ts:350-370`, `flash-sign-proto/src/app/(workspace)/signatures/sign/[requestId]/page.tsx:48-75`
```
Replace with:
```text
Flash Sign reference app: `server/lib/signing.ts:350-370`. Prototype: `flash-sign-proto/src/components/pdf/pdf-signing-view.tsx`
```

**FR-SIGN-004, Implementation Status.** Change only the one under FR-SIGN-004.

Replace `Implemented.` with:
```text
Not built in the prototype. The prototype opens `/signatures/sign/[requestId]?as=<signerId>` inside the logged-in workspace, with no token and no login gate (REQ-AGR-038). Built in the Flash Sign reference app.
```

**9.1 BR-10.**
1. Change the heading `BR-10: 30-Day Signing Link vs 120-Day Envelope Mismatch` to:
   ```text
   BR-10: Signing Link Expiry Follows the Request
   ```
2. Replace the whole `Rule Statement: Signing link JWT tokens have a maximum cryptographic validity of 30 days, …` bullet with:
   ```text
   Rule Statement: A signing-link token expires when its request expires (default 120 days, FR-SETT-004) and stops working as soon as the request is completed, declined or cancelled. There is no separate, shorter link lifetime, so tokens are never re-issued (NFR-022, DEC-06). The Flash Sign reference app's 30-day token with re-minting is replaced by this rule.
   ```

**Section 12A, DEC-06.** At the end of the paragraph `DEC-06 — Signing link and envelope expiry: …`, add:
```text
Proposed resolution: signing links expire with their request (BR-10, NFR-022).
```

## V-08 Signed PDF and scheduler: FR-SIGN-010 and FR-SIGN-011 (A8, A9)

Both requirements end with the same sentence, `Implementation Status: Implemented in Express backend.`, so change each one separately.

**FR-SIGN-010, Main Flow.** Positions are stored in %.

Find:
```text
Converts normalized $x, y \in [0, 1]$ into PDF points: $X = x \times page.width$; $Y = (1 - y - height) \times page.height$.
```
Replace with:
```text
Converts field positions, stored as percentages of the page (0–100, top-left origin), into PDF points: $X = (x / 100) \times page.width$; $Y = (1 - (y + height) / 100) \times page.height$.
```

**FR-SIGN-010, Implementation Status.** Replace `Implemented in Express backend.` with:
```text
Prototype: built in the browser with pdf-lib when the signed PDF is downloaded (`flash-sign-proto/src/lib/pdf/signed-pdf.ts`). Production: on the server at completion, as built in the Flash Sign reference app (`server/lib/pdf-flatten.ts`).
```

**FR-SIGN-011.** Make these replacements:

| Find | Replace with |
|---|---|
| ``For envelopes in `waiting_for_others` with frequency`` | ``For envelopes in an open status (`sent`, `viewed`, `partially_signed`, `awaiting_review`) with frequency`` |
| ``generates fresh tokens and dispatches reminder email to all current `needs_to_sign` signers.`` | ``dispatches a reminder email to every `pending` or `viewed` signer and, while the request is `awaiting_review`, to every `pending` reviewer.`` |
| ``Sets envelope status to `voided`.`` | ``Sets envelope status to `expired`.`` |
| `expired envelopes automatically voided` | `overdue envelopes automatically expired` |
| `Overdue envelopes automatically transition to voided` | ``Overdue envelopes automatically transition to `expired` `` |
| `Implemented in Express backend.` (the one under FR-SIGN-011) | ``Prototype: runs in the browser every 60 s, only while a tab is open (`applySignatureSchedule` in `flash-sign-proto/src/context/app-context.tsx`). Production: server scheduler every 15 minutes, as built in the Flash Sign reference app (`server/lib/scheduler.ts`).`` |

**Annex B.1, §2.7, row REQ-AGR-052.**

Find:
```text
The scheduler shall run every 60 s. It expires overdue open requests and sends due reminders.
```
Replace with:
```text
The scheduler expires overdue open requests and sends due reminders. In the prototype it runs every 60 s in the browser; in production it runs on the server every 15 minutes (FR-SIGN-011).
```

## V-09 Field types and positions: FR-SIGN-002 and Entity 9 (A9)

**FR-SIGN-002, Main Flow.**

Find:
```text
(Signature, Initial, Date Signed, Name, Text, Checkbox)
```
Replace with:
```text
(14 types: Signature, Initials, Date Signed, Full Name, Email, Company, Title, Text, Number, Checkbox, Dropdown, Radio, Approve, Decline)
```

**FR-SIGN-002, Main Flow, next bullets.**

Find:
```text
normalizes them to page fractions ($x, y, w, h \in [0, 1]$ with $y$ measured from top)
```
Replace with:
```text
stores them as percentages of the page ($x, y, w, h$ from 0 to 100, with $y$ measured from the top)
```

**Entity 9 `SignatureField`.** Replace the last cell in these rows:

| Row | New last cell |
|---|---|
| `type` | ``signature`, `initials`, `date`, `name`, `email`, `company`, `title`, `text`, `number`, `checkbox`, `dropdown`, `radio`, `approve`, `decline`.`` |
| `positionX` | `Left edge as a percentage of page width (0–100).` |
| `positionY` | `Top edge as a percentage of page height (0–100), measured from the top.` |
| `width` | `Field width as a percentage of page width (greater than 0, up to 100).` |
| `height` | `Field height as a percentage of page height (greater than 0, up to 100).` |

Add two rows at the end of Entity 9:

| Field | Data Type | Nullable | Description & Constraints |
|---|---|---|---|
| `fileId` | `text` | Yes | Which of the request's PDFs the field is on. Empty means the first PDF. |
| `options` | `json` (text array) | Yes | Choices for a dropdown or radio field. |

## V-10 Project rules: FR-PROJ-001, 003, 006 and NFR-INT-003 (A9, A16)

**FR-PROJ-001, Main Flow.**

Find:
```text
(2-10 uppercase alphanumeric chars)
```
Replace with:
```text
(2–6 upper-case letters, REQ-PRJ-002)
```

**FR-PROJ-003, Description.**

Find:
```text
automatically based on schedule variance and overdue tasks, while permitting manual manager override.
```
Replace with:
```text
automatically from the project timeline (REQ-PRJ-006), while permitting manual manager override.
```

**FR-PROJ-003, Main Flow.** Replace the four bullets, from ``When `healthMode = 'auto'`, the system evaluates timeline difference…`` down to ``If variance $>5$ days: Health is `off_track` or `delayed`.``, with these three bullets:
```text
When `healthMode = 'auto'`: health is `delayed` if the timeline extension is more than 25 % of the original duration; `at_risk` if the extension is more than 10 % or the pace gap is more than 25 points; otherwise `on_track`.
A completed project is always `on_track`.
`off_track` is never calculated; a Project Manager can only set it by hand.
```

**FR-PROJ-003, Acceptance Criteria.**

Find:
```text
from `on_track` to `at_risk` or `off_track` in auto mode.
```
Replace with:
```text
from `on_track` to `at_risk` or `delayed` in auto mode.
```

**FR-PROJ-006.**
- Find `requires entering the project name as a confirmation safeguard` and replace with `requires typing the project key as a confirmation safeguard`.
- Heading: change `Project Archival & Restoration` to `Project Archival, Restoration & Deletion`.
- `Requirement Name: Project Archival & Soft Deletion`: change it to `Requirement Name: Project Archival, Restoration & Deletion`.

**NFR-INT-003, Verification Criteria.**

Find:
```text
permanent purge requires typing the project name.
```
Replace with:
```text
permanent purge requires typing the project key.
```

## V-11 FR-SIGN-001: in-person signer and Subject (A10)

**Role bullet.**

Find:
```text
`receives_copy` (Receives a copy), plus `in_person_signer`.
```
Replace with:
```text
`receives_copy` (Receives a copy). `in_person_signer` is added only if DEC-10 brings in-person signing into Phase 1.
```

**Subject bullet.**

Find:
```text
User sets Subject, Message, and Reminder Frequency
```
Replace with:
```text
User sets Subject (pre-filled from the Signing Defaults subject, FR-SETT-004), Message, and Reminder Frequency
```

**Implementation Status.**

Find:
```text
Implemented (Client UI in prototype; backend in Express).
```
Replace with:
```text
Partial in the prototype (`/signatures/upload`): no Subject field (the request title is used as the subject, and the Signing Defaults subject is not used) and no in-person signer role. Backend built in the Flash Sign reference app (Express).
```

## V-12 Annex C and the Annex B permission table (A11)

**1. Annex B, §1.4 "Personas and permissions", row `Send agreements; sign it yourself`.**
- Change the **Developer** cell from `Yes` to `No`.
- Add this paragraph under the table:
  ```text
  Developers can sign documents addressed to them but cannot prepare or send agreements (FR-SIGN-001, Annex C §4).
  ```

**2. Annex C, opening paragraph** (starts `This annex preserves the supplied PROJECT_MANAGEMENT_REQUIREMENTS.docx…`). Add at the end:
```text
In this annex, P0, P1 and P2 are priorities (P0 = first production release, P1 = complete target experience, P2 = optional extension). They are not the SRS release phases. Phase 1 and Phase 2 are always written in full.
```

**3. Annex C, §3, bullet `P0 Required for the first production release: …`.** Add at the end:
```text
(Within this SRS, AI-assisted stories and the Claude, Codex and Gemini integration paths are Phase 2 and are not part of the Phase 1 release.)
```

**4. Annex C, §8 "Workflows and completion policy", paragraph `The proposed software workflow is Backlog, Ready, In Progress, In Review, In QA, and Done. …`.** Add at the end:
```text
This six-stage workflow is a configurable option. The default board columns are those in FR-PROJ-001 and Annex B §3.3 (To Do, In Progress, In Review, Done and Blocked), which govern.
```

**5. Annex C, §20, paragraph `20.1 First production release boundary` (`The first production release includes all applicable P0 requirements across Phases 1 to 3, …`).** Add at the end:
```text
Annex C phases are delivery steps, not the binding SRS release phases. Annex C Phase 3 (AI and synchronized updates) and every AI-dependent P0 item belong to SRS Phase 2. The Phase 1 release must work without AI (Document Control, release sequencing rule).
```

## V-13 Use cases (A12)

The Compact document is renumbered to match v4.0 in **C-08**. Its two extra use cases become UC-06 and UC-07, so add them to v4.0 too.

**Where:** Section 8, after UC-05 (after its `Related Requirements:` bullet), before **Section 9**.

Add as a **Heading 3**:
```text
8.6 UC-06: Project Planning and Task Setup
```
Then these lines as **List Bullet**:
```text
Use Case ID: UC-06
Use Case Name: Project Planning and Task Setup
Primary Actor: Project Manager
Preconditions: The user is signed in with project-creation rights.
Trigger: The Project Manager clicks "New Project".
Main Success Scenario:
The Project Manager creates the project in the New Project wizard and chooses its plan levels (FR-PROJ-007).
The Project Manager adds phases, epics and stories, as the chosen levels allow.
The Project Manager creates tasks, assigns owners, estimates and dates, and places them on the board.
The system calculates the timeline and health, and shows progress on the board, list and timeline views.
Related Requirements: FR-PROJ-001, FR-PROJ-002, FR-PROJ-003, FR-PROJ-007, FR-TASK-001, FR-PLAN-001.
```

Add as a **Heading 3**:
```text
8.7 UC-07: Document and Contract Review
```
Then these lines as **List Bullet**:
```text
Use Case ID: UC-07
Use Case Name: Document and Contract Review
Primary Actor: Document Manager
Supporting Actors: Reviewer
Preconditions: The user can manage documents.
Trigger: The Document Manager uploads or creates a document.
Main Success Scenario:
The Document Manager uploads a document or creates one from a template and files it in a folder.
The Document Manager links it to a project or contract and requests a review.
The reviewer adds comments or requests changes; the Document Manager saves a new version.
The reviewer approves the terms, and the document can then be sent for signature (UC-05).
Related Requirements: FR-DOC-001, FR-DOC-002, FR-DOC-003, FR-DOC-004, FR-DOC-005, FR-DOC-006.
```

## V-14 Phase labels (A13)

**Section 4.10.** Add `[PHASE 1] ` in front of these headings:
- `FR-REP-001: Executive Portfolio Overview & Health Distribution`
- `FR-REP-003: Schedule Variance & Baseline Slippage Analytics`
- `FR-REP-004: Team Workload & Allocation Heatmaps`
- `FR-REP-005: Agreement Execution Velocity & Status Counts`
- `FR-REP-006: System-Wide Audit Log & Security Inspection`

Leave FR-REP-002 as `[PHASE 1 + PHASE 2 split]`.

## V-15 Headings and Requirement Names that change the meaning (A16)

Set the **heading**, the **Requirement Name** bullet and the **Compact title** (C-12) to the same text:

| ID | Use this name | Why |
|---|---|---|
| FR-PROJ-006 | Project Archival, Restoration & Deletion | Done in V-10. |
| FR-PROJ-007 | Configurable Plan Structure (Plan Levels) | Done in V-01. |
| FR-PLAN-007 | Timeline Variance Reporting, Gantt & Export | The body covers the Gantt chart and the export. |
| FR-TEAM-004 | Team Meeting Scheduling & Video Link Attachment | The body has video links and in-app calendars only, no external calendar sync. |
| FR-TEAM-006 | Real-Time Team Activity Feed | Keeps it separate from the audit log in FR-REP-006. |
| FR-SRS-006 | Batch Creation of Approved SRS Tasks with Traceability Links | Combines both names. |
| FR-SETT-006 | Prototype Demo State Reset | The requirement is prototype-only. |
| FR-SIGN-008 | Recipient Decline Workflow | Done in V-06; "voiding" no longer exists. |
| FR-SIGN-012 | Comprehensive Agreement Audit Trail | Done in V-02. |
| FR-SIGN-014 | Reviewer Approval Before Finalisation | Done in V-02. |

**Optional:** almost every other FR has a heading worded differently from its Requirement Name (e.g. "User Registration & Account Creation" vs "Self-Service User Sign-up"). The meaning is the same. If you want them identical, change each **v4.0 heading** to its Requirement Name, which already matches the Compact title.

## V-16 Operational targets (A17)

**Annex B.4, §5.4 "Usability, accessibility and reliability", row NFR-033.**

Find:
```text
Service availability 99.5 % a month. Daily backups kept 30 days; restore tested every quarter.
```
Replace with:
```text
Service availability 99.9 % a month (NFR-REL-001). Point-in-time recovery with RPO of 15 minutes or less and RTO of 4 hours or less (NFR-INT-001); backups kept at least 30 days; restore tested every quarter.
```

## V-17 Source evidence paths (A18)

**1. Section 12.5 "Codebase Inventory Reviewed".** Add this paragraph after the first sentence:
```text
Source-evidence paths that begin with `server/` belong to the Flash Sign reference application (Express API) described in `FLASH_SIGN_FEATURES.md`. That code is not part of the FlashSign-Prototype repository. "Implemented in Express backend" means implemented there, not in the prototype.
```

**2. Fix prototype paths that don't exist.** Use Ctrl+H for each pair. They appear in Source Evidence lines in Sections 4, 6 and 9.

| Find | Replace with |
|---|---|
| `components/signature/signature-pad.tsx` | `components/signature/signature-editor.tsx` |
| `components/signature/signature-field-editor.tsx` | `components/pdf/field-placer.tsx` |
| `components/agreements/company-seals-modal.tsx` | `components/agreements/company-seals.tsx` |
| `components/settings/signature-settings-tab.tsx` | `app/(workspace)/settings/signature/page.tsx` |
| `components/documents/template-preview-modal.tsx` | `components/documents/template-preview-dialog.tsx` |
| `components/projects/new-project-dialog.tsx` | `app/(workspace)/projects/new/page.tsx` |
| `components/projects/project-board.tsx` | `app/(workspace)/projects/[projectId]/board/page.tsx` |
| `components/analytics/time-tracking-chart.tsx` | `components/analytics/time-tracking.tsx` |
| `components/analytics/team-chart-card.tsx` | `components/analytics/team-charts.tsx` |
| `components/reports/project-overview-report.tsx` | `components/reports/project-overview.tsx` |
| `components/collaboration/create-meeting-modal.tsx` | `components/collaboration/create-meeting-dialog.tsx` |
| `components/collaboration/create-time-off-modal.tsx` | `components/collaboration/create-time-off-dialog.tsx` |
| `documents/[docId]/` | `documents/[documentId]/` |
| `projects/[id]/` | `projects/[projectId]/` |
| `src/components/PdfCanvas.tsx` and `PdfCanvas.tsx` | `src/components/pdf/pdf-pages.tsx` |
| `settings/activity/page.tsx` | `activity/page.tsx` (there is no `/settings/activity`; the log is at `/activity`) |
| `flash-sign-proto/src/lib/limits.ts` and `src/lib/limits.ts` | Delete the path. The prototype has no limits file: the 5 MB PDF check is in `src/lib/pdf/file-store.ts`, and the password limits are not built. |
| `src/middleware.ts` and `middleware.ts` | `src/app/(workspace)/layout.tsx` (login check only; there are no route guards) |

**3. Verification Criteria lines in Section 6 that name files or libraries that don't exist:**

| NFR | Find | Replace with |
|---|---|---|
| NFR-PERF-002 | ``during `@dnd-kit` drag gestures`` | `during card drag gestures` |
| NFR-PERF-003 | ``during document loading in `PdfCanvas.tsx`.`` | ``during document loading in the PDF viewer (`components/pdf/pdf-pages.tsx`).`` |
| NFR-SEC-001 | ``with HTTP 400 (`src/lib/limits.ts`).`` | `with HTTP 400.` |
| NFR-USE-002 | ``Inspection of `CreateTaskModal`, `NewProjectDialog`, and `LoginForm`.`` | `Inspection of the Create Task, New Project and Login forms.` |
| NFR-USE-003 | ``UI inspection of `useGuardedMove` modal component.`` | `UI inspection of the guarded-move dialog on the board and in the task drawer.` |

## V-18 Decisions register (A15)

**Section 12A.** Add two decisions after DEC-23. They are in the Compact document but missing from v4.0:
```text
DEC-24 — Identity proofing: Open: confirm identity-proofing and signer-authentication requirements for each document class and assurance profile (DEC-02, FR-SIGN-013).
DEC-25 — Audit and incident ownership: Open: name the owner of audit-trail review and incident response.
```

---

# Part 2: Compact (`PROJECT_MANAGEMENT_REQUIREMENTS.docx`)

Each requirement in the Compact document is a table. "Cell" below means the right-hand cell of the named row.

## C-01 Phased preset and FR-PROJ-007 title (A1, A16)

1. **FR-PROJ-007, Description cell.** Make the same replacement as V-01 step 1.
2. **FR-PROJ-007 heading.** Change `Multi-Tier Work Breakdown Structure` to `Configurable Plan Structure (Plan Levels)`. Keep the `[PHASE 1] FR-PROJ-007: ` prefix.

## C-02 FR-SIGN-012 / 013 / 014 (A3, A7)

**How it is now:**
1. Heading FR-SIGN-012, with an empty table (every cell "—").
2. The FR-SIGN-014 table, with no heading (its Description starts `The system shall let the sender add reviewers…`).
3. Heading `FR-SIGN-013: Immutable Signature Audit Event Logging`, with the audit table.

**Steps:**
1. Delete the empty table under `FR-SIGN-012: Comprehensive Agreement Audit Trail`.
2. Cut the reviewer table. Keep it to paste in step 6.
3. Cut the audit table under FR-SIGN-013 (Description starts `The system shall record and display an immutable chronological audit trail…`). Paste it under the **FR-SIGN-012** heading.
4. Change the FR-SIGN-013 heading to:
   ```text
   [PHASE 1] FR-SIGN-013: Advanced Electronic Signature Assurance
   ```
   Under it, insert a new 2-column table in the same format as the others:

   | Requirement element | Specification |
   |---|---|
   | Description | The system shall support an advanced electronic-signature assurance profile appropriate to the approved launch jurisdiction. The profile shall bind the signed record to an identified signer, capture explicit intent and consent, apply an authentication method proportionate to the document risk, protect the signing credential or certificate under the signer's control, and provide a mechanism to detect subsequent alteration of the signed document. Where the selected jurisdiction/profile requires certificate-based digital signatures and trusted timestamps, the production service shall integrate an approved certificate and timestamp provider. A visual signature image or flattened PDF alone shall not be represented as a cryptographic AdES signature. |
   | Actor / trigger | Signer, Sender; a request is sent with the advanced assurance profile. |
   | Postconditions / priority | Signed record carries the evidence the profile requires.; Must Have |
   | Acceptance criteria | Given an envelope configured for the approved advanced profile, when an eligible signer completes the required identity/authentication and consent steps, then the final evidence package shall retain signer attribution, signing intent, document hash, relevant certificate/timestamp evidence where configured, and an auditable event history. When the signed document is altered after finalisation, integrity verification shall detect the change. The system shall clearly identify any profile that does not meet the approved advanced assurance policy. |
   | Prototype status | Not built (production). The signed PDF's summary page states that it is not cryptographically signed. |
   | Source evidence | `flash-sign-proto/src/lib/pdf/signed-pdf.ts` (summary page); DEC-02, DEC-24. |

5. After that table, add a **Heading 3**:
   ```text
   [PHASE 1] FR-SIGN-014: Reviewer Approval Before Finalisation
   ```
6. Paste the reviewer table under it.

**Result:** FR-SIGN-012 (audit table) → FR-SIGN-013 (advanced-signature table) → FR-SIGN-014 (reviewer table) → FR-TEAM-001.

Then make the audit Description change from V-06 in the moved table:
- Find `signed, declined, voided, reminder sent, and completed events`.
- Replace with `signed, declined, cancelled, expired, reminder sent, review requested, review approved, review rejected and completed events`.

## C-03 Screens paragraph: style and missing Teams pages (A4, A6)

**Where:** Section 5.1 User Interface, the paragraph starting `Agreements screens include: Inbox (\`/signatures/all\`)…`. It is styled as **Heading 2**.

1. Apply **Normal**.
2. Find (end of that paragraph):
   ```text
   Some of these are not yet linked from navigation (DEC-23).
   ```
   Replace with:
   ```text
   Team screens include the workload view (`/teams/workload`) and the work-sessions timesheet (`/teams/timesheet`, which `/ai-agents/timesheet` redirects to). Some of these screens are not yet linked from navigation (DEC-23).
   ```

## C-04 Punctuation (A5)

**FR-SIGN-001, Main flow cell.**
- Find `(FR-SIGN-014)..`
- Replace with `(FR-SIGN-014).`

Leave `(rejected).; Must Have` in the FR-SIGN-014 table as it is. Every "Postconditions / priority" cell in the document uses the same `text.; Priority` pattern.

## C-05 Status names (A8)

The Compact tables contain the same sentences as v4.0, so use the **V-06 Find / Replace table** on these cells:

| Requirement | Cells |
|---|---|
| FR-SIGN-003 | Main flow (`(setting status to ...)` and `System sets envelope status to ...`) |
| FR-SIGN-004 | Main flow (`If envelope is completed or voided…`, ``(`waiting_turn`)``) |
| FR-SIGN-007 | Main flow (`setting their status to ...`) |
| FR-SIGN-008 | Heading title, Preconditions, Main flow, Postconditions. The heading is `Envelope Decline and Voiding`; change it to `Recipient Decline Workflow`. |

**Section 7.1 Core Entities, `SignatureRequest / Envelope` row.**

Find:
```text
routing, status, expiry and completion data.
```
Replace with:
```text
routing, status (draft, sent, viewed, partially_signed, awaiting_review, completed, declined, expired, cancelled), expiry and completion data.
```

## C-06 Section 4 fixes copied from v4.0 (A9, A10)

The same sentences are inside the Compact table cells, so use the Find / Replace pairs from these v4.0 items:

| v4.0 item | Compact cells to change |
|---|---|
| V-07 (signing link) | FR-SIGN-004: Description, Main flow, Source evidence, Prototype status (`Implemented.` under FR-SIGN-004 only) |
| V-08 (PDF and scheduler) | FR-SIGN-010: Main flow, Prototype status. FR-SIGN-011: Main flow, Postconditions, Acceptance criteria, Prototype status. In the Compact document the expiry sentence reads ``Sets envelope status to `voided`. Logs `expired` activity row.``; change only `` `voided` `` to `` `expired` ``. |
| V-09 (field types) | FR-SIGN-002 Main flow |
| V-10 (project rules) | FR-PROJ-001 Main flow; FR-PROJ-003 Description, Main flow, Acceptance criteria; FR-PROJ-006 heading and Alternative / error flow |
| V-11 (FR-SIGN-001) | FR-SIGN-001 Main flow and Prototype status. Here the role text reads ``Role shown in this order: `needs_to_sign`, `needs_to_review`, `receives_copy`, plus `in_person_signer`.``. Find ``, plus `in_person_signer`.`` and replace it with ``. `in_person_signer` is added only if DEC-10 brings in-person signing into Phase 1.`` |

**FR-PROJ-003 Main flow cell.** All four rules are in one cell.

Find from ``When `healthMode = 'auto'`, the system evaluates`` up to ``Health is `off_track` or `delayed`.`` and replace with:
```text
When `healthMode = 'auto'`: health is `delayed` if the timeline extension is more than 25 % of the original duration; `at_risk` if the extension is more than 10 % or the pace gap is more than 25 points; otherwise `on_track`. A completed project is always `on_track`. `off_track` is never calculated; a Project Manager can only set it by hand.
```

**BR-10 row (Section 9).** Replace the Requirement cell with:
```text
A signing-link token expires when its request expires (default 120 days) and stops working once the request is completed, declined or cancelled. There is no separate, shorter link lifetime.
```

## C-07 P1 / P2 meaning (A11)

**Where:** the line starting `Requirement status convention:` near the end (Appendix A).

Find:
```text
Requirement status convention: P1 = Phase 1; P2 = Phase 2; P1/shared = Phase 1 requirement or shared quality control that also applies to Phase 2.
```
Replace with:
```text
Phase labels: [PHASE 1], [PHASE 2], and [PHASE 1 / SHARED] for a Phase 1 requirement or shared quality control that also applies to Phase 2. P0, P1 and P2 in the full SRS (v4.0, Annex C) are priorities, not phases.
```

## C-08 Use cases: renumber to match v4.0 and restore UC-05 (A12)

**Where:** Section 8 User Workflows and Use Cases.

Re-order and rename the headings so they match v4.0. Keep the paragraph under each one, except UC-05, which gets the text below.

| New heading | Was |
|---|---|
| `UC-01 Organization setup and invitation` | UC-01 (no change) |
| `UC-02 SRS analysis (Phase 2)` | UC-06 Phase 2 SRS analysis |
| `UC-03 Task execution and guarded transitions` | UC-03 (no change) |
| `UC-04 Agent work session (Phase 2)` | UC-07 Phase 2 agent work session |
| `UC-05 Multi-party sequential signing` | UC-05 (new paragraph below) |
| `UC-06 Project planning and task setup` | UC-02 Project planning and task execution |
| `UC-07 Document and contract review` | UC-04 Document and contract review |

**New UC-05 paragraph** (replace the whole paragraph):
```text
An authorized sender creates an envelope, uploads PDFs, defines signers, optional reviewers and copy recipients and the signing order, places the required fields (including a company seal field where needed), validates and sends. Each signer opens their personal signing link; a signer whose email belongs to an organization account must sign in first (BR-08). Each signer completes or declines their action, and a signer whose role is allowed may apply the company seal (BR-06). The system advances routing and records events. If the envelope has reviewers, it waits in `awaiting_review` after the last signature and is completed only when every reviewer approves; one rejection declines it. Without reviewers it is completed on the last signature, and the signed PDF is sent to everyone.
```

## C-09 Phase label on FR-REP-002 (A13)

Change the heading `[PHASE 1] FR-REP-002: Contributor Time Analytics & AI Contribution Ratio` to:
```text
[PHASE 1 + PHASE 2 split] FR-REP-002: Contributor Time Analytics & AI Contribution Ratio
```

At the end of its **Acceptance criteria** cell, add:
```text
The split by AI agent (Claude, Codex, Gemini, Antigravity) is Phase 2; Phase 1 reports human time only.
```

## C-10 Restore measurable targets and say what is only in v4.0 (A14)

**1. Section 6 NFR tables.** In each NFR table, the "Acceptance / verification" cell says `Verify through test, inspection or operational evidence.`. Replace it with the text for that NFR:

| NFR | Acceptance / verification |
|---|---|
| NFR-PERF-001 | Automated Lighthouse audit scoring $\ge 90$ on Desktop and $\ge 80$ on Mobile. |
| NFR-PERF-002 | Performance profiler measurement during card drag gestures under 200 tasks per board. |
| NFR-PERF-003 | Console performance timeline during document loading in the PDF viewer. |
| NFR-PERF-004 | Benchmark of PDF flattening duration across 10-page test documents. |
| NFR-SEC-001 | Unit test verifying passwords $>72$ bytes are rejected with HTTP 400. |
| NFR-SEC-002 | Security scan confirming `Set-Cookie` header flags on `/api/auth/login`. |
| NFR-SEC-003 | Database inspection confirming absence of plaintext tokens in `agent_access_tokens` table. |
| NFR-SEC-004 | Automated test verifying that opening a signing link for an existing account while unauthenticated returns HTTP 401 with `auth_required` state. |
| NFR-SEC-005 | Penetration test verifying that an unauthorized role attempting seal stamping via API receives HTTP 403 Forbidden. |
| NFR-SEC-006 | MCP query test verifying that tasks in blocked projects are absent from `list_tasks` output. |
| NFR-USE-001 | Usability study testing 5 novice participants with successful completion rate $\ge 90\%$. |
| NFR-USE-002 | Inspection of the Create Task, New Project and Login forms. |
| NFR-USE-003 | UI inspection of the guarded-move dialog on the board and in the task drawer. |
| NFR-ACC-001 | Automated axe-core accessibility audit across all primary workspace routes. |
| NFR-ACC-002 | Manual keyboard walkthrough verifying that all modals can be closed via `Escape` and forms submitted via `Enter`. |
| NFR-ACC-003 | Automated accessibility audit verifying aria attributes in `Modal`, `ProgressBar`, and `Breadcrumbs`. |
| NFR-REL-001 | Production uptime monitoring via external synthetic health checks (`/api/health`). |
| NFR-REL-002 | Disconnecting browser network during task editing confirms input retention and non-destructive retry. |
| NFR-REL-003 | Code review confirming database transactions wrap signing and sending. |
| NFR-MAINT-001 | Static code analysis confirming component isolation and absence of circular dependencies. |
| NFR-MAINT-002 | Executing `npm run build` or `tsc --noEmit` exits with status code 0. |
| NFR-MAINT-003 | Jest / Vitest code coverage report. |
| NFR-COMP-001 | Automated Playwright cross-browser test matrix execution. |
| NFR-COMP-002 | Physical device testing on iPhone and Android mobile browsers. |
| NFR-COMP-003 | Successful container build and startup via `docker compose up`. |
| NFR-SCALE-001 | Database load testing using synthetic datasets with indexed PostgreSQL schema. |
| NFR-SCALE-002 | Execution plan analysis (`EXPLAIN ANALYZE`) confirming index scans across envelope and task queries. |
| NFR-SCALE-003 | Database schema inspection confirming absence of Base64 byte arrays in document tables. |
| NFR-PRIV-001 | Legal compliance review of audit log metadata and consent checkboxes. |
| NFR-PRIV-002 | Inspection of public signing payload and database fields. |
| NFR-PRIV-003 | Execution of user purge procedure leaves audit trail uncompromised with anonymized actor strings. |
| NFR-INT-001 | Disaster recovery restoration drill executing database recovery to a designated timestamp. |
| NFR-INT-002 | Automated test verifying that altering a single byte in a signed PDF fails SHA-256 checksum validation. |
| NFR-INT-003 | Deleting a project moves it to archived state; permanent purge requires typing the project key. |
| NFR-OBS-001 | Log output inspection confirming consistent JSON schema across API calls. |
| NFR-OBS-002 | Automated probe test confirming HTTP 503 response when database connection is severed. |
| NFR-OBS-003 | Querying `AgentEvent` feed verifies complete capture of agent CLI tool commands. |

Some of these differ slightly from v4.0 because the file names were corrected in V-10 and V-17.

**2. Section 9 business rules.** Replace the Requirement cell of these rows with the exact rule from v4.0:

| Rule | Requirement cell |
|---|---|
| BR-01 | A task that has one or more subtasks is a container. Moving it to In Progress updates its status but does not start a work session; time is logged on its subtasks. |
| BR-02 | A task without subtasks contributes its own estimated duration. A task with subtasks takes the sum of its subtask durations, and its dates expand to cover them. The parent's own estimate is never added on top. |
| BR-03 | A parent task cannot move to Done while any subtask is open (To Do, In Progress, Review or Blocked) unless the user confirms completing all subtasks or chooses to keep them open. |
| BR-04 | A task in progress is overrun when its completed plus running session minutes exceed its estimated working minutes ($estimatedDuration \times 480$ minutes). |
| BR-05 | A user has at most one saved signature and initials record. Saving a new one replaces the old one. |
| BR-06 | A company seal may be viewed, selected and stamped only if the signer's role is in the seal's allowed roles. |
| BR-07 | With sequential order, only the signers in the lowest unfinished routing group are `pending` and invited; later groups stay `waiting` until every earlier signer has signed. With parallel order, all signers are `pending` at once. |
| BR-08 | A signing link may not be used to sign if the recipient's email belongs to a verified organization account and the browser is not signed in to that account. |
| BR-09 | Passwords must be at least 8 characters and at most 72 bytes, checked at registration, login and password reset. |
| BR-10 | Already replaced in C-06. |

BR-01 is a short version of the v4.0 text. If you prefer, paste the full v4.0 BR-01 Rule Statement instead.

**3. Document Control, under the line `This edition removes duplicated annexes and repeated prose…`.** Add:
```text
The full SRS (v4.0) is the master. These parts are only in v4.0: Annex B (detailed e-signature, project and AI behaviour, including the envelope state machine and email rules), Annex C (supplementary project-management requirements), the route and screen inventory (12.2), the requirements traceability matrix and the open questions.
```

## C-11 Decisions: renumber to match v4.0 (A15)

**Where:** Section 12 Decisions and Open Questions.

Replace the DEC-01 to DEC-23 rows with these 25 rows, keeping the 3-column table:

| ID | Decision | Why it matters |
|---|---|---|
| DEC-01 | Resolved: AI is part of the product and is delivered in Phase 2, after Phase 1 is accepted. Confirm the acceptance authority. | Phase 1 must be independent of AI. |
| DEC-02 | Target set: an AdES-oriented advanced signature profile (FR-SIGN-013), subject to legal, identity-proofing, certificate and timestamp-provider approval. QES is not assumed. Confirm trust-service providers. | AdES requires more than a visual signature or flattened PDF. |
| DEC-03 | Confirm jurisdiction(s), applicable laws and the document classes for electronic signatures. | No universal legal-validity claim is made. |
| DEC-04 | Approve the production architecture: hosting, migrations, object storage, durable jobs and deployment topology. | The prototype stack is evidence only. |
| DEC-05 | Confirm file-size, page-count and upload limits. | Required for validation and performance. |
| DEC-06 | Confirm envelope and signing-link expiry. Proposed: links expire with their request (BR-10). | Removes the 30-day / 120-day mismatch. |
| DEC-07 | Confirm production object storage and retention for files. | Required for scale, security and legal hold. |
| DEC-08 | Decided: multiple PDFs per envelope and fields on any page. Confirm cross-document routing rules. | Affects envelope data model and UX. |
| DEC-09 | Confirm that each of the 14 field types works end to end, or is disabled. | No inert controls. |
| DEC-10 | Decide whether in-person signing is in Phase 1. | It is not built in the prototype. |
| DEC-11 | Confirm resend, void, decline and correction permissions. | Required for lifecycle completeness. |
| DEC-12 | Confirm Unicode and font embedding for PDF output, including Sinhala and Tamil. | Required for non-Latin documents. |
| DEC-13 | Confirm token purpose, revocation and session policy. | Required for secure signer and agent access. |
| DEC-14 | Confirm PM data persistence and migration approach. | Local/demo state is not production persistence. |
| DEC-15 | Confirm template and reporting placeholder scope. | Prototype placeholders need product decisions. |
| DEC-16 | Approve automated test coverage and release gates. | Required for repeatable acceptance. |
| DEC-17 | Confirm framework and runtime versions. | Prototype versions are not final decisions. |
| DEC-18 | Select email, identity, storage, AI, certificate and timestamp providers. | Provider capability and legal coverage must be checked. |
| DEC-19 | Approve retention, deletion and backup periods. | Must align with law and business policy. |
| DEC-20 | Set operational targets for availability and performance. | Needed for measurable service acceptance. |
| DEC-21 | Keep the current DEC-21 row (reviewer step rules). | |
| DEC-22 | Keep the current DEC-22 row (single signing flow). | |
| DEC-23 | Keep the current DEC-23 row (unlinked and duplicate screens). | |
| DEC-24 | Confirm identity-proofing and signer-authentication requirements. | Assurance varies by transaction. |
| DEC-25 | Confirm ownership of audit review and incident response. | Needed for ongoing governance. |

Then search the Compact document for any other `DEC-` reference and update the number using this mapping:

| Old Compact number | New number |
|---|---|
| 02 | 03 |
| 03 | 02 |
| 04 | 24 |
| 09 | 09 and 10 |
| 10 | 11 |
| 11 | 12 |
| 12 | 13 |
| 13 | 14 |
| 14 | 15 |
| 15 | 16 |
| 16 | 04 and 17 |
| 17 | 18 |
| 18 | 19 |
| 19 | 20 |
| 20 | 25 |

## C-12 Titles (A16)

Change these Compact headings to the names in V-15:

| ID | Current Compact title | New title |
|---|---|---|
| FR-PROJ-006 | Project Archival & Soft Deletion | Project Archival, Restoration & Deletion |
| FR-PLAN-007 | Schedule Variance Analysis & Visual Gantt | Timeline Variance Reporting, Gantt & Export |
| FR-TEAM-004 | Meeting Scheduling & Calendar Synchronization | Team Meeting Scheduling & Video Link Attachment |
| FR-TEAM-006 | Organization Audit & Activity Stream | Real-Time Team Activity Feed |
| FR-SRS-006 | Batch Creation of Approved SRS Tasks | Batch Creation of Approved SRS Tasks with Traceability Links |
| FR-SETT-006 | LocalStorage Demo State Reset | Prototype Demo State Reset |

FR-PROJ-007, FR-SIGN-008, FR-SIGN-012, FR-SIGN-013 and FR-SIGN-014 are already covered by C-01, C-05 and C-02.

## C-13 Source evidence paths (A18)

Use the same Find / Replace table as **V-17 step 2** on the "Source evidence" cells.

Add this sentence at the end of Appendix A:
```text
Source-evidence paths that begin with `server/` belong to the Flash Sign reference application (Express API), not the FlashSign-Prototype repository.
```

---

## Checklist

| Problem | v4.0 | Compact |
|---|---|---|
| A1 Phased preset | V-01 | C-01 |
| A2 / A3 FR-SIGN-014 placement | V-02 | C-02 |
| A4 Paragraphs styled as headings | V-04 | C-03 |
| A5 Punctuation | V-05 | C-04 |
| A6 Teams pages in 5.1 | — | C-03 |
| A7 FR-SIGN-012 empty / AdES ID | V-02 | C-02 |
| A8 Status names | V-06, V-08 | C-05 |
| A9 Section 4 vs Annex B | V-07 to V-10 | C-06 |
| A10 FR-SIGN-001 | V-11 | C-06 |
| A11 Annex C conflicts / P0–P2 | V-12 | C-07 |
| A12 Use cases | V-13 | C-08 |
| A13 Phase labels | V-14 | C-09 |
| A14 Compact dropped targets | — | C-10 |
| A15 Decisions | V-18 | C-11 |
| A16 Heading vs name | V-15 | C-12 |
| A17 Ops targets | V-16 | — |
| A18 Source evidence paths | V-17 | C-13 |
| (new) BR-10 / BR-11 mixed | V-03 | — |
