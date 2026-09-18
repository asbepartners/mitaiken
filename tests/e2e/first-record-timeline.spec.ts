import { test, expect } from "@playwright/test";

// Regression coverage for the largest gap found while auditing #58: no
// existing spec ever opens the「はじめて帖」tab to confirm a saved record
// actually shows up there. wishlist-master-item.spec.ts only gets as far as
// the record form showing the right defaults; this spec completes the
// journey through 決定 and into はじめて帖 for a single (non-collection)
// master item, then cleans up (delete record → item returns to やってみたい
// → remove from list) so repeat runs stay idempotent.
const ITEM_TITLE = "スパイスからカレーを作る";
const RECORD_DATE = "2026-01-10";
const MEMO = "はじめて帖回帰テストのメモ";

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

// If a previous run's cleanup was interrupted, the item may still have a
// saved record (and therefore not be a plain "wishlist" row) -- delete any
// such record first so removeFromWishlistIfPresent's list-row lookup is
// reliable.
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

test.describe("単一アイテムの記録がはじめて帖に表示される", () => {
  test.afterEach(async ({ page }) => {
    await deleteRecordIfPresent(page);
    await removeFromWishlistIfPresent(page);
  });

  test("みつける→やってみたい→やったことある決定→はじめて帖に表示", async ({ page }) => {
    await deleteRecordIfPresent(page);
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
    await row.getByLabel(`${ITEM_TITLE}をやってみた`).click();

    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(RECORD_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    // markTried is a real sequential Supabase round trip (insert log + clear
    // wishlisted_at + reload), so give this more than the default 5s
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });

    // 保存後、やってみたいリストからは消えていること
    await expect(row).not.toBeVisible();

    // はじめて帖(「はじめて」ビュー)に表示されることを確認
    await goToTab(page, "はじめて帖");
    const firstCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toContainText(MEMO);

    // リロード後も引き続き表示されること。page.tsx の handleConfirmRecord は
    // `void markTried(...)` -- 実際のSupabase書き込み(insert log + clear
    // wishlisted_at + reload)を待たずに記録シートを閉じる投げっぱなしの
    // 呼び出しになっている。シートが閉じた直後にすぐリロードすると、その
    // 裏側の書き込みがまだ完走していない状態のページを強制的に読み直して
    // しまい、保存前のデータを見てしまうことがある(実際のユーザー操作な
    // ら自然に間が空くため起きにくいが、Playwrightの高速な操作では顕在化
    // する)。リロード前に書き込みが完走する程度の猶予を挟む
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
