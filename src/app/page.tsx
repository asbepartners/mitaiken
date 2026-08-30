"use client";

import "@/lib/resetDevelopmentTestData";
import { TouchEvent, useMemo, useRef, useState } from "react";
import { BottomNav, Tab } from "@/components/BottomNav";
import { AuthSheet } from "@/components/AuthSheet";
import { ExploreView } from "@/components/ExploreView";
import { MyPageView } from "@/components/MyPageView";
import { InitialTabSync } from "@/components/InitialTabSync";
import { MemoryRecordDraft, MemoryRecordSheet } from "@/components/MemoryRecordSheet";
import { TriedView } from "@/components/TriedView";
import { WishlistView } from "@/components/WishlistView";
import { useExperienceCatalog } from "@/hooks/useExperienceCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useExperienceStatus } from "@/hooks/useExperienceStatus";
import { useHiddenExperiences } from "@/hooks/useHiddenExperiences";
import { useExperienceTargets } from "@/hooks/useExperienceTargets";
import { useCustomExperiences } from "@/hooks/useCustomExperiences";
import type { ExperienceTarget } from "@/hooks/useExperienceTargets";
import { useSearchMasters } from "@/hooks/useSearchMasters";
import { clearLocalUserData } from "@/lib/localUserData";

const TAB_ORDER: Tab[] = ["tried", "wishlist", "explore", "mypage"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("tried");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ExperienceTarget | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const pendingAuthAction = useRef<(() => void) | null>(null);
  const { experiences: catalogExperiences } = useExperienceCatalog();
  const { customExperiences, createExperience, updateExperience } = useCustomExperiences();
  const searchMasters = useSearchMasters();
  const auth = useAuth();
  const {
    statusMap,
    recordsMap,
    relatedUrlMap,
    toggleWishlist,
    markTried,
    updateRecord,
    deleteRecord,
    undoTried,
    removeStatus,
  } = useExperienceStatus();
  const { hiddenIds, hideExperience, restoreExperience } = useHiddenExperiences();
  const { targetsMap, initializeTargets, addTarget, updateTarget, removeTarget, clearTargets } = useExperienceTargets();
  const hasAuthenticatedUser = Boolean(auth.user);
  const experiences = useMemo(() => [
    ...catalogExperiences,
    ...(hasAuthenticatedUser
      ? customExperiences.map((experience) => (targetsMap[experience.id]?.length ? { ...experience, exampleTargets: [] } : experience))
      : []),
  ], [catalogExperiences, customExperiences, hasAuthenticatedUser, targetsMap]);

  const wishlistItems = useMemo(
    () => hasAuthenticatedUser ? experiences.filter((experience) => {
      if (statusMap[experience.id]?.status === "wishlist") return true;
      if (!experience.exampleTargets || !(targetsMap[experience.id]?.length)) return false;
      const completed = new Set((recordsMap[experience.id] ?? []).flatMap((record) => record.place ? [record.place] : []));
      return targetsMap[experience.id].some((target) => !(recordsMap[experience.id] ?? []).some((record) => record.targetId === target.id || (!record.targetId && completed.has(target.title))));
    }) : [],
    [experiences, hasAuthenticatedUser, recordsMap, statusMap, targetsMap]
  );

  const triedItems = useMemo(
    () =>
      hasAuthenticatedUser ? experiences.flatMap((experience) => {
        const records = recordsMap[experience.id] ?? [];
        return records.length ? [{ experience, records }] : [];
      }) : [],
    [experiences, hasAuthenticatedUser, recordsMap]
  );

  const pendingExperience = experiences.find((experience) => experience.id === pendingId);
  const editingExperience = experiences.find((experience) => experience.id === editingId);
  const editingRecord =
    editingId && editingRecordId
      ? recordsMap[editingId]?.find((record) => record.id === editingRecordId)
      : undefined;
  const editingTarget =
    editingId && editingRecord?.targetId
      ? targetsMap[editingId]?.find((target) => target.id === editingRecord.targetId)
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

  function requireAuth(action: () => void) {
    if (auth.user) {
      action();
      return;
    }
    pendingAuthAction.current = action;
    setAuthOpen(true);
  }

  function closeAuth() {
    pendingAuthAction.current = null;
    setAuthOpen(false);
  }

  function resumeAfterAuthentication() {
    const action = pendingAuthAction.current;
    pendingAuthAction.current = null;
    if (action) window.setTimeout(action, 0);
  }

  async function handleSignOut() {
    const result = await auth.signOut();
    if (!result.error) {
      clearLocalUserData();
      window.location.reload();
    }
    return result;
  }

  function handleConfirmRecord(record: MemoryRecordDraft) {
    if (!auth.user) {
      requireAuth(() => handleConfirmRecord(record));
      return;
    }
    if (editingId && editingRecordId) {
      updateRecord(editingId, editingRecordId, record);
      setEditingId(null);
      setEditingRecordId(null);
      return;
    }

    if (pendingId) markTried(pendingId, record);
    setPendingId(null);
    setPendingTarget(null);
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden bg-ivory bg-paper-texture">
      <InitialTabSync onChange={setTab} />
      <main
        className="mx-auto min-w-0 w-full max-w-2xl flex-1 pb-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tab === "explore" && (
          <ExploreView
            items={experiences}
            hiddenIds={hiddenIds}
            statusMap={hasAuthenticatedUser ? statusMap : {}}
            onHide={hideExperience}
            onToggleWishlist={(id) => requireAuth(() => {
              if (!statusMap[id]) void initializeTargets(id);
              toggleWishlist(id);
            })}
            onRequestMarkTried={(id) => requireAuth(() => setPendingId(id))}
            onUndoTried={(id) => requireAuth(() => undoTried(id))}
            searchMasters={searchMasters.masters}
            searchMastersLoading={searchMasters.loading}
            searchMastersError={searchMasters.error}
          />
        )}
        {tab === "wishlist" && (
          <WishlistView
            items={wishlistItems}
            triedCount={triedItems.length}
            markingId={pendingId}
            onExplore={() => setTab("explore")}
            onRequireAuth={requireAuth}
            onRequestMarkTried={(id) => requireAuth(() => setPendingId(id))}
            onRemove={(id) => {
              removeStatus(id);
              clearTargets(id);
            }}
            targetsMap={targetsMap}
            recordsMap={recordsMap}
            onRequestTargetRecord={(parentId, target) => {
              requireAuth(() => {
                setPendingTarget(target);
                setPendingId(parentId);
              });
            }}
            onAddTarget={addTarget}
            onUpdateTarget={updateTarget}
            onRemoveTarget={removeTarget}
            onEditRecord={(experienceId, recordId) => {
              setEditingId(experienceId);
              setEditingRecordId(recordId);
            }}
            onDeleteRecord={deleteRecord}
            onCreateOriginal={async (draft, targets) => {
              const id = await createExperience(draft);
              for (const target of targets) addTarget(id, target);
              toggleWishlist(id);
            }}
            onUpdateOriginal={async (id, draft, targets) => {
              await updateExperience(id, draft);
              for (const target of targets) addTarget(id, target);
            }}
            searchMasters={searchMasters.masters}
            searchMastersLoading={searchMasters.loading}
            searchMastersError={searchMasters.error}
          />
        )}
        {tab === "tried" && (
          <TriedView
            items={triedItems}
            wishlistCount={wishlistItems.length}
            onExplore={() => setTab("explore")}
            onOpenWishlist={() => setTab("wishlist")}
            onAddRecord={(id) => requireAuth(() => setPendingId(id))}
            onEditRecord={(experienceId, recordId) => {
              setEditingId(experienceId);
              setEditingRecordId(recordId);
            }}
            onDeleteRecord={deleteRecord}
            onAddTarget={addTarget}
            onUpdateTarget={updateTarget}
            onRemoveTarget={removeTarget}
            targetsMap={targetsMap}
            onRequestTargetRecord={(parentId, target) => {
              requireAuth(() => {
                setPendingTarget(target);
                setPendingId(parentId);
              });
            }}
          />
        )}
        {tab === "mypage" && (
          <MyPageView
            user={auth.user}
            loading={auth.loading}
            configured={auth.configured}
            onLogin={() => {
              pendingAuthAction.current = null;
              setAuthOpen(true);
            }}
            onSignOut={handleSignOut}
            hiddenItems={experiences.filter((experience) => hiddenIds.includes(experience.id))}
            onRestoreHidden={restoreExperience}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} wishlistCount={wishlistItems.length} />

      {(pendingExperience || editingExperience) && (
        <MemoryRecordSheet
          key={
            editingExperience
              ? `edit-${editingExperience.id}-${editingRecordId}`
              : `new-${pendingExperience?.id}`
          }
          experienceTitle={pendingTarget?.title ?? editingTarget?.title ?? (editingExperience ?? pendingExperience)!.title}
          relatedUrl={pendingTarget?.relatedUrl ?? editingTarget?.relatedUrl ?? relatedUrlMap[(editingExperience ?? pendingExperience)!.id]}
          initialRecord={
            editingRecord
              ? {
                  timing: editingRecord.timing,
                  place: editingRecord.place,
                  companion: editingRecord.companion,
                  memo: editingRecord.memo,
                  photoUrl: editingRecord.photoUrl,
                  targetId: editingRecord.targetId,
                }
              : pendingTarget
                ? {
                    timing: { type: "date", value: new Date().toISOString().slice(0, 10) },
                    targetId: pendingTarget.id,
                  }
                : undefined
          }
          onCancel={() => {
            setPendingId(null);
            setEditingId(null);
            setEditingRecordId(null);
            setPendingTarget(null);
          }}
          onConfirm={handleConfirmRecord}
        />
      )}

      {authOpen && (
        <AuthSheet
          onClose={closeAuth}
          onAuthenticated={resumeAfterAuthentication}
          onSendOtp={auth.sendOtp}
          onVerifyOtp={auth.verifyOtp}
          onGetLegalAcceptanceStatus={auth.getLegalAcceptanceStatus}
          onRecordLegalAcceptance={auth.recordCurrentLegalAcceptance}
        />
      )}
    </div>
  );
}
