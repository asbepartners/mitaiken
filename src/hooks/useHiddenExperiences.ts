"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mitaiken-zone:hidden-experiences";
const EMPTY_IDS: string[] = [];

let cachedSnapshot: string[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => typeof item === "string"))];
  } catch {
    return [];
  }
}

function getSnapshot(): string[] {
  if (cachedSnapshot === null) cachedSnapshot = readStorage();
  return cachedSnapshot;
}

function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeIds(ids: string[]) {
  cachedSnapshot = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorageが使えない環境では何もしない
  }
  listeners.forEach((listener) => listener());
}

export function useHiddenExperiences() {
  const hiddenIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const hideExperience = useCallback((id: string) => {
    const current = getSnapshot();
    if (current.includes(id)) return;
    writeIds([...current, id]);
  }, []);

  const restoreExperience = useCallback((id: string) => {
    writeIds(getSnapshot().filter((currentId) => currentId !== id));
  }, []);

  return { hiddenIds, hideExperience, restoreExperience };
}
