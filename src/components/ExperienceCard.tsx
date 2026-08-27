"use client";

import { useState } from "react";
import { experienceCategoryLabel, Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { formatTiming } from "@/lib/timing";
import { imageSource } from "@/lib/imageSource";
import { ExperienceConditions } from "./ExperienceConditions";

interface ExperienceCardProps {
  experience: Experience;
  entry?: StatusEntry;
  variant?: "default" | "featured";
  onNext?: () => void;
  onHide?: (id: string) => void;
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExperienceCard({
  experience,
  entry,
  variant = "default",
  onNext,
  onHide,
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExperienceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const isWishlisted = entry?.status === "wishlist";
  const showWishlisted = isWishlisted || wishlistPending;
  const isTried = entry?.status === "cleared";
  const isFeatured = variant === "featured";
  const hasHero = isFeatured;
  const imagePath = imageSource(
    experience.image,
    process.env.NODE_ENV === "production" ? "/mitaiken" : ""
  );

  function handleToggleWishlist() {
    if (!isFeatured || isWishlisted) {
      onToggleWishlist(experience.id);
      return;
    }
    if (wishlistPending) return;
    setWishlistPending(true);
    window.setTimeout(() => onToggleWishlist(experience.id), 1500);
  }

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          hasHero ? "bg-paper/90 text-green-900" : "bg-green-100 text-green-800"
        }`}
      >
        {experienceCategoryLabel(experience)}
      </span>
      {experience.solo && (
        <span className="rounded-full bg-coral-100/95 px-3 py-1 text-xs font-medium text-coral-500">
          ひとりOK
        </span>
      )}
      {isTried && (
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            hasHero ? "bg-paper/90 text-green-900" : "bg-green-100 text-green-800"
          }`}
        >
          🎉 やってみた
        </span>
      )}
    </div>
  );

  return (
    <div
      className={
        hasHero
          ? "flex flex-col"
          : "flex flex-col rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.06)]"
      }
    >
      {hasHero ? (
        <div className="relative h-[330px] overflow-hidden rounded-3xl border border-green-100 shadow-[0_2px_10px_rgba(44,38,32,0.08)] sm:h-[350px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-950/95 via-green-950/25 to-green-950/15" />
          {onHide && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={`${experience.title}のメニュー`}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 pb-1 text-lg font-bold leading-none text-green-950 shadow-md backdrop-blur"
            >
              …
            </button>
          )}
          <div className="absolute inset-0 flex flex-col p-5 pb-12">
            {badges}
            <div className="mt-auto text-paper [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
              <h3 className="text-xl font-bold leading-snug sm:text-2xl">{experience.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-6 sm:text-base">{experience.description}</p>
              {experience.exampleTargets && (
                <div className="mt-2 rounded-xl bg-paper/90 px-3 py-2 text-green-950 [text-shadow:none]">
                  <p className="text-[11px] font-medium">このリストに最初から入っています</p>
                  <p className="mt-0.5 text-xs font-bold">{experience.exampleTargets.join("・")}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-green-800">あとから自分で追加できます</p>
                </div>
              )}
              <ExperienceConditions experience={experience} className="mt-2 text-xs font-medium" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {badges}
          <h3
            className={`mt-3 font-bold leading-snug text-green-950 ${
              isFeatured ? "text-2xl" : "text-lg"
            }`}
          >
            {experience.title}
          </h3>
          <p
            className={`mt-2 text-ink-soft ${
              isFeatured ? "text-base leading-8" : "text-sm leading-relaxed"
            }`}
          >
            {experience.description}
          </p>
        </>
      )}

      {isFeatured && (
        <div className="relative z-10 -mt-8 flex items-start justify-around gap-1 px-3 pb-4">
          <button type="button" onClick={() => onRequestMarkTried(experience.id)} className="group flex w-24 flex-col items-center gap-1.5 text-[11px] font-bold text-green-900">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-100 text-2xl shadow-md transition-transform group-active:scale-90">✓</span>
            やったことある
          </button>
          <button type="button" onClick={handleToggleWishlist} aria-pressed={showWishlisted} disabled={wishlistPending} className="group flex w-24 flex-col items-center gap-1.5 text-xs font-bold text-coral-500">
            <span key={showWishlisted ? "liked" : "idle"} className={`flex h-18 w-18 items-center justify-center rounded-full border border-coral-400 bg-coral-100 text-4xl shadow-md transition-colors group-active:scale-90 ${showWishlisted ? "heart-pop bg-coral-500 text-paper" : ""}`}>{showWishlisted ? "♥" : "♡"}</span>
            {wishlistPending ? "追加しました" : "やってみたい"}
          </button>
          <button type="button" onClick={onNext} disabled={!onNext} className="group flex w-24 flex-col items-center gap-1.5 text-[11px] font-bold text-ink-soft disabled:opacity-30">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-paper text-2xl shadow-md transition-transform group-active:scale-90">→</span>
            次の未体験
          </button>
        </div>
      )}

      {!isFeatured && (
        <ExperienceConditions experience={experience} className="mt-5 gap-x-4 gap-y-2 text-xs text-ink-soft" />
      )}

      {!isFeatured && (isTried && entry?.status === "cleared" ? (
        <div className={`${hasHero ? "mx-6 mb-6" : ""} ${isFeatured ? "mt-auto pt-8" : "mt-4"} flex items-center justify-between gap-3`}>
          <p className="text-xs text-ink-soft">{formatTiming(entry.timing)}にやってみた</p>
          <button
            type="button"
            onClick={() => onUndoTried(experience.id)}
            className="shrink-0 text-xs font-medium text-ink-soft underline decoration-dotted underline-offset-4 hover:text-coral-500"
          >
            取り消す
          </button>
        </div>
      ) : (
        <div className={`${hasHero ? "mx-6 mb-6" : ""} ${isFeatured ? "mt-auto pt-8" : "mt-4"} flex gap-2`}>
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-pressed={isWishlisted}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              isWishlisted
                ? "bg-coral-500 text-paper"
                : "bg-coral-100 text-coral-500 hover:bg-coral-500 hover:text-paper"
            }`}
          >
            <span aria-hidden>{isWishlisted ? "♥" : "♡"}</span>
            やってみたい
          </button>
          <button
            type="button"
            onClick={() => onRequestMarkTried(experience.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-100 px-4 py-2.5 text-sm font-bold text-green-800 transition-colors hover:bg-green-800 hover:text-paper"
          >
            <span aria-hidden>✓</span>
            やったことある
          </button>
        </div>
      ))}

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/30"
          />
          <div className="relative w-full max-w-sm rounded-t-3xl bg-paper px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl sm:pb-6">
            <p className="text-xs font-medium text-ink-soft">この未体験について</p>
            <p className="mt-1 font-bold text-green-950">{experience.title}</p>
            <button
              type="button"
              onClick={() => {
                onHide?.(experience.id);
                setMenuOpen(false);
              }}
              className="mt-5 w-full rounded-full border border-coral-400 bg-coral-100 py-3 text-sm font-bold text-coral-500"
            >
              今後は表示しない
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mt-2 w-full py-2 text-sm font-medium text-ink-soft"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
