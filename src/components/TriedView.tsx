"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import { Timing, formatTiming } from "@/lib/timing";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";
import {
  countExperienceFilters,
  EMPTY_EXPERIENCE_FILTERS,
  ExperienceFilters,
  ExperienceSearchScreen,
  matchesExperienceFilters,
  SearchIcon,
} from "./ExperienceSearchScreen";

interface TriedItem {
  experience: Experience;
  timing: Timing;
}

interface TriedViewProps {
  items: TriedItem[];
  onUndo: (id: string) => void;
}

export function TriedView({ items, onUndo }: TriedViewProps) {
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<ExperienceFilters>(EMPTY_EXPERIENCE_FILTERS);
  const experiences = useMemo(() => items.map((item) => item.experience), [items]);
  const filtered = useMemo(
    () =>
      items.filter(({ experience }) => {
        const matchesCategory =
          category === "all" ||
          (category === "home"
            ? experience.place.includes("自宅")
            : experience.category === category);
        return matchesCategory && matchesExperienceFilters(experience, filters);
      }),
    [category, filters, items]
  );

  return (
    <div className="px-4 pb-4 pt-6">
      <header className="mb-5 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-green-100 text-green-800">
          <span className="text-xl font-bold leading-none">{items.length}</span>
          <span className="text-[10px] leading-none">個</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-950">やってみた！</h1>
          <p className="mt-1 text-sm text-ink-soft">{items.length}個、やってみました。</p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="やってみた記録を詳しく検索"
          className="relative ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-green-900 shadow-md"
        >
          <SearchIcon />
          {countExperienceFilters(filters) > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold leading-5 text-paper">
              {countExperienceFilters(filters)}
            </span>
          )}
        </button>
      </header>

      <div className="mb-4">
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center">
          <p className="text-2xl" aria-hidden>
            🎉
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            未体験をやってみたら
            <br />
            ここに冒険の記録が増えていきます。
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center text-sm text-ink-soft">
          条件に合う「やってみた」が見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map(({ experience, timing }) => (
            <li
              key={experience.id}
              className="flex items-start gap-3 rounded-3xl border border-green-100 bg-paper p-4 shadow-[0_2px_10px_rgba(44,38,32,0.06)]"
            >
              <span className="mt-0.5 text-lg" aria-hidden>
                🎉
              </span>
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-medium text-green-800">
                  {CATEGORY_LABELS[experience.category]}
                </span>
                <h2 className="mt-2 text-base font-bold text-green-950">{experience.title}</h2>
                <p className="mt-1 text-xs text-ink-soft">{formatTiming(timing)}にやってみた</p>
                <button
                  type="button"
                  onClick={() => onUndo(experience.id)}
                  className="mt-2 text-xs font-medium text-ink-soft underline decoration-dotted underline-offset-4 hover:text-coral-500"
                >
                  やってみたことを取り消す
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {searchOpen && (
        <ExperienceSearchScreen
          title="やってみた記録を探す"
          items={experiences}
          value={filters}
          onClose={() => setSearchOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setCategory("all");
            setSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}
