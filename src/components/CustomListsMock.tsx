"use client";

import { useMemo, useState } from "react";

type ListItemStatus = "done" | "wishlist";

interface ListItem {
  id: string;
  name: string;
  area: string;
  note?: string;
  visited?: string;
  status: ListItemStatus;
}

const INITIAL_GOSHUIN_ITEMS: ListItem[] = [
  {
    id: "kato",
    name: "加藤神社",
    area: "熊本市・熊本城内",
    note: "熊本城を眺めながらお参り。御朱印の虎がかっこよかった。",
    visited: "2026.5.4",
    status: "done",
  },
  {
    id: "aoi-aso",
    name: "青井阿蘇神社",
    area: "人吉市",
    note: "茅葺き屋根がとてもきれい。",
    visited: "2025.11.16",
    status: "done",
  },
  {
    id: "takachiho",
    name: "高千穂神社",
    area: "宮崎県・高千穂町",
    status: "wishlist",
  },
  {
    id: "kamishikimi",
    name: "上色見熊野座神社",
    area: "熊本県・高森町",
    note: "新緑の季節に行きたい",
    status: "wishlist",
  },
  {
    id: "dazaifu",
    name: "太宰府天満宮",
    area: "福岡県・太宰府市",
    status: "wishlist",
  },
];

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoshuinIcon({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-[#d66b62] bg-[#fffaf3] text-[#b84f49] shadow-sm ${small ? "h-11 w-9" : "h-16 w-13"}`}
      aria-hidden="true"
    >
      <span className={`${small ? "text-[9px]" : "text-xs"} font-bold leading-tight [writing-mode:vertical-rl]`}>
        御朱印
      </span>
      <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-[#d66b62]/70" />
    </span>
  );
}

export function CustomListsMock({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState(INITIAL_GOSHUIN_ITEMS);
  const [filter, setFilter] = useState<"all" | ListItemStatus>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");

  const doneCount = items.filter((item) => item.status === "done").length;
  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || item.status === filter),
    [filter, items]
  );

  function toggleStatus(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "done" ? "wishlist" : "done",
              visited: item.status === "wishlist" ? "2026.8.23" : undefined,
            }
          : item
      )
    );
  }

  function addItem() {
    if (!newName.trim()) return;
    setItems((current) => [
      ...current,
      {
        id: `mock-${Date.now()}`,
        name: newName.trim(),
        area: newArea.trim() || "場所は未入力",
        status: "wishlist",
      },
    ]);
    setNewName("");
    setNewArea("");
    setShowAdd(false);
    setFilter("all");
  }

  return (
    <div className="pb-8">
      <header className="relative overflow-hidden border-b border-green-100 bg-[#f7ead6] px-5 pb-5 pt-4">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#e8b8a5]/30" />
        <div className="absolute -bottom-14 left-12 h-28 w-48 rotate-[-8deg] rounded-[50%] bg-green-100/60" />
        <button
          type="button"
          onClick={onBack}
          className="relative z-10 flex min-h-11 items-center gap-0.5 rounded-full pr-4 text-sm font-bold text-green-800"
        >
          <ChevronLeftIcon /> マイページ
        </button>
        <div className="relative z-10 mt-3 flex items-center gap-4">
          <GoshuinIcon />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#a75852]">わたしのリスト</p>
            <h1 className="mt-1 text-[1.55rem] font-bold tracking-wide text-green-950">
              御朱印を集める
            </h1>
            <p className="mt-1 text-sm text-ink-soft">お参りした場所を、ひとつずつ。</p>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4">
        <section className="grid grid-cols-2 overflow-hidden rounded-3xl border border-green-100 bg-paper shadow-[0_2px_12px_rgba(44,38,32,0.05)]">
          <div className="px-3 py-4 text-center">
            <p className="text-xs font-medium text-ink-soft">お参りした</p>
            <p className="mt-1 text-2xl font-bold text-green-950">{doneCount}<span className="ml-1 text-sm">か所</span></p>
          </div>
          <div className="border-l border-green-100 px-3 py-4 text-center">
            <p className="text-xs font-medium text-ink-soft">これから</p>
            <p className="mt-1 text-2xl font-bold text-coral-500">{items.length - doneCount}<span className="ml-1 text-sm">か所</span></p>
          </div>
        </section>

        <div className="mt-4 flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-3 rounded-2xl border border-green-100 bg-paper p-1">
            {([
              ["all", "すべて"],
              ["wishlist", "これから"],
              ["done", "行った"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-xl py-2.5 text-sm font-bold ${
                  filter === value ? "bg-coral-100 text-coral-500 shadow-sm" : "text-ink-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral-500 text-2xl font-light text-paper shadow-md"
            aria-label="行きたい場所を追加"
          >
            ＋
          </button>
        </div>

        <p className="mb-2 mt-4 text-right text-xs font-medium text-ink-soft">
          {visibleItems.length}か所
        </p>

        <ul className="flex flex-col gap-2.5">
          {visibleItems.map((item) => (
            <li key={item.id} className="rounded-2xl border border-green-100 bg-paper p-3.5 shadow-[0_2px_10px_rgba(44,38,32,0.06)]">
              <div className="flex gap-3">
                <GoshuinIcon small />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[15px] font-bold leading-snug text-green-950">{item.name}</h2>
                      <p className="mt-1 text-xs text-ink-soft">{item.area}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status === "done" ? "bg-gold-100 text-[#936b25]" : "bg-coral-100 text-coral-500"}`}>
                      {item.status === "done" ? "行った" : "これから"}
                    </span>
                  </div>
                  {item.visited && <p className="mt-2 text-xs font-medium text-green-700">{item.visited}</p>}
                  {item.note && <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-soft">{item.note}</p>}
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-green-100 pt-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  className={`min-h-9 rounded-full px-3 text-xs font-bold ${item.status === "done" ? "text-ink-soft" : "bg-coral-100 text-coral-500"}`}
                >
                  {item.status === "done" ? "これからに戻す" : "行ったにする"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-green-950/35 px-3" onClick={() => setShowAdd(false)}>
          <section className="w-full max-w-2xl animate-[slide-up_220ms_ease-out] rounded-t-[2rem] bg-paper px-5 pb-7 pt-5" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-green-100" />
            <h2 className="text-lg font-bold text-green-950">行きたい場所を追加</h2>
            <label className="mt-5 block text-sm font-bold text-green-950">
              神社・お寺の名前
              <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="例：出水神社" className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal outline-none focus:border-green-700" />
            </label>
            <label className="mt-4 block text-sm font-bold text-green-950">
              場所 <span className="font-normal text-ink-soft">（任意）</span>
              <input value={newArea} onChange={(event) => setNewArea(event.target.value)} placeholder="例：熊本市" className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal outline-none focus:border-green-700" />
            </label>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="min-h-12 flex-1 rounded-full border border-green-100 text-sm font-bold text-ink-soft">キャンセル</button>
              <button type="button" onClick={addItem} disabled={!newName.trim()} className="min-h-12 flex-1 rounded-full bg-coral-500 text-sm font-bold text-paper disabled:opacity-40">追加する</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
