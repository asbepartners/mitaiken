import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Shared by every spec (and globalSetup) that issues a real OTP/magiclink
// token for E2E_TEST_EMAIL -- via the app's own signInWithOtp (a UI
// "確認コードを送る" click) or via the Supabase admin API's generateLink().
// Both count as a token issuance against Supabase's per-user OTP cooldown
// (~60s), even generateLink(), which never actually sends mail (see
// globalSetup's own comment for why). Whichever of these ran most recently,
// anywhere in the suite, is what the *next* signInWithOtp call has to wait
// out -- so every issuance updates this same marker file, and every caller
// about to send a new OTP reads it first. Without this, two OTP round-trip
// specs running back to back would each only know about globalSetup's own
// issuance, not each other's, and the second one's signInWithOtp would get
// silently 429'd.
const AUTH_DIR = path.join(__dirname, "..", "..", "playwright", ".auth");
const OTP_COOLDOWN_MARKER_PATH = path.join(AUTH_DIR, "otp-issued-at.json");
const OTP_COOLDOWN_MS = 65_000;

export async function recordOtpIssuance() {
  await mkdir(AUTH_DIR, { recursive: true });
  await writeFile(OTP_COOLDOWN_MARKER_PATH, JSON.stringify({ issuedAtMs: Date.now() }));
}

export async function waitOutOtpCooldown() {
  try {
    const raw = await readFile(OTP_COOLDOWN_MARKER_PATH, "utf-8");
    const { issuedAtMs } = JSON.parse(raw) as { issuedAtMs: number };
    const remaining = OTP_COOLDOWN_MS - (Date.now() - issuedAtMs);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  } catch {
    // marker missing (e.g. globalSetup didn't run) -- nothing to wait for
  }
}
