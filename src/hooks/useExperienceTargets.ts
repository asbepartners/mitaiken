"use client";

import { useEffect, useState } from "react";
import { DEFAULT_EXPERIENCE_TARGETS } from "@/data/experiences";

export type TargetsMap = Record<string, string[]>;
const STORAGE_KEY = "mitaiken-zone:targets";

function readTargets(): TargetsMap {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

export function useExperienceTargets() {
  const [targetsMap, setTargetsMap] = useState<TargetsMap>({});
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setTargetsMap(readTargets()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function write(next: TargetsMap) {
    setTargetsMap(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function initializeTargets(parentId: string) {
    const current = readTargets();
    if (current[parentId]?.length) return;
    write({ ...current, [parentId]: [...(DEFAULT_EXPERIENCE_TARGETS[parentId] ?? [])] });
  }

  function addTarget(parentId: string, name: string) {
    const value = name.trim();
    if (!value) return false;
    const current = readTargets();
    const targets = current[parentId] ?? [];
    if (targets.some((target) => target.toLocaleLowerCase("ja") === value.toLocaleLowerCase("ja"))) return false;
    write({ ...current, [parentId]: [...targets, value] });
    return true;
  }

  function clearTargets(parentId: string) {
    const current = readTargets();
    const next = { ...current };
    delete next[parentId];
    write(next);
  }

  return { targetsMap, initializeTargets, addTarget, clearTargets };
}
