"use client";

import { TouchEvent, useMemo, useRef, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { AuthSheet } from "@/components/AuthSheet";
import { ExploreView } from "@/components/ExploreView";
import { MyPageView } from "@/components/MyPageView";
import { TriedRecordDraft, TriedTimingSheet } from "@/components/TriedTimingSheet";
import { TriedView } from "@/components/TriedView";
import { WishlistView } from "@/components/WishlistView";
import { useExperienceCatalog } from "@/hooks/useExperienceCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useExperienceStatus } from "@/hooks/useExperienceStatus";
import { useHiddenExperiences } from "@/hooks/useHiddenExperiences";

const TAB_ORDER: Tab[] = ["tried", "wishlist", "explore", "mypage"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("tried");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { experiences } = useExperienceCatalog();
  const auth = useAuth();
  const {
    statusMap,
    recordsMap,
    toggleWishlist,
    markTried,
    updateRecord,
    deleteRecord,
    undoTried,
    removeStatus,
  } = useExperienceStatus();
  const { hiddenIds, hideExperience, restoreExperience } = useHiddenExperiences();

  const wishlistItems = useMemo(
    () => experiences.filter((experience) => statusMap[experience.id]?.status === "wishlist"),
    [experiences, statusMap]
  );

  const triedItems = useMemo(
    () =>
      experiences.flatMap((experience) => {
        const records = recordsMap[experience.id] ?? [];
        return records.length ? [{ experience, records }] : [];
      }),
    [experiences, recordsMap]
  );

  const pendingExperience = experiences.find((experience) => experience.id === pendingId);
  const editingExperience = experiences.find((experience) => experience.id === editingId);
  const editingRecord =
    editingId && editingRecordId
      ? recordsMap[editingId]?.find((record) => record.id === editingRecordId)
      : undefined;

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    let node: HTMLElement | null = target;
    let isExploreCardGesture = false;
    if (tab === "explore") {
      while (node && node !== event.currentTarget) {
        if (node.classList.contains("h-[330px]")) {
          isExploreCardGesture = true;
          break;
        }
        node = node.parentElement;
      }
    }
    if (isExploreCardGesture) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || pendingId || editingId || authOpen) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

    const currentIndex = TAB_ORDER.indexOf(tab);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < TAB_ORDER.length) {
      setTab(TAB_ORDER[nextIndex]);
    }
  }

  function handleConfirmRecord(record: TriedRecordDraft) {
    if (editingId && editingRecordId) {
      updateRecord(editingId, editingRecordId, record);
      setEditingId(null);
      setEditingRecordId(null);
      return;
    }

    if (pendingId) markTried(pendingId, record);
    setPendingId(null);
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden bg-ivory bg-paper-texture">
      <main
        className="mx-auto min-w-0 w-full max-w-2xl flex-1 pb-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tab === "explore" && (
          <ExploreView
            items={experiences}
            hiddenIds={hiddenIds}
            statusMap={statusMap}
            onHide={hideExperience}
            onToggleWishlist={toggleWishlist}
            onRequestMarkTried={setPendingId}
            onUndoTried={undoTried}
          />
        )}
        {tab === "wishlist" && (
          <WishlistView
            items={wishlistItems}
            triedCount={triedItems.length}
            markingId={pendingId}
            onExplore={() => setTab("explore")}
            onRequestMarkTried={setPendingId}
            onRemove={removeStatus}
          />
        )}
        {tab === "tried" && (
          <TriedView
            items={triedItems}
            wishlistCount={wishlistItems.length}
            onExplore={() => setTab("explore")}
            onOpenWishlist={() => setTab("wishlist")}
            onAddRecord={setPendingId}
            onEditRecord={(experienceId, recordId) => {
              setEditingId(experienceId);
              setEditingRecordId(recordId);
            }}
            onDeleteRecord={deleteRecord}
          />
        )}
        {tab === "mypage" && (
          <MyPageView
            user={auth.user}
            loading={auth.loading}
            configured={auth.configured}
            onLogin={() => setAuthOpen(true)}
            onSignOut={auth.signOut}
            hiddenItems={experiences.filter((experience) => hiddenIds.includes(experience.id))}
            onRestoreHidden={restoreExperience}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} wishlistCount={wishlistItems.length} />

      {(pendingExperience || editingExperience) && (
        <TriedTimingSheet
          key={
            editingExperience
              ? `edit-${editingExperience.id}-${editingRecordId}`
              : `new-${pendingExperience?.id}`
          }
          experienceTitle={(editingExperience ?? pendingExperience)!.title}
          initialRecord={
            editingRecord
              ? {
                  timing: editingRecord.timing,
                  memo: editingRecord.memo,
                  photoUrl: editingRecord.photoUrl,
                }
              : undefined
          }
          onCancel={() => {
            setPendingId(null);
            setEditingId(null);
            setEditingRecordId(null);
          }}
          onConfirm={handleConfirmRecord}
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
