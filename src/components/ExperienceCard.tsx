"use client";

import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import type { StatusEntry } from "@/hooks/useExperienceStatus";
import { formatTiming } from "@/lib/timing";

interface ExperienceCardProps {
  experience: Experience;
  entry?: StatusEntry;
  onToggleWishlist: (id: string) => void;
  onRequestMarkTried: (id: string) => void;
  onUndoTried: (id: string) => void;
}

export function ExperienceCard({
  experience,
  entry,
  onToggleWishlist,
  onRequestMarkTried,
  onUndoTried,
}: ExperienceCardProps) {
  const isWishlisted = entry?.status === "wishlist";
  const isTried = entry?.status === "cleared";

  return (
    <div className="rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
          {CATEGORY_LABELS[experience.category]}
        </span>
        {experience.solo && (
          <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-medium text-coral-500">
            ひとりOK
          </span>
        )}
        {isTried && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            🎉 やってみた
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-bold leading-snug text-green-950">
        {experience.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        {experience.description}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
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
        <div className="mt-4 flex items-center justify-between gap-3">
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
        <div className="mt-4 flex gap-2">
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
