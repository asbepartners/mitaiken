"use client";

interface Props {
  message: string | null;
  onClose: () => void;
}

export function MaintenanceNotice({ message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-green-950/35 px-3" onClick={onClose}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="maintenance-title" className="w-full max-w-2xl rounded-t-[2rem] bg-paper px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 id="maintenance-title" className="text-lg font-bold text-green-950">ただいまメンテナンス中です</h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{message || <>しばらく経ってから、<br />もう一度お試しください。</>}</p>
        <button type="button" onClick={onClose} className="mt-6 min-h-12 w-full rounded-full bg-coral-500 text-base font-bold text-paper">OK</button>
      </section>
    </div>
  );
}
