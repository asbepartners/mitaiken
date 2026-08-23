"use client";
import { useMemo, useState } from "react";
import type { Experience } from "@/data/experiences";
import type { TriedRecord } from "@/hooks/useExperienceStatus";
import type { ExperienceTarget, ExperienceTargetDraft } from "@/hooks/useExperienceTargets";
import { formatTiming } from "@/lib/timing";
import { BookmarkIcon, CrownIcon } from "./RecordIcons";

interface Props {
  experience: Experience; targets: ExperienceTarget[]; records: TriedRecord[]; onBack: () => void;
  onMarkTried: (target: ExperienceTarget) => void; onAddTarget: (draft: ExperienceTargetDraft) => boolean;
  onUpdateTarget: (id: string, draft: ExperienceTargetDraft) => boolean; onRemoveTarget: (id: string) => void;
  onEditRecord: (recordId: string) => void; onDeleteRecord: (recordId: string) => void;
}

export function CollectionDetailView(props: Props) {
  const { experience, targets, records } = props;
  const [editing, setEditing] = useState<ExperienceTarget | "new" | null>(null);
  const [draft, setDraft] = useState<ExperienceTargetDraft>({ title: "", memo: "", relatedUrl: "" });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const recordByTarget = useMemo(() => new Map(targets.map((target) => [target.id, records.find((record) => record.targetId === target.id || (!record.targetId && record.place === target.title))])), [records, targets]);
  const pending = targets.filter((target) => !recordByTarget.get(target.id));
  const completed = targets.flatMap((target) => { const record = recordByTarget.get(target.id); return record ? [{ target, record }] : []; });

  function openForm(target: ExperienceTarget | "new") { setEditing(target); setDraft(target === "new" ? { title: "", memo: "", relatedUrl: "" } : { title: target.title, memo: target.memo, relatedUrl: target.relatedUrl }); }
  function save() { const ok = editing === "new" ? props.onAddTarget(draft) : editing ? props.onUpdateTarget(editing.id, draft) : false; if (ok) setEditing(null); }
  function mark(target: ExperienceTarget) { if (markingId) return; setMarkingId(target.id); window.setTimeout(() => { setMarkingId(null); props.onMarkTried(target); }, 340); }

  return <div className="px-4 pb-6 pt-4">
    <button type="button" onClick={props.onBack} className="flex min-h-11 items-center gap-1 pr-4 text-sm font-bold text-green-800"><span className="text-xl">‹</span> 戻る</button>
    <header className="mt-2 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_12px_rgba(44,38,32,0.06)]"><p className="text-xs font-medium text-green-700">やってみたいの詳細</p><h1 className="mt-1 text-xl font-bold text-green-950">{experience.title}</h1><p className="mt-2 text-sm leading-6 text-ink-soft">{experience.description}</p><div className="mt-4 flex gap-2 text-xs font-bold"><span className="rounded-full bg-coral-100 px-3 py-1.5 text-coral-500">これから {pending.length}件</span><span className="rounded-full bg-gold-100 px-3 py-1.5 text-[#936b25]">記録 {completed.length}件</span></div></header>

    <section className="mt-5"><div className="flex items-center justify-between gap-3 px-1"><h2 className="text-lg font-bold text-green-950">これから</h2><button type="button" onClick={() => openForm("new")} className="min-h-10 rounded-full bg-coral-100 px-4 text-sm font-bold text-coral-500">＋ やってみたいを追加</button></div>
      {pending.length ? <ul className="mt-3 space-y-2.5">{pending.map((target) => <li key={target.id} className="relative flex min-h-28 items-center gap-3 rounded-2xl border border-green-100 bg-paper py-2 pl-4 pr-2 shadow-sm"><button type="button" onClick={() => openForm(target)} className="min-w-0 flex-1 text-left"><p className="font-bold text-green-950">{target.title}</p>{target.memo && <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-soft">{target.memo}</p>}</button><div className="flex w-[5.5rem] shrink-0 flex-col items-center"><button type="button" onClick={() => mark(target)} disabled={markingId !== null} className="text-coral-500"><span className={markingId === target.id ? "heart-pop" : ""}><BookmarkIcon filled={markingId === target.id} className="h-8 w-8" /></span><span className="block text-[9px] font-bold">やってみた！</span></button><div className="mt-1 flex gap-1"><button type="button" onClick={() => openForm(target)} className="min-h-8 whitespace-nowrap rounded-full bg-green-100 px-2.5 text-xs font-bold text-green-800">編集</button><button type="button" onClick={() => setMenuId(menuId === target.id ? null : target.id)} className="h-8 w-8 shrink-0 rounded-full bg-ivory-deep font-bold">…</button></div></div>{menuId === target.id && <div className="absolute bottom-2 right-12 z-10 rounded-xl border border-green-100 bg-paper p-1 shadow-lg"><button type="button" onClick={() => props.onRemoveTarget(target.id)} className="whitespace-nowrap px-3 py-2 text-xs font-bold text-coral-500">リストから外す</button></div>}</li>)}</ul> : <p className="mt-3 rounded-2xl border border-dashed border-green-100 bg-paper px-4 py-5 text-center text-sm text-ink-soft">今のところ、すべて記録済みです。</p>}
    </section>

    {completed.length > 0 && <section className="mt-6"><h2 className="px-1 text-lg font-bold text-green-950">やってみた記録</h2><ul className="mt-3 space-y-2.5">{completed.map(({ target, record }) => <li key={record.id} className="relative flex min-h-28 items-center gap-3 rounded-2xl border border-green-100 bg-paper px-4 py-3"><CrownIcon className="h-6 w-6 shrink-0 text-[#d39a2c]" /><button type="button" onClick={() => openForm(target)} className="min-w-0 flex-1 text-left"><p className="font-bold text-green-950">{target.title}</p>{record.memo && <p className="mt-1 line-clamp-1 text-xs text-ink-soft">{record.memo}</p>}<p className="mt-1 text-xs text-ink-soft">{formatTiming(record.timing)}</p></button><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => props.onEditRecord(record.id)} className="min-h-9 rounded-full bg-green-100 px-3 text-sm font-bold text-green-800">編集</button><button type="button" onClick={() => setMenuId(menuId === record.id ? null : record.id)} className="h-9 w-9 rounded-full bg-ivory-deep font-bold">…</button></div>{menuId === record.id && <div className="absolute bottom-12 right-2 z-10 rounded-xl border border-green-100 bg-paper p-1 shadow-lg"><button type="button" onClick={() => props.onDeleteRecord(record.id)} className="whitespace-nowrap px-3 py-2 text-xs font-bold text-coral-500">記録を削除</button></div>}</li>)}</ul></section>}

    {editing && <div className="fixed inset-0 z-40 flex items-end justify-center bg-green-950/35 px-3" onClick={() => setEditing(null)}><section className="w-full max-w-2xl rounded-t-[2rem] bg-paper px-5 pb-7 pt-5" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-bold text-green-950">{editing === "new" ? "やってみたいを追加" : "やってみたいを編集"}</h2><label className="mt-5 block text-sm font-bold">やってみたいこと<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label><label className="mt-4 block text-sm font-bold">気になった理由・覚えておきたいこと <span className="font-normal text-ink-soft">（任意）</span><textarea value={draft.memo ?? ""} maxLength={100} rows={3} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} className="mt-2 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-sm font-normal" /></label><label className="mt-4 block text-sm font-bold">関連URL <span className="font-normal text-ink-soft">（任意）</span><input type="url" value={draft.relatedUrl ?? ""} onChange={(event) => setDraft({ ...draft, relatedUrl: event.target.value })} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>{editing !== "new" && draft.relatedUrl && <a href={draft.relatedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-green-800 underline">関連リンクを見る ↗</a>}<div className="mt-6 flex gap-3"><button type="button" onClick={() => setEditing(null)} className="min-h-12 flex-1 rounded-full border border-green-100">キャンセル</button><button type="button" onClick={save} disabled={!draft.title.trim()} className="min-h-12 flex-1 rounded-full bg-coral-500 font-bold text-paper disabled:opacity-40">保存</button></div></section></div>}
  </div>;
}
