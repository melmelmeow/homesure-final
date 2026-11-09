# Kasafide — setup, step by step

Follow this once. It takes about 20 minutes. Do the steps in order; each one says how to tell it worked.

> ### How to run a `.sql` file in the SQL Editor
>
> The editor runs **SQL text**, not file paths. Typing `supabase/migrations/000_check_state.sql`
> into it gives you `ERROR: 42601: syntax error at or near "backend"`. For every `.sql` file below:
>
> 1. Open the file in VS Code (click its name in the Explorer).
> 2. Click inside it, then **Ctrl+A** (select all) → **Ctrl+C** (copy).
> 3. In the SQL Editor, **Ctrl+A** → **Ctrl+V** (replace whatever is there with what you copied).
> 4. **Run**.
>
> You should see real SQL in the editor — `WITH state AS (`, `CREATE TABLE`, `ALTER TABLE` — not a file name.

---

## Step 1 — See what your database already has

Open Supabase Studio for your project (`https://srv1824055.hstgr.cloud`) → **SQL Editor**.

Run `supabase/migrations/000_check_state.sql` (copy its contents in, as described in the box above).

It changes nothing. It prints six rows:

| migration | status |
|---|---|
| 001_initial_schema | APPLIED or RUN THIS |
| … | … |

**Write down which ones say `RUN THIS`.** You only run those.

> **Do not re-run a migration that says APPLIED.** `001` has no "if not exists" guards, so running it twice
> fails with `type "user_role" already exists`. That error is harmless (nothing is changed), but it is confusing.

---

## Step 2 — Run the migrations that say RUN THIS

For each one, in numeric order: open the file in `supabase/migrations/`, **Ctrl+A → Ctrl+C**, then in
the SQL Editor **Ctrl+A → Ctrl+V → Run** (see the box at the top). Finish one before starting the next.

```
001_initial_schema.sql           ← Choya's tables
002_rls_policies.sql             ← Choya's security rules
003_functions_triggers.sql       ← auto-create profile on signup
004_similarity_function.sql      ← FIXED (the old version could not run at all)
005_roles_seller_superadmin.sql  ← NEW: landowner → seller, adds superadmin
006_frontend_alignment.sql       ← NEW: everything your front end needs
007_payments_and_deposits.sql    ← NEW: the payments pages and security deposits
```

`005`, `006` and `007` are all safe to run more than once.

`007` needs `006` first, and says so plainly if you run it too early.

If you run `006` before `005`, it stops with a clear message telling you to run `005` first — nothing is half-applied.

**How to tell it worked:** run `000_check_state.sql` again. All six rows should say `APPLIED`.

### If `005` errors

Run it as the **only** thing in the editor (clear the box first) — a new role value cannot be created and used
in the same transaction.

`005` copes with both shapes a database can be in: `profiles.role` already being the `user_role` enum, or being
a plain text column (in which case it converts the column, preserving your rows and your security policies).
It is atomic — if it fails, nothing changed.

If it still fails, run `000b_diagnose_role_type.sql` (read-only) and send the result. It shows what
`profiles.role` really is and where the enum lives.

### If `006` says "Run 005 … first"

That is the guard working: `005` did not finish. Fix `005`, then come back to `006`. Nothing was half-applied.

### What `007` adds

* `payments`: `due_date`, `period`, `method`, `reference`, plus `proof_url` and the seller's decision.
  The payments pages show all of these, and until now the table had nowhere to keep them.
* `security_deposits`: the amount a landlord holds and the itemised damage deductions, so the buyer
  can see what is actually refundable. There was no table for this at all.
* `profiles.payment_methods`: where a seller says how to be paid. The two payment-methods forms were
  writing this into the browser session, so it vanished on sign-out and no buyer ever saw it.
* a private `payment-proofs` bucket for GCash screenshots.

---

## Step 3 — Check the two storage buckets

Supabase Studio → **Storage**. You should see:

| Bucket | Public? | Holds |
|---|---|---|
| `listing-images` | **yes** | listing photos |
| `verification-docs` | **no** | IDs, selfies, titles, deeds |
| `payment-proofs` | **no** | GCash / bank screenshots |

`006` creates the first two and `007` creates the third. If they are missing (some self-hosted installs do not expose the `storage` schema to SQL),
create them by hand with exactly those names and those public/private settings.

`verification-docs` and `payment-proofs` **must stay private** — one holds people's IDs, the other holds
screenshots with real names and phone numbers on them. The app opens those files with short-lived signed
links. For a payment proof, the only people who can read it are the buyer who uploaded it, the seller of
that particular listing, and an admin.

---

## Step 4 — Fill in the backend's secrets

`.env.local` already has the Supabase URL, the anon key and the service-role key. What is still a
placeholder:

```ini
# Xendit → Settings → Developers → API Keys. Still reads "your-xendit-secret-key".
# Needed only for the "Pay through Kasafide" QR Ph route. Without it that button answers
# "Xendit not configured" — it does not pretend to succeed.
XENDIT_SECRET_KEY=

# Xendit → Settings → Developers → Webhooks. Set the webhook URL to
#   https://<your-domain>/api/webhooks/xendit
# and paste its verification token here. This is what marks a QR charge paid.
# The route refuses every request while this is unset, so an unconfigured webhook
# cannot be used to mark payments paid.
XENDIT_CALLBACK_TOKEN=

# Only needed for the OCR title check. Leave it out and that one feature returns a clear error.
GOOGLE_CLOUD_VISION_API_KEY=
```

Paying the landlord directly (GCash, bank, cash) needs none of these — it only needs `007` and the
service-role key, both of which are already in place.

`FRONTEND_ORIGINS` is only for serving the front end from a different origin than the API. With one
server — the normal setup — leave it out.

Never put the service-role key in `assets/js/config.js` or anywhere in `public/` — it bypasses every
security rule in the database. The anon key there is public by design; RLS is what protects the data.

---

## Step 5 — Start the app

One server now runs both halves: the front end and the API.

```bash
npm install
npm run dev
```

**How to tell it worked:** the terminal says `Ready in …` and `Local: http://localhost:3000`.
Leave that terminal open — closing it stops the app.

---

## Step 6 — Open it

Go to **http://localhost:3000/browse.html**

| What you see | What it means |
|---|---|
| Your listings (or "0 properties found") | It works. The front end is talking to the real database. |
| "Could not load listings" | Press **F12** → **Console** tab and read the red text. Usually `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `public/assets/js/config.js`. |

There is no second server and no Live Server any more. Everything is on port 3000:

| URL | Page |
|---|---|
| `localhost:3000/` | home |
| `localhost:3000/browse.html` | public listings |
| `localhost:3000/auth/signin.html` | sign in |
| `localhost:3000/module/buyer/buyer.html` | buyer dashboard |
| `localhost:3000/api/*` | the API |

---

## Step 7 — Make yourself a superadmin

Roles are `buyer`, `seller`, `admin`, `superadmin`. Nobody can change their own role — not even an admin;
only a superadmin can. So the first one is set by hand.

1. Go to `http://localhost:5500/auth/signup.html` and sign up normally.
2. Confirm the email (Supabase Studio → **Authentication** → your user → confirm, if email sending is not set up).
3. SQL Editor:

```sql
update profiles set role = 'superadmin' where email = 'YOUR-EMAIL-HERE';
```

4. Sign out and sign in again — you land on the super-admin dashboard.

To make an admin later, do the same with `role = 'admin'` (or add them from the super-admin page).

---

## Step 8 — Walk one listing end to end

This proves front end, backend and database all agree. Make a second account for the seller
(`auth/signup.html` → pick **Seller**).

| # | Who | Do this | Should happen |
|---|---|---|---|
| 1 | Seller | sign in | lands on the seller dashboard, badge says **Unverified** |
| 2 | Seller | *My Listings* → Add | blocked — "Complete verification to post listings" |
| 3 | Seller | Settings → verification → take ID + selfie → submit | badge becomes **Pending Review** |
| 4 | Admin | *Users* → the seller → **Approve** | seller becomes **Verified** |
| 5 | Seller | reload → *Add listing* → fill in, add a photo + a title document → **Submit for Review** | appears under **Pending**, and the photo really uploaded (Storage → `listing-images`) |
| 6 | Admin | *Listings* → the listing → **Approve** | status becomes **Approved** |
| 7 | Anyone | `browse.html` (even signed out) | the listing is now visible to the public |
| 8 | Buyer | open it → **Save Listing** | the heart fills; it is in *Saved Listings* after a reload |
| 9 | Buyer | **Schedule Viewing** | the seller gets a viewing request |
| 10 | Seller | Settings → *Payment Methods* → fill in GCash → **Save** | sign out, sign back in, the number is still there |
| 11 | Buyer | *Payments* → **Pay Now** → pick the listing → **I paid the landlord directly** → attach any image | "Proof submitted", and it shows as **Pending Confirmation** |
| 12 | Seller | *Payments* → the pending card → **View proof** | the buyer's screenshot opens |
| 13 | Seller | **Mark Received** | it moves to **Confirmed**, and the buyer sees that on their own page |
| 14 | Seller | *Deposits & Damage* → **File Damage** → ₱2,500 | the refundable balance drops by ₱2,500 on **both** sides |

If step 7 does not show the listing, the admin approval did not go through — check the browser console on the
admin page.

Step 11 needs `007` to have run. Step 13 needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — confirming a
payment is a server-side write, so without that key it fails with *"Payment not found"*.

The **Pay through Kasafide** route in step 11 needs real Xendit keys. Without them it answers
*"Xendit not configured"* instead of pretending to succeed. Everything else above works on Supabase alone.

---

## What is wired up

Every page reads and writes the real database. `assets/js/fake-data.js` is gone, and so are the three
superseded dashboard scripts that used it (`admin/admin.js`, `buyer/buyer.js`, `seller/seller.js` — the live
pages load `*-dashboard.js` instead). There is no sample data left anywhere in `public/`.

Pages talk to the database through one module, `assets/js/data.js`, which exposes `HS.*`. It maps the
database's `snake_case` columns to the `camelCase` the pages already used, so a page never spells a column
name itself. If you add a page, follow the same load order:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js"></script>
<script src="../../assets/js/config.js"></script>   <!-- defines sb -->
<script src="../../assets/js/session.js"></script>
<script src="../../assets/js/data.js"></script>     <!-- defines HS -->
<script src="../../assets/js/your-page.js"></script>
```

### Three things that deliberately do NOT go through the browser

`payments` has no `INSERT` or `UPDATE` policy for end users. That is on purpose, and it is why these go
through API routes instead:

| What | Route | Why it cannot be done client-side |
|---|---|---|
| Raising a QR Ph charge | `POST /api/payments/create-invoice` | the **amount** is computed from the listing price on the server. A client that could name its own price could pay ₱1 for a ₱15,000 month. |
| Recording a manual payment | `POST /api/payments/manual-proof` | same reason, plus it checks the proof you attached is a file you uploaded. |
| Confirming or rejecting one | `POST /api/payments/confirm` | it verifies you really are the listing's landowner, and refuses to decide a payment twice. |

Marking a QR Ph charge paid is not in that list, because the browser never does it: Xendit calls
`POST /api/webhooks/xendit` and that is the only thing that sets a charge to `paid`. The payment modal polls
the row and waits.

Security deposits are different — `security_deposits` has policies the client can use directly (both sides
read the row, only the seller writes it), so the browser talks to that table without a route.

---

## Secrets

`.env.local` is never committed (`.gitignore` covers `.env*`). It holds the Supabase anon and
service-role keys. The Xendit and Google entries are still the example placeholders — fill them in when
those integrations are actually wired up.

The **service-role key bypasses every security rule in the database**. It belongs in `.env.local` and
nowhere else — never in `assets/js/config.js`, never in a screenshot, never in a commit.
