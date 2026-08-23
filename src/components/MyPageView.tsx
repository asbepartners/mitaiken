"use client";

import type { User } from "@supabase/supabase-js";
import type { Experience } from "@/data/experiences";
import { useState } from "react";
import { CustomListsMock } from "./CustomListsMock";

interface MyPageViewProps {
  user: User | null;
  loading: boolean;
  configured: boolean;
  onLogin: () => void;
  onSignOut: () => Promise<{ error: string | null }>;
  hiddenItems: Experience[];
  onRestoreHidden: (id: string) => void;
}

export function MyPageView({
  user,
  loading,
  configured,
  onLogin,
  onSignOut,
  hiddenItems,
  onRestoreHidden,
}: MyPageViewProps) {
  const [openList, setOpenList] = useState<"goshuin" | null>(null);

  if (openList === "goshuin") {
    return <CustomListsMock onBack={() => setOpenList(null)} />;
  }

  return (
    <div className="px-5 pb-8 pt-8">
      <header>
        <p className="text-sm font-medium text-green-700">わたしの記録</p>
        <h1 className="mt-1 text-2xl font-bold text-green-950">マイページ</h1>
      </header>

      <section className="mt-6 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.05)]">
        {loading ? (
          <p className="text-sm text-ink-soft">ログイン状態を確認しています…</p>
        ) : user ? (
          <>
            <p className="text-xs font-medium text-green-700">ログイン中</p>
            <p className="mt-1 break-all text-base font-bold text-green-950">{user.email}</p>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              この端末ではログイン状態が保持されます。
            </p>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="mt-5 rounded-full border border-green-100 px-5 py-2.5 text-sm font-medium text-ink-soft"
            >
              ログアウト
            </button>
          </>
        ) : (
          <>
            <p className="text-base font-bold text-green-950">記録を別の端末でも使えるように</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              メールでログインすると、これから記録をSupabaseへ保存できるようになります。
            </p>
            <button
              type="button"
              disabled={!configured}
              onClick={onLogin}
              className="mt-5 w-full rounded-full bg-green-800 py-3 text-sm font-bold text-paper disabled:opacity-40"
            >
              メールでログイン
            </button>
            {!configured && <p className="mt-3 text-xs text-coral-500">Supabaseの接続設定が必要です。</p>}
          </>
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.05)]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-green-700">好きなテーマで残す</p>
            <h2 className="mt-1 font-bold text-green-950">わたしのリスト</h2>
          </div>
          <button type="button" className="min-h-10 rounded-full bg-coral-100 px-3 text-sm font-bold text-coral-500">
            ＋ 作る
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpenList("goshuin")}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-green-100 bg-ivory/60 p-3 text-left"
        >
          <span className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#d66b62] bg-[#fffaf3] text-[10px] font-bold text-[#b84f49] shadow-sm [writing-mode:vertical-rl]">
            御朱印
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-green-950">御朱印を集める</span>
            <span className="mt-1 block text-xs text-ink-soft">2か所お参りした・3か所これから</span>
          </span>
          <span className="text-xl text-green-700" aria-hidden="true">›</span>
        </button>
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-paper p-5">
        <h2 className="font-bold text-green-950">データについて</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          現在の「やってみたい・やってみた・表示しない設定」は、この端末に保存されています。DBへの引き継ぎは次のステップで行います。
        </p>
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-paper p-5">
        <h2 className="font-bold text-green-950">表示しない体験</h2>
        {hiddenItems.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">表示しない設定の体験はありません。</p>
        ) : (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-green-800">
              {hiddenItems.length}件を確認する
            </summary>
            <ul className="mt-3 divide-y divide-green-100">
              {hiddenItems.map((experience) => (
                <li key={experience.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 text-sm font-medium text-green-950">
                    {experience.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestoreHidden(experience.id)}
                    className="shrink-0 rounded-full border border-green-100 px-3 py-1.5 text-xs font-medium text-green-800"
                  >
                    表示に戻す
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
