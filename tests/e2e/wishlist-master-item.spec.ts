import { test, expect } from "@playwright/test";

const ITEM_TITLE = "陶芸で自分のお茶碗を作る";
const PLANNED_DATE = "2026-12-24";
const PLACE = "テスト陶芸教室";
const COMPANION = "テスト太郎";
const MEMO = "E2Eテストで入力したメモ";
const RELATED_URL = "https://example.com/e2e-test";

async function goToWishlistTab(page: import("@playwright/test").Page) {
  await page.locator("nav").getByText("やってみたい", { exact: true }).click();
}

async function removeFromWishlistIfPresent(page: import("@playwright/test").Page) {
  await page.goto("/app");
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

test.describe("マスタ由来の単一アイテムのやってみたい詳細", () => {
  test.afterEach(async ({ page }) => {
    await removeFromWishlistIfPresent(page);
  });

  test("追加→スキップ→編集→保存→やってみた記録へのデフォルト反映", async ({ page }) => {
    await removeFromWishlistIfPresent(page);

    // 探す画面からマスタ単一アイテムを追加する
    await page.goto("/app");
    await page.locator("nav").getByText("みつける", { exact: true }).click();
    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await card.getByRole("button", { name: "やってみたい" }).click();

    // 1.5秒の確定タイマー後にトグルが実行され、追加直後の詳細シートが開く
    await expect(page.getByText("やってみたいの詳細を編集")).toBeVisible({ timeout: 5000 });
    // スキップできることを確認(×ボタンで閉じる。背景タップ用のボタンは
    // シート本体と画面中央で重なるため、こちらの明示的な×ボタンを使う)
    await page.getByRole("button", { name: "閉じる" }).last().click();
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible();

    // やってみたいリストから編集導線をたどる
    await goToWishlistTab(page);
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("リスト情報を編集")).toBeVisible();

    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    // マスタ本体の情報(場所・所要時間・予算・人数などの構造化項目)は
    // 編集シートに一切含まれない(=編集不可)ことを確認
    await expect(page.locator("select")).toHaveCount(0);
    await page.getByLabel("予定日").fill(PLANNED_DATE);
    await page.getByLabel("場所", { exact: false }).fill(PLACE);
    await page.getByLabel("一緒に行く人").fill(COMPANION);
    await page.getByLabel("メモ", { exact: false }).fill(MEMO);
    await page.getByLabel("参考URL").fill(RELATED_URL);
    await page.getByRole("button", { name: "決定" }).click();
    // ensureUserExperience + update + reload is a sequential real network
    // round trip against the live backend, so give this more than the default 5s
    await expect(page.getByLabel("予定日")).not.toBeVisible({ timeout: 15000 });

    // リロード後も保持されていることを確認
    await page.reload();
    await goToWishlistTab(page);
    await page.locator("li", { hasText: ITEM_TITLE }).getByRole("button", { name: "編集" }).click();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("予定日")).toHaveValue(PLANNED_DATE);
    await expect(page.getByLabel("場所", { exact: false })).toHaveValue(PLACE);
    await expect(page.getByLabel("一緒に行く人")).toHaveValue(COMPANION);
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(MEMO);
    await expect(page.getByLabel("参考URL")).toHaveValue(RELATED_URL);
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // 「やってみた!」記録時に予定日等がデフォルト表示されることを確認
    await page.locator("li", { hasText: ITEM_TITLE }).getByLabel(`${ITEM_TITLE}をやってみた`).click();
    await expect(page.locator('input[type="date"]')).toHaveValue(PLANNED_DATE);
    await expect(page.getByPlaceholder("お店・施設・地域など")).toHaveValue(PLACE);
    await expect(page.getByPlaceholder("○○さん、ひとり…など")).toHaveValue(COMPANION);
    await expect(page.getByPlaceholder("心に残ったことを一言残しましょう。")).toHaveValue(MEMO);
  });
});
