"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import { resizeImage } from "@/lib/resizeImage";

const CATEGORIES = [
  { value: "feedback", label: "ご意見・ご感想" },
  { value: "bug", label: "不具合の報告" },
  { value: "request", label: "ご要望（マスタ追加など）" },
  { value: "other", label: "その他" },
] as const;

export function ContactPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [website, setWebsite] = useState(""); // honeypot: real users never fill this in
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const sent = sentEmail !== null;
  const emailPrefilled = useRef(false);

  // Fill in the logged-in user's email once (not on every render), so it's
  // visible and editable rather than a hidden default -- if they clear it,
  // that's a deliberate "don't reply" choice, not something to override.
  useEffect(() => {
    if (!emailPrefilled.current && user?.email) {
      setEmail(user.email);
      emailPrefilled.current = true;
    }
  }, [user]);

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setImage(await resizeImage(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !category || !message.trim()) return;

    if (website.trim()) {
      // Likely a bot: pretend it worked without writing anything.
      setSentEmail(email.trim() || "");
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
      email: email.trim() || null,
      category,
      message: message.trim(),
      image: image ?? null,
    });

    setSending(false);
    if (insertError) {
      setError("送信できませんでした。通信状況をご確認のうえ、もう一度お試しください。");
      return;
    }
    setSentEmail(email.trim() || "");
  }

  return (
    <main className="min-h-screen bg-ivory bg-paper-texture px-4 py-8 font-body sm:py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-green-100 bg-paper px-5 py-8 shadow-[0_2px_10px_rgba(44,38,32,0.05)] sm:px-10 sm:py-10">
        <header className="mb-9 border-b border-green-100 pb-6">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="text-sm font-bold text-coral-500"
          >
            ← 戻る
          </button>
          <h1 className="mt-3 text-2xl font-bold tracking-wide text-green-950 sm:text-3xl">
            お問い合わせ
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            ご意見・ご感想、不具合の報告など、お気軽にお送りください。
          </p>
        </header>

        {sent ? (
          <div className="rounded-2xl border border-green-100 bg-green-100/45 px-5 py-6 text-center text-sm leading-7 text-green-800">
            <p>送信しました。ありがとうございます。</p>
            {sentEmail && (
              <p className="mt-2">
                ご入力いただいたメールアドレス「{sentEmail}」宛に、内容を確認のうえご返信いたします（お返事まで数営業日いただく場合があります）。メールアドレスが間違っている場合は、恐れ入りますがもう一度送信してください。
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-bold text-green-950">
              種別 <span className="text-coral-500">＊</span>
              <select
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"
              >
                <option value="" disabled>選択してください</option>
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-green-950">
              メールアドレス{" "}
              <span className="font-normal text-ink-soft">
                （任意・返信が必要な場合。ログイン中はご利用のメールアドレスが自動で入ります。返信不要なら空欄にしてください）
              </span>
              <input
                type="email"
                value={email}
                placeholder="example@example.com"
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
                placeholder="気づいたこと、気になったことなど。不具合の場合は、どんな操作をしたときに何が起きたかを書いていただけると助かります。"
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full resize-none rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base font-normal"
              />
            </label>
            <div>
              <span className="block text-sm font-bold text-green-950">
                画像 <span className="font-normal text-ink-soft">（任意・画面のスクリーンショットなど）</span>
              </span>
              {image ? (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview, no benefit from next/image */}
                  <img src={image} alt="添付画像のプレビュー" className="h-20 w-20 rounded-xl object-cover" />
                  <button type="button" onClick={() => setImage(undefined)} className="rounded-full border border-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                    削除
                  </button>
                </div>
              ) : (
                <label className="mt-2 inline-flex cursor-pointer items-center rounded-full border border-green-100 bg-ivory px-4 py-2 text-sm font-medium text-green-800">
                  <input type="file" accept="image/*" className="sr-only" onChange={chooseImage} />
                  画像を選ぶ
                </label>
              )}
            </div>
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
              disabled={sending || !category || !message.trim()}
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
