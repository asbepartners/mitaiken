import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "./fixtures";

const TEST_USER_PATH = path.join(__dirname, "..", "..", "playwright", ".auth", "test-user.json");

export default async function globalTeardown() {
  let userId: string;
  try {
    const raw = await readFile(TEST_USER_PATH, "utf-8");
    userId = JSON.parse(raw).userId;
  } catch {
    // global-setup never ran (e.g. it failed before writing this file) —
    // nothing to clean up.
    return;
  }
  if (!userId) return;

  const admin = createAdminClient();
  // experience_logs / user_experience_items reference user_experiences with
  // "on delete cascade", so removing these rows is enough to clear
  // everything the test account wrote during the run.
  const { error } = await admin.from("user_experiences").delete().eq("user_id", userId);
  if (error) {
    console.error(`Failed to clean up e2e test data for user ${userId}:`, error.message);
  }
}
