const RESET_MARKER = "mitaiken-zone:test-data-reset:2026-08-27";

const TEST_DATA_KEYS = [
  "mitaiken-zone:status",
  "mitaiken-zone:records",
  "mitaiken-zone:targets",
  "mitaiken-zone:custom-experiences",
  "mitaiken-zone:hidden-experiences",
  "mitaiken-zone:search-masters",
];

const MIGRATION_KEY_PREFIXES = [
  "mitaiken-zone:status-migrated:",
  "mitaiken-zone:hidden-migrated:",
];

function resetDevelopmentTestData() {
  if (typeof window === "undefined" || window.localStorage.getItem(RESET_MARKER) === "1") {
    return;
  }

  TEST_DATA_KEYS.forEach((key) => window.localStorage.removeItem(key));

  Object.keys(window.localStorage)
    .filter((key) => MIGRATION_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))
    .forEach((key) => window.localStorage.removeItem(key));

  window.localStorage.setItem(RESET_MARKER, "1");
}

resetDevelopmentTestData();
