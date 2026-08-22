"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const STORAGE_KEY = "mitaiken-zone:hidden-experiences";
const EMPTY_IDS: string[] = [];
const MIGRATION_KEY_PREFIX = "mitaiken-zone:hidden-migrated:";
let cachedSnapshot: string[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): string[] { try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return []; const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) return []; return [...new Set(parsed.filter((item): item is string => typeof item === "string"))]; } catch { return []; } }
function getSnapshot(): string[] { if (cachedSnapshot === null) cachedSnapshot = readStorage(); return cachedSnapshot; }
function getServerSnapshot(): string[] { return EMPTY_IDS; }
function subscribe(callback: () => void) { listeners.add(callback); return () => listeners.delete(callback); }
function writeIds(ids: string[]) { cachedSnapshot = ids; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {} listeners.forEach((listener) => listener()); }

async function ensureRow(userId: string, slug: string) {
  const s = getSupabaseClient(); if (!s) return null;
  const { data: existing } = await s.from("user_experiences").select("id").eq("user_id", userId).eq("source_template_slug", slug).maybeSingle();
  if (existing) return existing.id as string;
  const { data: t } = await s.from("templates").select("title, category_id, image_path").eq("slug", slug).single(); if (!t) return null;
  const { data } = await s.from("user_experiences").upsert({ user_id: userId, source_template_slug: slug, title: t.title, category_id: t.category_id, image_path: t.image_path }, { onConflict: "user_id,source_template_slug" }).select("id").single();
  return data?.id as string | undefined ?? null;
}

export function useHiddenExperiences() {
  const [userId, setUserId] = useState<string | undefined>();
  const hiddenIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    const s = getSupabaseClient(); if (!s) return;
    void s.auth.getSession().then(({ data }) => setUserId(data.session?.user.id));
    const { data } = s.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!userId) return;
    const local = readStorage(); const marker = `${MIGRATION_KEY_PREFIX}${userId}`;
    void (async () => {
      const s = getSupabaseClient(); if (!s) return;
      if (window.localStorage.getItem(marker) !== "1") {
        for (const slug of local) { const id = await ensureRow(userId, slug); if (id) await s.from("user_experiences").update({ hidden_at: new Date().toISOString() }).eq("id", id); }
        window.localStorage.setItem(marker, "1");
      }
      const { data } = await s.from("user_experiences").select("source_template_slug").eq("user_id", userId).not("hidden_at", "is", null).not("source_template_slug", "is", null);
      writeIds((data ?? []).map((r) => r.source_template_slug));
    })();
  }, [userId]);

  const hideExperience = useCallback((slug: string) => {
    const current = getSnapshot(); if (!current.includes(slug)) writeIds([...current, slug]);
    if (userId) void (async () => { const id = await ensureRow(userId, slug); const s = getSupabaseClient(); if (id && s) await s.from("user_experiences").update({ hidden_at: new Date().toISOString() }).eq("id", id); })();
  }, [userId]);
  const restoreExperience = useCallback((slug: string) => {
    writeIds(getSnapshot().filter((id) => id !== slug));
    if (userId) { const s = getSupabaseClient(); if (s) void s.from("user_experiences").update({ hidden_at: null }).eq("user_id", userId).eq("source_template_slug", slug); }
  }, [userId]);
  return { hiddenIds, hideExperience, restoreExperience };
}
