"use client";

import Link from "next/link";
import { useState } from "react";
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

function UserIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-coral-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19c.8-3.5 3.1-5.25 6.5-5.25S17.7 15.5 18.5 19" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-coral-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7.4 7.4 0 0 0-.08-1l2-1.55-2-3.45-2.45 1a7.6 7.6 0 0 0-1.72-1L14.4 3.4h-4.8L9.25 6a7.6 7.6 0 0 0-1.72 1L5.08 6l-2 3.45 2 1.55A7.4 7.4 0 0 0 5 12c0 .34.03.67.08 1l-2 1.55 2 3.45 2.45-1a7.6 7.6 0 0 0 1.72 1l.35 2.6h4.8l.35-2.6a7.6 7.6 0 0 0 1.72-1l2.45 1 2-3.45-2-1.55c.05-.33.08-.66.08-1Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-coral-500" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5V16" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 font-bold text-green-950">{icon}<span>{children}</span></h2>;
}

function MenuLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const className = "flex min-h-12 items-center justify-between border-b border-green-100 py-3 text-sm font-medium text-green-950 last:border-b-0";
  const body = <><span>{children}</span><span aria-hidden className="text-green-700">›</span></>;
  return external ? <a href={href} className={className}>{body}</a> : <Link href={href} className={className}>{body}</Link>;
}

export function MyPageView({ user, loading, configured, onLogin, onSignOut, hiddenItems, onRestoreHidden }: MyPageViewProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    const result = await onSignOut();
    if (result.error) {
      setSignOutError(result.error);
      setSigningOut(false);
    }
  }

  return (
    <div className="px-5 pb-8 pt-8">
      <header>
        <h1 className="text-2xl font-bold text-green-950">マイページ</h1>
      </header>

      <section className="mt-6 rounded-3xl border border-green-100 bg-paper p-5 shadow-[0_2px_10px_rgba(44,38,32,0.05)]">
        <SectionTitle icon={<UserIcon />}>アカウント</SectionTitle>
        {loading ? (
          <p className="mt-3 text-sm text-ink-soft">ログイン状態を確認しています…</p>
        ) : user ? (
          <>
            <p className="mt-3 text-xs font-medium text-green-700">ログイン中</p>
            <p className="mt-1 break-all text-base font-bold text-green-950">{user.email}</p>
            <p className="mt-4 text-xs leading-5 text-ink-soft">ログアウトすると、この端末内の個人データを削除します。アカウントに保存された記録は削除されません。</p>
            {signOutError && <p className="mt-3 text-sm font-bold text-coral-500">{signOutError}</p>}
            <button type="button" disabled={signingOut} onClick={() => void handleSignOut()} className="mt-4 w-full rounded-full border border-green-200 px-5 py-2.5 text-sm font-bold text-green-800 disabled:opacity-50">{signingOut ? "ログアウトしています…" : "ログアウト"}</button>
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
        <SectionTitle icon={<SettingsIcon />}>設定</SectionTitle>
        <details className="mt-2">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-medium text-green-950">
            <span>表示しない体験</span>
            <span className="text-green-700">{hiddenItems.length ? `${hiddenItems.length}件` : "なし"} ›</span>
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
        <div className="py-2"><SectionTitle icon={<InfoIcon />}>このアプリについて</SectionTitle></div>
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
