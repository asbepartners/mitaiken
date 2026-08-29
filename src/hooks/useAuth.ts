"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

type AuthMode = "signup" | "login";

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
    async (email: string, mode: AuthMode) => {
      if (!supabase) return { error: "Supabaseに接続できませんでした。" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: mode === "signup" },
      });
      return { error: error ? "確認コードを送信できませんでした。入力内容をご確認のうえ、再度お試しください。" : null };
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

  const getLegalAcceptanceStatus = useCallback(async () => {
    if (!supabase) {
      return {
        requiresAcceptance: false,
        reason: null as string | null,
        error: "Supabaseに接続できませんでした。",
      };
    }

    const { data, error } = await supabase.rpc("get_legal_acceptance_status");
    if (error) {
      return {
        requiresAcceptance: false,
        reason: null as string | null,
        error: "利用規約の同意状況を確認できませんでした。",
      };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      requiresAcceptance: Boolean(row?.requires_acceptance),
      reason: typeof row?.reason === "string" ? row.reason : null,
      error: null,
    };
  }, [supabase]);

  const recordCurrentLegalAcceptance = useCallback(async () => {
    if (!supabase) return { error: "Supabaseに接続できませんでした。" };

    const { error } = await supabase.rpc("record_current_legal_acceptance");
    return {
      error: error
        ? "同意内容を保存できませんでした。通信状況をご確認のうえ、もう一度お試しください。"
        : null,
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return { error: "Supabaseに接続できませんでした。" };
    const { error } = await supabase.auth.signOut();
    return { error: error ? "ログアウトできませんでした。" : null };
  }, [supabase]);

  return {
    user,
    loading,
    configured: Boolean(supabase),
    sendOtp,
    verifyOtp,
    getLegalAcceptanceStatus,
    recordCurrentLegalAcceptance,
    signOut,
  };
}
