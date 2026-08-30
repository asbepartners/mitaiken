"use client";
import { useEffect, useMemo, useState } from "react";
import { experienceCategoryLabel, type Experience } from "@/data/experiences";
import type { TriedRecord } from "@/hooks/useExperienceStatus";
import type { ExperienceTarget, ExperienceTargetDraft } from "@/hooks/useExperienceTargets";
import { BookmarkIcon } from "./RecordIcons";
import { ExperienceRecordTimeline } from "./ExperienceRecordTimeline";
import { ExperienceConditions } from "./ExperienceConditions";
import { imageSource } from "@/lib/imageSource";

interface Props {
  experience: Experience; targets: ExperienceTarget[]; records: TriedRecord[]; onBack: () => void;
  backLabel: string;
  onMarkTried: (target: ExperienceTarget) => void; onAddTarget: (draft: ExperienceTargetDraft) => boolean;
  onUpdateTarget: (id: string, draft: ExperienceTargetDraft) => boolean; onRemoveTarget: (id: string) => void;
  onEditRecord: (recordId: string) => void; onDeleteRecord: (recordId: string) => void;
  onAddRecord?: () => void;
  detailLabel?: string;
}

export function CollectionDetailView(props: Props) {
  const { experience, targets, records } = props;
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const [editing, setEditing] = useState<ExperienceTarget | "new" | null>(null);
  const [draft, setDraft] = useState<ExperienceTargetDraft>({ title: "", memo: "", relatedUrl: "" });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [choosingRecordTarget, setChoosingRecordTarget] = useState(false);
  const isCollection = Boolean(experience.exampleTargets);
  const recordByTarget = useMemo(() => new Map(targets.map((target) => [target.id, records.find((record) => record.targetId === target.id || (!record.targetId && record.place === target.title))])), [records, targets]);
  const recordCountByTarget = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records) {
      const targetId = record.targetId ?? targets.find((target) => target.title === record.place)?.id;
      if (targetId) counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
    }
    return counts;
  }, [records, targets]);
  const pending = targets.filter((target) => !recordByTarget.get(target.id));
  const completedRecords = records;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [experience.id]);

  function openForm(target: ExperienceTarget | "new") { setEditing(target); setDraft(target === "new" ? { title: "", memo: "", relatedUrl: "" } : { title: target.title, memo: target.memo, relatedUrl: target.relatedUrl }); }
  function save() { const ok = editing === "new" ? props.onAddTarget(draft) : editing ? props.onUpdateTarget(editing.id, draft) : false; if (ok) setEditing(null); }
  function mark(target: ExperienceTarget) { if (markingId) return; setMarkingId(target.id); window.setTimeout(() => { setMarkingId(null); props.onMarkTried(target); }, 340); }
  function markSingle() { if (markingId) return; setMarkingId(experience.id); window.setTimeout(() => { setMarkingId(null); props.onAddRecord?.(); }, 340); }
  function addCollectionRecord() {
    if (targets.length === 1) {
      props.onMarkTried(targets[0]);
      return;
    }
    if (targets.length > 1) setChoosingRecordTarget(true);
  }

  return <div className="px-4 pb-6">
    <div className="sticky top-0 z-20 -mx-4 border-b border-green-100 bg-ivory/95 px-4 py-2 backdrop-blur"><button type="button" onClick={props.onBack} className="flex min-h-12 items-center gap-2 rounded-full pr-4 text-base font-bold text-green-800"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-coral-300 bg-coral-100 text-2xl text-coral-500 shadow-sm">←</span><span>{props.backLabel}</span></button></div>
    <header className="mt-3 overflow-hidden rounded-3xl border border-green-100 bg-paper shadow-[0_2px_12px_rgba(44,38,32,0.06)]">
      <div className="h-44 w-full overflow-hidden bg-ivory">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSource(experience.image, assetBase)} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="p-5">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-green-700">{props.detailLabel ?? "はじめての詳細"}</p>
            <h1 className="mt-1 text-xl font-bold text-green-950">{experience.title}</h1>
          </div>
          {!isCollection && <button type="button" onClick={markSingle} disabled={markingId !== null} className="shrink-0 text-coral-500">
            <span className={markingId === experience.id ? "heart-pop" : ""}><BookmarkIcon filled={markingId === experience.id} className="mx-auto h-8 w-8" /></span>
            <span className="mt-1 block text-[9px] font-bold">{records.length > 0 ? "記録を追加" : "やってみた！"}</span>
          </button>}
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{experience.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-green-800">{experienceCategoryLabel(experience)}</span>
          <ExperienceConditions experience={experience} className="text-xs font-medium text-ink-soft" />
        </div>
        <div className="mt-4 flex gap-2 text-xs font-bold">
          {isCollection && <span className="rounded-full bg-coral-100 px-3 py-1.5 text-coral-500">これから {pending.length}件</span>}
          <span className="rounded-full bg-gold-100 px-3 py-1.5 text-[#936b25]">記録 {completedRecords.length}件</span>
        </div>
        {isCollection && <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => openForm("new")} className="min-h-11 rounded-full border border-coral-300 bg-paper px-3 text-sm font-bold text-coral-500">＋ 項目を追加</button>
          <button type="button" onClick={addCollectionRecord} disabled={targets.length === 0} className="min-h-11 rounded-full bg-coral-500 px-3 text-sm font-bold text-paper disabled:opacity-40">＋ 記録を追加</button>
        </div>}
      </div>
    </header>

    {isCollection && <section className="mt-5"><h2 className="px-1 text-lg font-bold text-green-950">これから</h2>
      {pending.length ? <ul className="mt-3 space-y-2.5">{pending.map((target) => <li key={target.id} className="relative flex min-h-28 items-center gap-3 rounded-2xl border border-green-100 bg-paper py-2 pl-4 pr-2 shadow-sm"><button type="button" onClick={() => openForm(target)} className="min-w-0 flex-1 text-left"><p className="font-bold text-green-950">{target.title}</p>{target.memo && <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-soft">{target.memo}</p>}</button><div className="flex w-[5.5rem] shrink-0 flex-col items-center"><button type="button" onClick={() => mark(target)} disabled={markingId !== null} className="text-coral-500"><span className={markingId === target.id ? "heart-pop" : ""}><BookmarkIcon filled={markingId === target.id} className="h-8 w-8" /></span><span className="block text-[9px] font-bold">やってみた！</span></button><div className="mt-1 flex gap-1"><button type="button" onClick={() => openForm(target)} className="min-h-8 whitespace-nowrap rounded-full bg-green-100 px-2.5 text-xs font-bold text-green-800">編集</button><button type="button" onClick={() => setMenuId(menuId === target.id ? null : target.id)} className="h-8 w-8 shrink-0 rounded-full bg-ivory-deep font-bold">…</button></div></div>{menuId === target.id && <div className="absolute bottom-2 right-12 z-10 rounded-xl border border-green-100 bg-paper p-1 shadow-lg"><button type="button" onClick={() => props.onRemoveTarget(target.id)} className="whitespace-nowrap px-3 py-2 text-xs font-bold text-coral-500">リストから外す</button></div>}</li>)}</ul> : <p className="mt-3 rounded-2xl border border-dashed border-green-100 bg-paper px-4 py-5 text-center text-sm leading-6 text-ink-soft">すべての項目に記録があります。<br />別の記録も追加できます。</p>}
    </section>}

    {completedRecords.length > 0 && <section className="mt-7 border-t border-green-100 pt-6"><h2 className="px-1 text-lg font-bold text-green-950">やってみた記録</h2><div className="mt-3"><ExperienceRecordTimeline experience={experience} records={completedRecords} targets={targets} onEditRecord={props.onEditRecord} onDeleteRecord={(recordId) => { props.onDeleteRecord(recordId); setMenuId(null); }} openMenuId={menuId} onToggleMenu={(recordId) => setMenuId(menuId === recordId ? null : recordId)} /></div></section>}

    {choosingRecordTarget && <div className="fixed inset-0 z-40 flex items-end justify-center overflow-x-hidden bg-green-950/35 px-3" onClick={() => setChoosingRecordTarget(false)}><section className="min-w-0 w-full max-w-2xl rounded-t-[2rem] bg-paper px-5 pb-7 pt-5" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-green-950">記録する項目を選ぶ</h2><p className="mt-1 text-sm leading-6 text-ink-soft">どの行き先・項目の記録を追加しますか？</p></div><button type="button" onClick={() => setChoosingRecordTarget(false)} aria-label="閉じる" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-coral-500">×</button></div><ul className="mt-5 max-h-[55vh] space-y-2 overflow-y-auto">{targets.map((target) => { const count = recordCountByTarget.get(target.id) ?? 0; return <li key={target.id}><button type="button" onClick={() => { setChoosingRecordTarget(false); props.onMarkTried(target); }} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-left"><span className="font-bold text-green-950">{target.title}</span><span className="shrink-0 text-xs font-medium text-ink-soft">{count > 0 ? `記録 ${count}件` : "まだ記録なし"} ›</span></button></li>; })}</ul></section></div>}

    {editing && <div className="fixed inset-0 z-40 flex items-end justify-center overflow-x-hidden bg-green-950/35 px-3" onClick={() => setEditing(null)}><section className="min-w-0 w-full max-w-2xl rounded-t-[2rem] bg-paper px-5 pb-7 pt-5" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-bold text-green-950">{editing === "new" ? "項目を追加" : "項目を編集"}</h2><label className="mt-5 block text-sm font-bold">行き先・項目 <span className="text-coral-500">＊</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-2 min-w-0 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label><label className="mt-4 block text-sm font-bold">気になった理由・覚えておきたいこと <span className="font-normal text-ink-soft">（任意）</span><textarea value={draft.memo ?? ""} maxLength={100} rows={3} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} className="mt-2 min-w-0 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label><label className="mt-4 block text-sm font-bold">関連URL <span className="font-normal text-ink-soft">（任意）</span><input type="url" value={draft.relatedUrl ?? ""} onChange={(event) => setDraft({ ...draft, relatedUrl: event.target.value })} className="mt-2 min-w-0 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>{editing !== "new" && draft.relatedUrl && <a href={draft.relatedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block max-w-full truncate text-sm font-bold text-green-800 underline">関連リンクを見る ↗</a>}<div className="mt-6 flex gap-3"><button type="button" onClick={() => setEditing(null)} className="min-h-12 flex-1 rounded-full border border-green-100">キャンセル</button><button type="button" onClick={save} disabled={!draft.title.trim()} className="min-h-12 flex-1 rounded-full bg-coral-500 font-bold text-paper disabled:opacity-40">保存</button></div></section></div>}
  </div>;
}
