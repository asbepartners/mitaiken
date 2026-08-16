"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import { CategoryFilter, CategoryFilterValue } from "./CategoryFilter";

interface WishlistViewProps {
  items: Experience[];
  markingId: string | null;
  onRequestMarkTried: (id: string) => void;
  onRemove: (id: string) => void;
}

export function WishlistView({ items, markingId, onRequestMarkTried, onRemove }: WishlistViewProps) {
  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";

  const filtered = useMemo(
    () =>
      items.filter((experience) =>
        category === "all"
          ? true
          : category === "home"
            ? experience.place.includes("自宅")
            : experience.category === category
      ),
    [category, items]
  );

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
      </header>

      <div className="mb-3">
        <CategoryFilter value={category} onChange={(value) => { setCategory(value); setOpenMenuId(null); }} />
      </div>

      {items.length > 0 && (
        <p className="mb-2 text-right text-xs font-medium text-ink-soft">
          {category === "all" ? `${items.length}件のやってみたい` : `${filtered.length}件を表示`}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center">
          <p className="text-2xl" aria-hidden>🔭</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            気になる未体験に ♡ をつけると
            <br />
            ここに集まっていきます。
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center text-sm text-ink-soft">
          このカテゴリの「やってみたい」は、まだありません。
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((experience) => (
            <li
              key={experience.id}
              className="relative flex min-h-28 overflow-visible rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)]"
            >
              <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-l-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${assetBase}${experience.image ?? "/experiences/noimage.svg"}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 px-3 py-2.5 pr-1">
                <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-green-950">
                  {experience.title}
                </h2>
                <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  {CATEGORY_LABELS[experience.category]}
                </span>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                  {experience.description}
                </p>
              </div>

              <div className="flex w-[4.6rem] shrink-0 flex-col items-center justify-center gap-1 py-2">
                <button
                  type="button"
                  onClick={() => onRequestMarkTried(experience.id)}
                  aria-pressed={markingId === experience.id}
                  className="group flex flex-col items-center text-coral-500 transition active:scale-90"
                  aria-label={`${experience.title}をやってみた`}
                >
                  <span
                    key={markingId === experience.id ? "marking" : "idle"}
                    aria-hidden="true"
                    className={`text-[2rem] font-light leading-none group-hover:text-coral-500 ${markingId === experience.id ? "heart-pop" : ""}`}
                  >
                    {markingId === experience.id ? "♥" : "♡"}
                  </span>
                  <span className="mt-1 text-[9px] font-bold">やってみた！</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMenuId((current) => current === experience.id ? null : experience.id)}
                  aria-label={`${experience.title}のメニュー`}
                  aria-expanded={openMenuId === experience.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ivory-deep text-base font-bold leading-none text-ink-soft"
                >
                  …
                </button>
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
          ))}
        </ul>
      )}
    </div>
  );
}
