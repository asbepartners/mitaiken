"use client";

import { useMemo, useRef, useState } from "react";
import type { Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";
import { ExperienceCard } from "./ExperienceCard";
import {
  countExperienceFilters,
  EMPTY_EXPERIENCE_FILTERS,
  ExperienceFilters,
  ExperienceSearchScreen,
  matchesExperienceFilters,
  SearchIcon,
} from "./ExperienceSearchScreen";

interface ExploreViewProps {
  items: Experience[];
  statusMap: Record<string, StatusEntry>;
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExploreView({
  items,
  statusMap,
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExploreViewProps) {
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<ExperienceFilters>(EMPTY_EXPERIENCE_FILTERS);
  const carouselRef = useRef<HTMLDivElement>(null);

  const searchableItems = useMemo(
    () => items.filter((experience) => !statusMap[experience.id]),
    [items, statusMap]
  );

  const filtered = useMemo(() => {
    return searchableItems.filter((experience) => {
      const matchesCategory =
        category === "all" ||
        (category === "home"
          ? experience.place.includes("自宅")
          : experience.category === category);
      return matchesCategory && matchesExperienceFilters(experience, filters);
    });
  }, [category, filters, searchableItems]);

  function handleCategoryChange(nextCategory: CategoryFilterValue) {
    setCategory(nextCategory);
    setCurrentIndex(0);
    carouselRef.current?.scrollTo({ left: 0 });
  }

  function scrollToCard(index: number) {
    const carousel = carouselRef.current;
    const card = carousel?.children[index] as HTMLElement | undefined;
    if (!carousel || !card) return;
    carousel.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }

  function handleScroll() {
    const carousel = carouselRef.current;
    if (!carousel || carousel.children.length === 0) return;

    const nearestIndex = Array.from(carousel.children).reduce((nearest, child, index) => {
      const nearestChild = carousel.children[nearest] as HTMLElement;
      const currentChild = child as HTMLElement;
      return Math.abs(currentChild.offsetLeft - carousel.scrollLeft) <
        Math.abs(nearestChild.offsetLeft - carousel.scrollLeft)
        ? index
        : nearest;
    }, 0);
    setCurrentIndex(nearestIndex);
  }

  return (
    <div className="px-4 pb-4 pt-6">
      <header className="relative -mx-4 -mt-6 mb-4 h-48 overflow-hidden border-b border-green-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${process.env.NODE_ENV === "production" ? "/mitaiken" : ""}/header-explore-v4.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-5 py-4">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="体験を詳しく検索" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper/95 text-green-900 shadow-md">
            <SearchIcon />
            {countExperienceFilters(filters) > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold leading-5 text-paper">
                {countExperienceFilters(filters)}
              </span>
            )}
          </button>
          <div className="min-w-0 text-right [text-shadow:0_1px_0_rgba(255,253,247,0.95)]">
            <div className="flex items-center justify-end gap-1.5">
              <h1 className="text-[1.7rem] font-bold tracking-wide text-green-950">わたしのはじめて帖</h1>
              <span aria-hidden="true" className="-mt-4 text-sm text-[#d39a2c]">✦</span>
            </div>
            <p className="mt-1 text-sm font-medium text-green-950/80">まだ知らない「やってみたい」を見つけよう。</p>
          </div>
        </div>
      </header>

      <div className="mb-4">
        <CategoryFilter value={category} onChange={handleCategoryChange} />
      </div>

      {filtered.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-center px-1 text-sm font-medium text-ink-soft">
            <span aria-live="polite">{currentIndex + 1} / {filtered.length}</span>
          </div>

          <div className="group/carousel relative">
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {filtered.map((experience) => (
                <div key={experience.id} className="w-full shrink-0 snap-center">
                  <ExperienceCard
                    experience={experience}
                    entry={statusMap[experience.id]}
                    variant="featured"
                    onNext={currentIndex < filtered.length - 1 ? () => scrollToCard(currentIndex + 1) : undefined}
                    onToggleWishlist={onToggleWishlist}
                    onRequestMarkTried={onRequestMarkTried}
                    onUndoTried={onUndoTried}
                  />
                </div>
              ))}
            </div>

            {currentIndex > 0 && (
              <button
                type="button"
                onClick={() => scrollToCard(currentIndex - 1)}
                aria-label="前の未体験へ"
                className="absolute left-1 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 pb-1 text-4xl font-light leading-none text-green-950 opacity-0 shadow-lg transition hover:scale-105 focus-visible:opacity-100 md:flex md:group-hover/carousel:opacity-100"
              >
                ‹
              </button>
            )}
            {currentIndex < filtered.length - 1 && (
              <button
                type="button"
                onClick={() => scrollToCard(currentIndex + 1)}
                aria-label="次の未体験へ"
                className="absolute right-1 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 pb-1 text-4xl font-light leading-none text-green-950 opacity-0 shadow-lg transition hover:scale-105 focus-visible:opacity-100 md:flex md:group-hover/carousel:opacity-100"
              >
                ›
              </button>
            )}
          </div>

          <p className="mt-1 text-center text-xs font-medium text-ink-soft">
            カードを左右にスワイプして探せます
          </p>
        </>
      )}

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          条件に合う未体験が見つかりませんでした。
        </p>
      )}

      {searchOpen && (
        <ExperienceSearchScreen
          title="未体験を探す"
          items={searchableItems}
          value={filters}
          onClose={() => setSearchOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setCategory("all");
            setCurrentIndex(0);
            carouselRef.current?.scrollTo({ left: 0 });
            setSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}
