"use client";

import { useMemo, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { AuthSheet } from "@/components/AuthSheet";
import { ExploreView } from "@/components/ExploreView";
import { MyPageView } from "@/components/MyPageView";
import { TriedTimingSheet } from "@/components/TriedTimingSheet";
import { TriedView } from "@/components/TriedView";
import { WishlistView } from "@/components/WishlistView";
import { useExperienceCatalog } from "@/hooks/useExperienceCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useExperienceStatus } from "@/hooks/useExperienceStatus";
import { Timing } from "@/lib/timing";

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { experiences } = useExperienceCatalog();
  const auth = useAuth();
  const { statusMap, toggleWishlist, markTried, undoTried, removeStatus } = useExperienceStatus();

  const wishlistItems = useMemo(
    () => experiences.filter((experience) => statusMap[experience.id]?.status === "wishlist"),
    [experiences, statusMap]
  );
  const triedItems = useMemo(
    () =>
      experiences.flatMap((experience) => {
        const entry = statusMap[experience.id];
        if (entry?.status !== "cleared") return [];
        return [{ experience, timing: entry.timing }];
      }),
    [experiences, statusMap]
  );

  const pendingExperience = experiences.find((experience) => experience.id === pendingId);

  function handleConfirmTiming(timing: Timing) {
    if (pendingId) markTried(pendingId, timing);
    setPendingId(null);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ivory bg-paper-texture">
      <main className="mx-auto w-full max-w-2xl flex-1 pb-24">
        {tab === "explore" && (
          <ExploreView
            items={experiences}
            statusMap={statusMap}
            onToggleWishlist={toggleWishlist}
            onRequestMarkTried={setPendingId}
            onUndoTried={undoTried}
          />
        )}
        {tab === "wishlist" && (
          <WishlistView
            items={wishlistItems}
            onRequestMarkTried={setPendingId}
            onRemove={removeStatus}
          />
        )}
        {tab === "tried" && <TriedView items={triedItems} onUndo={undoTried} />}
        {tab === "mypage" && (
          <MyPageView
            user={auth.user}
            loading={auth.loading}
            configured={auth.configured}
            onLogin={() => setAuthOpen(true)}
            onSignOut={auth.signOut}
          />
        )}
      </main>

      <BottomNav
        active={tab}
        onChange={setTab}
        wishlistCount={wishlistItems.length}
        triedCount={triedItems.length}
      />

      {pendingExperience && (
        <TriedTimingSheet
          experienceTitle={pendingExperience.title}
          onCancel={() => setPendingId(null)}
          onConfirm={handleConfirmTiming}
        />
      )}

      {authOpen && (
        <AuthSheet
          onClose={() => setAuthOpen(false)}
          onSendOtp={auth.sendOtp}
          onVerifyOtp={auth.verifyOtp}
        />
      )}
    </div>
  );
}
