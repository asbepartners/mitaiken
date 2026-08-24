"use client";

import { useEffect, useState } from "react";
import { DEFAULT_EXPERIENCE_TARGETS } from "@/data/experiences";
import { getSupabaseClient } from "@/lib/supabase";

export interface ExperienceTarget { id: string; title: string; memo?: string; relatedUrl?: string; }
export interface ExperienceTargetDraft { title: string; memo?: string; relatedUrl?: string; }
export type TargetsMap = Record<string, ExperienceTarget[]>;

const STORAGE_KEY = "mitaiken-zone:targets";
function newId() { return `target-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export function readStoredTargets(): TargetsMap {
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

async function ensureUserExperience(userId: string, slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data: existing } = await supabase.from("user_experiences").select("id").eq("user_id", userId).eq("source_template_slug", slug).maybeSingle();
  if (existing) return existing.id as string;
  const { data: template } = await supabase.from("templates").select("title, category_id, image_path").eq("slug", slug).single();
  if (!template) return null;
  const { data } = await supabase.from("user_experiences").upsert({ user_id: userId, source_template_slug: slug, title: template.title, category_id: template.category_id, image_path: template.image_path }, { onConflict: "user_id,source_template_slug" }).select("id").single();
  return data?.id as string | undefined ?? null;
}

async function saveTarget(userId: string, parentId: string, target: ExperienceTarget, sortOrder: number) {
  const supabase = getSupabaseClient();
  const userExperienceId = await ensureUserExperience(userId, parentId);
  if (!supabase || !userExperienceId) return;
  await supabase.from("user_experience_items").upsert({ id: target.id, user_experience_id: userExperienceId, title: target.title, memo: target.memo ?? null, related_url: target.relatedUrl ?? null, sort_order: sortOrder });
}

export async function ensureStoredTargetInDatabase(userId: string, parentId: string, targetId: string) {
  const targets = readStoredTargets()[parentId] ?? [];
  const index = targets.findIndex((target) => target.id === targetId);
  if (index >= 0) await saveTarget(userId, parentId, targets[index], index);
}

export function useExperienceTargets() {
  const [targetsMap, setTargetsMap] = useState<TargetsMap>({});
  const [userId, setUserId] = useState<string>();
  function write(next: TargetsMap) { setTargetsMap(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }

  useEffect(() => { const frame = window.requestAnimationFrame(() => setTargetsMap(readStoredTargets())); return () => window.cancelAnimationFrame(frame); }, []);
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    void (async () => {
      const local = readStoredTargets();
      for (const [parentId, targets] of Object.entries(local)) await Promise.all(targets.map((target, index) => saveTarget(userId, parentId, target, index)));
      const { data: parents } = await supabase.from("user_experiences").select("id, source_template_slug").eq("user_id", userId).not("source_template_slug", "is", null);
      const parentIds = (parents ?? []).map((parent) => parent.id);
      if (!parentIds.length) return;
      const { data: rows } = await supabase.from("user_experience_items").select("id, user_experience_id, title, memo, related_url, sort_order").in("user_experience_id", parentIds).order("sort_order", { ascending: true });
      if (!active || !rows) return;
      const slugById = new Map((parents ?? []).map((parent) => [parent.id, parent.source_template_slug as string]));
      const remote: TargetsMap = {};
      for (const row of rows) {
        const slug = slugById.get(row.user_experience_id);
        if (!slug) continue;
        remote[slug] = [...(remote[slug] ?? []), { id: row.id, title: row.title, memo: row.memo ?? undefined, relatedUrl: row.related_url ?? undefined }];
      }
      write({ ...local, ...remote });
    })();
    return () => { active = false; };
  }, [userId]);

  function initializeTargets(parentId: string) {
    const current = readStoredTargets();
    if (current[parentId]?.length) return;
    const targets = (DEFAULT_EXPERIENCE_TARGETS[parentId] ?? []).map((title) => ({ id: newId(), title }));
    write({ ...current, [parentId]: targets });
    if (userId) void Promise.all(targets.map((target, index) => saveTarget(userId, parentId, target, index)));
  }
  function addTarget(parentId: string, draft: ExperienceTargetDraft) {
    const title = draft.title.trim();
    if (!title) return false;
    const current = readStoredTargets(); const targets = current[parentId] ?? [];
    if (targets.some((target) => target.title.toLocaleLowerCase("ja") === title.toLocaleLowerCase("ja"))) return false;
    const target = { id: newId(), title, memo: draft.memo?.trim() || undefined, relatedUrl: draft.relatedUrl?.trim() || undefined };
    write({ ...current, [parentId]: [...targets, target] });
    if (userId) void saveTarget(userId, parentId, target, targets.length);
    return true;
  }
  function updateTarget(parentId: string, id: string, draft: ExperienceTargetDraft) {
    if (!draft.title.trim()) return false;
    const current = readStoredTargets();
    const targets = (current[parentId] ?? []).map((target) => target.id === id ? { ...target, title: draft.title.trim(), memo: draft.memo?.trim() || undefined, relatedUrl: draft.relatedUrl?.trim() || undefined } : target);
    write({ ...current, [parentId]: targets });
    const index = targets.findIndex((target) => target.id === id);
    if (userId && index >= 0) void saveTarget(userId, parentId, targets[index], index);
    return true;
  }
  function removeTarget(parentId: string, id: string) {
    const current = readStoredTargets(); write({ ...current, [parentId]: (current[parentId] ?? []).filter((target) => target.id !== id) });
    const supabase = getSupabaseClient(); if (userId && supabase) void supabase.from("user_experience_items").delete().eq("id", id);
  }
  function clearTargets(parentId: string) {
    const current = readStoredTargets(); const removedIds = (current[parentId] ?? []).map((target) => target.id); const next = { ...current }; delete next[parentId]; write(next);
    const supabase = getSupabaseClient(); if (userId && supabase && removedIds.length) void supabase.from("user_experience_items").delete().in("id", removedIds);
  }
  return { targetsMap, initializeTargets, addTarget, updateTarget, removeTarget, clearTargets };
}
