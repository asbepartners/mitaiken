import { chromium, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  createAdminClient,
  createAnonClient,
  E2E_TEST_EMAIL,
  SUPABASE_AUTH_STORAGE_KEY,
} from "./fixtures";

const AUTH_DIR = path.join(__dirname, "..", "..", "playwright", ".auth");
const STORAGE_STATE_PATH = path.join(AUTH_DIR, "user.json");

export default async function globalSetup(config: FullConfig) {
  const admin = createAdminClient();

  // generateLink both creates the account (if it doesn't exist yet) and
  // returns a hashed_token we can redeem for a real session, without ever
  // sending or reading an actual email.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: E2E_TEST_EMAIL,
  });
  if (error || !data?.properties?.hashed_token) {
    throw new Error(
      `Failed to generate a magic link for the e2e test account (${E2E_TEST_EMAIL}): ${error?.message ?? "no hashed_token in response"}`
    );
  }

  const anon = createAnonClient();
  const { data: verifyData, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError || !verifyData.session) {
    throw new Error(
      `Failed to establish a session for the e2e test account: ${verifyError?.message ?? "no session returned"}`
    );
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.evaluate(
    ({ key, session }) => window.localStorage.setItem(key, JSON.stringify(session)),
    { key: SUPABASE_AUTH_STORAGE_KEY, session: verifyData.session }
  );

  await mkdir(AUTH_DIR, { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
