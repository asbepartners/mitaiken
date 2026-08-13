"use client";

import { useMemo, useRef, useState } from "react";
import { experiences } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";
import { ExperienceCard } from "./ExperienceCard";

interface ExploreViewProps {
  statusMap: Record<string, StatusEntry>;
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExploreView({
  statusMap,
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExploreViewProps) {
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (category === "all") return experiences;
    return experiences.filter((experience) => experience.category === category);
  }, [category]);

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
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-wide text-green-950">未体験ゾーン</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          まだ知らない「やってみたい」を見つけよう。
        </p>
      </header>

      <div className="mb-5">
        <CategoryFilter value={category} onChange={handleCategoryChange} />
      </div>

      {filtered.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium text-ink-soft">
            <button
              type="button"
              onClick={() => scrollToCard(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="rounded-full px-3 py-1.5 disabled:opacity-25"
              aria-label="前の未体験を見る"
            >
              ← 前へ
            </button>
            <span aria-live="polite">{currentIndex + 1} / {filtered.length}</span>
            <button
              type="button"
              onClick={() => scrollToCard(currentIndex + 1)}
              disabled={currentIndex === filtered.length - 1}
              className="rounded-full px-3 py-1.5 disabled:opacity-25"
              aria-label="次の未体験を見る"
            >
              次へ →
            </button>
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
          このカテゴリーには、まだ未体験が見つかりませんでした。
        </p>
      )}
    </div>
  );
}
