# Kasafide

One repo, one server. `npm run dev` serves the front end **and** the API on `http://localhost:3000`.

| Path | What it is |
|---|---|
| `public/` | The front end — static HTML/CSS/JS (`index.html`, `browse.html`, `auth/`, `module/`, `assets/`, `components/`). Next.js serves this at the site root. |
| `src/app/api/` | The API — sign-up, email confirmation, payments, refunds, OCR, the Xendit webhook. Needs secrets, so it runs server-side. |
| `supabase/migrations/` | The database definition. |

`src/` is the backend and nothing else. A second React dashboard used to live there; it was
removed once the pages in `public/` covered the same ground against the live database. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the full map and [CHANGELOG.md](CHANGELOG.md) for what
changed when.

The front end is the source of truth for what the app does. The database keeps its own column names
(`property_type`, `listing_type`, `latitude`, `floor_area_sqm`, `barangay_id`, `saved_properties`, …)
and the code was adapted to them — see `006_frontend_alignment.sql`.

## Run it

**Setting up for the first time? Follow [SETUP.md](SETUP.md)** — step by step, with a check at each stage.

```bash
npm install
npm run dev          # http://localhost:3000
```

| URL | Page |
|---|---|
| `localhost:3000/` | the front end home (redirects to `/index.html`) |
| `localhost:3000/browse.html` | public listings |
| `localhost:3000/auth/signin.html` | sign in |
| `localhost:3000/module/buyer/buyer.html` | buyer dashboard |
| `localhost:3000/api/*` | the API |

Secrets live in `.env.local` (never committed). `SUPABASE_SERVICE_ROLE_KEY` is required for payments
and refunds. The front end's Supabase URL and anon key are in `public/assets/js/config.js` — the anon
key is meant to be public; Row Level Security decides what anyone can actually read or write.

## First admin

Roles are `buyer`, `seller`, `admin`, `superadmin`. Nobody can change their own role — not even an
admin. Sign up normally, then promote the account in the Supabase SQL editor:

```sql
update profiles set role = 'superadmin' where email = 'you@example.com';
```

## How the front end reads data

```
config.js   → Supabase client (sb)
session.js  → cached profile (getSession) + sign-out + guards
data.js     → HS.*  the only place that talks to the database
```

Pages call `HS.listings…`, `HS.favorites…`, `HS.admin…` rather than reading sample data. `data.js`
maps the database's snake_case columns to the camelCase shape the pages already used, so no page had
to change its markup.

**Still on sample data** (`public/assets/js/fake-data.js`): messages, viewing requests (seller side),
reviews, payments/transactions, notifications, reports, analytics, profile & settings, MOA, and the
super-admin pages. Their tables already exist (`messages`, `viewing_requests`, `reviews`,
`listing_reports`, `notifications`, `audit_logs`, `payments`) — the page scripts just need pointing at
`HS.*`. A page loads `fake-data.js` only while its script still needs it; remove that one `<script>`
line when you convert a page.

## Payments

The `payments` table carries **both** providers' columns on purpose: PayMongo (`paymongo_source_id`,
`paymongo_reference`, `webhook_payload`) was already in the database, and the API routes under
`src/app/api/payments` and `src/app/api/webhooks/xendit` are written against **Xendit**
(`xendit_charge_id`, `xendit_qr_string`). Neither side's work was thrown away; settle on one provider
and use its columns.
