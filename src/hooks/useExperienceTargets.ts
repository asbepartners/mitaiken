"use client";
import { useEffect, useState } from "react";
import { DEFAULT_EXPERIENCE_TARGETS } from "@/data/experiences";

export interface ExperienceTarget { id: string; title: string; memo?: string; relatedUrl?: string; }
export interface ExperienceTargetDraft { title: string; memo?: string; relatedUrl?: string; }
export type TargetsMap = Record<string, ExperienceTarget[]>;
const STORAGE_KEY = "mitaiken-zone:targets";
function newId() { return `target-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

function readTargets(): TargetsMap {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).map(([parentId, raw]) => [parentId, Array.isArray(raw) ? raw.flatMap((item): ExperienceTarget[] => {
      if (typeof item === "string") return [{ id: newId(), title: item }];
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      if (typeof value.title !== "string") return [];
      return [{ id: typeof value.id === "string" ? value.id : newId(), title: value.title, memo: typeof value.memo === "string" ? value.memo : undefined, relatedUrl: typeof value.relatedUrl === "string" ? value.relatedUrl : undefined }];
    }) : []]));
  } catch { return {}; }
}

export function useExperienceTargets() {
  const [targetsMap, setTargetsMap] = useState<TargetsMap>({});
  useEffect(() => { const frame = window.requestAnimationFrame(() => setTargetsMap(readTargets())); return () => window.cancelAnimationFrame(frame); }, []);
  function write(next: TargetsMap) { setTargetsMap(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function initializeTargets(parentId: string) { const current = readTargets(); if (current[parentId]?.length) return; write({ ...current, [parentId]: (DEFAULT_EXPERIENCE_TARGETS[parentId] ?? []).map((title) => ({ id: newId(), title })) }); }
  function addTarget(parentId: string, draft: ExperienceTargetDraft) { const title = draft.title.trim(); if (!title) return false; const current = readTargets(); const targets = current[parentId] ?? []; if (targets.some((target) => target.title.toLocaleLowerCase("ja") === title.toLocaleLowerCase("ja"))) return false; write({ ...current, [parentId]: [...targets, { id: newId(), title, memo: draft.memo?.trim() || undefined, relatedUrl: draft.relatedUrl?.trim() || undefined }] }); return true; }
  function updateTarget(parentId: string, id: string, draft: ExperienceTargetDraft) { if (!draft.title.trim()) return false; const current = readTargets(); write({ ...current, [parentId]: (current[parentId] ?? []).map((target) => target.id === id ? { ...target, title: draft.title.trim(), memo: draft.memo?.trim() || undefined, relatedUrl: draft.relatedUrl?.trim() || undefined } : target) }); return true; }
  function removeTarget(parentId: string, id: string) { const current = readTargets(); write({ ...current, [parentId]: (current[parentId] ?? []).filter((target) => target.id !== id) }); }
  function clearTargets(parentId: string) { const current = readTargets(); const next = { ...current }; delete next[parentId]; write(next); }
  return { targetsMap, initializeTargets, addTarget, updateTarget, removeTarget, clearTargets };
}
