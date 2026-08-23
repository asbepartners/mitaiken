"use client";

import { useMemo, useState } from "react";
import type { Experience } from "@/data/experiences";
import type { TriedRecord } from "@/hooks/useExperienceStatus";
import { formatTiming } from "@/lib/timing";
import { CrownIcon } from "./RecordIcons";

interface Props {
  experience: Experience;
  targets: string[];
  records: TriedRecord[];
  onBack: () => void;
  onMarkTried: (target: string) => void;
  onAddTarget: (name: string) => boolean;
}

export function CollectionDetailView({ experience, targets, records, onBack, onMarkTried, onAddTarget }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const completed = useMemo(() => new Set(records.flatMap((record) => record.place ? [record.place] : [])), [records]);
  const pending = targets.filter((target) => !completed.has(target));

  function submit() {
    if (onAddTarget(name)) { setName(""); setAdding(false); }
  }

  return (
    <div className="px-4 pb-6 pt-4">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-1 pr-4 text-sm font-bold text-green-800"><span className="text-xl">‹</span> 戻る</button>
      <header className="mt-2 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_12px_rgba(44,38,32,0.06)]">
        <p className="text-xs font-medium text-green-700">やってみたいの詳細</p>
        <h1 className="mt-1 text-xl font-bold text-green-950">{experience.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{experience.description}</p>
        <div className="mt-4 flex gap-2 text-xs font-bold"><span className="rounded-full bg-coral-100 px-3 py-1.5 text-coral-500">これから {pending.length}件</span><span className="rounded-full bg-gold-100 px-3 py-1.5 text-[#936b25]">記録 {records.length}件</span></div>
      </header>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3 px-1"><h2 className="text-lg font-bold text-green-950">これから</h2><button type="button" onClick={() => setAdding(true)} className="min-h-10 rounded-full bg-coral-100 px-4 text-sm font-bold text-coral-500">＋ 行きたいを追加</button></div>
        {adding && <div className="mt-3 flex gap-2 rounded-2xl border border-green-100 bg-paper p-3"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="行きたい場所・お店" className="min-w-0 flex-1 rounded-xl bg-ivory px-3 py-2 text-base outline-none" /><button type="button" onClick={submit} className="rounded-full bg-coral-500 px-4 text-sm font-bold text-paper">追加</button></div>}
        {pending.length ? <ul className="mt-3 space-y-2.5">{pending.map((target) => <li key={target} className="flex min-h-16 items-center gap-3 rounded-2xl border border-green-100 bg-paper px-4 py-3 shadow-sm"><span className="min-w-0 flex-1 font-bold text-green-950">{target}</span><button type="button" onClick={() => onMarkTried(target)} className="shrink-0 rounded-full bg-green-800 px-4 py-2.5 text-sm font-bold text-paper">やってみた</button></li>)}</ul> : <p className="mt-3 rounded-2xl border border-dashed border-green-100 bg-paper px-4 py-5 text-center text-sm text-ink-soft">今のところ、すべて記録済みです。</p>}
      </section>

      {records.length > 0 && <section className="mt-6"><h2 className="px-1 text-lg font-bold text-green-950">やってみた記録</h2><ul className="mt-3 space-y-2.5">{records.map((record) => <li key={record.id} className="flex items-center gap-3 rounded-2xl border border-green-100 bg-paper px-4 py-3"><CrownIcon className="h-6 w-6 shrink-0 text-[#d39a2c]" /><div className="min-w-0 flex-1"><p className="font-bold text-green-950">{record.place ?? experience.title}</p><p className="mt-0.5 text-xs text-ink-soft">{formatTiming(record.timing)}{record.memo ? ` ・ ${record.memo}` : ""}</p></div></li>)}</ul></section>}
    </div>
  );
}
