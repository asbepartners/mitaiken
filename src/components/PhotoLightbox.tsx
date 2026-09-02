"use client";

import { useEffect } from "react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export function PhotoLightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="写真の拡大表示" className="fixed inset-0 z-[70] flex items-center justify-center bg-green-950/90 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="拡大表示を閉じる" className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-paper/95 text-2xl text-green-950 shadow-lg">×</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}
