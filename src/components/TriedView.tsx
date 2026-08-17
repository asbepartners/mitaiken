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
import { BookmarkIcon } from "./RecordIcons";

interface TriedItem {
  experience: Experience;
  timing: Timing;
  photoUrl?: string;
}

interface TriedViewProps {
  items: TriedItem[];
  onExplore: () => void;
  onUndo: (id: string) => void;
}

export function TriedView({ items, onExplore, onUndo }: TriedViewProps) {
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
      <header className="relative -mx-4 mb-4 h-48 overflow-hidden border-b border-green-100">
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
            <BookmarkIcon filled className="h-7 w-7 shrink-0 text-coral-500" />
            <h1 className="text-[1.55rem] font-bold tracking-wide">わたしのはじめて帖</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-green-950/80">
            わたしの人生、なかなか楽しい。
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
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-9 text-center shadow-[0_2px_10px_rgba(44,38,32,0.04)]">
          <BookmarkIcon className="mx-auto h-9 w-9 text-coral-500" />
          <h2 className="mt-3 text-lg font-bold text-green-950">
            あなただけの一冊を育てよう
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            小さな「はじめて」を集めると、
            <br />
            ここに楽しかった時間がつづられていきます。
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-5 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-paper shadow-sm transition hover:bg-coral-400 active:scale-95"
          >
            はじめてを探してみる
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center text-sm text-ink-soft">
          条件に合う「やってみた」が見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map(({ experience, timing, photoUrl }) => (
            <li
              key={experience.id}
              className="flex min-h-28 overflow-hidden rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]"
            >
              <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl ?? `${assetBase}${experience.image ?? "/experiences/noimage.svg"}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-green-950">
                    {experience.title}
                  </h2>
                  <BookmarkIcon filled className="h-5 w-5 shrink-0 text-coral-500" />
                </div>
                <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  {CATEGORY_LABELS[experience.category]}
                </span>
                <p className="mt-1 text-xs font-medium text-ink-soft">{formatTiming(timing)}にやってみた</p>
                <button
                  type="button"
                  onClick={() => onUndo(experience.id)}
                  className="mt-1.5 text-[11px] font-medium text-ink-soft underline decoration-dotted underline-offset-4 hover:text-coral-500"
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
