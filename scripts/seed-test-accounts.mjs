/**
 * Makes one buyer, one admin and one superadmin account for testing each role's dashboard.
 *   -> npm run seed-accounts
 *
 * Safe to re-run: if an account already exists by email, its role is just re-asserted.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]])
);

const GREEN = "\x1b[32m", RED = "\x1b[31m", OFF = "\x1b[0m";
const ok = (m) => console.log(`${GREEN}  OK${OFF}   ${m}`);
const bad = (m) => console.log(`${RED}  FAIL${OFF} ${m}`);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ACCOUNTS = [
  { email: "test.buyer@homesure.test",      password: "TestBuyer#2026",      role: "buyer",      full_name: "Maria Santos" },
  { email: "test.admin@homesure.test",      password: "TestAdmin#2026",      role: "admin",      full_name: "Ramon Cruz" },
  { email: "test.superadmin@homesure.test", password: "TestSuperAdmin#2026", role: "superadmin", full_name: "Lhenna Velasco" },
];

async function main() {
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });

  for (const acc of ACCOUNTS) {
    let userId = existing?.users?.find((u) => u.email === acc.email)?.id;

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name, phone_number: "09170000000" },
      });
      if (error || !data?.user) { bad(`${acc.email}: ${error?.message ?? "unknown error"}`); continue; }
      userId = data.user.id;
      ok(`created ${acc.role}: ${acc.email} / ${acc.password}`);
    } else {
      ok(`reusing existing ${acc.role}: ${acc.email} / ${acc.password}`);
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: acc.role, is_kyc_verified: true, account_status: "verified", full_name: acc.full_name })
      .eq("id", userId);
    if (profileError) bad(`  could not set role on ${acc.email}: ${profileError.message}`);
  }

  console.log("\nDone.");
}

main().catch((e) => { bad(e.message); process.exit(1); });
