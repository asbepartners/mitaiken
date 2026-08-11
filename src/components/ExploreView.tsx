"use client";

import { useMemo, useState } from "react";
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

  const filtered = useMemo(() => {
    if (category === "all") return experiences;
    return experiences.filter((experience) => experience.category === category);
  }, [category]);

  return (
    <div className="px-4 pb-4 pt-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-wide text-green-950">未体験ゾーン</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          まだ知らない「やってみたい」を見つけよう。
        </p>
      </header>

      <div className="mb-5">
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
        {filtered.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            entry={statusMap[experience.id]}
            onToggleWishlist={onToggleWishlist}
            onRequestMarkTried={onRequestMarkTried}
            onUndoTried={onUndoTried}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft">
          このカテゴリーには、まだ未体験が見つかりませんでした。
        </p>
      )}
    </div>
  );
}
