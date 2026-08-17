"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Timing, UNKNOWN_TIMING, isValidTiming } from "@/lib/timing";

export type StatusEntry =
  | { status: "wishlist" }
  | { status: "cleared"; timing: Timing; photoUrl?: string };

type StatusMap = Record<string, StatusEntry>;

const STORAGE_KEY = "mitaiken-zone:status";
const EMPTY_STATUS_MAP: StatusMap = {};

let cachedSnapshot: StatusMap | null = null;
const listeners = new Set<() => void>();

// v0.1のlocalStorageは { [id]: "wishlist" | "cleared" } という素の文字列形式だった。
// v1形式 { [id]: { status, timing? } } へ読み込み時に変換し、そのまま保存し直す。
function normalizeEntry(raw: unknown): StatusEntry | null {
  if (raw === "wishlist") return { status: "wishlist" };
  if (raw === "cleared") return { status: "cleared", timing: UNKNOWN_TIMING };

  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>;
    if (candidate.status === "wishlist") return { status: "wishlist" };
    if (candidate.status === "cleared") {
      const timing = isValidTiming(candidate.timing) ? candidate.timing : UNKNOWN_TIMING;
      const photoUrl = typeof candidate.photoUrl === "string" ? candidate.photoUrl : undefined;
      return { status: "cleared", timing, photoUrl };
    }
  }

  return null;
}

function readStorage(): StatusMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const next: StatusMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      const entry = normalizeEntry(value);
      if (entry) next[id] = entry;
    }
    return next;
  } catch {
    return {};
  }
}

function getSnapshot(): StatusMap {
  if (cachedSnapshot === null) {
    cachedSnapshot = readStorage();
  }
  return cachedSnapshot;
}

function getServerSnapshot(): StatusMap {
  return EMPTY_STATUS_MAP;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeStatusMap(next: StatusMap) {
  cachedSnapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorageが使えない環境では何もしない
  }
  listeners.forEach((listener) => listener());
}

export function useExperienceStatus() {
  const statusMap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleWishlist = useCallback((id: string) => {
    const current = getSnapshot();
    // すでに「やってみた」済みのものはハートで上書きしない（記録が消えるため）
    if (current[id]?.status === "cleared") return;

    const next = { ...current };
    if (next[id]?.status === "wishlist") {
      delete next[id];
    } else {
      next[id] = { status: "wishlist" };
    }
    writeStatusMap(next);
  }, []);

  const markTried = useCallback((id: string, timing: Timing) => {
    const next = { ...getSnapshot(), [id]: { status: "cleared" as const, timing } };
    writeStatusMap(next);
  }, []);

  const undoTried = useCallback((id: string) => {
    const current = getSnapshot();
    if (current[id]?.status !== "cleared") return;

    writeStatusMap({ ...current, [id]: { status: "wishlist" } });
  }, []);

  const removeStatus = useCallback((id: string) => {
    const next = { ...getSnapshot() };
    delete next[id];
    writeStatusMap(next);
  }, []);

  return { statusMap, toggleWishlist, markTried, undoTried, removeStatus };
}
