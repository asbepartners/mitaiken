const PERSONAL_STORAGE_KEYS = [
  "mitaiken-zone:status",
  "mitaiken-zone:records",
  "mitaiken-zone:custom-experiences",
  "mitaiken-zone:targets",
  "mitaiken-zone:hidden-experiences",
];

const PERSONAL_STORAGE_KEY_PREFIXES = [
  "mitaiken-zone:status-migrated:",
  "mitaiken-zone:hidden-migrated:",
];

// Which account this device's local data was last synced from, if any. Since
// the wishlist/tried tabs now render straight from local storage without
// requiring a live session (so a casual, never-logged-in visitor can use
// them), this is what lets reconcileLocalUserData tell "this is that same
// visitor's own not-yet-synced taps" (no marker -- always left alone) apart
// from "this is a mirror of somebody's account that isn't the current
// session anymore" (marker set, but to someone else or nobody) -- e.g. a
// session that quietly expired rather than being signed out of explicitly,
// possibly on a shared computer. See asbepartners/mitaiken#54 and its
// follow-up discussion.
const SYNCED_USER_KEY = "mitaiken-zone:synced-user-id";

export function clearLocalUserData() {
  for (const key of PERSONAL_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(SYNCED_USER_KEY);
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key && PERSONAL_STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
    }
  }
}

// Call once a login has finished syncing this device's local data with the
// account's server-side data (i.e. right after a successful reload()), so
// the marker always reflects whichever account the local cache currently
// mirrors.
export function markLocalDataSyncedTo(userId: string) {
  window.localStorage.setItem(SYNCED_USER_KEY, userId);
}

// Call once per app load, as soon as the current session (or lack of one) is
// known. Wipes the local cache if it mirrors an account that isn't the
// current session -- including a session that expired or was otherwise lost
// without an explicit sign-out, which previously left stale personal data
// (records, memos, photos) visible with no login prompt to explain it.
// Returns true if it cleared anything, so the caller can force a reload to
// keep every hook's in-memory state consistent with the now-empty storage.
export function reconcileLocalUserData(currentUserId: string | null): boolean {
  const syncedTo = window.localStorage.getItem(SYNCED_USER_KEY);
  if (syncedTo && syncedTo !== currentUserId) {
    clearLocalUserData();
    return true;
  }
  return false;
}
