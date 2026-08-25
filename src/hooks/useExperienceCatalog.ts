"use client";

import { useEffect, useState } from "react";
import {
  Category,
  CostLevel,
  Experience,
  experiences as fallbackExperiences,
} from "@/data/experiences";
import { getSupabaseClient } from "@/lib/supabase";

interface CatalogRow {
  slug: string;
  title: string;
  description: string;
  image_path: string | null;
  category: { id: string; slug: string; name: string } | { id: string; slug: string; name: string }[];
  location: { id: string; code: string; label: string } | { id: string; code: string; label: string }[] | null;
  duration: { id: string; code: string; label: string; min_minutes: number; max_minutes: number | null } | { id: string; code: string; label: string; min_minutes: number; max_minutes: number | null }[] | null;
  budget: { id: string; code: string; label: string; min_yen: number; max_yen: number | null } | { id: string; code: string; label: string; min_yen: number; max_yen: number | null }[] | null;
  min_people: number | null;
  max_people: number | null;
  template_tags: {
    tag: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }[];
}

function toCategory(slug: string): Category {
  switch (slug) {
    case "food":
      return "food";
    case "outing":
      return "outing";
    case "hobby-learning":
    case "hobby":
    case "learning":
      return "hobby";
    case "lifestyle":
      return "home";
    default:
      return "experience";
  }
}

function first<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

function optionalFirst<T>(value: T | T[] | null): T | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toExperience(row: CatalogRow): Experience {
  const category = first(row.category);
  const location = optionalFirst(row.location);
  const duration = optionalFirst(row.duration);
  const budget = optionalFirst(row.budget);
  const tagSlugs = row.template_tags.flatMap(({ tag }) => {
    if (!tag) return [];
    return [first(tag).slug];
  });

  return {
    id: row.slug,
    image: row.image_path ?? undefined,
    title: row.title,
    description: row.description,
    category: toCategory(category.slug),
    categoryId: category.id,
    categoryCode: category.slug,
    categoryLabel: category.name,
    place: location?.label ?? "",
    locationOptionId: location?.id,
    locationCode: location?.code,
    locationLabel: location?.label,
    time: duration?.label ?? "",
    timeMinutes: duration?.max_minutes ?? duration?.min_minutes ?? 0,
    durationOptionId: duration?.id,
    durationCode: duration?.code,
    durationLabel: duration?.label,
    durationMinMinutes: duration?.min_minutes,
    durationMaxMinutes: duration?.max_minutes ?? undefined,
    cost: budget?.label ?? "",
    costLevel: (budget?.max_yen === 0 ? 0 : budget?.max_yen !== null && budget?.max_yen !== undefined && budget.max_yen <= 2000 ? 1 : budget?.max_yen !== null && budget?.max_yen !== undefined ? 2 : budget?.min_yen !== undefined ? 3 : 0) as CostLevel,
    budgetOptionId: budget?.id,
    budgetCode: budget?.code,
    budgetLabel: budget?.label,
    budgetMinYen: budget?.min_yen,
    budgetMaxYen: budget?.max_yen ?? undefined,
    solo: row.min_people === 1 || tagSlugs.includes("solo-ok"),
    minPeople: row.min_people ?? undefined,
    maxPeople: row.max_people ?? undefined,
  };
}

export function useExperienceCatalog() {
  const [experiences, setExperiences] = useState<Experience[]>(fallbackExperiences);
  const [source, setSource] = useState<"fallback" | "supabase">("fallback");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const catalogClient = supabase;

    let active = true;

    async function loadCatalog() {
      const { data, error } = await catalogClient
        .from("templates")
        .select(`
          slug,
          title,
          description,
          image_path,
          category:categories!inner(id, slug, name),
          location:location_options(id, code, label),
          duration:duration_options(id, code, label, min_minutes, max_minutes),
          budget:budget_options(id, code, label, min_yen, max_yen),
          min_people,
          max_people,
          template_tags(tag:tags(slug, name))
        `)
        .eq("publication_status", "published")
        .order("display_order", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Failed to load templates from Supabase:", error);
        return;
      }

      if (!data) return;
      const remoteExperiences = (data as unknown as CatalogRow[]).map(toExperience);
      const collectionTemplates = fallbackExperiences.filter(({ exampleTargets }) => exampleTargets);
      const remoteIds = new Set(remoteExperiences.map(({ id }) => id));
      setExperiences([
        ...remoteExperiences.map((experience) => {
          const collection = collectionTemplates.find((template) => template.id === experience.id);
          return collection ? { ...experience, exampleTargets: collection.exampleTargets } : experience;
        }),
        ...collectionTemplates.filter(({ id }) => !remoteIds.has(id)),
      ]);
      setSource("supabase");
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  return { experiences, source };
}
