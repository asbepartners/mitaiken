import { test, expect } from "@playwright/test";

const COLLECTION_TITLE = "まだ行ったことのない都道府県に行く";
const TARGET_TITLE = "テスト県に行く";
const TARGET_MEMO = "コレクション項目のE2Eテストメモ";
const UPDATED_TARGET_MEMO = "編集後のコレクション項目メモ";

async function goToWishlistTab(page: import("@playwright/test").Page) {
  await page.locator("nav").getByText("やってみたい", { exact: true }).click();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/");
  await goToWishlistTab(page);
  const row = page.locator("li", { hasText: COLLECTION_TITLE });
  // wait (not just an instant check) for the wishlist data to finish
  // loading, so a not-yet-rendered row isn't mistaken for "not present"
  const present = await row.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false);
  if (!present) return;
  await row.getByRole("button", { name: `${COLLECTION_TITLE}のメニュー` }).click();
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

test.describe("親子構造アイテム(コレクション)の既存機能の回帰確認", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("項目の追加・編集・やってみた記録が引き続き機能し、単一アイテム向け機能が混入していない", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    await page.goto("/");
    await page.locator("nav").getByText("みつける", { exact: true }).click();
    const card = page.locator("div.snap-center").filter({ hasText: COLLECTION_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();

    // マスタ単一アイテム向けの追加時詳細シートが、コレクションには出ないことを確認
    await page.waitForTimeout(2000);
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();

    await goToWishlistTab(page);
    const row = page.locator("li", { hasText: COLLECTION_TITLE });
    await row.getByRole("button", { name: `${COLLECTION_TITLE}の詳細` }).click();

    // マスタ単一アイテム向けの編集ボタンがコレクションには出ないことを確認
    await expect(page.getByRole("button", { name: "リスト情報を編集" })).not.toBeVisible();

    await page.getByRole("button", { name: "＋ 項目を追加" }).click();
    await page.getByLabel("行き先・項目").fill(TARGET_TITLE);
    await page.getByLabel("気になった理由・覚えておきたいこと", { exact: false }).fill(TARGET_MEMO);
    await page.getByRole("button", { name: "保存" }).click();

    const targetRow = page.locator("li", { hasText: TARGET_TITLE });
    await expect(targetRow).toBeVisible();

    // 項目の編集
    await targetRow.getByRole("button", { name: "編集", exact: true }).click();
    await page.getByLabel("気になった理由・覚えておきたいこと", { exact: false }).fill(UPDATED_TARGET_MEMO);
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.locator("li", { hasText: TARGET_TITLE })).toContainText(UPDATED_TARGET_MEMO);

    // やってみた記録
    await page.locator("li", { hasText: TARGET_TITLE }).getByRole("button", { name: "やってみた！" }).click();
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "決定" }).click();

    await expect(page.getByText("やってみた記録")).toBeVisible();
    await expect(page.getByText(TARGET_TITLE)).toBeVisible();
  });
});
