"use client";

import { CATEGORY_LABELS, Experience } from "@/data/experiences";
import { Timing, formatTiming } from "@/lib/timing";

interface TriedItem {
  experience: Experience;
  timing: Timing;
}

interface TriedViewProps {
  items: TriedItem[];
  onUndo: (id: string) => void;
}

export function TriedView({ items, onUndo }: TriedViewProps) {
  return (
    <div className="px-4 pb-4 pt-6">
      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-green-100 text-green-800">
          <span className="text-xl font-bold leading-none">{items.length}</span>
          <span className="text-[10px] leading-none">個</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-950">やってみた！</h1>
          <p className="mt-1 text-sm text-ink-soft">{items.length}個、やってみました。</p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center">
          <p className="text-2xl" aria-hidden>
            🎉
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            未体験をやってみたら
            <br />
            ここに冒険の記録が増えていきます。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ experience, timing }) => (
            <li
              key={experience.id}
              className="flex items-start gap-3 rounded-3xl border border-green-100 bg-paper p-4 shadow-[0_2px_10px_rgba(44,38,32,0.06)]"
            >
              <span className="mt-0.5 text-lg" aria-hidden>
                🎉
              </span>
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-medium text-green-800">
                  {CATEGORY_LABELS[experience.category]}
                </span>
                <h2 className="mt-2 text-base font-bold text-green-950">{experience.title}</h2>
                <p className="mt-1 text-xs text-ink-soft">{formatTiming(timing)}にやってみた</p>
                <button
                  type="button"
                  onClick={() => onUndo(experience.id)}
                  className="mt-2 text-xs font-medium text-ink-soft underline decoration-dotted underline-offset-4 hover:text-coral-500"
                >
                  やってみたことを取り消す
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
