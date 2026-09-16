import { test, expect } from "@playwright/test";

// Regression coverage for asbepartners/mitaiken#54: a logged-out visitor can
// tap やってみたい/やったことある freely, and is only asked to log in at the
// moment they try to save an actual やったことある record. Every other spec
// in this suite inherits the authenticated storageState from global setup;
// this one deliberately runs with no session at all.
test.use({ storageState: { cookies: [], origins: [] } });

// A single (non-collection) master item -- one whose wishlist add flow opens
// the details-prompt sheet, unlike a collection item (see
// wishlist-master-item.spec.ts, which uses the same item for that reason).
const ITEM_TITLE = "陶芸で自分のお茶碗を作る";
const MEMO = "匿名ユーザーによるE2Eテストメモ";

async function goToTab(page: import("@playwright/test").Page, label: string) {
  await page.locator("nav").getByText(label, { exact: true }).click();
}

test.describe("未ログインの利用", () => {
  test("やってみたいのタップとリスト詳細の保存はログイン不要、やったことあるの保存だけログインを求められる", async ({ page }) => {
    await page.goto("/app");
    await goToTab(page, "みつける");

    const card = page.locator("div.snap-center").filter({ hasText: ITEM_TITLE });
    await expect(card).toBeVisible();

    // やってみたいをタップ -- ログイン画面が出ないこと
    await card.getByRole("button", { name: "やってみたい" }).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // 1.5秒の確定タイマー後にトグルが実行され、追加直後の詳細シートが開く
    await expect(page.getByText("やってみたいの詳細を編集")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // メモを入力して決定 -- ここでボタンが無反応にならず、シートが閉じること
    // (#55のフォローアップで見つかった回帰: updateWishlistDetails がロー
    // カル保存に対応しておらず、未ログイン時は黙って何も起きなかった)
    await page.getByLabel("メモ", { exact: false }).fill(MEMO);
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("やってみたいの詳細を編集")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();

    // やってみたいリストに反映され、メモがローカルに保持されていること
    await goToTab(page, "やってみたい");
    const row = page.locator("li", { hasText: ITEM_TITLE });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("リスト情報を編集")).toBeVisible();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(MEMO);
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // リロードしても(ログインしていないので)ローカルに残っていること -- アイテム
    // 自体だけでなく、詳細(メモ)も引き続き保持されていることまで確認する
    await page.reload();
    await goToTab(page, "やってみたい");
    await expect(page.locator("li", { hasText: ITEM_TITLE })).toBeVisible();
    await page.locator("li", { hasText: ITEM_TITLE }).getByRole("button", { name: "編集" }).click();
    await page.getByRole("button", { name: "リスト情報を編集" }).click();
    await expect(page.getByLabel("メモ", { exact: false })).toHaveValue(MEMO);
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    await page.getByRole("button", { name: "やってみたいリストに戻る" }).click();

    // やったことある: フォームは自由に開いて入力できる -- ここでもログイン画面は出ない
    await page.locator("li", { hasText: ITEM_TITLE }).getByLabel(`${ITEM_TITLE}をやってみた`).click();
    await expect(page.getByText("メールアドレスでログイン")).not.toBeVisible();
    await page.getByPlaceholder("心に残ったことを一言残しましょう。").fill(MEMO);

    // 保存(決定)しようとした瞬間だけログインを求められる。かつ理由メッセージが表示される
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("あなたの大切な記録を守るために")).toBeVisible();
  });
});
