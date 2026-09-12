"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ASSET_BASE } from "@/lib/assetBase";

function Question({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-start gap-3 text-lg font-bold text-green-900">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-100 text-sm font-bold text-coral-500">Q</span>
      {children}
    </h2>
  );
}

function Step({ text, image, alt }: { text: string; image?: string; alt?: string }) {
  return (
    <li className="space-y-3">
      <p className="text-base leading-7 text-ink-soft">{text}</p>
      {image && (
        <img
          src={`${ASSET_BASE}/install-guide/${image}`}
          alt={alt}
          className="mx-auto w-full max-w-[280px] rounded-2xl border border-green-100 shadow-sm"
        />
      )}
    </li>
  );
}

export function FaqPage() {
  const router = useRouter();

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
            よくある質問
          </h1>
        </header>

        <section className="space-y-6">
          <Question>ホーム画面に追加するにはどうすればいいですか？</Question>
          <p className="text-base leading-7 text-ink-soft">
            ホーム画面に追加しておくと、次からはアイコンをタップするだけで「わたしのはじめて帖」を開けます。
          </p>

          <div>
            <h3 className="text-base font-bold text-green-950">iPhoneの場合</h3>

            <div className="mt-4">
              <p className="text-sm font-bold text-green-800">Safariをお使いの場合</p>
              <ol className="mt-3 space-y-6 border-t border-green-100 pt-6">
                <Step
                  text="1. 画面右下の「…」をタップします。"
                  image="ios-safari-01-more-menu.webp"
                  alt="Safariの画面右下にあるメニューボタン"
                />
                <Step
                  text="2. 「共有」をタップします。"
                  image="ios-safari-02-share.webp"
                  alt="Safariのメニューにある共有ボタン"
                />
                <Step
                  text="3. 「表示を増やす」をタップします。"
                  image="ios-common-01-show-more.webp"
                  alt="共有画面にある表示を増やすボタン"
                />
                <Step
                  text="4. 「ホーム画面に追加」をタップします。"
                  image="ios-common-02-add-to-home-screen.webp"
                  alt="共有画面にあるホーム画面に追加ボタン"
                />
                <Step
                  text="5. 右上の「追加」をタップします。"
                  image="ios-common-03-confirm-add.webp"
                  alt="ホーム画面に追加する際の確認画面"
                />
              </ol>
            </div>

            <div className="mt-8">
              <p className="text-sm font-bold text-green-800">Chromeをお使いの場合</p>
              <ol className="mt-3 space-y-6 border-t border-green-100 pt-6">
                <Step
                  text="1. 画面右上の共有ボタンをタップします。"
                  image="ios-chrome-01-share.webp"
                  alt="Chromeの画面右上にある共有ボタン"
                />
                <Step
                  text="2. 「表示を増やす」をタップします。"
                  image="ios-common-01-show-more.webp"
                  alt="共有画面にある表示を増やすボタン"
                />
                <Step
                  text="3. 「ホーム画面に追加」をタップします。"
                  image="ios-common-02-add-to-home-screen.webp"
                  alt="共有画面にあるホーム画面に追加ボタン"
                />
                <Step
                  text="4. 右上の「追加」をタップします。"
                  image="ios-common-03-confirm-add.webp"
                  alt="ホーム画面に追加する際の確認画面"
                />
              </ol>
            </div>
          </div>

          <div className="mt-8 border-t border-green-100 pt-6">
            <h3 className="text-base font-bold text-green-950">Androidの場合</h3>
            <ol className="mt-3 space-y-3">
              <li className="text-base leading-7 text-ink-soft">1. Chromeで「わたしのはじめて帖」を開いた状態で、画面右上の「⋮」をタップします。</li>
              <li className="text-base leading-7 text-ink-soft">2. 「ホーム画面に追加」または「アプリをインストール」をタップします。</li>
              <li className="text-base leading-7 text-ink-soft">3. 画面の案内に沿って「追加」または「インストール」をタップします。</li>
            </ol>
            <p className="mt-4 text-sm leading-6 text-ink-soft/75">
              ※端末やChromeのバージョンによって、表示される文言が異なる場合があります。
            </p>
          </div>
        </section>

        <section className="mt-10 space-y-3 border-t border-green-100 pt-8">
          <Question>マスタにないやりたいことがあります</Question>
          <p className="text-base leading-7 text-ink-soft">
            「やってみたい」画面の「＋ オリジナルのはじめてを追加」から、自分だけのオリジナル体験を追加できます。
          </p>
          <p className="text-base leading-7 text-ink-soft">
            マスタにあった方がいいと思うアイテムがある場合は、
            <Link href="/contact" className="font-bold text-coral-500 underline underline-offset-4">お問い合わせ</Link>
            フォームから、種別「ご要望（マスタ追加など）」を選んでご提案ください。採用については、全体のバランスや対応できる時期を踏まえて運営側で判断させていただきます。
          </p>
        </section>

        <footer className="mt-10 border-t border-green-100 pt-6 text-sm leading-7 text-ink-soft">
          <p><Link href="/" className="font-bold text-green-700 underline underline-offset-4">わたしのはじめて帖のトップページを見る</Link></p>
        </footer>
      </article>
    </main>
  );
}
