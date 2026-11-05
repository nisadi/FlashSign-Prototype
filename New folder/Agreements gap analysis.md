# Agreements Gap Analysis: Original Flash Sign vs Our Prototype

**Question:** The original Flash Sign lets a user upload a document and either **(a) sign it themselves** or **(b) ask other people to sign it**. What is our prototype's Agreements area missing compared with the original?
**Compared:** the original app in `New folder/flash-sign-main` (Next.js + Express API + PostgreSQL, real PDFs and email) and our prototype in `flash-sign-proto` (browser only) at commit `ef89bc5`.
**Method:** both codebases were read in full for the agreement features. Every row in the detailed tables cites code as `orig:path:line` or `proto:path:line`. The apps were not run.
**Date:** 30 October 2026.

---

## Short answer

**Both things the supervisor mentioned are missing in our prototype.**

| Supervisor's point | Original Flash Sign | Our prototype |
|---|---|---|
| **Upload a document** | Upload a real PDF (PDF only, up to 5 MB; the server checks the `%PDF-` header and counts pages). The pages are shown with pdf.js, with zoom and page thumbnails. | **Missing.** The wizard can only link an existing *text* document. The library "upload" keeps only the file name and size. There is no PDF anywhere. |
| **(a) Sign it yourself** | A dedicated flow: **Start → Sign a document** (`/envelopes/sign`) or the **"I'm the only signer"** box. You drag your own fields onto the page; they are pre-filled from your profile and saved signature. You sign and download a **signed PDF**. | **Missing.** "Sign a Document" on the Agreements page opens **the same wizard as "Get Signatures"** (`proto:src/app/(workspace)/agreements/page.tsx:26-27`). There is no self-sign flow. |
| **(b) Ask others to sign** | Add recipients with roles and signing order. Drag 14 field types onto the PDF for each recipient. Each recipient gets an email with a personal link, fills **their** fields, and signs. Everyone gets the **signed PDF** by email. | **Looks present, mostly simulated.** The wizard exists, but field positions are random and never drawn, signers never fill fields, there is no email or link, anyone can sign as anyone, and **every request disappears on page refresh**. |

The one part that is close to the original is **creating a signature** (type, draw, upload, initials, one saved signature). There our prototype even has extras.

---

## What is missing, in priority order

Effort: **S** = hours to about a day, **M** = a few days, **L** = a week or more, for the browser-only prototype.

### Phase 1: make what we have trustworthy (small changes, big effect)
| # | Gap | Why it matters | Effort |
|---|---|---|---|
| 1 | **Save signature requests across refresh** (`signatureRequests` is left out of `saveState` in `proto:src/context/app-context.tsx`) | Every new request, signature and decline disappears on reload, so nothing can be demonstrated reliably. | S |
| 2 | **Enforce signing order and status rules** | In the original, after each signature the next signer becomes active and gets an email. It refuses signing out of turn or on voided/completed envelopes. In ours, signer 2 stays "waiting" forever but can still sign, and declined, expired or cancelled requests can still be signed. | S |
| 3 | **Signer identity check** | The original only lets the logged-in owner of the recipient email sign (checked on the server). Ours lets anyone sign as any signer through "Testing as Signer". | S–M |
| 4 | **A real "Sign it yourself" path** | Supervisor's point (a). The request should have you as the only signer and go straight to signing, with no sending step. | M |
| 5 | **Drafts: auto-save, resume and send later; check before sending** | The original auto-saves drafts, reopens them at the right step, and before sending lists the problems: no document, no recipient, bad email, a signer with no fields. Our drafts can never be sent. | S–M |
| 6 | **Delete, Trash, Restore** (single and bulk, with confirm) | The original has a Deleted folder. Our only removal action is Cancel, with no confirmation. | S–M |
| 7 | **Automatic expiry and reminders + a simulated "Outbox"** | The original runs a check every 15 minutes, emails reminders and voids expired envelopes. Our settings page says this happens, but nothing runs. The prototype can check when the app loads and log the "emails" in-app. | S–M |

### Phase 2: real documents (the supervisor's main point)
| # | Gap | Why it matters | Effort |
|---|---|---|---|
| 8 | **Upload a real PDF** (PDF only, ≤ 5 MB, header check), stored in **IndexedDB** (localStorage is too small for files) | Users cannot bring their own document today. | L |
| 9 | **PDF viewer** (pdf.js: pages, zoom, thumbnails) | Needed to show the real document to the sender and the signer. | (part of 8) |
| 10 | **Drag-and-drop field placement on the page** for each recipient: move, resize, delete, undo; positions stored as fractions of the page. Add the missing field types (Email, Company, Title, Number, Dropdown, Radio, Approve, Decline). | This is the core "Add fields" step of the original. Ours stores random positions and never draws them. | L |
| 11 | **Signer fills their fields on the document**, pre-filled date, name, email, company and title, "adopt once, sign everywhere", required-field check | Today signing ignores fields completely. | M |
| 12 | **Generate and download the signed PDF** (`<title> - signed.pdf`, values written onto the pages with pdf-lib, which also runs in the browser) | This is the final product of both flows. We only offer `.md` text downloads. | M |

### Phase 3: completeness
| # | Gap | Effort |
|---|---|---|
| 13 | Recipient roles **Receives a Copy** and **Needs to View** (ours has signers only; the "role" is free text) | S–M |
| 14 | Inbox tools: pagination (25/50/100), mine/received scope, date and sender filters, Clear All, filters kept in the URL, row checkboxes with bulk actions, counts on every folder | M |
| 15 | Ownership: show only requests I sent or that are addressed to me; block other people's detail pages | M |
| 16 | Preview as a recipient (desktop / tablet / mobile) | S |
| 17 | Small detail-page items: decline reason shown, copy-ID feedback, Cancel and Delete on the detail page | S |
| 18 | Real email, real accounts with email verification, password reset by code | L, **needs a backend.** Keep simulated in the prototype, but stop storing plain-text passwords and fix the misleading reset screens (S). |

---

## Do not copy as "missing": the original does not have these either
- No OTP or access code for **signers**. The original uses one-time codes only for its own sign-up and password reset.
- No certificate of completion or audit page. Audit events are stored but never shown.
- A **sent** envelope cannot be voided (only drafts), and the **Resend** button does nothing.
- "In Person Signer" behaves exactly like a normal signer.
- Every field is always required, and Dropdown/Radio fields have no way to enter options.
- Only the **first document** of an envelope is shown to signers and written into the signed PDF.
- Templates and Reports are empty placeholder pages.
- The expiry alert, responsive-signing and comments options are saved but do nothing.
- Uploaded GIF/BMP signatures are left out of the PDF, and typed signatures lose their font in the PDF.

## Where our prototype is ahead (keep these)
- Company seals, and the setting for which signing methods are allowed.
- A visible audit trail page (its blank event-title bug needs fixing).
- Agreement reports, Declined and Expired tabs, Duplicate and Cancel request.
- An "I agree to electronic records" consent checkbox, a per-field "Mandatory" toggle, and upload inside the signing pad.

*All of these also lose their data on refresh until gap #1 is fixed.*

---

## Detailed analysis
The three parts below cover each flow step by step: how the original works, a full comparison table (Missing / Partial / Simulated / Present / Prototype-only), and that part's priority list.

- **Part A:** sign a document yourself, and creating a signature
- **Part B:** get signatures from others (prepare, send, recipient signs)
- **Part C:** managing agreements (home, inbox, detail, delete/restore, downloads, accounts, persistence)

---

## Part A. "Sign a document yourself" (self-sign) and the signature itself

In the original Flash Sign, a user can upload a real PDF, drag their own fields onto the pages (pre-filled from their profile and saved signature), finish, sign on the normal signing screen, and then get a flattened signed PDF (download + email attachment). Our prototype has **no self-sign flow at all**: the "Sign a Document" menu item opens the same "Request Signature" wizard as "Get Signatures", there is no file upload, no PDF, and no field placement on a page. Signature *creation* (type / draw / upload, initials, one saved signature per user) is the one part where the prototype is close to the original, and it even adds extras (company seals, allowed-method setting).

### How the original does it

**A. Starting the flow**
1. Entry points: the header "Start" menu → "Envelopes" flyout → **"Sign a Document"** (`orig:src/components/StartMenu.tsx:146-155`), and the home hero banner (`orig:src/components/HeroBanner.tsx:40`). Both go to `/envelopes/sign` (`orig:src/app/envelopes/sign/page.tsx:1-5`).
2. Second entry point: in the "Get Signatures" setup, the checkbox **"I'm the only signer"** (`orig:src/components/RecipientsEditor.tsx:329-343`). When it is on, "Next" goes to the same self-sign editor instead of the send editor (`orig:src/components/SetupEnvelope.tsx:115-127`). This path allows uploading several files (`multiple`, `orig:src/components/SetupEnvelope.tsx:236`).

**B. Upload screen — "Sign a document"** (`orig:src/components/SignDocumentUpload.tsx`)
1. A card with a dashed drop zone: "Drop your files here or" + **Upload** button, and the hint **"PDF only · up to 5 MB per file"** (`orig:src/lib/documents.ts:9-13`).
2. Only **one** file is taken (the first of the list, `orig:src/components/SignDocumentUpload.tsx:33-43`). Browser checks: type must be `application/pdf` (or `.pdf` name when the browser gives no type) and size ≤ 5 MB. Errors: "`<name>`: Only PDF files are supported" / "`<name>` must be under 5 MB" (`orig:src/lib/documents.ts:25-33`).
3. The file name is shown. Buttons: **Cancel** (back to /home) and **Sign** ("Preparing…" while working) (`orig:src/components/SignDocumentUpload.tsx:150-165`).
4. On Sign, the browser reads the file as a base64 data URL and calls `POST /api/envelopes/self-sign` (`orig:src/components/SignDocumentUpload.tsx:45-61`, `orig:server/routes/envelopes.ts:86-119`). The JSON body limit is 8 MB (`orig:server/index.ts:39`).
5. Server checks again before creating anything (`orig:server/lib/self-sign.ts:48-51`, `orig:server/lib/draft-setup.ts:394-419`): file name not empty; size ≤ 5 MB (both the claimed size and the real decoded bytes); MIME is `application/pdf`; and the real bytes contain the `%PDF-` header in the first 1 KB (this rejects an image or Word file renamed to .pdf).
6. Server creates a **draft envelope** with `onlySigner = true`, signing order off, subject = file name without extension, and **one recipient = the logged-in user** (role `needs_to_sign`, order 1) (`orig:server/lib/self-sign.ts:53-72`).
7. The document is stored **as a base64 data URL in the database** (`envelope_documents.file_url`, a Postgres `text` column; `orig:server/db/schema.ts:234-249`, `orig:server/lib/draft-setup.ts:440-450`). The real page count is read with pdf-lib (`orig:server/lib/draft-setup.ts:355-361`). No page-count limit and no limit on the number of documents was found in code.
8. The browser goes to `/envelopes/sign/add-fields?draft=<id>` (`orig:src/lib/envelope-draft.ts:71-73`).

**C. Self-sign editor** (`orig:src/components/AddFields.tsx` with `mode="selfSign"`, `orig:src/app/envelopes/sign/add-fields/page.tsx:13`)
1. Layout (`orig:src/components/AddFields.tsx:1509-1800`): dark header "Drag and drop fields from the left panel onto the document", save status ("Saving…" / "All changes saved" / "Save failed"), and a split button **Finish ▾** with "Other Actions": **Finish Later** and **Void**.
2. Left panel "Fields" with 3 groups (`orig:src/components/AddFields.tsx:1603-1621`):
   - Signature: **Signature, Initial, Date Signed**
   - Identity: **Name, Email, Company, Title**
   - Input: **Text, Checkbox** (Number, Dropdown, Radio, Approve, Decline are send-mode only; `orig:src/components/AddFields.tsx:212-214`)
3. Centre: the **real PDF**, rendered page by page with pdf.js on a canvas (`orig:src/components/PdfCanvas.tsx:47`, `:117-180`), all pages in one scroll. Sharp on high-DPI screens (`devicePixelRatio`).
4. Right rail: Search (button has no action), **View Pages** (thumbnail panel, click to jump), **Download** (opens the *original unsigned* file), **Print** (`window.print()`), **Zoom + / −** from 50% to 200% in 10% steps (`orig:src/components/AddFields.tsx:1640-1725`).
5. Placing a field: **drag** a field from the panel onto any page (a ghost preview follows the mouse and shows your real value; the target page is highlighted), or **click** it to drop it on the current page (new fields cascade a little so they do not stack) (`orig:src/components/AddFields.tsx:1100-1200`). Default sizes are fractions of the page, e.g. signature 24% × 6%, initial 12% × 6%, checkbox 3.5% × 2.8% (`orig:src/components/AddFields.tsx:263-272`).
6. **Pre-filled values** from your profile (`orig:src/lib/field-defaults.ts:31-57`): Signature/Initial = your saved signature image (or your name / initials as text if you chose a typed style); Date Signed = today as M/D/YYYY; Name, Email, Company, Title = profile values. Only the first (and only) saved signature is used (`orig:src/components/AddFields.tsx:990-1000`).
7. Editing in place: Name, Email, Company, Title, Text (and Number) are real text inputs on the page (`orig:src/components/AddFields.tsx:274-281`, `:771-788`). Signature/Initial show the "Signed by:" bracket mark with a short id "fingerprint" (`orig:src/components/SignatureMark.tsx:12-16`, `:57-80`).
8. Move by dragging, **resize** with the corner handle (minimum 3% × 1.5%), delete with the × button or the Delete/Backspace key, undo/redo with Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y (`orig:src/components/AddFields.tsx:1050-1094`, `:1300-1336`). Undo keeps 50 steps (`orig:src/hooks/useEnvelopeFields.ts:55`, `orig:src/lib/field-history.ts`).
9. **Autosave**: 700 ms after each change, the whole field list is saved with `PUT /api/envelopes/:id/fields` (`orig:src/hooks/useEnvelopeFields.ts:215-222`, `orig:server/routes/envelopes.ts:341-365`). Positions are stored as fractions 0..1 of the page (x, y, width, height, page number). The server rejects unknown document/recipient ids and unknown field types, clamps numbers to 0..1, and sets `required = true` by default (`orig:server/lib/draft-fields.ts:109-200`). There is no "required/optional" toggle in the self-sign UI.
10. Only the **first document** of the envelope is shown and editable (`orig:src/hooks/useEnvelopeFields.ts:156`). There is no document switcher.

**D. Finish → sign → completed**
1. **Finish**: saves pending changes, then `POST /api/envelopes/:id/finish-self-sign` (`orig:src/components/AddFields.tsx:1233-1256`, `orig:server/routes/envelopes.ts:414-431`).
2. Server validation (`orig:server/lib/self-sign.ts:91-168`): must be a draft; must be a self-sign draft; at least one document; exactly one signer; that signer's email must be **your account email**; at least one field placed. Problems are shown in an "Almost there — Fix the following before finishing:" dialog with "Back to Upload" / "Got it" (`orig:src/components/AddFields.tsx:1426-1506`).
3. On success: recipient → "Needs to sign"; envelope → `waiting_for_others`, folder "sent", `sentAt` = now, `expiresOn` from the envelope's expiry setting; an activity "sent" with `selfSign: true` is written (`orig:server/lib/self-sign.ts:170-211`). **No invite email** is sent. A signing JWT (valid 30 days) is created for you (`orig:server/lib/signing-token.ts:17-36`).
4. The browser goes to `/sign/<token>` — **the same signing screen recipients use** (`orig:src/components/SignDocument.tsx`). Login is still checked: because you have an account, you must be signed in as that email (`orig:server/routes/sign.ts:34-58`).
5. On the signing screen, values you set in the editor are already filled; empty signature/initial/name/email/date fields are filled from your profile (`orig:src/components/SignDocument.tsx:585-607`). Clicking a signature/initial field opens a pad with tabs **Saved** (if you have one) / **Draw** / **Type**, button **"Adopt & Sign"**; the adopted value is applied to that field and every other empty field of the same type ("adopt once, sign everywhere", `orig:src/components/SignDocument.tsx:98-171`, `:641-656`). A counter shows "n required fields left". **Decline** is also offered.
6. **Finish** → `POST /api/sign/:token/submit`: the server checks all required fields have a value, saves each value with `completedAt`, sets the envelope to **completed**, writes activity (`orig:server/lib/signing.ts:309-430`).
7. After completion the server builds the flattened PDF and **emails it as an attachment** ("Completed: "<title>"", with a "View Document" link) to every recipient — for self-sign that is you (`orig:server/lib/signing.ts:438-482`, `orig:server/lib/mailer.ts:219-241`).
8. The screen shows "All done — document complete" with a **"Download signed PDF"** button (`orig:src/components/SignDocument.tsx:713-714`, `/api/sign/:token/signed.pdf`, `orig:server/routes/sign.ts:111-137`). Later, the envelope detail page also has a **Download** button for any non-draft envelope (`orig:src/components/EnvelopeDetail.tsx:242-252`, `orig:server/routes/envelopes.ts:369-393`).
9. **Finish Later** saves and goes to the Drafts folder; opening that draft again goes back to the self-sign editor (`orig:src/lib/envelopes.ts:93-103`). **Void** sets the draft to `voided` and moves it to Deleted (`orig:server/lib/self-sign.ts:219-258`).

**E. What the final signed PDF contains** (`orig:server/lib/pdf-flatten.ts:39-154`)
- The original PDF pages of the **first document only** (`:53`), with each filled field drawn at its saved position (fractions converted to PDF points).
- Signature / initial **images** (PNG or JPG) embedded and scaled to fit the box (`:102-127`). GIF/BMP uploads cannot be embedded and are silently skipped (only `embedPng`/`embedJpg`, errors ignored).
- Typed signatures/initials drawn as text in **Helvetica Oblique** (the chosen script font is not used in the PDF) (`:144-149`).
- Other values (date, name, email, company, title, text) as Helvetica text, max 12 pt; checkbox as "X". Non-Latin characters and emoji are removed (`:21-27`).
- File name: "`<title>` - signed.pdf" (`:29-33`).
- **Not included:** no audit/certificate page, no cryptographic (PKI) PDF signature, no hash, no "Signed by" bracket or fingerprint (those are on-screen only).

**F. The signature itself — saved signature in Profile** (`orig:src/components/CreateSignatureModal.tsx`, `orig:src/components/ProfilePage.tsx:846-966`)
1. Profile → "Signatures": **Add signature** / **Replace signature**, plus Edit and Delete for the existing one.
2. Modal "Create Your Signature" / "Edit Your Signature": **Full name**, **Initials** (auto from the first letters of the first two words, upper-case, editable) (`:51-58`, `:305-340`).
3. Three tabs (`:455-470`):
   - **Choose**: 4 typed styles — formal (Playfair Display italic), script (Dancing Script), bold (Caveat), elegant (Great Vibes) — each showing signature and initials (`:19-39`).
   - **Draw**: two pads, "Draw Signature" and "Draw Initials", saved as PNG data URLs.
   - **Upload**: two images (signature + initials), JPG/JPEG/GIF/PNG/BMP, max **200 KB** each (`:42-49`, `:236-246`).
   - "Create" is enabled only when name + initials are set and, for Draw/Upload, **both** images exist (`:358-363`).
4. Consent text: "By clicking Create, I agree that the signature and initials will be the electronic representation of my signature and initials for all purposes … including legally binding contracts." (`:568-571`).
5. **One signature per user**: creating a second one asks "Replace Existing Signature" and overwrites (`orig:src/components/ProfilePage.tsx:134-183`, `:443-490`); the server also keeps only one (`orig:server/lib/profile.ts:42-58`, `:144-160`).
6. Stored in the `signatures` table: name, initials, styleId, source (choose/draw/upload), signatureImage, initialsImage (data URLs) (`orig:server/db/schema.ts:167-185`). API: `POST/PATCH/DELETE /api/profile/signatures` (`orig:server/routes/profile.ts:104-155`).
7. Adopting a new drawn/typed signature on the signing screen does **not** save it to the profile (no call found in `SignDocument.tsx`).

### Comparison table

| # | Capability | Original (how it works) | Our prototype | Status |
|---|---|---|---|---|
| 1 | Separate "Sign a Document" (self-sign) entry | Start menu / hero → `/envelopes/sign` upload page | Menu item exists but links to the same `/signatures/new` "Request Signature" wizard as Get Signatures (`proto:src/app/(workspace)/agreements/page.tsx:26-27`). No self-sign code anywhere | **Missing** |
| 2 | "I'm the only signer" option in the send setup | Checkbox; routes to self-sign editor, you become the only recipient | None. Workaround: remove signer 2 in the wizard (allowed down to 1 signer, `proto:src/app/(workspace)/signatures/new/page.tsx:510`), dispatch, then "Test Sign" | **Missing** |
| 3 | Upload a PDF file | Drag-drop or button; file bytes stored | Wizard has no upload; only "Link Existing Document" from the demo library. The library's upload dialog keeps only the file name and size, never the bytes (Features v2 §11.3) | **Missing** |
| 4 | File type check (PDF only, incl. `%PDF-` header check on server) | Browser + server checks; renamed non-PDFs rejected | None (no real file) | **Missing** |
| 5 | Size limit 5 MB per file | Enforced in browser and server | None (upload dialog says "up to 25 MB" but does not enforce it) | **Missing** |
| 6 | Real page count of the document | Read from the PDF with pdf-lib | Always 4 pages (fake) | **Simulated** |
| 7 | Upload Word / image and convert to PDF | Not supported (PDF only) | Not supported | Not in either (n/a) |
| 8 | Multiple documents in one self-sign | Self-sign page: one file. Via "only signer" setup: several files can be uploaded, but the editor, signing screen and PDF export use only the first one | One linked text document per request | **Missing** (and limited in original) |
| 9 | Show the real PDF pages | pdf.js canvas, all pages, high-DPI | Plain text in a styled `div` | **Missing** |
| 10 | Zoom | 50–200% (+/− 10%) | None | **Missing** |
| 11 | Page thumbnails / jump to page | "View Pages" panel | None | **Missing** |
| 12 | Print / download original from the editor | Print button, Download original file | None | **Missing** |
| 13 | Field palette for self-sign | Signature, Initial, Date Signed, Name, Email, Company, Title, Text, Checkbox | Studio palette has Signature, Initials, Date Signed, Full Name, Text Input, Checkbox, but only for requests, not self-sign; no Email/Company/Title | **Partial** |
| 14 | Drag field onto page at exact position | Drag from panel to any page; position saved as 0..1 fractions + page number | Fields get random X/Y; positions are never drawn; shown as a 2-column list (Features v2 §10.12) | **Missing** |
| 15 | Click to add field on current page | Yes, with cascade offset | "Click to add" adds to a list, not to a page | **Simulated** |
| 16 | Move a placed field | Drag | No | **Missing** |
| 17 | Resize a placed field | Corner handle, min size | No | **Missing** |
| 18 | Delete a field (button + Delete key) | Yes | "Remove Field" button only | **Partial** |
| 19 | Undo / redo field changes | Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, 50 steps | No | **Missing** |
| 20 | Pre-fill your own values (signature, initials, date, name, email, company, title) | From profile + saved signature, shown on the page while placing | No field values exist; fields are never filled | **Missing** |
| 21 | Type values directly into fields on the page | Inline inputs for text-like fields | No | **Missing** |
| 22 | Required / optional field | Stored (`required`, default true); no toggle in self-sign UI; enforced at submit | "Mandatory Field" checkbox in the studio, but nothing enforces it when signing | **Simulated** |
| 23 | Autosave of fields | Every change saved to server after 700 ms; status shown | Saved only on "Save Configuration", into memory; lost on refresh | **Partial** |
| 24 | "Finish Later" (keep as draft, resume into the same editor) | Yes; draft reopens in self-sign editor | No self-sign draft; signature requests are not saved across refresh | **Missing** |
| 25 | Void a self-sign draft | Yes → voided / Deleted folder | Cancel request exists for requests (not saved) | **Missing** (for self-sign) |
| 26 | Validation before finishing | ≥1 document, exactly one signer = your account email, ≥1 field; issues listed in a dialog | None | **Missing** |
| 27 | Self-sign without sending any email | Finish activates envelope, no invite email, goes straight to signing | Prototype never sends email anyway; but there is no self-sign path | **Missing** |
| 28 | Signing screen with fields on the PDF | Same screen as recipients; click each field; "n required fields left" | Signing page shows text only; fields are not shown or filled; one signature block at the bottom | **Simulated** |
| 29 | Adopt once, apply to every signature/initial field | Yes | Only one signature per signing; no per-field placement | **Missing** |
| 30 | Signer must be you (login check) | Signing token + must be logged in as the signer email | Any user can sign as any pending signer ("Testing as Signer") | **Missing** |
| 31 | Flattened signed PDF (values burned into pages) | pdf-lib: images, text, checkbox "X" | No PDF at all | **Missing** |
| 32 | Download signed PDF | On completion screen and on envelope detail ("<title> - signed.pdf") | Only `.md` text "execution certificate demo" / audit files (`proto:src/app/(workspace)/signatures/completed/page.tsx:43-65`) | **Missing** |
| 33 | Email the signed PDF to the signer | "Completed: <title>" email with PDF attached | No email | **Missing** |
| 34 | Audit / certificate page inside the PDF | Not in original either (activity is stored in DB only) | Not present (separate simulated audit page, `.md` download) | Not in either |
| 35 | Cryptographic PDF signature / tamper seal | Not in original | Not present ("SIMULATED #9182" text) | Not in either |
| 36 | Self-signed document listed with status (sent → completed) and kept after refresh | Stored in PostgreSQL; appears in Sent / Completed | Requests are lost on refresh | **Missing** |
| 37 | Create signature: Type in 4 styles | Choose tab: formal, script, bold, elegant | Type tab with the same 4 styles and same fonts (`proto:src/components/signature/signature-fonts.ts:10-15`) | **Present** |
| 38 | Create signature: Draw (signature + initials pads) | Yes, PNG data URLs | Yes, two canvases + Clear (`proto:src/components/signature/signature-editor.tsx:211-241`) | **Present** |
| 39 | Create signature: Upload image | JPG/JPEG/GIF/PNG/BMP, max 200 KB, two images | Same types and 200 KB limit (`proto:src/components/signature/signature-editor.tsx:13-14`, `:270-271`) | **Present** |
| 40 | Initials (auto from name, editable) | First letters of first 2 words, upper-case | From all words, upper-case, max 4 letters (`proto:src/components/signature/signature-editor.tsx:12,23`) | **Present** |
| 41 | One saved signature per user, replace / edit / delete | Profile → Signatures; replace confirm dialog; server keeps one | Settings → My Signature: Create / Change / Delete (with confirm); one per user; saved in localStorage (survives refresh) (`proto:src/app/(workspace)/settings/signature/page.tsx:13-115`, `proto:src/context/app-context.tsx:1749-1753`) | **Present** (browser storage only) |
| 42 | Saved signature used automatically when signing | Pre-filled into fields; "Saved" tab in the pad | Used automatically on the signing page; "Change signature" for one document | **Present** |
| 43 | Save a new signature from the signing screen | Not possible (pad does not save to profile) | "Save this as my signature for next time" checkbox | **Prototype-only** |
| 44 | Upload option inside the signing pad | No (pad = Saved / Draw / Type) | Yes (Type / Draw / Upload, per admin setting) | **Prototype-only** |
| 45 | Admin setting: which signature methods are allowed | No | "Signers may sign by" Type/Draw/Upload (`Features v2 §10.16`) | **Prototype-only** |
| 46 | Company seal on signature | No | Optional, role-limited seal shown under the signature | **Prototype-only** |
| 47 | Legal consent text when creating a signature | "…electronic representation of my signature … legally binding contracts" | Signing page has a "non-binding prototype" acknowledge checkbox; no consent text on creating a signature | **Partial** |
| 48 | "Signed by:" bracket with id fingerprint on the signature mark | Shown on screen (not in PDF) | Signature mark has no bracket or id (`proto:src/components/signature/signature-mark.tsx:11-40`) | **Missing** |
| 49 | Typed signature keeps its font in the final document | No — PDF uses Helvetica Oblique | Shown in chosen font on screen; stored as text "Typed (style): Name" | n/a (original is weaker) |

### Biggest gaps (priority order)

1. **No real self-sign path** — "Sign a Document" just opens the send wizard; the supervisor's case (a) does not exist. Add a `/signatures/sign-yourself` (or similar) route that creates a request with only the current user as signer and jumps to signing. *Effort: M.*
2. **No real file upload / no PDF viewer** — users cannot bring their own document; everything is demo text. Read the file as a data URL (PDF only, ≤ 5 MB), keep it in IndexedDB, and render it with pdf.js (zoom, page thumbnails). *Effort: L* (pdf.js setup + browser storage size limits).
3. **No field placement on the page** — no drag, move, resize, or exact positions; signing ignores fields. Needed so the signature lands at a chosen spot. Reuse 0..1 fraction coordinates like the original. *Effort: L.*
4. **Fields are never filled / no pre-fill from profile** — signature, initials, date, name, email, company, title should be pre-filled and editable on the page, and "required" should be enforced at Finish. *Effort: M* (after #3).
5. **No signed PDF output / download** — the final deliverable of self-sign. In the browser this can be done with pdf-lib (embed signature images, draw text), downloaded as "<title> - signed.pdf". *Effort: M* (after #2–#4).
6. **Self-signed (and all) requests are lost on refresh** — a self-signed document must stay in Completed. Add `signatureRequests` (and stored files) to saved state. *Effort: S–M* (S for state, M if files go to IndexedDB).
7. **No "Finish Later" / resume draft / void for self-sign** — users lose work if they stop halfway. *Effort: S* once #6 is done.
8. **No email of the signed copy** — the original emails the PDF. In a browser-only prototype this can only be simulated (e.g. a "copy sent to your email" note or in-app notification). *Effort: S (simulated) / not possible without a backend.*
9. **No signer identity check** — anyone can sign as anyone; for self-sign the signer must be the logged-in user. *Effort: S.*
10. **Signature creation is mostly done** — only small gaps: add the legal consent text on "Create signature" and the "Signed by:" bracket mark. *Effort: S.* (Our prototype is ahead here with seals, upload in the signing pad and "save for next time".)

---

## Part B. Get signatures from others (prepare and send an envelope, recipient signs)

In the original Flash Sign, the sender uploads one or more real PDFs, adds recipients with a role (signer, in-person signer, receives a copy, needs to view), can set a signing order, writes a subject and message, drags fields onto the real PDF pages for each recipient, and presses **Send**. The server checks the envelope, emails each recipient a personal signing link, sends automatic reminders, voids the envelope when it expires, and emails everyone the flattened signed PDF when the last signer finishes.
Our prototype has a 5-step wizard that looks similar. But it links a text "document" (no PDF), has signers only, does not draw or fill fields, sends no email, does not check who is signing, does not enforce the signing order, and loses every request when the page is refreshed.

Path prefixes: `orig:` = `New folder/flash-sign-main/`, `proto:` = `flash-sign-proto/`.

---

### How the original does it

#### Step 0 – Draft is created and auto-saved
1. The user opens **Get signatures** (`/envelopes/get-signatures`). The page is "Set Up Envelope · Step 1 of 2" (`orig:src/components/SetupEnvelope.tsx:163-168`).
2. A draft envelope row is created on the server the first time the user does something real (for example, uploads a file) (`orig:src/hooks/useEnvelopeDraftSetup.ts:338-352`, `orig:server/lib/draft-setup.ts:122-151`). New drafts start with reminders = "Every 2 days" (`orig:server/lib/draft-setup.ts:142`).
3. Every change (recipients, subject, message, reminder, order) is saved to the server automatically about 0.7 seconds after the last edit ("Saving…" is shown in the header) (`orig:src/hooks/useEnvelopeDraftSetup.ts:311-318`, `orig:server/routes/envelopes.ts:186-230`). Drafts are kept in the **Drafts** folder and can be opened again (`orig:server/routes/envelopes.ts:54-67, 172-184`).

#### Step 1a – Add documents (accordion "Add documents")
4. Drag and drop or click **Upload**. You can choose several files at once (`multiple`) (`orig:src/components/SetupEnvelope.tsx:233-292`).
5. **PDF only, up to 5 MB per file** (`orig:src/lib/documents.ts:9-15`). The browser checks this, and the server checks again: name required, size ≤ 5 MB, MIME must be `application/pdf`, and the bytes must contain `%PDF-` in the first 1 KB. So a renamed image or Word file is rejected (`orig:server/lib/draft-setup.ts:394-419`).
6. The server counts the real pages with pdf-lib (`orig:server/lib/draft-setup.ts:357-364`). It stores the file and keeps an order number, so **one envelope can hold several documents** (`orig:server/db/schema.ts:233-249`, `orig:server/lib/draft-setup.ts:421-477`). Each file can be removed (trash icon), and the others are renumbered (`orig:server/lib/draft-setup.ts:510-560`).
7. **Next: Add Fields** is disabled until at least one document is added (`orig:src/components/SetupEnvelope.tsx:113, 192-204`).

#### Step 1b – Add recipients (accordion "Add recipients")
8. Each recipient row has **Name**, **Email** and a **role menu** with 4 roles (`orig:src/components/RecipientsEditor.tsx:31-56`, `orig:server/db/schema.ts:41-46`):
   - **Needs to Sign**: gets a signing link and must sign.
   - **In Person Signer**: in the code it is handled exactly like "Needs to Sign" (emailed a link, `SIGNER_ROLES` in `orig:server/lib/send-envelope.ts:18`). There is no separate in-person (host) flow.
   - **Receives a Copy**: gets a "shared with you" email with a view link at send time, and the completed PDF at the end.
   - **Needs to View**: same treatment as "Receives a Copy" (the copy email). Nothing forces them to view before completion.
9. **Add Recipient** adds an empty row. The small menu next to it lists **Your contacts**: yourself (marked "You") plus everyone you have sent to before (`orig:src/components/RecipientsEditor.tsx:260-299, 493-590`, `orig:server/lib/contacts.ts:167-210`). So **the sender can add themself as a recipient**. Duplicate emails from the contact list are blocked.
10. **"I'm the only signer"** checkbox: replaces the list with the current user and switches the flow to self-sign (out of scope here, see the self-sign report) (`orig:src/components/RecipientsEditor.tsx:331-344`, `orig:src/hooks/useEnvelopeDraftSetup.ts:408-438`).
11. **"Set signing order"** checkbox (enabled with 2+ recipients). When it is on, each row shows an editable order number plus up/down arrows. Typing a number or pressing the arrows moves the row (`orig:src/components/RecipientsEditor.tsx:158-221, 346-411`). The routing order is saved as the list position 1, 2, 3… (`orig:src/hooks/useEnvelopeDraftSetup.ts:67-73`). So in the UI it is strictly one after another (two people cannot share the same step). The server does support equal numbers (`orig:server/lib/send-envelope.ts:116-123`).
12. Remove recipient (when more than one). Emails are trimmed and lower-cased on save. The server keeps the recipient ids, so fields already placed for a recipient are not lost when the list is edited (`orig:server/lib/draft-setup.ts:293-344`).
13. There is a "View" button next to the signing-order box that does nothing (no handler) (`orig:src/components/RecipientsEditor.tsx:361-366`).

#### Step 1c – Add message (accordion "Add message")
14. **Subject** (max 100 characters, counter, marked `*`) and **Message** (max 10,000 characters, counter) (`orig:src/components/SetupEnvelope.tsx:110-111, 346-396`). The subject also becomes the envelope title (`orig:server/lib/draft-setup.ts:240-245`).
    - Note: the subject is not checked when sending. The real email subject is fixed text, `"{sender} sent you "{title}" to sign"`, where title = the subject (`orig:server/lib/mailer.ts:174`).
15. **Frequency of reminders**: Every day / Every 2 days / Every 3 days / Every week / Never (`orig:src/components/SetupEnvelope.tsx:23-29, 398-421`).

#### Step 1d – Advanced options (gear icon, `/envelopes/get-signatures/advanced-options`)
16. Sections (`orig:src/components/AdvancedOptions.tsx:16-20`):
    - **Recipient Privileges**: two ticked, locked checkboxes ("Recipients can sign on paper", "…change signing responsibility or assign a delegate"), "Managed by your plan". **Display only.** Nothing in the server uses them (`:288-320`).
    - **Reminders**: switch "Turn on auto reminders". Off = reminder frequency "never". On = keeps the frequency, or sets "every 2 days" if it was "never" (`:323-345`, `orig:server/lib/draft-setup.ts:282-288`).
    - **Expiration**: "Days until envelope expires" 30/60/90/120 or Custom (1–999), with the date shown. Default 120 days (`:348-440`, `orig:src/lib/advanced-options.ts:8-13, 25-33`). **"Send alert"** (on expiration day / 3 / 7 days before / custom) is saved, but **no code sends this alert** (only the UI and the save code read `expireAlertDays`).
    - **Mobile-Friendly / Responsive Signing** checkbox and **Comments** checkbox: saved in `advancedOptions`, but **not used anywhere else** (`:446-478`).
    - **Save** writes these values to the draft (`:197-222`).

#### Step 2 – Add fields (`/envelopes/get-signatures/add-fields`)
17. The editor shows the **real PDF pages** (pdf.js) with page thumbnails, a document switcher, and zoom 50–400 % (`orig:src/components/AddFields.tsx:2094-2106`).
18. **Recipient picker** in the sidebar: new fields are assigned to the selected recipient. Each recipient has a colour, and only the selected recipient's fields on the active document are shown (`orig:src/components/AddFields.tsx:603-700, 1338-1342`). Any recipient with a name or email can own fields, including copy/view recipients (`orig:src/hooks/useEnvelopeFields.ts:149-155`).
19. **14 field types** in 4 groups (`orig:src/components/AddFields.tsx:74-246`, `orig:server/db/schema.ts:61-76`):
    - Signature: Signature, Initial, Date Signed
    - Contact Information: Name, Email, Company, Title
    - Inputs: Text, Number, Checkbox, Dropdown, Radio
    - Actions: Approve, Decline
20. Click a palette item to drop it on the current page, or drag it to an exact spot. Each type has a default size (`orig:src/components/AddFields.tsx:263, 1100-1124`). A placed field can be **moved** by dragging, **resized** with the corner handle, **deleted** (button or Delete key) and **duplicated**. **Undo/Redo** keeps up to 50 steps (Ctrl/⌘+Z, Ctrl/⌘+Shift+Z) (`orig:src/components/AddFields.tsx:709-840, 1211-1215, 1301-1336`, `orig:src/hooks/useEnvelopeFields.ts:55`).
21. Positions are stored as fractions (0–1) of the page, so they stay correct at any zoom (`orig:server/lib/draft-fields.ts:232-247`). Fields auto-save (debounced). The server checks that every field points to a document and a recipient of this envelope and has a valid type (`orig:server/lib/draft-fields.ts:326-417`).
22. Limits: every field is saved as **required = true**. There is **no properties panel** to make a field optional or to type options for Dropdown/Radio (`orig:src/hooks/useEnvelopeFields.ts:347-348`). On the signer's side, a Dropdown/Radio without options becomes a plain text box (`orig:src/components/SignDocument.tsx:384-415`).

#### Step 2b – Preview (`/envelopes/get-signatures/preview`)
23. Shows the envelope **as a chosen recipient** would see it (recipient dropdown), in **Desktop / Tablet / Mobile** widths (900/720/375 px) (`orig:src/components/EnvelopePreviewView.tsx:115-193, 231-271`).

#### Step 3 – Send (`POST /api/envelopes/:id/send`)
24. **Send** first flushes unsaved fields, then calls the server (`orig:src/components/AddFields.tsx:1217-1234`).
25. **Server checks** (`orig:server/lib/send-envelope.ts:70-110`). If something is wrong, a modal lists the problems (`orig:src/components/AddFields.tsx:1428-1500`):
    - at least 1 document; at least 1 recipient;
    - every recipient has a name and a valid email format;
    - at least 1 signer role;
    - **every signer has at least one field**.
26. **Routing** (`orig:server/lib/send-envelope.ts:112-181`):
    - Signing order off: every signer becomes "Needs to sign" at once.
    - Signing order on: only the lowest order number(s) become "Needs to sign"; the rest are "Waiting".
    - Copy/view recipients get the label "Copied".
    - Envelope → status `waiting_for_others`, folder `sent`, `sentAt` = now, and **expiry date = send date + expireDays** (default 120) (`:132-135`).
    - Audit row `sent` with recipient and signer counts (`:172-180`).
27. **Emails after send** (`orig:server/lib/send-envelope.ts:183-214`). Each recipient gets their own link `/sign/{token}`:
    - active signers → **"Review & Sign"** invite with the sender's message (`orig:server/lib/mailer.ts:162-190`);
    - copy/view recipients → **"View Document"** "shared with you" email (`orig:server/lib/mailer.ts:192-216`);
    - waiting signers → emailed later, when it is their turn.
    - If SMTP is not set up, the email (with the link) is printed in the server console instead (`orig:server/lib/mailer.ts:56-67`, `orig:docs/EMAIL_SETUP.md`).
28. The sender is taken to `/envelopes/{id}?sent=1` (envelope detail).

#### Signing link and identity
29. The link token is a **signed JWT** (envelope id + recipient id + purpose "sign"), **valid for 30 days**. No login is needed to open it if the email has no Flash Sign account (`orig:server/lib/signing-token.ts:17-48`).
    - Note: a JWT lasts 30 days, but the envelope lasts 120 days by default. The first invite link stops working after 30 days, but each reminder email carries a new link.
30. **Conditional login:** if the recipient's email belongs to a Flash Sign account, they must **sign in as that account**. If they are signed in as someone else, they see "wrong account". This is checked on the server for every action (`orig:server/lib/signing.ts:99-119`, `orig:server/routes/sign.ts:183-215`, UI `orig:src/components/SignDocument.tsx:514-555`).
31. **There is no access code, SMS or OTP for signers.** OTP exists only for account email verification and password reset (`orig:server/db/schema.ts:98-101`, `orig:server/routes/auth.ts`).
32. Registered recipients also see the envelope in their own **Inbox / Action Required** folder, with a sign link (`orig:server/lib/envelopes.ts:210-217, 560-580`).

#### Recipient signing page (`/sign/[token]`)
33. The server works out the recipient's state: `ready`, `view` (copy/view role, read-only), `waiting_turn`, `signed`, `declined`, `voided`, `completed`, `auth_required`, `wrong_account`, `not_found` (`orig:server/lib/signing.ts:23-33, 131-146`). Each state has its own screen ("Waiting for others – we'll email you when it's your turn", "This envelope was voided", "Already signed" + download…) (`orig:src/components/SignDocument.tsx:709-730`).
34. The first time a `ready` or `view` recipient opens the link, a **`viewed`** audit row is written (`orig:server/lib/signing.ts:207-227`).
35. The page shows the **real PDF** with **only this recipient's fields** on it, "{sender} sent you …", the sender's message, and a counter "N required fields left" (`orig:src/components/SignDocument.tsx:623-634, 736-792`).
36. Prefill: Date Signed = today. If the signer has an account with a saved signature, Signature/Initial are prefilled with it (`orig:src/components/SignDocument.tsx:585-605`, `orig:server/lib/signing.ts:229-246`).
37. Clicking a Signature/Initial field opens an **adopt modal** with tabs **Saved / Draw / Type**, then "Adopt & Sign" (`orig:src/components/SignDocument.tsx:76-290`). The adopted signature fills that field **and every other empty field of the same type** ("adopt once, sign everywhere") (`:641-660`). Other fields: checkbox, Approve/Decline toggle buttons, dropdown (only when options exist), text/number inputs (`:326-415`).
38. **Finish**: the browser blocks it while required fields are empty and highlights them (`:661-677, 788-792`). The server checks again that all required fields have a value, and that the recipient is a signer, has not signed yet and that it is their turn (`orig:server/lib/signing.ts:309-356`).
39. On success (`orig:server/lib/signing.ts:358-435`): the field values are stored, the recipient → `signed`, a `signed` audit row is added, and progress % is updated. If signing order is on, the next order number becomes "Needs to sign" and **gets an invite email** (`:373-381, 483-501`).
40. **When the last signer finishes:** envelope → `completed`, folder `completed`, progress 100, audit row `completed`. The server builds the **flattened signed PDF** (pdf-lib: signature images embedded, other values drawn as text, checkbox as "X") (`orig:server/lib/pdf-flatten.ts:39-154`). Then **every recipient (signers, copy, view; one email per address) gets a "Completed" email with the signed PDF attached** and a view link (`orig:server/lib/signing.ts:439-482`, `orig:server/lib/mailer.ts:218-241`).
    - Note: the flattened PDF uses only the **first document** of the envelope (`orig:server/lib/pdf-flatten.ts:48-54`), and the signing page also shows only the first document (`orig:src/components/SignDocument.tsx:623`). So multiple documents are only partly supported.
41. After finishing, the signer sees "Signed — thank you" or "All done — document complete" with a **Download signed PDF** button (`orig:src/components/SignDocument.tsx:713-717, 466-474`, route `orig:server/routes/sign.ts:267-294`). The sender can download the signed PDF at any stage from the envelope detail page (`orig:server/routes/envelopes.ts:367-393`, `orig:src/components/EnvelopeDetail.tsx:242-251`).

#### Decline
42. **Decline** opens a modal: "This voids the envelope for everyone. The sender will be notified." plus an optional reason (`orig:src/components/SignDocument.tsx:870-905`).
43. Server: the recipient → `declined` with the reason; the **envelope → `voided`**; audit row `declined` with the reason; the **sender gets a "Declined" email** with the reason (`orig:server/lib/signing.ts:510-567`). Other recipients are **not** emailed.

#### Reminders and expiry (background scheduler)
44. An in-process scheduler runs every 15 minutes (configurable with `SCHEDULER_INTERVAL_MS`) (`orig:server/lib/scheduler.ts:147-157`).
45. **Reminders:** for each `waiting_for_others` envelope whose frequency is due (daily / 2 / 3 / 7 days, counted from the last reminder or from the send time), every signer still "Needs to sign" gets a **"Reminder: … is waiting for your signature"** email with a fresh link. A `reminder_sent` audit row is added (`orig:server/lib/scheduler.ts:21-84`, `orig:server/lib/mailer.ts:243-267`).
46. **Expiry:** envelopes past `expiresOn` → `voided`, audit row `expired`, and the **sender** gets an "Expired" email (`orig:server/lib/scheduler.ts:87-124`, `orig:server/lib/mailer.ts:269-287`). Recipients are not emailed. After that their link shows "voided".

#### Statuses and audit
47. Envelope status: `draft`, `waiting_for_others`, `needs_to_sign` (shown to a recipient), `completed`, `voided` (used for declined **and** expired). Folders: inbox, sent, completed, action_required, drafts, deleted (`orig:server/db/schema.ts:17-32`).
48. Recipient status: `waiting`, `needs_to_sign`, `signed`, `declined`, plus action label and time (`orig:server/db/schema.ts:34-39, 251-267`).
49. Audit table `envelope_activity` with types created, sent, viewed, signed, declined, voided, completed, reminder_sent, expired, plus actor email, time and metadata (`orig:server/db/schema.ts:86-96, 297-313`). **No screen shows this trail**, and there is **no certificate of completion** (the table is only read by the scheduler).
50. Things the original does **not** have: the sender cannot void/cancel an envelope that has already been sent (`/void` works for drafts only, `orig:server/lib/self-sign.ts:228-233`; deleting a sent envelope only moves it to Deleted, `orig:server/lib/envelopes.ts:530-535`); the **Resend** button on the detail page has no handler (`orig:src/components/EnvelopeDetail.tsx:254-258`); no manual "send reminder now"; no correct/edit after sending; no delegate.

---

### Comparison table

| # | Capability | Original (how it works) | Our prototype | Status |
|---|---|---|---|---|
| 1 | Request saved and survives refresh | Draft and sent envelopes are in PostgreSQL | `signatureRequests` are not saved; lost on refresh (`proto:src/context/app-context.tsx:446-560`) | **Missing** |
| 2 | Draft auto-save while preparing | Saved to server ~0.7 s after each edit, "Saving…" | Wizard state is local only; nothing saved until Dispatch | **Missing** |
| 3 | Resume a draft and send it later | Drafts folder → reopen wizard → Send | Drafts tab lists seed drafts only; no "Send draft" (`proto:…/signatures/new/page.tsx`, Features v2 §10.Y) | **Missing** |
| 4 | Upload PDF for the request | Upload in step 1, PDF only, ≤ 5 MB, server checks `%PDF-` header | Wizard can only **link an existing library document** (text); no upload in the wizard (`proto:src/app/(workspace)/signatures/new/page.tsx`, step 1) | **Missing** |
| 5 | Upload Word/image converted to PDF | Not supported (PDF only) | Not supported | Not in either |
| 6 | Multiple documents per envelope | Yes, ordered list, remove + renumber (but signer page and final PDF use only the first document) | One linked document per request | **Missing** |
| 7 | Real page count / PDF render | pdf-lib counts pages; pdf.js renders pages | Fake text "paper"; pages always 4 | **Missing** |
| 8 | Recipient roles (sign / in person / copy / view) | 4 roles; copy/view get a copy email and the final PDF | Only signers; "role" is free text like "Client Authorized Signatory" (`proto:src/types/documents.ts:186-200`) | **Missing** |
| 9 | Add recipients from contacts (incl. "You") | Contacts menu = you + past recipients | No contact picker; signer 1 is pre-filled with the current user, signer 2 is hard-coded "Sarah Chen" (`proto:…/signatures/new/page.tsx:65-82`) | **Missing** |
| 10 | Email format validation | Server checks email regex for each recipient | Only "not empty"; format not checked, duplicates allowed (`proto:…/signatures/new/page.tsx:214-223`) | **Partial** |
| 11 | Signing order setting | "Set signing order" + order number + arrows | "Sequential / Parallel" toggle + arrows | **Present** (UI) |
| 12 | Sequential order enforced | Only the current step is "Needs to sign"; next step is activated and emailed after each signature | Signer 2 stays "waiting" forever; anyone can pick a waiting signer and sign (`proto:…/sign/[requestId]/page.tsx:49-52`) | **Simulated** |
| 13 | Email subject | Subject field (max 100), used as title inside the email subject | Default subject exists only in Agreement Settings, never used | **Missing** |
| 14 | Message to recipients | Message (max 10,000), shown in emails and on the signing page | "Message to Signers" textarea, shown on detail page | **Partial** (no delivery) |
| 15 | Reminder frequency choice | Daily / 2 / 3 / weekly / never per envelope | Same choices in step 4 (Never becomes 3, unused) | **Present** (UI only) |
| 16 | Automatic reminder emails | Scheduler every 15 min emails pending signers with a fresh link; logs `reminder_sent` | None; nothing reads `reminderIntervalDays` | **Missing** |
| 17 | Manual "send reminder now" | Not available (Resend button not wired) | "Send Reminder" adds an event, no email | **Prototype-only** (simulated) |
| 18 | Expiry days per envelope | 30/60/90/120/custom 1–999, counted from send date | 30/60/90/120 dropdown in wizard; custom only in settings | **Partial** |
| 19 | Automatic expiry | Scheduler voids expired envelopes and emails the sender | No code ever sets `expired` | **Missing** |
| 20 | Expiry warning alert | Saved but not implemented | "Warn the sender" toggle disabled, "Coming soon" | Not in either |
| 21 | Advanced options page (privileges, responsive signing, comments) | Page exists; privileges locked; responsive/comments saved but unused | None | **Missing** (low value: original is mostly UI) |
| 22 | Drag field onto page at exact position | Drag or click on real PDF page; stored as page fractions | Click adds field with random X/Y; positions never drawn (`proto:…/[requestId]/fields/page.tsx:57-71`) | **Simulated** |
| 23 | Move / resize field | Drag to move, corner handle to resize | Not possible | **Missing** |
| 24 | Duplicate / undo / redo / zoom in field editor | Yes (50-step undo, zoom 50–400 %) | No | **Missing** |
| 25 | Field types | 14: signature, initial, date signed, name, email, company, title, text, number, checkbox, dropdown, radio, approve, decline | 6: signature, initials, date, name, text, checkbox (`proto:src/types/documents.ts:202-208`) | **Partial** |
| 26 | Field assigned per recipient | Recipient picker with colours; each field has a recipient | "Assign Fields To" + "Assigned Signer" dropdown | **Present** (but fields are not used when signing) |
| 27 | Required/optional field toggle | Column exists but always `true`; no UI | "Mandatory Field" checkbox in the studio | **Prototype-only** (UI only) |
| 28 | Dropdown/radio options editor | Not available (no options UI) | No dropdown/radio types | Not in either |
| 29 | Fields in the create wizard | Step 2 "Add fields" is part of the flow | Step 3 shows hard-coded "Configured"; real editing only later in Fields Studio | **Simulated** |
| 30 | Send-time validation with issue list | Server lists problems (no doc, no recipient, bad email, no signer, signer with no field) | Step 1 nothing required; step 2 non-empty name/email via `alert()` | **Partial** |
| 31 | Preview as recipient / mobile | Preview per recipient, desktop/tablet/mobile | "Review & Send" summary text only | **Missing** |
| 32 | Email to recipients on send | Invite email (signers) and copy email (copy/view), console fallback without SMTP | No email, no notification | **Missing** |
| 33 | Signing link with token | Per-recipient JWT link `/sign/{token}`, 30 days, works without an account | `/signatures/sign/{requestId}` — one shared URL, needs app login, no token | **Missing** |
| 34 | Signer identity check | Token required; registered emails must log in as that account (server-enforced) | Any logged-in user can sign as any pending signer ("Testing as Signer" dropdown) | **Missing** |
| 35 | Access code / OTP / SMS for signers | Not available (OTP is for login only) | Not available | Not in either |
| 36 | Recipient sees the real document with their fields | PDF + only their fields, required counter | Text page, fields not shown | **Missing** |
| 37 | Fill all field types while signing | Signature, initial, date, text, number, checkbox, approve/decline, dropdown | Only one signature (+initials) for the whole doc; fields never filled | **Missing** |
| 38 | Required-field check before Finish | Browser and server both check | Only "signature complete + terms ticked" | **Partial** |
| 39 | Adopt signature (draw / type / saved) | Modal Saved / Draw / Type; applied to all same-type fields | Editor Type (4 styles) / Draw / Upload + saved signature; "save for next time" | **Present** (prototype has more options; no fields to fill) |
| 40 | Upload signature image | No (signer modal has Saved/Draw/Type) | Yes, JPG/PNG/GIF/BMP ≤ 200 KB | **Prototype-only** |
| 41 | Company seal on signature | No | Yes, role-limited seals | **Prototype-only** |
| 42 | Terms / consent checkbox before signing | No | Yes ("I acknowledge…") | **Prototype-only** |
| 43 | "Viewed" status recorded | First open writes `viewed` audit row | `viewed` never set (seed only) | **Missing** |
| 44 | Decline with reason | Modal + optional reason; envelope voided; sender emailed | Modal + reason; request → declined; no notification | **Partial** (no email; also decline can be reversed by signing) |
| 45 | Status guards (can't sign voided/completed/not your turn) | Server checks on every action; status screens | No checks; drafts/expired/cancelled/declined can still be signed | **Missing** |
| 46 | Completion when last signer signs | Envelope → completed, audit `completed` | Request → completed when all required signers sign | **Simulated** (lost on refresh) |
| 47 | Flattened signed PDF (values burned in) | pdf-lib draws all field values and signature images | No PDF | **Missing** |
| 48 | Download signed PDF | Signer (after finishing) and sender (any stage) | No PDF download | **Missing** |
| 49 | Completion email to everyone with PDF attached | All recipients (signers, copy, view), deduped, PDF attached | Nothing | **Missing** |
| 50 | Next signer emailed when it is their turn | Yes | No | **Missing** |
| 51 | Sender notified on decline / expiry | "Declined" email with reason; "Expired" email | No | **Missing** |
| 52 | Send to self as a recipient | Add "You" from contacts; get email; must log in as yourself; also in Action Required | Signer 1 defaults to you; you can sign from the detail page | **Partial** |
| 53 | In-person signer (host signing) | Role exists but behaves like a remote signer | No | **Missing** (low value) |
| 54 | Statuses | draft, waiting_for_others, needs_to_sign, completed, voided (+ recipient waiting/needs_to_sign/signed/declined) | draft, sent, viewed, partially_signed, completed, declined, expired, cancelled (richer list, but most changes are fake) | **Partial** (proto has more names, original has real transitions) |
| 55 | Audit events stored | DB rows: created, sent, viewed, signed, declined, voided, completed, reminder_sent, expired, with actor email and time | `request.events` in memory; headings blank (`name` bug) | **Simulated** |
| 56 | Audit trail screen / download | None in the UI | Audit page + .md download, "SIMULATED" stamp | **Prototype-only** (simulated) |
| 57 | Certificate of completion | No | No | Not in either |
| 58 | Void / cancel a sent request | Not possible (drafts only) | "Cancel request" on All page | **Prototype-only** |
| 59 | Duplicate request | No | "Duplicate" → draft copy | **Prototype-only** |
| 60 | Org signing defaults (expiry, reminders, order, methods) | No; per envelope only (new drafts default to reminders every 2 days, expiry 120) | Agreement Settings page (saved) | **Prototype-only** |
| 61 | Inbox for recipients with an account | Action Required / Inbox lists envelopes waiting for my signature | "Waiting for My Signature" tab (matched by email; empty for demo accounts) | **Partial** |

---

### Biggest gaps (priority order)

1. **Save signature requests (persistence).** Without it, every send, signature and decline disappears on refresh, so no other feature can be demonstrated properly. Effort: **S** (add `signatureRequests` to `saveState`).
2. **Real document in the request (upload PDF in the wizard + render pages with pdf.js).** The supervisor's main point: "upload a document and ask others to sign it". Today the wizard can only link a text document. Effort: **L** (pdf.js in the browser, store the file as a data URL / IndexedDB, 5 MB limit, PDF check).
3. **Drag-and-drop field placement on the page (move, resize, delete, per recipient).** This is the core of the original "Add fields" step. Ours shows a list with random positions. Effort: **L** (also add the missing types: email, company, title, number, dropdown, radio, approve, decline).
4. **Signer fills the placed fields on the document, with a required-field check and "adopt once, sign everywhere".** Today signing ignores fields completely. Effort: **M**.
5. **Signed PDF output and download (burn values into the PDF).** The original gives the signer and the sender a real signed PDF. We have nothing to download. Effort: **M** (pdf-lib runs in the browser too).
6. **Enforce routing and status rules.** Activate the next signer after each signature, block "waiting" signers, and block signing of declined/expired/cancelled/completed requests. Effort: **S**.
7. **Per-recipient signing link + identity check.** Give each recipient a unique link (token) and only let the matching user (by email) sign; remove the "Testing as Signer" switcher outside demo mode. Effort: **M** (simulated token map in the browser; real security needs a backend).
8. **Recipient roles: Receives a Copy / Needs to View.** Ours has signers only. Effort: **S–M** (role field + read-only view + include them at completion).
9. **Simulated email/notification outbox.** Invite, copy, next-signer, reminder, completion (with PDF), declined and expired messages, shown as in-app notifications or an "Outbox" log so the flow can be demonstrated without SMTP. Effort: **M**.
10. **Automatic reminders and expiry.** Run a check on app load / on a timer: send due reminders and mark overdue requests expired, then notify the sender. Effort: **S–M**.
11. **Drafts that auto-save and can be sent later; send-time validation with an issue list** (no doc, no recipient, bad email, signer without fields). Effort: **S–M**.
12. **Preview as a recipient (desktop/tablet/mobile) and real email subject use.** Nice to have for the demo. Effort: **S**.

Notes on things the original itself does **not** do (so we should not copy them as "missing"): no OTP/access code for signers, no certificate of completion, no void of a sent envelope, Resend button not wired, in-person signer is the same as a remote signer, expiry alert / responsive signing / comments options are saved but have no effect, only the first document is shown to signers and flattened.

---

## Part C. Managing agreements after they exist (home, inbox, detail, delete/restore, downloads, templates, reports, accounts, persistence)

The original Flash Sign keeps every agreement ("envelope") in PostgreSQL, scoped to the signed-in user, and gives one real inbox (`/envelopes`) with 6 folders, search, filters, paging, bulk delete/restore (trash), a detail page with recipient progress, and a **real signed PDF download**. Its Templates and Reports pages are only placeholders, and its audit trail is recorded in the database but **never shown** to the user. Our prototype has more screens (Declined, Expired, Cancel, Duplicate, Remind, audit page, reports, templates, seals), but they work on in-memory data that **is lost on refresh**, have no real files, no real accounts and no access control.

Folder names used below: original app = `orig:` (`D:\GPV\FlashSign-Prototype\New folder\flash-sign-main`), our prototype = `proto:` (`D:\GPV\FlashSign-Prototype\flash-sign-proto`).

---

### How the original does it

#### A. Accounts and sign-in (what makes an agreement "belong" to someone)

1. **Sign up** (`/signup`): first name, last name, email, password. Server checks: valid email, password at least 8 characters and at most 72 bytes (bcrypt limit) (`orig:server/routes/auth.ts:65-131`, `orig:src/lib/limits.ts`). The account is created **unverified**; no session is given yet.
2. **Email verification with a code**: the server makes a 6-digit code, stores only a bcrypt hash, and emails it (`orig:server/lib/otp.ts:8-10,20-52`, `orig:server/lib/mailer.ts:87`). Code lives **10 minutes**, max **5 wrong tries**, **60 s** cooldown before "Resend code" (button shows "Resend in Ns", `orig:src/components/VerifyEmailForm.tsx:193-196`). Correct code → account marked verified and the user is signed in (`orig:server/routes/auth.ts:134-179`). Signing up again with an unverified email just re-sends a code (`:96-101`).
3. **Log in**: email + password + "Keep me signed in" (default on, `orig:src/components/LoginForm.tsx:16`). If the email is not verified, login is refused with 403 and a new code is sent (`orig:server/routes/auth.ts:353-363`). Session = signed JWT in an httpOnly cookie + a row in the `sessions` table; 30 days with "remember", 1 day without (`orig:server/lib/auth.ts:16-17`). Every API call checks that the session row still exists and is not expired (`orig:server/middleware/auth.ts`).
4. **Forgot password** = 3 steps in one form: email → 6-digit code → new password (`orig:src/components/ForgotPasswordForm.tsx:17`). The code is checked without being used up (`/verify-reset-code`), then used by `/reset-password`. A reset **logs out all other sessions** (`orig:server/routes/auth.ts:214-334`). Responses are the same whether or not the email exists (no account probing).
5. **Route protection**: Next.js middleware redirects to `/login?next=…` when there is no valid cookie for `/home`, `/envelopes`, `/templates`, `/reports`, `/profile`, `/agreements` (`orig:src/middleware.ts:21-83`); `AuthGate` does the same on the client and shows "Try again" if the API is unreachable instead of logging the user out (`orig:src/components/AuthGate.tsx:56-93`). `/sign/*` links stay open for recipients without an account.

#### B. Home dashboard (`/home`)

`orig:src/components/HomeView.tsx`, data from `GET /api/home` (`orig:server/lib/home.ts:391-477`). The page **re-loads every 20 s** and when the tab gets focus again (`orig:src/hooks/useHomeOverview.ts:7,49-56`).
- **Hero**: "Flash Sign — Welcome back, {first name}" + buttons **Start** (menu), **Get Signatures** (`/envelopes/get-signatures`), **Sign Document** (`/envelopes/sign`, the self-sign flow), **Use Template** (`/templates`, placeholder) (`orig:src/components/HeroBanner.tsx:24-50`).
- **Drafts (n)**: up to 6 of my drafts, newest first, "Updated {relative time}". Clicking **resumes the draft** in the right wizard: self-sign drafts open `/envelopes/sign/add-fields?draft=id`, others open `/envelopes/get-signatures?draft=id` (`orig:src/lib/envelopes.ts:93-103`, `orig:src/components/TasksSection.tsx:38-45`).
- **Tasks (n)**: every envelope where **my email** is a recipient with status "needs to sign" and the envelope is waiting. Each row links straight to a signing link `/sign/{token}` (`orig:server/lib/home.ts:447-474`).
- **Agreement activity**: 6 most recent of my sent envelopes (waiting or completed) with a progress bar and "Waiting for others"/"Completed"; links to the detail page.
- **Overview** counters (each a link to the inbox folder): Drafts, Waiting for others, **Expiring soon (expires within 7 days)**, Completed (`orig:src/components/OverviewPanel.tsx:4-28`, `orig:server/lib/home.ts:411-423`).

#### C. Agreements inbox (`/envelopes`; `/agreements` only redirects here)

`orig:src/components/AgreementsInbox.tsx`, data from `GET /api/envelopes` (`orig:server/routes/envelopes.ts:121-170`, `orig:server/lib/envelopes.ts:313-439`). Reloads every **15 s** and on focus (`orig:src/hooks/useEnvelopesList.ts:6`). All filters live in the URL, so a filtered view can be bookmarked/shared.
- **Left menu**: "Start Now" button, then folders **Inbox, Sent, Completed, Action Required**, plus (under "Show More") **Drafts** and **Deleted**, each with a count (`:57-128, 396-461`).
  - Inbox = envelopes I sent that are still waiting + envelopes where I must sign. Sent = folder "sent". Completed = completed. Action Required = I need to sign. Drafts = drafts. Deleted = trash (`orig:server/lib/envelopes.ts:183-218`).
  - Note: as a recipient I only see envelopes **while I still need to sign**; after I sign, they leave my lists (`:210-218`).
- **Scope dropdown**: "Shared Access" (all) / "My Envelopes" (sent by me) / "Team Envelopes" (received) (`:35-45, 474-487`).
- **Search** box "Search Inbox and Folders" (300 ms delay) over title, document name, sender name/email, recipient names/emails (`:180-183`; server `orig:server/lib/envelopes.ts:224-237`).
- **Filters**: "Date: Last 6 Months" chip (on by default, click X to show all), **status** (Need to sign / Waiting for others / Completed / Draft / Voided), **sender** (built from loaded rows), **Clear All**, **Refresh** (`:539-628`).
- **No sort control**: always newest "last change" first (`orig:server/lib/envelopes.ts:426-430`).
- **Paging**: 25 / 50 / 100 per page (server max 100), "Page X of Y (N items)", previous/next (`:713-775`).
- **Each row**: checkbox, title, "To: {recipient names}" (sender view) or "From: {sender}" (recipient view), progress bar + status text, last-change date and time, **Sign** button when I must sign, and a "⋮" menu: **Open** / **Continue draft**, **Restore** (in Deleted), **Delete** / **Delete forever** (only for the sender) (`:815-944`).
- **Bulk actions**: select all / several → "Delete (n)", or in Deleted "Restore (n)" and "Delete forever (n)", each with a browser confirm (`:277-322, 490-516`).
- Empty state: "No agreements in {folder}. Try another folder, filter, or search." Error state: "Could not load agreements".

#### D. Statuses

- Envelope: `needs_to_sign`, `waiting_for_others`, `completed`, `draft`, `voided` → labels "Need to sign", "Waiting for others", "Completed", "Draft", "Voided" (`orig:src/lib/envelopes.ts:1-6,70-76`, `orig:server/db/schema.ts:17-23`).
- Recipient: `signed`, `needs_to_sign`, `waiting` (not their turn yet), `declined` (`orig:server/db/schema.ts:34-39`). Roles: needs to sign, in-person signer, receives a copy, needs to view (`:41-46`).
- There is **no separate "Declined", "Expired" or "Cancelled" status**: a decline sets the whole envelope to `voided` and emails the sender (`orig:server/lib/signing.ts:540-563`); the scheduler (every 15 min) sets expired envelopes to `voided` and emails the sender (`orig:server/lib/scheduler.ts:87-124,147-157`). They then show as "Voided" in the Sent folder.

#### E. Envelope detail (`/envelopes/[id]`)

`orig:src/components/EnvelopeDetail.tsx`, data `GET /api/envelopes/:id` (`orig:server/lib/envelopes.ts:548-611`).
- **Access check**: only the sender, or a recipient whose email is on the envelope, can open it; everyone else sees "Envelope not found — This envelope doesn't exist, or it belongs to another account." (`orig:src/components/EnvelopeDetailView.tsx:58-75`).
- Header: status chip, "Expiring on {date}" chip, title, sender, **Envelope ID with copy button** ("Copied").
- **Recipients tab**: two groups "Completed" (signed, green tick) and "Current" (others, with routing order number), each with name, email, "Signed"/"Needs to Sign" and the action date/time (`:84-125, 274-305`). Bug: declined/waiting recipients are also shown as "Needs to Sign"; decline reason is stored (`declineReason`) but not shown.
- **Details tab**: Envelope name, Envelope ID, From (name + email), Sent date/time, Last changed, Folders (links), Message (`:307-370`).
- **Documents panel**: one card per document with a **real thumbnail of page 1** (pdf.js) and the real page count (`:13-58, 374-400`). Note: the file endpoint is sender-only (`orig:server/lib/draft-setup.ts:483-508`), so a recipient sees "Preview unavailable".
- **Download** button (not for drafts) → `GET /api/envelopes/:id/signed.pdf`: pdf-lib burns all filled field values into the PDF (signature images, typed text, checkbox "X") and returns "{title} - signed.pdf" (`orig:server/routes/envelopes.ts:367-393`, `orig:server/lib/pdf-flatten.ts:39-154`). Works at any stage (shows what is signed so far). Limits: **only the first document** is flattened; **no audit/certificate page** is added. On completion the same PDF is **emailed as an attachment** to every recipient (`orig:server/lib/signing.ts:440-480`).
- **Resend** and **"⋮ More actions"** buttons are shown but **do nothing** (no onClick, `:254-270`).
- No "download original" button, no history/audit tab, no void button on this page.

#### F. Void, delete, restore

- **Void** exists only for **drafts**, from the self-sign editor: `POST /:id/void` → status `voided`, moved to Deleted, activity row "voided_by_sender" (`orig:server/routes/envelopes.ts:433-446`, `orig:server/lib/self-sign.ts:219-258`). **No void for a sent envelope and no void reason** typed by the user.
- **Delete** (`DELETE /:id`, sender only): a draft becomes `voided` + moved to Deleted; any other envelope only moves to the Deleted folder (status unchanged — an in-flight envelope stays signable and keeps getting reminders); deleting from Deleted **removes it for ever** (cascade deletes documents, recipients, fields, activity) (`orig:server/lib/envelopes.ts:489-537`).
- **Restore** (`POST /:id/restore`): from Deleted back to Completed / Action Required / Sent, and drafts/voided go back to Drafts as `draft` (`:445-483`).

#### G. Audit / history

Every important event is written to the `envelope_activity` table: created, sent, viewed, signed, declined (with reason), voided, completed, reminder_sent, expired, with actor email and time (`orig:server/db/schema.ts:86-96,297-313`; writes in `signing.ts:220,407,424,545`, `scheduler.ts:75,105`, `send-envelope.ts:172`). **But no screen and no API route shows it** (no activity/audit/certificate text in `orig:src`).

#### H. Templates, Reports, Profile

- **Templates** (`/templates`): placeholder text only: "Reusable envelope templates will appear here when you are ready to wire up data." (`orig:src/app/templates/page.tsx`). DB tables `templates`, `template_documents`, `template_recipient_roles`, `template_fields` exist (`orig:server/db/schema.ts:319-389`) but **no API route** uses them (`orig:server/index.ts:59-63`).
- **Reports** (`/reports`): placeholder text only: "Signing analytics and completion trends will show here after the API and database are in place." (`orig:src/app/reports/page.tsx`).
- **Profile** (`/profile`): profile photo (image ≤ 400 KB, update/remove), full name, company, title, address, phone (validated), email shown read-only ("cannot be changed here"; server rejects email changes), and **one saved signature** (add/replace/delete) used when signing (`orig:src/components/ProfilePage.tsx:351, 632-960`, `orig:server/routes/profile.ts:55-150`). No change-password, no 2-step login, no notification settings, no organisation/team.

#### I. Persistence

Everything (users, sessions, OTP hashes, envelopes, documents as base64 data URLs up to 8 MB per request, recipients, fields with values, activity, saved signatures) is stored in PostgreSQL via Drizzle (`orig:server/db/schema.ts`, `orig:server/index.ts:39`). Data survives refresh, other browsers and other users; recipients see envelopes sent to their email.

---

### Comparison table

| # | Capability | Original (how it works) | Our prototype | Status |
|---|---|---|---|---|
| 1 | Real user accounts stored on a server | Postgres `users`, bcrypt hash, unique email (`orig:server/db/schema.ts:107-132`) | Demo accounts in localStorage, plain-text passwords, `Demo123!` opens any account (Features v2 §4.1) | Simulated |
| 2 | Email verification with 6-digit code at sign-up | Code emailed, 10 min, 5 tries, 60 s resend cooldown, hashed (`orig:server/lib/otp.ts:8-10`) | None; sign-up goes straight to "Create organization" (§4.3) | Missing |
| 3 | Login blocked until email verified | 403 + new code sent (`orig:server/routes/auth.ts:353-363`) | Not applicable | Missing |
| 4 | "Keep me signed in" session length | 30 days vs 1 day, server session row (`orig:server/lib/auth.ts:16-17`) | Remember me only decides if user object is kept in localStorage (§4.1) | Partial |
| 5 | Forgot password with emailed code + new password | 3 steps, code checked, all sessions revoked (`orig:server/routes/auth.ts:214-334`) | "Simulated link sent", reset page changes nothing (§4.5, §4.6) | Simulated |
| 6 | Protected routes (redirect to login) | Middleware + AuthGate, `?next=` (`orig:src/middleware.ts:66-83`) | Workspace layout sign-in guard (§3.2) | Present |
| 7 | Agreements saved across refresh | Postgres | `signatureRequests` not saved; reset to seed on refresh (`proto:src/context/app-context.tsx:467`; §10.X) | Missing |
| 8 | Data shared between users / browsers | Yes, recipients see envelopes sent to their email | No; each browser has its own fake data | Missing |
| 9 | Per-user access control on lists and detail | Lists scoped to sender id / recipient email; detail returns "not found" for others (`orig:server/lib/envelopes.ts:548-580`) | Any signed-in user sees and can open every request (§10.11) | Missing |
| 10 | Home: greeting + quick actions | "Welcome back", Start menu, Get Signatures, Sign Document, Use Template (`orig:src/components/HeroBanner.tsx:24-50`) | Same idea; "Sign a Document" opens the same send wizard (`proto:src/app/(workspace)/agreements/page.tsx:27`) | Partial |
| 11 | Home: counters (drafts, waiting, expiring in 7 days, completed) | 4 counters linking to folders (`orig:server/lib/home.ts:411-423`) | 6 KPI tiles (All, Completed + %, In progress, Needs your signature, Expiring soon, Declined/Expired) (§10.1) | Present |
| 12 | Home: "Tasks" = documents I must sign, with direct sign link | By my email, link `/sign/{token}` (`orig:server/lib/home.ts:447-474`) | "Needs Your Signature" + "Awaiting Signature" card with Sign button; empty for demo accounts (§10.1) | Partial |
| 13 | Home: drafts list with resume | Up to 6, opens the right wizard step (`orig:src/lib/envelopes.ts:93-103`) | Drafts card links to Fields studio; draft can never be sent (§10.1, §10.9) | Partial |
| 14 | Home: recent activity with progress bar | 6 newest sent envelopes (`orig:server/lib/home.ts:435-445`) | Recent Activity card, 5 rows with progress bar (§10.1) | Present |
| 15 | Home: "Upcoming expirations" list | Not present (only a counter) | Card with days left (§10.1) | Prototype-only |
| 16 | Auto-refresh of home and inbox | Polls every 20 s / 15 s and on tab focus (`orig:src/hooks/useHomeOverview.ts:7`, `useEnvelopesList.ts:6`) | Not needed (in-memory) | Missing (only matters with a backend) |
| 17 | Folder: Inbox (sent-waiting + to sign) | Yes (`orig:server/lib/envelopes.ts:188-192`) | "All" tab shows everything instead | Partial |
| 18 | Folder: Sent | Yes | `/signatures/sent` by `senderId`; empty for demo accounts, includes drafts (§10.5) | Partial |
| 19 | Folder: Action Required (I must sign) | Yes, by my email | `/signatures/waiting`; badge counts all in-flight requests, list counts only mine (§10.2, §10.4) | Partial |
| 20 | Folder: Completed | Yes | `/signatures/completed` (§10.6) | Present |
| 21 | Folder: Drafts | Yes | `/signatures/drafts` (§10.9) | Present |
| 22 | Folder: Deleted (trash) | Yes (`orig:src/components/AgreementsInbox.tsx:425-451`) | No trash; no delete at all for requests | Missing |
| 23 | Folder: Declined, Expired (separate) | No; both become "Voided" | Separate tabs (`proto:src/components/agreements/agreements-tabs.tsx:22-27`) | Prototype-only |
| 24 | Folder counts in the menu | Count next to each folder (`:387-391`) | Only one badge on "Action Required" | Partial |
| 25 | Scope filter (all / sent by me / received) | "Shared Access / My Envelopes / Team Envelopes" (`:474-487`) | None (tabs only) | Missing |
| 26 | Search | Debounced, title/document/sender/recipient name+email, server side | Search box on each tab (title, sender, id, signers) (§10.3) | Present |
| 27 | Status filter | Dropdown with 5 statuses (`:24-31`) | Dropdown on "All" page only, 8 statuses (§10.3) | Present |
| 28 | Date filter ("Last 6 months") | On by default, removable (`:539-561`) | None | Missing |
| 29 | Sender filter | Dropdown (`:582-600`) | None | Missing |
| 30 | "Clear All" filters / "Refresh" | Yes (`:602-628`) | None | Missing |
| 31 | Filters kept in URL (bookmarkable) | Yes (`:245-262`) | No (local state) | Missing |
| 32 | Sort options | None (fixed newest first) | None (fixed `createdAt` newest first) | Present (same) |
| 33 | Pagination + page size | 25/50/100, "Page X of Y (N items)" (`:713-775`) | None; full list | Missing |
| 34 | Row content | Title, To/From, progress bar, status, last change date+time, Sign button, ⋮ menu (`:815-944`) | Id, status badge, order, sender, title, "x of y signers", %, bar, signer pills (§10.3) | Present |
| 35 | Row checkbox + bulk actions | Select all, bulk Delete / Restore / Delete forever (`:490-516`) | None | Missing |
| 36 | Status badges | 5 envelope statuses, 4 recipient statuses | 8 request statuses, 5 signer statuses incl. "viewed", "partially signed" (§10.Y) | Present |
| 37 | Detail: access only for sender/recipient | Yes | No check (§10.11) | Missing |
| 38 | Detail: recipient progress (signed / current, order, dates) | Completed vs Current groups with action time (`orig:src/components/EnvelopeDetail.tsx:274-305`) | Signer sequence with order, status, viewed/signed dates, % bar (§10.11) | Present |
| 39 | Detail: Envelope ID + copy button | Yes, shows "Copied" | Copy icon copies page URL, no feedback (§10.11) | Partial |
| 40 | Detail: Details tab (From, Sent, Last changed, Folders, Message) | Yes (`:307-370`) | Header shows sender, sent, expires; message card | Present |
| 41 | Detail: real document thumbnail + true page count | pdf.js page 1 per document (`:13-58`) | "Attached Document" card with title/version, link to text document page | Simulated |
| 42 | Download signed PDF | Field values burned into PDF, "{title} - signed.pdf" (`orig:server/lib/pdf-flatten.ts:39-154`) | None; only `.md` "execution summary" (`proto:src/app/(workspace)/signatures/completed/page.tsx:43-68`) | Missing |
| 43 | Signed PDF e-mailed to all on completion | Attached to completion email (`orig:server/lib/signing.ts:440-480`) | No email | Missing |
| 44 | Download original document | Not offered as a button (only thumbnail) | None (no real file) | Missing in both |
| 45 | Audit trail recorded | `envelope_activity` table: sent, viewed, signed, declined, voided, completed, reminder_sent, expired | `request.events` in memory, lost on refresh (§10.13) | Partial |
| 46 | Audit trail visible to user | Not shown anywhere | `/signatures/[id]/audit` page, print, `.md` download; event names blank (bug) (§10.13) | Prototype-only (simulated) |
| 47 | Completion certificate | None (no certificate page in PDF) | `.md` "execution certificate (demo)" (§10.6) | Prototype-only (simulated) |
| 48 | Resend / remind manually from detail | "Resend" button shown but does nothing (`:254-259`) | "Remind"/"Send Reminder" adds a fake event, no email (§10.3, §10.11) | Simulated in both |
| 49 | Automatic reminders | Scheduler every 15 min emails pending signers per chosen frequency (`orig:server/lib/scheduler.ts:21-84`) | None (§10.X) | Missing |
| 50 | Automatic expiry | Scheduler voids expired envelopes and emails sender (`orig:server/lib/scheduler.ts:87-124`) | None; nothing sets `expired` (§10.8) | Missing |
| 51 | "Expiring soon" (7 days) counter | Yes | Yes (also counts overdue) | Present |
| 52 | Void a sent envelope (with reason) | Not available; void only for drafts, no reason | "Cancel request" (status `cancelled`, no reason, no confirm), All page only (`proto:src/context/app-context.tsx:2311-2337`) | Prototype-only (simulated) |
| 53 | Void a draft | `POST /:id/void` from editor (`orig:server/lib/self-sign.ts:219-258`) | Cancel works on any status | Partial |
| 54 | Decline shown to sender | Envelope → Voided + email to sender; reason stored, not shown | Declined tab; reason not shown on list/detail (§10.7, §10.11) | Partial |
| 55 | Delete to trash (soft delete) | Moves to Deleted folder (`orig:server/lib/envelopes.ts:530-536`) | None | Missing |
| 56 | Restore from trash | Back to the right folder (`:445-483`) | None | Missing |
| 57 | Delete for ever | Second delete removes rows (`:505-508`) | None | Missing |
| 58 | Confirm before delete/restore | Browser confirm with count (`orig:src/components/AgreementsInbox.tsx:277-322`) | No confirm even for Cancel | Missing |
| 59 | Resume a draft into the wizard | Opens send wizard or self-sign editor with `?draft=id` | Only "Edit Fields"; cannot send a draft (§10.9) | Partial |
| 60 | Duplicate an agreement | Not available | "Duplicate" creates "Copy of …" draft (§10.3) | Prototype-only |
| 61 | Envelope templates (reusable recipients + fields) | Placeholder page; DB tables only, no API | Document text templates with `{{placeholders}}` (not signature templates); not saved (§11.13-11.15) | Prototype-only (different thing; neither has envelope templates) |
| 62 | Reports / analytics | Placeholder page | `/agreements/reports`: requests sent, completion rate, avg days to complete, by status, recent events (§8.14) | Prototype-only |
| 63 | Profile: photo, name, company, title, address, phone | Saved in DB, photo ≤ 400 KB (`orig:src/components/ProfilePage.tsx:351`) | `/settings/profile`, same fields; name/title revert after refresh (§4.15) | Partial |
| 64 | Profile: email read-only | Yes, server rejects change (`orig:server/routes/profile.ts:69-74`) | Yes, disabled field | Present |
| 65 | Saved signature on profile | One signature in DB | `/settings/signature`, saved in localStorage (§4.16) | Present (local only) |
| 66 | Change password while signed in | Not available | `/settings/security`, simulated (§4.19) | Prototype-only (simulated) |
| 67 | Notification settings | Not available | `/settings/notifications`, switches change nothing (§4.18) | Prototype-only (simulated) |
| 68 | Organisation, invitations, roles | Not available (single user accounts) | Present (DemoAuth, §4.1-4.4, §4.20) | Prototype-only |
| 69 | Signing defaults + company seals | Not available (per-envelope options only) | `/signatures/settings`, saved in localStorage (§10.16) | Prototype-only |
| 70 | Real emails (OTP, invite, reminder, completion, declined, expired) | 8 mail functions via SMTP (`orig:server/lib/mailer.ts:87-290`) | None | Missing |

---

### Biggest gaps (priority order)

1. **Agreements are lost on refresh** (`signatureRequests` not saved). Nothing else can be trusted while this is true; the supervisor will see new requests disappear. Effort: **S** (add to `saveState` in `app-context.tsx`, version the storage key).
2. **No real signed PDF to download.** The original's key output is "{title} - signed.pdf" with signatures burned in; we only give `.md` text. Effort: **L** (needs real PDF upload + pdf.js/pdf-lib; depends on the upload/field-placement gaps in the other areas). A smaller step (**M**): generate a simple PDF of the text document + signature images in the browser with pdf-lib.
3. **No per-user ownership / access control.** Original lists only my sent envelopes and those addressed to my email, and blocks others on the detail page; we show everything to everyone and let anyone sign as anyone. Effort: **M** (filter by `senderId`/signer email, guard detail and sign pages).
4. **No Delete / Trash / Restore.** Original has soft delete, Deleted folder, restore and delete-for-ever, single and bulk, with confirm. Effort: **S–M** (add `deletedAt`/folder field, a Deleted tab, actions, confirm).
5. **Drafts cannot be resumed and sent.** Original reopens the exact wizard step with `?draft=id`; ours can only edit fields and never send. Effort: **M** (wizard must load a draft and call `updateSignatureRequest` to send).
6. **Inbox tools missing: pagination/page size, scope (mine/received), date filter, sender filter, Clear All, URL filters, row checkboxes + bulk actions, folder counts.** Needed once lists grow and to match the original's single inbox. Effort: **M**.
7. **No automatic expiry or reminders.** Original's scheduler voids expired envelopes and emails reminders; our settings text claims this but nothing happens. Effort: **S** for a simulated "on app load, mark overdue as expired / log reminder due" check; real email needs a backend (**L**).
8. **No real accounts or email verification / password reset by code.** Original has verified sign-up, OTP, reset with session revoke. Effort: **L** (needs backend + mail); keep simulated in the prototype but stop storing plain-text passwords and fix the misleading reset text (**S**).
9. **Detail page gaps:** no real document thumbnail/page count, Envelope ID copy has no feedback, decline reason not shown, no Cancel/Delete on detail. Effort: **S** (except thumbnail, which needs real PDF).
10. **Things to keep (we are ahead):** visible audit trail page (fix the blank event-name bug, **S**), reports page, Declined/Expired tabs, Duplicate, Cancel, seals, signing defaults. The original has templates and reports as empty placeholders and never shows its audit log, so these are not gaps — but our versions also lose data on refresh (fixed by item 1).
