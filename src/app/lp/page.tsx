import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "わたしのはじめて帖｜人生の「はじめて」を、わたしの手元に",
  description:
    "まだ知らない「やってみたい」を見つけ、これまでとこれからの体験を自分のために残す、わたしだけのはじめて帖。",
};

const assetBase = process.env.NODE_ENV === "production" ? "/mitaiken" : "";

const steps = [
  {
    number: "01",
    title: "見つける",
    body: "まだ知らないことの中から、ちょっと気になる「やってみたい」に出会う。",
  },
  {
    number: "02",
    title: "やってみる",
    body: "今日でなくても大丈夫。自分のペースで、いつかの楽しみにしておく。",
  },
  {
    number: "03",
    title: "残しておく",
    body: "写真や短い言葉で、そのときのことを、わたしの記録として残す。",
  },
  {
    number: "04",
    title: "振り返る",
    body: "積み重なった「はじめて」を眺めて、自分の人生をもう一度味わう。",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-ivory text-green-950">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
          <p className="text-sm font-semibold tracking-[0.12em] sm:text-base">
            わたしのはじめて帖<span className="ml-1 text-[#d99a25]">✦</span>
          </p>
          <span className="rounded-full border border-green-800/15 bg-paper/80 px-4 py-2 text-xs tracking-[0.12em] text-green-800 shadow-sm backdrop-blur-sm">
            ただいま準備中
          </span>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[760px] flex-col bg-paper-texture pt-28 sm:min-h-[820px] lg:min-h-[760px] lg:pt-36">
          <div className="relative z-[1] mx-auto w-full max-w-6xl px-6 text-center sm:px-10 lg:px-12">
            <p className="mb-5 text-sm tracking-[0.2em] text-green-700 sm:text-base">
              人生の「はじめて」を、わたしの手元に。
            </p>
            <h1 className="text-[2.5rem] font-semibold leading-[1.35] tracking-[0.04em] sm:text-6xl lg:text-7xl">
              わたしの人生には、
              <br />
              まだ知らない<span className="text-coral-500">「はじめて」</span>がある。
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-green-800/85 sm:text-lg sm:leading-9">
              やってみたいことを見つけて、やってみたことを残す。
              <br className="hidden sm:block" />
              いつか振り返るための、わたしだけの小さな帖です。
            </p>
            <a
              href="#story"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-coral-500 px-7 py-4 text-sm font-semibold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(232,111,114,0.22)] transition hover:-translate-y-0.5 hover:bg-coral-400"
            >
              この帖に込めた想い
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="relative mt-auto h-[270px] w-full sm:h-[340px] lg:h-[390px]">
            <img
              src={`${assetBase}/header-explore-v4.png`}
              alt="丘の上から望遠鏡で遠くを眺める女性のイラスト"
              className="absolute inset-0 h-full w-full object-cover object-[30%_100%]"
            />
          </div>
        </section>

        <section id="story" className="bg-paper px-6 py-24 sm:px-10 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm tracking-[0.2em] text-[#b67c18]">この帖をつくった理由</p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.55] tracking-[0.05em] sm:text-5xl">
              わたしの人生は、
              <br />
              思っていたより、ちゃんと楽しい。
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
              <p className="text-sm tracking-[0.2em] text-[#b67c18]">主語はいつも、わたし。</p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.55] tracking-[0.05em] sm:text-5xl">
                見せなくていい。
                <br />
                映えなくていい。
              </h2>
              <p className="mt-7 text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
                ここはSNSではありません。共有ボタンも、いいねも、ランキングもありません。誰かの反応を気にせず、自分が覚えておきたいことを、自分のために残せます。
              </p>
            </div>

            <div className="rounded-[2rem] border border-green-800/10 bg-paper p-7 shadow-[0_24px_70px_rgba(45,74,60,0.08)] sm:p-10">
              <div className="space-y-6">
                {[
                  ["♡", "いいねの数で、体験の価値を決めない。"],
                  ["♢", "きれいな写真がなくても、立派な文章が書けなくてもいい。"],
                  ["○", "ささやかな出来事も、昔の曖昧な記憶も、そのままでいい。"],
                ].map(([mark, text]) => (
                  <div key={text} className="flex gap-4 border-b border-green-800/10 pb-6 last:border-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-100 text-lg text-coral-500">
                      {mark}
                    </span>
                    <p className="pt-1 text-base leading-8 text-green-900 sm:text-lg">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-green-900 px-6 py-24 text-paper sm:px-10 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm tracking-[0.2em] text-[#e7bd68]">これまでと、これからを一冊に</p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.55] tracking-[0.05em] sm:text-5xl">
                「やってみたい」が、
                <br />
                いつか人生の記録になる。
              </h2>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-[1.6rem] border border-paper/10 bg-paper/[0.06] p-6 backdrop-blur-sm"
                >
                  <p className="text-xs tracking-[0.18em] text-[#e7bd68]">{step.number}</p>
                  <h3 className="mt-4 text-xl font-semibold tracking-[0.08em]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-paper/75">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper px-6 py-24 sm:px-10 sm:py-32">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div className="overflow-hidden rounded-[2rem] bg-ivory shadow-[0_24px_70px_rgba(45,74,60,0.08)]">
              <img
                src={`${assetBase}/header-tried-v1.png`}
                alt="丘の上で自分の帖をひらく女性のイラスト"
                className="aspect-[4/3] h-full w-full object-cover object-[32%_100%]"
              />
            </div>
            <div>
              <p className="text-sm tracking-[0.2em] text-[#b67c18]">少し余白ができた日に</p>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.55] tracking-[0.05em] sm:text-5xl">
                人生には、まだまだ
                <br />
                知らないことがある。
              </h2>
              <div className="mt-7 space-y-5 text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
                <p>
                  仕事や子育てに追われる日々が、少し落ち着いたとき。自分のために使える時間が、ほんの少しできたとき。
                </p>
                <p>
                  行ったことのない場所へ出かけたり、作ったことのないものに挑戦したり。大きな冒険でなくても、新しい経験は、これからの日々を少し楽しみに変えてくれます。
                </p>
                <p>急がなくて大丈夫。気になった「はじめて」から、ひとつずつ。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-ivory px-6 py-24 text-center sm:px-10 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <p className="text-2xl text-[#d99a25]" aria-hidden="true">✦</p>
            <h2 className="mt-6 text-3xl font-semibold leading-[1.55] tracking-[0.05em] sm:text-5xl">
              いつか振り返ったとき、
              <br />
              「なかなか楽しかったな」と思えるように。
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-base leading-9 text-ink-soft sm:text-lg sm:leading-10">
              わたしのはじめて帖は、ただいま準備中です。
              <br />
              あなたの「はじめて」をひらける日まで、もう少しお待ちください。
            </p>
            <div className="mx-auto mt-10 inline-flex rounded-full border border-green-800/15 bg-paper px-7 py-4 text-sm font-semibold tracking-[0.12em] text-green-800 shadow-sm">
              わたしのはじめて帖　準備中
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-800/10 bg-ivory px-6 py-8 text-center text-xs tracking-[0.08em] text-green-800/60">
        © 2026 わたしのはじめて帖
      </footer>
    </div>
  );
}
