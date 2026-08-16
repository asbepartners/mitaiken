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
import { BookmarkIcon, NotebookIcon } from "./RecordIcons";

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
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
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
    <div className="px-4 pb-4">
      <header className="relative -mx-4 mb-4 h-40 overflow-hidden border-b border-green-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${assetBase}/header-tried-v1.png`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="やってみた記録を詳しく検索"
          className="absolute left-5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper/95 text-green-900 shadow-md"
        >
          <SearchIcon />
          {countExperienceFilters(filters) > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold leading-5 text-paper">
              {countExperienceFilters(filters)}
            </span>
          )}
        </button>
        <div className="absolute right-5 top-4 max-w-[75%] text-right [text-shadow:0_1px_0_rgba(255,253,247,0.95)]">
          <div className="flex items-center justify-end gap-1.5 text-green-950">
            <h1 className="text-[1.55rem] font-bold tracking-wide">わたしのはじめて帖</h1>
            <NotebookIcon className="h-7 w-7 shrink-0" />
          </div>
          <p className="mt-1 text-sm font-medium text-green-950/80">
            ひとつずつ、経験がつづられていく。
          </p>
        </div>
      </header>

      <div className="mb-4">
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      {items.length > 0 && (
        <p className="mb-3 text-right text-xs font-medium text-ink-soft">
          {filtered.length === items.length
            ? `${items.length}個のはじめて`
            : `${filtered.length}個を表示`}
        </p>
      )}

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
              <span className="mt-0.5 text-coral-500" aria-hidden>
                <BookmarkIcon filled className="h-6 w-6" />
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
