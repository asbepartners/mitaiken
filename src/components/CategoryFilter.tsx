"use client";

import { CATEGORY_LABELS, CATEGORY_ORDER, Category } from "@/data/experiences";

export type CategoryFilterValue = "all" | Category;

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const options: { key: CategoryFilterValue; label: string }[] = [
    { key: "all", label: "すべて" },
    ...CATEGORY_ORDER.map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category],
    })),
  ];

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
                : "border-green-100 bg-paper text-green-800 hover:border-coral-400"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
