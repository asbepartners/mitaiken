import type { Metadata } from "next";
import Link from "next/link";
import { ASSET_BASE } from "@/lib/assetBase";

export const metadata: Metadata = {
  title: "わたしのはじめて帖｜人生の「はじめて」を、わたしの手元に",
  description:
    "まだ知らない「やってみたい」を見つけ、これまでとこれからの体験を自分のために残す、わたしだけのはじめて帖。",
};

const steps = [
  {
    icon: "telescope",
    title: "見つける",
    body: "まだ知らない「はじめて」に出会う",
  },
  {
    icon: "heart",
    title: "気になる",
    body: "心が少し動いたものを選ぶ",
  },
  {
    icon: "bookmark",
    title: "貯めておく",
    body: "いつかの楽しみとして残す",
  },
  {
    icon: "flag",
    title: "やってみる",
    body: "自分のペースで体験する",
  },
  {
    icon: "book",
    title: "振り返る",
    body: "わたしの人生として眺める",
  },
];

function JourneyIcon({ name }: { name: string }) {
  if (name === "telescope") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M11 35 24 22l27-11 5 10-28 10-17 4Z" fill="#dfc27c" />
        <path d="m43 14 8-3 5 10-9 3Z" fill="#f5dea2" />
        <path d="m11 35 7-7 6 7-10 4Z" fill="#80945e" />
        <path d="M27 31 22 56m9-27 10 27" />
        <circle cx="29" cy="31" r="3" fill="#e86f72" />
        <path d="m10 13 1.3 3.2 3.2 1.3-3.2 1.3L10 22l-1.3-3.2-3.2-1.3 3.2-1.3L10 13Z" fill="#dda02d" stroke="none" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M53 17c-5-7-16-7-21 0-5-7-16-7-21 0-5 6-4 15 2 20l19 18 19-18c6-5 7-14 2-20Z" fill="#e9797c" />
        <path d="M46 18c2 2 3 5 2 8" stroke="#fff8ec" strokeWidth="2.5" />
        <path d="m53 7 .9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9L53 7Z" fill="#dda02d" stroke="none" />
      </svg>
    );
  }
  if (name === "bookmark") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M17 8h30v48L32 45 17 56V8Z" fill="#ed8587" />
        <path d="M23 15h18" stroke="#fff8ec" strokeWidth="2.5" />
        <path d="m51 16 1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2 1.2-3Z" fill="#dda02d" stroke="none" />
      </svg>
    );
  }
  if (name === "flag") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M7 55c9-13 18-12 25-5 8-9 18-8 25 5H7Z" fill="#dfe8d7" stroke="none" />
        <path d="M23 54V12" stroke="#765c42" strokeWidth="2.5" />
        <path d="M25 14c10-6 15 5 27-1v22c-12 6-17-5-27 1V14Z" fill="#6f8d55" />
        <path d="m48 7 1.3 3.2 3.2 1.3-3.2 1.3L48 16l-1.3-3.2-3.2-1.3 3.2-1.3L48 7Z" fill="#dda02d" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M6 16c10-3 18 0 26 7v33c-8-7-16-10-26-7V16Z" fill="#f3d9bc" />
      <path d="M58 16c-10-3-18 0-26 7v33c8-7 16-10 26-7V16Z" fill="#e8efdf" />
      <path d="M32 23v33" />
      <path d="m48 7 1.5 3.8 3.8 1.5-3.8 1.5-1.5 3.8-1.5-3.8-3.8-1.5 3.8-1.5L48 7Z" fill="#dda02d" stroke="none" />
      <path d="m13 9 .9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9L13 9Z" fill="#e9797c" stroke="none" />
    </svg>
  );
}

function ValueIcon({ name }: { name: string }) {
  if (name === "heart") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M38 14c-4-5-11-4-14 1-3-5-10-6-14-1-4 5-2 11 2 15l12 11 12-11c4-4 6-10 2-15Z" fill="#e9797c" />
        <path d="m39 6 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1L39 6Z" fill="#dda02d" stroke="none" />
      </svg>
    );
  }
  if (name === "photo") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="9" width="36" height="30" rx="4" fill="#fffaf0" />
        <circle cx="33" cy="18" r="5" fill="#e9b653" />
        <path d="m9 35 10-11 7 7 5-5 8 9H9Z" fill="#8ca36c" />
        <path d="m12 6 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" fill="#e9797c" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M5 13c7-2 13 0 19 5v25c-6-5-12-7-19-5V13Z" fill="#f2d8bd" />
      <path d="M43 13c-7-2-13 0-19 5v25c6-5 12-7 19-5V13Z" fill="#dfe8d7" />
      <path d="m37 5 1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2L37 5Z" fill="#dda02d" stroke="none" />
    </svg>
  );
}

function ClosingMessage({ align }: { align: "center" | "right" }) {
  const alignClass = align === "right" ? "ml-auto text-right" : "mx-auto text-center";
  return (
    <div className={`max-w-xl ${alignClass}`}>
      <h2 className="text-[1.75rem] font-semibold leading-[1.6] tracking-[0.05em] sm:text-[2.75rem]">
        いつか振り返ったとき、
        <br />
        「なかなか楽しかったな」と思えるように。
      </h2>
      <p className="mt-7 text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
        わたしのはじめて帖は、公開中です。
        <br />
        まだ知らない「はじめて」を、今すぐ見つけにいきましょう。
      </p>
      <Link
        href="/app"
        className="mt-10 inline-flex rounded-2xl bg-coral-500 px-7 py-4 text-sm font-semibold tracking-[0.12em] text-white shadow-[0_10px_30px_rgba(232,111,114,0.22)] transition hover:bg-coral-400"
      >
        アプリを見る
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-ivory text-green-950">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-6 sm:px-10 lg:px-12">
          <p className="text-sm font-semibold tracking-[0.12em] sm:text-base">
            わたしのはじめて帖<sup className="ml-0.5 text-[0.6em] font-normal">™</sup>
            <span className="ml-1 text-[#d99a25]">✦</span>
          </p>
        </div>
      </header>

      <main>
        <section
          className="relative flex min-h-[760px] flex-col bg-paper-texture pt-28 sm:min-h-[820px] lg:min-h-[760px] lg:pt-36"
          style={{ backgroundColor: "#fef9f0" }} // matches header-explore-v4.png's own background so the seam above it doesn't show
        >
          <div className="relative z-[1] mx-auto w-full max-w-6xl px-6 text-center sm:px-10 lg:px-12">
            <p className="mb-5 text-sm tracking-[0.2em] text-green-700 sm:text-base">
              人生の「はじめて」を、わたしの手元に。
            </p>
            <h1 className="text-[2rem] font-semibold leading-[1.5] tracking-[0.035em] sm:text-[3.25rem] sm:leading-[1.4] lg:text-6xl">
              <span className="block">わたしの人生には、</span>
              <span className="block sm:inline">まだ知らない</span>
              <span className="block sm:inline"><span className="text-coral-500">「はじめて」</span>がある。</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-green-800/85 sm:text-lg sm:leading-9">
              やってみたいことを見つけて、やってみたことを残す。
              <br className="hidden sm:block" />
              いつか振り返るための、わたしだけの小さな記録です。
            </p>
            <Link
              href="/app"
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-coral-500 px-7 py-4 text-sm font-semibold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(232,111,114,0.22)] transition hover:-translate-y-0.5 hover:bg-coral-400"
            >
              アプリを見る
            </Link>
            <p className="mt-4 text-xs text-ink-soft">
              スマートフォンでホーム画面にアイコンを追加する方法は
              <Link href="/faq" className="underline underline-offset-4">FAQ</Link>
              でご案内しています
            </p>
          </div>

          <div className="relative mt-auto h-[270px] w-full sm:h-[340px] lg:h-[390px]">
            <img
              src={`${ASSET_BASE}/header-explore-v4.png`}
              alt="丘の上から望遠鏡で遠くを眺める女性のイラスト"
              className="absolute inset-0 h-full w-full object-cover object-[30%_100%]"
            />
          </div>
        </section>

        <section className="bg-paper px-6 py-24 sm:px-10 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm tracking-[0.2em] text-[#b67c18]">このアプリをつくった理由</p>
            <h2 className="mt-5 text-[1.75rem] font-semibold leading-[1.6] tracking-[0.05em] sm:text-[2.75rem]">
              わたしの人生は、
              <br />
              思っていたより、
              <br className="sm:hidden" />
              ちゃんと楽しい。
            </h2>
            <div className="mx-auto mt-10 max-w-2xl space-y-7 text-left text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
              <p>
                忙しい毎日を過ごしていると、これまでしてきたことも、楽しかった時間も、いつの間にか遠くへ流れていきます。
              </p>
              <p>
                けれど、ひとつずつ思い出してみると。初めて行った場所、初めて作ったもの、大切な人と笑った日。わたしの人生には、思っていた以上にたくさんの「はじめて」がありました。
              </p>
              <p>
                これまでの体験を振り返りながら、これからやってみたいことにも出会える場所がほしい。そんな思いから、わたしのはじめて帖は生まれました。
              </p>
            </div>
          </div>
        </section>

        <section className="relative bg-ivory px-6 py-24 sm:px-10 sm:py-32">
          <div className="pointer-events-none absolute left-[8%] top-16 text-xl text-[#d99a25]/70">✦</div>
          <div className="pointer-events-none absolute right-[10%] top-40 text-sm text-[#d99a25]/60">✦</div>
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-sm tracking-[0.2em] text-[#b67c18]">妻でも、母でも。夫でも、父でも。</p>
              <h2 className="mt-5 text-[1.75rem] font-semibold leading-[1.6] tracking-[0.05em] sm:text-[2.75rem]">
                ひとりの「わたし」が
                <br className="sm:hidden" />
                主役です。
              </h2>
              <div className="mt-7 space-y-5 text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
                <p>
                  誰かに見せなくていい。映えなくていい。いいねをもらわなくてもいい。
                </p>
                <p>
                  これは、わたし自身の人生を残すための記録です。
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-green-800/10 bg-paper p-7 shadow-[0_24px_70px_rgba(45,74,60,0.08)] sm:p-10">
              <div className="space-y-6">
                {[
                  { icon: "heart", text: "いいねの数で、体験の価値を決めない。" },
                  { icon: "photo", text: "きれいな写真がなくても、立派な文章が書けなくてもいい。" },
                  { icon: "book", text: "ささやかな出来事も、昔の曖昧な記憶も、そのままでいい。" },
                ].map((item) => (
                  <div key={item.text} className="flex gap-4 border-b border-green-800/10 pb-6 last:border-0 last:pb-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral-100 p-2 shadow-sm [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-green-800 [&_svg]:stroke-[1.5] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round">
                      <ValueIcon name={item.icon} />
                    </span>
                    <p className="pt-1 text-base leading-8 text-green-900 sm:text-lg">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-paper px-6 py-24 sm:px-10 sm:py-32">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-green-800/10 bg-ivory px-6 py-12 shadow-[0_18px_60px_rgba(45,74,60,0.06)] sm:px-10 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm tracking-[0.2em] text-[#b67c18]">わたしのはじめて帖の楽しみ方</p>
              <h2 className="mt-5 text-[1.75rem] font-semibold leading-[1.6] tracking-[0.05em] text-green-950 sm:text-[2.75rem]">
                「やってみたい」が、
                <br />
                いつか人生の記録になる。
              </h2>
            </div>

            <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-5 sm:gap-3 lg:gap-6">
              <div
                aria-hidden="true"
                className="absolute top-9 bottom-9 left-9 w-px bg-coral-400/70 sm:top-12 sm:right-[10%] sm:bottom-auto sm:left-[10%] sm:h-px sm:w-auto"
              />
              {steps.map((step) => (
                <article
                  key={step.title}
                  className="relative z-[1] grid grid-cols-[4.5rem_1fr] items-center gap-4 text-left sm:block sm:text-center"
                >
                  <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-coral-400/70 bg-paper shadow-sm sm:mx-auto sm:h-24 sm:w-24">
                    <span className="h-11 w-11 [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-green-800 [&_svg]:stroke-[1.7] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round sm:h-14 sm:w-14">
                      <JourneyIcon name={step.icon} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[0.06em] text-green-900 sm:mt-5">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink-soft/75 sm:mt-3 sm:leading-7">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mx-auto mt-14 max-w-2xl rounded-2xl border border-green-800/10 bg-green-100/45 px-6 py-5 text-left text-sm leading-7 text-green-800 sm:text-base">
              毎日使わなくても大丈夫。気になったときにひらいて、自分のペースで「はじめて」を増やしていこう。
            </p>
          </div>
        </section>

        {/* Mobile: the 2.33:1 illustration would always show its full height at
            phone width (no room to crop the girl out from under the text), so
            stack image then text instead of overlaying them. */}
        <section className="sm:hidden">
          <div style={{ backgroundColor: "#fcf6ed" }}>
            <img
              src={`${ASSET_BASE}/header-tried-v1.png`}
              alt="丘の上で自分の帖をひらく女性のイラスト"
              className="h-auto w-full"
            />
          </div>
          <div className="bg-ivory px-6 py-16 text-center">
            <ClosingMessage align="center" />
          </div>
        </section>

        {/* sm and up: enough width to run the illustration full-bleed with the
            message beside the girl instead of on top of her. */}
        <section className="relative hidden min-h-[680px] items-center overflow-hidden px-10 py-32 sm:flex lg:px-12">
          <img
            src={`${ASSET_BASE}/header-tried-v1.png`}
            alt="丘の上で自分の帖をひらく女性のイラスト"
            className="absolute inset-0 h-full w-full object-cover object-[15%_15%]"
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ivory to-transparent" />
          <div className="relative z-[1] mx-auto w-full max-w-6xl">
            <ClosingMessage align="right" />
          </div>
        </section>
      </main>

      <footer className="border-t border-green-800/10 bg-ivory px-6 py-8 text-center text-xs tracking-[0.08em] text-green-800/60">
        <p className="flex items-center justify-center gap-4">
          <Link href="/faq" className="underline underline-offset-4">よくある質問</Link>
          <Link href="/contact" className="underline underline-offset-4">お問い合わせ</Link>
        </p>
        <p className="mt-3">© 2026 わたしのはじめて帖</p>
      </footer>
    </div>
  );
}
