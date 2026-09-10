import { test, expect } from "@playwright/test";

const ITEM_TITLE = "E2Eテスト用オリジナル体験";
const PLANNED_DATE = "2026-11-03";
const COMPANION = "テスト花子";
const MEMO = "オリジナルアイテムのE2Eテストメモ";
const RELATED_URL = "https://example.com/e2e-original";
const UPDATED_MEMO = "編集後のメモ";

async function goToWishlistTab(page: import("@playwright/test").Page) {
  await page.locator("nav").getByText("やってみたい", { exact: true }).click();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/");
  await goToWishlistTab(page);
  const row = page.locator("li", { hasText: ITEM_TITLE });
  // wait (not just an instant check) for the wishlist data to finish
  // loading, so a not-yet-rendered row isn't mistaken for "not present"
  const present = await row.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await row.getByRole("button", { name: `${ITEM_TITLE}のメニュー` }).click();
  const removeButton = page.getByRole("button", { name: "リストから外す" });
  await removeButton.click();
  // the menu only closes once the awaited Supabase write resolves, so
  // waiting for it to disappear here means the write has actually landed
  // (as opposed to reloading immediately and racing an in-flight request)
  await expect(removeButton).not.toBeVisible();

  // reload and re-check against the real backend as a final confirmation
  await page.reload();
  await goToWishlistTab(page);
  await expect(row).not.toBeVisible();
}

test.describe("オリジナルアイテムの予定日・メモ・参考URL・一緒に行く人", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("作成→編集→保存→やってみた記録へのデフォルト反映", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    await page.goto("/");
    await goToWishlistTab(page);
    await page.getByRole("button", { name: "＋ オリジナルのはじめてを追加" }).click();

    await page.getByLabel("体験名").fill(ITEM_TITLE);
    await page.getByLabel("カテゴリ").selectOption({ index: 1 });

    await page.getByText("予定日やメモを追加").click();
    await page.getByLabel("予定日").fill(PLANNED_DATE);
    await page.getByLabel("一緒に行く人").fill(COMPANION);
    await page.getByLabel("メモ", { exact: false }).fill(MEMO);
    await page.getByLabel("参考URL").fill(RELATED_URL);

    await page.getByRole("button", { name: "やってみたいに追加" }).click();
    // create + toggleWishlist + reload are sequential real network round
    // trips against the live backend, so give this more than the default 5s
    await expect(page.getByText("体験を作る")).not.toBeVisible({ timeout: 15000 });

    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();

    // 作成直後から予定日等が保持されていることを確認(編集フォームを再度開く)
    await row.getByRole("button", { name: "編集" }).click();
    await page.getByText("予定日やメモを追加").click();
    await expect(page.getByLabel("予定日")).toHaveValue(PLANNED_DATE);
    await expect(page.getByLabel("一緒に行く人")).toHaveValue(COMPANION);
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(MEMO);
    await expect(page.getByLabel("参考URL")).toHaveValue(RELATED_URL);

    // 編集して保存
    await page.getByLabel("メモ", { exact: false }).fill(UPDATED_MEMO);
    await page.getByRole("button", { name: "変更を保存" }).click();
    await expect(page.getByText("体験を編集")).not.toBeVisible({ timeout: 15000 });

    // リロード後も編集内容が保持されていることを確認
    await page.reload();
    await goToWishlistTab(page);
    await page.locator("li", { hasText: ITEM_TITLE }).getByRole("button", { name: "編集" }).click();
    await page.getByText("予定日やメモを追加").click();
    await expect(page.getByLabel("予定日")).toHaveValue(PLANNED_DATE);
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(UPDATED_MEMO);
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // 「やってみた!」記録時に予定日・一緒に行く人・メモがデフォルト表示されることを確認
    await page.locator("li", { hasText: ITEM_TITLE }).getByLabel(`${ITEM_TITLE}をやってみた`).click();
    await expect(page.locator('input[type="date"]')).toHaveValue(PLANNED_DATE);
    await expect(page.getByPlaceholder("○○さん、ひとり…など")).toHaveValue(COMPANION);
    await expect(page.getByPlaceholder("心に残ったことを一言残しましょう。")).toHaveValue(UPDATED_MEMO);
  });
});
