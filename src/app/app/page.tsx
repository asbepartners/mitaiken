"use client";

import "@/lib/resetDevelopmentTestData";
import { TouchEvent, useEffect, useMemo, useRef, useState } from "react";
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
import { clearLocalUserData, reconcileLocalUserData } from "@/lib/localUserData";
import { InitialAppScreen } from "@/components/InitialAppScreen";
import { ConnectivityNotice } from "@/components/ConnectivityNotice";
import { MaintenanceNotice } from "@/components/MaintenanceNotice";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

const TAB_ORDER: Tab[] = ["tried", "wishlist", "explore", "mypage"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("tried");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ExperienceTarget | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const [connectivityNoticeOpen, setConnectivityNoticeOpen] = useState(false);
  const [maintenanceNoticeOpen, setMaintenanceNoticeOpen] = useState(false);
  const pendingAuthAction = useRef<(() => void) | null>(null);
  const hasBootedRef = useRef(false);
  const connectivity = useConnectivity();
  const maintenance = useMaintenanceMode();
  const { experiences: catalogExperiences, loading: catalogLoading } = useExperienceCatalog();
  const { customExperiences, loading: customExperiencesLoading, error: customExperiencesError, createExperience, updateExperience } = useCustomExperiences();
  const searchMasters = useSearchMasters();
  const auth = useAuth();

  // The wishlist/tried tabs now render straight from local storage without
  // requiring a live session, so a device that was signed into an account
  // before (its local cache still mirroring that account's data) must not
  // keep showing that data once the session is gone for any reason -- not
  // just an explicit ログアウト tap, but also e.g. a session that quietly
  // expired. Otherwise, on a shared computer, whoever picks the device up
  // next sees the previous person's real records with no login prompt to
  // explain why. See asbepartners/mitaiken#54 and its follow-up.
  useEffect(() => {
    if (auth.loading) return;
    if (reconcileLocalUserData(auth.user?.id ?? null)) {
      window.location.reload();
    }
  }, [auth.loading, auth.user]);

  const {
    statusMap,
    recordsMap,
    detailsMap,
    loading: experienceStatusLoading,
    error: experienceStatusError,
    toggleWishlist,
    markTried,
    updateRecord,
    deleteRecord,
    undoTried,
    removeStatus,
    updateWishlistDetails,
    reload: reloadExperienceStatus,
  } = useExperienceStatus();
  const { hiddenIds, hideExperience, restoreExperience } = useHiddenExperiences();
  const { targetsMap, loading: targetsLoading, error: targetsError, initializeTargets, addTarget, updateTarget, removeTarget, clearTargets } = useExperienceTargets();
  const categoryLabels = useMemo(
    () => new Map(searchMasters.masters.categories.map(({ code, label }) => [code, label])),
    [searchMasters.masters.categories]
  );
  const experiences = useMemo(() => [
    ...catalogExperiences,
    ...customExperiences.map((experience) => (targetsMap[experience.id]?.length ? { ...experience, exampleTargets: [] } : experience)),
  ].map((experience) => ({
    ...experience,
    categoryLabel: categoryLabels.get(experience.categoryCode ?? experience.category) ?? experience.categoryLabel,
  })), [catalogExperiences, categoryLabels, customExperiences, targetsMap]);

  // "みつける" (explore) is for discovering the curated catalog -- an
  // original/custom experience is something the user already decided they
  // want to try, so it belongs only in "やってみたい" (wishlist), not mixed
  // into the discovery feed.
  const exploreItems = useMemo(
    () => catalogExperiences.map((experience) => ({
      ...experience,
      categoryLabel: categoryLabels.get(experience.categoryCode ?? experience.category) ?? experience.categoryLabel,
    })),
    [catalogExperiences, categoryLabels]
  );

  const wishlistItems = useMemo(
    () => experiences.filter((experience) => {
      if (statusMap[experience.id]?.status === "wishlist") return true;
      if (!experience.exampleTargets || !(targetsMap[experience.id]?.length)) return false;
      const completed = new Set((recordsMap[experience.id] ?? []).flatMap((record) => record.place ? [record.place] : []));
      return targetsMap[experience.id].some((target) => !(recordsMap[experience.id] ?? []).some((record) => record.targetId === target.id || (!record.targetId && completed.has(target.title))));
    }),
    [experiences, recordsMap, statusMap, targetsMap]
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

  function canSave() {
    if (maintenance.enabled) {
      setMaintenanceNoticeOpen(true);
      return false;
    }
    if (!connectivity.online) {
      setConnectivityNoticeOpen(true);
      return false;
    }
    return true;
  }

  // Only the moment a "やったことある" record (with its date/place/photo/memo)
  // is actually saved requires an account -- casual wishlist taps stay free.
  // Gating here (rather than when the record sheet opens) lets someone fill
  // the whole thing out and see its value before being asked to log in.
  // See asbepartners/mitaiken#54 for the full discussion of why the line was
  // drawn here (and not, e.g., on every wishlist tap as before).
  function requireAuthToSaveRecord(action: () => void) {
    if (!canSave()) return;
    if (auth.user) {
      action();
      return;
    }
    pendingAuthAction.current = action;
    setAuthReason("あなたの大切な記録を守るために、ログインが必要です。");
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

  async function handleDeleteAccount() {
    const result = await auth.deleteAccount();
    if (!result.error) {
      clearLocalUserData();
      window.location.reload();
    }
    return result;
  }

  function handleConfirmRecord(record: MemoryRecordDraft) {
    if (!auth.user) {
      requireAuthToSaveRecord(() => handleConfirmRecord(record));
      return;
    }
    if (!canSave()) return;
    if (editingId && editingRecordId) {
      // updateRecord already updates local state synchronously and awaits
      // its own Supabase write before resolving; the sheet can close as
      // soon as the (optimistically-reflected) update is requested.
      void updateRecord(editingId, editingRecordId, record);
      setEditingId(null);
      setEditingRecordId(null);
      return;
    }

    if (pendingId) void markTried(pendingId, record);
    setPendingId(null);
    setPendingTarget(null);
  }

  const initialLoading = !connectivity.ready || auth.loading || catalogLoading || searchMasters.loading ||
    experienceStatusLoading || customExperiencesLoading || targetsLoading;
  const initialError = searchMasters.error || experienceStatusError || customExperiencesError || targetsError;

  // Once the app has rendered once, later reloads (e.g. per-user data
  // refetching right after a login) must not unmount the whole tree again —
  // that would silently reset any open sheet (like AuthSheet) to its
  // initial step.
  if (!initialLoading) hasBootedRef.current = true;

  if (!connectivity.ready) return <InitialAppScreen state="loading" />;
  if (connectivity.offlineAtStartup) return <InitialAppScreen state="offline" />;
  if (!hasBootedRef.current && initialLoading) return <InitialAppScreen state="loading" />;
  if (initialError) return <InitialAppScreen state="error" />;

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
            items={exploreItems}
            hiddenIds={hiddenIds}
            statusMap={statusMap}
            onHide={hideExperience}
            onToggleWishlist={async (id) => {
              if (!canSave()) return;
              const adding = !statusMap[id];
              if (adding) void initializeTargets(id);
              await toggleWishlist(id);
            }}
            onRequestMarkTried={(id) => setPendingId(id)}
            onUndoTried={async (id) => { if (canSave()) await undoTried(id); }}
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
            onRequestMarkTried={(id) => setPendingId(id)}
            onRemove={async (id) => {
              if (!canSave()) return;
              await removeStatus(id);
              await clearTargets(id);
            }}
            targetsMap={targetsMap}
            recordsMap={recordsMap}
            detailsMap={detailsMap}
            onUpdateWishlistDetails={(id, details) => canSave() ? updateWishlistDetails(id, details) : Promise.resolve(false)}
            onRequestTargetRecord={(parentId, target) => {
              setPendingTarget(target);
              setPendingId(parentId);
            }}
            onAddTarget={(parentId, draft) => canSave() ? addTarget(parentId, draft) : Promise.resolve(false)}
            onUpdateTarget={(parentId, id, draft) => canSave() ? updateTarget(parentId, id, draft) : Promise.resolve(false)}
            onRemoveTarget={async (parentId, id) => { if (canSave()) await removeTarget(parentId, id); }}
            onEditRecord={(experienceId, recordId) => {
              setEditingId(experienceId);
              setEditingRecordId(recordId);
            }}
            onDeleteRecord={async (experienceId, recordId) => { if (canSave()) await deleteRecord(experienceId, recordId); }}
            onCreateOriginal={async (draft, targets) => {
              if (!canSave()) return false;
              const id = await createExperience(draft);
              for (const target of targets) await addTarget(id, target);
              await toggleWishlist(id);
              await reloadExperienceStatus();
              return true;
            }}
            onUpdateOriginal={async (id, draft, targets) => {
              if (!canSave()) return false;
              await updateExperience(id, draft);
              for (const target of targets) await addTarget(id, target);
              await reloadExperienceStatus();
              return true;
            }}
            searchMasters={searchMasters.masters}
            searchMastersLoading={searchMasters.loading}
            searchMastersError={searchMasters.error}
          />
        )}
        {tab === "tried" && (
          <TriedView
            items={triedItems}
            categories={searchMasters.masters.categories}
            wishlistCount={wishlistItems.length}
            onExplore={() => setTab("explore")}
            onOpenWishlist={() => setTab("wishlist")}
            onAddRecord={(id) => setPendingId(id)}
            onEditRecord={(experienceId, recordId) => {
              setEditingId(experienceId);
              setEditingRecordId(recordId);
            }}
            onDeleteRecord={async (experienceId, recordId) => { if (canSave()) await deleteRecord(experienceId, recordId); }}
            onUpdateOriginal={async (id, draft, targets) => {
              if (!canSave()) return false;
              await updateExperience(id, draft);
              for (const target of targets) await addTarget(id, target);
              return true;
            }}
            searchMasters={searchMasters.masters}
            searchMastersLoading={searchMasters.loading}
            searchMastersError={searchMasters.error}
            onAddTarget={(parentId, draft) => canSave() ? addTarget(parentId, draft) : Promise.resolve(false)}
            onUpdateTarget={(parentId, id, draft) => canSave() ? updateTarget(parentId, id, draft) : Promise.resolve(false)}
            onRemoveTarget={async (parentId, id) => { if (canSave()) await removeTarget(parentId, id); }}
            targetsMap={targetsMap}
            onRequestTargetRecord={(parentId, target) => {
              setPendingTarget(target);
              setPendingId(parentId);
            }}
          />
        )}
        {tab === "mypage" && (
          <MyPageView
            user={auth.user}
            loading={auth.loading}
            configured={auth.configured}
            onLogin={() => {
              if (auth.user) return;
              pendingAuthAction.current = null;
              setAuthReason(undefined);
              setAuthOpen(true);
            }}
            onSignOut={handleSignOut}
            onDeleteAccount={handleDeleteAccount}
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
          relatedUrl={pendingTarget?.relatedUrl ?? editingTarget?.relatedUrl ?? detailsMap[(editingExperience ?? pendingExperience)!.id]?.relatedUrl}
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
                    targetId: pendingTarget.id,
                  }
                : pendingExperience
                  ? {
                      timing: detailsMap[pendingExperience.id]?.plannedDate
                        ? { type: "date", value: detailsMap[pendingExperience.id]!.plannedDate! }
                        : undefined,
                      place: detailsMap[pendingExperience.id]?.place,
                      companion: detailsMap[pendingExperience.id]?.companion,
                      memo: detailsMap[pendingExperience.id]?.memo,
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
          reason={authReason}
        />
      )}

      {connectivityNoticeOpen && <ConnectivityNotice onClose={() => setConnectivityNoticeOpen(false)} />}
      {maintenanceNoticeOpen && <MaintenanceNotice message={maintenance.message} onClose={() => setMaintenanceNoticeOpen(false)} />}
    </div>
  );
}
