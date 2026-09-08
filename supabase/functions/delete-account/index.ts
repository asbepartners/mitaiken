// Deno runtime (Supabase Edge Functions), not part of the Next.js TypeScript
// project -- see tsconfig.json / eslint.config.mjs excludes.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "認証情報がありません。" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Identify the caller from their own token -- never trust a client-supplied id.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "本人確認に失敗しました。" }, 401);
    const userId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Record the deletion before removing the account, so a disaster-recovery
    // restore from an older backup can be cross-checked against this log and
    // the account re-deleted (see docs/privacy-data-inventory.md). Deliberately
    // stores only the id and timestamp -- no email, no personal data.
    const { error: logError } = await adminClient.from("deleted_accounts").insert({ user_id: userId });
    if (logError) {
      console.error("Failed to record deleted_accounts entry:", logError);
      return jsonResponse({ error: "削除処理を開始できませんでした。もう一度お試しください。" }, 500);
    }

    // Hard delete (shouldSoftDelete: false) so the email can be reused
    // immediately by a new, unrelated account. Cascades through profiles ->
    // user_experiences -> experience_logs etc. via existing FK constraints.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId, false);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return jsonResponse({ error: "アカウントを削除できませんでした。もう一度お試しください。" }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error("Unexpected error in delete-account:", error);
    return jsonResponse({ error: "予期しないエラーが発生しました。" }, 500);
  }
});
