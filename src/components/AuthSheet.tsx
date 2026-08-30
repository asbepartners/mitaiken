"use client";

import { FormEvent, useEffect, useState } from "react";
import { PrivacyContent, TermsContent } from "@/components/LegalContent";

type AuthMode = "signup" | "login";

interface AuthSheetProps {
  onClose: () => void;
  onAuthenticated: () => void;
  onSendOtp: (email: string, mode: AuthMode) => Promise<{ error: string | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  onGetLegalAcceptanceStatus: () => Promise<{ requiresAcceptance: boolean; reason: string | null; error: string | null }>;
  onRecordLegalAcceptance: () => Promise<{ error: string | null }>;
}

export function AuthSheet({ onClose, onAuthenticated, onSendOtp, onVerifyOtp, onGetLegalAcceptanceStatus, onRecordLegalAcceptance }: AuthSheetProps) {
  const [step, setStep] = useState<"choice" | "email" | "code" | "consent">("choice");
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalView, setLegalView] = useState<"terms" | "privacy" | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendWait, setResendWait] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = window.setInterval(() => {
      setResendWait((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendWait]);

  function chooseMode(nextMode: AuthMode) {
    setMode(nextMode);
    setLegalAccepted(false);
    setError(null);
    setStep("email");
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!mode) return;
    if (mode === "signup" && !legalAccepted) return;
    setBusy(true);
    setError(null);
    const result = await onSendOtp(email.trim(), mode);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResendWait(60);
    setStep("code");
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await onVerifyOtp(email.trim(), code.trim());
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }

    if (mode === "signup" && legalAccepted) {
      const acceptanceResult = await onRecordLegalAcceptance();
      if (acceptanceResult.error) {
        setBusy(false);
        setError(acceptanceResult.error);
        return;
      }
      setBusy(false);
      onAuthenticated();
      onClose();
      return;
    }

    const statusResult = await onGetLegalAcceptanceStatus();
    if (statusResult.error) {
      setBusy(false);
      setError(statusResult.error);
      return;
    }
    if (statusResult.requiresAcceptance) {
      setBusy(false);
      setLegalAccepted(false);
      setStep("consent");
      return;
    }

    setBusy(false);
    onAuthenticated();
    onClose();
  }

  async function handleResend() {
    if (!mode || busy || resendWait > 0) return;
    setBusy(true);
    setError(null);
    const result = await onSendOtp(email.trim(), mode);
    setBusy(false);
    if (result.error) {
      setError("確認コードを再送できませんでした。少し待ってから、もう一度お試しください。");
      return;
    }
    setCode("");
    setResendWait(60);
    setError("確認コードを再送しました。新しく届いたコードを入力してください。");
  }

  async function handleConsent() {
    if (!legalAccepted || busy) return;
    setBusy(true);
    setError(null);
    const result = await onRecordLegalAcceptance();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onAuthenticated();
    onClose();
  }

  const isSignup = mode === "signup";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="閉じる" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div className="relative w-full max-w-sm animate-[slide-up_0.2s_ease-out] rounded-t-3xl bg-paper px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_24px_rgba(44,38,32,0.15)] sm:rounded-3xl sm:pb-6">
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-2xl font-bold leading-none text-coral-500 transition hover:bg-coral-50 hover:text-coral-600"
        >
          ×
        </button>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-green-100 sm:hidden" />
        <h2 className="mt-1 pr-10 text-xl font-bold text-green-950">
          {legalView
            ? legalView === "terms" ? "利用規約" : "プライバシーポリシー"
            : step === "choice"
              ? "はじめる"
              : step === "email"
                ? isSignup ? "新しく登録する" : "ログインする"
                : step === "consent"
                  ? "利用規約・プライバシーポリシーの確認"
                  : "確認コードを入力"}
        </h2>

        {legalView ? (
          <div className="mt-5">
            <div className="legal-scroll max-h-[55vh] overflow-y-auto rounded-2xl bg-ivory px-4 py-4 pr-3 text-sm leading-7 text-ink-soft sm:max-h-[60vh]">
              {legalView === "terms" ? (
                <div className="space-y-9"><TermsContent /></div>
              ) : (
                <div className="space-y-9"><PrivacyContent /></div>
              )}
            </div>
            <button type="button" onClick={() => setLegalView(null)} className="mt-4 w-full cursor-pointer rounded-full border border-green-800 bg-paper py-3 text-sm font-bold text-green-800 transition hover:bg-green-800 hover:text-paper">
              ← 登録画面に戻る
            </button>
          </div>
        ) : step === "choice" ? (
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-sm leading-6 text-ink-soft">
              記録を大切に保存するため、メールアドレスで登録またはログインしてください。
            </p>
            <button type="button" onClick={() => chooseMode("signup")} className="cursor-pointer rounded-full bg-green-800 py-3 text-sm font-bold text-paper transition hover:bg-green-900">
              新しく登録する
            </button>
            <button type="button" onClick={() => chooseMode("login")} className="cursor-pointer rounded-full border border-ink/20 bg-paper py-3 text-sm font-bold text-green-800 transition hover:bg-green-50">
              ログインする
            </button>
          </div>
        ) : step === "email" ? (
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

            {isSignup && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm leading-6 text-ink-soft">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => setLegalAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-green-800"
                />
                <span>
                  <button type="button" onClick={() => setLegalView("terms")} className="cursor-pointer font-bold text-green-800 underline underline-offset-4">利用規約</button>
                  と
                  <button type="button" onClick={() => setLegalView("privacy")} className="cursor-pointer font-bold text-green-800 underline underline-offset-4">プライバシーポリシー</button>
                  に同意します
                </span>
              </label>
            )}

            {error && <p className="text-sm text-coral-500">{error}</p>}
            <button
              type="submit"
              disabled={busy || (isSignup && !legalAccepted)}
              className="cursor-pointer rounded-full bg-green-800 py-3 text-sm font-bold text-paper transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "送信中…" : "確認コードを送る"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("choice"); setMode(null); setError(null); }}
              className="cursor-pointer text-sm text-ink-soft hover:text-green-800"
            >
              戻る
            </button>
          </form>
        ) : step === "consent" ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-sm leading-6 text-ink-soft">
              はじめて帖をご利用いただくには、利用規約とプライバシーポリシーへの同意が必要です。
              内容をご確認のうえ、同意して続けてください。
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm leading-6 text-ink-soft">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-green-800"
              />
              <span>
                <button type="button" onClick={() => setLegalView("terms")} className="cursor-pointer font-bold text-green-800 underline underline-offset-4">利用規約</button>
                と
                <button type="button" onClick={() => setLegalView("privacy")} className="cursor-pointer font-bold text-green-800 underline underline-offset-4">プライバシーポリシー</button>
                に同意します
              </span>
            </label>
            {error && <p className="text-sm text-coral-500">{error}</p>}
            <button
              type="button"
              onClick={handleConsent}
              disabled={busy || !legalAccepted}
              className="cursor-pointer rounded-full bg-green-800 py-3 text-sm font-bold text-paper transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "保存中…" : "同意して続ける"}
            </button>
          </div>
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
            <button type="submit" disabled={busy || code.length !== 6} className="cursor-pointer rounded-full bg-green-800 py-3 text-sm font-bold text-paper transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "確認中…" : isSignup ? "確認して登録を完了" : "ログインする"}
            </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={busy || resendWait > 0}
            className="cursor-pointer text-sm font-bold text-green-800 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "送信中…"
              : resendWait > 0
                ? `確認コードを再送する（あと${resendWait}秒）`
                : "確認コードを再送する"}
          </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="cursor-pointer text-sm text-ink-soft hover:text-green-800">
              メールアドレスを変更
            </button>
          </form>
        )}
        {!legalView && (
          <p className="mt-5 rounded-2xl bg-ivory px-4 py-3 text-xs leading-5 text-ink-soft">
            共用端末では、利用後に必ずログアウトしてください。
          </p>
        )}
        <style jsx>{`
          .legal-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(45, 74, 45, 0.45) transparent;
          }
          .legal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .legal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .legal-scroll::-webkit-scrollbar-thumb {
            background: rgba(45, 74, 45, 0.45);
            border-radius: 9999px;
          }
          .legal-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(45, 74, 45, 0.65);
          }
        `}</style>
      </div>
    </div>
  );
}
