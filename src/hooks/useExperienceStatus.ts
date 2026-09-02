"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Timing, UNKNOWN_TIMING, isValidTiming } from "@/lib/timing";
import { getSupabaseClient } from "@/lib/supabase";
import type { MemoryRecordDraft } from "@/components/MemoryRecordSheet";
import { ensureStoredTargetInDatabase } from "@/hooks/useExperienceTargets";

export interface TriedRecord {
  id: string;
  timing: Timing;
  place?: string;
  companion?: string;
  photoUrl?: string;
  memo?: string;
  targetId?: string;
}

export type RecordsMap = Record<string, TriedRecord[]>;

export type StatusEntry =
  | { status: "wishlist" }
  | { status: "cleared"; timing: Timing; photoUrl?: string; memo?: string };

type StatusMap = Record<string, StatusEntry>;

const STORAGE_KEY = "mitaiken-zone:status";
const RECORDS_STORAGE_KEY = "mitaiken-zone:records";
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
  } catch {
    return {};
  }
}

function readRecordsStorage(): RecordsMap {
  try {
    const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const next: RecordsMap = {};
    for (const [slug, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      const records = value.flatMap((rawRecord): TriedRecord[] => {
        if (!rawRecord || typeof rawRecord !== "object") return [];
        const candidate = rawRecord as Record<string, unknown>;
        const timing = isValidTiming(candidate.timing) ? candidate.timing : UNKNOWN_TIMING;
        const id = typeof candidate.id === "string" ? candidate.id : `local-${slug}-${Math.random()}`;
        return [{
          id,
          timing,
          place: typeof candidate.place === "string" ? candidate.place : undefined,
          companion: typeof candidate.companion === "string" ? candidate.companion : undefined,
          photoUrl: typeof candidate.photoUrl === "string" ? candidate.photoUrl : undefined,
          memo: typeof candidate.memo === "string" ? candidate.memo : undefined,
          targetId: typeof candidate.targetId === "string" ? candidate.targetId : undefined,
        }];
      });
      if (records.length) next[slug] = records;
    }
    return next;
  } catch {
    return {};
  }
}

function getSnapshot(): StatusMap {
  if (cachedSnapshot === null) cachedSnapshot = readStorage();
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
  } catch {}
  listeners.forEach((listener) => listener());
}

function timingToDb(timing: Timing) {
  if (timing.type === "unknown" || !timing.value) {
    return { experienced_year: 9998, experienced_month: null, experienced_day: null };
  }
  const [year, month, day] = timing.value.split("-").map(Number);
  return {
    experienced_year: year,
    experienced_month: timing.type === "year" ? null : month || null,
    experienced_day: timing.type === "date" ? day || null : null,
  };
}

function dbToTiming(year: number, month: number | null, day: number | null): Timing {
  if (year === 9998) return UNKNOWN_TIMING;
  if (day && month) {
    return {
      type: "date",
      value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    };
  }
  if (month) return { type: "month", value: `${year}-${String(month).padStart(2, "0")}` };
  return { type: "year", value: String(year) };
}

async function ensureUserExperience(userId: string, slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const lookup = supabase
    .from("user_experiences")
    .select("id")
    .eq("user_id", userId);
  const { data: existing } = slug.startsWith("custom-")
    ? await lookup.eq("client_key", slug).maybeSingle()
    : await lookup.eq("source_template_slug", slug).maybeSingle();

  if (existing) return existing.id as string;
  if (slug.startsWith("custom-")) {
    const custom = (() => { try { return (JSON.parse(window.localStorage.getItem("mitaiken-zone:custom-experiences") ?? "[]") as { id: string; title: string }[]).find((item) => item.id === slug); } catch { return undefined; } })();
    if (!custom) return null;
    const { data } = await supabase.from("user_experiences").insert({ user_id: userId, client_key: slug, title: custom.title }).select("id").maybeSingle();
    if (data?.id) return data.id as string;
    const { data: retry } = await supabase.from("user_experiences").select("id").eq("user_id", userId).eq("client_key", slug).maybeSingle();
    return retry?.id as string | undefined ?? null;
  }

  const { data: template } = await supabase
    .from("templates")
    .select("id, title, category_id, image_path")
    .eq("slug", slug)
    .single();

  if (!template) return null;

  const { data, error } = await supabase
    .from("user_experiences")
    .upsert(
      {
        user_id: userId,
        source_template_slug: slug,
        source_template_id: template.id,
        title: template.title,
        category_id: template.category_id,
        image_path: template.image_path,
      },
      { onConflict: "user_id,source_template_slug" }
    )
    .select("id")
    .single();

  if (error) return null;
  return data.id as string;
}

async function ensurePrimaryItem(userExperienceId: string, title: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const id = `primary-${userExperienceId}`;
  const { data, error } = await supabase
    .from("user_experience_items")
    .upsert(
      { id, user_experience_id: userExperienceId, title, is_primary: true, sort_order: 0 },
      { onConflict: "id" }
    )
    .select("id")
    .maybeSingle();
  if (!error && data?.id) return data.id as string;
  const { data: existing } = await supabase
    .from("user_experience_items")
    .select("id")
    .eq("user_experience_id", userExperienceId)
    .eq("is_primary", true)
    .maybeSingle();
  return existing?.id as string | undefined ?? null;
}

export function useExperienceStatus() {
  const configured = Boolean(getSupabaseClient());
  const [userId, setUserId] = useState<string | undefined>();
  const userIdRef = useRef<string | undefined>(undefined);
  const [recordsMap, setRecordsMapState] = useState<RecordsMap>({});
  const [relatedUrlMap, setRelatedUrlMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);
  const statusMap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const writeRecordsMap = useCallback((next: RecordsMap) => {
    setRecordsMapState(next);
    try {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  useEffect(() => {
    const stored = readRecordsStorage();
    if (Object.keys(stored).length > 0) {
      // Initial hydration from the browser's persisted records.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecordsMapState(stored);
      return;
    }

    const legacy = readStorage();
    const migrated: RecordsMap = {};
    for (const [slug, entry] of Object.entries(legacy)) {
      if (entry.status !== "cleared") continue;
      migrated[slug] = [{
        id: `legacy-${slug}`,
        timing: entry.timing,
        photoUrl: entry.photoUrl,
        memo: entry.memo,
      }];
    }
    if (Object.keys(migrated).length > 0) writeRecordsMap(migrated);
  }, [writeRecordsMap]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      const nextUserId = data.session?.user.id;
      userIdRef.current = nextUserId;
      setUserId(nextUserId);
      if (!nextUserId) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id;
      const userChanged = userIdRef.current !== nextUserId;
      userIdRef.current = nextUserId;
      setUserId(nextUserId);
      setError(false);
      if (!nextUserId) setLoading(false);
      else if (userChanged) setLoading(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    if (!userId) return false;
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { data: rows, error: rowsError } = await supabase
      .from("user_experiences")
      .select("id, source_template_slug, client_key, wishlisted_at, related_url")
      .eq("user_id", userId);
    if (rowsError) {
      console.error("Failed to load user experiences:", rowsError);
      return false;
    }

    const ids = (rows ?? []).map((row) => row.id);
    const { data: logs, error: logsError } = ids.length
      ? await supabase
          .from("experience_logs")
          .select("id, user_experience_id, user_experience_item_id, experienced_year, experienced_month, experienced_day, place, companion, memo, photo_path, created_at")
          .in("user_experience_id", ids)
          .order("created_at", { ascending: true })
      : { data: [], error: null };
    if (logsError) {
      console.error("Failed to load experience logs:", logsError);
      return false;
    }

    const byId = new Map((rows ?? []).map((row) => [row.id, row]));
    const nextStatus: StatusMap = {};
    const nextRecords: RecordsMap = {};
    const nextRelatedUrls: Record<string, string> = {};

    for (const row of rows ?? []) {
      const key = row.source_template_slug ?? row.client_key;
      if (!key) continue;
      if (row.related_url) nextRelatedUrls[key] = row.related_url;
      if (row.wishlisted_at) nextStatus[key] = { status: "wishlist" };
    }

    for (const log of logs ?? []) {
      const row = byId.get(log.user_experience_id);
      const key = row?.source_template_slug ?? row?.client_key;
      if (!row || !key) continue;

      const record: TriedRecord = {
        id: log.id,
        timing: dbToTiming(log.experienced_year, log.experienced_month, log.experienced_day),
        place: log.place ?? undefined,
        companion: log.companion ?? undefined,
        photoUrl: log.photo_path ?? undefined,
        memo: log.memo ?? undefined,
        targetId: log.user_experience_item_id ?? undefined,
      };

      nextRecords[key] = [
        ...(nextRecords[key] ?? []),
        record,
      ];
      nextStatus[key] = {
        status: "cleared",
        timing: record.timing,
        photoUrl: record.photoUrl,
        memo: record.memo,
      };
    }

    writeRecordsMap(nextRecords);
    setRelatedUrlMap(nextRelatedUrls);
    writeStatusMap(nextStatus);
    return true;
  }, [userId, writeRecordsMap]);

  useEffect(() => {
    if (!userId) return;
    const local = readStorage();
    const marker = `${MIGRATION_KEY_PREFIX}${userId}`;

    let active = true;
    void (async () => {
      try {
        if (window.localStorage.getItem(marker) !== "1") {
        for (const [slug, entry] of Object.entries(local)) {
          const id = await ensureUserExperience(userId, slug);
          const supabase = getSupabaseClient();
          if (!id || !supabase) continue;

          if (entry.status === "wishlist") {
            await supabase
              .from("user_experiences")
              .update({ wishlisted_at: new Date().toISOString() })
              .eq("id", id);
          } else {
            const { count } = await supabase
              .from("experience_logs")
              .select("id", { count: "exact", head: true })
              .eq("user_experience_id", id);

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
        const loaded = await reload();
        if (active) setError(!loaded);
      } catch (loadError) {
        console.error("Failed to prepare user experience data:", loadError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId, reload]);

  const toggleWishlist = useCallback((slug: string) => {
    const current = getSnapshot();
    if (current[slug]?.status === "cleared") return;

    const adding = current[slug]?.status !== "wishlist";
    const next = { ...current };
    if (adding) next[slug] = { status: "wishlist" };
    else delete next[slug];
    writeStatusMap(next);

    if (userId) {
      void (async () => {
        const id = await ensureUserExperience(userId, slug);
        const supabase = getSupabaseClient();
        if (id && supabase) {
          await supabase
            .from("user_experiences")
            .update({ wishlisted_at: adding ? new Date().toISOString() : null })
            .eq("id", id);
        }
      })();
    }
  }, [userId]);

  const markTried = useCallback((slug: string, record: MemoryRecordDraft) => {
    const localRecord: TriedRecord = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...record,
    };

    const currentRecords = readRecordsStorage();
    writeRecordsMap({
      ...currentRecords,
      [slug]: [...(currentRecords[slug] ?? []), localRecord],
    });

    writeStatusMap({
      ...getSnapshot(),
      [slug]: {
        status: "cleared",
        timing: record.timing,
        memo: record.memo,
        photoUrl: record.photoUrl,
      },
    });

    if (userId) {
      void (async () => {
        const id = await ensureUserExperience(userId, slug);
        const supabase = getSupabaseClient();
        if (!id || !supabase) return;

        const storedTargetId = record.targetId
          ? await ensureStoredTargetInDatabase(userId, slug, record.targetId)
          : null;

        const experience = await supabase.from("user_experiences").select("title").eq("id", id).single();
        const itemId = record.targetId
          ? storedTargetId
          : await ensurePrimaryItem(id, experience.data?.title ?? slug);
        if (!itemId) return;
        await supabase.from("experience_logs").insert({
          user_experience_id: id,
          user_experience_item_id: itemId,
          ...timingToDb(record.timing),
          place: record.place ?? null,
          companion: record.companion ?? null,
          memo: record.memo ?? null,
          photo_path: record.photoUrl ?? null,
        });
        await supabase.from("user_experiences").update({ wishlisted_at: null }).eq("id", id);
        await reload();
      })();
    }
  }, [userId, reload, writeRecordsMap]);

  const updateRecord = useCallback((slug: string, recordId: string, record: MemoryRecordDraft) => {
    const current = readRecordsStorage();
    const nextRecords = (current[slug] ?? []).map((item) =>
      item.id === recordId ? { id: item.id, ...record } : item
    );
    writeRecordsMap({ ...current, [slug]: nextRecords });

    const latest = [...nextRecords].sort((a, b) =>
      (b.timing.value ?? "").localeCompare(a.timing.value ?? "")
    )[0];
    if (latest) {
      writeStatusMap({
        ...getSnapshot(),
        [slug]: {
          status: "cleared",
          timing: latest.timing,
          memo: latest.memo,
          photoUrl: latest.photoUrl,
        },
      });
    }

    if (userId && !recordId.startsWith("local-") && !recordId.startsWith("legacy-")) {
      void (async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const userExperienceId = await ensureUserExperience(userId, slug);
        if (!userExperienceId) return;
        const experience = await supabase.from("user_experiences").select("title").eq("id", userExperienceId).single();
        const itemId = record.targetId ?? await ensurePrimaryItem(userExperienceId, experience.data?.title ?? slug);
        if (!itemId) return;
        await supabase
          .from("experience_logs")
          .update({
            ...timingToDb(record.timing),
            place: record.place ?? null,
            companion: record.companion ?? null,
            memo: record.memo ?? null,
            photo_path: record.photoUrl ?? null,
            user_experience_item_id: itemId,
          })
          .eq("id", recordId);
        await reload();
      })();
    }
  }, [userId, reload, writeRecordsMap]);

  const deleteRecord = useCallback((slug: string, recordId: string) => {
    const current = readRecordsStorage();
    const remaining = (current[slug] ?? []).filter((record) => record.id !== recordId);
    const nextRecords = { ...current, [slug]: remaining };
    writeRecordsMap(nextRecords);

    if (remaining.length === 0) {
      writeStatusMap({ ...getSnapshot(), [slug]: { status: "wishlist" } });
    } else {
      const latest = [...remaining].sort((a, b) =>
        (b.timing.value ?? "").localeCompare(a.timing.value ?? "")
      )[0];
      writeStatusMap({
        ...getSnapshot(),
        [slug]: {
          status: "cleared",
          timing: latest.timing,
          memo: latest.memo,
          photoUrl: latest.photoUrl,
        },
      });
    }

    if (userId && !recordId.startsWith("local-") && !recordId.startsWith("legacy-")) {
      void (async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        await supabase.from("experience_logs").delete().eq("id", recordId);
        if (remaining.length === 0) {
          const id = await ensureUserExperience(userId, slug);
          if (id) {
            await supabase
              .from("user_experiences")
              .update({ wishlisted_at: new Date().toISOString() })
              .eq("id", id);
          }
        }
        await reload();
      })();
    }
  }, [userId, reload, writeRecordsMap]);

  const undoTried = useCallback((slug: string) => {
    const current = getSnapshot();
    if (current[slug]?.status !== "cleared") return;

    writeStatusMap({ ...current, [slug]: { status: "wishlist" } });
    const currentRecords = readRecordsStorage();
    writeRecordsMap({ ...currentRecords, [slug]: [] });

    if (userId) {
      void (async () => {
        const id = await ensureUserExperience(userId, slug);
        const supabase = getSupabaseClient();
        if (id && supabase) {
          await supabase.from("experience_logs").delete().eq("user_experience_id", id);
          await supabase
            .from("user_experiences")
            .update({ wishlisted_at: new Date().toISOString() })
            .eq("id", id);
        }
      })();
    }
  }, [userId, writeRecordsMap]);

  const removeStatus = useCallback((slug: string) => {
    const next = { ...getSnapshot() };
    delete next[slug];
    writeStatusMap(next);

    if (userId) {
      void (async () => {
        const supabase = getSupabaseClient();
        if (supabase) {
          const query = supabase.from("user_experiences").update({ wishlisted_at: null }).eq("user_id", userId);
          if (slug.startsWith("custom-")) await query.eq("client_key", slug);
          else await query.eq("source_template_slug", slug);
        }
      })();
    }
  }, [userId]);

  return {
    statusMap,
    recordsMap,
    relatedUrlMap,
    loading,
    error,
    toggleWishlist,
    markTried,
    updateRecord,
    deleteRecord,
    undoTried,
    removeStatus,
  };
}
