"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, CostLevel, Experience } from "@/data/experiences";
import { getSupabaseClient } from "@/lib/supabase";

export interface CustomExperienceDraft {
  title: string;
  description?: string;
  category: Category;
  image?: string;
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
    place: "",
    time: "",
    timeMinutes: 0,
    cost: "",
    costLevel: 0 as CostLevel,
    solo: true,
  };
}

function categorySlug(category: Category) {
  return category === "hobby" ? "hobby-learning" : category === "home" ? "lifestyle" : category;
}

function dbCategory(slug?: string): Category {
  if (slug === "hobby-learning") return "hobby";
  if (slug === "lifestyle") return "home";
  if (slug === "food" || slug === "outing" || slug === "experience") return slug;
  return "experience";
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
        const { data: category } = await supabase.from("categories").select("id").eq("slug", categorySlug(item.category)).maybeSingle();
        await supabase.from("user_experiences").upsert({
          user_id: userId,
          client_key: item.id,
          title: item.title,
          description: item.description,
          category_id: category?.id ?? null,
          image_path: item.image ?? null,
          wishlisted_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_key" });
      }
      const { data } = await supabase.from("user_experiences").select("client_key,title,description,image_path,category:categories(slug)").eq("user_id", userId).not("client_key", "is", null);
      if (!active || !data) return;
      const remote = data.map((row) => {
        const category = Array.isArray(row.category) ? row.category[0] : row.category;
        return makeExperience(row.client_key as string, {
          title: row.title,
          description: row.description,
          image: row.image_path ?? undefined,
          category: dbCategory(category?.slug),
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
        const { data: category } = await supabase.from("categories").select("id").eq("slug", categorySlug(draft.category)).maybeSingle();
        await supabase.from("user_experiences").insert({
          user_id: userId,
          client_key: id,
          title: experience.title,
          description: experience.description,
          category_id: category?.id ?? null,
          image_path: experience.image ?? null,
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
        const { data: category } = await supabase.from("categories").select("id").eq("slug", categorySlug(draft.category)).maybeSingle();
        await supabase.from("user_experiences").update({
          title: experience.title,
          description: experience.description,
          category_id: category?.id ?? null,
          image_path: experience.image ?? null,
        }).eq("user_id", userId).eq("client_key", id);
      }
    }
    return true;
  }, [userId, write]);

  return { customExperiences: items, createExperience, updateExperience };
}
