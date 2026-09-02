"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_EXPERIENCE_TARGETS } from "@/data/experiences";
import { getSupabaseClient } from "@/lib/supabase";

export interface ExperienceTarget { id: string; title: string; memo?: string; relatedUrl?: string; sourceTemplateItemId?: string; }
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
      return [{ id: typeof value.id === "string" ? value.id : newId(), title: value.title, memo: typeof value.memo === "string" ? value.memo : undefined, relatedUrl: typeof value.relatedUrl === "string" ? value.relatedUrl : undefined, sourceTemplateItemId: typeof value.sourceTemplateItemId === "string" ? value.sourceTemplateItemId : undefined }];
    }) : []]));
  } catch { return {}; }
}

async function ensureUserExperience(userId: string, slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const lookup = supabase.from("user_experiences").select("id").eq("user_id", userId);
  const { data: existing } = slug.startsWith("custom-") ? await lookup.eq("client_key", slug).maybeSingle() : await lookup.eq("source_template_slug", slug).maybeSingle();
  if (existing) return existing.id as string;
  if (slug.startsWith("custom-")) {
    const custom = (() => { try { return (JSON.parse(window.localStorage.getItem("mitaiken-zone:custom-experiences") ?? "[]") as { id: string; title: string }[]).find((item) => item.id === slug); } catch { return undefined; } })();
    if (!custom) return null;
    const { data } = await supabase.from("user_experiences").insert({ user_id: userId, client_key: slug, title: custom.title, wishlisted_at: new Date().toISOString() }).select("id").maybeSingle();
    if (data?.id) return data.id as string;
    const { data: retry } = await supabase.from("user_experiences").select("id").eq("user_id", userId).eq("client_key", slug).maybeSingle();
    return retry?.id as string | undefined ?? null;
  }
  const { data: template } = await supabase.from("templates").select("id, title, category_id, image_path").eq("slug", slug).single();
  if (!template) return null;
  const { data } = await supabase.from("user_experiences").upsert({ user_id: userId, source_template_slug: slug, source_template_id: template.id, title: template.title, category_id: template.category_id, image_path: template.image_path }, { onConflict: "user_id,source_template_slug" }).select("id").single();
  return data?.id as string | undefined ?? null;
}

async function saveTarget(userId: string, parentId: string, target: ExperienceTarget, sortOrder: number) {
  const supabase = getSupabaseClient();
  const userExperienceId = await ensureUserExperience(userId, parentId);
  if (!supabase || !userExperienceId) return null;
  const payload = { id: target.id, user_experience_id: userExperienceId, source_template_item_id: target.sourceTemplateItemId ?? null, title: target.title, memo: target.memo ?? null, related_url: target.relatedUrl ?? null, sort_order: sortOrder };
  const { data } = await supabase.from("user_experience_items").upsert(payload, target.sourceTemplateItemId ? { onConflict: "user_experience_id,source_template_item_id" } : undefined).select("id").single();
  return data?.id as string | undefined ?? null;
}

export async function ensureStoredTargetInDatabase(userId: string, parentId: string, targetId: string) {
  const targets = readStoredTargets()[parentId] ?? [];
  const index = targets.findIndex((target) => target.id === targetId);
  if (index >= 0) return saveTarget(userId, parentId, targets[index], index);
  return null;
}

export function useExperienceTargets() {
  const configured = Boolean(getSupabaseClient());
  const [targetsMap, setTargetsMap] = useState<TargetsMap>({});
  const [userId, setUserId] = useState<string>();
  const userIdRef = useRef<string | undefined>(undefined);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  function write(next: TargetsMap) { setTargetsMap(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }

  useEffect(() => { const frame = window.requestAnimationFrame(() => setTargetsMap(readStoredTargets())); return () => window.cancelAnimationFrame(frame); }, []);
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      const nextUserId = data.session?.user.id;
      userIdRef.current = nextUserId;
      setUserId(nextUserId);
      setError(false);
      if (!nextUserId) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id;
      const userChanged = userIdRef.current !== nextUserId;
      userIdRef.current = nextUserId;
      setUserId(nextUserId);
      if (!nextUserId) setLoading(false);
      else if (userChanged) setLoading(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    void (async () => {
      try {
      const storedLocal = readStoredTargets();
      const local: TargetsMap = {};
      for (const [parentId, targets] of Object.entries(storedLocal)) {
        const { data: template } = await supabase
          .from("templates")
          .select("template_items(id,title)")
          .eq("slug", parentId)
          .maybeSingle();
        const templateItems = (template?.template_items ?? []) as { id: string; title: string }[];
        const sourceIdByTitle = new Map(templateItems.map((item) => [item.title.trim().toLocaleLowerCase("ja"), item.id]));
        const seen = new Set<string>();
        local[parentId] = targets.flatMap((target) => {
          const sourceTemplateItemId = target.sourceTemplateItemId ?? sourceIdByTitle.get(target.title.trim().toLocaleLowerCase("ja"));
          const key = sourceTemplateItemId ? `source:${sourceTemplateItemId}` : `item:${target.id}`;
          if (seen.has(key)) return [];
          seen.add(key);
          return [{ ...target, sourceTemplateItemId }];
        });
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      let { data: parents } = await supabase.from("user_experiences").select("id, source_template_slug, client_key").eq("user_id", userId);
      let parentIds = (parents ?? []).map((parent) => parent.id);
      let rows = parentIds.length
        ? (await supabase.from("user_experience_items").select("id, user_experience_id, source_template_item_id, title, memo, related_url, sort_order, is_primary").in("user_experience_id", parentIds).eq("is_primary", false).order("sort_order", { ascending: true })).data
        : [];
      const parentDbIdBySlug = new Map((parents ?? []).flatMap((parent) => { const key = parent.source_template_slug ?? parent.client_key; return key ? [[key as string, parent.id as string]] : []; }));
      for (const [parentId, targets] of Object.entries(local)) {
        const parentDbId = parentDbIdBySlug.get(parentId);
        const existing = (rows ?? []).filter((row) => row.user_experience_id === parentDbId);
        await Promise.all(targets.map((target, index) => {
          const alreadyStored = existing.some((row) =>
            (target.sourceTemplateItemId && row.source_template_item_id === target.sourceTemplateItemId) ||
            (!target.sourceTemplateItemId && row.title.trim().toLocaleLowerCase("ja") === target.title.trim().toLocaleLowerCase("ja"))
          );
          return alreadyStored ? Promise.resolve(null) : saveTarget(userId, parentId, target, index);
        }));
      }
      ({ data: parents } = await supabase.from("user_experiences").select("id, source_template_slug, client_key").eq("user_id", userId));
      parentIds = (parents ?? []).map((parent) => parent.id);
      rows = parentIds.length
        ? (await supabase.from("user_experience_items").select("id, user_experience_id, source_template_item_id, title, memo, related_url, sort_order, is_primary").in("user_experience_id", parentIds).eq("is_primary", false).order("sort_order", { ascending: true })).data
        : [];
      if (!active || !rows) return;
      const slugById = new Map((parents ?? []).flatMap((parent) => { const key = parent.source_template_slug ?? parent.client_key; return key ? [[parent.id, key as string]] : []; }));
      const remote: TargetsMap = {};
      for (const row of rows) {
        const slug = slugById.get(row.user_experience_id);
        if (!slug) continue;
        remote[slug] = [...(remote[slug] ?? []), { id: row.id, title: row.title, memo: row.memo ?? undefined, relatedUrl: row.related_url ?? undefined, sourceTemplateItemId: row.source_template_item_id ?? undefined }];
      }
      write({ ...local, ...remote });
      } catch (loadError) {
        console.error("Failed to prepare experience items:", loadError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  async function initializeTargets(parentId: string) {
    const current = readStoredTargets();
    if (current[parentId]?.length) return;
    const supabase = getSupabaseClient();
    const { data: template } = supabase ? await supabase.from("templates").select("template_items(id,title,display_order)").eq("slug", parentId).single() : { data: null };
    const templateItems = (template?.template_items ?? []) as { id: string; title: string; display_order: number }[];
    const targets = templateItems.length
      ? [...templateItems].sort((a, b) => a.display_order - b.display_order).map((item) => ({ id: newId(), title: item.title, sourceTemplateItemId: item.id }))
      : (DEFAULT_EXPERIENCE_TARGETS[parentId] ?? []).map((title) => ({ id: newId(), title }));
    write({ ...current, [parentId]: targets });
    if (userId) {
      const storedIds = await Promise.all(targets.map((target, index) => saveTarget(userId, parentId, target, index)));
      const storedTargets = targets.map((target, index) => storedIds[index] ? { ...target, id: storedIds[index] as string } : target);
      const latest = readStoredTargets();
      write({ ...latest, [parentId]: storedTargets });
    }
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
  return { targetsMap, loading, error, initializeTargets, addTarget, updateTarget, removeTarget, clearTargets };
}
