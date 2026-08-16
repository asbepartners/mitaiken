"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABELS,
  Category,
  CostLevel,
  Experience,
} from "@/data/experiences";

export interface ExperienceFilters {
  query: string;
  categories: Category[];
  maxCostLevel: CostLevel | null;
  maxTimeMinutes: number | null;
  soloOnly: boolean;
  homeOnly: boolean;
}

export const EMPTY_EXPERIENCE_FILTERS: ExperienceFilters = {
  query: "",
  categories: [],
  maxCostLevel: null,
  maxTimeMinutes: null,
  soloOnly: false,
  homeOnly: false,
};

export function countExperienceFilters(filters: ExperienceFilters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.categories.length +
    (filters.maxCostLevel === null ? 0 : 1) +
    (filters.maxTimeMinutes === null ? 0 : 1) +
    (filters.soloOnly ? 1 : 0) +
    (filters.homeOnly ? 1 : 0)
  );
}

export function matchesExperienceFilters(
  experience: Experience,
  filters: ExperienceFilters
): boolean {
  const query = filters.query.trim().toLocaleLowerCase("ja");
  const searchable =
    `${experience.title} ${experience.description} ${experience.place} ${CATEGORY_LABELS[experience.category]}`
      .toLocaleLowerCase("ja");

  return (
    (!query || searchable.includes(query)) &&
    (filters.categories.length === 0 || filters.categories.includes(experience.category)) &&
    (filters.maxCostLevel === null || experience.costLevel <= filters.maxCostLevel) &&
    (filters.maxTimeMinutes === null || experience.timeMinutes <= filters.maxTimeMinutes) &&
    (!filters.soloOnly || experience.solo) &&
    (!filters.homeOnly || experience.place.includes("自宅"))
  );
}

interface ExperienceSearchScreenProps {
  title: string;
  items: Experience[];
  value: ExperienceFilters;
  onApply: (filters: ExperienceFilters) => void;
  onClose: () => void;
}

const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];
const budgetOptions: { label: string; value: CostLevel }[] = [
  { label: "無料", value: 0 },
  { label: "2,000円以内", value: 1 },
  { label: "5,000円以内", value: 2 },
];
const timeOptions = [
  { label: "1時間以内", value: 60 },
  { label: "2時間以内", value: 120 },
  { label: "半日以内", value: 240 },
];

const choiceClass = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
      : "border-green-100 bg-paper text-green-800"
  }`;

export function SearchIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-2`}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function ExperienceSearchScreen({
  title,
  items,
  value,
  onApply,
  onClose,
}: ExperienceSearchScreenProps) {
  const [draft, setDraft] = useState<ExperienceFilters>(value);
  const count = useMemo(
    () => items.filter((item) => matchesExperienceFilters(item, draft)).length,
    [draft, items]
  );

  function toggleCategory(category: Category) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory bg-paper-texture">
      <div className="mx-auto min-h-full w-full max-w-2xl px-4 pb-28">
        <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-green-100 bg-ivory/95 px-4 py-4 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            aria-label="検索を閉じる"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-2xl text-green-950 shadow-sm"
          >
            ←
          </button>
          <div>
            <h2 className="text-xl font-bold text-green-950">{title}</h2>
            <p className="text-xs text-ink-soft">条件を組み合わせて探せます</p>
          </div>
        </header>

        <div className="mt-5 rounded-2xl border border-green-100 bg-paper px-4 py-3 shadow-sm">
          <label className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 shrink-0 text-green-800" />
            <input
              type="search"
              value={draft.query}
              onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
              placeholder="陶芸、プラネタリウム…"
              className="min-w-0 flex-1 bg-transparent py-1 text-base text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {draft.query && (
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, query: "" }))}
                aria-label="検索語を消す"
                className="text-xl text-ink-soft"
              >
                ×
              </button>
            )}
          </label>
        </div>

        <FilterSection title="カテゴリ">
          {categories.map(([category, label]) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={choiceClass(draft.categories.includes(category))}
            >
              {label}
            </button>
          ))}
        </FilterSection>

        <FilterSection title="予算">
          {budgetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  maxCostLevel: current.maxCostLevel === option.value ? null : option.value,
                }))
              }
              className={choiceClass(draft.maxCostLevel === option.value)}
            >
              {option.label}
            </button>
          ))}
        </FilterSection>

        <FilterSection title="所要時間">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  maxTimeMinutes: current.maxTimeMinutes === option.value ? null : option.value,
                }))
              }
              className={choiceClass(draft.maxTimeMinutes === option.value)}
            >
              {option.label}
            </button>
          ))}
        </FilterSection>

        <FilterSection title="過ごし方">
          <button
            type="button"
            onClick={() => setDraft((current) => ({ ...current, soloOnly: !current.soloOnly }))}
            className={choiceClass(draft.soloOnly)}
          >
            ひとりOK
          </button>
          <button
            type="button"
            onClick={() => setDraft((current) => ({ ...current, homeOnly: !current.homeOnly }))}
            className={choiceClass(draft.homeOnly)}
          >
            家でできる
          </button>
        </FilterSection>

        {countExperienceFilters(draft) > 0 && (
          <button
            type="button"
            onClick={() => setDraft(EMPTY_EXPERIENCE_FILTERS)}
            className="mt-7 w-full text-center text-sm font-medium text-ink-soft underline decoration-dotted underline-offset-4"
          >
            条件をすべてリセット
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="mx-auto block w-full max-w-lg rounded-full bg-coral-500 py-3.5 text-base font-bold text-paper shadow-md transition active:scale-[0.98]"
        >
          {count}件を見る
        </button>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-bold text-green-950">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
