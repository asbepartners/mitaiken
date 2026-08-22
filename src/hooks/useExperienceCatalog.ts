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
  category: { slug: string; name: string } | { slug: string; name: string }[];
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

function toExperience(row: CatalogRow): Experience {
  const category = first(row.category);
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
    place: "",
    time: "",
    timeMinutes: 0,
    cost: "",
    costLevel: 0 as CostLevel,
    solo: tagSlugs.includes("solo-ok"),
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
          category:categories!inner(slug, name),
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
      setExperiences((data as unknown as CatalogRow[]).map(toExperience));
      setSource("supabase");
    }

    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  return { experiences, source };
}
