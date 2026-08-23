"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import { Timing } from "@/lib/timing";
import {
  countExperienceFilters,
  EMPTY_EXPERIENCE_FILTERS,
  ExperienceFilters,
  ExperienceSearchScreen,
  matchesExperienceFilters,
  SearchIcon,
} from "./ExperienceSearchScreen";
import { BookmarkIcon, CrownIcon } from "./RecordIcons";

interface TriedItem {
  experience: Experience;
  timing: Timing;
  photoUrl?: string;
  memo?: string;
}

interface TriedViewProps {
  items: TriedItem[];
  wishlistCount: number;
  onExplore: () => void;
  onOpenWishlist: () => void;
  onEdit: (id: string) => void;
  onUndo: (id: string) => void;
}

function formatTimelineTiming(timing: Timing): string {
  if (!timing.value || timing.type === "unknown") return "もっと\n以前";
  const [year, month, day] = timing.value.split("-");
  if (timing.type === "date" && month && day) return `${year}\n${Number(month)}.${Number(day)}`;
  if (timing.type === "month" && month) return `${year}\n${Number(month)}月`;
  return year;
}

export function TriedView({
  items,
  wishlistCount,
  onExplore,
  onOpenWishlist,
  onEdit,
  onUndo,
}: TriedViewProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<ExperienceFilters>(EMPTY_EXPERIENCE_FILTERS);
  const experiences = useMemo(() => items.map((item) => item.experience), [items]);
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const currentYear = String(new Date().getFullYear());
  const currentYearCount = items.filter(({ timing }) => timing.value?.startsWith(currentYear)).length;
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          items.flatMap(({ timing }) => {
            const year = timing.value?.slice(0, 4);
            return year ? [year] : [];
          })
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [items]
  );
  const hasUnknownYear = items.some(({ timing }) => !timing.value);
  const filtered = useMemo(
    () =>
      items
        .filter(({ experience, timing }) => {
          const year = timing.value?.slice(0, 4);
          const matchesYear =
            selectedYear === "all" ||
            (selectedYear === "unknown" ? !year : year === selectedYear);
          return matchesYear && matchesExperienceFilters(experience, filters);
        })
        .sort((a, b) => (b.timing.value ?? "").localeCompare(a.timing.value ?? "")),
    [filters, items, selectedYear]
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
            「楽しかった」を、ひとつずつ。
          </p>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-3 overflow-hidden rounded-3xl border border-green-100 bg-paper/80 px-2 py-3 shadow-[0_2px_12px_rgba(44,38,32,0.05)]">
        <div className="px-1 text-center">
          <p className="text-[10px] font-bold leading-snug text-ink-soft">これまでの<br />はじめて</p>
          <p className="mt-1 text-2xl font-bold leading-none text-green-800">
            {items.length}<span className="ml-1 text-[10px] font-normal text-ink-soft">個</span>
          </p>
        </div>
        <div className="border-x border-green-100 px-1 text-center">
          <p className="text-[10px] font-bold leading-snug text-ink-soft">今年の<br />はじめて</p>
          <p className="mt-1 text-2xl font-bold leading-none text-green-800">
            {currentYearCount}<span className="ml-1 text-[10px] font-normal text-ink-soft">個</span>
          </p>
        </div>
        <div className="px-1 text-center">
          <p className="text-[10px] font-bold leading-snug text-ink-soft">これからの<br />楽しみ</p>
          <p className="mt-1 text-2xl font-bold leading-none text-green-800">
            {wishlistCount}<span className="ml-1 text-[10px] font-normal text-ink-soft">個</span>
          </p>
        </div>
      </section>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", ...years, ...(hasUnknownYear ? ["unknown"] : [])].map((year) => {
          const isActive = selectedYear === year;
          return (
            <button
              key={year}
              type="button"
              onClick={() => {
                setSelectedYear(year);
                setOpenMenuId(null);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
                  : "border-green-100 bg-paper text-green-800"
              }`}
            >
              {year === "all" ? "すべて" : year === "unknown" ? "もっと以前" : `${year}年`}
            </button>
          );
        })}
      </div>

      {items.length > 0 && (
        <p className="mb-3 text-right text-xs font-medium text-ink-soft">
          {filtered.length === items.length ? `${items.length}個のはじめて` : `${filtered.length}個を表示`}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-9 text-center shadow-[0_2px_10px_rgba(44,38,32,0.04)]">
          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            <span className="text-xs text-[#d39a2c]">✦</span>
            <BookmarkIcon className="h-9 w-9 text-coral-500" />
            <span className="-mt-4 text-xs text-[#d39a2c]">✦</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-green-950">
            {wishlistCount > 0 ? "あなたの「やってみたい」が待っています。" : "まだ知らない「楽しかった」が待っています。"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {wishlistCount > 0
              ? "最初のひとつを、「やってみた」にしませんか？"
              : "まずは「やってみたい」を、探しにいきませんか？"}
          </p>
          <button
            type="button"
            onClick={wishlistCount > 0 ? onOpenWishlist : onExplore}
            className="mt-5 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-paper shadow-sm transition hover:bg-coral-400 active:scale-95"
          >
            {wishlistCount > 0 ? "やってみたいを見にいく" : "はじめてを探しにいく"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center text-sm text-ink-soft">
          条件に合う「やってみた」が見つかりませんでした。
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map(({ experience, timing, photoUrl, memo }, index) => (
            <li key={experience.id} className="flex gap-3">
              <div className="relative flex w-12 shrink-0 items-start justify-end pr-3 pt-4 text-right">
                <p className="whitespace-pre-line text-[11px] font-bold leading-tight text-green-950">
                  {formatTimelineTiming(timing)}
                </p>
                <span
                  className={`absolute right-0 w-px bg-green-100 ${
                    index === 0 ? "top-4" : "top-0"
                  } ${index === filtered.length - 1 ? "bottom-1/2" : "bottom-[-0.625rem]"}`}
                  aria-hidden="true"
                />
              </div>
              <div className="flex h-32 min-w-0 flex-1 overflow-hidden rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]">
                <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl ?? `${assetBase}${experience.image ?? "/experiences/noimage.svg"}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="relative min-w-0 flex-1 px-3 py-2.5">
                  <CrownIcon className="absolute right-2.5 top-2.5 h-6 w-6 text-[#d39a2c]" />
                  <h2 className="line-clamp-2 pr-7 text-[15px] font-bold leading-snug text-green-950">
                    {experience.title}
                  </h2>
                  {memo && (
                    <p className="mt-1 line-clamp-1 pr-7 text-[11px] leading-snug text-ink-soft">
                      {memo}
                    </p>
                  )}
                  <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                    {CATEGORY_LABELS[experience.category]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenMenuId((current) => current === experience.id ? null : experience.id)}
                    aria-label={`${experience.title}のメニュー`}
                    aria-expanded={openMenuId === experience.id}
                    className="absolute bottom-1.5 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ivory-deep text-sm font-bold leading-none text-ink-soft"
                  >
                    …
                  </button>
                  {openMenuId === experience.id && (
                    <div className="absolute bottom-1.5 right-9 z-10 flex overflow-hidden rounded-xl border border-green-100 bg-paper p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(experience.id);
                          setOpenMenuId(null);
                        }}
                        className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium text-green-800 hover:bg-green-100"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUndo(experience.id);
                          setOpenMenuId(null);
                        }}
                        className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium text-coral-500 hover:bg-coral-100"
                      >
                        記録を取り消す
                      </button>
                    </div>
                  )}
                </div>
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
            setSelectedYear("all");
            setOpenMenuId(null);
            setSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}
