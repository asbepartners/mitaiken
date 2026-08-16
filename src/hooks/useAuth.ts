"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export function useAuth() {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const sendOtp = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Supabaseに接続できませんでした。" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      return { error: error ? "確認コードを送信できませんでした。少し待って再度お試しください。" : null };
    },
    [supabase]
  );

  const verifyOtp = useCallback(
    async (email: string, token: string) => {
      if (!supabase) return { error: "Supabaseに接続できませんでした。" };
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      return { error: error ? "確認コードが違うか、有効期限が切れています。" : null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return { error: "Supabaseに接続できませんでした。" };
    const { error } = await supabase.auth.signOut();
    return { error: error ? "ログアウトできませんでした。" : null };
  }, [supabase]);

  return { user, loading, configured: Boolean(supabase), sendOtp, verifyOtp, signOut };
}
