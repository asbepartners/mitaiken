"use client";

import { useCallback, useEffect, useState } from "react";
import { categoryFromCode, type Category, type CostLevel, type Experience } from "@/data/experiences";
import { getSupabaseClient } from "@/lib/supabase";

export interface CustomExperienceDraft {
  title: string;
  description?: string;
  category: Category;
  categoryId?: string;
  categoryCode?: string;
  categoryLabel?: string;
  image?: string;
  locationOptionId?: string;
  locationCode?: string;
  locationLabel?: string;
  durationOptionId?: string;
  durationCode?: string;
  durationLabel?: string;
  durationMinMinutes?: number;
  durationMaxMinutes?: number;
  budgetOptionId?: string;
  budgetCode?: string;
  budgetLabel?: string;
  budgetMinYen?: number;
  budgetMaxYen?: number;
  minPeople?: number;
  maxPeople?: number;
}

const STORAGE_KEY = "mitaiken-zone:custom-experiences";

function readStored(): Experience[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function makeExperience(id: string, draft: CustomExperienceDraft): Experience {
  return {
    id,
    image: draft.image,
    title: draft.title.trim(),
    description: draft.description?.trim() ?? "",
    category: draft.category,
    categoryId: draft.categoryId,
    categoryCode: draft.categoryCode,
    categoryLabel: draft.categoryLabel,
    place: draft.locationLabel ?? "",
    locationOptionId: draft.locationOptionId,
    locationCode: draft.locationCode,
    locationLabel: draft.locationLabel,
    time: draft.durationLabel ?? "",
    timeMinutes: draft.durationMaxMinutes ?? draft.durationMinMinutes ?? 0,
    durationOptionId: draft.durationOptionId,
    durationCode: draft.durationCode,
    durationLabel: draft.durationLabel,
    durationMinMinutes: draft.durationMinMinutes,
    durationMaxMinutes: draft.durationMaxMinutes,
    cost: draft.budgetLabel ?? "",
    costLevel: (draft.budgetMaxYen === 0 ? 0 : draft.budgetMaxYen !== undefined && draft.budgetMaxYen <= 2000 ? 1 : draft.budgetMaxYen !== undefined ? 2 : draft.budgetMinYen !== undefined ? 3 : 0) as CostLevel,
    budgetOptionId: draft.budgetOptionId,
    budgetCode: draft.budgetCode,
    budgetLabel: draft.budgetLabel,
    budgetMinYen: draft.budgetMinYen,
    budgetMaxYen: draft.budgetMaxYen,
    solo: draft.minPeople === 1,
    minPeople: draft.minPeople,
    maxPeople: draft.maxPeople,
  };
}

function categorySlug(category: Category) {
  return category === "hobby" ? "hobby" : category === "home" ? "lifestyle" : category;
}

function dbCategory(slug?: string): Category {
  return categoryFromCode(slug ?? "experience");
}

export function useCustomExperiences() {
  const [items, setItems] = useState<Experience[]>([]);
  const [userId, setUserId] = useState<string>();

  const write = useCallback((next: Experience[]) => {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setItems(readStored()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
      for (const item of readStored()) {
        const categoryCode = item.categoryCode ?? categorySlug(item.category);
        const { data: category } = item.categoryId
          ? { data: undefined }
          : await supabase.from("categories").select("id").eq("slug", categoryCode).maybeSingle();
        await supabase.from("user_experiences").upsert({
          user_id: userId,
          client_key: item.id,
          title: item.title,
          description: item.description,
          category_id: item.categoryId ?? category?.id ?? null,
          image_path: item.image ?? null,
          location_option_id: item.locationOptionId ?? null,
          duration_option_id: item.durationOptionId ?? null,
          budget_option_id: item.budgetOptionId ?? null,
          min_people: item.minPeople ?? null,
          max_people: item.maxPeople ?? null,
          wishlisted_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_key" });
      }
      const { data } = await supabase.from("user_experiences").select(`
        client_key,
        title,
        description,
        image_path,
        min_people,
        max_people,
        category:categories(id, slug, name),
        location:location_options(id, code, label),
        duration:duration_options(id, code, label, min_minutes, max_minutes),
        budget:budget_options(id, code, label, min_yen, max_yen)
      `).eq("user_id", userId).not("client_key", "is", null);
      if (!active || !data) return;
      const remote = data.map((row) => {
        const category = Array.isArray(row.category) ? row.category[0] : row.category;
        const location = Array.isArray(row.location) ? row.location[0] : row.location;
        const duration = Array.isArray(row.duration) ? row.duration[0] : row.duration;
        const budget = Array.isArray(row.budget) ? row.budget[0] : row.budget;
        return makeExperience(row.client_key as string, {
          title: row.title,
          description: row.description,
          image: row.image_path ?? undefined,
          category: dbCategory(category?.slug),
          categoryId: category?.id,
          categoryCode: category?.slug,
          categoryLabel: category?.name,
          locationOptionId: location?.id,
          locationCode: location?.code,
          locationLabel: location?.label,
          durationOptionId: duration?.id,
          durationCode: duration?.code,
          durationLabel: duration?.label,
          durationMinMinutes: duration?.min_minutes,
          durationMaxMinutes: duration?.max_minutes ?? undefined,
          budgetOptionId: budget?.id,
          budgetCode: budget?.code,
          budgetLabel: budget?.label,
          budgetMinYen: budget?.min_yen,
          budgetMaxYen: budget?.max_yen ?? undefined,
          minPeople: row.min_people ?? undefined,
          maxPeople: row.max_people ?? undefined,
        });
      });
      write(remote);
    })();
    return () => { active = false; };
  }, [userId, write]);

  const createExperience = useCallback(async (draft: CustomExperienceDraft) => {
    const id = `custom-${crypto.randomUUID()}`;
    const experience = makeExperience(id, draft);
    write([...readStored(), experience]);
    if (userId) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const categoryCode = draft.categoryCode ?? categorySlug(draft.category);
        const { data: category } = draft.categoryId
          ? { data: undefined }
          : await supabase.from("categories").select("id").eq("slug", categoryCode).maybeSingle();
        await supabase.from("user_experiences").insert({
          user_id: userId,
          client_key: id,
          title: experience.title,
          description: experience.description,
          category_id: draft.categoryId ?? category?.id ?? null,
          image_path: experience.image ?? null,
          location_option_id: draft.locationOptionId ?? null,
          duration_option_id: draft.durationOptionId ?? null,
          budget_option_id: draft.budgetOptionId ?? null,
          min_people: draft.minPeople ?? null,
          max_people: draft.maxPeople ?? null,
          wishlisted_at: new Date().toISOString(),
        });
      }
    }
    return id;
  }, [userId, write]);

  const updateExperience = useCallback(async (id: string, draft: CustomExperienceDraft) => {
    const current = readStored();
    const previous = current.find((item) => item.id === id);
    if (!previous) return false;
    const experience = makeExperience(id, draft);
    write(current.map((item) => item.id === id ? experience : item));
    if (userId) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const categoryCode = draft.categoryCode ?? categorySlug(draft.category);
        const { data: category } = draft.categoryId
          ? { data: undefined }
          : await supabase.from("categories").select("id").eq("slug", categoryCode).maybeSingle();
        await supabase.from("user_experiences").update({
          title: experience.title,
          description: experience.description,
          category_id: draft.categoryId ?? category?.id ?? null,
          image_path: experience.image ?? null,
          location_option_id: draft.locationOptionId ?? null,
          duration_option_id: draft.durationOptionId ?? null,
          budget_option_id: draft.budgetOptionId ?? null,
          min_people: draft.minPeople ?? null,
          max_people: draft.maxPeople ?? null,
        }).eq("user_id", userId).eq("client_key", id);
      }
    }
    return true;
  }, [userId, write]);

  return { customExperiences: items, createExperience, updateExperience };
}
