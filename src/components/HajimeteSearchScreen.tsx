"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, Category, Experience } from "@/data/experiences";
import { TriedRecord } from "@/hooks/useExperienceStatus";
import { SearchIcon } from "./ExperienceSearchScreen";

export type HajimeteSearchView = "firsts" | "records";

export interface HajimeteSearchValue {
  query: string;
  categories: Category[];
  view: HajimeteSearchView;
  year: string;
}

interface HajimeteSearchItem {
  experience: Experience;
  records: TriedRecord[];
}

interface HajimeteSearchScreenProps {
  items: HajimeteSearchItem[];
  value: HajimeteSearchValue;
  onApply: (value: HajimeteSearchValue) => void;
  onClose: () => void;
}

const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

function timingSortKey(record: TriedRecord): string {
  const timing = record.timing;
  if (!timing.value || timing.type === "unknown") return "0000-00-00";
  if (timing.type === "year") return `${timing.value}-00-00`;
  if (timing.type === "month") return `${timing.value}-00`;
  return timing.value;
}

function matchesTextAndCategory(
  experience: Experience,
  query: string,
  selectedCategories: Category[]
): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");
  const searchable =
    `${experience.title} ${experience.description} ${experience.place} ${CATEGORY_LABELS[experience.category]}`
      .toLocaleLowerCase("ja");

  return (
    (!normalizedQuery || searchable.includes(normalizedQuery)) &&
    (selectedCategories.length === 0 || selectedCategories.includes(experience.category))
  );
}

function firstRecord(records: TriedRecord[]): TriedRecord | undefined {
  return [...records].sort((a, b) => timingSortKey(a).localeCompare(timingSortKey(b)))[0];
}

export function HajimeteSearchScreen({
  items,
  value,
  onApply,
  onClose,
}: HajimeteSearchScreenProps) {
  const [draft, setDraft] = useState<HajimeteSearchValue>(value);

  const years = useMemo(() => {
    const source =
      draft.view === "firsts"
        ? items.flatMap(({ records }) => {
            const first = firstRecord(records);
            const year = first?.timing.value?.slice(0, 4);
            return year ? [year] : [];
          })
        : items.flatMap(({ records }) =>
            records.flatMap((record) => {
              const year = record.timing.value?.slice(0, 4);
              return year ? [year] : [];
            })
          );

    return Array.from(new Set(source)).sort((a, b) => Number(b) - Number(a));
  }, [draft.view, items]);

  const resultCount = useMemo(() => {
    if (draft.view === "firsts") {
      return items.filter(({ experience, records }) => {
        if (!matchesTextAndCategory(experience, draft.query, draft.categories)) return false;
        const first = firstRecord(records);
        if (!first) return false;
        const year = first.timing.value?.slice(0, 4);
        return draft.year === "all" || year === draft.year;
      }).length;
    }

    return items.reduce((count, { experience, records }) => {
      if (!matchesTextAndCategory(experience, draft.query, draft.categories)) return count;
      return (
        count +
        records.filter((record) => {
          const year = record.timing.value?.slice(0, 4);
          return draft.year === "all" || year === draft.year;
        }).length
      );
    }, 0);
  }, [draft, items]);

  function setView(view: HajimeteSearchView) {
    setDraft((current) => ({ ...current, view, year: "all" }));
  }

  function toggleCategory(category: Category) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  }

  function reset() {
    setDraft({
      query: "",
      categories: [],
      view: draft.view,
      year: "all",
    });
  }

  const hasConditions =
    Boolean(draft.query.trim()) || draft.categories.length > 0 || draft.year !== "all";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory bg-paper-texture">
      <div className="mx-auto min-h-full w-full max-w-2xl px-4 pb-32">
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
            <h2 className="text-xl font-bold text-green-950">はじめて帖を探す</h2>
            <p className="text-xs text-ink-soft">過去のはじめてや記録を振り返れます</p>
          </div>
        </header>

        <div className="mt-5 rounded-2xl border border-green-100 bg-paper px-4 py-3 shadow-sm">
          <label className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 shrink-0 text-green-800" />
            <input
              type="search"
              value={draft.query}
              onChange={(event) =>
                setDraft((current) => ({ ...current, query: event.target.value }))
              }
              placeholder="陶芸、喫茶店、旅行…"
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

        <section className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-green-950">どちらで見る？</h3>
          <div className="grid grid-cols-2 rounded-2xl border border-green-100 bg-paper p-1">
            <button
              type="button"
              onClick={() => setView("firsts")}
              className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
                draft.view === "firsts"
                  ? "bg-coral-100 text-coral-500 shadow-sm"
                  : "text-ink-soft"
              }`}
            >
              はじめて
            </button>
            <button
              type="button"
              onClick={() => setView("records")}
              className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
                draft.view === "records"
                  ? "bg-coral-100 text-coral-500 shadow-sm"
                  : "text-ink-soft"
              }`}
            >
              記録
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
            {draft.view === "firsts"
              ? "体験ごとに1つ。「何をはじめてきたか」を探します。"
              : "一回一回の記録から、思い出を探します。"}
          </p>
        </section>

        <section className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-green-950">カテゴリ</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(([category, label]) => {
              const active = draft.categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
                      : "border-green-100 bg-paper text-green-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-green-950">
            {draft.view === "firsts" ? "はじめて年" : "記録年"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {["all", ...years].map((year) => {
              const active = draft.year === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, year }))}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
                      : "border-green-100 bg-paper text-green-800"
                  }`}
                >
                  {year === "all" ? "すべて" : `${year}年`}
                </button>
              );
            })}
          </div>
        </section>

        {hasConditions && (
          <button
            type="button"
            onClick={reset}
            className="mt-7 w-full text-center text-sm font-medium text-ink-soft underline decoration-dotted underline-offset-4"
          >
            検索条件をリセット
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="mx-auto block w-full max-w-lg rounded-full bg-coral-500 py-3.5 text-base font-bold text-paper shadow-md transition active:scale-[0.98]"
        >
          {draft.view === "firsts"
            ? `${resultCount}個のはじめてを見る`
            : `${resultCount}件の記録を見る`}
        </button>
      </div>
    </div>
  );
}
