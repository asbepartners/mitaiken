import Link from "next/link";

export function LegalPage({
  title,
  updated,
  children,
  counterpartHref,
  counterpartLabel,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
  counterpartHref: string;
  counterpartLabel: string;
}) {
  return (
    <main className="min-h-screen bg-ivory bg-paper-texture px-4 py-8 font-body sm:py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-green-100 bg-paper px-5 py-8 shadow-[0_2px_10px_rgba(44,38,32,0.05)] sm:px-10 sm:py-10">
        <header className="mb-9 border-b border-green-100 pb-6">
          <Link href="/?tab=mypage" className="text-sm font-bold text-coral-500">
            ← マイページに戻る
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-wide text-green-950 sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm text-ink-soft">{updated}</p>
        </header>
        <div className="space-y-9 text-[15px] leading-7 text-ink-soft">{children}</div>
        <footer className="mt-10 border-t border-green-100 pt-6 text-sm leading-7 text-ink-soft">
          <p>運営者：まつもとみき</p>
          <p>お問い合わせ：<a href="mailto:contact@hajimetecho.jp" className="text-green-700 underline underline-offset-4">contact@hajimetecho.jp</a></p>
          <p className="mt-5"><Link href={counterpartHref} className="font-bold text-green-700 underline underline-offset-4">{counterpartLabel}</Link></p>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h2 className="text-lg font-bold text-green-900">{title}</h2><div className="space-y-3">{children}</div></section>;
}
