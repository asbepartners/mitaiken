"use client";

interface Props {
  state: "loading" | "offline" | "error";
}

export function InitialAppScreen({ state }: Props) {
  const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";
  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-ivory bg-paper-texture px-5 py-10">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span aria-hidden="true" className="text-lg text-[#d39a2c]">✦</span>
        <h1 className="mt-4 text-[1.7rem] font-bold tracking-wide text-green-950">わたしのはじめて帖</h1>
        {state === "loading" ? (
          <>
            <p className="mt-3 text-sm font-medium text-green-800/80" aria-live="polite">あなたの「はじめて」をひらいています。</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${assetBase}/header-explore-v4.png`} alt="望遠鏡で遠くを眺める女性のイラスト" className="mt-10 h-52 w-full object-cover object-[28%_100%]" />
            <div className="mt-8 flex gap-3 text-sm text-[#d39a2c]" aria-hidden="true">
              <span className="loading-spark">✦</span><span className="loading-spark">✦</span><span className="loading-spark">✦</span>
            </div>
          </>
        ) : state === "offline" ? (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-ink-soft">インターネットに接続してから、<br />もう一度お試しください。</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${assetBase}/header-explore-v4.png`} alt="望遠鏡で遠くを眺める女性のイラスト" className="mt-10 h-52 w-full object-cover object-[28%_100%]" />
            <button type="button" onClick={() => window.location.reload()} className="mt-8 min-h-12 rounded-full bg-coral-500 px-7 text-base font-bold text-paper shadow-sm">もう一度試す</button>
          </>
        ) : (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-ink-soft">はじめて帖をひらけませんでした。<br />通信状況をご確認ください。</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-7 min-h-12 rounded-full bg-coral-500 px-7 text-base font-bold text-paper shadow-sm">もう一度試す</button>
          </>
        )}
      </div>
    </main>
  );
}
