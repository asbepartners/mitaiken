"use client";

import { useMemo, useState } from "react";
import { CrownIcon } from "./RecordIcons";

interface GoshuinTarget { id: string; name: string; area: string; }
const INITIAL_TARGETS: GoshuinTarget[] = [
  { id: "kato", name: "加藤神社", area: "熊本市・熊本城内" },
  { id: "aoi-aso", name: "青井阿蘇神社", area: "人吉市" },
  { id: "takachiho", name: "高千穂神社", area: "宮崎県・高千穂町" },
];

interface Props { completedPlaces: string[]; onBack: () => void; onMarkTried: (place: string) => void; }

export function CustomListsMock({ completedPlaces, onBack, onMarkTried }: Props) {
  const [targets, setTargets] = useState(INITIAL_TARGETS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");
  const completed = useMemo(() => new Set(completedPlaces), [completedPlaces]);

  function addTarget() {
    if (!newName.trim()) return;
    setTargets((current) => [...current, { id: `mock-${Date.now()}`, name: newName.trim(), area: newArea.trim() || "場所は未入力" }]);
    setNewName(""); setNewArea(""); setShowAdd(false);
  }

  return (
    <div className="px-4 pb-6 pt-4">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-1 pr-4 text-sm font-bold text-green-800"><span className="text-xl">‹</span> 探すに戻る</button>
      <section className="mt-2 rounded-3xl border border-green-100 bg-paper p-4 shadow-[0_2px_12px_rgba(44,38,32,0.06)]">
        <div className="flex gap-3">
          <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#d66b62] bg-[#fffaf3] text-[10px] font-bold text-[#b84f49] shadow-sm [writing-mode:vertical-rl]">御朱印</span>
          <div><p className="text-xs font-medium text-green-700">おすすめリスト</p><h1 className="mt-1 text-xl font-bold text-green-950">御朱印を集める</h1><p className="mt-1 text-sm leading-5 text-ink-soft">行きたい神社やお寺を決めて、お参りの記録を残します。</p></div>
        </div>
        <p className="mt-4 rounded-2xl bg-coral-100 px-4 py-3 text-sm leading-6 text-green-950">最初の1か所を記録すると、<strong>「御朱印を集める」</strong>がはじめて帖に加わります。</p>
      </section>
      <div className="mt-5 flex items-end justify-between px-1"><div><p className="text-xs text-ink-soft">子として追加した行き先</p><h2 className="text-lg font-bold text-green-950">これから行きたい</h2></div><button type="button" onClick={() => setShowAdd(true)} className="min-h-10 rounded-full bg-coral-500 px-4 text-sm font-bold text-paper">＋ 追加</button></div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {targets.map((target) => {
          const done = completed.has(target.name);
          return <li key={target.id} className="rounded-2xl border border-green-100 bg-paper p-3.5 shadow-[0_2px_10px_rgba(44,38,32,0.06)]"><div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-gold-100 text-[#d39a2c]" : "bg-coral-100 text-coral-500"}`}>{done ? <CrownIcon className="h-5 w-5" /> : "♥"}</span><div className="min-w-0 flex-1"><h3 className="text-[15px] font-bold text-green-950">{target.name}</h3><p className="mt-1 text-xs text-ink-soft">{target.area}</p></div>{done ? <span className="rounded-full bg-gold-100 px-3 py-2 text-xs font-bold text-[#936b25]">記録済み</span> : <button type="button" onClick={() => onMarkTried(target.name)} className="min-h-10 shrink-0 rounded-full bg-green-800 px-3 text-xs font-bold text-paper">やってみた</button>}</div></li>;
        })}
      </ul>
      {completedPlaces.length > 0 && <p className="mt-5 rounded-2xl border border-green-100 bg-paper px-4 py-3 text-sm leading-6 text-green-950">はじめて帖では、これらが<strong>「御朱印を集める」の記録</strong>としてひとつに積み上がります。</p>}
      {showAdd && <div className="fixed inset-0 z-40 flex items-end justify-center bg-green-950/35 px-3" onClick={() => setShowAdd(false)}><section className="w-full max-w-2xl rounded-t-[2rem] bg-paper px-5 pb-7 pt-5" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-bold text-green-950">行きたい神社・お寺を追加</h2><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="名前（例：出水神社）" className="mt-5 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3" /><input value={newArea} onChange={(event) => setNewArea(event.target.value)} placeholder="場所（任意）" className="mt-3 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3" /><div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowAdd(false)} className="min-h-12 flex-1 rounded-full border border-green-100">キャンセル</button><button type="button" onClick={addTarget} disabled={!newName.trim()} className="min-h-12 flex-1 rounded-full bg-coral-500 font-bold text-paper disabled:opacity-40">追加する</button></div></section></div>}
    </div>
  );
}
