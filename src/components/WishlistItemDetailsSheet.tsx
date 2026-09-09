"use client";

import { useEffect, useState } from "react";
import type { WishlistItemDetails } from "@/hooks/useExperienceStatus";

interface WishlistItemDetailsSheetProps {
  experienceTitle: string;
  initialDetails?: WishlistItemDetails;
  onCancel: () => void;
  onConfirm: (details: WishlistItemDetails) => void;
}

const inputClass =
  "block box-border min-w-0 w-full max-w-full appearance-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base text-ink focus:border-green-700 focus:outline-none";

export function WishlistItemDetailsSheet({
  experienceTitle,
  initialDetails,
  onCancel,
  onConfirm,
}: WishlistItemDetailsSheetProps) {
  const [plannedDate, setPlannedDate] = useState(initialDetails?.plannedDate ?? "");
  const [place, setPlace] = useState(initialDetails?.place ?? "");
  const [companion, setCompanion] = useState(initialDetails?.companion ?? "");
  const [memo, setMemo] = useState(initialDetails?.memo ?? "");
  const [relatedUrl, setRelatedUrl] = useState(initialDetails?.relatedUrl ?? "");

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousOverscroll = root.style.overscrollBehavior;
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex max-w-full items-end justify-center overflow-hidden overscroll-none sm:items-center">
      <button type="button" aria-label="閉じる" onClick={onCancel} className="absolute inset-0 bg-ink/30" />
      <div
        className="relative box-border max-h-[92dvh] min-w-0 w-full max-w-sm touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-y-contain rounded-t-3xl bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl"
        onScroll={(event) => {
          if (event.currentTarget.scrollLeft !== 0) event.currentTarget.scrollLeft = 0;
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-green-100 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-800">やってみたいの詳細を編集</p>
            <h2 className="mt-1 line-clamp-2 text-xl font-bold leading-snug text-green-950">{experienceTitle}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="閉じる" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivory-deep text-xl text-green-950">×</button>
        </div>

        <div className="mt-4">
          <label htmlFor="wishlist-planned-date" className="text-sm font-bold text-green-950">予定日 <span className="font-normal text-ink-soft">（任意）</span></label>
          <input
            id="wishlist-planned-date"
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="mt-4 grid gap-3">
          <label>
            <span className="text-sm font-bold text-green-950">場所 <span className="font-normal text-ink-soft">（任意）</span></span>
            <input type="text" value={place} maxLength={80} onChange={(e) => setPlace(e.target.value)} placeholder="お店・施設・地域など" className={`${inputClass} mt-1.5`} />
          </label>
          <label>
            <span className="text-sm font-bold text-green-950">一緒に行く人 <span className="font-normal text-ink-soft">（任意）</span></span>
            <input type="text" value={companion} maxLength={80} onChange={(e) => setCompanion(e.target.value)} placeholder="○○さん、ひとり…など" className={`${inputClass} mt-1.5`} />
          </label>
        </div>

        <div className="mt-4">
          <label htmlFor="wishlist-memo" className="text-sm font-bold text-green-950">メモ <span className="font-normal text-ink-soft">（任意）</span></label>
          <div className="relative mt-1.5">
            <textarea
              id="wishlist-memo"
              value={memo}
              maxLength={100}
              rows={3}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="行きたい理由や気になっていることなど。"
              className="min-w-0 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 pb-6 text-base leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-green-700 focus:outline-none"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-ink-soft">{memo.length}/100</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="wishlist-related-url" className="text-sm font-bold text-green-950">参考URL <span className="font-normal text-ink-soft">（任意）</span></label>
          <input
            id="wishlist-related-url"
            type="url"
            value={relatedUrl}
            onChange={(e) => setRelatedUrl(e.target.value)}
            placeholder="https://..."
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-green-100 bg-paper py-3 text-sm font-medium text-ink-soft">戻る</button>
          <button
            type="button"
            onClick={() => onConfirm({
              plannedDate: plannedDate || undefined,
              place: place.trim() || undefined,
              companion: companion.trim() || undefined,
              memo: memo.trim() || undefined,
              relatedUrl: relatedUrl.trim() || undefined,
            })}
            className="flex-1 rounded-full bg-green-800 py-3 text-sm font-bold text-paper"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
