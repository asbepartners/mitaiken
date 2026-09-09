import { createClient, type SupabaseClient } from "@supabase/supabase-js";

for (const file of [".env.local", ".env.test.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // .env.test.local doesn't exist until it's created from
    // .env.test.local.example; CI may inject these vars directly instead.
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.test.local.example to .env.test.local and fill it in.`
    );
  }
  return value;
}

export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
export const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
export const E2E_TEST_EMAIL = requireEnv("E2E_TEST_EMAIL");

// Mirrors the storage key @supabase/supabase-js derives automatically for the
// app's own client (see src/lib/supabase.ts), so a session injected into
// localStorage during global setup is picked up exactly like a real login.
export const SUPABASE_AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

export function createAdminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
