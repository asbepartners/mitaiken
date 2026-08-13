"use client";

import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { formatTiming } from "@/lib/timing";

interface ExperienceCardProps {
  experience: Experience;
  entry?: StatusEntry;
  variant?: "default" | "featured";
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExperienceCard({
  experience,
  entry,
  variant = "default",
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExperienceCardProps) {
  const isWishlisted = entry?.status === "wishlist";
  const isTried = entry?.status === "cleared";
  const isFeatured = variant === "featured";
  const hasHero = isFeatured && Boolean(experience.image);
  const imagePath = `${process.env.NODE_ENV === "production" ? "/mitaiken" : ""}${experience.image}`;

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
      className={`flex flex-col rounded-3xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.06)] ${
        hasHero ? "overflow-hidden" : isFeatured ? "min-h-[390px] p-6" : "p-5"
      }`}
    >
      {hasHero ? (
        <div className="relative h-[360px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-950/90 via-green-950/20 to-green-950/15" />
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            {badges}
            <div className="text-paper [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
              <h3 className="text-2xl font-bold leading-snug">{experience.title}</h3>
              <p className="mt-2 text-base font-medium leading-7">{experience.description}</p>
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

      <dl
        className={`mt-5 flex flex-wrap gap-x-4 gap-y-2 text-ink-soft ${hasHero ? "px-6" : ""} ${
          isFeatured ? "text-sm" : "text-xs"
        }`}
      >
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

      {isTried && entry?.status === "cleared" ? (
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
      )}
    </div>
  );
}
