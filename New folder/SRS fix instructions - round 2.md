# SRS fix instructions: round 2

These are the last 8 fixes: 5 in v4.0 and 3 in the Compact document. Everything else from the first instructions file is already done.

- **v4.0** = `FlashSign_SRS_v4.0_Complete_Consolidated_Phased.docx`
- **Compact** = `PROJECT_MANAGEMENT_REQUIREMENTS.docx`

Use Ctrl+F to find the text in each **Find** box and replace it with the text in the **Replace with** box. Text in grey boxes is exact. Keep the backticks (`` ` ``); they are already in the documents.

**Do not renumber anything this time.** Every DEC number below is already correct.

---

# Part 1: v4.0

## R-01 Move the "4.9 Module 9" heading

**Problem:** The heading sits between FR-SIGN-012 and FR-SIGN-013, so FR-SIGN-013 and FR-SIGN-014 appear under Module 9 (Team) instead of Module 8 (E-Signature).

**Steps:**
1. Find the heading:
   ```text
   4.9 Module 9: Team Collaboration & Availability
   ```
   It is directly under FR-SIGN-012's last bullet (`Acceptance Criteria: Audit trail details exact timestamps…`).
2. Select the whole heading line and cut it (Ctrl+X).
3. Find FR-SIGN-014's last bullet:
   ```text
   Acceptance Criteria: Given one signer and one reviewer
   ```
4. Click at the start of the next heading, `[PHASE 1] FR-TEAM-001: Team Roster & Department Allocation`, and paste (Ctrl+V).
5. Check that the pasted line is still **Heading 2**.

**Result:**
- FR-SIGN-012 heading, then the audit bullets
- FR-SIGN-013 heading, then the two advanced-signature paragraphs
- FR-SIGN-014 heading, then the reviewer bullets
- **4.9 Module 9: Team Collaboration & Availability**
- FR-TEAM-001

## R-02 Make the 12.5 note its own paragraph

**Where:** Section 12.5 Codebase Inventory Reviewed.

**Problem:** The note was joined onto the sentence that introduces the file list, so it reads "…inspected during the generation of this specification: Source-evidence paths that begin with `server/`…".

**Steps:**
1. Find:
   ```text
   generation of this specification: Source-evidence paths that begin with
   ```
2. Click just before `Source-evidence paths` and press **Enter**, so the note starts a new paragraph.
3. Select that new paragraph, from `Source-evidence paths that begin with…` to `…not in the prototype.`, and cut it.
4. Click at the start of `The following primary source code files and specifications were comprehensively inspected…` and paste. Press **Enter** after it if both paragraphs end up on one line.
5. Make sure the pasted paragraph is in **Normal** style.

**Result:**
```text
Source-evidence paths that begin with `server/` belong to the Flash Sign reference application (Express API) described in `FLASH_SIGN_FEATURES.md`. That code is not part of the FlashSign-Prototype repository. "Implemented in Express backend" means implemented there, not in the prototype.

The following primary source code files and specifications were comprehensively inspected during the generation of this specification:
• Root & Architecture Reference:
• …
```

## R-03 Project key length in Entity 3

**Where:** Section 7.1, Entity 3 `Project`, row `key`, last cell.

Find:
```text
2-10 uppercase chars.
```
Replace with:
```text
2–6 upper-case letters, unique in the organisation.
```

## R-04 Document page path in the traceability matrix

**Where:** Section 10.2 Requirements Traceability Matrix, row **FR-DOC-008**.

Find:
```text
documents/[docId]
```
Replace with:
```text
documents/[documentId]
```

## R-05 "voided" in DEC-06

**Where:** Section 12A, the paragraph starting `DEC-06 — Signing link and envelope expiry:`.

Find:
```text
expired/voided/completed requests
```
Replace with:
```text
expired, declined, cancelled or completed requests
```

---

# Part 2: Compact

## R-06 FR-SIGN-001 points at the wrong decision

**Where:** FR-SIGN-001, **Main flow** cell. DEC-10 is the in-person signing decision.

Find:
```text
added only if DEC-11 brings in-person signing
```
Replace with:
```text
added only if DEC-10 brings in-person signing
```

## R-07 FR-SIGN-013 points at the wrong decision

**Where:** FR-SIGN-013 (Advanced Electronic Signature Assurance), **Source evidence** cell. DEC-02 is the signature assurance decision.

Find:
```text
DEC-03, DEC-24
```
Replace with:
```text
DEC-02, DEC-24
```

## R-08 BR-10 rule still describes the old 30-day / 120-day mismatch

**Where:** Section 9 Business Rules and Constraints, row **BR-10**.

**1. First cell.**

Find:
```text
BR-10 Expiry consistency
```
Replace with:
```text
BR-10 Signing link expiry
```

**2. Second cell (Requirement).**

Find:
```text
Signing-link expiry and envelope expiry must follow one approved policy; the prototype's differing 30-day and 120-day values must not silently coexist.
```
Replace with:
```text
A signing-link token expires when its request expires (default 120 days) and stops working once the request is completed, declined or cancelled. There is no separate, shorter link lifetime.
```

---

## Checklist

| # | Document | Where | Done |
|---|---|---|---|
| R-01 | v4.0 | Move "4.9 Module 9" heading below FR-SIGN-014 | ☐ |
| R-02 | v4.0 | 12.5 note as its own paragraph, above the file list | ☐ |
| R-03 | v4.0 | Entity 3 `key`: 2–6 upper-case letters | ☐ |
| R-04 | v4.0 | Traceability matrix, FR-DOC-008: `[documentId]` | ☐ |
| R-05 | v4.0 | DEC-06: no "voided" | ☐ |
| R-06 | Compact | FR-SIGN-001: DEC-10 | ☐ |
| R-07 | Compact | FR-SIGN-013: DEC-02, DEC-24 | ☐ |
| R-08 | Compact | BR-10 row: new name and rule | ☐ |
