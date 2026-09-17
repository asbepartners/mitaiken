import { test, expect } from "@playwright/test";

// Regression coverage for #58's checklist item 2 (「みつけるの詳細を編集→
// 決定(保存できること。「戻る」で閉じても問題が起きないこと)」) and the
// gap called out in the issue's coverage audit: wishlist-master-item.spec.ts
// only exercises skipping the add-time details sheet via the ×(「閉じる」)
// button. The bottom-of-sheet「戻る」button calls the same onCancel handler
// but had never actually been clicked by a test, so a regression that wired
// it to something else (or broke it) would go unnoticed. This spec drives
// that exact button instead.
const ITEM_TITLE = "水彩で風景を描く";

async function goToWishlistTab(page: import("@playwright/test").Page) {
  await page.locator("nav").getByText("やってみたい", { exact: true }).click();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToWishlistTab(page);
  const row = page.locator("li", { hasText: ITEM_TITLE });
  const present = await row.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await row.getByRole("button", { name: `${ITEM_TITLE}のメニュー` }).click();
  const removeButton = page.getByRole("button", { name: "リストから外す" });
  await removeButton.click();
  await expect(removeButton).not.toBeVisible();

  await page.reload();
  await goToWishlistTab(page);
  await expect(row).not.toBeVisible();
}

test.describe("追加直後の詳細シートを「戻る」で閉じる", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("「戻る」で閉じても壊れず、アイテムはやってみたいリストに残り詳細は未入力のまま", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await page.locator("nav").getByText("みつける", { exact: true }).click();
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();

    await expect(page.getByText("やってみたいの詳細を編集")).toBeVisible({ timeout: 5000 });
    // ×ボタンではなく、シート下部の「戻る」ボタンで閉じる
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();
    // ログイン画面など、他の予期しない画面に飛んでいないこと
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // アイテム自体はやってみたいリストに残っていること
    await goToWishlistTab(page);
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();

    // 詳細は保存されていない(スキップした)こと
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("リスト情報を編集")).toBeVisible();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("予定日")).toHaveValue("");
    await expect(page.getByLabel("場所", { exact: false })).toHaveValue("");
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue("");
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // リロード後も同じ状態が保たれていること
    await page.reload();
    await goToWishlistTab(page);
    await expect(page.locator("li", { hasText: ITEM_TITLE })).toBeVisible();
  });
});
