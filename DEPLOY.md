# Deploying Kasafide

Kasafide is a Next.js application, not a static site. Twelve API routes — sign-up, email
confirmation, payments, the Xendit webhook — run as server code. **Copying files is not a deploy.**

Every deploy, whatever the method, is these four steps:

```
1. get the new code onto the server
2. npm install          dependencies change, and node_modules is not in git
3. npm run build        Next.js compiles; without this the server runs the old build
4. restart the process  Node does not notice new files on its own
```

Two more, only when something changed:

```
5. run any new migration in the Supabase SQL Editor
6. add any new environment variable, then restart again
```

`CHANGELOG.md` says which entries need 5 or 6. If an entry has a **You need to** line, pulling the
code does not finish the job.

---

## Option A — Vercel (recommended)

Connect the GitHub repo once. After that every `git push` deploys by itself: Vercel runs
`npm install` and `npm run build` and swaps the running version over. Steps 1–4 stop being
anybody's job.

It also gives you a real HTTPS address, which the app needs for two things:

- **confirmation links.** On localhost the emailed link is `http://localhost:3000/...`, which only
  works on the machine that sent it. On any other phone or laptop it fails.
- **the Xendit webhook**, which has to reach a public URL.

Environment variables go in the Vercel dashboard, not in a file. `.env.local` is deliberately not
in git — it holds the service-role key, which bypasses every database rule.

## Option B — git pull on the server

If you have SSH on the VPS, this replaces the upload step entirely:

```bash
cd /path/to/homesure
git pull
npm install
npm run build
pm2 restart homesure      # or systemctl restart, or however the process is managed
```

Git then records exactly which commit is live, so "is the site up to date?" has an answer.

## Option C — FTP (FileZilla)

Workable, but know what it does and does not do.

What it cannot do on its own: steps 2, 3 and 4. You still need SSH afterwards to install, build and
restart, so FTP only replaces step 1 — and Option B replaces it with one command.

What not to upload:

| | Files | Why not |
|---|---|---|
| `node_modules/` | ~22,800 | Some packages compile for the machine they install on. A copy from Windows can fail on Linux. Run `npm install` on the server instead. |
| `.next/` | ~2,000 | The build output. Run `npm run build` on the server instead. |

Uploading both is about 673 MB over FTP. A dropped connection leaves one file truncated, the build
or the boot fails, and nothing says which file.

Upload the source — `public/`, `src/`, `supabase/`, `scripts/`, `package.json`,
`package-lock.json`, the config files — then SSH in for steps 2–4.

---

## Environment variables the server needs

`.env.local` is not in git, so it has to exist on the server (or in the host's dashboard) and be
kept up to date by hand. `.env.example` lists every setting with a note on what breaks without it.

| | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | sign-up, payments, refunds, the webhook |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_FROM` | sign-up — without these it answers 503 and says so |
| `APP_ORIGIN` | the address confirmation links point back to |
| `XENDIT_SECRET_KEY` | the QR Ph payment route |
| `XENDIT_CALLBACK_TOKEN` | the webhook — it refuses every request while this is unset, so an unconfigured webhook cannot be used to mark payments paid |

**The service-role key must never appear anywhere under `public/`.** It bypasses Row Level
Security entirely. The anon key in `public/assets/js/config.js` is meant to be public; what a
visitor may read or change is decided by RLS, not by hiding that key.

### Once there is a real address

Two settings point at it:

```ini
APP_ORIGIN=https://your-domain
```

and in the Xendit dashboard, the webhook URL:

```
https://your-domain/api/webhooks/xendit
```

Restart after changing either.

---

## Checking a deploy actually worked

```
/                            the landing page loads
/browse.html                 listings appear (this proves the database connection)
/auth/signup.html            sign up — the confirmation email should arrive
```

If sign-up answers *"this server cannot send email yet"*, the SMTP settings are missing or the
process was not restarted after they were added. `npm run check-email` tests them on their own and
names the one that is wrong.

If a page loads but stays empty, open the browser console. One error early in a page script stops
every line after it, and the page is left showing its placeholder.
