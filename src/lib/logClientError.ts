import { getSupabaseClient } from "@/lib/supabase";

export function logClientError(error: Error & { digest?: string }) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  void supabase.from("client_error_log").insert({
    message: error.message,
    digest: error.digest ?? null,
    path: typeof window !== "undefined" ? window.location.pathname : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
}
