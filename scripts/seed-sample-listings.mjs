/**
 * Puts a seller and a handful of approved listings into an otherwise-empty database, so the
 * landing page, map pins and browse page have something real to show.  ->  npm run seed
 *
 * Safe to re-run: it looks for the seed seller by email first, and skips creating the listings
 * again if that seller already has any.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.local");

const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", DIM = "\x1b[2m", OFF = "\x1b[0m";
const ok = (m) => console.log(`${GREEN}  OK${OFF}   ${m}`);
const bad = (m) => console.log(`${RED}  FAIL${OFF} ${m}`);
const note = (m) => console.log(`${DIM}       ${m}${OFF}`);

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...loadEnv(ENV_FILE), ...process.env };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  bad("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const SEED_EMAIL = "seed.seller@homesure.test";
const SEED_PASSWORD = "SeedSeller#2026";

const BARANGAYS = ["Poblacion", "Santa Clara", "Bulac", "San Jose Patag", "Camangyanan", "Guyong"];

const LISTINGS = [
  {
    title: "2-Bedroom Bungalow near Poblacion Market",
    description: "Cozy single-storey home a short walk from the public market and town plaza. Freshly repainted, tiled throughout, with a small front yard.",
    barangay: "Poblacion",
    price: 2_850_000,
    listing_type: "sale",
    property_type: "house",
    bedrooms: 2, bathrooms: 1, floor_area_sqm: 65, lot_area_sqm: 90,
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
  },
  {
    title: "Modern 3BR House and Lot, Santa Clara",
    description: "Two-storey house in a quiet subdivision, built 2022. Attached garage, covered porch, ready for move-in.",
    barangay: "Santa Clara",
    price: 4_950_000,
    listing_type: "sale",
    property_type: "house",
    bedrooms: 3, bathrooms: 2, floor_area_sqm: 110, lot_area_sqm: 120,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  },
  {
    title: "Studio Apartment for Rent, Bulac",
    description: "Compact studio unit close to the highway, good for a single tenant or student. Water and basic furnishing included.",
    barangay: "Bulac",
    price: 6_500,
    listing_type: "rent",
    property_type: "apartment",
    bedrooms: 1, bathrooms: 1, floor_area_sqm: 24, lot_area_sqm: null,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  },
  {
    title: "Residential Lot, San Jose Patag",
    description: "Flat, titled lot in a developing area, no flooding history. Ready for construction, electricity and water lines nearby.",
    barangay: "San Jose Patag",
    price: 1_600_000,
    listing_type: "sale",
    property_type: "lot",
    bedrooms: null, bathrooms: null, floor_area_sqm: null, lot_area_sqm: 200,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
  },
  {
    title: "2BR Townhouse for Rent, Camangyanan",
    description: "End-unit townhouse, two bedrooms upstairs, small yard, walking distance to the elementary school.",
    barangay: "Camangyanan",
    price: 12_000,
    listing_type: "rent",
    property_type: "house",
    bedrooms: 2, bathrooms: 1, floor_area_sqm: 70, lot_area_sqm: 60,
    image: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200&q=80",
  },
  {
    title: "Commercial Space along the Main Road, Guyong",
    description: "Ground-floor commercial unit with high foot traffic, previously a sari-sari store. Good for retail or a small eatery.",
    barangay: "Guyong",
    price: 15_000,
    listing_type: "rent",
    property_type: "commercial",
    bedrooms: null, bathrooms: 1, floor_area_sqm: 45, lot_area_sqm: null,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
  },
];

async function main() {
  console.log("Seeding a sample seller and listings...\n");

  // ── 1. the seller account ──────────────────────────────────────────────────
  let sellerId;
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const already = existingUsers?.users?.find((u) => u.email === SEED_EMAIL);

  if (already) {
    sellerId = already.id;
    ok(`reusing existing seed seller (${SEED_EMAIL})`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Jericho Santos", phone_number: "09171234567" },
    });
    if (error || !data?.user) {
      bad(`could not create the seed seller: ${error?.message ?? "unknown error"}`);
      process.exit(1);
    }
    sellerId = data.user.id;
    ok(`created seed seller ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "seller", is_kyc_verified: true, account_status: "verified", full_name: "Jericho Santos", phone: "09171234567" })
    .eq("id", sellerId);
  if (profileError) { bad(`could not mark the profile as a verified seller: ${profileError.message}`); process.exit(1); }
  ok("profile set to role=seller, verified");

  // ── 2. skip if this seller already has listings ─────────────────────────────
  const { count: existingCount } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("landowner_id", sellerId);
  if (existingCount && existingCount > 0) {
    note(`seed seller already has ${existingCount} listing(s) — leaving them as they are`);
    console.log("\nNothing more to do. Re-run after deleting those rows if you want a clean reseed.");
    return;
  }

  // ── 3. look up the real barangay ids ─────────────────────────────────────────
  const { data: brgyRows, error: brgyError } = await admin
    .from("barangays")
    .select("id, name")
    .in("name", BARANGAYS);
  if (brgyError) { bad(`could not read barangays: ${brgyError.message}`); process.exit(1); }
  const brgyId = Object.fromEntries((brgyRows ?? []).map((b) => [b.name, b.id]));
  const missing = BARANGAYS.filter((n) => !brgyId[n]);
  if (missing.length) {
    bad(`these barangays are not in the table yet: ${missing.join(", ")}. Run migration 010 first.`);
    process.exit(1);
  }
  ok("found all barangays this seed needs");

  // ── 4. the listings ───────────────────────────────────────────────────────
  const rows = LISTINGS.map((l, i) => ({
    landowner_id: sellerId,
    title: l.title,
    description: l.description,
    price: l.price,
    listing_type: l.listing_type,
    property_type: l.property_type,
    status: "approved",
    price_negotiable: true,
    address: `${l.barangay}, Santa Maria, Bulacan`,
    barangay_id: brgyId[l.barangay],
    city: "Santa Maria",
    province: "Bulacan",
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    floor_area_sqm: l.floor_area_sqm,
    lot_area_sqm: l.lot_area_sqm,
    images: [l.image],
    thumbnail_url: l.image,
    title_type: "TCT",
    title_number: `T-${100000 + i}`,
    registry_of_deeds: "Registry of Deeds for Bulacan",
    tax_declaration_number: `TD-${2024000 + i}`,
    verification_state: "verified",
    approved_at: new Date().toISOString(),
  }));

  const { error: insertError } = await admin.from("properties").insert(rows);
  if (insertError) { bad(`could not insert listings: ${insertError.message}`); process.exit(1); }
  ok(`inserted ${rows.length} approved listings across ${BARANGAYS.length} barangays`);

  console.log(`\nDone. Sign in as ${SEED_EMAIL} / ${SEED_PASSWORD} to see them from the seller side,`);
  console.log("or just open browse.html — they're public and approved already.");
}

main().catch((e) => { bad(e.message); process.exit(1); });
