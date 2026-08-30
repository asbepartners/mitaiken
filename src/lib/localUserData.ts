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

export function clearLocalUserData() {
  for (const key of PERSONAL_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key && PERSONAL_STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
    }
  }
}
