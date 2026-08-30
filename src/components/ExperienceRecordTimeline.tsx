"use client";

import type { Experience } from "@/data/experiences";
import { experienceCategoryLabel } from "@/data/experiences";
import type { TriedRecord } from "@/hooks/useExperienceStatus";
import type { ExperienceTarget } from "@/hooks/useExperienceTargets";
import type { Timing } from "@/lib/timing";
import { imageSource } from "@/lib/imageSource";
import { TimelineDate } from "./TimelineDate";

interface Props {
  experience: Experience;
  records: TriedRecord[];
  targets?: ExperienceTarget[];
  onEditRecord: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  openMenuId: string | null;
  onToggleMenu: (recordId: string) => void;
  onOpenTarget?: (targetId: string) => void;
}

function timingSortKey(timing: Timing): string {
  if (!timing.value || timing.type === "unknown") return "0000-00-00";
  if (timing.type === "year") return `${timing.value}-00-00`;
  if (timing.type === "month") return `${timing.value}-00`;
  return timing.value;
}

export function ExperienceRecordTimeline({
  experience,
  records,
  targets = [],
  onEditRecord,
  onDeleteRecord,
  openMenuId,
  onToggleMenu,
  onOpenTarget,
}: Props) {
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const isCollection = Boolean(experience.exampleTargets);
  const sorted = [...records].sort((a, b) =>
    timingSortKey(b.timing).localeCompare(timingSortKey(a.timing))
  );

  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map((record, index) => {
        const target = targets.find((candidate) => candidate.id === record.targetId || (!record.targetId && candidate.title === record.place));
        const targetTitle = target?.title;
        const metadata = [
          record.place,
          record.companion ? `with ${record.companion}` : undefined,
        ].filter(Boolean).join(" ・ ");

        return (
          <li key={record.id} className="flex gap-2">
            <TimelineDate timing={record.timing} first={index === 0} last={index === sorted.length - 1} />

            <div role={onOpenTarget && target ? "button" : undefined} tabIndex={onOpenTarget && target ? 0 : undefined} onClick={() => { if (target) onOpenTarget?.(target.id); }} onKeyDown={(event) => { if (target && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpenTarget?.(target.id); } }} className={`flex h-32 min-w-0 flex-1 overflow-hidden rounded-2xl border border-green-100 bg-paper shadow-[0_2px_10px_rgba(44,38,32,0.07)] ${onOpenTarget && target ? "cursor-pointer" : ""}`}>
              <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.photoUrl ?? imageSource(experience.image, assetBase)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="relative min-w-0 flex-1 px-3 py-2.5">
                {isCollection && targetTitle && (
                  <h3 className="line-clamp-1 text-[15px] font-bold leading-snug text-green-950">
                    {targetTitle}
                  </h3>
                )}
                {record.memo && (
                  <p className={`${isCollection && targetTitle ? "mt-0.5 text-[11px]" : "text-[15px] font-bold"} line-clamp-2 leading-snug text-green-950`}>
                    {record.memo}
                  </p>
                )}
                {!record.memo && !targetTitle && (
                  <p className="text-sm font-medium text-ink-soft">記録</p>
                )}
                {metadata && (
                  <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-ink-soft">
                    {metadata}
                  </p>
                )}
                <span className="mt-1 inline-block rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  {experienceCategoryLabel(experience)}
                </span>

                <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
                  <button type="button" onClick={(event) => { event.stopPropagation(); onEditRecord(record.id); }} className="flex min-h-9 items-center rounded-full bg-green-100 px-3 text-sm font-bold text-green-800">
                    編集
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onToggleMenu(record.id); }} aria-label="記録のその他の操作" aria-expanded={openMenuId === record.id} className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-deep text-lg font-bold leading-none text-ink-soft">
                    …
                  </button>
                </div>

                {openMenuId === record.id && (
                  <div className="absolute bottom-11 right-2 z-10 overflow-hidden rounded-xl border border-green-100 bg-paper p-1 shadow-lg">
                    <button type="button" onClick={(event) => { event.stopPropagation(); onDeleteRecord(record.id); }} className="min-h-10 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold text-coral-500 hover:bg-coral-100">
                      記録を削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
