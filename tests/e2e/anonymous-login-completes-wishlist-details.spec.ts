import { test, expect } from "@playwright/test";
import { createAdminClient, E2E_TEST_EMAIL } from "./fixtures";
import { recordOtpIssuance, waitOutOtpCooldown } from "./otpCooldown";

// See ./otpCooldown.ts for why this cooldown wait exists: globalSetup issues
// a magiclink token for this same email, and anonymous-login-completes-
// record.spec.ts (which may run right before this spec) issues two more of
// its own. Supabase's per-user OTP cooldown (~60s) applies to any of these.

// Regression coverage for asbepartners/mitaiken#70: やってみたい詳細
// (WishlistItemDetailsSheet) now requires login to save, the same way a
// やったことある record already did (covered end-to-end by
// anonymous-login-completes-record.spec.ts). That existing spec's gate
// (requireAuthToSaveRecord) fires a stored void action once login completes;
// the wishlist-details gate (requireAuthToSaveWishlistDetails in
// src/app/app/page.tsx) instead resolves the Promise<boolean> that
// WishlistView is already awaiting, since it only closes the sheet once that
// promise resolves true. This spec exists specifically to prove that
// Promise-based path actually saves and closes the sheet after a real login,
// not just that the login prompt appears.
test.use({ storageState: { cookies: [], origins: [] } });

const ITEM_TITLE = "一人で喫茶店に行く";
const MEMO = "未ログイン完走E2Eテスト(やってみたい詳細)のメモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
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
// itself), so it can reuse the same logged-in helper the other specs use --
// unlike anonymous-visitor.spec.ts, which never completes a login and so
// never needs backend cleanup at all.
test.describe("未ログイン→ログイン完了→保留していたやってみたい詳細の自動保存", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("未ログインでやってみたい詳細を決定→ログイン完走→自動保存→シートが閉じてリロード後も残る", async ({ page }) => {
    // waitOutOtpCooldown can add up to ~65s on top of this test's own real
    // network round trips, so the default 90s budget is too tight
    test.setTimeout(150_000);

    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await goToTab(page, "みつける");
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();
    // 1.5秒の確定タイマー後にトグルが実行される。追加が完了すると、みつける
    // の候補から外れてカード自体が消えるので、それを待ってから次に進む
    await expect(card).not.toBeVisible({ timeout: 5000 });

    await goToTab(page, "やってみたい");
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("リスト情報を編集")).toBeVisible();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await page.getByLabel("メモ", { exact: false }).fill(MEMO);

    // 決定した瞬間にログインを求められる
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible({ timeout: 5000 });

    await page.getByLabel("メールアドレス").fill(E2E_TEST_EMAIL);
    await waitOutOtpCooldown();
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
    // 直後に別のOTP往復specが動く場合に備えて、この発行時刻も記録しておく
    await recordOtpIssuance();

    await page.getByLabel("6桁の確認コード").fill(data.properties.email_otp);
    await page.getByRole("button", { name: "確認する" }).click();

    // 初回ログイン時は利用規約・プライバシーポリシーへの同意が必要な場合がある
    const consentHeading = page.getByText("利用規約・プライバシーポリシーの確認");
    if (await consentHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "同意して続ける" }).click();
    }

    // ログインが閉じ、保留していた詳細が自動的に保存されてシートも閉じること
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("メモ", { exact: false })).not.toBeVisible({ timeout: 15000 });

    // リロード後もサーバー側に保存されたメモが残っていること
    await page.reload();
    await goToTab(page, "やってみたい");
    await row.getByRole("button", { name: "編集" }).click();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(MEMO);
  });
});
