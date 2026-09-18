import { test, expect } from "@playwright/test";

// Regression coverage for the "次点" item from #58's coverage audit: when a
// single (non-collection) item has more than one やってみた record, はじめ
// て帖's 「はじめて」view must collapse them into one card showing the
// earliest record (plus a "N件の記録" count), while 「すべての記録」must
// list every record separately. No existing spec ever created a second
// record for the same item, so this behavior had no coverage.
const ITEM_TITLE = "プラネタリウムへ行く";
const EARLIER_DATE = "2026-01-05";
const EARLIER_MEMO = "1回目の記録メモ";
const LATER_DATE = "2026-06-20";
const LATER_MEMO = "2回目の記録メモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

async function deleteAllRecords(page: import("@playwright/test").Page) {
  await page.goto("/app");
  await goToTab(page, "はじめて帖");
  const recordsButton = page.getByRole("button", { name: "すべての記録" });
  if (!(await recordsButton.isVisible({ timeout: 5000 }).catch(() => false))) return;
  await recordsButton.click();

  // 複数件残っている可能性があるため、なくなるまで繰り返し削除する
  for (let guard = 0; guard < 5; guard++) {
    const card = page.locator("li", { hasText: ITEM_TITLE }).first();
    const present = await card.waitFor({ state: "visible", timeout: 3000 }).then(() => true).catch(() => false);
    if (!present) break;
    const menuButton = card.getByRole("button", { name: `${ITEM_TITLE}のその他の操作` });
    // scrollIntoViewIfNeeded can land the button exactly behind the fixed
    // bottom nav (position: fixed, so it always overlaps the last ~60px of
    // the viewport regardless of scroll position), which then intercepts
    // the click. Scroll a bit further so the button clears that overlap.
    await menuButton.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 150);
    await menuButton.click();
    const deleteButton = page.getByRole("button", { name: "記録を削除" });
    await deleteButton.click();
    await expect(deleteButton).not.toBeVisible();
  }
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

test.describe("複数の記録があるアイテムのはじめて帖表示", () => {
  test.afterEach(async ({ page }) => {
    await deleteAllRecords(page);
    await removeFromWishlistIfPresent(page);
  });

  test("「はじめて」は最初の記録だけを、「すべての記録」は両方を表示する", async ({ page }) => {
    await deleteAllRecords(page);
    await removeFromWishlistIfPresent(page);

    await page.goto("/app");
    await goToTab(page, "みつける");
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();
    // 1.5秒の確定タイマー後にトグルが実行される。追加が完了すると、みつける
    // の候補から外れてカード自体が消えるので、それを待ってから次に進む
    await expect(card).not.toBeVisible({ timeout: 5000 });

    // 1回目の記録(あとで日付順を確認するため、あえて古い日付にする)
    await goToTab(page, "やってみたい");
    await page.locator("li", { hasText: ITEM_TITLE }).getByLabel(`${ITEM_TITLE}をやってみた`).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(EARLIER_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(EARLIER_MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });

    // 2回目の記録は、はじめて帖のアイテム詳細から「記録を追加」で作る
    await goToTab(page, "はじめて帖");
    const firstCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(firstCard).toBeVisible();
    await firstCard.locator("button").filter({ hasText: ITEM_TITLE }).click();
    await page.getByRole("button", { name: "記録を追加" }).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="date"]').fill(LATER_DATE);
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(LATER_MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.locator('input[type="date"]')).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText("記録 2件")).toBeVisible();
    await page.getByRole("button", { name: "はじめてリストに戻る" }).click();

    // 「はじめて」ビュー: 1枚のカードに、最初の(=より古い)記録のメモと
    // 2件の記録件数バッジが出ていること
    await expect(page.locator("li", { hasText: ITEM_TITLE })).toHaveCount(1);
    const singleFirstCard = page.locator("li", { hasText: ITEM_TITLE });
    await expect(singleFirstCard).toContainText(EARLIER_MEMO);
    await expect(singleFirstCard).not.toContainText(LATER_MEMO);
    await expect(singleFirstCard).toContainText("2件の記録");

    // 「すべての記録」ビュー: 2件とも別々に表示されること
    await page.getByRole("button", { name: "すべての記録" }).click();
    const recordCards = page.locator("li", { hasText: ITEM_TITLE });
    await expect(recordCards).toHaveCount(2);
    await expect(page.getByText(EARLIER_MEMO)).toBeVisible();
    await expect(page.getByText(LATER_MEMO)).toBeVisible();
  });
});
