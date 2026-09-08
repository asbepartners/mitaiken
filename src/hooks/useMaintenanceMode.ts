"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function useMaintenanceMode() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;

    function refresh() {
      void supabase!
        .from("app_settings")
        .select("maintenance_enabled, maintenance_message")
        .eq("id", true)
        .maybeSingle()
        .then(({ data }) => {
          if (!active || !data) return;
          setEnabled(Boolean(data.maintenance_enabled));
          setMessage(data.maintenance_message ?? null);
        });
    }

    refresh();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { enabled, message };
}
