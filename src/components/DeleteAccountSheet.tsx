"use client";

import { useState } from "react";

interface Props {
  onCancel: () => void;
  onConfirm: () => Promise<{ error: string | null }>;
}

export function DeleteAccountSheet({ onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const result = await onConfirm();
    if (result.error) {
      setError(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-green-950/35 px-3" onClick={deleting ? undefined : onCancel}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-2xl rounded-t-[2rem] bg-paper px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 id="delete-account-title" className="text-lg font-bold text-green-950">本当に削除しますか？</h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          削除すると、体験記録・写真・メモを含むすべてのデータが失われ、元に戻すことはできません。
          <br />
          バックアップには削除後も一定期間情報が残る場合がありますが、復元にはご利用いただけません。
        </p>
        {error && <p className="mt-3 text-sm font-bold text-coral-500">{error}</p>}
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleConfirm()}
          className="mt-6 min-h-12 w-full rounded-full bg-coral-500 px-4 text-base font-bold leading-tight text-paper disabled:opacity-50"
        >
          {deleting ? "削除しています…" : "復元できないことを確認して削除する"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onCancel}
          className="mt-3 min-h-12 w-full rounded-full border border-green-100 text-base font-bold text-green-800 disabled:opacity-50"
        >
          キャンセル
        </button>
      </section>
    </div>
  );
}
