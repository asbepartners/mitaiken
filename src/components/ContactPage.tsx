"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase";

export function ContactPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: real users never fill this in
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !message.trim()) return;

    if (website.trim()) {
      // Likely a bot: pretend it worked without writing anything.
      setSent(true);
      return;
    }

    setSending(true);
    setError(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabaseに接続できませんでした。");
      setSending(false);
      return;
    }

    const { error: insertError } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      email: email.trim() || user?.email || null,
      message: message.trim(),
    });

    setSending(false);
    if (insertError) {
      setError("送信できませんでした。通信状況をご確認のうえ、もう一度お試しください。");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-ivory bg-paper-texture px-4 py-8 font-body sm:py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-green-100 bg-paper px-5 py-8 shadow-[0_2px_10px_rgba(44,38,32,0.05)] sm:px-10 sm:py-10">
        <header className="mb-9 border-b border-green-100 pb-6">
          <Link href="/" className="text-sm font-bold text-coral-500">
            ← トップに戻る
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-wide text-green-950 sm:text-3xl">
            お問い合わせ
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            ご意見・ご感想、不具合の報告など、お気軽にお送りください。
          </p>
        </header>

        {sent ? (
          <p className="rounded-2xl border border-green-100 bg-green-100/45 px-5 py-6 text-center text-sm leading-7 text-green-800">
            送信しました。ありがとうございます。
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-bold text-green-950">
              メールアドレス <span className="font-normal text-ink-soft">（任意・返信が必要な場合）</span>
              <input
                type="email"
                value={email}
                placeholder={user?.email ?? "example@example.com"}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"
              />
            </label>
            <label className="block text-sm font-bold text-green-950">
              お問い合わせ内容 <span className="text-coral-500">＊</span>
              <textarea
                value={message}
                maxLength={4000}
                rows={6}
                required
                placeholder="気づいたこと、気になったことなど"
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"
              />
            </label>
            <label className="sr-only" aria-hidden="true">
              サイト
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>

            {error && <p className="text-sm font-medium text-coral-500">{error}</p>}

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="mt-2 min-h-12 w-full rounded-full bg-coral-500 px-6 font-bold text-paper disabled:opacity-40"
            >
              {sending ? "送信しています…" : "送信する"}
            </button>
          </form>
        )}
      </article>
    </main>
  );
}
