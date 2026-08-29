"use client";

import { useEffect } from "react";
import type { Tab } from "@/components/BottomNav";

export function InitialTabSync({ onChange }: { onChange: (tab: Tab) => void }) {
  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "mypage") {
      onChange("mypage");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [onChange]);

  return null;
}
