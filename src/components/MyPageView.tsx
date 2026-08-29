"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Experience } from "@/data/experiences";

interface MyPageViewProps {
  user: User | null;
  loading: boolean;
  configured: boolean;
  onLogin: () => void;
  onSignOut: () => Promise<{ error: string | null }>;
  hiddenItems: Experience[];
  onRestoreHidden: (id: string) => void;
}

function MenuLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const className = "flex min-h-12 items-center justify-between border-b border-green-100 py-3 text-sm font-medium text-green-950 last:border-b-0";
  if (external) return <a href={href} className={className}><span>{children}</span><span aria-hidden className="text-green-700">›</span></a>;
  return <Link href={href} className={className}><span>{children}</span><span aria-hidden className="text-green-700">›</span></Link>;
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
  return (
    <div className="px-5 pb-8 pt-8">
      <header>
        <p className="text-sm font-medium text-green-700">わたしの記録</p>
        <h1 className="mt-1 text-2xl font-bold text-green-950">マイページ</h1>
      </header>

      <section className="mt-6 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.05)]">
        <h2 className="font-bold text-green-950">アカウント</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-soft">ログイン状態を確認しています…</p>
        ) : user ? (
          <>
            <p className="mt-3 text-xs font-medium text-green-700">ログイン中</p>
            <p className="mt-1 break-all text-base font-bold text-green-950">{user.email}</p>
            <button type="button" onClick={() => void onSignOut()} className="mt-5 rounded-full border border-green-100 px-5 py-2.5 text-sm font-medium text-ink-soft">ログアウト</button>
          </>
        ) : (
          <>
            <p className="mt-3 text-base font-bold text-green-950">記録を大切に保存するために</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">メールアドレスで登録・ログインすると、記録をあなたのアカウントに保存できます。</p>
            <button type="button" disabled={!configured} onClick={onLogin} className="mt-5 w-full rounded-full bg-green-800 py-3 text-sm font-bold text-paper disabled:opacity-40">メールで登録・ログイン</button>
            {!configured && <p className="mt-3 text-xs text-coral-500">現在、ログイン機能を利用できません。</p>}
          </>
        )}
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-paper p-5">
        <h2 className="font-bold text-green-950">設定</h2>
        <details className="mt-2">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-medium text-green-950">
            <span>表示しない体験</span><span className="text-green-700">{hiddenItems.length ? `${hiddenItems.length}件` : "なし"} ›</span>
          </summary>
          {hiddenItems.length === 0 ? (
            <p className="pb-2 text-sm text-ink-soft">表示しない設定の体験はありません。</p>
          ) : (
            <ul className="border-t border-green-100">
              {hiddenItems.map((experience) => (
                <li key={experience.id} className="flex items-center gap-3 border-b border-green-100 py-3 last:border-b-0">
                  <span className="min-w-0 flex-1 text-sm font-medium text-green-950">{experience.title}</span>
                  <button type="button" onClick={() => onRestoreHidden(experience.id)} className="shrink-0 rounded-full border border-green-100 px-3 py-1.5 text-xs font-medium text-green-800">表示に戻す</button>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>

      <section className="mt-5 rounded-3xl border border-green-100 bg-paper px-5 py-3">
        <h2 className="py-2 font-bold text-green-950">このアプリについて</h2>
        <MenuLink href="/terms">利用規約</MenuLink>
        <MenuLink href="/privacy">プライバシーポリシー</MenuLink>
        <MenuLink href="mailto:contact@hajimetecho.jp" external>お問い合わせ</MenuLink>
      </section>

      {user && (
        <section className="mt-7 px-1">
          <h2 className="text-sm font-bold text-ink-soft">アカウント管理</h2>
          <p className="mt-3 text-sm text-ink-soft">アカウントの削除は、次の実装ステップで安全な確認画面と削除処理を追加します。</p>
        </section>
      )}
    </div>
  );
}
