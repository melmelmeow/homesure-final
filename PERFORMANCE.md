# Performance review

Eleven common optimisations, checked against what Kasafide actually does today. Each one says what
it is for, whether this project needs it, and what the change would be.

Nothing here was assumed — every claim was measured against the code in this repo on 2026-10-12.

**Summary:** four are worth doing, three are already done, four do not apply.

| | Verdict |
|---|---|
| Index the database | **Do it** — one real gap |
| Debounce input handlers | **Do it** — 22 handlers, none debounced |
| Compress images | **Do it** — 1.4 MB of assets, uploads uncapped |
| Compress API payloads | **Do it** — the public listing query has no limit |
| Add lazy loading | Partly done — 7 of 33 images |
| Add loading skeleton | Optional — text placeholders work today |
| Cache API responses | Already done where it matters |
| Add a CDN | Already in use |
| Split code into chunks | Does not apply — already one file per page |
| Add a load balancer | Does not apply — one server, campus-scale traffic |
| Data handling for revisions | Already done for the parts that need it |

---

## Worth doing

### 1. Index the database

**What it is for.** An index is a lookup table the database keeps so it can find rows without
reading every row. Without one, a query over 10,000 profiles reads all 10,000.

**Where we stand.** 22 indexes exist across the migrations:

| Table | Indexes |
|---|---|
| payments | 6 |
| properties | 4 |
| viewing_requests | 3 |
| messages | 2 |
| security_deposits | 2 |
| saved_properties | 1 |
| **profiles** | **0** |

`profiles` has none, and two API routes look up `profiles` by email on every sign-up and every
resend:

```
src/app/api/auth/signup/route.ts:71          .eq("email", email)
src/app/api/auth/resend-verification/route.ts:37   .eq("email", email)
```

**Needed:** yes. One index, and it should be unique — two accounts with the same email is a bug
waiting to happen, and the index enforces it as well as speeding it up.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(lower(email));
```

Lowercased because the sign-up route already lowercases the address before storing it, so
`Juan@gmail.com` and `juan@gmail.com` must not become two accounts.

---

### 2. Debounce input handlers

**What it is for.** A search box fires on every keystroke. Without debouncing, typing "apartment"
runs the filter nine times and redraws the list nine times. Debouncing waits until typing pauses.

**Where we stand.** 22 input handlers across the pages. **None debounced.** Every search box on
every page re-filters and re-renders on each character.

It is not noticeable with ten listings. With several hundred it is, because each keystroke rebuilds
every card's HTML.

**Needed:** yes. One small helper in `session.js`, then wrap each handler:

```js
function hsDebounce(fn, wait = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

Cheap to add and nothing else changes.

---

### 3. Compress images

**What it is for.** Smaller files download faster, which matters most on mobile data.

**Where we stand.** `public/assets/img/` is **1,417 KB**:

| File | Size |
|---|---|
| house_image.jpg | 179 KB |
| Sta. Maria Map.svg | 146 KB |
| CatsTone Logo.png | 144 KB |
| Team photos (5) | ~110–135 KB each |

(Update, Kasafide rebrand: `House Icon.svg`, 196 KB, was the old logo and has been deleted; the map pins now draw a 300-byte inline icon.)

A 196 KB SVG is unusual — an SVG that large almost always has a raster image embedded in it, which
defeats the point of the format.

The team photos only load on `about.html`, so they cost one page rather than the whole site.

**The bigger issue is uploads, not these files.** `camera-capture.js:171` captures at:

```js
canvasElement.toDataURL('image/jpeg', 0.9);
```

Quality 0.9 with **no resize**. A phone camera photo goes in at full sensor resolution — commonly
3–8 MB per listing photo. Every buyer browsing then downloads those.

**Needed:** yes, and the upload path matters more than the static files. Resize to a maximum of
about 1600px on the long edge and drop quality to 0.8 before upload. A listing photo does not need
to be larger than the screen showing it.

---

### 4. Compress API payloads

**What it is for.** Asking for less data over the wire.

**Where we stand.** Two issues, both in `data.js`.

**The public listing query has no limit:**

```js
async approved() {
  const rows = unwrap(await sb.from('properties')
    .select('*, barangays(name)')      // every column
    .eq('status', 'approved')          // no .limit(), no .range()
    .order('created_at', { ascending: false }));
}
```

`browse.html` calls this and receives **every approved listing in the database**, with every
column — including the `images` and `amenities` jsonb arrays. With 20 listings that is fine. With
2,000 it is megabytes on every page load, and the browser then filters them in memory.

**`select('*')` appears 14 times.** A card in a list needs a title, price, thumbnail and barangay.
It does not need the full description, the amenities array or every image URL.

**Needed:** yes, and this is the one that scales worst. Two changes:

- a `.range()` on `approved()` with paging, or at minimum a `.limit()`
- a narrower `select()` for list views, keeping `select('*')` for the detail page

Gzip on the responses is handled by the host and needs nothing from us.

---

## Already done

### 5. Cache API responses

`data.js` already caches the barangay lookup, which is the one piece of reference data that never
changes during a session:

```js
let barangayCache = null;   // fetched once, reused
```

Listings, payments and messages are deliberately **not** cached: a seller who confirms a payment
has to see it immediately, and a buyer must not see a listing that was taken down ten seconds ago.
Caching those would trade correctness for speed we do not need.

**Needed:** no further work.

### 6. Add a CDN

Already in use for the libraries:

| Source | Used |
|---|---|
| cdn.jsdelivr.net | 49× (supabase-js) |
| unpkg.com | 2× (React, MapLibre) |
| fonts.googleapis.com | every page |

For the project's own files, a CDN comes with the host — Vercel serves `public/` from its edge
network with no configuration. **Needed:** no.

### 7. Data handling for revisions

Three mechanisms already exist:

| What | Where |
|---|---|
| Who did what, when | `audit_logs` — super admins read it on the Audit Trail page |
| Verification history | `land_titles`, `lra_audit_logs` |
| Payment decisions | `payments.confirmed_at`, `confirmed_by`, `rejection_reason` |

Listing edits are **not** versioned — editing a listing overwrites the previous values. That is a
deliberate limit, not an oversight: a seller correcting a typo does not need a revision trail, and
moderation already records approvals in `audit_logs`.

**Needed:** only if the panel asks to see an edit history for listings, which would be a new table.

---

## Partly done

### 8. Add lazy loading

**What it is for.** `loading="lazy"` tells the browser not to download an image until it is about
to come on screen.

**Where we stand.** **7 of 33** `<img>` tags have it.

**Needed:** worth finishing, particularly on `browse.html`, where every listing card has a photo
and most are below the fold. It is one attribute per tag with no other change.

While doing this, two pages still pull avatars from an external placeholder service:

```
module/buyer/reviews.html    3× i.pravatar.cc
module/seller/reviews.html   4× i.pravatar.cc
```

Those are leftover sample images. They are an outside request on every page load, and they show
strangers' faces next to real reviews.

### 9. Add a loading skeleton

**What it is for.** A grey outline of the content while it loads, instead of a blank space. It does
not make anything faster; it makes waiting feel shorter.

**Where we stand.** Pages show a text placeholder today — `Loading…` or `Could not load…`. There is
a skeleton demo in `public/demo/skeleton-demo.html` but no shared component.

**Needed:** optional. Worth it for `browse.html` and the dashboards, where a visible grid of card
outlines reads better than one line of text. Everything already handles the loading and error
states correctly, so this is presentation only.

---

## Does not apply

### 10. Split code into chunks

**What it is for.** A bundler combines an application into one large JavaScript file; code
splitting breaks it back up so a page downloads only what it uses.

**Where we stand.** There is no bundle to split. The front end is plain HTML with **one script per
page** — `browse.html` loads `browse.js` and nothing else. That is already the end state code
splitting aims at.

The Next.js side holds only API routes now. Its build reports:

```
First Load JS shared by all    0 B
```

Zero client JavaScript, because no React page is served.

**Needed:** no. There is nothing to split.

### 11. Add a load balancer

**What it is for.** Spreading traffic across several servers so no one of them is overwhelmed, and
so the site survives one of them failing.

**Where we stand.** One Next.js process, serving a marketplace for one municipality. Expected
traffic is a classroom and a panel.

A load balancer is for the problem of **too many users at once**. We do not have that problem, and
adding one would mean running several servers, keeping them in step, and putting something in front
to distribute requests — real cost and real complexity against a bottleneck that does not exist.

**Needed:** no. If Kasafide ever grows into needing it, the host provides it: Vercel scales
automatically, and Supabase has connection pooling built in.

---

## If you only do four

In order of how much they matter:

1. **Limit the public listing query** — the only one that gets worse as the project succeeds
2. **Resize photos before upload** — a 6 MB photo costs every visitor who browses
3. **Index `profiles(email)`** — one line, and it prevents duplicate accounts as well
4. **Debounce the search boxes** — one helper, then one line per search box

The first two are the ones a panel would notice in a demo with real data.
