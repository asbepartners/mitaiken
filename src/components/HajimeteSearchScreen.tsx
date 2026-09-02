"use client";

import { useMemo, useState } from "react";
import { Experience, experienceCategoryCode, experienceCategoryLabel } from "@/data/experiences";
import { TriedRecord } from "@/hooks/useExperienceStatus";
import type { CategoryOption } from "@/hooks/useSearchMasters";
import { SearchIcon } from "./ExperienceSearchScreen";
import { HajimeteYearFilter } from "./HajimeteYearFilter";

export type HajimeteSearchView = "firsts" | "records";

export interface HajimeteSearchValue {
  query: string;
  categoryCodes: string[];
  view: HajimeteSearchView;
  year: string;
}

interface HajimeteSearchItem {
  experience: Experience;
  records: TriedRecord[];
}

interface HajimeteSearchScreenProps {
  items: HajimeteSearchItem[];
  categories: CategoryOption[];
  value: HajimeteSearchValue;
  onApply: (value: HajimeteSearchValue) => void;
  onClear: (value: HajimeteSearchValue) => void;
  onClose: () => void;
}

function timingSortKey(record: TriedRecord): string {
  const timing = record.timing;
  if (!timing.value || timing.type === "unknown") return "0000-00-00";
  if (timing.type === "year") return `${timing.value}-00-00`;
  if (timing.type === "month") return `${timing.value}-00`;
  return timing.value;
}

function matchesTextAndCategory(
  experience: Experience,
  records: TriedRecord[],
  query: string,
  selectedCategoryCodes: string[]
): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ja");
  const recordText = records
    .map((record) => `${record.place ?? ""} ${record.companion ?? ""} ${record.memo ?? ""}`)
    .join(" ");
  const searchable =
    `${experience.title} ${experience.description} ${experience.place} ${experienceCategoryLabel(experience)} ${recordText}`
      .toLocaleLowerCase("ja");

  return (
    (!normalizedQuery || searchable.includes(normalizedQuery)) &&
    (selectedCategoryCodes.length === 0 || selectedCategoryCodes.includes(experienceCategoryCode(experience)))
  );
}

function firstRecord(records: TriedRecord[]): TriedRecord | undefined {
  return [...records].sort((a, b) => timingSortKey(a).localeCompare(timingSortKey(b)))[0];
}

export function HajimeteSearchScreen({
  items,
  categories,
  value,
  onApply,
  onClear,
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
        if (!matchesTextAndCategory(experience, records, draft.query, draft.categoryCodes)) return false;
        const first = firstRecord(records);
        if (!first) return false;
        const year = first.timing.value?.slice(0, 4);
        return draft.year === "all" || year === draft.year;
      }).length;
    }

    return items.reduce((count, { experience, records }) => {
      if (
        draft.categoryCodes.length > 0 &&
        !draft.categoryCodes.includes(experienceCategoryCode(experience))
      ) {
        return count;
      }

      const normalizedQuery = draft.query.trim().toLocaleLowerCase("ja");

      return (
        count +
        records.filter((record) => {
          const year = record.timing.value?.slice(0, 4);
          const searchable =
            `${experience.title} ${experience.description} ${experience.place} ${experienceCategoryLabel(experience)} ${record.place ?? ""} ${record.companion ?? ""} ${record.memo ?? ""}`
              .toLocaleLowerCase("ja");

          return (
            (!normalizedQuery || searchable.includes(normalizedQuery)) &&
            (draft.year === "all" || year === draft.year)
          );
        }).length
      );
    }, 0);
  }, [draft, items]);

  function setView(view: HajimeteSearchView) {
    setDraft((current) => ({ ...current, view, year: "all" }));
  }

  function toggleCategory(categoryCode: string) {
    setDraft((current) => ({
      ...current,
      categoryCodes: current.categoryCodes.includes(categoryCode)
        ? current.categoryCodes.filter((item) => item !== categoryCode)
        : [...current.categoryCodes, categoryCode],
    }));
  }

  function reset() {
    const cleared: HajimeteSearchValue = {
      query: "",
      categoryCodes: [],
      view: draft.view,
      year: "all",
    };
    setDraft(cleared);
    onClear(cleared);
  }

  const hasConditions =
    Boolean(draft.query.trim()) || draft.categoryCodes.length > 0 || draft.year !== "all";

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
            <p className="text-xs text-ink-soft">いつ・どこで・誰と・何を、まとめて探せます</p>
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
              placeholder="体験・場所・一緒にいた人・メモ…"
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-green-950">カテゴリ</h3>
            <button
              type="button"
              onClick={reset}
              disabled={!hasConditions}
              className="min-h-10 rounded-full border border-green-100 bg-paper px-3 py-2 text-sm font-bold text-green-800 shadow-sm disabled:cursor-default disabled:bg-ivory disabled:text-ink-soft/40 disabled:shadow-none"
            >
              条件をクリア
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ code, label }) => {
              const active = draft.categoryCodes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleCategory(code)}
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
          <HajimeteYearFilter years={years} value={draft.year} onChange={(year) => setDraft((current) => ({ ...current, year }))} />
        </section>

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
