import { test, expect } from "@playwright/test";

// Regression coverage for #58's checklist item 2 (「みつけるの詳細を編集→
// 決定(保存できること。「戻る」で閉じても問題が起きないこと)」): the
// details sheet (WishlistItemDetailsSheet) is reached from the wishlist
// list's 編集→リスト情報を編集 button. This spec drives its bottom-of-sheet
// 「戻る」button specifically (as opposed to its ×「閉じる」button, which
// other specs already exercise elsewhere) to confirm it closes safely
// without saving whatever was typed.
const ITEM_TITLE = "水彩で風景を描く";
const MEMO = "戻るで破棄されるはずのメモ";

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

test.describe("やってみたい詳細シートを「戻る」で閉じる", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("入力中に「戻る」で閉じても壊れず、内容は保存されない", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await page.locator("nav").getByText("みつける", { exact: true }).click();
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();
    // 1.5秒の確定タイマー後にトグルが実行される。追加が完了すると、みつける
    // の候補から外れてカード自体が消えるので、それを待ってから次に進む
    await expect(card).not.toBeVisible({ timeout: 5000 });

    await goToWishlistTab(page);
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("リスト情報を編集")).toBeVisible();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();

    // 入力してから、決定ではなく下部の「戻る」ボタンで閉じる
    await page.getByLabel("メモ", { exact: false }).fill(MEMO);
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await expect(page.getByLabel("メモ", { exact: false })).not.toBeVisible();
    // ログイン画面など、他の予期しない画面に飛んでいないこと
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // 詳細は保存されていない(破棄された)こと
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("予定日")).toHaveValue("");
    await expect(page.getByLabel("場所", { exact: false })).toHaveValue("");
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue("");
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // アイテム自体はやってみたいリストに残っていること(戻るで壊れていない)
    await page.reload();
    await goToWishlistTab(page);
    await expect(page.locator("li", { hasText: ITEM_TITLE })).toBeVisible();
  });
});
