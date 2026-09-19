import { getSupabaseClient } from "@/lib/supabase";

export function logClientError(error: Error & { digest?: string }) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  void (async () => {
    // Same convention as ContactPage's contact_messages insert: attach the
    // logged-in user's id (if any) so a later /contact report about this
    // error can be cross-checked against the exact technical record here,
    // instead of relying on the user's own description and a rough
    // timestamp match.
    const { data } = await supabase.auth.getSession();

    await supabase.from("client_error_log").insert({
      user_id: data.session?.user.id ?? null,
      message: error.message,
      digest: error.digest ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  })();
}
