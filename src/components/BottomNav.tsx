"use client";

import { BookmarkIcon } from "./RecordIcons";

export type Tab = "explore" | "wishlist" | "tried" | "mypage";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  wishlistCount: number;
  triedCount: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "tried", label: "はじめて帖" },
  { key: "wishlist", label: "リスト" },
  { key: "explore", label: "探す" },
  { key: "mypage", label: "マイページ" },
];

function NavIcon({ tab }: { tab: Tab }) {
  if (tab === "explore") return <svg viewBox="0 0 24 24"><path d="m4 17 5-7 8-4 2 3-8 4-7 4Z"/><path d="m9 14-1 7m4-8 3 8M16 6l-1-2 2-1 1 2"/></svg>;
  if (tab === "wishlist") return <svg viewBox="0 0 24 24"><path d="M20.8 5.7c-1.6-2-4.7-2-6.4-.1L12 8.2 9.6 5.6c-1.7-1.9-4.8-1.9-6.4.1-1.5 1.8-1.2 4.5.4 6.1L12 20l8.4-8.2c1.6-1.6 1.9-4.3.4-6.1Z"/></svg>;
  if (tab === "tried") return <BookmarkIcon />;
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 21c.4-4.1 2.6-6.2 6.5-6.2s6.1 2.1 6.5 6.2"/></svg>;
}

export function BottomNav({ active, onChange, wishlistCount, triedCount }: BottomNavProps) {
  const counts: Record<Tab, number | null> = {
    explore: null,
    wishlist: wishlistCount,
    tried: triedCount,
    mypage: null,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                isActive ? "text-green-800" : "text-ink-soft"
              }`}
            >
              <span className="h-6 w-6 [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.8] [&_svg]:stroke-linecap-round [&_svg]:stroke-linejoin-round" aria-hidden>
                <NavIcon tab={tab.key} />
              </span>
              <span>{tab.label}</span>
              {!!count && (
                <span className="absolute right-[18%] top-1.5 min-w-[1.1rem] rounded-full bg-coral-500 px-1 text-center text-[10px] font-bold leading-[1.1rem] text-paper">
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-green-800" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
