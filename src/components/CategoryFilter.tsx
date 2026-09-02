"use client";

import type { CategoryOption } from "@/hooks/useSearchMasters";

export type CategoryFilterValue = "all" | string;

interface CategoryFilterProps {
  value: CategoryFilterValue;
  categories: CategoryOption[];
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({ value, categories, onChange }: CategoryFilterProps) {
  const options = [{ code: "all", label: "すべて" }, ...categories];
  return <div className="flex flex-wrap gap-1.5 pb-1">{options.map((option) => {
    const isActive = value === option.code;
    return <button key={option.code} type="button" onClick={() => onChange(option.code)} className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${isActive ? "border-coral-400 bg-coral-400 text-paper shadow-sm" : "border-green-100 bg-paper text-green-800 hover:border-coral-400"}`}>{option.label}</button>;
  })}</div>;
}
