import { test, expect } from "@playwright/test";
import { createAdminClient, E2E_TEST_EMAIL } from "./fixtures";

// Regression coverage for #58's largest identified gap for the anonymous
// journey: anonymous-visitor.spec.ts confirms the login prompt appears when
// an unauthenticated visitor tries to save a やったことある record, but
// stops there. It never actually logs in, so the "保留していた保存アクショ
// ンが resumeAfterAuthentication() で自動的に再実行される" behavior (see
// page.tsx) has no coverage. This spec completes that journey end to end,
// through the real AuthSheet UI, using Supabase's admin API to fetch the
// one-time code that would otherwise only be visible in an email inbox.
test.use({ storageState: { cookies: [], origins: [] } });

const ITEM_TITLE = "一人でフェリーに乗る";
const RECORD_DATE = "2026-03-05";
const MEMO = "未ログイン完走E2Eテストのメモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

async function deleteRecordIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToTab(page, "はじめて帖");
  await page.getByRole("button", { name: "すべての記録" }).click();
  const card = page.locator("li", { hasText: ITEM_TITLE });
  const present = await card.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await card.getByRole("button", { name: `${ITEM_TITLE}のその他の操作` }).click();
  const deleteButton = page.getByRole("button", { name: "記録を削除" });
  await deleteButton.click();
  await expect(deleteButton).not.toBeVisible();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToTab(page, "やってみたい");
  const row = page.locator("li", { hasText: ITEM_TITLE });
  const present = await row.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await row.getByRole("button", { name: `${ITEM_TITLE}のメニュー` }).click();
  const removeButton = page.getByRole("button", { name: "リストから外す" });
  await removeButton.click();
  await expect(removeButton).not.toBeVisible();

  await page.reload();
  await goToTab(page, "やってみたい");
  await expect(row).not.toBeVisible();
}

// This test's own cleanup runs authenticated (login is part of the test
// itself), so it can reuse the same logged-in helpers the other specs use --
// unlike anonymous-visitor.spec.ts, which never completes a login and so
// never needs backend cleanup at all.
test.describe("未ログイン→ログイン完了→保留記録の自動保存", () => {
  test.afterEach(async ({ page }) => {
    await deleteRecordIfPresent(page);
    await removeFromWishlistIfPresent(page);
  });

  test("未ログインでやったことあるを決定→ログイン完走→自動保存→はじめて帖に表示", async ({ page }) => {
    await deleteRecordIfPresent(page);
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await goToTab(page, "みつける");
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();

    await expect(page.getByText("やってみたいの詳細を編集")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "閉じる" }).last().click();
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();

    await goToTab(page, "やってみたい");
    await page.locator("li", { hasText: ITEM_TITLE }).getByLabel(`${ITEM_TITLE}をやってみた`).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(RECORD_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(MEMO);

    // 決定した瞬間にログインを求められる
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible({ timeout: 5000 });

    await page.getByLabel("メールアドレス").fill(E2E_TEST_EMAIL);
    await page.getByRole("button", { name: "確認コードを送る" }).click();
    await expect(page.getByText("確認コードを入力")).toBeVisible({ timeout: 10000 });

    // 実際に届く6桁の確認コードはメール受信箱でしか見えないが、Supabaseの管理
    // APIで同じOTPを平文で取得できる(email_otp)。直前のUI操作(確認コードを
    // 送る)がすでに実サーバーへOTPを発行させているので、ここで生成し直した
    // ものが「最新の有効なコード」として上書きされる。
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: E2E_TEST_EMAIL,
    });
    if (error || !data?.properties?.email_otp) {
      throw new Error(`Failed to obtain a verifiable OTP for ${E2E_TEST_EMAIL}: ${error?.message ?? "no email_otp in response"}`);
    }

    await page.getByLabel("6桁の確認コード").fill(data.properties.email_otp);
    await page.getByRole("button", { name: "確認する" }).click();

    // 初回ログイン時は利用規約・プライバシーポリシーへの同意が必要な場合がある
    const consentHeading = page.getByText("利用規約・プライバシーポリシーの確認");
    if (await consentHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "同意して続ける" }).click();
    }

    // ログインが閉じ、保留していた記録が自動的に保存されてシートが閉じること
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });

    // はじめて帖に表示されることを確認
    await goToTab(page, "はじめて帖");
    const firstCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(MEMO);
  });
});
