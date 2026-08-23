"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Timing, UNKNOWN_TIMING, todayTiming } from "@/lib/timing";
import { BookmarkIcon } from "./RecordIcons";

export interface MemoryRecordDraft {
  timing: Timing;
  place?: string;
  companion?: string;
  memo?: string;
  photoUrl?: string;
}

interface MemoryRecordSheetProps {
  experienceTitle: string;
  relatedUrl?: string;
  initialRecord?: MemoryRecordDraft;
  onCancel: () => void;
  onConfirm: (record: MemoryRecordDraft) => void;
}

type TimingMode = "date" | "month" | "year";
const inputClass =
  "min-w-0 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base text-ink focus:border-green-700 focus:outline-none";

async function compressImage(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = raw;
  });
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function MemoryRecordSheet({
  experienceTitle,
  relatedUrl,
  initialRecord,
  onCancel,
  onConfirm,
}: MemoryRecordSheetProps) {
  const today = todayTiming();
  const currentYear = Number(today.value?.slice(0, 4));
  const initialTiming = initialRecord?.timing;
  const initialMode: TimingMode =
    initialTiming?.type === "month" ? "month" : initialTiming?.type === "year" ? "year" : "date";

  const [mode, setMode] = useState<TimingMode>(initialMode);
  const [dateValue, setDateValue] = useState(
    initialTiming?.type === "date" ? initialTiming.value ?? "" : today.value ?? ""
  );
  const [monthValue, setMonthValue] = useState(
    initialTiming?.type === "month" ? initialTiming.value ?? "" : today.value?.slice(0, 7) ?? ""
  );
  const [yearValue, setYearValue] = useState(
    initialTiming?.type === "year" ? initialTiming.value ?? "" : String(currentYear)
  );
  const [unknown, setUnknown] = useState(initialTiming?.type === "unknown");
  const [place, setPlace] = useState(initialRecord?.place ?? "");
  const [companion, setCompanion] = useState(initialRecord?.companion ?? "");
  const [memo, setMemo] = useState(initialRecord?.memo ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialRecord?.photoUrl);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const timing = useMemo<Timing>(() => {
    if (unknown) return UNKNOWN_TIMING;
    if (mode === "date") return { type: "date", value: dateValue };
    if (mode === "month") return { type: "month", value: monthValue };
    return { type: "year", value: yearValue };
  }, [dateValue, mode, monthValue, unknown, yearValue]);

  const canConfirm = unknown || Boolean(timing.value);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessingPhoto(true);
    try {
      setPhotoUrl(await compressImage(file));
    } finally {
      setProcessingPhoto(false);
      event.target.value = "";
    }
  }

  function chooseMode(next: TimingMode) {
    setUnknown(false);
    setMode(next);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="閉じる" onClick={onCancel} className="absolute inset-0 bg-ink/30" />
      <div className="relative max-h-[92dvh] min-w-0 w-full max-w-sm overflow-y-auto rounded-t-3xl bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-green-100 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-coral-500">
              <BookmarkIcon filled className="h-5 w-5" />やってみた！
            </p>
            <h2 className="mt-1 line-clamp-2 text-xl font-bold leading-snug text-green-950">{experienceTitle}</h2>
            {relatedUrl && (
              <a
                href={relatedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-green-800 underline decoration-dotted underline-offset-4"
              >
                関連リンクを見る <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <button type="button" onClick={onCancel} aria-label="閉じる" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivory-deep text-xl text-green-950">×</button>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-bold text-green-950">いつやった？</p>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-green-100 bg-ivory">
            {([["date","年月日"],["month","年月だけ"],["year","年だけ"]] as const).map(([value,label]) => (
              <button key={value} type="button" onClick={() => chooseMode(value)}
                className={`py-2.5 text-sm font-bold ${!unknown && mode===value ? "bg-coral-100 text-green-950 ring-1 ring-inset ring-coral-400" : "text-green-900"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            {mode==="date" && <input type="date" value={dateValue} max={today.value ?? undefined} disabled={unknown} onChange={e=>{setUnknown(false);setDateValue(e.target.value)}} className={inputClass}/>}
            {mode==="month" && <input type="month" value={monthValue} max={today.value?.slice(0,7)} disabled={unknown} onChange={e=>{setUnknown(false);setMonthValue(e.target.value)}} className={inputClass}/>}
            {mode==="year" && <input type="number" inputMode="numeric" min={1900} max={currentYear} value={yearValue} disabled={unknown} onChange={e=>{setUnknown(false);setYearValue(e.target.value)}} className={inputClass}/>}
          </div>
          <div className="mt-1.5 text-right">
            <button type="button" onClick={()=>setUnknown(v=>!v)} className={`text-xs font-medium underline underline-offset-4 ${unknown ? "text-coral-500":"text-green-800"}`}>
              {unknown ? "日付を入力する":"覚えていない"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="memory-memo" className="text-sm font-bold text-green-950">ひとことメモ <span className="font-normal text-ink-soft">（任意）</span></label>
          <div className="relative mt-1.5">
            <textarea id="memory-memo" value={memo} maxLength={100} rows={3} onChange={e=>setMemo(e.target.value)}
              placeholder="心に残ったことを一言残しましょう。"
              className="w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 pb-6 text-sm leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-green-700 focus:outline-none"/>
            <span className="absolute bottom-2 right-3 text-[10px] text-ink-soft">{memo.length}/100</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <label>
            <span className="text-sm font-bold text-green-950">どこで？ <span className="font-normal text-ink-soft">（任意）</span></span>
            <input type="text" value={place} maxLength={80} onChange={e=>setPlace(e.target.value)} placeholder="お店・施設・地域など" className={`${inputClass} mt-1.5`}/>
          </label>
          <label>
            <span className="text-sm font-bold text-green-950">誰と？ <span className="font-normal text-ink-soft">（任意）</span></span>
            <input type="text" value={companion} maxLength={80} onChange={e=>setCompanion(e.target.value)} placeholder="○○さん、ひとり…など" className={`${inputClass} mt-1.5`}/>
          </label>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold text-green-950">写真 <span className="font-normal text-ink-soft">（任意）</span></p>
          <div className="mt-1.5 flex items-start gap-3">
            {photoUrl ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-green-100 bg-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="選択した写真" className="h-full w-full object-cover"/>
                <button type="button" onClick={()=>setPhotoUrl(undefined)} aria-label="写真を削除" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper/95 text-sm font-bold text-green-950 shadow">×</button>
              </div>
            ) : (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-green-300 bg-ivory text-center text-green-800">
                <span className="text-2xl leading-none">▧＋</span>
                <span className="mt-1 text-xs font-medium">{processingPhoto ? "処理中…":"写真を追加"}</span>
                <input type="file" accept="image/*" className="sr-only" disabled={processingPhoto} onChange={handlePhotoChange}/>
              </label>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-green-100 bg-paper py-3 text-sm font-medium text-ink-soft">戻る</button>
          <button type="button" disabled={!canConfirm || processingPhoto}
            onClick={()=>onConfirm({timing,place:place.trim()||undefined,companion:companion.trim()||undefined,memo:memo.trim()||undefined,photoUrl})}
            className="flex-1 rounded-full bg-green-800 py-3 text-sm font-bold text-paper disabled:opacity-40">決定</button>
        </div>
      </div>
    </div>
  );
}
