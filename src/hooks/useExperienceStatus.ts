"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Timing, UNKNOWN_TIMING, isValidTiming } from "@/lib/timing";
import { getSupabaseClient } from "@/lib/supabase";
import type { TriedRecordDraft } from "@/components/TriedTimingSheet";

export type StatusEntry =
  | { status: "wishlist" }
  | { status: "cleared"; timing: Timing; photoUrl?: string; memo?: string };

type StatusMap = Record<string, StatusEntry>;

const STORAGE_KEY = "mitaiken-zone:status";
const EMPTY_STATUS_MAP: StatusMap = {};
const MIGRATION_KEY_PREFIX = "mitaiken-zone:status-migrated:";
let cachedSnapshot: StatusMap | null = null;
const listeners = new Set<() => void>();

function normalizeEntry(raw: unknown): StatusEntry | null {
  if (raw === "wishlist") return { status: "wishlist" };
  if (raw === "cleared") return { status: "cleared", timing: UNKNOWN_TIMING };
  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>;
    if (candidate.status === "wishlist") return { status: "wishlist" };
    if (candidate.status === "cleared") {
      const timing = isValidTiming(candidate.timing) ? candidate.timing : UNKNOWN_TIMING;
      const photoUrl = typeof candidate.photoUrl === "string" ? candidate.photoUrl : undefined;
      const memo = typeof candidate.memo === "string" ? candidate.memo : undefined;
      return { status: "cleared", timing, photoUrl, memo };
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
  } catch { return {}; }
}
function getSnapshot(): StatusMap { if (cachedSnapshot === null) cachedSnapshot = readStorage(); return cachedSnapshot; }
function getServerSnapshot(): StatusMap { return EMPTY_STATUS_MAP; }
function subscribe(callback: () => void) { listeners.add(callback); return () => listeners.delete(callback); }
function writeStatusMap(next: StatusMap) {
  cachedSnapshot = next;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((listener) => listener());
}

function timingToDb(timing: Timing) {
  if (timing.type === "unknown" || !timing.value) return { experienced_year: 9998, experienced_month: null, experienced_day: null };
  const [year, month, day] = timing.value.split("-").map(Number);
  return {
    experienced_year: year,
    experienced_month: timing.type === "year" ? null : month || null,
    experienced_day: timing.type === "date" ? day || null : null,
  };
}
function dbToTiming(year: number, month: number | null, day: number | null): Timing {
  if (year === 9998) return UNKNOWN_TIMING;
  if (day && month) return { type: "date", value: `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` };
  if (month) return { type: "month", value: `${year}-${String(month).padStart(2,"0")}` };
  return { type: "year", value: String(year) };
}

async function ensureUserExperience(userId: string, slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data: existing } = await supabase.from("user_experiences").select("id").eq("user_id", userId).eq("source_template_slug", slug).maybeSingle();
  if (existing) return existing.id as string;
  const { data: template } = await supabase.from("templates").select("title, category_id, image_path").eq("slug", slug).single();
  if (!template) return null;
  const { data, error } = await supabase.from("user_experiences").upsert({
    user_id: userId, source_template_slug: slug, title: template.title,
    category_id: template.category_id, image_path: template.image_path,
  }, { onConflict: "user_id,source_template_slug" }).select("id").single();
  if (error) return null;
  return data.id as string;
}

export function useExperienceStatus() {
  const [userId, setUserId] = useState<string | undefined>();
  const statusMap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const s = getSupabaseClient(); if (!s) return;
    void s.auth.getSession().then(({ data }) => setUserId(data.session?.user.id));
    const { data } = s.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id));
    return () => data.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseClient(); if (!supabase) return;
    const { data: rows } = await supabase.from("user_experiences").select("id, source_template_slug, wishlisted_at").eq("user_id", userId).not("source_template_slug", "is", null);
    const ids = (rows ?? []).map((r) => r.id);
    const { data: logs } = ids.length
      ? await supabase.from("experience_logs")
          .select("user_experience_id, experienced_year, experienced_month, experienced_day, memo, photo_path, created_at")
          .in("user_experience_id", ids)
          .order("created_at", { ascending: true })
      : { data: [] };
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));
    const next: StatusMap = {};
    for (const row of rows ?? []) if (row.wishlisted_at) next[row.source_template_slug] = { status: "wishlist" };
    for (const log of logs ?? []) {
      const row = byId.get(log.user_experience_id); if (!row?.source_template_slug) continue;
      next[row.source_template_slug] = {
        status: "cleared",
        timing: dbToTiming(log.experienced_year, log.experienced_month, log.experienced_day),
        photoUrl: log.photo_path ?? undefined,
        memo: log.memo ?? undefined,
      };
    }
    writeStatusMap(next);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const local = readStorage();
    const marker = `${MIGRATION_KEY_PREFIX}${userId}`;
    void (async () => {
      if (window.localStorage.getItem(marker) !== "1") {
        for (const [slug, entry] of Object.entries(local)) {
          const id = await ensureUserExperience(userId, slug); if (!id) continue;
          const supabase = getSupabaseClient(); if (!supabase) continue;
          if (entry.status === "wishlist") {
            await supabase.from("user_experiences").update({ wishlisted_at: new Date().toISOString() }).eq("id", id);
          } else {
            const { count } = await supabase.from("experience_logs").select("id", { count: "exact", head: true }).eq("user_experience_id", id);
            if (!count) {
              await supabase.from("experience_logs").insert({
                user_experience_id: id,
                ...timingToDb(entry.timing),
                memo: entry.memo ?? null,
                photo_path: entry.photoUrl ?? null,
              });
            }
          }
        }
        window.localStorage.setItem(marker, "1");
      }
      await reload();
    })();
  }, [userId, reload]);

  const toggleWishlist = useCallback((slug: string) => {
    const current = getSnapshot(); if (current[slug]?.status === "cleared") return;
    const adding = current[slug]?.status !== "wishlist";
    const next = { ...current }; if (adding) next[slug] = { status: "wishlist" }; else delete next[slug]; writeStatusMap(next);
    if (userId) void (async () => {
      const id = await ensureUserExperience(userId, slug);
      const s = getSupabaseClient();
      if (id && s) await s.from("user_experiences").update({ wishlisted_at: adding ? new Date().toISOString() : null }).eq("id", id);
    })();
  }, [userId]);

  const markTried = useCallback((slug: string, record: TriedRecordDraft) => {
    writeStatusMap({
      ...getSnapshot(),
      [slug]: {
        status: "cleared",
        timing: record.timing,
        memo: record.memo,
        photoUrl: record.photoUrl,
      },
    });

    if (userId) void (async () => {
      const id = await ensureUserExperience(userId, slug);
      const s = getSupabaseClient();
      if (id && s) {
        await s.from("experience_logs").insert({
          user_experience_id: id,
          ...timingToDb(record.timing),
          memo: record.memo ?? null,
          photo_path: record.photoUrl ?? null,
        });
        await s.from("user_experiences").update({ wishlisted_at: null }).eq("id", id);
      }
    })();
  }, [userId]);

  const updateTried = useCallback((slug: string, record: TriedRecordDraft) => {
    const current = getSnapshot();
    if (current[slug]?.status !== "cleared") return;

    writeStatusMap({
      ...current,
      [slug]: {
        status: "cleared",
        timing: record.timing,
        memo: record.memo,
        photoUrl: record.photoUrl,
      },
    });

    if (userId) void (async () => {
      const id = await ensureUserExperience(userId, slug);
      const s = getSupabaseClient();
      if (!id || !s) return;

      const { data: latest } = await s
        .from("experience_logs")
        .select("id")
        .eq("user_experience_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.id) {
        await s
          .from("experience_logs")
          .update({
            ...timingToDb(record.timing),
            memo: record.memo ?? null,
            photo_path: record.photoUrl ?? null,
          })
          .eq("id", latest.id);
      }
    })();
  }, [userId]);

  const undoTried = useCallback((slug: string) => {
    const current = getSnapshot(); if (current[slug]?.status !== "cleared") return;
    writeStatusMap({ ...current, [slug]: { status: "wishlist" } });
    if (userId) void (async () => {
      const id = await ensureUserExperience(userId, slug);
      const s = getSupabaseClient();
      if (id && s) {
        await s.from("experience_logs").delete().eq("user_experience_id", id);
        await s.from("user_experiences").update({ wishlisted_at: new Date().toISOString() }).eq("id", id);
      }
    })();
  }, [userId]);

  const removeStatus = useCallback((slug: string) => {
    const next = { ...getSnapshot() }; delete next[slug]; writeStatusMap(next);
    if (userId) void (async () => {
      const s = getSupabaseClient();
      if (s) await s.from("user_experiences").update({ wishlisted_at: null }).eq("user_id", userId).eq("source_template_slug", slug);
    })();
  }, [userId]);

  return { statusMap, toggleWishlist, markTried, updateTried, undoTried, removeStatus };
}
