# Changelog

What changed in Kasafide, newest first. The front end and the database are the two halves that
move most, so each entry says which one it touches and whether anything has to be run or re-sent
after pulling.

**If an entry has a "You need to" line, pulling the code is not enough on its own.**

---

## 2026-11-05

### Light mode is softer ("Lavender mist"); dark mode unchanged

**Front end only.** Branch `fix/soft-light-mode`. Colours and shadows only, no layout or copy.

- Light tokens in `kasafide-theme.css`: lavender `--bg` #ECE4F4 and `--surface` #F7F2FB instead of
  cream and pure white, softer `--border` and `--text-muted`. `--success`, `--warning` and
  `--danger` darkened a step so they still clear 4.5:1 on the darker panels.
- Rules shared by both themes were written for dark, tinting with white and shadowing with black.
  They now use `--wash-rgb` / `--shade-rgb` (exactly white / black in dark, plum ink in light),
  with light-only caps on shadows (`--shadow-cap`) and modal backdrops (`--overlay-a`, 0.45).
  Dark mode was compared element by element before and after: no computed colour changed.
- Light only: form controls on `--surface`, placeholders, scrollbars, selection, skeletons, chart
  grid/axis/labels, the browser theme colour and the manifest background.

**You need to:** nothing. No server restart, no migration.

---

## 2026-11-04

### Rebrand: HomeSure is now Kasafide (name, Plum & Peach theme, logo, chatbot, map)

**Front end** (most of it) **and backend** (`src/lib/email.ts`, `src/app/favicon.ico`, the two React
pages under `src/app/`). Branch `rebrand/kasafide`, one commit per area so any piece can be reverted.

- **Name.** Every visible "HomeSure" is "Kasafide". Domains, email addresses, the repo and folder
  names, the pm2 process name and the seed-account emails are deliberately unchanged — they point
  at real things.
- **Theme.** `public/assets/css/kasafide-theme.css` is the only file that spells a colour; every
  page loads it first. `public/assets/js/kasafide-theme.js` (first script in every `<head>`) sets
  `<html data-theme>` before paint, defaults to the OS setting, and stores the visitor's choice in
  `localStorage.kasafide_theme`. Pages change the theme through `KasafideTheme.set()`, not storage.
- **Logo.** `public/assets/js/kasafide-logo.js` draws the cat-house mark inline so its outline turns
  cream in dark mode. New favicon set, `site.webmanifest`, `og-image.png`, OG/Twitter meta tags.
  The old logo files are deleted.
- **Chatbot** is "Kasafide Assistant" with the new avatar. **Map** strokes/fills come from
  `--map-*` tokens; the teal glow is gone.
- **Storage keys** move once, on first load, with no sign-out: `hs-theme`/`theme` →
  `kasafide_theme`, `hs_last_review_prompt` → `kasafide_last_review_prompt` (localStorage),
  `homesure_user` → `kasafide_user` (sessionStorage).

**You need to:** restart the server (the email template, its logo attachment and
`src/app/favicon.ico` changed). In `.env.local` on every machine that sends mail, change the display
name in `SMTP_FROM` from "HomeSure" to "Kasafide" if you want new emails to say so — the address
part stays. No migration.

---

## 2026-10-20

### Save Listing (and anything else writing to a profile-owned row) failed for real, logged-in accounts

**Database**

`Save Listing` failed with *"insert or update on table \"saved_properties\" violates foreign key
constraint \"saved_properties_user_id_fkey\" — Key is not present in table \"users\""* for an
account that was genuinely signed in, with a real row in `profiles` and in Supabase's own
`auth.users`. Looked like a stale/cross-project session at first; it was not.

This database predates `001` (see `ARCHITECTURE.md`) and was first built on an even older,
unnumbered schema with its own `users` table. Every migration since declares its foreign keys as
`REFERENCES profiles(id)`, but each `CREATE TABLE` is guarded with `IF NOT EXISTS` — so on this
database, tables that already existed under the old schema (`saved_properties`, almost certainly
others) kept their original constraint pointing at the legacy `users` table and were never
repointed at `profiles`. Any account created since the move to `profiles` — through signup, the
seed scripts, anything — only ever gets a row in `profiles`, not in that old table, so every
insert referencing one of those accounts failed this way regardless of how correctly it was
authenticated.

`012_fix_legacy_users_fk.sql` finds every foreign key in `public` still aimed at the legacy
`users(id)` and repoints it at `profiles(id)`, preserving each one's `ON DELETE` behavior — not
just the one found by hand, since any other table with the same history has the same bug.

**You need to:** run `supabase/migrations/012_fix_legacy_users_fk.sql` in the SQL Editor.

---

### Saved Listings cards broke on phone-width screens

**Front end**

`.saved-card` (buyer's Saved Listings page) had no mobile layout at all — it kept the desktop
155px-image-plus-price-column row at every width, so on a phone the address wrapped onto a second
line and pushed the rest of the card down, and the bed/bath/area row got clipped mid-word. Added a
stacked layout for it at 640px (image on top, full width — same pattern `.listing-card` already
uses) and stopped the address from wrapping in the first place (now truncates with an ellipsis
like the title does).

---

### Conversation list read as a desktop sidebar on phone width

**Front end**

The messages conversation list (`.conv-panel`, buyer and seller both, shared `buyer-messages.css`)
already goes full-screen on mobile, but kept its desktop sidebar styling on top of that: an 8px
rounded-square avatar and tight list-row padding, closer to a settings menu than a chat app. Added
a 768px rule giving it a circular avatar (matching `.chat-header-avatar`'s pattern), roomier rows,
a bigger title, and safe-area-aware top padding now that it's a real screen top instead of a
sidebar corner.

Also: the generic mobile `.content` rules (side padding, bottom tab-bar clearance) were leaking
onto this page despite `buyer-messages.css` deliberately giving `.content` no padding so the
conversation list sits edge-to-edge — showing up as a strip of page background around the list and
a dead gap below it. `.content:has(.messages-layout)` now zeros that padding back out (higher
specificity wins regardless of source order), with the tab-bar clearance moved onto `.conv-list`
itself instead, which already scrolls.

Also, on request: the shared bell/avatar topbar is now hidden on this page at mobile width
(`.main:has(.messages-layout) #hs-topbar`), and the conversation list is restyled to read as iOS
Messages specifically — a bold large title above a frosted system-gray search pill, and inset row
separators starting after the avatar instead of running edge-to-edge.

---

### Topbar search placeholder clipped to "Search by pr..." on narrow phones

**Front end**

`components/topbar.js` capped `.hs-topbar-search` at 200px (768px breakpoint) and then 130px
(400px breakpoint) — leftover sizing meant to leave room for the hamburger button, which is
`display: none` at those same widths and was never actually competing for the space. At 130px the
long placeholder ("Search by property, location, or seller name...") clipped down to a few
characters. Removed both caps; `flex: 1` plus a new `min-width: 0` let the search box size itself
against the bell/avatar instead.

---

### Seller dashboard's "Verification Required" card collapsed into a ladder on phone width

**Front end**

`.verify-banner` (seller.html's dashboard card, distinct from `.warn-banner` on the listings page)
had no mobile layout: icon, body text, and the "Start Verification" button stayed in one flex row
at every width. The button alone (nowrap, ~140px) plus the 40px icon left almost nothing for the
body column, so the title/subtext wrapped word-by-word into a tall narrow strip next to a
vertically-centered icon and button that ended up looking detached from the text. Regridded at
640px — icon and text share a row, the button gets its own full-width row below — the same pattern
`.how-step` already uses elsewhere in this file.

---

### Seller dashboard's stats/quick-actions cramped on phone width, and its Marketplace filters buried the listings

**Front end**

`.stats-row` (Active Listings / Pending Review / Messages) and `.quick-buttons` (Add New Listing /
Manage Listings) had no mobile layout: 3 equal grid columns and 2 equal flex buttons stayed fixed
at every width, so on a phone the stat labels wrapped to two lines inside cards sized for one.
Stats drop to 2 columns (3rd card spans the full row below); quick-action buttons stack.

Separately: the seller dashboard's own "Marketplace" section (seller.html — a different filter
panel from the one on seller/listings.html) sat inline above the listings with all four fields
stacked full-width on mobile, same complaint buyer.html's filter panel had before it became a
bottom sheet ("ang dami pang dadaanan" — too much to scroll past before reaching the listings).
Gave it the same treatment: a "Filter Properties" trigger button, `id="sellerFilterPanel"` (the
existing bottom-sheet CSS in `responsive.css` was scoped to buyer.html's `#filterPanel`
specifically — extended to match either id), and `resetFilters`/`openFilterSheet`/
`closeFilterSheet` added to `seller-dashboard.js` mirroring `buyer-dashboard.js`.

---

### Seller dashboard's "Start Verification" button did nothing

**Front end**

`<button class="verify-btn">Start Verification</button>` in `seller.html` had no `onclick`, no
`href`, nothing — the nearby "Re-verify" buttons (shown once a seller is already verified but
expiring) are real `<a>` links to `verification.html?reverify=true`, but this one, for a seller who
was never verified at all, was never wired up. Now sends to `verification.html`.

---

### ID-photo camera capture could strand the shutter/"Use Photo" buttons off-screen on mobile

**Front end**

`camera-capture.css`'s mobile rule (`@media (max-width: 640px)`) set `.camera-viewport { flex: 1 }`
without resetting the base rule's `aspect-ratio: 4/3` — the two fighting over the viewport's height
inside a column flexbox could inflate it past what's visible, and neither `.camera-body` nor
`.camera-modal` had anything to scroll if that happened, so the capture button (and, after
pressing it, "Use Photo"/"Retake") could end up unreachable below the fold with only "Cancel"
staying visible. This is shared by both buyer and seller verification (`camera-capture.js`/`.css`
have no per-role branch) and by `seller-post.js`'s listing-photo capture, so all three got the fix:
`aspect-ratio: auto` on mobile, `min-height: 0` + `overflow-y: auto` on `.camera-body` as a
safety net.

---

### Removed emoji from verification toast messages

**Front end**

`buyer-verification.js` and `seller-verification.js` (identical in both) prefixed every toast —
photo captured, missing photo, submit error, submit success — with ✅/⚠️. Removed; `showToast()`
just renders the string as-is, so this was only ever the literal characters in each call site.

---

### A verified seller still saw "Verification Required" on the dashboard

**Front end**

This was a regression from this same day's earlier `.verify-banner` mobile-layout fix: that rule
set `display: grid !important` on `.verify-banner` at 640px to fix its layout, but `!important` in
a stylesheet always beats a plain inline `style="display:none"` regardless of which one looks like
it should win — so once the breakpoint applied, the banner showed for every seller, verified or
not, and `seller-dashboard.js`'s own `if (!isVerified) banner.style.display = 'flex'` line had no
matching `else` to ever hide it again. Replaced the inline-style toggle with a `.is-hidden` class
that the banner's `display` rules (flex on desktop, grid on mobile) can't fight with, since hidden
is now a separate concern from which display value "shown" uses.

Also, on request: the "✓ Verified" badge next to the page title no longer shows at all once a
seller is verified — pending/unverified sellers still get it (there's something to act on), and an
expiring-soon verified seller already has the separate expiry banner lower down, so the badge was
pure clutter in the one state that needs no action.

---

### Seller dashboard's "Messages: 5" stat was hardcoded and never updated

**Front end**

`seller.html` had `<div class="stat-value" id="statMessages">5</div>` — a literal `5` in the
markup that `seller-dashboard.js` never touched (it only ever set `statActive`/`statPending`), so
every seller saw the same fake count regardless of their actual unread messages. Removed the card
(stats row is now Active Listings / Pending Review only) and moved real unread-message counts to
where they're actually useful: a numbered badge on the bottom nav's Messages tab, driven by the
same `HS.messages.unreadCount()` the messages page itself uses. Wired into `components/sidebar.js`
so it's live on every page for both buyer and seller (the only two roles with a Messages tab), not
just the dashboard.

---

### Animated charts on admin Analytics / super-admin System Reports, animated sidebar, menu fixes

**Front end**

On request:

- **Chart load animations.** New shared `assets/css/chart-anim.css` + `assets/js/chart-anim.js`,
  loaded by `admin/analytics.html` and `super-admin/reports.html`: line charts draw in left to
  right, their area fades in, dots pop in one by one; bars grow up in sequence; donut segments sweep
  around in turn; stat cards and insight cards rise in staggered, and stat numbers count up. They
  replay whenever a chart's period is switched. All of it is turned off under
  `prefers-reduced-motion`.
- **Sidebar.** Labels now slide and fade in one after another when the rail expands, instead of
  popping in (they were `display: none`); menu items ease in on page load. The expanded width is
  228px (was 205) so "Listings Management" fits on one line while sliding.
- **Help & Support** is gone from the admin and superadmin profile menus — it's the buyer/seller
  support channel. (View Profile, Settings and Logout stay; both roles have real pages for them.)

Fixed along the way:

- The superadmin's **View Profile** / **Settings** led to a 404: the topbar used the role name as
  the folder (`module/superadmin/`), but the folder is `module/super-admin/`. Same for the bell's
  "view all notifications", which also used a bare filename — from the shared listing page that
  sent a seller to the *buyer's* notifications page.
- System Reports' **User Registrations** chart was invented numbers (3, 5, 6, 8… across Oct → Apr,
  months that hadn't happened yet), and its **Listing Status** Weekly/Daily views were too (8/3/1,
  2/1/0). Both now come from real accounts and listings, and the line chart has a numbered axis
  (it had none, and divided by zero for a period with no sign-ups).

Checked in a real browser (with stand-in data and a stand-in session, since the test admin
accounts don't exist on this database): no script errors, every animation attached, final frames
correct on both pages.

---

### "Featured Properties" redesigned as a row of listing cards

**Front end**

On request. The old carousel was one card in the middle with two faded neighbours, which with only
one or two listings meant a lone card with arrows a long way off and no detail beyond title and
price. It's now a row of proper listing cards (`index.js` `Carousel`, `.fp-*` in `index.css`,
replacing the unused `.crs-*` / `.crd-*` / `.dot` rules):

- 4:3 photo with a For Rent / For Sale / New badge and a Verified badge, price first, title
  (clamped to two lines), location, beds/baths (omitted when zero, e.g. land), and a footer that
  lines up across cards regardless of title length.
- Three across on desktop, two on tablets, one-and-a-peek on phones. Centred when they all fit;
  scroll-snapped (so it swipes) when they don't, with arrows that only appear then and disable at
  either end.
- The whole card opens the listing — signed-in buyers/sellers go straight there, everyone else
  signs in first and is returned to it (same rule as `browse.html`). A "Browse all properties"
  link sits under the row.
- The subtitle no longer says "hand-picked" — nothing picks them; they're approved listings.

Checked in a real browser at 1366px and 390px wide. Also fixed the type cards briefly showing a
fallback photo before swapping to the real listing photo — they now wait for the data.

---

### "Browse by Type": third card is now Lots & Land, and the section is actually on the page

**Front end**

On request, the landing page's third type card is now **Lots & Land** (`property_type = 'lot'`,
what the seller's post form calls "Lot Only") instead of the catch-all "Other Properties" — and
before that, the fake "Townhouses", a type the schema doesn't have. Like the carousel, the
`Categories` section existed but `App()` never rendered it; it now sits after the trust banner,
before Featured Properties. Each card now opens `browse.html?type=…`, which `browse.js` reads.

Sellers could already post "Lot Only" listings, but nothing let anyone filter to them: `browse.html`,
the buyer dashboard and the seller dashboard type filters now all have a "Lot Only" option.

Follow-up, on request: the cards are photos now instead of icons. Each shows the newest live
listing of its type that has a photo (`HS.listingCountsByType()` now returns `{ counts, photos }`
from the same query). A type with no listings falls back to `assets/img/types/<type>.jpg` — a folder
for hand-picked photos, empty for now — then, for houses, the existing `house_image.jpg`; with
nothing to show, the card's own teal gradient stays rather than a broken image.

---

### Landing page's "Featured Properties" section was never on the page

**Front end**

`index.js` has a complete `Carousel` component, already wired to real approved listings through
`HS.featuredListings()`, with styles in `index.css` — but `App()` never rendered it (no commit in
this repo ever did). It now sits after the trust banner.

Fixed two things in it on the way in: with fewer than 3 listings the left and right preview cards
showed the same listing (with 2, "previous" and "next" are the same one), so side previews only
appear from 3 listings up, and a lone center card is capped at 480px instead of stretching the full
row. And the location line was inserted as raw HTML even though it includes the seller-typed city,
so it now renders as plain text.

---

### Admin Payments Overview was entirely fake data

**Front end**

`admin-payments.js` was a mock from top to bottom: every transaction and deposit row ("Maria Santos",
"Ramon Cruz", …), the ₱1,248,000 / ₱624,000 / ₱32,500 stat values (typed in, not even summed from
the fake rows), and the "All Landlords" options in `payments.html`. Its deduction Approve/Reject
flow only ever edited that in-memory list — the real `security_deposits.deductions` column has no
approval step at all; the seller records a deduction directly.

Now read-only monitoring of the real tables: a new `HS.admin.payments()` (the existing "Admins read
all payments" policy) plus `HS.deposits.list()` (admins already read every deposit), with names
from `public_profiles`. Stats are summed from those rows; the recipient filter lists whoever
actually appears; status filters match the database's real states (Awaiting Payment, Awaiting
Seller, Confirmed, Rejected — there is no "Overdue"); deposits show their real status (Held, Partly
Refunded, Refunded, Forfeited) with a read-only deduction list in place of the fake review flow.
User-entered text (names, titles, references) is now HTML-escaped on this page.

The only payments on this database today are land-title verification fees — a seller paying
Kasafide, not a tenant paying a landlord — so the columns now read "Paid By" / "Paid To", and those
fees show Kasafide as the recipient instead of the seller paying themselves.

---

### Landing page map only ever pinned 6 of the 24 barangays

**Front end**

The hero map's property pins in `index.js` were hand-placed for just six barangays (Poblacion,
Guyong, Bagbaguin, Tumana, Catmon, Pulong Buhangin), so an approved listing anywhere else —
Silangan, here — never got a pin. Those six weren't reliable either: they were percentages of the
whole right-hand panel, while the map drawing is centred and scaled inside that panel, so they
slid off their barangay whenever the window's shape changed.

All 24 barangays now have a position, taken from the map file itself: each name label in
`Sta. Maria Map.svg` is a path, and its centre in the SVG's own 1575×1816 coordinates is what the
pin uses, converted to pixels from how the SVG is actually scaled and centred, and recomputed on
resize. Pins still only appear where the database has a live listing.

---

### Admin Analytics' hand-drawn charts looked amateurish

**Front end**

Both charts in `admin-analytics.js` are custom SVG, not a charting library, and had three stacked
problems:

- The demand bar chart used `<rect rx="6">` for every bar regardless of height — on a short bar
  (height comparable to its own radius) that rounds all four corners into a pill/capsule instead
  of a bar with a flat bottom sitting on the axis.
- Its labels were 6.5px text rotated -45°, which for the first bar pushed the rotated text far
  enough left that `.chart-card`'s `overflow: hidden` clipped it off entirely — the tallest bar in
  the screenshot had no visible label at all. At that size the surviving labels weren't very
  legible either.
- The search-trends line chart's axis ticks were `min + (max-min)*i/4` with no rounding beyond
  `Math.round()` — e.g. 93 / 136 / 179 / 221 / 264, numbers nobody would choose on purpose.

Fixed: bars now use a path that rounds only the top two corners (radius capped by the bar's own
width/height, so a short bar can't get a radius bigger than itself), with horizontal 10px labels
(ellipsis-truncated past 9 characters) instead of rotated 6.5px ones — wider bar pitch to fit them.
The line chart now computes a "nice" step (the standard d3-style round-to-1/2/2.5/5/10×a-power-of-
ten trick) so its axis reads round numbers instead of a raw quarter-split of the range.

Also, on request, nothing on the page is hardcoded anymore — most of it was:
- **High-Demand Areas** — weekly/daily were fixed arrays, and "monthly" was really all-time
  listings per barangay (supply, not demand). Now: viewing requests per barangay over the last
  30 / 7 / 1 day(s), via a new `HS.admin.viewingRequests()` (admins can already read every row).
  Shows an empty state instead of a blank grid when a period has none.
- **Search Trends** — entirely invented; nothing in the database records searches. Replaced with
  **New Accounts** (email-confirmed buyers/sellers per month / week / day, last 7 of each).
- **Key Insights** — "+5.2% from last month", "12 days" time-to-rent and "+13% faster" were
  literals. Average price now compares listings posted in the last 30 days to the 30 before;
  time-to-rent (no data records when a rental was taken) is replaced by viewing requests over the
  last 30 days with the same comparison; approval rate shows its actual "N of M approved".
- The Reported Listings stat card fell back to a literal `8` if reports didn't load.
- **Listings Per Barangay** counted every listing regardless of status but only had Approved and
  Pending columns, so rejected listings inflated the totals with no column explaining them — and
  the 5 rejected test listings on this database have no barangay at all, which rendered as a
  blank-named row. The table now counts only approved + pending listings (rows add up), and a
  missing barangay shows as "Not set". The average-price insight likewise uses approved listings
  only, instead of averaging rejected test listings into a "market" figure.

---

### Accounts that never confirmed their email showed up in the admin Users list

**Database + Front end**

`handle_new_user()` inserts a `profiles` row the instant an `auth.users` row appears — which, per
`src/app/api/auth/signup`'s own design, happens *before* the person has proved they own that email
(the account is created with `email_confirm: false` and stays unusable until the link is opened).
`profiles` had no record of that distinction at all, so an abandoned sign-up attempt (typed an
email, never opened the confirmation link, walked away — e.g. "Transfer Test" in the screenshot)
sat there forever, counted by every page built on `HS.admin.users()`: the Users list, both admin
and super-admin dashboards, analytics, reports.

`014_profile_email_confirmed.sql` adds `profiles.email_confirmed_at`, mirrored from the auth
server's own column — set at insert time, kept in sync afterward by a trigger on `auth.users`, and
backfilled for existing rows so this takes effect immediately. `HS.admin.users()` now excludes
anyone where it's still null, at the one shared source every one of those pages reads from.

**You need to:** run `supabase/migrations/014_profile_email_confirmed.sql` in the SQL Editor.

(Separately: the Users list sort — I checked, and `HS.admin.users()` already orders by
`created_at` descending, and nothing downstream re-sorts it, so newest-first was already correct.
The screenshot's dates do read newest-to-oldest; the unconfirmed-account clutter was likely what
made it look otherwise.)

---

### Desktop sidebar collapses to an icon rail, expands on hover

**Front end**

On request: `components/sidebar.js` (the one shared component every role's desktop layout uses)
now defaults to a 68px icon-only rail above 768px, widening to its original 205px — labels, logo
text, and the admin submenu all fade back in — on `:hover`, with no JS state involved, just a CSS
transition. Mobile is untouched — it already replaces this element with the bottom nav entirely
below 768px.

Follow-up, on request: the expanded sidebar now floats over the page instead of pushing it
sideways. `#hs-sidebar` is now just a fixed 68px slot in each page's `.layout` row, and everything
visible moved into a new `.hs-sidebar-panel` inside it, absolutely positioned — only the panel
widens on hover, so `.main` never moves. Still entirely inside `sidebar.js`; no page CSS changed.

---

### Re-verifying early silently suspended an account's still-valid verification

**Front end**

Both `buyer-verification.js` and `seller-verification.js` always rendered the full "Submit
Documents" form on `verification.html` whenever it was opened, with no check for whether
re-verification was actually due — a fully, comfortably verified account (300+ days left, say)
could submit new documents anyway. That's not just an unnecessary option: `HS.verification.submit()`
flips an already-verified account's `account_status` to `'reverification'` the moment it's called,
and `isVerified`/`verified` everywhere else is a plain `=== 'verified'` check — so submitting early
immediately read as *not verified*, suspending whatever that status actually gates (publishing
listings for a seller, messaging/saving listings for a buyer) while the unneeded new documents sat
in review, despite the real verification not having expired at all.

Both pages now only show the Submit Documents section when it's actually due: never verified, already
expired, or within 30 days of expiring (the same window `seller-settings.js` already used for its
own "Expiring Soon" banner) — otherwise a plain "You're all set" info card instead, no form to
submit. `HS.verification.submit()` itself now also refuses with a clear error if called against a
verified account that isn't within that window, so the rule holds regardless of how `submit()`
gets called, not just from this one UI. Also removed
`seller-settings.js`'s own premature "Re-verify" link, which only ever appeared in the exact state
(comfortably verified) where re-verifying wasn't due.

One caveat: that `submit()` check is enforced in the front end's data layer, not the database —
someone calling the Supabase client directly could still bypass it. A real guarantee would need a
trigger/check constraint on `profiles`, which is a bigger change than this pass covered.

---

### Seller Settings' verification expiry box floated beside the status card on mobile

**Front end**

`.verify-status-row` (Settings > Identity Verification) is `display:flex; justify-content:space-between` — the verified-status block (badge, paragraph, Re-verify button) on one side and the separate "Verification valid until ... days remaining" box on the other, side by side. The inner block already had a mobile fix (`.setting-row` stacks at 480px), but the outer row never did, so at phone width the expiry box got squeezed into a narrow column next to it — wrapping its sentence awkwardly and reading as a stray floating card rather than part of the same section. Stacked `.verify-status-row` too, full width, expiry box below.

---

### A seller viewing a listing got bounced to the wrong role's pages (or a 404) via Dashboard/nav/Back

**Front end**

`module/buyer/listing.html` is the one listing-detail page both roles use — a seller reaches it
from their own Marketplace/My Listings, not just buyers from Browse. But `components/sidebar.js`'s
nav routing (`NAV_ROUTES`/`BN_ROUTES`, desktop sidebar and bottom nav both) used bare filenames
like `'seller.html'`, which only resolve correctly when the current page already lives in that
role's own folder. From inside `module/buyer/`, a seller clicking "Dashboard" tried to load the
nonexistent `module/buyer/seller.html` (404); clicking "Messages" would have silently loaded
*buyer's* Messages page instead, which immediately bounces a seller session to sign-in (its own
auth guard rejects the wrong role). Every route is now `../<role-folder>/<file>` — `..` always
lands on `module/` regardless of which folder the current page is physically in, so it resolves
the same whether you're already in the right folder or on this one shared cross-role page.

Also fixed while in there: the bottom nav's `BN_ROUTES.seller` was missing a `tenants` entry at
all (desktop's `NAV_ROUTES` had it) — not a wrong destination, "My Tenants" in the bottom nav
simply had no click handler. And `seller-profile.js`'s own listing cards (module/seller/profile.html)
had the identical bare-filename bug pointing at a nonexistent `module/seller/listing.html`.

---

### Two buyers could both get approved for the same viewing slot

**Database + Front end**

Nothing stopped two buyers from requesting — or even both getting confirmed for — the exact same
property/date/time. `HS.viewing.request()` inserted unconditionally and the schedule-viewing modal
was just a plain date picker + a fixed list of time slots, with no awareness of what was already
taken. Decided (on request) that only a *confirmed* viewing blocks the slot — a pending or
counter-proposed request is just an ask the seller hasn't acted on, not a reservation.

`013_viewing_slot_locking.sql` adds:
- A partial unique index on `(property_id, requested_date, requested_time) WHERE status =
  'confirmed'` — the real guarantee, so even a race between two confirm actions can't double-book.
- A trigger that, the instant one request is confirmed, auto-declines every other pending request
  still sitting on that exact slot, mirroring a real decline into the loser's chat (same shape
  `HS.viewing.respond()` already produces) instead of leaving the seller to notice and decline it
  by hand later.
- `get_confirmed_viewing_slots(property_id)`, a `SECURITY DEFINER` RPC returning only confirmed
  date/times (nothing identifying) — needed because "Participants read viewing requests" (RLS)
  only lets a row's own buyer/seller see it, which would leave this invisible to the buyer who
  most needs it: one who hasn't requested this listing before.

`buyer-listing.js`'s schedule modal now fetches that listing's taken slots on open, greys out
(and labels "Already booked") matching time options as the buyer changes the date, and re-checks
fresh right before submitting in case a slot was confirmed by someone else in the meantime.

**You need to:** run `supabase/migrations/013_viewing_slot_locking.sql` in the SQL Editor.

---

### "My Tenants" now hides itself for sellers with no rental listings

**Front end**

A tenant can only ever exist against an approved "for rent" listing, so a seller who has only ever
listed for sale had an always-visible "My Tenants" tab (desktop sidebar and bottom nav both) that
could never show anything but an empty state. Added `HS.listings.hasApprovedRental()` (a `count`-
only query, not the full listing rows) to `data.js`, and `components/sidebar.js` now hides every
`[data-page="tenants"]` element — both navs use that same attribute — when it comes back empty.
Rendered present by default and hidden async rather than the other way around, so the tab doesn't
visibly flash in and then disappear on a page load that does have rentals.

---

### Removed the Seller Dashboard's Quick Actions card

**Front end**

On request: removed `.quick-card` ("Add New Listing" / "Manage Listings") from `seller.html`
entirely — `seller/listings.html` already has its own "Add New Listing" button and is itself what
"Manage Listings" linked to, so the card was pure duplication of the bottom nav's own "My Listings"
tab. Removed the matching dead CSS (`.quick-card`, `.quick-buttons`, `.qa-btn*`) and
`seller-dashboard.js`'s `handleAddListing()`/`addListingBtn` handling, which had no reader left
once the button was gone (`seller-listings.js` has its own independent copy of both, untouched).

---

## 2026-10-11

### One user interface, not two

**Backend**

The repo carried two front ends for overlapping work: the pages in `public/module/` and a second
React dashboard under `src/app/dashboard/`. Removed the React one.

It was never reachable — nothing in the site linked to `/dashboard` — it had **no super-admin
role at all** against seven such pages in `public/`, and only the pages in `public/` were wired
to the live database.

Gone with it:

- `src/app/auth/login/` and `src/app/auth/signup/` — the front end has its own at `public/auth/`
- `src/app/page.tsx` — a listings page `/` never reached, since `next.config.mjs` redirects `/`
  to `/index.html`
- `src/app/notes/` — a "Notes CRUD" tutorial scaffold
- `src/components/` — five components only those pages used
- `src/lib/auth.ts` and `src/lib/supabase/service.ts` — no importers left

`middleware.ts` was guarding `/dashboard` and the React login pages with a cookie session. With
those gone its only job is CORS for `/api/*`; it dropped from 85.5 kB to 26.7 kB. The front end
keeps its session in localStorage and sends a Bearer token, which each route verifies itself.

`/api/auth/callback` now returns to `public/auth/signin.html` instead of the deleted React page.
Nothing uses OAuth yet, but the code exchange is kept so enabling it later is a provider setting
rather than new work.

**Nothing in `public/` changed, and all 12 API routes still answer.** Git keeps the removed files
if any turns out to be wanted again.

### Email confirmation now comes from Kasafide

**Front end · Backend · Database**

Signing up was impossible. The Supabase auth server requires a confirmed email before anyone may
sign in, but it has no SMTP configured, so its own confirmation mail failed and every attempt died
with *"Error sending confirmation email"*. That is a setting on a server we do not control.

Kasafide sends the mail itself now:

- `POST /api/auth/signup` creates the account **unconfirmed** through the admin API — which sends
  nothing, so it cannot fail that way — stores a hashed token, and emails the link.
- `GET /api/auth/verify-email` confirms the account when that link is opened.
- `POST /api/auth/resend-verification` sends it again, with a 60-second cooldown.

The gate is still the auth server's own: an unconfirmed account is refused at sign-in by Supabase
with *"Email not confirmed"*, not by anything in our code, so it cannot be bypassed by talking to
the database directly.

`public/assets/js/auth.js` no longer calls `sb.auth.signUp()` — it posts to `/api/auth/signup`.

**You need to:**
1. Run `supabase/migrations/008_email_verification.sql` in the SQL Editor.
2. Put SMTP settings in `.env.local` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
   `SMTP_FROM`). Brevo is free and needs no domain. `.env.example` explains each one.
3. Restart the dev server — `.env.local` is only read at startup.

`npm run check-email` tests the settings on their own and names the one that is wrong, instead of
leaving you to guess from a failed sign-up.

### Fixed a crash that took whole pages down

**Front end**

`components/topbar.js` read `user.firstName[0] + user.lastName[0]`. That throws for any account
whose name is empty — which is every account created straight in Supabase rather than through the
sign-up form. The throw killed `KasafideTopbar.init()`, and with it **every line of the page script
after it**, so the page was left showing its leftover placeholder markup with no data loaded.

Eight call sites now go through `hsInitials()` in `session.js`, which falls back to the email and
then to `?`. `hsDisplayName()` does the same for names.

If a page ever looks like it "did not load", check the browser console first — one throw early in a
page script stops everything after it.

### Added the logout button

**Front end**

`sidebar.js` had styles for `.hs-logout-btn` but no button to apply them to, so the bottom of every
sidebar was a divider with empty space under it. Added it, wired to `hsSignOut()` so the Supabase
session is cleared too, not just the cached profile.

### Removed the simulated payment flows

**Front end**

Both messages pages carried a fake payment system — a payment sheet, a fake bank gateway screen,
and a `setTimeout` that announced *"Card payment successful"* and *"₱15,000 has been released to
your account"* with no money involved. Both were already unreachable. −968 lines.

Real payments go through `PaymentIntegration` → `/api/payments/*` → Xendit. Payment requests inside
chat are not wired yet and say so plainly rather than pretending.

### Frosted the public navigation

**Front end**

The top bar on the five public pages is frosted glass in both themes, and goes dark while it sits
over the dark hero so the page reads as one piece. New: `assets/css/glass-nav.css`,
`assets/js/glass-nav.js`.

Two things had to be fixed first: `policy.css` never painted `<body>`, so the canvas behind the bar
stayed the browser's default white and the bar looked like a grey slab at the top of the page; and
an `[data-theme="light"] nav` rule in `about.css` outranked the shared rule and kept the bar opaque
in light mode.

### Removed the testimonials section

**Front end**

Three invented reviews on the landing page. To be replaced when there are real users.

---

## 2026-10-11 (earlier)

### Payments, security deposits and the last of the sample data

**Front end · Backend · Database**

The last four pages came off sample data, and `assets/js/fake-data.js` was deleted along with the
three superseded dashboard scripts that used it. There is no sample data left anywhere in
`public/`.

- `007_payments_and_deposits.sql`: payment periods, methods, references and proofs; the
  `security_deposits` table with itemised damage deductions; `profiles.payment_methods`; a private
  `payment-proofs` bucket.
- `/api/payments/create-invoice` now takes a purpose and a period, and **computes the amount from
  the listing price on the server**. A client that could name its own price could pay ₱1 for a
  ₱15,000 month.
- New: `/api/payments/manual-proof` (GCash, bank, cash, with proof) and `/api/payments/confirm`
  (the seller accepts or rejects, and only the listing's landowner may).

Two payment-methods forms were saving the seller's GCash number into the browser session, so it
vanished on sign-out and no buyer ever saw it. They write to the profile now.

**You need to:** run `007_payments_and_deposits.sql`.

---

## How to add to this file

One entry per change that another person would have to know about. Say which half it touches, what
actually changed, and — the part that matters — whether anything has to be **run** after pulling: a
migration, a new setting in `.env.local`, a server restart.

Formatting and copy edits do not need an entry. Anything that changes behaviour does.
