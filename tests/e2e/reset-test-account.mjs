// One-off utility (not a Playwright test -- doesn't match *.spec.ts) to wipe
// the E2E test account's data back to a clean slate. Useful after a run left
// partial state behind (a test failed mid-flow, before its own cleanup ran),
// which then makes later runs' own cleanup assertions fail too ("item is
// still there") in a way no single test's afterEach can dig itself out of.
//
// Usage: node tests/e2e/reset-test-account.mjs
// (reads the same .env.local / .env.test.local as the Playwright suite)
import { createClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env.test.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // ok if one of them doesn't exist
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Copy .env.test.local.example to .env.test.local and fill it in.`);
  }
  return value;
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const E2E_TEST_EMAIL = requireEnv("E2E_TEST_EMAIL");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw usersError;
const user = usersPage.users.find((candidate) => candidate.email === E2E_TEST_EMAIL);
if (!user) {
  console.log(`No account found for ${E2E_TEST_EMAIL}; nothing to reset.`);
  process.exit(0);
}

const { data: experiences, error: experiencesError } = await admin
  .from("user_experiences")
  .select("id")
  .eq("user_id", user.id);
if (experiencesError) throw experiencesError;

const ids = (experiences ?? []).map((row) => row.id);
console.log(`Found ${ids.length} user_experiences row(s) for ${E2E_TEST_EMAIL}.`);

if (ids.length > 0) {
  const { error: logsError } = await admin.from("experience_logs").delete().in("user_experience_id", ids);
  if (logsError) throw logsError;

  const { error: itemsError } = await admin.from("user_experience_items").delete().in("user_experience_id", ids);
  if (itemsError) throw itemsError;

  const { error: deleteExpError } = await admin.from("user_experiences").delete().in("id", ids);
  if (deleteExpError) throw deleteExpError;
}

console.log(`Reset complete: cleared all wishlist/tried data for ${E2E_TEST_EMAIL}.`);
console.log("Remember to also clear that account's localStorage-only state by running the suite fresh (each spec gets a new browser context, so this alone is usually enough).");
