"use client";

import { useMemo, useState } from "react";
import { Experience, experienceCategoryLabel } from "@/data/experiences";
import type { BudgetOption, DurationOption, LocationOption, PeopleSearchOption, SearchMasters } from "@/hooks/useSearchMasters";

export interface ExperienceFilters {
  query: string;
  categoryCodes: string[];
  locationCode: string | null;
  durationCode: string | null;
  budgetCode: string | null;
  peopleCode: string | null;
}

export const EMPTY_EXPERIENCE_FILTERS: ExperienceFilters = {
  query: "", categoryCodes: [], locationCode: null, durationCode: null, budgetCode: null, peopleCode: null,
};

export function countExperienceFilters(filters: ExperienceFilters): number {
  return (filters.query.trim() ? 1 : 0) + filters.categoryCodes.length + (filters.locationCode ? 1 : 0) + (filters.durationCode ? 1 : 0) + (filters.budgetCode ? 1 : 0) + (filters.peopleCode ? 1 : 0);
}

function rangesOverlap(firstMin: number, firstMax: number | null, secondMin: number, secondMax: number | null) {
  return (firstMax === null || firstMax >= secondMin) && (secondMax === null || secondMax >= firstMin);
}

function matchesLocation(experience: Experience, selected: LocationOption | undefined, masters: SearchMasters) {
  if (!selected) return true;
  const experienceLocation = masters.locations.find(({ code }) => code === experience.locationCode);
  if (!experienceLocation) return false;
  if (selected.code === "either") return experienceLocation.code === "either";
  return (selected.supportsHome && experienceLocation.supportsHome) || (selected.supportsOuting && experienceLocation.supportsOuting);
}

function matchesDuration(experience: Experience, selected: DurationOption | undefined) {
  if (!selected) return true;
  if (experience.durationMinMinutes === undefined) return false;
  const queryMin = selected.maxMinutes === null ? selected.minMinutes : 0;
  return rangesOverlap(experience.durationMinMinutes, experience.durationMaxMinutes ?? null, queryMin, selected.maxMinutes);
}

function matchesBudget(experience: Experience, selected: BudgetOption | undefined) {
  if (!selected) return true;
  if (experience.budgetMinYen === undefined) return false;
  const queryMin = selected.maxYen === null ? selected.minYen : 0;
  return rangesOverlap(experience.budgetMinYen, experience.budgetMaxYen ?? null, queryMin, selected.maxYen);
}

function matchesPeople(experience: Experience, selected: PeopleSearchOption | undefined) {
  if (!selected) return true;
  if (experience.minPeople === undefined) return false;
  return rangesOverlap(experience.minPeople, experience.maxPeople ?? null, selected.queryMinPeople, selected.queryMaxPeople);
}

export function matchesExperienceFilters(experience: Experience, filters: ExperienceFilters, masters: SearchMasters): boolean {
  const query = filters.query.trim().toLocaleLowerCase("ja");
  const searchable = `${experience.title} ${experience.description} ${experience.locationLabel ?? experience.place} ${experience.exampleTargets?.join(" ") ?? ""} ${experienceCategoryLabel(experience)}`.toLocaleLowerCase("ja");
  return (!query || searchable.includes(query))
    && (filters.categoryCodes.length === 0 || Boolean(experience.categoryCode && filters.categoryCodes.includes(experience.categoryCode)))
    && matchesLocation(experience, masters.locations.find(({ code }) => code === filters.locationCode), masters)
    && matchesDuration(experience, masters.durations.find(({ code }) => code === filters.durationCode))
    && matchesBudget(experience, masters.budgets.find(({ code }) => code === filters.budgetCode))
    && matchesPeople(experience, masters.people.find(({ code }) => code === filters.peopleCode));
}

interface ExperienceSearchScreenProps {
  title: string;
  items: Experience[];
  value: ExperienceFilters;
  masters: SearchMasters;
  mastersLoading: boolean;
  mastersError: boolean;
  onApply: (filters: ExperienceFilters) => void;
  onClose: () => void;
}

const choiceClass = (active: boolean) => `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-coral-400 bg-coral-400 text-paper shadow-sm" : "border-green-100 bg-paper text-green-800"}`;

export function SearchIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-2`}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

export function ExperienceSearchScreen({ title, items, value, masters, mastersLoading, mastersError, onApply, onClose }: ExperienceSearchScreenProps) {
  const [draft, setDraft] = useState<ExperienceFilters>(value);
  const count = useMemo(() => items.filter((item) => matchesExperienceFilters(item, draft, masters)).length, [draft, items, masters]);
  const toggleCategory = (code: string) => setDraft((current) => ({ ...current, categoryCodes: current.categoryCodes.includes(code) ? current.categoryCodes.filter((item) => item !== code) : [...current.categoryCodes, code] }));
  const selectOne = (key: "locationCode" | "durationCode" | "budgetCode" | "peopleCode", code: string) => setDraft((current) => ({ ...current, [key]: current[key] === code ? null : code }));

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory bg-paper-texture">
    <div className="mx-auto min-h-full w-full max-w-2xl px-4 pb-28">
      <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-green-100 bg-ivory/95 px-4 py-4 backdrop-blur"><button type="button" onClick={onClose} aria-label="検索を閉じる" className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-2xl text-green-950 shadow-sm">←</button><div><h2 className="text-xl font-bold text-green-950">{title}</h2><p className="text-xs text-ink-soft">条件を組み合わせて探せます</p></div></header>
      <div className="mt-5 rounded-2xl border border-green-100 bg-paper px-4 py-3 shadow-sm"><label className="flex items-center gap-2"><SearchIcon className="h-5 w-5 shrink-0 text-green-800" /><input type="search" value={draft.query} onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))} placeholder="陶芸、プラネタリウム…" className="min-w-0 flex-1 bg-transparent py-1 text-base text-ink outline-none [&::-webkit-search-cancel-button]:hidden" />{draft.query && <button type="button" onClick={() => setDraft((current) => ({ ...current, query: "" }))} aria-label="検索語を消す" className="text-xl text-ink-soft">×</button>}</label></div>
      {mastersLoading && masters.categories.length === 0 && <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">検索条件を読み込んでいます…</p>}
      {mastersError && <p className="mt-5 rounded-2xl bg-coral-100 px-4 py-3 text-sm font-medium text-coral-500">検索条件を読み込めませんでした。通信状態を確認して開き直してください。</p>}
      <FilterSection title="カテゴリ">{masters.categories.map((option) => <Choice key={option.code} label={option.label} active={draft.categoryCodes.includes(option.code)} onClick={() => toggleCategory(option.code)} />)}</FilterSection>
      <FilterSection title="場所">{masters.locations.map((option) => <Choice key={option.code} label={option.label} active={draft.locationCode === option.code} onClick={() => selectOne("locationCode", option.code)} />)}</FilterSection>
      <FilterSection title="所要時間">{masters.durations.map((option) => <Choice key={option.code} label={option.label} active={draft.durationCode === option.code} onClick={() => selectOne("durationCode", option.code)} />)}</FilterSection>
      <FilterSection title="ひとりあたりの予算目安">{masters.budgets.map((option) => <Choice key={option.code} label={option.label} active={draft.budgetCode === option.code} onClick={() => selectOne("budgetCode", option.code)} />)}</FilterSection>
      <FilterSection title="人数">{masters.people.map((option) => <Choice key={option.code} label={option.label} active={draft.peopleCode === option.code} onClick={() => selectOne("peopleCode", option.code)} />)}</FilterSection>
      {countExperienceFilters(draft) > 0 && <button type="button" onClick={() => setDraft(EMPTY_EXPERIENCE_FILTERS)} className="mt-7 w-full text-center text-sm font-medium text-ink-soft underline decoration-dotted underline-offset-4">条件をすべてリセット</button>}
    </div>
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button type="button" onClick={() => onApply(draft)} disabled={mastersLoading && masters.categories.length === 0} className="mx-auto block w-full max-w-lg rounded-full bg-coral-500 py-3.5 text-base font-bold text-paper shadow-md transition active:scale-[0.98] disabled:opacity-40">{count}件を見る</button></div>
  </div>;
}

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={choiceClass(active)}>{label}</button>; }
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-6"><h3 className="mb-2 text-sm font-bold text-green-950">{title}</h3><div className="flex flex-wrap gap-2">{children}</div></section>; }
