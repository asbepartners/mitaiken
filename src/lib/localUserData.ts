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

// One-time cutover flag for devices that already had local personal data
// *before* SYNCED_USER_KEY existed (i.e. before this reconciliation code
// shipped). Such data has no marker to compare, which reconcileLocalUserData
// would otherwise treat exactly like a casual anonymous visitor's own taps
// and leave alone -- but on a device with no active session, unmarked local
// data is at least as likely to be a stale mirror of somebody's real,
// already-logged-in-before account (the far more common case, since
// anonymous use only became possible with this same change) as it is to be
// today's brand-new anonymous taps. Err toward wiping it once: real personal
// records (photos, memos) outweigh losing a few hours of anonymous taps made
// before this fix landed.
const LEGACY_SWEEP_KEY = "mitaiken-zone:local-data-legacy-swept";

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
  if (syncedTo) {
    if (syncedTo !== currentUserId) {
      clearLocalUserData();
      return true;
    }
    return false;
  }

  if (window.localStorage.getItem(LEGACY_SWEEP_KEY) === "1") return false;
  window.localStorage.setItem(LEGACY_SWEEP_KEY, "1");
  if (!currentUserId) {
    clearLocalUserData();
    // clearLocalUserData() doesn't touch this key, but set it again in case
    // that ever changes -- the sweep must only ever run once per device.
    window.localStorage.setItem(LEGACY_SWEEP_KEY, "1");
    return true;
  }
  return false;
}
