"use client";

export type Tab = "explore" | "wishlist" | "tried";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  wishlistCount: number;
  triedCount: number;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "explore", label: "探す", icon: "🔭" },
  { key: "wishlist", label: "リスト", icon: "♡" },
  { key: "tried", label: "やってみた！", icon: "🎉" },
];

export function BottomNav({ active, onChange, wishlistCount, triedCount }: BottomNavProps) {
  const counts: Record<Tab, number | null> = {
    explore: null,
    wishlist: wishlistCount,
    tried: triedCount,
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
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
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
