# Kasafide — how the repo fits together

One Next.js application. The front end and the backend live side by side in it, and the split is
the top-level folder:

```
public/   the front end   — 58 pages, plain HTML + CSS + JavaScript
src/      the backend     — 12 API routes, TypeScript
supabase/ the database    — 12 migrations, run in order, plus 3 read-only checks
```

Both halves are served by the same process. `npm run dev` starts one server on
`http://localhost:3000`; the pages and the API are on the same origin, so the front end calls
`/api/...` with no host and no CORS.

> These two folder names are fixed by Next.js, not chosen. `public/` is where it serves static
> files from and `src/app/` is where it reads routing from. Moving either one breaks the
> application, so treat the layout below as the shape of the project rather than a preference.

---

## public/ — the front end

```
public/
├── index.html              landing page (React via CDN, see assets/js/index.js)
├── browse.html             public listing search
├── about.html  faqs.html  help.html  terms.html  privacy-policy.html
│
├── auth/                   signin · signup · forgot-password
│
├── module/                 everything behind a login
│   ├── buyer/        12 pages
│   ├── seller/       14 pages
│   ├── admin/        11 pages
│   └── super-admin/   7 pages
│
├── components/             4 shared widgets: sidebar · topbar · review-prompt · skeleton
├── demo/                   4 standalone component demos, not linked from the app
└── assets/
    ├── js/                 52 scripts — one per page, plus the shared ones below
    ├── css/                53 stylesheets
    ├── img/                logos and placeholders
    └── data/               the Sta. Maria barangay boundaries used by the map
```

### The five scripts every page loads, in this order

Order matters: each one uses what the previous ones defined.

| | What it provides |
|---|---|
| `supabase-js` (CDN) | the Supabase client library |
| `assets/js/config.js` | `sb` — the configured client, plus the Supabase URL and anon key |
| `assets/js/session.js` | `getSession` · `saveSession` · `hsSignOut` · `requireRole` · `hsToast` |
| `assets/js/data.js` | `HS` — **the only place the front end talks to the database** |
| `assets/js/<page>.js` | the page itself |

A page that skips `config.js` fails on its first query with `sb is not defined`.

### HS — the data layer

`assets/js/data.js` is the seam between the two halves. Database rows are `snake_case`; the pages
use `camelCase`. Everything `HS` returns is already in the shape the page expects, so **no page
ever spells a column name**. Change a column, change one file.

```
HS.auth          sign in, refresh the cached profile, change password
HS.profiles      read and edit profiles, seller payment methods, MOA signature
HS.listings      create · submit · approve · close · search
HS.favorites     saved listings
HS.storage       uploads: listing photos, avatars, verification documents, payment proofs
HS.verification  submit documents, admin approve/reject
HS.viewing       viewing requests
HS.messages      conversations
HS.reviews       ratings
HS.payments      the payments list, plus the three API calls below
HS.deposits      security deposits and their damage deductions
HS.reports       listing reports
HS.admin         users and admin accounts
HS.audit         the super-admin audit trail
HS.barangays     the Sta. Maria barangay lookup
```

---

## src/ — the backend

```
src/
├── app/api/                 12 routes
│   ├── auth/                signup · verify-email · resend-verification · callback · signout
│   ├── payments/            create-invoice · manual-proof · confirm
│   ├── refunds/             request · disburse
│   ├── verify/ocr           land-title OCR
│   ├── webhooks/xendit      Xendit calls this; it is what marks a charge paid
│   └── analytics/gsc-sync   Search Console metrics
│
├── lib/
│   ├── api.ts               guardApi() — authenticates a request, optionally by role
│   ├── email.ts             SMTP sending and the confirmation email template
│   ├── verification.ts      confirmation tokens: issue, hash, expire
│   ├── payments.ts          what a payment costs, computed server-side
│   └── supabase/            server-client (caller's identity) · admin-client (service role)
│
└── middleware.ts            CORS for /api — nothing else needs it
```

### Why some things cannot be done from the browser

Most of the front end talks straight to Supabase, and Row Level Security decides what each account
may read or change. Four things deliberately do not work that way.

| What | Route | Why not client-side |
|---|---|---|
| Sign up | `POST /api/auth/signup` | creates the account **unconfirmed** and emails the link itself — see below |
| Raise a QR Ph charge | `POST /api/payments/create-invoice` | the **amount** is computed from the listing price on the server. A client that could name its own price could pay ₱1 for a ₱15,000 month. |
| Record a manual payment | `POST /api/payments/manual-proof` | same reason, and it checks the attached proof is a file you uploaded |
| Accept or reject one | `POST /api/payments/confirm` | verifies the caller really is the listing's landowner, and refuses to decide the same payment twice |

`payments` has no `INSERT` or `UPDATE` policy for end users. That is the enforcement; the routes
are simply the only door.

Marking a QR Ph charge paid is not in that table, because nothing in the browser does it: Xendit
calls `POST /api/webhooks/xendit`, and that is the only thing that sets a charge to `paid`. The
payment modal polls the row and waits.

Security deposits are the opposite case — `security_deposits` has policies the client can use
directly (both sides read the row, only the seller writes it), so the browser talks to that table
with no route in between.

### Email confirmation

The Supabase auth server requires a confirmed email before anyone may sign in, but has no SMTP
configured, and that server is not ours to change. Its own signup endpoint therefore fails every
time with *"Error sending confirmation email"*.

So Kasafide sends the mail:

```
POST /api/auth/signup      creates the account UNCONFIRMED through the admin API
                           (which sends nothing, so it cannot fail that way),
                           stores a hashed token, emails the link
GET  /api/auth/verify-email   confirms the account when that link is opened
```

The gate is still the auth server's own. An unconfirmed account is refused at sign-in by Supabase
with *"Email not confirmed"* — not by anything in this code — so it cannot be bypassed by talking
to the database directly.

`npm run check-email` tests the SMTP settings on their own and names the one that is wrong.

---

## supabase/ — the database

Twelve migrations, `001` through `012`, run in numeric order in the Supabase SQL Editor.

Three more files are diagnostics that change nothing: `000_check_state.sql` reports which of the
twelve are still missing, and `000b` / `000c` dump the real shape of `profiles.role` and of the
whole schema when a migration complains about something that should already be there.

| | |
|---|---|
| `001`–`003` | the original tables, RLS policies and the profile-on-signup trigger |
| `004` | name matching for OCR (the original could not apply at all — signature collision with `pg_trgm`) |
| `005` | roles: `landowner` → `seller`, adds `superadmin` |
| `006` | everything the front end needs: moderation columns, messages, reviews, reports, notifications, audit logs, and the RLS fixes |
| `007` | payment periods and proofs, security deposits, seller payment details |
| `008` | the confirmation tokens Kasafide emails itself |
| `009` | indexes for the queries the front end actually runs |
| `010` | the `barangays` lookup corrected to the real 24 of Sta. Maria, Bulacan — the hand-filled table had picked up 9 from other municipalities and was missing 3 real ones. Also what seeds all 24 on a database where nothing has inserted one yet, not just a patch for the old hand-filled table. |
| `011` | restores the `anon`/`authenticated`/`service_role` table-level grants a fresh Supabase project doesn't bootstrap on its own — without it every table answers permission denied no matter how correct its RLS policies are, since GRANT is checked before RLS ever runs |
| `012` | repoints foreign keys that were still aimed at a legacy pre-`001` `users` table instead of `profiles` — on a database that predates `001`, `CREATE TABLE IF NOT EXISTS` left those tables' original constraints untouched, so any account created since (signup, seed scripts) had no row in that old table and every insert referencing it failed with a foreign-key error even though the account was completely real |

`005` onwards are safe to run more than once, and each checks the one before it rather than
half-applying.

**The live database is the authority on column names.** It was not built from `001`, so where the
two disagree, the live shape wins. `006` adds only what is genuinely missing and never renames or
drops a column that holds data.

### Storage buckets

| Bucket | Public | Holds |
|---|---|---|
| `listing-images` | yes | listing photos and avatars |
| `verification-docs` | no | IDs, selfies, land titles |
| `payment-proofs` | no | GCash and bank screenshots |

Both private buckets are opened with short-lived signed links. A payment proof is readable by the
buyer who uploaded it, the seller of that one listing, and an admin — nobody else.

---

## One user interface

There used to be two: the pages in `public/module/` and a second React dashboard under
`src/app/dashboard/`, covering some of the same ground in a different technology. The React one
was removed on 2026-10-11 — nothing linked to it, it had no super-admin role at all, and only the
pages in `public/` were wired to the live database.

Removed with it: the React login and sign-up pages (the front end has its own at
`public/auth/`), `src/app/page.tsx` (a listings page that `/` never reached, because
`next.config.mjs` redirects `/` to `/index.html`), a "Notes CRUD" tutorial scaffold, and the five
components only those pages used.

So `src/` is now the backend and nothing else: 12 API routes, the libraries they share, and a
middleware whose only remaining job is CORS. Next.js still needs `app/layout.tsx` to exist, so it
stays, but no page uses it.

Git keeps all of it if any turns out to be wanted again.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000 — both halves
npm run build        # what Vercel runs
npm run check-email  # tests SMTP on its own
```

`.env.local` is not in git — it holds the service-role key, which bypasses every database rule.
`.env.example` lists every setting with a note on what breaks without it. On a deployment the same
values go in the host's environment variables instead.

The anon key in `public/assets/js/config.js` *is* meant to be public. What a visitor can read or
change is decided by Row Level Security, not by hiding that key. The service-role key must never
appear anywhere under `public/`.
