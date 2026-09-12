"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/reportClientError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientError(error);
  }, [error]);

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center gap-6 bg-ivory px-6 py-16 text-center font-body text-ink">
        <p className="text-2xl text-[#d99a25]" aria-hidden="true">
          ✦
        </p>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-green-900">
            思わぬところで立ち止まってしまいました
          </h1>
          <p className="text-sm leading-6 text-ink-soft">
            アプリの表示中に問題が発生しました。もう一度お試しいただくか、
            <br className="hidden sm:inline" />
            時間を置いてから開き直してみてください。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-ivory transition hover:bg-green-900"
          >
            もう一度試す
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this replaces the root layout itself, so next/link's router context may not be usable */}
          <a
            href="/"
            className="rounded-full border border-green-800/20 bg-transparent px-6 py-2.5 text-sm font-medium text-green-800 transition hover:bg-green-100/60"
          >
            トップへ戻る
          </a>
        </div>
      </body>
    </html>
  );
}
