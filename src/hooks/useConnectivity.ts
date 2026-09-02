"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

async function canReachServer(timeoutMs = 3000) {
  if (!window.navigator.onLine) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return true;

  return Promise.race([
    (async () => {
      const { error } = await supabase.from("categories").select("id", { head: true }).limit(1);
      return !error;
    })(),
    new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), timeoutMs)),
  ]);
}

export function useConnectivity() {
  const [state, setState] = useState({ ready: false, online: true, offlineAtStartup: false });

  useEffect(() => {
    let active = true;
    void canReachServer().then((online) => {
      if (active) setState({ ready: true, online, offlineAtStartup: !online });
    });

    function handleOffline() {
      setState((current) => ({ ...current, online: false }));
    }
    function handleOnline() {
      void canReachServer().then((online) => {
        if (active) setState((current) => ({ ...current, online }));
      });
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return state;
}
