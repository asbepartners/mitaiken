"use client";

import { CATEGORY_LABELS, Experience } from "@/data/experiences";

interface WishlistViewProps {
  items: Experience[];
  onRequestMarkTried: (id: string) => void;
  onRemove: (id: string) => void;
}

export function WishlistView({ items, onRequestMarkTried, onRemove }: WishlistViewProps) {
  return (
    <div className="px-4 pb-4 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-950">やってみたいリスト</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          未来の楽しみが {items.length} 件、たまっています。
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-100 bg-paper px-6 py-10 text-center">
          <p className="text-2xl" aria-hidden>
            🔭
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            気になる未体験に ♡ をつけると
            <br />
            ここに集まっていきます。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((experience) => (
            <li
              key={experience.id}
              className="rounded-3xl border border-green-100 bg-paper p-4 shadow-[0_2px_10px_rgba(44,38,32,0.06)]"
            >
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-medium text-green-800">
                {CATEGORY_LABELS[experience.category]}
              </span>
              <h2 className="mt-2 text-base font-bold text-green-950">{experience.title}</h2>
              <p className="mt-1 text-xs text-ink-soft">
                ⏱ {experience.time} ・ 💰 {experience.cost}
              </p>

              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onRequestMarkTried(experience.id)}
                  className="rounded-full bg-green-100 px-3.5 py-1.5 text-xs font-bold text-green-800 transition-colors hover:bg-green-800 hover:text-paper"
                >
                  🎉 やってみた！
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(experience.id)}
                  className="text-xs font-medium text-ink-soft underline decoration-dotted underline-offset-4 hover:text-coral-500"
                >
                  リストから外す
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
