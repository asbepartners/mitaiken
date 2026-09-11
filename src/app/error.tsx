"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-2xl text-[#d99a25]" aria-hidden="true">
        ✦
      </p>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-green-900">
          思わぬところで立ち止まってしまいました
        </h1>
        <p className="text-sm leading-6 text-ink-soft">
          ページの表示中に問題が発生しました。もう一度お試しいただくか、
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
        <Link
          href="/"
          className="rounded-full border border-green-800/20 bg-transparent px-6 py-2.5 text-sm font-medium text-green-800 transition hover:bg-green-100/60"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
