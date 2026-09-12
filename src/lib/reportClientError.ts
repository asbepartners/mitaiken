import { getSupabaseClient } from "@/lib/supabase";

// Fire-and-forget: inserts into client_error_log, which pushes a
// notification to the operator's phone via the ntfy trigger on that table
// (see supabase/migrations/035_client_error_log.sql). Never throws -- a
// broken error reporter must not compound the error it's trying to report.
export function reportClientError(error: Error & { digest?: string }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase
      .from("client_error_log")
      .insert({
        message: error.message.slice(0, 2000),
        digest: error.digest ?? null,
        stack: error.stack?.slice(0, 4000) ?? null,
        url: typeof window !== "undefined" ? window.location.href : null,
      })
      .then(undefined, () => {});
  } catch {
    // ignore
  }
}
