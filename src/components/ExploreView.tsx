"use client";

import { useMemo, useRef, useState } from "react";
import type { Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";
import { ExperienceCard } from "./ExperienceCard";

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
  const [query, setQuery] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    return items.filter((experience) => {
      if (statusMap[experience.id]) return false;
      const matchesCategory =
        category === "all" ||
        (category === "home"
          ? experience.place.includes("自宅")
          : experience.category === category);
      const searchable = `${experience.title} ${experience.description} ${experience.place}`.toLocaleLowerCase("ja");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, items, query, statusMap]);

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
        <img src={`${process.env.NODE_ENV === "production" ? "/mitaiken" : ""}/header-explore.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between px-5 py-4">
          <div>
            <h1 className="text-[1.7rem] font-bold tracking-wide text-green-950">わたしのはじめて帖</h1>
            <p className="mt-1 text-sm font-medium text-ink-soft">まだ知らない「やってみたい」を見つけよう。</p>
          </div>
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="体験を検索" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper/95 text-green-900 shadow-md">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
          </button>
        </div>
        {searchOpen && (
          <div className="absolute inset-x-4 top-4 flex items-center gap-2 rounded-full bg-paper p-2 shadow-lg">
            <button type="button" onClick={() => { setSearchOpen(false); setQuery(""); }} aria-label="検索を閉じる" className="h-9 w-9 text-xl">←</button>
            <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setCurrentIndex(0); carouselRef.current?.scrollTo({ left: 0 }); }} placeholder="陶芸、プラネタリウム…" className="min-w-0 flex-1 bg-transparent px-1 text-base text-ink outline-none" />
            {query && <button type="button" onClick={() => setQuery("")} className="h-9 w-9 text-xl" aria-label="検索語を消す">×</button>}
          </div>
        )}
      </header>

      <div className="mb-4">
        <CategoryFilter value={category} onChange={handleCategoryChange} />
      </div>

      {filtered.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-center px-1 text-sm font-medium text-ink-soft">
            <span aria-live="polite">{currentIndex + 1} / {filtered.length}</span>
          </div>

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
    </div>
  );
}
