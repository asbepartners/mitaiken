import type { Session } from "@supabase/supabase-js";

const FRESH_SIGNUP_WINDOW_MS = 60_000;

// Email-OTP sign-in silently creates the account when the address is new
// (shouldCreateUser: true), so there is no separate "sign up" event to
// listen for. A brand-new user's created_at and last_sign_in_at land within
// moments of each other; a returning user's created_at is from the past.
export function isFreshSignUp(session: Pick<Session, "user"> | null | undefined): boolean {
  const user = session?.user;
  if (!user?.last_sign_in_at) return false;
  const created = new Date(user.created_at).getTime();
  const signedIn = new Date(user.last_sign_in_at).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(signedIn)) return false;
  return Math.abs(signedIn - created) < FRESH_SIGNUP_WINDOW_MS;
}
