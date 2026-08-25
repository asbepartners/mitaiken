"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import { TriedRecord } from "@/hooks/useExperienceStatus";
import { Timing } from "@/lib/timing";
import { SearchIcon } from "./ExperienceSearchScreen";
import {
  HajimeteSearchScreen,
  HajimeteSearchValue,
} from "./HajimeteSearchScreen";
import { BookmarkIcon, CrownIcon } from "./RecordIcons";
import { CollectionDetailView } from "./CollectionDetailView";
import type { ExperienceTarget, ExperienceTargetDraft, TargetsMap } from "@/hooks/useExperienceTargets";

export interface TriedExperience {
  experience: Experience;
  records: TriedRecord[];
}

interface TriedViewProps {
  items: TriedExperience[];
  wishlistCount: number;
  onExplore: () => void;
  onOpenWishlist: () => void;
  onAddRecord: (experienceId: string) => void;
  onEditRecord: (experienceId: string, recordId: string) => void;
  onDeleteRecord: (experienceId: string, recordId: string) => void;
  onAddTarget: (experienceId: string, draft: ExperienceTargetDraft) => boolean;
  onUpdateTarget: (experienceId: string, id: string, draft: ExperienceTargetDraft) => boolean;
  onRemoveTarget: (experienceId: string, id: string) => void;
  targetsMap: TargetsMap;
  onRequestTargetRecord: (experienceId: string, target: ExperienceTarget) => void;
}

type ViewMode = "firsts" | "records";

function timingSortKey(timing: Timing): string {
  if (!timing.value || timing.type === "unknown") return "0000-00-00";
  if (timing.type === "year") return `${timing.value}-00-00`;
  if (timing.type === "month") return `${timing.value}-00`;
  return timing.value;
}

function formatTimelineTiming(timing: Timing): string {
  if (!timing.value || timing.type === "unknown") return "もっと\n以前";
  const [year, month, day] = timing.value.split("-");
  if (timing.type === "date" && month && day) {
    return `${year}\n${Number(month)}.${Number(day)}`;
  }
  if (timing.type === "month" && month) return `${year}\n${Number(month)}月`;
  return year;
}


function matchesHajimeteSearch(
  experience: Experience,
  records: TriedRecord[],
  searchValue: HajimeteSearchValue
): boolean {
  const query = searchValue.query.trim().toLocaleLowerCase("ja");
  const recordText = records
    .map((record) => `${record.place ?? ""} ${record.companion ?? ""} ${record.memo ?? ""}`)
    .join(" ");
  const searchable =
    `${experience.title} ${experience.description} ${experience.place} ${CATEGORY_LABELS[experience.category]} ${recordText}`
      .toLocaleLowerCase("ja");

  return (
    (!query || searchable.includes(query)) &&
    (searchValue.categories.length === 0 ||
      searchValue.categories.includes(experience.category))
  );
}

export function TriedView({
  items,
  wishlistCount,
  onExplore,
  onOpenWishlist,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onAddTarget,
  targetsMap,
  onRequestTargetRecord,
  onUpdateTarget,
  onRemoveTarget,
}: TriedViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("firsts");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [detailReturnView, setDetailReturnView] = useState<ViewMode>("firsts");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<HajimeteSearchValue>({
    query: "",
    categories: [],
    view: "firsts",
    year: "all",
  });
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const currentYear = String(new Date().getFullYear());
  const selectedExperience = items.find(({ experience }) => experience.id === selectedExperienceId)?.experience;

  const firstItems = useMemo(
    () =>
      items.flatMap((item) => {
        const sorted = [...item.records].sort((a, b) =>
          timingSortKey(a.timing).localeCompare(timingSortKey(b.timing))
        );
        const first = sorted[0];
        const latest = sorted[sorted.length - 1];
        return first ? [{ ...item, first, latest }] : [];
      }),
    [items]
  );

  const recordItems = useMemo(
    () =>
      items.flatMap(({ experience, records }) =>
        records.map((record) => ({ experience, record }))
      ),
    [items]
  );

  const currentYearCount = firstItems.filter(({ first }) =>
    first.timing.value?.startsWith(currentYear)
  ).length;

  const years = useMemo(() => {
    const source =
      viewMode === "firsts"
        ? firstItems.map(({ first }) => first.timing.value?.slice(0, 4))
        : recordItems.map(({ record }) => record.timing.value?.slice(0, 4));
    return Array.from(new Set(source.filter((year): year is string => Boolean(year)))).sort(
      (a, b) => Number(b) - Number(a)
    );
  }, [firstItems, recordItems, viewMode]);

  const filteredFirstItems = useMemo(
    () =>
      firstItems
        .filter(({ experience, first, records }) => {
          const year = first.timing.value?.slice(0, 4);
          return (
            matchesHajimeteSearch(experience, records, searchValue) &&
            (selectedYear === "all" || year === selectedYear)
          );
        })
        .sort((a, b) =>
          timingSortKey(b.first.timing).localeCompare(timingSortKey(a.first.timing))
        ),
    [firstItems, searchValue, selectedYear]
  );

  const filteredRecordItems = useMemo(
    () =>
      recordItems
        .filter(({ experience, record }) => {
          const year = record.timing.value?.slice(0, 4);
          const query = searchValue.query.trim().toLocaleLowerCase("ja");
          const searchable =
            `${experience.title} ${experience.description} ${experience.place} ${CATEGORY_LABELS[experience.category]} ${record.place ?? ""} ${record.companion ?? ""} ${record.memo ?? ""}`
              .toLocaleLowerCase("ja");
          return (
            (!query || searchable.includes(query)) &&
            (searchValue.categories.length === 0 ||
              searchValue.categories.includes(experience.category)) &&
            (!selectedExperienceId || experience.id === selectedExperienceId) &&
            (selectedExperienceId || selectedYear === "all" || year === selectedYear)
          );
        })
        .sort((a, b) =>
          timingSortKey(b.record.timing).localeCompare(timingSortKey(a.record.timing))
        ),
    [recordItems, searchValue, selectedExperienceId, selectedYear]
  );

  function changeView(next: ViewMode) {
    setViewMode(next);
    setSelectedYear("all");
    setSearchValue((current) => ({ ...current, view: next, year: "all" }));
    setOpenMenuId(null);
    if (next === "firsts") setSelectedExperienceId(null);
  }

  function openExperience(experienceId: string) {
    setDetailReturnView(viewMode);
    setSelectedExperienceId(experienceId);
    setViewMode("records");
    setOpenMenuId(null);
  }

  function closeExperienceDetail() {
    setSelectedExperienceId(null);
    setViewMode(detailReturnView);
    setOpenMenuId(null);
  }

  if (selectedExperience && selectedExperienceId) {
    const selectedRecords = items.find(({ experience }) => experience.id === selectedExperienceId)?.records ?? [];
    return <CollectionDetailView experience={selectedExperience} targets={targetsMap[selectedExperienceId] ?? []} records={selectedRecords} onBack={closeExperienceDetail} backLabel="はじめての一覧に戻る" onMarkTried={(target) => onRequestTargetRecord(selectedExperienceId, target)} onAddTarget={(draft) => onAddTarget(selectedExperienceId, draft)} onUpdateTarget={(id, draft) => onUpdateTarget(selectedExperienceId, id, draft)} onRemoveTarget={(id) => onRemoveTarget(selectedExperienceId, id)} onEditRecord={(recordId) => onEditRecord(selectedExperienceId, recordId)} onDeleteRecord={(recordId) => onDeleteRecord(selectedExperienceId, recordId)} onAddRecord={() => onAddRecord(selectedExperienceId)} />;
  }

  function targetTitleFor(experienceId: string, record: TriedRecord) {
    return record.targetId
      ? targetsMap[experienceId]?.find((target) => target.id === record.targetId)?.title
      : undefined;
  }

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
          aria-label="はじめて帖を検索"
          className="absolute left-5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper/95 text-green-900 shadow-md"
        >
          <SearchIcon />
          {(Boolean(searchValue.query.trim()) ||
            searchValue.categories.length > 0 ||
            searchValue.year !== "all") && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold text-paper">
              {Number(Boolean(searchValue.query.trim())) +
                searchValue.categories.length +
                Number(searchValue.year !== "all")}
            </span>
          )}
        </button>
        <div className="absolute right-5 top-4 max-w-[75%] text-right [text-shadow:0_1px_0_rgba(255,253,247,0.95)]">
          <div className="text-green-950">
            <h1 className="text-[1.55rem] font-bold tracking-wide">わたしのはじめて帖</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-green-950/80">
            「楽しかった」を、ひとつずつ。
          </p>
        </div>
      </header>

      <section className="mb-3 grid grid-cols-3 overflow-hidden rounded-3xl border border-green-100 bg-paper/80 px-2 py-3 shadow-[0_2px_12px_rgba(44,38,32,0.05)]">
        <SummaryCell label={<>これまでの<br />はじめて</>} value={firstItems.length} />
        <SummaryCell
          label={<>今年の<br />はじめて</>}
          value={currentYearCount}
          bordered
        />
        <SummaryCell label={<>これからの<br />楽しみ</>} value={wishlistCount} />
      </section>

      {!selectedExperienceId && (
      <div className="mb-3 grid grid-cols-2 rounded-2xl border border-green-100 bg-paper p-1 shadow-[0_1px_6px_rgba(44,38,32,0.04)]">
        <button
          type="button"
          onClick={() => changeView("firsts")}
          className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
            viewMode === "firsts"
              ? "bg-coral-100 text-coral-500 shadow-sm"
              : "text-ink-soft"
          }`}
        >
          はじめて
        </button>
        <button
          type="button"
          onClick={() => changeView("records")}
          className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
            viewMode === "records"
              ? "bg-coral-100 text-coral-500 shadow-sm"
              : "text-ink-soft"
          }`}
        >
          すべての記録
        </button>
      </div>
      )}

      {!selectedExperienceId && (
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", ...years].map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => {
              setSelectedYear(year);
              setSearchValue((current) => ({ ...current, year }));
            }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selectedYear === year
                ? "border-coral-400 bg-coral-400 text-paper shadow-sm"
                : "border-green-100 bg-paper text-green-800"
            }`}
          >
            {year === "all" ? "すべて" : `${year}年`}
          </button>
        ))}
      </div>
      )}

      {firstItems.length > 0 && !selectedExperienceId && (
        <p className="mb-3 text-right text-xs font-medium text-ink-soft">
          {viewMode === "firsts"
            ? `${filteredFirstItems.length}個のはじめて`
            : `${filteredRecordItems.length}件の記録`}
        </p>
      )}

      {firstItems.length === 0 ? (
        <EmptyState
          wishlistCount={wishlistCount}
          onExplore={onExplore}
          onOpenWishlist={onOpenWishlist}
        />
      ) : viewMode === "firsts" ? (
        <ul className="flex flex-col gap-2.5">
          {filteredFirstItems.map(({ experience, first, records }, index) => (
            <li key={experience.id} className="flex gap-3">
              <div className="relative flex w-12 shrink-0 items-start justify-end pr-3 pt-4 text-right">
                <p className="whitespace-pre-line text-[11px] font-bold leading-tight text-green-950">
                  {formatTimelineTiming(first.timing)}
                </p>
                <span
                  className={`absolute right-0 w-px bg-green-100 ${
                    index === 0 ? "top-4" : "top-0"
                  } ${
                    index === filteredFirstItems.length - 1
                      ? "bottom-1/2"
                      : "bottom-[-0.625rem]"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="relative flex h-32 min-w-0 flex-1 overflow-hidden rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]">
                <button
                  type="button"
                  onClick={() => openExperience(experience.id)}
                  className="flex min-w-0 flex-1 text-left"
                >
                  <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${assetBase}${experience.image ?? "/experiences/noimage.svg"}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="relative min-w-0 flex-1 px-3 py-2.5">
                    <CrownIcon className="absolute right-2.5 top-2.5 h-6 w-6 text-[#d39a2c]" />
                    <h2 className="line-clamp-2 pr-7 text-[15px] font-bold leading-snug text-green-950">
                      {experience.title}
                    </h2>
                    {(records.length > 1 || experience.exampleTargets) && (
                      <p className="mt-1 pr-16 text-[11px] leading-snug text-ink-soft">
                        {records.length}{experience.exampleTargets ? "件" : "回"}の記録
                      </p>
                    )}
                    {first.memo && (
                      <p className="mt-0.5 line-clamp-1 pr-7 text-[11px] leading-snug text-ink-soft">
                        {first.memo}
                      </p>
                    )}
                    <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                      {CATEGORY_LABELS[experience.category]}
                    </span>
                  </div>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filteredRecordItems.map(({ experience, record }, index) => (
            <li key={record.id} className="flex gap-3">
              <div className="relative flex w-12 shrink-0 items-start justify-end pr-3 pt-4 text-right">
                <p className="whitespace-pre-line text-[11px] font-bold leading-tight text-green-950">
                  {formatTimelineTiming(record.timing)}
                </p>
                <span
                  className={`absolute right-0 w-px bg-green-100 ${
                    index === 0 ? "top-4" : "top-0"
                  } ${
                    index === filteredRecordItems.length - 1
                      ? "bottom-1/2"
                      : "bottom-[-0.625rem]"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="flex h-32 min-w-0 flex-1 overflow-hidden rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]">
                <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      record.photoUrl ??
                      `${assetBase}${experience.image ?? "/experiences/noimage.svg"}`
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="relative min-w-0 flex-1 px-3 py-2.5">
                  <CrownIcon className="absolute right-2.5 top-2.5 h-6 w-6 text-[#d39a2c]" />
                  <h2 className="line-clamp-2 pr-7 text-[15px] font-bold leading-snug text-green-950">
                    {experience.title}
                  </h2>
                  {(record.targetId || record.place || record.companion) && (
                    <p className="mt-1 line-clamp-1 pr-7 text-[11px] leading-snug text-ink-soft">
                      {[targetTitleFor(experience.id, record), record.place, record.companion ? `with ${record.companion}` : undefined]
                        .filter(Boolean)
                        .join(" ・ ")}
                    </p>
                  )}
                  {record.memo && (
                    <p className="mt-0.5 line-clamp-1 pr-7 text-[11px] leading-snug text-ink-soft">
                      {record.memo}
                    </p>
                  )}
                  <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                    {CATEGORY_LABELS[experience.category]}
                  </span>

                  <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onEditRecord(experience.id, record.id);
                        setOpenMenuId(null);
                      }}
                      className="flex min-h-9 items-center rounded-full bg-green-100 px-3 text-sm font-bold text-green-800"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((current) => (current === record.id ? null : record.id))
                      }
                      aria-label={`${experience.title}のその他の操作`}
                      aria-expanded={openMenuId === record.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-deep text-lg font-bold leading-none text-ink-soft"
                    >
                      …
                    </button>
                  </div>

                  {openMenuId === record.id && (
                    <div className="absolute bottom-11 right-2 z-10 overflow-hidden rounded-xl border border-green-100 bg-paper p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteRecord(experience.id, record.id);
                          setOpenMenuId(null);
                        }}
                        className="min-h-10 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold text-coral-500 hover:bg-coral-100"
                      >
                        記録を削除
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
        <HajimeteSearchScreen
          items={items}
          value={{ ...searchValue, view: viewMode, year: selectedYear }}
          onClose={() => setSearchOpen(false)}
          onClear={(nextValue) => {
            setSearchValue(nextValue);
            setViewMode(nextValue.view);
            setSelectedYear("all");
            setSelectedExperienceId(null);
            setOpenMenuId(null);
          }}
          onApply={(nextValue) => {
            setSearchValue(nextValue);
            setViewMode(nextValue.view);
            setSelectedYear(nextValue.year);
            setSelectedExperienceId(null);
            setOpenMenuId(null);
            setSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  bordered = false,
}: {
  label: React.ReactNode;
  value: number;
  bordered?: boolean;
}) {
  return (
    <div className={`${bordered ? "border-x border-green-100" : ""} px-1 text-center`}>
      <p className="text-[10px] font-bold leading-snug text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-green-800">
        {value}
        <span className="ml-1 text-[10px] font-normal text-ink-soft">個</span>
      </p>
    </div>
  );
}

function EmptyState({
  wishlistCount,
  onExplore,
  onOpenWishlist,
}: {
  wishlistCount: number;
  onExplore: () => void;
  onOpenWishlist: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-9 text-center shadow-[0_2px_10px_rgba(44,38,32,0.04)]">
      <BookmarkIcon className="mx-auto h-9 w-9 text-coral-500" />
      <h2 className="mt-3 text-lg font-bold text-green-950">
        {wishlistCount > 0
          ? "あなたの「やってみたい」が待っています。"
          : "まだ知らない「楽しかった」が待っています。"}
      </h2>
      <button
        type="button"
        onClick={wishlistCount > 0 ? onOpenWishlist : onExplore}
        className="mt-5 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-paper shadow-sm"
      >
        {wishlistCount > 0 ? "やってみたいを見にいく" : "はじめてを探しにいく"}
      </button>
    </div>
  );
}
