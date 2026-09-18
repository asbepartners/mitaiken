import { test, expect } from "@playwright/test";

// Regression coverage for #58-style journeys, extended to オリジナル(自作)
// アイテム: original-item.spec.ts already covers 作成→編集→保存→やって
// みた記録のデフォルト反映, but stops at the record form showing the right
// defaults -- it never completes 決定 or checks はじめて帖. This spec
// completes that journey for a custom experience, mirroring
// first-record-timeline.spec.ts's coverage for catalog items.
const ITEM_TITLE = "E2Eテスト用オリジナル体験(はじめて帖確認)";
const RECORD_DATE = "2026-02-08";
const MEMO = "オリジナルアイテムのはじめて帖回帰テストのメモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

async function deleteRecordIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToTab(page, "はじめて帖");
  const recordsButton = page.getByRole("button", { name: "すべての記録" });
  if (!(await recordsButton.isVisible({ timeout: 5000 }).catch(() => false))) return;
  await recordsButton.click();
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

test.describe("オリジナルアイテムの記録がはじめて帖に表示される", () => {
  test.afterEach(async ({ page }) => {
    await deleteRecordIfPresent(page);
    await removeFromWishlistIfPresent(page);
  });

  test("作成→やってみた決定→はじめて帖に表示", async ({ page }) => {
    await deleteRecordIfPresent(page);
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await goToTab(page, "やってみたい");
    await page.getByRole("button", { name: "＋ オリジナルのはじめてを追加" }).click();
    await page.getByLabel("体験名").fill(ITEM_TITLE);
    await page.getByLabel("カテゴリ").selectOption({ index: 1 });
    await page.getByRole("button", { name: "やってみたいに追加" }).click();
    // create + toggleWishlist + reload is a sequential real network round
    // trip against the live backend, so give this more than the default 5s
    await expect(page.getByText("体験を作る")).not.toBeVisible({ timeout: 15000 });

    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();

    // やってみた記録を決定
    await row.getByRole("button", { name: `${ITEM_TITLE}をやってみた` }).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(RECORD_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    // markTried is a real sequential Supabase round trip, so give this more
    // than the default 5s
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });

    // 保存後、やってみたいリストからは消えていること
    await expect(row).not.toBeVisible();

    // はじめて帖(「はじめて」ビュー)に表示されることを確認
    await goToTab(page, "はじめて帖");
    const firstCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(MEMO);

    // リロード後も引き続き表示されること。markTried はSupabase書き込みを
    // 待たずに記録シートを閉じる投げっぱなしの呼び出しになっているため、
    // 書き込みが完走する程度の猶予をリロード前に挟む
    await page.waitForTimeout(3000);
    await page.reload();
    await goToTab(page, "はじめて帖");
    await expect(page.locator("li", { hasText: ITEM_TITLE })).toBeVisible({ timeout: 15000 });

    // 「すべての記録」ビューでも同じ記録が確認できること
    await page.getByRole("button", { name: "すべての記録" }).click();
    const recordCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(recordCard).toBeVisible();
    await expect(recordCard).toContainText(MEMO);
  });
});
