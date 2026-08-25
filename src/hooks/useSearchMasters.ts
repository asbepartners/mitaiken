"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export interface CategoryOption {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
}

export interface LocationOption {
  id: string;
  code: string;
  label: string;
  supportsHome: boolean;
  supportsOuting: boolean;
  sortOrder: number;
}

export interface DurationOption {
  id: string;
  code: string;
  label: string;
  minMinutes: number;
  maxMinutes: number | null;
  sortOrder: number;
}

export interface BudgetOption {
  id: string;
  code: string;
  label: string;
  minYen: number;
  maxYen: number | null;
  sortOrder: number;
}

export interface PeopleSearchOption {
  id: string;
  code: string;
  label: string;
  queryMinPeople: number;
  queryMaxPeople: number | null;
  sortOrder: number;
}

export interface SearchMasters {
  categories: CategoryOption[];
  locations: LocationOption[];
  durations: DurationOption[];
  budgets: BudgetOption[];
  people: PeopleSearchOption[];
}

const EMPTY_MASTERS: SearchMasters = {
  categories: [],
  locations: [],
  durations: [],
  budgets: [],
  people: [],
};

const STORAGE_KEY = "mitaiken-zone:search-masters";

function readCache(): SearchMasters | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as SearchMasters | null;
    if (!value || !Array.isArray(value.categories) || !Array.isArray(value.locations)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export function useSearchMasters() {
  const [masters, setMasters] = useState<SearchMasters>(() => readCache() ?? EMPTY_MASTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = readCache();
    let active = true;

    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => {
        if (!active) return;
        setLoading(false);
        setError(!cached);
      });
      return () => { active = false; };
    }

    void (async () => {
      const [categoriesResult, locationsResult, durationsResult, budgetsResult, peopleResult] = await Promise.all([
        supabase.from("categories").select("id,slug,name,display_order").eq("is_active", true).order("display_order"),
        supabase.from("location_options").select("id,code,label,supports_home,supports_outing,sort_order").eq("is_active", true).order("sort_order"),
        supabase.from("duration_options").select("id,code,label,min_minutes,max_minutes,sort_order").eq("is_active", true).order("sort_order"),
        supabase.from("budget_options").select("id,code,label,min_yen,max_yen,sort_order").eq("is_active", true).order("sort_order"),
        supabase.from("people_search_options").select("id,code,label,query_min_people,query_max_people,sort_order").eq("is_active", true).order("sort_order"),
      ]);

      if (!active) return;
      const failed = [categoriesResult, locationsResult, durationsResult, budgetsResult, peopleResult].some(({ error }) => error);
      if (failed) {
        console.error("Failed to load search masters:", {
          categories: categoriesResult.error,
          locations: locationsResult.error,
          durations: durationsResult.error,
          budgets: budgetsResult.error,
          people: peopleResult.error,
        });
        setError(!cached);
        setLoading(false);
        return;
      }

      const next: SearchMasters = {
        categories: (categoriesResult.data ?? []).map((row) => ({ id: row.id, code: row.slug, label: row.name, sortOrder: row.display_order })),
        locations: (locationsResult.data ?? []).map((row) => ({ id: row.id, code: row.code, label: row.label, supportsHome: row.supports_home, supportsOuting: row.supports_outing, sortOrder: row.sort_order })),
        durations: (durationsResult.data ?? []).map((row) => ({ id: row.id, code: row.code, label: row.label, minMinutes: row.min_minutes, maxMinutes: row.max_minutes, sortOrder: row.sort_order })),
        budgets: (budgetsResult.data ?? []).map((row) => ({ id: row.id, code: row.code, label: row.label, minYen: row.min_yen, maxYen: row.max_yen, sortOrder: row.sort_order })),
        people: (peopleResult.data ?? []).map((row) => ({ id: row.id, code: row.code, label: row.label, queryMinPeople: row.query_min_people, queryMaxPeople: row.query_max_people, sortOrder: row.sort_order })),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMasters(next);
      setError(false);
      setLoading(false);
    })();

    return () => { active = false; };
  }, []);

  return { masters, loading, error };
}
