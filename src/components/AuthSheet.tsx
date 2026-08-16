"use client";

import { FormEvent, useEffect, useState } from "react";

interface AuthSheetProps {
  onClose: () => void;
  onSendOtp: (email: string) => Promise<{ error: string | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
}

export function AuthSheet({ onClose, onSendOtp, onVerifyOtp }: AuthSheetProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await onSendOtp(email.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("code");
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await onVerifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="閉じる" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative w-full max-w-sm animate-[slide-up_0.2s_ease-out] rounded-t-3xl bg-paper px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl sm:pb-6">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-green-100 sm:hidden" />
        <p className="text-sm font-medium text-green-700">わたしの記録をつなぐ</p>
        <h2 className="mt-1 text-xl font-bold text-green-950">
          {step === "email" ? "メールでログイン" : "確認コードを入力"}
        </h2>

        {step === "email" ? (
          <form onSubmit={handleSend} className="mt-5 flex flex-col gap-4">
            <p className="text-sm leading-6 text-ink-soft">
              パスワードは不要です。メールに6桁の確認コードをお送りします。
            </p>
            <label className="text-sm font-medium text-green-900">
              メールアドレス
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-base text-ink outline-none focus:border-green-700"
              />
            </label>
            {error && <p className="text-sm text-coral-500">{error}</p>}
            <button type="submit" disabled={busy} className="rounded-full bg-green-800 py-3 text-sm font-bold text-paper disabled:opacity-50">
              {busy ? "送信中…" : "確認コードを送る"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-ink-soft">あとで</button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-5 flex flex-col gap-4">
            <p className="text-sm leading-6 text-ink-soft">
              <span className="font-medium text-green-900">{email}</span> に届いた6桁のコードを入力してください。
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              aria-label="6桁の確認コード"
              className="w-full rounded-2xl border border-green-100 bg-ivory px-4 py-3 text-center text-2xl tracking-[0.35em] text-ink outline-none focus:border-green-700"
            />
            {error && <p className="text-sm text-coral-500">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6} className="rounded-full bg-green-800 py-3 text-sm font-bold text-paper disabled:opacity-50">
              {busy ? "確認中…" : "ログインする"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="text-sm text-ink-soft">
              メールアドレスを変更
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
