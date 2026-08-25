"use client";

import { useMemo, useState } from "react";
import { experienceCategoryLabel, Experience } from "@/data/experiences";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";
import {
  countExperienceFilters,
  EMPTY_EXPERIENCE_FILTERS,
  ExperienceFilters,
  ExperienceSearchScreen,
  matchesExperienceFilters,
  SearchIcon,
} from "./ExperienceSearchScreen";
import { BookmarkIcon } from "./RecordIcons";
import type { RecordsMap } from "@/hooks/useExperienceStatus";
import type { ExperienceTarget, ExperienceTargetDraft, TargetsMap } from "@/hooks/useExperienceTargets";
import { CollectionDetailView } from "./CollectionDetailView";
import { OriginalExperienceForm } from "./OriginalExperienceForm";
import type { CustomExperienceDraft } from "@/hooks/useCustomExperiences";
import { imageSource } from "@/lib/imageSource";
import type { SearchMasters } from "@/hooks/useSearchMasters";

interface WishlistViewProps {
  items: Experience[];
  triedCount: number;
  markingId: string | null;
  onExplore: () => void;
  onRequestMarkTried: (id: string) => void;
  onRemove: (id: string) => void;
  targetsMap: TargetsMap;
  recordsMap: RecordsMap;
  onRequestTargetRecord: (parentId: string, target: ExperienceTarget) => void;
  onAddTarget: (parentId: string, draft: ExperienceTargetDraft) => boolean;
  onUpdateTarget: (parentId: string, id: string, draft: ExperienceTargetDraft) => boolean;
  onRemoveTarget: (parentId: string, id: string) => void;
  onEditRecord: (parentId: string, recordId: string) => void;
  onDeleteRecord: (parentId: string, recordId: string) => void;
  onCreateOriginal: (draft: CustomExperienceDraft, targets: ExperienceTargetDraft[]) => Promise<void>;
  onUpdateOriginal: (id: string, draft: CustomExperienceDraft, targets: ExperienceTargetDraft[]) => Promise<void>;
  searchMasters: SearchMasters;
  searchMastersLoading: boolean;
  searchMastersError: boolean;
}

export function WishlistView({
  items,
  triedCount,
  markingId,
  onExplore,
  onRequestMarkTried,
  onRemove,
  targetsMap,
  recordsMap,
  onRequestTargetRecord,
  onAddTarget,
  onUpdateTarget,
  onRemoveTarget,
  onEditRecord,
  onDeleteRecord,
  onCreateOriginal,
  onUpdateOriginal,
  searchMasters,
  searchMastersLoading,
  searchMastersError,
}: WishlistViewProps) {
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState<ExperienceFilters>(EMPTY_EXPERIENCE_FILTERS);
  const [bookmarkPendingId, setBookmarkPendingId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [creatingOriginal, setCreatingOriginal] = useState(false);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";

  const filtered = useMemo(
    () =>
      items.filter((experience) => {
        const matchesCategory =
          category === "all"
            ? true
            : category === "home"
              ? experience.place.includes("自宅")
              : experience.category === category;
        return matchesCategory && matchesExperienceFilters(experience, filters);
      }),
    [category, filters, items]
  );

  function handleRequestMarkTried(id: string) {
    if (bookmarkPendingId) return;
    setBookmarkPendingId(id);
    window.setTimeout(() => {
      setBookmarkPendingId(null);
      onRequestMarkTried(id);
    }, 340);
  }

  const selectedCollection = items.find((item) => item.id === selectedCollectionId);
  if (selectedCollection) {
    return <CollectionDetailView experience={selectedCollection} targets={targetsMap[selectedCollection.id] ?? []} records={recordsMap[selectedCollection.id] ?? []} onBack={() => setSelectedCollectionId(null)} backLabel="やってみたいリストに戻る" onMarkTried={(target) => onRequestTargetRecord(selectedCollection.id, target)} onAddTarget={(draft) => onAddTarget(selectedCollection.id, draft)} onUpdateTarget={(id, draft) => onUpdateTarget(selectedCollection.id, id, draft)} onRemoveTarget={(id) => onRemoveTarget(selectedCollection.id, id)} onEditRecord={(recordId) => onEditRecord(selectedCollection.id, recordId)} onDeleteRecord={(recordId) => onDeleteRecord(selectedCollection.id, recordId)} />;
  }

  return (
    <div className="px-4 pb-4">
      <header className="relative -mx-4 mb-4 h-36 overflow-hidden border-b border-green-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${assetBase}/header-explore-v4.png`}
          alt=""
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <div className="absolute inset-x-0 top-0 px-5 py-5 [text-shadow:0_1px_0_rgba(255,253,247,0.95)]">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-coral-400">♥</span>
            <h1 className="text-2xl font-bold tracking-wide text-green-950">やってみたいリスト</h1>
            <span aria-hidden="true" className="-mt-5 text-xs text-[#d39a2c]">✦</span>
          </div>
          <p className="mt-1 text-sm font-medium text-green-950/80">
            いつかやってみたい未体験たち
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="やってみたいを詳しく検索"
          className="absolute right-5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper/95 text-green-900 shadow-md"
        >
          <SearchIcon />
          {countExperienceFilters(filters) > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold leading-5 text-paper">
              {countExperienceFilters(filters)}
            </span>
          )}
        </button>
      </header>

      <div className="mb-3">
        <CategoryFilter value={category} onChange={(value) => { setCategory(value); setOpenMenuId(null); }} />
      </div>

      <div className="mb-2 flex min-h-10 items-center justify-between gap-3">
        <button type="button" onClick={() => setCreatingOriginal(true)} className="rounded-full border border-coral-300 bg-paper px-3 py-2 text-xs font-bold text-coral-500 shadow-sm">＋ オリジナルを作る</button>
        {items.length > 0 && <p className="text-right text-xs font-medium text-ink-soft">{category === "all" ? `${items.length}件のやってみたい` : `${filtered.length}件を表示`}</p>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-9 text-center shadow-[0_2px_10px_rgba(44,38,32,0.04)]">
          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            <span className="text-xs text-[#d39a2c]">✦</span>
            <span className="text-4xl leading-none text-coral-500">♥</span>
            <span className="-mt-4 text-xs text-[#d39a2c]">✦</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-green-950">
            まだ知らない「やってみたい」が待っています。
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {triedCount > 0
              ? "次の楽しみを、探しにいきませんか？"
              : "気になる「はじめて」を、探しにいきませんか？"}
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-5 rounded-full bg-coral-500 px-6 py-3 text-sm font-bold text-paper shadow-sm transition hover:bg-coral-400 active:scale-95"
          >
            やってみたいを探しにいく
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center text-sm text-ink-soft">
          このカテゴリの「やってみたい」は、まだありません。
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((experience) => {
            const completedPlaces = new Set((recordsMap[experience.id] ?? []).flatMap((record) => record.place ? [record.place] : []));
            const pendingTargets = (targetsMap[experience.id] ?? []).filter((target) => !(recordsMap[experience.id] ?? []).some((record) => record.targetId === target.id || (!record.targetId && completedPlaces.has(target.title))));
            const isCollection = Boolean(experience.exampleTargets);
            return (
            <li
              key={experience.id}
              className="relative flex h-28 overflow-visible rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]"
            >
              <button type="button" onClick={() => isCollection && setSelectedCollectionId(experience.id)} className="flex min-w-0 flex-1 text-left">
              <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSource(experience.image, assetBase)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 px-3 py-2.5 pr-1">
                <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-green-950">
                  {experience.title}
                </h2>
                <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  {experienceCategoryLabel(experience)}
                </span>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                  {isCollection ? `これから${pendingTargets.length}件・タップして詳細を見る` : experience.description}
                </p>
              </div>
              </button>

              <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center gap-1 py-2">
                {isCollection && <button type="button" onClick={() => setSelectedCollectionId(experience.id)} aria-label={`${experience.title}の詳細`} className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-100 text-2xl text-coral-500">›</button>}
                {!isCollection && <button
                  type="button"
                  onClick={() => handleRequestMarkTried(experience.id)}
                  disabled={bookmarkPendingId !== null}
                  aria-pressed={markingId === experience.id || bookmarkPendingId === experience.id}
                  className="group flex flex-col items-center text-coral-500 transition active:scale-90"
                  aria-label={`${experience.title}をやってみた`}
                >
                  <span
                    key={markingId === experience.id || bookmarkPendingId === experience.id ? "marking" : "idle"}
                    aria-hidden="true"
                    className={markingId === experience.id || bookmarkPendingId === experience.id ? "heart-pop" : ""}
                  >
                    <BookmarkIcon
                      filled={markingId === experience.id || bookmarkPendingId === experience.id}
                      className="h-8 w-8"
                    />
                  </span>
                  <span className="mt-1 text-[9px] font-bold">やってみた！</span>
                </button>}
                <div className="flex items-center gap-1">
                  {experience.id.startsWith("custom-") && <button type="button" onClick={() => setEditingOriginalId(experience.id)} className="min-h-8 rounded-full bg-green-100 px-2.5 text-xs font-bold text-green-800">編集</button>}
                  <button
                    type="button"
                    onClick={() => setOpenMenuId((current) => current === experience.id ? null : experience.id)}
                    aria-label={`${experience.title}のメニュー`}
                    aria-expanded={openMenuId === experience.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ivory-deep text-base font-bold leading-none text-ink-soft"
                  >
                    …
                  </button>
                </div>
              </div>

              {openMenuId === experience.id && (
                <div className="absolute bottom-2 right-12 z-20 rounded-xl border border-green-100 bg-paper p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { onRemove(experience.id); setOpenMenuId(null); }}
                    className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-coral-500 hover:bg-coral-100"
                  >
                    リストから外す
                  </button>
                </div>
              )}
            </li>
          );})}
        </ul>
      )}

      {searchOpen && (
        <ExperienceSearchScreen
          title="やってみたいを探す"
          items={items}
          value={filters}
          onClose={() => setSearchOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setCategory("all");
            setOpenMenuId(null);
            setSearchOpen(false);
          }}
        />
      )}
      {creatingOriginal && <OriginalExperienceForm existingTitles={items.map((item) => item.title)} masters={searchMasters} mastersLoading={searchMastersLoading} mastersError={searchMastersError} onClose={() => setCreatingOriginal(false)} onSubmit={async (draft, targets) => { await onCreateOriginal(draft, targets); setCreatingOriginal(false); }} />}
      {editingOriginalId && (() => {
        const experience = items.find((item) => item.id === editingOriginalId);
        if (!experience) return null;
        return <OriginalExperienceForm
          existingTitles={items.filter((item) => item.id !== editingOriginalId).map((item) => item.title)}
          initialExperience={{
            title: experience.title,
            description: experience.description,
            category: experience.category,
            categoryId: experience.categoryId,
            categoryCode: experience.categoryCode,
            categoryLabel: experience.categoryLabel,
            image: experience.image,
            locationOptionId: experience.locationOptionId,
            locationCode: experience.locationCode,
            locationLabel: experience.locationLabel,
            durationOptionId: experience.durationOptionId,
            durationCode: experience.durationCode,
            durationLabel: experience.durationLabel,
            durationMinMinutes: experience.durationMinMinutes,
            durationMaxMinutes: experience.durationMaxMinutes,
            budgetOptionId: experience.budgetOptionId,
            budgetCode: experience.budgetCode,
            budgetLabel: experience.budgetLabel,
            budgetMinYen: experience.budgetMinYen,
            budgetMaxYen: experience.budgetMaxYen,
            minPeople: experience.minPeople,
            maxPeople: experience.maxPeople,
          }}
          masters={searchMasters}
          mastersLoading={searchMastersLoading}
          mastersError={searchMastersError}
          allowAddingTargets={(targetsMap[editingOriginalId] ?? []).length === 0}
          onClose={() => setEditingOriginalId(null)}
          onSubmit={async (draft, targets) => { await onUpdateOriginal(editingOriginalId, draft, targets); setEditingOriginalId(null); }}
        />;
      })()}
    </div>
  );
}
