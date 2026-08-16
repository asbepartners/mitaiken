"use client";

import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { formatTiming } from "@/lib/timing";

interface ExperienceCardProps {
  experience: Experience;
  entry?: StatusEntry;
  variant?: "default" | "featured";
  onNext?: () => void;
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExperienceCard({
  experience,
  entry,
  variant = "default",
  onNext,
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExperienceCardProps) {
  const isWishlisted = entry?.status === "wishlist";
  const isTried = entry?.status === "cleared";
  const isFeatured = variant === "featured";
  const hasHero = isFeatured;
  const imagePath = `${process.env.NODE_ENV === "production" ? "/mitaiken" : ""}${
    experience.image ?? "/experiences/noimage.svg"
  }`;

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          hasHero ? "bg-paper/90 text-green-900" : "bg-green-100 text-green-800"
        }`}
      >
        {CATEGORY_LABELS[experience.category]}
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
      className={`flex flex-col rounded-3xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.06)] ${hasHero ? "" : "p-5"}`}
    >
      {hasHero ? (
        <div className="relative h-[330px] overflow-hidden rounded-t-3xl sm:h-[350px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-950/95 via-green-950/25 to-green-950/15" />
          <div className="absolute inset-0 flex flex-col p-5 pb-12">
            {badges}
            <div className="mt-auto text-paper [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
              <h3 className="text-xl font-bold leading-snug sm:text-2xl">{experience.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-6 sm:text-base">{experience.description}</p>
              <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <dt aria-hidden>⏱</dt>
                  <dd>{experience.time}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt aria-hidden>💰</dt>
                  <dd>{experience.cost}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt aria-hidden>📍</dt>
                  <dd>{experience.place}</dd>
                </div>
              </dl>
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
          <button type="button" onClick={() => onToggleWishlist(experience.id)} aria-pressed={isWishlisted} className="group flex w-24 flex-col items-center gap-1.5 text-xs font-bold text-coral-500">
            <span key={isWishlisted ? "liked" : "idle"} className={`flex h-18 w-18 items-center justify-center rounded-full border border-coral-400 bg-coral-100 text-4xl shadow-md transition-colors group-active:scale-90 ${isWishlisted ? "heart-pop bg-coral-500 text-paper" : ""}`}>{isWishlisted ? "♥" : "♡"}</span>
            やってみたい
          </button>
          <button type="button" onClick={onNext} disabled={!onNext} className="group flex w-24 flex-col items-center gap-1.5 text-[11px] font-bold text-ink-soft disabled:opacity-30">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-paper text-2xl shadow-md transition-transform group-active:scale-90">→</span>
            次の未体験
          </button>
        </div>
      )}

      {!isFeatured && (
        <dl className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
          <div className="flex items-center gap-1">
            <dt aria-hidden>⏱</dt>
            <dd>{experience.time}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt aria-hidden>💰</dt>
            <dd>{experience.cost}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt aria-hidden>📍</dt>
            <dd>{experience.place}</dd>
          </div>
        </dl>
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
            onClick={() => onToggleWishlist(experience.id)}
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
    </div>
  );
}
