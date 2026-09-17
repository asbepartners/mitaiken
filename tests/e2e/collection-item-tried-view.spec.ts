import { test, expect } from "@playwright/test";

// Regression coverage for #58: collection-item.spec.ts already exercises
// 項目追加→編集→やってみた記録 but stops at the confirmation screen inside
// やってみたい's own detail view; it never checks that the record also shows
// up under 「はじめて帖」, which groups collection records back under the
// parent experience. This spec completes that journey.
const COLLECTION_TITLE = "御朱印を集める";
const TARGET_TITLE = "テスト神社にお参りする";
const RECORD_DATE = "2026-02-11";
const MEMO = "はじめて帖・コレクション回帰テストのメモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToTab(page, "やってみたい");
  const row = page.locator("li", { hasText: COLLECTION_TITLE });
  const present = await row.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await row.getByRole("button", { name: `${COLLECTION_TITLE}のメニュー` }).click();
  const removeButton = page.getByRole("button", { name: "リストから外す" });
  await removeButton.click();
  await expect(removeButton).not.toBeVisible();

  await page.reload();
  await goToTab(page, "やってみたい");
  await expect(row).not.toBeVisible();
}

test.describe("親子構造アイテムの記録がはじめて帖に表示される", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("やってみたい→子項目を追加→やってみた記録→はじめて帖に表示", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await goToTab(page, "みつける");
    const card = page.locator("div.snap-center").filter({ hasText: COLLECTION_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();

    // マスタ単一アイテム向けの追加時詳細シートは出ない
    await page.waitForTimeout(2000);
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();

    await goToTab(page, "やってみたい");
    const row = page.locator("li", { hasText: COLLECTION_TITLE });
    await row.getByRole("button", { name: `${COLLECTION_TITLE}の詳細` }).click();

    await page.getByRole("button", { name: "＋ 項目を追加" }).click();
    await page.getByLabel("行き先・項目").fill(TARGET_TITLE);
    await page.getByRole("button", { name: "保存" }).click();
    const targetRow = page.locator("li", { hasText: TARGET_TITLE });
    await expect(targetRow).toBeVisible();

    // 子項目のやってみた記録
    await targetRow.getByRole("button", { name: "やってみた！" }).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(RECORD_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });

    // やってみたい側の詳細画面でも記録セクションに反映されていること
    await expect(page.getByText("やってみた記録")).toBeVisible();
    await expect(page.getByText(TARGET_TITLE)).toBeVisible();

    // はじめて帖に戻り、親アイテムが「はじめて」として表示されることを確認
    await goToTab(page, "はじめて帖");
    const firstCard = page.locator("li", { hasText: COLLECTION_TITLE });
    await expect(firstCard).toBeVisible();

    // はじめて帖側でもその項目の詳細を開くと、子項目の記録が確認できること
    await firstCard.locator("button").filter({ hasText: COLLECTION_TITLE }).click();
    await expect(page.getByText("やってみた記録")).toBeVisible();
    await expect(page.getByText(TARGET_TITLE)).toBeVisible();
    await expect(page.getByText(MEMO)).toBeVisible();

    // 「すべての記録」ビューでも確認できること
    await page.getByRole("button", { name: "はじめてリストに戻る" }).click();
    await page.getByRole("button", { name: "すべての記録" }).click();
    const recordCard = page.locator("li", { hasText: TARGET_TITLE });
    await expect(recordCard).toBeVisible();
  });
});
