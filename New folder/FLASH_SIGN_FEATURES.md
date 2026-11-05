# Flash Sign — Feature Inventory & Integration Reference

> **Audience:** a development agent that will move Flash Sign into another application as a feature module.
> **Source of truth:** the code in this repo as of 2026-10-22 (commit `0024b00` plus the uncommitted working-tree changes noted in §12). Where this document and `docs/ARCHITECTURE_AND_SRS.md` disagree, this document is newer; the SRS still describes DB/auth as "planned" though they are implemented.
> **Reading order:** §1–3 for orientation, §4 for the data model, §5 for each feature's behaviour, §6 for the API contract, §8 for known gaps (read before you promise anything), §9 for the integration plan.

---

## 1. What Flash Sign is

A DocuSign-style e-signature app. A signed-in user uploads a PDF, adds recipients, places fields (signature, initials, date, text…) for each recipient, and sends it. Each recipient gets an emailed link, opens the PDF in the browser, fills in their fields, and signs. When the last signer finishes, every recipient receives the "flattened" signed PDF by email. The app also supports self-signing, sequential signing order, decline, reminders, expiry, an agreements inbox with folders, a home dashboard, and a user profile with one saved signature.

## 2. Stack and processes

| Concern | Choice |
|---|---|
| Frontend | Next.js **16.2.10** (App Router), React 19.2.4, TypeScript, Tailwind CSS v4 |
| Backend | Separate **Express 5** API in `server/`, run with `tsx` (not Next API routes) |
| DB | PostgreSQL (Neon), **Drizzle ORM** (`postgres-js` driver, `ssl: "require"`, pool 10, `prepare: false`) |
| Auth | bcrypt passwords + JWT in an httpOnly cookie, backed by a `sessions` table |
| Email | Nodemailer SMTP. If `SMTP_HOST` is unset, emails are logged to the API console instead of sent |
| PDF render (client) | `pdfjs-dist` **legacy** build, rendered to `<canvas>` by `src/components/PdfCanvas.tsx` |
| PDF write (server) | `pdf-lib`: page counting on upload, and flattening field values into the final PDF |
| Background jobs | In-process `setInterval` scheduler (`server/lib/scheduler.ts`) |
| Tests | **None.** `package.json` has `lint` and `build` only |

Two processes run side by side (`npm run dev` uses `concurrently`):

| Process | Command | Default URL |
|---|---|---|
| Web (Next.js) | `next dev` / `next start` | http://localhost:3000 |
| API (Express) | `tsx watch server/index.ts` / `tsx server/index.ts` | http://localhost:4000 |

The browser calls the API **directly, cross-origin**, with `fetch(..., { credentials: "include" })` (see `src/lib/api.ts`). Next.js does no proxying or server-side data fetching; every data page is a client component.

### Scripts
`dev`, `dev:web`, `dev:api`, `build`, `start`, `start:web`, `start:api`, `lint`, `db:push` (drizzle-kit push, **no migration files are kept**), `db:seed` (`server/seed.ts`), and `postinstall`, which copies the pdf.js worker into `public/pdf.worker.min.mjs` (`scripts/copy-pdf-worker.mjs`). The worker must match the installed `pdfjs-dist` version exactly, or pdf.js refuses to load documents.

### Environment variables (`.env.example`; loaded from `.env.local`, then `.env`)
| Var | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | web | API base URL, default `http://localhost:4000` |
| `API_PORT` | api | default 4000 |
| `CORS_ORIGIN` | api | Allowed web origin. In non-production, any `http://localhost:*` / `127.0.0.1:*` is also allowed |
| `APP_URL` | api | Public web base URL used to build `/sign/<token>` links in emails; falls back to `CORS_ORIGIN` |
| `DATABASE_URL` | api, drizzle-kit | Postgres connection string; required at import time of `server/db` |
| `JWT_SECRET` | api | Signs **both** session JWTs and signing-link JWTs; required at import time |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | api | See `docs/EMAIL_SETUP.md` |
| `SCHEDULER_INTERVAL_MS` | api | Reminder/expiry sweep interval, default 900000 (15 min); `0` disables it |
| `SEED_OWNER_EMAIL/PASSWORD` | seed | Demo owner; default `kapila@flashsign.app` / `password123` |

## 3. Code map

```
server/
  index.ts                 Express app: CORS, cookie-parser, json(8mb), routers, /api/health, starts scheduler
  db/index.ts, schema.ts   Drizzle client + full schema (all tables/enums)
  middleware/auth.ts       requireAuth / optionalAuth → sets req.userId
  routes/auth.ts           signup, verify-email, resend-otp, forgot/verify-reset-code/reset-password, login, logout, me
  routes/profile.ts        profile get/patch, saved signature CRUD, contacts
  routes/home.ts           dashboard overview
  routes/envelopes.ts      drafts, setup, documents, fields, send, self-sign, void, delete/restore, list, detail, signed.pdf
  routes/sign.ts           token-based recipient signing (session, file, submit, decline, signed.pdf)
  lib/auth.ts              bcrypt, session JWT, cookie set/clear
  lib/otp.ts               6-digit email OTP issue/verify (bcrypt-hashed codes)
  lib/signing-token.ts     stateless signing-link JWT {eid, rid, purpose:"sign"}
  lib/mailer.ts            SMTP transport + all email templates
  lib/users.ts             PublicUser mapping, findUserByEmail/ById
  lib/profile.ts           profile update rules, one-signature-per-user rules
  lib/contacts.ts          address book derived from past recipients
  lib/home.ts              dashboard aggregation
  lib/draft-setup.ts       draft create/load/update, recipient upsert, PDF upload validation, document file lookup
  lib/draft-fields.ts      list/replace placed fields (ownership + integrity checks)
  lib/send-envelope.ts     send validation, routing activation, invite/copy emails, appBaseUrl/signingUrl
  lib/self-sign.ts         self-sign draft bootstrap, finish, void draft
  lib/signing.ts           recipient session state machine, access gate, submit, decline, completion
  lib/pdf-flatten.ts       burns field values into the PDF with pdf-lib
  lib/scheduler.ts         reminder + expiration sweeps
  lib/envelopes.ts         inbox listing (folders/counts/filters/pagination), detail, delete, restore
  seed.ts                  demo owner + mock envelopes
src/
  middleware.ts            Next edge gate (cookie presence + JWT exp check only). NOTE: Next 16 renamed middleware → proxy
  app/                     routes (see §5 route table)
  components/              UI (AddFields = field editor, SignDocument = recipient signing, AgreementsInbox, ProfilePage, …)
  hooks/                   useEnvelopeDraftSetup, useEnvelopeFields, useEnvelopesList, useHomeOverview
  lib/api.ts               typed fetch client for every endpoint
  lib/*.ts                 shared types/rules; several are IMPORTED BY THE SERVER (see §9.3)
public/pdf.worker.min.mjs  pdf.js worker, version-locked by postinstall
```

---

## 4. Data model (`server/db/schema.ts`)

All primary keys are `text`. Most are `crypto.randomUUID()`; envelope IDs are `env-` plus 12 hex chars. All timestamps are `timestamptz`.

### Enums
| Enum (pg name) | Values |
|---|---|
| `envelope_status` | `needs_to_sign`, `waiting_for_others`, `completed`, `draft`, `voided` |
| `envelope_folder` | `inbox`, `sent`, `completed`, `action_required`, `drafts`, `deleted` |
| `recipient_status` | `signed`, `needs_to_sign`, `waiting`, `declined` |
| `recipient_role` | `needs_to_sign`, `in_person_signer`, `receives_copy`, `needs_to_view` |
| `signature_style` | `formal`, `script`, `bold`, `elegant` |
| `signature_source` | `choose` (typed in a font), `draw`, `upload` |
| `field_type` | `signature`, `initial`, `date_signed`, `name`, `email`, `company`, `title`, `text`, `number`, `checkbox`, `dropdown`, `radio`, `approve`, `decline` |
| `reminder_frequency` | `daily`, `every_2_days`, `every_3_days`, `weekly`, `never` |
| `activity_type` | `created`*, `sent`, `viewed`, `signed`, `declined`, `voided`, `completed`, `reminder_sent`, `expired` (*`created` is never written) |
| `otp_purpose` | `email_verification`, `password_reset` |

### Tables
| Table | Key columns | Notes |
|---|---|---|
| `users` | `email` (unique, stored lower-case), `password_hash`, `first_name`, `last_name`, `email_verified`, `email_verified_at`, `photo_url` (data URL), `company`, `title`, `address`, `phone` | No app roles or org/tenant concept |
| `sessions` | `user_id` → users (cascade), `expires_at` | One row per login; the JWT carries its id as `sid` |
| `email_otps` | `user_id`, `purpose`, `code_hash` (bcrypt), `expires_at`, `consumed_at`, `attempts` | Plaintext code is never stored |
| `signatures` | `user_id`, `name`, `initials`, `style_id`, `source`, `signature_image`, `initials_image` (data URLs) | App enforces **one per user** |
| `envelopes` | `id`, `envelope_id` (display UUID, unique), `title`, `status`, `folder`, `sender_id` → users (set null), `sender_name`, `sender_email` (denormalised), `message`, `email_subject`, `only_signer`, `signing_order_enabled`, `reminder_frequency`, `advanced_options` jsonb `{expireDays, expireAlertDays, responsiveSigning, allowComments}`, `expires_on`, `page_count`, `document_name`, `progress` (0–100), `sent_at` | Core aggregate |
| `envelope_documents` | `envelope_id` (cascade), `name`, `file_url` (**the whole PDF as a base64 data URL**), `page_count`, `size_bytes`, `order` | Multiple allowed per envelope (but see §8) |
| `envelope_recipients` | `id`, `envelope_id` (cascade), `user_id` (**never populated**), `name`, `email` (lower-case), `role`, `status`, `routing_order`, `action_at`, `action_label`, `decline_reason` | Recipients are matched to accounts **by email only** |
| `envelope_fields` | `envelope_id`, `document_id`, `recipient_id` (all cascade), `type`, `page` (1-based), `x`, `y`, `width`, `height` (real, **normalised 0..1 of the page box, y measured from the top**), `required`, `options` jsonb string[], `value` text, `completed_at` | Field values are stored as text (see §5.15) |
| `envelope_activity` | `envelope_id`, `recipient_id`, `type`, `actor_email`, `metadata` jsonb, `occurred_at` | Audit trail; also drives reminder cadence |
| `templates`, `template_documents`, `template_recipient_roles`, `template_fields` | — | **Schema only. No API, no UI** (§8) |

### Envelope lifecycle (status × folder as actually written by the code)
```
            createDraft / self-sign upload
                        │
                        ▼
              status=draft, folder=drafts ──void (editor) / delete──► status=voided, folder=deleted
                        │
        send / finish-self-sign (validation must pass)
                        ▼
        status=waiting_for_others, folder=sent, sent_at, expires_on = now + expireDays
           │                    │                         │
   last signer submits    a signer declines      scheduler: expires_on < now
           ▼                    ▼                         ▼
 status=completed,      status=voided             status=voided
 folder=completed,      (folder stays sent)       (folder stays sent)
 progress=100
Any non-deleted envelope → delete → folder=deleted (status kept; drafts become voided)
folder=deleted → delete again → hard DELETE (cascades) │ restore → folder recomputed (see §5.20)
```
`needs_to_sign` envelope status and the `inbox`/`action_required` folders are never written by real flows; they come only from seed data. The list and detail APIs **rewrite `status` to `needs_to_sign` in the response** when the viewer is a recipient whose turn it is.

### Recipient status transitions
- Saved in a draft → `waiting` (label "Draft").
- On send: active signers → `needs_to_sign`; signers waiting their turn → `waiting`; copy/view roles → `waiting` (label "Copied").
- On submit → `signed` (`action_at` set). Next routing group → `needs_to_sign`.
- On decline → `declined` with `decline_reason`.

Signer roles are `needs_to_sign` and `in_person_signer`. `receives_copy` and `needs_to_view` are view-only.

---

## 5. Features

### Route table (web)
| Path | Component | Access |
|---|---|---|
| `/` | redirect → `/home` | — |
| `/login` | `LoginForm` in `AuthShell` | auth screen (redirects home if signed in) |
| `/signup` | **redirects to `/login`** (working tree); `SignupForm` component still exists | — |
| `/verify-email?email=` | `VerifyEmailForm` | auth screen |
| `/forgot-password` | `ForgotPasswordForm` | auth screen |
| `/home` | `HomeView` (HeroBanner, OverviewPanel, TasksSection) | protected |
| `/envelopes` (`?folder,q,status,since,page,pageSize,scope,sender`) | `AgreementsInbox` | protected |
| `/agreements` | redirect → `/envelopes` | protected |
| `/envelopes/[id]` (`?sent=1`) | `EnvelopeDetailView` → `EnvelopeDetail` | protected |
| `/envelopes/get-signatures?draft=` | `SetupEnvelope` (step 1) | protected |
| `/envelopes/get-signatures/add-fields?draft=` | `AddFields mode="send"` (step 2) | protected |
| `/envelopes/get-signatures/advanced-options?draft=&from=` | `AdvancedOptions` | protected |
| `/envelopes/get-signatures/preview?draft=&from=` | `EnvelopePreviewView` | protected |
| `/envelopes/sign` | `SignDocumentUpload` (self-sign upload) | protected |
| `/envelopes/sign/add-fields?draft=` | `AddFields mode="selfSign"` | protected |
| `/sign/[token]` | `SignDocument` | **open**: token-gated, login required only for registered recipients |
| `/profile` | `ProfilePage` | protected |
| `/templates`, `/reports` | placeholder text only | protected |

Root layout (`src/app/layout.tsx`) wraps everything in `AuthProvider` → `AuthGate`. Fonts are Bricolage Grotesque (display) and Manrope (body) from `next/font/google`.

---

### 5.1 Sign-up with email OTP verification
- **UI:** `SignupForm` collects first name, last name, email and password (in the working tree the `/signup` route redirects to login; see §12).
- **API:** `POST /api/auth/signup {firstName,lastName,email,password}` creates an **unverified** user and emails a 6-digit code. **No session is issued.** Response: `201 {requiresVerification:true,email}`.
  - Email is trimmed and lower-cased. The password must be ≥ 8 characters and ≤ 72 **bytes** (bcrypt limit; `src/lib/limits.ts`, shared by client and server).
  - If the email exists but is unverified, the endpoint re-issues the code (200). If it exists and is verified, it returns 409.
- **Verify:** `/verify-email` has a 6-box OTP input (paste supported) and calls `POST /api/auth/verify-email {email,code}`. Success marks the user verified and **starts a 30-day "remember" session**, then the UI goes to `/home`.
- **OTP rules (`server/lib/otp.ts`):** 6 digits from `crypto.randomInt`; bcrypt-hashed; TTL 10 minutes; max 5 wrong attempts; 60 s resend cooldown (`POST /api/auth/resend-otp` returns 429 with `retryAfterMs`). Issuing a new code consumes all outstanding codes for that purpose. Error reasons: `no_code`, `expired`, `too_many_attempts`, `mismatch`.
- `resend-otp` and `forgot-password` respond identically whether or not the account exists, to prevent email enumeration.

### 5.2 Login, sessions, logout
- **UI:** `LoginForm` with email, password, show/hide toggle and "Remember me". It honours `?next=/path` (used by the signing gate), `?reset=1` (shows a success notice), and `?email=` / `?invited=1` (prefill and invite notice; working tree only).
- **API:** `POST /api/auth/login {email,password,remember}`.
  - Wrong credentials → 401 with a generic message.
  - Unverified account → 403 `{requiresVerification:true,email}`, and a fresh OTP is sent if the cooldown allows. The client throws `VerificationRequiredError` and routes to `/verify-email`.
  - `remember` must be exactly `true` to get the long session.
- **Session mechanics (`server/lib/auth.ts`):** inserts a `sessions` row, then signs a JWT `{sub:userId, sid:sessionId}` with `JWT_SECRET` (expiry 1 day, or 30 days with remember). It is set as cookie **`flash_sign_token`**: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, and `maxAge` only when remember is on (otherwise a browser-session cookie).
- **Validation (`server/middleware/auth.ts`):** `requireAuth` verifies the JWT, loads the session row, and checks that the `userId` matches and the session hasn't expired. On success it sets `req.userId`; otherwise it returns 401 and **clears a stale cookie**. `optionalAuth` does the same but never rejects (used by `/api/sign`).
- `GET /api/auth/me` returns `{user: PublicUser}`. `POST /api/auth/logout` deletes the session row and clears the cookie.
- **Client state:** `AuthProvider` calls `/me` on mount and exposes `user`, `loading`, `unreachable`, `refresh()` and `signOut()`. A network error or 5xx sets `unreachable` and does **not** log the user out.

### 5.3 Forgot / reset password
3-step `ForgotPasswordForm`: email → OTP → new password.
1. `POST /api/auth/forgot-password {email}` sends a `password_reset` OTP (subject to cooldown; always returns 200).
2. `POST /api/auth/verify-reset-code {email,code}` checks the code **without consuming it**.
3. `POST /api/auth/reset-password {email,code,password}` consumes the code, sets the new hash, marks the email verified, and **deletes all of the user's sessions** (logs out every device). The UI then goes to `/login?reset=1`.

### 5.4 Route protection (three layers)
1. **`src/middleware.ts` (Next edge):** a cheap check of the cookie plus the JWT's `exp` claim. The signature is **not** verified. Rules: `/` → `/home`; a signed-in visitor on `/login` or `/signup` → `/home`; no token on a protected or unknown route → `/login?next=<path>`. The matcher skips any path containing a dot, which includes `/sign/<jwt>`.
2. **`AuthGate` (client):** after `/me` resolves, a protected screen with no user → `/login`, and an auth screen with a user → `/home`. `/sign/*` is "open" and never redirected. If the API was unreachable, it shows a "Can't reach the server / Try again" screen instead of redirecting.
3. **Express:** the real authority. Every envelope, profile and home route uses `requireAuth` plus per-row ownership checks.

### 5.5 Profile
`ProfilePage` → `GET/PATCH /api/profile`.
- **Editable fields:** name (split on whitespace into first + rest), company, title, address, phone, and photo.
- **Email cannot be changed:** the API returns 400 if `email` is sent.
- **Phone rules (`src/lib/phone.ts`, shared):** only digits, spaces and `+ ( ) -`; `+` only in the leading position; ≤ 24 characters; 1–15 digits; empty clears the field.
- **Photo:** read client-side as a data URL (client limit 400 KB, server limit 600,000 characters) and stored in `users.photo_url`. `photoUrl: null` removes it. Used by the avatar in `AppNav`.

### 5.6 Saved signature (one per user)
- **UI:** `CreateSignatureModal`, opened from the profile.
  - Inputs: full name and initials (max 4 characters).
  - Tab **Choose:** typed name rendered in one of 4 Google fonts: `formal` = Playfair Display, `script` = Dancing Script, `bold` = Caveat, `elegant` = Great Vibes. No image is stored.
  - Tab **Draw:** separate canvases for signature and initials → PNG data URLs.
  - Tab **Upload:** images (jpeg/gif/png/bmp, ≤ 200 KB each) for signature and initials.
- **API:** `POST /api/profile/signatures`, `PATCH /api/profile/signatures/:id`, `DELETE /api/profile/signatures/:id`. The body is `{name, initials, styleId, source, signatureImage?, initialsImage?}`.
- **One-per-user rule:** `createUserSignature` **replaces** the existing signature if one exists, and `getProfile` deletes any extras.
- **Where it's used:**
  - Prefilling signature/initial fields in the self-sign editor.
  - The "Saved" tab and auto-prefill on the signing page, whenever the recipient's email belongs to an account.
  - Display styling via `SignatureMarkDisplay`: a "Signed by:" bracket plus a fingerprint made of the first 16 hex characters of the field id. This is visual only, not cryptographic.

### 5.7 Contacts (address book)
`GET /api/profile/contacts` returns the user themself (`source:"self"`) plus distinct `{name,email}` pairs from recipients of envelopes the user has sent (`source:"history"`). It appears in `RecipientsEditor`'s "Add Recipient ▾" menu; contacts already added are disabled.

### 5.8 Home dashboard
`GET /api/home` (`server/lib/home.ts`), strictly scoped to the current user:
- `stats`, all from envelopes the user **sent**: `waitingForOthers`, `completed`, `drafts`, and `expiringSoon` (waiting envelopes whose `expires_on` is within 7 days).
- `drafts`: the 6 most recently updated drafts. Links resume the right wizard via `draftResumeHref`: self-sign drafts → `/envelopes/sign/add-fields`, others → `/envelopes/get-signatures`.
- `activity`: the 6 latest waiting or completed envelopes the user sent, with progress.
- `tasks`: envelopes where **the user's email is a recipient with status `needs_to_sign`** and the envelope is `waiting_for_others`. Each task carries a freshly minted `signUrl` (`/sign/<token>`).
- `useHomeOverview` polls every **20 s** and also refetches on window focus and tab visibility.
- `HeroBanner` and `StartMenu` link to Get Signatures, Sign a Document and Templates.

### 5.9 "Get Signatures" wizard, step 1: Set Up Envelope
`SetupEnvelope` + `useEnvelopeDraftSetup`, at `/envelopes/get-signatures`.
- **Lazy draft creation:** without `?draft=` the form starts blank and creates nothing. The first edit or upload calls `POST /api/envelopes/drafts`, then writes `?draft=<id>` into the URL so a refresh resumes it. Concurrent callers share one creation promise. `GET /drafts/active` exists in the API and client but the UI never calls it.
- **Autosave:** edits are debounced **700 ms**, then `PATCH /api/envelopes/:id/setup`. The hook also refetches on window focus, but skips that while a change is unsaved or a save is in flight. A `saveNow()` flush runs before navigation.
- **Documents:** multi-file drop zone or file picker, **PDF only, ≤ 5 MB each** (`src/lib/documents.ts`, shared). Files are read with `FileReader` as data URLs and sent with `POST /api/envelopes/:id/documents {name,sizeBytes,fileData}`.
  - Server checks: data-URL MIME must be `application/pdf` **and** `%PDF-` must appear in the first 1 KB.
  - Pages are counted with pdf-lib.
  - The envelope's `document_name`, `title` (if no subject) and `page_count` are updated.
  - Delete with `DELETE /api/envelopes/:id/documents/:docId`; remaining documents are re-ordered.
- **Recipients (`RecipientsEditor`):** rows of name, email and role.
  - Roles: Needs to Sign, In Person Signer, Receives a Copy, Needs to View.
  - Add and remove rows; pick from contacts.
  - **"I'm the only signer"** locks the list to the current user and disables signing order. It routes the wizard to the self-sign editor.
  - **"Set signing order"** (needs ≥ 2 recipients) shows order inputs and up/down arrows. Order = list position (`index + 1`).
  - Server-side recipient handling (see the sketch below):
    - It **upserts by recipient id**, so surviving recipients keep their placed fields; removed recipients cascade-delete their fields.
    - Rows with neither name nor email are dropped.
    - Emails are lower-cased.
    - The upsert is guarded by `setWhere envelope_id = this envelope`, so one envelope can never mutate another's recipient.
- **Message:** subject (max 100 characters, required to send in the UI's eyes; it also becomes the envelope `title`) and message (max 10,000 characters).
- **Reminder frequency select:** daily, every 2 days (default), every 3 days, weekly, never.
- **Navigation:** "Next: Add Fields" is enabled once ≥ 1 document exists. The gear icon opens Advanced Options.

Server-side recipient upsert, in brief:
```ts
// draft-setup.ts updateDraftSetup (simplified)
delete recipients of this envelope WHERE id NOT IN (ids in payload)
for each recipient: INSERT … ON CONFLICT (id) DO UPDATE SET name,email,role,routing_order
                    WHERE envelope_recipients.envelope_id = :envelopeId
```

### 5.10 Advanced Options
`AdvancedOptions` page saves through the same `PATCH /setup` endpoint.
- **Auto reminders toggle:** on → `reminderFrequency` becomes `every_2_days` if it was `never`; off → `never`.
- **Expiration:** 30 / 60 / 90 / 120 days or custom 1–999 (default **120**). While in draft a provisional `expires_on` is shown. **On send, `expires_on` is recomputed as send time + `expireDays`.**
- **Expiry alert days, Responsive Signing, Allow Comments:** saved to `advanced_options` but **not used anywhere** (§8).
- **"Recipient Privileges" checkboxes:** permanently checked and disabled, decorative ("Managed by your plan").

### 5.11 "Get Signatures" wizard, step 2: field editor (send mode)
`AddFields mode="send"` + `useEnvelopeFields`.
- Loads the setup and `GET /api/envelopes/:id/fields`. Renders the PDF from `GET /api/envelopes/:id/documents/:docId/file` (cookie-authenticated, sender-only) via `usePdfDocument` / `PdfPageCanvas`. Pages render lazily as they scroll into view, and a thumbnail rail tracks the active page.
- **Recipient picker:** fields are placed for the *selected* recipient. Each recipient has an accent colour, and **only the selected recipient's fields are visible** at a time.
- **Field palette:**
  - Signature: Signature, Initial, Date Signed
  - Contact: Name, Email, Company, Title
  - Inputs: Text, Number, Checkbox, Dropdown, Radio
  - Actions: Approve, Decline
- **Placing and editing:** clicking a palette item drops the field on the current page, with a cascade offset so fields don't stack. Fields can then be moved and resized by dragging; the resize handle keeps a minimum of 3% × 1.5% of the page.
  - Default sizes (fraction of the page): signature 0.24×0.06, initial 0.12×0.06, date 0.2×0.035, approve/decline 0.16×0.045, checkbox/radio 0.035×0.028, others 0.22×0.035.
- **Coordinates** are saved as page fractions `x, y, width, height ∈ [0,1]` with y measured from the top. The server clamps them to [0,1].
- **Toolbar:**
  - Undo/redo with 50 whole-list snapshots; a drag gesture counts as one step. Shortcuts: Ctrl/⌘+Z, Ctrl/⌘+Shift+Z, Ctrl+Y.
  - Duplicate (offset +2%).
  - Delete (also Delete/Backspace).
  - Zoom 50–400%.
  - Layout toggle (fields+pages / fields / pages / document only).
- **Autosave:** debounced 700 ms, then `PUT /api/envelopes/:id/fields {fields:[…]}`, which **replaces the whole set** in a transaction. Client-generated UUIDs are preserved. The server rejects writes unless the envelope is a draft, and rejects any `documentId`/`recipientId` that doesn't belong to this envelope.
- **Actions:**
  - **Preview**, **Advanced options**.
  - **Send:** flush the save, then `POST /:id/send`, then go to `/envelopes/:id?sent=1`.
  - **Finish Later:** go to the Drafts folder.
  - **Void:** `POST /:id/void` (drafts only) → status voided, folder deleted.
  - Validation failures appear in an "Almost there" modal listing the `issues`.

### 5.12 Preview
`EnvelopePreviewView` is a read-only render of the first document with placed fields, filtered by a chosen signer. A viewport switch sets the page width: desktop 900px, tablet 720px, mobile 375px. Zoom is available.

### 5.13 Send envelope
`POST /api/envelopes/:id/send` (`server/lib/send-envelope.ts`):
1. **Validation**, which returns `400 {error, issues[]}` on failure:
   - ≥ 1 document and ≥ 1 recipient.
   - Every recipient has a name and a valid email.
   - ≥ 1 signer role.
   - **Every signer has ≥ 1 placed field.**
2. **Routing:**
   - Signing order off: all signers become `needs_to_sign`.
   - Signing order on: only the lowest `routing_order` group activates. Equal orders would sign in parallel, but the UI always assigns unique orders.
3. **Transaction:** recipient statuses and labels are set. The envelope becomes `waiting_for_others` / `sent`, with `sent_at` = now, `expires_on` = now + expireDays and progress 0. A `sent` activity row is written.
4. **Emails (after commit, failures only logged):**
   - Active signers get a "Review & Sign" invite with `APP_URL/sign/<token>`.
   - Copy/view recipients get a "View Document" email **immediately**, even with signing order on.
   - Signers waiting their turn are emailed later, when their turn comes.

### 5.14 Self-sign ("Sign a Document")
- `/envelopes/sign` picks one PDF, then `POST /api/envelopes/self-sign {name,sizeBytes,fileData}` runs in one step:
  - validates the PDF (before creating anything);
  - creates a draft with `only_signer=true`;
  - adds a sole recipient = the current user (`needs_to_sign`);
  - sets the subject to the filename without its extension;
  - uploads the document.

  It returns `{draftId, documentId, setup}` and the UI goes to `/envelopes/sign/add-fields?draft=`.
- **Editor (`AddFields mode="selfSign"`):** fields are **dragged and dropped** from the palette onto the page; a simple click places the field on the current page.
  - Palette: Signature (signature, initial, date), Identity (name, email, company, title), Input (text, checkbox).
  - Fields are **prefilled from the profile**: saved signature/initials image (or typed text), today's date (M/D/YYYY), name, email, company and title.
  - Name, email, company, title, text and number fields are editable inline.
  - Zoom 50–200%; side tools for page thumbnails, open the original PDF and print.
- **Finish:** `POST /api/envelopes/:id/finish-self-sign`.
  - Validates: ≥ 1 document, exactly 1 signer whose email equals the user's, ≥ 1 field.
  - Activates the envelope exactly like a send (`waiting_for_others`, `sent`, expiry; activity metadata `{selfSign:true}`) but **sends no email**.
  - Returns `{signingToken}`; the UI navigates to `/sign/<token>`, so the user signs through the normal signing page (§5.15). On submit the envelope completes and the user receives the completion email with the PDF.
- **Finish Later** → Drafts. **Void** → voided draft in the Deleted folder.

### 5.15 Recipient signing (`/sign/[token]`)
- **Signing links:** a stateless JWT `{eid, rid, purpose:"sign"}` signed with `JWT_SECRET`, expiring in **30 days** (`server/lib/signing-token.ts`). Nothing is stored server-side, so a link can't be revoked; instead every call re-checks the envelope and recipient state. Fresh tokens are minted whenever needed (dashboard tasks, inbox rows, reminders, emails).
- **Access gate (`checkSigningAccess`):** if the recipient's email belongs to a **registered account**, the request must carry a session for **that** account.
  - No session → `auth_required`; a different account → `wrong_account`.
  - For unregistered recipients the token alone is enough.
  - The gate is enforced on the server for every action route (file, submit, decline, signed.pdf, which return 401 `{state}`). `GET /api/sign/:token` returns a stripped session with no documents or fields so the page can show "Sign in to continue" (→ `/login?next=/sign/<token>`) or "Switch account".
- **Session states (`resolveState`)**, in precedence order:

  | Condition | State |
  |---|---|
  | Envelope is a draft | `not_found` |
  | Recipient declined | `declined` |
  | Recipient signed | `signed` |
  | Envelope voided | `voided` |
  | Envelope completed | `completed` |
  | Non-signer role | `view` |
  | Recipient `needs_to_sign` | `ready` |
  | Otherwise | `waiting_turn` |

  Each non-ready state shows a status screen. `signed`/`completed` also offer "Download signed PDF".
- **Viewed tracking:** the first open in the `ready` or `view` state writes one `viewed` activity row.
- **Signing UI (`SignDocument`):** renders the first document, overlays only *this* recipient's fields, and shows a "N required fields left" counter.
  - **Prefill:** existing value → saved signature/initials → recipient name/email → today's date.
  - **Signature/initial click:** opens the `SignaturePad` with tabs Saved / Draw / Type. "Adopt & Sign" fills the clicked field **and every other empty field of the same type**.
  - **Other field types:**
    - Checkbox toggles `"true"`/`""`.
    - Approve/Decline fields toggle the text `"Approved"`/`"Declined"`. These are just field values; they do **not** decline the envelope.
    - Dropdown/radio render a `<select>` if `options` exist, otherwise a text input (§8).
    - Everything else (including `date_signed`) is a text or number input.
  - **Finish:** client-side required check, then `POST /api/sign/:token/submit {fields:[{id,value}]}`.
  - **Decline:** a modal with an optional reason, then `POST /api/sign/:token/decline {reason}`.
  - The envelope's message from the sender is shown as a banner. View-only recipients see the PDF with no fields ("Copy — view only").

### 5.16 Submit, sequential routing and completion
`submitSigning` (`server/lib/signing.ts`):
- **Rejects** when the envelope is voided, the recipient isn't a signer, has already signed, or it isn't their turn.
- For each of the recipient's fields, takes the provided value, falling back to the existing stored value. Any required field still blank → 400. **Values are not type-checked**: they are free text, and image fields are data URLs.
- **Transaction:**
  - write field values and `completed_at`;
  - set the recipient to `signed`;
  - if signing order is on and no signer is currently active, activate the next-lowest `routing_order` group;
  - write a `signed` activity row;
  - update `progress = round(signed signers / total signers × 100)`.
  - When all signers are done: envelope → `completed` / `completed` with progress 100, plus a `completed` activity row.
- **After commit:**
  - On completion, flatten the PDF and email **every recipient** (all roles, deduped by email) a "Completed" email with the signed PDF attached. **The sender is not emailed unless they are also a recipient.**
  - Otherwise, email invites to the newly activated signers.

### 5.17 Decline
`declineSigning`: signers only; idempotent if the envelope is already voided or declined.
- The recipient becomes `declined` (with reason) and the **envelope becomes `voided`** (folder unchanged). A `declined` activity row is written.
- The sender gets a "Declined" email with the reason. **Other recipients are not notified.**

### 5.18 Signed PDF (flattening)
`flattenEnvelopePdf` (`server/lib/pdf-flatten.ts`) loads the **first** document only and draws every field that has a value onto its page. It converts top-left normalised coordinates to pdf-lib's bottom-left points.
- **Signature/initial images (data:image):** embedded as PNG or JPEG, scaled to fit and centred.
- **Checkbox `"true"`:** an "X".
- **Typed signatures:** Helvetica Oblique. **The chosen signature font is not used.**
- **Everything else:** Helvetica, max 12pt.
- Text is reduced to printable ASCII + Latin-1; other characters (emoji, Sinhala, Tamil, CJK…) are **silently dropped**.
- The filename is `<sanitised title> - signed.pdf`.
- There is no certificate-of-completion page, no document hash, and no PKI/digital signature.

Download endpoints (both work at any stage and reflect whatever has been signed so far):
- Sender, or any recipient whose email matches: `GET /api/envelopes/:id/signed.pdf`.
- Token holder: `GET /api/sign/:token/signed.pdf`.

### 5.19 Email notifications (`server/lib/mailer.ts`)
| Function | Trigger | To |
|---|---|---|
| `sendOtpEmail` | signup, resend, unverified login | user |
| `sendPasswordResetEmail` | forgot-password | user |
| `sendSigningInviteEmail` ("Review & Sign") | send (active signers), next routing group activated | signer |
| `sendCopyEmail` ("View Document") | send | copy/view recipients |
| `sendReminderEmail` | scheduler | pending signers |
| `sendCompletionEmail` (+PDF attachment) | last signer submits | all recipients |
| `sendDeclinedEmail` | a signer declines | sender |
| `sendExpiredEmail` | scheduler expires the envelope | sender |

All emails use inline-styled HTML plus a text alternative; user strings are HTML-escaped. The "from" address is `SMTP_FROM`. With no SMTP configured, the subject and text are printed to the API console, which is the easiest way to grab signing links in development.

### 5.20 Scheduler: reminders and expiration
`startScheduler()` runs 10 s after API boot, then every `SCHEDULER_INTERVAL_MS`. A `running` flag stops overlapping runs **within one process only**.
- **Reminder sweep:** for each `waiting_for_others` envelope with a frequency other than `never`, if the interval has passed since the last `reminder_sent` activity (or `sent_at`), it emails every signer still at `needs_to_sign` a reminder with a fresh token and writes one `reminder_sent` row.
- **Expiration sweep:** each `waiting_for_others` envelope with `expires_on < now` becomes `voided`, gets an `expired` activity row, and its sender is emailed. There is **no pre-expiry alert** (`expireAlertDays` is unused).

### 5.21 Agreements inbox (`/envelopes`)
`AgreementsInbox` + `useEnvelopesList` → `GET /api/envelopes`. Query parameters: `folder`, `q`, `status`, `sinceMonths`, `page`, `pageSize` (≤ 100), `scope`, `senderEmail`.
- **Folders** (left rail, each with a count): Inbox, Sent, Completed, Action Required, and under "more" Drafts and Deleted.
- **Folder rules for envelopes the user sent:**
  - inbox = folder `inbox` **or** (folder `sent` and waiting);
  - completed = folder or status completed;
  - action_required = folder `action_required` or status `needs_to_sign`;
  - drafts = folder `drafts` or status `draft`;
  - deleted = folder `deleted`.
- **Folder rules for envelopes received:** an envelope appears in Inbox and Action Required only while *this user's* recipient row is `needs_to_sign` and the envelope isn't deleted. The row carries a `signUrl` and `viewerRole:"recipient"`.
- **Scope select:** "Shared Access" = `all`, "My Envelopes" = `mine` (sent only), and "**Team Envelopes**" = `received`. Despite the label, it means *received*, not a team.
- **Filters:** a debounced (300 ms) search over title, document name, sender name/email and recipient names/emails; status; a "last 6 months" toggle (on by default; `since=all` turns it off); sender; page size 25/50/100; pagination. All of this state lives in URL query parameters.
- **Bulk/row actions:** select all; Delete (confirm), which moves the envelope to Deleted, or deletes it **permanently** if already there; Restore (from Deleted); Open or "Continue draft". Delete and restore are sender-only (the API returns 404 for others; the UI hides them for recipient rows).
- **Restore rules:** draft or voided → `draft`/`drafts`; completed → `completed`; needs_to_sign → `action_required`; otherwise → `sent`.
- **Polling:** every **15 s**, plus on focus and visibility change.
- **Implementation note:** `listEnvelopePage` loads **all** of the user's sent envelopes and all their recipient rows, then filters, sorts and paginates **in Node memory**.

### 5.22 Envelope detail (`/envelopes/[id]`)
`GET /api/envelopes/:id` is allowed for the sender **or** a recipient whose email matches; anyone else gets 404.
- Shows the title, status chip, progress, sender, the copyable display envelope ID, created/sent/expiry dates and the message.
- Document cards show the real first-page thumbnail and page count via the sender-only file route, so **thumbnails fail for recipient viewers**.
- Tabs: Recipients (order, status, action time/label) and Details.
- "Download" (non-drafts) → `signed.pdf`. **"Resend" and "⋯" have no handlers.**
- `?sent=1` is set after sending.

### 5.23 Audit trail
`envelope_activity` is written for `sent`, `viewed` (first open), `signed`, `completed`, `declined` (+reason), `voided` (sender void or delete of a draft, `metadata.reason`), `reminder_sent` (count) and `expired`. It is not exposed through any API or UI yet; the Reports page is a placeholder.

### 5.24 Placeholders and non-functional UI (do not assume these work)
- `/templates` and `/reports` show text only. The Start menu's "Use a Template" item links to that placeholder.
- `SocialButtons` (Google and one other provider) are buttons with no handlers.
- Envelope detail "Resend" and "More actions" do nothing.
- The self-sign editor's "Search" and "⋯" buttons do nothing.
- `EnvelopeList.tsx` is unused; it renders `mockEnvelopes`.

---

## 6. API reference

Base: `NEXT_PUBLIC_API_URL`. Every request uses `credentials: "include"`. Errors are `{error: string}`; some add `issues[]`, `reason` or `state`.

| Method & path | Auth | Request | Response |
|---|---|---|---|
| GET `/api/health` | – | – | `{status, service, database, timestamp}` (503 if DB down) |
| GET `/api` | – | – | welcome JSON |
| POST `/api/auth/signup` | – | `{firstName,lastName,email,password}` | 201/200 `{requiresVerification,email}`; 409 |
| POST `/api/auth/verify-email` | – | `{email,code}` | `{user}` + cookie |
| POST `/api/auth/resend-otp` | – | `{email}` | `{ok}`; 429 `{retryAfterMs}` |
| POST `/api/auth/forgot-password` | – | `{email}` | `{ok}` |
| POST `/api/auth/verify-reset-code` | – | `{email,code}` | `{ok}` |
| POST `/api/auth/reset-password` | – | `{email,code,password}` | `{ok}` (all sessions revoked) |
| POST `/api/auth/login` | – | `{email,password,remember:boolean}` | `{user}` + cookie; 401; 403 `{requiresVerification,email}` |
| POST `/api/auth/logout` | cookie | – | 204 |
| GET `/api/auth/me` | required | – | `{user: PublicUser}` |
| GET `/api/profile` | required | – | `{user, signatures: SavedSignature[]}` |
| PATCH `/api/profile` | required | `{name?|firstName?,lastName?, photoUrl?|null, company?, title?, address?, phone?}` | `{user}` |
| POST `/api/profile/signatures` | required | `{name,initials,styleId,source,signatureImage?,initialsImage?}` | 201 `{signature}` (replaces existing) |
| PATCH `/api/profile/signatures/:id` | required | same | `{signature}` |
| DELETE `/api/profile/signatures/:id` | required | – | 204 |
| GET `/api/profile/contacts` | required | – | `{contacts: {id,name,email,source}[]}` |
| GET `/api/home` | required | – | `HomeOverview {stats,tasks,activity,drafts}` |
| GET `/api/envelopes` | required | query: see §5.21 | `{items: Envelope[], total, page, pageSize, folderCounts}` |
| GET `/api/envelopes/drafts/active` | required | – | `DraftSetup` (gets or creates the latest draft; unused by UI) |
| POST `/api/envelopes/drafts` | required | – | 201 `DraftSetup` |
| POST `/api/envelopes/self-sign` | required | `{name,sizeBytes,fileData(dataURL)}` | 201 `{draftId,documentId,setup}` |
| GET `/api/envelopes/:id/setup` | owner, draft | – | `DraftSetup` |
| PATCH `/api/envelopes/:id/setup` | owner, draft | `{emailSubject?,message?,reminderFrequency?,onlySigner?,signingOrderEnabled?,recipients?:[{id?,name,email,role,order}],autoReminders?,expireDays?,expireAlertDays?,responsiveSigning?,allowComments?}` | `DraftSetup` |
| POST `/api/envelopes/:id/documents` | owner, draft | `{name,sizeBytes,fileData}` | 201 `{document}` |
| DELETE `/api/envelopes/:id/documents/:docId` | owner, draft | – | 204 |
| GET `/api/envelopes/:id/documents/:docId/file` | owner (any status) | – | raw PDF bytes, `Cache-Control: private, no-store` |
| GET `/api/envelopes/:id/fields` | owner (any status) | – | `{fields: DraftField[]}` |
| PUT `/api/envelopes/:id/fields` | owner, draft | `{fields: DraftField[]}` (full replace) | `{fields}` |
| POST `/api/envelopes/:id/send` | owner, draft | – | `{id}`; 400 `{error,issues}` |
| POST `/api/envelopes/:id/finish-self-sign` | owner, self-sign draft | – | `{signingToken,id}`; 400 `{error,issues}` |
| POST `/api/envelopes/:id/void` | owner, draft | – | `{id}` |
| POST `/api/envelopes/:id/restore` | owner, in Deleted | – | `{id}` |
| DELETE `/api/envelopes/:id` | owner | – | `{id, permanent}` |
| GET `/api/envelopes/:id/signed.pdf` | sender or recipient-by-email | – | PDF attachment |
| GET `/api/envelopes/:id` | sender or recipient-by-email | – | `Envelope` (with `viewerRole`, `signUrl?`, `documents`) |
| GET `/api/sign/:token` | token (+login if registered) | – | `SigningSession {state, envelope, recipient, documents, fields, savedSignatures}` |
| GET `/api/sign/:token/documents/:docId/file` | token + gate | – | raw PDF |
| GET `/api/sign/:token/signed.pdf` | token + gate | – | PDF attachment |
| POST `/api/sign/:token/submit` | token + gate | `{fields:[{id,value}]}` | `{ok, completed}` |
| POST `/api/sign/:token/decline` | token + gate | `{reason?}` | `{ok}` |

TypeScript shapes for these responses: `src/lib/envelopes.ts` (`Envelope`, `EnvelopeRecipient`, list response), `src/lib/envelope-draft.ts` (`DraftSetup`, `DraftField`), `src/lib/signing.ts` (`SigningSession`), `src/lib/home.ts`, and `src/lib/api.ts` (`AuthUser`, `SavedSignature`, `UserContact`). The `Envelope` DTO carries **pre-formatted, en-US display strings** (`expiresOn`, `lastChange` like "2 hours ago", `sentDate`, …), with only `updatedAt` as ISO.

## 7. Security model (current)
- Passwords use bcrypt (cost 12). OTPs use bcrypt (cost 10), with expiry, attempt limits and cooldown.
- Sessions use a DB-backed JWT cookie: httpOnly, SameSite=Lax, Secure in production. Revocation works through session-row deletion (logout, reset).
- CSRF protection relies on SameSite=Lax plus the strict CORS origin check; there is **no CSRF token and no rate limiting** (no helmet, no express-rate-limit).
- Authorisation is ownership-based only: `sender_id = userId` for envelope mutations, and an email match for recipient reads. **There are no roles, organisations or tenants.**
- Signing links are bearer tokens with a 30-day JWT expiry, rechecked against state on every call, plus the login-required rule for registered recipients.
- Upload validation covers MIME and the `%PDF-` magic bytes, with a 5 MB cap and an 8 MB JSON body cap.
- Field integrity: a placed field can only reference this envelope's documents and recipients, and recipient upserts are fenced per envelope.

## 8. Known gaps, limitations and bugs (read before integrating)
1. **Only the first document is really used.** Multiple PDFs can be uploaded, but the field editor, preview, signing page and flattener all use `documents[0]`. `useEnvelopeFields` exposes no way to switch documents.
2. **Dropdown/radio have no options editor.** `options` is always saved as `null`, so these fields behave as free-text inputs at signing.
3. **Advanced options mostly inert.** Only `expireDays` is enforced. `expireAlertDays`, `responsiveSigning`, `allowComments` and "Recipient Privileges" do nothing.
4. **In-person signer = remote signer.** The role gets an emailed link like any signer; there is no host-led in-person flow.
5. **Templates** exist only as DB tables; there is no router or UI. **Reports** is a placeholder (activity data exists).
6. **No after-send management:** no manual resend, no correct/edit-after-send, and no sender-initiated void of a sent envelope. Detail-page buttons are stubs.
7. **Notification gaps:** the sender gets no completion email unless they are also a recipient; other recipients aren't told about a decline or expiry.
8. **Signing tokens are irrevocable, and their 30-day life is shorter than the 120-day default envelope expiry.** Old invite links die after 30 days, though reminders and the dashboard mint fresh ones.
9. **`date_signed` is a client-editable text value**, not a server timestamp. There's no audit certificate, document hash or cryptographic signature, so legal-evidence strength is limited to the activity table.
10. **The flattener drops non-Latin-1 characters** and draws typed signatures in Helvetica Oblique rather than the chosen font.
11. **Recipients viewing `/envelopes/[id]` can't load document thumbnails**, because the file route is sender-only.
12. **Restoring a declined or expired envelope from Deleted turns it back into an editable draft** (status `draft`), with stale recipient rows.
13. **Received voided envelopes can linger** in a recipient's Inbox while their own row is still `needs_to_sign`; opening one shows "voided".
14. **Inbox filtering is done in memory** over all of the user's envelopes, with 15 s polling per open tab. This won't scale to large accounts.
15. **Files live in Postgres as base64 data URLs:** document PDFs, signature images and profile photos. This inflates DB size and payloads.
16. **The scheduler is in-process**, so running more than one API instance sends duplicate reminders and expiry emails.
17. `envelope_recipients.user_id` is never set, so recipient-to-account linking is by email string. The `created` activity type is never written.
18. **No automated tests.**
19. **`src/middleware.ts` uses the deprecated Next 16 `middleware` convention.** The docs in `node_modules/next/dist/docs/` say it was renamed to `proxy`. Migrate when integrating (see AGENTS.md: read those docs before writing Next code).
20. The **cookie is host-only** (no `Domain` attribute), set by the API host. It works on localhost because cookies ignore ports. **In production, if the web app and API are on different hosts (e.g. `app.x.com` and `api.x.com`), the Next middleware on the web host won't see the cookie and will redirect signed-in users to `/login`.** Serve both under one host (reverse-proxy `/api`) or set a shared cookie domain.

## 9. Integration guide

### 9.1 Recommended shape
Treat Flash Sign as a **signing module** with four seams to the host:

| Seam | Current implementation | What to do in the host |
|---|---|---|
| **Identity** | `users`, `sessions`, `server/lib/auth.ts`, `middleware/auth.ts`, `routes/auth.ts`, `AuthProvider`/`AuthGate`, login/signup/verify/forgot screens | Replace with the host's auth. The module only needs (a) `req.userId` on authenticated requests, (b) `findUserById → {id,email,firstName,lastName,company,title,photoUrl}`, (c) `findUserByEmail` for the recipient login gate and dashboard tasks, and (d) the client `useAuth().user` with the `AuthUser` shape. Drop the auth routes and screens if the host owns them. |
| **Persistence** | Drizzle tables in `server/db/schema.ts` | Merge into the host's schema. Table names (`users`, `sessions`, `signatures`, `templates`) and enum names (`envelope_status`, `field_type`, `activity_type`, …) are generic and **likely to collide**: prefix them (e.g. `fs_`) or use a Postgres schema. Point FKs at the host's users table. |
| **Email** | `server/lib/mailer.ts` (nodemailer) | Keep the template functions and swap `sendEmail()` for the host's mail service. Keep `APP_URL` pointing at wherever `/sign/[token]` is mounted. |
| **Jobs** | `server/lib/scheduler.ts` (`setInterval`) | Call `runReminderSweep()` / `runExpirationSweep()` from the host's job runner or cron with a single-runner guarantee. Don't call `startScheduler()` per instance. |

The signing domain itself — draft-setup, draft-fields, send-envelope, self-sign, signing, signing-token, pdf-flatten, envelopes, home, contacts and profile signatures — can move largely intact. It depends only on `db`, the user lookups, the mailer and `JWT_SECRET`.

### 9.2 Mounting
- **API:** mount the routers under the host's API prefix (`/api/envelopes`, `/api/sign`, `/api/home`, `/api/profile`). The `express.json({limit:"8mb"})` body limit is required for data-URL uploads, so match it or move to multipart uploads.
- **Web:** copy the `src/app/**` route folders under a module prefix (e.g. `/sign-module/...`) or keep the paths. Hard-coded paths you'll need to update if you prefix: `/envelopes...`, `/sign/<token>` (also built server-side in `server/lib/home.ts`, `server/lib/envelopes.ts`, `server/lib/send-envelope.ts`), `/home`, `/profile`, `/templates`, `/login?next=`, `draftResumeHref`, `envelopeWizardHref` and `selfSignAddFieldsHref`, plus `folderLinksFor` in `server/lib/envelopes.ts`.
- **`/sign/[token]` must stay reachable without host login.** Exclude it from the host's auth middleware and client auth gate exactly as `src/middleware.ts` and `AuthGate` do today; the API decides who needs to log in.
- **The pdf.js worker** must be served at `/pdf.worker.min.mjs` (hard-coded in `PdfCanvas.tsx`) and must match the `pdfjs-dist` version. Keep the `postinstall` copy script. Use the **legacy** build; the modern build crashes on current browsers per the comment in `PdfCanvas.tsx`.
- **Styling:** Tailwind v4 theme tokens in `src/app/globals.css` (`ink`, `ink-soft`, `flash` `#00c2a8`, `flash-deep`, `paper`, `paper-elevated`, `mist`, `line`, `muted`, `danger`, `waiting`, plus `font-display`/`font-sans`) and utility classes like `paper-grain` and `hero-wash`. Bring them over or remap them to the host's design tokens. The signature fonts come from `next/font/google` inside `CreateSignatureModal.tsx` and `ProfilePage.tsx`.

### 9.3 Shared code coupling
The server imports from the frontend tree: `src/lib/limits.ts`, `src/lib/documents.ts`, `src/lib/advanced-options.ts`, `src/lib/phone.ts`, and types from `src/lib/envelopes.ts`. Keep these as a shared package or folder reachable from both sides, or the server won't compile.

### 9.4 Authorisation in a multi-role host
Today, "who may do what" is just "the sender owns the envelope" and "the recipient email matches". **Recipient roles (`needs_to_sign`, `receives_copy`, …) are per-envelope signing roles, not application roles; keep them separate from host roles (CEO, PM, Dev, …).** If the host has orgs, teams or RBAC, add those checks **in the Express services**, not only in menus: `getOwnedDraft`, `getOwnedEnvelope`, `getEnvelopeById`, `listEnvelopePage`, `deleteEnvelope`, `restoreEnvelope`, `sendEnvelope`. Personal signing (`/api/sign/*`) should remain tied to the addressed email and identity, never inherited from a role.

### 9.5 Linking host records to envelopes
There is no foreign "context" on an envelope today. To attach an agreement to a host object (project, milestone, work item), add a nullable reference column or a join table (e.g. `envelope_links(envelope_id, entity_type, entity_id)`), and react to the lifecycle events in §5.13–5.20. The cleanest hook points are the post-commit sections of `sendEnvelope`, `submitSigning` (for `completed`), `declineSigning` and `runExpirationSweep`. Emitting a domain event there avoids polling.

### 9.6 Suggested hardening while integrating
- Move files to object storage. Touch points: `checkDocumentUpload` / `addDraftDocument` / `getEnvelopeDocumentFile` (`draft-setup.ts`), `getSigningDocumentFile` (`signing.ts`), the two file-streaming handlers in `routes/envelopes.ts` and `routes/sign.ts`, `parseDataUrl` in `pdf-flatten.ts`, and `fileToDataUrl` in `useEnvelopeDraftSetup.ts` and `SignDocumentUpload.tsx`.
- Use separate secrets for session JWTs and signing-link JWTs. Consider storing a signing-link nonce so links can be revoked.
- Add rate limiting on `/api/auth/*` and `/api/sign/*`.
- Server-stamp `date_signed`, and add a completion certificate and a document hash.
- Push inbox filtering and pagination into SQL.
- Migrate `src/middleware.ts` to the Next 16 `proxy` convention.

### 9.7 Smoke test after moving (manual; there are no automated tests)
1. Sign up → read the OTP from the console (no SMTP) → verify → land on Home.
2. Get Signatures: upload a PDF, add 2 signers with signing order on, plus 1 "Receives a Copy". Place a signature for each signer → Send. Expect the copy email right away and an invite to signer 1 only.
3. Open signer 1's link logged out. If signer 1's email is registered, expect "Sign in to continue"; otherwise the document opens. Adopt a signature → Finish → signer 2 gets an invite.
4. Signer 2 signs → everyone gets the "Completed" email with the PDF attached; the envelope shows in the Completed folder; the downloaded PDF has both signatures burned in.
5. Self-sign: Sign a Document → drag a signature → Finish → sign → completion email to yourself.
6. Decline path: the envelope is voided and the sender gets the email. Expiry: set `expires_on` in the past and run `runExpirationSweep()`.
7. Inbox: delete → Deleted → restore; delete twice → permanent.

## 10. Glossary
- **Envelope:** one signing transaction: documents + recipients + fields + status.
- **Display envelope ID (`envelope_id`):** the UUID shown and copied in the UI; `id` (`env-…`) is the internal key used in URLs and the API.
- **Routing order:** a signer's position when "signing order" is on; signers with equal order sign in parallel.
- **Active signer:** a recipient with status `needs_to_sign`, i.e. allowed to submit now.
- **Flattening:** drawing the collected field values into the PDF to produce the final "signed" copy.
- **Self-sign:** an envelope whose only signer is the sender (`only_signer = true`); no emails until completion.

## 11. Related files
- `docs/EMAIL_SETUP.md`: SMTP provider setup (Gmail, SendGrid, Ethereal).
- `docs/ARCHITECTURE_AND_SRS.md`: original architecture/SRS (partially outdated).
- `docs/high-level-architecture.drawio`: architecture diagram (untracked).
- `PROJECT_MANAGEMENT_REQUIREMENTS.docx`, `FLASH_SIGN_PROJECT_MANAGEMENT_REQUIREMENTS.docx` (untracked): requirements for the project-management platform this module is heading into. They state that common FlashSign owns accounts, verification, roles, Teams and recipient signing, and that project management consumes those identities and links approvals and agreements rather than duplicating signing workflows.

## 12. Uncommitted working-tree changes at time of writing
The following are modified but uncommitted on `main`; confirm with the owner whether they are intended before porting:
- `src/app/signup/page.tsx` now redirects to `/login`. Self-service signup screens are disabled, but `POST /api/auth/signup` still works and `AppNav` still links to `/signup`.
- `src/components/LoginForm.tsx` has a new layout and reads `?email=` and `?invited=1`. The footer says "Access by invitation only". **No invitation backend exists yet.**
- `src/components/AuthShell.tsx` is rebranded for the host platform (slogan "Agile Project Management", chips "AI SRS Engine", "MCP Coding Agents") and exports `HexagonIcon`.
- `src/components/SocialButtons.tsx` is restyled; the buttons are still non-functional.
- `package-lock.json` and `public/pdf.worker.min.mjs` were changed by a reinstall (the worker is refreshed by `postinstall`).
