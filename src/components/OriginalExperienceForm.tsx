"use client";

import { ChangeEvent, useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, Category } from "@/data/experiences";
import type { ExperienceTargetDraft } from "@/hooks/useExperienceTargets";
import type { CustomExperienceDraft } from "@/hooks/useCustomExperiences";

interface Props {
  existingTitles: string[];
  initialExperience?: CustomExperienceDraft;
  allowAddingTargets?: boolean;
  onClose: () => void;
  onSubmit: (experience: CustomExperienceDraft, targets: ExperienceTargetDraft[]) => Promise<void>;
}

const emptyTarget = (): ExperienceTargetDraft => ({ title: "", memo: "", relatedUrl: "" });

async function resizeImage(file: File) {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function OriginalExperienceForm({ existingTitles, initialExperience, allowAddingTargets = true, onClose, onSubmit }: Props) {
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const editing = Boolean(initialExperience);
  const [step, setStep] = useState<"experience" | "targets">("experience");
  const [title, setTitle] = useState(initialExperience?.title ?? "");
  const [description, setDescription] = useState(initialExperience?.description ?? "");
  const [category, setCategory] = useState<Category>(initialExperience?.category ?? "outing");
  const [image, setImage] = useState<string | undefined>(initialExperience?.image);
  const [withTargets, setWithTargets] = useState(false);
  const [targets, setTargets] = useState<ExperienceTargetDraft[]>([emptyTarget()]);
  const [saving, setSaving] = useState(false);
  const duplicate = existingTitles.some((value) => value.trim().toLocaleLowerCase("ja") === title.trim().toLocaleLowerCase("ja"));
  const validTargets = targets.filter((target) => target.title.trim());
  const targetDuplicate = new Set(validTargets.map((target) => target.title.trim().toLocaleLowerCase("ja"))).size !== validTargets.length;

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setImage(await resizeImage(file));
  }

  async function save() {
    if (!title.trim() || duplicate || (withTargets && (!validTargets.length || targetDuplicate))) return;
    setSaving(true);
    await onSubmit({ title, description, category, image }, withTargets ? validTargets : []);
    setSaving(false);
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory">
    <main className="mx-auto min-h-full w-full max-w-2xl px-5 pb-10 pt-5">
      <button type="button" onClick={step === "targets" ? () => setStep("experience") : onClose} className="flex min-h-12 items-center gap-2 text-sm font-bold text-green-800"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-green-100 bg-paper text-2xl shadow-sm">←</span><span>{step === "targets" ? "体験の入力に戻る" : "やってみたいリストに戻る"}</span></button>
      <p className="mt-3 text-xs font-bold tracking-widest text-coral-500">オリジナル</p>
      <h1 className="mt-1 text-2xl font-bold text-green-950">{step === "experience" ? (editing ? "体験を編集" : "体験を作る") : "場所や項目を追加"}</h1>

      {step === "experience" ? <>
        <div className="mt-6 overflow-hidden rounded-3xl border border-green-100 bg-paper shadow-sm">
          <div className="relative flex h-36 items-center justify-center bg-green-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image ?? `${assetBase}/experiences/noimage.svg`} alt={image ? "選択した見出し" : "共通の見出しイラスト"} className="h-full w-full object-cover" />
            <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-paper px-4 py-2 text-sm font-bold text-green-800 shadow"><input type="file" accept="image/*" className="sr-only" onChange={chooseImage} />{image ? "画像を変更" : "写真を選ぶ"}</label>
          </div>
          <div className="space-y-5 p-5">
            <label className="block text-sm font-bold text-green-950">体験名 <span className="text-coral-500">＊</span><input value={title} maxLength={60} placeholder="例：屋形船に乗る" onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>
            {duplicate && <p className="-mt-3 text-sm font-bold text-coral-500">同じ名前の体験がすでにあります。</p>}
            <label className="block text-sm font-bold text-green-950">説明 <span className="font-normal text-ink-soft">（任意）</span><textarea value={description} maxLength={120} rows={3} placeholder="どんな体験にしたいか、ひとこと" onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>
            <label className="block text-sm font-bold text-green-950">カテゴリ <span className="text-coral-500">＊</span><select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal">{CATEGORY_ORDER.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}</select></label>
          </div>
        </div>
        {allowAddingTargets && <fieldset className="mt-6"><legend className="text-base font-bold leading-7 text-green-950">この体験に、場所や項目を<br />追加しますか？</legend>
          <label className={`mt-3 flex cursor-pointer gap-3 rounded-2xl border p-4 ${!withTargets ? "border-coral-400 bg-coral-100" : "border-green-100 bg-paper"}`}><input type="radio" checked={!withTargets} onChange={() => setWithTargets(false)} className="mt-1 accent-[#e87871]" /><span><strong className="block text-green-950">追加しない</strong><small className="mt-1 block text-ink-soft">ひとつの体験として登録します</small></span></label>
          <label className={`mt-3 flex cursor-pointer gap-3 rounded-2xl border p-4 ${withTargets ? "border-coral-400 bg-coral-100" : "border-green-100 bg-paper"}`}><input type="radio" checked={withTargets} onChange={() => setWithTargets(true)} className="mt-1 accent-[#e87871]" /><span><strong className="block text-green-950">追加する</strong><small className="mt-1 block text-ink-soft">場所やお店などを分けて登録します</small></span></label>
        </fieldset>}
        <button type="button" onClick={withTargets && allowAddingTargets ? () => setStep("targets") : save} disabled={!title.trim() || duplicate || saving} className="mt-7 min-h-12 w-full rounded-full bg-coral-500 px-6 font-bold text-paper disabled:opacity-40">{withTargets && allowAddingTargets ? "場所や項目の入力へ" : (editing ? "変更を保存" : "やってみたいに追加")}</button>
      </> : <>
        <p className="mt-3 text-sm leading-6 text-ink-soft">「{title}」で行きたい場所や、集めたい項目を追加しましょう。</p>
        <div className="mt-5 space-y-4">{targets.map((target, index) => <section key={index} className="rounded-3xl border border-green-100 bg-paper p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-bold text-green-950">項目 {index + 1}</h2>{targets.length > 1 && <button type="button" onClick={() => setTargets(targets.filter((_, i) => i !== index))} className="min-h-10 px-2 text-sm font-bold text-coral-500">削除</button>}</div>
          <label className="mt-3 block text-sm font-bold">項目名 <span className="text-coral-500">＊</span><input value={target.title} placeholder="例：○○ダイニング" onChange={(e) => setTargets(targets.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>
          <label className="mt-4 block text-sm font-bold">メモ <span className="font-normal text-ink-soft">（任意）</span><textarea value={target.memo} maxLength={100} rows={3} placeholder="例：テレビで紹介されていた、かき氷がおいしいお店" onChange={(e) => setTargets(targets.map((item, i) => i === index ? { ...item, memo: e.target.value } : item))} className="mt-2 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>
          <label className="mt-4 block text-sm font-bold">関連URL <span className="font-normal text-ink-soft">（任意）</span><input type="url" value={target.relatedUrl} placeholder="https://" onChange={(e) => setTargets(targets.map((item, i) => i === index ? { ...item, relatedUrl: e.target.value } : item))} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" /></label>
        </section>)}</div>
        {targetDuplicate && <p className="mt-3 text-sm font-bold text-coral-500">同じ名前の項目が含まれています。</p>}
        <button type="button" onClick={() => setTargets([...targets, emptyTarget()])} className="mt-4 min-h-12 w-full rounded-full border border-coral-400 bg-paper font-bold text-coral-500">＋ 続けて追加</button>
        <button type="button" onClick={save} disabled={!validTargets.length || targetDuplicate || saving} className="mt-5 min-h-12 w-full rounded-full bg-coral-500 px-6 font-bold text-paper disabled:opacity-40">{saving ? "保存しています…" : (editing ? "変更を保存" : "やってみたいに追加")}</button>
      </>}
    </main>
  </div>;
}
