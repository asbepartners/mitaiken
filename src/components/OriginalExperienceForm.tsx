"use client";

import { ChangeEvent, useState } from "react";
import { categoryFromCode } from "@/data/experiences";
import type { ExperienceTargetDraft } from "@/hooks/useExperienceTargets";
import type { CustomExperienceDraft } from "@/hooks/useCustomExperiences";
import type { SearchMasters } from "@/hooks/useSearchMasters";

interface Props {
  existingTitles: string[];
  initialExperience?: CustomExperienceDraft;
  initialCategoryCode?: string;
  masters: SearchMasters;
  mastersLoading: boolean;
  mastersError: boolean;
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

export function OriginalExperienceForm({ existingTitles, initialExperience, initialCategoryCode, masters, mastersLoading, mastersError, allowAddingTargets = true, onClose, onSubmit }: Props) {
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  const editing = Boolean(initialExperience);
  const [step, setStep] = useState<"experience" | "targets">("experience");
  const [title, setTitle] = useState(initialExperience?.title ?? "");
  const [description, setDescription] = useState(initialExperience?.description ?? "");
  const initialCategoryId = initialExperience?.categoryId
    ?? masters.categories.find(({ code }) => code === initialExperience?.categoryCode)?.id
    ?? masters.categories.find(({ code }) => code === initialCategoryCode)?.id
    ?? masters.categories[0]?.id
    ?? "";
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [image, setImage] = useState<string | undefined>(initialExperience?.image);
  const [locationOptionId, setLocationOptionId] = useState(initialExperience?.locationOptionId ?? "");
  const [durationOptionId, setDurationOptionId] = useState(initialExperience?.durationOptionId ?? "");
  const [budgetOptionId, setBudgetOptionId] = useState(initialExperience?.budgetOptionId ?? "");
  const initialPeopleMode = initialExperience?.minPeople === undefined
    ? "unset"
    : initialExperience.minPeople === 1 && initialExperience.maxPeople === undefined
      ? "solo"
      : initialExperience.minPeople === 2 && initialExperience.maxPeople === undefined
        ? "group"
        : "fixed";
  const [peopleMode, setPeopleMode] = useState<"unset" | "solo" | "group" | "fixed">(initialPeopleMode);
  const [fixedPeople, setFixedPeople] = useState(initialPeopleMode === "fixed" ? initialExperience?.minPeople ?? 4 : 4);
  const [withTargets, setWithTargets] = useState(false);
  const [targets, setTargets] = useState<ExperienceTargetDraft[]>([emptyTarget()]);
  const [saving, setSaving] = useState(false);
  const effectiveCategoryId = categoryId
    || masters.categories.find(({ code }) => code === initialExperience?.categoryCode)?.id
    || masters.categories.find(({ code }) => code === initialCategoryCode)?.id
    || masters.categories[0]?.id
    || "";
  const duplicate = existingTitles.some((value) => value.trim().toLocaleLowerCase("ja") === title.trim().toLocaleLowerCase("ja"));
  const validTargets = targets.filter((target) => target.title.trim());
  const targetDuplicate = new Set(validTargets.map((target) => target.title.trim().toLocaleLowerCase("ja"))).size !== validTargets.length;
  const conditionCount = [locationOptionId, durationOptionId, budgetOptionId, peopleMode !== "unset"].filter(Boolean).length;

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setImage(await resizeImage(file));
  }

  async function save() {
    const category = masters.categories.find(({ id }) => id === effectiveCategoryId);
    if (!title.trim() || !category || duplicate || (withTargets && (!validTargets.length || targetDuplicate))) return;
    const location = masters.locations.find(({ id }) => id === locationOptionId);
    const duration = masters.durations.find(({ id }) => id === durationOptionId);
    const budget = masters.budgets.find(({ id }) => id === budgetOptionId);
    const minPeople = peopleMode === "solo" ? 1 : peopleMode === "group" ? 2 : peopleMode === "fixed" ? fixedPeople : undefined;
    const maxPeople = peopleMode === "fixed" ? fixedPeople : undefined;
    setSaving(true);
    await onSubmit({
      title,
      description,
      category: categoryFromCode(category.code),
      categoryId: category.id,
      categoryCode: category.code,
      categoryLabel: category.label,
      image,
      locationOptionId: location?.id,
      locationCode: location?.code,
      locationLabel: location?.label,
      durationOptionId: duration?.id,
      durationCode: duration?.code,
      durationLabel: duration?.label,
      durationMinMinutes: duration?.minMinutes,
      durationMaxMinutes: duration?.maxMinutes ?? undefined,
      budgetOptionId: budget?.id,
      budgetCode: budget?.code,
      budgetLabel: budget?.label,
      budgetMinYen: budget?.minYen,
      budgetMaxYen: budget?.maxYen ?? undefined,
      minPeople,
      maxPeople,
    }, withTargets ? validTargets : []);
    setSaving(false);
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory">
    <main className="mx-auto min-h-full w-full max-w-2xl px-5 pb-10 pt-5">
      <button type="button" onClick={step === "targets" ? () => setStep("experience") : onClose} className="flex min-h-12 items-center gap-2 text-sm font-bold text-green-800"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-green-100 bg-paper text-2xl shadow-sm">←</span><span>{step === "targets" ? "体験の入力に戻る" : "やってみたいリストに戻る"}</span></button>
      <p className="mt-3 text-xs font-bold tracking-widest text-coral-500">オリジナル</p>
      <h1 className="mt-1 text-2xl font-bold text-green-950">{step === "experience" ? (editing ? (allowAddingTargets ? "体験を編集" : "リストを編集") : "体験を作る") : "行き先・項目を追加"}</h1>

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
            <label className="block text-sm font-bold text-green-950">カテゴリ <span className="text-coral-500">＊</span><select value={effectiveCategoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={mastersLoading || mastersError} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal disabled:opacity-60">{masters.categories.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            {mastersLoading && <p className="-mt-3 text-sm text-ink-soft">選択肢を読み込んでいます…</p>}
            {mastersError && <p className="-mt-3 text-sm font-bold text-coral-500">選択肢を読み込めませんでした。通信状態を確認して開き直してください。</p>}
          </div>
        </div>
        <details className="mt-5 rounded-3xl border border-green-100 bg-paper p-5 shadow-sm">
          <summary className="cursor-pointer font-bold text-green-950">場所・時間などを追加 <span className="text-sm font-normal text-ink-soft">（任意）{conditionCount > 0 && ` ${conditionCount}件入力済み`}</span></summary>
          <div className="mt-5 space-y-5">
            <label className="block text-sm font-bold text-green-950">場所<select value={locationOptionId} onChange={(e) => setLocationOptionId(e.target.value)} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"><option value="">未設定</option>{masters.locations.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label className="block text-sm font-bold text-green-950">所要時間<select value={durationOptionId} onChange={(e) => setDurationOptionId(e.target.value)} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"><option value="">未設定</option>{masters.durations.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label className="block text-sm font-bold text-green-950">ひとりあたりの予算目安<select value={budgetOptionId} onChange={(e) => setBudgetOptionId(e.target.value)} className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"><option value="">未設定</option>{masters.budgets.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <fieldset>
              <legend className="text-sm font-bold text-green-950">人数</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <PeopleChoice label="未設定" checked={peopleMode === "unset"} onChange={() => setPeopleMode("unset")} />
                {masters.people.map((option) => <PeopleChoice key={option.id} label={option.label} checked={peopleMode === (option.code === "solo" ? "solo" : "group")} onChange={() => setPeopleMode(option.code === "solo" ? "solo" : "group")} />)}
                <PeopleChoice label="人数を指定" checked={peopleMode === "fixed"} onChange={() => setPeopleMode("fixed")} />
              </div>
              {peopleMode === "fixed" && <label className="mt-3 flex items-center gap-3 text-sm font-medium text-green-950"><input type="number" inputMode="numeric" min={1} max={99} value={fixedPeople} onChange={(e) => setFixedPeople(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} className="w-24 rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal" />人で行う</label>}
            </fieldset>
          </div>
        </details>
        {allowAddingTargets && <fieldset className="mt-6"><legend className="text-base font-bold leading-7 text-green-950">この体験に、複数の行き先や項目がありますか？</legend>
          <p className="mt-1 text-sm leading-6 text-ink-soft">例：「行きたい国に旅行する」の中に、ノルウェーやスペインを登録する</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 ${!withTargets ? "border-coral-400 bg-coral-100" : "border-green-100 bg-paper"}`}><input type="radio" checked={!withTargets} onChange={() => setWithTargets(false)} className="accent-[#e87871]" /><strong className="text-green-950">いいえ</strong></label>
            <label className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 ${withTargets ? "border-coral-400 bg-coral-100" : "border-green-100 bg-paper"}`}><input type="radio" checked={withTargets} onChange={() => setWithTargets(true)} className="accent-[#e87871]" /><strong className="text-green-950">はい</strong></label>
          </div>
        </fieldset>}
        <button type="button" onClick={withTargets && allowAddingTargets ? () => setStep("targets") : save} disabled={!title.trim() || !effectiveCategoryId || duplicate || saving || mastersLoading || mastersError} className="mt-7 min-h-12 w-full rounded-full bg-coral-500 px-6 font-bold text-paper disabled:opacity-40">{withTargets && allowAddingTargets ? "行き先・項目の入力へ" : (editing ? "変更を保存" : "やってみたいに追加")}</button>
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

function PeopleChoice({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${checked ? "border-coral-400 bg-coral-100" : "border-green-100 bg-ivory"}`}><input type="radio" checked={checked} onChange={onChange} className="accent-[#e87871]" /><span>{label}</span></label>;
}
