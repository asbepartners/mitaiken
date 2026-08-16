"use client";

import { useEffect, useState } from "react";
import { Timing, UNKNOWN_TIMING, todayTiming } from "@/lib/timing";
import { BookmarkIcon } from "./RecordIcons";

interface TriedTimingSheetProps {
  experienceTitle: string;
  onCancel: () => void;
  onConfirm: (timing: Timing) => void;
}

type Mode = "select" | "date" | "month" | "year";

const optionButtonClass =
  "rounded-2xl border border-green-100 bg-paper px-4 py-3 text-left text-sm font-medium text-green-900 transition-colors hover:border-green-700 hover:bg-green-100";
const inputClass =
  "w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-sm text-ink focus:border-green-700 focus:outline-none";
const secondaryButtonClass =
  "flex-1 rounded-full border border-green-100 py-2.5 text-sm font-medium text-ink-soft";
const primaryButtonClass =
  "flex-1 rounded-full bg-green-800 py-2.5 text-sm font-bold text-paper transition-colors disabled:opacity-40";

export function TriedTimingSheet({ experienceTitle, onCancel, onConfirm }: TriedTimingSheetProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [dateValue, setDateValue] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [yearValue, setYearValue] = useState("");

  const today = todayTiming();
  const currentYear = Number(today.value?.slice(0, 4));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/30"
      />
      <div className="relative w-full max-w-sm animate-[slide-up_0.2s_ease-out] rounded-t-3xl bg-paper px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl sm:pb-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-green-100 sm:hidden" />
        <p className="flex items-center gap-1.5 text-sm font-medium text-coral-500">
          <BookmarkIcon filled className="h-5 w-5" />
          やってみた！
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-green-950">{experienceTitle}</h2>

        {mode === "select" && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="mb-1 text-xs text-ink-soft">いつやってみましたか？（わかる範囲でOK）</p>
            <button type="button" onClick={() => onConfirm(today)} className={optionButtonClass}>
              今日
            </button>
            <button type="button" onClick={() => setMode("date")} className={optionButtonClass}>
              日付を選ぶ
            </button>
            <button type="button" onClick={() => setMode("month")} className={optionButtonClass}>
              年月だけ
            </button>
            <button type="button" onClick={() => setMode("year")} className={optionButtonClass}>
              年だけ
            </button>
            <button
              type="button"
              onClick={() => onConfirm(UNKNOWN_TIMING)}
              className={optionButtonClass}
            >
              もっと以前 / 覚えていない
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-1 self-center text-xs font-medium text-ink-soft underline underline-offset-4"
            >
              キャンセル
            </button>
          </div>
        )}

        {mode === "date" && (
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="date"
              value={dateValue}
              max={today.value ?? undefined}
              onChange={(event) => setDateValue(event.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("select")} className={secondaryButtonClass}>
                戻る
              </button>
              <button
                type="button"
                disabled={!dateValue}
                onClick={() => onConfirm({ type: "date", value: dateValue })}
                className={primaryButtonClass}
              >
                決定
              </button>
            </div>
          </div>
        )}

        {mode === "month" && (
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="month"
              value={monthValue}
              max={today.value?.slice(0, 7)}
              onChange={(event) => setMonthValue(event.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("select")} className={secondaryButtonClass}>
                戻る
              </button>
              <button
                type="button"
                disabled={!monthValue}
                onClick={() => onConfirm({ type: "month", value: monthValue })}
                className={primaryButtonClass}
              >
                決定
              </button>
            </div>
          </div>
        )}

        {mode === "year" && (
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder={`例: ${currentYear}`}
              min={1950}
              max={currentYear}
              value={yearValue}
              onChange={(event) => setYearValue(event.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("select")} className={secondaryButtonClass}>
                戻る
              </button>
              <button
                type="button"
                disabled={!yearValue}
                onClick={() => onConfirm({ type: "year", value: yearValue })}
                className={primaryButtonClass}
              >
                決定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
